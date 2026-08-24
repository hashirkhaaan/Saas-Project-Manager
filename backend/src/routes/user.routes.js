import { Router } from "express";
import {
    uploadAvatar,
    validateFileSignatures,
} from "../middlewares/multer.middlware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getCurrentUser,
    changeCurrentPassword,
    updateUserAvatarImage,
    updateAccountDetails,
} from "../controllers/user.controller.js";

const router = Router();

// secure routes

router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router
    .route("/update-avatar")
    .patch(
        verifyJWT,
        uploadAvatar.single("avatar"),
        validateFileSignatures,
        updateUserAvatarImage
    );

router.route("/update-account").patch(verifyJWT, updateAccountDetails);

export default router;
