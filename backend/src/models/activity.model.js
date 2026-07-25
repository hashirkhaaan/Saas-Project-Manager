import mongoose, { Schema } from "mongoose";

const activitySchema = new Schema(
    {
        performedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        taskId: {
            type: Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true,
        },
        description: {
            type: String,
            required: [true, "Description of activity is required"],
        },
        actionType: {
            type: String,
            required: true,
            enum: [
                "created",
                "status_changed",
                "priority_changed",
                "assigned",
                "unassigned",
                "commented",
                "attachment_added",
            ],
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
    }
);

export const Activity = mongoose.model("Activity", activitySchema);
