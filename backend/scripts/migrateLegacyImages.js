const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

if (process.env.NODE_ENV !== "production") {
    const dns = require("dns");
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
}

const uploadDirectory = require("../src/utils/uploadDirectory");
const { configureCloudinary } = require("../src/utils/cloudinary");
const {
    createLegacyImagePublicId,
    resolveLegacyImagePath,
} = require("../src/utils/legacyImageMigration");

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const isExecute = process.argv.includes("--execute");
const unknownArguments = process.argv.slice(2).filter((argument) => argument !== "--execute");
const migratedUrls = new Map();
let migratedReferences = 0;
let missingFiles = 0;
let failedFiles = 0;

async function hasSupportedImageSignature(filePath) {
    const handle = await fs.promises.open(filePath, "r");
    try {
        const header = Buffer.alloc(12);
        const { bytesRead } = await handle.read(header, 0, header.length, 0);
        const bytes = header.subarray(0, bytesRead);
        return (
            (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
            || bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
            || (bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP")
            || ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))
        );
    } finally {
        await handle.close();
    }
}

async function validateLegacyImage(filePath) {
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile()) throw new Error("the legacy image path is not a file");
    if (stats.size > MAX_IMAGE_BYTES) throw new Error("image exceeds the 20 MB migration limit");
    if (!(await hasSupportedImageSignature(filePath))) throw new Error("file is not a supported JPEG, PNG, WebP, or GIF image");
}

async function uploadLegacyImage(filePath, cloudinary) {
    await validateLegacyImage(filePath);
    const publicId = createLegacyImagePublicId(filePath, uploadDirectory);
    const result = await cloudinary.uploader.upload(filePath, {
        folder: "staye/migrated",
        public_id: path.posix.basename(publicId),
        resource_type: "image",
        overwrite: true,
        invalidate: true,
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    });
    return result.secure_url;
}

async function getCloudinaryUrl(imageUrl, cloudinary) {
    const filePath = resolveLegacyImagePath(imageUrl, uploadDirectory);
    if (!filePath) return null;

    if (!migratedUrls.has(filePath)) {
        migratedUrls.set(filePath, uploadLegacyImage(filePath, cloudinary));
    }
    try {
        return await migratedUrls.get(filePath);
    } catch (error) {
        migratedUrls.delete(filePath);
        throw error;
    }
}

async function migrateImageArray(collection, collectionName, cloudinary) {
    const cursor = collection.find(
        { images: { $exists: true } },
        { projection: { images: 1 } },
    );
    for await (const document of cursor) {
        if (!Array.isArray(document.images)) continue;
        const updatedImages = [...document.images];
        let changed = false;

        for (let index = 0; index < document.images.length; index += 1) {
            const oldUrl = document.images[index];
            if (!resolveLegacyImagePath(oldUrl, uploadDirectory)) continue;

            const filePath = resolveLegacyImagePath(oldUrl, uploadDirectory);
            try {
                if (!isExecute) {
                    await validateLegacyImage(filePath);
                    console.log(`[dry run] ${collectionName}/${document._id}: ${oldUrl}`);
                    migratedReferences += 1;
                    continue;
                }

                const cloudinaryUrl = await getCloudinaryUrl(oldUrl, cloudinary);
                if (!cloudinaryUrl) continue;
                updatedImages[index] = cloudinaryUrl;
                changed = true;
                migratedReferences += 1;
            } catch (error) {
                if (error.code === "ENOENT") {
                    missingFiles += 1;
                    console.error(`Missing legacy image for ${collectionName}/${document._id}: ${oldUrl}`);
                } else {
                    failedFiles += 1;
                    console.error(`Could not migrate ${collectionName}/${document._id} image ${oldUrl}: ${error.message}`);
                }
            }
        }

        if (changed) {
            const result = await collection.updateOne(
                { _id: document._id, images: document.images },
                { $set: { images: updatedImages } },
            );
            if (result.matchedCount !== 1) {
                throw new Error(`Image references changed during migration for ${collectionName}/${document._id}; rerun after reviewing the record.`);
            }
        }
    }
}

async function migrateProfileAvatars(collection, cloudinary) {
    const cursor = collection.find(
        { avatar: { $type: "string", $ne: "" } },
        { projection: { avatar: 1 } },
    );
    for await (const document of cursor) {
        const oldUrl = document.avatar;
        const filePath = resolveLegacyImagePath(oldUrl, uploadDirectory);
        if (!filePath) continue;

        try {
            if (!isExecute) {
                await validateLegacyImage(filePath);
                console.log(`[dry run] profiles/${document._id}: ${oldUrl}`);
                migratedReferences += 1;
                continue;
            }

            const cloudinaryUrl = await getCloudinaryUrl(oldUrl, cloudinary);
            if (!cloudinaryUrl) continue;
            const result = await collection.updateOne(
                { _id: document._id, avatar: oldUrl },
                { $set: { avatar: cloudinaryUrl } },
            );
            if (result.matchedCount !== 1) {
                throw new Error(`Avatar changed during migration for profile ${document._id}; rerun after reviewing the record.`);
            }
            migratedReferences += 1;
        } catch (error) {
            if (error.code === "ENOENT") {
                missingFiles += 1;
                console.error(`Missing legacy avatar for profile ${document._id}: ${oldUrl}`);
            } else {
                failedFiles += 1;
                console.error(`Could not migrate profile ${document._id} avatar: ${error.message}`);
            }
        }
    }
}

async function migrateLegacyImages() {
    if (unknownArguments.length) {
        throw new Error(`Unknown argument(s): ${unknownArguments.join(", ")}. Use --execute to write changes.`);
    }
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI must be configured.");
    }
    if (isExecute && (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
        throw new Error("Cloudinary credentials must be configured when using --execute.");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    try {
        console.log(`Legacy image migration ${isExecute ? "EXECUTION" : "dry run"}; local files: ${uploadDirectory}`);
        const cloudinary = isExecute ? configureCloudinary() : null;
        const database = mongoose.connection.db;
        await migrateImageArray(database.collection("listings"), "listings", cloudinary);
        await migrateImageArray(database.collection("rooms"), "rooms", cloudinary);
        await migrateProfileAvatars(database.collection("profiles"), cloudinary);
        console.log(`Migration scan complete: ${migratedReferences} reference(s) ${isExecute ? "updated" : "ready"}, ${missingFiles} missing file(s), ${failedFiles} failed file(s).`);
        if (missingFiles || failedFiles) process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

migrateLegacyImages().catch(async (error) => {
    console.error("Legacy image migration failed:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exitCode = 1;
});
