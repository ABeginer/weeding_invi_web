"use client";

import * as React from "react";
import Link from "next/link";
import {
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ImagePlus,
  Loader2,
  PenLine,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { compressImage } from "@/lib/image/compress";
import { cn } from "@/lib/utils";

interface SelectedImageItem {
  id: string;
  file: File;
  previewUrl: string;
  compressedBlob?: Blob;
}

interface GuestUploadPortalProps {
  weddingSlug: string;
  coupleTitle: string;
  isAutoApprove?: boolean;
  onPhotoUploaded?: () => void;
}

export function GuestUploadPortal({
  weddingSlug,
  coupleTitle,
  isAutoApprove = true,
  onPhotoUploaded,
}: GuestUploadPortalProps) {
  const [selectedItems, setSelectedItems] = React.useState<SelectedImageItem[]>([]);
  const [guestName, setGuestName] = React.useState("");
  const [wishMessage, setWishMessage] = React.useState("");
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadSuccess, setUploadSuccess] = React.useState(false);
  const [successCount, setSuccessCount] = React.useState(0);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [showGuideHelp, setShowGuideHelp] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Dọn dẹp URL.createObjectURL khi unmount hoặc đổi ảnh
  React.useEffect(() => {
    return () => {
      selectedItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [selectedItems]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    const newFiles = Array.from(files).slice(0, 5); // Tối đa 5 ảnh mỗi đợt

    const newItems: SelectedImageItem[] = [];

    for (const file of newFiles) {
      if (!file.type.startsWith("image/")) {
        setErrorMessage("Vui lòng chỉ chọn các tệp hình ảnh (JPG, PNG, WebP).");
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      newItems.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
      });
    }

    setSelectedItems((prev) => [...prev, ...newItems].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleUploadAll = async () => {
    if (selectedItems.length === 0) return;
    setIsUploading(true);
    setErrorMessage(null);

    let uploadedCount = 0;

    try {
      for (const item of selectedItems) {
        // Nén ảnh sang WebP client-side trước khi gửi
        let blobToSend: Blob = item.file;
        try {
          const compressed = await compressImage(item.file, "gallery");
          blobToSend = compressed.blob;
        } catch {
          blobToSend = item.file;
        }

        const formData = new FormData();
        formData.append("file", blobToSend, item.file.name.replace(/\.[^/.]+$/, ".webp"));
        if (guestName.trim()) formData.append("guestName", guestName.trim());
        if (wishMessage.trim()) formData.append("wishMessage", wishMessage.trim());

        const res = await fetch(`/api/public/wedding/${encodeURIComponent(weddingSlug)}/photos`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Gặp lỗi khi tải ảnh lên.");
        }

        uploadedCount += 1;
      }

      setSuccessCount(uploadedCount);
      setUploadSuccess(true);
      setSelectedItems([]);
      onPhotoUploaded?.();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Không thể gửi ảnh lúc này. Vui lòng thử lại.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleResetForMore = () => {
    setUploadSuccess(false);
    setSelectedItems([]);
    setErrorMessage(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* Zero-Login, Instant-Clarity Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D9] bg-white/80 px-3.5 py-1 text-xs font-semibold text-[#7A1C24] shadow-2xs backdrop-blur-xs">
          <Sparkles className="h-3.5 w-3.5 text-[#B89B72]" aria-hidden="true" />
          <span>Live Photo Wall · Không cần đăng nhập</span>
        </div>
        <h1 className="mt-3 font-serif text-2xl font-bold tracking-tight text-[#1F1D1A] sm:text-3xl">
          {coupleTitle || "Tiệc Cưới"}
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-[#6B655E] sm:text-sm">
          Gửi ảnh chụp tại tiệc để cùng lưu giữ kỷ niệm &amp; chiếu lên màn hình lớn sân khấu tiệc cưới!
        </p>
      </div>

      {/* 3-Step Visual Guide Strip */}
      <div className="rounded-2xl border border-[#E8E2D9] bg-[#F4EFEA] p-3.5 shadow-2xs">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#7A1C24] shadow-2xs">
              <Camera className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-[#1F1D1A]">1. Chụp / Chọn ảnh</span>
            <span className="text-[10px] text-[#6B655E] hidden sm:inline">Chụp trực tiếp từ tiệc</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#B89B72] shadow-2xs">
              <PenLine className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-[#1F1D1A]">2. Ghi tên &amp; lời chúc</span>
            <span className="text-[10px] text-[#6B655E] hidden sm:inline">Tùy chọn hiển thị</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#2F6F4E] shadow-2xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold text-[#1F1D1A]">3. Gửi lên màn hình</span>
            <span className="text-[10px] text-[#6B655E] hidden sm:inline">Tức thì &amp; sắc nét</span>
          </div>
        </div>

        {/* Expandable Help Accordion */}
        <div className="mt-2.5 border-t border-[#E8E2D9]/70 pt-2 text-center">
          <button
            type="button"
            onClick={() => setShowGuideHelp((prev) => !prev)}
            className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-medium text-[#7A1C24] hover:underline"
          >
            <HelpCircle className="h-3 w-3" />
            <span>Xem hướng dẫn nhanh cho khách mời</span>
            {showGuideHelp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showGuideHelp && (
            <div className="mt-2 rounded-xl bg-white p-3 text-left text-xs leading-relaxed text-[#6B655E] space-y-1.5 animate-in fade-in">
              <p>
                💡 <strong>Dành cho mọi khách mời:</strong> Bạn không cần tải ứng dụng và không cần tài khoản.
              </p>
              <p>
                📸 Bấm nút <strong>&quot;Chụp ảnh hoặc Chọn từ máy&quot;</strong>, chọn camera để chụp ảnh cùng cô dâu chú rể hoặc chọn ảnh đẹp vừa chụp trong máy.
              </p>
              <p>
                ✨ Sau khi gửi, ảnh của bạn sẽ lập tức xuất hiện trong slideshow trên màn hình LED tiệc cưới!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Upload / Success Zone */}
      {uploadSuccess ? (
        /* Warm Reassuring Success Card */
        <div className="rounded-3xl border border-[#2F6F4E]/30 bg-[#ECF5F0] p-6 sm:p-8 text-center shadow-xs animate-in fade-in">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#2F6F4E]/10 text-[#2F6F4E]">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <h3 className="mt-3 font-serif text-xl font-bold text-[#2F6F4E]">
            Gửi ảnh thành công!
          </h3>

          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-[#1F1D1A]/80 sm:text-sm">
            {isAutoApprove
              ? `Đã gửi thành công ${successCount} ảnh! Hãy hướng mắt lên màn hình tiệc trong giây lát để ngắm nhìn khoảnh khắc của bạn nhé.`
              : `Đã gửi thành công ${successCount} ảnh! Ảnh của bạn đang chờ cô dâu chú rể duyệt và sẽ sớm xuất hiện trên màn hình tiệc cưới.`}
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleResetForMore}
              className="inline-flex h-11 w-full sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-6 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B] active:scale-95"
            >
              <Camera className="h-4 w-4" />
              <span>Gửi thêm ảnh khác</span>
            </button>

            <Link
              href={`/w/${weddingSlug}`}
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-5 text-xs font-medium text-[#1F1D1A] transition-colors hover:bg-[#FAF8F5]"
            >
              <span>Quay lại thiệp cưới</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Active Upload Zone */
        <div className="rounded-3xl border border-[#E8E2D9] bg-white p-5 sm:p-7 shadow-xs space-y-5">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Thumb-Friendly Primary Tap Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex min-h-[170px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#B89B72]/60 bg-[#FAF8F5]/60 p-6 text-center transition-all hover:border-[#7A1C24] hover:bg-[#FAF8F5]"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#7A1C24]/10 text-[#7A1C24] transition-transform group-hover:scale-110">
              <Camera className="h-6 w-6" />
            </div>

            <button
              type="button"
              tabIndex={-1}
              className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#7A1C24] px-6 text-xs font-semibold text-white shadow-xs transition-colors group-hover:bg-[#5E141B]"
            >
              <ImagePlus className="h-4 w-4 text-[#B89B72]" />
              <span>Chụp ảnh hoặc Chọn từ máy</span>
            </button>

            <p className="mt-2 text-[11px] text-[#6B655E]">
              Hỗ trợ chọn cùng lúc đến 5 ảnh · JPG, PNG, WebP
            </p>
          </div>

          {/* Thumbnail Previews List */}
          {selectedItems.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#1F1D1A]">
                Ảnh đã chọn ({selectedItems.length}/5):
              </p>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                {selectedItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="group relative aspect-square overflow-hidden rounded-xl border border-[#E8E2D9] bg-[#1F1D1A]/5 shadow-2xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.previewUrl}
                      alt={`Ảnh #${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(item.id);
                      }}
                      className="absolute top-1.5 right-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white shadow-xs transition-transform hover:scale-110"
                      aria-label="Bỏ chọn ảnh"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Inputs: Guest Name & Wish */}
          <div className="space-y-3 pt-1 border-t border-[#E8E2D9]/60">
            <div>
              <label className="block text-xs font-medium text-[#6B655E]">
                Tên của bạn (Tùy chọn):
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  maxLength={50}
                  placeholder="Vd: Tuấn Anh, Bạn thân cô dâu..."
                  className="mt-1 h-9.5 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 text-xs text-[#1F1D1A] outline-none transition-colors focus:border-[#7A1C24] focus:bg-white focus:ring-1 focus:ring-[#7A1C24]"
                />
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B655E]">
                Lời chúc gửi cô dâu chú rể (Tùy chọn):
                <input
                  type="text"
                  value={wishMessage}
                  onChange={(e) => setWishMessage(e.target.value)}
                  maxLength={150}
                  placeholder="Vd: Chúc hai bạn trăm năm hạnh phúc, sớm có quý tử!"
                  className="mt-1 h-9.5 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 text-xs text-[#1F1D1A] outline-none transition-colors focus:border-[#7A1C24] focus:bg-white focus:ring-1 focus:ring-[#7A1C24]"
                />
              </label>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Submit Action Button */}
          <div>
            <button
              type="button"
              disabled={isUploading || selectedItems.length === 0}
              onClick={handleUploadAll}
              className={cn(
                "inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full font-semibold text-xs text-white shadow-sm transition-all active:scale-98",
                selectedItems.length > 0 && !isUploading
                  ? "bg-[#7A1C24] hover:bg-[#5E141B]"
                  : "bg-[#7A1C24]/50 cursor-not-allowed",
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#B89B72]" />
                  <span>Đang tối ưu &amp; gửi {selectedItems.length} ảnh...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 text-[#B89B72]" />
                  <span>
                    {selectedItems.length > 0
                      ? `Gửi ngay ${selectedItems.length} ảnh lên màn hình`
                      : "Chọn ảnh để gửi"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
