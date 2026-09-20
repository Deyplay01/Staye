import apiClient from "./client";

export async function createBooking({ listingId, roomId, checkIn, checkOut, rooms = 1 }) {
  const { data } = await apiClient.post("/bookings", { listingId, roomId, checkIn, checkOut, rooms });
  return data.booking;
}

export async function fetchMyBookings() {
  const { data } = await apiClient.get("/bookings/my-bookings");
  return data.bookings;
}

export async function fetchBookingById(id) {
  const { data } = await apiClient.get(`/bookings/${id}`);
  return data.booking;
}

export async function updateBookingDates(id, { listingId, checkIn, checkOut }) {
  const { data } = await apiClient.put(`/bookings/${id}`, { listingId, checkIn, checkOut });
  return data.booking;
}

export async function cancelBooking(id) {
  const { data } = await apiClient.delete(`/bookings/${id}`);
  return data.booking;
}

export async function fetchBookingDashboard(params = {}) {
  const { data } = await apiClient.get("/bookings/dashboard", { params });
  return data;
}

export async function fetchAdminBookings(params = {}) {
  const { data } = await apiClient.get("/bookings/admin-bookings", { params });
  return data;
}

export async function verifyAdminBooking(id) {
  const { data } = await apiClient.get(`/bookings/admin-bookings/${encodeURIComponent(id)}/verify`);
  return data;
}

