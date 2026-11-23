"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Pause,
  Play,
  QrCode,
} from "lucide-react";
import type { PublicWeddingData } from "@/lib/server/public-wedding";
import type { WeddingPhoto } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LedPhotoWallClientProps {
  wedding: PublicWeddingData;
}

function filterApprovedPhotos(
  allPhotos: WeddingPhoto[],
  content: PublicWeddingData["content"],
): WeddingPhoto[] {
  const approvalMode = content.photoApprovalMode ?? "manual";
  const moderation = content.photoModeration ?? {};

  const albumPhotos = allPhotos.filter((p) => {
    if (p.kind !== "album") return false;
    const status = moderation[p.id];
    if (approvalMode === "auto") {
      return status !== "hidden";
    }
    return status === "approved";
  });

  if (albumPhotos.length > 0) return albumPhotos;

  // Fallback sang ảnh couple / banner nếu chưa có ảnh album đã duyệt
  return allPhotos.filter((p) => p.kind === "couple" || p.kind === "banner");
}

export function LedPhotoWallClient({ wedding }: LedPhotoWallClientProps) {
  const { slug, content, events } = wedding;
  const couple = [content.couple.groomName, content.couple.brideName]
    .filter(Boolean)
    .join(" & ");

  // Initial photos: ưu tiên ảnh album đã duyệt, fallback sang ảnh cưới hoặc cache offline
  const [photos, setPhotos] = React.useState<WeddingPhoto[]>(() => {
    const liveFiltered = filterApprovedPhotos(wedding.photos || [], wedding.content);
    if (liveFiltered.length > 0) return liveFiltered;

    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`inviwedd_led_cache_${slug}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return liveFiltered;
  });

  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [isPlaying, setIsPlaying] = React.useState(true);
  const [speedMs, setSpeedMs] = React.useState<number>(8000);
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string | null>(null);

  // Auto-hide cursor & toolbar sau 3000ms idle
  const [isIdle, setIsIdle] = React.useState(false);
  const idleTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    const handleActivity = () => {
      setIsIdle(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 3000);
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("mousedown", handleActivity);
    window.addEventListener("keydown", handleActivity);
    idleTimerRef.current = setTimeout(() => setIsIdle(true), 3000);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  // Lưu cache offline mỗi khi danh sách ảnh thay đổi
  React.useEffect(() => {
    if (photos.length > 0 && typeof window !== "undefined") {
      try {
        localStorage.setItem(`inviwedd_led_cache_${slug}`, JSON.stringify(photos));
      } catch {}
    }
  }, [photos, slug]);

  // Sinh mã QR dẫn tới trang album/gửi ảnh của khách (/a/[slug])
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const albumUrl = `${window.location.origin}/a/${slug}`;
    import("qrcode")
      .then((mod) =>
        mod.default.toDataURL(albumUrl, {
          width: 300,
          margin: 1,
          color: { dark: "#1F1D1A", light: "#FAF8F5" },
        }),
      )
      .then((url) => setQrCodeDataUrl(url))
      .catch(() => {});
  }, [slug]);

  // Slideshow timer
  React.useEffect(() => {
    if (!isPlaying || photos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, speedMs);
    return () => clearInterval(interval);
  }, [isPlaying, photos.length, speedMs]);

  // 15s polling tự động tải ảnh mới được duyệt mà không cần reload trình duyệt (offline-resilient, guard document.hidden)
  React.useEffect(() => {
    const pollPhotos = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await fetch(`/api/public/wedding/${encodeURIComponent(slug)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data: PublicWeddingData = await res.json();
          const nextList = filterApprovedPhotos(data.photos || [], data.content);
          if (nextList.length > 0) {
            setPhotos(nextList);
          }
        }
      } catch {
        // Mạng sảnh tiệc chập chờn / rớt Wi-Fi: im lặng bỏ qua, tiếp tục phát ảnh từ state / cache
      }
    };

    const pollInterval = setInterval(pollPhotos, 15000);

    const onVisibilityChange = () => {
      if (typeof document !== "undefined" && !document.hidden) {
        void pollPhotos();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    return () => {
      clearInterval(pollInterval);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    };
  }, [slug]);

  // Lắng nghe thay đổi Fullscreen
  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const currentPhoto = photos[currentIndex];
  const primaryDate = events?.[0]?.startsAt || content.date;
  const dateFormatted = primaryDate ? primaryDate.slice(0, 10).split("-").reverse().join(".") : "";

  return (
    <main
      className={cn(
        "relative h-[100dvh] w-screen overflow-hidden bg-[#141210] text-[#FAF8F5] select-none transition-all",
        isIdle && "cursor-none",
      )}
    >
      {/* Top Header - Tối giản, thanh lịch */}
      <header
        className={cn(
          "absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-6 bg-gradient-to-b from-[#141210]/90 to-transparent pointer-events-none transition-opacity duration-500",
          isIdle ? "opacity-30" : "opacity-100",
        )}
      >
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-wide text-[#FAF8F5]/95 drop-shadow-md sm:text-3xl">
            {couple}
          </h1>
          {dateFormatted && (
            <p className="mt-0.5 text-xs tracking-widest text-[#B89B72] uppercase font-medium">
              {dateFormatted}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#FAF8F5]/70 uppercase">
          <span className="h-2 w-2 rounded-full bg-[#B89B72] animate-pulse" />
          <span>Live Photo Wall</span>
        </div>
      </header>

      {/* Operator Toolbar (Ẩn khi idle, hiện khi di chuột) */}
      <div
        className={cn(
          "absolute top-6 right-8 z-40 flex items-center gap-2 rounded-full border border-white/10 bg-[#1F1D1A]/85 px-4 py-2 backdrop-blur-md shadow-xl transition-all duration-300",
          isIdle ? "opacity-0 pointer-events-none" : "opacity-90 hover:opacity-100",
        )}
      >
        <button
          type="button"
          onClick={handlePrev}
          className="cursor-pointer rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          title="Ảnh trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => setIsPlaying((prev) => !prev)}
          className="cursor-pointer rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          title={isPlaying ? "Tạm dừng" : "Tiếp tục phát"}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="cursor-pointer rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          title="Ảnh kế tiếp"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Speed toggle */}
        <div className="mx-1 h-3.5 w-[1px] bg-white/20" />
        <div className="flex items-center gap-1 text-[11px] font-medium text-white/70">
          {[
            { label: "5s", ms: 5000 },
            { label: "8s", ms: 8000 },
            { label: "12s", ms: 12000 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setSpeedMs(item.ms)}
              className={`cursor-pointer rounded px-1.5 py-0.5 transition-colors ${
                speedMs === item.ms
                  ? "bg-[#7A1C24] text-white font-bold"
                  : "hover:bg-white/10"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mx-1 h-3.5 w-[1px] bg-white/20" />
        <button
          type="button"
          onClick={toggleFullscreen}
          className="cursor-pointer rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Slideshow Area */}
      {photos.length === 0 ? (
        // Empty State: Chưa có ảnh nào, hiển thị lời chào và QR lớn mời gửi ảnh
        <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md rounded-3xl border border-[#FAF8F5]/10 bg-[#1F1D1A]/80 p-8 shadow-2xl backdrop-blur-md">
            <h2 className="font-serif text-3xl font-bold text-[#FAF8F5]">
              {couple}
            </h2>
            <p className="mt-2 text-sm text-[#B89B72]">
              Chào mừng bạn đến với ngày chung đôi!
            </p>

            <div className="my-6 flex justify-center">
              {qrCodeDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrCodeDataUrl}
                  alt="QR Gửi ảnh tiệc cưới"
                  className="h-48 w-48 rounded-2xl border-4 border-[#FAF8F5] p-2 bg-[#FAF8F5] shadow-lg"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-white/5">
                  <QrCode className="h-16 w-16 text-[#B89B72]" />
                </div>
              )}
            </div>

            <p className="text-base font-semibold text-[#FAF8F5]">
              Quét mã QR để gửi những bức ảnh đầu tiên lên màn hình!
            </p>
          </div>
        </div>
      ) : (
        // Active Slideshow
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
          {/* Blurred Background Layer (Cho ảnh dọc/ảnh không vừa tỉ lệ 16:9, xoá sổ thanh đen) */}
          {currentPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`bg-${currentPhoto.id}`}
              src={currentPhoto.url}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover opacity-25 blur-3xl scale-110 transition-opacity duration-700 ease-luxury"
            />
          )}

          {/* Sharp Centered Foreground Image */}
          {currentPhoto && (
            <div
              key={`fg-${currentPhoto.id}`}
              className="relative z-10 flex h-[82vh] w-[90vw] items-center justify-center animate-[fadeIn_700ms_cubic-bezier(0.22,1,0.36,1)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentPhoto.url}
                alt={`Ảnh tiệc cưới ${currentIndex + 1}`}
                className="max-h-full max-w-full rounded-2xl object-contain shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10 transition-transform duration-700 ease-luxury"
              />
            </div>
          )}

          {/* Bottom-left photo counter */}
          <div className="absolute bottom-8 left-8 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-[#1F1D1A]/70 px-4 py-1.5 text-xs text-[#FAF8F5]/80 backdrop-blur-sm">
            <span className="font-mono font-semibold text-[#B89B72]">
              {currentIndex + 1}
            </span>
            <span className="text-white/40">/</span>
            <span className="font-mono">{photos.length}</span>
          </div>
        </div>
      )}

      {/* Persistent Corner QR Card (Góc dưới bên phải màn hình LED) */}
      <aside className="absolute bottom-8 right-8 z-30 flex items-center gap-3.5 rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-3.5 text-[#1F1D1A] shadow-2xl backdrop-blur-md transition-transform hover:scale-[1.02]">
        {qrCodeDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrCodeDataUrl}
            alt="Quét QR gửi ảnh"
            className="h-20 w-20 rounded-xl border border-[#E8E2D9] p-1 bg-white"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-black/5">
            <QrCode className="h-8 w-8 text-[#7A1C24]" />
          </div>
        )}
        <div className="max-w-[170px]">
          <p className="text-xs font-bold leading-tight text-[#7A1C24]">
            Quét QR để gửi ảnh lên màn hình!
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-[#6B655E]">
            Chia sẻ khoảnh khắc cùng cô dâu chú rể ngay tại sảnh tiệc.
          </p>
        </div>
      </aside>
    </main>
  );
}
