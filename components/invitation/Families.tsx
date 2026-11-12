"use client";

import { cn } from "@/lib/utils";
import { RevealSection } from "./RevealSection";
import { useInvitationDesktopLayout, useWeddingContent } from "./WeddingContentProvider";

function renderParentLines(parents: string) {
  if (!parents.trim()) {
    return (
      <p className="font-inv-serif text-[11px] italic leading-[1.4] text-inv-muted sm:text-[12.5px]">
        Gia đình nhà hàng lễ cưới
      </p>
    );
  }
  const parts = parents.split(/\s*&\s*/);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return (
      <>
        <p className="font-inv-serif text-[11px] leading-[1.4] tracking-[0.01em] text-inv-ink uppercase sm:text-[12.5px]">
          {parts[0].trim()}
        </p>
        <p className="mt-0.5 font-inv-serif text-[11px] leading-[1.4] tracking-[0.01em] text-inv-ink uppercase sm:text-[12.5px]">
          {parts[1].trim()}
        </p>
      </>
    );
  }
  return (
    <p className="font-inv-serif text-[11px] leading-[1.4] tracking-[0.01em] text-inv-ink uppercase sm:text-[12.5px]">
      {parents}
    </p>
  );
}

function HandDrawnHeart() {
  return (
    <svg
      viewBox="0 0 110 92"
      aria-hidden="true"
      className="mx-auto mt-5 mb-3 block h-auto w-[72px] text-inv-ink motion-safe:animate-[inv-heartbeat_1.8s_ease-in-out_infinite] sm:w-[88px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M29 76 C50 62, 82 40, 82 22 C82 11, 71 6, 61 11 C53 15, 49 24, 48 31 C45 20, 35 12, 24 16 C12 20, 12 39, 25 53 C34 62, 46 70, 56 77" />
    </svg>
  );
}

export function Families() {
  const data = useWeddingContent();
  const isDesktopLayout = useInvitationDesktopLayout();
  const { groomParents, brideParents } = data.couple;
  const hasParents = Boolean(groomParents || brideParents);

  return (
    <RevealSection
      className={cn(
        "bg-inv-bg px-4 pt-8 pb-3 text-center sm:px-6",
        isDesktopLayout && "md:border-t md:border-inv-olive/15 md:px-8 md:pt-10",
      )}
    >
      {data.quote && (
        <blockquote
          className={cn(
            "mx-auto mb-7 max-w-[420px] font-inv-quote text-[21px] leading-[1.4] text-inv-text sm:text-[23px]",
            isDesktopLayout && "md:max-w-[580px] md:text-2xl",
          )}
        >
          “{data.quote}”
        </blockquote>
      )}

      {hasParents && (
        <div
          className={cn(
            "grid grid-cols-2 gap-3 sm:gap-5",
            isDesktopLayout && "mx-auto max-w-[680px] md:gap-8",
          )}
        >
          <div className="min-w-0">
            <h2 className="mb-2 font-inv-serif text-[12px] font-semibold leading-[1.2] tracking-[0.04em] text-inv-ink uppercase sm:text-[13px]">
              NHÀ TRAI
            </h2>
            {renderParentLines(groomParents)}
          </div>

          <div className="min-w-0">
            <h2 className="mb-2 font-inv-serif text-[12px] font-semibold leading-[1.2] tracking-[0.04em] text-inv-ink uppercase sm:text-[13px]">
              NHÀ GÁI
            </h2>
            {renderParentLines(brideParents)}
          </div>
        </div>
      )}

      <HandDrawnHeart />
    </RevealSection>
  );
}
