import React from "react";

export default function StatCard({ label, value, icon: Icon, accent = "text-navy-900" }) {
  return (
    <div className="rounded-sm border border-ink-300 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {Icon && <Icon className={`h-5 w-5 ${accent}`} aria-hidden="true" />}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-ink-900">{value}</p>
    </div>
  );
}
