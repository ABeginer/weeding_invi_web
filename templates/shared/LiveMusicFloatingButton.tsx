"use client";

import * as React from "react";
import { Music, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TemplateTone } from "./TemplateOverlays";

interface LiveMusicFloatingButtonProps {
  src?: string;
  title?: string;
  visible: boolean;
  tone?: TemplateTone;
}

export function LiveMusicFloatingButton({
  src,
  title = "Nhạc nền",
  visible,
  tone = "obsidian",
}: LiveMusicFloatingButtonProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [available, setAvailable] = React.useState(Boolean(src));
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => {
    const onHidden = () => {
      if (document.hidden && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, []);

  if (!src || !available || !visible) return null;

  const handleToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.volume = 0.55;
      audio
        .play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const toneClasses =
    tone === "minimal"
      ? "border-[#C6A962] bg-[#FAF7F0] text-[#3F3626] hover:bg-[#EFEAE0] focus-visible:ring-[#706040]"
      : tone === "sunset"
        ? "border-[#D7B3A5] bg-[#FFFBF8] text-[#7A3535] hover:bg-[#F5E6DF] focus-visible:ring-[#7A3535]"
        : "border-lnd-gold-soft bg-lnd-bg text-lnd-gold sm:bg-lnd-bg/90 sm:backdrop-blur-sm hover:border-lnd-gold focus-visible:ring-lnd-gold";

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="none"
        onError={() => {
          setAvailable(false);
          setPlaying(false);
        }}
      />
      <button
        type="button"
        onClick={handleToggle}
        aria-pressed={playing}
        aria-label={playing ? `Tắt nhạc nền: ${title}` : `Bật nhạc nền: ${title}`}
        className={cn(
          "fixed right-3 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 inline-flex h-11 w-11 cursor-pointer items-center justify-center gap-2 rounded-full border text-xs font-medium shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 sm:right-6 sm:bottom-6 sm:w-auto sm:px-3.5",
          toneClasses,
        )}
      >
        {playing ? (
          <Music className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <VolumeX className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span className="hidden sm:inline">
          {playing ? "Đang phát" : "Bật nhạc"}
        </span>
      </button>
    </>
  );
}

