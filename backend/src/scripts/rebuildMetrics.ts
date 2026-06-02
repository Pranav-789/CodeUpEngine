import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/user.model.js";
import UserMetrics from "../models/usermetric.model.js";
import Problem from "../models/problem.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://admin:30406@localhost:27017/CodeUpEngine?authSource=admin";

async function rebuildMetrics() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Clear existing metrics just in case
        await UserMetrics.deleteMany({});
        console.log("Cleared existing UserMetrics");

        const users = await User.find({ role: 'user' }).select('_id');
        console.log(`Found ${users.length} users to populate.`);

        // Fetch a pool of valid standard problems
        const allProblems = await Problem.find().select('codeforcesId rating tags name').lean();
        console.log(`Loaded ${allProblems.length} valid problems from DB.`);

        if (allProblems.length === 0) {
            throw new Error("No problems found in Problem collection! Run populateProblems.ts first.");
        }

        const BATCH_SIZE = 50;
        let processed = 0;

        for (let i = 0; i < users.length; i += BATCH_SIZE) {
            const batch = users.slice(i, i + BATCH_SIZE);
            const metricsDocs = batch.map(user => {
                // Generate a random 38-element Elo vector centered around 1200
                const vector = Array.from({ length: 38 }, () => Math.floor(Math.random() * 800) + 800);

                // Pick a random number of submissions between 30 and 70
                const numSubs = Math.floor(Math.random() * 41) + 30;
                
                // Randomly select problems for this user
                const shuffled = [...allProblems].sort(() => 0.5 - Math.random());
                const selectedProblems = shuffled.slice(0, numSubs);

                const recentSubmissions = selectedProblems.map(p => ({
                    problemId: (p as any).codeforcesId,
                    rating: (p as any).rating || 800,
                    tags: (p as any).tags || [],
                    solvedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // random within last 30 days
                    correctSubmissions: Math.floor(Math.random() * 2) + 1, // 1 to 2
                    incorrectSubmissions: Math.floor(Math.random() * 3) // 0 to 2
                }));

                return {
                    userId: user._id,
                    recentSubmissions,
                    topicEloVector: vector,
                    activeRecommendations: [],
                    lastCalculatedAt: new Date()
                };
            });

            await UserMetrics.insertMany(metricsDocs);
            processed += batch.length;
            console.log(`Inserted ${processed}/${users.length} user metrics...`);
        }

        console.log("Successfully rebuilt UserMetrics using valid Problem table!");

    } catch (error) {
        console.error("Error rebuilding metrics:", error);
    } finally {
        await mongoose.disconnect();
    }
}

rebuildMetrics();
