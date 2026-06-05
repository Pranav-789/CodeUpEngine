// queues/recommendation.queue.ts
import { Queue } from 'bullmq';
import { redis } from './tokenService.js';

// Reuse the existing Redis connection from tokenService (saves 1 persistent connection)
export const recommendationQueue = new Queue('recommendationQueue', {
  connection: redis as any,
  defaultJobOptions: {
    // Auto-clean completed jobs after 1 hour (saves storage + reduces KEYS overhead)
    removeOnComplete: { age: 3600 },
    // Auto-clean failed jobs after 24 hours
    removeOnFail: { age: 86400 },
  },
  streams: {
    events: {
      // Cap the events stream to 100 entries (~50 KB max)
      // Without this, the stream grows unboundedly and is the #1 memory hog
      maxLen: 100,
    },
  },
});