const test = require("node:test");
const assert = require("node:assert/strict");
const { verifyGoogleCredential } = require("../src/utils/googleAuth");

test("reports missing server Google OAuth configuration", async () => {
    const previousClientId = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;

    try {
        await assert.rejects(verifyGoogleCredential("credential"), {
            statusCode: 503,
            message: "Google authentication is not configured on the server.",
        });
    } finally {
        if (previousClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
        else process.env.GOOGLE_CLIENT_ID = previousClientId;
    }
});

test("rejects missing credentials without contacting Google", async () => {
    const previousClientId = process.env.GOOGLE_CLIENT_ID;
    process.env.GOOGLE_CLIENT_ID = "test-client-id";

    try {
        await assert.rejects(verifyGoogleCredential(""), {
            statusCode: 400,
            message: "Google credential is required.",
        });
    } finally {
        if (previousClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
        else process.env.GOOGLE_CLIENT_ID = previousClientId;
    }
});
