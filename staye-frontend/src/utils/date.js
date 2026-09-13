const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Number of nights between two ISO date strings (YYYY-MM-DD). Minimum 0. */
export function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diff = Math.round((outDate - inDate) / MS_PER_DAY);
  return diff > 0 ? diff : 0;
}

/** "Sat, 14 Sep 2026" */
export function formatDateLong(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "14 Sep" */
export function formatDateShort(isoDate) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
