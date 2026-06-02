import { Request, Response } from "express";
import { asyncHandler } from "../utils/AsyncHandlers.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import UserMetrics from "../models/usermetric.model.js";
import Problem from "../models/problem.model.js";
import { TokenService } from "../utils/tokenService.js";

const CODEFORCES_API_BASE_URL = 'https://codeforces.com/api';


export const getProfile = asyncHandler(async(req: Request, res: Response) => {
    const user = req.user;

    if(!user){
        throw new ApiError(401, "Unauthorized: User context missing");
    }

    try {
        const profile = await User.findById(user.userId).select("-passwordHash -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry -userId");

        if(!profile){
            throw new ApiError(404, "User profile not found");
        }
        
        const metrics = await UserMetrics.findOne({userId: user.userId}).select("-recentSubmission -userId");

        return res.status(200).json(
            new ApiResponse(200, {profile, metrics: metrics || null}, "User profile fetched successfully")
        );
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, "Failed to fetch user profile");
    }
});

export const getProfileMetrics = asyncHandler(async(req: Request, res: Response) => {
    const user = req.user;

    if(!user){
        throw new ApiError(401, "Unauthorized: User context missing");
    }

    try {
        const metrics = await UserMetrics.findOne({userId: user.userId}).select("-userId");

        if(!metrics){
            throw new ApiError(404, "User metrics not found");
        }

        return res.status(200).json(
            new ApiResponse(200, metrics, "User metrics fetched successfully")
        );
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, "Failed to fetch user metrics");
    }
});

export const syncCodeforcesProfile = asyncHandler(async(req: Request, res: Response) => {
    const user = req.user;

    if(!user){
        throw new ApiError(401, "Unauthorized: User context missing");
    }

    try {
        const candidate = await User.findById(user.userId);

        if(!candidate){
            throw new ApiError(404, "User not found");
        }

        const CodeforcesHandle = candidate.codeforcesHandle;

        if(!CodeforcesHandle){
            throw new ApiError(404, "Codeforces handle not found");
        }

        const tokenResult = await TokenService.consumeTokens(user.userId, 10);
        if (!tokenResult.success) {
            throw new ApiError(403, "Insufficient tokens to sync Codeforces profile");
        }


        // Fetch a larger number of submissions to ensure we can find 75 unique problems
        const submissionsResponse = await fetch(
            `${CODEFORCES_API_BASE_URL}/user.status?handle=${CodeforcesHandle}&from=1&count=500`
        );

        const submissionsData = await submissionsResponse.json() as any;

        if (submissionsData.status !== "OK") {
            throw new ApiError(
                500,
                "Failed to fetch Codeforces submissions"
            );
        }

        const submissions = submissionsData.result;

        // Fetch all valid problems to filter out gym/unrated contests
        const allValidProblems = await Problem.find().select("codeforcesId").lean();
        const validProblemIds = new Set(allValidProblems.map(p => (p as any).codeforcesId));

        // Group by problemId and aggregate stats
        const problemMap = new Map<string, any>();

        for (const submission of submissions) {
            const problemId = `${submission.problem.contestId}-${submission.problem.index}`;
            
            // Strictly enforce that we only track problems from our valid database
            if (!validProblemIds.has(problemId)) {
                continue;
            }

            const isCorrect = submission.verdict === "OK";
            const submissionTime = new Date(submission.creationTimeSeconds * 1000);

            if (!problemMap.has(problemId)) {
                problemMap.set(problemId, {
                    problemId,
                    rating: submission.problem.rating ?? 0,
                    tags: submission.problem.tags ?? [],
                    solvedAt: isCorrect ? submissionTime : null, // will update if we find an earlier/later correct one
                    correctSubmissions: isCorrect ? 1 : 0,
                    incorrectSubmissions: isCorrect ? 0 : 1,
                    latestAttempt: submissionTime
                });
            } else {
                const existing = problemMap.get(problemId);
                existing.correctSubmissions += isCorrect ? 1 : 0;
                existing.incorrectSubmissions += isCorrect ? 0 : 1;
                if (submissionTime > existing.latestAttempt) {
                    existing.latestAttempt = submissionTime;
                }
                if (isCorrect && (!existing.solvedAt || submissionTime > existing.solvedAt)) {
                    // Update solvedAt to the most recent correct submission
                    existing.solvedAt = submissionTime;
                }
            }
        }

        // Convert to array, sort by most recent attempt, take top 75
        const recentUniqueProblems = Array.from(problemMap.values())
            .sort((a, b) => b.latestAttempt.getTime() - a.latestAttempt.getTime())
            .slice(0, 75)
            .map(p => ({
                problemId: p.problemId,
                rating: p.rating,
                tags: p.tags,
                solvedAt: p.solvedAt || p.latestAttempt, // Fallback to latest attempt if never solved
                correctSubmissions: p.correctSubmissions,
                incorrectSubmissions: p.incorrectSubmissions
            }));

        const metrics = await UserMetrics.findOneAndUpdate(
            { userId: user.userId },
            {
                recentSubmissions: recentUniqueProblems,
        lastCalculatedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
      }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        metrics,
        "Codeforces profile synced successfully"
      )
    );
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, "Failed to sync Codeforces profile");
    }
});