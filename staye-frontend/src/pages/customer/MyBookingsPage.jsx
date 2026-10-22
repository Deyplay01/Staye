import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import SkeletonBlock from "../../components/common/SkeletonBlock";
import FiltersDialog from "../../components/common/FiltersDialog";
import EmptyState from "../../components/common/EmptyState";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import HomeIconLink from "../../components/common/HomeIconLink";
import { fetchMyBookings, cancelBooking } from "../../api/bookings";
import { formatDateLong } from "../../utils/date";
import { formatPrice } from "../../utils/price";
import { CalendarDays, Eye, MapPin, Search } from "lucide-react";
import { getImageUrl } from "../../api";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80";

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
  const activeFilterCount = [filters.search, filters.status, filters.paymentStatus, filters.fromDate, filters.toDate].filter(Boolean).length;

  function resetFilters() {
    setFilters({ search: "", status: "", paymentStatus: "", fromDate: "", toDate: "", sortBy: "createdAt", order: "desc" });
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">My bookings</h1>
            <p className="mt-1 text-sm text-ink-500">Manage your reservations and stay details.</p>
            {listingFilter && <p className="mt-1 text-sm text-ink-500">Showing bookings for the selected listing. <Link to="/my-bookings" className="font-semibold text-brand hover:text-brand-hover">Show all bookings</Link></p>}
          </div>
          <HomeIconLink />
        </div>

        {error && (
          <div className="mb-4 rounded-sm border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4" aria-label="Loading your bookings" aria-busy="true">
            {Array.from({ length: 3 }, (_, index) => (
              <article key={index} className="overflow-hidden rounded-2xl border border-ink-300 bg-white shadow-card sm:flex sm:gap-5 sm:p-4">
                <SkeletonBlock className="aspect-[16/9] sm:aspect-[4/3] sm:w-56 sm:shrink-0 sm:rounded-xl" />
                <div className="flex flex-1 flex-col justify-between gap-3 p-4 sm:p-0">
                  <div className="space-y-2">
                    <SkeletonBlock className="h-5 w-24" />
                    <SkeletonBlock className="h-6 w-2/3" />
                    <SkeletonBlock className="h-4 w-1/3" />
                  </div>
                  <SkeletonBlock className="h-16 w-full rounded-xl" />
                  <SkeletonBlock className="h-9 w-36 rounded-xl" />
                </div>
              </article>
            ))}
          </div>
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-ink-500">Showing {visibleBookings.length} of {bookings.length} bookings</p>
              <FiltersDialog
                title="Filter bookings"
                description="Narrow your stays by details, status, or date."
                activeCount={activeFilterCount}
                resultCount={visibleBookings.length}
                onReset={resetFilters}
              >
                <label className="sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-700">Search</span>
                  <span className="flex items-center gap-2 rounded-xl border border-ink-300 px-3 py-2.5">
                    <Search className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
                    <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Stay, location, or room" className="w-full text-sm outline-none" />
                  </span>
                </label>
                <label className="block text-xs font-semibold text-ink-500">
                  Booking status
                  <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} className="mt-1 block w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900">
                    <option value="">All statuses</option><option value="pending_payment">Pending payment</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-ink-500">
                  Payment status
                  <select value={filters.paymentStatus} onChange={(event) => setFilters({ ...filters, paymentStatus: event.target.value })} className="mt-1 block w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900">
                    <option value="">All payment statuses</option><option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-ink-500">Check-in from<input type="date" value={filters.fromDate} onChange={(event) => setFilters({ ...filters, fromDate: event.target.value })} className="mt-1 block w-full rounded-xl border border-ink-300 px-3 py-2.5 text-sm font-normal text-ink-900" /></label>
                <label className="block text-xs font-semibold text-ink-500">Check-in to<input type="date" value={filters.toDate} onChange={(event) => setFilters({ ...filters, toDate: event.target.value })} className="mt-1 block w-full rounded-xl border border-ink-300 px-3 py-2.5 text-sm font-normal text-ink-900" /></label>
                <label className="block text-xs font-semibold text-ink-500">
                  Sort by
                  <select value={filters.sortBy} onChange={(event) => setFilters({ ...filters, sortBy: event.target.value })} className="mt-1 block w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900">
                    <option value="createdAt">Date created</option><option value="updatedAt">Date modified</option><option value="checkIn">Check-in date</option><option value="checkOut">Check-out date</option>
                  </select>
                </label>
                <label className="block text-xs font-semibold text-ink-500">
                  Order
                  <select value={filters.order} onChange={(event) => setFilters({ ...filters, order: event.target.value })} className="mt-1 block w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900">
                    <option value="desc">Newest first</option><option value="asc">Oldest first</option>
                  </select>
                </label>
              </FiltersDialog>
            </div>
            {visibleBookings.length === 0 ? <EmptyState title="No bookings match this filter" /> : <div className="space-y-4">
            {visibleBookings.map((booking) => {
              const listing = typeof booking.listingId === "object" ? booking.listingId : null;
              const listingImage = listing?.images?.[0] ? getImageUrl(listing.images[0]) : FALLBACK_IMAGE;
              return (
                <article key={booking._id} className="overflow-hidden rounded-2xl border border-ink-300 bg-white shadow-card sm:flex sm:gap-5 sm:p-4">
                  <div className="aspect-[16/9] overflow-hidden bg-accent sm:aspect-[4/3] sm:w-56 sm:shrink-0 sm:rounded-xl">
                    <img src={listingImage} alt={listing?.title ? `${listing.title} property` : "Booked property"} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:p-0">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge status={booking.status === "confirmed" ? "Confirmed" : booking.status === "cancelled" ? "Cancelled" : "Pending"}>
                          {STATUS_BADGE[booking.status] || booking.status}
                        </Badge>
                        <span className="text-xs font-medium text-ink-500">Ref: {booking.publicReference || booking._id.slice(-8)}</span>
                      </div>
                      <h2 className="mt-1 text-lg font-bold text-ink-900">{listing?.title || "Listing"}</h2>
                      {listing?.location && <p className="flex items-center gap-1 text-xs text-ink-500"><MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{listing.location}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-2.5 text-xs sm:grid-cols-3">
                      <div className="col-span-2 sm:col-span-1">
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-ink-500"><CalendarDays className="h-3 w-3" aria-hidden="true" />Dates</span>
                        <span className="mt-0.5 block font-semibold text-ink-900">{formatDateLong(booking.checkIn)} – {formatDateLong(booking.checkOut)}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-ink-500">Room</span>
                        <span className="mt-0.5 block font-semibold text-ink-900">{booking.roomId?.name || "Room"}{booking.rooms > 1 ? ` · ${booking.rooms} rooms` : ""}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase text-ink-500">Total</span>
                        <span className="mt-0.5 block font-semibold text-ink-900">{typeof booking.totalAmount === "number" ? formatPrice(booking.totalAmount) : "—"}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-stretch gap-2 border-t border-ink-300 pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:pt-2">
                      <Link to={`/confirmation/${booking._id}`} className="w-full sm:w-auto">
                        <Button size="sm" className="w-full sm:w-auto"><Eye className="h-4 w-4" aria-hidden="true" /> View booking</Button>
                      </Link>
                      {booking.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full sm:w-auto"
                          disabled={cancellingId === booking._id}
                          onClick={() => handleCancel(booking._id)}
                        >
                          {cancellingId === booking._id ? "Cancelling..." : "Cancel booking"}
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
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
