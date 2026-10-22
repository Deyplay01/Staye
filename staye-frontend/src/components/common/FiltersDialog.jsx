import React, { useEffect, useRef, useState } from "react";
import { Filter, RotateCcw, X } from "lucide-react";
import Button from "./Button";

export default function FiltersDialog({
  title,
  description,
  activeCount = 0,
  resultCount,
  onReset,
  onApply,
  applyLabel = "Done",
  children,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setIsOpen(true)} aria-haspopup="dialog" aria-expanded={isOpen}>
        <Filter className="h-4 w-4" aria-hidden="true" /> Filters
        {activeCount > 0 && <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-navy-900">{activeCount}</span>}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby="filters-dialog-title"
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setIsOpen(false);
        }}
        className="m-auto max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-ink-300 bg-white p-0 text-ink-900 shadow-popover backdrop:bg-slate-950/50"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-300 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 id="filters-dialog-title" className="font-bold text-navy-900">{title}</h2>
            {description && <p className="mt-1 text-xs text-ink-500">{description}</p>}
          </div>
          <button type="button" onClick={() => setIsOpen(false)} aria-label="Close filters" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-500 transition hover:bg-slate-100 hover:text-ink-900">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">{children}</div>
        <div className="flex items-center justify-between gap-3 border-t border-ink-300 px-5 py-4 sm:px-6">
          {onReset ? (
            <button type="button" onClick={onReset} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 transition hover:text-ink-900">
              <RotateCcw className="h-4 w-4" aria-hidden="true" /> Reset
            </button>
          ) : <span />}
          <Button type="button" size="sm" onClick={() => { onApply?.(); setIsOpen(false); }}>
            {applyLabel}{resultCount !== undefined ? ` · ${resultCount} results` : ""}
          </Button>
        </div>
      </dialog>
    </>
  );
}