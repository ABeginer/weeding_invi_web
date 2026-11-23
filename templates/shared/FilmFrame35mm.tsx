"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FilmFrame35mmProps {
  src: string;
  alt?: string;
  aspectRatio?: "3/4" | "4/5" | "16/10";
  stampSrc?: string;
  stampAlt?: string;
  stampPosition?: "top-right" | "bottom-right" | "bottom-left";
  stampClassName?: string;
  filmBrand?: string;
  frameCode?: string;
  borderColor?: string;
  accentColor?: string;
  sprocketCount?: number;
  className?: string;
  imgClassName?: string;
  children?: React.ReactNode;
}

export function FilmFrame35mm({
  src,
  alt = "Ảnh cưới 35mm",
  aspectRatio = "4/5",
  stampSrc,
  stampAlt = "Dấu triện",
  stampPosition = "bottom-right",
  stampClassName,
  filmBrand = "KODAK VISION3 500T",
  frameCode = "FRAME #24A",
  borderColor = "border-white/10",
  accentColor = "text-[#E5A93B]/85",
  sprocketCount = 8,
  className,
  imgClassName,
  children,
}: FilmFrame35mmProps) {
  const aspectClass =
    aspectRatio === "3/4"
      ? "aspect-[3/4]"
      : aspectRatio === "16/10"
        ? "aspect-[16/10]"
        : "aspect-[4/5]";

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[340px] sm:max-w-[380px] select-none rounded-xl bg-[#0A090B] p-2.5 sm:p-3 shadow-[0_16px_36px_rgba(0,0,0,0.7)] border",
        borderColor,
        className
      )}
    >
      {/* Top Film Header Track */}
      <div className="mb-2 flex items-center justify-between px-2 text-[9px] sm:text-[10px] font-mono tracking-widest uppercase">
        <span className={cn("font-semibold", accentColor)}>{filmBrand}</span>
        <span className="flex items-center gap-1.5 text-white/50">
          <span>●</span>
          <span>24 FPS</span>
          <span>▲ 24A</span>
        </span>
      </div>

      {/* Main Strip: Left Sprockets | Bounded Photo Viewport | Right Sprockets */}
      <div className="relative flex items-stretch gap-2 sm:gap-2.5">
        {/* Left Sprocket Column (always outside the photo) */}
        <div className="flex flex-col justify-between py-1 px-0.5 opacity-75">
          {Array.from({ length: sprocketCount }).map((_, i) => (
            <div
              key={`sprocket-l-${i}`}
              className="h-3.5 w-2 sm:h-4 sm:w-2.5 rounded-[2px] bg-[#1A1A22] border border-white/15 shadow-inner"
            />
          ))}
        </div>

        {/* Central Photo Viewport - strictly bounded with overflow-hidden */}
        <div
          className={cn(
            "relative flex-1 overflow-hidden rounded-md bg-[#121216] shadow-inner",
            aspectClass
          )}
        >
          <img
            src={src}
            alt={alt}
            className={cn(
              "h-full w-full object-cover object-center transition-transform duration-500",
              imgClassName
            )}
            loading="eager"
          />
          {/* Subtle vintage film vignette */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

          {/* Children or overlays strictly inside viewport */}
          {children}
        </div>

        {/* Right Sprocket Column (always outside the photo) */}
        <div className="flex flex-col justify-between py-1 px-0.5 opacity-75">
          {Array.from({ length: sprocketCount }).map((_, i) => (
            <div
              key={`sprocket-r-${i}`}
              className="h-3.5 w-2 sm:h-4 sm:w-2.5 rounded-[2px] bg-[#1A1A22] border border-white/15 shadow-inner"
            />
          ))}
        </div>
      </div>

      {/* Bottom Film Footer Track */}
      <div className="mt-2 flex items-center justify-between px-2 text-[9px] sm:text-[10px] font-mono tracking-widest text-white/45 uppercase">
        <span>SAFETY FILM · 35MM</span>
        <span className={cn("font-bold", accentColor)}>{frameCode}</span>
      </div>

      {/* Optional floating stamp / badge anchored to corner */}
      {stampSrc && (
        <div
          className={cn(
            "absolute z-20 pointer-events-none",
            stampPosition === "top-right" && "-top-3 -right-3",
            stampPosition === "bottom-right" && "-bottom-3 -right-3",
            stampPosition === "bottom-left" && "-bottom-3 -left-3"
          )}
        >
          <img
            src={stampSrc}
            alt={stampAlt}
            className={cn(
              "h-auto w-12 sm:w-14 drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)]",
              stampClassName
            )}
          />
        </div>
      )}
    </div>
  );
}
