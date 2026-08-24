import { Router } from "express";
import {
    uploadAvatar,
    validateFileSignatures,
} from "../middlewares/multer.middlware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { passwordRecoveryLimiter } from "../middlewares/passwordRecoveryLimiter.middleware.js";
import passport from "passport";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    forgotPassword,
    resetPassword,
    googleAuthCallback,
} from "../controllers/user.controller.js";

const router = Router();

router
    .route("/register")
    .post(uploadAvatar.single("avatar"), validateFileSignatures, registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(passwordRecoveryLimiter, forgotPassword);
router.route("/reset-password").post(passwordRecoveryLimiter, resetPassword);

router.route("/google").get(
    passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
    })
);
router.route("/google/callback").get(
    passport.authenticate("google", {
        session: false,
        failureRedirect: `${process.env.CORS_ORIGIN}/login?error=google_auth_failed`,
    }),
    googleAuthCallback
);

export default router;
