import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { attachWorkspaceRole } from "../middlewares/attachWorkspaceRole.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import {
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
} from "../controllers/workspace.controller.js";

const router = Router();

// secure routes
router.route("/").post(verifyJWT, createWorkspace);
router.route("/mine").get(verifyJWT, getUserWorkspaces);
router
    .route("/:workSpaceId")
    .get(
        verifyJWT,
        attachWorkspaceRole,
        checkRole(["owner", "member", "viewer"]),
        getWorkspaceById
    )
    .patch(
        verifyJWT,
        attachWorkspaceRole,
        checkRole(["owner"]),
        updateWorkspaceName
    )
    .delete(
        verifyJWT,
        attachWorkspaceRole,
        checkRole(["owner"]),
        deleteWorkspace
    );

router
    .route("/:workSpaceId/invite")
    .post(verifyJWT, 
        attachWorkspaceRole, 
        checkRole(["owner"]), 
        generateInvite
    );

router
    .route("/:workSpaceId/members/:memberIdToRemove")
    .delete(verifyJWT, 
        attachWorkspaceRole, 
        checkRole(["owner"]), 
        removeMember
    );

router
    .route("/:workSpaceId/members/:memberIdToUpdate/role")
    .patch(
        verifyJWT,
        attachWorkspaceRole,
        checkRole(["owner"]),
        updateMemberRole
    );

router.route("/invite/accept").post(verifyJWT, acceptInvite);
router.route("/invite/reject").post(verifyJWT, rejectInvite);
export default router;
