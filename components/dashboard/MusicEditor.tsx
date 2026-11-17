"use client";

import * as React from "react";
import { Lock, Music2, Upload } from "lucide-react";
import { uploadWeddingMusic } from "@/lib/api";
import type { WeddingContent, WeddingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";

const PRESETS = [
  {
    id: "default" as const,
    title: "Giai điệu ngày cưới",
    subtitle: "Ấm áp · Cổ điển",
    src: "/media/wedding.mp3",
  },
  {
    id: "calm" as const,
    title: "Bình yên bên nhau",
    subtitle: "Nhẹ nhàng · Sâu lắng",
    src: "/media/wedding.mp3",
  },
  {
    id: "beginning" as const,
    title: "Khởi đầu dịu dàng",
    subtitle: "Tươi mới · Lãng mạn",
    src: "/media/wedding.mp3",
  },
];

interface MusicEditorProps {
  weddingId: string;
  plan: WeddingPlan;
  content: WeddingContent;
  onChange: (next: WeddingContent) => void;
}

export function MusicEditor({
  weddingId,
  plan,
  content,
  onChange,
}: MusicEditorProps) {
  const { showToast } = useToast();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isPro = plan !== "free";
  const selected = content.musicPreset ?? "default";

  const choosePreset = (preset: (typeof PRESETS)[number]) => {
    onChange({
      ...content,
      musicPreset: preset.id,
      musicTitle: preset.title,
      musicUrl: undefined,
    });
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    if (!isPro) {
      setError("Nâng cấp lên Pro để tải file nhạc riêng.");
      return;
    }
    if (file.type !== "audio/mpeg" && !file.name.toLowerCase().endsWith(".mp3")) {
      setError("Chỉ hỗ trợ file MP3.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("File nhạc tối đa 8 MB.");
      return;
    }
    setBusy(true);
    try {
      const result = await uploadWeddingMusic(weddingId, file, file.name.replace(/\.mp3$/i, ""));
      onChange(result.wedding.content);
      showToast("Đã tải nhạc nền lên", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được file nhạc.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="flex items-center gap-2 font-sans text-base font-semibold text-fg">
            <Music2 className="h-4 w-4 text-accent-text" aria-hidden="true" />
            Nhạc nền thiệp
          </h3>
          <p className="mt-0.5 text-xs text-fg-muted">
            Chọn một bài có sẵn hoặc tải file MP3 riêng.
          </p>
        </div>
        {!isPro && (
          <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[10px] font-semibold text-accent-text">
            <Lock className="h-3 w-3" />
            Nâng cấp lên Pro để upload file nhạc
          </span>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {PRESETS.map((preset) => (
          <label
            key={preset.id}
            className={cn(
              "cursor-pointer rounded-xl border p-3 transition-colors",
              selected === preset.id
                ? "border-accent bg-accent-soft/60"
                : "border-border bg-bg hover:border-accent/50",
            )}
          >
            <div className="flex items-start gap-2">
              <input
                type="radio"
                name="musicPreset"
                checked={selected === preset.id}
                onChange={() => choosePreset(preset)}
                className="mt-1"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-fg">{preset.title}</p>
                <p className="mt-0.5 text-[10px] text-fg-muted">{preset.subtitle}</p>
              </div>
            </div>
          </label>
        ))}
      </div>

      <div
        className={cn(
          "rounded-xl border p-3",
          isPro ? "border-border bg-bg" : "border-dashed border-border bg-bg/60",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-semibold text-fg">Nhạc riêng của bạn</p>
            <p className="mt-0.5 text-[10px] text-fg-muted">
              MP3, tối đa 8 MB. Chỉ gói Pro/VIP.
            </p>
          </div>
          {isPro ? (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="audio/mpeg,.mp3"
                onChange={(event) => void handleFile(event)}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                {busy ? "Đang tải…" : "Tải file MP3"}
              </Button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft px-2.5 py-1 text-[10px] font-semibold text-accent-text">
              <Lock className="h-3 w-3" />
              Nâng cấp lên Pro để upload file nhạc
            </span>
          )}
        </div>

        {selected === "custom" && content.musicUrl && (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] font-medium text-fg">
              {content.musicTitle || "Nhạc nền của chúng tôi"}
            </p>
            <audio controls src={content.musicUrl} className="w-full" preload="none" />
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-danger-border bg-danger-bg/20 px-3 py-2 text-xs text-danger-fg">
          {error}
        </p>
      )}
    </Card>
  );
}
