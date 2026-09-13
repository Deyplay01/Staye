const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getApiError(response, fallbackMessage) {
  try {
    const body = await response.json();
    return new Error(body.message || fallbackMessage);
  } catch {
    return new Error(fallbackMessage);
  }
}

export function getImageUrl(imageUrl) {
  if (!imageUrl || imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  return `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

export async function uploadImages(files, token) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const response = await fetch(`${API_BASE_URL}/api/uploads/images`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!response.ok) throw new Error("Image upload failed.");
  return response.json();
}

export async function initializePaystackPayment(bookingId, token) {
  const response = await fetch(`${API_BASE_URL}/api/payments/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ bookingId }),
  });
  if (!response.ok) throw await getApiError(response, "Could not initialize Paystack payment.");
  return response.json();
}

export async function verifyPaystackPayment(bookingId, reference, token) {
  const response = await fetch(`${API_BASE_URL}/api/payments/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ bookingId, reference }),
  });
  if (!response.ok) throw await getApiError(response, "Could not verify Paystack payment.");
  return response.json();
}

export async function refundPaystackPayment(bookingId, token) {
  const response = await fetch(`${API_BASE_URL}/api/payments/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(token) },
    body: JSON.stringify({ bookingId }),
  });
  if (!response.ok) throw await getApiError(response, "Could not refund this payment.");
  return response.json();
}
