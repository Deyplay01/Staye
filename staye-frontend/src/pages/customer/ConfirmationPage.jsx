import React, { useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { CheckCircle2, Calendar } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import { fetchBookingById } from "../../api/bookings";
import { fetchListingById } from "../../api/listings";
import { formatDateLong, calculateNights } from "../../utils/date";
import { formatPrice } from "../../utils/price";
import { verifyPaystackPayment, initializePaystackPayment, refundPaystackPayment } from "../../api";

const STATUS_LABEL = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export default function ConfirmationPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const callbackBookingId = bookingId || searchParams.get("bookingId");
  const reference = searchParams.get("reference") || searchParams.get("trxref");
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(!location.state?.booking);
  const [paymentMessage, setPaymentMessage] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  useEffect(() => {
    if (!booking) {
      fetchBookingById(callbackBookingId)
        .then(setBooking)
        .finally(() => setIsLoading(false));
    }
  }, [callbackBookingId, booking]);

  useEffect(() => {
    if (!reference || !booking || booking.paymentStatus === "paid") return;
    verifyPaystackPayment(callbackBookingId, reference, localStorage.getItem("staye_token"))
      .then((result) => {
        setBooking(result.booking);
        setPaymentMessage("Payment confirmed successfully.");
      })
      .catch((error) => setPaymentMessage(error.message || "Payment could not be verified yet."));
  }, [callbackBookingId, booking, reference]);

  async function handlePay() {
    setIsPaying(true);
    setPaymentMessage("");
    try {
      const payment = await initializePaystackPayment(callbackBookingId, localStorage.getItem("staye_token"));
      window.location.assign(payment.authorizationUrl);
    } catch (error) {
      setPaymentMessage(error.message || "Unable to start payment.");
      setIsPaying(false);
    }
  }

  async function handleRefund() {
    setIsRefunding(true);
    try {
      const result = await refundPaystackPayment(bookingId, localStorage.getItem("staye_token"));
      setBooking(result.booking);
      setPaymentMessage("Payment refunded and booking cancelled.");
    } catch (error) {
      setPaymentMessage(error.message || "Unable to refund this payment.");
    } finally {
      setIsRefunding(false);
    }
  }

  useEffect(() => {
    // listingId is only populated when fetched via /bookings/my-bookings, so
    // fetch the listing separately here just to show its title/location.
    if (booking?.listingId) {
      const id = typeof booking.listingId === "string" ? booking.listingId : booking.listingId._id;
      fetchListingById(id)
        .then(setListing)
        .catch(() => setListing(null));
    }
  }, [booking]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <LoadingSpinner label="Loading your booking..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <EmptyState
            title="We couldn't find that booking"
            action={
              <Link to="/" className="text-sm font-semibold text-brand hover:underline">
                Back to home
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const nights = calculateNights(booking.checkIn, booking.checkOut);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        <div className="rounded-sm border border-ink-300 bg-white p-6 text-center shadow-card sm:p-8">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-extrabold text-ink-900">Booking created!</h1>
          <p className="mt-1 text-sm text-ink-500">
            Status: <span className="font-medium">{STATUS_LABEL[booking.status] || booking.status}</span>
          </p>
          {paymentMessage && <p className="mt-3 rounded-sm bg-brand-light px-3 py-2 text-sm text-ink-700">{paymentMessage}</p>}

          <div className="mt-6 rounded-sm bg-brand-light p-4 text-left">
            <p className="text-xs uppercase tracking-wide text-ink-500">Booking ID</p>
            <p className="text-lg font-extrabold tracking-wide text-navy-900">{booking._id}</p>
          </div>

          <div className="mt-6 space-y-3 text-left text-sm">
            <div className="flex items-center gap-3 border-b border-ink-300 pb-3">
              <Calendar className="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <p className="font-medium text-ink-900">{listing?.title || "Listing"}</p>
                <p className="text-ink-500">
                  {formatDateLong(booking.checkIn)} → {formatDateLong(booking.checkOut)} ·{" "}
                  {nights} night{nights !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            {typeof booking.totalAmount === "number" && (
              <div className="flex justify-between pt-1 text-base font-bold text-ink-900">
                <span>Total</span>
                <span>{formatPrice(booking.totalAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-ink-500">
              <span>Payment status</span>
              <span className="font-medium capitalize">{booking.paymentStatus || "unpaid"}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {booking.paymentStatus !== "paid" && booking.status !== "cancelled" && (
              <Button onClick={handlePay} disabled={isPaying}>
                {isPaying ? "Opening payment..." : "Pay now"}
              </Button>
            )}
            {booking.paymentStatus === "paid" && booking.status !== "cancelled" && (
              <Button variant="outline" onClick={handleRefund} disabled={isRefunding}>
                {isRefunding ? "Refunding..." : "Request refund"}
              </Button>
            )}
            <Link to="/my-bookings">
              <Button variant={booking.paymentStatus === "paid" ? "primary" : "outline"}>View my bookings</Button>
            </Link>
            <Link to="/">
              <Button variant="outline">Back to home</Button>
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
