import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ label = "Loading...", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-16 text-ink-500 ${className}`}>
      <Loader2 className="h-7 w-7 animate-spin text-brand" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
