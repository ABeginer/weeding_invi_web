import { Armchair, UtensilsCrossed, Users } from "lucide-react";
import type { GuestDiet } from "@/lib/types";
import { preferenceLabel } from "@/lib/salutation-engine";

interface GuestBoardingPassProps {
  guestName: string;
  plusOnes?: number;
  diet?: GuestDiet | null;
  tableNumber: string;
}

export function GuestBoardingPass({
  guestName,
  plusOnes = 0,
  diet,
  tableNumber,
}: GuestBoardingPassProps) {
  const headcount = 1 + Math.max(0, plusOnes);
  const meal = preferenceLabel(diet === "veg" ? "vegetarian" : "standard");

  return (
    <section
      aria-label="Thẻ tra cứu bàn tiệc"
      className="mx-auto w-full max-w-[420px] px-4 py-3"
    >
      <div className="overflow-hidden rounded-2xl border border-accent/40 bg-surface shadow-lg">
        <div className="flex items-center justify-between gap-3 border-b border-dashed border-border bg-accent-soft px-4 py-2.5">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-accent-text uppercase">
            Wedding boarding pass
          </p>
          <span className="rounded-full border border-accent/40 bg-surface px-2 py-0.5 text-[10px] font-semibold text-accent-text">
            Tra cứu bàn
          </span>
        </div>

        <div className="space-y-3 px-4 py-4">
          <p className="font-display text-lg font-semibold text-text">{guestName}</p>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <p className="flex items-center gap-1 text-text-muted">
                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                Số người
              </p>
              <p className="mt-0.5 font-semibold text-text">{headcount}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-text-muted">
                <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
                Thực đơn
              </p>
              <p className="mt-0.5 font-semibold text-text">{meal}</p>
            </div>
            <div>
              <p className="flex items-center gap-1 text-text-muted">
                <Armchair className="h-3.5 w-3.5" aria-hidden="true" />
                Số bàn
              </p>
              <p className="mt-0.5 text-base font-bold text-accent-text">{tableNumber}</p>
            </div>
          </div>

          <p className="border-t border-dashed border-border pt-2 text-[11px] leading-relaxed text-text-muted">
            Quét mã tại sảnh hoặc mở lại link thiệp để xem thông tin bàn tiệc.
          </p>
        </div>
      </div>
    </section>
  );
}
