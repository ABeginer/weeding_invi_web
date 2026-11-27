"use client";

import * as React from "react";
import { cn, resolveEventIso } from "@/lib/utils";
import { getVisibleEvents, getNearestUpcomingEvent } from "@/lib/events";
import { RevealSection } from "./RevealSection";
import { useInvitationContained, useWeddingContent } from "./WeddingContentProvider";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  finished: boolean;
}

function calculateTimeLeft(targetIso: string): TimeLeft {
  const targetMs = new Date(targetIso).getTime();
  const diff = targetMs - Date.now();

  if (Number.isNaN(targetMs) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, finished: false };
}

function padTwo(value: number): string {
  return String(value).padStart(2, "0");
}

export function Countdown() {
  const data = useWeddingContent();
  const isContained = useInvitationContained();
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const rawDate = targetEvent?.startsAt ?? data.date;
  const targetIso = React.useMemo(
    () => (rawDate ? resolveEventIso(rawDate) : ""),
    [rawDate],
  );

  const [timeLeft, setTimeLeft] = React.useState<TimeLeft | null>(null);

  React.useEffect(() => {
    if (!targetIso) return;
    setTimeLeft(calculateTimeLeft(targetIso));
    const timer = window.setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetIso));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetIso]);

  if (!rawDate || !targetIso || !timeLeft) {
    return null;
  }

  const units = [
    { label: "Ngày", value: String(timeLeft.days) },
    { label: "Giờ", value: padTwo(timeLeft.hours) },
    { label: "Phút", value: padTwo(timeLeft.minutes) },
    { label: "Giây", value: padTwo(timeLeft.seconds) },
  ];

  return (
    <RevealSection
      className={cn(
        "bg-inv-bg pt-4 text-center",
        isContained ? "px-3.5 pb-8" : "px-5 pb-11",
      )}
    >
      <p className="font-inv-serif text-[10px] font-semibold uppercase tracking-[0.26em] text-inv-muted">
        {data.ui.countdownEyebrow}
      </p>

      <h2
        className={cn(
          "mt-1.5 font-inv-script leading-[1.15] font-normal text-inv-olive-btn",
          isContained ? "text-[clamp(26px,9cqw,38px)]" : "text-[clamp(36px,9.5vw,48px)]",
        )}
      >
        {data.ui.countdownTitle}
      </h2>

      {timeLeft?.finished ? (
        <p
          className={cn(
            "mt-6 font-inv-serif italic text-inv-olive-deep",
            isContained ? "text-[18px]" : "text-[22px] sm:text-[26px]",
          )}
        >
          {data.ui.countdownFinished}
        </p>
      ) : (
        <div
          className={cn(
            "mx-auto mt-6 grid max-w-[370px] grid-cols-4",
            isContained ? "gap-1.5" : "gap-2 sm:gap-4",
          )}
        >
          {units.map((unit) => (
            <div
              key={unit.label}
              className="flex flex-col items-center justify-center py-1"
            >
              <span
                className={cn(
                  "font-inv-serif leading-none font-normal tabular-nums text-inv-olive-btn",
                  isContained ? "text-[clamp(24px,8.5cqw,34px)]" : "text-[clamp(32px,8.8vw,44px)]",
                )}
              >
                {unit.value}
              </span>
              <span
                className={cn(
                  "mt-2 font-inv-serif text-inv-olive-btn",
                  isContained ? "text-[12.5px]" : "text-[14px] sm:text-[15px]",
                )}
              >
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </RevealSection>
  );
}
