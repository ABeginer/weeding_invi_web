"use client";

import * as React from "react";
import Link from "next/link";
import { Music2, Pause, Play, X } from "lucide-react";
import { PLAN_LABELS } from "@/config/template-features";
import type { PublicDesignerTemplate } from "./designer-types";
import { frameOffsetMax, setFrameOffset } from "@/lib/frame-scroll";

interface DesignerPreviewDialogProps {
  template: PublicDesignerTemplate;
  onClose: () => void;
}

/**
 * Popup xem thiệp sống: iframe render đúng nội dung đã publish, tự cuộn và
 * phát nhạc sau thao tác mở (trình duyệt cho phép autoplay sau click).
 */
export function DesignerPreviewDialog({
  template,
  onClose,
}: DesignerPreviewDialogProps) {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [musicOn, setMusicOn] = React.useState(true);
  const [scrolling, setScrolling] = React.useState(true);

  const title = template.displayTitle ?? template.name;

  React.useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    audio.play().catch(() => setMusicOn(false));
    return () => {
      audio.pause();
    };
  }, []);

  React.useEffect(() => {
    if (!loaded || !scrolling) return;
    const frame = iframeRef.current;
    if (!frame) return;
    let raf = 0;
    let started = 0;
    const tick = (now: number) => {
      try {
        const max = frameOffsetMax(frame);
        if (!max) return;
        if (!started) started = now;
        const duration = Math.min(30_000, Math.max(12_000, max * 9));
        const cycle = duration + 1800;
        const elapsed = (now - started) % cycle;
        const progress = Math.min(1, elapsed / duration);
        setFrameOffset(frame, max * progress);
        raf = window.requestAnimationFrame(tick);
      } catch {
        raf = window.requestAnimationFrame(tick);
      }
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [loaded, scrolling]);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().then(() => setMusicOn(true)).catch(() => setMusicOn(false));
    } else {
      audio.pause();
      setMusicOn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <div
        className="absolute inset-0 bg-text/50 backdrop-blur-[2px]"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Xem trước ${title}`}
        className="relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl md:max-h-[90vh] md:w-[min(1040px,94vw)] md:flex-row md:rounded-3xl"
      >
        <div className="flex min-h-0 flex-1 justify-center bg-surface-alt p-3 md:p-5">
          <div className="relative aspect-[390/844] h-[58vh] max-h-[720px] w-auto overflow-hidden rounded-[2rem] border-8 border-text/80 bg-bg md:h-[78vh]">
            <iframe
              ref={iframeRef}
              src={`/mau/designer/${template.id}/embed`}
              title={`Thiệp ${title}`}
              onLoad={() => setLoaded(true)}
              className="h-full w-full border-0"
            />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col border-t border-border md:w-[340px] md:border-t-0 md:border-l">
          <div className="flex items-start justify-between gap-3 px-5 py-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-accent-text uppercase">
                Mẫu thiết kế
              </p>
              <h2 className="mt-1 truncate font-display text-xl font-semibold text-text">
                {title}
              </h2>
              <p className="mt-1 text-xs text-text-muted">
                {PLAN_LABELS[template.plan]} · v{template.version}
                {template.ritual ? ` · ${template.ritual}` : ""}
              </p>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-4 text-sm text-text-muted">
            <p>
              Thiệp chạy tự động để bạn xem bố cục, chuyển động và các trang. Dữ
              liệu đang dùng là mẫu.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl border border-border bg-bg p-3">
                <p className="text-text-muted">Gói</p>
                <p className="mt-1 font-semibold text-text">
                  {PLAN_LABELS[template.plan]}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-bg p-3">
                <p className="text-text-muted">Phiên bản</p>
                <p className="mt-1 font-semibold text-text">v{template.version}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setScrolling((value) => !value)}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
              >
                {scrolling ? (
                  <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {scrolling ? "Tạm dừng cuộn" : "Tiếp tục cuộn"}
              </button>
              <button
                type="button"
                onClick={toggleMusic}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
              >
                <Music2 className="h-3.5 w-3.5" aria-hidden="true" />
                {musicOn ? "Tắt nhạc" : "Bật nhạc"}
              </button>
            </div>

            <Link
              href={`/mau/designer/${template.id}`}
              className="inline-flex text-xs font-medium text-accent-text underline underline-offset-4"
            >
              Mở trang xem đầy đủ
            </Link>
          </div>

          <div className="border-t border-border px-5 py-3">
            <Link
              href="/dashboard"
              className="flex h-11 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Dùng mẫu này
            </Link>
            <p className="mt-2 text-center text-[10px] text-text-muted">
              Chọn mẫu trong dashboard khi tạo thiệp.
            </p>
          </div>
        </div>

        <audio ref={audioRef} src="/media/wedding.mp3" loop preload="auto" />
      </div>
    </div>
  );
}
