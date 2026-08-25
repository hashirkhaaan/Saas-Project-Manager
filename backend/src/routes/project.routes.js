import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { attachWorkspaceRole } from "../middlewares/attachWorkspaceRole.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { verifyProjectInWorkspace } from "../middlewares/verifyProjectInWorkspace.middleware.js";

import {
    createProject,
    getWorkspaceProjects,
    getProjectById,
    updateProject,
    deleteProject
} from "../controllers/project.controller.js";

const router = Router();

// secure routes
router
    .route("/:workSpaceId/projects")
    .post(
        verifyJWT,
        attachWorkspaceRole,
        checkRole(["owner", "member"]),
        createProject
    )

    .get(
        verifyJWT,
        attachWorkspaceRole,
        checkRole(["owner", "member", "viewer"]),
        getWorkspaceProjects
    );

router
    .route("/:workSpaceId/projects/:projectId")
    .get(
        verifyJWT,
        attachWorkspaceRole,
        verifyProjectInWorkspace,
        checkRole(["owner", "member", "viewer"]),
        getProjectById
    )
    .patch(
        verifyJWT,
        attachWorkspaceRole,
        verifyProjectInWorkspace,
        checkRole(["owner", "member"]),
        updateProject
    )
    .delete(
        verifyJWT,
        attachWorkspaceRole,
        verifyProjectInWorkspace,
        checkRole(["owner", "member"]),
        deleteProject
    )
export default router;
