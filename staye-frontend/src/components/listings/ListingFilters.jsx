import React, { useRef, useState } from "react";
import { Search, MapPin, CalendarDays } from "lucide-react";

/**
 * Homepage search keeps the first step focused: destination and stay dates.
 */
export default function ListingFilters({ filters, onSearch }) {
  const [local, setLocal] = useState(filters);
  const checkInRef = useRef(null);
  const checkOutRef = useRef(null);

  function openDatePicker(inputRef) {
    if (typeof inputRef.current?.showPicker === "function") {
      inputRef.current.showPicker();
    } else {
      inputRef.current?.focus();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(local);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-4xl flex-col gap-2 rounded-2xl border border-white/70 bg-white/95 p-3 text-slate-900 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full"
    >
      <label className="flex flex-1 items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-100 sm:rounded-full">
        <MapPin className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by location"
          value={local.location}
          onChange={(e) => setLocal({ ...local, location: e.target.value })}
          className="w-full border-none bg-transparent p-0 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
        />
      </label>

      <div className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-100 sm:w-40 sm:rounded-full sm:border-l sm:border-slate-200">
        <button type="button" onClick={() => openDatePicker(checkInRef)} aria-label="Open check-in calendar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          ref={checkInRef}
          type="date"
          value={local.checkIn || ""}
          onChange={(e) => setLocal({ ...local, checkIn: e.target.value })}
          className="hero-date-input w-full min-w-0 border-none bg-transparent p-0 text-sm text-slate-900 focus:outline-none focus:ring-0"
          aria-label="Check-in date"
        />
      </div>

      <div className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-100 sm:w-40 sm:rounded-full sm:border-l sm:border-slate-200">
        <button type="button" onClick={() => openDatePicker(checkOutRef)} aria-label="Open check-out calendar" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          ref={checkOutRef}
          type="date"
          value={local.checkOut || ""}
          min={local.checkIn || undefined}
          onChange={(e) => setLocal({ ...local, checkOut: e.target.value })}
          className="hero-date-input w-full min-w-0 border-none bg-transparent p-0 text-sm text-slate-900 focus:outline-none focus:ring-0"
          aria-label="Check-out date"
        />
      </div>

      <button type="submit" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 sm:rounded-full">
        <Search className="h-4 w-4" aria-hidden="true" /> Search stays
      </button>
    </form>
  );
}
