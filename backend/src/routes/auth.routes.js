import { Router } from "express";
import { upload } from "../middlewares/multer.middlware.js";
import {
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    googleAuthCallback,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import passport from "passport";

const router = Router();

router.route("/register").post(upload.single("avatar"), registerUser);

router.route("/login").post(loginUser);

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

// secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);

export default router;
