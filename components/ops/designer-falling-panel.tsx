"use client";

import * as React from "react";
import { ImagePlus, Snowflake, Trash2, Upload } from "lucide-react";
import type {
  DesignerFallingEffectElement,
  DesignerIconName,
  FallingEffectPreset,
  FallingEffectSource,
} from "@/components/ops/designer-types";
import { DESIGNER_ICONS } from "@/components/ops/designer-types";
import {
  FALLING_PRESET_META,
  getFallingPresetMeta,
} from "@/components/designer/falling-effect-presets";
import { opsRequest } from "@/lib/ops-api";
import { cn } from "@/lib/utils";

interface DesignerFallingPanelProps {
  element: DesignerFallingEffectElement;
  onChange: (patch: Partial<DesignerFallingEffectElement>) => void;
  livePreview: boolean;
  onLivePreviewChange: (value: boolean) => void;
}

function NumberRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-[11px] text-text">
      <span className="flex items-center justify-between gap-2">
        {label}
        <span className="tabular-nums text-text-muted">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full accent-accent"
      />
    </label>
  );
}

async function compressParticleImage(file: File): Promise<string> {
  if (!/^image\/(png|webp|jpeg)$/.test(file.type)) {
    throw new Error("Chỉ nhận ảnh PNG, WebP hoặc JPEG.");
  }
  const bitmap = await createImageBitmap(file);
  const maxSide = 256;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Không xử lý được ảnh.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/webp", 0.86);
  const base64 = dataUrl.split(",")[1] ?? "";
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > 512 * 1024) {
    throw new Error("Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn.");
  }
  return dataUrl;
}

export function DesignerFallingPanel({
  element,
  onChange,
  livePreview,
  onLivePreviewChange,
}: DesignerFallingPanelProps) {
  const [iconName, setIconName] = React.useState<DesignerIconName>("Heart");
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const sources: FallingEffectSource[] =
    element.sources && element.sources.length > 0
      ? element.sources
      : [{ type: "preset", preset: element.preset }];

  const setSources = (next: FallingEffectSource[]) => {
    onChange({ sources: next.length > 0 ? next : undefined });
  };

  const addSource = (source: FallingEffectSource) => {
    if (sources.length >= 4) {
      setUploadError("Tối đa 4 nguồn hạt.");
      return;
    }
    setUploadError(null);
    setSources([...sources, source]);
  };

  const uploadSource = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    try {
      const dataUrl = await compressParticleImage(file);
      const body = await opsRequest<{ url?: string }>("/api/ops/designer/assets", {
        method: "POST",
        body: JSON.stringify({ dataUrl, kind: "png" }),
      });
      if (!body.url) throw new Error("Tải ảnh hạt thất bại.");
      addSource({ type: "image", url: body.url });
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : "Tải ảnh hạt thất bại.",
      );
    } finally {
      setUploading(false);
    }
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, itemIndex) => itemIndex !== index));
  };

  const applyPreset = (preset: FallingEffectPreset) => {
    const next = getFallingPresetMeta(preset);
    onChange({
      preset,
      sizeMin: next.size[0],
      sizeMax: next.size[1],
      speedMin: next.speed[0],
      speedMax: next.speed[1],
      direction: next.direction,
      swayAmplitude: next.sway[0],
      swayFrequency: next.sway[1],
      spin: next.spin,
      sources: [{ type: "preset", preset }],
    });
  };

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-text">
        <Snowflake className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
        Hiệu ứng rơi
      </p>
      <p className="text-[10px] leading-relaxed text-text-muted">
        Canvas sống, không bake vào ảnh nền. Tối đa 2 hiệu ứng/thiệp; tự giảm hạt
        trên máy yếu và tắt khi giảm chuyển động.
      </p>

      <label className="flex cursor-pointer items-center gap-2 text-[11px] text-text">
        <input
          type="checkbox"
          checked={livePreview}
          onChange={(event) => onLivePreviewChange(event.target.checked)}
          className="h-3.5 w-3.5 rounded border-border accent-accent"
        />
        Xem hiệu ứng khi chỉnh
      </label>

      <div className="grid grid-cols-3 gap-1">
        {FALLING_PRESET_META.map((option) => {
          const active = element.preset === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => applyPreset(option.id)}
              aria-pressed={active}
              className={cn(
                "flex h-12 flex-col items-start justify-center rounded-lg border px-2 text-left transition-colors",
                active
                  ? "border-accent bg-accent-soft text-accent-text"
                  : "border-border bg-bg text-text hover:bg-surface-alt",
              )}
            >
              <span className="text-[10px] font-semibold">{option.label}</span>
              <span className="line-clamp-1 text-[9px] text-text-muted">
                {option.hint}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <p className="text-[11px] text-text">Phạm vi</p>
        <div className="mt-1 grid grid-cols-2 gap-1">
          {(
            [
              ["box", "Trong khung"],
              ["page", "Cả trang"],
            ] as const
          ).map(([scope, label]) => (
            <button
              key={scope}
              type="button"
              onClick={() => onChange({ scope })}
              aria-pressed={element.scope === scope}
              className={cn(
                "h-8 rounded-lg border text-[10px] font-medium",
                element.scope === scope
                  ? "border-accent bg-accent-soft text-accent-text"
                  : "border-border bg-bg text-text-muted hover:bg-surface-alt",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <NumberRow
        label="Số lượng hạt"
        value={element.count}
        min={5}
        max={120}
        onChange={(count) => onChange({ count })}
      />
      <div className="grid grid-cols-2 gap-2">
        <NumberRow
          label="Size nhỏ"
          value={element.sizeMin}
          min={4}
          max={Math.max(4, element.sizeMax)}
          onChange={(sizeMin) =>
            onChange({ sizeMin: Math.min(sizeMin, element.sizeMax) })
          }
        />
        <NumberRow
          label="Size lớn"
          value={element.sizeMax}
          min={Math.max(4, element.sizeMin)}
          max={120}
          onChange={(sizeMax) =>
            onChange({ sizeMax: Math.max(sizeMax, element.sizeMin) })
          }
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberRow
          label="Tốc độ nhỏ"
          value={element.speedMin}
          min={20}
          max={Math.max(20, element.speedMax)}
          onChange={(speedMin) =>
            onChange({ speedMin: Math.min(speedMin, element.speedMax) })
          }
        />
        <NumberRow
          label="Tốc độ lớn"
          value={element.speedMax}
          min={Math.max(20, element.speedMin)}
          max={300}
          onChange={(speedMax) =>
            onChange({ speedMax: Math.max(speedMax, element.speedMin) })
          }
        />
      </div>

      <label className="block text-[11px] text-text">
        Hướng rơi
        <select
          value={element.direction}
          onChange={(event) =>
            onChange({
              direction: event.target
                .value as DesignerFallingEffectElement["direction"],
            })
          }
          className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
        >
          <option value="down">Xuống</option>
          <option value="up">Lên</option>
          <option value="diagonalLeft">Chéo trái</option>
          <option value="diagonalRight">Chéo phải</option>
        </select>
      </label>

      <NumberRow
        label="Gió (px/s)"
        value={element.wind}
        min={-100}
        max={100}
        step={5}
        onChange={(wind) => onChange({ wind })}
      />
      <div className="grid grid-cols-2 gap-2">
        <NumberRow
          label="Lắc (px)"
          value={element.swayAmplitude}
          min={0}
          max={40}
          onChange={(swayAmplitude) => onChange({ swayAmplitude })}
        />
        <NumberRow
          label="Tần số lắc (Hz)"
          value={element.swayFrequency}
          min={0.2}
          max={2}
          step={0.1}
          onChange={(swayFrequency) => onChange({ swayFrequency })}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-[11px] text-text">
        <input
          type="checkbox"
          checked={element.spin}
          onChange={(event) => onChange({ spin: event.target.checked })}
          className="h-3.5 w-3.5 rounded border-border accent-accent"
        />
        Xoay hạt
      </label>
      {element.spin && (
        <NumberRow
          label="Tốc độ xoay (°/s)"
          value={element.spinSpeed}
          min={0}
          max={180}
          step={5}
          onChange={(spinSpeed) => onChange({ spinSpeed })}
        />
      )}

      <div className="grid grid-cols-2 gap-2">
        <NumberRow
          label="Mờ nhỏ nhất"
          value={element.opacityMin}
          min={0.3}
          max={Math.max(0.3, element.opacityMax)}
          step={0.05}
          onChange={(opacityMin) =>
            onChange({ opacityMin: Math.min(opacityMin, element.opacityMax) })
          }
        />
        <NumberRow
          label="Mờ lớn nhất"
          value={element.opacityMax}
          min={Math.max(0.3, element.opacityMin)}
          max={1}
          step={0.05}
          onChange={(opacityMax) =>
            onChange({ opacityMax: Math.max(opacityMax, element.opacityMin) })
          }
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-[11px] text-text">
        <input
          type="checkbox"
          checked={element.depth}
          onChange={(event) => onChange({ depth: event.target.checked })}
          className="h-3.5 w-3.5 rounded border-border accent-accent"
        />
        Chiều sâu (hạt nhỏ chậm/mờ hơn)
      </label>

      <div className="rounded-lg border border-border bg-bg p-2.5">
        <p className="text-[11px] font-medium text-text">
          Nguồn hạt ({sources.length}/4)
        </p>
        <ul className="mt-1.5 space-y-1">
          {sources.map((source, index) => (
            <li
              key={`${source.type}-${index}`}
              className="flex items-center justify-between gap-2 rounded-md bg-surface-alt px-2 py-1"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-text">
                {source.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={source.url}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded object-contain"
                  />
                ) : source.type === "icon" ? (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                ) : (
                  <Snowflake className="h-3 w-3 shrink-0 text-accent-text" aria-hidden="true" />
                )}
                <span className="truncate">
                  {source.type === "preset"
                    ? `Preset: ${getFallingPresetMeta(source.preset).label}`
                    : source.type === "icon"
                      ? `Icon: ${source.icon}`
                      : "Ảnh tải lên"}
                </span>
              </span>
              {sources.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSource(index)}
                  aria-label="Xóa nguồn hạt"
                  className="shrink-0 rounded p-0.5 text-text-muted hover:text-danger-fg"
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-2 flex gap-1">
          <select
            value={iconName}
            onChange={(event) => setIconName(event.target.value as DesignerIconName)}
            className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-bg px-1.5 text-[10px]"
          >
            {DESIGNER_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={sources.length >= 4}
            onClick={() =>
              addSource({ type: "icon", icon: iconName, color: "#C9A24D" })
            }
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-border bg-surface px-2 text-[10px] font-medium text-text disabled:cursor-not-allowed disabled:opacity-45"
          >
            <ImagePlus className="h-3 w-3" aria-hidden="true" />
            Thêm icon
          </button>
        </div>

        <label
          className={cn(
            "mt-1.5 inline-flex h-8 w-full cursor-pointer items-center justify-center gap-1 rounded-full border border-border bg-surface text-[10px] font-medium text-text",
            (uploading || sources.length >= 4) &&
              "pointer-events-none cursor-not-allowed opacity-45",
          )}
        >
          <Upload className="h-3 w-3" aria-hidden="true" />
          {uploading ? "Đang tải ảnh..." : "Tải ảnh hạt lên"}
          <input
            type="file"
            accept="image/png,image/webp,image/jpeg"
            className="sr-only"
            disabled={uploading || sources.length >= 4}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadSource(file);
              event.target.value = "";
            }}
          />
        </label>

        {uploadError && (
          <p className="mt-1 text-[10px] text-danger-fg" role="alert">
            {uploadError}
          </p>
        )}
        <p className="mt-1 text-[10px] leading-relaxed text-text-muted">
          Ảnh được thu về tối đa 256px, &lt;512KB; không nhận SVG. Nhiều nguồn
          thì mỗi hạt chọn ngẫu nhiên một nguồn.
        </p>
      </div>
    </div>
  );
}
