"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Heart,
  ExternalLink,
  Volume2,
  VolumeX,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingEvent, WeddingPlan } from "@/lib/wedding-types";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   Long Phụng Ep3 — Bản Nâng Cấp Hiệu Ứng Hoàng Gia Bùng Nổ
   Bảng màu:
     - Ngọc lục bảo hoàng gia: #0C3B2E (gradient #062119 -> #0C3B2E -> #124E3D)
     - Kem lụa cao cấp: #FAF6F0
     - Vàng kim cung đình: #D4AF37 (gradient #F3E5AB -> #D4AF37 -> #997D2E)
     - Viền vàng kim: #B89326
     - Chữ trên ngọc lục bảo: Vàng kem sáng #F5E8CE & Vàng kim #D4AF37
     - Chữ trên kem lụa: Ngọc lục bảo đậm #0C3B2E & Rêu thẫm #062119
   Font chữ:
     - Tên & Tiêu đề: Cormorant Garamond / Playfair Display
     - Thư mời & Lời dẫn: Lora / Be Vietnam Pro
   ============================================================ */

const EMERALD_DARK = "#062119";
const EMERALD_MAIN = "#0C3B2E";
const EMERALD_LIGHT = "#14533D";
const SILK_CREAM = "#FAF6F0";
const SILK_CREAM_CARD = "#F5EFE6";
const GOLD_MAIN = "#D4AF37";
const GOLD_LIGHT = "#F3E5AB";
const GOLD_BORDER = "#B89326";
const GOLD_SOFT = "rgba(212, 175, 55, 0.28)";
const TEXT_GOLD_LIGHT = "#F5E8CE";
const TEXT_EMERALD_DARK = "#062119";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-lora), Georgia, serif";

const EASE_ROYAL = [0.16, 1, 0.3, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "17:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm" },
  { time: "18:30", label: "Nghi lễ thành hôn long trọng" },
  { time: "19:00", label: "Khai tiệc mừng uyên ương giao bái" },
  { time: "20:00", label: "Giai điệu tình ca & Trò chơi gắn kết" },
  { time: "21:00", label: "Tiễn khách & Trao quà cảm tạ" },
];

const DEFAULT_DRESS = ["#0C3B2E", "#D4AF37", "#FAF6F0"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Hạt Kim Sa Vàng Lấp Lánh (Gold Dust Floating Particles)
   ------------------------------------------------------------ */
function GoldDustParticles({ count = 18 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 17) % 94 + 3}%`,
      size: (idx % 3) + 2,
      duration: 6 + (idx % 5) * 1.8,
      delay: (idx * 0.45) % 4,
      yOffset: 30 + (idx % 4) * 20,
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <m.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            background: "radial-gradient(circle, #FFF2B2 20%, #D4AF37 70%, transparent 100%)",
            boxShadow: "0 0 6px 1px rgba(243, 229, 171, 0.7)",
          }}
          animate={{
            y: [0, -450 - p.yOffset],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * 22, 0],
            opacity: [0, 0.85, 0.95, 0.4, 0],
            scale: [0.6, 1.2, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------
   Màn hình Mở Thiệp Hoàng Gia (Splash / Envelope Entrance — 100dvh)
   ------------------------------------------------------------ */
function EnvelopeCover({
  data,
  guestName,
  contained,
  onOpen,
}: {
  data: TemplateData;
  guestName: string;
  contained: boolean;
  onOpen: () => void;
}) {
  const reduce = useReducedMotion();
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const dateParts = formatWeddingDateParts(targetEvent?.startsAt ?? data.date);
  const [openingStage, setOpeningStage] = React.useState(false);

  const handleTriggerOpen = () => {
    if (openingStage) return;
    setOpeningStage(true);
    setTimeout(() => {
      onOpen();
    }, 450);
  };

  return (
    <m.div
      className={cn(
        "z-50 flex items-center justify-center overflow-hidden",
        contained ? "absolute inset-0 h-full w-full" : "fixed inset-0 h-full w-full",
      )}
      style={{ backgroundColor: EMERALD_DARK }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Nền gấm ngọc lục bảo hoàng gia */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
        style={{ backgroundImage: "url('/templates/long-phung-ep3/background.webp')" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(20, 83, 61, 0.8) 0%, rgba(12, 59, 46, 0.95) 45%, #062119 100%)",
        }}
      />

      {/* Rèm ngọc lục bảo tách đôi khi mở */}
      {openingStage && !reduce && (
        <div className="pointer-events-none absolute inset-0 z-[5]">
          <m.div
            className="pointer-events-none absolute inset-y-0 left-0 w-1/2 border-r border-[#D4AF37]/30"
            style={{
              background: "linear-gradient(90deg, #062119 0%, #0C3B2E 100%)",
            }}
            initial={{ x: "0%" }}
            animate={{ x: "-105%" }}
            transition={{ duration: 0.8, ease: EASE_ROYAL }}
          />
          <m.div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 border-l border-[#D4AF37]/30"
            style={{
              background: "linear-gradient(270deg, #062119 0%, #0C3B2E 100%)",
            }}
            initial={{ x: "0%" }}
            animate={{ x: "105%" }}
            transition={{ duration: 0.8, ease: EASE_ROYAL }}
          />
        </div>
      )}

      {/* Hiệu ứng hạt bụi vàng kim */}
      <GoldDustParticles count={22} />

      {/* Khung viền chỉ vàng kim ngoại biên & 4 góc hoa văn hoàng gia */}
      <div className="pointer-events-none absolute inset-4 rounded-xl border border-[#D4AF37]/40 md:inset-8">
        <div className="absolute inset-1 rounded-lg border border-[#D4AF37]/20" />
        {/* 4 Góc hoa văn hoàng gia ôm sát đúng 4 đỉnh khung viền */}
        <img loading="lazy" decoding="async"
          src="/templates/long-phung-ep3/corner-tl.webp"
          alt=""
          className="pointer-events-none absolute left-0 top-0 h-auto w-10 opacity-80 sm:w-12 md:w-14"
          aria-hidden="true"
        />
        <img loading="lazy" decoding="async"
          src="/templates/long-phung-ep3/corner-tr.webp"
          alt=""
          className="pointer-events-none absolute right-0 top-0 h-auto w-10 opacity-80 sm:w-12 md:w-14"
          aria-hidden="true"
        />
        <img loading="lazy" decoding="async"
          src="/templates/long-phung-ep3/corner-bl.webp"
          alt=""
          className="pointer-events-none absolute bottom-0 left-0 h-auto w-10 opacity-80 sm:w-12 md:w-14"
          aria-hidden="true"
        />
        <img loading="lazy" decoding="async"
          src="/templates/long-phung-ep3/corner-br.webp"
          alt=""
          className="pointer-events-none absolute bottom-0 right-0 h-auto w-10 opacity-80 sm:w-12 md:w-14"
          aria-hidden="true"
        />
      </div>

      {/* Khối nội dung trung tâm của phong bì */}
      <m.div
        className={cn(
          "relative z-10 flex max-w-sm flex-col items-center px-6 text-center",
          contained ? "py-4 my-auto" : "py-8",
        )}
        animate={openingStage ? { scale: 0.9, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Lời trân trọng kính mời */}
        <m.p
          className="text-xs uppercase tracking-[0.35em]"
          style={{ color: GOLD_LIGHT, fontFamily: BODY_FONT }}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          {data.ui?.invitePrefix || "Trân Trọng Kính Mời"}
        </m.p>

        {/* Tên khách mời cá nhân hóa (nếu có) */}
        {guestName && guestName.trim().length > 0 ? (
          <m.div
            className="my-3 rounded-md px-4 py-1.5"
            style={{
              backgroundColor: "rgba(12, 59, 46, 0.7)",
              border: `1px solid ${GOLD_BORDER}`,
              boxShadow: "0 0 15px rgba(212, 175, 55, 0.25)",
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <p className="text-xs tracking-wider text-[#FAF6F0]/80">Kính gửi Quý Khách</p>
            <p className="text-base font-semibold tracking-wide" style={{ color: GOLD_LIGHT }}>
              {guestName}
            </p>
          </m.div>
        ) : (
          <div className="my-2 h-2" />
        )}

        {/* Con dấu vàng kim trung tâm tỏa hào quang nhịp thở & Shimmer beam */}
        <div className="relative my-4 flex items-center justify-center">
          {/* Vòng hào quang nhịp thở (Pulse glow) */}
          <m.div
            className="pointer-events-none absolute -inset-6 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(212, 175, 55, 0.45) 0%, rgba(212, 175, 55, 0.1) 60%, transparent 80%)",
            }}
            animate={
              reduce
                ? {}
                : {
                  scale: [0.92, 1.15, 0.92],
                  opacity: [0.55, 0.95, 0.55],
                }
            }
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Vòng kim sa thứ hai */}
          <m.div
            className="pointer-events-none absolute -inset-3 rounded-full border border-[#D4AF37]/50"
            animate={
              reduce
                ? {}
                : {
                  rotate: 360,
                }
            }
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
          />

          {/* Con dấu vàng kim Song Hỷ */}
          <m.div
            className="relative h-28 w-28 md:h-32 md:w-32"
            animate={
              openingStage
                ? { scale: [1, 1.25, 0], rotate: [0, 45, 90], opacity: [1, 1, 0] }
                : { scale: 1 }
            }
            transition={{ duration: 0.6, ease: EASE_ROYAL }}
          >
            <img loading="lazy" decoding="async"
              src="/templates/long-phung-ep3/seal-gold.webp"
              alt="Hoàng gia Song Hỷ"
              className="h-full w-full object-contain drop-shadow-[0_4px_16px_rgba(212,175,55,0.55)]"
            />
            {/* Tia sáng quét chéo qua con dấu (Shimmer beam) */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
              <m.div
                className="absolute -inset-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                style={{ transform: "rotate(35deg)" }}
                animate={
                  reduce
                    ? {}
                    : {
                      x: ["-100%", "200%"],
                    }
                }
                transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
              />
            </div>
          </m.div>
        </div>

        {/* Tên cặp đôi lồng chữ 3 dòng */}
        <div className="mb-2 mt-1 space-y-0.5">
          <span
            className="block text-2xl tracking-wide md:text-3xl"
            style={{
              fontFamily: NAME_FONT,
              color: GOLD_LIGHT,
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            {data.couple?.groomName ?? "Chú Rể"}
          </span>
          <span
            className="block text-sm italic"
            style={{ color: GOLD_MAIN, fontFamily: TITLE_FONT }}
          >
            &
          </span>
          <span
            className="block text-2xl tracking-wide md:text-3xl"
            style={{
              fontFamily: NAME_FONT,
              color: GOLD_LIGHT,
              textShadow: "0 2px 8px rgba(0,0,0,0.6)",
            }}
          >
            {data.couple?.brideName ?? "Cô Dâu"}
          </span>
        </div>

        {/* Dải phân cách mây sen vàng */}
        <img loading="lazy" decoding="async"
          src="/templates/long-phung-ep3/divider-ribbon.webp"
          alt=""
          className="my-2 h-auto w-40 opacity-80"
          aria-hidden="true"
        />

        {/* Ngày cưới */}
        <p className="text-xs tracking-widest text-[#FAF6F0]/85" style={{ fontFamily: BODY_FONT }}>
          {dateParts.weekday ? `${dateParts.weekday}, ` : ""}
          {dateParts.day} THÁNG {dateParts.month} NĂM {dateParts.year}
        </p>

        {/* Nút bấm "MỞ THIỆP" bùng nổ hiệu ứng */}
        <m.button
          type="button"
          onClick={handleTriggerOpen}
          className="group relative mt-6 inline-flex items-center gap-2.5 overflow-hidden rounded-full px-8 py-3 text-sm font-semibold tracking-widest uppercase transition-all"
          style={{
            background: "linear-gradient(135deg, #D4AF37 0%, #B89326 50%, #997D2E 100%)",
            color: "#062119",
            boxShadow:
              "0 4px 20px rgba(212, 175, 55, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
        >
          <span>Mở Thiệp Cưới</span>

          {/* Tia sáng quét nút bấm */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
        </m.button>
      </m.div>
    </m.div>
  );
}

/* ------------------------------------------------------------
   Section 1: Hero Hoàng Gia — Long Phụng Khí Thế & Chữ Kim Sa
   ------------------------------------------------------------ */
function HeroSection({
  data,
  isOpened,
}: {
  data: TemplateData;
  isOpened: boolean;
}) {
  const reduce = useReducedMotion();
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const dateParts = formatWeddingDateParts(targetEvent?.startsAt ?? data.date);
  const lunarText = formatLunarDateClean(targetEvent?.lunarDate ?? "");

  return (
    <section className="relative min-h-[92dvh] overflow-hidden px-4 pt-16 pb-20 md:min-h-screen md:pt-24 md:pb-28">
      {/* Nền gấm ngọc lục bảo */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundColor: EMERALD_MAIN,
          backgroundImage: "url('/templates/long-phung-ep3/background.webp')",
          backgroundBlendMode: "overlay",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(20, 83, 61, 0.85) 0%, rgba(12, 59, 46, 0.96) 60%, #062119 100%)",
        }}
      />

      {/* Lớp hạt kim sa vàng lơ lửng */}
      <GoldDustParticles count={20} />

      {/* Viền hoa văn 2 góc trên */}
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute left-2 top-2 h-auto w-10 opacity-75 sm:left-4 sm:top-4 sm:w-12 md:left-6 md:top-6 md:w-16"
        aria-hidden="true"
      />
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-tr.webp"
        alt=""
        className="pointer-events-none absolute right-2 top-2 h-auto w-10 opacity-75 sm:right-4 sm:top-4 sm:w-12 md:right-6 md:top-6 md:w-16"
        aria-hidden="true"
      />

      {/* RỒNG VÀNG KIM (Bottom-Left) — Thu nhỏ footprint mobile, ghim sát mép trái, z-0 nền */}
      <m.div
        className="pointer-events-none absolute -bottom-1 left-0 z-0 w-20 opacity-80 sm:bottom-0 sm:left-1 sm:w-28 sm:opacity-85 md:bottom-2 md:left-2 md:w-44"
        initial={reduce ? {} : { x: -60, y: 30, rotate: -4, opacity: 0 }}
        animate={
          reduce
            ? { opacity: 0.85 }
            : isOpened
              ? {
                x: 0,
                y: [0, -6, 0],
                rotate: [0, 1.5, 0],
                opacity: 0.85,
              }
              : {}
        }
        transition={{
          x: { duration: 1.1, ease: EASE_ROYAL, delay: 0.2 },
          opacity: { duration: 0.9, delay: 0.2 },
          y: { duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.3 },
          rotate: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.3 },
        }}
      >
        <img loading="lazy" decoding="async"
          src="/templates/long-phung-ep3/dragon.webp"
          alt=""
          className="h-auto w-full object-contain drop-shadow-[0_4px_16px_rgba(212,175,55,0.35)]"
          aria-hidden="true"
        />
      </m.div>

      {/* PHƯỢNG HOÀNG KIM (Bottom-Right) — Thu nhỏ footprint mobile, ghim sát mép phải, z-0 nền */}
      <m.div
        className="pointer-events-none absolute -bottom-1 right-0 z-0 w-20 opacity-80 sm:bottom-0 sm:right-1 sm:w-28 sm:opacity-85 md:bottom-2 md:right-2 md:w-44"
        initial={reduce ? {} : { x: 60, y: 30, rotate: 4, opacity: 0 }}
        animate={
          reduce
            ? { opacity: 0.85 }
            : isOpened
              ? {
                x: 0,
                y: [0, 6, 0],
                rotate: [0, -1.5, 0],
                opacity: 0.85,
              }
              : {}
        }
        transition={{
          x: { duration: 1.1, ease: EASE_ROYAL, delay: 0.3 },
          opacity: { duration: 0.9, delay: 0.3 },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.4 },
          rotate: { duration: 7.5, repeat: Infinity, ease: "easeInOut", delay: 1.4 },
        }}
      >
        <img loading="lazy" decoding="async"
          src="/templates/long-phung-ep3/phoenix.webp"
          alt=""
          className="h-auto w-full object-contain drop-shadow-[0_4px_16px_rgba(212,175,55,0.35)]"
          aria-hidden="true"
        />
      </m.div>

      {/* Khung nội dung trung tâm — z-10 nổi trước linh vật, đệm đáy an toàn chống đè chữ/nút */}
      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center px-4 pb-16 sm:pb-20 md:pb-24 text-center">
        {/* Khung vòm hoàng gia đỉnh section */}
        <m.div
          className="relative mb-3 h-auto w-48 md:w-64"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={isOpened ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <img loading="lazy" decoding="async"
            src="/templates/long-phung-ep3/arch-gold.webp"
            alt=""
            className="mx-auto h-auto w-full drop-shadow-[0_2px_10px_rgba(212,175,55,0.35)]"
            aria-hidden="true"
          />
        </m.div>

        {/* Tiêu đề lễ cưới */}
        <m.p
          className="text-xs uppercase tracking-[0.35em]"
          style={{ color: GOLD_LIGHT, fontFamily: BODY_FONT }}
          initial={{ opacity: 0, y: 10 }}
          animate={isOpened ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.35 }}
        >
          {targetEvent?.title || "LỄ THÀNH HÔN"}
        </m.p>

        {/* Tên Chú Rể & Cô Dâu — Chuỗi Stagger ~90-120ms + Hiệu ứng lướt ánh kim */}
        <div className="relative my-4 space-y-1">
          {/* Tên Chú Rể */}
          <m.div
            initial={{ opacity: 0, y: 22 }}
            animate={isOpened ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.45, ease: EASE_ROYAL }}
          >
            <span
              className="block text-3xl font-normal tracking-wide md:text-5xl"
              style={{
                fontFamily: NAME_FONT,
                color: GOLD_LIGHT,
                textShadow: "0 2px 14px rgba(0,0,0,0.7), 0 0 20px rgba(212,175,55,0.35)",
              }}
            >
              {data.couple?.groomName ?? "Chú Rể"}
            </span>
          </m.div>

          {/* Dấu & nối duyên */}
          <m.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={isOpened ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.55 }}
          >
            <span
              className="inline-block text-xl italic md:text-2xl"
              style={{ color: GOLD_MAIN, fontFamily: TITLE_FONT }}
            >
              &
            </span>
          </m.div>

          {/* Tên Cô Dâu */}
          <m.div
            initial={{ opacity: 0, y: 22 }}
            animate={isOpened ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.65, ease: EASE_ROYAL }}
          >
            <span
              className="block text-3xl font-normal tracking-wide md:text-5xl"
              style={{
                fontFamily: NAME_FONT,
                color: GOLD_LIGHT,
                textShadow: "0 2px 14px rgba(0,0,0,0.7), 0 0 20px rgba(212,175,55,0.35)",
              }}
            >
              {data.couple?.brideName ?? "Cô Dâu"}
            </span>
          </m.div>
        </div>

        {/* Dải hoa sen vàng kim mở rộng từ tâm */}
        <m.div
          className="my-3 flex items-center justify-center"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={isOpened ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.75, ease: EASE_ROYAL }}
        >
          <img loading="lazy" decoding="async"
            src="/templates/long-phung-ep3/divider-lotus.webp"
            alt=""
            className="h-auto w-52 md:w-64"
            aria-hidden="true"
          />
        </m.div>

        {/* Ngày Dương Lịch & Âm Lịch */}
        <m.div
          className="relative z-10 mt-2 space-y-1.5"
          initial={{ opacity: 0, y: 14 }}
          animate={isOpened ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.85 }}
        >
          <p
            className="text-base font-medium tracking-widest uppercase md:text-lg"
            style={{ color: "#FAF6F0", fontFamily: BODY_FONT }}
          >
            {dateParts.weekday ? `${dateParts.weekday}, ` : ""}
            {dateParts.day} · {dateParts.month} · {dateParts.year}
          </p>
          {lunarText && (
            <p className="text-xs italic tracking-wider text-[#FAF6F0]/75" style={{ fontFamily: BODY_FONT }}>
              (Tức {lunarText})
            </p>
          )}
        </m.div>

        {/* Địa điểm tổ chức */}
        {targetEvent && (
          <m.div
            className="relative z-10 mt-5 inline-flex max-w-[85%] items-center gap-1.5 rounded-full px-4 py-1.5 backdrop-blur-sm"
            style={{
              backgroundColor: "rgba(6, 33, 25, 0.8)",
              border: `1px solid ${GOLD_BORDER}`,
            }}
            initial={{ opacity: 0 }}
            animate={isOpened ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.95 }}
          >
            <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-xs font-medium tracking-wide text-[#FAF6F0]/90">
              {targetEvent.venueName || targetEvent.venueAddress || "Trung tâm Hội nghị Tiệc cưới"}
            </span>
          </m.div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Section 2: Thư Mời & Đại Gia Đình (Invitation & Family Cards)
   ------------------------------------------------------------ */
function InvitationSection({
  data,
}: {
  data: TemplateData;
}) {
  const groomTitle = data.couple?.groomTitle?.trim() || "Trưởng Nam";
  const brideTitle = data.couple?.brideTitle?.trim() || "Ái Nữ";

  return (
    <section className="relative overflow-hidden bg-[#FAF6F0] px-4 py-16 text-[#062119] md:py-24">
      {/* 4 Góc hoa văn vàng kim viền quanh thiệp kem */}
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute left-2 top-2 h-auto w-10 opacity-60 sm:left-4 sm:top-4 sm:w-12 md:w-14"
        aria-hidden="true"
      />
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-tr.webp"
        alt=""
        className="pointer-events-none absolute right-2 top-2 h-auto w-10 opacity-60 sm:right-4 sm:top-4 sm:w-12 md:w-14"
        aria-hidden="true"
      />
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-bl.webp"
        alt=""
        className="pointer-events-none absolute bottom-2 left-2 h-auto w-10 opacity-60 sm:bottom-4 sm:left-4 sm:w-12 md:w-14"
        aria-hidden="true"
      />
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-br.webp"
        alt=""
        className="pointer-events-none absolute bottom-2 right-2 h-auto w-10 opacity-60 sm:bottom-4 sm:right-4 sm:w-12 md:w-14"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Con dấu vàng kim Song Hỷ trang trí đầu thư */}
        <m.div
          className="mx-auto mb-4 h-16 w-16 md:h-20 md:w-20"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <img loading="lazy" decoding="async"
            src="/templates/long-phung-ep3/seal-gold.webp"
            alt="Song Hỷ"
            className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(212,175,55,0.4)]"
          />
        </m.div>

        {/* Lời dẫn dắt thư mời */}
        <m.h2
          className="text-xs uppercase tracking-[0.3em]"
          style={{ color: GOLD_BORDER, fontFamily: BODY_FONT }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Thư Mời Tiệc Cưới
        </m.h2>

        <m.p
          className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#062119]/85 md:text-base"
          style={{ fontFamily: BODY_FONT }}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          {data.quote?.trim() ||
            data.ui?.invitationNote?.trim() ||
            "Trong niềm hân hoan và sự chúc phúc của hai bên gia đình, chúng con trân trọng kính mời Quý khách đến chung vui và chứng kiến khoảnh khắc trọng đại nhất cuộc đời."}
        </m.p>

        {/* Dải phân cách hoa văn lụa */}
        <div className="my-6 flex justify-center">
          <img loading="lazy" decoding="async"
            src="/templates/long-phung-ep3/divider-ribbon.webp"
            alt=""
            className="h-auto w-44 opacity-85"
            aria-hidden="true"
          />
        </div>

        {/* Hai Card Đại Gia Đình Nhà Trai & Nhà Gái — Cân đối chiều cao hoàn hảo */}
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-6">
          {/* Card Nhà Trai */}
          <m.div
            className="flex h-full flex-col justify-between rounded-xl p-5 text-center transition-all md:p-6"
            style={{
              backgroundColor: SILK_CREAM_CARD,
              border: `1px solid ${GOLD_BORDER}`,
              boxShadow: "0 4px 16px rgba(12, 59, 46, 0.06)",
            }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#B89326]">
                Nhà Trai · {groomTitle}
              </p>
              <div className="my-3 space-y-1 text-sm text-[#062119]/80" style={{ fontFamily: BODY_FONT }}>
                {data.couple?.groomParents && (
                  <p>
                    <strong className="text-[#062119]">{data.couple.groomParents}</strong>
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 border-t border-[#D4AF37]/30 pt-3">
              <span
                className="text-2xl tracking-wide md:text-3xl"
                style={{ fontFamily: NAME_FONT, color: EMERALD_MAIN }}
              >
                {data.couple?.groomFullName || data.couple?.groomName || "Chú Rể"}
              </span>
            </div>
          </m.div>

          {/* Card Nhà Gái */}
          <m.div
            className="flex h-full flex-col justify-between rounded-xl p-5 text-center transition-all md:p-6"
            style={{
              backgroundColor: SILK_CREAM_CARD,
              border: `1px solid ${GOLD_BORDER}`,
              boxShadow: "0 4px 16px rgba(12, 59, 46, 0.06)",
            }}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#B89326]">
                Nhà Gái · {brideTitle}
              </p>
              <div className="my-3 space-y-1 text-sm text-[#062119]/80" style={{ fontFamily: BODY_FONT }}>
                {data.couple?.brideParents && (
                  <p>
                    <strong className="text-[#062119]">{data.couple.brideParents}</strong>
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 border-t border-[#D4AF37]/30 pt-3">
              <span
                className="text-2xl tracking-wide md:text-3xl"
                style={{ fontFamily: NAME_FONT, color: EMERALD_MAIN }}
              >
                {data.couple?.brideFullName || data.couple?.brideName || "Cô Dâu"}
              </span>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Section 3: Bộ Sưu Tập Ảnh Cưới (3D Depth Coverflow Gallery)
   ------------------------------------------------------------ */
function GallerySection({
  data,
}: {
  data: TemplateData;
}) {
  const photos = data.photos?.gallery || [];
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const touchStartXRef = React.useRef<number | null>(null);

  if (photos.length === 0) {
    return (
      <section className="relative bg-[#062119] px-4 py-16 text-center text-[#FAF6F0]">
        <h3 className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">Khoảnh Khắc Hạnh Phúc</h3>
        <p className="mt-2 text-sm text-[#FAF6F0]/70">Hình ảnh kỷ niệm của uyên ương</p>
        <div className="mx-auto mt-6 max-w-sm">
          <TemplatePhotoPlaceholder label="Chưa có ảnh trong album" />
        </div>
      </section>
    );
  }

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % photos.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartXRef.current = null;
  };

  return (
    <section className="relative overflow-hidden bg-[#062119] px-4 py-16 text-[#FAF6F0] md:py-24">
      {/* Nền gấm chìm & kim sa */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
        style={{ backgroundImage: "url('/templates/long-phung-ep3/background.webp')" }}
      />
      <GoldDustParticles count={14} />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <m.p
          className="text-xs uppercase tracking-[0.35em]"
          style={{ color: GOLD_LIGHT, fontFamily: BODY_FONT }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Khoảnh Khắc Kỷ Niệm
        </m.p>
        <m.h2
          className="mt-2 text-2xl md:text-3xl"
          style={{ fontFamily: NAME_FONT, color: GOLD_LIGHT }}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Album Ảnh Cưới
        </m.h2>

        {/* Carousel Coverflow 3D */}
        <div
          className="relative mx-auto mt-8 flex h-[380px] w-full max-w-lg items-center justify-center md:h-[480px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {photos.map((photo, idx) => {
            const offset = (idx - activeIndex + photos.length) % photos.length;
            let normalized = offset;
            if (offset > photos.length / 2) {
              normalized = offset - photos.length;
            }

            const isCurrent = normalized === 0;
            const isLeft = normalized === -1;
            const isRight = normalized === 1;
            const isVisible = isCurrent || isLeft || isRight;

            if (!isVisible) return null;

            return (
              <m.div
                key={photo.id || idx}
                className="absolute inset-y-0 flex cursor-pointer items-center justify-center transition-all"
                style={{
                  zIndex: isCurrent ? 30 : 20,
                }}
                animate={{
                  x: isCurrent ? "0%" : isLeft ? "-52%" : "52%",
                  scale: isCurrent ? 1 : 0.82,
                  opacity: isCurrent ? 1 : 0.5,
                  rotateY: isCurrent ? 0 : isLeft ? 15 : -15,
                }}
                transition={{ duration: 0.55, ease: EASE_ROYAL }}
                onClick={() => {
                  if (isCurrent) {
                    setLightboxIndex(idx);
                  } else {
                    setActiveIndex(idx);
                  }
                }}
              >
                <div
                  className="relative h-[320px] w-[240px] overflow-hidden rounded-2xl md:h-[420px] md:w-[300px]"
                  style={{
                    border: isCurrent ? `2px solid ${GOLD_MAIN}` : `1px solid ${GOLD_BORDER}`,
                    boxShadow: isCurrent
                      ? "0 10px 30px rgba(0,0,0,0.7), 0 0 25px rgba(212,175,55,0.4)"
                      : "0 6px 16px rgba(0,0,0,0.5)",
                  }}
                >
                  <img loading="lazy" decoding="async"
                    src={photo.url}
                    alt={photo.alt || `Ảnh cưới ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  {isCurrent && (
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/10" />
                  )}
                </div>
              </m.div>
            );
          })}

          {/* Nút điều hướng Trái / Phải */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-[#D4AF37] backdrop-blur-sm transition-all hover:scale-110 md:left-4"
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-[#D4AF37] backdrop-blur-sm transition-all hover:scale-110 md:right-4"
            aria-label="Ảnh sau"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Chấm phân trang Carousel (Pagination Dots) */}
        <div className="mt-4 flex justify-center gap-1.5">
          {photos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className="h-2 rounded-full transition-all"
              style={{
                width: activeIndex === idx ? "24px" : "6px",
                backgroundColor: activeIndex === idx ? GOLD_MAIN : "rgba(212, 175, 55, 0.3)",
              }}
              aria-label={`Tới ảnh ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Lightbox phóng to ảnh cưới */}
      {lightboxIndex !== null && (
        <TemplateLightboxModal
          photos={photos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={(newIdx) => setLightboxIndex(newIdx)}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------
   Section 4: Lịch Cưới & Đồng Hồ Đếm Ngược (Calendar & Countdown)
   ------------------------------------------------------------ */
function CalendarCountdownSection({
  data,
}: {
  data: TemplateData;
}) {
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const targetDateStr = targetEvent?.startsAt ?? data.date;
  const targetDate = React.useMemo(() => new Date(targetDateStr), [targetDateStr]);

  const dateParts = formatWeddingDateParts(targetDateStr);
  const weddingDay = parseInt(dateParts.day, 10) || 1;
  const weddingMonth = parseInt(dateParts.month, 10) || targetDate.getMonth() + 1;
  const weddingYear = parseInt(dateParts.year, 10) || targetDate.getFullYear();

  // Đếm ngược thời gian thực
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });

  React.useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isPast: false,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Tập hợp các ngày có sự kiện trong tháng
  const eventDays = React.useMemo(() => {
    const days = new Set<number>();
    visibleEvents.forEach((evt) => {
      if (evt.startsAt) {
        const d = new Date(evt.startsAt);
        if (d.getFullYear() === weddingYear && d.getMonth() + 1 === weddingMonth) {
          days.add(d.getDate());
        }
      }
    });
    if (days.size === 0 && !isNaN(weddingDay)) {
      days.add(weddingDay);
    }
    return days;
  }, [visibleEvents, weddingYear, weddingMonth, weddingDay]);

  // Tính ma trận ngày trong tháng
  const calendarDays = React.useMemo(() => {
    const firstDayIndex = new Date(weddingYear, weddingMonth - 1, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(weddingYear, weddingMonth, 0).getDate();

    const days: (number | null)[] = [];
    const adjustedStart = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    for (let i = 0; i < adjustedStart; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    return days;
  }, [weddingYear, weddingMonth]);

  return (
    <section className="relative overflow-hidden bg-[#FAF6F0] px-4 py-16 text-[#062119] md:py-24">
      {/* 4 Góc hoa văn hoàng gia trang trí lịch cưới */}
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute left-2 top-2 h-auto w-10 opacity-60 sm:left-4 sm:top-4 sm:w-12 md:w-14"
        aria-hidden="true"
      />
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-tr.webp"
        alt=""
        className="pointer-events-none absolute right-2 top-2 h-auto w-10 opacity-60 sm:right-4 sm:top-4 sm:w-12 md:w-14"
        aria-hidden="true"
      />
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-bl.webp"
        alt=""
        className="pointer-events-none absolute bottom-2 left-2 h-auto w-10 opacity-60 sm:bottom-4 sm:left-4 sm:w-12 md:w-14"
        aria-hidden="true"
      />
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-br.webp"
        alt=""
        className="pointer-events-none absolute bottom-2 right-2 h-auto w-10 opacity-60 sm:bottom-4 sm:right-4 sm:w-12 md:w-14"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#B89326]" style={{ fontFamily: BODY_FONT }}>
          Ngày Hạnh Phúc
        </p>
        <h2 className="mt-1 text-2xl md:text-3xl" style={{ fontFamily: NAME_FONT, color: EMERALD_MAIN }}>
          Lịch Ngày Vui
        </h2>

        {/* Khung Lịch Tháng */}
        <div
          className="mx-auto mt-6 rounded-2xl p-6 shadow-sm transition-all"
          style={{
            backgroundColor: SILK_CREAM_CARD,
            border: `1px solid ${GOLD_BORDER}`,
          }}
        >
          <div className="mb-4 border-b border-[#D4AF37]/30 pb-3">
            <span className="text-base font-semibold tracking-widest uppercase text-[#0C3B2E]">
              Tháng {weddingMonth} / {weddingYear}
            </span>
          </div>

          {/* Hàng thứ */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-[#B89326]">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span className="text-[#997D2E]">CN</span>
          </div>

          {/* Lưới các ngày */}
          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-sm">
            {calendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="h-9 w-9" />;
              }

              const isWeddingDay = day !== null && eventDays.has(day);

              return (
                <div key={`day-${day}`} className="flex items-center justify-center">
                  <div
                    className={cn(
                      "relative flex h-8 w-8 items-center justify-center rounded-full text-xs transition-all",
                      isWeddingDay ? "font-bold text-[#062119]" : "text-[#062119]/80",
                    )}
                  >
                    {isWeddingDay && (
                      <m.div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: "radial-gradient(circle, #F3E5AB 0%, #D4AF37 100%)",
                          boxShadow: "0 0 10px rgba(212, 175, 55, 0.7)",
                        }}
                        animate={{
                          scale: [1, 1.15, 1],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                    <span className="relative z-10">{day}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Đồng Hồ Đếm Ngược 4 Ô */}
        <div className="mt-8">
          <p className="mb-3 text-xs uppercase tracking-widest text-[#B89326]">
            {timeLeft.isPast ? "Hôn Lễ Đã Diễn Ra Tốt Đẹp" : "Cùng Đếm Ngược Đến Ngày Chung Đôi"}
          </p>

          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {[
              { label: "Ngày", val: timeLeft.days },
              { label: "Giờ", val: timeLeft.hours },
              { label: "Phút", val: timeLeft.minutes },
              { label: "Giây", val: timeLeft.seconds },
            ].map((box, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center rounded-xl py-3"
                style={{
                  backgroundColor: EMERALD_MAIN,
                  border: `1px solid ${GOLD_BORDER}`,
                  boxShadow: "0 4px 12px rgba(12, 59, 46, 0.15)",
                }}
              >
                <span className="text-xl font-bold tracking-tight text-[#FAF6F0] md:text-2xl">
                  {String(box.val).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#D4AF37]">
                  {box.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Danh sách các Lễ / Tiệc cưới của khách */}
        <div
          className={cn(
            "mt-10 grid gap-4 text-left",
            visibleEvents.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 max-w-lg mx-auto"
          )}
        >
          {visibleEvents.map((evt, idx) => {
            const directionsUrl = getEventDirectionsUrl(evt);
            const dateStr = evt.startsAt ? formatWeddingDateParts(evt.startsAt) : null;
            return (
              <div
                key={evt.id || idx}
                className="rounded-xl p-5 text-center transition-all md:p-6"
                style={{
                  backgroundColor: SILK_CREAM_CARD,
                  border: `1px solid ${GOLD_BORDER}`,
                  boxShadow: "0 4px 16px rgba(12, 59, 46, 0.06)",
                }}
              >
                <span
                  className="inline-block rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: "rgba(12, 59, 46, 0.08)", color: EMERALD_MAIN }}
                >
                  {evt.title || "Tiệc Cưới"}
                </span>
                {evt.startsAt && (
                  <p className="mt-2 text-sm font-semibold text-[#062119]">
                    {dateStr ? `${dateStr.time ? dateStr.time + " - " : ""}${dateStr.day}/${dateStr.month}/${dateStr.year}` : evt.startsAt}
                  </p>
                )}
                {evt.lunarDate && (
                  <p className="text-xs text-[#B89326] mt-0.5">
                    (Tức {evt.lunarDate})
                  </p>
                )}
                {evt.venueName && (
                  <p className="mt-2 font-bold text-[#062119]" style={{ fontFamily: TITLE_FONT }}>
                    {evt.venueName}
                  </p>
                )}
                {evt.venueAddress && (
                  <p className="mt-1 text-xs text-[#062119]/80">
                    {evt.venueAddress}
                  </p>
                )}
                {directionsUrl && (
                  <div className="mt-4">
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold tracking-wider uppercase text-[#FAF6F0] transition hover:scale-105"
                      style={{
                        backgroundColor: EMERALD_MAIN,
                        border: `1px solid ${GOLD_BORDER}`,
                      }}
                    >
                      <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" />
                      <span>Chỉ đường: {evt.title || "Xem bản đồ"}</span>
                      <ExternalLink className="h-3.5 w-3.5 text-[#D4AF37]" />
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
   Section 5: Lịch Trình Tiệc Cưới (Timeline)
   ------------------------------------------------------------ */
function TimelineSection({
  data,
}: {
  data: TemplateData;
}) {
  const timeline = getTimeline(data);

  return (
    <section className="relative overflow-hidden bg-[#062119] px-4 py-16 text-[#FAF6F0] md:py-24">
      {/* Nền gấm & hoa văn mây sen */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-overlay"
        style={{ backgroundImage: "url('/templates/long-phung-ep3/background.webp')" }}
      />
      <GoldDustParticles count={14} />

      <div className="relative z-10 mx-auto max-w-lg text-center">
        <p className="text-xs uppercase tracking-[0.3em]" style={{ color: GOLD_LIGHT, fontFamily: BODY_FONT }}>
          Lịch Trình Hôn Lễ
        </p>
        <h2 className="mt-1 text-2xl md:text-3xl" style={{ fontFamily: NAME_FONT, color: GOLD_LIGHT }}>
          Chương Trình Tiệc Cưới
        </h2>

        {/* Cột mốc Timeline so le */}
        <div className="relative mx-auto mt-10 max-w-md">
          {/* Trục chỉ vàng trung tâm */}
          <div
            className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2"
            style={{
              background: "linear-gradient(180deg, transparent 0%, #D4AF37 15%, #D4AF37 85%, transparent 100%)",
            }}
          />

          <div className="space-y-8">
            {timeline.map((item, idx) => {
              const isEven = idx % 2 === 0;

              return (
                <m.div
                  key={idx}
                  className={cn(
                    "relative flex items-center",
                    isEven ? "flex-row" : "flex-row-reverse",
                  )}
                  initial={{ opacity: 0, x: isEven ? -25 : 25 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  {/* Khối nội dung thời gian & mô tả */}
                  <div className={cn("w-1/2 px-4", isEven ? "text-right" : "text-left")}>
                    <span
                      className="inline-block rounded-md px-2.5 py-1 text-xs font-bold tracking-wider"
                      style={{
                        backgroundColor: "rgba(12, 59, 46, 0.8)",
                        color: GOLD_LIGHT,
                        border: `1px solid ${GOLD_BORDER}`,
                      }}
                    >
                      {item.time}
                    </span>
                    <p className="mt-1.5 text-sm font-medium text-[#FAF6F0]/90 md:text-base">
                      {item.label}
                    </p>
                  </div>

                  {/* Nốt tròn vàng kim trung tâm */}
                  <div className="absolute left-1/2 z-10 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full border border-[#D4AF37] bg-[#0C3B2E] shadow-[0_0_10px_rgba(212,175,55,0.6)]">
                    <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
                  </div>

                  {/* Khoảng trống cân bằng đối xứng */}
                  <div className="w-1/2" />
                </m.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Section 6: Hộp Mừng Cưới 3 Trạng Thái & VietQR (Gift Box)
   ------------------------------------------------------------ */
function GiftSection({
  data,
  plan,
  guestName,
}: {
  data: TemplateData;
  plan: WeddingPlan;
  guestName: string;
}) {
  const [boxState, setBoxState] = React.useState<"normal" | "hover" | "active">("normal");
  const [modalOpen, setModalOpen] = React.useState(false);
  const reduce = useReducedMotion();

  // Preload sẵn cả 3 ảnh để chuyển đổi 0ms mượt mà
  React.useEffect(() => {
    const urls = [
      "/templates/long-phung-ep3/gift-normal.webp",
      "/templates/long-phung-ep3/gift-hover.webp",
      "/templates/long-phung-ep3/gift-active.webp",
    ];
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  const handleClickBox = () => {
    if (boxState === "active") return;
    setBoxState("active");

    // Bung sáng ~400ms rồi mở modal VietQR
    setTimeout(() => {
      setModalOpen(true);
      setBoxState("normal");
    }, 400);
  };

  return (
    <section className="relative overflow-hidden bg-[#FAF6F0] px-4 py-16 text-[#062119] md:py-24">
      {/* 4 Góc hoa văn hoàng gia trang trí hộp mừng */}
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute left-2 top-2 h-auto w-10 opacity-60 sm:left-4 sm:top-4 sm:w-12 md:w-14"
        aria-hidden="true"
      />
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-tr.webp"
        alt=""
        className="pointer-events-none absolute right-2 top-2 h-auto w-10 opacity-60 sm:right-4 sm:top-4 sm:w-12 md:w-14"
        aria-hidden="true"
      />
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-bl.webp"
        alt=""
        className="pointer-events-none absolute bottom-2 left-2 h-auto w-10 opacity-60 sm:bottom-4 sm:left-4 sm:w-12 md:w-14"
        aria-hidden="true"
      />
      <img loading="lazy" decoding="async"
        src="/templates/long-phung-ep3/corner-br.webp"
        alt=""
        className="pointer-events-none absolute bottom-2 right-2 h-auto w-10 opacity-60 sm:bottom-4 sm:right-4 sm:w-12 md:w-14"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-lg text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#B89326]" style={{ fontFamily: BODY_FONT }}>
          Mừng Cưới Chúc Phúc
        </p>
        <h2 className="mt-1 text-2xl md:text-3xl" style={{ fontFamily: NAME_FONT, color: EMERALD_MAIN }}>
          Hộp Mừng Cưới
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-xs text-[#062119]/75 md:text-sm">
          Chạm vào phong bao ngọc bích để gửi trao lời chúc phúc và hồng bao may mắn tới đôi uyên ương.
        </p>

        {/* Hộp quà 3 trạng thái kích thước đồng nhất 280x510 */}
        <div className="relative my-8 flex items-center justify-center">
          <m.div
            className="group relative cursor-pointer"
            onMouseEnter={() => setBoxState("hover")}
            onMouseLeave={() => setBoxState("normal")}
            onClick={handleClickBox}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            animate={
              reduce || boxState === "active"
                ? {}
                : {
                  y: [0, -6, 0],
                  rotate: [0, -1, 1, 0],
                }
            }
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Vòng hào quang nhịp thở sau hộp quà */}
            <div
              className="pointer-events-none absolute -inset-6 rounded-3xl opacity-60 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                background: "radial-gradient(circle, rgba(212, 175, 55, 0.4) 0%, transparent 70%)",
              }}
            />

            {/* Ảnh Hộp Quà 3 Trạng Thái */}
            <div className="relative h-[240px] w-[132px] md:h-[300px] md:w-[165px]">
              <img loading="lazy" decoding="async"
                src={
                  boxState === "active"
                    ? "/templates/long-phung-ep3/gift-active.webp"
                    : boxState === "hover"
                      ? "/templates/long-phung-ep3/gift-hover.webp"
                      : "/templates/long-phung-ep3/gift-normal.webp"
                }
                alt="Hộp Mừng Cưới"
                className="h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(12,59,46,0.3)] transition-all duration-200"
              />

              {/* Hiệu ứng nổ tia sáng khi click */}
              {boxState === "active" && (
                <m.div
                  className="pointer-events-none absolute -inset-8 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 242, 178, 0.9) 0%, rgba(212, 175, 55, 0.4) 50%, transparent 80%)",
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1.6, opacity: [0, 1, 0] }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              )}
            </div>

            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-[#B89326]">
              {boxState === "hover" ? "Bấm Để Gửi Quà Mừng" : "Chạm Để Mở Hộp Quà"}
            </p>
          </m.div>
        </div>

        {/* Modal VietQR mừng cưới render qua Portal chuẩn card_exp.md */}
        <GiftModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          gift={data.gift}
          plan={plan}
          coupleName={`${data.couple?.groomName ?? "Chú Rể"} & ${data.couple?.brideName ?? "Cô Dâu"}`}
          guestName={guestName}
          tone="olive"
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Component Mẫu Thiệp Chính: Long Phụng Ep3
   ------------------------------------------------------------ */
export function LongPhungEp3Template({
  data,
  mode,
  contained = false,
  isOpened,
  onOpenedChange,
  inviteSlug,
  weddingSlug,
  guestName,
  invitationMode = "personal",
}: WeddingTemplateProps) {
  const [localOpened, setLocalOpened] = React.useState(Boolean(isOpened));
  const openState = isOpened ?? localOpened;

  const handleOpenInvitation = React.useCallback(() => {
    try {
      playOpenCardSound();
    } catch { }
    setLocalOpened(true);
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }
  }, [onOpenedChange]);

  const safeGuestName = guestName || data.ui?.defaultGuestName || "";
  const coupleNames = `${data.couple?.groomName ?? "Chú Rể"} & ${data.couple?.brideName ?? "Cô Dâu"}`;

  return (
    <div
      className={cn(
        "relative w-full overflow-x-hidden text-[#062119] antialiased selection:bg-[#D4AF37] selection:text-[#062119]",
        contained
          ? openState
            ? "relative h-full overflow-y-auto max-w-[440px] mx-auto shadow-2xl rounded-2xl"
            : "relative h-full overflow-hidden max-w-[440px] mx-auto shadow-2xl rounded-2xl"
          : "min-h-screen max-w-md mx-auto",
      )}
      style={{
        backgroundColor: EMERALD_DARK,
        fontFamily: BODY_FONT,
      }}
    >
      {/* 1. Màn hình phong bì / mở thiệp hoàng gia (Envelope Cover) */}
      <AnimatePresence>
        {!openState && (
          <EnvelopeCover
            data={data}
            guestName={safeGuestName}
            contained={contained}
            onOpen={handleOpenInvitation}
          />
        )}
      </AnimatePresence>

      {/* 2. Nút phát nhạc nền nổi (LiveMusicFloatingButton) */}
      {!data.hiddenSections?.includes("music") && (
        <LiveMusicFloatingButton
        src={data.music?.src}
        title={data.music?.title || "Giai điệu hoàng gia"}
        visible={openState}
        tone="obsidian"
      />
      )}

      {/* Nội dung thiệp cưới sau khi mở */}
      <main
        className={cn(
          "relative z-10 transition-opacity duration-700",
          !openState ? "hidden opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {/* Section 1: Hero chào mừng Long Phụng */}
        <HeroSection data={data} isOpened={openState} />

        {/* Section 2: Thư mời thành hôn & Đại gia đình */}
        <InvitationSection data={data} />

        {/* Section 3: Bộ sưu tập ảnh cưới 3D coverflow */}
        <GallerySection data={data} />

        {/* Section 4: Lịch ngày cưới & Đếm ngược */}
        <CalendarCountdownSection data={data} />

        {/* Section 5: Lịch trình hôn lễ */}
        <TimelineSection data={data} />

        {/* Section 6: Hộp mừng cưới 3 trạng thái & VietQR */}
        <GiftSection data={data} plan={data.plan} guestName={safeGuestName} />

        {/* Section 7: Form xác nhận tham dự RSVP & Sổ lời chúc */}
        <section className="relative overflow-hidden bg-[#062119] px-4 py-16 text-[#FAF6F0] md:py-24">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
            style={{ backgroundImage: "url('/templates/long-phung-ep3/background.webp')" }}
          />
          <GoldDustParticles count={16} />

          <div className="relative z-10 mx-auto max-w-xl">
            <TemplateRsvpSection
              data={data}
              mode={mode}
              tone="obsidian"
              contained={contained}
              inviteSlug={inviteSlug}
              weddingSlug={weddingSlug}
              invitationMode={invitationMode}
              guestName={guestName}
            />

            {/* QR Album kỷ niệm đám cưới cho gói trả phí */}
            {data.plan !== "free" && weddingSlug && (
              <div className="mt-12 flex justify-center">
                <GuestAlbumQr
                  slug={weddingSlug}
                  accentColor="#0C3B2E"
                  textColor="#FAF6F0"
                  mutedColor="#D4AF37"
                />
              </div>
            )}
          </div>
        </section>

        {/* Footer trang nhã */}
        <footer className="relative bg-[#041711] py-8 text-center text-xs tracking-wider text-[#FAF6F0]/60">
          <p>{coupleNames}</p>
          <p className="mt-1 text-[11px] text-[#D4AF37]/60">Trân trọng cảm ơn sự hiện diện của Quý khách</p>
        </footer>
      </main>
    </div>
  );
}

export default LongPhungEp3Template;
