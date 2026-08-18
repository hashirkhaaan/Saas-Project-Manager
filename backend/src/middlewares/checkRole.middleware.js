import { ApiError } from "../utils/ApiError.js";

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.role)) {
            throw new ApiError(
                403,
                "You do not have permission to perform this action"
            );
        }
        next();
    };
};

export { checkRole };
