import apiClient from "./client";

/**
 * Matches routes/booking.js exactly (mounted at /bookings per confirmed backend structure).
 *   POST   /bookings              (auth) body: { listingId, checkIn, checkOut } -> { message, booking }
 *   GET    /bookings/my-bookings  (auth) -> { bookings }  (listingId populated with the full listing)
 *   GET    /bookings/:id          (auth, owner-only) -> { booking }
 *   PUT    /bookings/:id          (auth, owner-only) body: { listingId, checkIn, checkOut } -> { message, booking }
 *   DELETE /bookings/:id          (auth, owner-only) soft-cancels -> { message, booking }
 *
 * Booking fields, straight from models/Booking.js:
 *   listingId, userId, checkIn, checkOut, status(pending_payment/confirmed/cancelled),
 *   paymentStatus(unpaid/paid/failed/refunded), totalAmount, currency, paymentReference
 *   (no guests field — the backend has nowhere to store it, so it's never sent)
 *
 * ⚠️ Known backend issue: the POST /bookings handler never sets totalAmount, which the
 * Booking schema requires. Creation will currently fail with a validation error until
 * that's fixed on the backend. We don't work around it here — errors are surfaced as-is.
 */

export async function createBooking({ listingId, checkIn, checkOut, rooms = 1 }) {
  const { data } = await apiClient.post("/bookings", { listingId, checkIn, checkOut, rooms });
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
