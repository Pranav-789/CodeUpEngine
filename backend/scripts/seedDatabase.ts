// scripts/seedDatabase.ts
import mongoose from 'mongoose';
import { faker } from '@faker-js/faker';
import User from '../src/models/user.model.js';
import UserMetrics from '../src/models/usermetric.model.js';
import 'dotenv/config';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://admin:30406@localhost:27017/CodeUpEngine?authSource=admin';
const NUM_USERS = 1000;

function gaussianRandom(mean: number, stdev: number) {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return Math.max(800, Math.round(z * stdev + mean));
}

const TAGS = [
    "*special", "2-sat", "binary search", "bitmasks", "brute force", 
    "chinese remainder theorem", "combinatorics", "communication", 
    "constructive algorithms", "data structures", "dfs and similar", 
    "divide and conquer", "dp", "dsu", "expression parsing", "fft", 
    "flows", "games", "geometry", "graph matchings", "graphs", "greedy", 
    "hashing", "implementation", "interactive", "math", "matrices", 
    "meet-in-the-middle", "number theory", "probabilities", "schedules", 
    "shortest paths", "sortings", "string suffix structures", "strings", 
    "ternary search", "trees", "two pointers"
];

async function seedDatabase() {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB. Wiping old data...");

    await User.deleteMany({});
    await UserMetrics.deleteMany({});

    console.log(`Generating ${NUM_USERS} synthetic users...`);

    const usersToInsert = [];
    const metricsToInsert = [];

    for (let i = 0; i < NUM_USERS; i++) {
        const userId = new mongoose.Types.ObjectId();
        
        let handle = faker.internet.username();

        usersToInsert.push({
            _id: userId,
            email: faker.internet.email(),
            passwordHash: 'hashed_password_mock',
            codeforcesHandle: handle,
            isVerified: true,
            role: 'user',
            baseToken: 50,
            subscriptionTier: 'free',
            premiumTokens: 0,
            nextWeeklyRefresh: new Date()
        });

        const archetypeRoll = Math.random();
        let baseRating = 1200;
        let strongTags: string[] = [];

        if (archetypeRoll < 0.3) {
            baseRating = gaussianRandom(1000, 150);
        } else if (archetypeRoll < 0.6) {
            baseRating = gaussianRandom(1400, 200);
            strongTags = ["math", "greedy", "brute force"];
        } else if (archetypeRoll < 0.85) {
            baseRating = gaussianRandom(1800, 250);
            strongTags = ["dp", "graphs", "dfs and similar"];
        } else {
            baseRating = gaussianRandom(2400, 300);
            strongTags = TAGS; 
        }

        const vector = new Array(38).fill(1200);
        
        TAGS.forEach((tag, index) => {
            if (strongTags.includes(tag)) {
                vector[index] = gaussianRandom(baseRating + 200, 100);
            } else {
                vector[index] = gaussianRandom(baseRating - 100, 150);
            }
        });

        const mockSubmissions = [];
        const numSubmissions = Math.floor(Math.random() * 20) + 5; 
        
        for (let j = 0; j < numSubmissions; j++) {
            const isCorrect = Math.random() > 0.4; 
            mockSubmissions.push({
                problemId: `${Math.floor(Math.random() * 2000)}-${['A','B','C','D'][Math.floor(Math.random()*4)]}`,
                rating: gaussianRandom(baseRating, 200),
                tags: [TAGS[Math.floor(Math.random() * TAGS.length)]],
                solvedAt: isCorrect ? faker.date.recent({ days: 30 }) : null,
                correctSubmissions: isCorrect ? 1 : 0,
                incorrectSubmissions: isCorrect ? 0 : Math.floor(Math.random() * 3) + 1
            });
        }

        metricsToInsert.push({
            userId: userId,
            topicEloVector: vector,
            recentSubmissions: mockSubmissions,
            activeRecommendations: [],
            lastCalculatedAt: new Date()
        });
    }

    await User.insertMany(usersToInsert);
    await UserMetrics.insertMany(metricsToInsert);

    console.log(`Successfully seeded ${NUM_USERS} users and metrics!`);
    mongoose.disconnect();
}

seedDatabase().catch(console.error);
