import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/AsyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import UserMetrics from "../models/usermetric.model.js";
import { TokenService } from "../utils/tokenService.js";
import { recommendationQueue } from "../utils/queue.js";

// get active recommendation

export const getActiveRecommendation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if(!user){
        throw new ApiError(401, "Unauthorized");
    }
    try{
        const recommendations = await UserMetrics.findOne({userId: user.userId}).select("activeRecommendations");

        if(!recommendations){
            throw new ApiError(404, "No recommendations found");
        }

        return res.status(200).json(
            new ApiResponse(200, recommendations, "Recommendations fetched successfully")
        );
    }catch(error){
        if(error instanceof ApiError){
            throw error;
        }
        throw new ApiError(500, "Failed to fetch recommendations");
    }
});


// offload generation part to fastapi backend
export const generateRecommendation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
        throw new ApiError(401, "Unauthorized");
    }

    // 1. Deduct Tokens FIRST
    const tokenResult = await TokenService.consumeTokens(user.userId, 5);
    if (!tokenResult.success) {
        throw new ApiError(403, "Insufficient tokens to generate recommendations");
    }

    // 2. Offload the heavy lifting to BullMQ
    // We pass the userId in the job data so the worker knows who to process
    let job;
    try {
        job = await recommendationQueue.add('generate-ml-recommendation', {
            userId: user.userId
        }, {
            attempts: 3, // Retry up to 3 times (saves ~40 Redis commands per failed job vs 5)
            backoff: {
                type: 'exponential',
                delay: 10000 // Start with a 10s delay, then 20s, 40s...
            }
        });
    } catch (error) {
        // Refund tokens if queueing fails
        await TokenService.creditTokens(user.userId, 5);
        throw new ApiError(500, "Failed to queue recommendation job. Tokens have been refunded.");
    }

    // 3. Immediately return the Job ID to the React frontend so it can start polling
    return res.status(202).json(
        new ApiResponse(202, { jobId: job.id }, "Recommendation job queued successfully")
    );
});

// get recommendation job status

export const checkJobStatus = asyncHandler(async (req: Request, res: Response) => {
    // Ensure the user is logged in
    if (!req.user) {
        throw new ApiError(401, "Unauthorized: User context missing");
    }

    const { jobId } = req.params;

    if (!jobId) {
        throw new ApiError(400, "Job ID is required");
    }

    // 1. Fetch the job directly from BullMQ/Redis (1 HGETALL command)
    const job = await recommendationQueue.getJob(jobId as string);

    if (!job) {
        throw new ApiError(404, "Job not found or has expired");
    }

    // Security check: Ensure the user asking for the job actually owns the job
    if (job.data.userId !== req.user.userId) {
        throw new ApiError(403, "You do not have permission to view this job");
    }

    // 2. Check terminal states first using direct key lookups (cheaper than getState)
    // isCompleted/isFailed each use 1 ZSCORE command vs getState which scans 5+ sorted sets
    const completed = await job.isCompleted();
    if (completed) {
        return res.status(200).json(
            new ApiResponse(200, {
                status: 'completed',
                result: job.returnvalue 
            }, "Recommendation generation finished")
        );
    } 
    
    const failed = await job.isFailed();
    if (failed) {
        return res.status(200).json(
            new ApiResponse(200, {
                status: 'failed',
                error: job.failedReason
            }, "Recommendation generation failed")
        );
    }

    // If it is 'waiting' or 'active', tell the frontend to keep waiting
    return res.status(200).json(
        new ApiResponse(200, {
            status: 'processing'
        }, "Job is currently processing")
    );
});