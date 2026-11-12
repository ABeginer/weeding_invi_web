"use client";

import * as React from "react";
import { LANDING_COPY } from "@/config/landing";
import { cn } from "@/lib/utils";

interface PhoneFrameProps {
  children: React.ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  enableFloat?: boolean;
  lockedScroll?: boolean;
  /** Desktop height budget (px) reserved outside the phone chassis so it fits in 100dvh. */
  desktopOffsetPx?: number;
  className?: string;
}

export function PhoneFrame({
  children,
  scrollRef,
  enableFloat = true,
  lockedScroll = false,
  desktopOffsetPx = 136,
  className,
}: PhoneFrameProps) {
  return (
    <div
      style={
        {
          "--phone-offset": `${desktopOffsetPx}px`,
        } as React.CSSProperties
      }
      className={cn(
        "relative mx-auto w-full max-w-[332px] select-none sm:max-w-[360px] md:w-[clamp(264px,calc((100dvh-var(--phone-offset,120px))*390/844),404px)] md:max-w-full",
        enableFloat && "lnd-phone-float",
        className,
      )}
    >
      {/* Khung viền kim loại CSS thuần — không dùng ảnh thiết bị thật */}
      <div
        role="region"
        aria-label={LANDING_COPY.hero.phoneFrameAriaLabel}
        className="relative rounded-[38px] border border-phone-highlight bg-gradient-to-b from-phone-highlight via-phone-bezel to-phone-chassis p-[8px] shadow-2xl sm:rounded-[40px] sm:p-[9px]"
      >
        {/* Nút bấm vật lý trang trí hai bên khung */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-20 -left-[3px] hidden h-7 w-[3px] rounded-l bg-phone-highlight sm:block"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-32 -left-[3px] hidden h-10 w-[3px] rounded-l bg-phone-highlight sm:block"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-24 -right-[3px] hidden h-12 w-[3px] rounded-r bg-phone-highlight sm:block"
        />

        {/* Màn hình 390x844 bên trong (tự co tỉ lệ và bật container query theo chiều rộng khung) */}
        <div
          style={{ containerType: "inline-size" }}
          className="relative overflow-hidden rounded-[30px] border border-phone-bezel bg-surface sm:rounded-[32px]"
        >
          {/* Tai thỏ / Notch đơn giản */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1.5 left-1/2 z-50 flex h-[18px] w-[88px] -translate-x-1/2 items-center justify-center rounded-full border border-phone-bezel bg-phone-notch shadow-sm"
          >
            <span className="h-1 w-8 rounded-full bg-phone-bezel" />
            <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-phone-highlight" />
          </div>

          {/* Vùng cuộn thực tế bên trong khung */}
          <div
            ref={scrollRef}
            tabIndex={0}
            aria-label={LANDING_COPY.hero.phoneHelperHint}
            style={{ transform: "translate3d(0,0,0)" }}
            className={cn(
              "lnd-phone-scroll relative aspect-[390/844] w-full overflow-x-hidden overscroll-contain pt-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus-ring",
              lockedScroll ? "overflow-y-hidden" : "overflow-y-auto",
            )}
          >
            {children}
          </div>

          {/* Thanh Home Indicator ở đáy */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-1.5 z-50 flex justify-center"
          >
            <span className="h-1 w-24 rounded-full bg-phone-highlight/90" />
          </div>
        </div>
      </div>
    </div>
  );
}
