import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import UserMetrics from "../models/usermetric.model.js";
import User from "../models/user.model.js";
import { TokenService } from "../utils/tokenService.js";

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null
});
redisConnection.on('error', (err) => console.error('Redis Worker Error:', err));

export const recommendationWorker = new Worker('recommendationQueue', async (job) => {
    const { userId } = job.data;

    // 1. Fetch current metrics
    const metrics = await UserMetrics.findOne({ userId });
    if (!metrics) {
        throw new Error(`User metrics not found for user ${userId}`);
    }

    const user = await User.findById(userId);
    let userRating = 1500;
    if (user && user.codeforcesHandle) {
        try {
            const cfRes = await fetch(`https://codeforces.com/api/user.info?handles=${user.codeforcesHandle}`);
            if (cfRes.ok) {
                const cfData = await cfRes.json() as any;
                if (cfData.status === "OK" && cfData.result && cfData.result.length > 0) {
                    userRating = cfData.result[0].rating || 1500;
                }
            }
        } catch (err) {
            console.error("Failed to fetch rating:", err);
        }
    }

    const fastapiPayload = {
        user_id: userId,
        user_rating: userRating,
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
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
    const response = await fetch(`${mlServiceUrl}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fastapiPayload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("<html")) {
            throw new Error(`ML Service is temporarily unavailable (HTTP ${response.status}). Please try again.`);
        }
        throw new Error(`FastAPI ML Service failed: ${errorText}`);
    }

    const data = await response.json() as {
        user_id: string;
        updated_vector: number[];
        recommendations: Array<{
            problem_id: string;
            target_topic: string;
        }>;
    };

    // 3. Update MongoDB
    metrics.topicEloVector = data.updated_vector;
    
    // Map recommendations to the schema
    metrics.activeRecommendations = data.recommendations.map((rec) => ({
        problemId: rec.problem_id,
        recommendedAt: new Date(),
        targetTopic: rec.target_topic 
    })) as any;
    
    metrics.lastCalculatedAt = new Date();
    
    await metrics.save();

    // 4. Return the new recommendations. 
    // This return value automatically gets saved to `job.returnvalue`, 
    // which your `checkJobStatus` controller sends to the frontend!
    return metrics.activeRecommendations;
    
}, { connection: redisConnection as any });

// Listen for errors so the worker doesn't crash silently
recommendationWorker.on('failed', async (job, err) => {
    console.error(`Job ${job?.id} failed with error ${err.message}`);
    
    // Check if the job has exhausted all retries
    if (job && job.attemptsMade >= (job.opts.attempts || 0)) {
        console.log(`Job ${job.id} has reached maximum retry attempts. Refunding 5 tokens for user ${job.data.userId}...`);
        try {
            await TokenService.creditTokens(job.data.userId, 5);
            console.log(`Successfully refunded 5 tokens to user ${job.data.userId}.`);
        } catch (refundErr) {
            console.error(`Failed to refund tokens for user ${job.data.userId}:`, refundErr);
        }
    }
});
