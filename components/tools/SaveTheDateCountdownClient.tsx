"use client";

import * as React from "react";
import {
  Check,
  Copy,
  Download,
  ImagePlus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { SmartToolCta } from "@/components/tools/SmartToolCta";
import {
  buildSaveTheDateCaption,
  CARD_ASPECTS,
  CARD_THEMES,
  computeWeddingCountdown,
  drawSaveTheDateCard,
  getDefaultUpcomingWeddingIso,
  type CardAspectId,
  type CardThemeId,
  type SaveTheDateConfig,
} from "@/lib/save-the-date-card";
import { cn } from "@/lib/utils";

const EYEBROW_PRESETS = [
  "SAVE THE DATE",
  "TRÂN TRỌNG BÁO HỶ",
  "CHÍNH THỨC VỀ CHUNG MỘT NHÀ",
] as const;

export function SaveTheDateCountdownClient() {
  const [config, setConfig] = React.useState<SaveTheDateConfig>(() => ({
    groomName: "Minh Hoàng",
    brideName: "Thu Hà",
    weddingDate: getDefaultUpcomingWeddingIso(42),
    venueCity: "TP. Hồ Chí Minh",
    eyebrowText: "SAVE THE DATE",
    aspect: "story-9-16",
    theme: "cream-gold",
  }));
  const [photoSrc, setPhotoSrc] = React.useState<string | null>(null);
  const [loadedPhoto, setLoadedPhoto] = React.useState<HTMLImageElement | null>(null);
  const [copiedCaption, setCopiedCaption] = React.useState(false);
  const [downloaded, setDownloaded] = React.useState(false);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const objectUrlRef = React.useRef<string | null>(null);

  const countdown = React.useMemo(
    () => computeWeddingCountdown(config.weddingDate),
    [config.weddingDate],
  );

  const caption = React.useMemo(
    () => buildSaveTheDateCaption(config, countdown),
    [config, countdown],
  );

  const aspectSpec = CARD_ASPECTS[config.aspect];

  React.useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = aspectSpec.width;
    canvas.height = aspectSpec.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawSaveTheDateCard(ctx, config, countdown, loadedPhoto);
  }, [aspectSpec.height, aspectSpec.width, config, countdown, loadedPhoto]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPhotoSrc(url);

    const img = new window.Image();
    img.onload = () => {
      setLoadedPhoto(img);
    };
    img.onerror = () => {
      setLoadedPhoto(null);
    };
    img.src = url;
  };

  const clearPhoto = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPhotoSrc(null);
    setLoadedPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `save-the-date-${config.aspect}.png`;
    link.href = dataUrl;
    link.click();
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 2200);
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopiedCaption(true);
      window.setTimeout(() => setCopiedCaption(false), 2200);
    } catch {
      // Clipboard fallback ignored silently
    }
  };

  const handleReset = () => {
    clearPhoto();
    setConfig({
      groomName: "Minh Hoàng",
      brideName: "Thu Hà",
      weddingDate: getDefaultUpcomingWeddingIso(42),
      venueCity: "TP. Hồ Chí Minh",
      eyebrowText: "SAVE THE DATE",
      aspect: "story-9-16",
      theme: "cream-gold",
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:items-start">
        {/* Left: Live Form Controls */}
        <section
          aria-label="Thông tin tạo ảnh Save the Date và đếm ngược ngày cưới"
          className="rounded-2xl border border-[#E8E2D9] bg-white p-5 sm:p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E8E2D9] pb-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
                TÙY CHỈNH TRỰC TIẾP
              </p>
              <h2 className="font-serif text-xl font-medium text-[#1F1D1A]">
                Điền thông tin &amp; xem ảnh cập nhật tức thì
              </h2>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-[#FAF8F5] px-3 py-1.5 text-xs font-medium text-[#6B655E] transition-colors hover:border-[#7A1C24]/40 hover:text-[#1F1D1A]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Làm mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="std-groom"
                className="block text-xs font-semibold text-[#1F1D1A]"
              >
                Tên Chú rể
              </label>
              <input
                id="std-groom"
                type="text"
                maxLength={40}
                value={config.groomName}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, groomName: e.target.value }))
                }
                placeholder="Ví dụ: Minh Hoàng"
                className="mt-1.5 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="std-bride"
                className="block text-xs font-semibold text-[#1F1D1A]"
              >
                Tên Cô dâu
              </label>
              <input
                id="std-bride"
                type="text"
                maxLength={40}
                value={config.brideName}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, brideName: e.target.value }))
                }
                placeholder="Ví dụ: Thu Hà"
                className="mt-1.5 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="std-date"
                className="block text-xs font-semibold text-[#1F1D1A]"
              >
                Ngày cưới dự kiến
              </label>
              <input
                id="std-date"
                type="date"
                value={config.weddingDate}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, weddingDate: e.target.value }))
                }
                className="mt-1.5 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="std-city"
                className="block text-xs font-semibold text-[#1F1D1A]"
              >
                Địa điểm / Thành phố (tùy chọn)
              </label>
              <input
                id="std-city"
                type="text"
                maxLength={60}
                value={config.venueCity}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, venueCity: e.target.value }))
                }
                placeholder="Ví dụ: TP. Hồ Chí Minh"
                className="mt-1.5 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none"
              />
            </div>
          </div>

          {/* Eyebrow text */}
          <div>
            <label
              htmlFor="std-eyebrow"
              className="block text-xs font-semibold text-[#1F1D1A]"
            >
              Dòng tiêu đề nhỏ phía trên
            </label>
            <input
              id="std-eyebrow"
              type="text"
              maxLength={40}
              value={config.eyebrowText}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, eyebrowText: e.target.value }))
              }
              className="mt-1.5 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#1F1D1A] focus:border-[#7A1C24] focus:outline-none"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {EYEBROW_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setConfig((prev) => ({ ...prev, eyebrowText: preset }))
                  }
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                    config.eyebrowText === preset
                      ? "border-[#7A1C24] bg-[#7A1C24]/10 text-[#7A1C24]"
                      : "border-[#E8E2D9] bg-[#FAF8F5] text-[#6B655E] hover:text-[#1F1D1A]",
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Aspect ratio toggle */}
          <div>
            <p className="text-xs font-semibold text-[#1F1D1A]">
              Khung hình xuất ảnh
            </p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(Object.keys(CARD_ASPECTS) as CardAspectId[]).map((aspectId) => {
                const item = CARD_ASPECTS[aspectId];
                const active = config.aspect === aspectId;
                return (
                  <button
                    key={aspectId}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, aspect: aspectId }))
                    }
                    className={cn(
                      "rounded-xl border p-3 text-left transition-all",
                      active
                        ? "border-[#7A1C24] bg-[#7A1C24]/5 ring-1 ring-[#7A1C24]"
                        : "border-[#E8E2D9] bg-[#FAF8F5] hover:border-[#B89B72]",
                    )}
                  >
                    <p className="text-sm font-semibold text-[#1F1D1A]">
                      {item.label}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#6B655E]">
                      {item.hint}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Theme selector */}
          <div>
            <p className="text-xs font-semibold text-[#1F1D1A]">
              Bảng màu thiệp báo hỷ
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {(Object.keys(CARD_THEMES) as CardThemeId[]).map((themeId) => {
                const t = CARD_THEMES[themeId];
                const active = config.theme === themeId;
                return (
                  <button
                    key={themeId}
                    type="button"
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, theme: themeId }))
                    }
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                      active
                        ? "border-[#7A1C24] bg-[#7A1C24]/5 ring-1 ring-[#7A1C24]"
                        : "border-[#E8E2D9] bg-[#FAF8F5] hover:border-[#B89B72]",
                    )}
                  >
                    <span
                      className="h-6 w-6 shrink-0 rounded-full border border-[#E8E2D9]"
                      style={{
                        background: `linear-gradient(135deg, ${t.bgStart}, ${t.bgEnd})`,
                      }}
                      aria-hidden="true"
                    />
                    <span className="text-xs font-medium text-[#1F1D1A]">
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo upload */}
          <div className="rounded-xl border border-dashed border-[#B89B72]/70 bg-[#FAF8F5] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-[#1F1D1A]">
                  Ảnh cặp đôi (chạy trực tiếp trên máy, không gửi lên máy chủ)
                </p>
                <p className="mt-0.5 text-[11px] text-[#6B655E]">
                  Có thể chọn ảnh cưới yêu thích hoặc giữ khung tối giản mặc định.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  id="std-photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <label
                  htmlFor="std-photo"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-3.5 py-2 text-xs font-medium text-[#1F1D1A] transition-colors hover:border-[#7A1C24]"
                >
                  <ImagePlus className="h-3.5 w-3.5 text-[#7A1C24]" aria-hidden="true" />
                  <span>{photoSrc ? "Đổi ảnh" : "Chọn ảnh cưới"}</span>
                </label>
                {photoSrc && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="inline-flex items-center gap-1 rounded-full border border-[#E8E2D9] bg-white px-3 py-2 text-xs font-medium text-[#6B655E] hover:text-[#7A1C24]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Gỡ ảnh</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* One-click caption helper */}
          <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1F1D1A]">
                <Sparkles className="h-3.5 w-3.5 text-[#B89B72]" aria-hidden="true" />
                <span>Caption gợi ý đăng kèm</span>
              </span>
              <button
                type="button"
                onClick={handleCopyCaption}
                className="inline-flex items-center gap-1 rounded-full border border-[#E8E2D9] bg-white px-3 py-1 text-xs font-medium text-[#7A1C24] hover:border-[#7A1C24]"
              >
                {copiedCaption ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Sao chép caption</span>
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-[#6B655E]">
              {caption}
            </p>
          </div>
        </section>

        {/* Right: Always-visible Live Canvas Preview + Download */}
        <section
          aria-label="Xem trước và tải xuống ảnh Save the Date"
          className="rounded-2xl border border-[#E8E2D9] bg-white p-5 sm:p-6 shadow-xs space-y-4 lg:sticky lg:top-20"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
                XEM TRƯỚC THÀNH PHẨM
              </p>
              <p className="text-xs text-[#6B655E]">
                Độ phân giải xuất: {aspectSpec.width} × {aspectSpec.height} px
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadPng}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-[#5E141B]"
            >
              {downloaded ? (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>Đã tải PNG</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>Tải ảnh PNG</span>
                </>
              )}
            </button>
          </div>

          <div className="flex justify-center rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-4">
            <canvas
              ref={canvasRef}
              className={cn(
                "w-full rounded-xl shadow-sm",
                config.aspect === "story-9-16"
                  ? "max-w-[290px] aspect-[9/16]"
                  : "max-w-[340px] aspect-[4/5]",
              )}
              aria-label={`Bản xem trước ảnh Save the Date ${config.groomName} và ${config.brideName}`}
            />
          </div>
        </section>
      </div>

      <SmartToolCta
        eyebrow="NÂNG CẤP TỪ ẢNH BÁO HỶ LÊN THIỆP TƯƠNG TÁC"
        title="Đã có ảnh Save the Date? Tạo ngay thiệp cưới có nhạc nền & RSVP"
        description="Khi đăng Story hoặc bài viết trên Facebook, hãy ghim kèm đường dẫn thiệp Inviwedd để bạn bè bấm bản đồ Google Maps, nghe nhạc nền và xác nhận tham dự tự động."
        buttonText="Tạo thiệp miễn phí cho 20 khách"
        buttonHref="/tao-thiep"
        highlightPulse={downloaded}
      />
    </div>
  );
}
