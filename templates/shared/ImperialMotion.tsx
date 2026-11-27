"use client";

import * as React from "react";
import { m, useReducedMotion } from "motion/react";

/* ============================================================
   HỆ CHUYỂN ĐỘNG DÙNG CHUNG CHO CÁC MẪU THIỆP CỔ ĐIỂN & HOÀNG GIA
   - Mờ-sang-rõ dịu mắt + trượt êm (Blur-to-Sharp + Silk Slide)
   - Viewport margin -80px đảm bảo animation chỉ chạy khi phần tử đã
     trồi vào vùng nhìn (tối ưu cho Auto-Scroll 200px/s)
   ============================================================ */

export const IMPERIAL_EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

export const IMPERIAL_VIEWPORT = {
  once: true,
  amount: "some",
  margin: "0px 0px -80px 0px",
} as const;

interface ImperialRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  distance?: number;
  blur?: boolean;
  scale?: number;
}

export function ImperialReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.8,
  distance = 18,
  blur = true,
  scale = 1,
}: ImperialRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const dx = direction === "left" ? -distance : direction === "right" ? distance : 0;
  const dy = direction === "up" ? distance : direction === "down" ? -distance : 0;

  return (
    <m.div
      initial={{
        opacity: 0,
        x: dx,
        y: dy,
        scale,
        ...(blur ? { filter: "blur(6px)" } : {}),
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        ...(blur ? { filter: "blur(0px)" } : {}),
      }}
      viewport={IMPERIAL_VIEWPORT}
      transition={{ duration, delay, ease: IMPERIAL_EASE }}
      className={className}
    >
      {children}
    </m.div>
  );
}

interface HeroRevealProps {
  children: React.ReactNode;
  showBody: boolean;
  className?: string;
  delay?: number;
  duration?: number;
  y?: number;
  scale?: number;
  blur?: boolean;
}

export function HeroReveal({
  children,
  showBody,
  className,
  delay = 0,
  duration = 0.85,
  y = 16,
  scale = 1,
  blur = true,
}: HeroRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      initial={{
        opacity: 0,
        y,
        scale,
        ...(blur ? { filter: "blur(6px)" } : {}),
      }}
      animate={
        showBody
          ? {
              opacity: 1,
              y: 0,
              scale: 1,
              ...(blur ? { filter: "blur(0px)" } : {}),
            }
          : {
              opacity: 0,
              y,
              scale,
              ...(blur ? { filter: "blur(6px)" } : {}),
            }
      }
      transition={{ duration, delay, ease: IMPERIAL_EASE }}
      className={className}
    >
      {children}
    </m.div>
  );
}

export function GoldButtonShimmer({
  active = true,
  viaColor = "rgba(255, 255, 255, 0.42)",
}: {
  active?: boolean;
  viaColor?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  if (!active || prefersReducedMotion) return null;

  return (
    <m.span
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg]"
      style={{
        background: `linear-gradient(90deg, transparent 0%, ${viaColor} 50%, transparent 100%)`,
      }}
      animate={{ x: ["-60%", "340%"] }}
      transition={{
        duration: 2.1,
        repeat: Infinity,
        repeatDelay: 2.4,
        ease: "easeInOut",
      }}
    />
  );
}
