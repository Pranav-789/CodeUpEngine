import mongoose, {Schema, Document} from "mongoose"

export interface IProblem extends Document {
    codeforcesId: string;
    name: string;
    rating: number;
    tags: string[];
    upvotes: number;
    communityRating: number;
}

const ProblemSchema: Schema = new Schema({
    codeforcesId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    name: {
        type: String,
        required: true
    },
    rating: {
        type: Number, 
        required: true,
        index: true
    },
    tags: [{
        type: String,
        index: true
    }]
});

export default mongoose.model<IProblem>("Problem", ProblemSchema);