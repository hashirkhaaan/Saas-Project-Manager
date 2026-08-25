import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Project } from "../models/project.model.js";
import { isValidObjectId } from "mongoose";
import { Task } from "../models/task.model.js";

const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (
        !name ||
        name.trim() === "" ||
        !description ||
        description.trim() === ""
    ) {
        throw new ApiError(400, "Name and description fields are required");
    }

    const createdProject = await Project.create({
        name: name.trim(),
        description: description.trim(),
        workspaceId: req.workspace._id,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(201, createdProject, "Project created successfully")
        );
});

const getWorkspaceProjects = asyncHandler(async (req, res) => {
    const workspaceId = req.workspace._id;

    const workspaceProjects = await Project.find({ workspaceId });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                workspaceProjects,
                "Workspace projects fetched successfully"
            )
        );
});

const getProjectById = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.project, "Project fetched successfully")
        );
});

const updateProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const projectId = req.project._id;

    if (
        (!name || name.trim() === "") &&
        (!description || description.trim() === "")
    ) {
        throw new ApiError(
            400,
            "Atleast one of name and  description field is required"
        );
    }

    const updateFields = {};

    if (name) updateFields.name = name.trim();

    if (description) updateFields.description = description.trim();

    const updatedProject = await Project.findOneAndUpdate(
        {
            _id: projectId,
            workspaceId: req.workspace._id,
        },
        {
            $set: updateFields,
        },
        {
            new: true,
            runValidators: true,
            context: "query",
        }
    );

    if (!updatedProject) {
        throw new ApiError(404, "Project with these credentials not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedProject, "Project updated successfully")
        );
});

const deleteProject = asyncHandler(async (req, res) => {
    const projectId = req.project._id;
    const project = req.project;

    const tasks = await Task.find({ projectId });
    const taskIds = tasks.map((task) => task._id);

    await Task.deleteMany({
        _id: {
            $in: taskIds,
        },
    });

    await project.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project deleted successfully"));
});

export {
    createProject,
    getWorkspaceProjects,
    getProjectById,
    updateProject,
    deleteProject,
};
