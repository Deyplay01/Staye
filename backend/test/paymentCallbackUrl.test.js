const test = require("node:test");
const assert = require("node:assert/strict");
const { resolvePaymentCallbackUrl } = require("../src/utils/paymentCallbackUrl");

test("uses the configured production callback when it is HTTPS", () => {
    assert.equal(
        resolvePaymentCallbackUrl({
            callbackUrl: "https://staye.vercel.app/payment/callback",
            frontendUrl: "https://staye.vercel.app",
            isProduction: true,
        }),
        "https://staye.vercel.app/payment/callback",
    );
});

test("replaces a localhost production callback with the frontend callback", () => {
    assert.equal(
        resolvePaymentCallbackUrl({
            callbackUrl: "http://localhost:5173/payment/callback",
            frontendUrl: "https://staye.vercel.app",
            isProduction: true,
        }),
        "https://staye.vercel.app/payment/callback",
    );
});

test("builds the production callback from the first configured frontend origin", () => {
    assert.equal(
        resolvePaymentCallbackUrl({
            frontendUrl: "https://staye.vercel.app,https://preview.staye.vercel.app",
            isProduction: true,
        }),
        "https://staye.vercel.app/payment/callback",
    );
});

test("does not produce a localhost callback in production without a valid frontend URL", () => {
    assert.equal(
        resolvePaymentCallbackUrl({
            callbackUrl: "http://localhost:5173/payment/callback",
            frontendUrl: "http://localhost:5173",
            isProduction: true,
        }),
        null,
    );
});

test("rejects HTTPS loopback callbacks in production", () => {
    assert.equal(
        resolvePaymentCallbackUrl({
            callbackUrl: "https://[::1]/payment/callback",
            frontendUrl: "https://staye.vercel.app",
            isProduction: true,
        }),
        "https://staye.vercel.app/payment/callback",
    );
});

test("keeps localhost callbacks available for local development", () => {
    assert.equal(
        resolvePaymentCallbackUrl({
            frontendUrl: "http://localhost:5173",
            isProduction: false,
        }),
        "http://localhost:5173/payment/callback",
    );
});
