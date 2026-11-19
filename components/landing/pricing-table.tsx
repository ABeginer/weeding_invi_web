"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import { SITE_LINKS } from "@/config/site";
import type { WeddingPlan } from "@/lib/types";
import { FeatureInfoPopover } from "@/components/pricing/FeatureInfoPopover";
import { ScrollReveal } from "./scroll-reveal";

interface PricingTableProps {
  isAuthenticated: boolean;
  onSelectPaidPlan: (plan: Exclude<WeddingPlan, "free">) => void;
}

const INFO_POPOVER_TEXTS = {
  salutation:
    "Gửi 1 link riêng cho từng khách, thiệp và ảnh xem trước trên Zalo tự hiện đúng vai vế (Chú Bảy, Sếp, Bạn thân...).",
  music:
    "Tự tải lên bài hát kỷ niệm của hai bạn (MP3) để phát ngay khi khách chạm mở phong bì.",
  excel:
    "Tải toàn bộ danh sách xác nhận tham dự & thực đơn mặn/chay ra file Excel chuẩn tiếng Việt chỉ với 1 chạm.",
  boardingPass:
    "Mỗi khách có 1 tấm vé điện tử ghi rõ số bàn, thực đơn và mã QR lễ tân check-in. Lưu được về máy chống mất mạng.",
  livePhotoWall:
    "Khách ngồi bàn quét QR gửi ảnh chụp lên màn hình LED sảnh tiệc theo thời gian thực. Kèm file in bảng QR A5/A6 và tải trọn bộ ảnh (.ZIP).",
  familyPin:
    "Tạo mã PIN 4 số để phù dâu/người nhà phụ duyệt ảnh chiếu LED và quét QR điểm danh khách mà không cần chia sẻ tài khoản.",
} as const;

export function PricingTable({
  isAuthenticated,
  onSelectPaidPlan,
}: PricingTableProps) {
  const copy = LANDING_COPY.pricing;

  const handleChoosePaidPlan = (plan: "pro" | "vip") => {
    if (!isAuthenticated) {
      window.location.assign(
        `/auth/login?returnTo=${encodeURIComponent(`/?pay=${plan}`)}`,
      );
      return;
    }
    onSelectPaidPlan(plan);
  };

  return (
    <section
      id="bang-gia"
      className="scroll-mt-14 border-b border-[#E8E2D9] bg-[#FAF8F5] py-14 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-xs sm:text-[13px] font-semibold tracking-[0.14em] text-[#7A1C24] uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight text-[#1F1D1A] sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#6B655E]">
            {copy.description}
          </p>
        </ScrollReveal>

        {/* 3-Tier Grid Layout */}
        <div className="mx-auto mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8 items-stretch max-w-6xl">
          {/* Card 1 — Gói Miễn phí */}
          <ScrollReveal as="article" className="flex h-full flex-col">
            <div className="flex h-full flex-1 flex-col rounded-2xl border border-[#E8E2D9] bg-white p-6 sm:p-8 shadow-xs">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-[#1F1D1A]">
                  Gói Miễn phí
                </h3>
                <p className="mt-1 text-xs text-[#6B655E] leading-relaxed">
                  Trải nghiệm đầy đủ trước khi quyết định.
                </p>

                {/* Price */}
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#1F1D1A] tabular-nums">
                    0đ
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#6B655E] tracking-wide">
                  Dùng thử không giới hạn thời gian
                </p>

                {/* CTA Directly under price */}
                <Link
                  href={SITE_LINKS.createWedding}
                  className="mt-6 flex h-11 w-full items-center justify-center rounded-full border border-[#1F1D1A] bg-transparent text-sm font-medium text-[#1F1D1A] transition-colors hover:bg-[#1F1D1A] hover:text-[#FAF8F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F1D1A]"
                >
                  Dùng miễn phí
                </Link>
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-[#E8E2D9]" />

              {/* Features List */}
              <ul className="flex-1 space-y-3.5 text-xs text-[#1F1D1A]">
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1C24]" />
                  <span>Tối đa 20 khách mời</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1C24]" />
                  <div className="flex items-center gap-1.5">
                    <span>Tự đổi xưng hô &amp; Preview Zalo</span>
                    <FeatureInfoPopover
                      content={INFO_POPOVER_TEXTS.salutation}
                      variant="light"
                    />
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1C24]" />
                  <span>Mẫu thiệp cơ bản</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1C24]" />
                  <span>5 ảnh cưới</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1C24]" />
                  <span>Lưu trữ 6 tháng</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>

          {/* Card 2 — Gói Pro (Highlighted Primary) */}
          <ScrollReveal as="article" className="relative flex h-full flex-col">
            {/* Top Badge */}
            <span className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#7A1C24] px-3.5 py-1 text-[11px] font-semibold tracking-wider text-[#FAF8F5] uppercase shadow-sm whitespace-nowrap">
              PHỔ BIẾN NHẤT
            </span>

            <div className="flex h-full flex-1 flex-col rounded-2xl border-2 border-[#7A1C24] bg-white p-6 sm:p-8 shadow-md relative">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-[#1F1D1A]">
                  Gói Pro
                </h3>
                <p className="mt-1 text-xs text-[#6B655E] leading-relaxed">
                  Trọn vẹn cho khâu mời cưới &amp; chốt mâm tiệc.
                </p>

                {/* Launch Promo Price */}
                <div className="mt-5 flex flex-wrap items-baseline gap-2">
                  <span className="text-sm text-[#6B655E] line-through tabular-nums decoration-[#7A1C24]/60">
                    199.000đ
                  </span>
                  <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#1F1D1A] tabular-nums">
                    159.000đ
                  </span>
                  <span className="text-sm font-normal text-[#6B655E]">
                    / lần
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-[#B89B72] tracking-wide">
                  Ưu đãi giai đoạn ra mắt
                </p>

                {/* CTA Directly under price */}
                <button
                  type="button"
                  onClick={() => handleChoosePaidPlan("pro")}
                  className="mt-6 flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[#7A1C24] text-sm font-medium text-[#FAF8F5] transition-colors hover:bg-[#5E141B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24] shadow-xs"
                >
                  Chọn gói Pro
                </button>
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-[#E8E2D9]" />

              {/* Features List */}
              <ul className="flex-1 space-y-3.5 text-xs text-[#1F1D1A]">
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1C24]" />
                  <span className="font-semibold text-[#1F1D1A]">
                    Không giới hạn khách mời
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1C24]" />
                  <span>Toàn bộ 27+ mẫu thiệp</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1C24]" />
                  <div className="flex items-center gap-1.5">
                    <span>Upload nhạc nền riêng</span>
                    <FeatureInfoPopover
                      content={INFO_POPOVER_TEXTS.music}
                      variant="light"
                    />
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1C24]" />
                  <span>30 ảnh HD &amp; 2 ảnh VietQR</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1C24]" />
                  <div className="flex items-center gap-1.5">
                    <span>Xuất danh sách Excel</span>
                    <FeatureInfoPopover
                      content={INFO_POPOVER_TEXTS.excel}
                      variant="light"
                    />
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1C24]" />
                  <span>Lưu trữ 1 năm</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>

          {/* Card 3 — Gói VIP (Editorial Dark Ink) */}
          <ScrollReveal as="article" className="relative flex h-full flex-col">
            {/* Top Badge */}
            <span className="absolute -top-3.5 left-1/2 z-20 -translate-x-1/2 rounded-full bg-[#B89B72] px-3.5 py-1 text-[11px] font-semibold tracking-wider text-[#1F1D1A] uppercase shadow-sm whitespace-nowrap">
              TRẢI NGHIỆM SẢNH TIỆC
            </span>

            <div className="flex h-full flex-1 flex-col rounded-2xl border border-[#B89B72]/40 bg-[#1F1D1A] p-6 sm:p-8 text-[#FAF8F5] relative shadow-lg">
              <div>
                <h3 className="font-serif text-2xl font-semibold text-[#FAF8F5]">
                  Gói VIP
                </h3>
                <p className="mt-1 text-xs text-[#FAF8F5]/70 leading-relaxed">
                  Đẳng cấp &amp; tương tác trực tiếp tại nhà hàng.
                </p>

                {/* Launch Promo Price */}
                <div className="mt-5 flex flex-wrap items-baseline gap-2">
                  <span className="text-sm text-[#FAF8F5]/50 line-through tabular-nums decoration-[#B89B72]">
                    499.000đ
                  </span>
                  <span className="font-serif text-3xl sm:text-4xl font-semibold text-[#FAF8F5] tabular-nums">
                    399.000đ
                  </span>
                  <span className="text-sm font-normal text-[#FAF8F5]/70">
                    / lần
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-[#B89B72] tracking-wide">
                  Ưu đãi giai đoạn ra mắt
                </p>

                {/* CTA Directly under price */}
                <button
                  type="button"
                  onClick={() => handleChoosePaidPlan("vip")}
                  className="mt-6 flex h-11 w-full cursor-pointer items-center justify-center rounded-full bg-[#B89B72] text-sm font-medium text-[#1F1D1A] transition-colors hover:bg-[#A68960] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89B72] shadow-xs"
                >
                  Chọn gói VIP
                </button>
              </div>

              {/* Divider */}
              <div className="my-6 border-t border-[#B89B72]/20" />

              {/* Subheading for VIP additions */}
              <p className="text-[11px] italic text-[#B89B72] pb-1">
                Mọi tính năng gói Pro, cộng thêm:
              </p>

              {/* Features List */}
              <ul className="flex-1 space-y-3.5 text-xs text-[#FAF8F5]">
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#B89B72]" />
                  <div className="flex items-center gap-1.5 font-semibold text-[#FAF8F5]">
                    <span>Thẻ mời &amp; Số bàn (Boarding Pass)</span>
                    <FeatureInfoPopover
                      content={INFO_POPOVER_TEXTS.boardingPass}
                      variant="dark"
                    />
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#B89B72]" />
                  <div className="flex items-center gap-1.5 font-semibold text-[#FAF8F5]">
                    <span>Live QR Photo Wall &amp; Chiếu LED</span>
                    <FeatureInfoPopover
                      content={INFO_POPOVER_TEXTS.livePhotoWall}
                      variant="dark"
                    />
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#B89B72]" />
                  <div className="flex items-center gap-1.5 font-semibold text-[#FAF8F5]">
                    <span>Link mã PIN cho người nhà &amp; Quét Check-in</span>
                    <FeatureInfoPopover
                      content={INFO_POPOVER_TEXTS.familyPin}
                      variant="dark"
                    />
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#B89B72]" />
                  <span>
                    Xuất file in bảng QR để bàn (A5/A6) &amp; Tải trọn bộ ảnh (.ZIP)
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#B89B72]" />
                  <span>
                    50 ảnh HD &amp; Lưu trữ <strong className="font-semibold text-[#FAF8F5]">2 năm</strong>
                  </span>
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </div>

        {/* Footer Note Below Grid */}
        <p className="mt-8 text-center text-xs text-[#6B655E] max-w-xl mx-auto leading-relaxed">
          Thanh toán một lần duy nhất · Không gia hạn tự động · Hỗ trợ nâng cấp từ Pro lên VIP chỉ cần bù phần chênh lệch.
        </p>
      </div>
    </section>
  );
}
