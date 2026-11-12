"use client";

import * as React from "react";
import Link from "next/link";
import {
  Gift,
  Loader2,
  Lock,
  QrCode,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  getPhotoLimitMessage,
  getPlanLabel,
  isTemplateAllowedForPlan,
} from "@/config/plans";
import { ApiError, deletePhoto, deleteWedding, uploadPhoto } from "@/lib/api";
import { compressImageFile } from "@/lib/image-compress";
import {
  GIFT_ACCOUNT_MAX_LENGTH,
  GIFT_TEXT_MAX_LENGTH,
  NAME_MAX_LENGTH,
  QUOTE_MAX_LENGTH,
  type PhotoSlot,
  type WeddingContent,
  type WeddingDetail,
  type WeddingPhoto,
  toIsoPlus07,
} from "@/lib/types";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { TEMPLATE_REGISTRY } from "@/templates/registry";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Textarea } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

interface WeddingInfoEditorProps {
  wedding: WeddingDetail;
  draftContent: WeddingContent;
  draftTemplateId: string;
  photos: WeddingPhoto[];
  isDirty: boolean;
  saving: boolean;
  saveError: string | null;
  fieldErrors: Record<string, string>;
  onDraftChange: (next: WeddingContent) => void;
  onTemplateChange: (nextTemplateId: string) => void;
  onPhotosStateChange: (
    nextPhotos: WeddingPhoto[],
    serverContent?: WeddingContent,
  ) => void;
  onSave: () => Promise<boolean>;
  onResetDraft: () => void;
  onDeleted: () => void;
}

/**
 * Chuyển chuỗi ISO (+07:00 hoặc Z) sang giá trị YYYY-MM-DDTHH:mm giờ Việt Nam cho input datetime-local.
 */
export function toDatetimeLocalVn(isoString: string): string {
  const iso = toIsoPlus07(isoString);
  const directMatch = iso.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return directMatch ? directMatch[1] : "";
}

export function WeddingInfoEditor({
  wedding,
  draftContent,
  draftTemplateId,
  photos,
  isDirty,
  saving,
  saveError,
  fieldErrors,
  onDraftChange,
  onTemplateChange,
  onPhotosStateChange,
  onSave,
  onResetDraft,
  onDeleted,
}: WeddingInfoEditorProps) {
  const { showToast } = useToast();
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [qrBusySlot, setQrBusySlot] = React.useState<"gift-groom" | "gift-bride" | null>(
    null,
  );
  const [qrError, setQrError] = React.useState<string | null>(null);
  const groomQrInputRef = React.useRef<HTMLInputElement | null>(null);
  const brideQrInputRef = React.useRef<HTMLInputElement | null>(null);

  const groomQrPhoto = React.useMemo(
    () => photos.find((p) => p.kind === "gift" && p.position === 0) ?? null,
    [photos],
  );
  const brideQrPhoto = React.useMemo(
    () => photos.find((p) => p.kind === "gift" && p.position === 1) ?? null,
    [photos],
  );

  const updateCouple = (patch: Partial<WeddingContent["couple"]>) => {
    onDraftChange({
      ...draftContent,
      couple: {
        ...draftContent.couple,
        ...patch,
      },
    });
  };

  const updateGift = (patch: Partial<WeddingContent["gift"]>) => {
    onDraftChange({
      ...draftContent,
      gift: {
        ...draftContent.gift,
        ...patch,
      },
    });
  };

  const handleQrFileSelected = async (
    slot: Extract<PhotoSlot, "gift-groom" | "gift-bride">,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || wedding.plan === "free") return;

    setQrError(null);
    setQrBusySlot(slot);
    const targetPosition = slot === "gift-groom" ? 0 : 1;

    try {
      const compressed = await compressImageFile(file);
      const uploaded = await uploadPhoto(wedding.id, compressed, "gift", slot);
      const nextPhotos = [
        ...photos.filter(
          (p) => !(p.kind === "gift" && p.position === targetPosition),
        ),
        uploaded.photo,
      ];
      onPhotosStateChange(nextPhotos, uploaded.content);
      showToast(
        slot === "gift-groom"
          ? "Đã cập nhật ảnh QR nhà trai"
          : "Đã cập nhật ảnh QR nhà gái",
        "success",
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setQrError(
        err instanceof Error ? err.message : "Không thể tải ảnh QR quà mừng.",
      );
    } finally {
      setQrBusySlot(null);
    }
  };

  const handleDeleteQrPhoto = async (
    slot: Extract<PhotoSlot, "gift-groom" | "gift-bride">,
    photo: WeddingPhoto,
  ) => {
    setQrError(null);
    setQrBusySlot(slot);
    try {
      const res = await deletePhoto(wedding.id, photo.id);
      const nextPhotos = photos.filter((p) => p.id !== photo.id);
      onPhotosStateChange(nextPhotos, res.content);
      showToast(
        slot === "gift-groom"
          ? "Đã xóa ảnh QR nhà trai"
          : "Đã xóa ảnh QR nhà gái",
        "success",
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/auth/login");
        return;
      }
      setQrError(
        err instanceof Error ? err.message : "Không thể xóa ảnh QR quà mừng.",
      );
    } finally {
      setQrBusySlot(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave();
  };

  const handleConfirmDeleteWedding = async () => {
    setDeleting(true);
    try {
      await deleteWedding(wedding.id);
      showToast("Đã xóa thiệp cưới", "success");
      setDeleteOpen(false);
      onDeleted();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setDeleteOpen(false);
        window.location.assign("/auth/login");
        return;
      }
      showToast(
        err instanceof Error ? err.message : "Không thể xóa thiệp cưới.",
        "error",
      );
    } finally {
      setDeleting(false);
    }
  };

  const dateValue = toDatetimeLocalVn(draftContent.date);
  const datePreview = formatWeddingDateParts(draftContent.date);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-fg">
              Thông tin cưới &amp; mẫu thiệp
            </h2>
            <p className="text-xs text-fg-muted sm:text-sm">
              Mọi thay đổi hiển thị ngay trên khung xem trước bên phải trước khi bạn nhấn lưu.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onResetDraft}
                disabled={saving}
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Hoàn tác</span>
              </Button>
            )}
            <Button type="submit" variant="primary" loading={saving}>
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>Lưu thay đổi</span>
            </Button>
          </div>
        </div>

        {saveError && (
          <div
            role="alert"
            className="rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-sm text-danger-fg"
          >
            {saveError}
          </div>
        )}

        {/* Chọn mẫu thiệp */}
        <Card className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 font-sans text-base font-semibold text-fg">
                <Sparkles className="h-4 w-4 text-accent-text" aria-hidden="true" />
                <span>Mẫu giao diện thiệp</span>
              </h3>
              <p className="mt-0.5 text-xs text-fg-muted">
                Thiệp hiện đang ở gói{" "}
                <strong className="text-accent-text">{getPlanLabel(wedding.plan)}</strong>.
              </p>
            </div>
            {wedding.plan === "free" && (
              <Link
                href="/#bang-gia"
                className="text-xs font-medium text-accent-text underline underline-offset-4 hover:text-accent-hover"
              >
                Xem bảng giá nâng cấp
              </Link>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {TEMPLATE_REGISTRY.map((tpl) => {
              const isSelected = draftTemplateId === tpl.id;
              const allowed =
                !tpl.isPlaceholder &&
                (isTemplateAllowedForPlan(wedding.plan, tpl.plan) ||
                  tpl.id === wedding.templateId);

              return (
                <button
                  key={tpl.id}
                  type="button"
                  disabled={!allowed}
                  onClick={() => allowed && onTemplateChange(tpl.id)}
                  className={cn(
                    "flex flex-col justify-between rounded-xl border p-3.5 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                    isSelected
                      ? "border-accent bg-accent-soft"
                      : allowed
                        ? "cursor-pointer border-border bg-bg hover:border-accent/55"
                        : "cursor-not-allowed border-border/70 bg-surface-muted/45 opacity-70",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3.5 w-3.5 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: tpl.accentSwatch }}
                        aria-hidden="true"
                      />
                      <span className="text-sm font-semibold text-fg">{tpl.name}</span>
                    </div>
                    {tpl.isPlaceholder ? (
                      <span className="rounded-full border border-soon-border bg-soon-bg px-2 py-0.5 text-[10px] font-medium text-soon-fg">
                        Sắp có
                      </span>
                    ) : !allowed ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-text">
                        <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                        <span>Gói {getPlanLabel(tpl.plan)}</span>
                      </span>
                    ) : (
                      <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-fg-muted">
                        {getPlanLabel(tpl.plan)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">
                    {tpl.subtitle}
                  </p>
                </button>
              );
            })}
          </div>
          {fieldErrors.templateId && (
            <p role="alert" className="text-xs text-danger-fg">
              {fieldErrors.templateId}
            </p>
          )}
        </Card>

        {/* Cô dâu & Chú rể */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="space-y-4 p-4 sm:p-5">
            <h3 className="font-sans text-base font-semibold text-accent-text">
              Chú rể &amp; Nhà trai
            </h3>
            <Input
              label="Tên gọi ngắn chú rể *"
              value={draftContent.couple.groomName}
              onChange={(e) => updateCouple({ groomName: e.target.value })}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Ví dụ: Minh"
              error={fieldErrors["couple.groomName"]}
            />
            <Input
              label="Họ và tên đầy đủ"
              value={draftContent.couple.groomFullName}
              onChange={(e) => updateCouple({ groomFullName: e.target.value })}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Ví dụ: Nguyễn Hoàng Minh"
              error={fieldErrors["couple.groomFullName"]}
            />
            <Input
              label="Phụ huynh nhà trai"
              value={draftContent.couple.groomParents}
              onChange={(e) => updateCouple({ groomParents: e.target.value })}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Ông Nguyễn Văn B & Bà Lê Thị C"
              hint="Ngăn cách tên hai phụ huynh bằng dấu &"
              error={fieldErrors["couple.groomParents"]}
            />
          </Card>

          <Card className="space-y-4 p-4 sm:p-5">
            <h3 className="font-sans text-base font-semibold text-accent-text">
              Cô dâu &amp; Nhà gái
            </h3>
            <Input
              label="Tên gọi ngắn cô dâu *"
              value={draftContent.couple.brideName}
              onChange={(e) => updateCouple({ brideName: e.target.value })}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Ví dụ: Lan"
              error={fieldErrors["couple.brideName"]}
            />
            <Input
              label="Họ và tên đầy đủ"
              value={draftContent.couple.brideFullName}
              onChange={(e) => updateCouple({ brideFullName: e.target.value })}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Ví dụ: Trần Ngọc Lan"
              error={fieldErrors["couple.brideFullName"]}
            />
            <Input
              label="Phụ huynh nhà gái"
              value={draftContent.couple.brideParents}
              onChange={(e) => updateCouple({ brideParents: e.target.value })}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Ông Trần Văn D & Bà Phạm Thị E"
              hint="Ngăn cách tên hai phụ huynh bằng dấu &"
              error={fieldErrors["couple.brideParents"]}
            />
          </Card>
        </div>

        {/* Ngày cưới chính & Lời dẫn */}
        <Card className="space-y-4 p-4 sm:p-6">
          <h3 className="font-sans text-base font-semibold text-fg">
            Thời gian cưới &amp; lời dẫn
          </h3>
          <Input
            type="datetime-local"
            label="Ngày giờ cưới chính (múi giờ Việt Nam +07:00) *"
            value={dateValue}
            onChange={(e) => {
              const nextIso = toIsoPlus07(e.target.value);
              onDraftChange({
                ...draftContent,
                date: nextIso || e.target.value,
              });
            }}
            hint={
              datePreview.day !== "--"
                ? `Hiển thị trên thiệp: ${datePreview.time}, ${datePreview.weekday} · ${datePreview.dotDate}`
                : "Chọn ngày và giờ cử hành hôn lễ chính."
            }
            error={fieldErrors.date}
          />

          <div>
            <Textarea
              label="Lời dẫn ngắn / câu trích dẫn"
              rows={3}
              maxLength={QUOTE_MAX_LENGTH}
              value={draftContent.quote}
              onChange={(e) =>
                onDraftChange({ ...draftContent, quote: e.target.value })
              }
              placeholder="Ví dụ: Trăm năm tình viên mãn, bạc đầu nghĩa phu thê..."
              error={fieldErrors.quote}
            />
            <div className="mt-1 flex justify-end">
              <span className="text-xs text-fg-muted tabular-nums">
                {draftContent.quote.length}/{QUOTE_MAX_LENGTH} ký tự
              </span>
            </div>
          </div>
        </Card>

        {/* Quà mừng & chuyển khoản */}
        <Card className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="flex items-center gap-2 font-sans text-base font-semibold text-fg">
                <Gift className="h-4 w-4 text-accent-text" aria-hidden="true" />
                <span>Quà mừng &amp; chuyển khoản</span>
              </h3>
              <p className="mt-0.5 text-xs text-fg-muted">
                Hiển thị trong hộp thoại Quà mừng trên thiệp. Để trống cả hai bên nếu không muốn hiện nút Quà mừng.
              </p>
            </div>
          </div>

          {qrError && (
            <p
              role="alert"
              className="rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs text-danger-fg"
            >
              {qrError}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Nhà trai */}
            <div className="space-y-3 rounded-xl border border-border bg-bg p-4">
              <p className="font-sans text-sm font-semibold text-accent-text">
                Tài khoản Nhà trai
              </p>
              <Input
                label="Ngân hàng"
                value={draftContent.gift.groomBankName}
                onChange={(e) => updateGift({ groomBankName: e.target.value })}
                maxLength={GIFT_TEXT_MAX_LENGTH}
                placeholder="Ví dụ: Vietcombank"
                error={fieldErrors["gift.groomBankName"]}
              />
              <Input
                label="Tên tài khoản"
                value={draftContent.gift.groomAccountName}
                onChange={(e) => updateGift({ groomAccountName: e.target.value })}
                maxLength={GIFT_TEXT_MAX_LENGTH}
                placeholder="NGUYEN HOANG MINH"
                error={fieldErrors["gift.groomAccountName"]}
              />
              <Input
                label="Số tài khoản"
                value={draftContent.gift.groomAccountNumber}
                onChange={(e) => updateGift({ groomAccountNumber: e.target.value })}
                maxLength={GIFT_ACCOUNT_MAX_LENGTH}
                placeholder="0123456789"
                error={fieldErrors["gift.groomAccountNumber"]}
              />

              <div className="border-t border-border/80 pt-3">
                <p className="text-xs font-medium text-fg">Ảnh QR Nhà trai</p>
                {wedding.plan === "free" ? (
                  <p className="mt-1.5 rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-xs text-text">
                    {getPhotoLimitMessage("free", "gift")}{" "}
                    <Link
                      href="/#bang-gia"
                      className="font-semibold text-text underline"
                    >
                      Xem bảng giá
                    </Link>
                  </p>
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
                      {groomQrPhoto ? (
                        <img
                          src={groomQrPhoto.url}
                          alt="QR chuyển khoản nhà trai"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <QrCode className="h-6 w-6 text-fg-muted" aria-hidden="true" />
                      )}
                      {qrBusySlot === "gift-groom" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                          <Loader2
                            className="h-5 w-5 animate-spin text-accent"
                            aria-hidden="true"
                          />
                        </div>
                      )}
                    </div>

                    <input
                      ref={groomQrInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleQrFileSelected("gift-groom", e)}
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={Boolean(qrBusySlot)}
                        onClick={() => groomQrInputRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{groomQrPhoto ? "Đổi QR" : "Tải ảnh QR"}</span>
                      </Button>
                      {groomQrPhoto && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={Boolean(qrBusySlot)}
                          onClick={() => handleDeleteQrPhoto("gift-groom", groomQrPhoto)}
                          className="text-danger-fg hover:bg-danger-bg"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Xóa QR</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nhà gái */}
            <div className="space-y-3 rounded-xl border border-border bg-bg p-4">
              <p className="font-sans text-sm font-semibold text-accent-text">
                Tài khoản Nhà gái
              </p>
              <Input
                label="Ngân hàng"
                value={draftContent.gift.brideBankName}
                onChange={(e) => updateGift({ brideBankName: e.target.value })}
                maxLength={GIFT_TEXT_MAX_LENGTH}
                placeholder="Ví dụ: Techcombank"
                error={fieldErrors["gift.brideBankName"]}
              />
              <Input
                label="Tên tài khoản"
                value={draftContent.gift.brideAccountName}
                onChange={(e) => updateGift({ brideAccountName: e.target.value })}
                maxLength={GIFT_TEXT_MAX_LENGTH}
                placeholder="TRAN NGOC LAN"
                error={fieldErrors["gift.brideAccountName"]}
              />
              <Input
                label="Số tài khoản"
                value={draftContent.gift.brideAccountNumber}
                onChange={(e) => updateGift({ brideAccountNumber: e.target.value })}
                maxLength={GIFT_ACCOUNT_MAX_LENGTH}
                placeholder="0987654321"
                error={fieldErrors["gift.brideAccountNumber"]}
              />

              <div className="border-t border-border/80 pt-3">
                <p className="text-xs font-medium text-fg">Ảnh QR Nhà gái</p>
                {wedding.plan === "free" ? (
                  <p className="mt-1.5 rounded-lg border border-accent/40 bg-accent-soft px-3 py-2 text-xs text-text">
                    {getPhotoLimitMessage("free", "gift")}{" "}
                    <Link
                      href="/#bang-gia"
                      className="font-semibold text-text underline"
                    >
                      Xem bảng giá
                    </Link>
                  </p>
                ) : (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
                      {brideQrPhoto ? (
                        <img
                          src={brideQrPhoto.url}
                          alt="QR chuyển khoản nhà gái"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <QrCode className="h-6 w-6 text-fg-muted" aria-hidden="true" />
                      )}
                      {qrBusySlot === "gift-bride" && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                          <Loader2
                            className="h-5 w-5 animate-spin text-accent"
                            aria-hidden="true"
                          />
                        </div>
                      )}
                    </div>

                    <input
                      ref={brideQrInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleQrFileSelected("gift-bride", e)}
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={Boolean(qrBusySlot)}
                        onClick={() => brideQrInputRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{brideQrPhoto ? "Đổi QR" : "Tải ảnh QR"}</span>
                      </Button>
                      {brideQrPhoto && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={Boolean(qrBusySlot)}
                          onClick={() => handleDeleteQrPhoto("gift-bride", brideQrPhoto)}
                          className="text-danger-fg hover:bg-danger-bg"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Xóa QR</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>Lưu thay đổi</span>
          </Button>
        </div>
      </form>

      {/* Vùng nguy hiểm: xóa thiệp */}
      <Card className="border-danger-border p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-sans text-base font-semibold text-danger-fg">
              Xóa thiệp cưới
            </h3>
            <p className="mt-0.5 text-xs text-fg-muted sm:text-sm">
              Thao tác này sẽ xóa vĩnh viễn thiệp <strong>/w/{wedding.slug}</strong> cùng
              toàn bộ lễ, ảnh, khách mời và lời chúc liên quan.
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteOpen(true)}
            className="self-start sm:self-auto"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span>Xóa thiệp này</span>
          </Button>
        </div>
      </Card>

      <Dialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        title="Xác nhận xóa thiệp cưới"
        description={`Bạn có chắc muốn xóa thiệp /w/${wedding.slug}? Toàn bộ dữ liệu lễ, ảnh cưới, khách mời và lời chúc sẽ bị mất và không thể khôi phục.`}
      >
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(false)}
            disabled={deleting}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            loading={deleting}
            onClick={handleConfirmDeleteWedding}
          >
            Xác nhận xóa
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

