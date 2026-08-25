import { asyncHandler } from "../utils/asyncHandler.js";
import { Task } from "../models/task.model.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const verifyTaskInProject  = asyncHandler(async (req, res, next) => {
        const { taskId } = req.params;

        if (!taskId) {
            throw new ApiError(400, "Task id not found");
        }

        if (!isValidObjectId(taskId)) {
            throw new ApiError(400, "Invalid task id");
        }

        const task = await Task.findOne({
            _id: taskId,
            projectId: req.project._id,
        });

        if (!task) {
            throw new ApiError(404, "Task not found in this project");
        }

        req.task = task;
        next();
});

export { verifyTaskInProject };
