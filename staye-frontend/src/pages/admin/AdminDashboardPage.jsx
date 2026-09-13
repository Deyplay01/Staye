import React, { useEffect, useState } from "react";
import { BedDouble, DollarSign, CalendarCheck2 } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import StatCard from "../../components/admin/StatCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { fetchMyListings } from "../../api/listings";
import { fetchBookingDashboard } from "../../api/bookings";
import { formatPrice } from "../../utils/price";

export default function AdminDashboardPage() {
  const [listings, setListings] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([fetchMyListings({ sortBy: "createdAt", order: "desc" }), fetchBookingDashboard()])
      .then(([listingData, dashboardData]) => {
        setListings(listingData);
        setDashboard(dashboardData);
      })
      .catch((err) => setError(err?.response?.data?.message || "Couldn't load the dashboard."))
      .finally(() => setIsLoading(false));
  }, []);

  const averagePrice =
    listings.length > 0 ? listings.reduce((sum, l) => sum + l.price, 0) / listings.length : 0;

  return (
    <AdminLayout>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="staye-eyebrow">Host workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">Good morning, {"admin"}.</h1>
          <p className="mt-1 text-sm text-ink-500">A clear view of your spaces, stays, and momentum.</p>
        </div>
        <div className="rounded-full bg-accent px-4 py-2 text-xs font-bold text-navy-900">Live overview</div>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner label="Loading dashboard..." />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Your listings" value={listings.length} icon={BedDouble} />
            <StatCard label="Average price / night" value={formatPrice(averagePrice)} icon={DollarSign} />
            <StatCard label="Booked rooms" value={dashboard?.totals?.bookedRooms ?? 0} icon={CalendarCheck2} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
              <h2 className="font-bold text-ink-900">Revenue</h2>
              <div className="mt-3 flex flex-wrap gap-4">
                {Object.entries(dashboard?.totals?.revenueByCurrency || {}).map(([currency, amount]) => (
                  <div key={currency}>
                    <p className="text-xs uppercase text-ink-500">{currency}</p>
                    <p className="text-xl font-extrabold text-ink-900">{formatPrice(amount, currency)}</p>
                  </div>
                ))}
                {!Object.keys(dashboard?.totals?.revenueByCurrency || {}).length && <p className="text-sm text-ink-500">No paid bookings yet.</p>}
              </div>
            </div>
            <div className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card">
              <h2 className="font-bold text-ink-900">Room availability</h2>
              <div className="mt-3 space-y-2 text-sm">
                {(dashboard?.rooms || []).map((room) => (
                  <div key={room.listingId} className="flex justify-between gap-3 border-b border-ink-300 pb-2">
                    <span className="truncate">{room.title}</span>
                    <span className="shrink-0 text-ink-500">{room.availableRooms} / {room.totalRooms} available</span>
                  </div>
                ))}
                {!dashboard?.rooms?.length && <p className="text-ink-500">No rooms to report.</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
