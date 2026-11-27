"use client";

import * as React from "react";

const PETALS = [
  { left: 6, delay: 0, duration: 14, size: 12, drift: 28, rotate: 210, opacity: 0.55 },
  { left: 14, delay: 2.4, duration: 17, size: 9, drift: -22, rotate: 160, opacity: 0.45 },
  { left: 23, delay: 1.2, duration: 15, size: 14, drift: 20, rotate: 240, opacity: 0.5 },
  { left: 34, delay: 4.1, duration: 19, size: 10, drift: -30, rotate: 180, opacity: 0.38 },
  { left: 45, delay: 0.7, duration: 16, size: 11, drift: 26, rotate: 220, opacity: 0.55 },
  { left: 56, delay: 3.2, duration: 18, size: 8, drift: -18, rotate: 150, opacity: 0.42 },
  { left: 66, delay: 5.3, duration: 14, size: 13, drift: 24, rotate: 250, opacity: 0.48 },
  { left: 76, delay: 2.0, duration: 17, size: 9, drift: -26, rotate: 170, opacity: 0.4 },
  { left: 86, delay: 4.8, duration: 20, size: 12, drift: 18, rotate: 230, opacity: 0.5 },
  { left: 94, delay: 1.8, duration: 15, size: 10, drift: -20, rotate: 190, opacity: 0.36 },
];

export function SakuraPetals({ fixed = false }: { fixed?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={fixed ? "pointer-events-none fixed inset-0 z-[60] overflow-hidden" : "pointer-events-none absolute inset-0 z-[60] overflow-hidden"}
    >
      {PETALS.map((petal, index) => (
        <span
          key={index}
          className="sakura-petal"
          style={{
            left: `${petal.left}%`,
            width: petal.size,
            height: petal.size * 0.72,
            animationDelay: `${petal.delay}s`,
            animationDuration: `${petal.duration}s`,
            opacity: petal.opacity,
            // @ts-expect-error CSS custom property
            "--petal-drift": `${petal.drift}px`,
            "--petal-rotate": `${petal.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}
