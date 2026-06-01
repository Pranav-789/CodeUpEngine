import mongoose, {Schema, Document} from "mongoose"

export interface IUser extends Document{
    email: string;
    passwordHash: string;
    codeforcesHandle: string;
    isVerified: boolean;

    emailVerificationToken?: string;

    emailVerificationExpiry?: Date;

    role: "user" | "admin";

    nextWeeklyRefresh: Date;
    baseTokens: number;

    subscriptionTier: 'free' | 'pro';
    premiumTokens: number;

    forgotPasswordToken?: string;

    forgotPasswordExpiry?: Date;

    createdAt: Date;
    modifiedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        codeforcesHandle: {
            type: String,
            required: true,
            unique: true
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        role:{
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        nextWeeklyRefresh: {
            type: Date,
            required: true
        },
        baseTokens: {
            type: Number,
            default: 50
        },
        subscriptionTier: {
            type: String,
            enum: ['free', 'pro'],
            default: 'free'
        },
        premiumTokens: {
            type: Number,
            default: 0,
        },
        emailVerificationToken: {
            type: String
        },

        emailVerificationExpiry: {
            type: Date
        },
        forgotPasswordToken: {
            type: String
        },
        forgotPasswordExpiry: {
            type: Date
        },
    },
    {
        timestamps: true
    }
)

export default mongoose.model<IUser>("User", UserSchema); //mongoDb this is stored as users 