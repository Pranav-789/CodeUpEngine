// services/TokenService.ts
import RedisImport from 'ioredis';
import User from '../models/user.model.js';
import { ApiError } from "./ApiError.js";

const Redis = (RedisImport as any).default || RedisImport;
export const redis = new (Redis as any)(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export class TokenService {
  private static getKey(userId: string): string {
    return `user:${userId}:tokens`;
  }

  /**
   * Hydrate Cache: Fetches tokens from DB and caches them in Redis
   * Optimized: Uses a single pipeline for HSET + EXPIRE (1 round-trip = 2 commands)
   */
  private static async hydrateTokenCache(userId: string) {
    const user = await User.findById(userId).select('baseTokens premiumTokens nextWeeklyRefresh');
    if (!user) throw new ApiError(404, 'User not found');

    const redisKey = this.getKey(userId);
    
    let baseTokens = user.baseTokens;
    let nextWeeklyRefresh = user.nextWeeklyRefresh;
    const now = new Date();
    
    if (now >= nextWeeklyRefresh) {
        baseTokens = 50;
        nextWeeklyRefresh = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        await User.findByIdAndUpdate(userId, { 
            baseTokens: 50, 
            nextWeeklyRefresh: nextWeeklyRefresh 
        });
    }

    // Pipeline: batch HSET + EXPIRE into 1 round-trip (saves 1 command vs separate calls)
    const pipeline = redis.pipeline();
    pipeline.hset(redisKey, {
        baseTokens: baseTokens,
        nextWeeklyRefresh: nextWeeklyRefresh.getTime()
    });
    pipeline.expire(redisKey, 86400);
    await pipeline.exec();
    
    return {
        baseTokens,
        nextWeeklyRefresh,
        totalTokens: baseTokens
    };
  }

  /**
   * Get Balance: Fast read from Redis cache, falls back to DB hydration
   * Cost: 1 command (HGETALL) on cache hit, 3 commands on cache miss (HGETALL + HSET + EXPIRE)
   */
  static async getBalance(userId: string) {
    const redisKey = this.getKey(userId);
    const cached = await redis.hgetall(redisKey);

    if (Object.keys(cached).length > 0) {
      const baseTokens = parseInt(cached.baseTokens, 10);
      const premiumTokens = parseInt(cached.premiumTokens, 10);
      const nextWeeklyRefresh = new Date(parseInt(cached.nextWeeklyRefresh, 10));

      const now = new Date();
      if (now >= nextWeeklyRefresh) {
          return await this.hydrateTokenCache(userId);
      }

      return {
          baseTokens,
          premiumTokens,
          nextWeeklyRefresh,
          totalTokens: baseTokens + premiumTokens
      };
    }

    const hydrated = await this.hydrateTokenCache(userId);
    return {
        ...hydrated,
        totalTokens: hydrated.baseTokens
    };
  }

  /**
   * Consume Tokens: Deducts tokens atomically
   * Optimized: Merged HINCRBY + HGETALL into a single pipeline (saves 1 command)
   * Cost: 1 (getBalance) + 1 pipeline (HINCRBY + HGETALL = 2 commands) = 3 total
   * Rollback path: +1 command (HINCRBY) = 4 total
   */
  static async consumeTokens(userId: string, amount: number): Promise<{ success: boolean; remaining: number }> {
    const redisKey = this.getKey(userId);
    let balance = await this.getBalance(userId);

    if (balance.totalTokens < amount) {
      return { success: false, remaining: balance.totalTokens };
    }

    const baseToDeduct = Math.min(balance.baseTokens, amount);

    // Pipeline: deduct + read new value in 1 round-trip
    const pipeline = redis.pipeline();
    if (baseToDeduct > 0) pipeline.hincrby(redisKey, 'baseTokens', -baseToDeduct);
    pipeline.hgetall(redisKey);
    const results = await pipeline.exec();

    // HGETALL result is the last command in the pipeline
    const newCached = results[results.length - 1][1];
    const newBase = parseInt(newCached.baseTokens, 10);
    
    if (newBase < 0) {
        // Rollback with a single command
        await redis.hincrby(redisKey, 'baseTokens', baseToDeduct);
        return { success: false, remaining: balance.totalTokens };
    }

    // Async DB sync (fire-and-forget)
    const dbInc: any = {};
    if (baseToDeduct > 0) dbInc.baseTokens = -baseToDeduct;
    
    User.findByIdAndUpdate(userId, { $inc: dbInc }).catch((err: any) =>
      console.error(`Failed to sync token deduction to DB for user ${userId}:`, err)
    );

    return { success: true, remaining: newBase };
  }

  /**
   * Credit Tokens: Adds tokens back
   * Optimized: Removed redundant getBalance() call at the end (saved 1 command)
   * Cost: 1 (EXISTS) + 1 (HINCRBY if cache exists) = 1-2 commands
   */
  static async creditTokens(userId: string, amount: number): Promise<number> {
    const redisKey = this.getKey(userId);
    
    await User.findByIdAndUpdate(userId, { $inc: { baseTokens: amount } });

    const cacheExists = await redis.exists(redisKey);
    if (cacheExists) {
      const newBalance = await redis.hincrby(redisKey, 'baseTokens', amount);
      return newBalance;
    }
    
    // Cache doesn't exist — read from DB directly instead of hydrating
    const user = await User.findById(userId).select('baseTokens');
    return user?.baseTokens ?? 0;
  }
}