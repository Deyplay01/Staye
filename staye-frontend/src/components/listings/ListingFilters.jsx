import React, { useState } from "react";
import { Search, MapPin, CalendarDays } from "lucide-react";
import Button from "../common/Button";

/**
 * Homepage search keeps the first step focused: destination and stay dates.
 */
export default function ListingFilters({ filters, onSearch }) {
  const [local, setLocal] = useState(filters);

  function handleSubmit(e) {
    e.preventDefault();
    onSearch(local);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-4xl flex-col gap-3 rounded-sm bg-white p-4 shadow-popover sm:flex-row sm:items-center"
    >
      <label className="flex flex-1 items-center gap-2 rounded-sm border border-ink-300 px-3 py-2">
        <MapPin className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
        <input
          type="text"
          placeholder="Search by location"
          value={local.location}
          onChange={(e) => setLocal({ ...local, location: e.target.value })}
          className="w-full border-none p-0 text-sm text-ink-900 focus:outline-none focus:ring-0"
        />
      </label>

      <label className="flex items-center gap-2 rounded-sm border border-ink-300 px-3 py-2 sm:w-40">
        <CalendarDays className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
        <input
          type="date"
          value={local.checkIn || ""}
          onChange={(e) => setLocal({ ...local, checkIn: e.target.value })}
          className="w-full border-none bg-transparent p-0 text-sm text-ink-900 focus:outline-none focus:ring-0"
          aria-label="Check-in date"
        />
      </label>

      <label className="flex items-center gap-2 rounded-sm border border-ink-300 px-3 py-2 sm:w-40">
        <CalendarDays className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
        <input
          type="date"
          value={local.checkOut || ""}
          min={local.checkIn || undefined}
          onChange={(e) => setLocal({ ...local, checkOut: e.target.value })}
          className="w-full border-none bg-transparent p-0 text-sm text-ink-900 focus:outline-none focus:ring-0"
          aria-label="Check-out date"
        />
      </label>

      <Button type="submit" size="lg">
        <Search className="h-4 w-4" aria-hidden="true" />
        Search
      </Button>
    </form>
  );
}
