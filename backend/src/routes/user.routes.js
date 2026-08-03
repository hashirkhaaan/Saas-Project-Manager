import { Router } from "express";
import { upload } from "../middlewares/multer.middlware.js";
import {
    getCurrentUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();


// secure routes
router.route("/current-user").get(verifyJWT, getCurrentUser)



export default router;
