const fs = require("fs/promises");
const sharp = require("sharp");

const MAX_IMAGE_PIXELS = 25_000_000;
const MAX_IMAGE_DIMENSION = 10_000;
const MAX_OUTPUT_DIMENSION = 2_560;

const supportedImageTypes = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
};

class ImageValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ImageValidationError";
        this.statusCode = 400;
    }
}

class ImageProcessingError extends Error {
    constructor() {
        super("Image processing is temporarily unavailable. Please try again.");
        this.name = "ImageProcessingError";
        this.statusCode = 500;
    }
}

async function optimizeImage(inputPath, outputPath, declaredMimeType) {
    const image = sharp(inputPath, {
        limitInputPixels: MAX_IMAGE_PIXELS,
        failOn: "warning",
        sequentialRead: true,
        animated: true,
    });
    let metadata;
    try {
        metadata = await image.metadata();
    } catch {
        throw new ImageValidationError("The uploaded file is not a supported, valid image.");
    }
    const expectedFormat = supportedImageTypes[declaredMimeType];
    const matchesDeclaredFormat = expectedFormat === "avif"
        ? metadata.format === "heif" && metadata.compression === "av1"
        : metadata.format === expectedFormat;
    if (!expectedFormat || !matchesDeclaredFormat) {
        throw new ImageValidationError("The uploaded file type does not match its image content.");
    }
    if (!metadata.width || !metadata.height
        || metadata.width > MAX_IMAGE_DIMENSION
        || metadata.height > MAX_IMAGE_DIMENSION) {
        throw new ImageValidationError("Images must be 10,000 pixels or smaller on each side.");
    }
    if ((metadata.pages || 1) > 1) {
        throw new ImageValidationError("Animated images are not supported. Upload a still image instead.");
    }

    let optimizedBuffer;
    try {
        const { data } = await image
            .rotate()
            .resize({
                width: MAX_OUTPUT_DIMENSION,
                height: MAX_OUTPUT_DIMENSION,
                fit: "inside",
                withoutEnlargement: true,
            })
            .webp({ quality: 82, effort: 4, smartSubsample: true })
            .toBuffer({ resolveWithObject: true });
        optimizedBuffer = data;
    } catch {
        throw new ImageValidationError("The uploaded file is not a supported, valid image.");
    }
    try {
        await fs.writeFile(outputPath, optimizedBuffer, { flag: "wx" });
    } catch (error) {
        console.error("Could not write an optimized image:", error.message);
        throw new ImageProcessingError();
    }
    return outputPath;
}

module.exports = {
    MAX_IMAGE_DIMENSION,
    MAX_IMAGE_PIXELS,
    MAX_OUTPUT_DIMENSION,
    ImageProcessingError,
    ImageValidationError,
    optimizeImage,
    supportedImageTypes,
};
