import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Filter, MapPin, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ListingCard from "../../components/listings/ListingCard";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { fetchListings } from "../../api/listings";

const PAGE_LIMIT = 10;
const INITIAL_FILTERS = {
  location: "",
  priceMin: "",
  priceMax: "",
  amenities: "",
  roomType: "",
  sortBy: "createdAt",
  order: "desc",
};

export default function ListingsPage() {
  const [searchParams] = useSearchParams();
  const initialLocation = searchParams.get("location") || "";
  const initialFilters = { ...INITIAL_FILTERS, location: initialLocation };
  const [filters, setFilters] = useState(initialFilters);
  const [draft, setDraft] = useState(initialFilters);
  const [listings, setListings] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadListings(initialFilters, 1);
  }, []);

  async function loadListings(nextFilters, nextPage) {
    setIsLoading(true);
    setError("");
    try {
      const params = { page: nextPage, limit: PAGE_LIMIT, sortBy: nextFilters.sortBy, order: nextFilters.order };
      if (nextFilters.location) params.location = nextFilters.location;
      if (nextFilters.priceMin) params.priceMin = nextFilters.priceMin;
      if (nextFilters.priceMax) params.priceMax = nextFilters.priceMax;
      if (nextFilters.amenities) params.amenities = nextFilters.amenities;
      if (nextFilters.roomType) params.roomType = nextFilters.roomType;
      const data = await fetchListings(params);
      setListings(data.listings || []);
      setPage(data.page || nextPage);
      setFilters(nextFilters);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't load listings.");
      setListings([]);
    } finally {
      setIsLoading(false);
    }
  }

  function submitFilters(event) {
    event.preventDefault();
    loadListings(draft, 1);
  }

  function resetFilters() {
    setDraft(INITIAL_FILTERS);
    loadListings(INITIAL_FILTERS, 1);
  }

  const activeFilterCount = [filters.location, filters.priceMin, filters.priceMax, filters.amenities, filters.roomType].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#f5f8f2]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="staye-eyebrow">Explore Stayé</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900 sm:text-4xl">All stays</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-ink-500">
              Find a place that fits the way you want to travel.
            </p>
          </div>
          <Link to="/" className="self-start sm:self-auto">
            <Button type="button" variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to home
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-2xl border border-ink-300 bg-white p-5 shadow-card lg:sticky lg:top-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="flex items-center gap-2 font-bold text-navy-900"><Filter className="h-4 w-4 text-brand" aria-hidden="true" /> Refine stays</h2>
                {activeFilterCount > 0 && <span className="rounded-full bg-accent px-2 py-1 text-xs font-bold text-navy-900">{activeFilterCount} active</span>}
              </div>
              <button type="button" onClick={resetFilters} className="flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-hover">
                <RotateCcw className="h-3 w-3" aria-hidden="true" /> Reset
              </button>
            </div>
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-brand-light px-3 py-2 text-xs leading-5 text-ink-700">
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              Narrow your search by place, room type, price, and amenities.
            </div>
            <form onSubmit={submitFilters} className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink-700">Destination</span>
                <span className="flex items-center gap-2 rounded-full border border-ink-300 px-3 py-2.5">
                  <MapPin className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
                  <input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="Any destination" className="w-full bg-transparent text-sm outline-none" />
                </span>
              </label>
              <div>
                <span className="mb-1.5 block text-xs font-semibold text-ink-700">Price per night</span>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" min="0" value={draft.priceMin} onChange={(event) => setDraft({ ...draft, priceMin: event.target.value })} placeholder="Min" className="w-full rounded-full border border-ink-300 px-3 py-2.5 text-sm outline-none" />
                  <input type="number" min="0" value={draft.priceMax} onChange={(event) => setDraft({ ...draft, priceMax: event.target.value })} placeholder="Max" className="w-full rounded-full border border-ink-300 px-3 py-2.5 text-sm outline-none" />
                </div>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink-700">Room category</span>
                <input value={draft.roomType} onChange={(event) => setDraft({ ...draft, roomType: event.target.value })} placeholder="Classic, Deluxe, Suite" className="w-full rounded-full border border-ink-300 px-3 py-2.5 text-sm outline-none focus:border-brand" />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-ink-700">Amenities</span>
                <input value={draft.amenities} onChange={(event) => setDraft({ ...draft, amenities: event.target.value })} placeholder="WiFi, breakfast, pool" className="w-full rounded-full border border-ink-300 px-3 py-2.5 text-sm outline-none focus:border-brand" />
                <span className="mt-1 block text-[11px] text-ink-500">Separate multiple amenities with commas.</span>
              </label>
              <Button type="submit" className="w-full"><Search className="h-4 w-4" aria-hidden="true" /> Apply filters</Button>
            </form>
          </aside>

          <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-ink-500">{isLoading ? "Finding stays..." : `${listings.length} stays on this page`}</p>
                <h2 className="mt-1 text-xl font-bold text-navy-900">Places you might love</h2>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-500">
                Sort by
                <select value={`${filters.sortBy}:${filters.order}`} onChange={(event) => {
                  const [sortBy, order] = event.target.value.split(":");
                  const next = { ...filters, sortBy, order };
                  setDraft(next);
                  loadListings(next, 1);
                }} className="rounded-full border border-ink-300 bg-white px-3 py-2 font-medium text-navy-900 outline-none">
                  <option value="createdAt:desc">Date added</option>
                  <option value="updatedAt:desc">Recently modified</option>
                  <option value="price:asc">Price: low to high</option>
                  <option value="price:desc">Price: high to low</option>
                  <option value="title:asc">Name</option>
                </select>
              </label>
            </div>

            {error && <div className="mb-4 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>}
            {isLoading ? <LoadingSpinner label="Loading stays..." /> : listings.length === 0 && !error ? <EmptyState title="No stays found" description="Try widening your price range or searching another destination." /> : (
              <div className="space-y-4">{listings.map((listing) => <ListingCard key={listing._id} listing={listing} />)}</div>
            )}

            {!isLoading && listings.length > 0 && (
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-card">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadListings(filters, page - 1)}>Previous</Button>
                <span className="text-sm font-medium text-ink-500">Page {page}</span>
                <Button variant="outline" size="sm" disabled={listings.length < PAGE_LIMIT} onClick={() => loadListings(filters, page + 1)}>Next</Button>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}