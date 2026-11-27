"use client";

import * as React from "react";
import {
  CalendarDays,
  Camera,
  Flower2,
  Heart,
  Mail,
  MapPin,
  Music,
  QrCode,
  type LucideIcon,
} from "lucide-react";
import type { DesignerCover, DesignerIconName } from "@/components/ops/designer-types";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn } from "@/lib/utils";

const COVER_ICONS: Record<DesignerIconName, LucideIcon> = {
  Heart,
  Star: Flower2,
  MapPin,
  CalendarDays,
  Music,
  QrCode,
  Camera,
  Flower2,
  Sparkles: Flower2,
  Mail,
};

interface DesignerCoverProps {
  cover: DesignerCover;
  coupleLabel: string;
}

const FALLBACK_BG =
  "radial-gradient(120% 90% at 50% 0%, #fdf8f2 0%, #eadbd3 55%, #d9c3b8 100%)";

/**
 * Bìa thiệp có bộ animation riêng: rèm đôi, mở thiệp, mờ dần.
 * Không dùng ElementAnimator và không ảnh hưởng animation của nội dung.
 */
export function DesignerCover({ cover, coupleLabel }: DesignerCoverProps) {
  const [progress, setProgress] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);
  const dragRef = React.useRef<{ startX: number; width: number } | null>(null);
  const hideTimerRef = React.useRef<number>(0);
  const previousScrollRef = React.useRef<{ body: string; html: string } | null>(null);

  const restorePageScroll = React.useCallback(() => {
    const previous = previousScrollRef.current;
    if (!previous) return;
    document.body.style.overflow = previous.body;
    document.documentElement.style.overflow = previous.html;
    previousScrollRef.current = null;
  }, []);

  const title = cover.title?.trim() || coupleLabel;
  const subtitle = cover.subtitle?.trim() || "Thiệp mời cưới";
  const buttonLabel = cover.buttonLabel?.trim() || "Mở thiệp";
  const imageStyle = cover.imageUrl
    ? {
        backgroundImage: `url("${cover.imageUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : { background: FALLBACK_BG };

  const openCover = React.useCallback(() => {
    if (hideTimerRef.current) return;
    playOpenCardSound();
    setProgress(1);
    hideTimerRef.current = window.setTimeout(() => setHidden(true), 950);
  }, []);

  React.useEffect(() => {
    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    previousScrollRef.current = { body: previousBody, html: previousHtml };
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      restorePageScroll();
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, [restorePageScroll]);

  React.useEffect(() => {
    if (hidden) restorePageScroll();
  }, [hidden, restorePageScroll]);

  if (hidden) return null;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;
    dragRef.current = { startX: event.clientX, width: window.innerWidth };
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const distance = Math.abs(event.clientX - drag.startX);
    setProgress(Math.min(1, distance / (drag.width * 0.55)));
  };

  const handlePointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    if (progress > 0.28) {
      openCover();
    } else {
      setProgress(0);
    }
  };

  const content = (
    <div className="pointer-events-none relative z-20 flex h-full flex-col items-center justify-center px-8 text-center text-white">
      {(() => {
        const Icon = COVER_ICONS[cover.icon ?? "Heart"] ?? Heart;
        return <Icon className="mb-3 h-10 w-10" strokeWidth={1.3} aria-hidden="true" />;
      })()}
      <p className="text-[10px] font-semibold tracking-[0.35em] uppercase drop-shadow-sm">
        {subtitle}
      </p>
      <h2 className="mt-3 max-w-[18ch] font-display text-3xl leading-tight font-semibold drop-shadow-md sm:text-4xl">
        {title}
      </h2>
      <p className="mt-2 text-sm text-white/85 drop-shadow-sm">{coupleLabel}</p>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          openCover();
        }}
        className="pointer-events-auto mt-7 inline-flex h-11 items-center justify-center rounded-full bg-white px-7 text-sm font-semibold text-[#4a3028] shadow-lg transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
      >
        {buttonLabel}
      </button>
      {cover.template === "split" && (
        <p className="mt-4 text-[11px] text-white/80 drop-shadow-sm">
          Kéo hai bên hoặc bấm mở thiệp
        </p>
      )}
    </div>
  );

  if (cover.template === "split") {
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-[#3b2a24]"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="absolute inset-y-0 left-0 w-1/2 overflow-hidden shadow-2xl"
          style={{
            transform: `translateX(${-progress * 100}%)`,
            transition: dragging ? "none" : "transform 800ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div className="absolute inset-y-0 left-0 w-screen bg-cover bg-center" style={imageStyle} />
          <div className="absolute inset-0 bg-black/25" />
        </div>
        <div
          className="absolute inset-y-0 right-0 w-1/2 overflow-hidden shadow-2xl"
          style={{
            transform: `translateX(${progress * 100}%)`,
            transition: dragging ? "none" : "transform 800ms cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <div className="absolute inset-y-0 right-0 w-screen bg-cover bg-center" style={imageStyle} />
          <div className="absolute inset-0 bg-black/25" />
        </div>
        <div
          className="absolute inset-0 z-10"
          style={{
            opacity: Math.max(0, 1 - progress * 1.6),
            transition: dragging ? "none" : "opacity 450ms ease",
          }}
        >
          {content}
        </div>
      </div>
    );
  }

  if (cover.template === "card") {
    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden bg-black/55 [perspective:1400px]"
        onClick={openCover}
      >
        <div className="absolute inset-y-0 left-1/2 w-full max-w-[430px] -translate-x-1/2">
          <div
            className="absolute inset-0 origin-left overflow-hidden bg-cover bg-center shadow-2xl"
            style={{
              ...imageStyle,
              transform: `rotateY(${-progress * 96}deg)`,
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              transition: "transform 900ms cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div className="absolute inset-0 bg-black/30" />
            {content}
          </div>
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[calc(50%-215px)] bg-gradient-to-r from-black/50 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[calc(50%-215px)] bg-gradient-to-l from-black/50 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-cover bg-center"
      style={{
        ...imageStyle,
        opacity: 1 - progress,
        transform: `scale(${1 + progress * 0.04})`,
        transition: "opacity 850ms ease, transform 850ms ease",
      }}
      onClick={openCover}
    >
      <div className="absolute inset-0 bg-black/30" />
      {content}
    </div>
  );
}

export function DesignerCoverPreview({
  template,
  className,
}: {
  template: DesignerCover["template"];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative h-16 overflow-hidden rounded-md border border-border bg-[#efe3da]",
        className,
      )}
      aria-hidden="true"
    >
      {template === "split" ? (
        <>
          <div className="absolute inset-y-0 left-0 w-1/2 border-r border-white/40 bg-[#d8c1b4]" />
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[#c9ada0]" />
          <div className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />
        </>
      ) : template === "card" ? (
        <>
          <div className="absolute inset-y-1 left-3 w-8 origin-left rounded-sm bg-[#e7d4c8] shadow [transform:rotateY(12deg)]" />
          <div className="absolute inset-y-2 right-3 left-12 rounded-sm bg-white/60" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-gradient-to-br from-[#e6d2c5] to-[#bfa294]" />
          <div className="absolute inset-0 bg-white/20" />
        </>
      )}
    </div>
  );
}
