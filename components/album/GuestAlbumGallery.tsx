"use client";

import * as React from "react";
import type { TemplatePhotoItem } from "@/lib/types";
import { TemplateLightboxModal } from "@/templates/shared/TemplateOverlays";

interface GuestAlbumGalleryProps {
  photos: TemplatePhotoItem[];
}

export function GuestAlbumGallery({ photos }: GuestAlbumGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  return (
    <>
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Mở ảnh album ${index + 1}`}
              className="block w-full overflow-hidden rounded-xl border border-border bg-surface-alt text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt}
                loading={index < 3 ? "eager" : "lazy"}
                fetchPriority={index < 3 ? "high" : "auto"}
                decoding="async"
                className="aspect-[4/5] w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
              />
            </button>
          </li>
        ))}
      </ul>

      <TemplateLightboxModal
        photos={photos}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onChangeIndex={setActiveIndex}
      />
    </>
  );
}
