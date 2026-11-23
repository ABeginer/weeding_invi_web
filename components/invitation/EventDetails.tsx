"use client";

import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { getVisibleEvents, getEventDirectionsUrl } from "@/lib/events";
import { RevealSection } from "./RevealSection";
import { useInvitationContained, useWeddingContent } from "./WeddingContentProvider";

export function EventDetails() {
  const data = useWeddingContent();
  const isContained = useInvitationContained();
  const visibleEvents = getVisibleEvents(data);

  return (
    <RevealSection
      className={cn(
        "bg-inv-bg pt-2 text-center",
        isContained ? "px-3.5 pb-12" : "px-4 sm:px-5 pb-14",
      )}
    >
      <div className={`mx-auto w-full ${visibleEvents.length > 1 ? "max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-5 text-left" : "max-w-[440px] sm:max-w-[460px] grid grid-cols-1 gap-5 text-center"}`}>
        {visibleEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-inv-olive/35 bg-inv-tint/60 px-5 py-8 text-center col-span-full">
            <p className="font-inv-serif text-sm font-medium text-inv-olive-deep">
              Thêm lễ để hiển thị
            </p>
          </div>
        ) : (
          visibleEvents.map((event, index) => {
            const dateParts = formatWeddingDateParts(event.startsAt);
            const directionsUrl = getEventDirectionsUrl(event);

            return (
              <div
                key={event.id || `${event.title}-${index}`}
                className="w-full overflow-hidden rounded-3xl border border-inv-olive/20 bg-inv-paper/60 p-5 sm:p-6 shadow-xs flex flex-col items-center text-center justify-between"
              >
                <article className="w-full flex flex-col items-center text-center">
                  <h2
                    className={cn(
                      "font-inv-serif leading-[1.2] font-semibold tracking-[0.02em] text-inv-olive-btn uppercase break-words",
                      isContained ? "text-[17px]" : "text-[18px] sm:text-[20px]",
                    )}
                  >
                    {event.title}
                  </h2>

                  <p
                    className={cn(
                      "mt-2 font-inv-serif leading-[1.35] text-inv-olive-btn uppercase",
                      isContained ? "text-[12.5px]" : "text-[14px] sm:text-[15px]",
                    )}
                  >
                    VÀO LÚC {dateParts.time}, {dateParts.weekday}
                  </p>

                  <div className="mx-auto mt-3.5 mb-4 flex w-full items-center justify-center gap-3 sm:gap-5 text-inv-text">
                    <span className="border-y border-inv-olive/60 px-2 py-1.5 font-inv-serif text-xs tracking-[0.14em] leading-none whitespace-nowrap uppercase">
                      THÁNG {dateParts.month}
                    </span>
                    <strong className="shrink-0 px-1 font-inv-serif text-4xl sm:text-5xl font-normal leading-none text-inv-ink">
                      {dateParts.day}
                    </strong>
                    <span className="border-y border-inv-olive/60 px-2 py-1.5 font-inv-serif text-xs tracking-[0.14em] leading-none whitespace-nowrap uppercase">
                      NĂM {dateParts.year}
                    </span>
                  </div>

                  {event.lunarDate && (
                    <p
                      className={cn(
                        "font-inv-serif leading-[1.35] italic text-inv-text",
                        isContained ? "text-[12.5px]" : "text-[13.5px] sm:text-[14.5px]",
                      )}
                    >
                      (Tức ngày {formatLunarDateClean(event.lunarDate)})
                    </p>
                  )}

                  <h3
                    className={cn(
                      "mt-4 font-inv-serif leading-[1.3] font-semibold tracking-[0.02em] text-inv-olive-btn uppercase text-balance break-words",
                      isContained ? "text-[14px]" : "text-[15px] sm:text-[17px]",
                    )}
                  >
                    {event.venueName}
                  </h3>

                  {event.venueAddress && (
                    <p
                      className={cn(
                        "mx-auto mt-1.5 max-w-[350px] font-inv-serif leading-[1.45] text-inv-text break-words",
                        isContained ? "text-[12.5px]" : "text-[14px] sm:text-[15.5px]",
                      )}
                    >
                      {event.venueAddress}
                    </p>
                  )}

                  {directionsUrl && (
                    <div className="mt-4 w-full flex justify-center">
                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex w-full max-w-[210px] mx-auto items-center justify-center rounded-full bg-inv-olive-btn px-6 py-2.5 font-inv-serif text-xs sm:text-[13px] tracking-[0.04em] text-white uppercase transition-colors hover:bg-inv-olive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive-deep focus-visible:ring-offset-2 focus-visible:ring-offset-inv-bg inv-cta-pulse"
                      >
                        {data.ui.directionsButtonLabel}
                      </a>
                    </div>
                  )}
                </article>
              </div>
            );
          })
        )}
      </div>
    </RevealSection>
  );
}
