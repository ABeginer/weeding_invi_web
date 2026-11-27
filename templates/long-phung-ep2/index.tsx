"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, MapPin, Calendar, Clock, Heart, Volume2, VolumeX } from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { GuestDiet, GuestStatus } from "@/lib/types";
import type { TemplateData, WeddingEvent } from "@/lib/wedding-types";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   Long Phụng Ep2 — Hoàng gia Á Đông hiện đại
   Màu sắc:
     - Đỏ rượu vang hoàng gia: #6B0F14 (gradient #7E141B -> #6B0F14 -> #3D0609)
     - Kem lụa cao cấp: #FAF6F0
     - Vàng kim cung đình: #D8B268 (viền #B88F42)
     - Chữ trên đỏ: Vàng kem sáng #F5E8CE
     - Chữ trên kem: Đỏ son #6B0F14 & Nâu thẫm #3B0A0D
   Font:
     - Tên & Tiêu đề: Cormorant Garamond / Playfair Display
     - Thư mời & Nội dung: Lora / Be Vietnam Pro
   ============================================================ */

const RED_MAIN = "#6B0F14";
const RED_DARK = "#45080C";
const BG_DARK = "#2D0508";
const SILK_CREAM = "#FAF6F0";
const SILK_CREAM_CARD = "#F5EFE6";
const GOLD = "#D8B268";
const GOLD_BORDER = "#B88F42";
const GOLD_SOFT = "rgba(216, 178, 104, 0.28)";
const TEXT_GOLD_LIGHT = "#F5E8CE";
const TEXT_INK = "#3B0A0D";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-lora), Georgia, serif";

const EASE = [0.16, 1, 0.3, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "17:30", label: "Đón tiếp quan khách" },
  { time: "18:30", label: "Cử hành hôn lễ" },
  { time: "19:00", label: "Khai tiệc mừng cưới" },
  { time: "20:00", label: "Âm nhạc & Chụp ảnh kỷ niệm" },
  { time: "21:00", label: "Tiễn khách" },
];

const DEFAULT_DRESS = ["#6B0F14", "#D8B268", "#FAF6F0"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Màn hình Mở Thiệp / Phong Bì (Envelope Cover)
   ------------------------------------------------------------ */
function EnvelopeCover({
  data,
  guestName,
  closing,
  contained,
  onOpen,
}: {
  data: TemplateData;
  guestName: string;
  closing: boolean;
  contained: boolean;
  onOpen: () => void;
}) {
  const reduce = useReducedMotion();
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const dateParts = formatWeddingDateParts(targetEvent?.startsAt ?? data.date);

  return (
    <m.div
      className={cn(
        "z-50 flex items-center justify-center overflow-hidden",
        contained ? "absolute inset-0 h-full w-full" : "fixed inset-0 h-full w-full",
      )}
      style={{ backgroundColor: BG_DARK }}
      animate={closing ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.75, ease: "easeInOut", delay: closing ? 0.2 : 0 }}
    >
      {/* Nền đỏ nhung trầm hoàng gia */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(130% 90% at 50% 45%, #7E141B 0%, ${RED_MAIN} 50%, ${BG_DARK} 100%)`,
        }}
      />

      {/* Ánh kim mờ lấp lánh */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage: `radial-gradient(${GOLD} 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      <div
        className={cn(
          "relative z-20 flex w-full max-w-[420px] flex-col items-center px-4 text-center",
          contained ? "py-4 my-auto" : "py-8",
        )}
      >
        {/* Lời đề tặng người nhận */}
        <m.div
          className="mb-4 text-center"
          initial={reduce ? false : { y: -20, opacity: 0 }}
          animate={closing ? { y: -30, opacity: 0 } : { y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <p
            className="text-xs font-medium tracking-[0.2em] uppercase"
            style={{ color: GOLD, fontFamily: BODY_FONT }}
          >
            {data.ui.invitePrefix || "Trân trọng kính mời"}
          </p>
          <h2
            className="mt-1 text-xl sm:text-2xl font-bold tracking-wide"
            style={{ color: TEXT_GOLD_LIGHT, fontFamily: TITLE_FONT }}
          >
            {guestName || data.ui.defaultGuestName || "Quý Khách Quý Mến"}
          </h2>
        </m.div>

        {/* Khung phong bì chính */}
        <m.div
          className="relative w-full max-w-[360px] cursor-pointer select-none"
          onClick={onOpen}
          initial={reduce ? false : { scale: 0.9, opacity: 0 }}
          animate={closing ? { scale: 1.06, y: -40, opacity: 0 } : { scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.65, ease: EASE }}
          whileHover={reduce ? undefined : { scale: 1.02 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
        >
          {/* Ảnh phong bì */}
          <div className="relative aspect-[16/10.5] w-full overflow-hidden rounded-xl shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img decoding="async"
              src="/templates/long-phung-ep2/envelope-front.webp"
              alt="Thiệp cưới Long Phụng"
              className="h-full w-full object-cover"
              loading="eager"
            />

            {/* Con dấu chạm mở thiệp */}
            <div className="absolute inset-0 flex items-center justify-center">
              <m.div
                className="relative flex h-16 w-16 items-center justify-center rounded-full p-1"
                animate={reduce ? undefined : { scale: [1, 1.08, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" decoding="async"
                  src="/templates/long-phung-ep2/seal-gold.webp"
                  alt="Mở thiệp"
                  className="h-full w-full object-contain drop-shadow-md"
                />
              </m.div>
            </div>
          </div>

          {/* Dòng chữ mời chạm mở */}
          <m.div
            className="mt-6 flex flex-col items-center gap-1"
            animate={reduce ? undefined : { y: [0, -3, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <span
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase shadow-md backdrop-blur-sm"
              style={{
                backgroundColor: "rgba(216, 178, 104, 0.15)",
                color: GOLD,
                border: `1px solid ${GOLD_BORDER}`,
              }}
            >
              <span>{data.ui.tapHint || "Chạm để mở thiệp"}</span>
            </span>
            <p className="text-[11px] text-stone-300 opacity-80" style={{ fontFamily: BODY_FONT }}>
              {dateParts.weekday}, {dateParts.day} tháng {dateParts.month} năm {dateParts.year}
            </p>
          </m.div>
        </m.div>
      </div>
    </m.div>
  );
}

/* ------------------------------------------------------------
   Section 1: Hero Hoàng Gia (bám sát pic1)
   ------------------------------------------------------------ */
function RoyalHeroSection({ data }: { data: TemplateData }) {
  const reduce = useReducedMotion();
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const dateParts = formatWeddingDateParts(targetEvent?.startsAt ?? data.date);
  const lunarText = formatLunarDateClean(targetEvent?.lunarDate ?? "");

  return (
    <section
      className="relative min-h-[92vh] overflow-hidden px-4 py-12 flex flex-col items-center justify-between text-center"
      style={{
        background: `radial-gradient(120% 90% at 50% 25%, #7E141B 0%, ${RED_MAIN} 60%, ${BG_DARK} 100%)`,
        color: TEXT_GOLD_LIGHT,
      }}
    >
      {/* Khung viền kép vàng hoàng gia */}
      <div
        className="pointer-events-none absolute inset-3 rounded-2xl border"
        style={{ borderColor: GOLD_SOFT }}
      >
        <div
          className="absolute inset-1 rounded-xl border"
          style={{ borderColor: "rgba(216, 178, 104, 0.18)" }}
        />
        {/* 4 Góc hoa văn vàng */}
        <div className="absolute top-0 left-0 w-12 h-12 p-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async" src="/templates/long-phung-ep2/corner-gold.webp" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute top-0 right-0 w-12 h-12 p-1 -scale-x-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async" src="/templates/long-phung-ep2/corner-gold.webp" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-0 left-0 w-12 h-12 p-1 -scale-y-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async" src="/templates/long-phung-ep2/corner-gold.webp" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-0 right-0 w-12 h-12 p-1 -scale-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async" src="/templates/long-phung-ep2/corner-gold.webp" alt="" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Header đỉnh: Con dấu & Họa tiết viền */}
      <div className="relative z-10 pt-2 flex flex-col items-center">
        <m.div
          className="relative h-14 w-14 mb-2"
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          whileInView={reduce ? undefined : { scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async"
            src="/templates/long-phung-ep2/seal-gold.webp"
            alt="Song Hỷ"
            className="w-full h-full object-contain drop-shadow"
          />
        </m.div>
        <p
          className="text-[11px] font-semibold tracking-[0.28em] uppercase"
          style={{ color: GOLD, fontFamily: TITLE_FONT }}
        >
          {targetEvent?.title || "LỄ THÀNH HÔN"}
        </p>
      </div>

      {/* Khối tên Cô dâu & Chú rể 3 dòng sang trọng */}
      <div className="relative z-10 my-auto py-6 max-w-sm w-full">
        <m.div
          initial={reduce ? false : { y: 25, opacity: 0 }}
          whileInView={reduce ? undefined : { y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: EASE }}
        >
          <span
            className="block text-3xl sm:text-4xl font-bold uppercase tracking-wider"
            style={{ color: TEXT_GOLD_LIGHT, fontFamily: NAME_FONT }}
          >
            {data.couple.groomName}
          </span>
          <span
            className="block my-2 text-2xl font-normal italic"
            style={{ color: GOLD, fontFamily: TITLE_FONT }}
          >
            &amp;
          </span>
          <span
            className="block text-3xl sm:text-4xl font-bold uppercase tracking-wider"
            style={{ color: TEXT_GOLD_LIGHT, fontFamily: NAME_FONT }}
          >
            {data.couple.brideName}
          </span>
        </m.div>

        {/* Thanh kẻ vàng chia mục */}
        <div className="my-5 flex items-center justify-center">
          <div className="w-48 h-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" decoding="async" src="/templates/long-phung-ep2/divider-gold.webp" alt="" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Ngày cưới Dương Lịch & Âm Lịch */}
        <m.div
          className="space-y-1"
          initial={reduce ? false : { opacity: 0 }}
          whileInView={reduce ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <p
            className="text-base sm:text-lg font-semibold tracking-wide"
            style={{ color: TEXT_GOLD_LIGHT, fontFamily: TITLE_FONT }}
          >
            {dateParts.weekday}, {dateParts.day} THÁNG {dateParts.month} NĂM {dateParts.year}
          </p>
          {lunarText && (
            <p className="text-xs text-stone-300 italic opacity-85" style={{ fontFamily: BODY_FONT }}>
              (Tức {lunarText})
            </p>
          )}
        </m.div>
      </div>

      {/* Rồng vàng (góc dưới trái) & Phụng vàng (góc dưới phải) */}
      <div className="relative z-10 w-full flex items-end justify-between px-2 pt-4">
        {/* Rồng vàng */}
        <m.div
          className="pointer-events-none relative -mb-4 -ml-2 w-32 sm:w-40"
          initial={reduce ? false : { x: -30, opacity: 0 }}
          whileInView={reduce ? undefined : { x: 0, opacity: 1 }}
          viewport={{ once: true }}
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{
            opacity: { duration: 0.8 },
            x: { duration: 0.8 },
            y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async"
            src="/templates/long-phung-ep2/dragon.webp"
            alt="Rồng vàng"
            className="w-full object-contain drop-shadow"
          />
        </m.div>

        {/* Thông điệp tình yêu ở giữa */}
        <p
          className="mb-2 max-w-[170px] text-[11px] leading-relaxed text-stone-300 italic opacity-80"
          style={{ fontFamily: BODY_FONT }}
        >
          {data.quote || "Trăm năm tình viên mãn · Bạc đầu nghĩa phu thê"}
        </p>

        {/* Phụng vàng */}
        <m.div
          className="pointer-events-none relative -mb-4 -mr-2 w-32 sm:w-40"
          initial={reduce ? false : { x: 30, opacity: 0 }}
          whileInView={reduce ? undefined : { x: 0, opacity: 1 }}
          viewport={{ once: true }}
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={{
            opacity: { duration: 0.8 },
            x: { duration: 0.8 },
            y: { duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async"
            src="/templates/long-phung-ep2/phoenix.webp"
            alt="Phụng vàng"
            className="w-full object-contain drop-shadow"
          />
        </m.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Section 2: Thư Mời Trang Trọng (bám sát pic2)
   ------------------------------------------------------------ */
function FormalInvitationSection({ data }: { data: TemplateData }) {
  const reduce = useReducedMotion();
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const dateParts = formatWeddingDateParts(targetEvent?.startsAt ?? data.date);

  // Xử lý tách dòng cha mẹ theo chuẩn card_exp §20 (xóa kí hiệu '&')
  const groomParents = (data.couple.groomParents || "").split("&").map((p) => p.trim()).filter(Boolean);
  const brideParents = (data.couple.brideParents || "").split("&").map((p) => p.trim()).filter(Boolean);

  return (
    <section
      className="relative px-4 py-14 text-center"
      style={{ backgroundColor: SILK_CREAM, color: TEXT_INK }}
    >
      <div className="relative mx-auto max-w-lg rounded-2xl border p-6 sm:p-8 shadow-sm" style={{ backgroundColor: "#FFFFFF", borderColor: "rgba(216, 178, 104, 0.4)" }}>
        {/* 4 Góc hoa văn vàng */}
        <div className="absolute top-2 left-2 w-8 h-8 opacity-75">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async" src="/templates/long-phung-ep2/corner-gold.webp" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute top-2 right-2 w-8 h-8 opacity-75 -scale-x-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async" src="/templates/long-phung-ep2/corner-gold.webp" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-2 left-2 w-8 h-8 opacity-75 -scale-y-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async" src="/templates/long-phung-ep2/corner-gold.webp" alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-2 right-2 w-8 h-8 opacity-75 -scale-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async" src="/templates/long-phung-ep2/corner-gold.webp" alt="" className="w-full h-full object-contain" />
        </div>

        {/* Tiêu đề mục */}
        <p
          className="text-xs font-bold tracking-[0.25em] uppercase"
          style={{ color: GOLD_BORDER, fontFamily: TITLE_FONT }}
        >
          THƯ MỜI TIỆC CƯỚI
        </p>

        <p className="mt-4 text-xs sm:text-sm text-stone-600 leading-relaxed" style={{ fontFamily: BODY_FONT }}>
          Trân trọng kính mời quý khách đến chung vui cùng gia đình chúng tôi tại lễ thành hôn của
        </p>

        {/* Tên cặp đôi nổi bật màu đỏ son */}
        <div className="my-5 py-2">
          <h3
            className="text-2xl sm:text-3xl font-bold tracking-wide"
            style={{ color: RED_MAIN, fontFamily: NAME_FONT }}
          >
            {data.couple.groomFullName || data.couple.groomName}
          </h3>
          <p className="my-1 text-sm font-semibold italic text-stone-400" style={{ fontFamily: TITLE_FONT }}>
            sánh duyên cùng
          </p>
          <h3
            className="text-2xl sm:text-3xl font-bold tracking-wide"
            style={{ color: RED_MAIN, fontFamily: NAME_FONT }}
          >
            {data.couple.brideFullName || data.couple.brideName}
          </h3>
        </div>

        {/* Dải phân cách vàng */}
        <div className="my-6 flex justify-center">
          <div className="w-40 h-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" decoding="async" src="/templates/long-phung-ep2/divider-gold.webp" alt="" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Hai bên gia đình bằng nhau */}
        <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm items-stretch">
          <div className="flex flex-col justify-start rounded-xl p-3" style={{ backgroundColor: SILK_CREAM_CARD }}>
            <p className="font-bold uppercase tracking-wider text-[11px]" style={{ color: RED_MAIN }}>
              NHÀ TRAI
            </p>
            <div className="mt-2 space-y-1 text-stone-700" style={{ fontFamily: BODY_FONT }}>
              {groomParents.length > 0 ? (
                groomParents.map((parent, idx) => <p key={idx}>{parent}</p>)
              ) : (
                <p>Gia đình Nhà Trai</p>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-start rounded-xl p-3" style={{ backgroundColor: SILK_CREAM_CARD }}>
            <p className="font-bold uppercase tracking-wider text-[11px]" style={{ color: RED_MAIN }}>
              NHÀ GÁI
            </p>
            <div className="mt-2 space-y-1 text-stone-700" style={{ fontFamily: BODY_FONT }}>
              {brideParents.length > 0 ? (
                brideParents.map((parent, idx) => <p key={idx}>{parent}</p>)
              ) : (
                <p>Gia đình Nhà Gái</p>
              )}
            </div>
          </div>
        </div>

        {/* Thời gian & Địa điểm tiệc */}
        <div className={`mt-6 space-y-3 ${visibleEvents.length > 1 ? "text-left" : "text-center"}`}>
          {visibleEvents.map((evt, idx) => {
            const evtParts = formatWeddingDateParts(evt.startsAt);
            const directionsUrl = getEventDirectionsUrl(evt);
            return (
              <div
                key={evt.id || idx}
                className="rounded-xl border p-4 text-center"
                style={{ borderColor: GOLD_SOFT, backgroundColor: "#FFFDF9" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: GOLD_BORDER }}>
                  {evt.title}
                </p>
                <p className="mt-1 text-base font-bold" style={{ color: RED_MAIN, fontFamily: TITLE_FONT }}>
                  Vào lúc {evt.startsAt ? evt.startsAt.slice(11, 16) : "18:00"} · {evtParts.weekday}, {evtParts.day}/{evtParts.month}/{evtParts.year}
                </p>
                <p className="mt-2 text-sm font-semibold text-stone-800">{evt.venueName}</p>
                <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">{evt.venueAddress}</p>
                {directionsUrl && (
                  <div className="mt-3">
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs transition hover:opacity-95"
                      style={{ backgroundColor: RED_MAIN }}
                    >
                      <MapPin className="h-3.5 w-3.5 text-amber-300" />
                      <span>Xem bản đồ chỉ đường</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Section 3: Album Ảnh Cưới (bám sát pic3 - coverflow mượt mà)
   ------------------------------------------------------------ */
function RoyalGallerySection({ data }: { data: TemplateData }) {
  const reduce = useReducedMotion();
  const gallery = data.photos?.gallery || [];
  const [activeIndex, setActiveIndex] = React.useState(0);

  if (gallery.length === 0) {
    return (
      <section className="px-4 py-12 text-center" style={{ backgroundColor: SILK_CREAM }}>
        <p className="text-xs font-bold tracking-[0.25em] uppercase text-stone-500 mb-6" style={{ fontFamily: TITLE_FONT }}>
          ALBUM KỶ NIỆM
        </p>
        <TemplatePhotoPlaceholder label="Chưa có ảnh cưới trong album" />
      </section>
    );
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
  };

  return (
    <section className="relative px-4 py-14 overflow-hidden text-center" style={{ backgroundColor: SILK_CREAM }}>
      <p
        className="text-xs font-bold tracking-[0.25em] uppercase"
        style={{ color: GOLD_BORDER, fontFamily: TITLE_FONT }}
      >
        ALBUM ẢNH CƯỚI
      </p>
      <h2
        className="mt-1 text-2xl font-bold tracking-wide"
        style={{ color: RED_MAIN, fontFamily: NAME_FONT }}
      >
        Khoảnh Khắc Hạnh Phúc
      </h2>

      {/* Coverflow Carousel */}
      <div className="relative mt-8 mx-auto max-w-sm flex items-center justify-center">
        {/* Nút lùi */}
        <button
          type="button"
          onClick={handlePrev}
          aria-label="Ảnh trước"
          className="absolute -left-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-110 active:scale-95"
          style={{ color: RED_MAIN }}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Khung ảnh chính */}
        <div className="relative w-full aspect-[3/4] overflow-hidden rounded-2xl border-2 shadow-xl" style={{ borderColor: GOLD }}>
          <AnimatePresence mode="wait">
            <m.img
              key={activeIndex}
              src={gallery[activeIndex]?.url}
              alt="Ảnh cưới"
              className="h-full w-full object-cover"
              initial={reduce ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.45, ease: EASE }}
            />
          </AnimatePresence>
        </div>

        {/* Nút tới */}
        <button
          type="button"
          onClick={handleNext}
          aria-label="Ảnh kế tiếp"
          className="absolute -right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-110 active:scale-95"
          style={{ color: RED_MAIN }}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Dải dots phân trang */}
      <div className="mt-5 flex justify-center gap-1.5">
        {gallery.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActiveIndex(idx)}
            aria-label={`Xem ảnh ${idx + 1}`}
            className="h-2 rounded-full transition-all"
            style={{
              width: idx === activeIndex ? "24px" : "8px",
              backgroundColor: idx === activeIndex ? RED_MAIN : "#D1C7B7",
            }}
          />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Section 4: Lịch Tháng, Đếm Ngược & Chỉ Đường (bám sát pic4)
   ------------------------------------------------------------ */
function CalendarCountdownSection({ data }: { data: TemplateData }) {
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const targetDateStr = targetEvent?.startsAt ?? data.date;
  const weddingDate = React.useMemo(() => new Date(targetDateStr), [targetDateStr]);

  // Đếm ngược thời gian
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = weddingDate.getTime() - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [weddingDate]);

  // Tạo lưới lịch tháng tự động
  const month = weddingDate.getMonth();
  const year = weddingDate.getFullYear();

  const eventDays = React.useMemo(() => {
    const days = new Set<number>();
    visibleEvents.forEach((evt) => {
      if (evt.startsAt) {
        const d = new Date(evt.startsAt);
        if (d.getFullYear() === year && d.getMonth() === month) {
          days.add(d.getDate());
        }
      }
    });
    if (days.size === 0 && !isNaN(weddingDate.getTime())) {
      days.add(weddingDate.getDate());
    }
    return days;
  }, [visibleEvents, year, month, weddingDate]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // T2 là 0, CN là 6

  const calendarDays = React.useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDayOfWeek, daysInMonth]);

  return (
    <section className="relative px-4 py-14 text-center" style={{ backgroundColor: SILK_CREAM }}>
      <div className="mx-auto max-w-sm rounded-2xl border p-6 shadow-sm" style={{ backgroundColor: "#FFFFFF", borderColor: GOLD_BORDER }}>
        <p
          className="text-xs font-bold tracking-[0.25em] uppercase"
          style={{ color: GOLD_BORDER, fontFamily: TITLE_FONT }}
        >
          THÁNG {month + 1} · {year}
        </p>

        {/* Lưới lịch tháng */}
        <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs font-medium">
          {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dayName, idx) => (
            <div key={idx} className="py-1 font-bold text-stone-400">
              {dayName}
            </div>
          ))}

          {calendarDays.map((d, idx) => {
            const isWeddingDay = d !== null && eventDays.has(d);
            return (
              <div
                key={idx}
                className={cn(
                  "relative flex h-8 items-center justify-center rounded-full text-xs transition",
                  d ? "text-stone-700" : "opacity-0",
                  isWeddingDay && "font-bold text-white shadow-md",
                )}
                style={isWeddingDay ? { backgroundColor: RED_MAIN } : undefined}
              >
                {d}
                {isWeddingDay && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Đồng hồ đếm ngược */}
        {mounted && (
          <div className="mt-8 rounded-xl p-4 text-center" style={{ backgroundColor: SILK_CREAM_CARD, border: `1px solid ${GOLD_SOFT}` }}>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-stone-500 mb-3">
              CÙNG ĐẾM NGƯỢC ĐẾN NGÀY VUI
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: timeLeft.days, label: "Ngày" },
                { val: timeLeft.hours, label: "Giờ" },
                { val: timeLeft.minutes, label: "Phút" },
                { val: timeLeft.seconds, label: "Giây" },
              ].map((item, idx) => (
                <div key={idx} className="rounded-lg bg-white p-2 shadow-xs">
                  <span className="block text-xl font-bold" style={{ color: RED_MAIN, fontFamily: TITLE_FONT }}>
                    {String(item.val).padStart(2, "0")}
                  </span>
                  <span className="block text-[10px] text-stone-500 font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nút chỉ đường Google Maps cho từng lễ */}
        <div className="mt-6 space-y-2">
          {visibleEvents.map((evt, idx) => {
            const directionsUrl = getEventDirectionsUrl(evt);
            if (!directionsUrl) return null;
            return (
              <a
                key={evt.id || idx}
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl py-3 px-4 text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:opacity-95 active:scale-98"
                style={{ backgroundColor: RED_MAIN }}
              >
                <MapPin className="h-4 w-4 text-amber-300" />
                <span>Chỉ đường: {evt.title || "Tiệc cưới"}</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Section 5: Lịch Trình Tiệc, Hộp Mừng Cưới 3 Trạng Thái & RSVP
   (bám sát pic5 + asset_gif_box)
   ------------------------------------------------------------ */
function TimelineGiftRsvpSection({
  data,
  mode,
  inviteSlug,
  weddingSlug,
  invitationMode,
  guestName,
  initialStatus,
  initialPlusOnes,
  initialDiet,
  initialSongRequest,
  initialRideNeeded,
}: {
  data: TemplateData;
  mode: "demo" | "preview" | "live";
  inviteSlug?: string;
  weddingSlug?: string;
  invitationMode?: "personal" | "public";
  guestName?: string | null;
  initialStatus?: GuestStatus;
  initialPlusOnes?: number;
  initialDiet?: GuestDiet | null;
  initialSongRequest?: string | null;
  initialRideNeeded?: boolean;
}) {
  const reduce = useReducedMotion();
  const timeline = getTimeline(data);
  const [giftBoxState, setGiftBoxState] = React.useState<"normal" | "hover" | "active">("normal");
  const [giftModalOpen, setGiftModalOpen] = React.useState(false);

  // Preload cả 3 trạng thái của hộp mừng cưới để chuyển đổi mượt mà 0ms delay
  React.useEffect(() => {
    ["gift-normal.webp", "gift-hover.webp", "gift-active.webp"].forEach((file) => {
      const img = new Image();
      img.src = `/templates/long-phung-ep2/${file}`;
    });
  }, []);

  const handleBoxClick = () => {
    setGiftBoxState("active");
    setTimeout(() => {
      setGiftModalOpen(true);
      setGiftBoxState("normal");
    }, 380);
  };

  const hidden = new Set(data.hiddenSections || []);

  return (
    <section
      className="relative px-4 py-16 text-center"
      style={{
        background: `radial-gradient(130% 90% at 50% 30%, #7E141B 0%, ${RED_MAIN} 60%, ${BG_DARK} 100%)`,
        color: TEXT_GOLD_LIGHT,
      }}
    >
      <div className="mx-auto max-w-lg">
        {/* Lịch trình ngày vui (Timeline dọc bám sát pic5) */}
        {!hidden.has("map") && (
          <div className="mb-16">
            <p
              className="text-xs font-bold tracking-[0.25em] uppercase"
              style={{ color: GOLD, fontFamily: TITLE_FONT }}
            >
              LỊCH TRÌNH NGÀY VUI
            </p>
            <h2
              className="mt-1 text-2xl font-bold tracking-wide"
              style={{ color: TEXT_GOLD_LIGHT, fontFamily: NAME_FONT }}
            >
              Chương Trình Tiệc Cưới
            </h2>

            <div className="relative mt-8 space-y-6 before:absolute before:inset-0 before:left-1/2 before:w-0.5 before:-translate-x-1/2 before:bg-gradient-to-b before:from-amber-200/40 before:via-amber-400/60 before:to-transparent">
              {timeline.map((item, idx) => (
                <m.div
                  key={idx}
                  className="relative flex items-center justify-between"
                  initial={reduce ? false : { y: 20, opacity: 0 }}
                  whileInView={reduce ? undefined : { y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                >
                  <div className="w-[42%] text-right pr-4">
                    <span
                      className="inline-block text-base sm:text-lg font-bold tracking-wider"
                      style={{ color: GOLD, fontFamily: TITLE_FONT }}
                    >
                      {item.time}
                    </span>
                  </div>

                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border border-amber-300 bg-red-950 shadow-md">
                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                  </div>

                  <div className="w-[42%] text-left pl-4">
                    <span className="text-sm font-semibold text-stone-200" style={{ fontFamily: BODY_FONT }}>
                      {item.label}
                    </span>
                  </div>
                </m.div>
              ))}
            </div>
          </div>
        )}

        {/* Hộp Mừng Cưới Tương Tác 3 Trạng Thái (asset_gif_box) */}
        {!hidden.has("gift") && (
          <div className="mb-16 rounded-2xl border p-6 text-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.25)", borderColor: GOLD_SOFT }}>
            <p
              className="text-xs font-bold tracking-[0.25em] uppercase"
              style={{ color: GOLD, fontFamily: TITLE_FONT }}
            >
              HỘP MỪNG CƯỚI
            </p>
            <h3
              className="mt-1 text-2xl font-bold tracking-wide"
              style={{ color: TEXT_GOLD_LIGHT, fontFamily: NAME_FONT }}
            >
              Gửi Quà Chúc Phúc
            </h3>
            <p className="mt-2 text-xs text-stone-300 leading-relaxed max-w-sm mx-auto" style={{ fontFamily: BODY_FONT }}>
              Sự hiện diện và lời chúc phúc của quý khách là món quà quý giá nhất dành cho chúng tôi.
            </p>

            {/* Hộp quà tương tác */}
            <div className="my-6 flex justify-center">
              <m.div
                className="relative cursor-pointer select-none"
                onClick={handleBoxClick}
                onMouseEnter={() => setGiftBoxState("hover")}
                onMouseLeave={() => setGiftBoxState("normal")}
                whileHover={reduce ? undefined : { scale: 1.04 }}
                whileTap={reduce ? undefined : { scale: 0.96 }}
              >
                {/* 3 Trạng thái cùng kích thước 330x446 chuẩn */}
                <div className="relative h-48 w-36 sm:h-56 sm:w-40 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img loading="lazy" decoding="async"
                    src={
                      giftBoxState === "active"
                        ? "/templates/long-phung-ep2/gift-active.webp"
                        : giftBoxState === "hover"
                          ? "/templates/long-phung-ep2/gift-hover.webp"
                          : "/templates/long-phung-ep2/gift-normal.webp"
                    }
                    alt="Hộp mừng cưới"
                    className="h-full w-full object-contain filter drop-shadow-xl"
                  />
                </div>

                <div className="mt-3 flex justify-center">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-950 shadow-md"
                    style={{ backgroundColor: GOLD }}
                  >
                    Mừng cưới ngay
                  </span>
                </div>
              </m.div>
            </div>
          </div>
        )}

        {/* Modal Mừng cưới VietQR */}
        {giftModalOpen && (
          <GiftModal
            open={giftModalOpen}
            onClose={() => setGiftModalOpen(false)}
            gift={data.gift}
            plan={data.plan}
            coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
            guestName={guestName}
            tone="ruby"
          />
        )}

        {/* QR Album Ảnh Khách Mời (Pro/VIP) */}
        {!hidden.has("albumQr") && data.plan !== "free" && weddingSlug && (
          <div className="mb-14">
            <GuestAlbumQr slug={weddingSlug} accentColor="#6B0F14" textColor="#F5E8CE" />
          </div>
        )}

        {/* Xác nhận tham dự (RSVP) & Sổ lưu bút */}
        {!hidden.has("rsvp") && (
          <div className="mt-8 text-left">
            <TemplateRsvpSection
              data={data}
              mode={mode}
              tone="ruby"
              inviteSlug={inviteSlug}
              weddingSlug={weddingSlug}
              invitationMode={invitationMode || "public"}
              guestName={guestName}
              initialStatus={initialStatus}
              initialPlusOnes={initialPlusOnes}
              initialDiet={initialDiet}
              initialSongRequest={initialSongRequest}
              initialRideNeeded={initialRideNeeded}
            />
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Component Root Template: Long Phụng Ep2
   ------------------------------------------------------------ */
export default function LongPhungEp2Template({
  data,
  mode,
  contained = false,
  isOpened: isOpenedProp,
  onOpenedChange,
  inviteSlug,
  weddingSlug,
  invitationMode = "public",
  guestName = "",
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = null,
  initialSongRequest = null,
  initialRideNeeded = false,
  externalMusicControl = false,
}: WeddingTemplateProps) {
  const isControlled = typeof isOpenedProp === "boolean";
  const [localOpened, setLocalOpened] = React.useState(Boolean(isOpenedProp));
  const openState = isControlled ? isOpenedProp : localOpened;
  const [closing, setClosing] = React.useState(false);
  const [coverGone, setCoverGone] = React.useState(openState);

  // Đồng bộ prop opened 2 chiều theo card_exp §22.25 & §22.26
  React.useEffect(() => {
    if (isControlled) {
      setCoverGone(isOpenedProp);
      setLocalOpened(isOpenedProp);
    }
  }, [isControlled, isOpenedProp]);

  const handleOpen = React.useCallback(() => {
    playOpenCardSound();
    onOpenedChange?.(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    }
    setClosing(true);
    setTimeout(() => {
      setLocalOpened(true);
      setCoverGone(true);
      setClosing(false);
    }, 850);
  }, [onOpenedChange]);

  const resolvedGuest = guestName || data.ui.defaultGuestName || "Quý Khách";

  return (
    <div
      className={cn(
        "relative w-full select-text overflow-x-hidden font-sans",
        contained
          ? openState
            ? "relative h-full overflow-y-auto max-w-[440px] mx-auto shadow-2xl rounded-2xl"
            : "relative h-full overflow-hidden max-w-[440px] mx-auto shadow-2xl rounded-2xl"
          : "min-h-screen max-w-md mx-auto",
      )}
      style={{ backgroundColor: BG_DARK }}
    >
      {/* 1. Màn hình phong bì mở thiệp */}
      {!coverGone && (
        <EnvelopeCover
          data={data}
          guestName={resolvedGuest}
          closing={closing}
          contained={contained}
          onOpen={handleOpen}
        />
      )}

      {/* 2. Nội dung chính thiệp cưới (hiện khi mở thiệp) */}
      <div
        className={cn(
          "transition-opacity duration-700",
          coverGone ? "opacity-100" : "hidden opacity-0 pointer-events-none",
        )}
      >
        {/* Nút nhạc nổi */}
        {!externalMusicControl && !(data.hiddenSections || []).includes("music") && (
          <LiveMusicFloatingButton
            src={data.music?.src || "/media/co-dien.mp3"}
            title={data.music?.title}
            visible={coverGone && !(data.hiddenSections || []).includes("music")}
            tone="ruby"
          />
        )}

        {/* Section 1: Hero Hoàng Gia */}
        <RoyalHeroSection data={data} />

        {/* Section 2: Thư Mời Trang Trọng */}
        {!(data.hiddenSections || []).includes("family") && (
          <FormalInvitationSection data={data} />
        )}

        {/* Section 3: Album Ảnh Cưới */}
        {!(data.hiddenSections || []).includes("album") && (
          <RoyalGallerySection data={data} />
        )}

        {/* Section 4: Lịch Tháng, Đếm Ngược & Chỉ Đường */}
        {!(data.hiddenSections || []).includes("calendar") && (
          <CalendarCountdownSection data={data} />
        )}

        {/* Section 5: Lịch Trình Tiệc, Mừng Cưới & RSVP */}
        <TimelineGiftRsvpSection
          data={data}
          mode={mode}
          inviteSlug={inviteSlug}
          weddingSlug={weddingSlug}
          invitationMode={invitationMode}
          guestName={resolvedGuest}
          initialStatus={initialStatus}
          initialPlusOnes={initialPlusOnes}
          initialDiet={initialDiet}
          initialSongRequest={initialSongRequest}
          initialRideNeeded={initialRideNeeded}
        />

        {/* Chân trang cảm ơn */}
        <footer className="py-12 px-4 text-center border-t border-amber-900/40" style={{ backgroundColor: BG_DARK, color: GOLD }}>
          <p className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ fontFamily: TITLE_FONT }}>
            {data.ui.thankYouBody || "Cảm ơn quý khách đã đến chung vui cùng gia đình chúng tôi!"}
          </p>
          <p className="mt-2 text-[11px] text-stone-500">Inviwedd · Nền tảng thiệp cưới điện tử cao cấp</p>
        </footer>
      </div>
    </div>
  );
}
