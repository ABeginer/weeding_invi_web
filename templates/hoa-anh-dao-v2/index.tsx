"use client";

import { ThemedTemplate } from "../themed/ThemedTemplate";
import { THEME_CONFIGS } from "../themed/theme-configs";
import type { WeddingTemplateProps } from "../types";

/**
 * Hoa Anh Đào V2 — template React thuần, không qua canvas Designer.
 * Dùng chung engine ThemedTemplate để giữ nguyên RSVP/gift/album/countdown production.
 */
export default function HoaAnhDaoV2Template(props: WeddingTemplateProps) {
  const base = THEME_CONFIGS["hoa-anh-dao-v2"];
  const selected = props.data.dressCode;
  const dressCode =
    selected && selected.length > 0
      ? selected.slice(0, 3).map((color, index) => ({
          name: ["Đỏ rượu", "Hồng đào", "Hồng phấn"][index] ?? `Màu ${index + 1}`,
          color,
        }))
      : base.dressCode;

  return (
    <ThemedTemplate
      {...props}
      theme={{
        ...base,
        dressCode,
      }}
    />
  );
}
