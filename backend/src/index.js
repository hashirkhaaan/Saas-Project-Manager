import "dotenv/config";
import connectDB from "./config/index.js";
import { app } from "./app.js";
import { validateEnvironment } from "./config/env.js";

validateEnvironment();

connectDB()
    .then(() => {
        app.on("error", (error) => {
            console.log("Error", error);
            throw error;
        });

        app.listen(process.env.PORT || 5000, () => {
            console.log(
                `Server is running at PORT ${process.env.PORT || 5000}`
            );
        });
    })
    .catch((error) => {
        console.log("MongoDB connection failed due to error:  ", error);
    });
