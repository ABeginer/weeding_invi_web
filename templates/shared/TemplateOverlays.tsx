"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { TemplatePhotoItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export type TemplateTone =
  | "minimal"
  | "sunset"
  | "obsidian"
  | "red"
  | "velvet"
  | "ruby"
  | "minred"
  | "minbrown"
  | "flowery"
  | "amethyst"
  | "sapphire"
  | "midnight-ink"
  | "emerald";

interface LightboxModalProps {
  photos: TemplatePhotoItem[];
  activeIndex: number | null;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
}

export function TemplateLightboxModal({
  photos,
  activeIndex,
  onClose,
  onChangeIndex,
}: LightboxModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const touchStartX = React.useRef<number | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const showPrev = React.useCallback(() => {
    if (activeIndex === null || photos.length === 0) return;
    onChangeIndex((activeIndex - 1 + photos.length) % photos.length);
  }, [activeIndex, onChangeIndex, photos.length]);

  const showNext = React.useCallback(() => {
    if (activeIndex === null || photos.length === 0) return;
    onChangeIndex((activeIndex + 1) % photos.length);
  }, [activeIndex, onChangeIndex, photos.length]);

  React.useEffect(() => {
    if (activeIndex === null) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, onClose, showPrev, showNext]);

  if (!mounted || activeIndex === null || !photos[activeIndex]) return null;
  const current = photos[activeIndex];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Xem ảnh ${activeIndex + 1} trên ${photos.length}`}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-[#0B0B0B]/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-[#E8DFC8] sm:backdrop-blur-sm"
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
        const diff = endX - touchStartX.current;
        if (Math.abs(diff) > 45) {
          if (diff > 0) showPrev();
          else showNext();
        }
        touchStartX.current = null;
      }}
    >
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <span className="text-sm font-medium tracking-wider text-[#E8DFC8]">
          {activeIndex + 1} / {photos.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Đóng trình xem ảnh"
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#2A2A2A] bg-[#151515] text-[#E8DFC8] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative mx-auto flex min-h-0 w-full max-w-4xl flex-1 items-center justify-center py-3">
        <button
          type="button"
          onClick={showPrev}
          aria-label="Ảnh trước"
          className="absolute left-1 z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#2A2A2A] bg-[#151515]/90 text-[#E8DFC8] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] sm:left-3 sm:h-11 sm:w-11"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <img
          src={current.url}
          alt={current.alt}
          className="max-h-[65dvh] w-auto max-w-full rounded-xl object-contain select-none"
        />

        <button
          type="button"
          onClick={showNext}
          aria-label="Ảnh tiếp theo"
          className="absolute right-1 z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#2A2A2A] bg-[#151515]/90 text-[#E8DFC8] transition-colors hover:border-[#D4AF37] hover:text-[#D4AF37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] sm:right-3 sm:h-11 sm:w-11"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-2.5 text-center">
        <p className="text-xs text-[#A89F86] sm:text-sm">{current.alt}</p>
        <div className="flex items-center justify-start gap-2 overflow-x-auto px-1 py-1 sm:justify-center">
          {photos.map((thumb, idx) => (
            <button
              key={thumb.id || `lb-thumb-${idx}`}
              type="button"
              onClick={() => onChangeIndex(idx)}
              aria-label={`Chọn ảnh ${idx + 1}`}
              className={cn(
                "h-12 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]",
                idx === activeIndex
                  ? "ring-2 ring-[#D4AF37] opacity-100"
                  : "opacity-55 hover:opacity-90",
              )}
            >
              <img
                src={thumb.url}
                alt=""
                width={64}
                height={48}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
