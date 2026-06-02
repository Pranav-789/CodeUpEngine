import mongoose from "mongoose";
import dotenv from "dotenv";
import Problem from "../models/problem.model.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://admin:30406@localhost:27017/CodeUpEngine?authSource=admin";
const CODEFORCES_API = "https://codeforces.com/api/problemset.problems";

async function populateProblems() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        console.log("Fetching problems from Codeforces API...");
        const response = await fetch(CODEFORCES_API);
        
        if (!response.ok) {
            throw new Error(`Codeforces API returned status ${response.status}`);
        }

        const data = await response.json() as any;
        if (data.status !== "OK") {
            throw new Error("Failed to fetch problems from Codeforces");
        }

        const problems = data.result.problems;
        console.log(`Fetched ${problems.length} problems from Codeforces`);

        let insertedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const prob of problems) {
            // Skip gym contests or specific non-standard problem IDs. 
            // Standard problem sets usually have contestId < 100000
            if (!prob.contestId || prob.contestId >= 100000) {
                skippedCount++;
                continue;
            }

            const codeforcesId = `${prob.contestId}-${prob.index}`;
            const rating = prob.rating || 0; // Some standard problems may be unrated, but we'll accept them if contestId < 100000

            const problemDoc = {
                codeforcesId,
                name: prob.name,
                rating: rating,
                tags: prob.tags || [],
                upvotes: 0,
                communityRating: 0
            };

            const result = await Problem.updateOne(
                { codeforcesId },
                { $set: problemDoc },
                { upsert: true }
            );

            if (result.upsertedCount > 0) {
                insertedCount++;
            } else if (result.modifiedCount > 0) {
                updatedCount++;
            }
        }

        console.log(`Finished populating problems.`);
        console.log(`Inserted: ${insertedCount}`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Skipped (Gym/Unknown): ${skippedCount}`);

    } catch (error) {
        console.error("Error populating problems:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

populateProblems();
