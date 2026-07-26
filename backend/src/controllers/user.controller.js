import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validateEmail } from "../utils/ValidateEmail.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }
    if (password.length < 8) {
        throw new ApiError(400, "Password must be 8 characters long.");
    }
    if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }],
    });

    if (existedUser) {
        throw new ApiError(409, "Email or username already registered");
    }
    const avatarLocalPath = req.file?.path || "";

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const user = await User.create({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        avatar: avatar?.url || "",
        password,
    });

    const createdUser = await User.findById(user._id);

    if (!createdUser) {
        throw new ApiError(
            500,
            "Internal server error occurred while creating the user"
        );
    }

    return res
        .status(201)
        .json(new ApiResponse(201, createdUser, "User created Sucessfully"));
});


export { registerUser };
