"use client";

import { Disc3, Music, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWeddingContent } from "./WeddingContentProvider";

interface MusicPlayerProps {
  visible: boolean;
  isPlaying: boolean;
  onToggle: () => void;
}

export function MusicPlayer({
  visible,
  isPlaying,
  onToggle,
}: MusicPlayerProps) {
  const data = useWeddingContent();
  if (!visible) return null;

  return (
    <div className="fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-30 sm:right-6 sm:bottom-6">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={isPlaying}
        aria-label={
          isPlaying
            ? `Tạm dừng nhạc nền: ${data.music.title}`
            : `Phát nhạc nền: ${data.music.title}`
        }
        title={data.music.title}
        className={cn(
          "group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border transition-all duration-200 sm:h-12 sm:w-12",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive-deep focus-visible:ring-offset-2 focus-visible:ring-offset-inv-bg",
          isPlaying
            ? "border-white/70 bg-inv-olive-btn text-white shadow-[0_6px_18px_color-mix(in_srgb,var(--inv-olive-deep)_34%,transparent)] hover:bg-inv-olive-hover"
            : "border-inv-olive/40 bg-inv-cream/95 text-inv-olive-deep shadow-md backdrop-blur-sm hover:bg-inv-tint",
        )}
      >
        {isPlaying ? (
          <>
            <span
              aria-hidden="true"
              className="absolute inset-0 animate-ping rounded-full bg-inv-olive-btn/30 motion-reduce:hidden"
            />
            <span className="relative flex items-center justify-center motion-safe:animate-[inv-spin-slow_6s_linear_infinite]">
              <Disc3 className="h-5 w-5" aria-hidden="true" />
            </span>
          </>
        ) : (
          <div className="relative flex items-center justify-center">
            <VolumeX className="h-4.5 w-4.5" aria-hidden="true" />
            <Music
              className="absolute -top-1 -right-1.5 h-3 w-3 text-inv-olive-btn"
              aria-hidden="true"
            />
          </div>
        )}
      </button>
    </div>
  );
}
