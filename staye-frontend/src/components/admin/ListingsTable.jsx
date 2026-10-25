import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Pencil, Trash2 } from "lucide-react";
import { getImageUrl } from "../../api";

export default function ListingsTable({ listings, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-ink-300 bg-white shadow-card">
      <div className="divide-y divide-ink-300 lg:hidden">
        {listings.map((listing) => {
          return (
            <article key={listing._id} className="p-4">
              <Link to={`/admin/listings/${listing._id}/rooms`} className="group flex gap-3 rounded-xl focus-visible:outline-navy-900">
                <img
                  src={getImageUrl(listing.images?.[0], 320) || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=80"}
                  alt=""
                  className="h-20 w-24 shrink-0 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-bold text-ink-900 group-hover:text-brand">{listing.title}</h2>
                  <p className="mt-1 truncate text-sm text-ink-500">{listing.location}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${listing.status === "approved" ? "bg-slate-100 text-slate-700" : listing.status === "rejected" ? "bg-red-50 text-danger" : "bg-slate-100 text-slate-700"}`}>
                    {listing.status === "approved" ? "Published" : listing.status === "rejected" ? "Needs changes" : "Awaiting review"}
                  </span>
                  {listing.status === "rejected" && listing.reviewReason && <p className="mt-1 break-words text-xs text-danger">{listing.reviewReason}</p>}
                </div>
              </Link>
              <Link to={`/admin/listings/${listing._id}/rooms`} className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-semibold text-navy-900 hover:bg-slate-100">
                <span>{listing.rooms?.length || 0} room type{listing.rooms?.length === 1 ? "" : "s"}</span>
                <span className="inline-flex items-center gap-1">Manage rooms <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
              </Link>
              <div className="mt-3 flex items-center justify-between border-t border-ink-300 pt-3">
                <span className="text-xs text-ink-500">Listing details</span>
                <div className="flex gap-2">
                  <button onClick={() => onEdit(listing)} className="flex items-center gap-1 rounded-full border border-ink-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:text-slate-900">
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                  </button>
                  <button onClick={() => onDelete(listing)} className="flex items-center gap-1 rounded-full border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-ink-300 bg-slate-50 text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Room inventory</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-300">
            {listings.map((listing) => {
              return (
                <tr key={listing._id} className="hover:bg-slate-50">
                  <td className="flex items-center gap-3 px-4 py-3">
                    <Link to={`/admin/listings/${listing._id}/rooms`} className="flex min-w-0 items-center gap-3 font-semibold text-ink-900 hover:text-brand">
                      <img
                        src={getImageUrl(listing.images?.[0], 320) || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=80"}
                        alt=""
                        className="h-10 w-12 shrink-0 rounded-xl object-cover"
                      />
                      <span>{listing.title}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">{listing.location}</td>
                  <td className="px-4 py-3">
                    <Link to={`/admin/listings/${listing._id}/rooms`} className="inline-flex items-center gap-2 font-semibold text-brand hover:underline">
                      {listing.rooms?.length || 0} room type{listing.rooms?.length === 1 ? "" : "s"}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${listing.status === "approved" ? "bg-slate-100 text-slate-700" : listing.status === "rejected" ? "bg-red-50 text-danger" : "bg-slate-100 text-slate-700"}`}>
                      {listing.status === "approved" ? "Published" : listing.status === "rejected" ? "Needs changes" : "Awaiting review"}
                    </span>
                    {listing.status === "rejected" && listing.reviewReason && <p className="mt-1 max-w-48 text-xs text-danger">{listing.reviewReason}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => onEdit(listing)}
                        className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline"
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
