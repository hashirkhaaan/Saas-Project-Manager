import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Workspace } from "../models/workspace.model.js";
import { Task } from "../models/task.model.js";
import { Project } from "../models/project.model.js";
import { Invite } from "../models/invite.models.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";

const createWorkspace = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Name field is required");
    }

    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const workSpace = await Workspace.create({
        name,
        owner: req.user._id,
        members: [
            {
                userId: req.user._id,
                role: "owner",
            },
        ],
    });

    return res
        .status(201)
        .json(
            new ApiResponse(201, workSpace, "Workspace created successfully")
        );
});

const getUserWorkspaces = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const userWorkspaces = await Workspace.find({
        "members.userId": req.user._id,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userWorkspaces,
                "User's workspaces fetched successfully"
            )
        );
});


export {
    createWorkspace,
    getUserWorkspaces,
};
