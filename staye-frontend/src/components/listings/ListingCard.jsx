import React from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { formatPrice } from "../../utils/price";
import Button from "../common/Button";
import { getImageUrl } from "../../api";

export default function ListingCard({ listing, checkIn, checkOut }) {
  const dateQuery = checkIn && checkOut ? `?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}` : "";
  const uniquePrices = (listing.rooms || []).map((room) => Number(room.price)).filter((value) => Number.isFinite(value));
  const startingPrice = uniquePrices.length ? Math.min(...uniquePrices) : 0;
  const detailsPath = `/listings/${listing._id}${dateQuery}`;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-ink-300 bg-white p-2 shadow-card transition-transform duration-500 hover:scale-104 sm:flex-row">
      <Link to={detailsPath} className="block overflow-hidden rounded-xl sm:w-56 sm:shrink-0 lg:w-64">
        <img
          src={getImageUrl(listing.images?.[0]) || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"}
          alt={listing.title}
          className="h-44 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 sm:h-48 lg:h-52"
          loading="lazy"
        />
      </Link>

      <div className="flex flex-1 flex-col justify-between px-4 py-3 sm:px-5">
        <div>
          <Link to={detailsPath} className="text-lg font-bold text-navy-900 hover:text-brand">
            {listing.title}
          </Link>
          <p className="mt-1 flex items-center gap-1 text-sm text-ink-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {listing.location}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-ink-700">{listing.description}</p>

          {listing.rooms?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {listing.rooms.slice(0, 3).map((room) => (
                <span key={room._id || room.name} className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-navy-900">
                  {room.name}
                </span>
              ))}
              {listing.rooms.length > 3 && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-ink-500">
                  +{listing.rooms.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-dashed border-ink-300 pt-3">
          <div>
            <p className="text-xs text-ink-500">from per night</p>
            <p className="text-2xl font-bold text-ink-900">{formatPrice(startingPrice)}</p>
          </div>
          <Link to={detailsPath}>
            <Button size="sm">View details</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
