import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_SERVICE_USER,
        pass: process.env.EMAIL_SERVICE_PASSWORD,
    },
});

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_SERVICE_USER,
            to,
            subject,
            text,
            html,
        });

        console.log("Message sent: %s", info.messageId);

        if (info.rejected.length > 0) {
            console.warn("Some recipients were rejected:", info.rejected);
        }
    } catch (error) {
        switch (error.code) {
            case "ECONNECTION":
            case "ETIMEDOUT":
                console.error("Network error - retry later: ", error.message);
                break;
            case "EAUTH":
                console.error("Authentication failed: ", error.message);
                break;
            case "EENVELOPE":
                console.error(
                    "Invalid envelope: ",
                    error.message,
                    error.rejected || []
                );
                break;
            default:
                console.error("Send failed:", error.message);
        }
        throw new ApiError(500, `Failed to send email: ${error.message}`);
    }
};

export { sendEmail };
