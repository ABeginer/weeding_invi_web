"use client";

import * as React from "react";
import { invitationThemeCssVars } from "@/lib/theme";
import { Envelope } from "./Envelope";
import { MusicPlayer } from "./MusicPlayer";
import { useInvitationContained, useWeddingContent } from "./WeddingContentProvider";

interface InvitationShellProps {
  guestName?: string | null;
  children: React.ReactNode;
  contained?: boolean;
  externalMusicControl?: boolean;
  initialOpened?: boolean;
  onOpenedChange?: (opened: boolean) => void;
}

const TARGET_VOLUME = 0.6;
const FADE_DURATION_MS = 2000;
const ENVELOPE_DISMISS_MS = 2100;

export function InvitationShell({
  guestName,
  children,
  contained: containedProp,
  externalMusicControl = false,
  initialOpened = false,
  onOpenedChange,
}: InvitationShellProps) {
  const wedding = useWeddingContent();
  const contextContained = useInvitationContained();
  const contained = containedProp ?? contextContained;
  const [envelopeDismissed, setEnvelopeDismissed] = React.useState(initialOpened);
  const [isOpened, setIsOpened] = React.useState(initialOpened);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audioAvailable, setAudioAvailable] = React.useState(
    Boolean(wedding.music?.src)
  );

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = React.useRef<number | null>(null);
  const autoScrollStoppedRef = React.useRef(false);

  const clearFade = React.useCallback(() => {
    if (fadeTimerRef.current !== null) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const startFadeIn = React.useCallback(
    (audio: HTMLAudioElement) => {
      clearFade();
      audio.volume = 0.04;
      const startTime = performance.now();
      fadeTimerRef.current = window.setInterval(() => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(1, elapsed / FADE_DURATION_MS);
        audio.volume = Number(
          (0.04 + (TARGET_VOLUME - 0.04) * progress).toFixed(3)
        );
        if (progress >= 1) {
          clearFade();
        }
      }, 60);
    },
    [clearFade]
  );

  const playAudio = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioAvailable || !wedding.music?.src) return;

    try {
      audio.volume = 0.04;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            startFadeIn(audio);
          })
          .catch(() => {
            // Trình duyệt chặn hoặc thiếu file nhạc: giữ trang hoạt động bình thường
            setIsPlaying(false);
            if (audio.error) {
              setAudioAvailable(false);
            }
          });
      } else {
        setIsPlaying(true);
        startFadeIn(audio);
      }
    } catch {
      setIsPlaying(false);
    }
  }, [audioAvailable, startFadeIn, wedding.music?.src]);

  const handleOpenEnvelope = React.useCallback(() => {
    setIsOpened(true);
    onOpenedChange?.(true);
    if (!externalMusicControl) {
      playAudio();
    }

    const isReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.setTimeout(
      () => {
        setEnvelopeDismissed(true);
        if (!contained) {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      },
      isReducedMotion ? 320 : ENVELOPE_DISMISS_MS
    );
  }, [contained, externalMusicControl, onOpenedChange, playAudio]);

  const handleToggleMusic = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioAvailable) return;

    if (audio.paused) {
      playAudio();
    } else {
      clearFade();
      audio.pause();
      setIsPlaying(false);
    }
  }, [audioAvailable, clearFade, playAudio]);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden && !audio.paused) {
        clearFade();
        audio.pause();
        setIsPlaying(false);
      }
    };

    const handlePageHide = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        clearFade();
        audio.pause();
        setIsPlaying(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      clearFade();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [clearFade]);

  React.useEffect(() => {
    const config = wedding.autoScroll;
    if (
      contained ||
      !envelopeDismissed ||
      !config?.enabled ||
      autoScrollStoppedRef.current
    ) {
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );
    if (reducedMotionQuery.matches) {
      return;
    }

    const rootEl = document.documentElement;
    const prevScrollBehavior = rootEl.style.scrollBehavior;
    let active = true;
    let rafId: number | null = null;
    let delayTimerId: number | null = null;
    let lastTimestamp: number | null = null;
    let virtualY = window.scrollY;
    let lastAppliedY = -1;
    let scrollBehaviorOverridden = false;

    const SCROLL_INTERRUPT_KEYS = new Set([
      "ArrowDown",
      "ArrowUp",
      "PageDown",
      "PageUp",
      "Home",
      "End",
      " ",
      "Spacebar",
    ]);

    const cleanup = (markStopped: boolean) => {
      if (!active) return;
      active = false;
      if (markStopped) {
        autoScrollStoppedRef.current = true;
      }
      if (delayTimerId !== null) {
        window.clearTimeout(delayTimerId);
        delayTimerId = null;
      }
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (scrollBehaviorOverridden) {
        rootEl.style.scrollBehavior = prevScrollBehavior;
        scrollBehaviorOverridden = false;
      }
      window.removeEventListener("touchstart", handleUserInterrupt);
      window.removeEventListener("pointerdown", handleUserInterrupt);
      window.removeEventListener("wheel", handleUserInterrupt);
      window.removeEventListener("keydown", handleKeyInterrupt);
      document.removeEventListener("visibilitychange", handleVisibilityReset);
    };

    function handleUserInterrupt() {
      cleanup(true);
    }

    function handleKeyInterrupt(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTypingTarget =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        Boolean(target?.isContentEditable);

      if (isTypingTarget || SCROLL_INTERRUPT_KEYS.has(event.key)) {
        cleanup(true);
      }
    }

    function handleVisibilityReset() {
      lastTimestamp = null;
    }

    const step = (timestamp: number) => {
      if (!active) return;

      if (document.hidden || reducedMotionQuery.matches) {
        lastTimestamp = null;
        if (reducedMotionQuery.matches) {
          cleanup(true);
          return;
        }
        rafId = window.requestAnimationFrame(step);
        return;
      }

      if (lastTimestamp === null) {
        lastTimestamp = timestamp;
        virtualY = window.scrollY;
        rafId = window.requestAnimationFrame(step);
        return;
      }

      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.064);
      lastTimestamp = timestamp;

      const maxScrollY = Math.max(0, rootEl.scrollHeight - window.innerHeight);
      if (maxScrollY <= 0) {
        cleanup(true);
        return;
      }

      virtualY = Math.min(maxScrollY, virtualY + config.speedPxPerSec * dt);
      if (
        lastAppliedY < 0 ||
        Math.abs(virtualY - lastAppliedY) >= 0.35 ||
        virtualY >= maxScrollY
      ) {
        window.scrollTo(0, virtualY);
        lastAppliedY = virtualY;
      }

      if (virtualY >= maxScrollY) {
        cleanup(true);
        return;
      }

      rafId = window.requestAnimationFrame(step);
    };

    window.addEventListener("touchstart", handleUserInterrupt, { passive: true });
    window.addEventListener("pointerdown", handleUserInterrupt, {
      passive: true,
    });
    window.addEventListener("wheel", handleUserInterrupt, { passive: true });
    window.addEventListener("keydown", handleKeyInterrupt);
    document.addEventListener("visibilitychange", handleVisibilityReset);

    delayTimerId = window.setTimeout(() => {
      if (!active) return;
      rootEl.style.scrollBehavior = "auto";
      scrollBehaviorOverridden = true;
      virtualY = window.scrollY;
      rafId = window.requestAnimationFrame(step);
    }, config.startDelayMs);

    return () => {
      cleanup(false);
    };
  }, [contained, envelopeDismissed, wedding.autoScroll]);

  return (
    <div
      style={invitationThemeCssVars as React.CSSProperties}
      className={
        contained
          ? envelopeDismissed
            ? "invitation-theme relative min-h-full bg-inv-bg text-inv-ink"
            : "invitation-theme relative h-full overflow-hidden bg-inv-bg text-inv-ink"
          : envelopeDismissed
            ? "invitation-theme relative min-h-dvh bg-inv-bg text-inv-ink"
            : "invitation-theme relative h-dvh max-h-full overflow-hidden bg-inv-bg text-inv-ink"
      }
    >
      {!externalMusicControl && wedding.music?.src && audioAvailable && (
        <audio
          ref={audioRef}
          src={wedding.music.src}
          loop
          preload="none"
          onError={() => {
            clearFade();
            setAudioAvailable(false);
            setIsPlaying(false);
          }}
        />
      )}

      {!envelopeDismissed && (
        <Envelope
          guestName={guestName}
          contained={contained}
          onOpen={handleOpenEnvelope}
        />
      )}

      {/* Khung tờ thiệp chuẩn 500px căn giữa trên màn hình lớn, tràn viền trên di động */}
      <div
        aria-hidden={!isOpened}
        className={
          contained
            ? envelopeDismissed
              ? "mx-auto min-h-full w-full overflow-x-clip bg-inv-bg opacity-100"
              : isOpened
                ? "mx-auto min-h-full w-full overflow-x-clip bg-inv-bg opacity-100 transition-[opacity,transform] duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:duration-300"
                : "pointer-events-none mx-auto h-full w-full overflow-hidden bg-inv-bg opacity-0"
            : envelopeDismissed
              ? "mx-auto min-h-dvh w-full max-w-[500px] overflow-x-clip bg-inv-bg opacity-100 md:shadow-[0_0_50px_color-mix(in_srgb,var(--inv-olive-deep)_12%,transparent)]"
              : isOpened
                ? "mx-auto min-h-dvh w-full max-w-[500px] overflow-x-clip bg-inv-bg opacity-100 transition-[opacity,transform] duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-opacity motion-reduce:duration-300 md:shadow-[0_0_50px_color-mix(in_srgb,var(--inv-olive-deep)_12%,transparent)]"
                : "pointer-events-none mx-auto h-dvh w-full max-w-[500px] overflow-hidden bg-inv-bg opacity-0 motion-safe:translate-y-4"
        }
      >
        {children}
      </div>

      {!externalMusicControl && (
        <MusicPlayer
          visible={isOpened && audioAvailable}
          isPlaying={isPlaying}
          onToggle={handleToggleMusic}
        />
      )}
    </div>
  );
}
