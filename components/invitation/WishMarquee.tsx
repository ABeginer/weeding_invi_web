"use client";

import * as React from "react";
import type { PublicWish } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePublicWishes } from "./usePublicWishes";

type MarqueeTone = "olive" | "dark" | "light";

const TONES: Record<
  MarqueeTone,
  { frame: string; item: string; name: string; message: string }
> = {
  olive: {
    frame: "border-inv-olive/25 bg-inv-olive/5",
    item: "border-inv-olive/20 bg-inv-paper/70",
    name: "text-inv-olive",
    message: "text-inv-ink/80",
  },
  dark: {
    frame: "border-white/15 bg-white/5",
    item: "border-white/15 bg-black/20",
    name: "text-white/90",
    message: "text-white/70",
  },
  light: {
    frame: "border-black/10 bg-black/5",
    item: "border-black/10 bg-white/70",
    name: "text-[#2C2523]",
    message: "text-[#2C2523]/75",
  },
};

/**
 * Sổ lưu bút: danh sách lời chúc **cuộn dọc** vô tận, cao bằng ô xác nhận tham dự.
 * Nội dung chia 2 nhóm GIỐNG HỆT nhau rồi trượt đúng -50% → nối liền không thấy mối.
 */
export function WishMarquee({
  tone = "olive",
  className,
  title = "Sổ lưu bút - nơi lưu giữ lời yêu thương",
  heightClassName = "h-[500px] sm:h-[540px]",
}: {
  tone?: MarqueeTone;
  className?: string;
  title?: string;
  /** Chiều cao khung cuộn — chỉnh để khớp với ô xác nhận tham dự. */
  heightClassName?: string;
}) {
  const { wishes, enabled, style } = usePublicWishes();

  if (!enabled || style === "overlay" || wishes.length === 0) return null;

  const palette = TONES[tone];
  const animate = wishes.length > 1;
  const duration = Math.max(24, wishes.length * 5);

  const item = (wish: PublicWish, key: string) => (
    <div
      key={key}
      className={cn(
        "flex w-full flex-col rounded-xl border px-3 py-2",
        palette.item,
      )}
    >
      <span
        className={cn(
          "truncate text-[11px] font-bold uppercase tracking-[0.12em]",
          palette.name,
        )}
      >
        {wish.name}
      </span>
      <span className={cn("mt-0.5 line-clamp-3 text-[12px] leading-snug", palette.message)}>
        {wish.message}
      </span>
    </div>
  );

  return (
    <div className={cn("w-full", className)} role="region" aria-label={title}>
      <p
        className={cn(
          "mb-2 text-center text-[14px] font-semibold uppercase leading-snug tracking-[0.16em] sm:text-[15px]",
          palette.name,
        )}
      >
        {title}
      </p>

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-2xl border",
          palette.frame,
          heightClassName,
        )}
      >
        {animate ? (
          <div
            className="wish-marquee-y flex flex-col"
            style={{ "--wish-marquee-duration": `${duration}s` } as React.CSSProperties}
          >
            {[0, 1].map((group) => (
              <div
                key={group}
                className="flex shrink-0 flex-col gap-2 px-2 pb-2"
                aria-hidden={group === 1 ? true : undefined}
              >
                {wishes.map((wish) => item(wish, `${group}-${wish.id}`))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center px-2">
            <div className="w-full">{item(wishes[0], wishes[0].id)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
