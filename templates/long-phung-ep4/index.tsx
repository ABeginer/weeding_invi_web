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
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import {
  getVisibleEvents,
  getNearestUpcomingEvent,
  getEventDirectionsUrl,
} from "@/lib/events";
import type { TemplateData, WeddingEvent, WeddingPlan } from "@/lib/wedding-types";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: LAM NGỌC HOÀNG GIA (LONG PHỤNG EP4)
   - Lam ngọc chính (Primary Navy): #0F1D3A (sâu #091326, thẻ #162A52)
   - Vàng champagne (Gold Accent): #DFC07C / #C6A45E (sáng #F5E6C4)
   - Kem lụa (Ivory Section): #FAF6F0 (chữ tối #1E293B / #0F1D3A)
   ============================================================ */

const NAVY_DARK = "#091326";
const NAVY_MAIN = "#0F1D3A";
const NAVY_CARD = "#162A52";
const NAVY_LIGHT = "#1E3A6E";

const SILK_CREAM = "#FAF6F0";
const SILK_CREAM_CARD = "#F5EFE6";

const GOLD_MAIN = "#DFC07C";
const GOLD_ACCENT = "#C6A45E";
const GOLD_LIGHT = "#F5E6C4";
const GOLD_BORDER = "rgba(223, 192, 124, 0.45)";
const GOLD_SOFT = "rgba(223, 192, 124, 0.25)";

const TEXT_GOLD_LIGHT = "#F5E6C4";
const TEXT_NAVY_DARK = "#091326";
const TEXT_SLATE = "#1E293B";

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

const DEFAULT_DRESS = ["#0F1D3A", "#DFC07C", "#FAF6F0"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}



/* ------------------------------------------------------------
   Hiệu ứng Hạt Bụi Vàng Champagne Lấp Lánh (Gold Dust Particles)
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
            background: "radial-gradient(circle, #FFF2B2 20%, #DFC07C 70%, transparent 100%)",
            boxShadow: "0 0 6px 1px rgba(223, 192, 124, 0.7)",
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
  guestName?: string;
  contained?: boolean;
  onOpen: () => void;
}) {
  const reduce = useReducedMotion();
  const [openingStage, setOpeningStage] = React.useState(false);

  const handleOpenClick = () => {
    if (openingStage) return;
    try {
      playOpenCardSound();
    } catch {
      // Audio context error fallback
    }
    setOpeningStage(true);
    setTimeout(() => {
      onOpen();
    }, 750);
  };

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden text-center",
        contained ? "h-full min-h-[580px]" : "h-screen-dvh min-h-[640px]",
      )}
      style={{
        background: `radial-gradient(ellipse at 50% 40%, #162A52 0%, ${NAVY_MAIN} 60%, ${NAVY_DARK} 100%)`,
      }}
    >
      {/* Nền gấm hoa văn hoàng gia chìm */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30 mix-blend-soft-light"
        style={{
          backgroundImage: "url('/templates/long-phung-ep4/background-mobile.webp')",
        }}
      />

      {/* Hai cánh màn Lam Ngọc tách mở khi bấm mở thiệp */}
      {openingStage && !reduce && (
        <div className="pointer-events-none absolute inset-0 z-[5]">
          <m.div
            className="pointer-events-none absolute inset-y-0 left-0 w-1/2 border-r border-[#DFC07C]/30"
            style={{
              background: "linear-gradient(90deg, #091326 0%, #0F1D3A 100%)",
            }}
            initial={{ x: "0%" }}
            animate={{ x: "-105%" }}
            transition={{ duration: 0.8, ease: EASE_ROYAL }}
          />
          <m.div
            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 border-l border-[#DFC07C]/30"
            style={{
              background: "linear-gradient(270deg, #091326 0%, #0F1D3A 100%)",
            }}
            initial={{ x: "0%" }}
            animate={{ x: "105%" }}
            transition={{ duration: 0.8, ease: EASE_ROYAL }}
          />
        </div>
      )}

      {/* Hiệu ứng hạt bụi vàng kim */}
      <GoldDustParticles count={22} />

      {/* Khung viền chỉ vàng kim ngoại biên & 4 góc hoa văn hoàng gia ôm sát 4 góc */}
      <div className="pointer-events-none absolute inset-4 rounded-xl border border-[#DFC07C]/40 md:inset-8">
        <div className="absolute inset-1 rounded-lg border border-[#DFC07C]/20" />
        {/* 4 Góc hoa văn hoàng gia ôm sát đúng 4 đỉnh khung viền dùng duy nhất corner-tl.webp */}
        <img
          src="/templates/long-phung-ep4/corner-tl.webp"
          alt=""
          className="pointer-events-none absolute left-0 top-0 h-auto w-10 opacity-80 sm:w-12 md:w-14"
          aria-hidden="true"
        />
        <img
          src="/templates/long-phung-ep4/corner-tl.webp"
          alt=""
          className="pointer-events-none absolute right-0 top-0 h-auto w-10 -scale-x-100 opacity-80 sm:w-12 md:w-14"
          aria-hidden="true"
        />
        <img
          src="/templates/long-phung-ep4/corner-tl.webp"
          alt=""
          className="pointer-events-none absolute bottom-0 left-0 h-auto w-10 -scale-y-100 opacity-80 sm:w-12 md:w-14"
          aria-hidden="true"
        />
        <img
          src="/templates/long-phung-ep4/corner-tl.webp"
          alt=""
          className="pointer-events-none absolute bottom-0 right-0 h-auto w-10 -scale-100 opacity-80 sm:w-12 md:w-14"
          aria-hidden="true"
        />
      </div>

      {/* Khối nội dung trung tâm của phong bì — my-auto luôn căn giữa khung điện thoại */}
      <m.div
        className={cn(
          "relative z-10 my-auto flex max-w-sm flex-col items-center px-6 text-center",
          contained ? "py-4" : "py-8",
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
              background: "rgba(22, 42, 82, 0.75)",
              border: `1px solid ${GOLD_BORDER}`,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25 }}
          >
            <span
              className="text-sm font-medium tracking-wider text-[#FAF6F0]"
              style={{ fontFamily: BODY_FONT }}
            >
              {guestName}
            </span>
          </m.div>
        ) : (
          <div className="h-4" />
        )}

        {/* Con dấu vàng kim hoàng gia phát sáng nhịp thở + quét ánh kim */}
        <m.div
          className="relative my-4 flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: EASE_ROYAL }}
        >
          {/* Quầng hào quang vàng kim thở chậm */}
          <m.div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(223,192,124,0.45) 0%, rgba(223,192,124,0.08) 60%, transparent 75%)",
            }}
            animate={
              reduce
                ? {}
                : {
                  scale: [1, 1.15, 1],
                  opacity: [0.6, 0.95, 0.6],
                }
            }
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <img
            src="/templates/long-phung-ep4/seal-gold.webp"
            alt="Song Hỷ"
            className="relative z-10 h-full w-full object-contain drop-shadow-[0_4px_20px_rgba(223,192,124,0.5)]"
          />
        </m.div>

        {/* Tên cặp đôi đại diện trên phong bì */}
        <div className="my-2 space-y-0.5">
          <p
            className="text-2xl tracking-wide sm:text-3xl"
            style={{
              fontFamily: NAME_FONT,
              color: GOLD_LIGHT,
              textShadow: "0 2px 10px rgba(0,0,0,0.6)",
            }}
          >
            {data.couple?.groomName ?? "Chú Rể"} &amp; {data.couple?.brideName ?? "Cô Dâu"}
          </p>
          <p
            className="text-[11px] uppercase tracking-[0.25em] text-[#FAF6F0]/80"
            style={{ fontFamily: BODY_FONT }}
          >
            Lễ Thành Hôn
          </p>
        </div>

        {/* Nút bấm Mở Thiệp mạ vàng kim hoàng gia */}
        <m.button
          type="button"
          onClick={handleOpenClick}
          className="group relative mt-6 inline-flex cursor-pointer items-center justify-center overflow-hidden rounded-full px-8 py-3 transition-transform duration-300 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #DFC07C 0%, #C6A45E 50%, #9E7D38 100%)",
            boxShadow: "0 4px 22px rgba(223, 192, 124, 0.45), 0 0 0 1px rgba(255, 242, 178, 0.5)",
          }}
          whileHover={reduce ? {} : { scale: 1.05 }}
          whileTap={reduce ? {} : { scale: 0.96 }}
        >
          {/* Lớp shimmer lướt sáng */}
          <span
            className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
            aria-hidden="true"
          />
          <span
            className="text-xs font-semibold uppercase tracking-[0.25em] text-[#091326]"
            style={{ fontFamily: BODY_FONT }}
          >
            Mở Thiệp
          </span>
        </m.button>

        <p
          className="mt-3 text-[10px] tracking-widest text-[#FAF6F0]/60 uppercase"
          style={{ fontFamily: BODY_FONT }}
        >
          Chạm để mở thiệp cưới
        </p>
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------
   Section 1: Hero Hoàng Gia — Khung Vòm Ảnh Cưới, Long Phụng & Chữ Kim Sa
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
  const primary = getNearestUpcomingEvent(visibleEvents, data.date);
  const dateParts = formatWeddingDateParts(primary?.startsAt ?? data.date);
  const lunarText = formatLunarDateClean(primary?.lunarDate ?? "");

  // Ảnh cặp đôi hiển thị trong khung vòm
  const heroPhotoUrl = data.photos?.heroUrl || (data.photos?.gallery && data.photos.gallery[0]?.url);

  return (
    <section className="relative overflow-hidden bg-[#0F1D3A] px-4 pt-10 text-[#FAF6F0]">
      {/* Nền gấm hoàng gia & mây sen chìm */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25 mix-blend-soft-light"
        style={{ backgroundImage: "url('/templates/long-phung-ep4/background-mobile.webp')" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 35%, rgba(22, 42, 82, 0.85) 0%, rgba(15, 29, 58, 0.96) 60%, #091326 100%)",
        }}
      />

      {/* Lớp hạt kim sa vàng lơ lửng */}
      <GoldDustParticles count={20} />

      {/* Viền hoa văn 2 góc trên dùng duy nhất corner-tl.webp */}
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute left-2 top-2 h-auto w-11 opacity-75 sm:left-4 sm:top-4 sm:w-14 md:left-6 md:top-6"
        aria-hidden="true"
      />
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute right-2 top-2 h-auto w-11 -scale-x-100 opacity-75 sm:right-4 sm:top-4 sm:w-14 md:right-6 md:top-6"
        aria-hidden="true"
      />

      {/* RỒNG VÀNG KIM (Bottom-Left) — Ghim sát mép trái, z-0 nền, footprint co giãn nghiêm ngặt */}
      <m.div
        className="pointer-events-none absolute -bottom-2 -left-3 z-0 w-24 opacity-85 sm:-left-1 sm:bottom-0 sm:w-32 md:bottom-2 md:left-2 md:w-44"
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
        <img
          src="/templates/long-phung-ep4/dragon.webp"
          alt=""
          className="h-auto w-full object-contain drop-shadow-[0_4px_16px_rgba(223,192,124,0.35)]"
          aria-hidden="true"
        />
      </m.div>

      {/* PHƯỢNG HOÀNG KIM (Bottom-Right) — Ghim sát mép phải, z-0 nền, footprint co giãn nghiêm ngặt */}
      <m.div
        className="pointer-events-none absolute -bottom-2 -right-3 z-0 w-24 opacity-85 sm:-right-1 sm:bottom-0 sm:w-32 md:bottom-2 md:right-2 md:w-44"
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
        <img
          src="/templates/long-phung-ep4/phoenix.webp"
          alt=""
          className="h-auto w-full object-contain drop-shadow-[0_4px_16px_rgba(223,192,124,0.35)]"
          aria-hidden="true"
        />
      </m.div>

      {/* Khung nội dung trung tâm — z-10 nổi trước linh vật, đệm đáy an toàn chống đè chữ/nút */}
      <div className="relative z-10 mx-auto flex max-w-lg flex-col items-center px-6 pb-20 sm:pb-24 text-center">
        {/* Tiêu đề lễ cưới */}
        <m.p
          className="text-xs uppercase tracking-[0.35em]"
          style={{ color: GOLD_LIGHT, fontFamily: BODY_FONT }}
          initial={{ opacity: 0, y: 10 }}
          animate={isOpened ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          {primary?.title || "LỄ THÀNH HÔN"}
        </m.p>

        {/* Khung vòm ảnh cưới uyên ương (arch-frame.webp bọc quanh ảnh cặp đôi) */}
        <m.div
          className="relative my-4 h-64 w-48 sm:h-72 sm:w-56 md:h-80 md:w-64"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={isOpened ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.85, delay: 0.25, ease: EASE_ROYAL }}
        >
          {/* Lớp ảnh cặp đôi bên trong vòm cong */}
          <div className="absolute inset-2.5 overflow-hidden rounded-t-[72px] sm:inset-3 sm:rounded-t-[84px] md:rounded-t-[96px] bg-[#162A52]">
            {heroPhotoUrl ? (
              <img
                src={heroPhotoUrl}
                alt="Ảnh cưới uyên ương"
                className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-[#DFC07C]">
                <Heart className="h-8 w-8 opacity-60" />
                <span className="mt-2 text-[11px] tracking-wider uppercase opacity-80" style={{ fontFamily: BODY_FONT }}>
                  Khoảnh Khắc Uyên Ương
                </span>
              </div>
            )}
          </div>

          {/* Khung vòm mạ vàng bọc phủ viền ngoài */}
          <img
            src="/templates/long-phung-ep4/arch-frame.webp"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-fill drop-shadow-[0_4px_18px_rgba(223,192,124,0.35)]"
            aria-hidden="true"
          />
        </m.div>

        {/* Tên Chú Rể & Cô Dâu — Chuỗi 3 dòng chuẩn font serif */}
        <div className="relative my-3 space-y-1">
          {/* Tên Chú Rể */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={isOpened ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.4, ease: EASE_ROYAL }}
          >
            <span
              className="block text-3xl font-normal tracking-wide md:text-5xl"
              style={{
                fontFamily: NAME_FONT,
                color: GOLD_LIGHT,
                textShadow: "0 2px 14px rgba(0,0,0,0.7), 0 0 20px rgba(223,192,124,0.35)",
              }}
            >
              {data.couple?.groomName ?? "Chú Rể"}
            </span>
          </m.div>

          {/* Dấu & nối duyên */}
          <m.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={isOpened ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <span
              className="inline-block text-xl italic md:text-2xl"
              style={{ color: GOLD_MAIN, fontFamily: TITLE_FONT }}
            >
              &amp;
            </span>
          </m.div>

          {/* Tên Cô Dâu */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={isOpened ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.6, ease: EASE_ROYAL }}
          >
            <span
              className="block text-3xl font-normal tracking-wide md:text-5xl"
              style={{
                fontFamily: NAME_FONT,
                color: GOLD_LIGHT,
                textShadow: "0 2px 14px rgba(0,0,0,0.7), 0 0 20px rgba(223,192,124,0.35)",
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
          transition={{ duration: 0.8, delay: 0.7, ease: EASE_ROYAL }}
        >
          <img
            src="/templates/long-phung-ep4/divider-lotus.webp"
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
          transition={{ duration: 0.7, delay: 0.8 }}
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
        {primary && (
          <m.div
            className="relative z-10 mt-5 inline-flex max-w-[85%] items-center gap-1.5 rounded-full px-4 py-1.5 backdrop-blur-sm"
            style={{
              backgroundColor: "rgba(9, 19, 38, 0.8)",
              border: `1px solid ${GOLD_BORDER}`,
            }}
            initial={{ opacity: 0 }}
            animate={isOpened ? { opacity: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.9 }}
          >
            <MapPin className="h-3.5 w-3.5 text-[#DFC07C]" />
            <span className="text-xs font-medium tracking-wide text-[#FAF6F0]/90">
              {primary.venueName || primary.venueAddress || "Trung tâm Hội nghị Tiệc cưới"}
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
    <section className="relative overflow-hidden bg-[#FAF6F0] px-4 py-16 text-[#091326] md:py-24">
      {/* 4 Góc hoa văn vàng kim viền quanh thiệp kem dùng duy nhất corner-tl.webp */}
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute left-2 top-2 h-auto w-11 opacity-60 sm:left-4 sm:top-4 sm:w-14"
        aria-hidden="true"
      />
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute right-2 top-2 h-auto w-11 -scale-x-100 opacity-60 sm:right-4 sm:top-4 sm:w-14"
        aria-hidden="true"
      />
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute bottom-2 left-2 h-auto w-11 -scale-y-100 opacity-60 sm:bottom-4 sm:left-4 sm:w-14"
        aria-hidden="true"
      />
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute bottom-2 right-2 h-auto w-11 -scale-100 opacity-60 sm:bottom-4 sm:right-4 sm:w-14"
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
          <img
            src="/templates/long-phung-ep4/seal-gold.webp"
            alt="Song Hỷ"
            className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(223,192,124,0.4)]"
          />
        </m.div>

        {/* Lời dẫn dắt thư mời */}
        <m.h2
          className="text-xs uppercase tracking-[0.3em]"
          style={{ color: GOLD_ACCENT, fontFamily: BODY_FONT }}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          Thư Mời Tiệc Cưới
        </m.h2>

        <m.p
          className="mt-3 text-2xl md:text-3xl"
          style={{ fontFamily: NAME_FONT, color: NAVY_MAIN }}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Trân Trọng Kính Mời Quan Khách
        </m.p>

        <m.p
          className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#1E293B]/80 md:text-base"
          style={{ fontFamily: BODY_FONT }}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          Hôn nhân là bến đỗ bình yên của tình yêu, là lời thề ước trăm năm dưới sự chứng giám của hai họ và bạn bè thân quý. Chúng tôi vô cùng hân hạnh được đón tiếp quý vị trong ngày vui trọng đại của gia đình.
        </m.p>

        {/* Thẻ đại gia đình hai bên: Nhà Trai & Nhà Gái */}
        <div className="mt-12 grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
          {/* Card Nhà Trai */}
          <m.div
            className="relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 hover:shadow-md"
            style={{
              backgroundColor: SILK_CREAM_CARD,
              border: `1px solid ${GOLD_BORDER}`,
            }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#DFC07C]/30 pb-3">
                <span
                  className="text-xs uppercase tracking-[0.25em]"
                  style={{ color: GOLD_ACCENT, fontFamily: BODY_FONT }}
                >
                  Nhà Trai
                </span>
                <span className="text-xs text-[#091326]/60">Hôn trường đàng trai</span>
              </div>

              {/* Tên phụ huynh tách dòng sạch tại '&' */}
              <div className="mt-4 space-y-1 text-sm text-[#1E293B]">
                {data.couple?.groomParents ? (
                  data.couple.groomParents.includes("&") ? (
                    data.couple.groomParents.split("&").map((p, i) => (
                      <p key={i} className="font-medium">
                        {p.trim()}
                      </p>
                    ))
                  ) : (
                    <p className="font-medium">{data.couple.groomParents}</p>
                  )
                ) : (
                  <>
                    <p className="font-medium">Ông: Trần Văn Thành</p>
                    <p className="font-medium">Bà: Lê Thị Mai</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-[#DFC07C]/20 pt-4">
              <span className="text-xs uppercase tracking-wider text-[#091326]/60" style={{ fontFamily: BODY_FONT }}>
                {groomTitle}
              </span>
              <p
                className="mt-1 text-2xl font-normal"
                style={{ fontFamily: NAME_FONT, color: NAVY_MAIN }}
              >
                {data.couple?.groomFullName || data.couple?.groomName || "Trần Quốc Đạt"}
              </p>
            </div>
          </m.div>

          {/* Card Nhà Gái */}
          <m.div
            className="relative flex flex-col justify-between rounded-2xl p-6 transition-all duration-300 hover:shadow-md"
            style={{
              backgroundColor: SILK_CREAM_CARD,
              border: `1px solid ${GOLD_BORDER}`,
            }}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <div>
              <div className="flex items-center justify-between border-b border-[#DFC07C]/30 pb-3">
                <span
                  className="text-xs uppercase tracking-[0.25em]"
                  style={{ color: GOLD_ACCENT, fontFamily: BODY_FONT }}
                >
                  Nhà Gái
                </span>
                <span className="text-xs text-[#091326]/60">Hôn trường đàng gái</span>
              </div>

              {/* Tên phụ huynh tách dòng sạch tại '&' */}
              <div className="mt-4 space-y-1 text-sm text-[#1E293B]">
                {data.couple?.brideParents ? (
                  data.couple.brideParents.includes("&") ? (
                    data.couple.brideParents.split("&").map((p, i) => (
                      <p key={i} className="font-medium">
                        {p.trim()}
                      </p>
                    ))
                  ) : (
                    <p className="font-medium">{data.couple.brideParents}</p>
                  )
                ) : (
                  <>
                    <p className="font-medium">Ông: Nguyễn Văn Hùng</p>
                    <p className="font-medium">Bà: Phạm Thị Lan</p>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-[#DFC07C]/20 pt-4">
              <span className="text-xs uppercase tracking-wider text-[#091326]/60" style={{ fontFamily: BODY_FONT }}>
                {brideTitle}
              </span>
              <p
                className="mt-1 text-2xl font-normal"
                style={{ fontFamily: NAME_FONT, color: NAVY_MAIN }}
              >
                {data.couple?.brideFullName || data.couple?.brideName || "Nguyễn Khánh Huyền"}
              </p>
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
      <section className="relative bg-[#091326] px-4 py-16 text-center text-[#FAF6F0]">
        <h3 className="text-xs uppercase tracking-[0.3em] text-[#DFC07C]">Khoảnh Khắc Hạnh Phúc</h3>
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

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartXRef.current;
    if (diff > 45) handlePrev();
    else if (diff < -45) handleNext();
    touchStartXRef.current = null;
  };

  return (
    <section className="relative overflow-hidden bg-[#091326] px-4 py-16 text-[#FAF6F0] md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20 mix-blend-soft-light"
        style={{ backgroundImage: "url('/templates/long-phung-ep4/background-mobile.webp')" }}
      />
      <GoldDustParticles count={14} />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <p className="text-xs uppercase tracking-[0.3em]" style={{ color: GOLD_LIGHT, fontFamily: BODY_FONT }}>
          Khoảnh Khắc Hạnh Phúc
        </p>
        <h2 className="mt-1 text-2xl md:text-3xl" style={{ fontFamily: NAME_FONT, color: GOLD_LIGHT }}>
          Album Ảnh Cưới
        </h2>
        <p className="mx-auto mt-2 max-w-md text-xs text-[#FAF6F0]/70 md:text-sm">
          Ghi lại những thước phim lãng mạn, đánh dấu từng bước chân tình yêu của đôi lứa.
        </p>

        {/* Khung Coverflow 3D */}
        <div
          className="relative mx-auto mt-10 h-[380px] w-full max-w-md select-none sm:h-[440px]"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="flex h-full w-full items-center justify-center">
            {photos.map((item, idx) => {
              const offset = idx - activeIndex;
              const isCenter = offset === 0;
              const isImmediate = Math.abs(offset) <= 2;

              if (!isImmediate && Math.abs(offset) > 2) return null;

              const translateX = offset * 110;
              const scale = isCenter ? 1 : 0.82 - Math.abs(offset) * 0.08;
              const rotateY = offset * -28;
              const zIndex = 30 - Math.abs(offset) * 10;
              const opacity = isCenter ? 1 : Math.max(0.3, 0.7 - Math.abs(offset) * 0.25);

              return (
                <m.div
                  key={idx}
                  className="absolute cursor-pointer overflow-hidden rounded-2xl"
                  style={{
                    width: 250,
                    height: 350,
                    zIndex,
                    border: isCenter ? `2px solid ${GOLD_MAIN}` : "1px solid rgba(223, 192, 124, 0.25)",
                    boxShadow: isCenter
                      ? "0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(223, 192, 124, 0.35)"
                      : "0 6px 16px rgba(0,0,0,0.5)",
                  }}
                  animate={{
                    x: translateX,
                    scale,
                    rotateY,
                    opacity,
                  }}
                  transition={{ duration: 0.55, ease: EASE_ROYAL }}
                  onClick={() => {
                    if (isCenter) setLightboxIndex(idx);
                    else setActiveIndex(idx);
                  }}
                >
                  <img
                    src={item.url}
                    alt={item.alt || `Ảnh cưới ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  {isCenter && (
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-3 text-center">
                      <span className="text-xs tracking-wider text-[#FAF6F0]/90">
                        Chạm để phóng to
                      </span>
                    </div>
                  )}
                </m.div>
              );
            })}
          </div>

          {/* Nút điều hướng Coverflow */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 z-40 -translate-y-1/2 rounded-full p-2.5 backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
            style={{
              backgroundColor: "rgba(15, 29, 58, 0.75)",
              border: `1px solid ${GOLD_BORDER}`,
              color: GOLD_LIGHT,
            }}
            aria-label="Ảnh trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 z-40 -translate-y-1/2 rounded-full p-2.5 backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
            style={{
              backgroundColor: "rgba(15, 29, 58, 0.75)",
              border: `1px solid ${GOLD_BORDER}`,
              color: GOLD_LIGHT,
            }}
            aria-label="Ảnh kế tiếp"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Thanh chỉ số ảnh */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex ? "w-6 bg-[#DFC07C]" : "w-1.5 bg-[#DFC07C]/30",
              )}
              aria-label={`Đến ảnh ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Lightbox xem ảnh toàn màn hình */}
      {lightboxIndex !== null && (
        <TemplateLightboxModal
          photos={photos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={(newIdx: number) => setLightboxIndex(newIdx)}
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
  const primary = getNearestUpcomingEvent(visibleEvents, data.date);
  const targetDateStr = primary?.startsAt ?? data.date;

  const { daysRemaining, hoursRemaining, minutesRemaining, secondsRemaining } = React.useMemo(() => {
    if (!targetDateStr) return { daysRemaining: 0, hoursRemaining: 0, minutesRemaining: 0, secondsRemaining: 0 };
    const target = new Date(targetDateStr).getTime();
    const now = Date.now();
    const diff = Math.max(0, target - now);

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);
    return { daysRemaining: d, hoursRemaining: h, minutesRemaining: m, secondsRemaining: s };
  }, [targetDateStr]);

  const weddingDateObj = React.useMemo(() => {
    return targetDateStr ? new Date(targetDateStr) : new Date("2026-10-26");
  }, [targetDateStr]);

  const weddingYear = weddingDateObj.getFullYear();
  const weddingMonth = weddingDateObj.getMonth();
  const weddingDay = weddingDateObj.getDate();

  // Tạo lưới lịch tháng
  const monthDays = React.useMemo(() => {
    const firstDayIndex = new Date(weddingYear, weddingMonth, 1).getDay();
    const totalDays = new Date(weddingYear, weddingMonth + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    return days;
  }, [weddingYear, weddingMonth]);

  // Ngày của các sự kiện trong tháng
  const eventDays = React.useMemo(() => {
    const days = new Set(
      visibleEvents
        .map((evt) => {
          const d = new Date(evt.startsAt || targetDateStr);
          return d.getFullYear() === weddingYear && d.getMonth() === weddingMonth ? d.getDate() : null;
        })
        .filter((val): val is number => val !== null)
    );
    if (days.size === 0 && !isNaN(weddingDay)) {
      days.add(weddingDay);
    }
    return days;
  }, [visibleEvents, targetDateStr, weddingYear, weddingMonth, weddingDay]);

  const mapDirectionLink = primary?.mapDirectionsUrl || primary?.mapEmbedUrl;
  const dateParts = formatWeddingDateParts(primary?.startsAt ?? data.date);

  return (
    <section className="relative overflow-hidden bg-[#FAF6F0] px-4 py-16 text-[#091326] md:py-24">
      {/* 4 Góc hoa văn hoàng gia trang trí lịch cưới dùng duy nhất corner-tl.webp */}
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute left-2 top-2 h-auto w-11 opacity-60 sm:left-4 sm:top-4 sm:w-14"
        aria-hidden="true"
      />
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute right-2 top-2 h-auto w-11 -scale-x-100 opacity-60 sm:right-4 sm:top-4 sm:w-14"
        aria-hidden="true"
      />
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute bottom-2 left-2 h-auto w-11 -scale-y-100 opacity-60 sm:bottom-4 sm:left-4 sm:w-14"
        aria-hidden="true"
      />
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute bottom-2 right-2 h-auto w-11 -scale-100 opacity-60 sm:bottom-4 sm:right-4 sm:w-14"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#C6A45E]" style={{ fontFamily: BODY_FONT }}>
          Ngày Hạnh Phúc
        </p>
        <h2 className="mt-1 text-2xl md:text-3xl" style={{ fontFamily: NAME_FONT, color: NAVY_MAIN }}>
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
          <div className="mb-4 flex items-center justify-between border-b border-[#DFC07C]/30 pb-3">
            <span className="text-sm font-semibold tracking-wider text-[#091326]" style={{ fontFamily: BODY_FONT }}>
              Tháng {weddingMonth + 1} / {weddingYear}
            </span>
            <span className="text-xs text-[#091326]/60">Ngày Cưới Trọng Đại</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-[#1E293B]/70">
            <span>CN</span>
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-sm">
            {monthDays.map((day, idx) => {
              if (day === null) return <div key={idx} className="h-8" />;
              const isWeddingDay = day !== null && eventDays.has(day);

              return (
                <div
                  key={idx}
                  className={cn(
                    "relative flex h-8 items-center justify-center rounded-full text-xs transition-all",
                    isWeddingDay
                      ? "font-bold text-[#091326]"
                      : "text-[#1E293B]/85 hover:bg-[#DFC07C]/15",
                  )}
                  style={
                    isWeddingDay
                      ? {
                        background: "linear-gradient(135deg, #DFC07C 0%, #C6A45E 100%)",
                        boxShadow: "0 2px 10px rgba(223, 192, 124, 0.45)",
                      }
                      : {}
                  }
                >
                  {day}
                  {isWeddingDay && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#DFC07C] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C6A45E]" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Đồng Hồ Đếm Ngược Hoàng Gia */}
        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.25em] text-[#C6A45E]" style={{ fontFamily: BODY_FONT }}>
            Cùng Đếm Ngược Đến Giây Phút Thiêng Liêng
          </p>

          <div className="mt-4 grid grid-cols-4 gap-2.5 sm:gap-4">
            {[
              { val: daysRemaining, unit: "Ngày" },
              { val: hoursRemaining, unit: "Giờ" },
              { val: minutesRemaining, unit: "Phút" },
              { val: secondsRemaining, unit: "Giây" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center rounded-xl py-3 shadow-xs"
                style={{
                  backgroundColor: SILK_CREAM_CARD,
                  border: `1px solid ${GOLD_BORDER}`,
                }}
              >
                <span
                  className="text-2xl font-semibold sm:text-3xl"
                  style={{ color: NAVY_MAIN, fontFamily: TITLE_FONT }}
                >
                  {String(item.val).padStart(2, "0")}
                </span>
                <span className="text-[10px] tracking-wider text-[#1E293B]/70 uppercase sm:text-xs">
                  {item.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Thông tin sự kiện chi tiết: Giờ, Địa điểm & Chỉ đường (hỗ trợ đa lễ) */}
        <div
          className={cn(
            "mt-8 grid gap-4 text-left",
            visibleEvents.length === 1 ? "max-w-xl mx-auto" : "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
          )}
        >
          {visibleEvents.map((evt, idx) => {
            const evtDateParts = formatWeddingDateParts(evt.startsAt || targetDateStr);
            const evtDirections = getEventDirectionsUrl(evt);

            return (
              <div
                key={evt.id || `evt-${idx}`}
                className="rounded-2xl p-5 flex flex-col justify-between"
                style={{
                  backgroundColor: SILK_CREAM_CARD,
                  border: `1px solid ${GOLD_BORDER}`,
                }}
              >
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C6A45E] block mb-3">
                    {evt.title || (idx === 0 ? "Lễ Thành Hôn" : "Tiệc Báo Hỷ")}
                  </span>

                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#C6A45E]" />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#C6A45E]">Thời Gian</p>
                      <p className="text-sm font-medium text-[#1E293B]">
                        {evtDateParts.time ? `${evtDateParts.time} — ` : ""}{evtDateParts.day} · {evtDateParts.month} · {evtDateParts.year}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-3 border-t border-[#DFC07C]/20 pt-4">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C6A45E]" />
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-wider text-[#C6A45E]">Địa Điểm</p>
                      <p className="text-sm font-medium text-[#1E293B]">{evt.venueName}</p>
                      {evt.venueAddress && (
                        <p className="mt-0.5 text-xs text-[#1E293B]/70">{evt.venueAddress}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-5 text-center">
                  <a
                    href={evtDirections}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-wider transition-transform hover:scale-105 active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #0F1D3A 0%, #162A52 100%)",
                      color: GOLD_LIGHT,
                      border: `1px solid ${GOLD_BORDER}`,
                    }}
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#DFC07C]" />
                    Xem Chỉ Đường Google Maps
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" />
                  </a>
                </div>
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
    <section className="relative overflow-hidden bg-[#091326] px-4 py-16 text-[#FAF6F0] md:py-24">
      {/* Nền gấm & hoa văn mây sen */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20 mix-blend-soft-light"
        style={{ backgroundImage: "url('/templates/long-phung-ep4/background-mobile.webp')" }}
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
            className="absolute left-6 top-3 bottom-3 w-0.5 sm:left-1/2 sm:-translate-x-1/2"
            style={{ background: "linear-gradient(180deg, transparent 0%, #DFC07C 15%, #DFC07C 85%, transparent 100%)" }}
          />

          <div className="space-y-6">
            {timeline.map((item, idx) => {
              const isEven = idx % 2 === 0;

              return (
                <m.div
                  key={idx}
                  className="relative flex items-center gap-4 sm:gap-8"
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                >
                  {/* Điểm nút tròn hoa sen vàng */}
                  <div
                    className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:absolute sm:left-1/2 sm:-translate-x-1/2"
                    style={{
                      background: "linear-gradient(135deg, #162A52 0%, #0F1D3A 100%)",
                      border: `1.5px solid ${GOLD_MAIN}`,
                      boxShadow: "0 0 12px rgba(223, 192, 124, 0.4)",
                    }}
                  >
                    <span className="text-xs font-bold text-[#DFC07C]" style={{ fontFamily: TITLE_FONT }}>
                      {item.time || "18:00"}
                    </span>
                  </div>

                  {/* Nội dung card timeline */}
                  <div
                    className={cn(
                      "flex-1 rounded-xl p-4 text-left sm:w-[42%]",
                      isEven ? "sm:mr-auto sm:text-right" : "sm:ml-auto",
                    )}
                    style={{
                      backgroundColor: "rgba(22, 42, 82, 0.7)",
                      border: `1px solid ${GOLD_BORDER}`,
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <span className="text-[11px] font-semibold tracking-wider text-[#DFC07C] uppercase sm:hidden">
                      {item.time}
                    </span>
                    <p className="text-sm font-medium text-[#FAF6F0]" style={{ fontFamily: BODY_FONT }}>
                      {item.label}
                    </p>
                  </div>
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
  plan?: WeddingPlan;
  guestName?: string;
}) {
  // Gift modal state & Parcel interaction (700ms delay + SFX envelope)
  const {
    stage: giftBoxStage,
    setStage: setBoxState,
    isOpening: isGiftOpening,
    isModalOpen: modalOpen,
    setIsModalOpen: setModalOpen,
    handleGiftClick,
    handleCloseModal,
  } = useGiftBoxInteraction({
    sfxType: "envelope",
  });
  const boxState = (giftBoxStage === "open" || giftBoxStage === "active") ? "active" : (giftBoxStage === "glow" || giftBoxStage === "hover") ? "hover" : "normal";

  return (
    <section className="relative overflow-hidden bg-[#FAF6F0] px-4 py-16 text-[#091326] md:py-24">
      {/* 4 Góc hoa văn hoàng gia trang trí hộp mừng dùng duy nhất corner-tl.webp */}
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute left-2 top-2 h-auto w-11 opacity-60 sm:left-4 sm:top-4 sm:w-14"
        aria-hidden="true"
      />
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute right-2 top-2 h-auto w-11 -scale-x-100 opacity-60 sm:right-4 sm:top-4 sm:w-14"
        aria-hidden="true"
      />
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute bottom-2 left-2 h-auto w-11 -scale-y-100 opacity-60 sm:bottom-4 sm:left-4 sm:w-14"
        aria-hidden="true"
      />
      <img
        src="/templates/long-phung-ep4/corner-tl.webp"
        alt=""
        className="pointer-events-none absolute bottom-2 right-2 h-auto w-11 -scale-100 opacity-60 sm:bottom-4 sm:right-4 sm:w-14"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-lg text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-[#C6A45E]" style={{ fontFamily: BODY_FONT }}>
          Mừng Cưới Chúc Phúc
        </p>
        <h2 className="mt-1 text-2xl md:text-3xl" style={{ fontFamily: NAME_FONT, color: NAVY_MAIN }}>
          Hộp Mừng Cưới
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-xs text-[#091326]/75 md:text-sm">
          Sự hiện diện và lời chúc phúc của quý vị là món quà ý nghĩa nhất dành cho tân lang &amp; tân nương.
        </p>

        {/* Khung Hộp Quà 3 Trạng Thái — Kích thước & Baseline đồng nhất tuyệt đối */}
        <div className="mt-8 flex flex-col items-center justify-center">
          {/* Preload ẩn để tránh chớp trắng khi hover/active */}
          <div className="hidden" aria-hidden="true">
            <img src="/templates/long-phung-ep4/gift-normal.webp" alt="" width={320} height={568} />
            <img src="/templates/long-phung-ep4/gift-hover.webp" alt="" width={320} height={568} />
            <img src="/templates/long-phung-ep4/gift-active.webp" alt="" width={320} height={568} />
          </div>

          <div
            className="group relative cursor-pointer"
            onMouseEnter={() => !isGiftOpening && setBoxState("glow")}
            onMouseLeave={() => !isGiftOpening && boxState !== "active" && setBoxState("normal")}
            onClick={handleGiftClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleGiftClick();
              }
            }}
            aria-label="Mở hộp mừng cưới gửi quà chúc phúc"
          >
            {/* Hào quang vàng kim lan tỏa dưới đáy hộp quà */}
            <div
              className="pointer-events-none absolute -bottom-4 left-1/2 h-16 w-48 -translate-x-1/2 rounded-full opacity-60 blur-xl transition-opacity duration-500 group-hover:opacity-90"
              style={{ background: "radial-gradient(circle, rgba(223,192,124,0.6) 0%, transparent 70%)" }}
            />

            {/* Ảnh hộp quà 3 trạng thái với kích thước 320x568px chuẩn tỷ lệ */}
            <div className="relative h-[280px] w-[160px] sm:h-[340px] sm:w-[190px]">
              <img
                src={
                  boxState === "active"
                    ? "/templates/long-phung-ep4/gift-active.webp"
                    : boxState === "hover"
                      ? "/templates/long-phung-ep4/gift-hover.webp"
                      : "/templates/long-phung-ep4/gift-normal.webp"
                }
                alt="Hộp mừng cưới hoàng gia"
                className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#091326] transition-colors group-hover:text-[#C6A45E]">
              <span>Chạm để gửi mừng cưới</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal VietQR mừng cưới mở qua Portal với màu cứng chuẩn Lam Ngọc */}
      <GiftModal
        open={modalOpen}
        onClose={handleCloseModal}
        gift={data.gift}
        plan={plan ?? "free"}
        coupleName={`${data.couple?.groomName ?? "Chú Rể"} & ${data.couple?.brideName ?? "Cô Dâu"}`}
        guestName={guestName}
        tone="obsidian"
      />
    </section>
  );
}

/* ============================================================
   TEMPLATE CHÍNH: LONG PHỤNG EP4 — LAM NGỌC HOÀNG GIA
   ============================================================ */
export function LongPhungEp4Template({
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
  const [openState, setOpenState] = React.useState(Boolean(isOpened));
  const [coverGone, setCoverGone] = React.useState(Boolean(isOpened));

  // Đồng bộ 2 chiều prop isOpened bằng parentOpenedRef theo quy chuẩn card_exp.md
  const parentOpenedRef = React.useRef(isOpened);
  React.useEffect(() => {
    if (parentOpenedRef.current && !isOpened) {
      setOpenState(false);
      setCoverGone(false);
    } else if (!parentOpenedRef.current && isOpened) {
      setOpenState(true);
      setCoverGone(true);
    }
    parentOpenedRef.current = isOpened;
  }, [isOpened]);

  const handleOpenInvitation = () => {
    setOpenState(true);
    setCoverGone(true);
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }
    if (!contained && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const safeGuestName = guestName || data.ui?.defaultGuestName || "";

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[840px] text-[#FAF6F0] selection:bg-[#DFC07C]/30 selection:text-[#DFC07C]",
        !coverGone
          ? contained
            ? "h-full overflow-hidden"
            : "h-screen-dvh max-h-full overflow-hidden"
          : "min-h-screen",
      )}
      style={{
        backgroundColor: NAVY_DARK,
        fontFamily: BODY_FONT,
      }}
    >
      {/* --------------------------------------------------------
          LỚP 1: MÀN HÌNH MỞ BÌA THIỆP (Splash Cover)
          -------------------------------------------------------- */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            className="absolute inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <EnvelopeCover
              data={data}
              guestName={safeGuestName}
              contained={contained}
              onOpen={handleOpenInvitation}
            />
          </m.div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------
          LỚP 2: NÚT NHẠC NỀN NỔI
          -------------------------------------------------------- */}
      <LiveMusicFloatingButton
        src={data.music?.src}
        title={data.music?.title || "Lam Ngọc Hoàng Gia"}
        visible={openState}
        tone="obsidian"
      />

      {/* --------------------------------------------------------
          LỚP 3: RUỘT THIỆP CƯỚI CHÍNH (Chỉ hiển thị sau khi mở)
          -------------------------------------------------------- */}
      <main
        className={cn(
          "relative z-10 transition-opacity duration-700",
          !openState ? "hidden opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {/* Section 1: Hero chào mừng Long Phụng & Khung vòm ảnh cưới */}
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

        {/* Section 7: Form xác nhận tham dự RSVP & Sổ lời chúc (Không bọc viền trắng) */}
        <section className="relative overflow-hidden bg-[#091326] px-4 py-16 text-[#FAF6F0] md:py-24">
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25 mix-blend-soft-light"
            style={{ backgroundImage: "url('/templates/long-phung-ep4/background-mobile.webp')" }}
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
                  accentColor="#0F1D3A"
                  textColor="#FAF6F0"
                  mutedColor="#DFC07C"
                />
              </div>
            )}
          </div>
        </section>

        {/* Footer chúc phúc chân trang */}
        <footer className="border-t border-[#DFC07C]/20 bg-[#091326] px-4 py-12 text-center text-xs text-[#FAF6F0]/60">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
            <Heart className="h-4 w-4 text-[#DFC07C]" />
            <p className="tracking-widest uppercase">
              {data.couple?.groomName ?? "Chú Rể"} &amp; {data.couple?.brideName ?? "Cô Dâu"}
            </p>
            <p className="text-[11px] text-[#FAF6F0]/40">
              Cảm ơn quý khách đã gửi trọn yêu thương cùng chúng tôi
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default LongPhungEp4Template;
