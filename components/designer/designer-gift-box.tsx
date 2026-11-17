"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import type { TemplateData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DesignerGiftBoxProps {
  gift: TemplateData["gift"];
  accentColor?: string;
  textColor?: string;
  mutedColor?: string;
  fontFamily?: string;
}

/** Hộp quà mừng dạng minh hoạ, không mở modal; thông tin chuyển khoản ở ngay dưới. */
export function DesignerGiftBox({
  gift,
  accentColor = "#B35A6B",
  textColor = "#4A2430",
  mutedColor = "#8E6A62",
  fontFamily = "var(--font-playfair)",
}: DesignerGiftBoxProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [copied, setCopied] = React.useState<string | null>(null);
  React.useEffect(() => setMounted(true), []);
  const sides = [
    {
      title: gift.groomAccountLabel?.trim() || "Tài khoản Nhà ...",
      bank: gift.groomBankName,
      account: gift.groomAccountNumber,
      name: gift.groomAccountName,
      qr: gift.groomQrUrl,
      enabled: true,
    },
    {
      title: gift.brideAccountLabel?.trim() || "Tài khoản Nhà ...",
      bank: gift.brideBankName,
      account: gift.brideAccountNumber,
      name: gift.brideAccountName,
      qr: gift.brideQrUrl,
      enabled: gift.brideAccountEnabled !== false,
    },
  ].filter((side) => side.enabled);
  return (
    <section id="wedding-gift-section" className="px-3 py-6">
      <div
        className="rounded-[26px] border px-5 py-6 text-center"
        style={{ borderColor: `${accentColor}44`, color: textColor }}
      >
        <p
          className="text-[9px] font-semibold uppercase tracking-[0.26em]"
          style={{ color: mutedColor }}
        >
          Mừng cưới trực tuyến
        </p>
        <h2 className="mt-1 text-2xl font-semibold sm:text-3xl" style={{ color: textColor, fontFamily }}>
          Hộp quà mừng
        </h2>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label="Mở hộp quà mừng"
          className="mx-auto block cursor-pointer rounded-[22px] p-2 transition-transform hover:scale-[1.03] active:scale-95"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/templates/hoa-anh-dao-v2/gift-box.webp"
            alt="Hộp quà mừng"
            className="h-32 w-32 object-contain drop-shadow-[0_12px_18px_rgba(155,63,80,0.18)]"
          />
        </button>

        <p className="mt-1 text-[10px] font-medium" style={{ color: mutedColor }}>
          Nhấn vào hộp quà để mở thiệp mừng
        </p>

        <p className="mx-auto mt-1 max-w-[280px] text-[11px] leading-relaxed" style={{ color: mutedColor }}>
          Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi.
        </p>

        {open && mounted && createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Hộp quà mừng"
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div
              className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-[28px] border p-5 text-center shadow-2xl"
              style={{
                backgroundColor: "#FFF9F6",
                borderColor: `${accentColor}44`,
                color: textColor,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-left">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.24em]" style={{ color: mutedColor }}>
                    Mừng cưới trực tuyến
                  </p>
                  <h3 className="mt-1 text-xl font-semibold" style={{ color: textColor, fontFamily }}>
                    Hộp quà mừng
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full border px-3 py-1.5 text-[11px] font-semibold"
                  style={{ borderColor: `${accentColor}55`, color: textColor }}
                >
                  Đóng
                </button>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed" style={{ color: mutedColor }}>
                Quét QR hoặc dùng thông tin tài khoản bên dưới để gửi lời chúc mừng.
              </p>

              <div
                className={cn(
                  "mt-4 grid gap-2 text-left",
                  sides.length > 1 ? "grid-cols-2" : "grid-cols-1",
                )}
              >
                {sides.map((side) => (
                  <div
                    key={side.title}
                    className="rounded-xl border p-2.5"
                    style={{ borderColor: `${accentColor}33`, backgroundColor: `${accentColor}0d` }}
                  >
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
                      {side.title}
                    </p>
                    {side.qr && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={side.qr}
                        alt={`QR ${side.title}`}
                        className="mx-auto mt-1.5 h-24 w-24 rounded object-contain"
                      />
                    )}
                    <p className="mt-1.5 text-[10px] font-semibold" style={{ color: textColor }}>
                      {side.bank}
                    </p>
                    <p className="text-[10px] tabular-nums" style={{ color: mutedColor }}>
                      {side.account}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(side.account);
                          setCopied(side.account);
                          window.setTimeout(() => setCopied(null), 1500);
                        } catch {
                          setCopied(null);
                        }
                      }}
                      className="mt-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold"
                      style={{ borderColor: `${accentColor}55`, color: textColor }}
                    >
                      {copied === side.account ? "Đã chép" : "Sao chép STK"}
                    </button>
                    <p className="text-[8px] uppercase" style={{ color: mutedColor }}>
                      {side.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          ,
          document.body
        )}
      </div>
    </section>
  );
}
