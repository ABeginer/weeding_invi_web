"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  EyeOff,
  Filter,
  Image as ImageIcon,
  Loader2,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { deletePhoto, moderatePhoto, setPhotoApprovalMode } from "@/lib/api";
import {
  exportPhotoWallZip,
  type ExportPhotoWallZipProgress,
  type PhotoWallZipItem,
} from "@/lib/export-photo-wall-zip";
import type { WeddingPhoto } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { TableStandeeModal } from "./TableStandeeModal";

type ModerationStatus = "pending" | "approved" | "hidden";

interface PhotoModeratorProps {
  weddingSlug: string;
  weddingId?: string;
  coupleTitle?: string;
  weddingDate?: string;
  photos: WeddingPhoto[];
  initialApprovalMode?: "manual" | "auto";
  initialModeration?: Record<string, ModerationStatus>;
  onModerationChange?: (
    nextModeration: Record<string, ModerationStatus>,
    nextMode?: "manual" | "auto",
  ) => void;
  onPhotoDeleted?: (photoId: string) => void;
  className?: string;
}

export function PhotoModerator({
  weddingSlug,
  weddingId,
  coupleTitle,
  weddingDate,
  photos,
  initialApprovalMode = "manual",
  initialModeration = {},
  onModerationChange,
  onPhotoDeleted,
  className,
}: PhotoModeratorProps) {
  const { showToast } = useToast();

  const [approvalMode, setApprovalMode] = React.useState<"manual" | "auto">(
    initialApprovalMode,
  );
  const [moderation, setModeration] = React.useState<
    Record<string, ModerationStatus>
  >(initialModeration);
  const [modeBusy, setModeBusy] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<
    "all" | "pending" | "approved" | "hidden"
  >("pending");
  const [actionBusyId, setActionBusyId] = React.useState<string | null>(null);

  const [downloadScope, setDownloadScope] = React.useState<"approved" | "all">("approved");
  const [isDownloadingZip, setIsDownloadingZip] = React.useState(false);
  const [zipProgress, setZipProgress] = React.useState<ExportPhotoWallZipProgress | null>(null);
  const [showScopeDropdown, setShowScopeDropdown] = React.useState(false);
  const [standeeModalOpen, setStandeeModalOpen] = React.useState(false);
  const [deletingPhotoTarget, setDeletingPhotoTarget] = React.useState<WeddingPhoto | null>(null);
  const [isDeletingPhoto, setIsDeletingPhoto] = React.useState(false);

  const handleConfirmPermanentDelete = async () => {
    if (!deletingPhotoTarget) return;
    setIsDeletingPhoto(true);
    try {
      if (weddingId) {
        await deletePhoto(weddingId, deletingPhotoTarget.id);
      }
      const nextMod = { ...moderation };
      delete nextMod[deletingPhotoTarget.id];
      setModeration(nextMod);
      onModerationChange?.(nextMod, approvalMode);
      onPhotoDeleted?.(deletingPhotoTarget.id);
      showToast("Đã xóa vĩnh viễn ảnh khỏi bộ nhớ và hàng chờ duyệt.", "success");
      setDeletingPhotoTarget(null);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Không thể xóa ảnh lúc này.",
        "error",
      );
    } finally {
      setIsDeletingPhoto(false);
    }
  };
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const dropdownRef = React.useRef<HTMLDivElement | null>(null);

  // Đóng dropdown scope khi click ra ngoài
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowScopeDropdown(false);
      }
    };
    if (showScopeDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showScopeDropdown]);

  // Hủy tải nếu unmount component
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Đồng bộ props nếu có thay đổi từ ngoài
  React.useEffect(() => {
    setApprovalMode(initialApprovalMode);
  }, [initialApprovalMode]);

  React.useEffect(() => {
    setModeration(initialModeration);
  }, [initialModeration]);

  // Lọc riêng các ảnh album gửi lên từ khách mời (hoặc ảnh có mặt trên Photo Wall)
  const albumPhotos = React.useMemo(() => {
    const list = photos.filter((p) => p.kind === "album");
    if (list.length > 0) return list;
    return photos;
  }, [photos]);

  const getEffectiveStatus = React.useCallback(
    (photo: WeddingPhoto): ModerationStatus => {
      if (moderation[photo.id]) {
        return moderation[photo.id];
      }
      if (photo.kind !== "album") return "approved";
      return approvalMode === "auto" ? "approved" : "pending";
    },
    [approvalMode, moderation],
  );

  // Thống kê số lượng từng loại
  const stats = React.useMemo(() => {
    let pending = 0;
    let approved = 0;
    let hidden = 0;
    for (const p of albumPhotos) {
      const status = getEffectiveStatus(p);
      if (status === "approved") approved += 1;
      else if (status === "hidden") hidden += 1;
      else pending += 1;
    }
    return { all: albumPhotos.length, pending, approved, hidden };
  }, [albumPhotos, getEffectiveStatus]);

  // Nếu tab "Chờ duyệt" không còn ảnh nào mà có ảnh đã duyệt, tự động chuyển tab
  React.useEffect(() => {
    if (activeFilter === "pending" && stats.pending === 0 && stats.approved > 0) {
      setActiveFilter("approved");
    }
  }, [activeFilter, stats.approved, stats.pending]);

  // Chuyển đổi chế độ duyệt (Duyệt thủ công vs Tự động duyệt)
  const handleToggleMode = async (nextMode: "manual" | "auto") => {
    if (modeBusy || nextMode === approvalMode) return;
    const previous = approvalMode;
    setApprovalMode(nextMode);
    setModeBusy(true);

    try {
      const res = await setPhotoApprovalMode(weddingSlug, nextMode);
      setApprovalMode(res.photoApprovalMode);
      onModerationChange?.(moderation, res.photoApprovalMode);
      showToast(
        nextMode === "auto"
          ? "Đã bật chế độ Tự động duyệt: Ảnh khách gửi sẽ tự hiện lên màn hình LED."
          : "Đã bật chế độ Duyệt thủ công: Bạn hoặc trợ lý cần bấm Duyệt để ảnh hiện lên màn hình LED.",
        "success",
      );
    } catch (error) {
      setApprovalMode(previous);
      showToast(
        error instanceof Error ? error.message : "Không thể cập nhật chế độ duyệt.",
        "error",
      );
    } finally {
      setModeBusy(false);
    }
  };

  // 1-Tap thao tác Duyệt hoặc Ẩn (Optimistic UI)
  const handleModerate = async (
    photoId: string,
    nextStatus: "approved" | "hidden",
  ) => {
    if (actionBusyId) return;

    const previousStatus = moderation[photoId];
    const nextModeration = { ...moderation, [photoId]: nextStatus };
    setModeration(nextModeration);
    setActionBusyId(photoId);

    try {
      const res = await moderatePhoto(weddingSlug, photoId, nextStatus);
      const updated = res.photoModeration ?? nextModeration;
      setModeration(updated);
      onModerationChange?.(updated, approvalMode);
      showToast(
        nextStatus === "approved" ? "Đã duyệt ảnh lên màn hình LED" : "Đã ẩn ảnh khỏi màn hình LED",
        "success",
      );
    } catch (error) {
      // Revert optimistic update
      setModeration((prev) => {
        const copy = { ...prev };
        if (previousStatus) copy[photoId] = previousStatus;
        else delete copy[photoId];
        return copy;
      });
      showToast(
        error instanceof Error ? error.message : "Thao tác không thành công.",
        "error",
      );
    } finally {
      setActionBusyId(null);
    }
  };

  // Danh sách ảnh đã duyệt
  const approvedPhotos = React.useMemo(() => {
    return albumPhotos.filter((p) => getEffectiveStatus(p) === "approved");
  }, [albumPhotos, getEffectiveStatus]);

  // Danh sách ảnh mục tiêu theo phạm vi tải (chỉ đã duyệt hoặc tất cả)
  const targetDownloadPhotos = React.useMemo(() => {
    if (downloadScope === "approved") {
      return approvedPhotos;
    }
    return albumPhotos;
  }, [albumPhotos, approvedPhotos, downloadScope]);

  // Xử lý tải toàn bộ ảnh dạng file ZIP 100% Client-Side
  const handleDownloadZip = async () => {
    if (isDownloadingZip) return;
    if (targetDownloadPhotos.length === 0) {
      showToast(
        downloadScope === "approved"
          ? "Chưa có ảnh nào được duyệt để tải về."
          : "Chưa có ảnh nào trong Photo Wall.",
        "info",
      );
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsDownloadingZip(true);
    setZipProgress({
      loaded: 0,
      total: targetDownloadPhotos.length,
      percent: 0,
    });

    const zipItems: PhotoWallZipItem[] = targetDownloadPhotos.map((p) => ({
      id: p.id,
      url: p.url,
      guestName: p.guestName ?? null,
      caption: p.caption ?? null,
      createdAt: p.createdAt ?? null,
    }));

    try {
      const result = await exportPhotoWallZip({
        weddingSlug,
        photos: zipItems,
        signal: controller.signal,
        concurrency: 4,
        onProgress: (progress) => {
          setZipProgress(progress);
        },
      });

      if (result.cancelled) {
        showToast("Đã hủy quá trình tải file ZIP.", "info");
      } else if (result.failedCount > 0) {
        showToast(
          `Đã tải ${result.downloadedCount}/${result.totalPhotos} ảnh (${result.failedCount} ảnh bị lỗi kết nối).`,
          "info",
        );
      } else {
        showToast(`Đã tải xong trọn bộ ${result.downloadedCount} ảnh (.ZIP)`, "success");
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        showToast("Đã hủy quá trình tải file ZIP.", "info");
      } else {
        showToast(
          error instanceof Error ? error.message : "Có lỗi xảy ra khi đóng gói ảnh.",
          "error",
        );
      }
    } finally {
      abortControllerRef.current = null;
      setIsDownloadingZip(false);
      setZipProgress(null);
    }
  };

  const handleCancelDownload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const filteredPhotos = React.useMemo(() => {
    return albumPhotos.filter((p) => {
      const status = getEffectiveStatus(p);
      if (activeFilter === "all") return true;
      return status === activeFilter;
    });
  }, [activeFilter, albumPhotos, getEffectiveStatus]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header bar: Title, Actions (ZIP Export & Mode Toggle) */}
      <div className="flex flex-col gap-4 rounded-2xl border border-[#E8E2D9] bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-bold text-[#1F1D1A]">
              Duyệt ảnh Photo Wall
            </h2>
            <span className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-2.5 py-0.5 text-[11px] font-semibold text-[#7A1C24]">
              {stats.all} ảnh
            </span>
          </div>
          <p className="mt-1 text-xs text-[#6B655E]">
            Kiểm soát ảnh khách mời gửi lên màn hình LED tiệc cưới thời gian thực.
          </p>
        </div>

        {/* Action Controls: ZIP Export Button + Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* ZIP Export Button + Scope Dropdown */}
          <div className="relative inline-flex items-center" ref={dropdownRef}>
            <div className="inline-flex rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-0.5 shadow-xs">
              <button
                type="button"
                disabled={isDownloadingZip || targetDownloadPhotos.length === 0}
                onClick={handleDownloadZip}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  isDownloadingZip
                    ? "bg-[#7A1C24]/10 text-[#7A1C24] cursor-not-allowed"
                    : targetDownloadPhotos.length === 0
                      ? "text-[#6B655E]/60 cursor-not-allowed"
                      : "bg-[#7A1C24] text-white hover:bg-[#60161C] active:scale-95 shadow-xs",
                )}
                title={
                  downloadScope === "approved"
                    ? `Tải ${approvedPhotos.length} ảnh đã duyệt`
                    : `Tải tất cả ${albumPhotos.length} ảnh`
                }
              >
                {isDownloadingZip ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                <span>
                  {isDownloadingZip
                    ? "Đang đóng gói..."
                    : downloadScope === "approved"
                      ? `Tải trọn bộ ảnh (.ZIP) (${approvedPhotos.length})`
                      : `Tải tất cả ảnh (.ZIP) (${albumPhotos.length})`}
                </span>
              </button>

              {/* Scope toggle arrow */}
              <button
                type="button"
                disabled={isDownloadingZip}
                onClick={() => setShowScopeDropdown((prev) => !prev)}
                aria-label="Chọn phạm vi tải ảnh ZIP"
                className={cn(
                  "cursor-pointer rounded-r-lg px-1.5 py-1.5 text-xs transition-colors border-l border-[#E8E2D9]",
                  isDownloadingZip
                    ? "text-[#6B655E]/50 cursor-not-allowed"
                    : "text-[#6B655E] hover:text-[#1F1D1A] hover:bg-white/50",
                )}
              >
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    showScopeDropdown && "rotate-180",
                  )}
                />
              </button>
            </div>

            {/* Scope Dropdown Menu */}
            {showScopeDropdown && (
              <div className="absolute right-0 top-full z-30 mt-1.5 w-60 rounded-2xl border border-[#E8E2D9] bg-white p-1.5 shadow-lg animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6B655E]">
                  Phạm vi tải ZIP
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDownloadScope("approved");
                    setShowScopeDropdown(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-colors text-left",
                    downloadScope === "approved"
                      ? "bg-[#FAF8F5] text-[#7A1C24] font-semibold"
                      : "text-[#1F1D1A] hover:bg-[#FAF8F5]",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {downloadScope === "approved" && <Check className="h-3 w-3 text-[#7A1C24]" />}
                    <span>Chỉ tải ảnh đã duyệt</span>
                  </div>
                  <span className="rounded-full bg-[#E8E2D9]/60 px-2 py-0.5 font-mono text-[11px] text-[#1F1D1A]">
                    {approvedPhotos.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDownloadScope("all");
                    setShowScopeDropdown(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs font-medium transition-colors text-left",
                    downloadScope === "all"
                      ? "bg-[#FAF8F5] text-[#7A1C24] font-semibold"
                      : "text-[#1F1D1A] hover:bg-[#FAF8F5]",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {downloadScope === "all" && <Check className="h-3 w-3 text-[#7A1C24]" />}
                    <span>Tải tất cả ảnh Photo Wall</span>
                  </div>
                  <span className="rounded-full bg-[#E8E2D9]/60 px-2 py-0.5 font-mono text-[11px] text-[#1F1D1A]">
                    {albumPhotos.length}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Tải bảng QR để bàn */}
          <button
            type="button"
            onClick={() => setStandeeModalOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#B89B72]/60 bg-white px-3 py-2 text-xs font-semibold text-[#1F1D1A] shadow-xs transition-colors hover:bg-[#FAF8F5] active:scale-95"
          >
            <Printer className="h-3.5 w-3.5 text-[#B89B72]" />
            <span>Tải bảng QR để bàn (In A5/A6)</span>
          </button>

          {/* Mode Pill Toggle */}
          <div className="flex items-center gap-1 rounded-full border border-[#E8E2D9] bg-[#FAF8F5] p-1 text-xs">
            <button
              type="button"
              disabled={modeBusy}
              onClick={() => handleToggleMode("manual")}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-all",
                approvalMode === "manual"
                  ? "bg-[#7A1C24] text-white shadow-xs font-semibold"
                  : "text-[#6B655E] hover:text-[#1F1D1A]",
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Duyệt thủ công</span>
            </button>

            <button
              type="button"
              disabled={modeBusy}
              onClick={() => handleToggleMode("auto")}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-all",
                approvalMode === "auto"
                  ? "bg-[#7A1C24] text-white shadow-xs font-semibold"
                  : "text-[#6B655E] hover:text-[#1F1D1A]",
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Tự động duyệt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Progress State Bar */}
      {isDownloadingZip && zipProgress && (
        <div className="rounded-2xl border border-[#E8E2D9] bg-[#F4EFEA] p-4 shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-medium text-[#1F1D1A]">
              <Loader2 className="h-4 w-4 animate-spin text-[#7A1C24]" />
              <span>
                Đang tải và đóng gói <strong>{zipProgress.loaded}</strong> /{" "}
                <strong>{zipProgress.total}</strong> ảnh ({zipProgress.percent}%)...
              </span>
            </div>
            <button
              type="button"
              onClick={handleCancelDownload}
              className="cursor-pointer rounded-lg border border-[#E8E2D9] bg-white px-2.5 py-1 text-xs font-semibold text-[#9E3B3B] hover:bg-[#FAF8F5] active:scale-95 transition-all shadow-2xs"
            >
              Hủy
            </button>
          </div>
          {/* Smooth progress bar in brand burgundy */}
          <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-[#E8E2D9]">
            <div
              className="h-full bg-[#7A1C24] transition-all duration-200 ease-out"
              style={{ width: `${zipProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "pending" as const, label: "Chờ duyệt", count: stats.pending, icon: Clock },
          { id: "approved" as const, label: "Đã duyệt", count: stats.approved, icon: CheckCircle2 },
          { id: "hidden" as const, label: "Đã ẩn", count: stats.hidden, icon: EyeOff },
          { id: "all" as const, label: "Tất cả", count: stats.all, icon: Filter },
        ].map((tab) => {
          const active = activeFilter === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-colors whitespace-nowrap",
                active
                  ? "border-[#7A1C24] bg-[#7A1C24] text-white font-semibold shadow-xs"
                  : "border-[#E8E2D9] bg-white text-[#6B655E] hover:border-[#B89B72] hover:text-[#1F1D1A]",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 font-mono text-[11px]",
                  active
                    ? "bg-white/20 text-white font-bold"
                    : "bg-[#F4EFEA] text-[#1F1D1A]",
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Photo Moderation Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E8E2D9] bg-white p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F4EFEA] text-[#B89B72]">
            <ImageIcon className="h-6 w-6" />
          </div>
          <h3 className="mt-3 font-serif text-base font-bold text-[#1F1D1A]">
            Không có ảnh nào trong mục này
          </h3>
          <p className="mt-1 text-xs text-[#6B655E]">
            {activeFilter === "pending"
              ? "Tất cả ảnh gửi lên đã được duyệt xong!"
              : "Khách mời quét mã QR trên thiệp hoặc màn hình LED để gửi ảnh."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredPhotos.map((photo) => {
            const status = getEffectiveStatus(photo);
            const isBusy = actionBusyId === photo.id;

            return (
              <div
                key={photo.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white shadow-xs transition-all hover:shadow-md"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1F1D1A]/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt="Ảnh tiệc cưới"
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  {/* Status Badge Tag */}
                  <div className="absolute top-2.5 left-2.5 z-10">
                    {status === "approved" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#2F6F4E] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <Check className="h-3 w-3" />
                        Đã duyệt
                      </span>
                    )}
                    {status === "hidden" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#9E3B3B] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <EyeOff className="h-3 w-3" />
                        Đã ẩn
                      </span>
                    )}
                    {status === "pending" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#B89B72] px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        <Clock className="h-3 w-3" />
                        Chờ duyệt
                      </span>
                    )}
                  </div>

                  {isBusy && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>

                {/* 1-Tap Action Buttons Bar */}
                <div className="flex items-center gap-2 p-2.5 bg-[#FAF8F5] border-t border-[#E8E2D9]">
                  <button
                    type="button"
                    disabled={isBusy || status === "approved"}
                    onClick={() => handleModerate(photo.id, "approved")}
                    className={cn(
                      "flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all active:scale-95",
                      status === "approved"
                        ? "bg-[#2F6F4E]/15 text-[#2F6F4E] opacity-70 cursor-default"
                        : "bg-[#2F6F4E] text-white hover:bg-[#24583E] shadow-xs",
                    )}
                    title="Duyệt cho phép chiếu lên màn hình LED"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Duyệt</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy || status === "hidden"}
                    onClick={() => handleModerate(photo.id, "hidden")}
                    className={cn(
                      "flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all active:scale-95",
                      status === "hidden"
                        ? "bg-[#9E3B3B]/15 text-[#9E3B3B] opacity-70 cursor-default"
                        : "bg-[#9E3B3B] text-white hover:bg-[#7E2E2E] shadow-xs",
                    )}
                    title="Ẩn khỏi màn hình LED"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Ẩn</span>
                  </button>

                  {/* Nút xóa vĩnh viễn khi ảnh ở trạng thái Ẩn */}
                  {status === "hidden" && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => setDeletingPhotoTarget(photo)}
                      className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-[#ECCFCF] bg-[#FBEFEF] p-2 text-[#9E3B3B] hover:bg-[#f6dfdf] transition-all active:scale-95"
                      title="Xóa vĩnh viễn ảnh khỏi hệ thống & bộ nhớ lưu trữ"
                      aria-label="Xóa vĩnh viễn"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal xác nhận xóa vĩnh viễn ảnh */}
      <Dialog
        open={Boolean(deletingPhotoTarget)}
        onClose={() => !isDeletingPhoto && setDeletingPhotoTarget(null)}
        title="Xác nhận xóa vĩnh viễn ảnh"
        description="Bạn có chắc muốn xóa vĩnh viễn ảnh này? Ảnh sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu và bộ nhớ lưu trữ Cloudflare R2 / Storage."
        className="max-w-sm"
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            disabled={isDeletingPhoto}
            onClick={() => setDeletingPhotoTarget(null)}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            disabled={isDeletingPhoto}
            onClick={handleConfirmPermanentDelete}
            className="bg-[#9E3B3B] text-white hover:bg-[#7E2E2E]"
          >
            {isDeletingPhoto ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xóa vĩnh viễn</span>
            )}
          </Button>
        </div>
      </Dialog>

      <TableStandeeModal
        open={standeeModalOpen}
        onClose={() => setStandeeModalOpen(false)}
        weddingSlug={weddingSlug}
        coupleTitle={coupleTitle || "Tiệc Cưới"}
        weddingDate={weddingDate}
      />
    </div>
  );
}
