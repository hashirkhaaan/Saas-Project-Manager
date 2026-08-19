import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { attachWorkspaceRole } from "../middlewares/attachWorkspaceRole.middleware.js";
import { checkRole } from "../middlewares/checkRole.middleware.js";

const router = Router();

// secure routes
router.route("/").post(verifyJWT, createWorkspace);
router.route("/mine").get(verifyJWT, getUserWorkspaces);

export default router;
