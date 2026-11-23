"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, ChevronLeft, ChevronRight, Disc3, Eye, Music, X } from "lucide-react";
import { MobilePreviewFrame } from "@/components/MobilePreviewFrame";
import { SITE_LINKS } from "@/config/site";
import { getDemoTemplateData } from "@/content/demo";
import { getTemplateCollection, type TemplateCollectionItem } from "@/templates/registry";
import type { BaseTemplateId } from "@/templates/types";
import { cn } from "@/lib/utils";

const LANDING_AUTO_SCROLL_SPEED = 120; // 120 px/s chuẩn mượt mà

const getCircularOffset = (index: number, active: number, total: number) => {
  let diff = (index - active) % total;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
};

// Dynamic import của TemplatePreviewRenderer để tối ưu bundle và chỉ tải khi cần preview
const DynamicPreviewRenderer = dynamic(
  () =>
    import("@/templates/TemplatePreviewRenderer").then(
      (mod) => mod.TemplatePreviewRenderer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#FAF8F5]/80">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#B89B72] border-t-transparent" />
      </div>
    ),
  },
);

const CURATED_IDS: BaseTemplateId[] = [
  "yen-chi-mau-don",
  "long-phung",
  "bach-lan-lua-nga",
  "rang-hong-hoang-hon",
  "chu-sa-long-phung",
  "tu-dang-da-khuc",
  "hac-kim-nhat-thuc",
  "ban-sac-huong-cang",
  "vuonkinh-xanh",
  "bich-ngoc-hoang-trieu",
];

export function TemplateShowcase() {
  const allTemplates = React.useMemo(() => getTemplateCollection(), []);

  const templates = React.useMemo(() => {
    const map = new Map(allTemplates.map((t) => [t.id, t]));
    const list: TemplateCollectionItem[] = [];
    for (const id of CURATED_IDS) {
      const item = map.get(id);
      if (item) list.push(item);
    }
    // Fallback if not all IDs found
    if (list.length < 6) {
      for (const t of allTemplates) {
        if (!list.some((existing) => existing.id === t.id)) {
          list.push(t);
          if (list.length >= 8) break;
        }
      }
    }
    return list;
  }, [allTemplates]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [activePreviewId, setActivePreviewId] = React.useState<string | null>(null);
  const [previewOpened, setPreviewOpened] = React.useState(false);
  const [mobileModalItem, setMobileModalItem] = React.useState<TemplateCollectionItem | null>(null);
  const [isHoveredCenter, setIsHoveredCenter] = React.useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = React.useState(false);

  // Audio ref for card music playback
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const userWantsMusicRef = React.useRef(false);
  const centerScrollRef = React.useRef<HTMLDivElement | null>(null);
  const autoScrollRafRef = React.useRef<number | null>(null);

  const toggleMusic = React.useCallback(() => {
    const curMusic = templates[activeIndex]?.defaultMusic?.src;
    const audio = audioRef.current;
    if (!audio || !curMusic) return;

    if (isPlayingMusic) {
      userWantsMusicRef.current = false;
      audio.pause();
      setIsPlayingMusic(false);
    } else {
      userWantsMusicRef.current = true;
      audio.volume = 0.55;
      const fullUrl = new URL(curMusic, window.location.href).href;
      if (audio.src !== fullUrl) {
        audio.src = curMusic;
      }
      audio
        .play()
        .then(() => setIsPlayingMusic(true))
        .catch((err) => {
          console.warn("[TemplateShowcase] Play audio blocked:", err);
          setIsPlayingMusic(false);
        });
    }
  }, [activeIndex, isPlayingMusic, templates]);

  const switchCard = React.useCallback(
    (newIndex: number) => {
      if (centerScrollRef.current) {
        centerScrollRef.current.scrollTop = 0;
      }
      setActiveIndex(newIndex);
      const nextMusic = templates[newIndex]?.defaultMusic?.src;
      const audio = audioRef.current;

      if (userWantsMusicRef.current && audio && nextMusic) {
        audio.volume = 0.55;
        const fullUrl = new URL(nextMusic, window.location.href).href;
        if (audio.src !== fullUrl) {
          audio.src = nextMusic;
        }
        audio.play().catch((err) => {
          console.warn("[TemplateShowcase] Play audio on switch blocked:", err);
        });
      } else if (!nextMusic && audio) {
        audio.pause();
        setIsPlayingMusic(false);
      }
    },
    [templates],
  );

  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      } else if (!document.hidden && userWantsMusicRef.current && audioRef.current?.paused) {
        audioRef.current.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Touch tracking for swipe
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const touchStartTimeRef = React.useRef<number>(0);

  // Debounced auto-activation of Live Preview on center card after 800ms
  React.useEffect(() => {
    const currentItem = templates[activeIndex];
    if (!currentItem) return;

    setActivePreviewId(null);
    setPreviewOpened(false);

    const timer = setTimeout(() => {
      setActivePreviewId(currentItem.id);
      // Auto open card cover in preview after a tiny breath
      const openTimer = setTimeout(() => {
        setPreviewOpened(true);
      }, 350);
      return () => clearTimeout(openTimer);
    }, 800);

    return () => clearTimeout(timer);
  }, [activeIndex, templates]);

  // Auto-scroll inside active center card after preview opens (120px/s chuẩn mượt)
  React.useEffect(() => {
    if (!previewOpened || !activePreviewId) {
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
      return;
    }

    let isPaused = false;
    let rafId: number;
    let accumulator = 0;
    let attachedContainer: HTMLElement | null = null;

    const pauseScroll = () => {
      isPaused = true;
    };

    const attachListeners = (container: HTMLElement) => {
      if (attachedContainer === container) return;
      if (attachedContainer) {
        attachedContainer.removeEventListener("wheel", pauseScroll);
        attachedContainer.removeEventListener("touchstart", pauseScroll);
        attachedContainer.removeEventListener("mouseenter", pauseScroll);
      }
      attachedContainer = container;
      container.addEventListener("wheel", pauseScroll, { passive: true });
      container.addEventListener("touchstart", pauseScroll, { passive: true });
      container.addEventListener("mouseenter", pauseScroll);
    };

    const startTimer = setTimeout(() => {
      let lastTime = performance.now();
      const scrollLoop = (now: number) => {
        const container = centerScrollRef.current;
        if (container) {
          attachListeners(container);
          if (!isPaused) {
            const dt = (now - lastTime) / 1000;
            lastTime = now;
            const safeDelta = Math.min(dt, 0.1);
            accumulator += LANDING_AUTO_SCROLL_SPEED * safeDelta;
            const pixelsToScroll = Math.floor(accumulator);
            if (pixelsToScroll >= 1) {
              accumulator -= pixelsToScroll;
              const maxScroll = container.scrollHeight - container.clientHeight;
              if (container.scrollTop < maxScroll) {
                container.scrollTop += pixelsToScroll;
              }
            }
          } else {
            lastTime = now;
          }
        } else {
          lastTime = now;
        }

        rafId = requestAnimationFrame(scrollLoop);
        autoScrollRafRef.current = rafId;
      };

      rafId = requestAnimationFrame(scrollLoop);
      autoScrollRafRef.current = rafId;
    }, 600);

    return () => {
      clearTimeout(startTimer);
      if (rafId) cancelAnimationFrame(rafId);
      if (attachedContainer) {
        attachedContainer.removeEventListener("wheel", pauseScroll);
        attachedContainer.removeEventListener("touchstart", pauseScroll);
        attachedContainer.removeEventListener("mouseenter", pauseScroll);
      }
    };
  }, [previewOpened, activePreviewId]);

  const handlePrev = React.useCallback(() => {
    switchCard(activeIndex > 0 ? activeIndex - 1 : templates.length - 1);
  }, [activeIndex, switchCard, templates.length]);

  const handleNext = React.useCallback(() => {
    switchCard(activeIndex < templates.length - 1 ? activeIndex + 1 : 0);
  }, [activeIndex, switchCard, templates.length]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent, cardIndex: number) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    const deltaTime = Date.now() - touchStartTimeRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Horizontal swipe threshold
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
      return;
    }

    // Tap detected
    if (Math.abs(deltaX) < 15 && Math.abs(deltaY) < 15 && deltaTime < 400) {
      if (cardIndex === activeIndex) {
        // Tap center on mobile: open modal details
        setMobileModalItem(templates[cardIndex]);
      } else {
        switchCard(cardIndex);
      }
    }
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  return (
    <section
      id="mau-thiep"
      className="relative scroll-mt-14 overflow-hidden border-b border-[#E8E2D9] bg-[#FAF8F5] py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <header className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D9] bg-white/80 px-4 py-1.5 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B89B72]" aria-hidden="true" />
            <span className="text-[12px] font-medium tracking-wide text-[#7A1C24] sm:text-[13px]">
              Bộ sưu tập mẫu thiệp
            </span>
          </div>

          <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl">
            Tuyển tập thiệp cưới <span className="italic text-[#7A1C24]">đặc sắc</span>
          </h2>

          <p className="mt-3 text-base leading-relaxed text-[#6B655E]">
            Vuốt ngang để cảm nhận hiệu ứng chạm mở và chuyển động tinh tế của từng mẫu thiệp.
          </p>
        </header>

        {/* 3D Coverflow Stage */}
        <div className="relative mt-10 flex flex-col items-center justify-center">
          {/* Main 3D Container with wide horizontal reach */}
          <div
            className="relative flex h-[530px] w-full items-center justify-center sm:h-[610px] lg:h-[700px] overflow-hidden"
            style={{ perspective: "1000px" }}
          >
            {templates.map((template, idx) => {
              const offset = getCircularOffset(idx, activeIndex, templates.length);
              const isCenter = offset === 0;
              const isVisible = Math.abs(offset) <= 3;

              if (!isVisible) return null;

              // Coverflow 3D transforms with symmetrical distribution (-3, -2, -1, 0, +1, +2, +3)
              let transformStyle = "";
              let zIndex = 10;
              let opacity = 0;
              let filter = "none";
              let pointerEvents: "auto" | "none" = "auto";

              if (isCenter) {
                transformStyle = "translateX(0%) translateZ(0px) rotateY(0deg) scale(1)";
                zIndex = 40;
                opacity = 1;
                filter = "none";
              } else if (offset === -1) {
                transformStyle = "translateX(-82%) translateZ(-70px) rotateY(20deg) scale(0.86)";
                zIndex = 30;
                opacity = 0.78;
                filter = "none";
              } else if (offset === 1) {
                transformStyle = "translateX(82%) translateZ(-70px) rotateY(-20deg) scale(0.86)";
                zIndex = 30;
                opacity = 0.78;
                filter = "none";
              } else if (offset === -2) {
                transformStyle = "translateX(-155%) translateZ(-140px) rotateY(32deg) scale(0.74)";
                zIndex = 20;
                opacity = 0.48;
                filter = "blur(0.5px)";
              } else if (offset === 2) {
                transformStyle = "translateX(155%) translateZ(-140px) rotateY(-32deg) scale(0.74)";
                zIndex = 20;
                opacity = 0.48;
                filter = "blur(0.5px)";
              } else if (offset === -3) {
                transformStyle = "translateX(-225%) translateZ(-210px) rotateY(42deg) scale(0.62)";
                zIndex = 10;
                opacity = 0.22;
                filter = "blur(1px)";
              } else if (offset === 3) {
                transformStyle = "translateX(225%) translateZ(-210px) rotateY(-42deg) scale(0.62)";
                zIndex = 10;
                opacity = 0.22;
                filter = "blur(1px)";
              } else {
                pointerEvents = "none";
              }

              const isLivePreviewActive = isCenter && activePreviewId === template.id;
              const createUrl = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(
                template.id,
              )}`;
              const demoUrl = template.demoUrl || `/mau/${template.id}`;

              return (
                <div
                  key={template.id}
                  onClick={() => {
                    if (!isCenter) {
                      switchCard(idx);
                    }
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={(e) => handleTouchEnd(e, idx)}
                  onMouseEnter={() => {
                    if (isCenter) setIsHoveredCenter(true);
                  }}
                  onMouseLeave={() => {
                    if (isCenter) setIsHoveredCenter(false);
                  }}
                  style={{
                    transform: transformStyle,
                    zIndex,
                    opacity,
                    filter,
                    pointerEvents,
                    transition:
                      "transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 450ms ease, filter 450ms ease",
                  }}
                  className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
                    "w-[270px] h-[500px] sm:w-[310px] sm:h-[580px] lg:w-[340px] lg:h-[660px]",
                    "cursor-pointer select-none rounded-[24px] sm:rounded-[28px] p-0 border-0 bg-transparent",
                    "transition-shadow duration-300",
                    isCenter
                      ? "shadow-[0_24px_60px_-15px_rgba(0,0,0,0.38)] ring-1 ring-black/10"
                      : "shadow-[0_16px_36px_-10px_rgba(0,0,0,0.22)] hover:opacity-85",
                  )}
                >
                  {/* Inner Card Screen Area */}
                  <div className="relative h-full w-full overflow-hidden rounded-[24px] sm:rounded-[28px] bg-[#1F1D1A]">
                    {/* Fallback Static Cover (displayed while swiping or for side cards) */}
                    {(!isLivePreviewActive || !isCenter) && (
                      <img
                        src={template.previewImage}
                        alt={template.name}
                        loading={isCenter ? "eager" : "lazy"}
                        decoding="async"
                        className="h-full w-full object-cover object-center"
                      />
                    )}

                    {/* Live Preview Container (mounted only for active center card after 800ms) with Mobile Viewport Isolation & smooth Auto-Scroll */}
                    {isLivePreviewActive && (
                      <div className="relative h-full w-full overflow-hidden">
                        <MobilePreviewFrame
                          scrollRef={centerScrollRef}
                          lockedScroll={!previewOpened}
                          targetWidth={375}
                        >
                          <DynamicPreviewRenderer
                            templateId={template.id}
                            data={getDemoTemplateData(template.id)}
                            mode="demo"
                            contained
                            viewport="phone"
                            isOpened={previewOpened}
                            onOpenedChange={setPreviewOpened}
                            externalMusicControl
                          />
                        </MobilePreviewFrame>
                      </div>
                    )}

                    {/* Working Music Toggle on Active Card */}
                    {isCenter && template.defaultMusic?.src && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMusic();
                        }}
                        aria-label={isPlayingMusic ? "Tắt nhạc nền mẫu thiệp" : "Bật nhạc nền mẫu thiệp"}
                        className={cn(
                          "absolute top-3.5 left-3.5 z-40 flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-medium backdrop-blur-md transition-all duration-300 cursor-pointer shadow-md",
                          isPlayingMusic
                            ? "border border-[#B89B72] bg-[#1F1D1A]/90 text-[#F2DBA8]"
                            : "border border-white/20 bg-black/50 text-white/90 hover:bg-black/75 hover:border-white/40",
                        )}
                      >
                        <Disc3
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-[#B89B72]",
                            isPlayingMusic && "animate-spin [animation-duration:3s]",
                          )}
                        />
                        <span className="text-[10px] tracking-wide">
                          {isPlayingMusic ? "Đang phát nhạc" : "Bật nhạc"}
                        </span>
                      </button>
                    )}

                    {/* Plan Badge (Pill in corner) */}
                    {template.plan !== "free" && (
                      <div className="pointer-events-none absolute top-3.5 right-3.5 z-30 rounded-full bg-[#1F1D1A]/85 px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-[#B89B72] uppercase backdrop-blur-xs">
                        {template.plan.toUpperCase()}
                      </div>
                    )}

                    {/* Desktop Hover Overlay (Center Card Only) */}
                    {isCenter && (
                      <div
                        className={cn(
                          "pointer-events-none absolute inset-x-0 bottom-0 z-40 hidden flex-col justify-end bg-gradient-to-t from-[#0F0E0D]/95 via-[#0F0E0D]/75 to-transparent p-5 text-white transition-opacity duration-300 lg:flex",
                          isHoveredCenter ? "opacity-100 pointer-events-auto" : "opacity-0",
                        )}
                      >
                        <h3 className="font-serif text-lg font-medium text-white">
                          {template.name}
                        </h3>
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#D4CDC5]">
                          {template.subtitle || (template.styleTags && template.styleTags.join(" · ")) || "Thiệp cưới phong cách"}
                        </p>

                        <div className="mt-3.5 flex items-center gap-2">
                          <Link
                            href={demoUrl}
                            className="inline-flex flex-1 h-8 items-center justify-center gap-1.5 rounded-full border border-white/30 bg-white/20 px-3 text-xs font-medium text-white backdrop-blur-xs transition-colors hover:bg-white hover:text-[#1F1D1A]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Xem thử</span>
                          </Link>

                          <Link
                            href={createUrl}
                            className="inline-flex flex-1 h-8 items-center justify-center rounded-full bg-[#7A1C24] px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#5E141B]"
                          >
                            <span>Dùng mẫu</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls (Desktop Buttons & Pagination Dots) */}
          <div className="mt-8 flex w-full max-w-[380px] items-center justify-between gap-4 px-2">
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Mẫu trước"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#E8E2D9] bg-white text-[#1F1D1A] shadow-2xs transition-all hover:border-[#B89B72] hover:bg-[#F4EFEA] active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Pagination Dots */}
            <div className="flex items-center gap-1.5">
              {templates.map((tpl, i) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => switchCard(i)}
                  aria-label={`Chuyển tới mẫu ${tpl.name}`}
                  className={cn(
                    "cursor-pointer rounded-full transition-all duration-300",
                    i === activeIndex
                      ? "h-2 w-6 bg-[#7A1C24]"
                      : "h-2 w-2 bg-[#E8E2D9] hover:bg-[#B89B72]",
                  )}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="Mẫu tiếp theo"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#E8E2D9] bg-white text-[#1F1D1A] shadow-2xs transition-all hover:border-[#B89B72] hover:bg-[#F4EFEA] active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-[#6B655E] lg:hidden">
            Chạm vào thiệp để xem thông tin chi tiết
          </p>
        </div>

        {/* Footer CTA */}
        <div className="mt-14 text-center">
          <Link
            href={SITE_LINKS.templates}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#E8E2D9] bg-white px-8 text-sm font-medium text-[#1F1D1A] shadow-2xs transition-all hover:border-[#7A1C24] hover:bg-[#F4EFEA] hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
          >
            <span>Khám phá toàn bộ mẫu thiệp</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Audio element for Coverflow preview */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        onPlay={() => setIsPlayingMusic(true)}
        onPause={() => setIsPlayingMusic(false)}
      />

      {/* Mobile Template Details Sheet/Modal */}
      {mobileModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:items-center sm:p-4"
          onClick={() => setMobileModalItem(null)}
        >
          <div
            className="w-full max-w-md rounded-t-3xl border border-[#E8E2D9] bg-white p-6 shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-2.5 py-0.5 text-[10px] font-semibold text-[#7A1C24] uppercase">
                  {mobileModalItem.plan.toUpperCase()}
                </div>
                <h3 className="mt-2 font-serif text-2xl font-normal text-[#1F1D1A]">
                  {mobileModalItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMobileModalItem(null)}
                className="rounded-full p-1.5 text-[#6B655E] hover:bg-[#FAF8F5] hover:text-[#1F1D1A]"
                aria-label="Đóng"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-[#6B655E]">
              {mobileModalItem.subtitle || "Mẫu thiệp cưới tinh tế với màu sắc trang nhã, hiệu ứng chạm mở mượt mà và tối ưu trên mọi màn hình di động."}
            </p>

            {mobileModalItem.styleTags && mobileModalItem.styleTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {mobileModalItem.styleTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-2.5 py-0.5 text-[11px] text-[#6B655E]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <Link
                href={mobileModalItem.demoUrl || `/mau/${mobileModalItem.id}`}
                className="flex-1 inline-flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white text-xs font-semibold text-[#1F1D1A] transition-colors hover:bg-[#FAF8F5]"
              >
                <Eye className="h-4 w-4" />
                <span>Xem thử đầy đủ</span>
              </Link>

              <Link
                href={`${SITE_LINKS.createWedding}?template=${encodeURIComponent(mobileModalItem.id)}`}
                className="flex-1 inline-flex h-11 items-center justify-center rounded-full bg-[#7A1C24] text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#5E141B]"
              >
                <span>Dùng mẫu này</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
