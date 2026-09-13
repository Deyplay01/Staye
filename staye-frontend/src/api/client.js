import axios from "axios";

/**
 * Points at the real Express backend confirmed from the actual route files.
 * Set VITE_API_BASE_URL in .env if it runs anywhere other than localhost:5000.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the logged-in user's JWT to every outgoing request.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("staye_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is invalid/expired, clear it so the app knows to re-prompt login.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.message;
    const tokenExpired = error?.response?.status === 401
      || (error?.response?.status === 400 && message === "Invalid token.");
    if (tokenExpired) {
      localStorage.removeItem("staye_token");
      localStorage.removeItem("staye_user");
      window.dispatchEvent(new Event("staye:session-expired"));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
