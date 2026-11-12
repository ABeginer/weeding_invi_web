"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Download, Gift, X } from "lucide-react";
import { invitationThemeCssVars } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { RevealSection } from "./RevealSection";
import { useWeddingContent } from "./WeddingContentProvider";

function LeafWreathFrame() {
  return (
    <svg
      viewBox="0 0 220 220"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-inv-olive-deep"
      fill="none"
    >
      {/* Vòng tròn thanh mảnh bao quanh ảnh cặp đôi */}
      <circle
        cx="110"
        cy="110"
        r="98"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.7"
      />

      {/* Nhành lá olive góc trên phải */}
      <g fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M126 15 C154 20, 178 39, 192 66" fill="none" />
        <ellipse cx="144" cy="18" rx="6.5" ry="2.6" transform="rotate(-12 144 18)" />
        <ellipse cx="158" cy="28" rx="6" ry="2.4" transform="rotate(24 158 28)" />
        <ellipse cx="171" cy="36" rx="6.5" ry="2.5" transform="rotate(18 171 36)" />
        <ellipse cx="180" cy="52" rx="6" ry="2.4" transform="rotate(52 180 52)" />
        <ellipse cx="163" cy="46" rx="5.5" ry="2.2" transform="rotate(42 163 46)" />
        <ellipse cx="189" cy="61" rx="5.5" ry="2.3" transform="rotate(64 189 61)" />
      </g>

      {/* Nhành lá olive góc dưới trái */}
      <g fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M94 205 C66 200, 42 181, 28 154" fill="none" />
        <ellipse cx="76" cy="202" rx="6.5" ry="2.6" transform="rotate(168 76 202)" />
        <ellipse cx="62" cy="192" rx="6" ry="2.4" transform="rotate(204 62 192)" />
        <ellipse cx="49" cy="184" rx="6.5" ry="2.5" transform="rotate(198 49 184)" />
        <ellipse cx="40" cy="168" rx="6" ry="2.4" transform="rotate(232 40 168)" />
        <ellipse cx="57" cy="174" rx="5.5" ry="2.2" transform="rotate(222 57 174)" />
        <ellipse cx="31" cy="159" rx="5.5" ry="2.3" transform="rotate(244 31 159)" />
      </g>
    </svg>
  );
}

export function GiftQR() {
  const wedding = useWeddingContent();
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();
  const items = wedding.gift.items;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (items.length === 0) return null;

  const dialogContent = open ? (
    <div
      style={invitationThemeCssVars as React.CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="invitation-theme fixed inset-0 z-50 flex items-end justify-center p-2.5 sm:items-center sm:p-5"
    >
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className="fixed inset-0 bg-inv-ink/60 backdrop-blur-xs"
      />

      <div className="relative z-10 max-h-[88dvh] w-full max-w-[460px] overflow-y-auto overscroll-contain rounded-3xl border border-inv-olive/15 bg-inv-cream px-5 py-6 text-center shadow-2xl">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Đóng hộp mừng cưới"
          className="absolute top-3.5 right-3.5 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-inv-olive-deep/10 text-inv-olive-deep transition-colors hover:bg-inv-olive-deep/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive-deep"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <h2
          id={titleId}
          className="mx-8 font-inv-script text-[clamp(34px,9vw,44px)] leading-[1.15] font-normal text-inv-olive-deep"
        >
          {wedding.gift.title}
        </h2>

        <p className="mx-auto mt-2 max-w-[380px] font-inv-serif text-[13px] leading-[1.6] text-inv-text/90">
          {wedding.gift.subtitle}
        </p>

        <div
          className={cn(
            "mt-5 grid gap-4",
            items.length > 1
              ? "grid-cols-2 gap-3 sm:gap-5"
              : "mx-auto max-w-[240px] grid-cols-1"
          )}
        >
          {items.map((item, idx) => (
            <div
              key={`${item.label}-${idx}`}
              className="flex min-w-0 flex-col items-center text-center"
            >
              {/* Khung QR viền đôi giấy trắng */}
              <div className="relative inline-block rounded-xl border border-inv-olive/20 bg-white p-2 shadow-xs">
                <span
                  aria-hidden="true"
                  className="absolute top-1 left-1 h-2 w-2 border-t border-l border-inv-olive/60"
                />
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-1 h-2 w-2 border-t border-r border-inv-olive/60"
                />
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 left-1 h-2 w-2 border-b border-l border-inv-olive/60"
                />
                <span
                  aria-hidden="true"
                  className="absolute right-1 bottom-1 h-2 w-2 border-r border-b border-inv-olive/60"
                />

                <img
                  src={item.qrImage}
                  alt={item.qrAlt ?? item.label}
                  width={200}
                  height={200}
                  loading="lazy"
                  className="block aspect-square w-[118px] rounded-md object-contain sm:w-[144px]"
                />
              </div>

              <a
                href={item.qrImage}
                download={item.downloadFileName ?? `qr-mung-cuoi-${idx + 1}.png`}
                className="mt-2.5 inline-flex items-center justify-center gap-1 rounded-md bg-inv-olive-deep/8 px-2.5 py-1 font-inv-serif text-[11px] font-medium text-inv-olive-deep transition-colors hover:bg-inv-olive-deep/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive-deep"
              >
                <Download className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span>{wedding.gift.downloadLabel}</span>
              </a>

              <p className="mt-2 font-inv-serif text-[12px] font-semibold text-inv-olive-deep">
                {item.label}
              </p>

              {item.note && (
                <p className="mt-0.5 font-inv-serif text-[11px] leading-[1.45] text-inv-text break-words">
                  {item.note}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <RevealSection className="bg-inv-bg px-5 pt-4 pb-6 text-center">
      <div className="flex flex-col items-center">
        {/* Ảnh tròn cặp đôi lồng trong vòng lá olive (chạm để mở Hộp Mừng Cưới) */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={wedding.gift.openButtonLabel}
          className="group relative flex h-[190px] w-[190px] cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive-deep focus-visible:ring-offset-4"
        >
          <div className="h-[164px] w-[164px] overflow-hidden rounded-full bg-inv-tint ring-4 ring-white shadow-[0_8px_22px_color-mix(in_srgb,var(--inv-olive-deep)_16%,transparent)] transition-transform duration-200 group-hover:scale-[1.02] group-active:scale-[0.97]">
            <img
              src={wedding.hero.coverImage}
              alt={wedding.hero.coverAlt}
              width={400}
              height={400}
              loading="lazy"
              className="block h-full w-full object-cover object-[center_14%]"
            />
          </div>
          <LeafWreathFrame />
        </button>

        {/* Nút pill xanh olive mở hộp mừng cưới */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-inv-olive-btn px-7 font-inv-serif text-[13px] font-semibold tracking-[0.03em] text-white uppercase transition-colors hover:bg-inv-olive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive-deep focus-visible:ring-offset-2 motion-safe:animate-[inv-pill-pulse_2.2s_ease-in-out_infinite]"
          >
            <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{wedding.gift.openButtonLabel}</span>
          </button>
        </div>
      </div>

      {/* Hộp thoại Hộp Mừng Cưới được portal ra document.body để luôn nằm trên các lớp nổi */}
      {mounted && dialogContent && createPortal(dialogContent, document.body)}
    </RevealSection>
  );
}
