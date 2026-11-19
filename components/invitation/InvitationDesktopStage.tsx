"use client";

import * as React from "react";
import { Disc3, Heart, MapPin, Music, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvitationDesktopStageProps {
  children: React.ReactNode;
  coverPhotoUrl?: string | null;
  coupleLabel?: string;
  hasMusic?: boolean;
  musicTitle?: string;
  className?: string;
}

export function InvitationDesktopStage({
  children,
  coverPhotoUrl,
  coupleLabel,
  hasMusic = false,
  musicTitle = "Nhạc nền",
  className,
}: InvitationDesktopStageProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Lắng nghe trạng thái phát nhạc từ audio player đang active
  React.useEffect(() => {
    const handleMusicState = (e: Event) => {
      const customEvent = e as CustomEvent<{ isPlaying: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.isPlaying === "boolean") {
        setIsPlaying(customEvent.detail.isPlaying);
      }
    };

    window.addEventListener("inviwedd:music-state-change", handleMusicState);
    return () => {
      window.removeEventListener("inviwedd:music-state-change", handleMusicState);
    };
  }, []);

  const handleToggleMusic = () => {
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:toggle-music"));
    } catch {
      // Bỏ qua nếu môi trường không hỗ trợ
    }
  };

  const handleScrollTo = (targetId: string) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      // Fallback: tìm các anchor khác liên quan
      const fallbackEl =
        document.querySelector("[data-section='rsvp']") ||
        document.querySelector("[data-section='events']") ||
        document.querySelector("#gift-box");
      fallbackEl?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#F4EFEA]">
      {/* Ambient Desktop Backdrop (Chỉ hiển thị trên Desktop lg: 1024px+) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 hidden select-none overflow-hidden lg:block z-0"
      >
        {coverPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPhotoUrl}
            alt=""
            className="h-full w-full object-cover opacity-20 blur-3xl scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-[#F4EFEA] via-[#EFE8DF] to-[#F4EFEA]" />
        )}
        <div className="absolute inset-0 bg-[#F4EFEA]/75 backdrop-blur-2xl" />
      </div>

      {/* Centered Editorial Stage (Kích thước chuẩn tạp chí cưới sang trọng) */}
      <div
        className={cn(
          "relative z-10 mx-auto min-h-[100dvh] w-full max-w-[480px] sm:max-w-[520px] bg-white shadow-[0_0_50px_rgba(31,29,26,0.08)] border-x border-[#E8E2D9] overflow-x-hidden",
          className,
        )}
      >
        {children}
      </div>

      {/* Desktop Floating Utility Rail (Tiện ích nhanh cho khách xem trên máy tính) */}
      <nav
        aria-label="Tiện ích nhanh trên máy tính"
        className="fixed right-8 bottom-8 z-40 hidden flex-col items-center gap-3 lg:flex"
      >
        {/* Nút Bật/Tắt nhạc nền */}
        {hasMusic && (
          <button
            type="button"
            onClick={handleToggleMusic}
            aria-label={isPlaying ? `Tắt nhạc: ${musicTitle}` : `Bật nhạc: ${musicTitle}`}
            title={isPlaying ? `Tắt nhạc: ${musicTitle}` : `Bật nhạc: ${musicTitle}`}
            className={cn(
              "group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-[#E8E2D9] bg-white/95 text-[#1F1D1A] shadow-md backdrop-blur-sm transition-all duration-200 hover:border-[#7A1C24] hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]",
              isPlaying && "border-[#7A1C24]/30 text-[#7A1C24]",
            )}
          >
            {isPlaying ? (
              <span className="relative flex items-center justify-center motion-safe:animate-[inv-spin-slow_6s_linear_infinite]">
                <Disc3 className="h-5 w-5" aria-hidden="true" />
              </span>
            ) : (
              <div className="relative flex items-center justify-center">
                <VolumeX className="h-4.5 w-4.5" aria-hidden="true" />
                <Music
                  className="absolute -top-1 -right-1.5 h-3 w-3 text-[#7A1C24]"
                  aria-hidden="true"
                />
              </div>
            )}
            <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-[#1F1D1A] px-2.5 py-1 text-xs text-[#FAF8F5] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
              {isPlaying ? "Tắt nhạc nền" : "Bật nhạc nền"}
            </span>
          </button>
        )}

        {/* Nút Cuộn nhanh tới phần RSVP */}
        <button
          type="button"
          onClick={() => handleScrollTo("rsvp-wishes")}
          aria-label="Cuộn tới phần Xác nhận tham dự"
          title="Xác nhận tham dự"
          className="group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-[#E8E2D9] bg-white/95 text-[#1F1D1A] shadow-md backdrop-blur-sm transition-all duration-200 hover:border-[#7A1C24] hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
        >
          <Heart className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-[#1F1D1A] px-2.5 py-1 text-xs text-[#FAF8F5] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
            Xác nhận tham dự (RSVP)
          </span>
        </button>

        {/* Nút Cuộn nhanh tới phần Địa điểm / Quà mừng */}
        <button
          type="button"
          onClick={() => handleScrollTo("gift-box")}
          aria-label="Cuộn tới phần Quà mừng & Địa điểm"
          title="Địa điểm & Quà mừng"
          className="group relative flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-[#E8E2D9] bg-white/95 text-[#1F1D1A] shadow-md backdrop-blur-sm transition-all duration-200 hover:border-[#7A1C24] hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
        >
          <MapPin className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" aria-hidden="true" />
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-[#1F1D1A] px-2.5 py-1 text-xs text-[#FAF8F5] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
            Địa điểm &amp; Quà mừng
          </span>
        </button>
      </nav>
    </div>
  );
}
