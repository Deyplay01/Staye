import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ReceiptText,
  XCircle,
} from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import SkeletonBlock from "../../components/common/SkeletonBlock";
import FiltersDialog from "../../components/common/FiltersDialog";
import EmptyState from "../../components/common/EmptyState";
import Badge from "../../components/common/Badge";
import Button from "../../components/common/Button";
import { fetchMyBookings } from "../../api/bookings";
import { formatDateLong, getPeriodBounds, todayISO } from "../../utils/date";
import { formatPrice } from "../../utils/price";
import { useAuth } from "../../context/AuthContext";

const STATUS_LABELS = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("month");
  const [periodValue, setPeriodValue] = useState(todayISO().slice(0, 7));
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  function handlePeriodChange(event) {
    const nextPeriod = event.target.value;
    setPeriod(nextPeriod);
    setPeriodValue(
      nextPeriod === "month" ? todayISO().slice(0, 7) : todayISO(),
    );
  }

  useEffect(() => {
    fetchMyBookings()
      .then(setBookings)
      .catch((err) =>
        setError(
          err?.response?.data?.message || "Couldn't load your dashboard.",
        ),
      )
      .finally(() => setIsLoading(false));
  }, []);

  const periodBounds = getPeriodBounds(period, periodValue);
  const periodBookings = bookings.filter((booking) => {
    const bookingDate = (booking.createdAt || booking.checkIn)?.slice(0, 10);
    return (
      !periodBounds ||
      (bookingDate >= periodBounds.start && bookingDate < periodBounds.end)
    );
  });
  const paidBookings = periodBookings.filter(
    (booking) => booking.paymentStatus === "paid",
  );
  const totalPaid = paidBookings.reduce(
    (total, booking) => total + (Number(booking.totalAmount) || 0),
    0,
  );
  const bookedRooms = periodBookings
    .filter((booking) => booking.status === "confirmed")
    .reduce((total, booking) => total + (Number(booking.rooms) || 0), 0);
  const confirmedBookings = periodBookings.filter(
    (booking) => booking.status === "confirmed",
  ).length;
  const cancelledBookings = periodBookings.filter(
    (booking) => booking.status === "cancelled",
  ).length;
  const pendingBookings = periodBookings.filter(
    (booking) => booking.status === "pending_payment",
  ).length;
  const upcomingBookings = bookings.filter(
    (booking) =>
      booking.status !== "cancelled" &&
      new Date(booking.checkOut) >= new Date(),
  );
  const recentBookings = bookings.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="staye-eyebrow">Your stay space</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">
              Welcome back, {user?.name?.split(" ")[0] || "traveller"}.
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Keep track of upcoming stays, payments, and receipts.
            </p>
          </div>
          <Link to="/listings">
            <Button>
              <span>Find a stay</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6" aria-label="Loading dashboard" aria-busy="true">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="space-y-4 rounded-2xl border border-ink-300 bg-white p-5 shadow-card"><SkeletonBlock className="h-5 w-5 rounded-full" /><SkeletonBlock className="h-4 w-2/3" /><SkeletonBlock className="h-8 w-1/3" /></div>)}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => <div key={index} className="space-y-4 rounded-2xl border border-ink-300 bg-white p-5 shadow-card"><SkeletonBlock className="h-5 w-5 rounded-full" /><SkeletonBlock className="h-4 w-2/3" /><SkeletonBlock className="h-8 w-1/3" /></div>)}
            </div>
            <div className="space-y-3 rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
              <SkeletonBlock className="h-6 w-1/3" />
              {Array.from({ length: 3 }, (_, index) => <SkeletonBlock key={index} className="h-14 w-full rounded-xl" />)}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <p className="staye-eyebrow">Booking overview</p>
              <FiltersDialog title="Spending period" description="Choose the date range for your booking overview." activeCount={period === "all" ? 0 : 1}>
                <label className="block text-xs font-semibold text-ink-500">
                  Period
                  <select value={period} onChange={handlePeriodChange} className="mt-1 block w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900">
                    <option value="all">All time</option><option value="month">By month</option><option value="week">By week</option><option value="day">By day</option>
                  </select>
                </label>
                {period !== "all" && (
                  <label className="block text-xs font-semibold text-ink-500">
                    Period date
                    <input type={period === "month" ? "month" : "date"} value={periodValue} onChange={(event) => setPeriodValue(event.target.value)} className="mt-1 block w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900" />
                  </label>
                )}
              </FiltersDialog>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
                <CalendarCheck2
                  className="h-5 w-5 text-slate-500"
                  aria-hidden="true"
                />
                <p className="mt-4 text-sm text-ink-500">Upcoming stays</p>
                <p className="mt-1 text-3xl font-bold text-ink-900">
                  {upcomingBookings.length}
                </p>
              </div>
              <div className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
                <ReceiptText
                  className="h-5 w-5 text-slate-500"
                  aria-hidden="true"
                />
                <p className="mt-4 text-sm text-ink-500">Bookings in period</p>
                <p className="mt-1 text-3xl font-bold text-ink-900">
                  {periodBookings.length}
                </p>
              </div>
              <div className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
                <CalendarCheck2
                  className="h-5 w-5 text-slate-500"
                  aria-hidden="true"
                />
                <p className="mt-4 text-sm text-ink-500">
                  Booked rooms in period
                </p>
                <p className="mt-1 text-3xl font-bold text-ink-900">
                  {bookedRooms}
                </p>
              </div>
              <div className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
                <CircleDollarSign
                  className="h-5 w-5 text-slate-500"
                  aria-hidden="true"
                />
                <p className="mt-4 text-sm text-ink-500">
                  Total spent in period
                </p>
                <p className="mt-1 text-3xl font-bold text-ink-900">
                  {formatPrice(totalPaid)}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
                <CheckCircle2
                  className="h-5 w-5 text-slate-500"
                  aria-hidden="true"
                />
                <p className="mt-4 text-sm text-ink-500">Confirmed bookings</p>
                <p className="mt-1 text-3xl font-bold text-ink-900">
                  {confirmedBookings}
                </p>
              </div>
              <div className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
                <XCircle                 className="h-5 w-5 text-slate-500" aria-hidden="true" />
                <p className="mt-4 text-sm text-ink-500">Cancelled bookings</p>
                <p className="mt-1 text-3xl font-bold text-ink-900">
                  {cancelledBookings}
                </p>
              </div>
              <div className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
                <Clock3 className="h-5 w-5 text-slate-500" aria-hidden="true" />
                <p className="mt-4 text-sm text-ink-500">Pending bookings</p>
                <p className="mt-1 text-3xl font-bold text-ink-900">
                  {pendingBookings}
                </p>
              </div>
            </div>

            <section className="mt-6 rounded-2xl border border-ink-300 bg-white p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="staye-eyebrow">Activity</p>
                  <h2 className="mt-1 text-xl font-bold text-navy-900">
                    Recent bookings
                  </h2>
                </div>
                <Link
                  to="/my-bookings"
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  View all bookings
                </Link>
              </div>
              {recentBookings.length === 0 ? (
                <EmptyState
                  title="No bookings yet"
                  description="Your confirmed stays and payment receipts will appear here."
                  action={
                    <Link
                      to="/listings"
                      className="text-sm font-semibold text-slate-700 hover:text-slate-900 hover:underline"
                    >
                      Browse listings
                    </Link>
                  }
                />
              ) : (
                <div className="mt-5 space-y-3">
                  {recentBookings.map((booking) => {
                    const listing = booking.listingId || {};
                    const room = booking.roomId || {};
                    const listingId =
                      typeof booking.listingId === "object"
                        ? booking.listingId._id
                        : booking.listingId;
                    return (
                      <div
                        key={booking._id}
                        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-ink-300 bg-slate-50 p-4"
                      >
                        <Link
                          to={`/my-bookings?listingId=${encodeURIComponent(listingId || "")}`}
                          className="min-w-0 flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                        >
                          <p className="font-semibold text-ink-900 hover:text-slate-700">
                            {listing.title || "Listing"}
                          </p>
                          <p className="mt-1 text-sm text-ink-500">
                            {room.name || "Room"} ·{" "}
                            {formatDateLong(booking.checkIn)} to{" "}
                            {formatDateLong(booking.checkOut)}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-600">
                            View all bookings for this listing
                          </p>
                        </Link>
                        <div className="flex items-center gap-3">
                          <Badge
                            status={
                              booking.status === "confirmed"
                                ? "Confirmed"
                                : booking.status === "cancelled"
                                  ? "Cancelled"
                                  : "Pending"
                            }
                          >
                            {STATUS_LABELS[booking.status] || booking.status}
                          </Badge>
                          {booking.paymentStatus === "paid" && (
                            <Link
                              to={`/receipt/${booking._id}`}
                              aria-label={`View receipt for ${listing.title || "booking"}`}
                              className="text-slate-600 hover:text-slate-900"
                            >
                              <ReceiptText
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
