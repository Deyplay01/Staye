import React from "react";

export default function ListingSkeleton() {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-hidden="true">
      <div className="skeleton-shimmer aspect-[4/3] rounded-xl bg-slate-200" />
      <div className="space-y-3 px-2 pb-2 pt-4">
        <div className="skeleton-shimmer h-4 w-3/4 rounded bg-slate-200" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded bg-slate-100" />
        <div className="skeleton-shimmer h-3 w-full rounded bg-slate-100" />
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="skeleton-shimmer h-5 w-24 rounded bg-slate-200" />
          <div className="skeleton-shimmer h-8 w-24 rounded-full bg-slate-100" />
        </div>
      </div>
    </article>
  );
}
