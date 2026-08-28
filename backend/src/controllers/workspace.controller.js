import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Workspace } from "../models/workspace.model.js";
import { Task } from "../models/task.model.js";
import { Project } from "../models/project.model.js";
import { Invite } from "../models/invite.models.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import { isValidObjectId } from "mongoose";
import { validateEmail } from "../utils/validateEmail.js";
import mongoose from "mongoose";



const createWorkspace = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Name field is required");
    }

    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const workSpace = await Workspace.create({
        name,
        owner: req.user._id,
        members: [
            {
                userId: req.user._id,
                role: "owner",
            },
        ],
    });

    return res
        .status(201)
        .json(
            new ApiResponse(201, workSpace, "Workspace created successfully")
        );
});

const getUserWorkspaces = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "Unauthorized request");
    }

    const userWorkspaces = await Workspace.find({
        "members.userId": req.user._id,
    });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                userWorkspaces,
                "User's workspaces fetched successfully"
            )
        );
});

const getWorkspaceById = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.workspace,
                "Workspace fetched successfully"
            )
        );
});

const updateWorkspaceName = asyncHandler(async (req, res) => {
    const { name } = req.body;

    if (!name || name.trim() === "") {
        throw new ApiError(400, "Name is required");
    }

    const updatedWorkspace = await Workspace.findByIdAndUpdate(
        req.workspace._id,
        {
            $set: {
                name: name.trim(),
            },
        },
        {
            new: true,
            runValidators: true,
            context: "query",
        }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedWorkspace,
                "Workspace name updated successfully"
            )
        );
});

const deleteWorkspace = asyncHandler(async (req, res) => {
    const workspaceId = req.workspace._id;

    const projects = await Project.find({ workspaceId });
    const projectIds = projects.map((project) => project._id);

    await Task.deleteMany({
        projectId: {
            $in: projectIds,
        },
    });

    await Project.deleteMany({ workspaceId });

    await Invite.deleteMany({ workspaceId });

    await Workspace.findByIdAndDelete(workspaceId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Workspace deleted successfully"));
});

const generateInvite = asyncHandler(async (req, res) => {
    const workspaceId = req.workspace._id;
    const { role } = req.body;

    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const isValidEmail = validateEmail(email);

    if (!isValidEmail) {
        throw new ApiError(400, "Invalid email format");
    }

    const existedInvite = await Invite.findOne({
        email,
        workspaceId,
    });
    if (existedInvite) {
        throw new ApiError(400, "Invite to this user already exists");
    }
    const existedUser = await User.findOne({ email });

    if (!existedUser) {
        throw new ApiError(404, "User not found");
    }

    const workspace = req.workspace;
    const isMember = workspace.isMember(existedUser._id);

    if (isMember) {
        throw new ApiError(400, "This member already exists in the workspace");
    }

    const validRoles = ["member", "viewer"];

    if (!validRoles.includes(role)) {
        throw new ApiError(400, "Invalid role. Must be 'member' or 'viewer'");
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const createdInvite = await Invite.create({
        workspaceId,
        email,
        token,
        role,
        expiresAt,
        invitedBy: req.user._id,
    });
    const inviteLink = `${process.env.FRONTEND_URL}/invite/accept?token=${token}`;

    const subject = `${req.user.fullName} is inviting you to their workspace ${workspace.name}`;

    const text = "If you want to join the workspace, please click below: ";

    const html = `<a href="${inviteLink}">Accept Invite</a>`;

    await sendEmail({ to: email, subject, text, html });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Invite sent successfully"));
});

const acceptInvite = asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
        throw new ApiError(401, "Invalid request");
    }

    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            const invite = await Invite.findOne({
                token,
                expiresAt: { $gt: new Date() },
            }).session(session);

            if (!invite) {
                throw new ApiError(404, "Invalid or expired invite");
            }

            if (req.user.email.toLowerCase() !== invite.email) {
                throw new ApiError(403, "Unauthorized request");
            }

            const workspace = await Workspace.findOneAndUpdate(
                {
                    _id: invite.workspaceId,
                    members: {
                        $not: {
                            $elemMatch: { userId: req.user._id },
                        },
                    },
                },
                {
                    $push: {
                        members: {
                            userId: req.user._id,
                            role: invite.role,
                        },
                    },
                },
                {
                    new: true,
                    runValidators: true,
                    context: "query",
                    session,
                }
            );

            if (!workspace) {
                throw new ApiError(
                    409,
                    "Already a member or workspace missing"
                );
            }

            const consumedInvite = await Invite.findOneAndDelete(
                { _id: invite._id, token },
                { session }
            );

            if (!consumedInvite) {
                throw new ApiError(409, "Invite has already been used");
            }
        });
    } finally {
        await session.endSession();
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Invite accepted successfully"));
});


const rejectInvite = asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
        throw new ApiError(401, "Invalid request");
    }

    const invite = await Invite.findOne({ token });

    if (!invite || !invite.verifyInvite()) {
        throw new ApiError(404, "Invalid or expired invite");
    }
    if (req.user.email.toLowerCase() !== invite.email) {
        throw new ApiError(403, "Unauthorized request");
    }

    await invite.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Invite rejected successfully"));
});

const removeMember = asyncHandler(async (req, res) => {
    const { memberIdToRemove } = req.params;

    if (!isValidObjectId(memberIdToRemove)) {
        throw new ApiError(400, "Invalid member id");
    }

    if (memberIdToRemove.toString() === req.workspace.owner.toString()) {
        throw new ApiError(400, "Invalid request");
    }

    const isMember = req.workspace.isMember(memberIdToRemove);

    if (!isMember) {
        throw new ApiError(400, "This user is not member of the workspace");
    }

    const updatedWorkspace = await Workspace.findOneAndUpdate(
        {
            _id: req.workspace._id,
            "members.userId": memberIdToRemove,
        },
        {
            $pull: {
                members: {
                    userId: memberIdToRemove,
                },
            },
        },
        {
            new: true,
            runValidators: true,
            context: "query",
        }
    );

    if (!updatedWorkspace) {
        throw new ApiError(400, "This user is not member of the workspace");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Member removed successfully"));
});

const updateMemberRole = asyncHandler(async (req, res) => {
    const { memberIdToUpdate } = req.params;
    const { role } = req.body;

    if (!isValidObjectId(memberIdToUpdate)) {
        throw new ApiError(400, "Invalid member id");
    }

    if (memberIdToUpdate.toString() === req.workspace.owner.toString()) {
        throw new ApiError(400, "Invalid request");
    }

    const validRoles = ["member", "viewer"];

    if (!role || !validRoles.includes(role)) {
        throw new ApiError(400, "Invalid role. Must be 'member' or 'viewer'");
    }

    const updatedWorkspace = await Workspace.findOneAndUpdate(
        { _id: req.workspace._id, "members.userId": memberIdToUpdate },
        {
            $set: {
                "members.$.role": role,
            },
        },
        {
            new: true,
            runValidators: true,
            context: "query",
        }
    );

    if (!updatedWorkspace) {
        throw new ApiError(400, "This user is not member of workspace");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedWorkspace,
                "Member role changed successfully"
            )
        );
});

export {
    createWorkspace,
    getUserWorkspaces,
    getWorkspaceById,
    updateWorkspaceName,
    deleteWorkspace,
    generateInvite,
    acceptInvite,
    rejectInvite,
    removeMember,
    updateMemberRole,
};
