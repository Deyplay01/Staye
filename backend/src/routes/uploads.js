const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/Authentication");

const router = express.Router();
const uploadDirectory = path.join(__dirname, "../../uploads");
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
    fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith("image/")) {
            return callback(new Error("Only image files are allowed."));
        }
        callback(null, true);
    },
});

router.post("/images", authMiddleware, (req, res) => {
    upload.array("images", 10)(req, res, (error) => {
        if (error) {
            return res.status(400).json({ message: error.message });
        }
        if (!req.files?.length) {
            return res.status(400).json({ message: "At least one image is required." });
        }

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const images = req.files.map((file) => ({
            filename: file.filename,
            url: `${baseUrl}/uploads/${file.filename}`,
        }));
        res.status(201).json({ images });
    });
});

module.exports = router;
