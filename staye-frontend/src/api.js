import { API_ROOT_URL } from "./api/baseUrl";

const API_BASE_URL = API_ROOT_URL.replace(/\/api\/?$/, "");

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

export function getImageUrl(imageUrl, width = 1600) {
  if (!imageUrl) {
    return imageUrl;
  }

  try {
    const parsedUrl = new URL(imageUrl);
    if (parsedUrl.pathname.startsWith("/uploads/")) {
      return `${API_BASE_URL}${parsedUrl.pathname}`;
    }
  } catch {
    // Relative paths and external image URLs are handled below.
  }

  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    try {
      const parsedUrl = new URL(imageUrl);
      if (parsedUrl.hostname === "res.cloudinary.com" && parsedUrl.pathname.includes("/image/upload/")) {
        const requestedWidth = Number(width);
        const safeWidth = Number.isFinite(requestedWidth)
          ? Math.max(1, Math.min(Math.round(requestedWidth), 2560))
          : 1600;
        parsedUrl.pathname = parsedUrl.pathname.replace(
          "/image/upload/",
          `/image/upload/f_auto,q_auto,w_${safeWidth},c_limit/`,
        );
        return parsedUrl.href;
      }
    } catch {
      // Return the original URL if it cannot be parsed.
    }
    return imageUrl;
  }
  return `${API_BASE_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
}

export async function uploadImages(files, token, kind = "listing") {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  formData.append("kind", kind);

  const response = await fetch(`${API_BASE_URL}/api/uploads/images`, {
    method: "POST",
    headers: authHeaders(token),
    body: formData,
  });
  if (!response.ok) throw await getApiError(response, "Image upload failed.");
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
