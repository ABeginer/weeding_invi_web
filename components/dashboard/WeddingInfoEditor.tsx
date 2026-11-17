"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  Gift,
  LayoutTemplate,
  Loader2,
  Lock,
  QrCode,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import {
  getPhotoLimitMessage,
  getPlanLabel,
  isTemplateAllowedForPlan,
} from "@/config/plans";
import { ApiError, assignDesignerTemplate, deletePhoto, deleteWedding, listDesignerTemplateOptions, uploadPhoto } from "@/lib/api";
import { compressImage, formatSavedSize } from "@/lib/image/compress";
import {
  GIFT_ACCOUNT_MAX_LENGTH,
  GIFT_TEXT_MAX_LENGTH,
  NAME_MAX_LENGTH,
  QUOTE_MAX_LENGTH,
  type DesignerTemplateAssignmentResult,
  type DesignerTemplateOption,
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
import {
  collectDesignerTextFields,
  collectDesignerImageFields,
} from "@/lib/designer-fields";
import { DesignerFieldsEditor } from "./DesignerFieldsEditor";
import { MusicEditor } from "./MusicEditor";

interface WeddingInfoEditorProps {
  wedding: WeddingDetail;
  draftContent: WeddingContent;
  draftTemplateId: string;
  designerCanvas?: Record<string, unknown> | null;
  photos: WeddingPhoto[];
  isDirty: boolean;
  saving: boolean;
  saveError: string | null;
  fieldErrors: Record<string, string>;
  onDraftChange: (next: WeddingContent) => void;
  onTemplateChange: (nextTemplateId: string) => void;
  onDesignerAssignment: (result: DesignerTemplateAssignmentResult) => void;
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

const TEMPLATE_THEME_FILTERS = [
  "Tất cả",
  "Thanh lịch",
  "Cổ điển",
  "Tối giản",
  "Hiện đại",
  "Lãng mạn",
  "Truyền thống",
];

interface PickerTemplate {
  id: string;
  name: string;
  subtitle: string;
  plan: "free" | "pro" | "vip";
  kind: "code" | "designer";
  isPlaceholder?: boolean;
  styleTags?: string[];
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không đọc được ảnh."));
    reader.readAsDataURL(blob);
  });
}

export function WeddingInfoEditor({
  wedding,
  draftContent,
  draftTemplateId,
  designerCanvas,
  photos,
  isDirty,
  saving,
  saveError,
  fieldErrors,
  onDraftChange,
  onTemplateChange,
  onDesignerAssignment,
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
  const [nameConfirmOpen, setNameConfirmOpen] = React.useState(false);

  const [templatePickerOpen, setTemplatePickerOpen] = React.useState(false);
  const [templateQuery, setTemplateQuery] = React.useState("");
  const [templateTheme, setTemplateTheme] = React.useState("Tất cả");
  const [designerOptions, setDesignerOptions] = React.useState<DesignerTemplateOption[]>([]);
  const [designerLoading, setDesignerLoading] = React.useState(true);
  const [designerError, setDesignerError] = React.useState<string | null>(null);
  const [designerBusyId, setDesignerBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    listDesignerTemplateOptions()
      .then((result) => {
        if (!cancelled) setDesignerOptions(result.items ?? []);
      })
      .catch((error) => {
        if (!cancelled) {
          setDesignerError(
            error instanceof Error
              ? error.message
              : "Không tải được mẫu thiết kế Designer.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setDesignerLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedDesigner = wedding.designerTemplate ?? null;
  const selectedTemplate = selectedDesigner
    ? null
    : TEMPLATE_REGISTRY.find((tpl) => tpl.id === draftTemplateId);
  const selectedDesignerOption = selectedDesigner
    ? designerOptions.find((option) => option.id === selectedDesigner.id) ?? null
    : null;
  const selectedName = selectedDesigner
    ? selectedDesignerOption?.displayTitle ??
      selectedDesigner.displayTitle ??
      selectedDesignerOption?.name ??
      selectedDesigner.name
    : selectedTemplate?.name;
  const selectedSubtitle = selectedDesigner
    ? selectedDesignerOption?.ritual ?? "Mẫu thiệp cưới"
    : selectedTemplate?.subtitle;
  const selectedPlan = selectedDesignerOption?.plan ?? selectedTemplate?.plan;
  const designerImageFields = React.useMemo(
    () => collectDesignerImageFields(designerCanvas),
    [designerCanvas],
  );
  const designerTextFields = React.useMemo(
    () => collectDesignerTextFields(designerCanvas),
    [designerCanvas],
  );
  const [designerFieldBusy, setDesignerFieldBusy] = React.useState<string | null>(
    null,
  );
  const [designerFieldError, setDesignerFieldError] = React.useState<string | null>(
    null,
  );

  const updateDesignerField = (key: string, value: string | null) => {
    const next = { ...(draftContent.designerFields ?? {}) };
    if (value) next[key] = value;
    else delete next[key];
    onDraftChange({ ...draftContent, designerFields: next });
  };

  const handleDesignerImage = async (key: string, file: File) => {
    setDesignerFieldError(null);
    setDesignerFieldBusy(key);
    try {
      const compressed = await compressImage(file, "gallery");
      const dataUrl = await readBlobAsDataUrl(compressed.blob);
      updateDesignerField(key, dataUrl);
    } catch (error) {
      setDesignerFieldError(
        error instanceof Error ? error.message : "Không tải được ảnh.",
      );
    } finally {
      setDesignerFieldBusy(null);
    }
  };

  const pickerTemplates = React.useMemo<PickerTemplate[]>(() => {
    const code: PickerTemplate[] = TEMPLATE_REGISTRY.map((tpl) => ({
      id: tpl.id,
      name: tpl.name,
      subtitle: tpl.subtitle,
      plan: tpl.plan,
      kind: "code",
      isPlaceholder: tpl.isPlaceholder,
      styleTags: tpl.styleTags,
    }));
    const designer: PickerTemplate[] = designerOptions.map((tpl) => ({
      id: tpl.id,
      name: tpl.displayTitle ?? tpl.name,
      subtitle: tpl.ritual ?? "Mẫu thiệp cưới",
      plan: tpl.plan,
      kind: "designer",
      styleTags: tpl.ritual ? [tpl.ritual] : [],
    }));
    const seen = new Set<string>();
    return [...designer, ...code].filter((tpl) => {
      const key = tpl.name.trim().toLocaleLowerCase("vi");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [designerOptions]);

  const filteredTemplates = pickerTemplates.filter((tpl) => {
    const searchable = [tpl.name, tpl.subtitle ?? "", ...(tpl.styleTags ?? [])]
      .join(" ")
      .toLowerCase();
    if (
      templateQuery.trim() &&
      !searchable.includes(templateQuery.trim().toLowerCase())
    ) {
      return false;
    }
    if (templateTheme === "Tất cả") return true;
    return searchable.includes(templateTheme.toLowerCase());
  });
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

  const updateDressCode = (index: number, color: string) => {
    const next = [
      ...(draftContent.dressCode ?? ["#6B1E2B", "#B35A6B", "#F6B8C6"]),
    ];
    next[index] = color;
    onDraftChange({ ...draftContent, dressCode: next.slice(0, 3) });
  };

  const toggleSection = (key: string) => {
    const current = new Set(draftContent.hiddenSections ?? []);
    if (current.has(key)) current.delete(key);
    else current.add(key);
    onDraftChange({
      ...draftContent,
      hiddenSections: Array.from(current),
    });
  };

  const [draggingSection, setDraggingSection] = React.useState<string | null>(null);
  const sectionLabels: Record<string, string> = {
    family: "Gia đình",
    calendar: "Lịch & đếm ngược",
    map: "Sự kiện & bản đồ",
    dresscode: "Dress code",
    album: "Album ảnh",
    albumQr: "QR album khách",
    gift: "Hộp quà",
    rsvp: "Xác nhận & lời chúc",
  };
  const defaultSectionOrder = ["family", "calendar", "map", "dresscode", "album", "albumQr", "gift", "rsvp"];
  const hiddenSet = new Set(draftContent.hiddenSections ?? []);
  const storedOrder = (draftContent.sectionOrder ?? []).filter(
    (key) => sectionLabels[key] && !hiddenSet.has(key),
  );
  const visibleOrder = [
    ...storedOrder,
    ...defaultSectionOrder.filter((key) => !storedOrder.includes(key)),
  ].filter((key) => !hiddenSet.has(key));

  const moveSection = (from: string, to: string) => {
    if (from === to) return;
    const next = [...visibleOrder];
    const fromIndex = next.indexOf(from);
    const toIndex = next.indexOf(to);
    if (fromIndex < 0 || toIndex < 0) return;
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, from);
    onDraftChange({ ...draftContent, sectionOrder: next });
  };

  const timeline =
    draftContent.timeline && draftContent.timeline.length > 0
      ? draftContent.timeline
      : [{ time: "17:00", label: "Đón khách" }];

  const updateTimeline = (
    index: number,
    patch: { time?: string; label?: string },
  ) => {
    const next = timeline.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    );
    onDraftChange({ ...draftContent, timeline: next });
  };

  const addTimeline = () => {
    if (timeline.length >= 6) return;
    onDraftChange({
      ...draftContent,
      timeline: [...timeline, { time: "", label: "" }],
    });
  };

  const removeTimeline = (index: number) => {
    onDraftChange({
      ...draftContent,
      timeline: timeline.filter((_, itemIndex) => itemIndex !== index),
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

  const showBrideGift =
    draftContent.gift.brideAccountEnabled === true ||
    Boolean(
      draftContent.gift.brideBankName ||
        draftContent.gift.brideAccountNumber ||
        draftContent.gift.brideAccountName,
    );

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
      const compressRes = await compressImage(file, "gift");
      const uploaded = await uploadPhoto(
        wedding.id,
        compressRes.blob,
        "gift",
        slot,
        compressRes.contentType === "image/webp" ? "photo.webp" : "photo.jpg",
      );
      const nextPhotos = [
        ...photos.filter(
          (p) => !(p.kind === "gift" && p.position === targetPosition),
        ),
        uploaded.photo,
      ];
      onPhotosStateChange(nextPhotos, uploaded.content);
      const savedMsg = formatSavedSize(compressRes.originalBytes, compressRes.outputBytes);
      showToast(
        slot === "gift-groom"
          ? `Đã cập nhật ảnh QR nhà trai (${savedMsg})`
          : `Đã cập nhật ảnh QR nhà gái (${savedMsg})`,
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

  const handlePickerSelect = async (tpl: PickerTemplate) => {
    if (tpl.kind === "designer") {
      if (selectedDesigner?.id === tpl.id) {
        setTemplatePickerOpen(false);
        return;
      }
      setDesignerBusyId(tpl.id);
      setDesignerError(null);
      try {
        const result = await assignDesignerTemplate(wedding.id, {
          designerTemplateId: tpl.id,
        });
        onDesignerAssignment(result);
        setTemplatePickerOpen(false);
      } catch (error) {
        setDesignerError(
          error instanceof Error
            ? error.message
            : "Không gán được mẫu thiết kế Designer.",
        );
      } finally {
        setDesignerBusyId(null);
      }
      return;
    }

    if (designerBusyId) return;
    if (selectedDesigner) {
      setDesignerBusyId(tpl.id);
      setDesignerError(null);
      try {
        const result = await assignDesignerTemplate(wedding.id, {
          designerTemplateId: null,
        });
        onDesignerAssignment(result);
      } catch (error) {
        setDesignerError(
          error instanceof Error
            ? error.message
            : "Không bỏ được mẫu thiết kế Designer.",
        );
        setDesignerBusyId(null);
        return;
      }
      setDesignerBusyId(null);
    }
    onTemplateChange(tpl.id);
    setTemplatePickerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const current = wedding.content.couple;
    const next = draftContent.couple;
    const namesChanged =
      current.groomName !== next.groomName ||
      current.brideName !== next.brideName ||
      current.groomFullName !== next.groomFullName ||
      current.brideFullName !== next.brideFullName;
    if (namesChanged) {
      setNameConfirmOpen(true);
      return;
    }
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
                <LayoutTemplate className="h-4 w-4 text-accent-text" aria-hidden="true" />
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

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setTemplatePickerOpen((prev) => !prev)}
              aria-expanded={templatePickerOpen}
              aria-controls="dashboard-template-picker"
              className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-bg px-3.5 py-3 text-left transition-colors hover:border-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-fg">
                  {selectedName ?? "Chọn mẫu thiệp"}
                </span>
                <span className="block truncate text-xs text-fg-muted">
                  {selectedSubtitle ?? "Bấm để chọn mẫu"}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-fg-muted">
                  {selectedPlan ? getPlanLabel(selectedPlan) : ""}
                </span>
                <ChevronDown
                  className={cn("h-4 w-4 text-fg-muted transition-transform", templatePickerOpen && "rotate-180")}
                  aria-hidden="true"
                />
              </span>
            </button>

            {templatePickerOpen && (
              <div id="dashboard-template-picker" className="rounded-xl border border-border bg-surface p-2.5 shadow-sm">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-fg-muted" aria-hidden="true" />
                  <input
                    value={templateQuery}
                    onChange={(event) => setTemplateQuery(event.target.value)}
                    placeholder="Tìm mẫu thiệp…"
                    aria-label="Tìm mẫu thiệp"
                    className="h-9 w-full rounded-lg border border-border bg-bg pr-3 pl-8 text-xs text-fg outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
                  />
                </div>

                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {TEMPLATE_THEME_FILTERS.map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setTemplateTheme(theme)}
                      aria-pressed={templateTheme === theme}
                      className={cn(
                        "shrink-0 cursor-pointer rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                        templateTheme === theme
                          ? "border-accent bg-accent-soft text-accent-text"
                          : "border-border bg-bg text-fg-muted hover:bg-surface-alt",
                      )}
                    >
                      {theme}
                    </button>
                  ))}
                </div>

                <ul className="mt-2 max-h-[276px] divide-y divide-border overflow-y-auto rounded-lg border border-border">
                  {filteredTemplates.map((tpl) => {
                    const isSelected =
                      tpl.kind === "designer"
                        ? selectedDesigner?.id === tpl.id
                        : !selectedDesigner && draftTemplateId === tpl.id;
                    const allowed =
                      !tpl.isPlaceholder &&
                      (isTemplateAllowedForPlan(wedding.plan, tpl.plan) ||
                        tpl.id === wedding.templateId ||
                        (tpl.kind === "designer" && selectedDesigner?.id === tpl.id));
                    const busy = designerBusyId === tpl.id;
                    return (
                      <li key={`${tpl.kind}-${tpl.id}`}>
                        <button
                          type="button"
                          disabled={!allowed || Boolean(designerBusyId)}
                          onClick={() => {
                            if (!allowed) return;
                            void handlePickerSelect(tpl);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-xs transition-colors",
                            isSelected ? "bg-accent-soft" : "bg-bg hover:bg-surface-alt",
                            (!allowed || designerBusyId) && "cursor-not-allowed opacity-60",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-semibold text-fg">{tpl.name}</span>
                            <span className="block truncate text-[11px] text-fg-muted">{tpl.subtitle}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5">
                            {busy && <Loader2 className="h-3 w-3 animate-spin text-accent-text" aria-hidden="true" />}
                            {isSelected && tpl.kind === "designer" ? (
                              <span className="rounded-full border border-accent/45 bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent-text">
                                Đang gán
                              </span>
                            ) : (
                              <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-fg-muted">
                                {tpl.isPlaceholder
                                  ? "Sắp có"
                                  : allowed
                                    ? getPlanLabel(tpl.plan)
                                    : `Gói ${getPlanLabel(tpl.plan)}`}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  {filteredTemplates.length === 0 && (
                    <li className="px-3 py-6 text-center text-xs text-fg-muted">Không tìm thấy mẫu phù hợp.</li>
                  )}
                </ul>

                {designerLoading && (
                  <p className="mt-2 flex items-center gap-1.5 text-[11px] text-fg-muted">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                    Đang tải mẫu Designer…
                  </p>
                )}
                {designerError && (
                  <p role="alert" className="mt-2 text-[11px] text-danger-fg">
                    {designerError}
                  </p>
                )}

                <p className="mt-2 text-[11px] text-fg-muted">
                  Hiển thị {Math.min(filteredTemplates.length, 6)} trong {filteredTemplates.length} mẫu · cuộn để xem thêm
                </p>
              </div>
            )}
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
            <div className="rounded-xl border border-accent/25 bg-accent-soft/35 px-3 py-2.5 text-xs leading-relaxed text-fg-muted">
              <strong className="text-fg">Tên gọi ngắn chỉnh trên thiệp:</strong>{" "}
              bấm trực tiếp vào tên chú rể/cô dâu ở khung xem trước bên cạnh.
            </div>
            <Input
              label="Danh xưng chú rể"
              value={draftContent.couple.groomTitle ?? ""}
              onChange={(e) => updateCouple({ groomTitle: e.target.value })}
              maxLength={40}
              placeholder="Ví dụ: Trưởng nam"
              hint="Hiển thị trước tên trong phần gia đình."
            />
            <Input
              label="Tên ngắn gọn"
              value={draftContent.couple.groomName}
              onChange={(e) => updateCouple({ groomName: e.target.value })}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Ví dụ: Long"
              hint="Tên hiển thị trên bìa thiệp và phần tên ngắn."
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
            <div className="rounded-xl border border-accent/25 bg-accent-soft/35 px-3 py-2.5 text-xs leading-relaxed text-fg-muted">
              <strong className="text-fg">Tên gọi ngắn chỉnh trên thiệp:</strong>{" "}
              bấm trực tiếp vào tên cô dâu/chú rể ở khung xem trước bên cạnh.
            </div>
            <Input
              label="Danh xưng cô dâu"
              value={draftContent.couple.brideTitle ?? ""}
              onChange={(e) => updateCouple({ brideTitle: e.target.value })}
              maxLength={40}
              placeholder="Ví dụ: Ái nữ"
              hint="Hiển thị trước tên trong phần gia đình."
            />
            <Input
              label="Tên ngắn gọn"
              value={draftContent.couple.brideName}
              onChange={(e) => updateCouple({ brideName: e.target.value })}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Ví dụ: Ngọc"
              hint="Tên hiển thị trên bìa thiệp và phần tên ngắn."
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
            label="Ngày giờ cưới chính *"
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

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-alt p-3">
            <input
              type="checkbox"
              checked={draftContent.shareGuestName === true}
              onChange={(e) =>
                onDraftChange({
                  ...draftContent,
                  shareGuestName: e.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
            />
            <span className="text-xs leading-relaxed text-text">
              <span className="block text-sm font-semibold">
                In tên khách trên ảnh chia sẻ Zalo/Facebook
              </span>
              Bật để ảnh xem trước khi dán link hiện “Trân trọng kính mời: Tên
              khách”. Tắt để ẩn tên khách khỏi ảnh chia sẻ.
            </span>
          </label>

          {draftContent.shareGuestName === true && (
            <div className="mt-2">
              <img
                src={`/api/og/invite?couple=${encodeURIComponent(
                  `${draftContent.couple.groomName} & ${draftContent.couple.brideName}`,
                )}&guest=${encodeURIComponent("Bạn Thanh Mai")}&date=${encodeURIComponent(
                  draftContent.date.slice(0, 10).split("-").reverse().join("."),
                )}&style=olive`}
                alt="Xem trước ảnh chia sẻ Zalo/Facebook với tên khách mời"
                width={1200}
                height={630}
                loading="lazy"
                className="w-full rounded-xl border border-border"
              />
              <p className="mt-1.5 text-[11px] text-fg-muted">
                Ảnh minh hoạ với khách mẫu “Bạn Thanh Mai”. Ảnh thật của từng
                khách sẽ in đúng tên của họ khi bạn dán link vào Zalo/Facebook.
              </p>
            </div>
          )}
        </Card>

        {/* Trường nội dung tùy chỉnh theo mẫu thiết kế (Designer Text Fields) */}
        <DesignerFieldsEditor
          fields={designerTextFields}
          values={draftContent.designerFields ?? {}}
          onChange={(key, value) => updateDesignerField(key, value || null)}
          disabled={saving}
        />

        <Card className="space-y-4 p-4 sm:p-5">
          <div>
            <h3 className="font-sans text-base font-semibold text-fg">
              Dress code &amp; hiện/ẩn từng phần
            </h3>
            <p className="mt-0.5 text-xs text-fg-muted">
              Chọn 3 màu dress code và bật/tắt các phần xuất hiện trong thiệp.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-fg">3 màu dress code</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {["Đỏ rượu", "Hồng đào", "Hồng phấn"].map((label, index) => (
                <label key={label} className="block text-[10px] text-fg-muted">
                  {label}
                  <input
                    type="color"
                    value={
                      draftContent.dressCode?.[index] ??
                      ["#6B1E2B", "#B35A6B", "#F6B8C6"][index]
                    }
                    onChange={(event) => updateDressCode(index, event.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-border bg-bg px-1"
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-fg">Hiện / ẩn phần trên thiệp</p>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {[
                ["album", "Album ảnh"],
                ["albumQr", "QR album khách"],
                ["gift", "Hộp quà mừng"],
                ["calendar", "Lịch cưới & đếm ngược"],
                ["map", "Sự kiện & bản đồ"],
                ["family", "Thông tin gia đình"],
                ["dresscode", "Dress code"],
                ["rsvp", "Xác nhận & lời chúc"],
                ["music", "Nhạc nền"],
              ].map(([key, label]) => {
                const hidden = (draftContent.hiddenSections ?? []).includes(key);
                return (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border bg-bg px-3 py-2 text-xs text-fg"
                  >
                    <span>{label}</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={!hidden}
                      onClick={() => toggleSection(key)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                        hidden ? "bg-border" : "bg-accent",
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                          hidden ? "translate-x-0.5" : "translate-x-4",
                        )}
                      />
                    </button>
                  </label>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] text-fg-muted">
              Tắt = ẩn phần đó khỏi thiệp khách.
            </p>
          </div>

          <div>
            <p className="text-xs font-medium text-fg">Thứ tự các phần đang hiện</p>
            <p className="mt-0.5 text-[10px] text-fg-muted">
              Kéo thả để đổi thứ tự. Phần đang ẩn không hiện trong danh sách.
            </p>
            <div className="mt-2 space-y-1.5">
              {visibleOrder.map((key) => (
                <div
                  key={key}
                  draggable
                  onDragStart={() => setDraggingSection(key)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggingSection) moveSection(draggingSection, key);
                    setDraggingSection(null);
                  }}
                  onDragEnd={() => setDraggingSection(null)}
                  className={cn(
                    "flex cursor-grab items-center justify-between rounded-lg border border-border bg-bg px-3 py-2 text-xs text-fg",
                    draggingSection === key && "opacity-50",
                  )}
                >
                  <span>{sectionLabels[key]}</span>
                  <span className="text-[10px] text-fg-muted">⋮⋮</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-border bg-bg p-3">
            <label className="flex items-center justify-between gap-3 text-xs font-medium text-fg">
              <span>Hiện ảnh cô dâu &amp; chú rể trong phần gia đình</span>
              <button
                type="button"
                role="switch"
                aria-checked={!draftContent.hideCouplePhotos}
                onClick={() =>
                  onDraftChange({
                    ...draftContent,
                    hideCouplePhotos: !draftContent.hideCouplePhotos,
                  })
                }
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                  draftContent.hideCouplePhotos ? "bg-border" : "bg-accent",
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                    draftContent.hideCouplePhotos ? "translate-x-0.5" : "translate-x-4",
                  )}
                />
              </button>
            </label>
            <p className="text-[10px] text-fg-muted">
              Tắt ảnh: chỉ hiện tên cô dâu/chú rể, một trên một dưới.
            </p>

            <div>
              <p className="text-xs font-medium text-fg">Nhà xuất hiện trước</p>
              <p className="mt-0.5 text-[10px] text-fg-muted">
                Dùng để chọn nhà trai/gái sẽ xuất hiện ở bên trái hay bên trên thiệp.
              </p>
              <div className="mt-2 flex gap-3">
                {[
                  ["groom", "Nhà trai"],
                  ["bride", "Nhà gái"],
                ].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-1.5 text-xs text-fg">
                    <input
                      type="radio"
                      name="hostFirst"
                      value={value}
                      checked={(draftContent.hostFirst ?? "groom") === value}
                      onChange={() =>
                        onDraftChange({
                          ...draftContent,
                          hostFirst: value as "groom" | "bride",
                        })
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Lịch trình ngày cưới */}
        <Card className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="font-sans text-base font-semibold text-fg">
                Lịch trình ngày cưới
              </h3>
              <p className="mt-0.5 text-xs text-fg-muted">
                Tối đa 6 mốc. Mặc định có sẵn một mốc, có thể sửa giờ và nội dung.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTimeline}
              disabled={timeline.length >= 6}
            >
              + Thêm lịch trình
            </Button>
          </div>

          <div className="space-y-2">
            {timeline.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-[92px_1fr_auto] items-center gap-2 rounded-xl border border-border bg-bg p-2"
              >
                <input
                  type="time"
                  value={item.time}
                  onChange={(event) =>
                    updateTimeline(index, { time: event.target.value })
                  }
                  className="h-9 rounded-lg border border-border bg-surface px-2 text-xs text-fg"
                  aria-label={`Giờ mốc ${index + 1}`}
                />
                <Input
                  value={item.label}
                  onChange={(event) =>
                    updateTimeline(index, { label: event.target.value })
                  }
                  maxLength={80}
                  placeholder="Ví dụ: Đón khách"
                  aria-label={`Nội dung mốc ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeTimeline(index)}
                  disabled={timeline.length <= 1}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-fg-muted disabled:opacity-40"
                  aria-label={`Xóa mốc ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
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
                Tài khoản 1
              </p>
              <Input
                label="Tên hiển thị tài khoản"
                value={draftContent.gift.groomAccountLabel ?? ""}
                onChange={(e) => updateGift({ groomAccountLabel: e.target.value })}
                maxLength={40}
                placeholder="Tài khoản Nhà ..."
              />
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
                      accept="image/jpeg,image/png,image/webp,image/heic,.heic,.heif"
                      onChange={(e) => handleQrFileSelected("gift-groom", e)}
                      className="hidden"
                    />

                    <div className="flex flex-col gap-1">
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
                      <p className="text-[11px] text-fg-muted">
                        Ảnh sẽ được nén tự động để tải nhanh hơn. Ảnh tối đa 10 MB.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Nhà gái */}
            <div
              className={cn(
                "space-y-3 rounded-xl border border-border bg-bg p-4",
                !showBrideGift && "hidden",
              )}
            >
              <p className="font-sans text-sm font-semibold text-accent-text">
                Tài khoản 2
              </p>
              <Input
                label="Tên hiển thị tài khoản"
                value={draftContent.gift.brideAccountLabel ?? ""}
                onChange={(e) => updateGift({ brideAccountLabel: e.target.value })}
                maxLength={40}
                placeholder="Tài khoản Nhà ..."
              />
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
                      accept="image/jpeg,image/png,image/webp,image/heic,.heic,.heif"
                      onChange={(e) => handleQrFileSelected("gift-bride", e)}
                      className="hidden"
                    />

                    <div className="flex flex-col gap-1">
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
                      <p className="text-[11px] text-fg-muted">
                        Ảnh sẽ được nén tự động để tải nhanh hơn. Ảnh tối đa 10 MB.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {!showBrideGift && (
            <Button
              type="button"
              variant="outline"
              onClick={() => updateGift({ brideAccountEnabled: true })}
            >
              + Thêm tài khoản
            </Button>
          )}
        </Card>

        <MusicEditor
          weddingId={wedding.id}
          plan={wedding.plan}
          content={draftContent}
          onChange={onDraftChange}
        />

        <div className="flex justify-end">
          <Button type="submit" variant="primary" loading={saving}>
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>Lưu thay đổi</span>
          </Button>
        </div>
      </form>

      <Dialog
        open={nameConfirmOpen}
        onClose={() => setNameConfirmOpen(false)}
        title="Xác nhận tên cô dâu/chú rể"
        description="Vui lòng kiểm tra kỹ họ tên. Sau khi đã có 3 link khách, mỗi người chỉ được thay đổi tên 1 lần."
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-accent/30 bg-accent-soft/40 p-3 text-sm leading-relaxed text-text">
            <p>
              Bạn đang thay đổi tên hiển thị hoặc họ tên đầy đủ của cô dâu/chú rể.
            </p>
            <p className="mt-1 font-semibold">
              Lưu ý: kiểm tra kĩ họ tên vì bạn chỉ có thể thay đổi 1 lần.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setNameConfirmOpen(false)}
              disabled={saving}
            >
              Quay lại kiểm tra
            </Button>
            <Button
              type="button"
              variant="primary"
              loading={saving}
              onClick={async () => {
                setNameConfirmOpen(false);
                await onSave();
              }}
            >
              Xác nhận lưu tên
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Vùng nguy hiểm: xóa thiệp */}
      <Card className="border-danger-border p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-sans text-base font-semibold text-danger-fg">
              Xóa thiệp cưới
            </h3>
            <p className="mt-0.5 text-xs text-fg-muted sm:text-sm">
              Thao tác này sẽ xóa vĩnh viễn thiệp{" "}
              <strong>
                {draftContent.couple.groomName} &amp; {draftContent.couple.brideName}
              </strong>{" "}
              cùng toàn bộ lễ, ảnh, khách mời và lời chúc liên quan.
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
        description={`Bạn có chắc muốn xóa thiệp "${draftContent.couple.groomName} & ${draftContent.couple.brideName}"? Toàn bộ dữ liệu lễ, ảnh cưới, khách mời và lời chúc sẽ bị mất và không thể khôi phục.`}
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

