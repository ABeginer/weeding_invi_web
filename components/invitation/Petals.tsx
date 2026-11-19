"use client";

import * as React from "react";
import { m, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { useInvitationContained } from "./WeddingContentProvider";

type PetalTier = "far" | "mid" | "near";

interface PetalConfig {
  id: number;
  leftPercent: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  rotate: number;
  opacity: number;
  kind: "leaf" | "glow";
  tier: PetalTier;
}

/**
 * Ba lớp chiều sâu: xa (nhỏ, mờ, rơi chậm) → gần (lớn, rõ, rơi nhanh).
 * Trước đây mọi cánh rơi cùng tốc độ và cùng độ nét nên trông như confetti
 * phẳng; chênh tốc độ giữa các lớp tạo cảm giác có không gian.
 */
const ALL_PETALS: PetalConfig[] = [
  { id: 1, leftPercent: 8, size: 6, duration: 24, delay: 0, driftX: 26, rotate: 200, opacity: 0.3, kind: "leaf", tier: "far" },
  { id: 2, leftPercent: 76, size: 13, duration: 10, delay: 1.4, driftX: -22, rotate: -190, opacity: 0.5, kind: "leaf", tier: "near" },
  { id: 3, leftPercent: 30, size: 9, duration: 16, delay: 3.2, driftX: 30, rotate: 240, opacity: 0.44, kind: "glow", tier: "mid" },
  // 4 phần tử đầu là bộ mobile (PETALS_MOBILE) — cố ý trộn đủ 3 lớp.
  { id: 7, leftPercent: 44, size: 8, duration: 18, delay: 4.1, driftX: -16, rotate: 150, opacity: 0.4, kind: "leaf", tier: "mid" },
  { id: 4, leftPercent: 55, size: 5, duration: 26, delay: 5, driftX: -18, rotate: 160, opacity: 0.26, kind: "glow", tier: "far" },
  { id: 5, leftPercent: 18, size: 10, duration: 15, delay: 2.2, driftX: -24, rotate: 140, opacity: 0.46, kind: "leaf", tier: "mid" },
  { id: 6, leftPercent: 88, size: 12, duration: 12, delay: 6, driftX: 20, rotate: -220, opacity: 0.48, kind: "glow", tier: "near" },
];

const TIER_BLUR: Record<PetalTier, number> = { far: 0.7, mid: 0.25, near: 0 };
const TIER_Z: Record<PetalTier, number> = { far: 1, mid: 2, near: 3 };
const PETALS_MOBILE = 4;
const PETALS_DESKTOP = 7;

export function Petals() {
  const prefersReducedMotion = useReducedMotion();
  const contained = useInvitationContained();
  const [petalCount, setPetalCount] = React.useState(0);

  React.useEffect(() => {
    if (prefersReducedMotion) {
      setPetalCount(0);
      return;
    }

    const isMobile = window.innerWidth < 640;
    const cores = navigator.hardwareConcurrency ?? 4;
    const isLowPower = cores <= 4;

    if (isMobile || isLowPower) {
      setPetalCount(PETALS_MOBILE);
    } else {
      setPetalCount(PETALS_DESKTOP);
    }
  }, [prefersReducedMotion]);

  if (prefersReducedMotion || petalCount === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={
        contained
          ? "pointer-events-none absolute inset-0 z-20 overflow-hidden"
          : "pointer-events-none fixed inset-0 z-20 overflow-hidden"
      }
    >
      {ALL_PETALS.slice(0, petalCount).map((petal) => (
        <m.span
          key={petal.id}
          initial={{ y: "-8vh", x: 0, rotate: 0, opacity: 0 }}
          animate={{
            y: "108vh",
            x: [0, petal.driftX, -petal.driftX * 0.6, petal.driftX * 0.4],
            rotate: petal.rotate,
            opacity: [0, petal.opacity, petal.opacity, 0],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            left: `${petal.leftPercent}%`,
            width: petal.size,
            height: petal.kind === "leaf" ? petal.size * 1.35 : petal.size,
            zIndex: TIER_Z[petal.tier],
            filter: TIER_BLUR[petal.tier] ? `blur(${TIER_BLUR[petal.tier]}px)` : undefined,
          }}
          className={cn(
            "absolute top-0",
            petal.kind === "leaf"
              ? "rounded-tl-full rounded-br-full border border-inv-olive/20 bg-inv-olive/18 shadow-[0_0_6px_color-mix(in_srgb,var(--inv-olive)_20%,transparent)]"
              : "rounded-full border border-inv-olive/15 bg-white/75 shadow-[0_0_10px_rgba(255,255,255,0.65)]"
          )}
        />
      ))}
    </div>
  );
}
