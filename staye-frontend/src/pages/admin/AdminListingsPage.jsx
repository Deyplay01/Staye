import React, { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import ListingsTable from "../../components/admin/ListingsTable";
import ListingFormModal from "../../components/admin/ListingFormModal";
import SkeletonBlock from "../../components/common/SkeletonBlock";
import FiltersDialog from "../../components/common/FiltersDialog";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { fetchMyListings, createListing, updateListing, deleteListing } from "../../api/listings";

export default function AdminListingsPage() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalListing, setModalListing] = useState(undefined); // undefined = closed, null = add, object = edit
  const [filters, setFilters] = useState({ location: "", sortBy: "createdAt", order: "desc" });

  useEffect(() => {
    const controller = new AbortController();
    load(filters, { signal: controller.signal });
    return () => controller.abort();
  }, []);

  async function load(params = filters, config = {}) {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchMyListings(params, config);
      setListings(data);
    } catch (err) {
      if (err.name !== "CanceledError") {
        setError(err?.response?.data?.message || "Couldn't load your listings.");
      }
    } finally {
      if (!config.signal?.aborted) setIsLoading(false);
    }
  }

  function handleFilterChange(field, value) {
    const next = { ...filters, [field]: value };
    setFilters(next);
    load(next);
  }

  function resetFilters() {
    const next = { location: "", sortBy: "createdAt", order: "desc" };
    setFilters(next);
    load(next);
  }

  async function handleSave(payload) {
    try {
      if (modalListing) {
        const updated = await updateListing(modalListing._id, payload);
        setListings((prev) => prev.map((l) => (l._id === updated._id ? updated : l)));
      } else {
        const created = await createListing(payload);
        setListings((prev) => [created, ...prev]);
      }
      setModalListing(undefined);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't save this listing.");
    }
  }

  async function handleDelete(listing) {
    if (!window.confirm(`Delete "${listing.title}"? This can't be undone.`)) return;
    try {
      await deleteListing(listing._id);
      setListings((prev) => prev.filter((l) => l._id !== listing._id));
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't delete this listing.");
    }
  }

    return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Listings</h1>
          <p className="mt-1 text-sm text-ink-500">Select a listing to manage its room types and availability.</p>
        </div>
        <Button onClick={() => setModalListing(null)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add listing
        </Button>
      </div>

      <div className="mb-5 flex justify-end">
        <FiltersDialog
          title="Filter listings"
          description="Search your listings and choose how they’re sorted."
          activeCount={filters.location ? 1 : 0}
          resultCount={listings.length}
          onReset={resetFilters}
          onApply={() => load(filters)}
          applyLabel="Apply filters"
        >
          <label className="block text-xs font-semibold text-ink-500 sm:col-span-2">
            Location
            <span className="mt-1 flex items-center gap-2 rounded-xl border border-ink-300 px-3 py-2.5">
              <Search className="h-4 w-4 text-ink-500" aria-hidden="true" />
              <input value={filters.location} onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))} placeholder="Filter by location" className="w-full text-sm font-normal text-ink-900 outline-none" />
            </span>
          </label>
          <label className="block text-xs font-semibold text-ink-500">
            Sort by
            <select value={filters.sortBy} onChange={(event) => handleFilterChange("sortBy", event.target.value)} className="mt-1 block w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900">
              <option value="createdAt">Date created</option><option value="updatedAt">Date modified</option><option value="title">Title</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-ink-500">
            Order
            <select value={filters.order} onChange={(event) => handleFilterChange("order", event.target.value)} className="mt-1 block w-full rounded-xl border border-ink-300 bg-white px-3 py-2.5 text-sm font-normal text-ink-900">
              <option value="asc">Ascending</option><option value="desc">Descending</option>
            </select>
          </label>
        </FiltersDialog>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3" aria-label="Loading listings" aria-busy="true">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="grid gap-3 rounded-2xl border border-ink-300 bg-white p-4 shadow-card sm:grid-cols-5"><SkeletonBlock className="h-10 w-full sm:col-span-2" />{Array.from({ length: 3 }, (_, cellIndex) => <SkeletonBlock key={cellIndex} className="h-10 w-full" />)}</div>)}
        </div>
      ) : listings.length === 0 ? (
        <EmptyState
          title="No listings yet"
          description="Add your first listing to start taking bookings."
          action={<Button onClick={() => setModalListing(null)}>Add listing</Button>}
        />
      ) : (
        <ListingsTable listings={listings} onEdit={setModalListing} onDelete={handleDelete} />
      )}

      {modalListing !== undefined && (
        <ListingFormModal
          initialListing={modalListing}
          onClose={() => setModalListing(undefined)}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  );
}
