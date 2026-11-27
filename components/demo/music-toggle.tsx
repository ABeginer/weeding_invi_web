"use client";

import * as React from "react";
import { Disc3, Music, VolumeX } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import { cn } from "@/lib/utils";
import { globalAudio } from "@/lib/global-audio";

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
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasError, setHasError] = React.useState(!src);
  const userManuallyPausedRef = React.useRef(false);

  // Đồng bộ trạng thái từ Global Audio Controller
  React.useEffect(() => {
    setHasError(!src);
    userManuallyPausedRef.current = false;

    return globalAudio.subscribe((state) => {
      if (!src) {
        setIsPlaying(false);
        return;
      }
      const fullTargetUrl = typeof window !== "undefined" ? new URL(src, window.location.href).href : src;
      const isCurSrc = state.src === src || state.src === fullTargetUrl || globalAudio.getAudioElement()?.src === fullTargetUrl;
      setIsPlaying(state.isPlaying && isCurSrc);
    });
  }, [src, resetKey]);

  // Autoplay & 1-time interaction unlock listener qua Global Audio
  React.useEffect(() => {
    if (!src || hasError) return;
    if (!autoPlay || userManuallyPausedRef.current) return;

    globalAudio.play(src, { volume: 0.55 }).then((started) => {
      if (!started && !userManuallyPausedRef.current) {
        const unlockEvents = ["pointerdown", "click", "touchstart", "keydown"] as const;
        const handleFirstInteraction = () => {
          unlockEvents.forEach((ev) =>
            window.removeEventListener(ev, handleFirstInteraction, true),
          );
          if (!userManuallyPausedRef.current && !globalAudio.isPlaying()) {
            globalAudio.play(src, { volume: 0.55 }).catch(() => {});
          }
        };

        unlockEvents.forEach((ev) => {
          window.addEventListener(ev, handleFirstInteraction, { capture: true, once: true });
        });
      }
    });
  }, [src, resetKey, autoPlay, hasError]);

  const handleToggle = () => {
    if (hasError || !src) return;

    if (isPlaying) {
      userManuallyPausedRef.current = true;
      globalAudio.pause();
    } else {
      userManuallyPausedRef.current = false;
      globalAudio.play(src, { volume: 0.55 });
    }
  };

  const disabled = !src || hasError;
  const labelText = isPlaying
    ? LANDING_COPY.demo.musicPauseLabel
    : LANDING_COPY.demo.musicPlayLabel;

  return (
    <div className={cn("inline-flex items-center", className)}>
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
