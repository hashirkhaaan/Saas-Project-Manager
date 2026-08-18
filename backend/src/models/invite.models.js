import mongoose, { Schema } from "mongoose";

const inviteSchema = new Schema(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            index: true,
        },
        token: {
            type: String,
            unique: true,
            required: true,
        },
        role: {
            type: String,
            enum: ["member", "viewer"],
            default: "member",
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 },
        },
        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

export const Invite = mongoose.model("Invite", inviteSchema);
