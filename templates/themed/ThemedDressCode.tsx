"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import type { ThemeConfig } from "./theme-configs";

interface ThemedDressCodeProps {
  theme: ThemeConfig;
}

export function ThemedDressCode({ theme }: ThemedDressCodeProps) {
  const dressCode = theme.dressCode;
  if (!dressCode || dressCode.length === 0) return null;

  return (
    <div
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
      className="mx-auto w-full rounded-2xl border p-5 text-center shadow-lg backdrop-blur-md sm:p-6"
    >
      <div
        className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
        style={{
          backgroundColor: theme.badgeBg,
          color: theme.badgeTextColor,
        }}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>Dress Code Gợi Ý</span>
      </div>

      <h3
        style={{
          color: theme.accentTextColor,
          fontFamily: theme.headingFontFamily,
        }}
        className="mt-3 font-serif text-lg font-bold uppercase tracking-wider sm:text-xl"
      >
        Trang Phục Tham Dự
      </h3>

      <p style={{ color: theme.subtextColor }} className="mx-auto mt-1.5 max-w-sm text-xs leading-relaxed">
        Để những bức ảnh lưu niệm thêm phần hài hòa và đồng điệu, kính mong quý khách ưu tiên trang phục theo các gam màu:
      </p>

      {/* Swatches Row */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {dressCode.map((swatch, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5">
            <div
              className="h-10 w-10 rounded-full border-2 border-white/60 shadow-md ring-2 ring-black/10 transition-transform duration-200 hover:scale-110 sm:h-12 sm:w-12"
              style={{ backgroundColor: swatch.color }}
              title={swatch.name}
            />
            <span
              style={{ color: theme.textColor }}
              className="text-[11px] font-medium tracking-tight sm:text-xs"
            >
              {swatch.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

