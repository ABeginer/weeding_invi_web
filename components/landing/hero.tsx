"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ChevronUp } from "lucide-react";
import { MusicToggle } from "@/components/demo/music-toggle";
import { SITE_LINKS } from "@/config/site";
import { getDemoTemplateData } from "@/content/demo";
import { HERO_PREVIEW_TEMPLATES } from "@/templates/registry";
import { MobilePreviewFrame } from "@/components/MobilePreviewFrame";
import { PhoneFrame } from "./phone-frame";

function areIframeStylesReady(rootEl: HTMLElement | null): boolean {
  const doc = rootEl?.ownerDocument;
  if (!doc?.head) return false;
  const links = doc.head.querySelectorAll<HTMLLinkElement>("link[rel='stylesheet']");
  if (links.length === 0) {
    return doc.head.querySelectorAll("style").length > 0;
  }
  for (const link of links) {
    if (!link.sheet) return false;
  }
  return true;
}

const DynamicHeroTemplateRenderer = dynamic(
  () =>
    import("@/templates/TemplatePreviewRenderer").then(
      (mod) => mod.TemplatePreviewRenderer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

export function HeroSection() {
  const [isOpened, setIsOpened] = React.useState(false);
  const [isPhoneInView, setIsPhoneInView] = React.useState(false);
  const [isHeroLive, setIsHeroLive] = React.useState(false);
  const [isHeroReady, setIsHeroReady] = React.useState(false);
  const [hasScrolledPhone, setHasScrolledPhone] = React.useState(false);
  const [swipeHintDismissed, setSwipeHintDismissed] = React.useState(false);
  const heroPhoneWrapRef = React.useRef<HTMLDivElement | null>(null);
  const phoneScrollRef = React.useRef<HTMLDivElement | null>(null);

  // Chỉ kích hoạt chuẩn bị Hero Live iframe khi khung điện thoại vào vùng nhìn thấy (+120px) để bảo vệ LCP trên Mobile
  React.useEffect(() => {
    const el = heroPhoneWrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => setIsPhoneInView(true));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsPhoneInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px 0px", threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Trì hoãn nạp iframe + template Hero tới khi trình duyệt rảnh trên Desktop (Mobile dùng facade ảnh tĩnh, chỉ nạp khi khách chạm)
  React.useEffect(() => {
    if (
      isHeroLive ||
      !isPhoneInView ||
      typeof window === "undefined" ||
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      return;
    }
    let idleId: number | null = null;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(
        () => {
          setIsHeroLive(true);
        },
        { timeout: 1000 },
      );
    } else {
      timerId = setTimeout(() => {
        setIsHeroLive(true);
      }, 700);
    }

    return () => {
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== null) {
        clearTimeout(timerId);
      }
    };
  }, [isHeroLive, isPhoneInView]);

  // Chờ iframe Hero mount xong DOM thật + CSS rồi mới crossfade ảnh tĩnh cover-sm.webp (0 nháy spinner)
  React.useEffect(() => {
    if (!isHeroLive || isHeroReady) return;

    let cancelled = false;
    let pollCount = 0;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const checkReady = () => {
      if (cancelled) return;
      const root = phoneScrollRef.current;
      const isLoadingFallback = Boolean(root?.querySelector("[data-template-loading='true']"));
      const hasLiveDom =
        !isLoadingFallback &&
        Boolean(root?.querySelector("[data-template-id], button, [role='button'], img, section, canvas"));
      const stylesReady = hasLiveDom && areIframeStylesReady(root);

      if (stylesReady) {
        setIsHeroReady(true);
        return;
      }

      pollCount += 1;
      if (pollCount < 60) {
        pollTimer = setTimeout(checkReady, 120);
      } else {
        setIsHeroReady(true);
      }
    };

    pollTimer = setTimeout(checkReady, 120);

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [isHeroLive, isHeroReady]);

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
    HERO_PREVIEW_TEMPLATES.find((tpl) => tpl.id === "ho-phach-mat-thu") ??
    HERO_PREVIEW_TEMPLATES[0];
  const demoData = React.useMemo(
    () => getDemoTemplateData(activeTemplate.id),
    [activeTemplate.id],
  );

  const createHref = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(
    activeTemplate.id,
  )}`;

  return (
    <section className="relative overflow-hidden border-b-0 border-[#E8E2D9] bg-[#FAF8F5] pt-6 pb-4 sm:pt-10 sm:pb-6 lg:border-b lg:py-24">
      {/* Decorative ambient gradient (gộp vào backgroundImage cố định trên lớp nền để 0 CLS) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(320px circle at 50% 220px, rgba(184,155,114,0.16) 0%, rgba(184,155,114,0) 68%), radial-gradient(240px circle at calc(100% - 144px) 280px, rgba(122,28,36,0.08) 0%, rgba(122,28,36,0) 68%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Editorial Copy */}
          <div className="space-y-4 text-center sm:space-y-5 lg:col-span-7 lg:space-y-6 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D9] bg-white/95 px-4 py-1.5 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B89B72]" aria-hidden="true" />
              <span className="text-[12px] font-medium tracking-wide text-[#7A1C24] sm:text-[13px]">
                Nền tảng thiệp cưới điện tử tinh tế
              </span>
            </div>

            <h1 className="font-serif text-[2rem] leading-[1.12] font-normal tracking-tight text-[#1F1D1A] sm:text-5xl lg:text-[3.5rem]">
              Thiệp cưới Online <span className="font-serif italic font-normal text-[#7A1C24]">tinh tế</span> -{" "}
              Chạm đúng <span className="font-serif italic font-normal text-[#8A6838]">lễ nghĩa</span>
            </h1>

            <p className="mx-auto max-w-xl text-sm leading-relaxed text-[#6B655E] sm:text-base lg:mx-0 lg:text-lg">
              Tạo thiệp trong 5 phút, tự động xưng hô đúng vai vế gia đình, hiển thị tên riêng từng khách ngay khi gửi qua Zalo và theo dõi phản hồi tham dự tức thì.
            </p>

            {/* CTAs */}
            <div className="flex flex-col items-stretch justify-center gap-3 pt-2 sm:flex-row sm:items-center lg:justify-start">
              <Link
                href={createHref}
                className="mx-auto inline-flex h-12 w-full max-w-[300px] items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-8 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#5E141B] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5] lg:mx-0 lg:w-auto lg:max-w-none"
              >
                <span>Tạo thiệp miễn phí</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <Link
                href={SITE_LINKS.templates}
                className="hidden h-12 items-center justify-center gap-2 rounded-full border border-[#E8E2D9] bg-white px-7 text-sm font-medium text-[#1F1D1A] transition-colors hover:bg-[#F4EFEA] hover:border-[#B89B72]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24] lg:inline-flex"
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

          {/* Right Column: Phone Frame (Desktop >= lg; trên Mobile hiển thị trực tiếp Coverflow ngay bên dưới) */}
          <div className="relative hidden flex-col items-center lg:col-span-5 lg:flex lg:items-end">
            <div className="relative flex w-full max-w-[340px] flex-col items-center sm:max-w-[360px]">
              {/* Interactive Phone Frame */}
              <div
                ref={heroPhoneWrapRef}
                className="relative w-full"
                onPointerDown={() => setIsHeroLive(true)}
                onClick={() => setIsHeroLive(true)}
              >
                <PhoneFrame
                  enableFloat
                  lockedScroll={true}
                  desktopOffsetPx={60}
                >
                  <div className="relative h-full w-full overflow-hidden">
                    <picture className="pointer-events-none absolute inset-0 z-20 block h-full w-full">
                      <source
                        media="(min-width: 1024px)"
                        srcSet="/templates/ho-phach-mat-thu/cover-sm.webp"
                      />
                      <img
                        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                        alt={activeTemplate.name}
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
                        className={`h-full w-full object-cover object-center transition-opacity duration-200 ${
                          isHeroLive && isHeroReady ? "pointer-events-none opacity-0" : "opacity-100"
                        }`}
                      />
                    </picture>
                    {isHeroLive && (
                      <div className="absolute inset-0 z-10 h-full w-full">
                        <MobilePreviewFrame
                          scrollRef={phoneScrollRef}
                          lockedScroll={!isOpened}
                        >
                          <DynamicHeroTemplateRenderer
                            key={activeTemplate.id}
                            templateId={activeTemplate.id}
                            data={demoData}
                            mode="demo"
                            contained
                            viewport="phone"
                            isOpened={isOpened}
                            onOpenedChange={setIsOpened}
                            scrollContainerRef={phoneScrollRef}
                            enableAutoScroll={true}
                            externalMusicControl
                            disableAudio={true}
                          />
                        </MobilePreviewFrame>
                      </div>
                    )}
                  </div>
                </PhoneFrame>

                {/* Pre-open Touch Ripple & Hint */}
                {!isOpened && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-12 left-1/2 z-40 -translate-x-1/2 transition-opacity duration-300"
                  >
                    <div className="flex items-center gap-1.5 rounded-full border border-[#B89B72]/50 bg-white/95 px-3 py-1 text-[11px] font-medium tracking-wide text-[#7A1C24] shadow-md">
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
                    <div
                      style={{ transform: "translateZ(0)", backfaceVisibility: "hidden" }}
                      className="flex items-center gap-1.5 rounded-full border border-[#E8E2D9]/80 bg-[#1F1D1A] px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-[#FAF8F5] shadow-xl animate-luxury-swipe-up"
                    >
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
