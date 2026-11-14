"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Heart,
  ImagePlus,
  Loader2,
  MapPin,
  Music,
  QrCode,
  RotateCw,
  Save,
  Star,
  Type,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { opsRequest } from "@/lib/ops-api";
import {
  DESIGNER_ACTIONS,
  DESIGNER_BLOCKS,
  DESIGNER_ICONS,
  PHOTO_SLOTS,
  PLACEHOLDER_OPTIONS,
  type DesignerCanvasContent,
  type DesignerElement,
  type DesignerPage,
  type DesignerTextElement,
} from "./designer-types";

interface DesignerCanvasProps {
  templateId: string;
  name: string;
  initialCanvas: DesignerCanvasContent;
  backgroundKey: string | null;
}

const FONT_OPTIONS = [
  { value: "var(--font-playfair)", label: "Playfair Display" },
  { value: "var(--font-eb-garamond)", label: "EB Garamond" },
  { value: "var(--font-be-vietnam)", label: "Be Vietnam Pro" },
];

function resolveCanvasFont(family: string): string {
  if (family.includes("playfair")) return "Georgia, serif";
  if (family.includes("garamond")) return "Garamond, serif";
  return "Arial, sans-serif";
}

function normalizePages(canvas: DesignerCanvasContent): DesignerPage[] {
  if (Array.isArray(canvas.pages) && canvas.pages.length > 0) return canvas.pages;
  return [
    {
      id: "page-1",
      name: "Bìa",
      background: canvas.background || "#FAF8F5",
      backgroundUrl: canvas.backgroundUrl,
      elements: Array.isArray(canvas.elements) ? canvas.elements : [],
    },
  ];
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không đọc được ảnh."));
    reader.readAsDataURL(blob);
  });
}

async function fileToWebpDataUrl(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Trình duyệt không hỗ trợ canvas.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.9),
  );
  if (!blob) throw new Error("Không xuất được ảnh webp.");
  return {
    dataUrl: await blobToDataUrl(blob),
    width: canvas.width,
    height: canvas.height,
  };
}

export function DesignerCanvas({
  templateId,
  name,
  initialCanvas,
  backgroundKey,
}: DesignerCanvasProps) {
  const [pages, setPages] = React.useState<DesignerPage[]>(() =>
    normalizePages(initialCanvas),
  );
  const [activeId, setActiveId] = React.useState(() => normalizePages(initialCanvas)[0].id);
  const activeIndex = Math.max(0, pages.findIndex((page) => page.id === activeId));
  const activePage = pages[activeIndex] ?? pages[0];

  const content: DesignerCanvasContent = {
    width: initialCanvas.width,
    height: initialCanvas.height,
    background: activePage.background,
    backgroundUrl: activePage.backgroundUrl,
    elements: activePage.elements,
  };

  const setContent = React.useCallback(
    (updater: React.SetStateAction<DesignerCanvasContent>) => {
      setPages((previous) => {
        const index = previous.findIndex((page) => page.id === activeId);
        if (index < 0) return previous;
        const current = previous[index];
        const currentContent: DesignerCanvasContent = {
          width: initialCanvas.width,
          height: initialCanvas.height,
          ...current,
        };
        const next =
          typeof updater === "function"
            ? (updater as (prev: DesignerCanvasContent) => DesignerCanvasContent)(currentContent)
            : updater;
        const updated = previous.slice();
        updated[index] = {
          ...current,
          background: next.background,
          backgroundUrl: next.backgroundUrl,
          elements: next.elements,
        };
        return updated;
      });
    },
    [activeId, initialCanvas.height, initialCanvas.width],
  );

  const addPage = () => {
    const id = crypto.randomUUID();
    setPages((previous) => [
      ...previous,
      {
        id,
        name: previous.length === 1 ? "Nội dung" : `Nội dung ${previous.length}`,
        background: "#FAF8F5",
        elements: [],
      },
    ]);
    setActiveId(id);
  };

  const removePage = (id: string) => {
    if (pages.length <= 1) return;
    const remaining = pages.filter((page) => page.id !== id);
    setPages(remaining);
    if (activeId === id) setActiveId(remaining[0].id);
  };
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const boardRef = React.useRef<HTMLDivElement | null>(null);
  const dragRef = React.useRef<{
    id: string;
    startX: number;
    startY: number;
    xPct: number;
    yPct: number;
    width: number;
    height: number;
  } | null>(null);
  const rotateRef = React.useRef<{
    id: string;
    centerX: number;
    centerY: number;
    startAngle: number;
    startRotation: number;
  } | null>(null);
  const resizeRef = React.useRef<{
    id: string;
    corner: "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    x: number;
    y: number;
    w: number;
    h: number | null;
    boardW: number;
    boardH: number;
  } | null>(null);

  const startResize = (
    event: React.PointerEvent<HTMLSpanElement>,
    element: DesignerElement,
    corner: "nw" | "ne" | "sw" | "se",
  ) => {
    event.stopPropagation();
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const wrapper = event.currentTarget.parentElement;
    const wrapperRect = wrapper?.getBoundingClientRect();
    const existingHeight =
      "hPct" in element && typeof element.hPct === "number" ? element.hPct : null;
    const fallbackHeight =
      wrapperRect && rect.height > 0 ? (wrapperRect.height / rect.height) * 100 : null;

    event.currentTarget.setPointerCapture(event.pointerId);
    resizeRef.current = {
      id: element.id,
      corner,
      startX: event.clientX,
      startY: event.clientY,
      x: element.xPct,
      y: element.yPct,
      w: element.wPct,
      h: existingHeight ?? fallbackHeight,
      boardW: rect.width,
      boardH: rect.height,
    };
  };

  const moveResize = (
    event: React.PointerEvent<HTMLSpanElement>,
    element: DesignerElement,
  ) => {
    const resize = resizeRef.current;
    if (!resize || resize.id !== element.id) return;

    const dx = ((event.clientX - resize.startX) / resize.boardW) * 100;
    const dy = ((event.clientY - resize.startY) / resize.boardH) * 100;
    let { x, y, w } = resize;

    if (resize.corner === "ne" || resize.corner === "se") w = resize.w + dx;
    if (resize.corner === "nw" || resize.corner === "sw") {
      x = resize.x + dx;
      w = resize.w - dx;
    }

    const baseH = resize.h;
    let h = baseH;
    if (h !== null && baseH !== null) {
      if (resize.corner === "sw" || resize.corner === "se") h = baseH + dy;
      if (resize.corner === "nw" || resize.corner === "ne") {
        y = resize.y + dy;
        h = baseH - dy;
      }
    }

    w = Math.max(4, Math.min(100, w));
    x = Math.max(0, Math.min(100 - w, x));
    if (h !== null) {
      h = Math.max(4, Math.min(100, h));
      y = Math.max(0, Math.min(100 - h, y));
    } else {
      y = Math.max(0, Math.min(96, y));
    }

    updateElement(element.id, {
      xPct: x,
      yPct: y,
      wPct: w,
      ...(h !== null ? { hPct: h } : {}),
    } as Partial<DesignerElement>);
  };

  const selected = content.elements.find((element) => element.id === selectedId) ?? null;

  const updateElement = (id: string, patch: Partial<DesignerElement>) => {
    setContent((previous) => ({
      ...previous,
      elements: previous.elements.map((element) =>
        element.id === id ? ({ ...element, ...patch } as DesignerElement) : element,
      ),
    }));
  };

  const addText = (placeholder: string | null) => {    const id = crypto.randomUUID();
    const element: DesignerTextElement = {
      id,
      type: "text",
      xPct: 12,
      yPct: 30,
      wPct: 76,
      text: placeholder
        ? PLACEHOLDER_OPTIONS.find((option) => option.id === placeholder)?.sample ?? ""
        : "Nhập nội dung",
      fontSize: 28,
      color: "#2C2523",
      fontFamily: FONT_OPTIONS[0].value,
      placeholder,
    };
    setContent((previous) => ({ ...previous, elements: [...previous.elements, element] }));
    setSelectedId(id);
  };

  const addPhoto = () => {
    const id = crypto.randomUUID();
    setContent((previous) => ({
      ...previous,
      elements: [
        ...previous.elements,
        {
          id,
          type: "photo",
          xPct: 20,
          yPct: 18,
          wPct: 60,
          hPct: 34,
          slot: "hero",
          radius: 16,
          fit: "cover",
        },
      ],
    }));
    setSelectedId(id);
  };

  const addBox = () => {
    const id = crypto.randomUUID();
    setContent((previous) => ({
      ...previous,
      elements: [
        ...previous.elements,
        {
          id,
          type: "box",
          xPct: 15,
          yPct: 20,
          wPct: 70,
          hPct: 24,
          fill: "#F3EFEA",
          border: "#E6E0D6",
          radius: 16,
        },
      ],
    }));
    setSelectedId(id);
  };

  const addIcon = () => {
    const id = crypto.randomUUID();
    setContent((previous) => ({
      ...previous,
      elements: [
        ...previous.elements,
        {
          id,
          type: "icon",
          xPct: 44,
          yPct: 24,
          wPct: 12,
          icon: "Heart",
          color: "#B87D74",
        },
      ],
    }));
    setSelectedId(id);
  };

  const addButton = () => {
    const id = crypto.randomUUID();
    setContent((previous) => ({
      ...previous,
      elements: [
        ...previous.elements,
        {
          id,
          type: "button",
          xPct: 25,
          yPct: 70,
          wPct: 50,
          label: "Xác nhận tham dự",
          action: "rsvp",
          fill: "#4A5D4E",
          textColor: "#FFFFFF",
          radius: 999,
        },
      ],
    }));
    setSelectedId(id);
  };

  const addBlock = (block: "calendar" | "map" | "rsvp" | "gift" | "gallery" | "music") => {
    const id = crypto.randomUUID();
    setContent((previous) => ({
      ...previous,
      elements: [
        ...previous.elements,
        {
          id,
          type: "block",
          xPct: 12,
          yPct: 50,
          wPct: 76,
          hPct: 18,
          block,
          color: "#4A5D4E",
        },
      ],
    }));
    setSelectedId(id);
  };

  const [assets, setAssets] = React.useState<{ key: string; url: string }[] | null>(null);
  const [loadingAssets, setLoadingAssets] = React.useState(false);

  const loadAssets = async () => {
    setLoadingAssets(true);
    try {
      const result = await opsRequest<{ items?: { r2_key: string }[] }>(
        "/api/ops/designer/assets",
      );
      setAssets(
        (result.items ?? []).map((item) => ({
          key: item.r2_key,
          url: `/media/${item.r2_key}`,
        })),
      );
    } catch {
      setAssets([]);
    } finally {
      setLoadingAssets(false);
    }
  };

  const handleUpload = async (file: File) => {
    setError(null);
    setMessage("Đang tải ảnh…");
    try {
      const { dataUrl } = await fileToWebpDataUrl(file);
      let url = dataUrl;
      let embedded = false;
      try {
        const body = await opsRequest<{ url?: string }>("/api/ops/designer/assets", {
          method: "POST",
          body: JSON.stringify({ kind: "png", dataUrl }),
        });
        if (body.url) url = body.url;
        else embedded = true;
      } catch {
        // Dev trên Windows: Miniflare/R2 không khởi động được → nhúng tạm data URL.
        embedded = true;
      }
      const id = crypto.randomUUID();
      setContent((previous) => ({
        ...previous,
        elements: [
          ...previous.elements,
          { id, type: "image", xPct: 20, yPct: 20, wPct: 60, url },
        ],
      }));
      setSelectedId(id);
      setMessage(
        embedded
          ? "R2 dev chưa chạy được — ảnh được nhúng tạm vào layout (chỉ dùng khi dev)."
          : "Đã thêm ảnh.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tải ảnh thất bại.");
      setMessage(null);
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await opsRequest(`/api/ops/designer/templates/${templateId}`, {
        method: "PATCH",
        body: JSON.stringify({ canvas_json: { ...content, pages } }),
      });
      setMessage("Đã lưu layout.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lưu thất bại.");
    } finally {
      setSaving(false);
    }
  };

  const exportBackground = async () => {
    setExporting(true);
    setError(null);
    setMessage("Đang xuất ảnh nền webp…");
    try {
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = content.width * scale;
      canvas.height = content.height * scale;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Trình duyệt không hỗ trợ canvas.");

      context.fillStyle = content.background;
      context.fillRect(0, 0, canvas.width, canvas.height);

      if (content.backgroundUrl) {
        const background = new Image();
        background.src = content.backgroundUrl;
        await new Promise<void>((resolve) => {
          background.onload = () => resolve();
          background.onerror = () => resolve();
        });
        if (background.width > 0) {
          const ratio = Math.max(
            canvas.width / background.width,
            canvas.height / background.height,
          );
          const drawWidth = background.width * ratio;
          const drawHeight = background.height * ratio;
          context.drawImage(
            background,
            (canvas.width - drawWidth) / 2,
            (canvas.height - drawHeight) / 2,
            drawWidth,
            drawHeight,
          );
        }
      }

      for (const element of content.elements) {
        const x = (element.xPct / 100) * canvas.width;
        const y = (element.yPct / 100) * canvas.height;
        const width = (element.wPct / 100) * canvas.width;

        if (element.type === "image") {
          const image = new Image();
          image.src = element.url;
          await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve();
            image.onerror = () => reject(new Error("Không tải được ảnh để xuất."));
          });
          context.drawImage(image, x, y, width, (width * image.height) / image.width);
        } else if (element.type === "text") {
          const text =
            element.placeholder
              ? PLACEHOLDER_OPTIONS.find((option) => option.id === element.placeholder)?.sample ??
                element.text
              : element.text;
          context.fillStyle = element.color;
          context.textBaseline = "top";
          context.font = `${element.fontSize * scale}px ${resolveCanvasFont(element.fontFamily)}`;
          context.fillText(text, x, y, width);
        }
      }

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", 0.9),
      );
      if (!blob) throw new Error("Không xuất được webp.");

      const uploaded = await opsRequest<{ key?: string }>(
        "/api/ops/designer/assets",
        {
          method: "POST",
          body: JSON.stringify({ kind: "background", dataUrl: await blobToDataUrl(blob) }),
        },
      );
      if (!uploaded.key) {
        throw new Error("Tải ảnh nền thất bại.");
      }

      await opsRequest(`/api/ops/designer/templates/${templateId}`, {
        method: "PATCH",
        body: JSON.stringify({
          canvas_json: { ...content, pages },
          background_key: uploaded.key,
        }),
      });
      setMessage(`Đã xuất webp và lưu layout (${Math.round(blob.size / 1024)}KB).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xuất ảnh thất bại.");
      setMessage(null);
    } finally {
      setExporting(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      const result = await opsRequest<{ version?: number }>(
        `/api/ops/designer/templates/${templateId}/publish`,
        { method: "POST" },
      );
      setMessage(`Đã xuất bản phiên bản v${result.version ?? "?"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xuất bản thất bại.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/ops/designer"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text"
            aria-label="Quay lại danh sách mẫu"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-semibold text-text">{name}</h1>
            <p className="text-xs text-text-muted">
              Canvas 390×844 · xuất nền 2x webp{backgroundKey ? " · đã có ảnh nền" : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => addText(null)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            <Type className="h-3.5 w-3.5" aria-hidden="true" />
            Văn bản
          </button>
          <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text">
            <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
            Ảnh PNG
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleUpload(file);
                event.target.value = "";
              }}
            />
          </label>
          <button
            type="button"
            onClick={addPhoto}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Khung ảnh
          </button>
          <button
            type="button"
            onClick={addBox}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Khung
          </button>
          <button
            type="button"
            onClick={addIcon}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Icon
          </button>
          <button
            type="button"
            onClick={addButton}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Nút
          </button>
          <button
            type="button"
            onClick={() => addBlock("calendar")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Lịch
          </button>
          <button
            type="button"
            onClick={() => addBlock("map")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Map
          </button>
          <button
            type="button"
            onClick={() => addBlock("rsvp")}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            RSVP
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Lưu layout
          </button>
          <button
            type="button"
            onClick={exportBackground}
            disabled={exporting}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-accent px-4 text-xs font-semibold text-accent-fg disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Xuất nền webp
          </button>
          <Link
            href={`/ops/designer/${templateId}/preview`}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
          >
            Xem trước
          </Link>
          <button
            type="button"
            onClick={publish}
            disabled={publishing || content.elements.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-accent/50 bg-accent-soft px-3 text-xs font-semibold text-accent-text disabled:opacity-60"
          >
            {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Xuất bản
          </button>
        </div>
      </div>

      {message && <p className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-muted">{message}</p>}
      {error && (
        <p role="alert" className="rounded-xl border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-fg">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {pages.map((page) => (
          <button
            key={page.id}
            type="button"
            onClick={() => setActiveId(page.id)}
            className={cn(
              "h-9 rounded-full border px-3 text-xs font-medium transition-colors",
              page.id === activeId
                ? "border-accent bg-accent-soft text-accent-text"
                : "border-border bg-surface text-text-muted hover:bg-surface-alt",
            )}
          >
            {page.name}
          </button>
        ))}
        <button
          type="button"
          onClick={addPage}
          className="h-9 rounded-full border border-dashed border-border px-3 text-xs font-medium text-text"
        >
          + Trang
        </button>
        {pages.length > 1 && (
          <button
            type="button"
            onClick={() => removePage(activeId)}
            className="h-9 rounded-full border border-danger-border px-3 text-xs font-medium text-danger-fg"
          >
            Xoá trang
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex justify-center rounded-2xl border border-border bg-surface-alt p-4">
          <div
            ref={boardRef}
            className="relative w-full max-w-[390px] overflow-hidden rounded-xl border border-border shadow-lg"
            style={{
              aspectRatio: `${content.width} / ${content.height}`,
              background: content.background,
              containerType: "inline-size",
            }}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setSelectedId(null);
            }}
          >
            {content.backgroundUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={content.backgroundUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute inset-0 h-full w-full object-cover"
              />
            )}
            {content.elements.map((element) => {
              const isSelected = element.id === selectedId;
              return (
                <div
                  key={element.id}
                  role="button"
                  tabIndex={0}
                  aria-label={element.type === "text" ? "Văn bản" : "Ảnh"}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    const rect = boardRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    dragRef.current = {
                      id: element.id,
                      startX: event.clientX,
                      startY: event.clientY,
                      xPct: element.xPct,
                      yPct: element.yPct,
                      width: rect.width,
                      height: rect.height,
                    };
                    setSelectedId(element.id);
                  }}
                  onPointerMove={(event) => {
                    const drag = dragRef.current;
                    if (!drag || drag.id !== element.id) return;
                    const dx = ((event.clientX - drag.startX) / drag.width) * 100;
                    const dy = ((event.clientY - drag.startY) / drag.height) * 100;
                    updateElement(element.id, {
                      xPct: Math.max(0, Math.min(100 - element.wPct, drag.xPct + dx)),
                      yPct: Math.max(0, Math.min(96, drag.yPct + dy)),
                    });
                  }}
                  onPointerUp={() => {
                    dragRef.current = null;
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Delete" || event.key === "Backspace") {
                      event.preventDefault();
                      setContent((previous) => ({
                        ...previous,
                        elements: previous.elements.filter((item) => item.id !== element.id),
                      }));
                      setSelectedId(null);
                    }
                  }}
                  className={cn(
                    "absolute cursor-move touch-none select-none",
                    isSelected && "outline outline-2 outline-accent",
                  )}
                  style={{
                    left: `${element.xPct}%`,
                    top: `${element.yPct}%`,
                    width: `${element.wPct}%`,
                    height:
                      "hPct" in element && typeof element.hPct === "number"
                        ? `${element.hPct}%`
                        : undefined,
                    overflow:
                      "hPct" in element && typeof element.hPct === "number" ? "hidden" : undefined,
                    transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
                  }}
                >
                  {element.type === "text" ? (
                    <span
                      style={{
                        display: "block",
                        fontFamily: element.fontFamily,
                        fontSize: `calc(${element.fontSize} * 100cqw / ${content.width})`,
                        color: element.color,
                        lineHeight: 1.2,
                      }}
                    >
                      {element.placeholder
                        ? PLACEHOLDER_OPTIONS.find((option) => option.id === element.placeholder)?.sample ??
                          element.text
                        : element.text}
                    </span>
                  ) : element.type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={element.url} alt="" className="block h-auto w-full" />
                  ) : element.type === "photo" ? (
                    <span
                      className="flex h-full w-full items-center justify-center overflow-hidden text-[10px] opacity-70"
                      style={{ borderRadius: element.radius, background: "rgba(0,0,0,0.06)" }}
                    >
                      {element.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={element.url}
                          alt=""
                          className="h-full w-full"
                          style={{ objectFit: element.fit }}
                        />
                      ) : (
                        `Ảnh: ${element.slot}`
                      )}
                    </span>
                  ) : element.type === "box" ? (
                    <span
                      className="block"
                      style={{
                        height: `${element.hPct}%`,
                        minHeight: 20,
                        background: element.fill,
                        border:
                          element.border === "none" ? undefined : `1px solid ${element.border}`,
                        borderRadius: element.radius,
                      }}
                    />
                  ) : element.type === "icon" ? (
                    <span className="block" style={{ color: element.color }}>
                      <Star className="h-10 w-10" aria-hidden="true" />
                    </span>
                  ) : element.type === "button" ? (
                    <span
                      className="flex h-10 items-center justify-center rounded-full px-3 text-xs font-semibold"
                      style={{ background: element.fill, color: element.textColor }}
                    >
                      {element.label}
                    </span>
                  ) : (
                    <span
                      className="flex h-16 items-center justify-center rounded-lg border border-dashed text-[10px]"
                      style={{ borderColor: element.color, color: element.color }}
                    >
                      {element.block}
                    </span>
                  )}
                  {isSelected && (
                    <span
                      role="button"
                      aria-label="Xoay phần tử"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                        const wrapper = event.currentTarget.parentElement;
                        if (!wrapper) return;
                        const rect = wrapper.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        event.currentTarget.setPointerCapture(event.pointerId);
                        rotateRef.current = {
                          id: element.id,
                          centerX,
                          centerY,
                          startAngle:
                            (Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180) /
                            Math.PI,
                          startRotation: element.rotation ?? 0,
                        };
                      }}
                      onPointerMove={(event) => {
                        const rotate = rotateRef.current;
                        if (!rotate || rotate.id !== element.id) return;
                        const angle =
                          (Math.atan2(event.clientY - rotate.centerY, event.clientX - rotate.centerX) *
                            180) /
                          Math.PI;
                        let next = rotate.startRotation + (angle - rotate.startAngle);
                        next = (((next + 180) % 360) + 360) % 360 - 180;
                        updateElement(element.id, { rotation: Math.round(next) });
                      }}
                      onPointerUp={() => {
                        rotateRef.current = null;
                      }}
                      className="absolute -top-7 left-1/2 z-30 flex h-6 w-6 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border border-accent bg-surface text-accent-text shadow"
                    >
                      <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                  )}
                  {isSelected &&
                    (["nw", "ne", "sw", "se"] as const).map((corner) => (
                      <span
                        key={corner}
                        role="button"
                        aria-label={`Kéo để đổi kích thước (${corner})`}
                        onPointerDown={(event) => startResize(event, element, corner)}
                        onPointerMove={(event) => moveResize(event, element)}
                        onPointerUp={() => {
                          resizeRef.current = null;
                        }}
                        className={cn(
                          "absolute z-30 h-2.5 w-2.5 rounded-sm border border-accent bg-surface shadow",
                          corner === "nw" && "-top-1 -left-1 cursor-nwse-resize",
                          corner === "ne" && "-top-1 -right-1 cursor-nesw-resize",
                          corner === "sw" && "-bottom-1 -left-1 cursor-nesw-resize",
                          corner === "se" && "-right-1 -bottom-1 cursor-nwse-resize",
                        )}
                      />
                    ))}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text">Thuộc tính</h2>

          {!selected ? (
            <div className="space-y-2 text-xs text-text-muted">
              <p>
                Chọn một phần tử trên canvas để sửa. Chéo để di chuyển; nhấn Delete để xoá.
              </p>
              {content.backgroundUrl && (
                <button
                  type="button"
                  onClick={() => setContent((previous) => ({ ...previous, backgroundUrl: undefined }))}
                  className="inline-flex h-8 w-full items-center justify-center rounded-full border border-border text-[11px] text-text"
                >
                  Bỏ ảnh nền (để tự dựng lại bằng element)
                </button>
              )}
            </div>
          ) : selected.type === "text" ? (
            <div className="space-y-3">
              <label className="block text-xs text-text">
                Nội dung
                <textarea
                  value={selected.text}
                  onChange={(event) => updateElement(selected.id, { text: event.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-bg px-2 py-1.5 text-xs"
                />
              </label>
              <label className="block text-xs text-text">
                Placeholder
                <select
                  value={selected.placeholder ?? ""}
                  onChange={(event) => updateElement(selected.id, { placeholder: event.target.value || null })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                >
                  <option value="">Văn bản cố định</option>
                  {PLACEHOLDER_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-text">
                Font
                <select
                  value={selected.fontFamily}
                  onChange={(event) => updateElement(selected.id, { fontFamily: event.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                >
                  {FONT_OPTIONS.map((font) => (
                    <option key={font.value} value={font.value}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-text">
                  Cỡ chữ
                  <input
                    type="number"
                    min={8}
                    max={96}
                    value={selected.fontSize}
                    onChange={(event) => updateElement(selected.id, { fontSize: Number(event.target.value) || 12 })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
                <label className="block text-xs text-text">
                  Màu
                  <input
                    type="color"
                    value={selected.color}
                    onChange={(event) => updateElement(selected.id, { color: event.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContent((previous) => ({
                    ...previous,
                    elements: previous.elements.filter((item) => item.id !== selected.id),
                  }));
                  setSelectedId(null);
                }}
                className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
              >
                Xoá phần tử
              </button>
            </div>
          ) : selected.type === "photo" ? (
            <div className="space-y-3">
              <label className="block text-xs text-text">
                Ảnh cưới (slot)
                <select
                  value={selected.slot}
                  onChange={(event) => updateElement(selected.id, { slot: event.target.value as (typeof PHOTO_SLOTS)[number] })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                >
                  {PHOTO_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-text">
                  Bo góc
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={selected.radius}
                    onChange={(event) => updateElement(selected.id, { radius: Number(event.target.value) || 0 })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
                <label className="block text-xs text-text">
                  Fit
                  <select
                    value={selected.fit}
                    onChange={(event) => updateElement(selected.id, { fit: event.target.value as "cover" | "contain" })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  >
                    <option value="cover">cover</option>
                    <option value="contain">contain</option>
                  </select>
                </label>
              </div>

              <button
                type="button"
                onClick={loadAssets}
                disabled={loadingAssets}
                className="inline-flex h-9 w-full items-center justify-center rounded-full border border-border text-xs font-medium text-text disabled:opacity-60"
              >
                {loadingAssets ? "Đang tải…" : "Chọn ảnh từ thư viện"}
              </button>

              {assets && assets.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  {assets.slice(0, 12).map((asset) => (
                    <button
                      key={asset.key}
                      type="button"
                      onClick={() => updateElement(selected.id, { url: asset.url })}
                      className="overflow-hidden rounded-md border border-border focus-visible:ring-2 focus-visible:ring-focus-ring"
                      aria-label="Dùng ảnh này"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={asset.url} alt="" className="aspect-square h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setContent((previous) => ({
                    ...previous,
                    elements: previous.elements.filter((item) => item.id !== selected.id),
                  }));
                  setSelectedId(null);
                }}
                className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
              >
                Xoá khung ảnh
              </button>
            </div>
          ) : selected.type === "box" ? (
            <div className="space-y-3">
              <label className="block text-xs text-text">
                Màu nền
                <input
                  type="color"
                  value={selected.fill}
                  onChange={(event) => updateElement(selected.id, { fill: event.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                />
              </label>
              <label className="block text-xs text-text">
                Màu viền
                <input
                  type="color"
                  value={selected.border === "none" ? "#E6E0D6" : selected.border}
                  onChange={(event) => updateElement(selected.id, { border: event.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-text">
                  Bo góc
                  <input
                    type="number"
                    min={0}
                    max={80}
                    value={selected.radius}
                    onChange={(event) => updateElement(selected.id, { radius: Number(event.target.value) || 0 })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
                <label className="block text-xs text-text">
                  Cao (%)
                  <input
                    type="number"
                    min={4}
                    max={100}
                    value={selected.hPct}
                    onChange={(event) => updateElement(selected.id, { hPct: Number(event.target.value) || 10 })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContent((previous) => ({
                    ...previous,
                    elements: previous.elements.filter((item) => item.id !== selected.id),
                  }));
                  setSelectedId(null);
                }}
                className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
              >
                Xoá khung
              </button>
            </div>
          ) : selected.type === "icon" ? (
            <div className="space-y-3">
              <label className="block text-xs text-text">
                Icon
                <select
                  value={selected.icon}
                  onChange={(event) => updateElement(selected.id, { icon: event.target.value as (typeof DESIGNER_ICONS)[number] })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                >
                  {DESIGNER_ICONS.map((icon) => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-text">
                  Màu
                  <input
                    type="color"
                    value={selected.color}
                    onChange={(event) => updateElement(selected.id, { color: event.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                  />
                </label>
                <label className="block text-xs text-text">
                  Rộng (%)
                  <input
                    type="number"
                    min={4}
                    max={100}
                    value={selected.wPct}
                    onChange={(event) => updateElement(selected.id, { wPct: Number(event.target.value) || 10 })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContent((previous) => ({
                    ...previous,
                    elements: previous.elements.filter((item) => item.id !== selected.id),
                  }));
                  setSelectedId(null);
                }}
                className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
              >
                Xoá icon
              </button>
            </div>
          ) : selected.type === "button" ? (
            <div className="space-y-3">
              <label className="block text-xs text-text">
                Nhãn nút
                <input
                  value={selected.label}
                  onChange={(event) => updateElement(selected.id, { label: event.target.value })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                />
              </label>
              <label className="block text-xs text-text">
                Hành động
                <select
                  value={selected.action}
                  onChange={(event) => updateElement(selected.id, { action: event.target.value as (typeof DESIGNER_ACTIONS)[number] })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                >
                  {DESIGNER_ACTIONS.map((action) => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-text">
                  Nền
                  <input
                    type="color"
                    value={selected.fill}
                    onChange={(event) => updateElement(selected.id, { fill: event.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                  />
                </label>
                <label className="block text-xs text-text">
                  Chữ
                  <input
                    type="color"
                    value={selected.textColor}
                    onChange={(event) => updateElement(selected.id, { textColor: event.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContent((previous) => ({
                    ...previous,
                    elements: previous.elements.filter((item) => item.id !== selected.id),
                  }));
                  setSelectedId(null);
                }}
                className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
              >
                Xoá nút
              </button>
            </div>
          ) : selected.type === "block" ? (
            <div className="space-y-3">
              <label className="block text-xs text-text">
                Loại khối
                <select
                  value={selected.block}
                  onChange={(event) => updateElement(selected.id, { block: event.target.value as (typeof DESIGNER_BLOCKS)[number] })}
                  className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                >
                  {DESIGNER_BLOCKS.map((block) => (
                    <option key={block} value={block}>{block}</option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-text">
                  Màu
                  <input
                    type="color"
                    value={selected.color}
                    onChange={(event) => updateElement(selected.id, { color: event.target.value })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-1"
                  />
                </label>
                <label className="block text-xs text-text">
                  Cao (%)
                  <input
                    type="number"
                    min={6}
                    max={60}
                    value={selected.hPct}
                    onChange={(event) => updateElement(selected.id, { hPct: Number(event.target.value) || 18 })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  setContent((previous) => ({
                    ...previous,
                    elements: previous.elements.filter((item) => item.id !== selected.id),
                  }));
                  setSelectedId(null);
                }}
                className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
              >
                Xoá khối
              </button>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-text-muted">
              <p>Ảnh đã tải lên R2. Kéo trên canvas để đặt vị trí.</p>
              <button
                type="button"
                onClick={() => {
                  setContent((previous) => ({
                    ...previous,
                    elements: previous.elements.filter((item) => item.id !== selected.id),
                  }));
                  setSelectedId(null);
                }}
                className="inline-flex h-9 w-full items-center justify-center rounded-full border border-danger-border text-xs font-medium text-danger-fg"
              >
                Xoá ảnh
              </button>
            </div>
          )}

          {selected && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-xs font-semibold text-text">Vị trí &amp; kích thước</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-xs text-text">
                  X (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={Math.round(selected.xPct)}
                    onChange={(event) => updateElement(selected.id, { xPct: Number(event.target.value) || 0 })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
                <label className="block text-xs text-text">
                  Y (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={Math.round(selected.yPct)}
                    onChange={(event) => updateElement(selected.id, { yPct: Number(event.target.value) || 0 })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
                <label className="block text-xs text-text">
                  Rộng (%)
                  <input
                    type="number"
                    min={4}
                    max={100}
                    value={Math.round(selected.wPct)}
                    onChange={(event) => updateElement(selected.id, { wPct: Number(event.target.value) || 10 })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
                <label className="block text-xs text-text">
                  Xoay (độ)
                  <input
                    type="number"
                    min={-180}
                    max={180}
                    value={selected.rotation ?? 0}
                    onChange={(event) => updateElement(selected.id, { rotation: Number(event.target.value) || 0 })}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
                {"hPct" in selected && typeof selected.hPct === "number" && (
                  <label className="block text-xs text-text">
                    Cao (%)
                    <input
                      type="number"
                      min={4}
                      max={100}
                      value={Math.round(selected.hPct)}
                      onChange={(event) => updateElement(selected.id, { hPct: Number(event.target.value) || 10 })}
                      className="mt-1 h-9 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-border pt-3">
            <button
              type="button"
              onClick={() => addText(PLACEHOLDER_OPTIONS[0].id)}
              className="inline-flex h-8 w-full items-center justify-center rounded-full border border-border text-[11px] text-text"
            >
              + Text box placeholder
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
