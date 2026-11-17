"use client";

import * as React from "react";
import { Play, Sparkles, Trash2 } from "lucide-react";
import type {
  DesignerElement,
  DesignerElementAnimation,
  DesignerEntrancePreset,
  DesignerExitPreset,
  DesignerLoopPreset,
} from "@/components/ops/designer-types";
import {
  createDefaultEntrance,
  createDefaultExit,
  createDefaultLoop,
  DEFAULT_ENTRANCE_DISTANCE,
  EASING_OPTIONS,
  ENTRANCE_OPTIONS,
  EXIT_OPTIONS,
  LOOP_OPTIONS,
  normalizeAnimSlot,
  normalizeLoopSlot,
  supportsDirection,
  supportsDistance,
  supportsExitDirection,
  supportsSpeed,
  supportsStagger,
} from "@/components/designer/animation-catalog";
import { cn } from "@/lib/utils";

interface DesignerAnimationPanelProps {
  element: DesignerElement;
  onChange: (animation: DesignerElementAnimation | undefined) => void;
  onPreview?: () => void;
}

type TabId = "in" | "loop" | "out";

const DIRECTION_LABELS: { id: "left" | "right" | "up" | "down"; label: string }[] = [
  { id: "left", label: "Trái" },
  { id: "right", label: "Phải" },
  { id: "up", label: "Trên" },
  { id: "down", label: "Dưới" },
];

export function DesignerAnimationPanel({
  element,
  onChange,
  onPreview,
}: DesignerAnimationPanelProps) {
  const [tab, setTab] = React.useState<TabId>("in");
  const animation = element.animation;
  const entrance = animation?.in;
  const loop = animation?.loop;
  const exit = animation?.out;
  const parallaxFactor = animation?.parallax?.factor ?? 0;
  const isText = element.type === "text";

  const updateAnimation = (next: DesignerElementAnimation | undefined) => {
    onChange(next);
  };

  const updateEntrance = (
    patch: Partial<NonNullable<DesignerElementAnimation["in"]>>,
  ) => {
    if (!entrance) return;
    const normalized = normalizeAnimSlot({ ...entrance, ...patch });
    updateAnimation({
      ...animation,
      in: {
        ...entrance,
        ...normalized,
        preset: entrance.preset,
        once: patch.once ?? entrance.once,
        threshold: patch.threshold ?? entrance.threshold,
      },
    });
  };

  const updateStagger = (stagger: number) => {
    if (!animation) return;
    updateAnimation({
      ...animation,
      stagger: Math.min(400, Math.max(20, Math.round(stagger))),
    });
  };

  const applyPreset = (preset: DesignerEntrancePreset | null) => {    if (!preset) {
      if (!animation) return;
      const rest: DesignerElementAnimation = { ...animation };
      delete rest.in;
      const hasOther = rest.loop || rest.out || rest.parallax || rest.stagger;
      updateAnimation(hasOther ? rest : undefined);
      return;
    }
    if (entrance) {
      updateAnimation({
        ...animation,
        in: {
          ...entrance,
          preset,
          ...(supportsDirection(preset) && !entrance.direction
            ? { direction: "left" as const }
            : {}),
          ...(supportsDistance(preset) && !entrance.distance
            ? { distance: DEFAULT_ENTRANCE_DISTANCE }
            : {}),
          ...(supportsSpeed(preset) && !entrance.speed ? { speed: 30 } : {}),
        },
      });
      return;
    }
    updateAnimation({ ...animation, in: createDefaultEntrance(preset) });
  };

  const updateLoop = (
    patch: Partial<NonNullable<DesignerElementAnimation["loop"]>>,
  ) => {
    if (!loop) return;
    const normalized = normalizeLoopSlot({ ...loop, ...patch });
    updateAnimation({
      ...animation,
      loop: {
        ...loop,
        ...normalized,
        preset: loop.preset,
        amount: patch.amount ?? loop.amount,
      },
    });
  };

  const applyLoop = (preset: DesignerLoopPreset | null) => {
    if (!preset) {
      if (!animation) return;
      const rest: DesignerElementAnimation = { ...animation };
      delete rest.loop;
      const hasOther = rest.in || rest.out || rest.parallax || rest.stagger;
      updateAnimation(hasOther ? rest : undefined);
      return;
    }
    updateAnimation({ ...animation, loop: createDefaultLoop(preset) });
  };

  const updateParallax = (factor: number) => {
    if (!animation) {
      if (factor !== 0) updateAnimation({ parallax: { factor } });
      return;
    }
    if (factor === 0) {
      const rest: DesignerElementAnimation = { ...animation };
      delete rest.parallax;
      const hasOther = rest.in || rest.loop || rest.out || rest.stagger;
      updateAnimation(hasOther ? rest : undefined);
      return;
    }
    updateAnimation({ ...animation, parallax: { factor } });
  };

  const updateExit = (
    patch: Partial<NonNullable<DesignerElementAnimation["out"]>>,
  ) => {
    if (!exit) return;
    const normalized = normalizeAnimSlot({ ...exit, ...patch });
    updateAnimation({
      ...animation,
      out: { ...exit, ...normalized, preset: exit.preset },
    });
  };

  const applyExit = (preset: DesignerExitPreset | null) => {
    if (!preset) {
      if (!animation) return;
      const rest: DesignerElementAnimation = { ...animation };
      delete rest.out;
      const hasOther = rest.in || rest.loop || rest.parallax || rest.stagger;
      updateAnimation(hasOther ? rest : undefined);
      return;
    }
    updateAnimation({ ...animation, out: createDefaultExit(preset) });
  };

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-text">
          <Sparkles className="h-3.5 w-3.5 text-accent-text" aria-hidden="true" />
          Hiệu ứng
        </p>
        {entrance && onPreview && (
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex h-7 items-center gap-1 rounded-full border border-border bg-surface px-2.5 text-[11px] font-medium text-text hover:border-accent"
          >
            <Play className="h-3 w-3" aria-hidden="true" />
            Phát thử
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-bg p-0.5">
        {(
          [
            ["in", "Vào"],
            ["loop", "Lặp"],
            ["out", "Ra"],
          ] as const
        ).map(([id, label]) => {
          const disabled = false;
          return (
            <button
              key={id}
              type="button"
              disabled={disabled}
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={cn(
                "h-7 rounded-md text-[11px] font-medium transition-colors",
                tab === id
                  ? "bg-accent text-accent-fg"
                  : "text-text-muted hover:bg-surface-alt",
                disabled && "cursor-not-allowed opacity-45 hover:bg-transparent",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {tab === "in" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset(null)}
              aria-pressed={!entrance}
              className={cn(
                "flex h-14 flex-col items-start justify-center rounded-lg border px-2.5 text-left transition-colors",
                !entrance
                  ? "border-accent bg-accent-soft text-accent-text"
                  : "border-border bg-bg text-text-muted hover:bg-surface-alt",
              )}
            >
              <span className="text-[11px] font-semibold">Không</span>
              <span className="text-[10px]">Tắt hiệu ứng</span>
            </button>
            {ENTRANCE_OPTIONS.map((option) => {
              const active = entrance?.preset === option.id;
              const blocked = Boolean(option.textOnly && !isText);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => applyPreset(option.id)}
                  disabled={blocked}
                  title={blocked ? "Chỉ dùng cho element chữ" : undefined}
                  aria-pressed={active}
                  className={cn(
                    "flex h-14 flex-col items-start justify-center rounded-lg border px-2.5 text-left transition-colors",
                    active
                      ? "border-accent bg-accent-soft text-accent-text"
                      : "border-border bg-bg text-text hover:bg-surface-alt",
                    blocked && "cursor-not-allowed opacity-40 hover:bg-bg",
                  )}
                >
                  <span className="text-[11px] font-semibold">{option.label}</span>
                  <span className="text-[10px] text-text-muted">{option.hint}</span>
                </button>
              );
            })}
          </div>

          {entrance && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[11px] text-text">
                  Thời gian (ms)
                  <input
                    type="number"
                    min={100}
                    max={5000}
                    step={50}
                    value={entrance.duration}
                    onChange={(event) =>
                      updateEntrance({
                        duration: Number(event.target.value) || 800,
                      })
                    }
                    className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
                <label className="block text-[11px] text-text">
                  Trễ (ms)
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    step={50}
                    value={entrance.delay}
                    onChange={(event) =>
                      updateEntrance({ delay: Number(event.target.value) || 0 })
                    }
                    className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
              </div>

              <label className="block text-[11px] text-text">
                Kiểu chuyển động
                <select
                  value={entrance.easing}
                  onChange={(event) =>
                    updateEntrance({
                      easing: event.target.value as typeof entrance.easing,
                    })
                  }
                  className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                >
                  {EASING_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {supportsSpeed(entrance.preset) && (
                <label className="block text-[11px] text-text">
                  Tốc độ gõ (ký tự/giây)
                  <input
                    type="number"
                    min={5}
                    max={100}
                    step={5}
                    value={entrance.speed ?? 30}
                    onChange={(event) =>
                      updateEntrance({ speed: Number(event.target.value) || 30 })
                    }
                    className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
              )}

              {supportsStagger(entrance.preset) && (
                <label className="block text-[11px] text-text">
                  Giãn cách mỗi từ (ms)
                  <input
                    type="number"
                    min={20}
                    max={400}
                    step={10}
                    value={animation?.stagger ?? 80}
                    onChange={(event) => updateStagger(Number(event.target.value) || 80)}
                    className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
              )}

              {supportsDirection(entrance.preset) && (
                <div>
                  <p className="text-[11px] text-text">Hướng</p>
                  <div className="mt-1 grid grid-cols-4 gap-1">
                    {DIRECTION_LABELS.map((direction) => {
                      const active = entrance.direction === direction.id;
                      return (
                        <button
                          key={direction.id}
                          type="button"
                          onClick={() =>
                            updateEntrance({ direction: direction.id })
                          }
                          aria-pressed={active}
                          className={cn(
                            "h-7 rounded-md border text-[10px] font-medium",
                            active
                              ? "border-accent bg-accent-soft text-accent-text"
                              : "border-border bg-bg text-text-muted hover:bg-surface-alt",
                          )}
                        >
                          {direction.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {supportsDistance(entrance.preset) && (
                <label className="block text-[11px] text-text">
                  Khoảng cách (px)
                  <input
                    type="number"
                    min={8}
                    max={300}
                    value={entrance.distance ?? DEFAULT_ENTRANCE_DISTANCE}
                    onChange={(event) =>
                      updateEntrance({
                        distance: Number(event.target.value) || DEFAULT_ENTRANCE_DISTANCE,
                      })
                    }
                    className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
              )}

              <label className="block text-[11px] text-text">
                Bắt đầu khi hiện: {Math.round((entrance.threshold ?? 0.25) * 100)}%
                <input
                  type="range"
                  min={5}
                  max={90}
                  step={5}
                  value={Math.round((entrance.threshold ?? 0.25) * 100)}
                  onChange={(event) =>
                    updateEntrance({
                      threshold: Number(event.target.value) / 100,
                    })
                  }
                  className="mt-1 w-full accent-accent"
                />
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-text">
                <input
                  type="checkbox"
                  checked={entrance.once !== false}
                  onChange={(event) =>
                    updateEntrance({ once: event.target.checked })
                  }
                  className="h-3.5 w-3.5 rounded border-border accent-accent"
                />
                Chỉ chạy một lần khi cuộn tới
              </label>

              <button
                type="button"
                onClick={() => applyPreset(null)}
                className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-full border border-danger-border text-[11px] font-medium text-danger-fg"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                Xóa hiệu ứng
              </button>
            </div>
          )}
        </div>
      ) : tab === "loop" ? (
        <div className="space-y-3">
          <p className="text-[10px] leading-relaxed text-text-muted">
            Lặp bắt đầu sau khi Vào xong, tự dừng khi element ra khỏi màn hình.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => applyLoop(null)}
              aria-pressed={!loop}
              className={cn(
                "flex h-14 flex-col items-start justify-center rounded-lg border px-2.5 text-left transition-colors",
                !loop
                  ? "border-accent bg-accent-soft text-accent-text"
                  : "border-border bg-bg text-text-muted hover:bg-surface-alt",
              )}
            >
              <span className="text-[11px] font-semibold">Không</span>
              <span className="text-[10px]">Tắt hiệu ứng lặp</span>
            </button>
            {LOOP_OPTIONS.map((option) => {
              const active = loop?.preset === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => applyLoop(option.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex h-14 flex-col items-start justify-center rounded-lg border px-2.5 text-left transition-colors",
                    active
                      ? "border-accent bg-accent-soft text-accent-text"
                      : "border-border bg-bg text-text hover:bg-surface-alt",
                  )}
                >
                  <span className="text-[11px] font-semibold">{option.label}</span>
                  <span className="text-[10px] text-text-muted">{option.hint}</span>
                </button>
              );
            })}
          </div>

          {loop && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[11px] text-text">
                  Thời gian (ms)
                  <input
                    type="number"
                    min={500}
                    max={60_000}
                    step={250}
                    value={loop.duration}
                    onChange={(event) =>
                      updateLoop({ duration: Number(event.target.value) || 3000 })
                    }
                    className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
                <label className="block text-[11px] text-text">
                  Trễ (ms)
                  <input
                    type="number"
                    min={0}
                    max={10_000}
                    step={100}
                    value={loop.delay}
                    onChange={(event) =>
                      updateLoop({ delay: Number(event.target.value) || 0 })
                    }
                    className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
              </div>

              <label className="block text-[11px] text-text">
                Kiểu chuyển động
                <select
                  value={loop.easing}
                  onChange={(event) =>
                    updateLoop({
                      easing: event.target.value as typeof loop.easing,
                    })
                  }
                  className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                >
                  {EASING_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-[11px] text-text">
                Độ mạnh: {(loop.amount ?? 1).toFixed(1)}×
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={loop.amount ?? 1}
                  onChange={(event) =>
                    updateLoop({ amount: Number(event.target.value) })
                  }
                  className="mt-1 w-full accent-accent"
                />
              </label>

              <button
                type="button"
                onClick={() => applyLoop(null)}
                className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-full border border-danger-border text-[11px] font-medium text-danger-fg"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                Xóa hiệu ứng lặp
              </button>
            </div>
          )}

          <div className="rounded-lg border border-border bg-bg p-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-text">Cuộn lệch tốc độ</span>
              <span className="text-[10px] tabular-nums text-text-muted">
                {parallaxFactor > 0 ? "+" : ""}
                {parallaxFactor}
              </span>
            </div>
            <input
              type="range"
              min={-80}
              max={80}
              step={5}
              value={parallaxFactor}
              onChange={(event) => updateParallax(Number(event.target.value))}
              className="mt-2 w-full accent-accent"
            />
            <p className="mt-1 text-[10px] leading-relaxed text-text-muted">
              Dương: trôi chậm hơn khi cuộn xuống; âm: trôi ngược. 0 = tắt.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] leading-relaxed text-text-muted">
            Ra chạy khi element rời khỏi khung nhìn. Bật “Chạy lại mỗi lần cuộn
            tới” ở tab Vào để entrance chạy lại khi quay lại.
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => applyExit(null)}
              aria-pressed={!exit}
              className={cn(
                "flex h-14 flex-col items-start justify-center rounded-lg border px-2.5 text-left transition-colors",
                !exit
                  ? "border-accent bg-accent-soft text-accent-text"
                  : "border-border bg-bg text-text-muted hover:bg-surface-alt",
              )}
            >
              <span className="text-[11px] font-semibold">Không</span>
              <span className="text-[10px]">Tắt hiệu ứng ra</span>
            </button>
            {EXIT_OPTIONS.map((option) => {
              const active = exit?.preset === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => applyExit(option.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex h-14 flex-col items-start justify-center rounded-lg border px-2.5 text-left transition-colors",
                    active
                      ? "border-accent bg-accent-soft text-accent-text"
                      : "border-border bg-bg text-text hover:bg-surface-alt",
                  )}
                >
                  <span className="text-[11px] font-semibold">{option.label}</span>
                  <span className="text-[10px] text-text-muted">{option.hint}</span>
                </button>
              );
            })}
          </div>

          {exit && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[11px] text-text">
                  Thời gian (ms)
                  <input
                    type="number"
                    min={100}
                    max={5000}
                    step={50}
                    value={exit.duration}
                    onChange={(event) =>
                      updateExit({ duration: Number(event.target.value) || 600 })
                    }
                    className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
                <label className="block text-[11px] text-text">
                  Trễ (ms)
                  <input
                    type="number"
                    min={0}
                    max={10000}
                    step={50}
                    value={exit.delay}
                    onChange={(event) =>
                      updateExit({ delay: Number(event.target.value) || 0 })
                    }
                    className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                  />
                </label>
              </div>

              <label className="block text-[11px] text-text">
                Kiểu chuyển động
                <select
                  value={exit.easing}
                  onChange={(event) =>
                    updateExit({
                      easing: event.target.value as typeof exit.easing,
                    })
                  }
                  className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                >
                  {EASING_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              {supportsExitDirection(exit.preset) && (
                <>
                  <div>
                    <p className="text-[11px] text-text">Hướng</p>
                    <div className="mt-1 grid grid-cols-4 gap-1">
                      {DIRECTION_LABELS.map((direction) => {
                        const active = exit.direction === direction.id;
                        return (
                          <button
                            key={direction.id}
                            type="button"
                            onClick={() => updateExit({ direction: direction.id })}
                            aria-pressed={active}
                            className={cn(
                              "h-7 rounded-md border text-[10px] font-medium",
                              active
                                ? "border-accent bg-accent-soft text-accent-text"
                                : "border-border bg-bg text-text-muted hover:bg-surface-alt",
                            )}
                          >
                            {direction.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <label className="block text-[11px] text-text">
                    Khoảng cách (px)
                    <input
                      type="number"
                      min={8}
                      max={300}
                      value={exit.distance ?? DEFAULT_ENTRANCE_DISTANCE}
                      onChange={(event) =>
                        updateExit({
                          distance:
                            Number(event.target.value) || DEFAULT_ENTRANCE_DISTANCE,
                        })
                      }
                      className="mt-1 h-8 w-full rounded-lg border border-border bg-bg px-2 text-xs"
                    />
                  </label>
                </>
              )}

              <button
                type="button"
                onClick={() => applyExit(null)}
                className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-full border border-danger-border text-[11px] font-medium text-danger-fg"
              >
                <Trash2 className="h-3 w-3" aria-hidden="true" />
                Xóa hiệu ứng ra
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
