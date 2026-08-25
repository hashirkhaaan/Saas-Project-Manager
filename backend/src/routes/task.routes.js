import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { attachWorkspaceRole } from "../middlewares/attachWorkspaceRole.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";
import { verifyProjectInWorkspace } from "../middlewares/verifyProjectInWorkspace.middleware.js";
import { verifyTaskInProject } from "../middlewares/verifyTaskInProject.middleware.js";
import {
    uploadAttachments,
    validateFileSignatures,
} from "../middlewares/multer.middlware.js";

import {
    createTask,
    getProjectTasks,
    getTaskById,
    updateTask,
    updateTaskStatus,
    deleteTask,
} from "../controllers/task.controller.js";

const router = Router();

// secure routes
router
    .route("/:workSpaceId/projects/:projectId/tasks")
    .post(
        verifyJWT,
        attachWorkspaceRole,
        verifyProjectInWorkspace,
        checkRole(["owner"]),
        uploadAttachments.array("attachments", 5),
        validateFileSignatures,
        createTask
    );

router
    .route("/:workSpaceId/projects/:projectId/tasks")
    .get(
        verifyJWT,
        attachWorkspaceRole,
        verifyProjectInWorkspace,
        checkRole(["owner", "member", "viewer"]),
        getProjectTasks
    );

router
    .route("/:workSpaceId/projects/:projectId/tasks/:taskId")
    .get(
        verifyJWT,
        attachWorkspaceRole,
        verifyProjectInWorkspace,
        verifyTaskInProject,
        checkRole(["owner", "member", "viewer"]),
        getTaskById
    )
    .patch(
        verifyJWT,
        attachWorkspaceRole,
        verifyProjectInWorkspace,
        verifyTaskInProject,
        checkRole(["owner", "member"]),
        updateTask
    )
    .delete(
        verifyJWT,
        attachWorkspaceRole,
        verifyProjectInWorkspace,
        verifyTaskInProject,
        checkRole(["owner", "member"]),
        deleteTask
    );

router
    .route("/:workSpaceId/projects/:projectId/tasks/:taskId/status")
    .patch(
        verifyJWT,
        attachWorkspaceRole,
        verifyProjectInWorkspace,
        verifyTaskInProject,
        checkRole(["owner", "member"]),
        updateTaskStatus
    );
export default router;
