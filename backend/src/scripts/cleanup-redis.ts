/**
 * One-time cleanup script to purge old BullMQ jobs and trim the events stream.
 * Run once with: npx tsx src/scripts/cleanup-redis.ts
 * 
 * This removes all completed/failed jobs that accumulated BEFORE the 
 * removeOnComplete/removeOnFail settings were added.
 */
import 'dotenv/config';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});

const queue = new Queue('recommendationQueue', { connection: redis as any });

async function cleanup() {
    console.log('🧹 Starting Redis cleanup...\n');

    // 1. Clean completed jobs
    const completed = await queue.getCompleted();
    console.log(`Found ${completed.length} completed jobs to remove`);
    for (const job of completed) {
        await job.remove();
    }

    // 2. Clean failed jobs
    const failed = await queue.getFailed();
    console.log(`Found ${failed.length} failed jobs to remove`);
    for (const job of failed) {
        await job.remove();
    }

    // 3. Trim the events stream to 100 entries
    const streamKey = 'bull:recommendationQueue:events';
    const streamLen = await redis.xlen(streamKey);
    console.log(`\nEvents stream has ${streamLen} entries`);
    if (streamLen > 100) {
        await redis.xtrim(streamKey, 'MAXLEN', 100);
        console.log(`Trimmed events stream to 100 entries (removed ${streamLen - 100})`);
    }

    // 4. Show final memory usage
    const info = await redis.info('memory');
    const usedMemMatch = info.match(/used_memory_human:(.+)/);
    if (usedMemMatch) {
        console.log(`\n✅ Current Redis memory usage: ${usedMemMatch[1].trim()}`);
    }

    await queue.close();
    await redis.quit();
    console.log('\n🧹 Cleanup complete!');
}

cleanup().catch((err) => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
