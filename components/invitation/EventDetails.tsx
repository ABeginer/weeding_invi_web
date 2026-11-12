"use client";

import { formatWeddingDateParts } from "@/lib/utils";
import { RevealSection } from "./RevealSection";
import { useWeddingContent } from "./WeddingContentProvider";

function RingsOrnament() {
  return (
    <svg
      viewBox="0 0 92 64"
      aria-hidden="true"
      className="mx-auto my-10 block h-auto w-[64px] text-inv-olive/75 sm:w-[74px]"
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

  return (
    <RevealSection className="bg-inv-bg px-5 pt-2 pb-14 text-center">
      <div className="mx-auto max-w-[440px]">
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
              <div key={event.id || `${event.title}-${index}`}>
                <article className="text-center">
                  <h2 className="font-inv-serif text-[18px] leading-[1.2] font-semibold tracking-[0.02em] text-inv-olive-btn uppercase sm:text-[20px]">
                    {event.title}
                  </h2>

                  <p className="mt-2 font-inv-serif text-[14px] leading-[1.35] text-inv-olive-btn uppercase sm:text-[15px]">
                    VÀO LÚC {dateParts.time}, {dateParts.weekday}
                  </p>

                  <div className="mx-auto mt-3.5 mb-4 grid max-w-[400px] grid-cols-[1fr_1.08fr_1fr] items-center gap-2 text-inv-text">
                    <span className="block border-y border-inv-olive/60 py-1.5 font-inv-serif text-[15px] leading-none whitespace-nowrap uppercase sm:text-[17px]">
                      THÁNG {dateParts.month}
                    </span>
                    <strong className="font-inv-serif text-[clamp(52px,14vw,70px)] leading-[0.88] font-normal text-inv-ink">
                      {dateParts.day}
                    </strong>
                    <span className="block border-y border-inv-olive/60 py-1.5 font-inv-serif text-[15px] leading-none whitespace-nowrap uppercase sm:text-[17px]">
                      NĂM {dateParts.year}
                    </span>
                  </div>

                  {event.lunarDate && (
                    <p className="font-inv-serif text-[13.5px] leading-[1.35] italic text-inv-text sm:text-[14.5px]">
                      (Nhằm {event.lunarDate})
                    </p>
                  )}

                  <h3 className="mt-4 font-inv-serif text-[15px] leading-[1.3] font-semibold tracking-[0.02em] text-inv-olive-btn uppercase text-balance sm:text-[17px]">
                    {event.venueName}
                  </h3>

                  {event.venueAddress && (
                    <p className="mx-auto mt-1.5 max-w-[350px] font-inv-serif text-[14px] leading-[1.45] text-inv-text sm:text-[15.5px]">
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
                        className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-inv-olive-btn px-7 py-2.5 font-inv-serif text-[14px] tracking-[0.04em] text-white uppercase transition-colors hover:bg-inv-olive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive-deep focus-visible:ring-offset-2 focus-visible:ring-offset-inv-bg motion-safe:animate-[inv-pill-pulse_2.8s_ease-in-out_infinite]"
                      >
                        {data.ui.directionsButtonLabel}
                      </a>
                    </div>
                  )}
                </article>

                {index < data.events.length - 1 && <RingsOrnament />}
              </div>
            );
          })
        )}
      </div>
    </RevealSection>
  );
}
