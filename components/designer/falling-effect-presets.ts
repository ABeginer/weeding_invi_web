import type {
  DesignerFallingEffectElement,
  FallingEffectPreset,
} from "@/components/ops/designer-types";

export interface FallingPresetMeta {
  id: FallingEffectPreset;
  label: string;
  hint: string;
  size: [number, number];
  speed: [number, number];
  colors: string[];
  direction: DesignerFallingEffectElement["direction"];
  sway: [number, number];
  spin: boolean;
}

export const FALLING_PRESET_META: FallingPresetMeta[] = [
  {
    id: "snow",
    label: "Tuyết",
    hint: "Bông tròn trắng, rơi nhẹ",
    size: [4, 10],
    speed: [40, 110],
    colors: ["#FFFFFF", "#F3F7FF", "#E8F0FA"],
    direction: "down",
    sway: [12, 0.6],
    spin: false,
  },
  {
    id: "sakura",
    label: "Cánh hoa anh đào",
    hint: "Hồng phấn, lắc mạnh",
    size: [12, 24],
    speed: [30, 70],
    colors: ["#F7C6D2", "#F3AFC0", "#FADDE4", "#EBA0B5"],
    direction: "down",
    sway: [26, 0.5],
    spin: true,
  },
  {
    id: "rose",
    label: "Cánh hoa hồng",
    hint: "Đỏ đô, xoay chậm",
    size: [12, 26],
    speed: [30, 70],
    colors: ["#B8454E", "#D46A70", "#8E2F39", "#E39A9C"],
    direction: "down",
    sway: [16, 0.45],
    spin: true,
  },
  {
    id: "leaf",
    label: "Lá",
    hint: "Vàng úa, xoay nhẹ",
    size: [14, 28],
    speed: [30, 80],
    colors: ["#C9A24D", "#B98A3D", "#D9BB74", "#9B7430"],
    direction: "down",
    sway: [20, 0.5],
    spin: true,
  },
  {
    id: "heart",
    label: "Trái tim",
    hint: "Tim nhỏ rơi đều",
    size: [10, 24],
    speed: [40, 100],
    colors: ["#D95468", "#E88A99", "#B83B50", "#F2B3BE"],
    direction: "down",
    sway: [10, 0.7],
    spin: false,
  },
  {
    id: "star",
    label: "Ngôi sao",
    hint: "Sao bốn cánh lấp lánh",
    size: [6, 16],
    speed: [50, 120],
    colors: ["#E8C66A", "#F5E3A5", "#D4AE4C", "#FFF3C4"],
    direction: "down",
    sway: [8, 0.8],
    spin: true,
  },
  {
    id: "glitter",
    label: "Kim tuyến",
    hint: "Hạt vàng nhanh, nhấp nháy",
    size: [3, 8],
    speed: [80, 180],
    colors: ["#E8C66A", "#FFF1B8", "#C9A24D", "#FFFFFF"],
    direction: "down",
    sway: [6, 1.2],
    spin: false,
  },
  {
    id: "bubble",
    label: "Bong bóng",
    hint: "Bong bóng trong, bay lên",
    size: [8, 30],
    speed: [30, 70],
    colors: ["#DCEFF7", "#C8E6F2", "#F1FAFD", "#B9DDEB"],
    direction: "up",
    sway: [18, 0.4],
    spin: false,
  },
  {
    id: "firefly",
    label: "Đom đóm",
    hint: "Chấm sáng vàng, trôi chậm",
    size: [4, 10],
    speed: [20, 50],
    colors: ["#F5E39A", "#FFF4C2", "#E8C66A", "#FFFFFF"],
    direction: "diagonalRight",
    sway: [24, 0.35],
    spin: false,
  },
];

export function getFallingPresetMeta(
  preset: FallingEffectPreset,
): FallingPresetMeta {
  return (
    FALLING_PRESET_META.find((item) => item.id === preset) ??
    FALLING_PRESET_META[0]
  );
}

export function createDefaultFallingEffect(
  preset: FallingEffectPreset = "sakura",
): Omit<DesignerFallingEffectElement, "id" | "type"> {
  const meta = getFallingPresetMeta(preset);
  return {
    xPct: 0,
    yPct: 0,
    wPct: 100,
    hPct: 100,
    preset,
    scope: "box",
    count: 40,
    sizeMin: meta.size[0],
    sizeMax: meta.size[1],
    speedMin: meta.speed[0],
    speedMax: meta.speed[1],
    direction: meta.direction,
    wind: 0,
    swayAmplitude: meta.sway[0],
    swayFrequency: meta.sway[1],
    spin: meta.spin,
    spinSpeed: 45,
    opacityMin: 0.35,
    opacityMax: 0.95,
    depth: true,
    sources: [{ type: "preset", preset }],
  };
}
