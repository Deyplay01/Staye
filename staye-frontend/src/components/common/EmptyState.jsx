import React from "react";
import { SearchX } from "lucide-react";

export default function EmptyState({ title = "Nothing here yet", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-ink-300 bg-white py-16 text-center">
      <SearchX className="h-8 w-8 text-ink-500" aria-hidden="true" />
      <p className="font-semibold text-ink-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-500">{description}</p>}
      {action}
    </div>
  );
}
