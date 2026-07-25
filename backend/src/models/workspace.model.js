import mongoose, { Schema } from "mongoose";

const workspaceSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Workspace name is required"],
            trim: true,
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        members: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                role: {
                    type: String,
                    required: true,
                    lowercase: true,
                    index: true,
                    enum: ["owner", "member", "viewer"],
                    default: "member",
                },
                joinedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

export const Workspace = mongoose.model("Workspace", workspaceSchema);
