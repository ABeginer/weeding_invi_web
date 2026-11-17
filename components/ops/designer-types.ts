export const DESIGNER_TEXT_ALIGNS = ["left", "center", "right"] as const;
export type DesignerTextAlign = (typeof DESIGNER_TEXT_ALIGNS)[number];

export const DESIGNER_TEXT_EFFECTS = [
  "none",
  "shadow",
  "stroke",
  "glow",
  "goldGradient",
] as const;

export type DesignerTextEffect = (typeof DESIGNER_TEXT_EFFECTS)[number];

export const DESIGNER_EASINGS = [
  "linear",
  "easeIn",
  "easeOut",
  "easeInOut",
  "back",
] as const;

export type DesignerEasing = (typeof DESIGNER_EASINGS)[number];

export const DESIGNER_ANIM_DIRECTIONS = ["left", "right", "up", "down"] as const;

export type DesignerAnimDirection = (typeof DESIGNER_ANIM_DIRECTIONS)[number];

/** Phase 1 + 3: entrance presets (typewriter/wordsIn/flipIn ở Phase 3). */
export const DESIGNER_ENTRANCE_PRESETS = [
  "fadeIn",
  "slideIn",
  "rise",
  "zoomIn",
  "zoomOut",
  "pop",
  "bounceIn",
  "blurIn",
  "rotateIn",
  "wipe",
  "flipIn",
  "typewriter",
  "wordsIn",
] as const;

export type DesignerEntrancePreset = (typeof DESIGNER_ENTRANCE_PRESETS)[number];

export const DESIGNER_LOOP_PRESETS = [
  "float",
  "pulse",
  "heartbeat",
  "breathe",
  "sway",
  "spin",
  "twinkle",
  "shimmer",
  "kenBurns",
] as const;

export type DesignerLoopPreset = (typeof DESIGNER_LOOP_PRESETS)[number];

export const DESIGNER_EXIT_PRESETS = [
  "fadeOut",
  "slideOut",
  "zoomOutExit",
] as const;

export type DesignerExitPreset = (typeof DESIGNER_EXIT_PRESETS)[number];

export interface DesignerAnimSlot {
  /** Preset id; Phase 1 dùng DesignerEntrancePreset cho `in`. */
  preset: string;
  /** ms, 100..5000 */
  duration: number;
  /** ms, 0..10000 */
  delay: number;
  easing: DesignerEasing;
  direction?: DesignerAnimDirection;
  /** px, 8..300 */
  distance?: number;
  /** 0.5..2 */
  amount?: number;
  /** typewriter: ký tự/giây, 5..100 */
  speed?: number;
}

export interface DesignerEntranceAnimation extends DesignerAnimSlot {
  preset: DesignerEntrancePreset;
  once: boolean;
  /** 0.05..0.9 */
  threshold: number;
}

export interface DesignerLoopAnimation extends DesignerAnimSlot {
  preset: DesignerLoopPreset;
}

export interface DesignerExitAnimation extends DesignerAnimSlot {
  preset: DesignerExitPreset;
}

/**
 * Animation của element. `in`/`loop` được engine đọc; `out`/parallax/stagger
 * đang giữ chỗ hoặc dùng ở phase sau.
 */
export interface DesignerElementAnimation {
  in?: DesignerEntranceAnimation;
  loop?: DesignerLoopAnimation;
  out?: DesignerExitAnimation;
  parallax?: { factor: number };
  stagger?: number;
}

export type DesignerGuestFieldKind = "image" | "text" | "textarea";

export interface DesignerGuestField {
  label: string;
  kind?: DesignerGuestFieldKind;
  maxLength?: number;
}

export interface DesignerElementBase {
  id: string;
  rotation?: number;
  animation?: DesignerElementAnimation;
  /** Layer 1 = dưới cùng; layer lớn hơn nằm trên. Mặc định 1. */
  layer?: number;
  /** Trường do khách (cô dâu/chú rể) điền hoặc thay; key lưu trong content.designerFields. */
  guestField?: DesignerGuestField;
}

export type DesignerTextElement = DesignerElementBase & {
  type: "text";
  xPct: number;
  yPct: number;
  wPct: number;
  hPct?: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  placeholder: string | null;
  /** Căn chữ trong khung; mặc định "left" cho dữ liệu cũ. */
  align?: DesignerTextAlign;
  /** Hệ số line-height; mặc định 1.25. */
  lineHeight?: number;
  /** Khoảng cách chữ theo em; mặc định 0. */
  letterSpacing?: number;
  fontWeight?: 300 | 400 | 500 | 600 | 700;
  fontStyle?: "normal" | "italic";
  textTransform?: "none" | "uppercase";
  /** Hiệu ứng hiển thị chữ: đổ bóng, viền nét, phát sáng hoặc gradient ánh kim vàng. */
  textEffect?: DesignerTextEffect;
};

export type DesignerImageElement = DesignerElementBase & {
  type: "image";
  xPct: number;
  yPct: number;
  wPct: number;
  url: string;
  heightPct?: number;
};

export type DesignerBoxElement = DesignerElementBase & {
  type: "box";
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  fill: string;
  border: string;
  radius: number;
};

export const DESIGNER_ICONS = [
  "Heart",
  "Star",
  "MapPin",
  "CalendarDays",
  "Music",
  "QrCode",
  "Camera",
  "Flower2",
  "Sparkles",
  "Mail",
] as const;

export type DesignerIconName = (typeof DESIGNER_ICONS)[number];

export type DesignerIconElement = DesignerElementBase & {
  type: "icon";
  xPct: number;
  yPct: number;
  wPct: number;
  hPct?: number;
  icon: DesignerIconName;
  color: string;
};

export const DESIGNER_ACTIONS = ["rsvp", "map", "gift", "album", "music"] as const;
export type DesignerAction = (typeof DESIGNER_ACTIONS)[number];

export type DesignerButtonElement = DesignerElementBase & {
  type: "button";
  xPct: number;
  yPct: number;
  wPct: number;
  hPct?: number;
  label: string;
  action: DesignerAction;
  fill: string;
  textColor: string;
  radius: number;
};

export const DESIGNER_BLOCKS = [
  "countdown",
  "calendar",
  "map",
  "rsvp",
  "gift",
  "gallery",
  "music",
] as const;
export type DesignerBlockKind = (typeof DESIGNER_BLOCKS)[number];

export type DesignerBlockElement = DesignerElementBase & {
  type: "block";
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  block: DesignerBlockKind;
  color: string;
  /** Màu nền khối (lịch/map/RSVP); mặc định trong suốt. */
  fill?: string;
  /** Màu nút/khoảng nhấn riêng của block (map/RSVP). */
  buttonColor?: string;
};

export const PHOTO_SLOTS = ["hero", "groom", "bride", "gallery", "custom"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];

export type DesignerPhotoElement = DesignerElementBase & {
  type: "photo";
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  slot: PhotoSlot;
  url?: string;
  radius: number;
  fit: "cover" | "contain";
};

export const FALLING_EFFECT_PRESETS = [
  "snow",
  "sakura",
  "rose",
  "leaf",
  "heart",
  "star",
  "glitter",
  "bubble",
  "firefly",
] as const;

export type FallingEffectPreset = (typeof FALLING_EFFECT_PRESETS)[number];

export type FallingEffectSource =
  | { type: "preset"; preset: FallingEffectPreset }
  | { type: "icon"; icon: string; color?: string }
  | { type: "image"; url: string };

export type DesignerFallingEffectElement = DesignerElementBase & {
  type: "fallingEffect";
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  preset: FallingEffectPreset;
  scope: "box" | "page";
  count: number;
  sizeMin: number;
  sizeMax: number;
  speedMin: number;
  speedMax: number;
  direction: "down" | "up" | "diagonalLeft" | "diagonalRight";
  wind: number;
  swayAmplitude: number;
  swayFrequency: number;
  spin: boolean;
  spinSpeed: number;
  opacityMin: number;
  opacityMax: number;
  depth: boolean;
  sources?: FallingEffectSource[];
};

export type DesignerElement =
  | DesignerTextElement
  | DesignerImageElement
  | DesignerBoxElement
  | DesignerIconElement
  | DesignerButtonElement
  | DesignerBlockElement
  | DesignerPhotoElement
  | DesignerFallingEffectElement;

export interface DesignerPage {
  id: string;
  name: string;
  background: string;
  backgroundUrl?: string;
  elements: DesignerElement[];
  /** Trang đặc biệt: form xác nhận hoặc hộp quà thật, không render element tĩnh. */
  kind?: "content" | "rsvp" | "gift";
}

export const DESIGNER_COVER_TEMPLATES = ["split", "card", "fade"] as const;
export type DesignerCoverTemplate = (typeof DESIGNER_COVER_TEMPLATES)[number];

export interface DesignerCover {
  template: DesignerCoverTemplate;
  imageUrl?: string;
  icon?: DesignerIconName;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
}

export interface DesignerCanvasContent {
  width: number;
  height: number;
  background: string;
  /** Ảnh nền có sẵn (cover template) — designer vẽ đè lên khi tạo mẫu mới. */
  backgroundUrl?: string;
  elements: DesignerElement[];
  /** Multi-page: mỗi trang có nền + element riêng. */
  pages?: DesignerPage[];
  /** Chèn album sau trang này (0-based); mặc định cuối thiệp. */
  albumAfterPage?: number;
  /** Bìa thiệp (cover) dùng animation riêng, không trộn với element animation. */
  cover?: DesignerCover;
  /** Màu nhấn cho nút/RSVP của cả thiệp Designer. */
  accentColor?: string;
}

export const PLACEHOLDER_OPTIONS = [
  { id: "guestName", label: "Tên khách", sample: "Bạn Thanh Mai" },
  { id: "groom", label: "Tên chú r�f", sample: "Minh Khôi" },
  { id: "bride", label: "Tên cô dâu", sample: "Thảo Nguyên" },
  { id: "date", label: "Ngày cư�>i", sample: "20.03.2027" },
  { id: "venue", label: "Đ�<a �'i�fm", sample: "White Palace" },
  { id: "salutation", label: "Xưng hô", sample: "Trân trọng kính mời" },
] as const;
