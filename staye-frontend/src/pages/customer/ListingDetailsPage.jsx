import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { MapPin, Star } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ImageGallery from "../../components/listings/ImageGallery";
import AmenityList from "../../components/listings/AmenityList";
import SkeletonBlock from "../../components/common/SkeletonBlock";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import BookingReviewDialog from "../../components/booking/BookingReviewDialog";
import SeoMetadata from "../../components/common/SeoMetadata";
import { fetchListingById } from "../../api/listings";
import { calculateNights, todayISO, addDaysISO } from "../../utils/date";
import { calculateTotalCost, formatPrice } from "../../utils/price";

export default function ListingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || addDaysISO(todayISO(), 1));
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || addDaysISO(todayISO(), 2));
  const [selectedRoomId, setSelectedRoomId] = useState(searchParams.get("roomId") || "");
  const [isBookingReviewOpen, setIsBookingReviewOpen] = useState(searchParams.get("reserve") === "1");

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchListingById(id)
      .then((data) => {
        if (active) {
          setListing(data);
          if (!selectedRoomId && Array.isArray(data.rooms) && data.rooms[0]) {
            setSelectedRoomId(data.rooms[0]._id || data.rooms[0].name);
          }
        }
      })
      .catch((err) => {
        if (active) setError(err?.response?.data?.message || "Couldn't load this listing.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const selectedRoom = (listing?.rooms || []).find((room) => (room._id || room.name) === selectedRoomId) || (listing?.rooms || [])[0] || null;
  const nights = calculateNights(checkIn, checkOut);
  const estimatedTotal = selectedRoom ? calculateTotalCost(selectedRoom.price, nights) : 0;
  const hostName = listing?.hostName?.trim();
  const hostInitials = hostName?.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  const listingDescription = listing?.description?.replace(/\s+/g, " ").trim();
  const listingImages = listing?.images?.filter((image) => /^https?:\/\//i.test(image)) || [];
  const structuredData = listing && {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: listing.title,
    description: listingDescription,
    url: `https://staye.vercel.app/listings/${listing._id}`,
    ...(listingImages.length ? { image: listingImages } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: listing.location,
    },
  };
  const seoMetadata = (
    <SeoMetadata
      title={listing ? `${listing.title} in ${listing.location} | Staye` : "Stay listing | Staye"}
      description={listingDescription
        ? `${listingDescription.slice(0, 150)}${listingDescription.length > 150 ? "…" : ""}`
        : "View this place to stay, compare room options, and plan your trip with Staye."}
      canonicalPath={`/listings/${listing?._id || id}`}
      image={structuredData?.image?.[0]}
      structuredData={structuredData}
      noIndex={!listing}
    />
  );

  function handleReserve() {
    if (!selectedRoom) return;
    setIsBookingReviewOpen(true);
  }

  function closeBookingReview() {
    setIsBookingReviewOpen(false);
    if (searchParams.get("reserve") === "1") {
      const nextSearch = new URLSearchParams(searchParams);
      nextSearch.delete("reserve");
      navigate({ pathname: location.pathname, search: nextSearch.toString() }, { replace: true });
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {seoMetadata}
        <Navbar />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8" aria-label="Loading listing" aria-busy="true">
          <SkeletonBlock className="h-8 w-2/3" />
          <SkeletonBlock className="mt-3 h-4 w-1/3" />
          <div className="mt-6 grid aspect-[4/3] grid-cols-1 gap-2 overflow-hidden rounded-2xl bg-white md:aspect-[2.65/1] md:grid-cols-4 md:grid-rows-2">
            <SkeletonBlock className="h-full md:col-span-2 md:row-span-2" />
            <SkeletonBlock className="hidden h-full md:block" />
            <SkeletonBlock className="hidden h-full md:block" />
            <SkeletonBlock className="hidden h-full md:block" />
            <SkeletonBlock className="hidden h-full md:block" />
          </div>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
            <div className="space-y-4">
              <SkeletonBlock className="h-6 w-1/3" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-28 w-full" />
            </div>
            <SkeletonBlock className="h-80 w-full rounded-2xl" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-slate-50">
        {seoMetadata}
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <EmptyState
            title="Listing not found"
            description={error || "This listing may have been removed."}
            action={
              <Link to="/" className="text-sm font-semibold text-slate-700 hover:text-slate-900 hover:underline">
                Back to all listings
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {seoMetadata}
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="mb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{listing.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                {listing.location}
                {Number(listing.rating) > 0 && <><span className="mx-1">·</span><Star className="h-3.5 w-3.5 fill-current text-ink-900" aria-hidden="true" /><span className="font-semibold text-ink-900">{Number(listing.rating).toFixed(1)}</span></>}
                {Number(listing.reviewCount) > 0 && <span className="underline">({listing.reviewCount} reviews)</span>}
              </p>
            </div>
          </div>
        </div>

        <ImageGallery images={listing.images} alt={listing.title} />

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-7">
            {hostName && (
              <section className="flex items-center gap-4 border-b border-ink-300 pb-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-ink-900" aria-hidden="true">
                  {hostInitials}
                </div>
                <div>
                  <p className="font-semibold text-ink-900">Hosted by {hostName}</p>
                  <p className="mt-0.5 text-sm text-ink-500">Your property host</p>
                </div>
              </section>
            )}
            <section className="border-b border-ink-300 pb-6">
              <h2 className="text-lg font-bold text-ink-900">About this stay</h2>
              <p className="mt-3 text-sm leading-6 text-ink-700">{listing.description}</p>
            </section>

            {listing.rooms?.length > 0 && (
              <section className="border-b border-ink-300 pb-6">
                <h2 className="mb-3 text-lg font-bold text-ink-900">Room categories</h2>
                <div className="space-y-3">
                  {listing.rooms.map((room) => {
                    const isSelected = (selectedRoom?._id || selectedRoom?.name) === (room._id || room.name);
                    return (
                      <button
                        key={room._id || room.name}
                        type="button"
                        onClick={() => setSelectedRoomId(room._id || room.name)}
                        className={`w-full rounded-xl border p-4 text-left transition ${isSelected ? "border-slate-900 bg-slate-100" : "border-ink-300 bg-white hover:border-slate-400"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-ink-900">{room.name}</p>
                            <p className="mt-1 text-sm text-ink-600">{room.description || "Comfortable room with a restful stay."}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-lg font-bold text-ink-900">{formatPrice(room.price)}</p>
                            <p className="text-xs text-ink-500">per night</p>
                          </div>
                        </div>
                        {room.amenities?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {room.amenities.map((amenity) => (
                              <span key={`${room._id || room.name}-${amenity}`} className="rounded-full bg-white px-2 py-1 text-[11px] text-ink-700">
                                {amenity}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {listing.amenities?.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-bold text-ink-900">Amenities</h2>
                <AmenityList amenities={listing.amenities} />
              </section>
            )}
          </div>

          <aside>
            <div className="space-y-4 rounded-2xl border border-ink-300 bg-white p-5 shadow-card lg:sticky lg:top-24">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <span className="text-2xl font-bold text-ink-900">{selectedRoom ? formatPrice(selectedRoom.price) : "—"}</span>
                  <span className="text-sm text-ink-500"> / night</span>
                </div>
                {Number(listing.rating) > 0 && (
                  <span className="flex items-center gap-1 text-sm font-semibold text-ink-900">
                    <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" /> {Number(listing.rating).toFixed(1)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-ink-300">
                <label className="min-w-0 border-r border-ink-300 bg-slate-50 p-3">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-ink-500">Check-in</span>
                  <input type="date" value={checkIn} min={todayISO()} onChange={(event) => setCheckIn(event.target.value)} className="w-full min-w-0 bg-transparent text-xs font-semibold text-ink-900 outline-none" />
                </label>
                <label className="min-w-0 bg-slate-50 p-3">
                  <span className="mb-1 block text-[10px] font-bold uppercase text-ink-500">Check-out</span>
                  <input type="date" value={checkOut} min={checkIn} onChange={(event) => setCheckOut(event.target.value)} className="w-full min-w-0 bg-transparent text-xs font-semibold text-ink-900 outline-none" />
                </label>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-[10px] font-bold uppercase text-ink-500">Selected room</p>
                <p className="mt-1 truncate text-sm font-semibold text-ink-900">{selectedRoom ? selectedRoom.name : "Choose a room"}</p>
              </div>

              <Button className="w-full" size="lg" disabled={nights === 0 || !selectedRoom} onClick={handleReserve}>
                Reserve stay
              </Button>

              <div className="space-y-2 border-t border-ink-300 pt-4 text-sm">
                <div className="flex justify-between gap-3 text-ink-500">
                  <span>{selectedRoom ? `${formatPrice(selectedRoom.price)} × ${nights} night${nights !== 1 ? "s" : ""}` : "Select a room"}</span>
                  <span className="shrink-0">{selectedRoom ? formatPrice(estimatedTotal) : "—"}</span>
                </div>
                <div className="flex justify-between gap-3 border-t border-ink-300 pt-3 font-bold text-ink-900">
                  <span>Estimated total</span>
                  <span className="shrink-0">{selectedRoom ? formatPrice(estimatedTotal) : "—"}</span>
                </div>
              </div>
              {nights === 0 && <p className="text-xs text-danger">Select a valid check-in and check-out date.</p>}
              {!selectedRoom && <p className="text-xs text-danger">Choose a room category to continue.</p>}
              <p className="text-xs leading-5 text-ink-500">Availability is confirmed when you book; dates can occasionally be taken by someone else in the meantime.</p>
            </div>
          </aside>
        </div>
      </main>
      <BookingReviewDialog
        listing={listing}
        checkIn={checkIn}
        checkOut={checkOut}
        selectedRoomId={selectedRoomId}
        setSelectedRoomId={setSelectedRoomId}
        isOpen={isBookingReviewOpen}
        onClose={closeBookingReview}
      />
      <Footer />
    </div>
  );
}
