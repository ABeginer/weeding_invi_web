"use client";

import * as React from "react";
import QRCode from "qrcode";
import { Download, HeartHandshake, Loader2, X } from "lucide-react";
import type { GuestDiet, TemplateData, WeddingPlan } from "@/lib/types";
import { canUseFeature } from "@/lib/plans";
import {
  downloadBoardingPass,
  type BoardingPassData,
} from "@/lib/export-boarding-pass";
import { GiftModal } from "./GiftModal";

export interface GuestBoardingPassProps {
  guestName: string;
  slug: string;
  tableNumber?: string | null;
  plusOnes?: number;
  diet?: GuestDiet | string | null;
  weddingDate?: string;
  coupleTitle?: string;
  venueName?: string;
  venueTime?: string;
  gift?: TemplateData["gift"];
  plan?: WeddingPlan;
  className?: string;
}

export function GuestBoardingPass({
  guestName,
  slug,
  tableNumber,
  plusOnes = 0,
  diet,
  weddingDate,
  coupleTitle,
  venueName,
  venueTime,
  gift,
  plan = "free",
  className = "",
}: GuestBoardingPassProps) {
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [fallbackModalOpen, setFallbackModalOpen] = React.useState(false);
  const [savedDataUrl, setSavedDataUrl] = React.useState<string | null>(null);
  const [giftModalOpen, setGiftModalOpen] = React.useState(false);

  const headcount = 1 + Math.max(0, plusOnes);
  const dietLabel = diet === "veg" ? "Ăn chay" : "Ăn mặn";
  const guestCode = (slug || "INV").slice(0, 8).toUpperCase();

  // Tạo mã QR Check-in riêng biệt (chỉ trỏ đến link tra cứu chỗ ngồi)
  React.useEffect(() => {
    let cancelled = false;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const checkinUrl = `${origin}/m/${slug}/tra-cuu-ban`;

    QRCode.toDataURL(checkinUrl, {
      width: 200,
      margin: 1,
      color: { dark: "#1F1D1A", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Kiểm tra xem cô dâu chú rể có cài đặt tài khoản mừng cưới / VietQR không
  const hasGift = Boolean(
    gift &&
      (gift.groomAccountNumber ||
        gift.brideAccountNumber ||
        gift.groomQrUrl ||
        gift.brideQrUrl),
  );

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    const passData: BoardingPassData = {
      guestName,
      slug,
      tableNumber,
      plusOnes,
      diet,
      coupleTitle,
      weddingDate,
      venueName,
      venueTime,
    };

    try {
      const result = await downloadBoardingPass(passData);
      setSavedDataUrl(result.dataUrl);

      // Nếu đang mở trên Zalo / Messenger / iOS Safari hoặc trình duyệt chặn tải tự động
      if (result.needsFallbackModal) {
        setFallbackModalOpen(true);
      }
    } catch (err) {
      console.error("Không thể xuất vé:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedDate = React.useMemo(() => {
    if (!weddingDate) return "";
    const match = weddingDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[3]} · ${match[2]} · ${match[1]}`;
    return weddingDate;
  }, [weddingDate]);

  const venueInfo = venueTime
    ? venueName
      ? `${venueTime} · ${venueName}`
      : venueTime
    : venueName || "Hân hạnh đón tiếp";

  const rawTable = (tableNumber || "").trim();
  const tableDisplay = rawTable
    ? /^bàn\s*/i.test(rawTable)
      ? rawTable.toUpperCase()
      : `BÀN ${rawTable.toUpperCase()}`
    : null;

  if (!canUseFeature(plan, "boardingPass")) {
    return null;
  }

  return (
    <section
      aria-label="Thẻ mời & Số bàn (Boarding Pass)"
      className={`mx-auto w-full max-w-[430px] px-3.5 py-4 ${className}`}
    >
      {/* Khung vé Perforated Ticket */}
      <div className="relative overflow-hidden rounded-3xl border border-[#E8E2D9] bg-[#FAF8F5] shadow-lg text-[#1F1D1A]">
        {/* 1. Header Strip (#7A1C24 - Deep Burgundy) */}
        <div className="flex items-center justify-between border-b border-[#5E141B] bg-[#7A1C24] px-5 py-3 text-white">
          <p className="text-[10px] font-bold tracking-[0.22em] text-[#B89B72] uppercase">
            Thẻ mời &amp; Số bàn · Boarding Pass
          </p>
          <span className="text-[11px] font-medium tracking-wider text-[#FAF8F5]/90">
            {formattedDate || coupleTitle || "WEDDING INVITATION"}
          </span>
        </div>

        {/* 2. Main Ticket Body */}
        <div className="space-y-4 bg-white px-5 pt-5 pb-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#6B655E] uppercase">
              Kính mời
            </p>
            <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#1F1D1A] sm:text-3xl">
              {guestName || "Quý khách"}
            </h2>
            {coupleTitle && (
              <p className="mt-0.5 font-sans text-xs text-[#6B655E]">
                Tham dự tiệc cưới cùng {coupleTitle}
              </p>
            )}
          </div>

          {/* Khung 2 cột Metadata: SỐ BÀN | THAM DỰ & THỰC ĐƠN */}
          <div className="grid grid-cols-2 rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-3 text-left divide-x divide-[#E8E2D9]">
            {/* Cột 1: SỐ BÀN */}
            <div className="pr-3">
              <p className="text-[10px] font-bold tracking-wider text-[#6B655E] uppercase">
                Số bàn
              </p>
              {tableDisplay ? (
                <p className="mt-1 font-serif text-2xl font-bold tracking-tight tabular-nums text-[#7A1C24]">
                  {tableDisplay}
                </p>
              ) : (
                <p className="mt-1 text-sm italic font-medium text-[#6B655E]">
                  Đang sắp xếp
                </p>
              )}
            </div>

            {/* Cột 2: THAM DỰ & THỰC ĐƠN */}
            <div className="pl-3">
              <p className="text-[10px] font-bold tracking-wider text-[#6B655E] uppercase">
                Tham dự &amp; Thực đơn
              </p>
              <p className="mt-1 font-semibold text-sm text-[#1F1D1A]">
                {headcount} người · {dietLabel}
              </p>
            </div>
          </div>

          {/* Dòng Địa điểm & Thời gian */}
          <div className="flex items-center gap-1.5 text-xs text-[#6B655E]">
            <span aria-hidden="true">📍</span>
            <span className="truncate">{venueInfo}</span>
          </div>
        </div>

        {/* 3. Perforated Ticket Divider (Vết xé vé & khía bán nguyệt) */}
        <div className="relative bg-[#F4EFEA] py-1">
          <div className="border-t-2 border-dashed border-[#D8D0C5]" />
          {/* Khía mép trái */}
          <div
            aria-hidden="true"
            className="absolute -top-3.5 -left-3.5 h-7 w-7 rounded-full border border-[#E8E2D9] bg-[#FAF8F5] shadow-inner"
          />
          {/* Khía mép phải */}
          <div
            aria-hidden="true"
            className="absolute -top-3.5 -right-3.5 h-7 w-7 rounded-full border border-[#E8E2D9] bg-[#FAF8F5] shadow-inner"
          />
        </div>

        {/* 4. Bottom Stub (Cuống vé Check-in & Mã QR) */}
        <div className="flex items-center justify-between gap-3 bg-[#F4EFEA] px-5 py-4">
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-sans text-sm font-semibold text-[#1F1D1A]">
              Mã Check-in Bàn Tiệc
            </p>
            <p className="text-[11px] leading-relaxed text-[#6B655E]">
              Xuất trình mã này tại bàn lễ tân để check-in &amp; nhận hướng dẫn vào bàn.
            </p>
            <p className="font-mono text-xs font-bold tracking-wider text-[#7A1C24]">
              MÃ VÉ: #{guestCode}
            </p>
          </div>

          <div className="shrink-0">
            {qrDataUrl ? (
              <div className="rounded-xl border border-[#E8E2D9] bg-white p-1.5 shadow-2xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`Check-in QR cho khách ${guestName}`}
                  className="h-20 w-20 rounded-lg object-contain"
                />
              </div>
            ) : (
              <div className="h-20 w-20 rounded-xl border border-[#E8E2D9] bg-white/70 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      {/* 5. Action Buttons (Nằm bên ngoài vé) */}
      <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row">
        {/* Nút 1: Lưu vé về máy (Primary) */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-[#1F1D1A] px-5 py-3 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#151412] disabled:opacity-60"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#B89B72]" />
              <span>Đang tạo vé PNG...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4 text-[#B89B72]" />
              <span>Lưu vé về máy</span>
            </>
          )}
        </button>

        {/* Nút 2: Mừng cưới qua VietQR (Secondary - Mở GiftModal) */}
        {hasGift && (
          <button
            type="button"
            onClick={() => setGiftModalOpen(true)}
            className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#E8E2D9] bg-white px-5 py-3 text-xs font-semibold text-[#7A1C24] shadow-2xs transition-colors hover:bg-[#FAF8F5]"
          >
            <HeartHandshake className="h-4 w-4" />
            <span>Mừng cưới qua VietQR</span>
          </button>
        )}
      </div>

      {/* 6. Fallback Modal cho Zalo / iOS Safari khi tải tự động bị chặn */}
      {fallbackModalOpen && savedDataUrl && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative flex max-h-[92vh] w-full max-w-sm flex-col items-center rounded-3xl border border-[#E8E2D9] bg-[#FAF8F5] p-5 shadow-2xl">
            <button
              type="button"
              onClick={() => setFallbackModalOpen(false)}
              className="absolute top-4 right-4 rounded-full border border-[#E8E2D9] bg-white p-1.5 text-[#6B655E] transition-colors hover:text-[#1F1D1A]"
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-serif text-lg font-semibold text-[#1F1D1A]">
              Lưu Thẻ mời &amp; Số bàn
            </h3>

            <div className="mt-2 rounded-xl border border-[#B89B72]/40 bg-[#FAF3E3] p-3 text-center text-xs text-[#8A6D3B]">
              💡 <strong>Nhấn giữ vào ảnh</strong> bên dưới để chọn{" "}
              <em>&ldquo;Lưu hình ảnh&rdquo;</em> về Thư viện ảnh (Photos) của máy.
            </div>

            <div className="mt-3 overflow-hidden rounded-2xl border border-[#E8E2D9] shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={savedDataUrl}
                alt="Thẻ mời &amp; Số bàn (Boarding Pass)"
                className="max-h-[55vh] w-auto object-contain"
              />
            </div>

            <button
              type="button"
              onClick={() => setFallbackModalOpen(false)}
              className="mt-4 w-full cursor-pointer rounded-full bg-[#1F1D1A] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#151412]"
            >
              Đã lưu xong · Đóng lại
            </button>
          </div>
        </div>
      )}

      {/* 7. GiftModal (Mừng cưới qua VietQR) */}
      {hasGift && gift && (
        <GiftModal
          open={giftModalOpen}
          onClose={() => setGiftModalOpen(false)}
          gift={gift}
          plan={plan}
          coupleName={coupleTitle}
          guestName={guestName}
        />
      )}
    </section>
  );
}
