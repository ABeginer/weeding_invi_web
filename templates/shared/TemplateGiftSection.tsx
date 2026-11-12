"use client";

import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TemplateTone } from "./TemplateOverlays";

interface TemplateGiftSectionProps {
  tone: TemplateTone;
  contained?: boolean;
  onOpenGift: () => void;
}

export function TemplateGiftSection({
  tone,
  contained = false,
  onOpenGift,
}: TemplateGiftSectionProps) {
  const styles =
    tone === "obsidian"
      ? {
          wrap: "bg-lnd-bg text-lnd-body",
          card: "border border-lnd-gold-soft/70 bg-lnd-surface text-lnd-body",
          iconBox: "border-lnd-gold-soft bg-lnd-gold-tint text-lnd-gold",
          eyebrow: "text-lnd-gold",
          heading: "text-lnd-gold font-display",
          subtext: "text-lnd-muted",
          button:
            "bg-lnd-gold text-lnd-bg hover:bg-lnd-gold-bright focus-visible:ring-lnd-gold font-semibold",
        }
      : tone === "sunset"
        ? {
            wrap: "bg-[#FCF5F0] text-[#322424]",
            card: "border border-[#E7CFC3] bg-white text-[#322424]",
            iconBox: "border-[#E7CFC3] bg-[#FBF3ED] text-[#7A3535]",
            eyebrow: "text-[#8A4444]",
            heading: "text-[#5C2626] font-display",
            subtext: "text-[#6B504B]",
            button:
              "bg-[#7A3535] text-white hover:bg-[#612828] focus-visible:ring-[#7A3535] font-medium",
          }
        : {
            wrap: "bg-[#FAF7F0] text-[#1F1D1A]",
            card: "border border-[#E2D9C8] bg-white text-[#1F1D1A]",
            iconBox: "border-[#DFD5C3] bg-[#FAF7F0] text-[#706040]",
            eyebrow: "text-[#706040]",
            heading: "text-[#1F1D1A] font-display",
            subtext: "text-[#5E574B]",
            button:
              "bg-[#23201C] text-[#FAF7F0] hover:bg-[#3A342D] focus-visible:ring-[#706040] font-medium",
          };

  return (
    <section
      id="gift-box"
      className={cn(
        "scroll-mt-10 text-center",
        contained ? "px-3.5 py-8" : "px-5 py-10",
        styles.wrap,
      )}
    >
      <div className={cn("mx-auto max-w-[440px] rounded-2xl px-5 py-6", styles.card)}>
        <span
          className={cn(
            "mx-auto flex h-11 w-11 items-center justify-center rounded-full border",
            styles.iconBox,
          )}
        >
          <Gift className="h-5 w-5" aria-hidden="true" />
        </span>

        <p
          className={cn(
            "mt-3 text-[11px] font-medium tracking-[0.2em] uppercase",
            styles.eyebrow,
          )}
        >
          Mừng Cưới Trực Tuyến
        </p>

        <h2
          className={cn(
            "mt-1 font-semibold",
            contained ? "text-2xl" : "text-3xl",
            styles.heading,
          )}
        >
          Hộp Quà Mừng
        </h2>

        <p
          className={cn(
            "mx-auto mt-2 max-w-[360px] leading-relaxed",
            contained ? "text-xs" : "text-sm",
            styles.subtext,
          )}
        >
          Sự hiện diện của bạn là món quà quý giá nhất. Nếu muốn gửi thêm tấm lòng chúc phúc tới hai gia đình, hãy mở hộp quà bên dưới nhé.
        </p>

        <div className="mt-5">
          <button
            type="button"
            onClick={onOpenGift}
            className={cn(
              "inline-flex h-11 w-full max-w-[230px] cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2",
              styles.button,
            )}
          >
            <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Gửi quà mừng</span>
          </button>
        </div>
      </div>
    </section>
  );
}
