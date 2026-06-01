// services/TokenService.ts
import RedisImport from 'ioredis';
import User from '../models/user.model.js';
import { ApiError } from "./ApiError.js";

// Initialize your Redis client
const Redis = (RedisImport as any).default || RedisImport;
const redis = new (Redis as any)(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export class TokenService {
  private static getKey(userId: string): string {
    return `user:${userId}:tokens`;
  }

  /**
   * 1. Hydrate Cache: Fetches tokens from DB and caches them in Redis
   */
  private static async hydrateTokenCache(userId: string) {
    const user = await User.findById(userId).select('baseTokens premiumTokens nextWeeklyRefresh');
    if (!user) throw new ApiError(404, 'User not found');

    const redisKey = this.getKey(userId);
    
    let baseTokens = user.baseTokens;
    let nextWeeklyRefresh = user.nextWeeklyRefresh;
    const now = new Date();
    
    // Check if weekly refresh is due
    if (now >= nextWeeklyRefresh) {
        baseTokens = 50;
        nextWeeklyRefresh = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        await User.findByIdAndUpdate(userId, { 
            baseTokens: 50, 
            nextWeeklyRefresh: nextWeeklyRefresh 
        });
    }

    // Store in Redis as a hash with a 24-hour expiration (86400 seconds)
    await redis.hset(redisKey, {
        baseTokens: baseTokens,
        nextWeeklyRefresh: nextWeeklyRefresh.getTime()
    });
    await redis.expire(redisKey, 86400);
    
    return {
        baseTokens,
        nextWeeklyRefresh,
        totalTokens: baseTokens
    };
  }

  /**
   * 2. Get Balance: Fast read from Redis, falls back to DB
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
   * 3. Consume Tokens: Deducts tokens atomically using Redis Pipeline.
   */
  static async consumeTokens(userId: string, amount: number): Promise<{ success: boolean; remaining: number }> {
    const redisKey = this.getKey(userId);

    // Ensure data is cached before modifying it
    let balance = await this.getBalance(userId);

    if (balance.totalTokens < amount) {
      return { success: false, remaining: balance.totalTokens };
    }

    const baseToDeduct = Math.min(balance.baseTokens, amount);

    // ATOMIC OPERATION: Deduct the tokens in Redis
    const pipeline = redis.pipeline();
    if (baseToDeduct > 0) pipeline.hincrby(redisKey, 'baseTokens', -baseToDeduct);
    
    await pipeline.exec();

    // Verify deduction didn't drop below zero (due to race condition)
    const newCached = await redis.hgetall(redisKey);
    const newBase = parseInt(newCached.baseTokens, 10);
    
    if (newBase < 0) {
        // Rollback
        const revertPipeline = redis.pipeline();
        if (baseToDeduct > 0) revertPipeline.hincrby(redisKey, 'baseTokens', baseToDeduct);
        await revertPipeline.exec();
        
        return { success: false, remaining: balance.totalTokens };
    }

    // Asynchronously sync the new balance back to MongoDB
    const dbInc: any = {};
    if (baseToDeduct > 0) dbInc.baseTokens = -baseToDeduct;
    
    User.findByIdAndUpdate(userId, { $inc: dbInc }).catch((err: any) =>
      console.error(`Failed to sync token deduction to DB for user ${userId}:`, err)
    );

    return { success: true, remaining: newBase };
  }

  /**
   * 4. Weekly Reset Utility: Credits base tokens globally or for a specific user
   */
  static async creditTokens(userId: string, amount: number): Promise<number> {
    const redisKey = this.getKey(userId);
    
    // Update MongoDB persistently
    await User.findByIdAndUpdate(userId, { $inc: { baseTokens: amount } });

    // Update Redis cache if it exists, otherwise it will hydrate on next request
    const cacheExists = await redis.exists(redisKey);
    if (cacheExists) {
      await redis.hincrby(redisKey, 'baseTokens', amount);
    }
    
    const balance = await this.getBalance(userId);
    return balance.totalTokens;
  }
}