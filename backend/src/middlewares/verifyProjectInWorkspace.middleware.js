import { asyncHandler } from "../utils/asyncHandler.js";
import { Project } from "../models/project.model.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const verifyProjectInWorkspace = asyncHandler(async (req, res, next) => {
    try {
        const { projectId } = req.params;

        if (!projectId) {
            throw new ApiError(400, "Project id not found");
        }

        if (!isValidObjectId(projectId)) {
            throw new ApiError(400, "Invalid project id");
        }

        const project = await Project.findOne({
            _id: projectId,
            workspaceId: req.workspace._id,
        });

        if (!project) {
            throw new ApiError(404, "Project not found");
        }

        req.project = project;

        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid request");
    }
});

export { verifyProjectInWorkspace };
