"use client";

import * as React from "react";
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
      <h3
        style={{
          color: theme.accentTextColor,
          fontFamily: theme.headingFontFamily,
        }}
        className="mt-1 font-serif text-lg font-bold uppercase tracking-wider sm:text-xl"
      >
        Trang Phục Gợi Ý
      </h3>

      {/* Swatches Row */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {dressCode.map((swatch, idx) => (
          <div key={idx} className="flex flex-col items-center gap-1.5">
            <div
              className="h-10 w-10 rounded-full border-2 border-white/60 shadow-md ring-2 ring-black/10 transition-transform duration-200 hover:scale-110 sm:h-12 sm:w-12"
              style={{ backgroundColor: swatch.color }}
              title={swatch.name}
              aria-label={swatch.name || `Màu trang phục ${idx + 1}`}
            />
            {swatch.name && !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(swatch.name) && (
              <span
                style={{ color: theme.textColor }}
                className="text-[11px] font-medium tracking-tight sm:text-xs"
              >
                {swatch.name}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

