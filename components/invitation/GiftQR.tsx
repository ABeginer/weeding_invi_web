"use client";

import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { RevealSection } from "./RevealSection";
import { useInvitationContained } from "./WeddingContentProvider";

interface GiftQRProps {
  onOpenGift?: () => void;
}

export function GiftQR({ onOpenGift }: GiftQRProps) {
  const isContained = useInvitationContained();

  if (!onOpenGift) return null;

  return (
    <RevealSection
      id="gift-box"
      className={cn(
        "scroll-mt-10 bg-inv-bg text-center",
        isContained ? "px-3.5 pt-2 pb-10" : "px-5 pt-3 pb-12",
      )}
    >
      <div className="mx-auto max-w-[440px] rounded-2xl border border-inv-olive/30 bg-inv-paper px-5 py-6 shadow-xs">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-inv-olive/35 bg-inv-tint text-inv-olive-deep">
          <Gift className="h-5 w-5" aria-hidden="true" />
        </span>

        <p className="mt-3 font-inv-serif text-[11px] font-semibold tracking-[0.2em] text-inv-olive-btn uppercase">
          Mừng Cưới Trực Tuyến
        </p>

        <h2
          className={cn(
            "mt-1 font-inv-script leading-[1.2] font-normal text-inv-olive-deep",
            isContained
              ? "text-[clamp(26px,8.6cqw,34px)]"
              : "text-[clamp(30px,8.2vw,40px)]",
          )}
        >
          Hộp Quà Mừng
        </h2>

        <p
          className={cn(
            "mx-auto mt-2 max-w-[360px] font-inv-serif leading-[1.6] text-inv-text",
            isContained ? "text-[12.5px]" : "text-[13.5px] sm:text-[14.5px]",
          )}
        >
          Sự hiện diện của bạn là món quà quý giá nhất. Nếu muốn gửi thêm tấm lòng chúc phúc tới hai gia đình, hãy mở hộp quà bên dưới nhé.
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={onOpenGift}
            className="inline-flex h-11 w-full max-w-[230px] cursor-pointer items-center justify-center gap-2 rounded-full bg-inv-olive-btn px-5 font-inv-serif text-sm font-medium tracking-[0.02em] text-white transition-colors hover:bg-inv-olive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive-deep focus-visible:ring-offset-2 focus-visible:ring-offset-inv-paper"
          >
            <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Gửi quà mừng</span>
          </button>
        </div>
      </div>
    </RevealSection>
  );
}
