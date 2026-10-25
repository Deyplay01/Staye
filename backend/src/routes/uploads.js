const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const { Transform, pipeline } = require("stream");
const authMiddleware = require("../middleware/Authentication");
const { configureCloudinary } = require("../utils/cloudinary");
const {
    ImageProcessingError,
    ImageValidationError,
    optimizeImage,
    supportedImageTypes,
} = require("../utils/imageProcessing");

const router = express.Router();
const temporaryUploadDirectory = path.join(os.tmpdir(), "staye-cloudinary-uploads");
fs.mkdirSync(temporaryUploadDirectory, { recursive: true });
const maxRequestSize = 20 * 1024 * 1024;
const storage = {
    _handleFile(req, file, callback) {
        const filename = `${crypto.randomUUID()}.upload`;
        const filePath = path.join(temporaryUploadDirectory, filename);
        let fileSize = 0;
        const enforceRequestSize = new Transform({
            transform(chunk, _encoding, done) {
                if ((req.uploadImageBytes || 0) + chunk.length > maxRequestSize) {
                    const error = new multer.MulterError("LIMIT_FILE_SIZE", file.fieldname);
                    error.message = "The combined image upload must be 20 MB or less.";
                    done(error);
                    return;
                }
                req.uploadImageBytes = (req.uploadImageBytes || 0) + chunk.length;
                fileSize += chunk.length;
                done(null, chunk);
            },
        });

        pipeline(file.stream, enforceRequestSize, fs.createWriteStream(filePath, { flags: "wx" }), (error) => {
            if (error) {
                fs.promises.unlink(filePath).catch((cleanupError) => {
                    if (cleanupError.code !== "ENOENT") {
                        console.error("Could not remove a partial image upload:", cleanupError.message);
                    }
                });
                callback(error);
                return;
            }
            callback(null, {
                destination: temporaryUploadDirectory,
                filename,
                path: filePath,
                size: fileSize,
            });
        });
    },
    _removeFile(_req, file, callback) {
        fs.unlink(file.path, callback);
    },
};
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 10, fields: 1, fieldSize: 100, parts: 11 },
    fileFilter: (_req, file, callback) => {
        if (!supportedImageTypes[file.mimetype]) {
            return callback(new Error("Only JPEG, PNG, WebP, and AVIF images are allowed."));
        }
        callback(null, true);
    },
});

function parseImageFiles(req, res, next) {
    upload.array("images", 10)(req, res, async (error) => {
        if (!error) return next();
        await removeTemporaryFiles(req.files || []);
        const isLimitError = error instanceof multer.MulterError
            && (["LIMIT_FILE_SIZE", "LIMIT_FILE_COUNT"].includes(error.code)
                || (error.code === "LIMIT_UNEXPECTED_FILE" && error.field === "images"));
        const status = isLimitError ? 413 : 400;
        return res.status(status).json({ message: error.message });
    });
}

async function removeTemporaryFiles(files) {
    const results = await Promise.allSettled(files.map((file) => fs.promises.unlink(file.path)));
    for (const result of results) {
        if (result.status === "rejected" && result.reason.code !== "ENOENT") {
            console.error("Could not remove a temporary image upload:", result.reason.message);
        }
    }
}

router.post("/images", authMiddleware, parseImageFiles, async (req, res) => {
    const files = req.files || [];
    const optimizedFiles = [];
    const uploadedAssets = [];
    let cloudinary;
    try {
        if (!files.length) {
            return res.status(400).json({ message: "At least one image is required." });
        }

        const kind = req.body.kind || (req.user.role === "guest" ? "profile" : "listing");
        if (!["profile", "listing"].includes(kind)) {
            return res.status(400).json({ message: "Image kind must be profile or listing." });
        }
        if (kind === "listing" && !["host", "admin"].includes(req.user.role)) {
            return res.status(403).json({ message: "Only hosts can upload listing images." });
        }

        const totalSize = files.reduce((total, file) => total + file.size, 0);
        if (totalSize > maxRequestSize) {
            return res.status(413).json({ message: "The combined image upload must be 20 MB or less." });
        }

        for (const file of files) {
            const optimizedFile = {
                path: path.join(temporaryUploadDirectory, `${crypto.randomUUID()}.webp`),
            };
            optimizedFiles.push(optimizedFile);
            await optimizeImage(file.path, optimizedFile.path, file.mimetype);
        }

        cloudinary = configureCloudinary();
        const folder = kind === "profile" ? "staye/profiles" : "staye/listings";
        for (const file of optimizedFiles) {
            const asset = await cloudinary.uploader.upload(file.path, {
                folder,
                resource_type: "image",
                unique_filename: true,
                overwrite: false,
                allowed_formats: ["webp"],
            });
            uploadedAssets.push({ url: asset.secure_url, publicId: asset.public_id });
        }

        return res.status(201).json({ images: uploadedAssets });
    } catch (error) {
        if (uploadedAssets.length && cloudinary) {
            const cleanupResults = await Promise.allSettled(
                uploadedAssets.map((asset) => cloudinary.uploader.destroy(asset.publicId, { invalidate: true })),
            );
            for (const result of cleanupResults) {
                if (result.status === "rejected") {
                    console.error("Could not roll back a Cloudinary upload:", result.reason.message);
                }
            }
        }
        if (error.statusCode === 503) {
            return res.status(503).json({ message: error.message });
        }
        if (error instanceof ImageValidationError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        if (error instanceof ImageProcessingError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error("Cloudinary image upload failed:", error.message);
        return res.status(502).json({ message: "Image storage is temporarily unavailable. Please try again." });
    } finally {
        await removeTemporaryFiles([...files, ...optimizedFiles]);
    }
});

module.exports = router;
