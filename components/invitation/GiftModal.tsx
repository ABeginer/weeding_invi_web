"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Download, Gift, HeartHandshake, X } from "lucide-react";
import { invitationThemeCssVars, landingThemeCssVars } from "@/lib/theme";
import type { TemplateData, WeddingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

export type GiftTone = "olive" | "minimal" | "sunset" | "obsidian";

interface GiftFloatingTriggerProps {
  visible: boolean;
  onClick: () => void;
  tone?: GiftTone;
  contained?: boolean;
}

export function GiftFloatingTrigger({
  visible,
  onClick,
  tone = "olive",
  contained = false,
}: GiftFloatingTriggerProps) {
  if (!visible) return null;

  const toneClasses: Record<GiftTone, string> = {
    olive:
      "border-inv-olive/45 bg-inv-cream text-inv-olive-deep shadow-md hover:bg-inv-tint focus-visible:ring-inv-olive-deep",
    minimal:
      "border-stone-400 bg-stone-50 text-stone-900 shadow-md hover:bg-stone-100 focus-visible:ring-stone-700",
    sunset:
      "border-rose-300 bg-rose-50 text-rose-950 shadow-md hover:bg-rose-100 focus-visible:ring-rose-800",
    obsidian:
      "border-lnd-gold-soft bg-lnd-bg text-lnd-gold shadow-lg hover:border-lnd-gold focus-visible:ring-lnd-gold",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Gửi lời chúc & quà mừng"
      className={cn(
        "fixed z-40 inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
        contained
          ? "bottom-3 left-3"
          : "bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-3 sm:bottom-6 sm:left-6",
        toneClasses[tone],
      )}
    >
      <Gift className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="sm:hidden">Quà mừng</span>
      <span className="hidden sm:inline">Gửi lời chúc &amp; quà mừng</span>
    </button>
  );
}

interface GiftModalProps {
  open: boolean;
  onClose: () => void;
  gift: TemplateData["gift"];
  plan: WeddingPlan;
  tone?: GiftTone;
  wishAnchorId?: string;
}

interface GiftSideData {
  id: "groom" | "bride";
  title: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  qrUrl: string | null;
}

async function copyTextSafe(value: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

export function GiftModal({
  open,
  onClose,
  gift,
  plan,
  tone = "olive",
  wishAnchorId,
}: GiftModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [copiedSide, setCopiedSide] = React.useState<"groom" | "bride" | null>(
    null,
  );
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const allowQrImages = plan !== "free";

  const sides: GiftSideData[] = (
    [
      {
        id: "groom" as const,
        title: "Nhà trai · Chú rể",
        bankName: gift.groomBankName.trim(),
        accountName: gift.groomAccountName.trim(),
        accountNumber: gift.groomAccountNumber.trim(),
        qrUrl: allowQrImages ? gift.groomQrUrl : null,
      },
      {
        id: "bride" as const,
        title: "Nhà gái · Cô dâu",
        bankName: gift.brideBankName.trim(),
        accountName: gift.brideAccountName.trim(),
        accountNumber: gift.brideAccountNumber.trim(),
        qrUrl: allowQrImages ? gift.brideQrUrl : null,
      },
    ] satisfies GiftSideData[]
  ).filter(
    (side) =>
      Boolean(
        side.bankName ||
          side.accountName ||
          side.accountNumber ||
          side.qrUrl,
      ),
  );

  const toneTheme =
    tone === "obsidian"
      ? {
          panel: "border-lnd-border bg-lnd-surface text-lnd-body",
          subcard: "border-lnd-border bg-lnd-bg text-lnd-body",
          heading: "text-lnd-gold",
          muted: "text-lnd-muted",
          copyBtn:
            "border-lnd-gold bg-lnd-gold text-lnd-bg hover:bg-lnd-gold-bright",
          outlineBtn:
            "border-lnd-gold-soft bg-transparent text-lnd-body hover:border-lnd-gold hover:text-lnd-gold",
          closeBtn:
            "border-lnd-border bg-lnd-bg text-lnd-muted hover:border-lnd-gold hover:text-lnd-gold",
          ring: "focus-visible:ring-lnd-gold",
        }
      : tone === "sunset"
        ? {
            panel: "border-rose-200 bg-orange-50 text-rose-950",
            subcard: "border-rose-200 bg-white text-rose-950",
            heading: "text-rose-900",
            muted: "text-rose-800/80",
            copyBtn: "border-rose-900 bg-rose-900 text-white hover:bg-rose-950",
            outlineBtn:
              "border-rose-300 bg-white text-rose-900 hover:bg-rose-50",
            closeBtn:
              "border-rose-200 bg-white text-rose-900 hover:bg-rose-100",
            ring: "focus-visible:ring-rose-800",
          }
        : tone === "minimal"
          ? {
              panel: "border-stone-300 bg-stone-50 text-stone-900",
              subcard: "border-stone-200 bg-white text-stone-900",
              heading: "text-amber-900",
              muted: "text-stone-600",
              copyBtn:
                "border-stone-900 bg-stone-900 text-stone-50 hover:bg-stone-800",
              outlineBtn:
                "border-stone-300 bg-white text-stone-800 hover:bg-stone-100",
              closeBtn:
                "border-stone-300 bg-white text-stone-700 hover:bg-stone-100",
              ring: "focus-visible:ring-stone-700",
            }
          : {
              panel: "border-inv-olive/30 bg-inv-paper text-inv-ink",
              subcard: "border-inv-olive/25 bg-inv-bg text-inv-ink",
              heading: "text-inv-olive-deep",
              muted: "text-inv-muted",
              copyBtn:
                "border-inv-olive-btn bg-inv-olive-btn text-white hover:bg-inv-olive-hover",
              outlineBtn:
                "border-inv-olive/45 bg-inv-bg text-inv-olive-deep hover:bg-inv-tint",
              closeBtn:
                "border-inv-olive/30 bg-inv-bg text-inv-olive-deep hover:bg-inv-tint",
              ring: "focus-visible:ring-inv-olive-deep",
            };

  const portalThemeStyle: React.CSSProperties | undefined =
    tone === "obsidian"
      ? (landingThemeCssVars as React.CSSProperties)
      : tone === "olive"
        ? (invitationThemeCssVars as React.CSSProperties)
        : undefined;

  const handleCopyAccount = async (side: GiftSideData) => {
    if (!side.accountNumber) return;
    await copyTextSafe(side.accountNumber);
    setCopiedSide(side.id);
    window.setTimeout(() => {
      setCopiedSide((prev) => (prev === side.id ? null : prev));
    }, 1800);
  };

  const handleJumpToWish = () => {
    onClose();
    if (!wishAnchorId) return;
    window.setTimeout(() => {
      const target = document.getElementById(wishAnchorId);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  return createPortal(
    <div
      style={portalThemeStyle}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gift-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "relative max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-2xl border p-5 shadow-2xl sm:p-6",
          toneTheme.panel,
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-current/15 pb-4">
          <div>
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.18em]",
                toneTheme.heading,
              )}
            >
              Mừng Cưới Trực Tuyến
            </p>
            <h2
              id="gift-modal-title"
              className={cn(
                "mt-1 font-display text-2xl font-semibold sm:text-3xl",
                toneTheme.heading,
              )}
            >
              Gửi Lời Chúc &amp; Quà Mừng
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp quà mừng"
            className={cn(
              "inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2",
              toneTheme.closeBtn,
              toneTheme.ring,
            )}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className={cn("mt-3 text-xs leading-relaxed sm:text-sm", toneTheme.muted)}>
          Tấm lòng và lời chúc phúc của bạn là món quà trân quý nhất đối với hai gia đình.
        </p>

        {sides.length === 0 ? (
          <div
            className={cn(
              "mt-5 rounded-xl border p-6 text-center text-sm",
              toneTheme.subcard,
              toneTheme.muted,
            )}
          >
            Cô dâu &amp; chú rể chưa cập nhật thông tin mừng cưới.
          </div>
        ) : (
          <div
            className={cn(
              "mt-5 grid gap-4",
              sides.length > 1 ? "sm:grid-cols-2" : "grid-cols-1",
            )}
          >
            {sides.map((side) => {
              const isCopied = copiedSide === side.id;
              return (
                <div
                  key={side.id}
                  className={cn(
                    "flex flex-col justify-between rounded-xl border p-4",
                    toneTheme.subcard,
                  )}
                >
                  <div className="space-y-2.5">
                    <h3
                      className={cn(
                        "text-xs font-semibold uppercase tracking-[0.14em]",
                        toneTheme.heading,
                      )}
                    >
                      {side.title}
                    </h3>

                    {side.qrUrl && (
                      <div className="mx-auto w-40 overflow-hidden rounded-xl border border-current/15 bg-white p-2">
                        <img
                          src={side.qrUrl}
                          alt={`Mã QR chuyển khoản ${side.title}`}
                          width={160}
                          height={160}
                          className="aspect-square h-auto w-full object-contain"
                        />
                      </div>
                    )}

                    <dl className="space-y-1 text-xs sm:text-sm">
                      {side.bankName && (
                        <div>
                          <dt className={cn("text-[11px]", toneTheme.muted)}>
                            Ngân hàng
                          </dt>
                          <dd className="font-semibold">{side.bankName}</dd>
                        </div>
                      )}
                      {side.accountName && (
                        <div>
                          <dt className={cn("text-[11px]", toneTheme.muted)}>
                            Chủ tài khoản
                          </dt>
                          <dd className="font-medium">{side.accountName}</dd>
                        </div>
                      )}
                      {side.accountNumber && (
                        <div>
                          <dt className={cn("text-[11px]", toneTheme.muted)}>
                            Số tài khoản
                          </dt>
                          <dd className="font-mono text-sm font-semibold tracking-wide">
                            {side.accountNumber}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {side.accountNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopyAccount(side)}
                        className={cn(
                          "inline-flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
                          toneTheme.copyBtn,
                          toneTheme.ring,
                        )}
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>
                          {isCopied ? "Đã sao chép STK" : "Sao chép số tài khoản"}
                        </span>
                      </button>
                    )}

                    {side.qrUrl && (
                      <a
                        href={side.qrUrl}
                        download={`qr-${side.id}.webp`}
                        className={cn(
                          "inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
                          toneTheme.outlineBtn,
                          toneTheme.ring,
                        )}
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
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-current/15 pt-4">
          {wishAnchorId ? (
            <button
              type="button"
              onClick={handleJumpToWish}
              className={cn(
                "inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-4 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
                toneTheme.outlineBtn,
                toneTheme.ring,
              )}
            >
              <HeartHandshake className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Viết lời chúc</span>
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex h-9 cursor-pointer items-center justify-center rounded-full border px-5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
              toneTheme.outlineBtn,
              toneTheme.ring,
            )}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
