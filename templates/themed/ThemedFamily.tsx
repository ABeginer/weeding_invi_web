"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { ThemeMotif } from "./ThemeMotif";
import type { ThemeConfig } from "./theme-configs";
import type { WeddingTemplateProps } from "../types";

interface ThemedFamilyProps {
  theme: ThemeConfig;
  couple: WeddingTemplateProps["data"]["couple"];
  photos: WeddingTemplateProps["data"]["photos"];
}

export function ThemedFamily({ theme, couple, photos }: ThemedFamilyProps) {
  return (
    <div
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
      className="mx-auto w-full rounded-2xl border p-5 shadow-lg backdrop-blur-md sm:p-6"
    >
      {/* Header Announcement */}
      <div className="text-center">
        <ThemeMotif
          type={theme.motif}
          color={theme.accentTextColor}
          size={24}
          className="mx-auto mb-2"
        />
        <p
          style={{ color: theme.accentTextColor }}
          className="text-xs font-bold uppercase tracking-widest"
        >
          Trân Trọng Báo Tin
        </p>
        <h3
          style={{
            color: theme.accentTextColor,
            fontFamily: theme.headingFontFamily,
          }}
          className="mt-1 font-serif text-2xl font-bold uppercase tracking-wider sm:text-3xl"
        >
          Lễ Thành Hôn
        </h3>
        <div className="mx-auto my-3 flex items-center justify-center gap-2 opacity-70">
          <div className="h-px w-12 bg-current" />
          <Heart className="h-3 w-3 fill-current" />
          <div className="h-px w-12 bg-current" />
        </div>
      </div>

      {/* Two Families Grid */}
      <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Groom & Nhà Trai */}
        <div
          style={{
            borderColor: theme.borderColor,
            backgroundColor: theme.cardPanelBg || "rgba(255,255,255,0.04)",
          }}
          className="flex flex-col items-center rounded-xl border p-5 text-center shadow-sm"
        >
          {/* Avatar Photo */}
          <div className="relative aspect-square w-24 overflow-hidden rounded-full border-2 border-white/40 shadow-md sm:w-28">
            {photos.groomUrl ? (
              <img
                src={photos.groomUrl}
                alt={couple.groomFullName || couple.groomName}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            ) : (
              <TemplatePhotoPlaceholder
                label="Chú Rể"
                className="aspect-square rounded-full"
              />
            )}
          </div>

          <span
            style={{ color: theme.accentTextColor }}
            className="mt-3 text-[11px] font-bold tracking-widest uppercase"
          >
            Nhà Trai · Trưởng Nam
          </span>

          {/* Groom Name in Calligraphy Font */}
          <h4
            style={{
              fontFamily: theme.coupleFontFamily,
              color: theme.textColor,
            }}
            className="mt-1 text-3xl font-bold tracking-wide sm:text-4xl"
          >
            {couple.groomFullName || couple.groomName}
          </h4>

          {couple.groomParents && (
            <div className="mt-2 border-t pt-2 w-full" style={{ borderColor: theme.borderColor }}>
              <p style={{ color: theme.subtextColor }} className="text-xs leading-relaxed">
                Thân sinh: <span className="font-semibold text-current">{couple.groomParents}</span>
              </p>
            </div>
          )}
        </div>

        {/* Bride & Nhà Gái */}
        <div
          style={{
            borderColor: theme.borderColor,
            backgroundColor: theme.cardPanelBg || "rgba(255,255,255,0.04)",
          }}
          className="flex flex-col items-center rounded-xl border p-5 text-center shadow-sm"
        >
          {/* Avatar Photo */}
          <div className="relative aspect-square w-24 overflow-hidden rounded-full border-2 border-white/40 shadow-md sm:w-28">
            {photos.brideUrl ? (
              <img
                src={photos.brideUrl}
                alt={couple.brideFullName || couple.brideName}
                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            ) : (
              <TemplatePhotoPlaceholder
                label="Cô Dâu"
                className="aspect-square rounded-full"
              />
            )}
          </div>

          <span
            style={{ color: theme.accentTextColor }}
            className="mt-3 text-[11px] font-bold tracking-widest uppercase"
          >
            Nhà Gái · Ái Nữ
          </span>

          {/* Bride Name in Calligraphy Font */}
          <h4
            style={{
              fontFamily: theme.coupleFontFamily,
              color: theme.textColor,
            }}
            className="mt-1 text-3xl font-bold tracking-wide sm:text-4xl"
          >
            {couple.brideFullName || couple.brideName}
          </h4>

          {couple.brideParents && (
            <div className="mt-2 border-t pt-2 w-full" style={{ borderColor: theme.borderColor }}>
              <p style={{ color: theme.subtextColor }} className="text-xs leading-relaxed">
                Thân sinh: <span className="font-semibold text-current">{couple.brideParents}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

