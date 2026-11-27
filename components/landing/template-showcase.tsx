"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, ChevronLeft, ChevronRight, Disc3, Eye, X } from "lucide-react";
import { MobilePreviewFrame } from "@/components/MobilePreviewFrame";
import { getPlanLabel } from "@/config/plans";
import { SITE_LINKS } from "@/config/site";
import { getDemoTemplateData } from "@/content/demo";
import { getTemplateCollection, type TemplateCollectionItem } from "@/templates/registry";
import type { BaseTemplateId } from "@/templates/types";
import { cn, getCoverImageResponsive } from "@/lib/utils";
import { markDemoReturnOrigin } from "@/lib/demo-return";
import { globalAudio } from "@/lib/global-audio";

const LANDING_AUTO_SCROLL_SPEED = 120; // 120 px/s chuẩn mượt mà

function resolveActiveScrollContainer(rootEl: HTMLElement | null): HTMLElement | null {
  if (!rootEl) return null;
  if (rootEl.scrollHeight > rootEl.clientHeight + 20) {
    return rootEl;
  }
  const nestedCandidates = rootEl.querySelectorAll<HTMLElement>("div, main, section");
  let bestNested: HTMLElement | null = null;
  let bestOverflow = 20;
  for (const el of nestedCandidates) {
    if (el.scrollHeight <= el.clientHeight + bestOverflow) continue;
    const style = (el.ownerDocument.defaultView ?? window).getComputedStyle(el);
    if (!/(auto|scroll|overlay)/.test(style.overflowY)) continue;
    const overflow = el.scrollHeight - el.clientHeight;
    if (overflow > bestOverflow) {
      bestOverflow = overflow;
      bestNested = el;
    }
  }
  return bestNested ?? rootEl;
}

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

function findCoverOpenButton(rootEl: HTMLElement | null): HTMLElement | null {
  if (!rootEl) return null;
  const candidates = rootEl.querySelectorAll<HTMLElement>("button, [role='button']");
  let firstVisible: HTMLElement | null = null;

  for (const el of candidates) {
    if ((el as HTMLButtonElement).disabled) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const style = (el.ownerDocument.defaultView ?? window).getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") {
      continue;
    }
    const label = `${el.getAttribute("aria-label") ?? ""} ${el.textContent ?? ""}`.trim();
    if (/nhạc|tạm dừng|phát cuộn|đóng|lightbox/i.test(label)) continue;
    if (!firstVisible) firstVisible = el;
    if (/mở|chạm|bóc|xé|kéo|thiệp|khám phá/i.test(label) || el.closest("[data-cover-open]") || rect.height >= 28) {
      return el;
    }
  }
  return firstVisible;
}

const getCircularOffset = (index: number, active: number, total: number) => {
  let diff = (index - active) % total;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
};

// Dynamic import của TemplatePreviewRenderer để tối ưu bundle và chỉ tải khi cần preview
// Loading trả về null để giữ nguyên lớp ảnh cover.webp bên dưới (không nháy spinner trắng)
const DynamicPreviewRenderer = dynamic(
  () =>
    import("@/templates/TemplatePreviewRenderer").then(
      (mod) => mod.TemplatePreviewRenderer,
    ),
  {
    ssr: false,
    loading: () => null,
  },
);

// 10 mẫu tuyển chọn cho Coverflow: 7 Standard (70%) xếp đầu → 3 Free (30%) xếp sau
const CURATED_IDS: BaseTemplateId[] = [
  "nhat-ky-mua-yeu",
  "ban-sac-huong-cang",
  "hac-vu-luu-ly",
  "ho-phach-mat-thu",
  "sen-ngoc-tram-nam",
  "mot-thoi-de-nho",
  "cuu-long-hy-yen",
  "yen-chi-mau-don",
  "chu-sa-long-phung",
  "long-phung",
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
  const [isLiveReady, setIsLiveReady] = React.useState(false);
  const [previewOpened, setPreviewOpened] = React.useState(false);
  const [isMobileViewport, setIsMobileViewport] = React.useState(false);
  const [isHoveredCenter, setIsHoveredCenter] = React.useState(false);
  const [isMobileActionModalOpen, setIsMobileActionModalOpen] = React.useState(false);
  const previewOpenedRef = React.useRef(false);
  React.useEffect(() => {
    previewOpenedRef.current = previewOpened;
  }, [previewOpened]);
  const isHoveredCenterRef = React.useRef(false);
  React.useEffect(() => {
    isHoveredCenterRef.current = isHoveredCenter;
  }, [isHoveredCenter]);
  const isMobileActionModalOpenRef = React.useRef(false);
  React.useEffect(() => {
    isMobileActionModalOpenRef.current = isMobileActionModalOpen;
  }, [isMobileActionModalOpen]);
  const isLiveReadyRef = React.useRef(false);
  React.useEffect(() => {
    isLiveReadyRef.current = isLiveReady;
  }, [isLiveReady]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 639px)");
    const syncMobile = () => setIsMobileViewport(mq.matches);
    syncMobile();
    mq.addEventListener("change", syncMobile);
    return () => mq.removeEventListener("change", syncMobile);
  }, []);

  const sectionRef = React.useRef<HTMLElement | null>(null);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const [isSectionVisible, setIsSectionVisible] = React.useState(false);
  const [hasNearViewport, setHasNearViewport] = React.useState(false);
  const isSectionVisibleRef = React.useRef(false);
  React.useEffect(() => {
    isSectionVisibleRef.current = isSectionVisible;
  }, [isSectionVisible]);

  React.useEffect(() => {
    const sectionEl = sectionRef.current;
    const stageEl = stageRef.current;
    if (!sectionEl || !stageEl || typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => {
        setIsSectionVisible(true);
        setHasNearViewport(true);
      });
      return;
    }

    const nearObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasNearViewport(true);
          nearObserver.disconnect();
        }
      },
      { rootMargin: "120px 0px", threshold: 0.05 },
    );

    const stageObserver = new IntersectionObserver(
      (entries) => {
        setIsSectionVisible(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin: "0px", threshold: 0.15 },
    );

    nearObserver.observe(sectionEl);
    stageObserver.observe(stageEl);
    return () => {
      nearObserver.disconnect();
      stageObserver.disconnect();
    };
  }, []);

  const [isPlayingMusic, setIsPlayingMusic] = React.useState(false);

  // User state for music preference
  const userWantsMusicRef = React.useRef(false);
  const centerScrollRef = React.useRef<HTMLDivElement | null>(null);
  const autoScrollRafRef = React.useRef<number | null>(null);
  const stopAutoScrollLoopRef = React.useRef<(() => void) | null>(null);
  const resumeAutoScrollLoopRef = React.useRef<(() => void) | null>(null);

  // Đồng bộ trạng thái nhạc từ Global Audio Controller
  React.useEffect(() => {
    return globalAudio.subscribe((state) => {
      const curMusic = templates[activeIndex]?.defaultMusic?.src;
      if (!curMusic) {
        setIsPlayingMusic(false);
        return;
      }
      const fullTargetUrl = typeof window !== "undefined" ? new URL(curMusic, window.location.href).href : curMusic;
      const isCur = state.src === curMusic || state.src === fullTargetUrl || globalAudio.getAudioElement()?.src === fullTargetUrl;
      setIsPlayingMusic(state.isPlaying && isCur);
    });
  }, [activeIndex, templates]);

  const toggleMusic = React.useCallback(() => {
    const curMusic = templates[activeIndex]?.defaultMusic?.src;
    if (!curMusic) return;

    if (isPlayingMusic) {
      userWantsMusicRef.current = false;
      globalAudio.pause();
      setIsPlayingMusic(false);
    } else {
      userWantsMusicRef.current = true;
      // Phát trực tiếp đồng bộ trong ngữ cảnh click user gesture
      globalAudio.play(curMusic, { volume: 0.55 }).then((success) => {
        setIsPlayingMusic(success);
      });
    }
  }, [activeIndex, isPlayingMusic, templates]);

  const suppressCardClickRef = React.useRef(false);
  const suppressCardClickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupActionLockedRef = React.useRef(false);
  const popupLockTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const unlockPopupActions = React.useCallback(() => {
    popupActionLockedRef.current = false;
    if (popupLockTimerRef.current) {
      clearTimeout(popupLockTimerRef.current);
      popupLockTimerRef.current = null;
    }
  }, []);

  const openMobileActionModal = React.useCallback(
    (fromTouch: boolean) => {
      if (popupLockTimerRef.current) {
        clearTimeout(popupLockTimerRef.current);
        popupLockTimerRef.current = null;
      }
      if (fromTouch) {
        popupActionLockedRef.current = true;
        popupLockTimerRef.current = setTimeout(() => {
          popupActionLockedRef.current = false;
          popupLockTimerRef.current = null;
        }, 450);
      } else {
        popupActionLockedRef.current = false;
      }
      setIsMobileActionModalOpen(true);
    },
    [],
  );

  const suppressCardClicks = React.useCallback((ms = 450) => {
    suppressCardClickRef.current = true;
    if (suppressCardClickTimerRef.current) clearTimeout(suppressCardClickTimerRef.current);
    suppressCardClickTimerRef.current = setTimeout(() => {
      suppressCardClickRef.current = false;
    }, ms);
  }, []);

  const switchCard = React.useCallback(
    (newIndex: number) => {
      suppressCardClicks(450);
      if (centerScrollRef.current) {
        centerScrollRef.current.scrollTop = 0;
      }
      setIsMobileActionModalOpen(false);
      setActivePreviewId(null);
      setIsLiveReady(false);
      setPreviewOpened(false);
      setActiveIndex(newIndex);
      const nextMusic = templates[newIndex]?.defaultMusic?.src;

      if (userWantsMusicRef.current && nextMusic) {
        globalAudio.play(nextMusic, { volume: 0.55 }).catch((err) => {
          console.warn("[TemplateShowcase] Play audio on switch blocked:", err);
        });
      } else if (!nextMusic) {
        globalAudio.stop();
        setIsPlayingMusic(false);
      }
    },
    [suppressCardClicks, templates],
  );

  React.useEffect(() => {
    return () => {
      globalAudio.stop();
    };
  }, []);

  // Touch tracking for swipe vs tap discrimination
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const touchStartTimeRef = React.useRef<number>(0);
  const nameTouchStateRef = React.useRef<{ x: number; y: number; time: number; moved: boolean } | null>(null);
  const suppressNameClickRef = React.useRef(false);
  const suppressNameClickTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (suppressNameClickTimerRef.current) clearTimeout(suppressNameClickTimerRef.current);
      if (suppressCardClickTimerRef.current) clearTimeout(suppressCardClickTimerRef.current);
      if (popupLockTimerRef.current) clearTimeout(popupLockTimerRef.current);
    };
  }, []);

  const activeDemoData = React.useMemo(
    () => (activePreviewId ? getDemoTemplateData(activePreviewId) : null),
    [activePreviewId],
  );

  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);

  React.useEffect(() => {
    if (hasUserInteracted || typeof window === "undefined") return;

    const markInteracted = () => {
      setHasUserInteracted(true);
    };
    const onScroll = () => {
      if (window.scrollY > 40) {
        markInteracted();
      }
    };

    window.addEventListener("pointerdown", markInteracted, { passive: true, once: true });
    window.addEventListener("touchstart", markInteracted, { passive: true, once: true });
    window.addEventListener("keydown", markInteracted, { passive: true, once: true });
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", markInteracted);
      window.removeEventListener("touchstart", markInteracted);
      window.removeEventListener("keydown", markInteracted);
      window.removeEventListener("scroll", onScroll);
    };
  }, [hasUserInteracted]);

  // Debounced auto-activation of Live Preview on center card after 380ms (chỉ kích hoạt khi section đã vào viewport; Mobile chờ tương tác đầu tiên để bảo vệ TBT)
  // Giữ isOpened = false để chạy thật hiệu ứng mở bìa độc quyền, sau ~550ms mới tự bấm nút mở bìa trong iframe.
  React.useEffect(() => {
    const currentItem = templates[activeIndex];
    if (!currentItem || !isSectionVisible) return;
    const isDesktop =
      typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
    if (!isDesktop && !hasUserInteracted) return;

    const timer = setTimeout(() => {
      setActivePreviewId(currentItem.id);
    }, 380);

    return () => {
      clearTimeout(timer);
    };
  }, [activeIndex, templates, isSectionVisible, hasUserInteracted]);

  // Phát hiện ngay khi Live Template trong iframe thực sự mount xong để crossfade mượt ảnh nền cover.webp (0 nháy spinner)
  // và kích hoạt thật nút mở bìa sau ~550ms
  React.useEffect(() => {
    if (!activePreviewId || previewOpened) return;

    let cancelled = false;
    let pollCount = 0;
    let openClickTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let pollTimer: ReturnType<typeof setTimeout> | null = null;

    const tryArmRealCoverOpen = () => {
      if (cancelled || previewOpenedRef.current) return;
      const root = centerScrollRef.current;
      const isLoadingFallback = Boolean(root?.querySelector("[data-template-loading='true']"));
      const hasLiveDom =
        !isLoadingFallback &&
        Boolean(root?.querySelector("[data-template-id], button, [role='button'], img, section, canvas"));
      const stylesReady = hasLiveDom && areIframeStylesReady(root);
      if (stylesReady) {
        setIsLiveReady(true);
      }

      const btn = stylesReady ? findCoverOpenButton(root) : null;
      if (btn) {
        openClickTimer = setTimeout(() => {
          if (cancelled || previewOpenedRef.current) return;
          // Re-query lúc bấm để tránh click nhầm node vừa bị thay trong pha đo FLIP
          const liveBtn = btn.isConnected ? btn : findCoverOpenButton(centerScrollRef.current);
          if (liveBtn && liveBtn.isConnected) {
            liveBtn.click();
          }
          fallbackTimer = setTimeout(() => {
            if (!cancelled && !previewOpenedRef.current) {
              setPreviewOpened(true);
            }
          }, 6000);
        }, 480);
        return;
      }

      pollCount += 1;
      if (pollCount < 60) {
        pollTimer = setTimeout(tryArmRealCoverOpen, 120);
      } else {
        setIsLiveReady(true);
        fallbackTimer = setTimeout(() => {
          if (!cancelled && !previewOpenedRef.current) {
            setPreviewOpened(true);
          }
        }, 1200);
      }
    };

    pollTimer = setTimeout(tryArmRealCoverOpen, 120);

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (openClickTimer) clearTimeout(openClickTimer);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [activePreviewId, previewOpened]);

  // Auto-scroll inside active center card after cover opens (dò scroller lồng nhau + chịu pha chuyển bìa + chống sticky hover trên mobile)
  React.useEffect(() => {
    if (!previewOpened || !activePreviewId) {
      stopAutoScrollLoopRef.current = null;
      resumeAutoScrollLoopRef.current = null;
      if (autoScrollRafRef.current) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
      return;
    }

    let isManuallyPaused = false;
    let isContainerHovered = false;
    let rafId: number | null = null;
    let lastTime = performance.now();
    let startedAt = performance.now();
    let hasSeenScrollable = false;
    let virtualY = 0;
    let cachedMaxScroll = 0;
    let lastMaxMeasureAt = 0;
    let attachedContainer: HTMLElement | null = null;

    const stopLoop = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      autoScrollRafRef.current = null;
    };

    const startLoop = () => {
      if (
        rafId !== null ||
        isManuallyPaused ||
        isContainerHovered ||
        isHoveredCenterRef.current ||
        isMobileActionModalOpenRef.current ||
        !isSectionVisibleRef.current
      ) {
        return;
      }
      const container = resolveActiveScrollContainer(centerScrollRef.current);
      if (container) {
        virtualY = container.scrollTop;
        cachedMaxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
        lastMaxMeasureAt = performance.now();
        if (cachedMaxScroll > 20) {
          hasSeenScrollable = true;
        }
        if (hasSeenScrollable && cachedMaxScroll > 0 && virtualY >= cachedMaxScroll - 1) {
          return;
        }
      }
      startedAt = performance.now();
      lastTime = performance.now();
      rafId = requestAnimationFrame(scrollLoop);
      autoScrollRafRef.current = rafId;
    };

    const handleManualPause = () => {
      isManuallyPaused = true;
      stopLoop();
    };

    const handleContainerPointerEnter = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      isContainerHovered = true;
      stopLoop();
    };

    const handleContainerPointerLeave = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      isContainerHovered = false;
      if (
        !isHoveredCenterRef.current &&
        !isMobileActionModalOpenRef.current &&
        isSectionVisibleRef.current &&
        !isManuallyPaused
      ) {
        startLoop();
      }
    };

    const attachListeners = (container: HTMLElement) => {
      if (attachedContainer === container) return;
      if (attachedContainer) {
        attachedContainer.removeEventListener("wheel", handleManualPause);
        attachedContainer.removeEventListener("touchstart", handleManualPause);
        attachedContainer.removeEventListener("pointerenter", handleContainerPointerEnter);
        attachedContainer.removeEventListener("pointerleave", handleContainerPointerLeave);
      }
      attachedContainer = container;
      container.style.scrollBehavior = "auto";
      container.addEventListener("wheel", handleManualPause, { passive: true });
      container.addEventListener("touchstart", handleManualPause, { passive: true });
      container.addEventListener("pointerenter", handleContainerPointerEnter);
      container.addEventListener("pointerleave", handleContainerPointerLeave);
    };

    const scrollLoop = (now: number) => {
      if (
        isManuallyPaused ||
        isContainerHovered ||
        isHoveredCenterRef.current ||
        isMobileActionModalOpenRef.current ||
        !isSectionVisibleRef.current
      ) {
        stopLoop();
        return;
      }

      const container = resolveActiveScrollContainer(centerScrollRef.current);
      if (container) {
        if (attachedContainer !== container) {
          attachListeners(container);
          virtualY = container.scrollTop;
          cachedMaxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
          lastMaxMeasureAt = now;
        } else if (now - lastMaxMeasureAt >= 450) {
          cachedMaxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
          lastMaxMeasureAt = now;
        }

        if (cachedMaxScroll <= 20) {
          if (now - startedAt < 6500) {
            lastTime = now;
            rafId = requestAnimationFrame(scrollLoop);
            autoScrollRafRef.current = rafId;
            return;
          }
          stopLoop();
          return;
        }

        if (!hasSeenScrollable) {
          hasSeenScrollable = true;
          container.style.scrollBehavior = "auto";
          virtualY = container.scrollTop;
          lastTime = now;
          rafId = requestAnimationFrame(scrollLoop);
          autoScrollRafRef.current = rafId;
          return;
        }

        const dt = (now - lastTime) / 1000;
        lastTime = now;
        const safeDelta = Math.min(Math.max(dt, 0), 0.05);

        virtualY = Math.min(cachedMaxScroll, virtualY + LANDING_AUTO_SCROLL_SPEED * safeDelta);
        container.scrollTop = virtualY;
        if (virtualY >= cachedMaxScroll - 1) {
          cachedMaxScroll = Math.max(0, container.scrollHeight - container.clientHeight);
          lastMaxMeasureAt = now;
          if (virtualY >= cachedMaxScroll - 1) {
            stopLoop();
            return;
          }
        }
      } else {
        lastTime = now;
      }

      rafId = requestAnimationFrame(scrollLoop);
      autoScrollRafRef.current = rafId;
    };

    stopAutoScrollLoopRef.current = stopLoop;
    resumeAutoScrollLoopRef.current = startLoop;

    const startTimer = setTimeout(() => {
      const container = resolveActiveScrollContainer(centerScrollRef.current);
      if (container) {
        attachListeners(container);
      }
      startLoop();
    }, 400);

    return () => {
      clearTimeout(startTimer);
      stopAutoScrollLoopRef.current = null;
      resumeAutoScrollLoopRef.current = null;
      stopLoop();
      if (attachedContainer) {
        attachedContainer.removeEventListener("wheel", handleManualPause);
        attachedContainer.removeEventListener("touchstart", handleManualPause);
        attachedContainer.removeEventListener("pointerenter", handleContainerPointerEnter);
        attachedContainer.removeEventListener("pointerleave", handleContainerPointerLeave);
      }
    };
  }, [previewOpened, activePreviewId]);

  React.useEffect(() => {
    if (!previewOpened) return;
    if (isHoveredCenter || isMobileActionModalOpen || !isSectionVisible) {
      stopAutoScrollLoopRef.current?.();
    } else {
      resumeAutoScrollLoopRef.current?.();
    }
  }, [isHoveredCenter, isMobileActionModalOpen, isSectionVisible, previewOpened]);

  const handlePrev = React.useCallback(() => {
    switchCard(activeIndex > 0 ? activeIndex - 1 : templates.length - 1);
  }, [activeIndex, switchCard, templates.length]);

  const handleNext = React.useCallback(() => {
    switchCard(activeIndex < templates.length - 1 ? activeIndex + 1 : 0);
  }, [activeIndex, switchCard, templates.length]);

  const handlePrevRef = React.useRef(handlePrev);
  const handleNextRef = React.useRef(handleNext);
  React.useEffect(() => {
    handlePrevRef.current = handlePrev;
    handleNextRef.current = handleNext;
  }, [handlePrev, handleNext]);

  // Cầu nối cử chỉ chạm trực tiếp bên trong <iframe> của thẻ trung tâm:
  // - Vuốt ngang -> chuyển mẫu trước/sau
  // - Vuốt dọc -> cuộn xem nội dung thiệp (không mở popup)
  // - Chạm gọn vùng nội dung ngoài nút tương tác (trên < 1024px) -> mở Popup hành động
  React.useEffect(() => {
    if (!activePreviewId || !isLiveReady) return;

    let attachedEl: HTMLElement | null = null;
    let touchState: { x: number; y: number; time: number; moved: boolean } | null = null;
    let rafAttachId = 0;

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchState = {
        x: touch.clientX,
        y: touch.clientY,
        time: e.timeStamp,
        moved: false,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchState) return;
      const touch = e.touches[0];
      if (!touch) return;
      if (Math.abs(touch.clientX - touchState.x) > 10 || Math.abs(touch.clientY - touchState.y) > 10) {
        touchState.moved = true;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const state = touchState;
      touchState = null;
      if (!state) return;
      const touch = e.changedTouches[0];
      if (!touch) return;

      const dx = touch.clientX - state.x;
      const dy = touch.clientY - state.y;
      const dt = e.timeStamp - state.time;

      // Vuốt ngang trên mặt thiệp đang live -> đổi mẫu và không mở popup
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        if (dx < 0) {
          handleNextRef.current();
        } else {
          handlePrevRef.current();
        }
        return;
      }

      // Vuốt dọc hoặc kéo giữ -> khách đang xem/cuộn thiệp, không mở popup
      if (state.moved || Math.abs(dx) > 10 || Math.abs(dy) > 10 || dt >= 350) {
        return;
      }

      // Chạm gọn trên Mobile/Tablet -> mở popup nếu không bấm trúng phần tử tương tác trong thiệp
      if (suppressCardClickRef.current) {
        return;
      }
      if (typeof window === "undefined" || !window.matchMedia("(max-width: 1023px)").matches) {
        return;
      }
      const rawNode = e.target as Node | null;
      const targetEl =
        rawNode && rawNode.nodeType === 1
          ? (rawNode as Element)
          : rawNode?.parentElement ?? null;
      if (
        targetEl &&
        typeof targetEl.closest === "function" &&
        targetEl.closest(
          "a, button, input, textarea, select, [role='button'], [data-cover-open]",
        )
      ) {
        return;
      }
      if (previewOpenedRef.current || isLiveReadyRef.current) {
        openMobileActionModal(true);
      }
    };

    const tryAttach = () => {
      const el = centerScrollRef.current;
      if (!el) {
        rafAttachId = requestAnimationFrame(tryAttach);
        return;
      }
      attachedEl = el;
      el.addEventListener("touchstart", onTouchStart, { passive: true });
      el.addEventListener("touchmove", onTouchMove, { passive: true });
      el.addEventListener("touchend", onTouchEnd, { passive: true });
    };

    tryAttach();

    return () => {
      if (rafAttachId) cancelAnimationFrame(rafAttachId);
      if (attachedEl) {
        attachedEl.removeEventListener("touchstart", onTouchStart);
        attachedEl.removeEventListener("touchmove", onTouchMove);
        attachedEl.removeEventListener("touchend", onTouchEnd);
      }
    };
  }, [activePreviewId, isLiveReady, openMobileActionModal]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
    touchStartTimeRef.current = e.timeStamp;
  };

  const handleTouchEnd = (e: React.TouchEvent, cardIndex: number) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartXRef.current;
    const deltaY = touch.clientY - touchStartYRef.current;
    const deltaTime = e.timeStamp - touchStartTimeRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Horizontal swipe threshold -> chuyển mẫu và chặn click nhầm
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      suppressCardClicks(450);
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
      return;
    }

    // Tap gọn trên thẻ phụ -> xoay ra giữa (chặn trailing click mở nhầm popup); tap gọn lên ảnh tĩnh thẻ trung tâm -> mở popup
    if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12 && deltaTime < 350) {
      if (cardIndex !== activeIndex) {
        suppressCardClicks(450);
        switchCard(cardIndex);
      } else if (
        !suppressCardClickRef.current &&
        !isLiveReady &&
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 1023px)").matches
      ) {
        suppressCardClicks(350);
        openMobileActionModal(true);
      }
    }
  };

  // Phân biệt rõ thao tác vuốt/cuộn vs chạm chủ đích vào tên mẫu bên dưới để mở popup chọn hành động
  const handleNameTriggerTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    suppressNameClickRef.current = false;
    nameTouchStateRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: e.timeStamp,
      moved: false,
    };
  };

  const handleNameTriggerTouchMove = (e: React.TouchEvent) => {
    const state = nameTouchStateRef.current;
    const touch = e.touches[0];
    if (!state || !touch) return;
    if (Math.abs(touch.clientX - state.x) > 10 || Math.abs(touch.clientY - state.y) > 10) {
      state.moved = true;
    }
  };

  const handleNameTriggerTouchEnd = (e: React.TouchEvent) => {
    const state = nameTouchStateRef.current;
    nameTouchStateRef.current = null;
    if (!state) return;

    const touch = e.changedTouches[0];
    if (!touch) return;
    const deltaX = touch.clientX - state.x;
    const deltaY = touch.clientY - state.y;
    const deltaTime = e.timeStamp - state.time;

    const markSuppress = () => {
      suppressNameClickRef.current = true;
      if (suppressNameClickTimerRef.current) clearTimeout(suppressNameClickTimerRef.current);
      suppressNameClickTimerRef.current = setTimeout(() => {
        suppressNameClickRef.current = false;
      }, 400);
    };

    // Nếu khách vuốt ngang ngay trên tên mẫu -> chuyển thiệp và KHÔNG mở popup
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      markSuppress();
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
      return;
    }

    // Nếu khách kéo/cuộn dở hoặc giữ quá lâu -> không mở nhầm popup
    if (state.moved || Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10 || deltaTime >= 380) {
      markSuppress();
    }
  };

  const handleNameTriggerClick = () => {
    if (suppressNameClickRef.current) {
      suppressNameClickRef.current = false;
      return;
    }
    setIsMobileActionModalOpen(true);
  };

  // Đóng popup bằng phím Escape
  React.useEffect(() => {
    if (!isMobileActionModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileActionModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobileActionModalOpen]);

  // Keyboard navigation (bỏ qua khi người dùng đang gõ trong form/input)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
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
      ref={sectionRef}
      id="mau-thiep"
      className="relative scroll-mt-14 overflow-hidden border-b border-[#E8E2D9] bg-[#FAF8F5] pt-3 pb-16 sm:pt-5 sm:pb-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header (ẩn trên Mobile/Tablet < lg để nối liền mạch Hero -> dãy thiệp 3D, không lặp 2 tiêu đề) */}
        <header className="mx-auto hidden max-w-2xl text-center lg:block">
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
        <div ref={stageRef} className="relative mt-2 flex flex-col items-center justify-center lg:mt-10">
          {/* Main 3D Container with wide horizontal reach */}
          <div
            className="relative flex h-[530px] w-full items-center justify-center sm:h-[610px] lg:h-[700px] overflow-hidden"
            style={{ perspective: "1000px" }}
          >
            {templates.map((template, idx) => {
              const offset = getCircularOffset(idx, activeIndex, templates.length);
              const isCenter = offset === 0;
              const maxOffset = isMobileViewport ? 1 : 3;
              const isVisible = Math.abs(offset) <= maxOffset;

              if (!isVisible || (!hasNearViewport && Math.abs(offset) > 1)) return null;

              // Coverflow 3D transforms (thuần transform + opacity trên GPU compositor, bỏ filter: blur gây nặng GPU)
              let transformStyle = "";
              let zIndex = 10;
              let opacity = 0;
              let pointerEvents: "auto" | "none" = "auto";

              if (isCenter) {
                transformStyle = "translateX(0%) translateZ(0px) rotateY(0deg) scale(1)";
                zIndex = 40;
                opacity = 1;
              } else if (offset === -1) {
                transformStyle = "translateX(-82%) translateZ(-70px) rotateY(20deg) scale(0.86)";
                zIndex = 30;
                opacity = 0.78;
              } else if (offset === 1) {
                transformStyle = "translateX(82%) translateZ(-70px) rotateY(-20deg) scale(0.86)";
                zIndex = 30;
                opacity = 0.78;
              } else if (offset === -2) {
                transformStyle = "translateX(-155%) translateZ(-140px) rotateY(32deg) scale(0.74)";
                zIndex = 20;
                opacity = 0.48;
              } else if (offset === 2) {
                transformStyle = "translateX(155%) translateZ(-140px) rotateY(-32deg) scale(0.74)";
                zIndex = 20;
                opacity = 0.48;
              } else if (offset === -3) {
                transformStyle = "translateX(-225%) translateZ(-210px) rotateY(42deg) scale(0.62)";
                zIndex = 10;
                opacity = 0.22;
              } else if (offset === 3) {
                transformStyle = "translateX(225%) translateZ(-210px) rotateY(-42deg) scale(0.62)";
                zIndex = 10;
                opacity = 0.22;
              } else {
                pointerEvents = "none";
              }

              const isLivePreviewActive = isCenter && activePreviewId === template.id;
              const coverImg = getCoverImageResponsive(template.previewImage);
              const createUrl = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(
                template.id,
              )}`;
              const demoUrl = template.demoUrl || `/mau/${template.id}`;

              return (
                <div
                  key={template.id}
                  onClick={() => {
                    if (suppressCardClickRef.current) {
                      return;
                    }
                    if (!isCenter) {
                      switchCard(idx);
                    } else if (
                      !isLiveReady &&
                      typeof window !== "undefined" &&
                      window.matchMedia("(max-width: 1023px)").matches
                    ) {
                      openMobileActionModal(false);
                    }
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={(e) => handleTouchEnd(e, idx)}
                  onPointerEnter={(e) => {
                    if (isCenter && e.pointerType === "mouse") setIsHoveredCenter(true);
                  }}
                  onPointerLeave={(e) => {
                    if (isCenter && e.pointerType === "mouse") setIsHoveredCenter(false);
                  }}
                  style={{
                    transform: transformStyle,
                    zIndex,
                    opacity,
                    pointerEvents,
                    transition:
                      "transform 450ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 450ms ease",
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
                    {/* Static Cover (luôn giữ làm nền & crossfade mượt khi Live Preview sẵn sàng, không nháy spinner) */}
                    <img
                      src={coverImg.src}
                      srcSet={isCenter && hasNearViewport && !isMobileViewport ? coverImg.srcSet : undefined}
                      sizes={
                        isCenter && hasNearViewport && !isMobileViewport && coverImg.srcSet
                          ? "(max-width: 639px) 260px, 290px"
                          : undefined
                      }
                      alt={template.name}
                      width={coverImg.width}
                      height={coverImg.height}
                      loading={isCenter ? "eager" : "lazy"}
                      fetchPriority={isCenter ? "high" : "low"}
                      decoding="async"
                      className={cn(
                        "absolute inset-0 z-20 h-full w-full object-cover object-center transition-opacity duration-200",
                        isLivePreviewActive && isLiveReady
                          ? "pointer-events-none opacity-0"
                          : "opacity-100",
                      )}
                    />

                    {/* Live Preview Container (mounted only for active center card after 380ms) with Mobile Viewport Isolation & smooth Auto-Scroll */}
                    {isLivePreviewActive && activeDemoData && (
                      <div className="relative z-10 h-full w-full overflow-hidden">
                        <MobilePreviewFrame
                          scrollRef={centerScrollRef}
                          lockedScroll={!previewOpened}
                          targetWidth={375}
                        >
                          <DynamicPreviewRenderer
                            templateId={template.id}
                            data={activeDemoData}
                            mode="demo"
                            contained
                            viewport="phone"
                            isOpened={previewOpened}
                            onOpenedChange={setPreviewOpened}
                            externalMusicControl
                            disableAudio={true}
                          />
                        </MobilePreviewFrame>
                      </div>
                    )}

                    {/* Working Music Toggle on Active Card */}
                    {isCenter && template.defaultMusic?.src && (
                      <button
                        type="button"
                        onTouchStart={(e) => {
                          e.stopPropagation();
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                        }}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMusic();
                        }}
                        aria-label={isPlayingMusic ? "Tắt nhạc nền mẫu thiệp" : "Bật nhạc nền mẫu thiệp"}
                        className={cn(
                          "absolute top-3.5 left-3.5 z-40 flex min-h-[40px] items-center gap-2 rounded-full px-3.5 text-xs font-medium transition-all duration-200 cursor-pointer shadow-md select-none touch-manipulation",
                          isPlayingMusic
                            ? "border border-[#B89B72] bg-[#1F1D1A]/95 text-[#F2DBA8]"
                            : "border border-white/25 bg-black/60 text-white hover:bg-black/80 hover:border-white/40",
                        )}
                      >
                        <Disc3
                          className={cn(
                            "h-4 w-4 shrink-0 text-[#B89B72]",
                            isPlayingMusic && "animate-spin [animation-duration:3s]",
                          )}
                        />
                        <span className="text-[11px] tracking-wide font-medium">
                          {isPlayingMusic ? "Đang phát nhạc" : "Bật nhạc"}
                        </span>
                      </button>
                    )}

                    {/* Plan Badge (chỉ hiển thị trên thẻ trung tâm để tránh giảm tương phản khi thẻ phụ bị làm mờ) */}
                    {isCenter && template.plan !== "free" && (
                      <div className="pointer-events-none absolute top-3.5 right-3.5 z-30 rounded-full border border-[#D8B15B]/75 bg-[#1F1D1A] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#F2D488] uppercase shadow-sm">
                        {getPlanLabel(template.plan)}
                      </div>
                    )}

                    {/* Desktop Hover Overlay (Center Card Only) */}
                    {isCenter && (
                      <div
                        style={{
                          transform: "translateZ(0)",
                          backfaceVisibility: "hidden",
                          willChange: "transform",
                        }}
                        onPointerEnter={(e) => {
                          if (e.pointerType === "mouse") setIsHoveredCenter(true);
                        }}
                        onPointerLeave={(e) => {
                          if (e.pointerType === "mouse") setIsHoveredCenter(false);
                        }}
                        className="absolute inset-x-0 bottom-0 z-40 hidden flex-col justify-end bg-gradient-to-t from-[#0F0E0D]/95 via-[#0F0E0D]/80 to-transparent p-5 text-white pointer-events-auto lg:flex"
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
                            onClick={() => {
                              globalAudio.stop();
                              markDemoReturnOrigin(true);
                            }}
                            className="inline-flex flex-1 h-9 items-center justify-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 text-xs font-medium text-white transition-all hover:bg-white hover:text-[#1F1D1A] active:scale-95 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Xem thử</span>
                          </Link>

                          <Link
                            href={createUrl}
                            onClick={() => globalAudio.stop()}
                            className="inline-flex flex-1 h-9 items-center justify-center rounded-full bg-[#7A1C24] px-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#5E141B] active:scale-95 cursor-pointer"
                          >
                            <span>{template.plan === "free" ? "Dùng mẫu" : "Dùng thử"}</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile & Tablet: Hiển thị tên mẫu ở ngoài bên dưới (không đặt nút CTA trực tiếp), chạm gọn để mở popup hành động */}
          {templates[activeIndex] && (
            <div className="mt-3 flex w-full max-w-[340px] flex-col items-center px-2 sm:mt-4 lg:hidden">
              <button
                type="button"
                data-mobile-template-trigger="true"
                onTouchStart={handleNameTriggerTouchStart}
                onTouchMove={handleNameTriggerTouchMove}
                onTouchEnd={handleNameTriggerTouchEnd}
                onClick={handleNameTriggerClick}
                aria-haspopup="dialog"
                aria-expanded={isMobileActionModalOpen}
                className="group flex min-h-[54px] w-full cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[#E8E2D9] bg-white px-4 py-2.5 text-left shadow-xs transition-all hover:border-[#B89B72] active:scale-[0.99] touch-manipulation select-none"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-serif text-base font-medium text-[#1F1D1A]">
                      {templates[activeIndex].name}
                    </span>
                    {templates[activeIndex].plan !== "free" && (
                      <span className="shrink-0 rounded-full border border-[#D8B15B]/60 bg-[#FAF4E4] px-2 py-0.5 text-[9px] font-bold tracking-wider text-[#8C6421] uppercase">
                        {getPlanLabel(templates[activeIndex].plan)}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[11px] text-[#6B655E]">
                    Chạm tên mẫu hoặc mặt thiệp để chọn
                  </p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FAF8F5] text-[#7A1C24] border border-[#E8E2D9] transition-colors group-hover:bg-[#7A1C24] group-hover:text-white">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            </div>
          )}

          {/* Navigation Controls (Desktop Buttons & Pagination Dots) */}
          <div className="mt-4 flex w-full max-w-[380px] items-center justify-between gap-2 px-0 sm:gap-4 sm:px-2 lg:mt-8">
            {/* Prev Button */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Mẫu trước"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#E8E2D9] bg-white text-[#1F1D1A] shadow-2xs transition-all hover:border-[#B89B72] hover:bg-[#F4EFEA] active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Pagination Dots (24x24px touch targets) */}
            <div className="flex items-center gap-0 sm:gap-0.5">
              {templates.map((tpl, i) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => switchCard(i)}
                  aria-label={`Chuyển tới mẫu ${tpl.name}`}
                  className="group inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "block rounded-full transition-all duration-300",
                      i === activeIndex
                        ? "h-2 w-6 bg-[#7A1C24]"
                        : "h-2 w-2 bg-[#E8E2D9] group-hover:bg-[#8A6838]",
                    )}
                  />
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={handleNext}
              aria-label="Mẫu tiếp theo"
              className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#E8E2D9] bg-white text-[#1F1D1A] shadow-2xs transition-all hover:border-[#B89B72] hover:bg-[#F4EFEA] active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile & Tablet Action Popup khi khách bấm chủ đích vào tên mẫu hoặc chạm mặt thiệp */}
          {isMobileActionModalOpen && templates[activeIndex] && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-template-action-title"
              data-mobile-template-popup="true"
              onTouchStartCapture={unlockPopupActions}
              onClickCapture={(e) => {
                // Chặn ghost click rơi từ cú chạm mở popup đè trúng nút "Hiển thị toàn màn hình" / "Dùng mẫu này"
                if (popupActionLockedRef.current) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onClick={() => {
                if (popupActionLockedRef.current) return;
                setIsMobileActionModalOpen(false);
              }}
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-[2px] sm:items-center lg:hidden"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[380px] rounded-3xl border border-[#E8E2D9] bg-[#FAF8F5] p-5 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        id="mobile-template-action-title"
                        className="font-serif text-xl font-normal text-[#1F1D1A]"
                      >
                        {templates[activeIndex].name}
                      </h3>
                      {templates[activeIndex].plan !== "free" && (
                        <span className="rounded-full border border-[#D8B15B]/60 bg-[#FAF4E4] px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-[#8C6421] uppercase">
                          {getPlanLabel(templates[activeIndex].plan)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#6B655E]">
                      {templates[activeIndex].subtitle ||
                        (templates[activeIndex].styleTags && templates[activeIndex].styleTags.join(" · ")) ||
                        "Thiệp cưới phong cách"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMobileActionModalOpen(false)}
                    aria-label="Đóng hộp chọn mẫu"
                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#E8E2D9] bg-white text-[#1F1D1A] transition-colors hover:bg-[#F4EFEA]"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="mt-5 flex flex-col gap-2.5">
                  <Link
                    href={templates[activeIndex].demoUrl || `/mau/${templates[activeIndex].id}`}
                    onClick={() => {
                      setIsMobileActionModalOpen(false);
                      globalAudio.stop();
                      markDemoReturnOrigin(true);
                    }}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#E8E2D9] bg-white px-4 text-sm font-medium text-[#1F1D1A] shadow-2xs transition-colors hover:bg-[#F4EFEA]"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    <span>Hiển thị toàn màn hình</span>
                  </Link>
                  <Link
                    href={`${SITE_LINKS.createWedding}?template=${encodeURIComponent(templates[activeIndex].id)}`}
                    onClick={() => {
                      setIsMobileActionModalOpen(false);
                      globalAudio.stop();
                    }}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-4 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B]"
                  >
                    <span>Dùng mẫu này</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="mt-8 text-center lg:mt-14">
          <Link
            href={SITE_LINKS.templates}
            className="inline-flex h-[72px] items-center justify-center gap-3 rounded-full bg-[#7A1C24] px-8 text-base font-semibold text-white shadow-sm transition-all hover:bg-[#5E141B] hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF8F5] sm:px-12 sm:text-lg"
          >
            <span>Khám phá toàn bộ mẫu thiệp</span>
            <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
