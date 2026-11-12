"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import type { GiftItem, WeddingPhoto } from "@/lib/types";
import { cn } from "@/lib/utils";

export type TemplateTone = "minimal" | "sunset" | "obsidian";

interface LightboxModalProps {
  photos: WeddingPhoto[];
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
      className="fixed inset-0 z-50 flex flex-col justify-between bg-lnd-bg/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] text-lnd-body backdrop-blur-sm"
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
        <span className="text-sm font-medium tracking-wider text-lnd-body">
          {activeIndex + 1} / {photos.length}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Đóng trình xem ảnh"
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-lnd-border bg-lnd-surface text-lnd-body transition-colors hover:border-lnd-gold hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative mx-auto flex min-h-0 w-full max-w-4xl flex-1 items-center justify-center py-3">
        <button
          type="button"
          onClick={showPrev}
          aria-label="Ảnh trước"
          className="absolute left-1 z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-lnd-border bg-lnd-surface/90 text-lnd-body transition-colors hover:border-lnd-gold hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold sm:left-3 sm:h-11 sm:w-11"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>

        <img
          src={current.src}
          alt={current.alt}
          width={current.width}
          height={current.height}
          className="max-h-[65dvh] w-auto max-w-full rounded-xl object-contain select-none"
        />

        <button
          type="button"
          onClick={showNext}
          aria-label="Ảnh tiếp theo"
          className="absolute right-1 z-10 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-lnd-border bg-lnd-surface/90 text-lnd-body transition-colors hover:border-lnd-gold hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold sm:right-3 sm:h-11 sm:w-11"
        >
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-4xl space-y-2.5 text-center">
        <p className="text-xs text-lnd-muted sm:text-sm">{current.alt}</p>
        <div className="flex items-center justify-start gap-2 overflow-x-auto px-1 py-1 sm:justify-center">
          {photos.map((thumb, idx) => (
            <button
              key={`lb-thumb-${idx}`}
              type="button"
              onClick={() => onChangeIndex(idx)}
              aria-label={`Chọn ảnh ${idx + 1}`}
              className={cn(
                "h-12 w-16 shrink-0 cursor-pointer overflow-hidden rounded-md transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold",
                idx === activeIndex
                  ? "ring-2 ring-lnd-gold opacity-100"
                  : "opacity-55 hover:opacity-90"
              )}
            >
              <img
                src={thumb.src}
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
    document.body
  );
}

interface GiftModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  downloadLabel: string;
  items: GiftItem[];
  tone?: TemplateTone;
}

export function TemplateGiftModal({
  open,
  onClose,
  title,
  subtitle,
  downloadLabel,
  items,
  tone = "minimal",
}: GiftModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open || items.length === 0) return null;

  const isDark = tone === "obsidian";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-5"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-lnd-bg/75 backdrop-blur-xs"
      />

      <div
        className={cn(
          "relative z-10 max-h-[88dvh] w-full max-w-[440px] overflow-y-auto overscroll-contain rounded-3xl border px-5 py-6 text-center shadow-2xl",
          isDark
            ? "border-lnd-gold-soft bg-lnd-surface text-lnd-body"
            : "border-stone-300 bg-[#FAF8F4] text-[#231F1D]"
        )}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Đóng hộp mừng cưới"
          className={cn(
            "absolute top-3.5 right-3.5 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2",
            isDark
              ? "border border-lnd-border bg-lnd-bg text-lnd-body hover:border-lnd-gold focus-visible:ring-lnd-gold"
              : "bg-stone-200/80 text-stone-700 hover:bg-stone-300 focus-visible:ring-stone-700"
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2
          id={titleId}
          className={cn(
            "mx-8 font-display text-3xl font-semibold",
            isDark ? "text-lnd-gold" : tone === "sunset" ? "text-[#7A3535]" : "text-[#2A2622]"
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            "mx-auto mt-2 max-w-[360px] text-xs leading-relaxed sm:text-sm",
            isDark ? "text-lnd-muted" : "text-stone-600"
          )}
        >
          {subtitle}
        </p>

        <div
          className={cn(
            "mt-5 grid gap-4",
            items.length > 1 ? "grid-cols-2" : "mx-auto max-w-[220px] grid-cols-1"
          )}
        >
          {items.map((item, idx) => (
            <div key={`${item.label}-${idx}`} className="flex flex-col items-center text-center">
              <div
                className={cn(
                  "rounded-xl border p-2",
                  isDark
                    ? "border-lnd-gold-soft bg-white"
                    : "border-stone-300 bg-white"
                )}
              >
                <img
                  src={item.qrImage}
                  alt={item.qrAlt ?? item.label}
                  width={180}
                  height={180}
                  loading="lazy"
                  className="block aspect-square w-[112px] object-contain sm:w-[136px]"
                />
              </div>

              <a
                href={item.qrImage}
                download={item.downloadFileName ?? `qr-mung-cuoi-${idx + 1}.png`}
                className={cn(
                  "mt-2.5 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                  isDark
                    ? "border border-lnd-border bg-lnd-bg text-lnd-gold hover:border-lnd-gold"
                    : "bg-stone-200 text-stone-800 hover:bg-stone-300"
                )}
              >
                <Download className="h-3 w-3" aria-hidden="true" />
                <span>{downloadLabel}</span>
              </a>

              <p
                className={cn(
                  "mt-2 text-xs font-semibold",
                  isDark ? "text-lnd-body" : "text-stone-800"
                )}
              >
                {item.label}
              </p>
              {item.note && (
                <p
                  className={cn(
                    "mt-0.5 text-[11px] leading-relaxed break-words",
                    isDark ? "text-lnd-muted" : "text-stone-600"
                  )}
                >
                  {item.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

