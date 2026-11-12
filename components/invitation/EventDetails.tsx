"use client";

import { cn, formatWeddingDateParts } from "@/lib/utils";
import { RevealSection } from "./RevealSection";
import { useInvitationContained, useInvitationDesktopLayout, useWeddingContent } from "./WeddingContentProvider";

function RingsOrnament({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 92 64"
      aria-hidden="true"
      className={cn(
        "mx-auto my-10 block h-auto w-[64px] text-inv-olive/75 sm:w-[74px]",
        className,
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M27 12h12l4 5-10 7-10-7 4-5Z" strokeWidth="1.5" />
      <path d="M23 17h20" strokeWidth="1.2" />
      <circle cx="33" cy="40" r="16" />
      <circle cx="57" cy="40" r="16" />
      <path d="M23 33a12 12 0 0 1 8-4" strokeWidth="1.2" opacity="0.6" />
      <path d="M62 29a12 12 0 0 1 6 7" strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

export function EventDetails() {
  const data = useWeddingContent();
  const isContained = useInvitationContained();
  const isDesktopLayout = useInvitationDesktopLayout();
  const isMultiColumnDesktop = isDesktopLayout && data.events.length > 1;

  return (
    <RevealSection
      className={cn(
        "bg-inv-bg pt-2 text-center",
        isContained ? "px-3.5 pb-12" : "px-5 pb-14",
        isDesktopLayout && "md:px-8",
      )}
    >
      <div
        className={cn(
          "mx-auto",
          isMultiColumnDesktop
            ? "max-w-[880px] md:grid md:grid-cols-2 md:items-start md:gap-8"
            : isDesktopLayout && data.events.length === 1
              ? "max-w-[500px]"
              : "max-w-[440px]",
        )}
      >
        {data.events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-inv-olive/35 bg-inv-tint/60 px-5 py-8 text-center">
            <p className="font-inv-serif text-sm font-medium text-inv-olive-deep">
              Thêm lễ để hiển thị
            </p>
          </div>
        ) : (
          data.events.map((event, index) => {
            const dateParts = formatWeddingDateParts(event.startsAt);

            return (
              <div
                key={event.id || `${event.title}-${index}`}
                className={cn(
                  isMultiColumnDesktop &&
                    "md:rounded-3xl md:border md:border-inv-olive/20 md:bg-inv-paper/60 md:p-6",
                )}
              >
                <article className="text-center">
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

                  <div
                    className={cn(
                      "mx-auto mt-3.5 mb-4 grid max-w-[400px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center text-inv-text",
                      isContained ? "gap-1.5" : "gap-2",
                    )}
                  >
                    <span
                      className={cn(
                        "block border-y border-inv-olive/60 py-1.5 font-inv-serif leading-none whitespace-nowrap uppercase",
                        isContained
                          ? "text-[clamp(10px,3.6cqw,14px)]"
                          : "text-[13.5px] sm:text-[17px]",
                      )}
                    >
                      THÁNG {dateParts.month}
                    </span>
                    <strong
                      className={cn(
                        "px-1 font-inv-serif leading-[0.88] font-normal text-inv-ink",
                        isContained
                          ? "text-[clamp(36px,13.5cqw,54px)]"
                          : "text-[clamp(50px,14vw,70px)]",
                      )}
                    >
                      {dateParts.day}
                    </strong>
                    <span
                      className={cn(
                        "block border-y border-inv-olive/60 py-1.5 font-inv-serif leading-none whitespace-nowrap uppercase",
                        isContained
                          ? "text-[clamp(10px,3.6cqw,14px)]"
                          : "text-[13.5px] sm:text-[17px]",
                      )}
                    >
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
                      (Nhằm {event.lunarDate})
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

                  {event.mapEmbedUrl && (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-inv-olive/25 bg-inv-tint">
                      <iframe
                        src={event.mapEmbedUrl}
                        title={`Bản đồ ${event.venueName}`}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="h-48 w-full border-0"
                      />
                    </div>
                  )}

                  {event.mapDirectionsUrl && (
                    <div className="mt-4">
                      <a
                        href={event.mapDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center justify-center rounded-full bg-inv-olive-btn font-inv-serif tracking-[0.04em] text-white uppercase transition-colors hover:bg-inv-olive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive-deep focus-visible:ring-offset-2 focus-visible:ring-offset-inv-bg motion-safe:animate-[inv-pill-pulse_2.8s_ease-in-out_infinite]",
                          isContained
                            ? "w-full max-w-[205px] px-4 py-2 text-[12.5px]"
                            : "min-w-[210px] max-w-full px-7 py-2.5 text-[14px]",
                        )}
                      >
                        {data.ui.directionsButtonLabel}
                      </a>
                    </div>
                  )}
                </article>

                {index < data.events.length - 1 && (
                  <RingsOrnament
                    className={cn(isMultiColumnDesktop && "md:hidden")}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </RevealSection>
  );
}
