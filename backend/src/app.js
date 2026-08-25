import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "./config/passport.js";
import session from "express-session";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// Configurations for the app
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import workspaceRouter from "./routes/workspace.routes.js";
import projectRouter from "./routes/project.routes.js";
import taskRouter from "./routes/task.routes.js";

// routes decleration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/workspaces", workspaceRouter);
app.use("/api/v1/workspaces", projectRouter);
app.use("/api/v1/workspaces", taskRouter);

app.use(errorHandler);

export { app };
