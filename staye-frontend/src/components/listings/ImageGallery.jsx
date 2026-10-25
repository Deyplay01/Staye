import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { getImageUrl } from "../../api";

export default function ImageGallery({ images = [], alt }) {
  const [active, setActive] = useState(0);
  const viewerRef = useRef(null);

  if (images.length === 0) {
    return <div className="h-80 w-full rounded-2xl bg-accent" />;
  }

  const otherPhotoIndices = images.map((_, index) => index).filter((index) => index !== active).slice(0, 4);
  const gridColumns = images.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4";
  const mainImageSize = images.length === 1 ? "md:col-span-4" : images.length === 2 ? "md:col-span-3" : "md:col-span-2";

  function openViewer(index) {
    setActive(index);
    viewerRef.current?.showModal();
  }

  function showPrevious() {
    setActive((current) => (current - 1 + images.length) % images.length);
  }

  function showNext() {
    setActive((current) => (current + 1) % images.length);
  }

  return (
    <div>
      <div className={`grid aspect-[4/3] grid-cols-1 gap-2 overflow-hidden rounded-2xl md:aspect-[2.65/1] md:grid-rows-2 ${gridColumns}`}>
        <button
          type="button"
          onClick={() => openViewer(active)}
          aria-label={`View photo ${active + 1} full size`}
          className={`block h-full w-full cursor-zoom-in overflow-hidden ${mainImageSize} md:row-span-2`}
        >
          <img
            src={getImageUrl(images[active], 1600)}
            alt={`${alt} — photo ${active + 1}`}
            className="h-full w-full object-cover"
            fetchPriority="high"
          />
        </button>
        {otherPhotoIndices.map((index) => (
          <button
            key={`${images[index]}-${index}`}
            type="button"
            onClick={() => openViewer(index)}
            aria-label={`View photo ${index + 1} full size`}
            aria-current={index === active}
            className={`hidden min-h-0 cursor-zoom-in overflow-hidden bg-accent md:block ${images.length === 2 ? "md:row-span-2" : ""}`}
          >
            <img src={getImageUrl(images[index], 640)} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]" />
          </button>
        ))}
      </div>
      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-thin md:hidden">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => openViewer(index)}
              className={`h-16 w-24 shrink-0 cursor-zoom-in overflow-hidden rounded-lg border-2 ${index === active ? "border-brand" : "border-transparent"}`}
              aria-label={`View photo ${index + 1} full size`}
              aria-current={index === active}
            >
              <img src={getImageUrl(src, 256)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <dialog
        ref={viewerRef}
        onClick={(event) => {
          if (event.target === viewerRef.current) viewerRef.current.close();
        }}
        aria-label={`${alt} photo viewer`}
        className="m-auto max-h-[95vh] max-w-[96vw] overflow-visible border-0 bg-transparent p-0 text-white backdrop:bg-slate-950/90"
      >
        <div className="relative flex max-h-[95vh] max-w-[96vw] flex-col items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => viewerRef.current?.close()}
            aria-label="Close image viewer"
            className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/75 text-white hover:bg-slate-950 focus-visible:outline-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          <img src={getImageUrl(images[active], 2560)} alt={`${alt} — photo ${active + 1}`} className="max-h-[82vh] max-w-[90vw] rounded-lg object-contain" />
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/75 text-white hover:bg-slate-950 focus-visible:outline-white"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/75 text-white hover:bg-slate-950 focus-visible:outline-white"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
              <p className="text-sm text-white">{active + 1} / {images.length}</p>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
