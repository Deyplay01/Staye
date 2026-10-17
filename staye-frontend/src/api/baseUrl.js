const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const developmentFallback = import.meta.env.DEV ? "http://localhost:5000/api" : "";
export const API_ROOT_URL = configuredApiUrl || developmentFallback;

if (!API_ROOT_URL) {
  throw new Error("VITE_API_BASE_URL must be configured before building the production frontend.");
}

if (import.meta.env.PROD) {
  let apiUrl;
  try {
    apiUrl = new URL(API_ROOT_URL);
  } catch {
    throw new Error("VITE_API_BASE_URL must be an absolute HTTPS URL in production.");
  }

  const hostname = apiUrl.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  const isLoopback = hostname === "localhost"
    || hostname.endsWith(".localhost")
    || hostname === "::1"
    || /^127(?:\.\d{1,3}){3}$/.test(hostname);

  if (apiUrl.protocol !== "https:" || isLoopback) {
    throw new Error("VITE_API_BASE_URL must point to the deployed HTTPS API in production.");
  }
}
