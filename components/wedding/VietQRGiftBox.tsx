"use client";

import * as React from "react";
import { Check, Copy, Download, QrCode } from "lucide-react";
import { buildVietQrQuickLink, toAsciiTransferText } from "@/lib/vietqr-link";

export interface VietQrGiftSide {
  id: "groom" | "bride" | string;
  label: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

interface VietQRGiftBoxProps {
  coupleName: string;
  guestName?: string | null;
  amountVnd?: number;
  sides: VietQrGiftSide[];
  isDark?: boolean;
}

async function copyTextSafe(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    throw new Error("Clipboard API unavailable");
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }
}

export function VietQRGiftBox({
  coupleName,
  guestName,
  amountVnd,
  sides,
  isDark = false,
}: VietQRGiftBoxProps) {
  const [copiedSide, setCopiedSide] = React.useState<string | null>(null);
  const [copyFailedSide, setCopyFailedSide] = React.useState<string | null>(null);
  const [copiedNote, setCopiedNote] = React.useState(false);

  const usable = sides.filter((side) => side.bankName && side.accountNumber);
  if (usable.length === 0) return null;

  const transferInfo = toAsciiTransferText(
    `${guestName?.trim() ? `${guestName.trim()} ` : ""}chuc mung hanh phuc ${coupleName}`,
  ).slice(0, 50);

  const copyAccount = async (side: VietQrGiftSide) => {
    const ok = await copyTextSafe(side.accountNumber);
    if (ok) {
      setCopyFailedSide(null);
      setCopiedSide(side.id);
      window.setTimeout(() => setCopiedSide((prev) => (prev === side.id ? null : prev)), 2000);
    } else {
      setCopyFailedSide(side.id);
    }
  };

  const copyTransferNote = async () => {
    const ok = await copyTextSafe(transferInfo);
    if (ok) {
      setCopiedNote(true);
      window.setTimeout(() => setCopiedNote(false), 2000);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div
        className={
          isDark
            ? "flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-amber-300"
            : "flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-[#7A1C24]"
        }
      >
        <QrCode className="h-4 w-4" aria-hidden="true" />
        <span>Chuyển khoản nhanh bằng VietQR</span>
      </div>

      <div className={usable.length > 1 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3 grid-cols-1"}>
        {usable.map((side) => {
          const qrUrl = buildVietQrQuickLink({
            bankName: side.bankName,
            accountNumber: side.accountNumber,
            accountName: side.accountName,
            amountVnd,
            addInfo: transferInfo,
          });

          return (
            <div
              key={side.id}
              className="flex flex-col justify-between rounded-xl border border-[#E8E2D9] bg-white p-3.5 shadow-sm text-[#1F1D1A]"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#7A1C24]">
                  {side.label}
                </p>

                {/* Explicit account details */}
                <dl className="mt-2 space-y-1 text-xs">
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-[11px] text-[#6B655E]">Ngân hàng:</dt>
                    <dd className="font-semibold text-[#1F1D1A] text-right truncate">
                      {side.bankName}
                    </dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <dt className="text-[11px] text-[#6B655E]">Số tài khoản:</dt>
                    <dd className="select-all font-mono font-semibold text-[#1F1D1A] text-right tracking-wider">
                      {side.accountNumber}
                    </dd>
                  </div>
                  {side.accountName && (
                    <div className="flex items-baseline justify-between gap-2">
                      <dt className="text-[11px] text-[#6B655E]">Chủ tài khoản:</dt>
                      <dd className="font-medium uppercase text-[#1F1D1A] text-right truncate">
                        {side.accountName}
                      </dd>
                    </div>
                  )}
                </dl>

                {qrUrl ? (
                  <div className="mt-3">
                    <a
                      href={qrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block overflow-hidden rounded-lg border border-[#E8E2D9] bg-[#FAF8F5] transition-opacity hover:opacity-95"
                      aria-label={`Mở mã VietQR ${side.label}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrUrl}
                        alt={`Mã VietQR ${side.label}`}
                        width={360}
                        height={480}
                        loading="lazy"
                        className="h-auto w-full object-contain"
                      />
                    </a>
                    <p className="mt-1.5 text-center text-[10px] text-[#6B655E]">
                      Trên iPhone / Zalo: nhấn giữ ảnh QR để lưu về máy
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg border border-dashed border-[#E8E2D9] bg-[#FAF8F5] p-3 text-[11px] leading-relaxed text-[#6B655E]">
                    Mã QR tự động chưa khả dụng cho ngân hàng này — quý khách vui lòng sao chép số tài khoản bên dưới để chuyển khoản.
                  </p>
                )}
              </div>

              <div className="mt-3 space-y-1.5 pt-2 border-t border-[#E8E2D9]/60">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyAccount(side)}
                    className="inline-flex h-9 flex-1 cursor-pointer touch-manipulation select-none items-center justify-center gap-1.5 rounded-full border border-[#7A1C24] bg-[#7A1C24] px-3 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]/30"
                  >
                    {copiedSide === side.id ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                    <span>{copiedSide === side.id ? "Đã chép STK" : "Sao chép STK"}</span>
                  </button>
                  {qrUrl && (
                    <a
                      href={qrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-3 text-xs font-medium text-[#1F1D1A] transition-colors hover:bg-[#F4EFEA] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]/30 touch-manipulation"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Tải ảnh QR</span>
                    </a>
                  )}
                </div>
                {copyFailedSide === side.id && (
                  <p className="text-center text-[10px] text-[#7A1C24]">
                    Chạm giữ vào số tài khoản phía trên để sao chép thủ công.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div
        className={
          isDark
            ? "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] leading-relaxed text-white/80"
            : "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3 py-2 text-[11px] leading-relaxed text-[#6B655E]"
        }
      >
        <p className="min-w-0 flex-1">
          Nội dung chuyển khoản gợi ý:{" "}
          <strong className={isDark ? "select-all font-semibold text-white" : "select-all font-semibold text-[#1F1D1A]"}>
            {transferInfo}
          </strong>
        </p>
        <button
          type="button"
          onClick={copyTransferNote}
          className={
            isDark
              ? "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 text-[11px] font-medium text-white transition-colors hover:bg-white/20"
              : "inline-flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[#E8E2D9] bg-white px-2.5 text-[11px] font-medium text-[#1F1D1A] transition-colors hover:bg-[#F4EFEA]"
          }
        >
          {copiedNote ? (
            <Check className="h-3 w-3" aria-hidden="true" />
          ) : (
            <Copy className="h-3 w-3" aria-hidden="true" />
          )}
          <span>{copiedNote ? "Đã chép" : "Sao chép nội dung CK"}</span>
        </button>
      </div>
    </div>
  );
}
