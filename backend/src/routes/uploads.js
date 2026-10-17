const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/Authentication");
const { configureCloudinary } = require("../utils/cloudinary");

const router = express.Router();
const temporaryUploadDirectory = path.join(os.tmpdir(), "staye-cloudinary-uploads");
fs.mkdirSync(temporaryUploadDirectory, { recursive: true });
const imageExtensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

const upload = multer({
    storage: multer.diskStorage({
        destination: (_req, _file, callback) => callback(null, temporaryUploadDirectory),
        filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}.${imageExtensions[file.mimetype]}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    fileFilter: (_req, file, callback) => {
        if (!imageExtensions[file.mimetype]) {
            return callback(new Error("Only JPEG, PNG, WebP, and GIF images are allowed."));
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

async function hasValidImageSignature(file) {
    const handle = await fs.promises.open(file.path, "r");
    try {
        const header = Buffer.alloc(12);
        const { bytesRead } = await handle.read(header, 0, header.length, 0);
        if (bytesRead < 4) return false;
        const bytes = header.subarray(0, bytesRead);
        switch (file.mimetype) {
            case "image/jpeg":
                return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
            case "image/png":
                return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
            case "image/webp":
                return bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
            case "image/gif":
                return ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6));
            default:
                return false;
        }
    } finally {
        await handle.close();
    }
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
        if (totalSize > 20 * 1024 * 1024) {
            return res.status(413).json({ message: "The combined image upload must be 20 MB or less." });
        }

        for (const file of files) {
            if (!(await hasValidImageSignature(file))) {
                return res.status(400).json({ message: `${file.originalname} is not a valid ${file.mimetype} image.` });
            }
        }

        cloudinary = configureCloudinary();
        const folder = kind === "profile" ? "staye/profiles" : "staye/listings";
        for (const file of files) {
            const asset = await cloudinary.uploader.upload(file.path, {
                folder,
                resource_type: "image",
                unique_filename: true,
                overwrite: false,
                allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
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
        console.error("Cloudinary image upload failed:", error.message);
        return res.status(502).json({ message: "Image storage is temporarily unavailable. Please try again." });
    } finally {
        await removeTemporaryFiles(files);
    }
});

module.exports = router;
