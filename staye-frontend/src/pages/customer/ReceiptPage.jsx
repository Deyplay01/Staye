import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download, Printer } from "lucide-react";
import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import BrandLogo from "../../components/common/BrandLogo";
import SkeletonBlock from "../../components/common/SkeletonBlock";
import EmptyState from "../../components/common/EmptyState";
import Button from "../../components/common/Button";
import Badge from "../../components/common/Badge";
import HomeIconLink from "../../components/common/HomeIconLink";
import { fetchBookingById } from "../../api/bookings";
import { calculateNights, formatDateLong } from "../../utils/date";
import { formatPrice } from "../../utils/price";
import { downloadReceiptAsPdf } from "../../utils/receipt";

const STATUS_LABELS = {
  pending_payment: "Pending payment",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

export default function ReceiptPage() {
  const { bookingId } = useParams();
  const receiptRef = useRef(null);
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBookingById(bookingId)
      .then(setBooking)
      .catch((err) => setError(err?.response?.data?.message || "Couldn't load this receipt."))
      .finally(() => setIsLoading(false));
  }, [bookingId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-10" aria-label="Loading receipt" aria-busy="true">
          <article className="space-y-6 rounded-2xl border border-ink-300 bg-white p-6 shadow-card sm:p-10">
            <div className="flex items-start justify-between border-b border-ink-300 pb-6">
              <div className="space-y-2">
                <SkeletonBlock className="h-8 w-32" />
                <SkeletonBlock className="h-4 w-28" />
              </div>
              <SkeletonBlock className="h-4 w-28" />
            </div>
            <div className="grid gap-6 border-y border-ink-300 py-6 sm:grid-cols-2">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="space-y-2">
                  <SkeletonBlock className="h-3 w-24" />
                  <SkeletonBlock className="h-5 w-40" />
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <SkeletonBlock className="h-6 w-48" />
              <SkeletonBlock className="h-12 w-full rounded-xl" />
              <SkeletonBlock className="h-5 w-full" />
            </div>
          </article>
        </main>
      </div>
    );
  }
  if (!booking) {
    return (
      <div className="min-h-screen bg-[#FAFAFA]">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-16">
          <EmptyState
            title="Receipt unavailable"
            description={error || "This booking could not be found."}
            action={<Link to="/my-bookings" className="text-sm font-semibold text-brand hover:underline">Back to my bookings</Link>}
          />
        </div>
      </div>
    );
  }

  const listing = booking.listingId || {};
  const room = booking.roomId || {};
  const guest = booking.userId || {};
  const nights = calculateNights(booking.checkIn, booking.checkOut);
  const isPaid = booking.paymentStatus === "paid";

  async function handleDownloadReceipt() {
    setIsDownloading(true);
    setDownloadError("");
    try {
      await downloadReceiptAsPdf(receiptRef.current, `staye-receipt-${booking.publicReference || booking._id}.pdf`);
    } catch (downloadFailure) {
      console.error("Unable to generate receipt PDF:", downloadFailure);
      setDownloadError("The PDF could not be generated. Please try again or use Print / save PDF.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] print:bg-white">
      <div className="print:hidden"><Navbar /></div>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <HomeIconLink />
            <Link to="/my-bookings"><Button type="button" variant="outline" size="sm"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to bookings</Button></Link>
          </div>
          {isPaid && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden="true" /> Print / save PDF
              </Button>
              <Button type="button" size="sm" disabled={isDownloading} onClick={handleDownloadReceipt}>
                <Download className="h-4 w-4" aria-hidden="true" />
                {isDownloading ? "Preparing PDF..." : "Download receipt"}
              </Button>
            </div>
          )}
        </div>
        {downloadError && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger print:hidden">{downloadError}</p>}

        <article ref={receiptRef} className="receipt-paper rounded-2xl border border-ink-300 bg-white p-5 shadow-card sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <header className="flex flex-wrap items-start justify-between gap-5 border-b border-ink-300 pb-6">
            <div>
              <BrandLogo asText size="compact" />
              <p className="mt-1 text-sm text-ink-500">Booking receipt</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Receipt date</p>
              <p className="mt-1 text-sm font-semibold text-ink-900">{formatDateLong(new Date())}</p>
            </div>
          </header>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Booking reference</p>
              <p className="mt-1 break-all text-lg font-bold text-navy-900">{booking.publicReference || booking._id}</p>
            </div>
            <Badge status={booking.status === "confirmed" ? "Confirmed" : booking.status === "cancelled" ? "Cancelled" : "Pending"}>
              {STATUS_LABELS[booking.status] || booking.status}
            </Badge>
          </div>

          <div className="mt-7 grid gap-6 border-y border-ink-300 py-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Guest name</p>
              <p className="mt-1 font-bold text-ink-900">{guest.name || "Guest"}</p>
              <p className="mt-1 break-all text-sm text-ink-500">{guest.email || ""}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Property</p>
              <p className="mt-1 font-bold text-ink-900">{listing.title || "Listing"}</p>
              <p className="mt-1 text-sm text-ink-500">{listing.location || ""}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Room category</p>
              <p className="mt-1 font-bold text-ink-900">{room.name || "Room"}</p>
              <p className="mt-1 text-sm text-ink-500">{booking.rooms} room{booking.rooms !== 1 ? "s" : ""}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Check-in</p>
              <p className="mt-1 font-semibold text-ink-900">{formatDateLong(booking.checkIn)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Check-out</p>
              <p className="mt-1 font-semibold text-ink-900">{formatDateLong(booking.checkOut)}</p>
            </div>
          </div>

          <section className="mt-7">
            <h2 className="text-lg font-bold text-navy-900">Payment summary</h2>
            <div className="mt-3 space-y-3 text-sm">
              <div className="grid gap-1 text-ink-600 sm:grid-cols-[1fr_auto]">
                <span>{formatPrice(room.price || 0)} × {booking.rooms} room{booking.rooms !== 1 ? "s" : ""} × {nights} night{nights !== 1 ? "s" : ""}</span>
                <span className="sm:text-right">{formatPrice(booking.totalAmount || 0)}</span>
              </div>
              <div className="flex justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3 text-base font-bold text-ink-900">
                <span>{isPaid ? "Total paid" : "Total due"}</span>
                <span>{formatPrice(booking.totalAmount || 0)}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-ink-500">
                <span>Payment status</span>
                <span className="font-medium capitalize">{booking.paymentStatus || "unpaid"}</span>
              </div>
              {booking.paymentReference && (
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-ink-500">
                  <span>Payment reference</span>
                  <span className="break-all font-medium sm:text-right">{booking.paymentReference}</span>
                </div>
              )}
            </div>
          </section>

          <footer className="mt-8 border-t border-ink-300 pt-5 text-xs text-ink-500">
            <p>Thank you for booking with Stayé.</p>
            <p className="mt-1">This receipt was generated from your booking record.</p>
          </footer>
        </article>
      </main>
      <div className="print:hidden"><Footer /></div>
    </div>
  );
}
