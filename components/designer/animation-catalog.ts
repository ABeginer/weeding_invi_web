import type {
  DesignerAnimDirection,
  DesignerAnimSlot,
  DesignerEasing,
  DesignerEntranceAnimation,
  DesignerEntrancePreset,
  DesignerExitAnimation,
  DesignerExitPreset,
  DesignerLoopAnimation,
  DesignerLoopPreset,
} from "@/components/ops/designer-types";

export interface EntranceOption {
  id: DesignerEntrancePreset;
  label: string;
  hint: string;
  category?: "image";
  textOnly?: boolean;
}

/** Preset "Vào" của Phase 1 + 3. */
export const ENTRANCE_OPTIONS: EntranceOption[] = [
  { id: "fadeIn", label: "Hiện dần", hint: "Mờ → rõ", category: "image" },
  {
    id: "slideIn",
    label: "Trượt vào",
    hint: "Từ một phía, kèm mờ dần",
    category: "image",
  },
  { id: "rise", label: "Nổi lên", hint: "Nhích lên 24px" },
  { id: "zoomIn", label: "Phóng to", hint: "0,8 → 1", category: "image" },
  { id: "zoomOut", label: "Thu nhỏ vào", hint: "1,2 → 1" },
  { id: "pop", label: "Bật lên", hint: "0,6 → 1,08 → 1" },
  { id: "bounceIn", label: "Nảy vào", hint: "Rơi nhẹ từ trên" },
  { id: "blurIn", label: "Rõ dần", hint: "Mờ 12px → nét", category: "image" },
  { id: "rotateIn", label: "Xoay vào", hint: "-12° → 0°" },
  {
    id: "wipe",
    label: "Mở dần",
    hint: "Lộ dần theo hướng",
    category: "image",
  },
  { id: "flipIn", label: "Lật vào", hint: "Lật 3D 90° → 0°" },
  {
    id: "typewriter",
    label: "Gõ chữ",
    hint: "Từng ký tự, chỉ chữ",
    textOnly: true,
  },
  {
    id: "wordsIn",
    label: "Hiện từng từ",
    hint: "Từng từ nổi lên, chỉ chữ",
    textOnly: true,
  },
];

export interface LoopOption {
  id: DesignerLoopPreset;
  label: string;
  hint: string;
}

export const LOOP_OPTIONS: LoopOption[] = [
  { id: "float", label: "Bay lơ lửng", hint: "Lên xuống nhẹ" },
  { id: "pulse", label: "Nhịp đập", hint: "Phóng nhẹ theo nhịp" },
  { id: "heartbeat", label: "Tim đập", hint: "Hai nhịp dồn dập" },
  { id: "breathe", label: "Hít thở", hint: "Phóng + mờ rất nhẹ" },
  { id: "sway", label: "Đung đưa", hint: "Nghiêng qua lại" },
  { id: "spin", label: "Xoay chậm", hint: "Xoay 360°" },
  { id: "twinkle", label: "Lấp lánh", hint: "Nhấp nháy ngẫu nhiên" },
  { id: "shimmer", label: "Ánh kim", hint: "Vệt sáng chạy qua" },
  { id: "kenBurns", label: "Zoom chậm", hint: "Ảnh phóng + pan nhẹ" },
];

export const EXIT_OPTIONS: { id: DesignerExitPreset; label: string; hint: string }[] = [
  { id: "fadeOut", label: "Mờ dần", hint: "Mờ khi rời màn hình" },
  { id: "slideOut", label: "Trượt ra", hint: "Trượt + mờ theo hướng" },
  { id: "zoomOutExit", label: "Thu nhỏ ra", hint: "Nhỏ + mờ dần" },
];

export const EASING_OPTIONS: { id: DesignerEasing; label: string; css: string }[] = [
  { id: "linear", label: "Đều", css: "linear" },
  { id: "easeIn", label: "Chậm lúc đầu", css: "cubic-bezier(0.42, 0, 1, 1)" },
  {
    id: "easeOut",
    label: "Chậm dần lúc cuối",
    css: "cubic-bezier(0.22, 1, 0.36, 1)",
  },
  {
    id: "easeInOut",
    label: "Chậm hai đầu",
    css: "cubic-bezier(0.65, 0, 0.35, 1)",
  },
  { id: "back", label: "Nảy nhẹ", css: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
];

export const DEFAULT_ENTRANCE_DURATION = 800;
export const DEFAULT_ENTRANCE_DELAY = 0;
export const DEFAULT_ENTRANCE_DISTANCE = 40;
export const DEFAULT_ENTRANCE_THRESHOLD = 0.25;

/** Chuẩn hoá loop: duration dài hơn entrance (spin 20s, kenBurns 14s). */
export function normalizeLoopSlot(
  slot: DesignerLoopAnimation,
): DesignerLoopAnimation {
  return {
    ...slot,
    preset: slot.preset,
    duration: clamp(Math.round(slot.duration || 3000), 500, 60_000),
    delay: clamp(Math.round(slot.delay || 0), 0, 10_000),
    amount:
      typeof slot.amount === "number" ? clamp(slot.amount, 0.5, 2) : undefined,
  };
}

export function getEasingCss(easing: DesignerEasing): string {
  return EASING_OPTIONS.find((option) => option.id === easing)?.css ?? "linear";
}

export function isEntrancePreset(value: string): value is DesignerEntrancePreset {
  return ENTRANCE_OPTIONS.some((option) => option.id === value);
}

export function supportsDirection(preset: string): boolean {
  return preset === "slideIn" || preset === "wipe";
}

export function supportsDistance(preset: string): boolean {
  return preset === "slideIn";
}

export function supportsSpeed(preset: string): boolean {
  return preset === "typewriter";
}

export function supportsStagger(preset: string): boolean {
  return preset === "wordsIn";
}

export function isLoopPreset(value: string): value is DesignerLoopPreset {
  return LOOP_OPTIONS.some((option) => option.id === value);
}

export function isExitPreset(value: string): value is DesignerExitPreset {
  return EXIT_OPTIONS.some((option) => option.id === value);
}

export function supportsExitDirection(preset: string): boolean {
  return preset === "slideOut";
}

export function isTextPreset(preset: string): boolean {
  return preset === "typewriter" || preset === "wordsIn";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Chuẩn hoá slot trước khi lưu/đọc từ JSON cũ. */
export function normalizeAnimSlot(slot: DesignerAnimSlot): DesignerAnimSlot {
  return {
    ...slot,
    preset: slot.preset,
    duration: clamp(Math.round(slot.duration || DEFAULT_ENTRANCE_DURATION), 100, 5000),
    delay: clamp(Math.round(slot.delay || 0), 0, 10_000),
    distance:
      typeof slot.distance === "number"
        ? clamp(Math.round(slot.distance), 8, 300)
        : undefined,
    amount:
      typeof slot.amount === "number" ? clamp(slot.amount, 0.5, 2) : undefined,
    speed:
      typeof slot.speed === "number"
        ? clamp(Math.round(slot.speed), 5, 100)
        : undefined,
  };
}

export function createDefaultEntrance(
  preset: DesignerEntrancePreset = "fadeIn",
): DesignerEntranceAnimation {
  return {
    preset,
    duration: DEFAULT_ENTRANCE_DURATION,
    delay: DEFAULT_ENTRANCE_DELAY,
    easing: "easeOut",
    ...(supportsDirection(preset) ? { direction: "left" as const } : {}),
    ...(supportsDistance(preset)
      ? { distance: DEFAULT_ENTRANCE_DISTANCE }
      : {}),
    ...(supportsSpeed(preset) ? { speed: 30 } : {}),
    once: true,
    threshold: DEFAULT_ENTRANCE_THRESHOLD,
  };
}

export function createDefaultLoop(
  preset: DesignerLoopPreset = "float",
): DesignerLoopAnimation {  const durations: Record<DesignerLoopPreset, number> = {
    float: 3000,
    pulse: 1600,
    heartbeat: 1400,
    breathe: 4000,
    sway: 3500,
    spin: 20_000,
    twinkle: 2000,
    shimmer: 3000,
    kenBurns: 14_000,
  };
  return {
    preset,
    duration: durations[preset],
    delay: 0,
    easing: preset === "spin" ? "linear" : "easeInOut",
    amount: 1,
  };
}

/** CSS custom properties cho wrapper "Lặp". */
export function getLoopCssVars(
  loop: DesignerLoopAnimation,
): Record<string, string> {
  const normalized = normalizeLoopSlot(loop);
  return {
    "--loop-name": `loop-${loop.preset}`,
    "--loop-duration": `${normalized.duration}ms`,
    "--loop-delay": `${normalized.delay}ms`,
    "--loop-ease": getEasingCss(normalized.easing),
    "--loop-amount": `${normalized.amount ?? 1}`,
  };
}

export function createDefaultExit(
  preset: DesignerExitPreset = "fadeOut",
): DesignerExitAnimation {
  return {
    preset,
    duration: 600,
    delay: 0,
    easing: "easeIn",
    ...(supportsExitDirection(preset)
      ? { direction: "left" as const, distance: DEFAULT_ENTRANCE_DISTANCE }
      : {}),
  };
}

export function getExitCssVars(
  animation: DesignerExitAnimation,
): Record<string, string> {
  const slot = normalizeAnimSlot(animation);
  const distance =
    typeof slot.distance === "number" ? slot.distance : DEFAULT_ENTRANCE_DISTANCE;
  const offset = getDirectionOffset(slot.direction, distance);
  return {
    "--out-name": `anim-${slot.preset}`,
    "--out-duration": `${slot.duration}ms`,
    "--out-delay": `${slot.delay}ms`,
    "--out-ease": getEasingCss(slot.easing),
    "--out-x": `${offset.x}px`,
    "--out-y": `${offset.y}px`,
  };
}

export function getDirectionOffset(
  direction: DesignerAnimDirection | undefined,
  distance: number,
): { x: number; y: number } {
  switch (direction) {
    case "right":
      return { x: distance, y: 0 };
    case "up":
      return { x: 0, y: -distance };
    case "down":
      return { x: 0, y: distance };
    case "left":
    default:
      return { x: -distance, y: 0 };
  }
}

/** CSS custom properties dùng chung cho editor preview và trang thiệp thật. */
export function getEntranceCssVars(
  animation: DesignerEntranceAnimation,
): Record<string, string> {
  const slot = normalizeAnimSlot(animation);
  const distance =
    typeof slot.distance === "number" ? slot.distance : DEFAULT_ENTRANCE_DISTANCE;
  const offset = getDirectionOffset(slot.direction, distance);

  return {
    "--anim-name": `anim-${slot.preset}`,
    "--anim-duration": `${slot.duration}ms`,
    "--anim-delay": `${slot.delay}ms`,
    "--anim-ease": getEasingCss(slot.easing),
    "--anim-from-x": `${offset.x}px`,
    "--anim-from-y": `${offset.y}px`,
    "--anim-from-clip": getWipeFromClip(slot.direction),
  };
}

function getWipeFromClip(direction: DesignerAnimDirection | undefined): string {
  switch (direction) {
    case "right":
      return "inset(0 0 0 100%)";
    case "up":
      return "inset(0 0 100% 0)";
    case "down":
      return "inset(100% 0 0 0)";
    case "left":
    default:
      return "inset(0 100% 0 0)";
  }
}
