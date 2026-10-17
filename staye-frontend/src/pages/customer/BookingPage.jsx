import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { fetchListingById } from "../../api/listings";
import { createBooking } from "../../api/bookings";
import { getImageUrl, initializePaystackPayment } from "../../api";
import { calculateNights, formatDateLong } from "../../utils/date";
import { calculateTotalCost, formatPrice } from "../../utils/price";

export default function BookingPage() {
  const { listingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const roomIdParam = searchParams.get("roomId") || "";

  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [rooms, setRooms] = useState(1);
  const [selectedRoomId, setSelectedRoomId] = useState(roomIdParam);

  useEffect(() => {
    fetchListingById(listingId)
      .then((data) => setListing(data))
      .finally(() => setIsLoading(false));
  }, [listingId]);

  const selectedRoom = (listing?.rooms || []).find((room) => (room._id || room.name) === selectedRoomId) || (listing?.rooms || [])[0] || null;
  const nights = calculateNights(checkIn, checkOut);
  const estimatedTotal = selectedRoom ? calculateTotalCost(selectedRoom.price * rooms, nights) : 0;

  async function handleConfirm() {
    if (!selectedRoom) {
      setSubmitError("Please choose a room category before continuing.");
      return;
    }
    setSubmitError("");
    setIsSubmitting(true);
    try {
      const booking = await createBooking({ listingId, roomId: selectedRoom._id || selectedRoom.name, checkIn, checkOut, rooms });
      const payment = await initializePaystackPayment(booking._id, localStorage.getItem("staye_token"));
      if (!payment.authorizationUrl) throw new Error("Paystack did not return a payment URL.");
      window.location.assign(payment.authorizationUrl);
    } catch (err) {
      const status = err?.response?.status;
      const serverMessage = err?.response?.data?.message;
      if (status === 409) {
        setSubmitError(serverMessage || "Those dates were just booked by someone else. Try different dates.");
      } else {
        setSubmitError(serverMessage || err.message || "Something went wrong creating this booking. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner label="Preparing your booking..." />
      </div>
    );
  }

  if (!listing || !checkIn || !checkOut) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <EmptyState
            title="We couldn't set up this booking"
            description="The listing or dates are missing. Please start again from the listing page."
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
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back to listing
          </Button>
        </div>

        <h1 className="mb-6 text-2xl font-bold text-ink-900">Review your booking</h1>

        <div className="rounded-2xl border border-ink-300 bg-white p-6 shadow-card">
          <div className="flex gap-3">
            <img
              src={getImageUrl(listing.images?.[0]) || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=80"}
              alt=""
              className="h-16 w-20 rounded-sm object-cover"
            />
            <div>
              <p className="font-semibold text-ink-900">{listing.title}</p>
              <p className="text-xs text-ink-500">{listing.location}</p>
            </div>
          </div>

          <div className="mt-4 space-y-1 border-t border-ink-300 pt-4 text-sm text-ink-700">
            <div className="flex justify-between">
              <span>Check-in</span>
              <span className="font-medium">{formatDateLong(checkIn)}</span>
            </div>
            <div className="flex justify-between">
              <span>Check-out</span>
              <span className="font-medium">{formatDateLong(checkOut)}</span>
            </div>
          </div>

          <div className="mt-4 border-t border-ink-300 pt-4">
            <p className="mb-2 text-sm font-semibold text-ink-700">Room category</p>
            <div className="space-y-2">
              {(listing.rooms || []).map((room) => (
                <button
                  key={room._id || room.name}
                  type="button"
                  onClick={() => {
                    const nextRoomId = room._id || room.name;
                    setSelectedRoomId(nextRoomId);
                    const currentPath = `${window.location.pathname}?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&roomId=${encodeURIComponent(nextRoomId)}`;
                    window.history.replaceState(null, "", currentPath);
                  }}
                  className={`w-full rounded-xl border px-3 py-2 text-left ${selectedRoom && ((selectedRoom._id || selectedRoom.name) === (room._id || room.name)) ? "border-brand bg-brand-light" : "border-ink-300 bg-white"}`}
                >
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-medium text-ink-900">{room.name}</span>
                    <span className="font-semibold text-ink-900">{formatPrice(room.price)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedRoom && (
            <label className="mt-4 block border-t border-ink-300 pt-4">
              <span className="mb-1.5 block text-sm font-semibold text-ink-700">Number of rooms</span>
              <input
                type="number"
                min="1"
                max={selectedRoom.totalRooms || 1}
                step="1"
                value={rooms}
                onChange={(event) => {
                  const roomCount = Number(event.target.value);
                  setRooms(Math.min(Math.max(roomCount || 1, 1), selectedRoom.totalRooms || 1));
                }}
                className="w-28 rounded-xl border border-ink-300 bg-white px-3 py-3 text-sm outline-none focus:border-brand"
              />
              <span className="mt-1 block text-xs text-ink-500">Up to {selectedRoom.totalRooms || 1} rooms available in this category.</span>
            </label>
          )}

          {selectedRoom && (
            <div className="mt-4 space-y-1 border-t border-ink-300 pt-4 text-sm">
              <div className="flex justify-between text-ink-500">
                <span>
                  {formatPrice(selectedRoom.price)} × {rooms} room{rooms !== 1 ? "s" : ""} × {nights} night{nights !== 1 ? "s" : ""}
                </span>
                <span>{formatPrice(estimatedTotal)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-ink-900">
                <span>Estimated total</span>
                <span>{formatPrice(estimatedTotal)}</span>
              </div>
            </div>
          )}

          {submitError && (
            <p className="mt-4 rounded-sm bg-red-50 px-3 py-2 text-sm text-danger">{submitError}</p>
          )}

          <p className="mt-4 text-xs text-ink-500">You will be redirected to Paystack to complete payment securely.</p>

          <Button className="mt-4 w-full" size="lg" disabled={isSubmitting || !selectedRoom} onClick={handleConfirm}>
            {isSubmitting ? "Opening payment..." : "Continue to payment"}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}
