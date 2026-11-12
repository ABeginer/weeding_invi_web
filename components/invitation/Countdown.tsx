"use client";

import * as React from "react";
import { resolveEventIso } from "@/lib/utils";
import { RevealSection } from "./RevealSection";
import { useWeddingContent } from "./WeddingContentProvider";

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
  const primaryEvent = data.events[0];
  const targetIso = React.useMemo(
    () => resolveEventIso(primaryEvent?.startsAt ?? data.date),
    [primaryEvent?.startsAt, data.date],
  );

  const [timeLeft, setTimeLeft] = React.useState<TimeLeft | null>(null);

  React.useEffect(() => {
    setTimeLeft(calculateTimeLeft(targetIso));
    const timer = window.setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetIso));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetIso]);

  const units = timeLeft
    ? [
        { label: "Ngày", value: String(timeLeft.days) },
        { label: "Giờ", value: padTwo(timeLeft.hours) },
        { label: "Phút", value: padTwo(timeLeft.minutes) },
        { label: "Giây", value: padTwo(timeLeft.seconds) },
      ]
    : [
        { label: "Ngày", value: "--" },
        { label: "Giờ", value: "--" },
        { label: "Phút", value: "--" },
        { label: "Giây", value: "--" },
      ];

  return (
    <RevealSection className="bg-inv-bg px-5 pt-4 pb-11 text-center">
      <p className="font-inv-serif text-[10px] font-semibold uppercase tracking-[0.26em] text-inv-muted">
        {data.ui.countdownEyebrow}
      </p>

      <h2 className="mt-1.5 font-inv-script text-[clamp(36px,9.5vw,48px)] leading-[1.15] font-normal text-inv-olive-btn">
        {data.ui.countdownTitle}
      </h2>

      {timeLeft?.finished ? (
        <p className="mt-6 font-inv-serif text-[22px] italic text-inv-olive-deep sm:text-[26px]">
          {data.ui.countdownFinished}
        </p>
      ) : (
        <div className="mx-auto mt-6 grid max-w-[370px] grid-cols-4 gap-2 sm:gap-4">
          {units.map((unit) => (
            <div
              key={unit.label}
              className="flex flex-col items-center justify-center py-1"
            >
              <span className="font-inv-serif text-[clamp(32px,8.8vw,44px)] leading-none font-normal tabular-nums text-inv-olive-btn">
                {unit.value}
              </span>
              <span className="mt-2 font-inv-serif text-[14px] text-inv-olive-btn sm:text-[15px]">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </RevealSection>
  );
}
