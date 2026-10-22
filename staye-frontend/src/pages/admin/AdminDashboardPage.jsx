import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BedDouble,
  CircleDollarSign,
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Clock3,
} from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import StatCard from "../../components/admin/StatCard";
import SkeletonBlock from "../../components/common/SkeletonBlock";
import FiltersDialog from "../../components/common/FiltersDialog";
import { fetchMyListings } from "../../api/listings";
import { fetchAdminBookings, fetchBookingDashboard } from "../../api/bookings";
import { formatPrice } from "../../utils/price";
import { getPeriodBounds, todayISO } from "../../utils/date";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("month");
  const [periodValue, setPeriodValue] = useState(todayISO().slice(0, 7));
  const [listings, setListings] = useState([]);
  const [dashboard, setDashboard] = useState(null);
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
    const controller = new AbortController();
    const bounds = getPeriodBounds(period, periodValue);
    if (period !== "all" && (!bounds || !bounds.start || !bounds.end)) {
      setIsLoading(false);
      return () => controller.abort();
    }
    const params = bounds ? bounds : { period: "all" };
    setIsLoading(true);
    setError("");
    Promise.all([
      fetchMyListings({ sortBy: "createdAt", order: "desc" }, { signal: controller.signal }),
      fetchBookingDashboard(params, { signal: controller.signal }),
      fetchAdminBookings({}, { signal: controller.signal }),
    ])
      .then(([listingData, dashboardData, bookingData]) => {
        setListings(listingData);
        setDashboard(dashboardData);
        setBookings(bookingData.bookings || []);
      })
      .catch((err) => {
        if (err.name !== "CanceledError") {
          setError(err?.response?.data?.message || "Couldn't load the dashboard.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [period, periodValue]);

  const roomPrices = listings.flatMap((listing) =>
    (listing.rooms || [])
      .map((room) => Number(room.price))
      .filter((value) => Number.isFinite(value)),
  );
  const averagePrice =
    roomPrices.length > 0
      ? roomPrices.reduce((sum, value) => sum + value, 0) / roomPrices.length
      : 0;
  const periodBounds = getPeriodBounds(period, periodValue);
  const periodBookings = bookings.filter((booking) => {
    if (!periodBounds) return true;
    const bookingDate = (booking.createdAt || booking.checkIn || "").slice(
      0,
      10,
    );
    return bookingDate >= periodBounds.start && bookingDate < periodBounds.end;
  });
  const confirmedBookings = periodBookings.filter(
    (booking) => booking.status === "confirmed",
  );
  const revenueByCurrency = confirmedBookings
    .filter((booking) => booking.paymentStatus === "paid")
    .reduce((totals, booking) => {
      const currency = (booking.currency || "ngn").toUpperCase();
      totals[currency] =
        (totals[currency] || 0) + (Number(booking.totalAmount) || 0);
      return totals;
    }, {});
  const bookedRooms = confirmedBookings.reduce(
    (total, booking) => total + (Number(booking.rooms) || 0),
    0,
  );
  const cancelledBookings = periodBookings.filter(
    (booking) => booking.status === "cancelled",
  ).length;
  const pendingBookings = periodBookings.filter(
    (booking) => booking.status === "pending_payment",
  ).length;
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "morning"
      : currentHour < 17
        ? "afternoon"
        : currentHour < 21
          ? "evening"
          : "night";

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="staye-eyebrow">Host workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">
            Good {greeting}, {user?.name?.split(" ")[0] || "host"}.
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            A clear view of your spaces, stays, and momentum.
          </p>
        </div>
        <FiltersDialog title="Revenue period" description="Choose the reporting window for your dashboard." activeCount={period === "all" ? 0 : 1}>
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

      {error && (
        <div className="mb-4 rounded-sm border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
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
          <div className="grid gap-4 lg:grid-cols-2">
            <SkeletonBlock className="h-56 w-full rounded-2xl" />
            <SkeletonBlock className="h-56 w-full rounded-2xl" />
          </div>
          <div className="space-y-3 rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
            <SkeletonBlock className="h-6 w-1/3" />
            {Array.from({ length: 3 }, (_, index) => <SkeletonBlock key={index} className="h-14 w-full rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Your listings"
              value={listings.length}
              icon={BedDouble}
            />
            <StatCard
              label="Room categories"
              value={dashboard?.rooms?.length ?? 0}
              icon={BedDouble}
            />
            <StatCard
              label="Average price / night"
              value={formatPrice(averagePrice)}
              icon={CircleDollarSign}
            />
            <StatCard
              label="Booked rooms in period"
              value={bookedRooms}
              icon={CalendarCheck2}
            />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label="Confirmed bookings"
              value={confirmedBookings.length}
              icon={CheckCircle2}
            />
            <StatCard
              label="Cancelled bookings"
              value={cancelledBookings}
              icon={XCircle}
            />
            <StatCard
              label="Pending bookings"
              value={pendingBookings}
              icon={Clock3}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
              <h2 className="font-bold text-ink-900">Revenue in period</h2>
              <div className="mt-3 flex flex-wrap gap-4">
                {Object.entries(revenueByCurrency).map(([currency, amount]) => (
                  <div key={currency}>
                    <p className="text-xs uppercase text-ink-500">{currency}</p>
                    <p className="text-xl font-bold text-ink-900">
                      {formatPrice(amount, currency)}
                    </p>
                  </div>
                ))}
                {!Object.keys(revenueByCurrency).length && (
                  <p className="text-sm text-ink-500">No paid bookings yet.</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold text-ink-900">Room availability</h2>
                <Link
                  to="/admin/listings"
                  className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                >
                  Manage rooms
                </Link>
              </div>
              <div className="mt-3 space-y-2 text-sm">
                {(dashboard?.rooms || []).map((room) => (
                  <div
                    key={room.roomId}
                    className="flex justify-between gap-3 border-b border-ink-300 pb-2"
                  >
                    <span className="min-w-0 truncate">
                      {room.title} · {room.roomName}
                      <span className="ml-2 text-xs text-ink-400">
                        {formatPrice(room.price)}
                      </span>
                    </span>
                    <span className="shrink-0 text-ink-500">
                      {room.availableRooms} / {room.totalRooms} available
                    </span>
                  </div>
                ))}
                {!dashboard?.rooms?.length && (
                  <p className="text-ink-500">No rooms to report.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
