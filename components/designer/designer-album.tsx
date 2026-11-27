"use client";

import * as React from "react";
import { Camera } from "lucide-react";

export interface DesignerAlbumPhoto {
  id?: string;
  url: string;
  alt?: string;
}

const DUMMY_PHOTOS = ["", "", "", "", ""];

interface DesignerAlbumProps {
  photos: DesignerAlbumPhoto[];
  limit: number;
  accentColor?: string;
}

export function DesignerAlbum({ photos, limit, accentColor }: DesignerAlbumProps) {
  const selected = React.useMemo(() => {
    const source =
      photos.length > 0
        ? photos
        : DUMMY_PHOTOS.map((url, index) => ({
            id: `dummy-${index}`,
            url,
            alt: "Ảnh cưới",
          }));
    return source.slice(0, Math.max(1, limit));
  }, [limit, photos]);

  const loop = [...selected, ...selected];

  return (
    <section
      id="wedding-gallery-section"
      className="relative overflow-hidden rounded-2xl border border-black/10 bg-white/70 py-5 shadow-sm backdrop-blur-xs"
    >
      <div className="mb-4 flex items-end justify-between px-5">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.24em] text-fg-muted">
            Album ảnh cưới
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-fg">
            Khoảnh khắc hạnh phúc
          </h2>
        </div>
      </div>

      <div className="group relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white/80 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white/80 to-transparent" />
        <div className="album-track flex w-max gap-3 px-6 group-hover:[animation-play-state:paused]">
          {loop.map((photo, index) => (
            <figure
              key={`${photo.id ?? photo.url}-${index}`}
              className={
                index === 0
                  ? "album-card relative h-[190px] w-[142px] shrink-0 overflow-hidden rounded-2xl border-2 border-white shadow-xl"
                  : "album-card relative h-[164px] w-[122px] shrink-0 self-center overflow-hidden rounded-2xl border border-white/80 shadow-md"
              }
            >
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.url}
                  alt={photo.alt || "Ảnh cưới"}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: accentColor ?? "#8E0B0B" }}
                >
                  <Camera className="h-6 w-6 text-white/80" />
                </div>
              )}
            </figure>
          ))}
        </div>
      </div>
      <p className="mt-4 px-5 text-[10px] leading-relaxed text-fg-muted">
        Gói Free hiển thị tối đa 5 ảnh · Gói Pro hiển thị tối đa 30 ảnh.
      </p>
    </section>
  );
}
