import { asyncHandler } from "../utils/asyncHandler.js";
import { Project } from "../models/project.model.js";
import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const verifyProjectInWorkspace = asyncHandler(async (req, res, next) => {

});

export { verifyProjectInWorkspace };
