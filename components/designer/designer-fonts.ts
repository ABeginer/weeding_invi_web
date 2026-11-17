import type * as React from "react";
import type {
  DesignerTextEffect,
  DesignerTextElement,
} from "@/components/ops/designer-types";

export interface DesignerFontOption {
  value: string;
  label: string;
}

export const DESIGNER_FONT_GROUPS: {
  label: string;
  fonts: DesignerFontOption[];
}[] = [
  {
    label: "Chữ nhấn",
    fonts: [
      { value: "var(--font-playfair)", label: "Playfair Display" },
      { value: "var(--font-cormorant)", label: "Cormorant Garamond" },
    ],
  },
  {
    label: "Chữ có chân",
    fonts: [
      { value: "var(--font-playfair)", label: "Playfair Display" },
      { value: "var(--font-cormorant)", label: "Cormorant Garamond" },
      { value: "var(--font-lora)", label: "Lora" },
      { value: "var(--font-eb-garamond)", label: "EB Garamond" },
      { value: "var(--font-viaoda)", label: "Viaoda Libre" },
    ],
  },
  {
    label: "Chữ không chân",
    fonts: [{ value: "var(--font-be-vietnam)", label: "Be Vietnam Pro" }],
  },
];

export const DESIGNER_FONT_OPTIONS: DesignerFontOption[] =
  DESIGNER_FONT_GROUPS.flatMap((group) => group.fonts);

export type DesignerTextStyleId =
  | "coupleNames"
  | "heading"
  | "invitation"
  | "weddingDate"
  | "venue"
  | "body";

export interface DesignerTextStyle {
  id: DesignerTextStyleId;
  label: string;
  apply: Partial<
    Pick<
      DesignerTextElement,
      | "fontFamily"
      | "fontSize"
      | "lineHeight"
      | "letterSpacing"
      | "fontWeight"
      | "fontStyle"
      | "textTransform"
      | "align"
    >
  >;
}

/**
 * Chỉ dùng các family đã self-host qua next/font trong app/layout.tsx (đều đã
 * tải subset vietnamese + latin). Không thêm family mới khi chưa xác minh
 * license và subset tiếng Việt.
 */
export const DESIGNER_TEXT_STYLES: DesignerTextStyle[] = [
  {
    id: "coupleNames",
    label: "Tên cô dâu chú rể",
    apply: {
      fontFamily: "var(--font-playfair)",
      fontSize: 52,
      lineHeight: 1.1,
      letterSpacing: 0,
      fontWeight: 400,
      fontStyle: "normal",
      textTransform: "none",
      align: "center",
    },
  },
  {
    id: "heading",
    label: "Tiêu đề",
    apply: {
      fontFamily: "var(--font-playfair)",
      fontSize: 26,
      lineHeight: 1.2,
      letterSpacing: 0.18,
      fontWeight: 700,
      fontStyle: "normal",
      textTransform: "uppercase",
      align: "center",
    },
  },
  {
    id: "invitation",
    label: "Lời mời",
    apply: {
      fontFamily: "var(--font-cormorant)",
      fontSize: 18,
      lineHeight: 1.5,
      letterSpacing: 0,
      fontWeight: 400,
      fontStyle: "italic",
      textTransform: "none",
      align: "center",
    },
  },
  {
    id: "weddingDate",
    label: "Ngày cưới",
    apply: {
      fontFamily: "var(--font-be-vietnam)",
      fontSize: 20,
      lineHeight: 1.3,
      letterSpacing: 0.3,
      fontWeight: 300,
      fontStyle: "normal",
      textTransform: "none",
      align: "center",
    },
  },
  {
    id: "venue",
    label: "Địa điểm",
    apply: {
      fontFamily: "var(--font-be-vietnam)",
      fontSize: 16,
      lineHeight: 1.4,
      letterSpacing: 0.02,
      fontWeight: 500,
      fontStyle: "normal",
      textTransform: "none",
      align: "center",
    },
  },
  {
    id: "body",
    label: "Nội dung",
    apply: {
      fontFamily: "var(--font-be-vietnam)",
      fontSize: 15,
      lineHeight: 1.6,
      letterSpacing: 0,
      fontWeight: 400,
      fontStyle: "normal",
      textTransform: "none",
      align: "left",
    },
  },
];

export interface DesignerTextEffectOption {
  value: DesignerTextEffect;
  label: string;
}

export const DESIGNER_TEXT_EFFECT_OPTIONS: DesignerTextEffectOption[] = [
  { value: "none", label: "Mặc định (Không hiệu ứng)" },
  { value: "shadow", label: "Đổ bóng mềm (Drop Shadow)" },
  { value: "stroke", label: "Viền nét thanh (Outline Stroke)" },
  { value: "glow", label: "Ánh sáng phát quang (Soft Glow)" },
  { value: "goldGradient", label: "Ánh kim vàng (Gold Foil Gradient)" },
];

export function getTextEffectStyles(
  effect?: DesignerTextEffect,
): React.CSSProperties {
  if (!effect || effect === "none") return {};
  switch (effect) {
    case "shadow":
      return {
        textShadow:
          "0 2px 10px rgba(0, 0, 0, 0.5), 0 1px 3px rgba(0, 0, 0, 0.4)",
      };
    case "stroke":
      return {
        WebkitTextStroke: "1px rgba(255, 255, 255, 0.8)",
        textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
      };
    case "glow":
      return {
        textShadow:
          "0 0 10px rgba(212, 175, 55, 0.8), 0 0 20px rgba(212, 175, 55, 0.5)",
      };
    case "goldGradient":
      return {
        backgroundImage:
          "linear-gradient(135deg, #FFF0B3 0%, #D4AF37 40%, #AA771C 80%, #683E08 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
      };
    default:
      return {};
  }
}
