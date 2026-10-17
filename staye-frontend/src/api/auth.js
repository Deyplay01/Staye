import apiClient from "./client";

export async function registerUser({ name, email, password }) {
  const { data } = await apiClient.post("/auth/register", {
    name,
    email,
    password,
  });
  return data;
}

export async function loginwithGoogle(googleToken) {
  const { data } = await apiClient.post("/auth/google/callback", {
    credential: googleToken,
  });
  return data;
}

export async function loginHostWithGoogle(googleToken) {
  const { data } = await apiClient.post("/admin/google/login", { credential: googleToken });
  return data;
}

export async function registerHostWithGoogle(googleToken) {
  const { data } = await apiClient.post("/admin/google/register", { credential: googleToken });
  return data;
}

export async function loginUser({ email, password }) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
}

export async function registerHost({ name, email, password }) {
  const { data } = await apiClient.post("/admin/register", {
    name,
    email,
    password,
  });
  return data;
}

export async function fetchProfile(config = {}) {
  const { data } = await apiClient.get("/profile", config);
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
