import mongoose, { Schema } from "mongoose";

const taskSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Task's title is required"],
            trim: true,
            index: true,
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        assignee: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: ["todo", "in-progress", "done"],
            default: "todo",
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        priority: {
            type: String,
            enum: ["urgent", "high", "medium", "low"],
            default: "medium",
            required: true,
        },
        attachments: [
            {
                type: String, //cloudinary Url
            },
        ],
    },
    {
        timestamps: true,
    }
);

export const Task = mongoose.model("Task", taskSchema);
