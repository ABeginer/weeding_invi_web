"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

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
}

const ALL_PETALS: PetalConfig[] = [
  { id: 1, leftPercent: 8, size: 10, duration: 13, delay: 0, driftX: 26, rotate: 200, opacity: 0.45, kind: "leaf" },
  { id: 2, leftPercent: 18, size: 7, duration: 16, delay: 2.2, driftX: -20, rotate: 120, opacity: 0.55, kind: "glow" },
  { id: 3, leftPercent: 30, size: 11, duration: 14, delay: 4.5, driftX: 30, rotate: 240, opacity: 0.42, kind: "leaf" },
  { id: 4, leftPercent: 42, size: 8, duration: 17, delay: 1.1, driftX: -24, rotate: 160, opacity: 0.5, kind: "glow" },
  { id: 5, leftPercent: 55, size: 10, duration: 15, delay: 3.3, driftX: 20, rotate: -220, opacity: 0.42, kind: "leaf" },
  { id: 6, leftPercent: 66, size: 7, duration: 18, delay: 5.4, driftX: -26, rotate: 140, opacity: 0.48, kind: "glow" },
  { id: 7, leftPercent: 76, size: 10, duration: 13, delay: 0.8, driftX: 22, rotate: -190, opacity: 0.44, kind: "leaf" },
  { id: 8, leftPercent: 85, size: 8, duration: 16, delay: 3.8, driftX: -18, rotate: 180, opacity: 0.46, kind: "glow" },
  { id: 9, leftPercent: 93, size: 9, duration: 15, delay: 2.0, driftX: -16, rotate: -160, opacity: 0.38, kind: "leaf" },
  { id: 10, leftPercent: 48, size: 7, duration: 19, delay: 6.2, driftX: 18, rotate: 150, opacity: 0.4, kind: "glow" },
];

export function Petals() {
  const prefersReducedMotion = useReducedMotion();
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
      setPetalCount(5);
    } else {
      setPetalCount(ALL_PETALS.length);
    }
  }, [prefersReducedMotion]);

  if (prefersReducedMotion || petalCount === 0) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
    >
      {ALL_PETALS.slice(0, petalCount).map((petal) => (
        <motion.span
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
