import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import { fetchMyBookings, cancelBooking } from "../../api/bookings";
import { formatDateLong } from "../../utils/date";
import { formatPrice } from "../../utils/price";
import { Eye, FileText, Filter, Search, RotateCcw } from "lucide-react";

// The real Booking schema only has these three statuses — no "Completed".
const STATUS_BADGE = {
  pending_payment: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export default function MyBookingsPage() {
  const [searchParams] = useSearchParams();
  const listingFilter = searchParams.get("listingId") || "";
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    paymentStatus: "",
    fromDate: "",
    toDate: "",
    sortBy: "createdAt",
    order: "desc",
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchMyBookings();
      setBookings(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't load your bookings.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCancel(id) {
    setCancellingId(id);
    try {
      await cancelBooking(id);
      setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: "cancelled" } : b)));
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't cancel that booking.");
    } finally {
      setCancellingId(null);
    }
  }

  const visibleBookings = [...bookings]
    .filter((booking) => {
      const listing = typeof booking.listingId === "object" ? booking.listingId : null;
      const room = typeof booking.roomId === "object" ? booking.roomId : null;
      const bookingListingId = typeof booking.listingId === "object" ? booking.listingId?._id : booking.listingId;
      const searchableText = `${listing?.title || ""} ${listing?.location || ""} ${room?.name || ""}`.toLowerCase();
      return (!listingFilter || bookingListingId === listingFilter)
        && (!filters.search || searchableText.includes(filters.search.toLowerCase()))
        && (!filters.status || booking.status === filters.status)
        && (!filters.paymentStatus || booking.paymentStatus === filters.paymentStatus)
        && (!filters.fromDate || booking.checkIn?.slice(0, 10) >= filters.fromDate)
        && (!filters.toDate || booking.checkIn?.slice(0, 10) <= filters.toDate);
    })
    .sort((first, second) => {
      const firstValue = new Date(first[filters.sortBy]).getTime();
      const secondValue = new Date(second[filters.sortBy]).getTime();
      return filters.order === "asc" ? firstValue - secondValue : secondValue - firstValue;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">My bookings</h1>
            {listingFilter && <p className="mt-1 text-sm text-ink-500">Showing bookings for the selected listing. <Link to="/my-bookings" className="font-semibold text-brand hover:text-brand-hover">Show all bookings</Link></p>}
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">Back to home</Button>
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-sm border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner label="Loading your bookings..." />
        ) : bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="Once you book a stay, it'll show up here."
            action={
              <Link to="/" className="text-sm font-semibold text-brand hover:underline">
                Browse listings
              </Link>
            }
          />
        ) : (
          <>
            <div className="mb-5 rounded-2xl border border-ink-300 bg-white p-4 shadow-card sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-bold text-navy-900"><Filter className="h-4 w-4 text-brand" aria-hidden="true" /> Refine bookings</h2>
                <button type="button" onClick={() => setFilters({ search: "", status: "", paymentStatus: "", fromDate: "", toDate: "", sortBy: "createdAt", order: "desc" })} className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover">
                  <RotateCcw className="h-3 w-3" aria-hidden="true" /> Reset filters
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex items-center gap-2 rounded-xl border border-ink-300 px-3 py-2.5 sm:col-span-2 lg:col-span-2">
                  <Search className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
                  <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search by stay or location" className="w-full text-sm outline-none" />
                </label>
                <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="rounded-xl border border-ink-300 px-3 py-2.5 text-sm">
                  <option value="">Booking status</option><option value="pending_payment">Pending payment</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option>
                </select>
                <select value={filters.paymentStatus} onChange={(event) => setFilters({ ...filters, paymentStatus: event.target.value })} className="rounded-xl border border-ink-300 px-3 py-2.5 text-sm">
                  <option value="">Payment status</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
                </select>
                <label className="text-xs text-ink-500">Check-in from<input type="date" value={filters.fromDate} onChange={(event) => setFilters({ ...filters, fromDate: event.target.value })} className="mt-1 w-full rounded-xl border border-ink-300 px-3 py-2 text-sm text-ink-900" /></label>
                <label className="text-xs text-ink-500">Check-in to<input type="date" value={filters.toDate} onChange={(event) => setFilters({ ...filters, toDate: event.target.value })} className="mt-1 w-full rounded-xl border border-ink-300 px-3 py-2 text-sm text-ink-900" /></label>
                <select value={filters.sortBy} onChange={(event) => setFilters({ ...filters, sortBy: event.target.value })} className="rounded-xl border border-ink-300 px-3 py-2.5 text-sm">
                  <option value="createdAt">Sort: date created</option><option value="updatedAt">Date modified</option><option value="checkIn">Check-in date</option><option value="checkOut">Check-out date</option>
                </select>
                <select value={filters.order} onChange={(event) => setFilters({ ...filters, order: event.target.value })} className="rounded-xl border border-ink-300 px-3 py-2.5 text-sm">
                  <option value="desc">Newest first</option><option value="asc">Oldest first</option>
                </select>
              </div>
              <p className="mt-3 text-xs text-ink-500">Showing {visibleBookings.length} of {bookings.length} bookings</p>
            </div>
            {visibleBookings.length === 0 ? <EmptyState title="No bookings match this filter" /> : <div className="space-y-4">
            {visibleBookings.map((booking) => {
              const listing = typeof booking.listingId === "object" ? booking.listingId : null;
              return (
                <div key={booking._id} className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{listing?.title || "Listing"}</p>
                      <p className="text-sm text-ink-500">{listing?.location}</p>
                      <p className="mt-1 text-sm text-ink-700">
                        {booking.roomId?.name || "Room"} · {formatDateLong(booking.checkIn)} → {formatDateLong(booking.checkOut)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge status={booking.status === "confirmed" ? "Confirmed" : booking.status === "cancelled" ? "Cancelled" : "Pending"}>
                        {STATUS_BADGE[booking.status] || booking.status}
                      </Badge>
                      {typeof booking.totalAmount === "number" && (
                        <p className="mt-2 font-bold text-ink-900">{formatPrice(booking.totalAmount)}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-300 pt-3">
                    <Link to={`/confirmation/${booking._id}`}>
                      <Button size="sm" variant="outline"><Eye className="h-4 w-4" aria-hidden="true" /> View booking</Button>
                    </Link>
                    {booking.paymentStatus === "paid" && (
                      <Link to={`/receipt/${booking._id}`}>
                        <Button size="sm"><FileText className="h-4 w-4" aria-hidden="true" /> View receipt</Button>
                      </Link>
                    )}
                  </div>

                  {booking.status !== "cancelled" && (
                    <div className="mt-3 border-t border-ink-300 pt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cancellingId === booking._id}
                        onClick={() => handleCancel(booking._id)}
                      >
                        {cancellingId === booking._id ? "Cancelling..." : "Cancel booking"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
            </div>}
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
