"use client";

import * as React from "react";
import { Loader2, Minus, Plus, RotateCcw } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface ImageCropDialogProps {
  file: File | null;
  aspect: number;
  title?: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

/**
 * Crop có preview bằng canvas: đúng những gì thấy trong khung là những gì được cắt.
 * offset là % dịch vùng crop so với tâm ảnh; kéo ảnh sang phải => vùng nhìn sang trái.
 */
export function ImageCropDialog({
  file,
  aspect,
  title = "Căn và cắt ảnh",
  onCancel,
  onConfirm,
}: ImageCropDialogProps) {
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const [scale, setScale] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const dragRef = React.useRef<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  React.useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setError(null);
    const img = new Image();
    img.onload = () => setImage(img);
    img.onerror = () => setError("Không đọc được ảnh.");
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const getCrop = React.useCallback(() => {
    if (!image) return null;
    const imageAspect = image.naturalWidth / image.naturalHeight;
    let baseW = image.naturalWidth;
    let baseH = image.naturalHeight;
    if (imageAspect > aspect) {
      baseH = image.naturalHeight;
      baseW = baseH * aspect;
    } else {
      baseW = image.naturalWidth;
      baseH = baseW / aspect;
    }

    const cropW = baseW / scale;
    const cropH = baseH / scale;
    const maxX = Math.max(0, (image.naturalWidth - cropW) / 2);
    const maxY = Math.max(0, (image.naturalHeight - cropH) / 2);
    const shiftX = Math.max(
      -maxX,
      Math.min(maxX, (offset.x / 100) * cropW),
    );
    const shiftY = Math.max(
      -maxY,
      Math.min(maxY, (offset.y / 100) * cropH),
    );
    const sx = image.naturalWidth / 2 - cropW / 2 + shiftX;
    const sy = image.naturalHeight / 2 - cropH / 2 + shiftY;
    return { sx, sy, cropW, cropH };
  }, [aspect, image, offset.x, offset.y, scale]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const crop = getCrop();
    if (!canvas || !image || !crop) return;
    const width = 700;
    const height = Math.round(width / aspect);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(
      image,
      crop.sx,
      crop.sy,
      crop.cropW,
      crop.cropH,
      0,
      0,
      width,
      height,
    );
  }, [aspect, getCrop, image]);

  if (!file) return null;

  const confirm = async () => {
    const crop = getCrop();
    if (!image || !crop) return;
    setBusy(true);
    setError(null);
    try {
      const outW = 1400;
      const outH = Math.round(outW / aspect);
      const canvas = document.createElement("canvas");
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Không tạo được canvas.");
      ctx.drawImage(
        image,
        crop.sx,
        crop.sy,
        crop.cropW,
        crop.cropH,
        0,
        0,
        outW,
        outH,
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((value) => resolve(value), "image/jpeg", 0.92),
      );
      if (!blob) throw new Error("Không tạo được ảnh đã cắt.");
      onConfirm(
        new File([blob], file.name.replace(/\.[^.]+$/, "") + "-crop.jpg", {
          type: "image/jpeg",
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không cắt được ảnh.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={Boolean(file)}
      onClose={onCancel}
      title={title}
      description="Kéo ảnh để căn, dùng thanh trượt để phóng to. Khung xem trước chính là ảnh cuối cùng."
      className="max-w-lg"
    >
      <div className="space-y-4">
        <div
          className="relative mx-auto w-full max-w-[340px] touch-none overflow-hidden rounded-xl border border-border bg-black"
          style={{ aspectRatio: String(aspect) }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
              x: event.clientX,
              y: event.clientY,
              offsetX: offset.x,
              offsetY: offset.y,
            };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag) return;
            const rect = event.currentTarget.getBoundingClientRect();
            setOffset({
              x:
                drag.offsetX -
                ((event.clientX - drag.x) / rect.width) * 100,
              y:
                drag.offsetY -
                ((event.clientY - drag.y) / rect.height) * 100,
            });
          }}
          onPointerUp={(event) => {
            dragRef.current = null;
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
        >
          <canvas
            ref={canvasRef}
            className="h-full w-full cursor-grab object-cover"
          />
          <div className="pointer-events-none absolute inset-0 border-[3px] border-white/80" />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale((value) => Math.max(1, value - 0.1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
            aria-label="Thu nhỏ"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={scale}
            onChange={(event) => setScale(Number(event.target.value))}
            className="flex-1 accent-[var(--accent)]"
          />
          <button
            type="button"
            onClick={() => setScale((value) => Math.min(3, value + 0.1))}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
            aria-label="Phóng to"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setScale(1);
              setOffset({ x: 0, y: 0 });
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border"
            aria-label="Đặt lại"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="rounded-lg border border-danger-border bg-danger-bg/20 px-3 py-2 text-sm text-danger-fg">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel} disabled={busy}>
            Huỷ
          </Button>
          <Button className="flex-1" onClick={confirm} disabled={busy || !image}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Dùng ảnh này"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
