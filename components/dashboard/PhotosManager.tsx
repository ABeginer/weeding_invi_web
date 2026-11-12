"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  GripVertical,
  ImageOff,
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
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
  uploadPhoto,
} from "@/lib/api";
import { compressImageFile, createOgCoverImage } from "@/lib/image-compress";
import type {
  PhotoKind,
  PhotoSlot,
  TemplatePhotoItem,
  WeddingContent,
  WeddingPhoto,
  WeddingPlan,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { TemplateLightboxModal } from "@/templates/shared/TemplateOverlays";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";

interface PhotosManagerProps {
  weddingId: string;
  plan: WeddingPlan;
  content: WeddingContent;
  photos: WeddingPhoto[];
  onPhotosStateChange: (
    nextPhotos: WeddingPhoto[],
    nextContent?: WeddingContent,
  ) => void;
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

export function PhotosManager({
  weddingId,
  plan,
  content,
  photos,
  onPhotosStateChange,
}: PhotosManagerProps) {
  const { showToast } = useToast();
  const limits = getPlanLimits(plan);

  const [slotStatus, setSlotStatus] = React.useState<
    Partial<Record<MainPhotoSlot, string>>
  >({});
  const [slotError, setSlotError] = React.useState<string | null>(null);

  const [galleryStatus, setGalleryStatus] = React.useState<string | null>(null);
  const [galleryError, setGalleryError] = React.useState<string | null>(null);
  const [reordering, setReordering] = React.useState(false);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);

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

  const handleSlotFileSelected = async (
    meta: SlotMeta,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setSlotError(null);
    setSlotStatus((prev) => ({ ...prev, [meta.slot]: "Đang xử lý ảnh..." }));

    let workingPhotos = photos;
    let workingContent = content;

    try {
      const compressed = await compressImageFile(file);
      const existingPhoto = getSlotPhoto(meta.slot);

      if (existingPhoto) {
        setSlotStatus((prev) => ({
          ...prev,
          [meta.slot]: "Đang thay ảnh cũ...",
        }));
        const delRes = await deletePhoto(weddingId, existingPhoto.id);
        workingPhotos = workingPhotos.filter((p) => p.id !== existingPhoto.id);
        workingContent = delRes.content;
        onPhotosStateChange(workingPhotos, workingContent);
      }

      setSlotStatus((prev) => ({ ...prev, [meta.slot]: "Đang tải lên..." }));
      const uploaded = await uploadPhoto(
        weddingId,
        compressed,
        meta.kind,
        meta.slot,
      );

      let nextPhotos = [...workingPhotos, uploaded.photo];

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
      showToast(`Đã cập nhật ${meta.title.toLowerCase()}`, "success");
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

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      if (currentGalleryCount >= galleryLimit) {
        setGalleryError(getPhotoLimitMessage(plan, "gallery"));
        break;
      }

      try {
        setGalleryStatus(
          selectedFiles.length > 1
            ? `Đang xử lý ảnh (${i + 1}/${selectedFiles.length})...`
            : "Đang xử lý ảnh...",
        );
        const compressed = await compressImageFile(file);

        setGalleryStatus(
          selectedFiles.length > 1
            ? `Đang tải lên (${i + 1}/${selectedFiles.length})...`
            : "Đang tải lên...",
        );
        const res = await uploadPhoto(weddingId, compressed, "gallery");

        workingPhotos = [...workingPhotos, res.photo];
        currentGalleryCount += 1;
        uploadedCount += 1;
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
      showToast(`Đã tải lên ${uploadedCount} ảnh vào thư viện`, "success");
    }
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
          Chọn ảnh từ điện thoại hoặc máy tính (tối đa 5 MB mỗi ảnh). Hệ thống tự tối ưu kích thước để thiệp mở nhanh.
        </p>
      </div>

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
          {SINGLE_SLOTS.map((meta) => {
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
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleSlotFileSelected(meta, e)}
                  className="hidden"
                />

                <div className="mt-3 flex items-center gap-2">
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
            accept="image/jpeg,image/png,image/webp"
            onChange={handleGalleryFilesSelected}
            className="hidden"
          />

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
    </div>
  );
}
