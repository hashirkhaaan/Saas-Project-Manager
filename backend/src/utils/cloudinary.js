import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        console.log("File uploaded to cloudinary, response:  ", response);

        fs.unlinkSync(localFilePath);
    } catch (error) {
        fs.unlinkSync(localFilePath);

        return null;
    }
};

const deleteZombieFilesOnCloudinary = async (publicId, resource_type) => {
    try {
        if (!publicId) return null;

        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type,
        });

        if (response.result !== "ok") {
            console.warn(
                `Cloudinary Delete Warning: ${publicId} - ${response.result}`
            );
        }

        return response;
    } catch (error) {
        console.error("Cloudinary Delete Failed:", error?.message);
        return null;
    }
};

export { uploadOnCloudinary, deleteZombieFilesOnCloudinary };
