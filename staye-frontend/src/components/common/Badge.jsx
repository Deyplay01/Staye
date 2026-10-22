import React from "react";

const STATUS_STYLES = {
  Pending: "bg-amber-100 text-amber-800",
  Confirmed: "bg-slate-100 text-slate-700",
  Cancelled: "bg-red-100 text-red-800",
  Completed: "bg-slate-100 text-slate-700",
  Paid: "bg-slate-100 text-slate-700",
  Unpaid: "bg-amber-100 text-amber-800",
  Refunded: "bg-slate-200 text-slate-700",
};

export default function Badge({ status, children, className = "" }) {
  const style = STATUS_STYLES[status] || "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${style} ${className}`}>
      {children ?? status}
    </span>
  );
}
