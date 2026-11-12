"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { invitationThemeCssVars } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { TemplatePhotoPlaceholder } from "@/templates/shared/TemplatePhotoPlaceholder";
import { RevealSection } from "./RevealSection";
import { useWeddingContent } from "./WeddingContentProvider";

export function Gallery() {
  const data = useWeddingContent();
  const photos = data.photos.gallery;

  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const touchStartX = React.useRef<number | null>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const closeLightbox = React.useCallback(() => {
    setActiveIndex(null);
  }, []);

  const showPrev = React.useCallback(() => {
    setActiveIndex((prev) => {
      if (prev === null || photos.length === 0) return null;
      return (prev - 1 + photos.length) % photos.length;
    });
  }, [photos.length]);

  const showNext = React.useCallback(() => {
    setActiveIndex((prev) => {
      if (prev === null || photos.length === 0) return null;
      return (prev + 1) % photos.length;
    });
  }, [photos.length]);

  React.useEffect(() => {
    if (activeIndex === null) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") showPrev();
      if (event.key === "ArrowRight") showNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [activeIndex, closeLightbox, showPrev, showNext]);

  const activePhoto = activeIndex !== null ? photos[activeIndex] : null;

  const lightboxContent =
    activePhoto && activeIndex !== null ? (
      <div
        style={invitationThemeCssVars as React.CSSProperties}
        role="dialog"
        aria-modal="true"
        aria-label={`Xem ảnh ${activeIndex + 1} trên ${photos.length}`}
        className="invitation-theme fixed inset-0 z-50 flex touch-pan-y flex-col justify-between bg-black/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xs"
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
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between text-white">
          <span className="font-sans text-sm font-semibold tracking-wider">
            {activeIndex + 1} / {photos.length}
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeLightbox}
            aria-label="Đóng trình xem ảnh"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="relative mx-auto flex min-h-0 w-full max-w-4xl flex-1 items-center justify-center py-3">
          <button
            type="button"
            onClick={showPrev}
            aria-label="Ảnh trước"
            className="absolute left-1 z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-xs transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-3 sm:h-11 sm:w-11"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>

          <img
            src={activePhoto.url}
            alt={activePhoto.alt}
            className="max-h-[64dvh] w-auto max-w-full rounded-lg object-contain select-none"
          />

          <button
            type="button"
            onClick={showNext}
            aria-label="Ảnh tiếp theo"
            className="absolute right-1 z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-xs transition-colors hover:bg-black/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-3 sm:h-11 sm:w-11"
          >
            <ChevronRight className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="mx-auto w-full max-w-4xl space-y-2.5">
          <p className="text-center font-inv-serif text-xs text-white/85 sm:text-sm">
            {activePhoto.alt}
          </p>
          <div className="flex items-center justify-start gap-2 overflow-x-auto px-1 py-1 sm:justify-center">
            {photos.map((thumb, idx) => (
              <button
                key={thumb.id || `thumb-${idx}`}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Chọn ảnh ${idx + 1}`}
                className={cn(
                  "h-12 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                  idx === activeIndex
                    ? "ring-2 ring-white opacity-100"
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
      </div>
    ) : null;

  return (
    <RevealSection className="bg-inv-olive px-5 py-10 text-inv-cream-text">
      <div className="mx-auto max-w-[440px] text-center">
        <h2 className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1 font-inv-serif text-[clamp(22px,6.8vw,32px)] leading-[1.15] font-normal tracking-[0.03em] text-inv-cream-text uppercase">
          <span>GOLDEN HOUR</span>
          <span className="font-inv-script text-[clamp(28px,8vw,38px)] leading-none text-inv-cream-soft normal-case">
            Of
          </span>
          <span>LOVE</span>
        </h2>

        <p className="mx-auto mt-3 max-w-[380px] font-inv-serif text-[13.5px] leading-[1.6] text-inv-cream-text/90 sm:text-[14.5px]">
          {data.ui.gallerySubtitle}
        </p>
      </div>

      {photos.length === 0 ? (
        <div className="mx-auto mt-8 max-w-[320px] overflow-hidden rounded-xl border border-white/15">
          <TemplatePhotoPlaceholder className="aspect-[4/3]" />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-2.5">
          {photos.map((photo, index) => (
            <button
              key={photo.id || `${photo.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Xem ảnh ${index + 1}: ${photo.alt}`}
              className="group block w-full cursor-pointer overflow-hidden bg-inv-olive-deep/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-cream-text focus-visible:ring-offset-2 focus-visible:ring-offset-inv-olive"
            >
              <img
                src={photo.url}
                alt={photo.alt}
                width={600}
                height={900}
                loading="lazy"
                className="block aspect-[2/3] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
            </button>
          ))}
        </div>
      )}

      {mounted &&
        lightboxContent &&
        createPortal(lightboxContent, document.body)}
    </RevealSection>
  );
}
