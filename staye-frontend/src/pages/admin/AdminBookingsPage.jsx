import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Badge from "../../components/common/Badge";
import { fetchAdminBookings } from "../../api/bookings";
import { formatDateLong } from "../../utils/date";
import { formatPrice } from "../../utils/price";
import { Filter, Search, RotateCcw } from "lucide-react";

const STATUS_LABELS = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "", paymentStatus: "", fromDate: "", toDate: "", sortBy: "createdAt", order: "desc" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load(filters);
  }, []);

  async function load(params = filters) {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAdminBookings(params);
      setBookings(data.bookings || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't load bookings.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateFilter(field, value) {
    const next = { ...filters, [field]: value };
    setFilters(next);
    load(next);
  }

  const visibleBookings = bookings.filter((booking) => {
    const listing = booking.listingId || {};
    const guest = booking.userId || {};
    const searchableText = `${listing.title || ""} ${listing.location || ""} ${guest.name || ""} ${guest.email || ""}`.toLowerCase();
    return (!filters.search || searchableText.includes(filters.search.toLowerCase()))
      && (!filters.paymentStatus || booking.paymentStatus === filters.paymentStatus)
      && (!filters.fromDate || booking.checkIn?.slice(0, 10) >= filters.fromDate)
      && (!filters.toDate || booking.checkIn?.slice(0, 10) <= filters.toDate);
  });

  return (
    <AdminLayout>
      <h1 className="mb-6 text-2xl font-bold text-ink-900">Bookings</h1>

      <div className="mb-5 rounded-2xl border border-ink-300 bg-white p-4 shadow-card sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-bold text-navy-900"><Filter className="h-4 w-4 text-brand" aria-hidden="true" /> Booking filters</h2>
          <button type="button" onClick={() => { const reset = { search: "", status: "", paymentStatus: "", fromDate: "", toDate: "", sortBy: "createdAt", order: "desc" }; setFilters(reset); load(reset); }} className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover">
            <RotateCcw className="h-3 w-3" aria-hidden="true" /> Reset filters
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex items-center gap-2 rounded-xl border border-ink-300 px-3 py-2.5 sm:col-span-2 lg:col-span-2">
            <Search className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
            <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search guest, stay, or location" className="w-full text-sm outline-none" />
          </label>
          <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className="rounded-xl border border-ink-300 px-3 py-2.5 text-sm"><option value="">Booking status</option><option value="pending_payment">Pending payment</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select>
          <select value={filters.paymentStatus} onChange={(event) => setFilters({ ...filters, paymentStatus: event.target.value })} className="rounded-xl border border-ink-300 px-3 py-2.5 text-sm"><option value="">Payment status</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select>
          <label className="text-xs text-ink-500">Check-in from<input type="date" value={filters.fromDate} onChange={(event) => setFilters({ ...filters, fromDate: event.target.value })} className="mt-1 w-full rounded-xl border border-ink-300 px-3 py-2 text-sm text-ink-900" /></label>
          <label className="text-xs text-ink-500">Check-in to<input type="date" value={filters.toDate} onChange={(event) => setFilters({ ...filters, toDate: event.target.value })} className="mt-1 w-full rounded-xl border border-ink-300 px-3 py-2 text-sm text-ink-900" /></label>
          <select value={filters.sortBy} onChange={(event) => updateFilter("sortBy", event.target.value)} className="rounded-xl border border-ink-300 px-3 py-2.5 text-sm"><option value="createdAt">Sort: date created</option><option value="updatedAt">Date modified</option><option value="checkIn">Check-in date</option><option value="checkOut">Check-out date</option></select>
          <select value={filters.order} onChange={(event) => updateFilter("order", event.target.value)} className="rounded-xl border border-ink-300 px-3 py-2.5 text-sm"><option value="desc">Newest first</option><option value="asc">Oldest first</option></select>
        </div>
        <p className="mt-3 text-xs text-ink-500">Showing {visibleBookings.length} of {bookings.length} bookings</p>
      </div>

      {error && <div className="mb-4 rounded-sm border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>}
      {isLoading ? <LoadingSpinner label="Loading bookings..." /> : visibleBookings.length === 0 ? <EmptyState title="No bookings found" description={bookings.length === 0 ? "Bookings will appear here when guests reserve your listings." : "Try changing your filters."} /> : (
        <div className="space-y-3">
          {visibleBookings.map((booking) => {
            const listing = booking.listingId || {};
            const guest = booking.userId || {};
            return (
              <div key={booking._id} className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-900">{listing.title || "Listing"}</p>
                    <p className="text-sm text-ink-500">{guest.name || guest.email || "Guest"} · {listing.location || ""}</p>
                    <p className="mt-1 text-sm text-ink-700">{booking.roomId?.name || "Room"} · {formatDateLong(booking.checkIn)} → {formatDateLong(booking.checkOut)} · {booking.rooms} room{booking.rooms !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <Badge status={booking.status === "confirmed" ? "Confirmed" : booking.status === "cancelled" ? "Cancelled" : "Pending"}>{STATUS_LABELS[booking.status] || booking.status}</Badge>
                    <p className="mt-2 font-bold text-ink-900">{formatPrice(booking.totalAmount)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
}
