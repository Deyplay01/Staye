import apiClient from "./client";

/**
 * Matches routes/auth.js exactly — no invented fields.
 *   POST /auth/register  { name, email, password }  -> { token, user:{id,name,email} }
 *   POST /auth/login     { email, password }         -> { token, user:{id,name,isAdmin} }
 *
 * Note: the register response does NOT include isAdmin (the route doesn't send it),
 * so a freshly-registered account's isAdmin is treated as false until they log in again.
 */

export async function registerUser({ name, email, password }) {
  const { data } = await apiClient.post("/auth/register", { name, email, password });
  return data;
}

export async function loginUser({ email, password }) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
}

export async function registerAdmin({ name, email, password, registrationKey }) {
  const { data } = await apiClient.post("/admin/register", { name, email, password, registrationKey });
  return data;
}

export async function fetchProfile() {
  const { data } = await apiClient.get("/profile");
  return data.profile;
}

export async function updateProfile(updates) {
  const { data } = await apiClient.put("/profile", updates);
  return data.profile;
}

export function clearSession() {
  localStorage.removeItem("staye_token");
  localStorage.removeItem("staye_user");
}
