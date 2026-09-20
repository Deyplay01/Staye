import apiClient from "./client";

export async function fetchNotifications(limit = 20) {
  const { data } = await apiClient.get("/notifications", { params: { limit } });
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await apiClient.patch(`/notifications/${id}/read`);
  return data.notification;
}

export async function markAllNotificationsRead() {
  const { data } = await apiClient.patch("/notifications/read-all");
  return data;
}
