import React, { useState } from "react";
import { getImageUrl } from "../../api";

export default function ImageGallery({ images = [], alt }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return <div className="h-80 w-full rounded-2xl bg-accent" />;
  }

  return (
    <div>
      <img
        src={getImageUrl(images[active])}
        alt={`${alt} — photo ${active + 1}`}
        className="h-80 w-full rounded-2xl object-cover sm:h-[420px]"
      />
      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-thin">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 ${
                i === active ? "border-brand" : "border-transparent"
              }`}
              aria-label={`Show photo ${i + 1}`}
              aria-current={i === active}
            >
              <img src={getImageUrl(src)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
