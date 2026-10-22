import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, MapPin } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import ListingRoomsPanel from "../../components/admin/ListingRoomsPanel";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Button from "../../components/common/Button";
import { fetchMyListings, updateListing } from "../../api/listings";
import { getImageUrl } from "../../api";

export default function AdminListingRoomsPage() {
  const { listingId } = useParams();
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError("");

    fetchMyListings({}, { signal: controller.signal })
      .then((listings) => {
        const selectedListing = listings.find((item) => item._id === listingId);
        if (selectedListing) setListing(selectedListing);
      })
      .catch((requestError) => {
        if (requestError.name !== "CanceledError") {
          setError(requestError?.response?.data?.message || "Couldn't load this listing.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [listingId]);

  async function handleRoomSave(rooms) {
    const updated = await updateListing(listing._id, {
      title: listing.title,
      description: listing.description,
      location: listing.location,
      images: listing.images || [],
      amenities: listing.amenities || [],
      rooms,
    });
    setListing(updated);
  }

  return (
    <AdminLayout>
      <div className="mx-auto max-w-5xl">
        <Link to="/admin/listings" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-navy-900">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to listings
        </Link>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        {isLoading ? (
          <LoadingSpinner label="Loading listing rooms..." />
        ) : !listing ? (
          <EmptyState
            title="Listing not found"
            description="This listing may have been removed or may not belong to your account."
            action={
              <Link to="/admin/listings">
                <Button variant="outline">Back to listings</Button>
              </Link>
            }
          />
        ) : (
          <>
            <header className="mb-6 flex flex-wrap items-center gap-4">
              {listing.images?.[0] && (
                <img
                  src={getImageUrl(listing.images[0])}
                  alt=""
                  className="h-20 w-28 rounded-xl object-cover"
                />
              )}
              <div className="min-w-0">
                <p className="staye-eyebrow">Room inventory</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-navy-900 sm:text-3xl">{listing.title}</h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {listing.location}
                </p>
              </div>
            </header>

            <ListingRoomsPanel listing={listing} onSave={handleRoomSave} />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
