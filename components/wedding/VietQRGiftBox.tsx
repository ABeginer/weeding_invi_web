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
    try {
      await navigator.clipboard.writeText(side.accountNumber);
      setCopiedSide(side.id);
      window.setTimeout(() => setCopiedSide(null), 1800);
    } catch {
      setCopiedSide(null);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] uppercase opacity-80">
        <QrCode className="h-3.5 w-3.5" aria-hidden="true" />
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
              className="rounded-xl border border-border bg-surface p-3 text-text"
            >
              <p className="text-xs font-semibold text-text">{side.label}</p>
              <p className="mt-0.5 text-[11px] text-text-muted">
                {side.bankName} · {side.accountNumber}
              </p>

              {qrUrl ? (
                <a
                  href={qrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block overflow-hidden rounded-lg border border-border bg-bg"
                  aria-label={`Mở mã VietQR ${side.label}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={qrUrl}
                    alt={`Mã VietQR ${side.label}`}
                    width={360}
                    height={480}
                    loading="lazy"
                    className="h-auto w-full"
                  />
                </a>
              ) : (
                <p className="mt-2 rounded-lg border border-dashed border-border p-3 text-[11px] text-text-muted">
                  Chưa nhận diện được ngân hàng “{side.bankName}”. Nhập mã ngân hàng
                  (vcb, tcb, mb…) trong phần Quà mừng để tạo QR.
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => copyAccount(side)}
                  className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[11px] font-semibold text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {copiedSide === side.id ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {copiedSide === side.id ? "Đã chép STK" : "Sao chép STK"}
                </button>
                {qrUrl && (
                  <a
                    href={qrUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-[11px] font-semibold text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Tải ảnh QR
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[11px] leading-relaxed text-text-muted">
        Nội dung chuyển khoản gợi ý: <strong className="font-semibold">{transferInfo}</strong>
      </p>
    </div>
  );
}
