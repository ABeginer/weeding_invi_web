"use client";

import * as React from "react";
import { Music, VolumeX } from "lucide-react";

interface LiveMusicFloatingButtonProps {
  src?: string;
  title?: string;
  visible: boolean;
}

export function LiveMusicFloatingButton({
  src,
  title = "Nhạc nền",
  visible,
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
        className="fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-lnd-gold-soft bg-lnd-bg/90 px-3.5 text-xs font-medium text-lnd-gold shadow-lg backdrop-blur-sm transition-colors hover:border-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
      >
        {playing ? (
          <Music className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <VolumeX className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span>{playing ? "Đang phát" : "Bật nhạc"}</span>
      </button>
    </>
  );
}

