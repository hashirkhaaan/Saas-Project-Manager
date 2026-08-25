import crypto from "crypto";
import fs from "fs/promises";
import multer from "multer";
import { fileTypeFromFile } from "file-type";

const storage = multer.diskStorage({
    destination: "./public/temp",
    filename: (req, file, cb) => {
        const extension = file.originalname.includes(".")
            ? `.${file.originalname.split(".").pop().toLowerCase()}`
            : "";

        cb(null, `${crypto.randomUUID()}${extension}`);
    },
});

const imageTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
]);

const attachmentTypes = new Set([
    ...imageTypes,
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
]);

const createUpload = (allowedTypes, files = 1) =>
    multer({
        storage,
        limits: {
            fileSize: 10 * 1024 * 1024,
            files,
        },
        fileFilter: (req, file, cb) => {
            if (!allowedTypes.has(file.mimetype)) {
                return cb(new Error("Unsupported file type"));
            }

            cb(null, true);
        },
    });

const uploadAvatar = createUpload(imageTypes, 1);
const uploadAttachments = createUpload(attachmentTypes, 5);

const validateFileSignatures = async (req, res, next) => {
    const files = req.file
        ? [req.file]
        : Array.isArray(req.files)
            ? req.files
            : [];

    try {
        for (const file of files) {
            const detectedType = await fileTypeFromFile(file.path);

            if (!detectedType || !attachmentTypes.has(detectedType.mime)) {
                throw new Error(`Invalid file type: ${file.originalname}`);
            }

            file.detectedMimeType = detectedType.mime;
        }

        next();
    } catch (error) {
        await Promise.all(
            files.map((file) => fs.unlink(file.path).catch(() => {}))
        );

        next(error);
    }
};

export {
    uploadAvatar,
    uploadAttachments,
    validateFileSignatures,
};