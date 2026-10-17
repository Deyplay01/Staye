function parseCallbackUrl(value, isProduction) {
    if (!value) return null;

    try {
        const url = new URL(value);
        const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
        const isLoopback = hostname === "localhost"
            || hostname.endsWith(".localhost")
            || hostname === "::1"
            || /^127(?:\.\d{1,3}){3}$/.test(hostname);

        if (!["http:", "https:"].includes(url.protocol)) return null;
        if (isProduction && (url.protocol !== "https:" || isLoopback)) return null;
        return url;
    } catch {
        return null;
    }
}

function resolvePaymentCallbackUrl({ callbackUrl, frontendUrl, isProduction }) {
    const configuredCallback = parseCallbackUrl(callbackUrl, isProduction);
    if (configuredCallback) return configuredCallback.toString();

    const frontendOrigin = frontendUrl?.split(",")[0]?.trim();
    const frontendCallback = parseCallbackUrl(frontendOrigin, isProduction);
    if (frontendCallback) {
        frontendCallback.pathname = "/payment/callback";
        frontendCallback.search = "";
        frontendCallback.hash = "";
        return frontendCallback.toString();
    }

    if (!isProduction) return "http://localhost:5173/payment/callback";
    return null;
}

module.exports = { resolvePaymentCallbackUrl };
