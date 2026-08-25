import { Workspace } from "../models/workspace.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidObjectId } from "mongoose";

const attachWorkspaceRole = asyncHandler(async (req, res, next) => {
        const { workSpaceId } = req.params;

        if (!isValidObjectId(workSpaceId)) {
            throw new ApiError(400, "Invalid workspace id");
        }

        if (!workSpaceId) {
            throw new ApiError(400, "Invalid request");
        }

        if (!req.user?._id) {
            throw new ApiError(401, "Unauthorized request");
        }

        const workspace = await Workspace.findOne({
            _id: workSpaceId,
            "members.userId": req.user._id,
        });

        if (!workspace) {
            throw new ApiError(404, "No workspace found");
        }
        const memberEntry = workspace.memberEntry(req.user._id);

        req.workspace = workspace;
        req.role = memberEntry.role;

        next();
});

export { attachWorkspaceRole };
