import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (mode === "production" && !env.VITE_API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL must be configured for production builds.");
  }
  if (mode === "production" && !env.VITE_GOOGLE_CLIENT_ID) {
    throw new Error("VITE_GOOGLE_CLIENT_ID must be configured for production builds.");
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
    },
  };
});
