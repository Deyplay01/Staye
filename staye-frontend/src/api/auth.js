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

export async function loginAdminWithGoogle(googleToken) {
  const { data } = await apiClient.post("/admin/google/login", { credential: googleToken });
  return data;
}

export async function registerAdminWithGoogle(googleToken, registrationKey) {
  const { data } = await apiClient.post("/admin/google/register", {
    credential: googleToken,
    registrationKey,
  });
  return data;
}

export async function loginUser({ email, password }) {
  const { data } = await apiClient.post("/auth/login", { email, password });
  return data;
}

export async function registerAdmin({
  name,
  email,
  password,
  registrationKey,
}) {
  const { data } = await apiClient.post("/admin/register", {
    name,
    email,
    password,
    registrationKey,
  });
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
