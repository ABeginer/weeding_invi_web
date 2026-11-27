"use client";

import * as React from "react";
import { Disc3, Music, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvitationExperience } from "@/components/invitation/InvitationExperienceProvider";
import type { TemplateTone } from "./TemplateOverlays";

interface LiveMusicFloatingButtonProps {
  src?: string;
  title?: string;
  visible: boolean;
  tone?: TemplateTone;
}

export function LiveMusicFloatingButton(props: LiveMusicFloatingButtonProps) {
  const exp = useInvitationExperience();
  // Nếu đã nằm trong InvitationExperienceProvider, Provider quản lý tập trung
  // 1 thẻ <audio> duy nhất và FloatingExperienceControls (gồm cả nút Nhạc + nút Auto-Scroll),
  // tránh tuyệt đối việc xuất hiện 2 thẻ <audio> hoặc 2 nút nhạc nổi trùng lặp.
  if (exp) {
    return null;
  }

  return <StandaloneLiveMusicFloatingButton {...props} />;
}

function StandaloneLiveMusicFloatingButton({
  src,
  title = "Nhạc nền",
  visible,
  tone = "obsidian",
}: LiveMusicFloatingButtonProps) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const [available, setAvailable] = React.useState(Boolean(src));
  const [playing, setPlaying] = React.useState(false);
  const wasPlayingBeforeHideRef = React.useRef(false);
  const userManuallyMutedRef = React.useRef(false);

  const broadcastMusicState = React.useCallback((isPlaying: boolean) => {
    try {
      window.dispatchEvent(
        new CustomEvent("inviwedd:music-state-change", {
          detail: { isPlaying },
        }),
      );
    } catch {}
  }, []);

  const playAudio = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !available || !src) return;
    try {
      audio.volume = 0.55;
      const promise = audio.play();
      if (promise !== undefined) {
        promise
          .then(() => {
            setPlaying(true);
            broadcastMusicState(true);
          })
          .catch(() => {
            setPlaying(false);
            broadcastMusicState(false);
          });
      } else {
        setPlaying(true);
        broadcastMusicState(true);
      }
    } catch {
      setPlaying(false);
      broadcastMusicState(false);
    }
  }, [available, broadcastMusicState, src]);

  const pauseAudio = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
    broadcastMusicState(false);
  }, [broadcastMusicState]);

  // Lắng nghe sự kiện mở phong bì để phát nhạc ngay lập tức trong user-gesture
  React.useEffect(() => {
    const handleEnvelopeOpen = () => {
      if (!userManuallyMutedRef.current) {
        playAudio();
      }
    };

    window.addEventListener("inviwedd:open-envelope", handleEnvelopeOpen);
    return () => {
      window.removeEventListener("inviwedd:open-envelope", handleEnvelopeOpen);
    };
  }, [playAudio]);

  // Lắng nghe lệnh bật/tắt từ Desktop Floating Utility Rail hoặc các block canvas
  React.useEffect(() => {
    const handleToggleFromExternal = () => {
      const audio = audioRef.current;
      if (!audio || !available) return;
      if (audio.paused) {
        userManuallyMutedRef.current = false;
        playAudio();
      } else {
        userManuallyMutedRef.current = true;
        pauseAudio();
      }
    };

    window.addEventListener("inviwedd:toggle-music", handleToggleFromExternal);
    return () => {
      window.removeEventListener("inviwedd:toggle-music", handleToggleFromExternal);
    };
  }, [available, pauseAudio, playAudio]);

  // Quản lý vòng đời audio khi người dùng chuyển tab hoặc ẩn ứng dụng Zalo/Messenger
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      const audio = audioRef.current;
      if (!audio) return;

      if (document.hidden) {
        if (!audio.paused) {
          wasPlayingBeforeHideRef.current = true;
          audio.pause();
          setPlaying(false);
          broadcastMusicState(false);
        } else {
          wasPlayingBeforeHideRef.current = false;
        }
      } else {
        // Tự động phát lại khi quay trở lại tab/app, TRỪ KHI người dùng đã tự bấm tắt thủ công
        if (wasPlayingBeforeHideRef.current && !userManuallyMutedRef.current) {
          playAudio();
        }
      }
    };

    const handlePageHide = () => {
      const audio = audioRef.current;
      if (audio && !audio.paused) {
        wasPlayingBeforeHideRef.current = true;
        audio.pause();
        setPlaying(false);
        broadcastMusicState(false);
      }
    };

    const handlePageShow = () => {
      if (wasPlayingBeforeHideRef.current && !userManuallyMutedRef.current) {
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
  }, [broadcastMusicState, playAudio]);

  const handleToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      userManuallyMutedRef.current = false;
      playAudio();
    } else {
      userManuallyMutedRef.current = true;
      pauseAudio();
    }
  };

  const toneClasses =
    tone === "minimal"
      ? "border-[#C6A962] bg-[#FAF7F0] text-[#3F3626] hover:bg-[#EFEAE0] focus-visible:ring-[#706040]"
      : tone === "sunset"
        ? "border-[#D7B3A5] bg-[#FFFBF8] text-[#7A3535] hover:bg-[#F5E6DF] focus-visible:ring-[#7A3535]"
        : tone === "red"
          ? "border-[#c9a24a] bg-[#fff7eb] text-[#800000] hover:bg-[#fff1dd] focus-visible:ring-[#800000]"
          : tone === "flowery"
            ? "border-[#464E25]/45 bg-[#FDFAF5] text-[#464E25] hover:bg-[#F1EEE2] focus-visible:ring-[#464E25]"
            : tone === "minbrown"
            ? "border-[#A76B43]/50 bg-white text-[#7E4E2E] hover:bg-[#F4EAE2] focus-visible:ring-[#A76B43]"
            : tone === "minred"
            ? "border-[#E1BC7C]/60 bg-[#1E0101] text-[#E1BC7C] hover:bg-[#2C0102] focus-visible:ring-[#E1BC7C]"
            : tone === "ruby"
            ? "border-[#E5C787]/70 bg-[#390202] text-[#E5C787] hover:bg-[#4A060C] focus-visible:ring-[#E5C787]"
            : tone === "velvet"
            ? "border-[#E9CE91]/70 bg-[#4A0B0A] text-[#E9CE91] hover:bg-[#5A0D0C] focus-visible:ring-[#E9CE91]"
            : "border-lnd-gold-soft bg-lnd-bg text-lnd-gold sm:bg-lnd-bg/90 sm:backdrop-blur-sm hover:border-lnd-gold focus-visible:ring-lnd-gold";

  if (!src || !available) return null;

  return (
    <>
      {/* Audio element luôn được render trong DOM từ đầu để nhận diện user-gesture */}
      <audio
        ref={audioRef}
        src={src}
        loop
        preload="metadata"
        onError={() => {
          setAvailable(false);
          setPlaying(false);
          broadcastMusicState(false);
        }}
      />

      {visible && (
        <button
          type="button"
          onClick={handleToggle}
          aria-pressed={playing}
          aria-label={playing ? `Tắt nhạc nền: ${title}` : `Bật nhạc nền: ${title}`}
          className={cn(
            "fixed right-4 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-40 inline-flex h-11 w-11 cursor-pointer items-center justify-center gap-2 rounded-full border text-xs font-medium shadow-lg transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 sm:right-6 sm:bottom-6 sm:w-auto sm:px-3.5 touch-manipulation",
            toneClasses,
          )}
        >
          {playing ? (
            <span className="relative flex items-center justify-center motion-safe:animate-[inv-spin-slow_6s_linear_infinite]">
              <Disc3 className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            </span>
          ) : (
            <div className="relative flex items-center justify-center">
              <VolumeX className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
              <Music
                className="absolute -top-1 -right-1.5 h-3 w-3 opacity-80"
                aria-hidden="true"
              />
            </div>
          )}
          <span className="hidden sm:inline">
            {playing ? "Đang phát" : "Bật nhạc"}
          </span>
        </button>
      )}
    </>
  );
}
