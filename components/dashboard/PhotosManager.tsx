"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Crop,
  ExternalLink,
  GripVertical,
  ImageOff,
  ImagePlus,
  Loader2,
  Lock,
  Printer,
  RefreshCw,
  Trash2,
  Tv,
  Upload,
  X,
} from "lucide-react";
import {
  getPhotoLimitMessage,
  getPlanLabel,
  getPlanLimits,
} from "@/config/plans";
import {
  ApiError,
  deletePhoto,
  reorderPhotos,
  updateContent,
  uploadPhoto,
} from "@/lib/api";
import {
  compressImage,
  formatSavedSize,
  isAllowedImageFile,
  isRawImageFile,
} from "@/lib/image/compress";
import { createOgCoverImage } from "@/lib/image-compress";
import type { DesignerImageField } from "@/lib/designer-fields";
import type {
  PhotoKind,
  PhotoSlot,
  TemplatePhotoItem,
  WeddingContent,
  WeddingPhoto,
  WeddingPlan,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { getTemplatePhotos } from "@/config/template-sections";
import { TemplateLightboxModal } from "@/templates/shared/TemplateOverlays";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { ImageCropDialog } from "./ImageCropDialog";
import { LedMiniDemo } from "./LedMiniDemo";
import { TableStandeeModal } from "./TableStandeeModal";
import { VipFeatureModal } from "./VipFeatureModal";

interface PhotosManagerProps {
  templateId?: string | null;
  weddingId: string;
  weddingSlug: string;
  plan: WeddingPlan;
  content: WeddingContent;
  photos: WeddingPhoto[];
  designerImageFields?: DesignerImageField[];
  ledToken?: string;
  onPhotosStateChange: (
    nextPhotos: WeddingPhoto[],
    nextContent?: WeddingContent,
  ) => void;
}

interface FailedUploadItem {
  id: string;
  file: File;
  error: string;
  retryable?: boolean;
}

type MainPhotoSlot = Extract<PhotoSlot, "hero" | "groom" | "bride">;

type SlotMeta = {
  slot: MainPhotoSlot;
  kind: Extract<PhotoKind, "banner" | "couple">;
  title: string;
  description: string;
};

const SINGLE_SLOTS: SlotMeta[] = [
  {
    slot: "hero",
    kind: "banner",
    title: "Ảnh bìa chính",
    description: "Hiển thị ở phần mở đầu thiệp cưới và ảnh đại diện khi gửi link.",
  },
  {
    slot: "groom",
    kind: "couple",
    title: "Ảnh chú rể",
    description: "Ảnh chân dung chú rể trong phần giới thiệu cặp đôi.",
  },
  {
    slot: "bride",
    kind: "couple",
    title: "Ảnh cô dâu",
    description: "Ảnh chân dung cô dâu trong phần giới thiệu cặp đôi.",
  },
];

// Album cho khách đã có backend sau migration_v13_album_kind.sql.
const ALBUM_ENABLED = true;

export function PhotosManager({
  templateId,
  weddingId,
  weddingSlug,
  plan,
  content,
  photos,
  designerImageFields = [],
  ledToken,
  onPhotosStateChange,
}: PhotosManagerProps) {
  const { showToast } = useToast();
  const limits = getPlanLimits(plan);
  // Mỗi mẫu chỉ cho upload những ô ảnh mà thiệp thật sự hiển thị (card_exp §27).
  const photoSlots = getTemplatePhotos(templateId);
  const galleryEnabled = ALBUM_ENABLED && photoSlots.gallery;
  const visibleSingleSlots = SINGLE_SLOTS.filter((meta) =>
    meta.slot === "hero" ? photoSlots.hero : photoSlots.couple,
  );

  const [slotStatus, setSlotStatus] = React.useState<
    Partial<Record<MainPhotoSlot, string>>
  >({});
  const [slotError, setSlotError] = React.useState<string | null>(null);
  const [cropRequest, setCropRequest] = React.useState<{
    file: File;
    aspect: number;
    title: string;
    onConfirm: (file: File) => void;
  } | null>(null);

  const [galleryStatus, setGalleryStatus] = React.useState<string | null>(null);
  const [galleryError, setGalleryError] = React.useState<string | null>(null);
  const [reordering, setReordering] = React.useState(false);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

  const [albumStatus, setAlbumStatus] = React.useState<string | null>(null);
  const [albumQr, setAlbumQr] = React.useState<string | null>(null);
  const [qrPreviewOpen, setQrPreviewOpen] = React.useState(false);
  const [ledUpgradeOpen, setLedUpgradeOpen] = React.useState(false);
  const [standeeModalOpen, setStandeeModalOpen] = React.useState(false);
  const [copiedLedLink, setCopiedLedLink] = React.useState(false);
  const [failedAlbumUploads, setFailedAlbumUploads] = React.useState<FailedUploadItem[]>([]);
  const albumInputRef = React.useRef<HTMLInputElement | null>(null);
  const [designerFieldBusy, setDesignerFieldBusy] = React.useState<string | null>(null);
  const [designerFieldError, setDesignerFieldError] = React.useState<string | null>(null);

  const handleCopyLedLink = async () => {
    if (typeof window === "undefined") return;
    const url = ledToken
      ? `${window.location.origin}/led/${weddingSlug}?key=${ledToken}`
      : `${window.location.origin}/led/${weddingSlug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopiedLedLink(true);
    showToast("Đã sao chép link màn hình LED (kèm mã bảo mật)", "success");
    window.setTimeout(() => setCopiedLedLink(false), 2000);
  };

  const updateDesignerImage = async (key: string, value: string | null) => {
    const next = { ...(content.designerFields ?? {}) };
    if (value) next[key] = value;
    else delete next[key];
    const nextContent = { ...content, designerFields: next };
    setDesignerFieldError(null);
    try {
      const saved = await updateContent(weddingId, { content: nextContent });
      onPhotosStateChange(photos, saved.content);
      showToast(value ? "Đã lưu ảnh cho mẫu thiết kế" : "Đã bỏ ảnh", "success");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setDesignerFieldError(
        error instanceof Error ? error.message : "Không lưu được ảnh.",
      );
    }
  };

  const handleDesignerImage = async (key: string, file: File) => {
    setDesignerFieldError(null);
    setDesignerFieldBusy(key);
    try {
      const compressed = await compressImage(file, "gallery");
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Không đọc được ảnh."));
        reader.readAsDataURL(compressed.blob);
      });
      await updateDesignerImage(key, dataUrl);
    } catch (error) {
      setDesignerFieldError(
        error instanceof Error ? error.message : "Không tải được ảnh.",
      );
    } finally {
      setDesignerFieldBusy(null);
    }
  };

  const [deletingTarget, setDeletingTarget] = React.useState<{
    photo: WeddingPhoto;
    label: string;
  } | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const [lightboxPhotos, setLightboxPhotos] = React.useState<TemplatePhotoItem[]>(
    [],
  );
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  const heroInputRef = React.useRef<HTMLInputElement | null>(null);
  const groomInputRef = React.useRef<HTMLInputElement | null>(null);
  const brideInputRef = React.useRef<HTMLInputElement | null>(null);
  const galleryInputRef = React.useRef<HTMLInputElement | null>(null);

  const inputRefs: Record<
    MainPhotoSlot,
    React.RefObject<HTMLInputElement | null>
  > = {
    hero: heroInputRef,
    groom: groomInputRef,
    bride: brideInputRef,
  };

  const photoById = React.useMemo(
    () => new Map(photos.map((p) => [p.id, p])),
    [photos],
  );

  const getSlotPhoto = React.useCallback(
    (slot: PhotoSlot): WeddingPhoto | null => {
      if (slot === "hero") {
        return (
          (content.heroPhotoId ? photoById.get(content.heroPhotoId) : undefined) ??
          photos.find((p) => p.kind === "banner") ??
          null
        );
      }
      if (slot === "groom") {
        return content.groomPhotoId
          ? photoById.get(content.groomPhotoId) ?? null
          : null;
      }
      return content.bridePhotoId
        ? photoById.get(content.bridePhotoId) ?? null
        : null;
    },
    [content.bridePhotoId, content.groomPhotoId, content.heroPhotoId, photoById, photos],
  );

  const galleryPhotos = React.useMemo(
    () =>
      photos
        .filter((p) => p.kind === "gallery")
        .sort((a, b) => a.position - b.position),
    [photos],
  );

  const galleryLimit = limits.photos.gallery;
  const reachedGalleryLimit = galleryPhotos.length >= galleryLimit;

  const albumPhotos = React.useMemo(
    () =>
      photos
        .filter((p) => p.kind === "album")
        .sort((a, b) => a.position - b.position),
    [photos],
  );

  const albumLimit = limits.photos.album;
  const reachedAlbumLimit = albumPhotos.length >= albumLimit;

  React.useEffect(() => {
    if (!galleryEnabled || plan === "free" || !weddingSlug) {
      setAlbumQr(null);
      return;
    }
    let cancelled = false;
    const url = `${window.location.origin}/a/${weddingSlug}`;
    import("qrcode")
      .then((module) =>
        module.default.toDataURL(url, {
          width: 220,
          margin: 1,
          color: { dark: "#4D1217", light: "#F8F1EA" },
        }),
      )
      .then((dataUrl) => {
        if (!cancelled) setAlbumQr(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setAlbumQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [plan, weddingSlug]);

  const openRecrop = async (meta: SlotMeta, photo: WeddingPhoto) => {
    try {
      const response = await fetch(photo.url);
      if (!response.ok) throw new Error("Không tải được ảnh.");
      const blob = await response.blob();
      const file = new File([blob], `${meta.slot}.jpg`, {
        type: blob.type || "image/jpeg",
      });
      setCropRequest({
        file,
        aspect: 3 / 4,
        title: `Căn lại ${meta.title}`,
        onConfirm: (cropped) => {
          setCropRequest(null);
          void uploadSlotFile(meta, cropped);
        },
      });
    } catch (err) {
      setSlotError(err instanceof Error ? err.message : "Không tải được ảnh.");
    }
  };

  const handleSlotFileSelected = (
    meta: SlotMeta,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setSlotError(null);
    setCropRequest({
      file,
      aspect: 3 / 4,
      title: `Căn ảnh ${meta.title}`,
      onConfirm: (cropped) => {
        setCropRequest(null);
        void uploadSlotFile(meta, cropped);
      },
    });
  };

  const uploadSlotFile = async (meta: SlotMeta, file: File) => {
    setSlotError(null);

    if (isRawImageFile(file)) {
      setSlotError("Ảnh RAW chưa được hỗ trợ. Vui lòng xuất sang JPEG rồi tải lên.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setSlotError("Ảnh vượt quá 25 MB. Vui lòng chọn ảnh nhỏ hơn.");
      return;
    }
    if (!isAllowedImageFile(file)) {
      setSlotError("Định dạng ảnh chưa được hỗ trợ.");
      return;
    }

    setSlotStatus((prev) => ({ ...prev, [meta.slot]: "Đang nén ảnh…" }));

    try {
      const compressRes = await compressImage(file, meta.kind);

      setSlotStatus((prev) => ({ ...prev, [meta.slot]: "Đang tải lên..." }));
      const uploaded = await uploadPhoto(
        weddingId,
        compressRes.blob,
        meta.kind,
        meta.slot,
        compressRes.contentType === "image/webp" ? "photo.webp" : "photo.jpg",
      );

      // Máy chủ đã thay thế ảnh cũ của ô này (theo id trong content) sau khi
      // insert thành công, nên chỉ cần loại ảnh cũ khỏi state.
      const previousPhoto = getSlotPhoto(meta.slot);
      let nextPhotos = [
        ...photos.filter((item) => item.id !== previousPhoto?.id),
        uploaded.photo,
      ];

      if (meta.slot === "hero") {
        setSlotStatus((prev) => ({
          ...prev,
          [meta.slot]: "Đang tạo ảnh chia sẻ...",
        }));
        try {
          const ogFile = await createOgCoverImage(file);
          const ogUploaded = await uploadPhoto(weddingId, ogFile, "og", "og");
          nextPhotos = [
            ...nextPhotos.filter((p) => p.kind !== "og"),
            ogUploaded.photo,
          ];
        } catch {
          showToast(
            "Đã lưu ảnh bìa, nhưng chưa tạo được ảnh thu gọn khi chia sẻ link.",
            "info",
          );
        }
      }

      onPhotosStateChange(nextPhotos, uploaded.content);
      const savedMsg = formatSavedSize(
        compressRes.originalBytes,
        compressRes.outputBytes,
      );
      showToast(
        `Đã cập nhật ${meta.title.toLowerCase()} (${savedMsg})`,
        "success",
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setSlotError(
        err instanceof Error ? err.message : "Không thể tải ảnh lên lúc này.",
      );
    } finally {
      setSlotStatus((prev) => {
        const next = { ...prev };
        delete next[meta.slot];
        return next;
      });
    }
  };

  const handleGalleryFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selectedFiles.length === 0) return;

    setGalleryError(null);
    let workingPhotos = [...photos];
    let currentGalleryCount = galleryPhotos.length;
    let uploadedCount = 0;
    let totalOriginalBytes = 0;
    let totalOutputBytes = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      if (isRawImageFile(file)) {
        setGalleryError("Ảnh RAW chưa được hỗ trợ. Vui lòng xuất sang JPEG rồi tải lên.");
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        setGalleryError("Ảnh vượt quá 25 MB. Vui lòng chọn ảnh nhỏ hơn.");
        continue;
      }
      if (!isAllowedImageFile(file)) {
        setGalleryError("Định dạng ảnh chưa được hỗ trợ.");
        continue;
      }

      if (currentGalleryCount >= galleryLimit) {
        setGalleryError(getPhotoLimitMessage(plan, "gallery"));
        break;
      }

      try {
        setGalleryStatus(
          selectedFiles.length > 1
            ? `Đang nén ảnh… (${i + 1}/${selectedFiles.length})`
            : "Đang nén ảnh…",
        );
        const compressRes = await compressImage(file, "gallery");

        setGalleryStatus(
          selectedFiles.length > 1
            ? `Đang tải lên (${i + 1}/${selectedFiles.length})...`
            : "Đang tải lên...",
        );
        const res = await uploadPhoto(
          weddingId,
          compressRes.blob,
          "gallery",
          undefined,
          compressRes.contentType === "image/webp" ? "photo.webp" : "photo.jpg",
        );

        workingPhotos = [...workingPhotos, res.photo];
        currentGalleryCount += 1;
        uploadedCount += 1;
        totalOriginalBytes += compressRes.originalBytes;
        totalOutputBytes += compressRes.outputBytes;
        onPhotosStateChange(workingPhotos, res.content);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          setGalleryStatus(null);
          window.location.assign("/auth/login");
          return;
        }
        setGalleryError(
          err instanceof Error ? err.message : "Không thể tải ảnh vào thư viện.",
        );
        break;
      }
    }

    setGalleryStatus(null);
    if (uploadedCount > 0) {
      const savedMsg = formatSavedSize(totalOriginalBytes, totalOutputBytes);
      showToast(
        `Đã tải lên ${uploadedCount} ảnh vào thư viện (${savedMsg})`,
        "success",
      );
    }
  };

  const uploadSingleAlbumFile = async (
    file: File,
    currentCount: number,
    workingPhotosRef: { current: WeddingPhoto[] },
  ): Promise<{ success: boolean; error?: string; retryable?: boolean }> => {
    if (isRawImageFile(file)) {
      return {
        success: false,
        error: "Ảnh RAW chưa được hỗ trợ. Vui lòng xuất sang JPEG rồi tải lên.",
        retryable: false,
      };
    }
    if (file.size > 25 * 1024 * 1024) {
      return {
        success: false,
        error: "Ảnh vượt quá 25 MB. Vui lòng chọn ảnh nhỏ hơn.",
        retryable: false,
      };
    }
    if (!isAllowedImageFile(file)) {
      return {
        success: false,
        error: "Định dạng ảnh chưa được hỗ trợ.",
        retryable: false,
      };
    }
    if (currentCount >= albumLimit) {
      const limitMsg =
        plan === "pro"
          ? "Nâng cấp Pro để thêm ảnh"
          : "Đã đạt giới hạn 300 ảnh";
      return {
        success: false,
        error: limitMsg,
        retryable: false,
      };
    }

    try {
      setAlbumStatus("Đang nén ảnh…");
      const compressRes = await compressImage(file, "album");

      setAlbumStatus("Đang tải lên...");
      const res = await uploadPhoto(
        weddingId,
        compressRes.blob,
        "album",
        undefined,
        compressRes.contentType === "image/webp" ? "photo.webp" : "photo.jpg",
      );

      workingPhotosRef.current = [...workingPhotosRef.current, res.photo];
      onPhotosStateChange(workingPhotosRef.current, res.content);

      const savedMsg = formatSavedSize(
        compressRes.originalBytes,
        compressRes.outputBytes,
      );
      showToast(`Đã tải lên ảnh album (${savedMsg})`, "success");
      return { success: true };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return { success: false, error: "Phiên đăng nhập đã hết hạn.", retryable: false };
      }
      if (
        err instanceof ApiError &&
        (err.code === "PLAN_LIMIT" || err.message?.includes("PLAN_LIMIT"))
      ) {
        const limitMsg =
          plan === "pro"
            ? "Nâng cấp Pro để thêm ảnh"
            : "Đã đạt giới hạn 300 ảnh";
        return { success: false, error: limitMsg, retryable: false };
      }
      return {
        success: false,
        error: err instanceof Error ? err.message : "Không thể tải ảnh lên.",
        retryable: true,
      };
    }
  };

  const handleAlbumFilesSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selectedFiles.length === 0) return;

    const workingPhotosRef = { current: [...photos] };
    let currentAlbumCount = photos.filter((p) => p.kind === "album").length;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      setAlbumStatus(
        selectedFiles.length > 1
          ? `Đang tải ${i + 1} / ${selectedFiles.length}`
          : "Đang tải ảnh…",
      );

      const result = await uploadSingleAlbumFile(
        file,
        currentAlbumCount,
        workingPhotosRef,
      );
      if (result.success) {
        currentAlbumCount += 1;
      } else {
        setFailedAlbumUploads((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            file,
            error: result.error ?? "Tải ảnh thất bại.",
            retryable: result.retryable ?? true,
          },
        ]);
      }
    }

    setAlbumStatus(null);
  };

  const handleRetryFailedUpload = async (item: FailedUploadItem) => {
    setFailedAlbumUploads((prev) => prev.filter((f) => f.id !== item.id));

    const workingPhotosRef = { current: [...photos] };
    const currentAlbumCount = photos.filter((p) => p.kind === "album").length;
    setAlbumStatus("Đang tải lại ảnh…");

    const result = await uploadSingleAlbumFile(
      item.file,
      currentAlbumCount,
      workingPhotosRef,
    );
    if (!result.success) {
      setFailedAlbumUploads((prev) => [
        ...prev,
        {
          ...item,
          error: result.error ?? "Tải ảnh thất bại.",
        },
      ]);
    }
    setAlbumStatus(null);
  };

  const handleDismissFailedUpload = (id: string) => {
    setFailedAlbumUploads((prev) => prev.filter((f) => f.id !== id));
  };

  const handleConfirmDelete = async () => {
    if (!deletingTarget) return;
    setDeleting(true);
    try {
      const res = await deletePhoto(weddingId, deletingTarget.photo.id);
      const nextPhotos = photos.filter((p) => {
        if (p.id === deletingTarget.photo.id) return false;
        if (deletingTarget.photo.kind === "banner" && p.kind === "og") return false;
        return true;
      });
      onPhotosStateChange(nextPhotos, res.content);
      showToast(`Đã xóa ${deletingTarget.label.toLowerCase()}`, "success");
      setDeletingTarget(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setDeletingTarget(null);
        window.location.assign("/auth/login");
        return;
      }
      showToast(
        err instanceof Error ? err.message : "Không thể xóa ảnh.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const applyGalleryReorder = async (nextGallery: WeddingPhoto[]) => {
    const previousPhotos = photos;
    const reindexedGallery = nextGallery.map((p, index) => ({
      ...p,
      position: index,
    }));
    const nonGallery = photos.filter((p) => p.kind !== "gallery");
    onPhotosStateChange([...nonGallery, ...reindexedGallery]);
    setReordering(true);

    try {
      const saved = await reorderPhotos(
        weddingId,
        reindexedGallery.map((p, index) => ({ id: p.id, position: index })),
      );
      onPhotosStateChange(saved);
    } catch (err) {
      onPhotosStateChange(previousPhotos);
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      showToast(
        err instanceof Error ? err.message : "Không thể sắp xếp lại thư viện ảnh.",
        "error",
      );
    } finally {
      setReordering(false);
    }
  };

  const moveGalleryByOffset = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= galleryPhotos.length || reordering) return;
    const copy = [...galleryPhotos];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    applyGalleryReorder(copy);
  };

  const handleDropOnGalleryPhoto = (targetId: string) => {
    if (!draggingId || draggingId === targetId || reordering) {
      setDraggingId(null);
      return;
    }
    const fromIndex = galleryPhotos.findIndex((p) => p.id === draggingId);
    const toIndex = galleryPhotos.findIndex((p) => p.id === targetId);
    setDraggingId(null);
    if (fromIndex < 0 || toIndex < 0) return;
    const copy = [...galleryPhotos];
    const [moved] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, moved);
    applyGalleryReorder(copy);
  };

  const openSingleLightbox = (photo: WeddingPhoto, title: string) => {
    setLightboxPhotos([{ id: photo.id, url: photo.url, alt: title, position: 0 }]);
    setLightboxIndex(0);
  };

  const openGalleryLightbox = (index: number) => {
    setLightboxPhotos(
      galleryPhotos.map((p, i) => ({
        id: p.id,
        url: p.url,
        alt: `Khoảnh khắc #${i + 1}`,
        position: p.position,
      })),
    );
    setLightboxIndex(index);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold text-fg">
          Quản lý ảnh cưới
        </h2>
        <p className="text-xs text-fg-muted sm:text-sm">
          Ảnh sẽ được nén tự động để tải nhanh hơn. Ảnh tối đa 10 MB.
        </p>
      </div>

      {designerImageFields.length > 0 && (
        <Card className="space-y-4 p-4 sm:p-6">
          <div>
            <h3 className="font-sans text-base font-semibold text-fg">
              Ảnh theo mẫu thiết kế
            </h3>
            <p className="mt-0.5 text-xs text-fg-muted">
              Designer đã đặt sẵn các ô ảnh này. Tải ảnh của bạn lên đúng nhãn;
              ảnh sẽ được dùng trên thiệp khách.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {designerImageFields.map((field) => {
              const value = content.designerFields?.[field.key] ?? "";
              const busy = designerFieldBusy === field.key;
              return (
                <div
                  key={field.key}
                  className="flex flex-col justify-between rounded-xl border border-border bg-bg p-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-fg">{field.label}</p>
                    <div className="mt-2 overflow-hidden rounded-lg border border-border bg-surface-alt">
                      {value ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={value}
                          alt={field.label}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center text-[11px] text-fg-muted">
                          Chưa có ảnh
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[11px] font-medium text-fg hover:border-accent/60">
                      {busy ? (
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                      ) : (
                        <Upload className="h-3 w-3" aria-hidden="true" />
                      )}
                      {value ? "Đổi ảnh" : "Tải ảnh"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        disabled={busy}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void handleDesignerImage(field.key, file);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    {value && (
                      <button
                        type="button"
                        onClick={() => updateDesignerImage(field.key, null)}
                        className="text-[11px] text-fg-muted underline hover:text-danger-fg"
                      >
                        Bỏ ảnh
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {designerFieldError && (
            <p role="alert" className="text-xs text-danger-fg">
              {designerFieldError}
            </p>
          )}
        </Card>
      )}

      {/* 3 ảnh chính: Ảnh bìa, Chú rể, Cô dâu */}
      <Card className="space-y-4 p-4 sm:p-6">
        <div>
          <h3 className="font-sans text-base font-semibold text-fg">
            Ảnh chính trên thiệp
          </h3>
          <p className="mt-0.5 text-xs text-fg-muted">
            Mỗi thiệp gồm tối đa {limits.photos.banner} ảnh bìa và {limits.photos.couple} ảnh cặp đôi.
          </p>
        </div>

        {slotError && (
          <p
            role="alert"
            className="rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs text-danger-fg"
          >
            {slotError}
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {visibleSingleSlots.map((meta) => {
            const currentPhoto = getSlotPhoto(meta.slot);
            const busyText = slotStatus[meta.slot];
            const inputRef = inputRefs[meta.slot];

            return (
              <div
                key={meta.slot}
                className="flex flex-col justify-between rounded-xl border border-border bg-bg p-3"
              >
                <div>
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg border border-border bg-surface">
                    {currentPhoto ? (
                      <button
                        type="button"
                        onClick={() => openSingleLightbox(currentPhoto, meta.title)}
                        className="block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        aria-label={`Phóng to ${meta.title}`}
                      >
                        <img
                          src={currentPhoto.url}
                          alt={meta.title}
                          className="h-full w-full object-cover object-[center_20%]"
                        />
                      </button>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center text-fg-muted">
                        <ImageOff className="h-6 w-6 text-accent-text" aria-hidden="true" />
                        <span className="text-xs font-medium">Chưa có ảnh</span>
                      </div>
                    )}

                    {busyText && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/75 px-3 text-center text-xs font-medium text-white">
                        <Loader2 className="h-5 w-5 animate-spin text-accent" aria-hidden="true" />
                        <span>{busyText}</span>
                      </div>
                    )}
                  </div>

                  <p className="mt-2.5 text-sm font-semibold text-fg">{meta.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-fg-muted">
                    {meta.description}
                  </p>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,.heic,.heif"
                  onChange={(e) => handleSlotFileSelected(meta, e)}
                  className="hidden"
                />

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant={currentPhoto ? "outline" : "primary"}
                    size="sm"
                    className="flex-1"
                    disabled={Boolean(busyText)}
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{currentPhoto ? "Đổi ảnh" : "Tải ảnh"}</span>
                  </Button>
                  {currentPhoto && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={Boolean(busyText)}
                      onClick={() => void openRecrop(meta, currentPhoto)}
                      aria-label={`Căn lại ${meta.title}`}
                    >
                      <Crop className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Căn lại</span>
                    </Button>
                  )}
                  {currentPhoto && (
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={Boolean(busyText)}
                      onClick={() =>
                        setDeletingTarget({ photo: currentPhoto, label: meta.title })
                      }
                      aria-label={`Xóa ${meta.title}`}
                      className="text-danger-fg hover:bg-danger-bg"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Thư viện ảnh cưới */}
      <Card className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-sans text-base font-semibold text-fg">
              Thư viện ảnh ({galleryPhotos.length}/{galleryLimit})
            </h3>
            <p className="mt-0.5 text-xs text-fg-muted">
              Gói {getPlanLabel(plan)} cho phép lưu tối đa {galleryLimit} ảnh kỷ niệm. Kéo thả hoặc dùng nút mũi tên để sắp xếp thứ tự.
            </p>
          </div>

          <input
            ref={galleryInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,.heic,.heif"
            onChange={handleGalleryFilesSelected}
            className="hidden"
          />

          <div className="flex flex-col items-start gap-1 sm:items-end">
            <Button
              variant="primary"
              size="sm"
              onClick={() => galleryInputRef.current?.click()}
              disabled={reachedGalleryLimit || Boolean(galleryStatus)}
              title={
                reachedGalleryLimit ? getPhotoLimitMessage(plan, "gallery") : undefined
              }
            >
              {galleryStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
              )}
              <span>{galleryStatus ?? "Thêm ảnh thư viện"}</span>
            </Button>
            <span className="text-[11px] text-fg-muted">
              Ảnh sẽ được nén tự động để tải nhanh hơn. Ảnh tối đa 10 MB.
            </span>
          </div>
        </div>

        {reachedGalleryLimit && (
          <div className="rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-xs text-text">
            {getPhotoLimitMessage(plan, "gallery")}{" "}
            <Link href="/#bang-gia" className="font-semibold text-text underline">
              Nâng cấp gói
            </Link>
          </div>
        )}

        {galleryError && (
          <p
            role="alert"
            className="rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs text-danger-fg"
          >
            {galleryError}
          </p>
        )}

        {galleryPhotos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-bg p-8 text-center">
            <ImageOff className="mx-auto h-7 w-7 text-accent-text" aria-hidden="true" />
            <p className="mt-2 text-sm font-medium text-fg">
              Chưa có ảnh trong thư viện
            </p>
            <p className="mt-1 text-xs text-fg-muted">
              Tải lên những khoảnh khắc đẹp nhất của hai bạn để hiển thị ở phần Album &amp; Dải ảnh trên thiệp.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {galleryPhotos.map((photo, index) => (
              <div
                key={photo.id}
                draggable={!reordering && galleryPhotos.length > 1}
                onDragStart={() => setDraggingId(photo.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnGalleryPhoto(photo.id)}
                onDragEnd={() => setDraggingId(null)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border border-border bg-bg p-2 transition-all",
                  draggingId === photo.id && "border-accent opacity-60",
                )}
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-surface">
                  <button
                    type="button"
                    onClick={() => openGalleryLightbox(index)}
                    className="block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                    aria-label={`Xem ảnh thư viện #${index + 1}`}
                  >
                    <img
                      src={photo.url}
                      alt={`Ảnh thư viện #${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </button>

                  <span className="pointer-events-none absolute top-2 left-2 rounded-full border border-border bg-bg/90 px-2 py-0.5 text-[10px] font-semibold text-accent-text">
                    #{index + 1}
                  </span>

                  {galleryPhotos.length > 1 && (
                    <span
                      title="Kéo thả để đổi vị trí"
                      className="pointer-events-none absolute top-2 right-2 rounded-md border border-border bg-bg/85 p-1 text-fg-muted"
                    >
                      <GripVertical className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {galleryPhotos.length > 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={index === 0 || reordering}
                          onClick={() => moveGalleryByOffset(index, -1)}
                          aria-label={`Đưa ảnh #${index + 1} lên trước`}
                          className="h-8 w-8 px-0"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={index === galleryPhotos.length - 1 || reordering}
                          onClick={() => moveGalleryByOffset(index, 1)}
                          aria-label={`Đưa ảnh #${index + 1} xuống sau`}
                          className="h-8 w-8 px-0"
                        >
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDeletingTarget({
                        photo,
                        label: `Ảnh thư viện #${index + 1}`,
                      })
                    }
                    aria-label={`Xóa ảnh thư viện #${index + 1}`}
                    className="h-8 px-2 text-danger-fg hover:bg-danger-bg"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Album cho khách */}
      <Card className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-sans text-base font-semibold text-fg">
                Album cho khách ({albumPhotos.length} / {albumLimit} ảnh)
              </h3>
              {plan === "free" ? (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-fg">
                  Standard &amp; Pro
                </span>
              ) : (
                <span className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-text">
                  Gói {getPlanLabel(plan)}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-fg-muted">
              Album ảnh để khách mời quét mã QR và xem toàn bộ album ảnh cưới trên điện thoại.
              {!galleryEnabled && " Tính năng đang hoàn thiện và sẽ mở lại sau."}
            </p>
            {galleryEnabled && (
              <a
                href={`/a/${weddingSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-accent-text underline-offset-2 hover:underline"
              >
                Mở album khách
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </div>

          {plan !== "free" && (
            <>
              <input
                ref={albumInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/heic,.heic,.heif"
                onChange={handleAlbumFilesSelected}
                className="hidden"
              />

              <div className="flex flex-col items-start gap-1 sm:items-end">
                <div className="flex flex-wrap items-center gap-2">
                  {reachedAlbumLimit && plan === "pro" && (
                    <Link
                      href="/#bang-gia"
                      className="inline-flex h-8 items-center justify-center rounded-full bg-accent px-3.5 text-xs font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover"
                    >
                      Nâng cấp Pro để thêm ảnh
                    </Link>
                  )}
                  {reachedAlbumLimit && plan === "vip" && (
                    <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-fg-muted">
                      Đã đạt giới hạn 300 ảnh
                    </span>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => albumInputRef.current?.click()}
                    disabled={
                      !galleryEnabled || reachedAlbumLimit || Boolean(albumStatus)
                    }
                    title={
                      !galleryEnabled
                        ? "Tính năng đang hoàn thiện"
                        : reachedAlbumLimit
                          ? plan === "pro"
                            ? "Nâng cấp Pro để thêm ảnh"
                            : "Đã đạt giới hạn 300 ảnh"
                          : undefined
                    }
                  >
                    {albumStatus ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ImagePlus className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>
                      {albumStatus ??
                        (galleryEnabled ? "Tải ảnh vào album" : "Đang hoàn thiện")}
                    </span>
                  </Button>
                </div>
                <span className="text-[11px] text-fg-muted">
                  Tự động nén WebP tối đa 1600px. Hỗ trợ chọn nhiều ảnh.
                </span>
              </div>
            </>
          )}
        </div>

        {plan !== "free" && albumQr && (
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg p-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => setQrPreviewOpen(true)}
              className="shrink-0 cursor-zoom-in rounded-lg border border-border bg-surface p-1.5 transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              aria-label="Phóng to QR album"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={albumQr}
                alt="Mã QR album ảnh cho khách"
                className="h-24 w-24 object-contain"
              />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">QR album cho khách</p>
              <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-fg-muted">
                Khách quét mã này để mở album ảnh cưới. Bấm vào QR để phóng to.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <a
                  href={`/a/${weddingSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-accent-text underline-offset-2 hover:underline"
                >
                  Mở album khách
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => setQrPreviewOpen(true)}
                  className="text-xs font-semibold text-fg-muted underline-offset-2 hover:underline"
                >
                  Phóng to QR
                </button>
              </div>
            </div>
          </div>
        )}

        {plan === "free" ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-bg p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-text">
              <Lock className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-semibold text-fg">
              Album cho khách dành riêng cho gói Standard và Pro
            </p>
            <p className="mt-1 max-w-md text-xs text-fg-muted">
              Gói Standard hỗ trợ 30 ảnh, gói Pro hỗ trợ đến 300 ảnh sắc nét để chia sẻ với người thân và khách mời qua mã QR.
            </p>
            <Link
              href="/#bang-gia"
              className="mt-4 inline-flex h-9 items-center justify-center rounded-full bg-accent px-5 text-xs font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
            >
              Nâng cấp gói để mở khóa Album
            </Link>
          </div>
        ) : (
          <>
            {/* Danh sách các ảnh upload lỗi với nút Thử lại từng ảnh */}
            {failedAlbumUploads.length > 0 && (
              <div className="space-y-2">
                {failedAlbumUploads.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs text-danger-fg"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <span className="font-semibold truncate block">
                          {item.file.name}
                        </span>
                        <span className="text-[11px] opacity-90">{item.error}</span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {item.retryable !== false && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleRetryFailedUpload(item)}
                          disabled={Boolean(albumStatus)}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" aria-hidden="true" />
                          Thử lại
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-danger-fg hover:bg-danger-border/30"
                        onClick={() => handleDismissFailedUpload(item.id)}
                        aria-label="Bỏ qua lỗi này"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {albumPhotos.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-bg p-8 text-center">
                <ImageOff className="mx-auto h-7 w-7 text-accent-text" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-fg">
                  Chưa có ảnh trong Album cho khách
                </p>
                <p className="mt-1 text-xs text-fg-muted">
                  Tải lên những tấm hình kỷ niệm để khách mời có thể chiêm ngưỡng trọn bộ ngày vui.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {albumPhotos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="group relative overflow-hidden rounded-xl border border-border bg-bg p-2 transition-all hover:border-accent"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-surface">
                      <button
                        type="button"
                        onClick={() => openSingleLightbox(photo, `Ảnh album #${index + 1}`)}
                        className="block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        aria-label={`Xem ảnh album #${index + 1}`}
                      >
                        <img
                          src={photo.url}
                          alt={`Ảnh album #${index + 1}`}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      </button>

                      <span className="pointer-events-none absolute top-1.5 left-1.5 rounded-full border border-border bg-bg/90 px-1.5 py-0.2 text-[9px] font-semibold text-accent-text">
                        #{index + 1}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-[10px] text-fg-muted truncate">
                        Ảnh #{index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-danger-fg hover:bg-danger-bg"
                        onClick={() =>
                          setDeletingTarget({
                            photo,
                            label: `Ảnh album #${index + 1}`,
                          })
                        }
                        aria-label={`Xóa ảnh album #${index + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>

      {/* Màn hình chiếu LED tiệc cưới (Live QR Photo Wall) */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent-text">
              <Tv className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-fg">
                  Màn hình chiếu LED tiệc cưới (Live Photo Wall)
                </h3>
                <span className="rounded-full bg-[#141210] border border-[#D8B15B]/70 px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#D8B15B] uppercase">
                  Pro
                </span>
              </div>
              <p className="mt-0.5 text-xs text-fg-muted">
                Trình chiếu ảnh cưới &amp; ảnh khách mời tải lên trực tiếp lên màn hình LED / TV sảnh tiệc tỷ lệ 16:9 sắc nét.
              </p>
            </div>
          </div>
        </div>

        {plan !== "vip" ? (
          <div
            onClick={() => setLedUpgradeOpen(true)}
            className="mt-4 flex cursor-pointer flex-col gap-3 rounded-xl border border-dashed border-border bg-bg p-4 transition-colors hover:border-accent/40"
          >
            <div className="max-w-md mx-auto w-full">
              <LedMiniDemo />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#8A6D3B]">
                <Lock className="h-4 w-4 shrink-0" />
                <span>Tính năng trình chiếu màn hình LED chỉ khả dụng ở gói Pro.</span>
              </div>
              <span className="text-xs font-semibold text-accent-text underline">
                Tìm hiểu &amp; Nâng cấp →
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-fg-muted">
              Khách mời quét mã QR ở góc màn hình để gửi ảnh trực tiếp từ điện thoại lên màn hình sân khấu tiệc cưới trong thời gian thực.
            </p>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-2.5 pt-3 border-t border-border/70">
            <a
              href={ledToken ? `/led/${weddingSlug}?key=${ledToken}` : `/led/${weddingSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-accent bg-accent px-4 text-xs font-semibold text-accent-fg shadow-xs transition-colors hover:bg-accent-hover active:scale-95"
            >
              <Tv className="h-3.5 w-3.5" />
              <span>Mở màn hình chiếu LED (Toàn màn hình)</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            <button
              type="button"
              onClick={handleCopyLedLink}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-4 text-xs font-medium text-fg transition-colors hover:bg-surface-alt active:scale-95"
            >
              {copiedLedLink ? (
                <Check className="h-3.5 w-3.5 text-success-fg" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>
                {copiedLedLink ? "Đã sao chép link LED" : "Copy link cho kỹ thuật viên âm thanh / ánh sáng"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStandeeModalOpen(true)}
              className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[#B89B72]/60 bg-white px-4 text-xs font-semibold text-[#1F1D1A] shadow-xs transition-colors hover:bg-[#FAF8F5] active:scale-95"
            >
              <Printer className="h-3.5 w-3.5 text-[#B89B72]" />
              <span>Tải bảng QR để bàn (In A5/A6)</span>
            </button>
          </div>
        )}
      </div>



      {/* Modal giới thiệu & nâng cấp gói Pro */}
      <VipFeatureModal
        open={ledUpgradeOpen}
        onClose={() => setLedUpgradeOpen(false)}
      />

      <TemplateLightboxModal
        photos={lightboxPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />

      <Dialog
        open={Boolean(deletingTarget)}
        onClose={() => !deleting && setDeletingTarget(null)}
        title="Xác nhận xóa ảnh"
        description={
          deletingTarget
            ? `Bạn có chắc muốn xóa "${deletingTarget.label}"? File ảnh sẽ bị xóa vĩnh viễn khỏi lưu trữ.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setDeletingTarget(null)}
            disabled={deleting}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            onClick={handleConfirmDelete}
          >
            Xóa ảnh
          </Button>
        </div>
      </Dialog>

      <Dialog
        open={qrPreviewOpen && Boolean(albumQr)}
        onClose={() => setQrPreviewOpen(false)}
        title="QR album cho khách"
        description="Khách quét mã để mở album ảnh cưới."
        className="max-w-sm"
      >
        <div className="space-y-4 text-center">
          {albumQr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={albumQr}
              alt="Mã QR album phóng to"
              className="mx-auto w-full max-w-[280px] rounded-xl border border-border bg-surface object-contain p-2"
            />
          )}
          <a
            href={`/a/${weddingSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-surface px-5 text-xs font-semibold text-text"
          >
            Mở album khách
          </a>
        </div>
      </Dialog>

      <TableStandeeModal
        open={standeeModalOpen}
        onClose={() => setStandeeModalOpen(false)}
        weddingSlug={weddingSlug}
        coupleTitle={
          [content.couple?.groomName, content.couple?.brideName]
            .filter(Boolean)
            .join(" & ") || "Tiệc Cưới"
        }
        weddingDate={content.date}
      />

      <ImageCropDialog
        file={cropRequest?.file ?? null}
        aspect={cropRequest?.aspect ?? 3 / 4}
        title={cropRequest?.title}
        onCancel={() => setCropRequest(null)}
        onConfirm={(cropped) => cropRequest?.onConfirm(cropped)}
      />
    </div>
  );
}
