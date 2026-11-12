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
      {/* Viên kim cương nhỏ trên nhẫn trái */}
      <path d="M27 12h12l4 5-10 7-10-7 4-5Z" strokeWidth="1.5" />
      <path d="M23 17h20" strokeWidth="1.2" />
      {/* Hai vòng nhẫn lồng vào nhau */}
      <circle cx="33" cy="40" r="16" />
      <circle cx="57" cy="40" r="16" />
      {/* Đường ánh sáng nhẹ tạo cảm giác kim loại */}
      <path d="M23 33a12 12 0 0 1 8-4" strokeWidth="1.2" opacity="0.6" />
      <path d="M62 29a12 12 0 0 1 6 7" strokeWidth="1.2" opacity="0.6" />
    </svg>
  );
}

export function EventDetails() {
  const wedding = useWeddingContent();
  if (wedding.events.length === 0) return null;

  return (
    <RevealSection className="bg-inv-bg px-5 pt-2 pb-14 text-center">
      <div className="mx-auto max-w-[440px]">
        {wedding.events.map((event, index) => {
          const dateParts = formatWeddingDateParts(event.date, event.time);
          const displayTime = event.time || dateParts.time;

          return (
            <div key={`${event.title}-${index}`}>
              <article className="text-center">
                <h2 className="font-inv-serif text-[18px] leading-[1.2] font-semibold tracking-[0.02em] text-inv-olive-btn uppercase sm:text-[20px]">
                  {event.title}
                </h2>

                <p className="mt-2 font-inv-serif text-[14px] leading-[1.35] text-inv-olive-btn uppercase sm:text-[15px]">
                  VÀO LÚC {displayTime}, {dateParts.weekday}
                </p>

                {/* Cụm ngày 3 cột kẹp đường kẻ ngang đặc trưng */}
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
                  {event.venue}
                </h3>

                <p className="mx-auto mt-1.5 max-w-[350px] font-inv-serif text-[14px] leading-[1.45] text-inv-text sm:text-[15.5px]">
                  {event.address}
                </p>

                {event.mapDirectionsUrl && (
                  <div className="mt-4">
                    <a
                      href={event.mapDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-[220px] items-center justify-center rounded-full bg-inv-olive-btn px-7 py-2.5 font-inv-serif text-[14px] tracking-[0.04em] text-white uppercase transition-colors hover:bg-inv-olive-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inv-olive-deep focus-visible:ring-offset-2 focus-visible:ring-offset-inv-bg motion-safe:animate-[inv-pill-pulse_2.8s_ease-in-out_infinite]"
                    >
                      {wedding.sections.directionsButtonLabel}
                    </a>
                  </div>
                )}
              </article>

              {index < wedding.events.length - 1 && <RingsOrnament />}
            </div>
          );
        })}
      </div>
    </RevealSection>
  );
}
