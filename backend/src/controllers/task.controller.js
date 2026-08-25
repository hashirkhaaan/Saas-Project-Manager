import { Task } from "../models/task.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { isValidObjectId } from "mongoose";

// Helper function to validate assignee
const validateAssignee = async (assignee, workspace) => {
    if (
        assignee === undefined ||
        assignee === null ||
        (typeof assignee === "string" && assignee.trim() === "")
    ) {
        return undefined;
    }

    if (typeof assignee === "string") {
        assignee = assignee.trim();
    }

    if (!isValidObjectId(assignee)) {
        throw new ApiError(400, "Invalid assignee id");
    }

    const isWorkspaceMember = workspace.isMember(assignee);

    if (!isWorkspaceMember) {
        throw new ApiError(400, "Assignee is not a member of this workspace");
    }

    const user = await User.exists({ _id: assignee });

    if (!user) {
        throw new ApiError(404, "Assignee not found");
    }

    return assignee;
};

const createTask = asyncHandler(async (req, res) => {
    const projectId = req.project._id;

    const { title, description, assignee, status, dueDate, priority } =
        req.body;

    if ([title, description].some((field) => !field || field.trim() == "")) {
        throw new ApiError(400, "Title and description can not be empty");
    }

    const workspaceId = req.workspace._id;

    let attachmentUrls = [];

    if (req.files && req.files.length > 0) {
        const attachments = req.files;

        const urls = await Promise.all(
            attachments.map((attachment) => uploadOnCloudinary(attachment.path, attachment.detectedMimeType))
        );

        if (urls.some((url) => !url?.secure_url)) {
            throw new ApiError(500, "Error while uploading task attachments");
        }

        attachmentUrls = urls.map((url) => url.secure_url);
    }

    const validatedAssignee = await validateAssignee(assignee, req.workspace);

    const task = await Task.create({
        title: title.trim(),
        description: description.trim(),
        workspaceId,
        projectId,
        assignee: validatedAssignee,
        status,
        dueDate,
        priority,
        attachments: attachmentUrls,
    });

    if (!task) {
        throw new ApiError(
            500,
            "An internal server error occurred while creating the task"
        );
    }

    return res
        .status(201)
        .json(new ApiResponse(201, task, "Task created successfully"));
});

const getProjectTasks = asyncHandler(async (req, res) => {
    const workspaceId = req.workspace._id;
    const projectId = req.project._id;

    const tasks = await Task.find({
        workspaceId,
        projectId,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.task, "Tasks fetched successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
    const { title, description, assignee, dueDate, priority, status } =
        req.body;

    const updateFields = {};
    const unsetFields = {};

    if (title && title.trim()) {
        updateFields.title = title.trim();
    }
    if (description && description.trim()) {
        updateFields.description = description.trim();
    }
    if (assignee !== undefined) {
        if (
            assignee === null ||
            (typeof assignee === "string" && assignee.trim() === "")
        ) {
            unsetFields.assignee = 1;
        } else {
            updateFields.assignee = await validateAssignee(
                assignee,
                req.workspace
            );
        }
    }
    if (dueDate) {
        updateFields.dueDate = dueDate;
    }

    if (priority !== undefined) {
        const validPriorities = ["urgent", "high", "medium", "low"];

        if (!validPriorities.includes(priority)) {
            throw new ApiError(400, "Invalid priority value");
        }

        updateFields.priority = priority;
    }

    if (status !== undefined) {
        const validStatuses = ["todo", "in-progress", "done"];

        if (!validStatuses.includes(status)) {
            throw new ApiError(400, "Invalid status value");
        }

        updateFields.status = status;
    }

    if (
        Object.keys(updateFields).length === 0 &&
        Object.keys(unsetFields).length === 0
    ) {
        throw new ApiError(400, "Atleast one field should be present");
    }

    const updateOperation = {};

    if (Object.keys(updateFields).length > 0) {
        updateOperation.$set = updateFields;
    }

    if (Object.keys(unsetFields).length > 0) {
        updateOperation.$unset = unsetFields;
    }

    const updatedTask = await Task.findOneAndUpdate(
        {
            _id: req.task._id,
            workspaceId: req.workspace._id,
            projectId: req.project._id,
        },
        updateOperation,
        {
            new: true,
            runValidators: true,
            context: "query",
        }
    );
    if (!updatedTask) {
        throw new ApiError(404, "Task with these credentials not found");
    }
    return res
        .status(200)
        .json(new ApiResponse(200, updatedTask, "Task updated successfully"));
});

const updateTaskStatus = asyncHandler(async (req, res) => {
    const task = req.task;

    const { status } = req.body;

    const validStatuses = ["todo", "in-progress", "done"];

    if (!status || !validStatuses.includes(status)) {
        throw new ApiError(400, "Invalid status value");
    }

    task.status = status;
    await task.save();

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task status updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
    const task = req.task;

    await task.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Task deleted successfully"));
});

export {
    createTask,
    getProjectTasks,
    getTaskById,
    updateTask,
    updateTaskStatus,
    deleteTask,
};
