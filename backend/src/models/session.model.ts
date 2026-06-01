import mongoose, {Schema, Document} from "mongoose"

export interface ISession extends Document{
    userId: mongoose.Types.ObjectId;
    refreshToken: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SessionSchema: Schema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    expiresAt:{
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

SessionSchema.index({userId: 1, deviceId: 1}, {unique: true});

SessionSchema.index({
    expiresAt: 1,
}, {expireAfterSeconds: 0});

export default mongoose.model<ISession>("Session", SessionSchema);