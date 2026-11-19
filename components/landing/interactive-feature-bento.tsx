"use client";

import * as React from "react";
import { Camera, CheckCircle2, Clock, QrCode, Sparkles, UtensilsCrossed, XCircle } from "lucide-react";
import {
  buildSalutation,
  getRelationshipLabel,
  type RelationshipGroup,
} from "@/lib/salutation-engine";

interface RoleChipOption {
  label: string;
  relationship: RelationshipGroup;
  defaultName: string;
}

const ROLE_CHIPS: RoleChipOption[] = [
  { label: "Cô / Chú", relationship: "elder", defaultName: "Chú Bảy" },
  { label: "Ông / Bà", relationship: "family", defaultName: "Bác Ba" },
  { label: "Sếp / Đồng nghiệp", relationship: "peer_formal", defaultName: "Anh Hoàng" },
  { label: "Bạn thân", relationship: "close_friend", defaultName: "Tuấn Anh" },
];

const RSVP_STATS = {
  accepted: 48,
  pending: 12,
  declined: 4,
};
const TOTAL_RSVP = RSVP_STATS.accepted + RSVP_STATS.pending + RSVP_STATS.declined;

export function InteractiveFeatureBento() {
  const [selectedRole, setSelectedRole] = React.useState<RoleChipOption>(ROLE_CHIPS[0]);
  const [guestName, setGuestName] = React.useState(ROLE_CHIPS[0].defaultName);

  const handleSelectRole = (chip: RoleChipOption) => {
    setSelectedRole(chip);
    setGuestName(chip.defaultName);
  };

  const salutation = buildSalutation({
    guestName: guestName || "Khách quý",
    relationshipGroup: selectedRole.relationship,
  });

  return (
    <section className="border-b border-[#E8E2D9] bg-[#FAF8F5] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D9] bg-white/80 px-4 py-1.5 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-[#B89B72]" aria-hidden="true" />
            <span className="text-[12px] font-medium tracking-wide text-[#7A1C24] sm:text-[13px]">
              Tính năng cốt lõi
            </span>
          </div>

          <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl">
            Quản lý tiệc cưới <span className="italic text-[#7A1C24]">chỉn chu</span>, vẹn tròn lễ nghĩa
          </h2>

          <p className="mt-3 text-base leading-relaxed text-[#6B655E]">
            Mọi công đoạn từ xưng hô, gửi thiệp qua Zalo đến kiểm đếm khách và sắp bàn đều được tự động hóa thông minh.
          </p>
        </div>

        {/* Asymmetric Bento Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Card 1 (Large - 7 cols): Auto Salutation & Zalo Preview */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-2xs transition-all hover:border-[#B89B72]/60 sm:p-8 lg:col-span-7">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-[#B89B72] uppercase">
                  Tự động xưng hô & Preview Zalo
                </span>
                <span className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-3 py-1 text-[11px] font-medium text-[#7A1C24]">
                  Thông minh
                </span>
              </div>

              <h3 className="mt-3 font-serif text-2xl font-normal text-[#1F1D1A]">
                Chạm đúng lễ phép cho từng vị khách
              </h3>

              <p className="mt-1.5 text-sm leading-relaxed text-[#6B655E]">
                Mỗi vị khách nhận một đường link thiệp riêng biệt với đúng xưng hô kính cẩn, không bao giờ nhầm lẫn.
              </p>

              {/* Interactive Role Chips */}
              <div className="mt-6">
                <p className="text-xs font-medium text-[#1F1D1A]/70">Chọn thử vai vế khách mời:</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {ROLE_CHIPS.map((chip) => {
                    const isSelected = selectedRole.label === chip.label;
                    return (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => handleSelectRole(chip)}
                        className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                          isSelected
                            ? "bg-[#7A1C24] text-white shadow-xs"
                            : "border border-[#E8E2D9] bg-[#FAF8F5] text-[#1F1D1A]/80 hover:border-[#B89B72] hover:bg-[#F4EFEA]"
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Name Input */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-[#6B655E]">
                  Tên khách mời:
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    maxLength={35}
                    className="mt-1.5 h-10 w-full max-w-xs rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 text-sm text-[#1F1D1A] outline-none transition-colors focus:border-[#7A1C24] focus:bg-white focus:ring-1 focus:ring-[#7A1C24]"
                    placeholder="Nhập tên khách..."
                  />
                </label>
              </div>
            </div>

            {/* Realistic Zalo / Card Mockup */}
            <div className="mt-6 rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-4.5 sm:p-5">
              <div className="flex items-center gap-2 border-b border-[#E8E2D9]/70 pb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0068FF] text-white text-xs font-bold">
                  Z
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#1F1D1A]">Tin nhắn gửi qua Zalo</p>
                  <p className="text-[10px] text-[#6B655E]">Tự động tạo lời mời mẫu chỉn chu</p>
                </div>
              </div>

              <div className="mt-3.5 space-y-2">
                <div className="rounded-xl bg-white p-3.5 border border-[#E8E2D9] shadow-2xs">
                  <p className="text-xs font-semibold text-[#7A1C24]">
                    {salutation.invitePrefix}: {salutation.guestLabel}
                  </p>
                  <p className="mt-1 text-xs text-[#1F1D1A] leading-relaxed">
                    {salutation.zaloMessage}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#B89B72] border-t border-[#E8E2D9]/60 pt-2">
                    <span className="font-serif italic">inviwedd.com/m/7a8f12...</span>
                    <span className="text-[#6B655E]">Xem thiệp riêng →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 (Large - 5 cols): Live QR Photo Wall */}
          <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-2xs transition-all hover:border-[#B89B72]/60 sm:p-8 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-[#B89B72] uppercase">
                  Khoảnh khắc đám cưới
                </span>
                <span className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-3 py-1 text-[11px] font-medium text-[#7A1C24]">
                  Live Wall
                </span>
              </div>

              <h3 className="mt-3 font-serif text-2xl font-normal text-[#1F1D1A]">
                Live QR Photo Wall
              </h3>

              <p className="mt-1.5 text-sm leading-relaxed text-[#6B655E]">
                Khách quét QR tại bàn để gửi ảnh chụp tiệc cưới. Mọi khoảnh khắc đẹp được trình chiếu trực tiếp lên màn hình LED tiệc.
              </p>
            </div>

            {/* Artistic Overlapping Polaroid Gallery */}
            <div className="relative mt-8 mb-4 h-56 w-full sm:h-64">
              {/* Photo 1 (left tilt) */}
              <div className="absolute top-2 left-3 w-28 sm:w-32 -rotate-6 rounded-lg bg-white p-2 shadow-md border border-[#E8E2D9] transition-transform hover:scale-105 duration-300">
                <img
                  src="/photos/1.webp"
                  alt="Wedding moment"
                  className="aspect-square w-full rounded object-cover"
                />
              </div>

              {/* Photo 2 (center tilt) */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-32 sm:w-36 rotate-2 rounded-lg bg-white p-2 shadow-lg border border-[#E8E2D9] transition-transform hover:scale-105 duration-300">
                <img
                  src="/photos/2.webp"
                  alt="Wedding moment"
                  className="aspect-square w-full rounded object-cover"
                />
              </div>

              {/* Photo 3 (right tilt) */}
              <div className="absolute top-1 right-3 w-28 sm:w-32 rotate-6 rounded-lg bg-white p-2 shadow-md border border-[#E8E2D9] transition-transform hover:scale-105 duration-300">
                <img
                  src="/photos/3.webp"
                  alt="Wedding moment"
                  className="aspect-square w-full rounded object-cover"
                />
              </div>

              {/* Floating Mini QR Badge */}
              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 rounded-full border border-[#E8E2D9] bg-white/95 px-4 py-2 shadow-sm backdrop-blur-md">
                <QrCode className="h-4 w-4 text-[#7A1C24]" />
                <span className="text-xs font-medium text-[#1F1D1A]">
                  Quét QR gửi ảnh lên màn hình
                </span>
              </div>
            </div>

            <p className="text-center text-xs text-[#6B655E]">
              Hỗ trợ kiểm duyệt ảnh trước khi chiếu lên màn hình tiệc
            </p>
          </div>

          {/* Card 3 (Medium - 5 cols): RSVP & Menu Classification */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-2xs transition-all hover:border-[#B89B72]/60 sm:p-8 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-[#B89B72] uppercase">
                  Quản lý phản hồi
                </span>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] font-medium text-emerald-800">
                  Real-time
                </span>
              </div>

              <h3 className="mt-3 font-serif text-2xl font-normal text-[#1F1D1A]">
                RSVP &amp; Phân loại thực đơn
              </h3>

              <p className="mt-1.5 text-sm leading-relaxed text-[#6B655E]">
                Nắm chính xác số lượng khách đến dự, người đi kèm và nhu cầu món chay/mặn để đặt cỗ chu đáo, tránh lãng phí.
              </p>

              {/* Minimalist Progress Bars */}
              <div className="mt-6 space-y-3.5">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#1F1D1A]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Đã xác nhận tham dự
                    </span>
                    <span className="font-semibold text-emerald-700">{RSVP_STATS.accepted} khách</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#FAF8F5] border border-[#E8E2D9]/70">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                      style={{ width: `${Math.round((RSVP_STATS.accepted / TOTAL_RSVP) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-[#1F1D1A]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="h-3.5 w-3.5 text-amber-600" />
                      Chờ phản hồi
                    </span>
                    <span className="font-semibold text-amber-700">{RSVP_STATS.pending} khách</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#FAF8F5] border border-[#E8E2D9]/70">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${Math.round((RSVP_STATS.pending / TOTAL_RSVP) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-[#1F1D1A]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <XCircle className="h-3.5 w-3.5 text-rose-500" />
                      Bận không tham dự
                    </span>
                    <span className="font-semibold text-rose-600">{RSVP_STATS.declined} khách</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#FAF8F5] border border-[#E8E2D9]/70">
                    <div
                      className="h-full rounded-full bg-rose-400 transition-all duration-500"
                      style={{ width: `${Math.round((RSVP_STATS.declined / TOTAL_RSVP) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Diet Pill Counters */}
            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#E8E2D9]/60 pt-4">
              <div className="rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#6B655E]">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-[#B89B72]" />
                  <span>Thực đơn mặn</span>
                </div>
                <p className="mt-1 font-serif text-2xl font-semibold text-[#1F1D1A]">42</p>
                <p className="text-[10px] text-[#6B655E]">khẩu phần</p>
              </div>

              <div className="rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-3 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#6B655E]">
                  <UtensilsCrossed className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Thực đơn chay</span>
                </div>
                <p className="mt-1 font-serif text-2xl font-semibold text-emerald-800">06</p>
                <p className="text-[10px] text-[#6B655E]">khẩu phần</p>
              </div>
            </div>
          </div>

          {/* Card 4 (Medium - 7 cols): Luxury Boarding Pass & VietQR */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-2xs transition-all hover:border-[#B89B72]/60 sm:p-8 lg:col-span-7">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-[#B89B72] uppercase">
                  Đón tiếp &amp; Mừng cưới
                </span>
                <span className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-3 py-1 text-[11px] font-medium text-[#7A1C24]">
                  Sang trọng
                </span>
              </div>

              <h3 className="mt-3 font-serif text-2xl font-normal text-[#1F1D1A]">
                Boarding Pass đón khách &amp; VietQR mừng cưới
              </h3>

              <p className="mt-1.5 text-sm leading-relaxed text-[#6B655E]">
                Thẻ khách mời được tạo như tấm vé đặc quyền. Quét mã QR tại sảnh tiệc để tra cứu số bàn ngay và chuyển khoản mừng cưới tiện lợi.
              </p>
            </div>

            {/* Luxury Ticket / Boarding Pass Graphic */}
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#B89B72]/40 bg-[#FAF8F5] shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-12">
                {/* Left Pass Body */}
                <div className="p-5 sm:p-6 md:col-span-8">
                  <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
                    <span className="font-sans text-xs font-semibold tracking-widest text-[#B89B72] uppercase">
                      WEDDING BOARDING PASS
                    </span>
                    <span className="text-[10px] text-[#6B655E]">HẠNG THƯƠNG GIA</span>
                  </div>

                  <div className="mt-4">
                    <p className="text-[11px] text-[#6B655E]">Kính mời quý khách</p>
                    <p className="font-serif text-xl font-medium text-[#1F1D1A] sm:text-2xl">
                      Chú Bảy cùng Gia đình
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
                    <div>
                      <span className="text-[#6B655E]">Khẩu phần:</span>{" "}
                      <span className="font-semibold text-[#1F1D1A]">2 người · Mặn</span>
                    </div>
                    <div>
                      <span className="text-[#6B655E]">Thời gian:</span>{" "}
                      <span className="font-semibold text-[#1F1D1A]">18:00 · 28/11/2026</span>
                    </div>
                  </div>
                </div>

                {/* Perforated Divider & Right Stub */}
                <div className="relative flex flex-col items-center justify-center border-t border-dashed border-[#B89B72]/40 p-5 bg-[#F4EFEA] md:col-span-4 md:border-t-0 md:border-l">
                  {/* Perforation circle notch */}
                  <div className="hidden md:block absolute -top-3 -left-3 h-6 w-6 rounded-full bg-white border border-[#E8E2D9]" />
                  <div className="hidden md:block absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-white border border-[#E8E2D9]" />

                  <span className="text-[10px] font-semibold text-[#6B655E] tracking-wider uppercase">
                    VỊ TRÍ BÀN TIỆC
                  </span>
                  <div className="mt-1 font-serif text-3xl font-bold tracking-tight text-[#7A1C24]">
                    BÀN 08
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-[#E8E2D9] bg-white px-3 py-1.5 shadow-2xs">
                    <QrCode className="h-4 w-4 text-[#1F1D1A]" />
                    <span className="text-[11px] font-medium text-[#1F1D1A]">Quét VietQR</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs text-[#6B655E]">
              Khách có thể lưu vé vào điện thoại hoặc chụp màn hình để tra cứu số bàn nhanh khi đến sảnh tiệc.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
