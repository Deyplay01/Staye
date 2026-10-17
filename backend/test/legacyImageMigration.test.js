const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
    createLegacyImagePublicId,
    resolveLegacyImagePath,
} = require("../src/utils/legacyImageMigration");

const uploadDirectory = path.join(os.tmpdir(), "staye-migration-test-uploads");

test("resolves legacy upload paths from relative and absolute URLs", () => {
    const expectedPath = path.join(uploadDirectory, "room photo.jpg");
    assert.equal(resolveLegacyImagePath("/uploads/room%20photo.jpg", uploadDirectory), expectedPath);
    assert.equal(
        resolveLegacyImagePath("https://old.example.com/uploads/room%20photo.jpg?size=large", uploadDirectory),
        expectedPath,
    );
});

test("rejects paths outside legacy uploads and traversal attempts", () => {
    assert.equal(resolveLegacyImagePath("https://example.com/images/photo.jpg", uploadDirectory), null);
    assert.equal(resolveLegacyImagePath("/uploads/%2e%2e/secret.jpg", uploadDirectory), null);
});

test("creates deterministic Cloudinary IDs scoped to the upload directory", () => {
    const filePath = path.join(uploadDirectory, "room.jpg");
    assert.equal(
        createLegacyImagePublicId(filePath, uploadDirectory),
        createLegacyImagePublicId(filePath, uploadDirectory),
    );
    assert.match(createLegacyImagePublicId(filePath, uploadDirectory), /^staye\/migrated\/[a-f0-9]{64}$/);
});
