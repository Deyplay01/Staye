import React, { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ListingFilters from "../../components/listings/ListingFilters";
import ListingCard from "../../components/listings/ListingCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { fetchListings } from "../../api/listings";

const HERO_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80";
const PAGE_LIMIT = 10;

export default function HomePage() {
  const [filters, setFilters] = useState({ location: "", checkIn: "", checkOut: "" });
  const [listings, setListings] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    runSearch(filters, 1);
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
          "Couldn't reach the server. Make sure the backend is running and the database is connected."
      );
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="staye-shell">
      <div className="staye-panel">
      <Navbar />

      <section className="relative mx-4 mt-4 overflow-visible rounded-2xl sm:mx-8 sm:mt-6">
        <img src={HERO_IMAGE} alt="A calm hotel bedroom" className="h-64 w-full rounded-2xl object-cover sm:h-80" />
        <div className="absolute inset-0 rounded-2xl bg-[#243119]/55" aria-hidden="true" />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pb-10 text-center">
          <p className="staye-eyebrow text-accent">A softer way to stay</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-5xl">Find a place that feels like yours.</h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">Thoughtful spaces, real hosts, and stays worth remembering.</p>
        </div>
      </section>

      <div className="relative z-10 -mt-10 px-4 sm:-mt-12 sm:px-10">
        <ListingFilters filters={filters} onSearch={(f) => runSearch(f, 1)} />
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-10">
        <p className="staye-eyebrow">Curated stays</p>
        <h2 className="mb-5 mt-2 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">
          {isLoading ? "Loading listings..." : `${listings.length} listings`}
        </h2>

        {error && (
          <div className="mb-4 rounded-sm border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner label="Loading listings..." />
        ) : listings.length === 0 && !error ? (
          <EmptyState
            title="No listings match your search"
            description="Try a different location or widen your price range."
          />
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <ListingCard key={listing._id} listing={listing} checkIn={filters.checkIn} checkOut={filters.checkOut} />
            ))}
          </div>
        )}

        {!isLoading && listings.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="outline" disabled={page <= 1} onClick={() => runSearch(filters, page - 1)}>
              Previous
            </Button>
            <span className="text-sm text-ink-500">Page {page}</span>
            <Button
              variant="outline"
              disabled={listings.length < PAGE_LIMIT}
              onClick={() => runSearch(filters, page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </section>

      <Footer />
      </div>
    </div>
  );
}
