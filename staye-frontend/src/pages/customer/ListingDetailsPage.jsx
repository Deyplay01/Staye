import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, MapPin } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import ImageGallery from "../../components/listings/ImageGallery";
import AmenityList from "../../components/listings/AmenityList";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { useAuth } from "../../context/AuthContext";
import { fetchListingById } from "../../api/listings";
import { calculateNights, todayISO, addDaysISO } from "../../utils/date";
import { calculateTotalCost, formatPrice } from "../../utils/price";

export default function ListingDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || addDaysISO(todayISO(), 1));
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || addDaysISO(todayISO(), 2));
  const [selectedRoomId, setSelectedRoomId] = useState(searchParams.get("roomId") || "");

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

  function handleReserve() {
    if (!selectedRoom) return;
    const bookingPath = `/booking/${listing._id}?checkIn=${checkIn}&checkOut=${checkOut}&roomId=${selectedRoom._id || selectedRoom.name}`;
    if (!isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(bookingPath)}`);
      return;
    }
    navigate(bookingPath);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner label="Loading listing..." />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <EmptyState
            title="Listing not found"
            description={error || "This listing may have been removed."}
            action={
              <Link to="/" className="text-sm font-semibold text-brand hover:underline">
                Back to all listings
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back to listings
          </Button>
        </div>

        <div className="flex flex-col gap-8 sm:flex-row">
          <div className="flex-1">
            <ImageGallery images={listing.images} alt={listing.title} />

            <div className="mt-6">
              <h1 className="text-2xl font-bold text-ink-900">{listing.title}</h1>
              <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {listing.location}
              </p>

              <p className="mt-4 text-sm leading-relaxed text-ink-700">{listing.description}</p>

              {listing.rooms?.length > 0 && (
                <div className="mt-6 border-t border-ink-300 pt-6">
                  <h2 className="mb-3 text-lg font-bold text-ink-900">Room categories</h2>
                  <div className="space-y-3">
                    {listing.rooms.map((room) => {
                      const isSelected = (selectedRoom?._id || selectedRoom?.name) === (room._id || room.name);
                      return (
                        <button
                          key={room._id || room.name}
                          type="button"
                          onClick={() => setSelectedRoomId(room._id || room.name)}
                          className={`w-full rounded-xl border p-4 text-left transition ${isSelected ? "border-brand bg-brand-light" : "border-ink-300 bg-white hover:border-brand"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-ink-900">{room.name}</p>
                              <p className="mt-1 text-sm text-ink-600">{room.description || "Comfortable room with a restful stay."}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-ink-900">{formatPrice(room.price)}</p>
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
                </div>
              )}

              {listing.amenities?.length > 0 && (
                <div className="mt-6 border-t border-ink-300 pt-6">
                  <h2 className="mb-3 text-lg font-bold text-ink-900">Amenities</h2>
                  <AmenityList amenities={listing.amenities} />
                </div>
              )}
            </div>
          </div>

          <aside className="w-full shrink-0 sm:w-80 lg:w-80">
            <div className="rounded-2xl border border-ink-300 bg-white p-6 shadow-card lg:sticky lg:top-24">
              <p className="text-sm text-ink-500">Selected room</p>
              <p className="text-2xl font-bold text-ink-900">{selectedRoom ? selectedRoom.name : "Choose a room"}</p>
              <p className="mt-2 text-lg font-semibold text-ink-700">{selectedRoom ? formatPrice(selectedRoom.price) : "—"} per night</p>

              <div className="mt-4 space-y-3 border-t border-ink-300 pt-4">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-700">Check-in</span>
                  <input
                    type="date"
                    value={checkIn}
                    min={todayISO()}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full rounded-sm border border-ink-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-700">Check-out</span>
                  <input
                    type="date"
                    value={checkOut}
                    min={checkIn}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full rounded-sm border border-ink-300 px-3 py-2 text-sm"
                  />
                </label>
              </div>

              <div className="mt-4 space-y-1 border-t border-ink-300 pt-4 text-sm">
                <div className="flex justify-between text-ink-500">
                  <span>
                    {selectedRoom ? `${formatPrice(selectedRoom.price)} × ${nights} night${nights !== 1 ? "s" : ""}` : "Select a room"}
                  </span>
                  <span>{selectedRoom ? formatPrice(estimatedTotal) : "—"}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-ink-900">
                  <span>Estimated total</span>
                  <span>{selectedRoom ? formatPrice(estimatedTotal) : "—"}</span>
                </div>
              </div>

              <Button className="mt-4 w-full" size="lg" disabled={nights === 0 || !selectedRoom} onClick={handleReserve}>
                Reserve
              </Button>
              {nights === 0 && (
                <p className="mt-2 text-xs text-danger">Select a valid check-in and check-out date.</p>
              )}
              {!selectedRoom && (
                <p className="mt-2 text-xs text-danger">Choose a room category to continue.</p>
              )}
              <p className="mt-2 text-xs text-ink-500">
                Availability is confirmed when you book — dates can occasionally be taken by someone
                else in the meantime.
              </p>
            </div>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  );
}
