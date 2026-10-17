import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Search, ShieldCheck, XCircle } from "lucide-react";
import AdminLayout from "../../components/layout/AdminLayout";
import Button from "../../components/common/Button";
import { verifyAdminBooking } from "../../api/bookings";
import { formatDateLong } from "../../utils/date";
import { formatPrice } from "../../utils/price";

export default function AdminBookingVerificationPage() {
  const [bookingId, setBookingId] = useState("");
  const [verification, setVerification] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");

  async function handleVerify(event) {
    event.preventDefault();
    const requestedId = bookingId.trim();
    if (!requestedId) return;

    setIsVerifying(true);
    setVerification(null);
    setError("");
    try {
      setVerification(await verifyAdminBooking(requestedId));
    } catch (err) {
      const response = err?.response;
      const code = response?.data?.code;
      const fallback = response?.status === 403
        ? "This reference is not connected to one of your listings."
        : response?.status === 404
          ? "No booking was found with that reference. Check the receipt and try again."
          : "Could not verify this booking reference.";
      setError({ code, message: response?.data?.message || fallback });
    } finally {
      setIsVerifying(false);
    }
  }

  const booking = verification?.booking;
  const statusDetails = {
    VALID: { title: "Valid booking", message: "Payment is verified and the booking is confirmed.", tone: "success" },
    EXPIRED: { title: "Booking expired", message: "This booking was valid, but its check-out date has passed.", tone: "warning" },
    CANCELLED: { title: "Booking cancelled", message: "This booking record is real, but it is no longer active.", tone: "warning" },
    REFUNDED: { title: "Booking refunded", message: "Payment was refunded, so this booking should not be treated as active.", tone: "warning" },
    PAYMENT_FAILED: { title: "Payment failed", message: "The booking exists, but its payment was unsuccessful. Do not accept it as paid.", tone: "warning" },
    PAYMENT_UNPAID: { title: "Payment outstanding", message: "The booking exists, but payment has not been completed.", tone: "warning" },
    PAYMENT_REFERENCE_MISSING: { title: "Payment reference missing", message: "The booking is marked paid without a payment reference. Review it before accepting it.", tone: "warning" },
    NOT_CONFIRMED: { title: "Booking not confirmed", message: "Payment is present, but the booking is not marked confirmed.", tone: "warning" },
  };
  const resultDetails = statusDetails[verification?.verificationStatus] || statusDetails.NOT_CONFIRMED;

  return (
    <AdminLayout>
      <div className="mx-auto max-w-3xl">
        <div className="mb-7">
          <p className="staye-eyebrow">Host tools</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy-900">Verify a booking</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">Use the public booking reference from a guest receipt to confirm that the booking belongs to one of your listings and that its payment and confirmation details are valid.</p>
        </div>

        <section className="rounded-2xl border border-ink-300 bg-white p-5 shadow-card sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-navy-900">Booking reference lookup</h2>
              <p className="mt-1 text-sm text-ink-500">Only bookings connected to your listings can be viewed.</p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="mt-5 flex flex-col gap-2 sm:flex-row">
            <input
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value)}
              placeholder="Paste booking reference (STY-0123..)"
              aria-label="Public booking reference"
              className="min-w-0 flex-1 rounded-xl border border-ink-300 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <Button type="submit" disabled={isVerifying || !bookingId.trim()}>
              <Search className="h-4 w-4" aria-hidden="true" />
              {isVerifying ? "Checking..." : "Verify booking"}
            </Button>
          </form>

          {error && <div className="mt-4 flex items-start gap-3 rounded-xl border border-danger/30 bg-red-50 px-4 py-3 text-sm text-danger"><XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><div><p className="font-semibold">{error.code === "INVALID_REFERENCE_FORMAT" ? "Invalid reference format" : error.code === "REFERENCE_NOT_FOUND" ? "Reference not found" : error.code === "REFERENCE_NOT_OWNED" ? "Reference not available" : "Verification failed"}</p><p className="mt-1">{error.message}</p></div></div>}

          {booking && (
            <div className={`mt-5 rounded-xl border p-4 ${verification.isValid ? "border-success/40 bg-brand-light/40" : "border-amber-300 bg-amber-50"}`}>
              <div className="flex items-start gap-3">
                {verification.isValid ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink-900">{resultDetails.title}</p>
                  <p className="mt-1 text-sm text-ink-700">{resultDetails.message}</p>
                  <div className="mt-4 grid gap-3 border-t border-ink-300/70 pt-4 text-sm text-ink-700 sm:grid-cols-2">
                    <div><p className="text-xs text-ink-500">Public reference</p><p className="mt-1 break-all font-medium">{booking.publicReference || booking._id}</p></div>
                    <div><p className="text-xs text-ink-500">Guest name</p><p className="mt-1 font-medium">{booking.userId?.name || "Unknown"}</p></div>
                    <div><p className="text-xs text-ink-500">Guest email</p><p className="mt-1 break-all font-medium">{booking.userId?.email || "Unknown"}</p></div>
                    <div><p className="text-xs text-ink-500">Listing</p><p className="mt-1 font-medium">{booking.listingId?.title || "Unknown"}</p></div>
                    <div><p className="text-xs text-ink-500">Room category</p><p className="mt-1 font-medium">{booking.roomId?.name || "Unknown"}</p></div>
                    <div><p className="text-xs text-ink-500">Stay dates</p><p className="mt-1 font-medium">{formatDateLong(booking.checkIn)} to {formatDateLong(booking.checkOut)}</p></div>
                    <div><p className="text-xs text-ink-500">Rooms booked</p><p className="mt-1 font-medium">{booking.rooms || 0}</p></div>
                    <div><p className="text-xs text-ink-500">Total amount</p><p className="mt-1 font-medium">{formatPrice(booking.totalAmount || 0)}</p></div>
                    <div><p className="text-xs text-ink-500">Payment</p><p className="mt-1 font-medium capitalize">{booking.paymentStatus || "unpaid"}</p></div>
                    <div><p className="text-xs text-ink-500">Booking status</p><p className="mt-1 font-medium capitalize">{booking.status || "unknown"}</p></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
