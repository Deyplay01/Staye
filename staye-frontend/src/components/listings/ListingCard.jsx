import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import { formatPrice } from "../../utils/price";
import { getImageUrl } from "../../api";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80";

export default function ListingCard({ listing, checkIn, checkOut }) {
  const [activeImage, setActiveImage] = useState(0);
  const dateQuery = checkIn && checkOut ? `?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}` : "";
  const uniquePrices = (listing.rooms || []).map((room) => Number(room.price)).filter((value) => Number.isFinite(value));
  const startingPrice = uniquePrices.length ? Math.min(...uniquePrices) : 0;
  const detailsPath = `/listings/${listing._id}${dateQuery}`;
  const images = listing.images?.length ? listing.images : [FALLBACK_IMAGE];
  const imageIndex = activeImage % images.length;
  const hasMultipleImages = images.length > 1;

  function showPreviousImage(event) {
    event.preventDefault();
    event.stopPropagation();
    setActiveImage((current) => (current - 1 + images.length) % images.length);
  }

  function showNextImage(event) {
    event.preventDefault();
    event.stopPropagation();
    setActiveImage((current) => (current + 1) % images.length);
  }

  return (
    <article className="group min-w-0 rounded-2xl border border-transparent p-2 transition-shadow duration-200 hover:border-ink-300 hover:shadow-lg">
      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
        <Link to={detailsPath} aria-label={`View ${listing.title}`} className="block h-full w-full">
          <img
            src={getImageUrl(images[imageIndex]) || FALLBACK_IMAGE}
            alt={`${listing.title} — photo ${imageIndex + 1}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        </Link>

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              aria-label={`Previous photo of ${listing.title}`}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              aria-label={`Next photo of ${listing.title}`}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-slate-800 shadow transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-slate-950/65 px-2 py-1 text-[10px] font-semibold text-white" aria-live="polite">
              {imageIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-3">
          <Link to={detailsPath} className="min-w-0 truncate font-bold text-ink-900 hover:text-brand">
            {listing.title}
          </Link>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-ink-700">
            {Number(listing.rating) > 0 ? <><Star className="h-3 w-3 fill-current" aria-hidden="true" />{Number(listing.rating).toFixed(1)}</> : "New"}
          </span>
        </div>
        <p className="flex items-center gap-1 text-sm text-ink-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{listing.location}</span>
        </p>
        {checkIn && checkOut && <p className="text-xs text-ink-500">{checkIn} – {checkOut}</p>}
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-ink-700">
            <span className="font-bold text-ink-900">{formatPrice(startingPrice)}</span> <span className="text-xs">night</span>
          </p>
          <Link
            to={detailsPath}
            className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            View stay
          </Link>
        </div>
      </div>
    </article>
  );
}
