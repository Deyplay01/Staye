import React, { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import ListingsTable from "../../components/admin/ListingsTable";
import ListingFormModal from "../../components/admin/ListingFormModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";
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
    load(filters);
  }, []);

  async function load(params = filters) {
    setIsLoading(true);
    setError("");
    try {
      const data = await fetchMyListings(params);
      setListings(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Couldn't load your listings.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleFilterChange(field, value) {
    const next = { ...filters, [field]: value };
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
        <h1 className="text-2xl font-extrabold text-ink-900">Listings</h1>
        <Button onClick={() => setModalListing(null)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add listing
        </Button>
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-ink-300 bg-white p-4 shadow-card sm:flex-row sm:items-center sm:p-5">
        <label className="flex flex-1 items-center gap-2 rounded-sm border border-ink-300 px-3 py-2">
          <Search className="h-4 w-4 text-ink-500" aria-hidden="true" />
          <input
            value={filters.location}
            onChange={(event) => setFilters((current) => ({ ...current, location: event.target.value }))}
            onKeyDown={(event) => event.key === "Enter" && load(filters)}
            placeholder="Filter by location"
            className="w-full text-sm outline-none"
          />
        </label>
        <select value={filters.sortBy} onChange={(event) => handleFilterChange("sortBy", event.target.value)} className="rounded-sm border border-ink-300 px-3 py-2 text-sm">
          <option value="createdAt">Date created</option>
          <option value="updatedAt">Date modified</option>
          <option value="title">Title</option>
          <option value="price">Price</option>
        </select>
        <select value={filters.order} onChange={(event) => handleFilterChange("order", event.target.value)} className="rounded-sm border border-ink-300 px-3 py-2 text-sm">
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
        <Button variant="outline" onClick={() => load(filters)}>Apply</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-sm border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner label="Loading listings..." />
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
