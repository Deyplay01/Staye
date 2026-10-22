import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import SkeletonBlock from "../../components/common/SkeletonBlock";
import FiltersDialog from "../../components/common/FiltersDialog";
import EmptyState from "../../components/common/EmptyState";
import Badge from "../../components/common/Badge";
import { fetchAdminBookings } from "../../api/bookings";
import { formatDateLong } from "../../utils/date";
import { formatPrice } from "../../utils/price";
import { Search } from "lucide-react";

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
    const controller = new AbortController();
    load(filters, { signal: controller.signal });
    return () => controller.abort();
  }, []);

  async function load(params = filters, config = {}) {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchAdminBookings(params, config);
      setBookings(data.bookings || []);
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError(err?.response?.data?.message || "Couldn't load bookings.");
      }
    } finally {
      if (!config.signal?.aborted) setIsLoading(false);
    }
  }

  function updateFilter(field, value) {
    const next = { ...filters, [field]: value };
    setFilters(next);
    load(next);
  }

  function resetFilters() {
    const next = { search: "", status: "", paymentStatus: "", fromDate: "", toDate: "", sortBy: "createdAt", order: "desc" };
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

      <div className="mb-5 flex justify-end">
        <FiltersDialog
          title="Filter bookings"
          description="Search and sort your guests’ reservations."
          activeCount={[filters.search, filters.status, filters.paymentStatus, filters.fromDate, filters.toDate].filter(Boolean).length}
          resultCount={visibleBookings.length}
          onReset={resetFilters}
          onApply={() => load(filters)}
          applyLabel="Apply filters"
        >
          <label className="flex items-center gap-2 rounded-xl border border-ink-300 px-3 py-2.5 sm:col-span-2">
            <Search className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
            <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search guest, stay, or location" className="w-full text-sm outline-none" />
          </label>
          <label className="block text-xs font-semibold text-ink-500">Booking status
            <select value={filters.status} onChange={(event) => updateFilter("status", event.target.value)} className="mt-1 block w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900"><option value="">All statuses</option><option value="pending_payment">Pending payment</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select>
          </label>
          <label className="block text-xs font-semibold text-ink-500">Payment status
            <select value={filters.paymentStatus} onChange={(event) => setFilters({ ...filters, paymentStatus: event.target.value })} className="mt-1 block w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900"><option value="">All payment statuses</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option></select>
          </label>
          <label className="block text-xs font-semibold text-ink-500">Check-in from<input type="date" value={filters.fromDate} onChange={(event) => setFilters({ ...filters, fromDate: event.target.value })} className="mt-1 block w-full rounded-xl border border-ink-300 px-3 py-2.5 text-sm font-normal text-ink-900" /></label>
          <label className="block text-xs font-semibold text-ink-500">Check-in to<input type="date" value={filters.toDate} onChange={(event) => setFilters({ ...filters, toDate: event.target.value })} className="mt-1 block w-full rounded-xl border border-ink-300 px-3 py-2.5 text-sm font-normal text-ink-900" /></label>
          <label className="block text-xs font-semibold text-ink-500">Sort by
            <select value={filters.sortBy} onChange={(event) => updateFilter("sortBy", event.target.value)} className="mt-1 block w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900"><option value="createdAt">Date created</option><option value="updatedAt">Date modified</option><option value="checkIn">Check-in date</option><option value="checkOut">Check-out date</option></select>
          </label>
          <label className="block text-xs font-semibold text-ink-500">Order
            <select value={filters.order} onChange={(event) => updateFilter("order", event.target.value)} className="mt-1 block w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900"><option value="desc">Newest first</option><option value="asc">Oldest first</option></select>
          </label>
        </FiltersDialog>
      </div>

      {error && <div className="mb-4 rounded-sm border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>}
      {isLoading ? <div className="space-y-3" aria-label="Loading bookings" aria-busy="true">{Array.from({ length: 4 }, (_, index) => <div key={index} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-ink-300 bg-white p-5 shadow-card"><div className="w-full space-y-2 sm:w-2/3"><SkeletonBlock className="h-5 w-1/2" /><SkeletonBlock className="h-4 w-2/3" /><SkeletonBlock className="h-4 w-5/6" /></div><div className="space-y-2"><SkeletonBlock className="h-6 w-24 rounded-full" /><SkeletonBlock className="h-5 w-20" /></div></div>)}</div> : visibleBookings.length === 0 ? <EmptyState title="No bookings found" description={bookings.length === 0 ? "Bookings will appear here when guests reserve your listings." : "Try changing your filters."} /> : (
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
