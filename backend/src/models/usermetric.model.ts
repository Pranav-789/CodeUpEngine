import mongoose, {Schema, Document} from "mongoose";

export interface IUserMetrics extends Document {
    userId: mongoose.Types.ObjectId;

    recentSubmissions: Array<{
        problemId: string;
        rating: number;
        tags: string[];
        solvedAt: Date;
        correctSubmissions: number;
        incorrectSubmissions: number;
    }>;

    topicEloVector: number[];

    activeRecommendations: Array<{
        problemId: string;
        recommendedAt: Date;
        targetTopic: string;
    }>;

    lastCalculatedAt: Date;

    
}

const UserMetrics: Schema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        recentSubmissions: [
            {
                problemId: String,
                rating: Number,
                tags: [String],
                solvedAt: Date,
                correctSubmissions: { type: Number, default: 0 },
                incorrectSubmissions: { type: Number, default: 0 }
            }
        ],

        topicEloVector: {
            type: [Number],
            default: () => new Array(38).fill(800),
            validate: [
                (val: number[]) => val.length === 38
            ]
        },

        activeRecommendations: [{
            problemId: {
                type: String, 
                required: true
            },
            recommendedAt: {
                type: Date,
                default: Date.now()
            },
            targetTopic: {type: String}
        }],
        lastCalculatedAt: {
            type: Date,
            default: Date.now()
        }
    }
)

export default mongoose.model<IUserMetrics>("UserMetrics", UserMetrics)