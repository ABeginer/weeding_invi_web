"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, Sparkles } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import { SITE_LINKS } from "@/config/site";
import { getDemoWeddingContent } from "@/content/demo";
import { cn } from "@/lib/utils";
import { HERO_PREVIEW_TEMPLATES } from "@/templates/registry";
import { TemplatePreviewRenderer } from "@/templates/TemplatePreviewRenderer";
import { MusicToggle } from "@/components/demo/music-toggle";
import { PhoneFrame } from "./phone-frame";

interface HeroSectionProps {
  isAuthenticated: boolean;
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isOpened, setIsOpened] = React.useState(false);
  const phoneScrollRef = React.useRef<HTMLDivElement | null>(null);

  const activeTemplate = HERO_PREVIEW_TEMPLATES[activeIndex] ?? HERO_PREVIEW_TEMPLATES[0];
  const demoContent = React.useMemo(
    () => getDemoWeddingContent(activeTemplate.id),
    [activeTemplate.id]
  );

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
    target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  };

  const copy = LANDING_COPY.hero;

  return (
    <section className="relative overflow-hidden border-b border-lnd-border bg-lnd-bg">
      {/* Vầng sáng mờ nhẹ phía sau — không làm giảm tương phản chữ */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-96 w-[760px] -translate-x-1/2 rounded-full bg-lnd-gold-tint opacity-45 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-4 pt-8 pb-14 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:py-8 xl:py-10">
        {/* Cột trái (desktop) / Phía trên (mobile) */}
        <div className="space-y-6 text-center lg:col-span-6 lg:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-lnd-gold-soft bg-lnd-surface px-3.5 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-lnd-gold" aria-hidden="true" />
            <span className="text-[11px] font-medium tracking-[0.16em] text-lnd-gold uppercase">
              {copy.eyebrow}
            </span>
          </div>

          <h1 className="font-display text-[clamp(36px,7vw,58px)] leading-[1.08] font-semibold tracking-tight text-lnd-gold">
            {copy.title}
          </h1>

          <p className="mx-auto max-w-xl text-base leading-relaxed text-lnd-body sm:text-lg lg:mx-0">
            {copy.description}
          </p>

          <div className="flex flex-col items-stretch justify-center gap-3 pt-1 sm:flex-row sm:items-center lg:justify-start">
            <button
              type="button"
              onClick={handleScrollToTemplates}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border border-lnd-gold bg-lnd-surface px-6 text-sm font-medium text-lnd-gold transition-colors hover:bg-lnd-gold-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold focus-visible:ring-offset-2 focus-visible:ring-offset-lnd-bg"
            >
              <span>{copy.secondaryCta}</span>
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </button>

            {isAuthenticated ? (
              <Link
                href={SITE_LINKS.dashboard}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-lnd-gold px-7 text-sm font-semibold text-lnd-bg shadow-lg transition-colors hover:bg-lnd-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold focus-visible:ring-offset-2 focus-visible:ring-offset-lnd-bg"
              >
                <span>{copy.authenticatedCta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <a
                href={SITE_LINKS.login}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-lnd-gold px-7 text-sm font-semibold text-lnd-bg shadow-lg transition-colors hover:bg-lnd-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold focus-visible:ring-offset-2 focus-visible:ring-offset-lnd-bg"
              >
                <span>{copy.primaryCta}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>

          <p className="text-xs tracking-wide text-lnd-muted">{copy.noCardNote}</p>
        </div>

        {/* Cột phải (desktop) / Phía dưới (mobile): Khung điện thoại CSS + Demo chạy thật */}
        <div className="flex flex-col items-center lg:col-span-6">
          <div className="relative w-full max-w-[366px] sm:max-w-[384px] lg:max-w-[348px] xl:max-w-[356px]">
            <PhoneFrame scrollRef={phoneScrollRef} enableFloat lockedScroll={!isOpened}>
              <TemplatePreviewRenderer
                key={activeTemplate.id}
                templateId={activeTemplate.id}
                content={demoContent}
                mode="demo"
                contained
                viewport="phone"
                isOpened={isOpened}
                onOpenedChange={setIsOpened}
                externalMusicControl
              />
            </PhoneFrame>

            {/* Điều khiển nhạc & hướng dẫn ngay cạnh khung */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-1">
              <span className="text-xs text-lnd-muted">{copy.phoneHelperHint}</span>
              <MusicToggle
                src={activeTemplate.defaultMusic.src}
                title={activeTemplate.defaultMusic.title}
                resetKey={activeTemplate.id}
                compact
              />
            </div>

            {/* 4 chấm / nút đổi nhanh 4 mẫu đang chạy trong khung */}
            <div className="mt-4 rounded-2xl border border-lnd-border bg-lnd-surface p-3">
              <p className="text-[11px] font-medium tracking-[0.14em] text-lnd-muted uppercase">
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
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold",
                        isActive
                          ? "border-lnd-gold bg-lnd-gold-tint text-lnd-gold"
                          : "border-lnd-border bg-lnd-bg text-lnd-body hover:border-lnd-gold-soft hover:text-lnd-gold"
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

