"use client";

import * as React from "react";
import { useUser } from "@auth0/nextjs-auth0";
import { ArrowRight, Check, ExternalLink, Music2, Pause, Play, X } from "lucide-react";
import { PLAN_LABELS, getTemplateFeatures, type TemplateFeature } from "@/config/template-features";
import { SITE_LINKS } from "@/config/site";
import { cn } from "@/lib/utils";
import { frameOffsetMax, setFrameOffset } from "@/lib/frame-scroll";
import type { CollectionTemplate } from "./types";

interface TemplatePreviewDialogProps {
  template: CollectionTemplate;
  onClose: () => void;
}

const BASE_MOBILE_WIDTH = 375;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function SnapshotPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#F4EFEA] px-4 text-center">
      <span className="h-10 w-10 rounded-full border border-[#E8E2D9] bg-white" aria-hidden="true" />
      <p className="font-serif text-base text-[#1F1D1A]">{name}</p>
      <p className="text-xs text-[#6B655E]">Chưa có ảnh xem trước</p>
    </div>
  );
}

function FeatureList({
  title,
  badge,
  features,
}: {
  title: string;
  badge?: string;
  features: TemplateFeature[];
}) {
  if (features.length === 0) return null;

  return (
    <section className="mt-5">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold tracking-[0.16em] text-[#6B655E] uppercase">
          {title}
        </h3>
        {badge && (
          <span className="rounded-full border border-[#7A1C24]/30 bg-[#7A1C24]/10 px-2 py-0.5 text-[10px] font-semibold text-[#7A1C24]">
            {badge}
          </span>
        )}
      </div>
      <ul className="mt-2.5 space-y-2">
        {features.map((feature) => (
          <li key={feature.id} className="flex items-start gap-2 text-xs sm:text-sm text-[#1F1D1A]">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="flex flex-wrap items-center gap-1.5">
              {feature.label}
              {feature.comingSoon && (
                <span className="rounded-full border border-[#E8E2D9] bg-[#F4EFEA] px-2 py-0.5 text-[10px] font-medium text-[#6B655E]">
                  Sắp có
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TemplatePreviewDialog({
  template,
  onClose,
}: TemplatePreviewDialogProps) {
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const frameRef = React.useRef<HTMLDivElement | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);
  const liveFrameRef = React.useRef<HTMLIFrameElement | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const openerRef = React.useRef<Element | null>(null);
  const closingRef = React.useRef(false);
  const titleId = React.useId();
  const [frameWidth, setFrameWidth] = React.useState<number>(0);

  const { user } = useUser();
  const [closing, setClosing] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [liveReady, setLiveReady] = React.useState(false);
  const [musicOn, setMusicOn] = React.useState(true);
  const [snapshotState, setSnapshotState] = React.useState<
    "loading" | "ready" | "error"
  >("loading");
  const [distance, setDistance] = React.useState(0);

  const features = getTemplateFeatures(template.plan, template.extraFeatureIds);
  const planLabel = PLAN_LABELS[template.plan];

  const requestClose = React.useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(onClose, 160);
  }, [onClose]);

  React.useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    if (el.clientWidth > 0) {
      setFrameWidth(el.clientWidth);
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const cr = entry.contentRect;
        if (cr.width > 0) {
          setFrameWidth(cr.width);
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    openerRef.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      const opener = openerRef.current;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, []);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    audio.play().catch(() => setMusicOn(false));
    return () => {
      audio.pause();
    };
  }, []);

  const liveUrl =
    template.embedUrl ??
    (template.demoUrl ? `${template.demoUrl}?embed=1` : null);

  React.useEffect(() => {
    if (!liveUrl || !liveReady || paused) return;
    const frame = liveFrameRef.current;
    if (!frame) return;
    let raf = 0;
    let started = 0;
    const tick = (now: number) => {
      try {
        const max = frameOffsetMax(frame);
        if (!max) return;
        if (!started) started = now;
        const duration = Math.min(30_000, Math.max(12_000, max * 9));
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
  }, [liveReady, liveUrl, paused]);

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

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [requestClose]);

  const trapFocus = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const panel = panelRef.current;
    if (!panel) return;

    const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (nodes.length === 0) return;

    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleSnapshotLoad = () => {
    const img = imgRef.current;
    const frame = frameRef.current;
    if (!img || !frame) return;
    setDistance(Math.max(0, img.naturalHeight - frame.clientHeight));
    setSnapshotState("ready");
  };

  const durationSec = Math.min(60, Math.max(12, Math.round(distance / 45)));
  const state = closing ? "closing" : "open";

  const createPath =
    template.kind === "designer"
      ? `${SITE_LINKS.createWedding}?designerTemplate=${encodeURIComponent(template.id)}`
      : `${SITE_LINKS.createWedding}?template=${encodeURIComponent(template.id)}`;
  const useHref = user
    ? createPath
    : `/auth/login?returnTo=${encodeURIComponent(createPath)}`;

  const snapshotStyle = {
    "--snapshot-distance": `${distance}px`,
    "--snapshot-duration": `${durationSec}s`,
  } as React.CSSProperties;

  const previewScale = frameWidth > 0 ? frameWidth / BASE_MOBILE_WIDTH : 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      data-preview-paused={paused ? "true" : "false"}
    >
      {/* Dim Backdrop */}
      <div
        className="template-dialog-overlay absolute inset-0 bg-[#1F1D1A]/50 backdrop-blur-xs transition-opacity duration-200"
        data-state={state}
        aria-hidden="true"
        onClick={requestClose}
      />

      {/* Editorial Luxury Dialog Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-state={state}
        onKeyDown={trapFocus}
        className="template-dialog-panel relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-[#E8E2D9] bg-[#FAF8F5] shadow-2xl md:max-h-[92vh] md:w-[clamp(700px,56vw,980px)] md:rounded-3xl"
      >
        {/* Top Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#E8E2D9] bg-white px-6 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate font-serif text-2xl font-normal text-[#1F1D1A]">
              {template.name}
            </h2>
            <p className="truncate text-xs text-[#6B655E] mt-0.5">
              <span className="font-semibold text-[#7A1C24]">{planLabel}</span> · {template.subtitle}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={requestClose}
            className="inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full border border-[#E8E2D9] bg-white px-3 text-xs font-medium text-[#1F1D1A] transition-colors hover:bg-[#F4EFEA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline ml-1">Đóng</span>
          </button>
        </div>

        {/* Modal Body: Left Details & Right Realistic Phone Frame */}
        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-12 md:grid-rows-1">
          {/* Right Column on desktop: Phone Frame Preview (col-span-6) */}
          <div className="order-1 flex min-h-0 flex-col items-center justify-center border-b border-[#E8E2D9] bg-[#F4EFEA] p-3 sm:p-4 md:order-2 md:col-span-6 md:border-b-0 md:border-l md:p-5">
            <div
              ref={frameRef}
              className="snapshot-frame no-scrollbar relative mx-auto h-[44vh] max-h-[380px] aspect-[9/19] w-auto max-w-full shrink-0 overflow-hidden rounded-[2.5rem] border-8 border-[#1F1D1A] bg-white shadow-xl md:h-[min(640px,calc(92vh-160px))] md:max-h-none"
            >
              {liveUrl ? (
                <div className="relative h-full w-full overflow-hidden bg-white">
                  {!liveReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#FAF8F5]">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#7A1C24] border-t-transparent" />
                    </div>
                  )}
                  <iframe
                    ref={liveFrameRef}
                    src={liveUrl}
                    title={`Xem trước mẫu ${template.name}`}
                    onLoad={() => setLiveReady(true)}
                    className={cn(
                      "border-0 transition-opacity duration-300",
                      liveReady ? "opacity-100" : "opacity-0",
                    )}
                    style={{
                      width: `${BASE_MOBILE_WIDTH}px`,
                      height: `${100 / previewScale}%`,
                      transform: `scale(${previewScale})`,
                      transformOrigin: "top left",
                    }}
                  />
                </div>
              ) : snapshotState !== "error" ? (
                <img
                  ref={imgRef}
                  src={template.snapshotImage}
                  alt={`Xem trước mẫu ${template.name}`}
                  width={750}
                  height={2400}
                  loading="lazy"
                  decoding="async"
                  onLoad={handleSnapshotLoad}
                  onError={() => setSnapshotState("error")}
                  className={cn(
                    "snapshot-scroll block h-auto w-full",
                    snapshotState === "loading" && "opacity-0",
                  )}
                  style={snapshotStyle}
                />
              ) : (
                <SnapshotPlaceholder name={template.name} />
              )}
            </div>

            {/* Play/Pause & Music Controls */}
            <div className="mt-3 flex shrink-0 flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setPaused((current) => !current)}
                aria-pressed={paused}
                className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-3 text-xs font-medium text-[#1F1D1A] shadow-2xs transition-colors hover:bg-[#F4EFEA]"
              >
                {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
                <span>{paused ? "Phát cuộn" : "Tạm dừng"}</span>
              </button>
              <button
                type="button"
                onClick={toggleMusic}
                className="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-3 text-xs font-medium text-[#1F1D1A] shadow-2xs transition-colors hover:bg-[#F4EFEA]"
              >
                <Music2 className="h-3.5 w-3.5" />
                <span>{musicOn ? "Tắt nhạc" : "Bật nhạc"}</span>
              </button>
            </div>
          </div>

          {/* Left Column on desktop: Features & Prominent CTA (col-span-6) */}
          <div className="order-2 flex min-h-0 flex-col md:order-1 md:col-span-6">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <p className="text-sm leading-relaxed text-[#6B655E]">
                {template.description}
              </p>

              <FeatureList title="Chức năng có sẵn" features={features.base} />
              <FeatureList
                title="Chức năng nâng cao"
                badge={planLabel}
                features={features.advanced}
              />
              <FeatureList title="Riêng mẫu này" features={features.extras} />
            </div>

            {/* Bottom Actions Bar */}
            <div className="shrink-0 border-t border-[#E8E2D9] bg-white px-6 py-4">
              <div className="flex flex-col gap-2.5 sm:flex-row">
                {template.demoUrl && (
                  <a
                    href={template.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-4 text-xs font-semibold text-[#1F1D1A] transition-colors hover:bg-[#F4EFEA]"
                  >
                    <span>Mở toàn màn hình</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
                <a
                  href={useHref}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B]"
                >
                  <span>Dùng mẫu này</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <audio ref={audioRef} src="/media/wedding.mp3" loop preload="auto" />
      </div>
    </div>
  );
}
