import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
            unique: true,
            index: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: {
            type: String,
            required: function () {
                return !this.googleId;
            },
            select: false,
        },
        avatar: {
            type: {
                url: String,
                public_id: String,
            },
            default: {},
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        refreshToken: {
            type: String,
            select: false,
        },
        resetPasswordOTP: {
            type: String,
            select: false,
        },
        resetPasswordExpiry: {
            type: Date,
            select: false,
        },
        resetPasswordAttempts: {
            type: Number,
            default: 0,
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            fullName: this.fullName,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
        }
    );
};

userSchema.methods.generateResetOTP = async function () {
    const otp = crypto.randomInt(100000, 1000000).toString();

    this.resetPasswordOTP = await bcrypt.hash(otp, 10);
    this.resetPasswordExpiry = Date.now() + 5 * 60 * 1000;
    this.resetPasswordAttempts = 0;

    await this.save({ validateBeforeSave: false });

    return otp;
};

userSchema.methods.verifyResetOTP = async function (otp) {
    if (
        !this.resetPasswordOTP ||
        !this.resetPasswordExpiry ||
        this.resetPasswordAttempts >= 5
    )
        return false;

    if (Date.now() > this.resetPasswordExpiry.getTime()) {
        this.clearResetOTP();
        await this.save({ validateBeforeSave: false });
        return false;
    }

    const isValid = await bcrypt.compare(otp, this.resetPasswordOTP);

    if (!isValid) {
        this.resetPasswordAttempts += 1;

        if (this.resetPasswordAttempts >= 5) {
            this.clearResetOTP();
        }

        await this.save({ validateBeforeSave: false });
    }

    return isValid;
};

userSchema.methods.clearResetOTP = function () {
    this.resetPasswordOTP = undefined;
    this.resetPasswordExpiry = undefined;
    this.resetPasswordAttempts = 0;
};

export const User = mongoose.model("User", userSchema);
