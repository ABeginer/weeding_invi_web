"use client";

import * as React from "react";
import { LANDING_COPY } from "@/config/landing";
import { cn } from "@/lib/utils";

interface PhoneFrameProps {
  children: React.ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  enableFloat?: boolean;
  lockedScroll?: boolean;
  className?: string;
}

export function PhoneFrame({
  children,
  scrollRef,
  enableFloat = true,
  lockedScroll = false,
  className,
}: PhoneFrameProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[416px] select-none",
        enableFloat && "lnd-phone-float",
        className
      )}
    >
      {/* Khung viền kim loại CSS thuần — không dùng ảnh thiết bị thật */}
      <div
        role="region"
        aria-label={LANDING_COPY.hero.phoneFrameAriaLabel}
        className="relative rounded-[46px] border border-lnd-phone-highlight bg-gradient-to-b from-lnd-phone-highlight via-lnd-phone-bezel to-lnd-phone-chassis p-[11px] shadow-[0_28px_70px_-18px_rgba(0,0,0,0.9),0_0_0_1px_rgba(212,175,55,0.12)] sm:p-[12px]"
      >
        {/* Nút bấm vật lý trang trí hai bên khung */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-24 -left-[3px] hidden h-9 w-[3px] rounded-l bg-lnd-phone-highlight sm:block"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-36 -left-[3px] hidden h-12 w-[3px] rounded-l bg-lnd-phone-highlight sm:block"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-28 -right-[3px] hidden h-14 w-[3px] rounded-r bg-lnd-phone-highlight sm:block"
        />

        {/* Màn hình 390x844 bên trong (tự co tỉ lệ khi màn nhỏ hơn 414px) */}
        <div className="relative overflow-hidden rounded-[36px] border border-lnd-border bg-lnd-bg">
          {/* Tai thỏ / Notch đơn giản */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-2 left-1/2 z-50 flex h-[22px] w-[108px] -translate-x-1/2 items-center justify-center rounded-full border border-lnd-border bg-lnd-phone-notch shadow-sm"
          >
            <span className="h-1.5 w-10 rounded-full bg-lnd-phone-bezel" />
            <span className="ml-2 h-2 w-2 rounded-full bg-lnd-phone-highlight" />
          </div>

          {/* Vùng cuộn thực tế bên trong khung */}
          <div
            ref={scrollRef}
            tabIndex={0}
            aria-label={LANDING_COPY.hero.phoneHelperHint}
            style={{ transform: "translate3d(0,0,0)" }}
            className={cn(
              "lnd-phone-scroll relative aspect-[390/844] w-full overflow-x-hidden overscroll-contain pt-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-lnd-gold",
              lockedScroll ? "overflow-y-hidden" : "overflow-y-auto"
            )}
          >
            {children}
          </div>

          {/* Thanh Home Indicator ở đáy */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-1.5 z-50 flex justify-center"
          >
            <span className="h-1 w-28 rounded-full bg-lnd-phone-highlight/90" />
          </div>
        </div>
      </div>
    </div>
  );
}

