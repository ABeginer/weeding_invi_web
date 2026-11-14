export type DesignerTextElement = {
  id: string;
  type: "text";
  xPct: number;
  yPct: number;
  wPct: number;
  text: string;
  fontSize: number;
  color: string;
  fontFamily: string;
  placeholder: string | null;
};

export type DesignerImageElement = {
  id: string;
  type: "image";
  xPct: number;
  yPct: number;
  wPct: number;
  url: string;
  heightPct?: number;
};

export interface DesignerBoxElement {
  id: string;
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
  type: "icon";
  xPct: number;
  yPct: number;
  wPct: number;
  icon: DesignerIconName;
  color: string;
}

export const DESIGNER_ACTIONS = ["rsvp", "map", "gift", "album", "music"] as const;
export type DesignerAction = (typeof DESIGNER_ACTIONS)[number];

export interface DesignerButtonElement {
  id: string;
  type: "button";
  xPct: number;
  yPct: number;
  wPct: number;
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
  type: "block";
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  block: DesignerBlockKind;
  color: string;
}

export type DesignerElement =
  | DesignerTextElement
  | DesignerImageElement
  | DesignerBoxElement
  | DesignerIconElement
  | DesignerButtonElement
  | DesignerBlockElement;

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
  /** Ảnh nền có sẵn (cover template) — designer vẽ đè lên khi tạo mẫu mới. */
  backgroundUrl?: string;
  elements: DesignerElement[];
  /** Multi-page: mỗi trang có nền + element riêng. */
  pages?: DesignerPage[];
}

export const PLACEHOLDER_OPTIONS = [
  { id: "guestName", label: "Tên khách", sample: "Bạn Thanh Mai" },
  { id: "groom", label: "Tên chú rể", sample: "Minh Khôi" },
  { id: "bride", label: "Tên cô dâu", sample: "Thảo Nguyên" },
  { id: "date", label: "Ngày cưới", sample: "20.03.2027" },
  { id: "venue", label: "Địa điểm", sample: "White Palace" },
  { id: "salutation", label: "Xưng hô", sample: "Trân trọng kính mời" },
] as const;
