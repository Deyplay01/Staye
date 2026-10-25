import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, X } from "lucide-react";
import Button from "../common/Button";
import { useAuth } from "../../context/AuthContext";
import { createBooking } from "../../api/bookings";
import { getImageUrl, initializePaystackPayment } from "../../api";
import { calculateNights, formatDateLong } from "../../utils/date";
import { calculateTotalCost, formatPrice } from "../../utils/price";

export default function BookingReviewDialog({
  listing,
  checkIn,
  checkOut,
  selectedRoomId,
  setSelectedRoomId,
  isOpen,
  onClose,
}) {
  const dialogRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [rooms, setRooms] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const selectedRoom = (listing?.rooms || []).find((room) => (room._id || room.name) === selectedRoomId) || (listing?.rooms || [])[0] || null;
  const nights = calculateNights(checkIn, checkOut);
  const estimatedTotal = selectedRoom ? calculateTotalCost(selectedRoom.price * rooms, nights) : 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  function handleClose() {
    if (!isSubmitting) onClose();
  }

  async function handleContinue() {
    if (!isAuthenticated) {
      const returnTo = `${location.pathname}${location.search}`;
      navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (!selectedRoom || nights < 1) {
      setSubmitError("Choose a room and valid dates before continuing.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);
    try {
      const booking = await createBooking({
        listingId: listing._id,
        roomId: selectedRoom._id || selectedRoom.name,
        checkIn,
        checkOut,
        rooms,
      });
      const payment = await initializePaystackPayment(booking._id, localStorage.getItem("staye_token"));
      if (!payment.authorizationUrl) throw new Error("Paystack did not return a payment URL.");
      window.location.assign(payment.authorizationUrl);
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;
      setSubmitError(status === 409
        ? message || "Those dates were just booked by someone else. Try different dates."
        : message || error.message || "Something went wrong creating this booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="booking-review-title"
      onClose={onClose}
      onCancel={(event) => {
        if (isSubmitting) event.preventDefault();
        else onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) handleClose();
      }}
      className="m-auto max-h-[calc(100vh-1rem)] w-[calc(100vw-1rem)] max-w-xl overflow-y-auto rounded-2xl border border-ink-300 bg-white p-0 text-ink-900 shadow-popover backdrop:bg-slate-950/55"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-300 bg-white px-4 py-4 sm:px-6">
        <div>
          <h2 id="booking-review-title" className="text-lg font-bold text-navy-900">Review your booking</h2>
          <p className="mt-1 text-xs text-ink-500">Check your stay details before continuing to payment.</p>
        </div>
        <button type="button" onClick={handleClose} disabled={isSubmitting} aria-label="Close booking review" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-500 transition hover:bg-slate-100 hover:text-ink-900 disabled:opacity-50">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <img
            src={getImageUrl(listing?.images?.[0], 320) || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=80"}
            alt=""
            className="h-16 w-20 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{listing?.title}</p>
            <p className="truncate text-sm text-ink-500">{listing?.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-ink-500"><CalendarDays className="h-3 w-3" aria-hidden="true" /> Check-in</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{formatDateLong(checkIn)}</p>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase text-ink-500">Check-out</p>
            <p className="mt-1 text-sm font-semibold text-ink-900">{formatDateLong(checkOut)}</p>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-ink-700">Room category</legend>
          {(listing?.rooms || []).map((room) => {
            const roomId = room._id || room.name;
            const isSelected = (selectedRoom?._id || selectedRoom?.name) === roomId;
            return (
              <button
                key={roomId}
                type="button"
                onClick={() => {
                  setSelectedRoomId(roomId);
                  setRooms(1);
                  setSubmitError("");
                }}
                aria-pressed={isSelected}
                className={`w-full rounded-xl border p-3 text-left transition ${isSelected ? "border-brand bg-brand-light" : "border-ink-300 bg-white hover:border-slate-400"}`}
              >
                <span className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-ink-900">{room.name}</span>
                  <span className="shrink-0 font-semibold text-ink-900">{formatPrice(room.price)} <span className="text-xs font-normal text-ink-500">/ night</span></span>
                </span>
              </button>
            );
          })}
        </fieldset>

        {selectedRoom && (
          <label className="block text-sm font-semibold text-ink-700">
            Number of rooms
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
              className="mt-1 block w-full rounded-xl border border-ink-300 px-3 py-2.5 text-sm font-normal text-ink-900 outline-none focus:border-brand sm:w-36"
            />
            <span className="mt-1 block text-xs font-normal text-ink-500">Up to {selectedRoom.totalRooms || 1} rooms available in this category.</span>
          </label>
        )}

        {selectedRoom && (
          <div className="space-y-2 border-t border-ink-300 pt-4 text-sm">
            <div className="flex justify-between gap-3 text-ink-500">
              <span>{formatPrice(selectedRoom.price)} × {rooms} room{rooms !== 1 ? "s" : ""} × {nights} night{nights !== 1 ? "s" : ""}</span>
              <span className="shrink-0">{formatPrice(estimatedTotal)}</span>
            </div>
            <div className="flex justify-between gap-3 border-t border-ink-300 pt-3 text-base font-bold text-ink-900">
              <span>Estimated total</span>
              <span className="shrink-0">{formatPrice(estimatedTotal)}</span>
            </div>
          </div>
        )}

        {submitError && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-danger">{submitError}</p>}
        <p className="text-xs leading-5 text-ink-500">You’ll continue to Paystack to complete payment securely.</p>
        <Button className="w-full" size="lg" disabled={isSubmitting || !selectedRoom || nights < 1} onClick={handleContinue}>
          {isSubmitting ? "Opening payment..." : "Continue to payment"}
        </Button>
      </div>
    </dialog>
  );
}