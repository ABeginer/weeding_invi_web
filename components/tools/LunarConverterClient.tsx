"use client";

import * as React from "react";
import { ArrowLeftRight, Calendar } from "lucide-react";
import { SmartToolCta } from "@/components/tools/SmartToolCta";
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

  const solarDayFormatted = evaluation.result
    ? String(evaluation.result.solar.day).padStart(2, "0")
    : "";
  const solarMonthFormatted = evaluation.result
    ? String(evaluation.result.solar.month).padStart(2, "0")
    : "";
  const solarYearFormatted = evaluation.result
    ? String(evaluation.result.solar.year)
    : "";
  const targetDateParam = evaluation.result
    ? `${solarYearFormatted}-${solarMonthFormatted}-${solarDayFormatted}`
    : "";

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      <section className="min-w-0 rounded-2xl border border-[#E8E2D9] bg-white p-5 sm:p-6 shadow-xs lg:col-span-7">
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
            CHỌN CHIỀU QUY ĐỔI
          </p>
          <div
            role="tablist"
            aria-label="Chọn chiều quy đổi"
            className="mt-2 grid grid-cols-1 gap-2 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-1.5 sm:grid-cols-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "solar-to-lunar"}
              onClick={() => setMode("solar-to-lunar")}
              className={cn(
                "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24] sm:text-sm",
                mode === "solar-to-lunar"
                  ? "bg-[#7A1C24] text-white shadow-xs"
                  : "text-[#1F1D1A] hover:bg-white",
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
                "inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24] sm:text-sm",
                mode === "lunar-to-solar"
                  ? "bg-[#7A1C24] text-white shadow-xs"
                  : "text-[#1F1D1A] hover:bg-white",
              )}
            >
              <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
              <span>{LUNAR_CONVERTER_COPY.modes.lunarToSolar}</span>
            </button>
          </div>
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
          <label className="mt-4 inline-flex cursor-pointer items-center gap-2.5 text-sm text-[#1F1D1A]">
            <input
              type="checkbox"
              checked={isLeapMonth}
              onChange={(e) => setIsLeapMonth(e.target.checked)}
              className="h-4 w-4 rounded border-[#E8E2D9] accent-[#7A1C24]"
            />
            <span>Đây là tháng nhuận</span>
          </label>
        )}

        {evaluation.error && (
          <p
            className="mt-4 rounded-xl border border-[#9E3B3B]/30 bg-[#FBEFEF] px-3.5 py-2.5 text-xs text-[#9E3B3B]"
            role="alert"
          >
            {evaluation.error}
          </p>
        )}

        <p className="mt-5 text-xs leading-relaxed text-[#6B655E]">
          {LUNAR_CONVERTER_COPY.timezoneNote}
        </p>
      </section>

      <aside className="min-w-0 space-y-5 lg:sticky lg:top-20 lg:col-span-5">
        <div className="rounded-2xl border border-[#E8E2D9] bg-[#F4EFEA] p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
              KẾT QUẢ TRA CỨU
            </p>
            <h2 className="font-serif text-2xl font-medium text-[#1F1D1A]">
              Kết quả quy đổi
            </h2>
          </div>

          {!evaluation.result ? (
            <div className="mt-4 rounded-xl border border-dashed border-[#E8E2D9] bg-white p-5 text-center text-sm text-[#6B655E]">
              Vui lòng nhập ngày hợp lệ trong khoảng 1900–2100 để xem kết quả.
            </div>
          ) : (
            <div className="mt-4 space-y-3.5">
              <div className="rounded-xl border border-[#E8E2D9] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B655E]">
                  Dương lịch
                </p>
                <p className="mt-1 font-serif text-2xl font-medium tabular-nums text-[#1F1D1A]">
                  {solarDayFormatted}/{solarMonthFormatted}/{solarYearFormatted}
                </p>
              </div>

              <div className="rounded-xl border border-[#7A1C24]/30 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6B655E]">
                    Âm lịch
                  </p>
                  {evaluation.result.isLeapMonth && (
                    <span className="rounded-full bg-[#7A1C24] px-2.5 py-0.5 text-[11px] font-semibold text-white">
                      Tháng nhuận
                    </span>
                  )}
                </div>
                <p className="mt-1 font-serif text-2xl font-normal tabular-nums text-[#7A1C24]">
                  Ngày {String(evaluation.result.lunarDay).padStart(2, "0")} tháng{" "}
                  {String(evaluation.result.lunarMonth).padStart(2, "0")}
                  {evaluation.result.isLeapMonth ? " (nhuận)" : ""}, năm{" "}
                  {evaluation.result.lunarYear}
                </p>
              </div>

              <dl className="grid grid-cols-1 gap-2.5 rounded-xl border border-[#E8E2D9] bg-white p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-[#6B655E]">Năm Can Chi</dt>
                  <dd className="font-serif text-base font-semibold text-[#1F1D1A]">
                    {evaluation.result.yearCanChi}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#6B655E]">Con giáp</dt>
                  <dd className="font-serif text-base font-semibold text-[#1F1D1A]">
                    {evaluation.result.zodiacAnimal}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#6B655E]">Tháng Can Chi</dt>
                  <dd className="font-serif text-base font-semibold text-[#1F1D1A]">
                    {evaluation.result.monthCanChi}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#6B655E]">Ngày Can Chi</dt>
                  <dd className="font-serif text-base font-semibold text-[#1F1D1A]">
                    {evaluation.result.dayCanChi}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          <p className="mt-4 rounded-xl border border-[#E8E2D9] bg-white px-3.5 py-2.5 text-xs leading-relaxed text-[#6B655E]">
            {LUNAR_CONVERTER_COPY.referenceNote}
          </p>
        </div>

        {/* Smart Contextual CTA: Lưu ngày trọng đại */}
        <div>
          {evaluation.result ? (
            <SmartToolCta
              eyebrow="LƯU NGÀY TRỌNG ĐẠI"
              title={`Đã chọn được ngày đẹp ${solarDayFormatted}/${solarMonthFormatted}/${solarYearFormatted}?`}
              description="Xem thử ngày cưới này hiển thị trên thiệp cưới online kèm đồng hồ đếm ngược và bản đồ chỉ đường sẽ tinh tế như thế nào."
              buttonText={`Thử tạo thiệp với ngày ${solarDayFormatted}/${solarMonthFormatted}/${solarYearFormatted} →`}
              buttonHref={`/tao-thiep?date=${targetDateParam}`}
            />
          ) : (
            <SmartToolCta
              eyebrow="LƯU NGÀY TRỌNG ĐẠI"
              title="Chọn ngày lành tháng tốt cho ngày cưới?"
              description="Khởi tạo thiệp cưới online miễn phí để gửi thiệp sớm cho bạn bè, người thân kèm đồng hồ đếm ngược đến ngày trọng đại."
              buttonText="Tạo thiệp cưới online miễn phí →"
              buttonHref="/tao-thiep"
            />
          )}
        </div>
      </aside>
    </div>
  );
}
