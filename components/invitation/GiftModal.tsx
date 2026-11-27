"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Download, HeartHandshake, X } from "lucide-react";
import { invitationThemeCssVars, landingThemeCssVars } from "@/lib/theme";
import type { TemplateData, WeddingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { VietQRGiftBox } from "@/components/wedding/VietQRGiftBox";

export type GiftTone = "olive" | "minimal" | "sunset" | "obsidian" | "red" | "velvet" | "ruby" | "minred" | "minbrown" | "flowery";

interface GiftModalProps {
  open: boolean;
  onClose: () => void;
  gift: TemplateData["gift"];
  plan: WeddingPlan;
  coupleName?: string;
  guestName?: string | null;
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

async function copyTextSafe(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
    throw new Error("Clipboard unavailable");
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

export function GiftModal({
  open,
  onClose,
  gift,
  plan,
  coupleName = "",
  guestName = null,
  tone = "olive",
  wishAnchorId,
}: GiftModalProps) {
  const [mounted, setMounted] = React.useState(false);
  const [copiedSide, setCopiedSide] = React.useState<"groom" | "bride" | null>(
    null,
  );
  const [copyFailedSide, setCopyFailedSide] = React.useState<"groom" | "bride" | null>(
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

    try {
      window.dispatchEvent(
        new CustomEvent("inviwedd:modal-state", { detail: { isOpen: true } }),
      );
    } catch {}

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      try {
        window.dispatchEvent(
          new CustomEvent("inviwedd:modal-state", { detail: { isOpen: false } }),
        );
      } catch {}
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

  /** VietQR tự sinh = tính năng Pro/VIP; Free chỉ được xem số tài khoản.
      Bên nào đã có ảnh QR tự tải thì không sinh VietQR cho bên đó nữa. */
  const vietQrSides =
    allowQrImages && coupleName
      ? sides.filter(
          (side) => !side.qrUrl && Boolean(side.bankName) && Boolean(side.accountNumber),
        )
      : [];
  const vietQrSideIds = new Set(vietQrSides.map((s) => s.id));
  // Không lặp lại thẻ tài khoản đã có trong VietQRGiftBox
  const manualSides = sides.filter((side) => !vietQrSideIds.has(side.id));
  const showVietQr = vietQrSides.length > 0;
  const isDarkTone =
    tone === "obsidian" || tone === "minred" || tone === "ruby" || tone === "velvet";

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
          : tone === "red"
            ? {
                panel: "border-[#c9a24a] bg-[#fff7eb] text-[#4a1010]",
                subcard: "border-[#e0cba4] bg-white text-[#4a1010]",
                heading: "text-[#800000]",
                muted: "text-[#8a6a63]",
                copyBtn:
                  "border-[#800000] bg-[#800000] text-[#ffeed2] hover:bg-[#5c0000]",
                outlineBtn:
                  "border-[#c9a24a] bg-white text-[#800000] hover:bg-[#fff1dd]",
                closeBtn:
                  "border-[#e0cba4] bg-white text-[#800000] hover:bg-[#fff1dd]",
                ring: "focus-visible:ring-[#800000]",
              }
            : tone === "flowery"
              ? {
                  panel: "border-[#464E25]/30 bg-[#FDFAF5] text-[#595638]",
                  subcard: "border-[#464E25]/20 bg-white text-[#595638]",
                  heading: "text-[#464E25]",
                  muted: "text-[#8A8460]",
                  copyBtn: "border-[#464E25] bg-[#464E25] text-[#FDFAF5] hover:bg-[#3A411E]",
                  outlineBtn: "border-[#464E25]/55 bg-transparent text-[#464E25] hover:bg-[#F1EEE2]",
                  closeBtn: "border-[#464E25]/30 bg-white text-[#464E25] hover:bg-[#F1EEE2]",
                  ring: "focus-visible:ring-[#464E25]",
                }
              : tone === "minbrown"
              ? {
                  panel: "border-[#A76B43]/35 bg-[#F7F7F8] text-[#5B3B26]",
                  subcard: "border-[#A76B43]/25 bg-white text-[#5B3B26]",
                  heading: "text-[#7E4E2E]",
                  muted: "text-[#9A7A63]",
                  copyBtn: "border-[#A76B43] bg-[#A76B43] text-white hover:bg-[#8F5735]",
                  outlineBtn: "border-[#A76B43]/60 bg-transparent text-[#7E4E2E] hover:bg-[#F4EAE2]",
                  closeBtn: "border-[#A76B43]/35 bg-white text-[#7E4E2E] hover:bg-[#F4EAE2]",
                  ring: "focus-visible:ring-[#A76B43]",
                }
              : tone === "minred"
              ? {
                  panel: "border-[#E1BC7C]/45 bg-[#1E0101] text-[#E9D4AE]",
                  subcard: "border-[#E1BC7C]/30 bg-[#2C0102] text-[#E9D4AE]",
                  heading: "text-[#E1BC7C]",
                  muted: "text-[#B89667]",
                  copyBtn:
                    "border-[#E1BC7C] bg-[#E1BC7C] text-[#390102] hover:bg-[#F0D3A0]",
                  outlineBtn:
                    "border-[#E1BC7C]/60 bg-transparent text-[#E1BC7C] hover:bg-[#2C0102]",
                  closeBtn:
                    "border-[#E1BC7C]/40 bg-[#1E0101] text-[#E1BC7C] hover:bg-[#2C0102]",
                  ring: "focus-visible:ring-[#E1BC7C]",
                }
              : tone === "ruby"
              ? {
                  panel: "border-[#E5C787]/50 bg-[#390202] text-[#E5E4D0]",
                  subcard: "border-[#E5C787]/40 bg-[#4A060C] text-[#E5E4D0]",
                  heading: "text-[#F7E7CE]",
                  muted: "text-[#B3B2A0]",
                  copyBtn:
                    "border-[#F7E7CE] bg-[#F7E7CE] text-[#390202] hover:bg-[#FFF6E6]",
                  outlineBtn:
                    "border-[#E5C787] bg-transparent text-[#E5C787] hover:bg-[#4A060C]",
                  closeBtn:
                    "border-[#E5C787]/50 bg-[#390202] text-[#E5C787] hover:bg-[#4A060C]",
                  ring: "focus-visible:ring-[#E5C787]",
                }
              : tone === "velvet"
              ? {
                  panel: "border-[#8A6A3A] bg-[#4A0B0A] text-[#E9CE91]",
                  subcard: "border-[#8A6A3A]/60 bg-[#5A0D0C] text-[#E9CE91]",
                  heading: "text-[#E9CE91]",
                  muted: "text-[#BFA478]",
                  copyBtn:
                    "border-[#E9CE91] bg-[#E9CE91] text-[#3B0A0D] hover:bg-[#F2E0B6]",
                  outlineBtn:
                    "border-[#E9CE91]/70 bg-transparent text-[#E9CE91] hover:bg-[#5A0D0C]",
                  closeBtn:
                    "border-[#8A6A3A] bg-[#4A0B0A] text-[#E9CE91] hover:bg-[#5A0D0C]",
                  ring: "focus-visible:ring-[#E9CE91]",
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
    const ok = await copyTextSafe(side.accountNumber);
    if (!ok) {
      setCopyFailedSide(side.id);
      return;
    }
    setCopyFailedSide(null);
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
              "mt-5 flex flex-col items-center rounded-2xl border p-6 text-center space-y-3",
              toneTheme.subcard,
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-current/10">
              <HeartHandshake className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className={cn("font-display text-lg font-semibold", toneTheme.heading)}>
                Lời chúc và quà bằng tin nhắn
              </h3>
              <p className={cn("max-w-md text-xs leading-relaxed sm:text-sm", toneTheme.muted)}>
                Tấm lòng và những lời chúc tốt đẹp nhất gửi tới cô dâu &amp; chú rể chính là món quà ý nghĩa nhất. Bạn có thể để lại lời chúc phúc trân quý ở khung xác nhận tham dự.
              </p>
            </div>
            {wishAnchorId && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  const target = document.getElementById(wishAnchorId);
                  if (target) {
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center justify-center rounded-full px-5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
                  toneTheme.copyBtn,
                  toneTheme.ring,
                )}
              >
                Gửi lời chúc ngay
              </button>
            )}
          </div>
        ) : manualSides.length > 0 ? (
          <div
            className={cn(
              "mt-5 grid gap-4",
              manualSides.length > 1 ? "sm:grid-cols-2" : "grid-cols-1",
            )}
          >
            {manualSides.map((side) => {
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
                      <div className="space-y-1.5">
                        <div className="mx-auto w-40 overflow-hidden rounded-xl border border-current/15 bg-white p-2">
                          <img
                            src={side.qrUrl}
                            alt={`Mã QR chuyển khoản ${side.title}`}
                            width={160}
                            height={160}
                            className="aspect-square h-auto w-full object-contain"
                          />
                        </div>
                        <p className={cn("text-center text-[10px]", toneTheme.muted)}>
                          Trên iPhone / Zalo: nhấn giữ ảnh QR để lưu về máy
                        </p>
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
                          <dd className="select-all font-mono text-sm font-semibold tracking-wide">
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
                          "inline-flex h-9 w-full cursor-pointer touch-manipulation select-none items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2",
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

                    {copyFailedSide === side.id && (
                      <p className={cn("text-center text-[10px]", toneTheme.muted)}>
                        Chạm giữ vào số tài khoản phía trên để sao chép thủ công.
                      </p>
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
        ) : null}

        {/* VietQR tự sinh là quyền của gói Pro/VIP: bản Free chỉ hiện số tài khoản.
            Nếu chủ thiệp đã tự tải ảnh QR thì ẩn VietQR của bên đó để không trùng. */}
        {showVietQr && coupleName && (
          <VietQRGiftBox
            coupleName={coupleName}
            guestName={guestName}
            isDark={isDarkTone}
            sides={vietQrSides.map((side) => ({
              id: side.id,
              label: side.title,
              bankName: side.bankName,
              accountName: side.accountName,
              accountNumber: side.accountNumber,
            }))}
          />
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

