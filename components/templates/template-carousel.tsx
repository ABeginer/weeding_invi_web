"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PLAN_LABELS } from "@/config/template-features";
import { cn } from "@/lib/utils";
import { TemplatePreviewDialog } from "./template-preview-dialog";
import type { CollectionTemplate } from "./types";

interface TemplateCarouselProps {
  templates: CollectionTemplate[];
  /** Giữ tham số để tương thích; carousel luôn chạy vòng tròn liền mạch. */
  infinite?: boolean;
}

const COPIES = 3;
const TRANSITION_MS = 300;

function visualFor(distance: number): { scale: number; opacity: number } {
  const d = Math.abs(distance);
  if (d === 0) return { scale: 1, opacity: 1 };
  if (d === 1) return { scale: 0.85, opacity: 0.65 };
  if (d === 2) return { scale: 0.72, opacity: 0.4 };
  return { scale: 0.65, opacity: 0.25 };
}

function logicalIndex(position: number, total: number): number {
  return ((position % total) + total) % total;
}

export function TemplateCarousel({ templates }: TemplateCarouselProps) {
  const total = templates.length;
  const [position, setPosition] = React.useState(total);
  const [instant, setInstant] = React.useState(false);
  const [openAt, setOpenAt] = React.useState<number | null>(null);
  const [failedImages, setFailedImages] = React.useState<Set<string>>(
    () => new Set(),
  );
  const prefetched = React.useRef<Set<string>>(new Set());
  const pointerStart = React.useRef<{ x: number; y: number } | null>(null);
  const swiped = React.useRef(false);

  const copies = React.useMemo(
    () =>
      Array.from({ length: COPIES }, (_, copy) =>
        templates.map((template, index) => ({
          template,
          index,
          copyIndex: copy * total + index,
        })),
      ).flat(),
    [templates, total],
  );

  const activeLogical = total > 0 ? logicalIndex(position, total) : 0;
  const current = templates[activeLogical];

  // Khi chạm mép bản sao, nhảy im lặng về bản giữa để cuộn vô tận không thấy điểm nối.
  React.useEffect(() => {
    if (total === 0) return;
    if (position >= total && position < total * 2) return;

    const timer = window.setTimeout(() => {
      setInstant(true);
      setPosition((currentPosition) => {
        if (currentPosition < total) return currentPosition + total;
        if (currentPosition >= total * 2) return currentPosition - total;
        return currentPosition;
      });
      window.setTimeout(() => setInstant(false), 60);
    }, TRANSITION_MS);

    return () => window.clearTimeout(timer);
  }, [position, total]);

  const go = React.useCallback((delta: number) => {
    setPosition((currentPosition) => currentPosition + delta);
  }, []);

  const prefetch = React.useCallback((url?: string) => {
    if (!url || prefetched.current.has(url)) return;
    prefetched.current.add(url);
    const image = new window.Image();
    image.src = url;
  }, []);

  const openPreview = React.useCallback(
    (logical: number) => {
      setPosition(logical + total);
      setOpenAt(logical);
    },
    [total],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
    swiped.current = false;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;

    swiped.current = true;
    go(dx < 0 ? 1 : -1);
  };

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="text-sm text-text-muted">Chưa có mẫu thiệp nào.</p>
        <Link
          href="/"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Bộ sưu tập mẫu thiệp cưới"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            go(-1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            go(1);
          } else if (event.key === "Home") {
            event.preventDefault();
            setPosition(total);
          } else if (event.key === "End") {
            event.preventDefault();
            setPosition(total * 2 - 1);
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="relative touch-pan-y overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-bg [mask-image:linear-gradient(to_right,transparent,currentColor_10%,currentColor_90%,transparent)]"
      >
        <div className="relative mx-auto h-[520px] [--card-w:260px] sm:h-[560px] sm:[--card-w:280px] md:h-[620px] md:[--card-w:320px]">
          {copies.map(({ template, index, copyIndex }) => {
            const offset = copyIndex - position;
            const { scale, opacity } = visualFor(offset);
            const isSelected = offset === 0;
            const shouldLoadImage = Math.abs(offset) <= 3;
            const imageFailed = failedImages.has(template.id);

            return (
              <button
                key={`${template.id}-${copyIndex}`}
                type="button"
                onClick={() => {
                  if (swiped.current) {
                    swiped.current = false;
                    return;
                  }
                  if (isSelected) openPreview(index);
                  else setPosition(copyIndex);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openPreview(index);
                  }
                }}
                onPointerEnter={() => prefetch(template.snapshotImage)}
                onFocus={() => prefetch(template.snapshotImage)}
                aria-label={`Mẫu thiệp ${template.name}`}
                aria-current={isSelected ? "true" : undefined}
                tabIndex={isSelected ? 0 : -1}
                style={
                  {
                    "--offset": offset,
                    "--scale": scale,
                    "--opacity": opacity,
                    zIndex: 20 - Math.min(19, Math.abs(offset)),
                    transform:
                      "translate(-50%, -50%) translateX(calc(var(--offset) * (var(--card-w) + 24px))) scale(var(--scale))",
                    opacity: "var(--opacity)",
                    transition: instant
                      ? "none"
                      : "transform 300ms ease-out, opacity 300ms ease-out",
                  } as React.CSSProperties
                }
                className="group absolute top-1/2 left-1/2 w-[var(--card-w)] cursor-pointer rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-4 focus-visible:ring-offset-bg"
              >
                <span className="block">
                  <span className="relative block aspect-[9/16] overflow-hidden rounded-2xl border border-border bg-surface-alt shadow-xl">
                    {shouldLoadImage && !imageFailed ? (
                      <img
                        src={template.previewImage}
                        alt={`Mẫu thiệp ${template.name}`}
                        width={700}
                        height={1240}
                        loading={isSelected ? "eager" : "lazy"}
                        decoding="async"
                        onError={() =>
                          setFailedImages((previous) => {
                            const next = new Set(previous);
                            next.add(template.id);
                            return next;
                          })
                        }
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-alt px-4 text-center">
                        <span
                          className="h-10 w-10 rounded-full border border-border bg-surface"
                          aria-hidden="true"
                        />
                        <span className="text-sm font-medium text-text">
                          {template.name}
                        </span>
                        <span className="text-[11px] text-text-muted">
                          {template.isPlaceholder
                            ? "Sắp ra mắt"
                            : "Chưa có ảnh xem trước"}
                        </span>
                      </span>
                    )}
                  </span>

                  <span className="mt-2 flex items-center justify-between gap-2 px-0.5">
                    <span className="truncate text-sm font-semibold text-text">
                      {template.name}
                    </span>
                    <span className="shrink-0 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                      {PLAN_LABELS[template.plan]}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Mẫu trước"
        className="absolute top-[42%] left-1 z-30 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text shadow-lg transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:left-2"
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Mẫu tiếp theo"
        className="absolute top-[42%] right-1 z-30 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text shadow-lg transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:right-2"
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="mt-4 flex flex-col items-center gap-2">
        <p className="text-sm font-medium text-text-muted" aria-hidden="true">
          {activeLogical + 1} / {total}
        </p>

        {total <= 12 && (
          <div className="hidden items-center gap-2 md:flex">
            {templates.map((template, index) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setPosition(index + total)}
                aria-label={`Chọn mẫu ${index + 1}: ${template.name}`}
                aria-current={index === activeLogical ? "true" : undefined}
                className={cn(
                  "h-2.5 w-2.5 cursor-pointer rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                  index === activeLogical ? "bg-accent" : "bg-border hover:bg-accent/60",
                )}
              />
            ))}
          </div>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        Mẫu {activeLogical + 1} trên {total}: {current?.name}
      </p>

      {openAt !== null && templates[openAt] && (
        <TemplatePreviewDialog
          template={templates[openAt]}
          onClose={() => setOpenAt(null)}
        />
      )}
    </div>
  );
}
