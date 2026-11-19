"use client";

import * as React from "react";
import { Download, Loader2, Palette, Printer, Sparkles, X } from "lucide-react";
import {
  downloadTableQrPoster,
  exportTableQrPosterToPngDataUrl,
  STANDEE_DIMENSIONS,
  type TableStandeeSize,
  type TableStandeeTheme,
} from "@/lib/export-table-qr-poster";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

interface TableStandeeModalProps {
  open: boolean;
  onClose: () => void;
  weddingSlug: string;
  coupleTitle: string;
  weddingDate?: string;
}

export function TableStandeeModal({
  open,
  onClose,
  weddingSlug,
  coupleTitle,
  weddingDate,
}: TableStandeeModalProps) {
  const { showToast } = useToast();

  const [selectedSize, setSelectedSize] = React.useState<TableStandeeSize>("a6");
  const [selectedTheme, setSelectedTheme] = React.useState<TableStandeeTheme>("ivory");
  const [previewDataUrl, setPreviewDataUrl] = React.useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  // Fallback modal cho iOS Safari / Zalo
  const [fallbackDataUrl, setFallbackDataUrl] = React.useState<string | null>(null);

  // Sinh preview mỗi khi đổi size hoặc theme
  React.useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsGeneratingPreview(true);

    const timer = setTimeout(() => {
      exportTableQrPosterToPngDataUrl({
        slug: weddingSlug,
        coupleTitle,
        weddingDate,
        size: selectedSize,
        theme: selectedTheme,
      })
        .then((dataUrl) => {
          if (!cancelled) {
            setPreviewDataUrl(dataUrl);
            setIsGeneratingPreview(false);
          }
        })
        .catch((err) => {
          if (!cancelled) {
            console.error("Lỗi sinh preview Standee:", err);
            setIsGeneratingPreview(false);
          }
        });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, weddingSlug, coupleTitle, weddingDate, selectedSize, selectedTheme]);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const result = await downloadTableQrPoster({
        slug: weddingSlug,
        coupleTitle,
        weddingDate,
        size: selectedSize,
        theme: selectedTheme,
      });

      if (result.needsFallbackModal) {
        setFallbackDataUrl(result.dataUrl);
      } else {
        showToast("Đã tải bảng QR để bàn chất lượng in 300 DPI!", "success");
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không thể tạo file ảnh lúc này.",
        "error",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        title="Bảng QR để bàn tiệc cưới (Table Standee)"
        description="In ảnh đặt tại bàn tiệc để khách mời quét mã gửi ảnh chụp trực tiếp lên màn hình LED."
        className="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Controls: Kích thước & Màu sắc */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Chọn khổ in */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#1F1D1A]">
                1. Chọn khổ in (Chuẩn 300 DPI)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["a6", "a5"] as const).map((size) => {
                  const meta = STANDEE_DIMENSIONS[size];
                  const active = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "flex flex-col items-start rounded-xl border p-2.5 text-left transition-all cursor-pointer",
                        active
                          ? "border-[#7A1C24] bg-[#FAF8F5] ring-1 ring-[#7A1C24]"
                          : "border-[#E8E2D9] bg-white hover:border-[#B89B72]/60",
                      )}
                    >
                      <span className="text-xs font-bold text-[#1F1D1A]">
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-[#6B655E]">
                        {meta.sublabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chọn tông màu */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#1F1D1A]">
                2. Chọn phong cách màu sắc
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTheme("ivory")}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all cursor-pointer",
                    selectedTheme === "ivory"
                      ? "border-[#7A1C24] bg-[#FAF8F5] ring-1 ring-[#7A1C24]"
                      : "border-[#E8E2D9] bg-white hover:border-[#B89B72]/60",
                  )}
                >
                  <span className="h-4 w-4 rounded-full border border-[#B89B72] bg-[#FAF8F5] shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-[#1F1D1A]">Trắng Kem</p>
                    <p className="text-[10px] text-[#6B655E]">Trang nhã · Dễ in</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTheme("burgundy")}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2.5 text-left transition-all cursor-pointer",
                    selectedTheme === "burgundy"
                      ? "border-[#7A1C24] bg-[#FAF8F5] ring-1 ring-[#7A1C24]"
                      : "border-[#E8E2D9] bg-white hover:border-[#B89B72]/60",
                  )}
                >
                  <span className="h-4 w-4 rounded-full border border-[#B89B72] bg-[#7A1C24] shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold text-[#1F1D1A]">Đỏ Rượu Vang</p>
                    <p className="text-[10px] text-[#6B655E]">Sang trọng · Nổi bật</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Live Preview Frame */}
          <div className="relative flex flex-col items-center justify-center rounded-2xl border border-[#E8E2D9] bg-[#141210]/5 p-4 sm:p-6">
            <div className="relative max-h-[360px] w-auto max-w-[260px] overflow-hidden rounded-xl shadow-xl border border-[#E8E2D9]">
              {isGeneratingPreview && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-2xs">
                  <Loader2 className="h-6 w-6 animate-spin text-[#7A1C24]" />
                </div>
              )}
              {previewDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewDataUrl}
                  alt="Xem trước bảng QR để bàn"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex aspect-[1240/1748] w-60 items-center justify-center bg-[#FAF8F5]">
                  <Loader2 className="h-6 w-6 animate-spin text-[#B89B72]" />
                </div>
              )}
            </div>
            <p className="mt-2 text-center text-[11px] text-[#6B655E]">
              File PNG xuất ra đạt độ phân giải <strong>300 DPI</strong>, thích hợp mang ra tiệm in thiệp hoặc tiệm photocopy in ngay.
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E8E2D9]">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <button
              type="button"
              disabled={isDownloading || isGeneratingPreview}
              onClick={handleDownload}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-6 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#5E141B] disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Đang xử lý ảnh in...</span>
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4 text-[#B89B72]" />
                  <span>Tải ảnh bảng QR sẵn sàng mang đi in</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Fallback modal cho Zalo & iOS Safari khi tự động tải bị chặn */}
      <Dialog
        open={Boolean(fallbackDataUrl)}
        onClose={() => setFallbackDataUrl(null)}
        title="Lưu ảnh về điện thoại"
        description="Trình duyệt của bạn đang chặn tải file tự động. Hãy nhấn giữ vào ảnh bên dưới để lưu ảnh."
        className="max-w-sm text-center"
      >
        <div className="space-y-4">
          {fallbackDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={fallbackDataUrl}
              alt="Bảng QR để bàn"
              className="mx-auto max-h-[380px] w-auto rounded-xl border border-[#E8E2D9] shadow-md object-contain"
            />
          )}
          <div className="rounded-xl bg-[#FAF8F5] p-3 text-xs text-[#6B655E]">
            👉 <strong>Hướng dẫn:</strong> Nhấn giữ vào ảnh 1-2 giây rồi chọn <strong>&quot;Lưu hình ảnh&quot;</strong> (Save Image).
          </div>
          <div className="flex justify-center">
            <Button onClick={() => setFallbackDataUrl(null)}>
              Đã hiểu &amp; Đóng
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
