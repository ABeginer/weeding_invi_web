"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ImagePlus, Loader2, Save, Type, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLACEHOLDER_OPTIONS,
  type DesignerCanvasContent,
  type DesignerElement,
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
  const [content, setContent] = React.useState<DesignerCanvasContent>(initialCanvas);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
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

  const selected = content.elements.find((element) => element.id === selectedId) ?? null;

  const updateElement = (id: string, patch: Partial<DesignerElement>) => {
    setContent((previous) => ({
      ...previous,
      elements: previous.elements.map((element) =>
        element.id === id ? ({ ...element, ...patch } as DesignerElement) : element,
      ),
    }));
  };

  const addText = (placeholder: string | null) => {
    const id = crypto.randomUUID();
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

  const handleUpload = async (file: File) => {
    setError(null);
    setMessage("Đang tải ảnh…");
    try {
      const { dataUrl } = await fileToWebpDataUrl(file);
      const res = await fetch("/api/ops/designer/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "png", dataUrl }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Tải ảnh thất bại.");
      const id = crypto.randomUUID();
      setContent((previous) => ({
        ...previous,
        elements: [
          ...previous.elements,
          { id, type: "image", xPct: 20, yPct: 20, wPct: 60, url: body.url as string },
        ],
      }));
      setSelectedId(id);
      setMessage("Đã thêm ảnh.");
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
      const res = await fetch(`/api/ops/designer/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canvas_json: content }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Lưu thất bại.");
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
        } else {
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

      const upload = await fetch("/api/ops/designer/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "background", dataUrl: await blobToDataUrl(blob) }),
      });
      const uploaded = (await upload.json()) as { key?: string; error?: string };
      if (!upload.ok || !uploaded.key) {
        throw new Error(uploaded.error ?? "Tải ảnh nền thất bại.");
      }

      const patch = await fetch(`/api/ops/designer/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          canvas_json: content,
          background_key: uploaded.key,
        }),
      });
      if (!patch.ok) throw new Error("Không lưu được ảnh nền.");
      setMessage(`Đã xuất webp và lưu layout (${Math.round(blob.size / 1024)}KB).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xuất ảnh thất bại.");
      setMessage(null);
    } finally {
      setExporting(false);
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
        </div>
      </div>

      {message && <p className="rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-muted">{message}</p>}
      {error && (
        <p role="alert" className="rounded-xl border border-danger-border bg-danger-bg px-3 py-2 text-xs text-danger-fg">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="flex justify-center rounded-2xl border border-border bg-surface-alt p-4">
          <div
            ref={boardRef}
            className="relative w-full max-w-[390px] overflow-hidden rounded-xl border border-border shadow-lg"
            style={{ aspectRatio: `${content.width} / ${content.height}`, background: content.background }}
            onPointerDown={(event) => {
              if (event.target === event.currentTarget) setSelectedId(null);
            }}
          >
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
                  style={{ left: `${element.xPct}%`, top: `${element.yPct}%`, width: `${element.wPct}%` }}
                >
                  {element.type === "text" ? (
                    <span
                      style={{
                        display: "block",
                        fontFamily: element.fontFamily,
                        fontSize: element.fontSize,
                        color: element.color,
                        lineHeight: 1.2,
                      }}
                    >
                      {element.placeholder
                        ? PLACEHOLDER_OPTIONS.find((option) => option.id === element.placeholder)?.sample ??
                          element.text
                        : element.text}
                    </span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={element.url} alt="" className="block h-auto w-full" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <h2 className="text-sm font-semibold text-text">Thuộc tính</h2>

          {!selected ? (
            <p className="text-xs text-text-muted">
              Chọn một phần tử trên canvas để sửa. Kéo để di chuyển; nhấn Delete để xoá.
            </p>
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
