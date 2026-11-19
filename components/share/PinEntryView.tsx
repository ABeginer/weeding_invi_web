"use client";

import * as React from "react";
import { KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { verifySharePin } from "@/lib/api";
import { cn } from "@/lib/utils";

interface PinEntryViewProps {
  slug: string;
  coupleTitle?: string;
  onSuccess?: () => void;
}

export function PinEntryView({ slug, coupleTitle, onSuccess }: PinEntryViewProps) {
  const [digits, setDigits] = React.useState<string[]>(["", "", "", ""]);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [shake, setShake] = React.useState(false);

  const inputRefs = [
    React.useRef<HTMLInputElement | null>(null),
    React.useRef<HTMLInputElement | null>(null),
    React.useRef<HTMLInputElement | null>(null),
    React.useRef<HTMLInputElement | null>(null),
  ];

  React.useEffect(() => {
    inputRefs[0].current?.focus();
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleDigitChange = (index: number, value: string) => {
    setError(null);
    const cleaned = value.replace(/\D/g, "");

    // Xử lý paste chuỗi (vd paste "1234")
    if (cleaned.length > 1) {
      const nextDigits = [...digits];
      for (let i = 0; i < 4 && i < cleaned.length; i++) {
        nextDigits[i] = cleaned[i];
      }
      setDigits(nextDigits);
      const nextFocus = Math.min(cleaned.length, 3);
      inputRefs[nextFocus].current?.focus();

      if (nextDigits.every((d) => d.length === 1)) {
        void submitPin(nextDigits.join(""));
      }
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleaned ? cleaned.slice(-1) : "";
    setDigits(nextDigits);

    if (cleaned && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    if (nextDigits.every((d) => d.length === 1)) {
      void submitPin(nextDigits.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const submitPin = async (pinValue: string) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await verifySharePin(slug, pinValue);
      if (res.ok) {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.reload();
        }
      } else {
        setError(res.error || "Mã PIN không chính xác.");
        triggerShake();
        setDigits(["", "", "", ""]);
        inputRefs[0].current?.focus();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Mã PIN không chính xác. Vui lòng thử lại.",
      );
      triggerShake();
      setDigits(["", "", "", ""]);
      inputRefs[0].current?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#FAF8F5] px-4 py-12 text-[#1F1D1A]">
      <div
        className={cn(
          "w-full max-w-md rounded-3xl border border-[#E8E2D9] bg-white p-8 text-center shadow-xl transition-transform",
          shake && "animate-shake",
        )}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7A1C24]/10 text-[#7A1C24]">
          <KeyRound className="h-8 w-8" />
        </div>

        <span className="mt-5 inline-block rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-3 py-0.5 text-[10px] font-bold tracking-widest text-[#B89B72] uppercase">
          QUYỀN TRỢ LÝ &amp; GIA ĐÌNH
        </span>

        <h1 className="mt-3 font-serif text-2xl font-bold text-[#1F1D1A]">
          {coupleTitle ? `Tiệc cưới ${coupleTitle}` : "Cổng trợ lý tiệc cưới"}
        </h1>

        <p className="mt-2 text-xs leading-relaxed text-[#6B655E]">
          Nhập mã PIN 4 chữ số do cô dâu chú rể cung cấp để duyệt ảnh Photo Wall và xem thống kê khách mời.
        </p>

        {/* 4 Digit Inputs */}
        <div className="mt-8 flex justify-center gap-3.5">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={submitting}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={cn(
                "h-16 w-14 rounded-2xl border-2 text-center font-mono text-2xl font-bold transition-all focus:outline-none",
                error
                  ? "border-[#9E3B3B] bg-[#9E3B3B]/5 text-[#9E3B3B]"
                  : digit
                    ? "border-[#7A1C24] bg-[#FAF8F5] text-[#7A1C24] shadow-xs"
                    : "border-[#E8E2D9] bg-white text-[#1F1D1A] focus:border-[#B89B72] focus:ring-2 focus:ring-[#B89B72]/20",
              )}
            />
          ))}
        </div>

        {error && (
          <p className="mt-4 text-xs font-medium text-[#9E3B3B] animate-fade-in">
            {error}
          </p>
        )}

        <div className="mt-8">
          <button
            type="button"
            disabled={submitting || digits.some((d) => !d)}
            onClick={() => submitPin(digits.join(""))}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-[#7A1C24] bg-[#7A1C24] px-6 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#5E141B] disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span>Xác thực &amp; Mở trang trợ lý</span>
          </button>
        </div>

        <div className="mt-6 border-t border-[#E8E2D9]/70 pt-4 text-[11px] text-[#6B655E]">
          Mã PIN được lưu an toàn trong trình duyệt của bạn trong vòng 7 ngày.
        </div>
      </div>
    </main>
  );
}
