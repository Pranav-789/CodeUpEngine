// queues/recommendation.queue.ts
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const recommendationQueue = new Queue('recommendationQueue', {
  connection: redisConnection as any,
});