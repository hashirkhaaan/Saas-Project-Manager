import mongoose, { Schema } from "mongoose";

const projectSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, "Project name is required"],
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
    },
    {
        timestamps: true,
    }
);

export const Project = mongoose.model("Project", projectSchema);
