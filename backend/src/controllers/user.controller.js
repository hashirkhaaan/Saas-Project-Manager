import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validateEmail } from "../utils/validateEmail.js";
import { User } from "../models/user.model.js";
import {
    uploadOnCloudinary,
    deleteZombieFilesOnCloudinary,
} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";

const options = {
    httpOnly: true,
    secure: true,
};

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
    const avatarLocalPath = req.file?.path;

    const cloudinaryResponse = avatarLocalPath
        ? await uploadOnCloudinary(avatarLocalPath)
        : null;

    const avatar = cloudinaryResponse
        ? {
              url: cloudinaryResponse.secure_url,
              public_id: cloudinaryResponse.public_id,
          }
        : {};

    const user = await User.create({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        avatar,
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

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, loggedInUser, "User loggedin Successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
    if (!req.user?._id) {
        throw new ApiError(401, "Unauthorized request");
    }
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        if (!decodedToken?._id) {
            throw new ApiError(401, "Unauthorized request");
        }
        const user = await User.findById(decodedToken._id).select(
            "+refreshToken"
        );

        if (!user) {
            throw new ApiError(400, "Invalid refresh token");
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(400, "Refresh Token expired or used");
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefreshToken(user);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(200, {}, "Access token refreshed successfully")
            );
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid access token");
    }
});

const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully")
        );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    if (
        [oldPassword, newPassword, confirmNewPassword].some(
            (field) => !field || field.trim() == ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
    }
    if (newPassword !== confirmNewPassword) {
        throw new ApiError(
            400,
            "New password and confirm password do not match"
        );
    }
    if (newPassword.length < 8) {
        throw new ApiError(400, "Password must be 8 characters long");
    }
    const user = await User.findById(req.user._id).select("+password");

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(401, "Unauthorized request");
    }
    const sameNewPassword = await user.isPasswordCorrect(newPassword);
    if (sameNewPassword) {
        throw new ApiError(400, "Old and new password can not be same");
    }
    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const updateUserAvatarImage = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }
    const cloudinaryResponse = await uploadOnCloudinary(avatarLocalPath);

    if (!cloudinaryResponse?.url) {
        throw new ApiError(500, "Error while uploading the file to cloudinary");
    }

    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const avatar = {
        url: cloudinaryResponse.url,
        public_id: cloudinaryResponse.public_id,
    };

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar,
            },
        },
        {
            new: true,
            runValidators: true,
            context: "query",
        }
    );

    const oldAvatarPublicId = req.user.avatar?.public_id;
    if (oldAvatarPublicId) {
        await deleteZombieFilesOnCloudinary(oldAvatarPublicId);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName } = req.body;

    if (!fullName || fullName.trim() === "") {
        throw new ApiError(400, "Full name is required");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: { fullName: fullName.trim() },
        },
        { new: true, runValidators: true, context: "query" }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "Account details updated successfully"
            )
        );
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (user) {
        const otp = await user.generateResetOTP();

        const subject = "Reset password OTP for Saas Project Manager";

        const text =
            "If you didn't requested password reset, please ignore this and don't share this code with anyone.";

        const html = `Below is your password reset code:\n<h1>${otp}</h1>`;

        await sendEmail({ to: email, subject, text, html });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "If email is registered, forgot password email sent successfully"
            )
        );
});

const resetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword, confirmNewPassword } = req.body;

    if (
        [email, otp, newPassword, confirmNewPassword].some(
            (field) => !field || field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields must be present");
    }

    if (!validateEmail(email)) {
        throw new ApiError(400, "Invalid email format");
    }

    if (newPassword !== confirmNewPassword) {
        throw new ApiError(400, "Passwords do not match");
    }

    if (newPassword.length < 8) {
        throw new ApiError(400, "Password must be 8 characters long");
    }

    const user = await User.findOne({ email }).select(
        "+resetPasswordOTP +resetPasswordExpiry"
    );

    if (!user) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    const isValidOTP = await user.verifyResetOTP(otp);

    if (!isValidOTP) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    user.clearResetOTP();
    user.password = newPassword;
    user.refreshToken = undefined;
    await user.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset successfully"));
});

const googleAuthCallback = asyncHandler(async (req, res) => {
    const user = req.user;

    if (!user) {
        return res.redirect(
            `${process.env.CORS_ORIGIN}/login?error=google_auth_failed`
        );
    }

    const { accessToken, refreshToken } =
        await generateAccessAndRefreshToken(user);

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, options)
        .cookie("accessToken", accessToken, options)
        .redirect(`${process.env.CORS_ORIGIN}/dashboard`);
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateUserAvatarImage,
    forgotPassword,
    resetPassword,
    googleAuthCallback,
};
