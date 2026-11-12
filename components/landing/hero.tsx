"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { MusicToggle } from "@/components/demo/music-toggle";
import { LANDING_COPY } from "@/config/landing";
import { SITE_LINKS } from "@/config/site";
import { getDemoTemplateData } from "@/content/demo";
import { cn } from "@/lib/utils";
import { HERO_PREVIEW_TEMPLATES } from "@/templates/registry";
import { TemplatePreviewRenderer } from "@/templates/TemplatePreviewRenderer";
import { PhoneFrame } from "./phone-frame";

export function HeroSection() {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isOpened, setIsOpened] = React.useState(false);
  const phoneScrollRef = React.useRef<HTMLDivElement | null>(null);
  const prefetchedHeroUrlsRef = React.useRef<Set<string>>(new Set());

  const prefetchTemplateHero = React.useCallback((templateId: string) => {
    if (typeof window === "undefined") return;
    const url = getDemoTemplateData(templateId).photos.heroUrl;
    if (!url || prefetchedHeroUrlsRef.current.has(url)) return;
    prefetchedHeroUrlsRef.current.add(url);
    const img = new window.Image();
    img.decoding = "async";
    img.src = url;
  }, []);

  const activeTemplate = HERO_PREVIEW_TEMPLATES[activeIndex] ?? HERO_PREVIEW_TEMPLATES[0];
  const demoData = React.useMemo(
    () => getDemoTemplateData(activeTemplate.id),
    [activeTemplate.id],
  );

  const selectedFreeTemplateId =
    activeTemplate.plan === "free" ? activeTemplate.id : "basic-1";
  const createHref = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(
    selectedFreeTemplateId,
  )}`;

  const handleSelectQuickTemplate = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index);
    setIsOpened(false);
    phoneScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  };

  const handleScrollToTemplates = () => {
    const target = document.getElementById("mau-thiep");
    if (!target) return;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
  };

  const copy = LANDING_COPY.hero;

  return (
    <section className="relative overflow-hidden border-b border-border bg-bg">
      {/* Vầng sáng mờ nhẹ chỉ hiện trên màn hình vừa/lớn để giữ mượt trên mobile */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 hidden h-96 w-[760px] -translate-x-1/2 rounded-full bg-accent-soft opacity-45 blur-3xl md:block"
      />

      <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-6 px-4 pt-4 pb-7 sm:px-6 md:grid-cols-12 md:gap-8 md:py-7">
        {/* Cột trái (desktop/tablet) / Phía trên (mobile) */}
        <div className="space-y-3.5 text-center md:col-span-7 md:text-left">
          <div className="inline-flex items-center rounded-full border border-border bg-surface px-3 py-1">
            <span className="text-[11px] font-medium tracking-[0.16em] text-accent-text uppercase">
              {copy.eyebrow}
            </span>
          </div>

          <h1 className="font-display text-[clamp(26px,3.6vw,36px)] leading-[1.12] font-semibold tracking-tight text-accent-text">
            {copy.title}
          </h1>

          <p className="mx-auto max-w-lg text-sm leading-relaxed text-text sm:text-[15px] md:mx-0">
            {copy.description}
          </p>

          <div className="flex flex-col items-stretch justify-center gap-2.5 pt-0.5 sm:flex-row sm:items-center md:justify-start">
            <Link
              href={createHref}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-accent px-5 text-xs font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:text-sm"
            >
              <span>{copy.primaryCta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={handleScrollToTemplates}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-text bg-transparent px-5 text-xs font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:text-sm"
            >
              <span>{copy.secondaryCta}</span>
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* 4 nút đổi nhanh trên desktop đặt bên trái để cột phải vừa trọn vẹn khung điện thoại */}
          <div className="hidden max-w-sm pt-1.5 md:block">
            <div className="rounded-2xl border border-border bg-surface p-2.5 shadow-xs">
              <p className="text-[10px] font-medium tracking-[0.14em] text-text-muted uppercase">
                {copy.quickSwitchLabel}
              </p>
              <div
                role="group"
                aria-label={copy.quickSwitchLabel}
                className="mt-1.5 grid grid-cols-2 gap-1.5"
              >
                {HERO_PREVIEW_TEMPLATES.map((tpl, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={`desktop-${tpl.id}`}
                      type="button"
                      onMouseEnter={() => prefetchTemplateHero(tpl.id)}
                      onFocus={() => prefetchTemplateHero(tpl.id)}
                      onClick={() => handleSelectQuickTemplate(index)}
                      aria-pressed={isActive}
                      className={cn(
                        "inline-flex min-h-8 cursor-pointer items-center justify-center rounded-xl border px-2.5 py-1 text-center text-[11px] font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                        isActive
                          ? "border-accent bg-accent-soft font-semibold text-text"
                          : "border-border bg-bg text-text hover:border-accent",
                      )}
                    >
                      <span className="line-clamp-1">{tpl.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải (desktop/tablet) / Phía dưới (mobile): Khung điện thoại CSS + Demo chạy thật */}
        <div className="flex flex-col items-center md:col-span-5 md:items-end">
          <div className="flex w-full max-w-[352px] flex-col items-center md:w-auto md:max-w-none">
            <PhoneFrame
              scrollRef={phoneScrollRef}
              enableFloat
              lockedScroll={!isOpened}
              desktopOffsetPx={156}
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

            {/* Điều khiển nhạc & hướng dẫn ngay cạnh khung */}
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

            {/* 4 nút đổi nhanh trên mobile */}
            <div className="mt-3 w-full rounded-2xl border border-border bg-surface p-3 shadow-xs md:hidden">
              <p className="text-[11px] font-medium tracking-[0.14em] text-text-muted uppercase">
                {copy.quickSwitchLabel}
              </p>
              <div
                role="group"
                aria-label={copy.quickSwitchLabel}
                className="mt-2 grid grid-cols-2 gap-1.5"
              >
                {HERO_PREVIEW_TEMPLATES.map((tpl, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectQuickTemplate(index)}
                      aria-pressed={isActive}
                      className={cn(
                        "inline-flex min-h-9 cursor-pointer items-center justify-center rounded-xl border px-2.5 py-1.5 text-center text-[11px] font-medium transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                        isActive
                          ? "border-accent bg-accent-soft font-semibold text-text"
                          : "border-border bg-bg text-text hover:border-accent",
                      )}
                    >
                      <span className="line-clamp-1">{tpl.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
