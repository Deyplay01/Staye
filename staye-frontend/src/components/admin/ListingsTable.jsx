import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "../../utils/price";
import { getImageUrl } from "../../api";

/**
 * Only shows fields that actually exist on the Listing model:
 * title, location, price, amenities count. No capacity/type/
 * availability column — the backend doesn't have those fields.
 */
export default function ListingsTable({ listings, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-ink-300 bg-white shadow-card">
      <div className="divide-y divide-ink-300 sm:hidden">
        {listings.map((listing) => (
          <article key={listing._id} className="p-4">
            <div className="flex gap-3">
              <img
                src={getImageUrl(listing.images?.[0]) || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=80"}
                alt=""
                className="h-20 w-24 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-bold text-ink-900">{listing.title}</h2>
                <p className="mt-1 truncate text-sm text-ink-500">{listing.location}</p>
                <p className="mt-2 font-semibold text-ink-900">{formatPrice(listing.price)} <span className="font-normal text-ink-500">/ night</span></p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-ink-300 pt-3">
              <span className="text-xs text-ink-500">{listing.amenities?.length || 0} amenities</span>
              <div className="flex gap-2">
                <button onClick={() => onEdit(listing)} className="flex items-center gap-1 rounded-full border border-ink-300 px-3 py-1.5 text-xs font-semibold text-brand">
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                </button>
                <button onClick={() => onDelete(listing)} className="flex items-center gap-1 rounded-full border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-ink-300 bg-gray-50 text-xs uppercase tracking-wide text-ink-500">
          <tr>
            <th className="px-4 py-3">Listing</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Price / night</th>
            <th className="px-4 py-3">Amenities</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-300">
          {listings.map((listing) => (
            <tr key={listing._id} className="hover:bg-gray-50">
              <td className="flex items-center gap-3 px-4 py-3">
                <img
                  src={getImageUrl(listing.images?.[0]) || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=80"}
                  alt=""
                  className="h-10 w-12 rounded-xl object-cover"
                />
                <span className="font-medium text-ink-900">{listing.title}</span>
              </td>
              <td className="px-4 py-3">{listing.location}</td>
              <td className="px-4 py-3 font-medium">{formatPrice(listing.price)}</td>
              <td className="px-4 py-3 text-ink-500">{listing.amenities?.length || 0} listed</td>
              <td className="px-4 py-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => onEdit(listing)}
                    className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                  </button>
                  <button
                    onClick={() => onDelete(listing)}
                    className="flex items-center gap-1 text-sm font-medium text-danger hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
