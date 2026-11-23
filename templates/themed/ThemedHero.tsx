"use client";

import * as React from "react";
import { CalendarHeart, Crown } from "lucide-react";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import type { ThemeConfig } from "./theme-configs";
import type { WeddingTemplateProps } from "../types";

interface ThemedHeroProps {
  theme: ThemeConfig;
  couple: WeddingTemplateProps["data"]["couple"];
  photos: WeddingTemplateProps["data"]["photos"];
  dateParts: {
    weekday: string;
    day: string;
    month: string;
    year: string;
    time: string;
  };
  quote?: string;
}

export function ThemedHero({
  theme,
  couple,
  photos,
  dateParts,
  quote,
}: ThemedHeroProps) {
  const heroLayout = theme.heroLayout || "classic-romance";

  return (
    <section className="relative pt-6 pb-6 text-center sm:pt-10">
      {/* 1. Header Motif & Save Our Date */}
      <div className="inline-flex items-center justify-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-widest uppercase shadow-sm"
        style={{
          backgroundColor: theme.badgeBg,
          color: theme.badgeTextColor,
        }}
      >
        <CalendarHeart className="h-3.5 w-3.5" />
        <span>SAVE OUR DATE</span>
      </div>

      {/* 2. Couple Names in Calligraphy Typography */}
      <div className="mt-3">
        <h2
          style={{
            fontFamily: theme.coupleFontFamily,
            color: theme.textColor,
            fontStyle: "normal",
          }}
          className="break-words text-2xl font-semibold leading-[1.08] tracking-wide sm:text-3xl md:text-4xl"
        >
          <span className="block">{couple.groomName}</span>
          <span className="my-1 block text-base font-normal opacity-75 sm:text-lg">
            &amp;
          </span>
          <span className="block">{couple.brideName}</span>
        </h2>
      </div>

      {/* 3. Wedding Date Banner */}
      <p style={{ color: theme.subtextColor }} className="mt-1.5 text-xs font-semibold uppercase tracking-widest sm:text-sm">
        {dateParts.weekday} · {dateParts.day} Tháng {dateParts.month} Năm {dateParts.year}
      </p>

      {/* 4. Hero Photo Container based on heroLayout */}
      <div className="relative mx-auto mt-6">
        {/* LAYOUT A: Tilted Polaroid (Anh Đào Hồng) */}
        {heroLayout === "tilted-polaroid" && (
          <div className="relative mx-auto max-w-[320px] transition-transform duration-500 hover:rotate-0">
            {/* Background watermark calligraphy */}
            <div
              style={{
                fontFamily: theme.coupleFontFamily,
                color: theme.accentTextColor,
              }}
              className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-6xl font-bold opacity-20 sm:text-7xl"
            >
              Wedding Day
            </div>

            {/* Tilted Polaroid Card */}
            <div className="relative rotate-[6deg] rounded-sm border border-stone-200 bg-white p-3 pb-8 text-stone-800 shadow-2xl transition-transform duration-500 hover:rotate-0 sm:rotate-[8.5deg]">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xs bg-stone-100">
                {photos.heroUrl ? (
                  <img
                    src={photos.heroUrl}
                    alt={photos.heroAlt || "Ảnh cưới"}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                ) : (
                  <TemplatePhotoPlaceholder label="Ảnh cặp đôi" className="aspect-[4/5]" />
                )}
              </div>
              <p
                style={{ fontFamily: theme.coupleFontFamily }}
                className="mt-3 text-center text-xl font-bold text-stone-700 sm:text-2xl"
              >
                Forever & Always
              </p>
            </div>
          </div>
        )}

        {/* LAYOUT B: Imperial Gold Arch (Hoàng Kim Đỏ, Vườn Xuân Đỏ) */}
        {heroLayout === "arch-gold" && (
          <div className="relative mx-auto max-w-[330px]">
            {/* Imperial Crown Ornament */}
            <div className="mb-2 flex items-center justify-center">
              <Crown className="h-6 w-6 text-[#C8A951] drop-shadow-md animate-pulse" />
            </div>

            {/* Gold Arch Frame */}
            <div className="relative rounded-t-[140px] border-4 border-[#C8A951] p-2.5 shadow-2xl bg-gradient-to-b from-[#C8A951]/20 via-transparent to-transparent">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[130px] shadow-inner">
                {photos.heroUrl ? (
                  <img
                    src={photos.heroUrl}
                    alt={photos.heroAlt || "Ảnh cưới"}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                ) : (
                  <TemplatePhotoPlaceholder label="Ảnh cặp đôi" className="aspect-[4/5]" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT C: Haute Couture Editorial Noir (Rên Thêu Trắng) */}
        {heroLayout === "editorial-noir" && (
          <div className="relative mx-auto max-w-[330px]">
            <div className="relative border-4 border-double border-white/70 p-2 shadow-2xl bg-black/30 backdrop-blur-xs">
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                {photos.heroUrl ? (
                  <img
                    src={photos.heroUrl}
                    alt={photos.heroAlt || "Ảnh cưới"}
                    className="h-full w-full object-cover contrast-105 filter transition-transform duration-500 hover:scale-105"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                ) : (
                  <TemplatePhotoPlaceholder label="Ảnh cặp đôi" className="aspect-[4/5]" />
                )}
              </div>
            </div>
            <div className="mt-2 text-center text-[10px] tracking-[0.3em] uppercase opacity-75">
              EST. {dateParts.year} · HAUTE COUTURE INVITATION
            </div>
          </div>
        )}

        {/* LAYOUT D: Botanical Arch (Vườn Xuân Xanh, Vườn Kính, Mai Lan) */}
        {heroLayout === "botanical-arch" && (
          <div className="relative mx-auto max-w-[330px]">
            <div className="relative rounded-t-[120px] border-2 border-emerald-300/40 p-2 shadow-xl bg-white/10 backdrop-blur-xs">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-[110px]">
                {photos.heroUrl ? (
                  <img
                    src={photos.heroUrl}
                    alt={photos.heroAlt || "Ảnh cưới"}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                ) : (
                  <TemplatePhotoPlaceholder label="Ảnh cặp đôi" className="aspect-[4/5]" />
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-xs opacity-75">
              <span>🌿</span>
              <span>Our Secret Garden</span>
              <span>🌿</span>
            </div>
          </div>
        )}

        {/* LAYOUT E: Porcelain Ornate Tile (Bạch Sứ Nâu, Bạch Sứ Đỏ, Hoa Mộc Nâu) */}
        {heroLayout === "porcelain-ornate" && (
          <div className="relative mx-auto max-w-[330px] p-3">
            {/* Ornate Corner Brackets */}
            <div className="pointer-events-none absolute -top-1 -left-1 text-2xl font-serif leading-none" style={{ color: theme.accentTextColor }}>⌜</div>
            <div className="pointer-events-none absolute -top-1 -right-1 text-2xl font-serif leading-none" style={{ color: theme.accentTextColor }}>⌝</div>
            <div className="pointer-events-none absolute -bottom-1 -left-1 text-2xl font-serif leading-none" style={{ color: theme.accentTextColor }}>⌞</div>
            <div className="pointer-events-none absolute -bottom-1 -right-1 text-2xl font-serif leading-none" style={{ color: theme.accentTextColor }}>⌟</div>

            <div className="relative border border-white/30 p-2 shadow-xl backdrop-blur-xs" style={{ backgroundColor: theme.cardPanelBg || "rgba(255,255,255,0.06)" }}>
              <div className="relative aspect-[4/5] w-full overflow-hidden">
                {photos.heroUrl ? (
                  <img
                    src={photos.heroUrl}
                    alt={photos.heroAlt || "Ảnh cưới"}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                ) : (
                  <TemplatePhotoPlaceholder label="Ảnh cặp đôi" className="aspect-[4/5]" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT F: Playful Chibi Festive (Chibi Red) */}
        {heroLayout === "playful-chibi" && (
          <div className="relative mx-auto max-w-[330px]">
            {/* Double Happiness Badge Stamp */}
            <div className="absolute -top-3 -right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 font-bold text-amber-200 shadow-lg ring-2 ring-amber-300">
              囍
            </div>

            <div className="relative rounded-3xl border-4 border-rose-300/70 p-2.5 shadow-xl bg-amber-50/10 backdrop-blur-xs">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl">
                {photos.heroUrl ? (
                  <img
                    src={photos.heroUrl}
                    alt={photos.heroAlt || "Ảnh cưới"}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                  />
                ) : (
                  <TemplatePhotoPlaceholder label="Ảnh cặp đôi" className="aspect-[4/5]" />
                )}
              </div>
            </div>
            <div className="mt-2 text-center text-xs font-semibold text-rose-300">
              Trăm Năm Hạnh Phúc
            </div>
          </div>
        )}

        {/* LAYOUT G: Classic Romance Default */}
        {heroLayout === "classic-romance" && (
          <div className="relative mx-auto max-w-[330px]">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border-2 border-white/25 shadow-2xl">
              {photos.heroUrl ? (
                <img
                  src={photos.heroUrl}
                  alt={photos.heroAlt || "Ảnh cưới"}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              ) : (
                <TemplatePhotoPlaceholder label="Ảnh cặp đôi" className="aspect-[4/5]" />
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Quote / Lời dẫn */}
      {quote && (
        <div
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.borderColor,
          }}
          className="mx-auto mt-6 max-w-md rounded-2xl border p-4 text-center shadow-sm backdrop-blur-sm sm:p-5"
        >
          <p
            style={{
              color: theme.textColor,
              fontFamily: theme.coupleFontFamily,
              fontStyle: "italic",
            }}
            className="font-inv-quote text-xs leading-relaxed sm:text-sm"
          >
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      )}
    </section>
  );
}
