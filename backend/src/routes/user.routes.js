import { Router } from "express";
import { upload } from "../middlewares/multer.middlware.js";
import { registerUser } from "../controllers/user.controller.js";
const router = Router();

router.route("/register").post(
    upload.single("avatar"), 
    registerUser
);

export default router;
