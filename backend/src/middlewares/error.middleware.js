import { ApiError } from "../utils/ApiError.js";

const errorHandler = (error, req, res, next) => {
    const statusCode = error instanceof ApiError ? error.statusCode : 500;
    const message =
        error instanceof ApiError ? error.message : "Internal server error";

    if (statusCode >= 500) {
        console.error(error);
    }

    return res.status(statusCode).json({
        statusCode,
        success: false,
        message,
        errors: error instanceof ApiError ? error.errors : [],
    });
};

export { errorHandler };
