"use client";

import * as React from "react";
import { Eye, Sparkles } from "lucide-react";
import { PLAN_LABELS } from "@/config/template-features";
import { cn } from "@/lib/utils";
import {
  frameOffsetMax,
  setFrameOffset,
} from "@/lib/frame-scroll";
import { DesignerPreviewDialog } from "./designer-preview-dialog";
import type { PublicDesignerTemplate } from "./designer-types";

interface DesignerTemplateCardProps {
  template: PublicDesignerTemplate;
}

/**
 * Card mẫu designer có preview sống:
 * - Desktop hover: iframe chạy chính nội dung thiệp từ trên xuống.
 * - Mobile: chỉ hiện ảnh trang đầu (hoặc iframe tĩnh nếu chưa có cover).
 * - Click: mở popup có thông tin, nhạc và tự cuộn.
 */
export function DesignerTemplateCard({ template }: DesignerTemplateCardProps) {
  const [hovered, setHovered] = React.useState(false);
  const [scale, setScale] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [coverFailed, setCoverFailed] = React.useState(false);
  const [inView, setInView] = React.useState(false);
  const frameRef = React.useRef<HTMLDivElement | null>(null);
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

  const title = template.displayTitle ?? template.name;
  const showLive = hovered || ((!template.coverUrl || coverFailed) && inView);

  React.useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(media.matches);
    const onChange = () => setReduced(media.matches);
    media.addEventListener?.("change", onChange);
    return () => media.removeEventListener?.("change", onChange);
  }, []);

  React.useEffect(() => {
    const node = frameRef.current;
    if (!node) return;
    const update = () => setScale(node.clientWidth / 390);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!hovered || !loaded || reduced || !showLive) return;
    const frame = iframeRef.current;
    if (!frame) return;
    let raf = 0;
    let started = 0;
    const tick = (now: number) => {
      try {
        const max = frameOffsetMax(frame);
        if (!max) return;
        if (!started) started = now;
        const duration = Math.min(26_000, Math.max(7_000, max * 7));
        const progress = Math.min(1, (now - started) / duration);
        setFrameOffset(frame, max * progress);
        if (progress < 1) raf = window.requestAnimationFrame(tick);
      } catch {
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(raf);
      setFrameOffset(frame, 0);
    };
  }, [hovered, loaded, reduced, showLive]);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") setHovered(true);
        }}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        aria-label={`Xem mẫu ${title}`}
        className="group cursor-pointer text-left focus-visible:outline-none"
      >
        <div
          ref={frameRef}
          className="relative aspect-[390/844] w-full overflow-hidden rounded-2xl border border-border bg-surface-alt shadow-lg"
        >
          {template.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={template.coverUrl}
              alt={`Mẫu thiệp ${title}`}
              loading="lazy"
              decoding="async"
              width={780}
              height={1688}
              onError={() => setCoverFailed(true)}
              className={cn(
                "h-full w-full object-cover transition-opacity duration-300",
                showLive && loaded ? "opacity-0" : "opacity-100",
              )}
            />
          ) : null}

          {showLive && (
            <iframe
              ref={iframeRef}
              src={`/mau/designer/${template.id}/embed`}
              title={`Xem trước ${title}`}
              tabIndex={-1}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              className={cn(
                "pointer-events-none absolute top-0 left-0 origin-top-left border-0 transition-opacity duration-300",
                loaded ? "opacity-100" : "opacity-0",
              )}
              style={{
                width: 390,
                height: 844,
                transform: `scale(${scale || 0.7})`,
              }}
            />
          )}

          {!showLive && !template.coverUrl && (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-text-muted">
              Chưa có ảnh xem trước
            </div>
          )}

          <span className="pointer-events-none absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-text/75 px-2 py-1 text-[10px] font-semibold text-bg opacity-0 transition-opacity group-hover:opacity-100">
            <Eye className="h-3 w-3" aria-hidden="true" />
            Xem thiệp
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{title}</p>
            <p className="truncate text-[10px] text-text-muted">
              {template.name !== title ? `${template.name} · ` : ""}
              {PLAN_LABELS[template.plan]}
              {template.ritual ? ` · ${template.ritual}` : ""}
            </p>
          </div>
          <Sparkles
            className="h-3.5 w-3.5 shrink-0 text-accent-text"
            aria-hidden="true"
          />
        </div>
      </div>

      {open && (
        <DesignerPreviewDialog
          template={template}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
