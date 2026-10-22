import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, BedDouble, Compass, ShieldCheck } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ListingFilters from "../../components/listings/ListingFilters";
import ListingCard from "../../components/listings/ListingCard";
import EmptyState from "../../components/common/EmptyState";
import { fetchListings, fetchPopularLocations } from "../../api/listings";
import { getImageUrl } from "../../api";
import ListingSkeleton from "../../components/listings/ListingSkeleton";
import HERO_IMAGE from "../../asset/hero-image.avif"

const PAGE_LIMIT = 10;

export default function HomePage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ location: "", checkIn: "", checkOut: "" });
  const [listings, setListings] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [popularLocations, setPopularLocations] = useState([]);

  useEffect(() => {
    runSearch(filters, 1);
    fetchPopularLocations().then(setPopularLocations).catch(() => setPopularLocations([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(nextFilters, nextPage) {
    setIsLoading(true);
    setError("");
    try {
      const params = { page: nextPage, limit: PAGE_LIMIT };
      if (nextFilters.location) params.location = nextFilters.location;

      const data = await fetchListings(params);
      setListings(data.listings || []);
      setPage(data.page || nextPage);
      setFilters(nextFilters);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Couldn't reach the server."
      );
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900">
      <Navbar />

      <main>
        <section className="relative flex min-h-[510px] items-center justify-center overflow-hidden sm:min-h-[570px]">
          <img src={HERO_IMAGE} alt="A welcoming resort beside a tropical pool" className="absolute inset-0 h-full w-full object-cover" fetchpriority="high" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-slate-950/25" aria-hidden="true" />
          <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-16 pt-28 text-center text-white sm:px-8 sm:pb-20">
            <span className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
              A better way to find your stay
            </span>
            <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
              Find a place that feels like yours.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/85 sm:text-lg sm:leading-7">
              Explore welcoming places to stay, compare room options, and book your next trip with confidence.
            </p>
            <div className="mt-8">
              <ListingFilters
                filters={filters}
                onSearch={(nextFilters) => {
                  const search = new URLSearchParams();
                  if (nextFilters.location) search.set("location", nextFilters.location);
                  if (nextFilters.checkIn) search.set("checkIn", nextFilters.checkIn);
                  if (nextFilters.checkOut) search.set("checkOut", nextFilters.checkOut);
                  const query = search.size ? `?${search.toString()}` : "";
                  navigate(`/listings${query}`);
                }}
              />
            </div>
          </div>
        </section>

        {popularLocations.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-8 sm:pt-16">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Guest favourites</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Explore popular places</h2>
                <p className="mt-2 text-sm text-slate-500">Destinations guests have booked on Staye.</p>
              </div>
              <Link to="/listings" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-brand">
                Browse all stays <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {popularLocations.map((location) => (
                <Link
                  key={location.location}
                  to={`/listings?location=${encodeURIComponent(location.location)}`}
                  className="group relative min-h-56 overflow-hidden rounded-2xl bg-slate-200 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={getImageUrl(location.image) || HERO_IMAGE}
                    alt={`${location.location} stays`}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" aria-hidden="true" />
                  <div className="relative flex min-h-56 flex-col justify-end p-5 text-white">
                    <p className="text-xl font-bold">{location.location}</p>
                    <p className="mt-1 text-sm text-white/80">
                      {location.bookingCount > 0
                        ? `${location.bookingCount} confirmed ${location.bookingCount === 1 ? "stay" : "stays"}`
                        : "Explore available stays"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">Make yourself at home</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Stays worth looking forward to</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Browse available properties, compare room options, and find the right fit for your trip.</p>
            </div>
            <Link to="/listings" className="hidden sm:block">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100">
                Explore all stays <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </div>

          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Loading stays" aria-busy="true">
              {Array.from({ length: 8 }, (_, index) => <ListingSkeleton key={index} />)}
            </div>
          ) : listings.length === 0 && !error ? (
            <EmptyState title="No stays to show yet" description="Try browsing all destinations or check back soon for new places." />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} checkIn={filters.checkIn} checkOut={filters.checkOut} />
              ))}
            </div>
          )}

          {!isLoading && listings.length > 0 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" disabled={page <= 1} onClick={() => runSearch(filters, page - 1)}>Previous</button>
              <span className="text-sm text-slate-500">Page {page}</span>
              <button type="button" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" disabled={listings.length < PAGE_LIMIT} onClick={() => runSearch(filters, page + 1)}>Next</button>
            </div>
          )}
        </section>

        <section aria-labelledby="how-staye-works" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-12">
            <header className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">A smoother way to plan</p>
              <h2 id="how-staye-works" className="mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
                Find and book your next stay
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Staye brings the important parts of planning a stay together, from finding a place to keeping your booking details close.
              </p>
            </header>

            <ol className="mt-9 grid gap-4 md:grid-cols-3">
              <li className="rounded-2xl border border-slate-200 bg-[#FAFAFA] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <Compass className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold tracking-[0.14em] text-slate-400">01</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-navy-900">Discover places</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Search by destination and browse properties that fit the kind of trip you have in mind.
                </p>
              </li>
              <li className="rounded-2xl border border-slate-200 bg-[#FAFAFA] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <BedDouble className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold tracking-[0.14em] text-slate-400">02</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-navy-900">Compare room options</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Review room types, amenities, availability, and nightly prices before choosing.
                </p>
              </li>
              <li className="rounded-2xl border border-slate-200 bg-[#FAFAFA] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-light text-brand">
                    <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-xs font-bold tracking-[0.14em] text-slate-400">03</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-navy-900">Book with clarity</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Check your dates and total before booking, then find your reservations and receipts in your account.
                </p>
              </li>
            </ol>

            <aside className="mt-6 flex flex-col gap-5 rounded-2xl bg-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">For property owners</p>
                <h3 className="mt-2 text-lg font-bold text-navy-900 sm:text-xl">Bring your property to Staye</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Create a listing, manage its room options, and keep track of guest bookings from your host portal.
                </p>
              </div>
              <Link to="/admin/register" className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-navy-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-900 sm:self-center">
                Become a host <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
