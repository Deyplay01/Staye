const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const sharp = require("sharp");
const {
    ImageValidationError,
    optimizeImage,
} = require("../src/utils/imageProcessing");

async function createTestDirectory(t) {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "staye-image-test-"));
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    return directory;
}

test("re-encodes large JPEGs as resized, metadata-free WebP", async (t) => {
    const directory = await createTestDirectory(t);
    const inputPath = path.join(directory, "photo.upload");
    const outputPath = path.join(directory, "optimized.webp");
    const input = await sharp({
        create: {
            width: 3000,
            height: 1500,
            channels: 3,
            background: { r: 20, g: 80, b: 140 },
        },
    }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    await fs.writeFile(inputPath, input);

    await optimizeImage(inputPath, outputPath, "image/jpeg");

    const optimizedImage = await fs.readFile(outputPath);
    const metadata = await sharp(optimizedImage).metadata();
    assert.equal(metadata.format, "webp");
    assert.deepEqual([metadata.width, metadata.height], [1280, 2560]);
    assert.equal(metadata.orientation, undefined);
    assert.ok(optimizedImage.length < input.length);
});

test("rejects a MIME type that does not match the actual image", async (t) => {
    const directory = await createTestDirectory(t);
    const inputPath = path.join(directory, "photo.upload");
    const outputPath = path.join(directory, "optimized.webp");
    await fs.writeFile(inputPath, await sharp({
        create: {
            width: 4,
            height: 4,
            channels: 3,
            background: { r: 255, g: 0, b: 0 },
        },
    }).png().toBuffer());

    await assert.rejects(
        optimizeImage(inputPath, outputPath, "image/jpeg"),
        (error) => error instanceof ImageValidationError && /does not match/.test(error.message),
    );
});

test("accepts AVIF input and normalizes it to WebP", async (t) => {
    const directory = await createTestDirectory(t);
    const inputPath = path.join(directory, "photo.upload");
    const outputPath = path.join(directory, "optimized.webp");
    await fs.writeFile(inputPath, await sharp({
        create: {
            width: 16,
            height: 16,
            channels: 3,
            background: { r: 0, g: 120, b: 220 },
        },
    }).avif().toBuffer());

    await optimizeImage(inputPath, outputPath, "image/avif");

    const optimizedImage = await fs.readFile(outputPath);
    assert.equal((await sharp(optimizedImage).metadata()).format, "webp");
});

test("rejects corrupt image data", async (t) => {
    const directory = await createTestDirectory(t);
    const inputPath = path.join(directory, "photo.upload");
    const outputPath = path.join(directory, "optimized.webp");
    await fs.writeFile(inputPath, "not an image");

    await assert.rejects(
        optimizeImage(inputPath, outputPath, "image/png"),
        (error) => error instanceof ImageValidationError && /valid image/.test(error.message),
    );
});

test("rejects images with a side longer than 10,000 pixels", async (t) => {
    const directory = await createTestDirectory(t);
    const inputPath = path.join(directory, "photo.upload");
    const outputPath = path.join(directory, "optimized.webp");
    await fs.writeFile(inputPath, await sharp({
        create: {
            width: 10_001,
            height: 1,
            channels: 3,
            background: { r: 0, g: 0, b: 0 },
        },
    }).png().toBuffer());

    await assert.rejects(
        optimizeImage(inputPath, outputPath, "image/png"),
        (error) => error instanceof ImageValidationError && /10,000 pixels/.test(error.message),
    );
});
