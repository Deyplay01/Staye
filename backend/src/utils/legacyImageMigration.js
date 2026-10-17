const crypto = require("crypto");
const path = require("path");

function resolveLegacyImagePath(imageUrl, uploadDirectory) {
    if (typeof imageUrl !== "string" || !imageUrl) return null;

    let pathname;
    try {
        pathname = new URL(imageUrl, "https://legacy-image.invalid").pathname;
        pathname = decodeURIComponent(pathname);
    } catch {
        return null;
    }

    if (!pathname.startsWith("/uploads/")) return null;

    const relativePath = pathname.slice("/uploads/".length).replace(/[\\/]/g, path.sep);
    const root = path.resolve(uploadDirectory);
    const filePath = path.resolve(root, relativePath);
    const pathFromRoot = path.relative(root, filePath);
    if (!pathFromRoot || pathFromRoot.startsWith(`..${path.sep}`) || pathFromRoot === ".." || path.isAbsolute(pathFromRoot)) {
        return null;
    }
    return filePath;
}

function createLegacyImagePublicId(filePath, uploadDirectory) {
    let relativePath = path.relative(path.resolve(uploadDirectory), path.resolve(filePath))
        .split(path.sep)
        .join("/");
    if (path.sep === "\\") relativePath = relativePath.toLowerCase();
    const digest = crypto.createHash("sha256").update(relativePath).digest("hex");
    return `staye/migrated/${digest}`;
}

module.exports = { resolveLegacyImagePath, createLegacyImagePublicId };
