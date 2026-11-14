export const DESIGNER_TEXT_ALIGNS = ["left", "center", "right"] as const;
export type DesignerTextAlign = (typeof DESIGNER_TEXT_ALIGNS)[number];

export type DesignerTextElement = {
  id: string;
  rotation?: number;
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
};

export type DesignerImageElement = {
  id: string;
  rotation?: number;
  type: "image";
  xPct: number;
  yPct: number;
  wPct: number;
  url: string;
  heightPct?: number;
};

export interface DesignerBoxElement {
  id: string;
  rotation?: number;
  type: "box";
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  fill: string;
  border: string;
  radius: number;
}

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

export interface DesignerIconElement {
  id: string;
  rotation?: number;
  type: "icon";
  xPct: number;
  yPct: number;
  wPct: number;
  hPct?: number;
  icon: DesignerIconName;
  color: string;
}

export const DESIGNER_ACTIONS = ["rsvp", "map", "gift", "album", "music"] as const;
export type DesignerAction = (typeof DESIGNER_ACTIONS)[number];

export interface DesignerButtonElement {
  id: string;
  rotation?: number;
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
}

export const DESIGNER_BLOCKS = [
  "calendar",
  "map",
  "rsvp",
  "gift",
  "gallery",
  "music",
] as const;
export type DesignerBlockKind = (typeof DESIGNER_BLOCKS)[number];

export interface DesignerBlockElement {
  id: string;
  rotation?: number;
  type: "block";
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  block: DesignerBlockKind;
  color: string;
}

export const PHOTO_SLOTS = ["hero", "groom", "bride", "gallery"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];

export interface DesignerPhotoElement {
  id: string;
  rotation?: number;
  type: "photo";
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  slot: PhotoSlot;
  url?: string;
  radius: number;
  fit: "cover" | "contain";
}

export type DesignerElement =
  | DesignerTextElement
  | DesignerImageElement
  | DesignerBoxElement
  | DesignerIconElement
  | DesignerButtonElement
  | DesignerBlockElement
  | DesignerPhotoElement;

export interface DesignerPage {
  id: string;
  name: string;
  background: string;
  backgroundUrl?: string;
  elements: DesignerElement[];
}

export interface DesignerCanvasContent {
  width: number;
  height: number;
  background: string;
  /** Ảnh nền có sẵn (cover template) �?" designer vẽ �'è lên khi tạo mẫu m�>i. */
  backgroundUrl?: string;
  elements: DesignerElement[];
  /** Multi-page: m�-i trang có nền + element riêng. */
  pages?: DesignerPage[];
}

export const PLACEHOLDER_OPTIONS = [
  { id: "guestName", label: "Tên khách", sample: "Bạn Thanh Mai" },
  { id: "groom", label: "Tên chú r�f", sample: "Minh Khôi" },
  { id: "bride", label: "Tên cô dâu", sample: "Thảo Nguyên" },
  { id: "date", label: "Ngày cư�>i", sample: "20.03.2027" },
  { id: "venue", label: "Đ�<a �'i�fm", sample: "White Palace" },
  { id: "salutation", label: "Xưng hô", sample: "Trân trọng kính mời" },
] as const;
