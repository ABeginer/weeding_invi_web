"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronUp } from "lucide-react";
import { MusicToggle } from "@/components/demo/music-toggle";
import { SITE_LINKS } from "@/config/site";
import { getDemoTemplateData } from "@/content/demo";
import { HERO_PREVIEW_TEMPLATES } from "@/templates/registry";
import { TemplatePreviewRenderer } from "@/templates/TemplatePreviewRenderer";
import { MobilePreviewFrame } from "@/components/MobilePreviewFrame";
import { PhoneFrame } from "./phone-frame";

export function HeroSection() {
  const [isOpened, setIsOpened] = React.useState(false);
  const [hasScrolledPhone, setHasScrolledPhone] = React.useState(false);
  const [swipeHintDismissed, setSwipeHintDismissed] = React.useState(false);
  const phoneScrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = phoneScrollRef.current;
    if (!el || !isOpened) return;

    const handleScroll = () => {
      if (el.scrollTop > 12) {
        setHasScrolledPhone(true);
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", handleScroll);
    };
  }, [isOpened]);

  React.useEffect(() => {
    if (!isOpened || hasScrolledPhone) return;
    const timer = setTimeout(() => {
      setSwipeHintDismissed(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [isOpened, hasScrolledPhone]);

  const activeTemplate =
    HERO_PREVIEW_TEMPLATES.find((tpl) => tpl.id === "long-phung") ??
    HERO_PREVIEW_TEMPLATES[0];
  const demoData = React.useMemo(
    () => getDemoTemplateData(activeTemplate.id),
    [activeTemplate.id],
  );

  const createHref = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(
    activeTemplate.id,
  )}`;

  return (
    <section className="relative overflow-hidden border-b border-[#E8E2D9] bg-[#FAF8F5] py-14 sm:py-20 lg:py-24">
      {/* Decorative ambient gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[520px] w-[520px] rounded-full bg-[#B89B72]/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 h-[380px] w-[380px] rounded-full bg-[#7A1C24]/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Editorial Copy */}
          <div className="space-y-6 text-center lg:col-span-7 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D9] bg-white/80 px-4 py-1.5 shadow-2xs backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B89B72]" aria-hidden="true" />
              <span className="text-[12px] font-medium tracking-wide text-[#7A1C24] sm:text-[13px]">
                Nền tảng thiệp cưới điện tử tinh tế
              </span>
            </div>

            <h1 className="font-serif text-4xl leading-[1.12] font-normal tracking-tight text-[#1F1D1A] sm:text-5xl lg:text-[3.5rem]">
              Thiệp cưới Online <span className="font-serif italic font-normal text-[#7A1C24]">tinh tế</span> -{" "}
              Chạm đúng <span className="font-serif italic font-normal text-[#B89B72]">lễ nghĩa</span>
            </h1>

            <p className="mx-auto max-w-xl text-base leading-relaxed text-[#6B655E] sm:text-lg lg:mx-0">
              Tạo thiệp trong 5 phút, tự động xưng hô đúng vai vế gia đình, hiển thị tên riêng từng khách ngay khi gửi qua Zalo và theo dõi phản hồi tham dự tức thì.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row sm:items-center lg:justify-start">
              <Link
                href={createHref}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#5E141B] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5]"
              >
                <span>Tạo thiệp miễn phí</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                href={SITE_LINKS.templates}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#E8E2D9] bg-white px-7 text-sm font-medium text-[#1F1D1A] transition-colors hover:bg-[#F4EFEA] hover:border-[#B89B72]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
              >
                <span>Xem bộ sưu tập mẫu</span>
              </Link>
            </div>

            {/* Trust Micro-copy */}
            <div className="pt-2">
              <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#6B655E] lg:justify-start">
                <span>Miễn phí tạo & sửa</span>
                <span className="text-[#B89B72]" aria-hidden="true">·</span>
                <span>Không giới hạn lượt xem</span>
                <span className="text-[#B89B72]" aria-hidden="true">·</span>
                <span>Tối ưu hiển thị Zalo</span>
              </p>
            </div>
          </div>

          {/* Right Column: Phone Frame */}
          <div className="relative flex flex-col items-center lg:col-span-5 lg:items-end">
            <div className="relative flex w-full max-w-[340px] flex-col items-center sm:max-w-[360px]">
              {/* Interactive Phone Frame */}
              <div className="relative w-full">
                <PhoneFrame
                  enableFloat
                  lockedScroll={true}
                  desktopOffsetPx={60}
                >
                  <MobilePreviewFrame
                    scrollRef={phoneScrollRef}
                    lockedScroll={!isOpened}
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
                  </MobilePreviewFrame>
                </PhoneFrame>

                {/* Pre-open Touch Ripple & Hint */}
                {!isOpened && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-12 left-1/2 z-40 -translate-x-1/2 transition-opacity duration-300"
                  >
                    <div className="flex items-center gap-1.5 rounded-full border border-[#B89B72]/50 bg-white/95 px-3 py-1 text-[11px] font-medium tracking-wide text-[#7A1C24] shadow-md backdrop-blur-xs">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-[#B89B72] opacity-75 animate-ping" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#B89B72]" />
                      </span>
                      <span>Chạm mở phong bì</span>
                    </div>
                  </div>
                )}

                {/* Post-open Swipe-up Indicator */}
                {isOpened && !hasScrolledPhone && !swipeHintDismissed && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-8 left-1/2 z-40 -translate-x-1/2 transition-opacity duration-500"
                  >
                    <div className="flex items-center gap-1.5 rounded-full border border-[#E8E2D9]/80 bg-[#1F1D1A]/95 px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-[#FAF8F5] shadow-xl backdrop-blur-sm animate-luxury-swipe-up">
                      <ChevronUp className="h-3.5 w-3.5 text-[#B89B72]" />
                      <span>Cuộn ngay trong khung để xem thiệp</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Phone Controls & Audio */}
              <div className="mt-6 flex w-full flex-wrap items-center justify-between gap-2 px-1">
                <span className="text-[11px] text-[#6B655E]">
                  Chạm vào phong bì để trải nghiệm thiệp
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
      </div>
    </section>
  );
}
