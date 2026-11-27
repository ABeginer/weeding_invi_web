"use client";

import * as React from "react";
import { ChevronsDown, Disc3, Pause, Play, VolumeX, Music } from "lucide-react";
import { cn } from "@/lib/utils";

export type InvitationExperienceMode =
  | "guest"
  | "standalone-preview"
  | "editor"
  | "card-preview";

export interface InvitationExperienceContextValue {
  isOpened: boolean;
  isMusicPlaying: boolean;
  isAutoScrolling: boolean;
  musicTitle: string;
  audioAvailable: boolean;
  toggleMusic: () => void;
  toggleAutoScroll: () => void;
  startAutoScroll: () => void;
  stopAutoScroll: (manual?: boolean) => void;
  triggerInvitationOpened: () => void;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
}

const InvitationExperienceContext =
  React.createContext<InvitationExperienceContextValue | null>(null);

export function useInvitationExperience() {
  return React.useContext(InvitationExperienceContext);
}

export interface InvitationExperienceProviderProps {
  children: React.ReactNode;
  musicSrc?: string | null;
  musicTitle?: string | null;
  mode?: InvitationExperienceMode;
  initialOpened?: boolean;
  onOpenedChange?: (opened: boolean) => void;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  showFloatingControls?: boolean;
  disableAudio?: boolean;
  enableAutoScroll?: boolean;
}

const SPEED_PX_PER_SEC = 120; // Bội số chung của 60Hz (2px/frame) & 120Hz (1px/frame) -> cuộn siêu mượt không giật step
const AUTO_SCROLL_DELAY_MS = 2500; // Trì hoãn 2.5s sau khi mở thiệp để khách kịp đọc Hero

export function InvitationExperienceProvider({
  children,
  musicSrc,
  musicTitle = "Giai điệu ngày cưới",
  mode = "guest",
  initialOpened = false,
  onOpenedChange,
  scrollContainerRef,
  showFloatingControls,
  disableAudio = false,
  enableAutoScroll,
}: InvitationExperienceProviderProps) {
  const isAudioEnabled = !disableAudio && (mode === "guest" || mode === "standalone-preview");
  const isAutoScrollEnabled =
    enableAutoScroll ?? (mode === "guest" || mode === "standalone-preview");
  const shouldRenderControls =
    showFloatingControls ?? (mode === "guest" || mode === "standalone-preview");

  const [isOpened, setIsOpened] = React.useState<boolean>(Boolean(initialOpened));
  const [isMusicPlaying, setIsMusicPlaying] = React.useState<boolean>(false);
  const [isAutoScrolling, setIsAutoScrolling] = React.useState<boolean>(false);
  const [audioAvailable, setAudioAvailable] = React.useState<boolean>(
    Boolean(!disableAudio && musicSrc),
  );

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const userManuallyPausedMusicRef = React.useRef<boolean>(false);
  const userManuallyStoppedScrollRef = React.useRef<boolean>(false);
  const wasPlayingBeforeHideRef = React.useRef<boolean>(false);

  const isAutoScrollingRef = React.useRef<boolean>(false);
  const rafIdRef = React.useRef<number | null>(null);
  const lastTimeRef = React.useRef<number>(0);
  const startScrollTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const restoreScrollBehaviorRef = React.useRef<(() => void) | null>(null);

  // Dọn dẹp âm thanh khi unmount
  React.useEffect(() => {
    return () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch { }
      }
    };
  }, []);

  // Cập nhật audioAvailable khi đổi link nhạc hoặc cờ disableAudio
  React.useEffect(() => {
    setAudioAvailable(Boolean(!disableAudio && musicSrc));
    if (disableAudio && audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch { }
      setIsMusicPlaying(false);
    }
  }, [musicSrc, disableAudio]);

  // Cập nhật isOpened khi initialOpened từ cha thay đổi
  React.useEffect(() => {
    if (initialOpened !== undefined) {
      setIsOpened(Boolean(initialOpened));
    }
  }, [initialOpened]);

  // Broadcast trạng thái nhạc ra toàn cục (cho InvitationDesktopStage & Toolbar)
  const broadcastMusicState = React.useCallback((playing: boolean) => {
    try {
      window.dispatchEvent(
        new CustomEvent("inviwedd:music-state-change", {
          detail: { isPlaying: playing },
        }),
      );
    } catch { }
  }, []);

  // Broadcast trạng thái auto-scroll
  const broadcastAutoScrollState = React.useCallback((scrolling: boolean, manual = false) => {
    try {
      window.dispatchEvent(
        new CustomEvent("inviwedd:autoscroll-state-change", {
          detail: { isAutoScrolling: scrolling, manual },
        }),
      );
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          { type: "inviwedd:demo:autoscroll", isAutoScrolling: scrolling, manual },
          "*",
        );
      }
    } catch { }
  }, []);

  // Phát nhạc
  const playAudio = React.useCallback(() => {
    if (disableAudio) return;
    const audio = audioRef.current;
    if (!audio || !musicSrc) return;
    try {
      audio.volume = 0.55;
      const promise = audio.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setIsMusicPlaying(true);
            broadcastMusicState(true);
          })
          .catch(() => {
            setIsMusicPlaying(false);
            broadcastMusicState(false);
          });
      } else {
        setIsMusicPlaying(true);
        broadcastMusicState(true);
      }
    } catch {
      setIsMusicPlaying(false);
      broadcastMusicState(false);
    }
  }, [broadcastMusicState, musicSrc]);

  // Dừng nhạc
  const pauseAudio = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsMusicPlaying(false);
    broadcastMusicState(false);
  }, [broadcastMusicState]);

  // Toggle nhạc thủ công
  const toggleMusic = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      userManuallyPausedMusicRef.current = false;
      playAudio();
    } else {
      userManuallyPausedMusicRef.current = true;
      pauseAudio();
    }
  }, [pauseAudio, playAudio]);

  // Gắn listener 1 lần để unlock âm thanh nếu Autoplay bị trình duyệt chặn (NotAllowedError)
  const armOneTimeUnlockListener = React.useCallback(() => {
    if (typeof window === "undefined" || userManuallyPausedMusicRef.current) return;
    const unlockEvents = ["pointerdown", "touchstart", "click", "keydown"] as const;
    const handleFirstInteraction = () => {
      unlockEvents.forEach((ev) =>
        window.removeEventListener(ev, handleFirstInteraction, true),
      );
      if (audioRef.current && !userManuallyPausedMusicRef.current && audioRef.current.paused) {
        audioRef.current.volume = 0.55;
        audioRef.current
          .play()
          .then(() => {
            setIsMusicPlaying(true);
            broadcastMusicState(true);
          })
          .catch(() => { });
      }
    };
    unlockEvents.forEach((ev) => {
      window.addEventListener(ev, handleFirstInteraction, { capture: true, once: true });
    });
  }, [broadcastMusicState]);

  // Tìm container đang thực sự cuộn (hỗ trợ cả wrapper ngoài lẫn thẻ con overflow-x-hidden/overflow-y-auto khi contained)
  const resolveActiveScroller = React.useCallback((): HTMLElement | null => {
    const primary = scrollContainerRef?.current;
    if (primary) {
      if (primary.scrollHeight > primary.clientHeight + 20) {
        return primary;
      }
      const nestedCandidates = primary.querySelectorAll<HTMLElement>("div, main, section");
      let bestNested: HTMLElement | null = null;
      let bestOverflow = 20;
      for (const el of nestedCandidates) {
        if (el.scrollHeight <= el.clientHeight + bestOverflow) continue;
        const style = window.getComputedStyle(el);
        if (!/(auto|scroll|overlay)/.test(style.overflowY)) continue;
        const overflow = el.scrollHeight - el.clientHeight;
        if (overflow > bestOverflow) {
          bestOverflow = overflow;
          bestNested = el;
        }
      }
      if (bestNested) return bestNested;
      return primary;
    }
    return null;
  }, [scrollContainerRef]);

  // Dừng Auto-Scroll
  const stopAutoScroll = React.useCallback(
    (manual = false) => {
      if (manual) {
        userManuallyStoppedScrollRef.current = true;
      }
      isAutoScrollingRef.current = false;
      setIsAutoScrolling(false);
      broadcastAutoScrollState(false, manual);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (startScrollTimerRef.current) {
        clearTimeout(startScrollTimerRef.current);
        startScrollTimerRef.current = null;
      }
      if (restoreScrollBehaviorRef.current) {
        restoreScrollBehaviorRef.current();
        restoreScrollBehaviorRef.current = null;
      }
    },
    [broadcastAutoScrollState],
  );

  // Bắt đầu Auto-Scroll mượt 60/120fps bằng vị trí thực (virtualY) & cache maxScroll tránh layout thrashing
  const startAutoScroll = React.useCallback(() => {
    if (isAutoScrollingRef.current) return;
    if (startScrollTimerRef.current) {
      clearTimeout(startScrollTimerRef.current);
      startScrollTimerRef.current = null;
    }
    userManuallyStoppedScrollRef.current = false;
    isAutoScrollingRef.current = true;
    setIsAutoScrolling(true);
    broadcastAutoScrollState(true, false);
    lastTimeRef.current = 0;

    let hasSeenScrollable = false;
    let cachedContainer: HTMLElement | null = null;
    let cachedMaxScroll = 0;
    let lastResolveAt = 0;
    let lastMaxMeasureAt = 0;
    let virtualY = 0;
    let behaviorOverridden = false;
    const waitStartedAt = performance.now();

    const measureMaxScroll = (container: HTMLElement | null) => {
      if (container) {
        return Math.max(0, container.scrollHeight - container.clientHeight);
      }
      if (typeof window !== "undefined") {
        return Math.max(
          0,
          (document.documentElement.scrollHeight || document.body.scrollHeight || 0) -
            (window.innerHeight || document.documentElement.clientHeight || 0),
        );
      }
      return 0;
    };

    const ensureBehaviorAuto = (container: HTMLElement | null) => {
      if (behaviorOverridden) return;
      const targetEl =
        container ?? (typeof document !== "undefined" ? document.documentElement : null);
      if (!targetEl) return;
      const prevBehavior = targetEl.style.scrollBehavior;
      targetEl.style.scrollBehavior = "auto";
      behaviorOverridden = true;
      restoreScrollBehaviorRef.current = () => {
        targetEl.style.scrollBehavior = prevBehavior;
      };
    };

    const step = (currentTime: number) => {
      if (!isAutoScrollingRef.current) return;

      if (
        !hasSeenScrollable &&
        (!cachedContainer || currentTime - lastResolveAt >= 30)
      ) {
        cachedContainer = resolveActiveScroller();
        lastResolveAt = currentTime;
        cachedMaxScroll = measureMaxScroll(cachedContainer);
        lastMaxMeasureAt = currentTime;
      } else if (hasSeenScrollable && currentTime - lastMaxMeasureAt >= 450) {
        cachedMaxScroll = measureMaxScroll(cachedContainer);
        lastMaxMeasureAt = currentTime;
      }

      const container = cachedContainer;
      const maxScroll = cachedMaxScroll;

      // Trong lúc bìa đang mở khóa chiều cao (vd Flip 3.3s), chờ mượt mà và không tích lũy delta
      if (maxScroll <= 20) {
        lastTimeRef.current = 0;
        if (!hasSeenScrollable && currentTime - waitStartedAt < 6500) {
          rafIdRef.current = requestAnimationFrame(step);
          return;
        }
        stopAutoScroll(false);
        return;
      }

      if (!hasSeenScrollable) {
        hasSeenScrollable = true;
        ensureBehaviorAuto(container);
        virtualY = container
          ? container.scrollTop
          : window.scrollY || document.documentElement.scrollTop || 0;
        lastTimeRef.current = currentTime - 1000 / 60;
      }

      const rawDt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;
      const safeDelta = Math.min(Math.max(rawDt, 0), 0.05);

      virtualY = Math.min(maxScroll, virtualY + SPEED_PX_PER_SEC * safeDelta);

      if (container) {
        container.scrollTop = virtualY;
      } else if (typeof window !== "undefined") {
        window.scrollTo(0, virtualY);
      }

      if (virtualY >= maxScroll - 1) {
        // Đo lại lần cuối đề phòng ảnh lazy-load làm trang dài thêm
        const latestMax = measureMaxScroll(container);
        cachedMaxScroll = latestMax;
        lastMaxMeasureAt = currentTime;
        if (virtualY >= latestMax - 1) {
          stopAutoScroll(false);
          return;
        }
      }

      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);
  }, [broadcastAutoScrollState, resolveActiveScroller, stopAutoScroll]);

  // Bắt đầu Auto-Scroll có độ trễ
  const startAutoScrollWithDelay = React.useCallback(
    (delayMs = AUTO_SCROLL_DELAY_MS) => {
      if (startScrollTimerRef.current) {
        clearTimeout(startScrollTimerRef.current);
      }
      startScrollTimerRef.current = setTimeout(() => {
        startScrollTimerRef.current = null;
        startAutoScroll();
      }, delayMs);
    },
    [startAutoScroll],
  );

  // Toggle Auto-Scroll thủ công
  const toggleAutoScroll = React.useCallback(() => {
    if (isAutoScrollingRef.current || startScrollTimerRef.current !== null) {
      stopAutoScroll(true);
    } else {
      userManuallyStoppedScrollRef.current = false;
      const container = resolveActiveScroller();
      let isAtBottom = false;
      if (container) {
        const hasOverflow = container.scrollHeight > container.clientHeight + 8;
        isAtBottom =
          hasOverflow && container.scrollTop + container.clientHeight >= container.scrollHeight - 8;
      } else if (typeof window !== "undefined") {
        const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        const clientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const scrollHeight =
          document.documentElement.scrollHeight || document.body.scrollHeight || 0;
        const hasOverflow = scrollHeight > clientHeight + 8;
        isAtBottom = hasOverflow && scrollTop + clientHeight >= scrollHeight - 8;
      }

      if (isAtBottom) {
        if (container) {
          container.scrollTo({ top: 0, behavior: "smooth" });
        } else if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        setTimeout(() => {
          startAutoScroll();
        }, 600);
      } else {
        startAutoScroll();
      }
    }
  }, [resolveActiveScroller, startAutoScroll, stopAutoScroll]);

  // Trigger mở thiệp đồng bộ (Synchronous Gesture Unlock)
  const triggerInvitationOpened = React.useCallback(() => {
    setIsOpened(true);
    onOpenedChange?.(true);

    if (isAudioEnabled && audioRef.current && musicSrc && !userManuallyPausedMusicRef.current) {
      try {
        const audio = audioRef.current;
        audio.volume = 0.55;
        const promise = audio.play();
        if (promise !== undefined) {
          promise
            .then(() => {
              setIsMusicPlaying(true);
              broadcastMusicState(true);
            })
            .catch((err) => {
              console.warn("Autoplay deferred or blocked:", err);
              armOneTimeUnlockListener();
            });
        } else {
          setIsMusicPlaying(true);
          broadcastMusicState(true);
        }
      } catch (err) {
        console.warn("Audio play error:", err);
        armOneTimeUnlockListener();
      }
    }

    if (isAutoScrollEnabled && !userManuallyStoppedScrollRef.current) {
      startAutoScrollWithDelay(AUTO_SCROLL_DELAY_MS);
    }
  }, [
    armOneTimeUnlockListener,
    broadcastMusicState,
    isAudioEnabled,
    isAutoScrollEnabled,
    musicSrc,
    onOpenedChange,
    startAutoScrollWithDelay,
  ]);

  // Lắng nghe sự kiện mở phong bì toàn cục (inviwedd:open-envelope) và kết thúc zoom bìa (inviwedd:cover-settled)
  React.useEffect(() => {
    const handleEnvelopeOpen = () => {
      triggerInvitationOpened();
    };
    const handleCoverSettled = () => {
      if (isAutoScrollEnabled && !userManuallyStoppedScrollRef.current && !isAutoScrollingRef.current) {
        if (startScrollTimerRef.current) {
          clearTimeout(startScrollTimerRef.current);
          startScrollTimerRef.current = null;
        }
        requestAnimationFrame(() => {
          if (isAutoScrollEnabled && !userManuallyStoppedScrollRef.current) {
            startAutoScroll();
          }
        });
      }
    };
    window.addEventListener("inviwedd:open-envelope", handleEnvelopeOpen);
    window.addEventListener("inviwedd:cover-settled", handleCoverSettled);
    return () => {
      window.removeEventListener("inviwedd:open-envelope", handleEnvelopeOpen);
      window.removeEventListener("inviwedd:cover-settled", handleCoverSettled);
    };
  }, [isAutoScrollEnabled, startAutoScroll, triggerInvitationOpened]);

  // Lắng nghe lệnh bật/tắt nhạc từ Desktop Utility Rail hoặc toolbar ngoài
  React.useEffect(() => {
    const handleToggleFromExternal = () => {
      toggleMusic();
    };
    window.addEventListener("inviwedd:toggle-music", handleToggleFromExternal);
    return () => {
      window.removeEventListener("inviwedd:toggle-music", handleToggleFromExternal);
    };
  }, [toggleMusic]);

  // Lắng nghe lệnh bật/tắt autoscroll từ bên ngoài & postMessage từ cửa sổ cha (iframe modal / preview)
  React.useEffect(() => {
    const handleToggleScrollFromExternal = () => {
      toggleAutoScroll();
    };
    const handleParentAutoScrollMessage = (e: MessageEvent) => {
      if (e.data?.type !== "inviwedd:preview:set-autoscroll") return;
      const shouldPause = Boolean(e.data.paused);
      if (shouldPause) {
        stopAutoScroll(true);
      } else {
        const container = resolveActiveScroller();
        let isAtBottom = false;
        if (container) {
          const hasOverflow = container.scrollHeight > container.clientHeight + 8;
          isAtBottom =
            hasOverflow && container.scrollTop + container.clientHeight >= container.scrollHeight - 8;
        }
        if (isAtBottom && container) {
          container.scrollTo({ top: 0, behavior: "smooth" });
          setTimeout(() => {
            startAutoScroll();
          }, 500);
        } else {
          startAutoScroll();
        }
      }
    };
    window.addEventListener("inviwedd:toggle-autoscroll", handleToggleScrollFromExternal);
    window.addEventListener("message", handleParentAutoScrollMessage);
    return () => {
      window.removeEventListener("inviwedd:toggle-autoscroll", handleToggleScrollFromExternal);
      window.removeEventListener("message", handleParentAutoScrollMessage);
    };
  }, [resolveActiveScroller, startAutoScroll, stopAutoScroll, toggleAutoScroll]);

  // Tự động unlock âm thanh & auto-scroll nếu template mở sẵn (initialOpened = true)
  React.useEffect(() => {
    if (!initialOpened) return;
    if (isAudioEnabled && !userManuallyPausedMusicRef.current && audioRef.current && audioRef.current.paused) {
      audioRef.current.volume = 0.55;
      audioRef.current
        .play()
        .then(() => {
          setIsMusicPlaying(true);
          broadcastMusicState(true);
        })
        .catch(() => {
          armOneTimeUnlockListener();
        });
    }
    if (isAutoScrollEnabled && !userManuallyStoppedScrollRef.current) {
      startAutoScrollWithDelay(AUTO_SCROLL_DELAY_MS);
    }
  }, [
    armOneTimeUnlockListener,
    broadcastMusicState,
    initialOpened,
    isAudioEnabled,
    isAutoScrollEnabled,
    startAutoScrollWithDelay,
  ]);

  // Quản lý vòng đời audio khi người dùng chuyển tab hoặc ẩn ứng dụng Zalo/Messenger
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        if (!audio.paused) {
          wasPlayingBeforeHideRef.current = true;
          audio.pause();
          setIsMusicPlaying(false);
          broadcastMusicState(false);
        } else {
          wasPlayingBeforeHideRef.current = false;
        }
        // Khi ẩn tab cũng tạm dừng auto-scroll để không cuộn ngầm
        if (isAutoScrollingRef.current) {
          stopAutoScroll(false);
        }
      } else {
        if (wasPlayingBeforeHideRef.current && !userManuallyPausedMusicRef.current) {
          playAudio();
        }
      }
    };

    const handlePageHide = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        wasPlayingBeforeHideRef.current = true;
        audio.pause();
        setIsMusicPlaying(false);
        broadcastMusicState(false);
      }
    };

    const handlePageShow = () => {
      if (wasPlayingBeforeHideRef.current && !userManuallyPausedMusicRef.current) {
        playAudio();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [broadcastMusicState, playAudio, stopAutoScroll]);

  // Tự động dừng Auto-Scroll thông minh khi khách tương tác (wheel, touch, keydown, focus input, modal)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUserScrollInteraction = () => {
      if (isAutoScrollingRef.current || startScrollTimerRef.current !== null) {
        stopAutoScroll(true);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        [
          "ArrowUp",
          "ArrowDown",
          "PageUp",
          "PageDown",
          "Space",
          "Home",
          "End",
        ].includes(e.code)
      ) {
        if (isAutoScrollingRef.current || startScrollTimerRef.current !== null) {
          stopAutoScroll(true);
        }
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        if (isAutoScrollingRef.current || startScrollTimerRef.current !== null) {
          stopAutoScroll(true);
        }
      }
    };

    const handleModalState = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      if (
        customEvent.detail?.isOpen &&
        (isAutoScrollingRef.current || startScrollTimerRef.current !== null)
      ) {
        stopAutoScroll(true);
      }
    };

    window.addEventListener("wheel", handleUserScrollInteraction, { passive: true, capture: true });
    window.addEventListener("touchstart", handleUserScrollInteraction, { passive: true, capture: true });
    window.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("focusin", handleFocusIn, { passive: true });
    window.addEventListener("inviwedd:modal-state", handleModalState);

    return () => {
      window.removeEventListener("wheel", handleUserScrollInteraction, { capture: true });
      window.removeEventListener("touchstart", handleUserScrollInteraction, { capture: true });
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("inviwedd:modal-state", handleModalState);
    };
  }, [stopAutoScroll]);

  // Dọn dẹp RAF, timer và scroll-behavior khi unmount
  React.useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (startScrollTimerRef.current) {
        clearTimeout(startScrollTimerRef.current);
      }
      if (restoreScrollBehaviorRef.current) {
        restoreScrollBehaviorRef.current();
        restoreScrollBehaviorRef.current = null;
      }
    };
  }, []);

  const contextValue = React.useMemo<InvitationExperienceContextValue>(
    () => ({
      isOpened,
      isMusicPlaying,
      isAutoScrolling,
      musicTitle: musicTitle || "Giai điệu ngày cưới",
      audioAvailable,
      toggleMusic,
      toggleAutoScroll,
      startAutoScroll,
      stopAutoScroll,
      triggerInvitationOpened,
      scrollContainerRef,
    }),
    [
      isOpened,
      isMusicPlaying,
      isAutoScrolling,
      musicTitle,
      audioAvailable,
      toggleMusic,
      toggleAutoScroll,
      startAutoScroll,
      stopAutoScroll,
      triggerInvitationOpened,
      scrollContainerRef,
    ],
  );

  return (
    <InvitationExperienceContext.Provider value={contextValue}>
      {/* 1 thẻ audio trung tâm duy nhất cho toàn bộ template */}
      {!disableAudio && musicSrc && (
        <audio
          ref={audioRef}
          src={musicSrc}
          loop
          preload="auto"
          playsInline
          onError={() => {
            setAudioAvailable(false);
            setIsMusicPlaying(false);
            broadcastMusicState(false);
          }}
        />
      )}

      {children}

      {/* Cụm nút điều khiển nổi (Floating Experience Controls) */}
      {shouldRenderControls && isOpened && (
        <FloatingExperienceControls hideOnDesktop={mode === "guest"} />
      )}
    </InvitationExperienceContext.Provider>
  );
}

/**
 * Cụm nút điều khiển nổi (Floating Experience Controls) góc dưới phải
 * Thiết kế kính mờ sang trọng, tối giản, thích hợp với 100% template thiệp cưới.
 * Tuyệt đối không dùng icon ngôi sao / sparkles.
 */
export function FloatingExperienceControls({
  hideOnDesktop = false,
}: {
  hideOnDesktop?: boolean;
} = {}) {
  const exp = useInvitationExperience();
  if (!exp) return null;

  const {
    isMusicPlaying,
    isAutoScrolling,
    musicTitle,
    audioAvailable,
    toggleMusic,
    toggleAutoScroll,
  } = exp;

  return (
    <nav
      aria-label="Điều khiển trải nghiệm thiệp"
      className={cn(
        "fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2.5 sm:right-6 sm:bottom-6 touch-manipulation",
        hideOnDesktop && "lg:hidden",
      )}
    >
      {/* Nút Auto-Scroll (Bật / Tạm dừng cuộn tự động) */}
      <button
        type="button"
        onClick={toggleAutoScroll}
        aria-pressed={isAutoScrolling}
        aria-label={isAutoScrolling ? "Tạm dừng cuộn tự động" : "Bật cuộn tự động"}
        title={isAutoScrolling ? "Tạm dừng cuộn" : "Cuộn tự động"}
        className={cn(
          "group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border text-xs font-medium shadow-lg backdrop-blur-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 sm:h-12 sm:w-12",
          isAutoScrolling
            ? "border-amber-400/50 bg-stone-900/90 text-amber-300 shadow-[0_4px_16px_rgba(251,191,36,0.25)] hover:bg-stone-900"
            : "border-white/20 bg-stone-900/75 text-stone-300 shadow-md hover:border-white/40 hover:bg-stone-900/90 hover:text-white",
        )}
      >
        {isAutoScrolling ? (
          <div className="relative flex items-center justify-center">
            <span
              aria-hidden="true"
              className="absolute -inset-1 animate-ping rounded-full bg-amber-400/20 motion-reduce:hidden"
            />
            <ChevronsDown className="relative h-5 w-5 animate-bounce motion-reduce:animate-none" aria-hidden="true" />
          </div>
        ) : (
          <ChevronsDown className="h-5 w-5 opacity-75 group-hover:opacity-100" aria-hidden="true" />
        )}
        <span className="pointer-events-none absolute right-full mr-2.5 hidden whitespace-nowrap rounded-lg bg-stone-900/90 px-2.5 py-1 text-xs text-stone-100 shadow-md backdrop-blur-sm sm:group-hover:inline-block">
          {isAutoScrolling ? "Tạm dừng cuộn" : "Cuộn tự động"}
        </span>
      </button>

      {/* Nút Nhạc nền (Play / Pause) */}
      {audioAvailable && (
        <button
          type="button"
          onClick={toggleMusic}
          aria-pressed={isMusicPlaying}
          aria-label={isMusicPlaying ? `Tắt nhạc nền: ${musicTitle}` : `Bật nhạc nền: ${musicTitle}`}
          title={isMusicPlaying ? `Tắt nhạc: ${musicTitle}` : `Bật nhạc: ${musicTitle}`}
          className={cn(
            "group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border text-xs font-medium shadow-lg backdrop-blur-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 sm:h-12 sm:w-12",
            isMusicPlaying
              ? "border-rose-400/50 bg-stone-900/90 text-rose-300 shadow-[0_4px_16px_rgba(244,63,94,0.25)] hover:bg-stone-900"
              : "border-white/20 bg-stone-900/75 text-stone-300 shadow-md hover:border-white/40 hover:bg-stone-900/90 hover:text-white",
          )}
        >
          {isMusicPlaying ? (
            <span className="relative flex items-center justify-center motion-safe:animate-[inv-spin-slow_6s_linear_infinite]">
              <Disc3 className="h-5 w-5" aria-hidden="true" />
            </span>
          ) : (
            <div className="relative flex items-center justify-center">
              <VolumeX className="h-4.5 w-4.5" aria-hidden="true" />
              <Music
                className="absolute -top-1 -right-1.5 h-3 w-3 text-rose-400"
                aria-hidden="true"
              />
            </div>
          )}
          <span className="pointer-events-none absolute right-full mr-2.5 hidden whitespace-nowrap rounded-lg bg-stone-900/90 px-2.5 py-1 text-xs text-stone-100 shadow-md backdrop-blur-sm sm:group-hover:inline-block">
            {isMusicPlaying ? "Tắt nhạc nền" : "Bật nhạc nền"}
          </span>
        </button>
      )}
    </nav>
  );
}
