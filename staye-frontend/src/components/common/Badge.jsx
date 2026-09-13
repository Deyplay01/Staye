import React from "react";

const STATUS_STYLES = {
  Pending: "bg-amber-100 text-amber-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Cancelled: "bg-red-100 text-red-800",
  Completed: "bg-green-100 text-green-800",
  Paid: "bg-green-100 text-green-800",
  Unpaid: "bg-amber-100 text-amber-800",
  Refunded: "bg-gray-200 text-gray-700",
};

export default function Badge({ status, children, className = "" }) {
  const style = STATUS_STYLES[status] || "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${style} ${className}`}>
      {children ?? status}
    </span>
  );
}
