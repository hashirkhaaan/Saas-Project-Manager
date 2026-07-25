import moongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
        password: {
            type: String,
            required: function () {
                return !this.googleId;
            },
        },
        avatar: {
            type: String,
            default: "",
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        refreshToken: {
            type: String,
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
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = moongoose.model("User", userSchema);




// User (independent entity)
//   - _id
//   - name
//   - email
//   - password (hashed)
//   - googleId (OAuth ke liye)
// Workspace
//   - _id
//   - name
//   - owner: ObjectId → ref User
//   - members: [ { userId: ObjectId → ref User, role: String } ]
// Project (belongs to Workspace)
//   - _id
//   - name
//   - workspaceId: ObjectId → ref Workspace
// Task (belongs to Project)
//   - _id
//   - title
//   - description
//   - status: enum
//   - assignee: ObjectId → ref User
//   - projectId: ObjectId → ref Project
//   - dueDate
//   - priority
//   - attachments: [String] (URLs)