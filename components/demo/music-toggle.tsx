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
}

export function MusicToggle({
  src,
  title = "Nhạc mẫu",
  resetKey,
  compact = false,
  className,
}: MusicToggleProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);

  // Khi đổi sang mẫu khác thì dừng track cũ, không tự phát nhạc mới
  React.useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setHasError(!src);
  }, [src, resetKey]);

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
      audio.volume = 0.55;
      const playPromise = audio.play();
      if (playPromise) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else {
        setIsPlaying(true);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
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
          preload="none"
          onError={() => {
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
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold focus-visible:ring-offset-2 focus-visible:ring-offset-lnd-bg",
          "disabled:cursor-not-allowed disabled:opacity-50",
          compact ? "h-10 px-3.5 text-xs" : "h-10 px-4 text-xs sm:text-sm",
          isPlaying
            ? "border-lnd-gold bg-lnd-gold-tint font-medium text-lnd-gold"
            : "border-lnd-gold-soft bg-lnd-surface text-lnd-body hover:border-lnd-gold hover:text-lnd-gold"
        )}
      >
        {isPlaying ? (
          <Disc3
            className="h-4 w-4 shrink-0 motion-safe:animate-[inv-spin-slow_6s_linear_infinite]"
            aria-hidden="true"
          />
        ) : src && !hasError ? (
          <Music className="h-4 w-4 shrink-0 text-lnd-gold" aria-hidden="true" />
        ) : (
          <VolumeX className="h-4 w-4 shrink-0 text-lnd-muted" aria-hidden="true" />
        )}
        <span>{labelText}</span>
      </button>
    </div>
  );
}
