"use client";

import { cn } from "@/lib/utils";
import { TemplatePhotoPlaceholder } from "@/templates/shared/TemplatePhotoPlaceholder";
import { RevealSection } from "./RevealSection";
import { useInvitationDesktopLayout, useWeddingContent } from "./WeddingContentProvider";

export function Couple() {
  const data = useWeddingContent();
  const isDesktopLayout = useInvitationDesktopLayout();
  return (
    <RevealSection className="bg-inv-bg text-center">
      <div
        className={cn(
          "grid grid-cols-2 gap-3 px-4 pt-1 pb-6 sm:gap-5 sm:px-6",
          isDesktopLayout && "mx-auto max-w-[720px] md:gap-8 md:px-0",
        )}
      >
        <div className="min-w-0">
          <p className="mb-1 font-inv-serif text-[12px] font-semibold leading-[1.2] tracking-[0.04em] text-inv-ink uppercase sm:text-[13px]">
            CHÚ RỂ
          </p>
          <h2 className="font-inv-script text-[clamp(23px,6.2vw,31px)] leading-[1.2] font-normal text-inv-ink">
            {data.couple.groomFullName}
          </h2>
        </div>

        <div className="min-w-0">
          <p className="mb-1 font-inv-serif text-[12px] font-semibold leading-[1.2] tracking-[0.04em] text-inv-ink uppercase sm:text-[13px]">
            CÔ DÂU
          </p>
          <h2 className="font-inv-script text-[clamp(23px,6.2vw,31px)] leading-[1.2] font-normal text-inv-ink">
            {data.couple.brideFullName}
          </h2>
        </div>
      </div>

      <div
        className={cn(
          "bg-inv-olive-mid",
          isDesktopLayout ? "p-3 md:px-8 md:py-8" : "p-3",
        )}
      >
        <div
          className={cn(
            "grid grid-cols-2 gap-3",
            isDesktopLayout && "mx-auto max-w-[720px] md:gap-6",
          )}
        >
          <div
            className={cn(
              "w-full overflow-hidden bg-inv-olive-deep/30",
              isDesktopLayout
                ? "h-[220px] sm:h-[300px] md:h-auto md:aspect-[3/4]"
                : "h-[220px] sm:h-[300px]",
            )}
          >
            {data.photos.groomUrl ? (
              <img
                src={data.photos.groomUrl}
                alt={`Chú rể ${data.couple.groomFullName}`}
                width={600}
                height={800}
                loading="lazy"
                className="block h-full w-full object-cover object-[center_22%]"
              />
            ) : (
              <TemplatePhotoPlaceholder className="h-full aspect-auto" />
            )}
          </div>

          <div
            className={cn(
              "w-full overflow-hidden bg-inv-olive-deep/30",
              isDesktopLayout
                ? "h-[220px] sm:h-[300px] md:h-auto md:aspect-[3/4]"
                : "h-[220px] sm:h-[300px]",
            )}
          >
            {data.photos.brideUrl ? (
              <img
                src={data.photos.brideUrl}
                alt={`Cô dâu ${data.couple.brideFullName}`}
                width={600}
                height={800}
                loading="lazy"
                className="block h-full w-full object-cover object-[center_22%]"
              />
            ) : (
              <TemplatePhotoPlaceholder className="h-full aspect-auto" />
            )}
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
