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
}: VietQRGiftBoxProps) {
  const [copiedSide, setCopiedSide] = React.useState<string | null>(null);

  const usable = sides.filter((side) => side.bankName && side.accountNumber);
  if (usable.length === 0) return null;

  const transferInfo = toAsciiTransferText(
    `${guestName?.trim() ? `${guestName.trim()} ` : ""}chuc mung hanh phuc ${coupleName}`,
  ).slice(0, 50);

  const copyAccount = async (side: VietQrGiftSide) => {
    const ok = await copyTextSafe(side.accountNumber);
    if (ok) {
      setCopiedSide(side.id);
      window.setTimeout(() => setCopiedSide(null), 2000);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase text-[#7A1C24]">
        <QrCode className="h-4 w-4" aria-hidden="true" />
        <span>Chuyển khoản nhanh bằng VietQR</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
                    <dd className="font-mono font-semibold text-[#1F1D1A] text-right tracking-wider">
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
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 block overflow-hidden rounded-lg border border-[#E8E2D9] bg-[#FAF8F5] transition-opacity hover:opacity-95"
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
                ) : (
                  <p className="mt-3 rounded-lg border border-dashed border-[#E8E2D9] p-3 text-[11px] text-[#6B655E]">
                    Chưa nhận diện được ngân hàng “{side.bankName}”. Nhập mã ngân hàng
                    (vcb, tcb, mb…) trong phần Quà mừng để tạo QR.
                  </p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-[#E8E2D9]/60">
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
            </div>
          );
        })}
      </div>

      <p className="text-[11px] leading-relaxed text-[#6B655E]">
        Nội dung chuyển khoản gợi ý: <strong className="font-semibold text-[#1F1D1A]">{transferInfo}</strong>
      </p>
    </div>
  );
}
