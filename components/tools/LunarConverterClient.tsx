"use client";

import * as React from "react";
import { ArrowLeftRight, Calendar } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { LUNAR_CONVERTER_COPY } from "@/config/tools-copy";
import {
  convertLunarToSolar,
  convertSolarToLunar,
  isValidSolarDate,
  MAX_LUNAR_YEAR,
  MIN_LUNAR_YEAR,
  type LunarConversionResult,
} from "@/lib/lunar";
import { cn } from "@/lib/utils";

type ConversionMode = "solar-to-lunar" | "lunar-to-solar";

function getTodayInVietnam(): { day: number; month: number; year: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = formatter.format(new Date()).split("-").map(Number);
  return {
    day: d || 1,
    month: m || 1,
    year: Math.min(MAX_LUNAR_YEAR, Math.max(MIN_LUNAR_YEAR, y || 2026)),
  };
}

export function LunarConverterClient() {
  const [mode, setMode] = React.useState<ConversionMode>("solar-to-lunar");
  const initialDate = React.useMemo(() => getTodayInVietnam(), []);
  const [dayInput, setDayInput] = React.useState(String(initialDate.day));
  const [monthInput, setMonthInput] = React.useState(String(initialDate.month));
  const [yearInput, setYearInput] = React.useState(String(initialDate.year));
  const [isLeapMonth, setIsLeapMonth] = React.useState(false);

  const evaluation = React.useMemo<{
    result: LunarConversionResult | null;
    error: string | null;
    dayError?: string;
    monthError?: string;
    yearError?: string;
  }>(() => {
    const day = Number(dayInput.trim());
    const month = Number(monthInput.trim());
    const year = Number(yearInput.trim());

    let dayError: string | undefined;
    let monthError: string | undefined;
    let yearError: string | undefined;

    if (!dayInput.trim() || !Number.isInteger(day) || day < 1 || day > 31) {
      dayError = "Ngày phải là số nguyên từ 1 đến 31.";
    }
    if (!monthInput.trim() || !Number.isInteger(month) || month < 1 || month > 12) {
      monthError = "Tháng phải là số nguyên từ 1 đến 12.";
    }
    if (
      !yearInput.trim() ||
      !Number.isInteger(year) ||
      year < MIN_LUNAR_YEAR ||
      year > MAX_LUNAR_YEAR
    ) {
      yearError = `Năm phải nằm trong khoảng ${MIN_LUNAR_YEAR}–${MAX_LUNAR_YEAR}.`;
    }

    if (dayError || monthError || yearError) {
      return { result: null, error: null, dayError, monthError, yearError };
    }

    if (mode === "solar-to-lunar") {
      if (!isValidSolarDate(day, month, year)) {
        return {
          result: null,
          error: `Ngày ${day}/${month}/${year} không tồn tại trong dương lịch.`,
        };
      }
      return {
        result: convertSolarToLunar(day, month, year),
        error: null,
      };
    }

    const lunarOut = convertLunarToSolar(day, month, year, isLeapMonth);
    if (!lunarOut.ok || !lunarOut.result) {
      return {
        result: null,
        error: lunarOut.error ?? "Không thể quy đổi ngày âm lịch này.",
      };
    }
    return { result: lunarOut.result, error: null };
  }, [dayInput, isLeapMonth, mode, monthInput, yearInput]);

  return (
    <div className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      <section className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-6 lg:col-span-7">
        <div
          role="tablist"
          aria-label="Chọn chiều quy đổi"
          className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-bg p-1.5 sm:grid-cols-2"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "solar-to-lunar"}
            onClick={() => setMode("solar-to-lunar")}
            className={cn(
              "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:text-sm",
              mode === "solar-to-lunar"
                ? "bg-accent text-accent-fg shadow-xs"
                : "text-text hover:bg-surface-alt",
            )}
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>{LUNAR_CONVERTER_COPY.modes.solarToLunar}</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === "lunar-to-solar"}
            onClick={() => setMode("lunar-to-solar")}
            className={cn(
              "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:text-sm",
              mode === "lunar-to-solar"
                ? "bg-accent text-accent-fg shadow-xs"
                : "text-text hover:bg-surface-alt",
            )}
          >
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            <span>{LUNAR_CONVERTER_COPY.modes.lunarToSolar}</span>
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Ngày"
            type="text"
            inputMode="numeric"
            value={dayInput}
            onChange={(e) => setDayInput(e.target.value)}
            error={evaluation.dayError}
          />
          <Input
            label="Tháng"
            type="text"
            inputMode="numeric"
            value={monthInput}
            onChange={(e) => setMonthInput(e.target.value)}
            error={evaluation.monthError}
          />
          <Input
            label="Năm (1900–2100)"
            type="text"
            inputMode="numeric"
            value={yearInput}
            onChange={(e) => setYearInput(e.target.value)}
            error={evaluation.yearError}
          />
        </div>

        {mode === "lunar-to-solar" && (
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5 text-sm text-text">
            <input
              type="checkbox"
              checked={isLeapMonth}
              onChange={(e) => setIsLeapMonth(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-accent"
            />
            <span>Đây là tháng nhuận</span>
          </label>
        )}

        {evaluation.error && (
          <p className="mt-4 rounded-xl border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs text-danger-fg" role="alert">
            {evaluation.error}
          </p>
        )}

        <p className="mt-4 text-xs leading-relaxed text-text-muted">
          {LUNAR_CONVERTER_COPY.timezoneNote}
        </p>
      </section>

      <aside className="min-w-0 rounded-2xl border border-border bg-surface p-4 sm:p-6 lg:col-span-5">
        <h2 className="font-display text-2xl font-semibold text-text">
          Kết quả quy đổi
        </h2>

        {!evaluation.result ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-bg p-5 text-center text-sm text-text-muted">
            Vui lòng nhập ngày hợp lệ trong khoảng 1900–2100 để xem kết quả.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-border bg-bg p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Dương lịch
              </p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-text">
                {String(evaluation.result.solar.day).padStart(2, "0")}/
                {String(evaluation.result.solar.month).padStart(2, "0")}/
                {evaluation.result.solar.year}
              </p>
            </div>

            <div className="rounded-xl border border-accent/40 bg-accent-soft/45 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
                  Âm lịch
                </p>
                {evaluation.result.isLeapMonth && (
                  <span className="rounded-full border border-accent bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-fg">
                    Tháng nhuận
                  </span>
                )}
              </div>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums text-accent-text">
                Ngày {String(evaluation.result.lunarDay).padStart(2, "0")} tháng{" "}
                {String(evaluation.result.lunarMonth).padStart(2, "0")}
                {evaluation.result.isLeapMonth ? " (nhuận)" : ""}, năm{" "}
                {evaluation.result.lunarYear}
              </p>
            </div>

            <dl className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-bg p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-text-muted">Năm Can Chi</dt>
                <dd className="font-semibold text-text">
                  {evaluation.result.yearCanChi}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Con giáp</dt>
                <dd className="font-semibold text-text">
                  {evaluation.result.zodiacAnimal}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Tháng Can Chi</dt>
                <dd className="font-semibold text-text">
                  {evaluation.result.monthCanChi}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Ngày Can Chi</dt>
                <dd className="font-semibold text-text">
                  {evaluation.result.dayCanChi}
                </dd>
              </div>
            </dl>
          </div>
        )}

        <p className="mt-4 rounded-xl border border-border bg-bg px-3.5 py-2.5 text-xs leading-relaxed text-text-muted">
          {LUNAR_CONVERTER_COPY.referenceNote}
        </p>
      </aside>
    </div>
  );
}

