"use client";

import * as React from "react";
import {
  CheckCircle2,
  Clock,
  QrCode,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import {
  buildSalutation,
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
  { label: "Bạn thân", relationship: "close_friend", defaultName: "Tuấn Anh" },
  { label: "Đồng nghiệp", relationship: "peer_formal", defaultName: "Anh Hoàng" },
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
    const trimmed = guestName.trim();
    const isPresetOrEmpty =
      trimmed.length === 0 || ROLE_CHIPS.some((c) => c.defaultName === trimmed);
    if (isPresetOrEmpty) {
      setGuestName(chip.defaultName);
    }
  };

  const salutation = buildSalutation({
    guestName: guestName.trim() || "Khách quý",
    relationshipGroup: selectedRole.relationship,
  });

  return (
    <section className="border-b border-[#E8E2D9] bg-[#FAF8F5] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D9] bg-white/80 px-4 py-1.5 shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B89B72]" aria-hidden="true" />
            <span className="text-[12px] font-medium tracking-wide text-[#7A1C24] sm:text-[13px]">
              Tiện ích của thiệp
            </span>
          </div>

          <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl">
            Tiện ích <span className="italic text-[#7A1C24]">vượt trội</span> cho ngày cưới
          </h2>
        </div>

        {/* 4 Clean Visual Cards (No long explanations) */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {/* Card 1: Quản lý phản hồi tức thì */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-2xs transition-all hover:border-[#B89B72]/60 sm:p-7">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-[11px] font-medium text-emerald-800">
                  Thời gian thực
                </span>
                <span className="text-[11px] font-semibold text-[#8A6838] tracking-wider uppercase">
                  RSVP
                </span>
              </div>

              <h3 className="mt-3 font-serif text-2xl font-normal text-[#1F1D1A] sm:text-3xl">
                Quản lý phản hồi tức thì
              </h3>
            </div>

            {/* Visual: Progress Bars & Diet Counters */}
            <div className="mt-6 space-y-4">
              <div className="space-y-3 rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-4 sm:p-5">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#1F1D1A]">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Đã xác nhận tham dự
                    </span>
                    <span className="font-semibold text-emerald-700">{RSVP_STATS.accepted} khách</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white border border-[#E8E2D9]/70">
                    <div
                      className="h-full rounded-full bg-emerald-600"
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
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white border border-[#E8E2D9]/70">
                    <div
                      className="h-full rounded-full bg-amber-500"
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
                    <span className="font-semibold text-rose-700">{RSVP_STATS.declined} khách</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white border border-[#E8E2D9]/70">
                    <div
                      className="h-full rounded-full bg-rose-400"
                      style={{ width: `${Math.round((RSVP_STATS.declined / TOTAL_RSVP) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Diet Pills */}
              <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Card 2: Album QR cho khách */}
          <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-2xs transition-all hover:border-[#B89B72]/60 sm:p-7">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-2.5 py-0.5 text-[11px] font-medium text-[#7A1C24]">
                  Thư viện ảnh
                </span>
                <span className="text-[11px] font-semibold text-[#8A6838] tracking-wider uppercase">
                  Gallery &amp; QR
                </span>
              </div>

              <h3 className="mt-3 font-serif text-2xl font-normal text-[#1F1D1A] sm:text-3xl">
                Album QR cho khách
              </h3>
            </div>

            {/* Visual: Layered Wedding Photos with QR pill */}
            <div className="relative mt-8 mb-2 flex h-60 w-full items-center justify-center sm:h-64">
              {/* Left Photo */}
              <div className="absolute left-4 top-4 w-28 sm:w-32 -rotate-6 rounded-2xl bg-white p-2 shadow-md border border-[#E8E2D9] transition-transform hover:scale-105 duration-300">
                <img
                  src="/photos/bento-1.webp"
                  alt="Ảnh cưới"
                  width={240}
                  height={240}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full rounded-xl object-cover"
                />
              </div>

              {/* Center Photo */}
              <div className="absolute top-1 z-10 w-32 sm:w-36 rotate-2 rounded-2xl bg-white p-2 shadow-xl border border-[#E8E2D9] transition-transform hover:scale-105 duration-300">
                <img
                  src="/photos/bento-2.webp"
                  alt="Ảnh cưới"
                  width={240}
                  height={240}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full rounded-xl object-cover"
                />
              </div>

              {/* Right Photo */}
              <div className="absolute right-4 top-5 w-28 sm:w-32 rotate-6 rounded-2xl bg-white p-2 shadow-md border border-[#E8E2D9] transition-transform hover:scale-105 duration-300">
                <img
                  src="/photos/bento-3.webp"
                  alt="Ảnh cưới"
                  width={240}
                  height={240}
                  loading="lazy"
                  decoding="async"
                  className="aspect-square w-full rounded-xl object-cover"
                />
              </div>

              {/* QR Scan Pill */}
              <div className="absolute bottom-1 z-20 flex items-center gap-2 rounded-full border border-[#E8E2D9] bg-white px-4 py-2 shadow-sm">
                <QrCode className="h-4 w-4 text-[#7A1C24]" />
                <span className="text-xs font-medium text-[#1F1D1A]">
                  Quét QR gửi &amp; xem album cưới
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Tự động xưng hô chuẩn lễ nghĩa */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-2xs transition-all hover:border-[#B89B72]/60 sm:p-7">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-3 py-0.5 text-[11px] font-medium text-[#7A1C24]">
                  Cá nhân hóa
                </span>
                <span className="text-[11px] font-semibold text-[#8A6838] tracking-wider uppercase">
                  Zalo Link
                </span>
              </div>

              <h3 className="mt-3 font-serif text-2xl font-normal text-[#1F1D1A] sm:text-3xl">
                Tự động xưng hô chuẩn lễ nghĩa
              </h3>
            </div>

            {/* Visual: Role Chips & Zalo Mockup */}
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                {ROLE_CHIPS.map((chip) => {
                  const isSelected = selectedRole.label === chip.label;
                  return (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => handleSelectRole(chip)}
                      className={`cursor-pointer rounded-full px-3.5 py-1 text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-[#7A1C24] text-white shadow-2xs"
                          : "border border-[#E8E2D9] bg-[#FAF8F5] text-[#1F1D1A]/80 hover:border-[#B89B72]"
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              <div>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  maxLength={40}
                  aria-label="Nhập tên khách mời để xem thử xưng hô"
                  placeholder="Gõ tên khách (vd: Chú Bảy, Lan Anh)..."
                  className="h-10 w-full rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] px-3.5 text-[16px] text-[#1F1D1A] placeholder:text-[#6B655E]/70 focus:border-[#7A1C24] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7A1C24]/20 sm:text-xs"
                />
              </div>

              <div className="rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] p-4">
                <div className="flex items-center gap-2 border-b border-[#E8E2D9]/70 pb-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0068FF] text-white text-[11px] font-bold">
                    Z
                  </div>
                  <span className="text-xs font-semibold text-[#1F1D1A]">Tin nhắn mời cưới gửi qua Zalo</span>
                </div>

                <div className="mt-3 rounded-xl border border-[#E8E2D9] bg-white p-3.5 shadow-2xs">
                  <p className="text-xs font-semibold text-[#7A1C24]">
                    {salutation.invitePrefix}: {salutation.guestLabel}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#1F1D1A]">
                    {salutation.zaloMessage}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between border-t border-[#E8E2D9]/60 pt-2 text-[11px] text-[#8A6838]">
                    <span className="font-serif italic">inviwedd.date/m/7a8f12...</span>
                    <span className="text-[#6B655E]">Xem thiệp riêng →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Vé mời & VietQR mừng cưới */}
          <div className="flex flex-col justify-between rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-2xs transition-all hover:border-[#B89B72]/60 sm:p-7">
            <div>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-2.5 py-0.5 text-[11px] font-medium text-[#7A1C24]">
                  Tiện ích đón tiếp
                </span>
                <span className="text-[11px] font-semibold text-[#8A6838] tracking-wider uppercase">
                  Boarding Pass &amp; VietQR
                </span>
              </div>

              <h3 className="mt-3 font-serif text-2xl font-normal text-[#1F1D1A] sm:text-3xl">
                Vé mời &amp; VietQR mừng cưới
              </h3>
            </div>

            {/* Visual: Boarding Pass Mockup */}
            <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#B89B72]/40 bg-[#FAF8F5] shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-12">
                {/* Left Body */}
                <div className="p-4 sm:p-5 md:col-span-8">
                  <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-2">
                    <span className="text-[10px] font-semibold tracking-widest text-[#8A6838] uppercase">
                      WEDDING BOARDING PASS
                    </span>
                    <span className="text-[10px] text-[#6B655E]">HẠNG THƯƠNG GIA</span>
                  </div>

                  <div className="mt-3">
                    <p className="text-[11px] text-[#6B655E]">Kính mời quý khách</p>
                    <p className="font-serif text-lg font-medium text-[#1F1D1A] sm:text-xl">
                      Chú Bảy cùng Gia đình
                    </p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                    <div>
                      <span className="text-[#6B655E]">Khẩu phần:</span>{" "}
                      <span className="font-semibold text-[#1F1D1A]">2 người · Mặn</span>
                    </div>
                    <div>
                      <span className="text-[#6B655E]">Thời gian:</span>{" "}
                      <span className="font-semibold text-[#1F1D1A]">18:00 · 20/03/2027</span>
                    </div>
                  </div>
                </div>

                {/* Perforated Divider & Stub */}
                <div className="relative flex flex-col items-center justify-center border-t border-dashed border-[#B89B72]/40 p-4 bg-[#F4EFEA] md:col-span-4 md:border-t-0 md:border-l">
                  <span className="text-[10px] font-semibold text-[#6B655E] tracking-wider uppercase">
                    VỊ TRÍ BÀN
                  </span>
                  <div className="mt-1 font-serif text-2xl font-bold tracking-tight text-[#7A1C24]">
                    BÀN 08
                  </div>

                  <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-[#E8E2D9] bg-white px-2.5 py-1 shadow-2xs">
                    <QrCode className="h-3.5 w-3.5 text-[#1F1D1A]" />
                    <span className="text-[10px] font-medium text-[#1F1D1A]">Quét VietQR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
