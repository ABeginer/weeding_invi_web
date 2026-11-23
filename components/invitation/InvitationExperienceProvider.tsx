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
}

const SPEED_PX_PER_SEC = 42; // Tốc độ cuộn trang trọng 42px / giây
const AUTO_SCROLL_DELAY_MS = 1100; // Trì hoãn 1.1s sau khi mở thiệp

export function InvitationExperienceProvider({
  children,
  musicSrc,
  musicTitle = "Giai điệu ngày cưới",
  mode = "guest",
  initialOpened = false,
  onOpenedChange,
  scrollContainerRef,
  showFloatingControls,
}: InvitationExperienceProviderProps) {
  const isEnabled = mode === "guest" || mode === "standalone-preview";
  const shouldRenderControls =
    showFloatingControls ?? (mode === "guest" || mode === "standalone-preview");

  const [isOpened, setIsOpened] = React.useState<boolean>(Boolean(initialOpened));
  const [isMusicPlaying, setIsMusicPlaying] = React.useState<boolean>(false);
  const [isAutoScrolling, setIsAutoScrolling] = React.useState<boolean>(false);
  const [audioAvailable, setAudioAvailable] = React.useState<boolean>(Boolean(musicSrc));

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const userManuallyPausedMusicRef = React.useRef<boolean>(false);
  const userManuallyStoppedScrollRef = React.useRef<boolean>(false);
  const wasPlayingBeforeHideRef = React.useRef<boolean>(false);

  const isAutoScrollingRef = React.useRef<boolean>(false);
  const rafIdRef = React.useRef<number | null>(null);
  const lastTimeRef = React.useRef<number>(0);
  const accumulatorRef = React.useRef<number>(0);
  const startScrollTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cập nhật audioAvailable khi đổi link nhạc
  React.useEffect(() => {
    setAudioAvailable(Boolean(musicSrc));
  }, [musicSrc]);

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
    } catch {}
  }, []);

  // Broadcast trạng thái auto-scroll
  const broadcastAutoScrollState = React.useCallback((scrolling: boolean) => {
    try {
      window.dispatchEvent(
        new CustomEvent("inviwedd:autoscroll-state-change", {
          detail: { isAutoScrolling: scrolling },
        }),
      );
    } catch {}
  }, []);

  // Phát nhạc
  const playAudio = React.useCallback(() => {
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
          .catch(() => {});
      }
    };
    unlockEvents.forEach((ev) => {
      window.addEventListener(ev, handleFirstInteraction, { capture: true, once: true });
    });
  }, [broadcastMusicState]);

  // Dừng Auto-Scroll
  const stopAutoScroll = React.useCallback(
    (manual = false) => {
      if (manual) {
        userManuallyStoppedScrollRef.current = true;
      }
      isAutoScrollingRef.current = false;
      setIsAutoScrolling(false);
      broadcastAutoScrollState(false);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (startScrollTimerRef.current) {
        clearTimeout(startScrollTimerRef.current);
        startScrollTimerRef.current = null;
      }
    },
    [broadcastAutoScrollState],
  );

  // Bắt đầu Auto-Scroll với Float Accumulator (chuẩn 60fps / 120Hz)
  const startAutoScroll = React.useCallback(() => {
    if (isAutoScrollingRef.current) return;
    userManuallyStoppedScrollRef.current = false;
    isAutoScrollingRef.current = true;
    setIsAutoScrolling(true);
    broadcastAutoScrollState(true);
    lastTimeRef.current = 0;
    accumulatorRef.current = 0;

    const container = scrollContainerRef?.current;

    const step = (currentTime: number) => {
      if (!isAutoScrollingRef.current) return;
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaSec = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      // Giới hạn deltaSec tối đa 0.1s để chống giật khi chuyển tab
      const safeDelta = Math.min(deltaSec, 0.1);
      accumulatorRef.current += SPEED_PX_PER_SEC * safeDelta;

      const pixelsToScroll = Math.floor(accumulatorRef.current);
      if (pixelsToScroll >= 1) {
        accumulatorRef.current -= pixelsToScroll;

        if (container) {
          container.scrollBy({ top: pixelsToScroll, behavior: "instant" as ScrollBehavior });
          const isAtBottom =
            container.scrollTop + container.clientHeight >= container.scrollHeight - 4;
          if (isAtBottom) {
            stopAutoScroll(false);
            return;
          }
        } else if (typeof window !== "undefined") {
          window.scrollBy({ top: pixelsToScroll, behavior: "instant" as ScrollBehavior });
          const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
          const clientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
          const scrollHeight =
            document.documentElement.scrollHeight || document.body.scrollHeight || 0;
          const isAtBottom = scrollTop + clientHeight >= scrollHeight - 4;
          if (isAtBottom) {
            stopAutoScroll(false);
            return;
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(step);
    };

    rafIdRef.current = requestAnimationFrame(step);
  }, [broadcastAutoScrollState, scrollContainerRef, stopAutoScroll]);

  // Bắt đầu Auto-Scroll có độ trễ
  const startAutoScrollWithDelay = React.useCallback(
    (delayMs = AUTO_SCROLL_DELAY_MS) => {
      if (startScrollTimerRef.current) {
        clearTimeout(startScrollTimerRef.current);
      }
      startScrollTimerRef.current = setTimeout(() => {
        startAutoScroll();
      }, delayMs);
    },
    [startAutoScroll],
  );

  // Toggle Auto-Scroll thủ công
  const toggleAutoScroll = React.useCallback(() => {
    if (isAutoScrollingRef.current) {
      stopAutoScroll(true);
    } else {
      userManuallyStoppedScrollRef.current = false;
      const container = scrollContainerRef?.current;
      let isAtBottom = false;
      if (container) {
        isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 8;
      } else if (typeof window !== "undefined") {
        const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        const clientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        const scrollHeight =
          document.documentElement.scrollHeight || document.body.scrollHeight || 0;
        isAtBottom = scrollTop + clientHeight >= scrollHeight - 8;
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
  }, [scrollContainerRef, startAutoScroll, stopAutoScroll]);

  // Trigger mở thiệp đồng bộ (Synchronous Gesture Unlock)
  const triggerInvitationOpened = React.useCallback(() => {
    setIsOpened(true);
    onOpenedChange?.(true);

    if (isEnabled && audioRef.current && musicSrc && !userManuallyPausedMusicRef.current) {
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

    if (isEnabled && !userManuallyStoppedScrollRef.current) {
      startAutoScrollWithDelay(AUTO_SCROLL_DELAY_MS);
    }
  }, [
    armOneTimeUnlockListener,
    broadcastMusicState,
    isEnabled,
    musicSrc,
    onOpenedChange,
    startAutoScrollWithDelay,
  ]);

  // Lắng nghe sự kiện mở phong bì toàn cục (inviwedd:open-envelope)
  React.useEffect(() => {
    const handleEnvelopeOpen = () => {
      triggerInvitationOpened();
    };
    window.addEventListener("inviwedd:open-envelope", handleEnvelopeOpen);
    return () => {
      window.removeEventListener("inviwedd:open-envelope", handleEnvelopeOpen);
    };
  }, [triggerInvitationOpened]);

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

  // Lắng nghe lệnh bật/tắt autoscroll từ bên ngoài
  React.useEffect(() => {
    const handleToggleScrollFromExternal = () => {
      toggleAutoScroll();
    };
    window.addEventListener("inviwedd:toggle-autoscroll", handleToggleScrollFromExternal);
    return () => {
      window.removeEventListener("inviwedd:toggle-autoscroll", handleToggleScrollFromExternal);
    };
  }, [toggleAutoScroll]);

  // Tự động unlock âm thanh & auto-scroll nếu template mở sẵn (initialOpened = true)
  React.useEffect(() => {
    if (isEnabled && initialOpened && !userManuallyPausedMusicRef.current) {
      if (audioRef.current && audioRef.current.paused) {
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
      if (!userManuallyStoppedScrollRef.current) {
        startAutoScrollWithDelay(1400);
      }
    }
  }, [armOneTimeUnlockListener, broadcastMusicState, initialOpened, isEnabled, startAutoScrollWithDelay]);

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
      if (isAutoScrollingRef.current) {
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
        if (isAutoScrollingRef.current) {
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
        if (isAutoScrollingRef.current) {
          stopAutoScroll(true);
        }
      }
    };

    const handleModalState = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      if (customEvent.detail?.isOpen && isAutoScrollingRef.current) {
        stopAutoScroll(true);
      }
    };

    window.addEventListener("wheel", handleUserScrollInteraction, { passive: true });
    window.addEventListener("touchstart", handleUserScrollInteraction, { passive: true });
    window.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("focusin", handleFocusIn, { passive: true });
    window.addEventListener("inviwedd:modal-state", handleModalState);

    return () => {
      window.removeEventListener("wheel", handleUserScrollInteraction);
      window.removeEventListener("touchstart", handleUserScrollInteraction);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("inviwedd:modal-state", handleModalState);
    };
  }, [stopAutoScroll]);

  // Dọn dẹp RAF và timer khi unmount
  React.useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (startScrollTimerRef.current) {
        clearTimeout(startScrollTimerRef.current);
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
      {musicSrc && (
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
        <FloatingExperienceControls />
      )}
    </InvitationExperienceContext.Provider>
  );
}

/**
 * Cụm nút điều khiển nổi (Floating Experience Controls) góc dưới phải
 * Thiết kế kính mờ sang trọng, tối giản, thích hợp với 100% template thiệp cưới.
 * Tuyệt đối không dùng icon ngôi sao / sparkles.
 */
export function FloatingExperienceControls() {
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
      className="fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 flex flex-col items-center gap-2.5 sm:right-6 sm:bottom-6 touch-manipulation"
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
