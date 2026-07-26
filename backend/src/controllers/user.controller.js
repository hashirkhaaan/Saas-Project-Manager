import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validateEmail } from "../utils/ValidateEmail.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefreshToken = async (user) => {
    try {
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "An error occurred while generating tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if (
        [fullName, email, username, password].some(
            (field) => field?.trim() === ""
        )
    ) {
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

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if ([email, password].some((field) => !field || field?.trim() === "")) {
        throw new ApiError(400, "Email and password can not be empty");
    }
    if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email format");
    }
    const user = await User.findOne({
        email,
    }).select("+password");

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid email or password");
    }

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshToken(user);

    const loggedInUser = await User.findById(user._id);

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                loggedInUser,
                "User loggedin Successfully"
            )
        );
});
export { registerUser };
