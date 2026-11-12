"use client";

import { cn } from "@/lib/utils";
import { RevealSection } from "./RevealSection";
import {
  useInvitationContained,
  useInvitationDesktopLayout,
  useWeddingContent,
} from "./WeddingContentProvider";

function renderParentLines(parents: string, isContained: boolean) {
  const lineClass = cn(
    "font-inv-serif leading-[1.4] tracking-[0.01em] text-inv-ink uppercase break-words",
    isContained ? "text-[11px]" : "text-[11px] sm:text-[12.5px]",
  );
  if (!parents.trim()) {
    return (
      <p
        className={cn(
          "font-inv-serif italic leading-[1.4] text-inv-muted",
          isContained ? "text-[11px]" : "text-[11px] sm:text-[12.5px]",
        )}
      >
        Gia đình nhà hàng lễ cưới
      </p>
    );
  }
  const parts = parents.split(/\s*&\s*/);
  if (parts.length === 2 && parts[0] && parts[1]) {
    return (
      <>
        <p className={lineClass}>{parts[0].trim()}</p>
        <p className={cn(lineClass, "mt-0.5")}>{parts[1].trim()}</p>
      </>
    );
  }
  return <p className={lineClass}>{parents}</p>;
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
  const isContained = useInvitationContained();
  const isDesktopLayout = useInvitationDesktopLayout();
  const { groomParents, brideParents } = data.couple;
  const hasParents = Boolean(groomParents || brideParents);

  return (
    <RevealSection
      className={cn(
        "bg-inv-bg pt-8 pb-3 text-center",
        isContained ? "px-3.5" : "px-4 sm:px-6",
        isDesktopLayout && "md:border-t md:border-inv-olive/15 md:px-8 md:pt-10",
      )}
    >
      {data.quote && (
        <blockquote
          className={cn(
            "mx-auto mb-7 max-w-[420px] font-inv-quote leading-[1.4] text-inv-text",
            isContained
              ? "text-[clamp(17px,5.6cqw,21px)]"
              : "text-[21px] sm:text-[23px]",
            isDesktopLayout && "md:max-w-[580px] md:text-2xl",
          )}
        >
          “{data.quote}”
        </blockquote>
      )}

      {hasParents && (
        <div
          className={cn(
            "grid grid-cols-2",
            isContained ? "gap-2.5" : "gap-3 sm:gap-5",
            isDesktopLayout && "mx-auto max-w-[680px] md:gap-8",
          )}
        >
          <div className="min-w-0">
            <h2
              className={cn(
                "mb-2 font-inv-serif font-semibold leading-[1.2] tracking-[0.04em] text-inv-ink uppercase",
                isContained ? "text-[11.5px]" : "text-[12px] sm:text-[13px]",
              )}
            >
              NHÀ TRAI
            </h2>
            {renderParentLines(groomParents, isContained)}
          </div>

          <div className="min-w-0">
            <h2
              className={cn(
                "mb-2 font-inv-serif font-semibold leading-[1.2] tracking-[0.04em] text-inv-ink uppercase",
                isContained ? "text-[11.5px]" : "text-[12px] sm:text-[13px]",
              )}
            >
              NHÀ GÁI
            </h2>
            {renderParentLines(brideParents, isContained)}
          </div>
        </div>
      )}

      <HandDrawnHeart />
    </RevealSection>
  );
}
