"use client";

import * as React from "react";
import { Disc3, Music, VolumeX } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import { cn } from "@/lib/utils";

interface MusicToggleProps {
  src?: string;
  title?: string;
  resetKey?: string;
  compact?: boolean;
  className?: string;
  autoPlay?: boolean;
}

export function MusicToggle({
  src,
  title = "Nhạc mẫu",
  resetKey,
  compact = false,
  className,
  autoPlay = false,
}: MusicToggleProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const userManuallyPausedRef = React.useRef(false);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setHasError(!src);
    userManuallyPausedRef.current = false;
  }, [src, resetKey]);

  // Autoplay & 1-time interaction unlock listener
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src || hasError) return;
    if (!autoPlay || userManuallyPausedRef.current) return;

    audio.volume = 0.55;
    const promise = audio.play();
    if (promise) {
      promise
        .then(() => {
          setIsPlaying(true);
          console.log("[Preview Music] Autoplay started successfully for:", title || src);
        })
        .catch((err) => {
          console.warn("[Preview Music] Autoplay blocked by browser policy, waiting for first user touch:", err);
          const unlockEvents = ["pointerdown", "click", "touchstart", "keydown"] as const;
          const handleFirstInteraction = () => {
            unlockEvents.forEach((ev) =>
              window.removeEventListener(ev, handleFirstInteraction, true),
            );
            if (audioRef.current && !userManuallyPausedRef.current && audioRef.current.paused) {
              audioRef.current.volume = 0.55;
              audioRef.current
                .play()
                .then(() => {
                  setIsPlaying(true);
                  console.log("[Preview Music] Unlocked on user interaction:", title || src);
                })
                .catch((e) => {
                  console.error("[Preview Music] Unlock play failed:", e);
                });
            }
          };

          unlockEvents.forEach((ev) => {
            window.addEventListener(ev, handleFirstInteraction, { capture: true, once: true });
          });
        });
    }
  }, [src, resetKey, autoPlay, hasError, title]);

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (document.hidden && audio && !audio.paused) {
        audio.pause();
        setIsPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleToggle = () => {
    const audio = audioRef.current;
    if (!audio || hasError || !src) return;

    if (audio.paused) {
      userManuallyPausedRef.current = false;
      audio.volume = 0.55;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            console.log("[Preview Music] User manually started music:", title || src);
          })
          .catch((err) => {
            console.error("[Preview Music] Play failed on toggle:", err);
            setIsPlaying(false);
          });
      } else {
        setIsPlaying(true);
      }
    } else {
      userManuallyPausedRef.current = true;
      audio.pause();
      setIsPlaying(false);
      console.log("[Preview Music] User manually paused music.");
    }
  };

  const disabled = !src || hasError;
  const labelText = isPlaying
    ? LANDING_COPY.demo.musicPauseLabel
    : LANDING_COPY.demo.musicPlayLabel;

  return (
    <div className={cn("inline-flex items-center", className)}>
      {src && !hasError && (
        <audio
          ref={audioRef}
          src={src}
          loop
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            console.error("[Preview Music] Audio element error for src:", src, e);
            setHasError(true);
            setIsPlaying(false);
          }}
        />
      )}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-pressed={isPlaying}
        aria-label={`${labelText}: ${title}`}
        title={title}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          "disabled:cursor-not-allowed disabled:opacity-50",
          compact ? "h-10 px-3.5 text-xs" : "h-10 px-4 text-xs sm:text-sm",
          isPlaying
            ? "border-accent bg-accent-soft font-medium text-text"
            : "border-border bg-surface text-text hover:border-accent",
        )}
      >
        {isPlaying ? (
          <Disc3
            className="h-4 w-4 shrink-0 text-text motion-safe:animate-[inv-spin-slow_6s_linear_infinite]"
            aria-hidden="true"
          />
        ) : src && !hasError ? (
          <Music
            className="h-4 w-4 shrink-0 text-accent-text"
            aria-hidden="true"
          />
        ) : (
          <VolumeX
            className="h-4 w-4 shrink-0 text-text-muted"
            aria-hidden="true"
          />
        )}
        <span>{labelText}</span>
      </button>
    </div>
  );
}
