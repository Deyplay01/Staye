import apiClient from "./client";

export async function fetchManagedUsers(params = {}, config = {}) {
  const { data } = await apiClient.get("/admin/users", { params, ...config });
  return data;
}

export async function fetchUserModerationHistory(userId, config = {}) {
  const { data } = await apiClient.get(`/admin/users/${userId}/moderation-history`, config);
  return data.history;
}

export async function setUserFlag(userId, isFlagged, reason = "", config = {}) {
  const { data } = await apiClient.patch(`/admin/users/${userId}/flag`, { isFlagged, reason }, config);
  return data;
}

export async function setUserBlocked(userId, blocked, reason = "", config = {}) {
  const { data } = await apiClient.patch(`/admin/users/${userId}/block`, { blocked, reason }, config);
  return data;
}

export async function fetchListingsForReview(config = {}) {
  const { data } = await apiClient.get("/admin/listings/review", { params: { status: "pending_review" }, ...config });
  return data.listings;
}

export async function reviewListing(listingId, decision, reason = "", config = {}) {
  const { data } = await apiClient.patch(`/admin/listings/${listingId}/review`, { decision, reason }, config);
  return data;
}
