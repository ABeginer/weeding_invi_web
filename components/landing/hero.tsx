"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { MusicToggle } from "@/components/demo/music-toggle";
import { LANDING_COPY } from "@/config/landing";
import { SITE_CONFIG, SITE_LINKS } from "@/config/site";
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

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-start gap-7 px-4 pt-4 pb-8 sm:px-6 md:grid-cols-12 md:gap-8 md:pt-5 md:pb-8 lg:gap-10 lg:pt-6">
        {/* Cột trái (desktop/tablet) / Phía trên (mobile) */}
        <div className="space-y-4 text-center md:col-span-7 md:pt-1 md:text-left">
          <div className="inline-flex items-center rounded-full border border-border bg-surface px-3.5 py-1">
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

            <button
              type="button"
              onClick={handleScrollToTemplates}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-text bg-transparent px-5 text-xs font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:h-11 sm:text-sm"
            >
              <span>{copy.secondaryCta}</span>
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Desktop Hero Panel: Hiển thị trên desktop (>= 1024px), ẩn trên mobile & tablet */}
          {SITE_CONFIG.showDashboardPreview && (
            <div className="hidden lg:block pt-3 text-left">
              <div className="rounded-2xl border border-[color-mix(in_srgb,var(--accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--surface-card)_92%,transparent)] p-4 shadow-sm backdrop-blur-[8px]">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-accent-text uppercase">
                    Bảng điều khiển của bạn
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    Quản lý khách mời, lời chúc và quà mừng trong một nơi.
                  </p>
                </div>

                {/* 3 feature tiles in a row */}
                <div className="mt-3 grid grid-cols-3 gap-2.5">
                  <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-surface/80 p-2.5">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display text-xs font-semibold leading-snug text-text">
                          Link riêng cho từng khách
                        </span>
                        <span className="shrink-0 rounded-full border border-sage bg-surface px-1.5 py-0.2 text-[9px] font-medium text-text">
                          Miễn phí
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                        Mỗi khách nhận một link, không cần tài khoản.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-surface/80 p-2.5">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display text-xs font-semibold leading-snug text-text">
                          Xác nhận theo thời gian thực
                        </span>
                        <span className="shrink-0 rounded-full border border-sage bg-surface px-1.5 py-0.2 text-[9px] font-medium text-text">
                          Miễn phí
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                        Xem số người đi, ăn chay hoặc mặn, bài hát yêu cầu.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-border/80 bg-surface/80 p-2.5">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-display text-xs font-semibold leading-snug text-text">
                          Sổ mừng và nhiều buổi lễ
                        </span>
                        <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.2 text-[9px] font-semibold text-accent-fg">
                          Pro
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                        Ghi nhận quà mừng, đánh dấu đã cảm ơn, gán buổi lễ cho từng khách.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mini dashboard mock (pure HTML/CSS) */}
                <div className="mt-3 rounded-xl border border-border/80 bg-surface/90 p-3">
                  <div className="flex items-center justify-between border-b border-border/70 pb-2">
                    <div className="flex items-center gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-text">42</span>{" "}
                        <span className="text-[11px] text-text-muted">Đã xác nhận</span>
                      </div>
                      <span aria-hidden="true" className="text-border">·</span>
                      <div>
                        <span className="font-semibold text-text">3</span>{" "}
                        <span className="text-[11px] text-text-muted">Từ chối</span>
                      </div>
                      <span aria-hidden="true" className="text-border">·</span>
                      <div>
                        <span className="font-semibold text-text">15</span>{" "}
                        <span className="text-[11px] text-text-muted">Chờ phản hồi</span>
                      </div>
                    </div>
                    <span className="rounded-full border border-border bg-surface-alt px-2 py-0.5 text-[10px] text-text-muted">
                      Dữ liệu mẫu
                    </span>
                  </div>

                  <div className="mt-2 divide-y divide-border/50 text-xs">
                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        <span className="font-medium text-text">Bạn Thanh Mai</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-text-muted">
                        <span>2 người · Mặn</span>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700">Đã xác nhận</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                        <span className="font-medium text-text">Anh Minh Khôi</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-text-muted">
                        <span>1 người · Chay</span>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700">Đã xác nhận</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span className="font-medium text-text">Chị Ngọc Anh</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-text-muted">
                        <span>Chưa phản hồi</span>
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700">Chờ phản hồi</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA row: Xem bảng giá (outline, anchor #bang-gia) */}
                <div className="mt-3 flex items-center justify-end">
                  <Link
                    href="/#bang-gia"
                    className="inline-flex h-8 items-center justify-center rounded-full border border-border bg-surface px-3.5 text-xs font-medium text-text transition-colors hover:border-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    Xem bảng giá
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cột phải (desktop/tablet) / Phía dưới (mobile): Khung điện thoại CSS + Demo chạy thật */}
        <div className="flex flex-col items-center md:col-span-5 md:items-end">
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
          </div>
        </div>
      </div>
    </section>
  );
}
