import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import UserMetrics from "../models/usermetric.model.js";

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const recommendationWorker = new Worker('recommendationQueue', async (job) => {
    const { userId } = job.data;

    // 1. Fetch current metrics
    const metrics = await UserMetrics.findOne({ userId });
    if (!metrics) {
        throw new Error(`User metrics not found for user ${userId}`);
    }

    const fastapiPayload = {
        user_id: userId,
        topic_elo_vector: metrics.topicEloVector,
        recent_submissions: metrics.recentSubmissions.map(sub => ({
            problem_id: sub.problemId,
            problem_rating: sub.rating || 0,
            tags: sub.tags,
            correctSubmissions: sub.correctSubmissions || 0,
            wrongSubmissions: sub.incorrectSubmissions || 0
        }))
    };

    // 2. Call FastAPI
    const response = await fetch(`http://localhost:8000/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fastapiPayload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FastAPI ML Service failed: ${errorText}`);
    }

    const data = await response.json() as {
        user_id: string;
        updated_vector: number[];
        recommended_problem_ids: string[];
    };

    // 3. Update MongoDB
    metrics.topicEloVector = data.updated_vector;
    
    // Map recommendations to the schema
    metrics.activeRecommendations = data.recommended_problem_ids.map((id: string) => ({
        problemId: id,
        recommendedAt: new Date(),
        targetTopic: "mixed" 
    })) as any;
    
    metrics.lastCalculatedAt = new Date();
    
    await metrics.save();

    // 4. Return the new recommendations. 
    // This return value automatically gets saved to `job.returnvalue`, 
    // which your `checkJobStatus` controller sends to the frontend!
    return metrics.activeRecommendations;
    
}, { connection: redisConnection as any });

// Listen for errors so the worker doesn't crash silently
recommendationWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error ${err.message}`);
});
