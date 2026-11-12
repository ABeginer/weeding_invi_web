"use client";

import { cn } from "@/lib/utils";
import { RevealSection } from "./RevealSection";
import { useInvitationDesktopLayout, useWeddingContent } from "./WeddingContentProvider";

export function PhotoTriptych() {
  const data = useWeddingContent();
  const isDesktopLayout = useInvitationDesktopLayout();
  const trio = data.photos.gallery.slice(0, 3);
  if (trio.length === 0) return null;

  return (
    <RevealSection className="bg-inv-bg px-2.5 pb-10">
      <div
        className={cn(
          "grid grid-cols-[1fr_1.24fr_1fr] items-center gap-2",
          isDesktopLayout && "mx-auto max-w-[820px] md:gap-4 md:px-6",
        )}
      >
        {trio.map((photo, index) => {
          const isCenter = trio.length === 3 && index === 1;
          return (
            <div
              key={photo.id || photo.url}
              className={cn(
                "w-full overflow-hidden bg-inv-tint",
                isCenter
                  ? isDesktopLayout
                    ? "h-[218px] sm:h-[248px] md:h-[340px]"
                    : "h-[218px] sm:h-[248px]"
                  : isDesktopLayout
                    ? "h-[168px] sm:h-[192px] md:h-[270px]"
                    : "h-[168px] sm:h-[192px]",
              )}
            >
              <img
                src={photo.url}
                alt={photo.alt}
                width={600}
                height={900}
                loading="lazy"
                decoding="async"
                className="block h-full w-full object-cover"
              />
            </div>
          );
        })}
      </div>
    </RevealSection>
  );
}
