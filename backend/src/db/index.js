import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Database Connected!");
    });
    mongoose.connection.on("error", (error) => {
      console.log("Error after connection and error is ", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("Database Disconnected!");
    });

    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );
    console.log(
      "MONGODB Connected! and DB Host is:  ",
      connectionInstance.connection.host,
    );
  } catch (error) {
    console.log("Error while connecting the database and error is: ", error);
    process.exit(1);
  }
};

const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log(
      "MongoDB Connection closed gracefully through app termination!!",
    );
    process.exit(0);
  } catch (error) {
    console.log("Error while graceful termination and error is ", error);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

export default connectDB;
