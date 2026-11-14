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

export type DesignerElement = DesignerTextElement | DesignerImageElement;

export interface DesignerCanvasContent {
  width: number;
  height: number;
  background: string;
  /** Ảnh nền có sẵn (cover template) — designer vẽ đè lên khi tạo mẫu mới. */
  backgroundUrl?: string;
  elements: DesignerElement[];
}

export const PLACEHOLDER_OPTIONS = [
  { id: "guestName", label: "Tên khách", sample: "Bạn Thanh Mai" },
  { id: "groom", label: "Tên chú rể", sample: "Minh Khôi" },
  { id: "bride", label: "Tên cô dâu", sample: "Thảo Nguyên" },
  { id: "date", label: "Ngày cưới", sample: "20.03.2027" },
  { id: "venue", label: "Địa điểm", sample: "White Palace" },
  { id: "salutation", label: "Xưng hô", sample: "Trân trọng kính mời" },
] as const;
