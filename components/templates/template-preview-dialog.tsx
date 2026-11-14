"use client";

import * as React from "react";
import { useUser } from "@auth0/nextjs-auth0";
import { Check, Pause, Play, X } from "lucide-react";
import { PLAN_LABELS, getTemplateFeatures, type TemplateFeature } from "@/config/template-features";
import { SITE_LINKS } from "@/config/site";
import { cn } from "@/lib/utils";
import type { CollectionTemplate } from "./types";

interface TemplatePreviewDialogProps {
  template: CollectionTemplate;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function SnapshotPlaceholder({ name }: { name: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface-alt px-4 text-center">
      <span className="h-10 w-10 rounded-full border border-border bg-surface" aria-hidden="true" />
      <p className="text-sm font-medium text-text">{name}</p>
      <p className="text-xs text-text-muted">Chưa có ảnh xem trước</p>
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
        <h3 className="text-xs font-semibold tracking-[0.16em] text-text-muted uppercase">
          {title}
        </h3>
        {badge && (
          <span className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-text">
            {badge}
          </span>
        )}
      </div>
      <ul className="mt-2 space-y-2">
        {features.map((feature) => (
          <li key={feature.id} className="flex items-start gap-2 text-sm text-text">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-fg" aria-hidden="true" />
            <span className="flex flex-wrap items-center gap-1.5">
              {feature.label}
              {feature.comingSoon && (
                <span className="rounded-full border border-soon-border bg-soon-bg px-2 py-0.5 text-[10px] font-medium text-soon-fg">
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
  const openerRef = React.useRef<Element | null>(null);
  const closingRef = React.useRef(false);
  const titleId = React.useId();

  const { user } = useUser();
  const [closing, setClosing] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
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

  const createPath = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(template.id)}`;
  const useHref = user
    ? createPath
    : `/auth/login?returnTo=${encodeURIComponent(createPath)}`;

  const snapshotStyle = {
    "--snapshot-distance": `${distance}px`,
    "--snapshot-duration": `${durationSec}s`,
  } as React.CSSProperties;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:items-center"
      data-preview-paused={paused ? "true" : "false"}
    >
      <div
        className="template-dialog-overlay absolute inset-0 bg-text/50"
        data-state={state}
        aria-hidden="true"
        onClick={requestClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-state={state}
        onKeyDown={trapFocus}
        className="template-dialog-panel relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-surface shadow-2xl supports-[backdrop-filter]:bg-surface/90 backdrop-blur-[16px] md:max-h-[85vh] md:w-[clamp(640px,50vw,960px)] md:rounded-3xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="truncate font-display text-lg font-semibold text-text">
              {template.name}
            </h2>
            <p className="truncate text-xs text-text-muted">
              {planLabel} · {template.subtitle}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={requestClose}
            className="inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            <span>Đóng</span>
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] md:grid-cols-2 md:grid-rows-1">
          <div className="order-1 border-b border-border p-4 md:order-2 md:border-b-0 md:border-l">
            <div
              ref={frameRef}
              className="snapshot-frame relative mx-auto h-[45vh] w-full max-w-[320px] overflow-y-auto overflow-x-hidden rounded-[2rem] border-8 border-text/80 bg-surface-alt md:h-[62vh]"
            >
              {snapshotState !== "error" ? (
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

            <div className="mt-3 flex justify-center">
              <button
                type="button"
                onClick={() => setPaused((current) => !current)}
                aria-pressed={paused}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {paused ? (
                  <Play className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Pause className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{paused ? "Phát xem trước" : "Tạm dừng xem trước"}</span>
              </button>
            </div>
          </div>

          <div className="order-2 flex min-h-0 flex-col md:order-1">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <p className="text-sm leading-relaxed text-text-muted">
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

            <div className="shrink-0 border-t border-border bg-surface px-5 py-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                {template.demoUrl && (
                  <a
                    href={template.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-border bg-surface px-5 text-sm font-semibold text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Xem thử
                  </a>
                )}
                <a
                  href={useHref}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Dùng thiệp này
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
