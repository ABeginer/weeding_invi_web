"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import { SITE_LINKS } from "@/config/site";
import { cn } from "@/lib/utils";
import type { WeddingTemplateMeta } from "@/templates/types";
import { MusicToggle } from "./music-toggle";
import { ViewSwitcher, type DemoViewportMode } from "./view-switcher";

interface DemoToolbarProps {
  template: WeddingTemplateMeta;
  viewport: DemoViewportMode;
  onViewportChange: (next: DemoViewportMode) => void;
  onUseTemplate: () => void;
}

export function DemoToolbar({
  template,
  viewport,
  onViewportChange,
  onUseTemplate,
}: DemoToolbarProps) {
  const badgeLabel = LANDING_COPY.templates.planBadges[template.plan];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-lnd-border bg-lnd-bg/85 text-lnd-body backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2.5 px-3 py-2.5 sm:px-6 sm:py-3">
          {/* Trái: Quay lại & Tên mẫu */}
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Link
              href={SITE_LINKS.templatesAnchor}
              className="inline-flex h-9 shrink-0 items-center rounded-full border border-lnd-border bg-lnd-surface px-3 text-xs font-medium text-lnd-body transition-colors hover:border-lnd-gold hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
            >
              {LANDING_COPY.demo.backToTemplates}
            </Link>

            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate font-display text-lg font-semibold text-lnd-gold sm:text-xl">
                {template.name}
              </h1>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  template.plan === "free"
                    ? "border-lnd-free-border bg-lnd-free-bg text-lnd-free-text"
                    : "border-lnd-gold text-lnd-gold bg-lnd-gold-tint"
                )}
              >
                {badgeLabel}
              </span>
            </div>
          </div>

          {/* Giữa: Segmented View Switcher */}
          <div className="order-3 flex w-full items-center justify-between gap-2 pt-1 md:order-2 md:w-auto md:pt-0">
            <ViewSwitcher value={viewport} onChange={onViewportChange} />
            <MusicToggle
              src={template.defaultMusic.src}
              title={template.defaultMusic.title}
              resetKey={template.id}
              compact
              className="md:hidden"
            />
          </div>

          {/* Phải: Nhạc + CTA (Desktop) */}
          <div className="order-2 hidden items-center gap-2.5 md:order-3 md:flex">
            <MusicToggle
              src={template.defaultMusic.src}
              title={template.defaultMusic.title}
              resetKey={template.id}
              compact
            />
            <button
              type="button"
              onClick={onUseTemplate}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-lnd-gold px-5 text-xs font-semibold tracking-wide text-lnd-bg transition-colors hover:bg-lnd-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold focus-visible:ring-offset-2 focus-visible:ring-offset-lnd-bg sm:text-sm"
            >
              <span>{LANDING_COPY.demo.useNowLabel}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* CTA cố định dưới đáy trên điện thoại */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-lnd-border bg-lnd-bg/92 px-4 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={onUseTemplate}
          className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-lnd-gold px-6 text-sm font-semibold text-lnd-bg shadow-lg transition-colors hover:bg-lnd-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
        >
          <span>{LANDING_COPY.demo.useNowLabel}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
