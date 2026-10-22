import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ListingCard from "../../components/listings/ListingCard";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import HomeIconLink from "../../components/common/HomeIconLink";
import FiltersDialog from "../../components/common/FiltersDialog";
import ListingSkeleton from "../../components/listings/ListingSkeleton";
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
  const initialFilters = {
    ...INITIAL_FILTERS,
    location: initialLocation,
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
  };
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

  function submitFilters() {
    loadListings(draft, 1);
  }

  function resetFilters() {
    setDraft(INITIAL_FILTERS);
    loadListings(INITIAL_FILTERS, 1);
  }

  const activeFilterCount = [filters.location, filters.priceMin, filters.priceMax, filters.amenities, filters.roomType].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
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
          <HomeIconLink className="self-start sm:self-auto" />
        </div>

        <section>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-ink-500">{isLoading ? "Finding stays..." : `${listings.length} stays on this page`}</p>
                <h2 className="mt-1 text-xl font-bold text-navy-900">Places you might love</h2>
              </div>
              <FiltersDialog title="Filter stays" description="Set your destination, price range, room type, and amenities." activeCount={activeFilterCount} resultCount={listings.length} onReset={resetFilters} onApply={submitFilters} applyLabel="Apply filters">
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs leading-5 text-ink-700 sm:col-span-2">
                  <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" /> Choose the details that matter for your stay.
                </div>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-700">Destination</span>
                  <span className="flex items-center gap-2 rounded-xl border border-ink-300 px-3 py-2.5">
                    <MapPin className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
                    <input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} placeholder="Any destination" className="w-full bg-transparent text-sm outline-none" />
                  </span>
                </label>
                <div>
                  <span className="mb-1.5 block text-xs font-semibold text-ink-700">Price per night</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min="0" value={draft.priceMin} onChange={(event) => setDraft({ ...draft, priceMin: event.target.value })} placeholder="Min" className="w-full rounded-xl border border-ink-300 px-3 py-2.5 text-sm outline-none" />
                    <input type="number" min="0" value={draft.priceMax} onChange={(event) => setDraft({ ...draft, priceMax: event.target.value })} placeholder="Max" className="w-full rounded-xl border border-ink-300 px-3 py-2.5 text-sm outline-none" />
                  </div>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-700">Room category</span>
                  <input value={draft.roomType} onChange={(event) => setDraft({ ...draft, roomType: event.target.value })} placeholder="Classic, Deluxe, Suite" className="w-full rounded-xl border border-ink-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-700">Amenities</span>
                  <input value={draft.amenities} onChange={(event) => setDraft({ ...draft, amenities: event.target.value })} placeholder="WiFi, breakfast, pool" className="w-full rounded-xl border border-ink-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
                  <span className="mt-1 block text-[11px] text-ink-500">Separate multiple amenities with commas.</span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-700">Sort by</span>
                  <select value={draft.sortBy} onChange={(event) => setDraft({ ...draft, sortBy: event.target.value })} className="w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm text-navy-900 outline-none">
                    <option value="createdAt">Date added</option><option value="updatedAt">Recently modified</option><option value="price">Price: low to high</option><option value="title">Name</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-ink-700">Order</span>
                  <select value={draft.order} onChange={(event) => setDraft({ ...draft, order: event.target.value })} className="w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm text-navy-900 outline-none">
                    <option value="desc">Descending</option><option value="asc">Ascending</option>
                  </select>
                </label>
              </FiltersDialog>
            </div>

            {error && <div className="mb-4 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">{error}</div>}
            {isLoading ? <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3" aria-label="Loading stays" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <ListingSkeleton key={index} />)}</div> : listings.length === 0 && !error ? <EmptyState title="No stays found" description="Try widening your price range or searching another destination." /> : (
              <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">{listings.map((listing) => <ListingCard key={listing._id} listing={listing} checkIn={filters.checkIn} checkOut={filters.checkOut} />)}</div>
            )}

            {!isLoading && listings.length > 0 && (
              <div className="mt-6 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-card">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => loadListings(filters, page - 1)}>Previous</Button>
                <span className="text-sm font-medium text-ink-500">Page {page}</span>
                <Button variant="outline" size="sm" disabled={listings.length < PAGE_LIMIT} onClick={() => loadListings(filters, page + 1)}>Next</Button>
              </div>
            )}
        </section>
      </main>
      <Footer />
    </div>
  );
}