"use client";

import * as React from "react";
import { ImagePlus, Loader2, Move, Trash2 } from "lucide-react";
import type { DesignerElement } from "@/components/ops/designer-types";
import type { WeddingContent, WeddingEvent } from "@/lib/types";
import type { DesignerElementOverride } from "@/lib/wedding-types";
import { toIsoPlus07 } from "@/lib/wedding-types";import { compressImage } from "@/lib/image/compress";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

interface DesignerPreviewEditorProps {
  element: DesignerElement | null;
  content: WeddingContent;
  events: WeddingEvent[];
  onClose: () => void;
  onApply: (next: WeddingContent) => Promise<boolean>;
}

function initialText(
  element: DesignerElement,
  content: WeddingContent,
  events: WeddingEvent[],
): string {
  if (element.type !== "text") return "";
  if (element.placeholder === "groom") return content.couple.groomName;
  if (element.placeholder === "bride") return content.couple.brideName;
  if (element.placeholder === "date") return content.date;
  if (element.placeholder === "venue") return events[0]?.venueName ?? "";
  const override = content.designerOverrides?.[element.id];
  if (override?.text) return override.text;
  if (element.guestField) return content.designerFields?.[element.id] ?? "";
  return element.text;
}

function initialImage(element: DesignerElement, content: WeddingContent): string {
  const override = content.designerOverrides?.[element.id];
  if (override?.imageUrl) return override.imageUrl;
  if (content.designerFields?.[element.id]) {
    return content.designerFields[element.id];
  }
  return "url" in element ? element.url ?? "" : "";
}

export function DesignerPreviewEditor({
  element,
  content,
  events,
  onClose,
  onApply,
}: DesignerPreviewEditorProps) {
  const [text, setText] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [scale, setScale] = React.useState(1);
  const [imageX, setImageX] = React.useState(0);
  const [imageY, setImageY] = React.useState(0);
  const [textColor, setTextColor] = React.useState("#3A2528");
  const [fontSize, setFontSize] = React.useState(16);
  const [radius, setRadius] = React.useState(18);
  const [frameX, setFrameX] = React.useState(0);
  const [frameY, setFrameY] = React.useState(0);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const dragRef = React.useRef<{
    x: number;
    y: number;
    imageX: number;
    imageY: number;
  } | null>(null);

  React.useEffect(() => {
    if (!element) return;
    setError(null);
    setText(initialText(element, content, events));
    setImageUrl(initialImage(element, content));
    const override = content.designerOverrides?.[element.id];
    setScale(override?.imageScale ?? 1);
    setImageX(override?.imageX ?? 0);
    setImageY(override?.imageY ?? 0);
    setTextColor(override?.color ?? (element.type === "text" ? element.color : "#3A2528"));
    setFontSize(override?.fontSize ?? (element.type === "text" ? element.fontSize : 16));
    setRadius(override?.radius ?? (element.type === "photo" ? element.radius : 18));
    setFrameX(override?.xPct ?? element.xPct);
    setFrameY(override?.yPct ?? element.yPct);
  }, [content, element, events]);

  if (!element) return null;

  const isImage = element.type === "image" || element.type === "photo";
  const isText = element.type === "text";
  const placeholder = element.type === "text" ? element.placeholder : null;
  const isDate = placeholder === "date";
  const title = isImage ? "Chỉnh ảnh trên thiệp" : "Chỉnh chữ trên thiệp";

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const compressed = await compressImage(file, "gallery");
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Không đọc được ảnh."));
        reader.readAsDataURL(compressed.blob);
      });
      setImageUrl(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được ảnh.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const nextOverrides: Record<string, DesignerElementOverride> = {
        ...(content.designerOverrides ?? {}),
      };
      const next: WeddingContent = {
        ...content,
        couple: { ...content.couple },
        designerFields: { ...(content.designerFields ?? {}) },
        designerOverrides: nextOverrides,
      };

      if (isText) {
        if (placeholder === "groom") next.couple.groomName = text.trim();
        else if (placeholder === "bride") next.couple.brideName = text.trim();
        else if (placeholder === "date") {
          const iso = toIsoPlus07(text);
          if (!iso) throw new Error("Ngày chưa đúng định dạng.");
          next.date = iso;
        } else if (placeholder === "venue") {
          nextOverrides[element.id] = {
            ...(nextOverrides[element.id] ?? {}),
            text: text.trim(),
          };
        } else if (element.guestField) {
          if (text.trim()) next.designerFields![element.id] = text.trim();
          else delete next.designerFields![element.id];
          nextOverrides[element.id] = {
            ...(nextOverrides[element.id] ?? {}),
            color: textColor,
            fontSize,
          };
        } else {
          nextOverrides[element.id] = {
            ...(nextOverrides[element.id] ?? {}),
            text: text.trim(),
            color: textColor,
            fontSize,
          };
        }
      } else {
        nextOverrides[element.id] = {
          ...(nextOverrides[element.id] ?? {}),
          imageUrl,
          imageScale: Math.round(scale * 100) / 100,
          imageX: Math.round(imageX),
          imageY: Math.round(imageY),
          radius,
          xPct: Math.round(frameX),
          yPct: Math.round(frameY),
        };
      }

      if (!(await onApply(next))) {
        setError("Chưa lưu được. Vui lòng thử lại.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không lưu được thay đổi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={Boolean(element)}
      onClose={onClose}
      title={title}
      description="Chỉnh ngay trên thiệp — không cần nhập lại ở bảng bên cạnh."
      className="max-w-md"
    >
      <div className="space-y-4">
        {isText ? (
          <>
          <label className="block text-sm font-medium text-fg">
            {isDate ? "Ngày cưới" : "Nội dung"}
            {isDate ? (
              <input
                type="datetime-local"
                value={text.slice(0, 16)}
                onChange={(event) => setText(event.target.value)}
                className="mt-1.5 h-12 w-full rounded-xl border border-border bg-bg px-3 text-base text-fg"
              />
            ) : (
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={3}
                maxLength={element.guestField?.maxLength ?? 2000}
                className="mt-1.5 w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-base text-fg"
                placeholder="Nhập nội dung…"
              />
            )}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-fg">
              Màu chữ
              <input
                type="color"
                value={textColor}
                onChange={(event) => setTextColor(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-bg px-1"
              />
            </label>
            <label className="block text-sm font-medium text-fg">
              Cỡ chữ · {fontSize}
              <input
                type="range"
                min={10}
                max={80}
                value={fontSize}
                onChange={(event) => setFontSize(Number(event.target.value))}
                className="mt-3 w-full accent-[var(--accent)]"
              />
            </label>
          </div>
          </>
        ) : (
          <>
            <div
              className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface-alt"
              onPointerDown={(event) => {
                if (!imageUrl) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                dragRef.current = {
                  x: event.clientX,
                  y: event.clientY,
                  imageX,
                  imageY,
                };
              }}
              onPointerMove={(event) => {
                const drag = dragRef.current;
                if (!drag) return;
                const rect = event.currentTarget.getBoundingClientRect();
                setImageX(
                  Math.max(
                    -100,
                    Math.min(100, drag.imageX + ((event.clientX - drag.x) / rect.width) * 100),
                  ),
                );
                setImageY(
                  Math.max(
                    -100,
                    Math.min(100, drag.imageY + ((event.clientY - drag.y) / rect.height) * 100),
                  ),
                );
              }}
              onPointerUp={(event) => {
                dragRef.current = null;
                if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                  event.currentTarget.releasePointerCapture(event.pointerId);
                }
              }}
              style={{ touchAction: "none" }}
            >
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="Ảnh trên thiệp"
                  className="h-full w-full cursor-grab object-cover"
                  draggable={false}
                  style={{
                    transform: `scale(${scale}) translate(${imageX}%, ${imageY}%)`,
                    transformOrigin: "center",
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-fg-muted"
                >
                  <ImagePlus className="h-8 w-8" />
                  Thêm ảnh
                </button>
              )}
              <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-1 text-[10px] font-medium text-white">
                <Move className="h-3 w-3" /> Kéo ảnh để căn
              </span>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void upload(file);
                event.target.value = "";
              }}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
              >
                <ImagePlus className="mr-1.5 h-4 w-4" />
                {imageUrl ? "Đổi ảnh" : "Tải ảnh"}
              </Button>
              {imageUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setImageUrl("");
                    setImageX(0);
                    setImageY(0);
                    setScale(1);
                  }}
                  disabled={busy}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <label className="block text-sm font-medium text-fg">
              Phóng to · {scale.toFixed(1)}x
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
                className="mt-2 w-full accent-[var(--accent)]"
              />
            </label>

            <label className="block text-sm font-medium text-fg">
              Bo góc ảnh · {radius}px
              <input
                type="range"
                min={0}
                max={64}
                step={1}
                value={radius}
                onChange={(event) => setRadius(Number(event.target.value))}
                className="mt-2 w-full accent-[var(--accent)]"
              />
            </label>

            <details className="rounded-xl border border-border bg-surface-alt/50 p-3">
              <summary className="cursor-pointer text-sm font-medium text-fg">
                Vị trí khung ảnh
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="block text-xs text-fg-muted">
                  Ngang · {Math.round(frameX)}%
                  <input
                    type="range"
                    min={0}
                    max={90}
                    value={frameX}
                    onChange={(event) => setFrameX(Number(event.target.value))}
                    className="mt-1 w-full"
                  />
                </label>
                <label className="block text-xs text-fg-muted">
                  Dọc · {Math.round(frameY)}%
                  <input
                    type="range"
                    min={0}
                    max={90}
                    value={frameY}
                    onChange={(event) => setFrameY(Number(event.target.value))}
                    className="mt-1 w-full"
                  />
                </label>
              </div>
            </details>
          </>
        )}

        {placeholder === "venue" && (
          <p className="rounded-lg border border-border bg-surface-alt px-3 py-2 text-xs text-fg-muted">
            Địa điểm trên block bản đồ vẫn lấy từ tab “Lễ &amp; địa điểm”. Chữ này
            chỉ đổi phần hiển thị trên thiệp.
          </p>
        )}

        {error && (
          <p className="rounded-lg border border-danger-border bg-danger-bg/20 px-3 py-2 text-sm text-danger-fg">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={busy}
          >
            Huỷ
          </Button>
          <Button type="button" className="flex-1" onClick={save} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
