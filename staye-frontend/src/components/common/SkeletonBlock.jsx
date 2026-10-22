import React from "react";

export default function SkeletonBlock({ className = "" }) {
  return <div aria-hidden="true" className={`skeleton-shimmer rounded bg-slate-200 ${className}`} />;
}