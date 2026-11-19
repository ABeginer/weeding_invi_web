"use client";

import * as React from "react";
import { CalendarHeart, Clock } from "lucide-react";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { padCountdownUnit, useWeddingCountdown } from "../shared/useCountdown";
import type { ThemeConfig } from "./theme-configs";

interface ThemedCalendarProps {
  theme: ThemeConfig;
  targetDate: string;
}

export function ThemedCalendar({ theme, targetDate }: ThemedCalendarProps) {
  const parts = React.useMemo(() => formatWeddingDateParts(targetDate), [targetDate]);
  const countdown = useWeddingCountdown(targetDate);

  // Parse target date for calendar computation
  const { year, month, day } = React.useMemo(() => {
    const d = new Date(targetDate);
    if (Number.isNaN(d.getTime())) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    }
    return {
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      day: d.getDate(),
    };
  }, [targetDate]);

  // Compute calendar days for this month
  const calendarDays = React.useMemo(() => {
    // 1st of month: 0 = Sun, 1 = Mon, ..., 6 = Sat
    const firstDay = new Date(year, month - 1, 1).getDay();
    // In VN: T2 = index 0, T3 = index 1 ... CN = index 6
    const offset = (firstDay + 6) % 7;
    const totalDays = new Date(year, month, 0).getDate();

    const days: Array<{ dayNum: number | null; isWeddingDay: boolean }> = [];
    for (let i = 0; i < offset; i++) {
      days.push({ dayNum: null, isWeddingDay: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({ dayNum: d, isWeddingDay: d === day });
    }
    return days;
  }, [year, month, day]);

  return (
    <div
      style={{
        backgroundColor: theme.cardBg,
        borderColor: theme.borderColor,
      }}
      className="mx-auto w-full rounded-2xl border p-5 shadow-lg backdrop-blur-md sm:p-6"
    >
      {/* Calendar Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
          style={{
            backgroundColor: theme.badgeBg,
            color: theme.badgeTextColor,
          }}
        >
          <CalendarHeart className="h-3.5 w-3.5" />
          <span>Lịch Cưới & Đếm Ngược</span>
        </div>

        <h3
          style={{
            color: theme.accentTextColor,
            fontFamily: theme.headingFontFamily,
          }}
          className="mt-3 font-serif text-xl font-bold tracking-wide sm:text-2xl"
        >
          {parts.weekday}, {parts.day} Tháng {parts.month} Năm {parts.year}
        </h3>
        <p style={{ color: theme.subtextColor }} className="mt-1 text-xs">
          {parts.time ? `Thời gian cử hành: ${parts.time}` : "Trân trọng kính mời quý khách"}
        </p>
      </div>

      {/* Visual Month Grid */}
      <div className="mx-auto mt-5 max-w-[320px] rounded-xl border p-3.5"
        style={{
          borderColor: theme.borderColor,
          backgroundColor: theme.cardPanelBg || "rgba(255,255,255,0.05)",
        }}
      >
        <div className="mb-2 text-center text-xs font-bold uppercase tracking-wider"
          style={{ color: theme.accentTextColor }}
        >
          Tháng {month.toString().padStart(2, "0")} / {year}
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold opacity-75">
          <span>T2</span>
          <span>T3</span>
          <span>T4</span>
          <span>T5</span>
          <span>T6</span>
          <span>T7</span>
          <span className="text-rose-400 font-bold">CN</span>
        </div>

        {/* Days grid */}
        <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
          {calendarDays.map((item, idx) => {
            if (item.dayNum === null) {
              return <div key={`empty-${idx}`} className="h-7 w-7" />;
            }
            if (item.isWeddingDay) {
              return (
                <div
                  key={`day-${item.dayNum}`}
                  style={{
                    backgroundColor: theme.buttonBg,
                    color: theme.buttonTextColor,
                    borderColor: theme.accentColor,
                  }}
                  className="relative mx-auto flex h-7 w-7 items-center justify-center rounded-full font-bold shadow-md ring-2 ring-white/40"
                >
                  <span>{item.dayNum}</span>
                  <span className="absolute -top-1 -right-0.5 text-[8px]">❤</span>
                </div>
              );
            }
            return (
              <div
                key={`day-${item.dayNum}`}
                className={cn(
                  "mx-auto flex h-7 w-7 items-center justify-center rounded-md font-medium transition-colors",
                  idx % 7 === 6 ? "opacity-90 font-semibold" : "opacity-80",
                )}
                style={{ color: theme.textColor }}
              >
                {item.dayNum}
              </div>
            );
          })}
        </div>
      </div>

      {/* Countdown Timer */}
      <div className="mt-6 border-t pt-5 text-center" style={{ borderColor: theme.borderColor }}>
        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold tracking-wider uppercase opacity-85">
          <Clock className="h-3.5 w-3.5" style={{ color: theme.accentTextColor }} />
          <span>Cùng Đếm Ngược Khoảnh Khắc</span>
        </div>

        <div className="mt-3.5 grid grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Ngày", val: countdown ? padCountdownUnit(countdown.days) : "--" },
            { label: "Giờ", val: countdown ? padCountdownUnit(countdown.hours) : "--" },
            { label: "Phút", val: countdown ? padCountdownUnit(countdown.minutes) : "--" },
            { label: "Giây", val: countdown ? padCountdownUnit(countdown.seconds) : "--" },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: theme.badgeBg,
                borderColor: theme.borderColor,
              }}
              className="flex flex-col items-center rounded-xl border p-2 sm:p-2.5 shadow-sm"
            >
              <span
                style={{
                  color: theme.accentTextColor,
                  fontFamily: theme.headingFontFamily,
                }}
                className="font-serif text-2xl font-bold tabular-nums sm:text-3xl"
              >
                {item.val}
              </span>
              <span
                style={{ color: theme.subtextColor }}
                className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider sm:text-[11px]"
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

