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
  hidePhotos?: boolean;
  hostFirst?: "groom" | "bride";
}

function nameFontSize(name: string, stacked: boolean): string {
  const safeLength = Math.max(0, name.trim().length - 12);
  const min = stacked ? 22 : 18;
  const max = stacked ? 38 : 30;
  return `${Math.max(min, max - safeLength * 1.3)}px`;
}

export function ThemedFamily({
  theme,
  couple,
  photos,
  hidePhotos = false,
  hostFirst = "groom",
}: ThemedFamilyProps) {
  const people = [
    {
      id: "groom" as const,
      label: "Nhà Trai",
      title: couple.groomTitle || "Trưởng nam",
      name: couple.groomFullName || couple.groomName,
      parents: couple.groomParents,
      photo: photos.groomUrl,
      placeholder: "Chú Rể",
    },
    {
      id: "bride" as const,
      label: "Nhà Gái",
      title: couple.brideTitle || "Ái nữ",
      name: couple.brideFullName || couple.brideName,
      parents: couple.brideParents,
      photo: photos.brideUrl,
      placeholder: "Cô Dâu",
    },
  ];
  const ordered = hostFirst === "bride" ? [people[1], people[0]] : people;

  return (
    <div
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
      className="mx-auto w-full rounded-2xl border p-5 shadow-lg backdrop-blur-md sm:p-6"
    >
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

      {hidePhotos ? (
        <div className="mx-auto mt-6 flex max-w-[520px] flex-col gap-8">
          {ordered.map((person) => (
            <div key={person.id} className="min-w-0 text-center">
              <span
                style={{ color: theme.accentTextColor }}
                className="text-[11px] font-bold uppercase tracking-widest"
              >
                {person.label} · {person.title}
              </span>
              <h4
                style={{
                  fontFamily: theme.coupleFontFamily,
                  color: theme.textColor,
                  fontSize: nameFontSize(person.name, true),
                }}
                className="mt-2 whitespace-nowrap font-bold leading-tight tracking-wide"
              >
                {person.name}
              </h4>
              {person.parents && (
                <p style={{ color: theme.subtextColor }} className="mt-2 text-xs leading-relaxed">
                  Thân sinh: <span className="font-semibold">{person.parents}</span>
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {ordered.map((person, index) => (
            <div
              key={person.id}
              style={{
                borderColor: theme.borderColor,
                backgroundColor: theme.cardPanelBg || "rgba(255,255,255,0.04)",
                order: index,
              }}
              className="flex h-full min-w-0 flex-col items-center rounded-xl border p-5 text-center shadow-sm"
            >
              <div className="relative aspect-square w-24 overflow-hidden rounded-full border-2 border-white/40 shadow-md sm:w-28">
                {person.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img decoding="async"
                    src={person.photo}
                    alt={person.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <TemplatePhotoPlaceholder
                    label={person.placeholder}
                    className="aspect-square rounded-full"
                  />
                )}
              </div>

              <span
                style={{ color: theme.accentTextColor }}
                className="mt-3 text-[11px] font-bold uppercase tracking-widest"
              >
                {person.label} · {person.title}
              </span>

              <h4
                style={{
                  fontFamily: theme.coupleFontFamily,
                  color: theme.textColor,
                  fontSize: nameFontSize(person.name, false),
                }}
                className="mt-1 flex min-h-[3.5rem] min-w-0 items-center justify-center whitespace-nowrap font-bold leading-tight tracking-wide"
              >
                {person.name}
              </h4>

              {person.parents && (
                <div className="mt-2 w-full border-t pt-2" style={{ borderColor: theme.borderColor }}>
                  <p style={{ color: theme.subtextColor }} className="text-xs leading-relaxed">
                    Thân sinh: <span className="font-semibold">{person.parents}</span>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
