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
  return formatLocalDate(new Date());
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getPeriodBounds(period, value = todayISO()) {
  if (period === "all") return null;

  if (period === "month") {
    const [year, month] = value.split("-").map(Number);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return { start: "", end: "" };
    }
    return {
      start: `${value}-01`,
      end: formatLocalDate(new Date(year, month, 1)),
    };
  }

  const start = new Date(`${value}T00:00:00`);
  if (Number.isNaN(start.getTime())) return { start: "", end: "" };
  if (period === "week") start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + (period === "week" ? 7 : 1));

  return {
    start: formatLocalDate(start),
    end: formatLocalDate(end),
  };
}

export function addDaysISO(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatRelativeTime(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (elapsedSeconds < 60) return "Just now";
  if (elapsedSeconds < 3600) {
    const minutes = Math.floor(elapsedSeconds / 60);
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }
  if (elapsedSeconds < 86400) {
    const hours = Math.floor(elapsedSeconds / 3600);
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  }
  if (elapsedSeconds < 604800) {
    const days = Math.floor(elapsedSeconds / 86400);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
