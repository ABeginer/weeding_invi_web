"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MusicToggle } from "@/components/demo/music-toggle";
import { LANDING_COPY } from "@/config/landing";
import { SITE_LINKS } from "@/config/site";
import { getDemoTemplateData } from "@/content/demo";
import { HERO_PREVIEW_TEMPLATES } from "@/templates/registry";
import { TemplatePreviewRenderer } from "@/templates/TemplatePreviewRenderer";
import { PhoneFrame } from "./phone-frame";

export function HeroSection() {
  const [isOpened, setIsOpened] = React.useState(false);
  const phoneScrollRef = React.useRef<HTMLDivElement | null>(null);

  const activeTemplate = HERO_PREVIEW_TEMPLATES[0];
  const demoData = React.useMemo(
    () => getDemoTemplateData(activeTemplate.id),
    [activeTemplate.id],
  );

  const createHref = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(
    activeTemplate.id,
  )}`;
  const copy = LANDING_COPY.hero;

  return (
    <section className="relative overflow-hidden border-b border-border bg-bg">
      {/* Váº§ng sÃ¡ng má» nháº¹ chá»‰ hiá»‡n trÃªn mÃ n hÃ¬nh vá»«a/lá»›n Ä‘á»ƒ giá»¯ mÆ°á»£t trÃªn mobile */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 hidden h-96 w-[760px] -translate-x-1/2 rounded-full bg-accent-soft opacity-45 blur-3xl md:block"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-start gap-7 px-4 pt-4 pb-8 sm:px-6 md:grid-cols-12 md:gap-8 md:pt-5 md:pb-8 lg:gap-10 lg:pt-6">
        {/* Cá»™t trÃ¡i (desktop/tablet) / PhÃ­a trÃªn (mobile) */}
        <div className="space-y-4 text-center md:col-span-7 md:pt-1 md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success-fg" aria-hidden="true" />
            <span className="text-[12px] sm:text-[13px] font-semibold tracking-[0.12em] text-accent-text uppercase">
              {copy.eyebrow}
            </span>
          </div>

          <div className="relative">
            <h1 className="font-display text-[clamp(28px,5.2vw,42px)] leading-[1.1] font-semibold tracking-tight text-accent-text">
              {copy.title}
            </h1>
            <div
              aria-hidden="true"
              className="hero-hairline mt-3 h-[1.5px] rounded-full bg-accent/70"
            />
          </div>

          <p className="mx-auto max-w-lg text-sm leading-relaxed text-text sm:text-base md:mx-0">
            {copy.description}
          </p>

          <div className="flex flex-col items-stretch justify-center gap-2.5 pt-0.5 sm:flex-row sm:items-center md:justify-start">
            <Link
              href={createHref}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-6 text-xs font-semibold text-accent-fg shadow-md transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:h-11 sm:text-sm"
            >
              <span>{copy.primaryCta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <Link
              href={SITE_LINKS.templates}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-transparent px-5 text-xs font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:h-11 sm:text-sm"
            >
              <span>{copy.secondaryCta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-text-muted md:justify-start sm:text-xs">
            <li>âœ¨ KhÃ´ng giá»›i háº¡n lÆ°á»£t má»Ÿ thiá»‡p</li>
            <li>ðŸ’Œ Tá»± Ä‘á»™ng Ä‘á»•i xÆ°ng hÃ´ lá»… phÃ©p</li>
            <li>ðŸ“± Cháº¡m &amp; má»Ÿ phong bÃ¬ mÆ°á»£t mÃ </li>
          </ul>
        </div>

        {/* Cá»™t pháº£i (desktop/tablet) / PhÃ­a dÆ°á»›i (mobile): Khung Ä‘iá»‡n thoáº¡i CSS + Demo cháº¡y tháº­t */}
        <div className="relative flex flex-col items-center md:col-span-5 md:items-end">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-6 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
            <div className="absolute left-1/3 top-40 h-56 w-56 rounded-full bg-accent-soft blur-3xl" />
            <div className="absolute right-2 top-24 h-32 w-32 rounded-full bg-warning-soft/70 blur-2xl" />
            <div className="absolute left-6 top-16 h-1.5 w-1.5 rounded-full bg-accent/60" />
            <div className="absolute right-10 top-8 h-1 w-1 rounded-full bg-accent/50" />
            <div className="absolute bottom-24 left-10 h-1 w-1 rounded-full bg-accent/40" />
          </div>
          <div className="flex w-full max-w-[352px] flex-col items-center md:w-auto md:max-w-none">
            <PhoneFrame
              scrollRef={phoneScrollRef}
              enableFloat
              lockedScroll={!isOpened}
              desktopOffsetPx={116}
            >
              <TemplatePreviewRenderer
                key={activeTemplate.id}
                templateId={activeTemplate.id}
                data={demoData}
                mode="demo"
                contained
                viewport="phone"
                isOpened={isOpened}
                onOpenedChange={setIsOpened}
                externalMusicControl
              />
            </PhoneFrame>

            {/* Äiá»u khiá»ƒn nháº¡c & hÆ°á»›ng dáº«n ngay cáº¡nh khung */}
            <div className="mt-2.5 flex w-full flex-wrap items-center justify-between gap-2 px-1">
              <span className="text-[11px] text-text-muted">
                {copy.phoneHelperHint}
              </span>
              <MusicToggle
                src={activeTemplate.defaultMusic.src}
                title={activeTemplate.defaultMusic.title}
                resetKey={activeTemplate.id}
                compact
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
