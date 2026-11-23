"use client";

import * as React from "react";
import {
  MapPin,
  ExternalLink,
  Film,
  Camera,
  Play,
  Heart,
  Volume2,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playCoverSfx } from "@/lib/sfx";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingEvent, WeddingPlan } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import { FilmFrame35mm } from "../shared/FilmFrame35mm";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: HƯƠNG CẢNG ĐÊM NEON (huong-cang-dem-neon)
   - Đen đêm điện ảnh Mong Kok: #0B0B0F / #12121A
   - Hồng neon rực rỡ: #FF2D78
   - Xanh neon ngọc: #00F5D4
   - Đỏ neon Hong Kong: #FF1E3C
   - Vàng ấm subtitle phim 35mm: #F5B841
   - Trắng kem neon: #F7F4EE
   - Xám khói phụ: #9E9AA7
   ============================================================ */

const COLOR_BG = "#0B0B0F";
const COLOR_CARD = "#12121A";
const COLOR_CARD_BORDER = "rgba(255, 45, 120, 0.35)";
const COLOR_NEON_PINK = "#FF2D78";
const COLOR_NEON_CYAN = "#00F5D4";
const COLOR_NEON_RED = "#FF1E3C";
const COLOR_GOLD_SUBTITLE = "#F5B841";
const COLOR_TEXT_IVORY = "#F7F4EE";
const COLOR_TEXT_MUTED = "#9E9AA7";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const MONO_FONT = "var(--font-be-vietnam), ui-monospace, SFMono-Regular, monospace";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const DEFAULT_DRESS = ["#FF2D78", "#00F5D4", "#12121A"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function parseParents(names?: string | null): [string, string | null] {
  if (!names) return ["", null];
  const parts = names.split(/\s*&\s*/);
  return [parts[0]?.trim() || "", parts[1]?.trim() || null];
}

export function HuongCangDemNeonTemplate({
  data,
  mode = "preview",
  contained = false,
  viewport = "desktop",
  externalMusicControl = false,
  isOpened: parentIsOpened,
  onOpenedChange,
  inviteSlug,
  weddingSlug,
  invitationMode = "public",
  guestName,
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = null,
  initialSongRequest = null,
  initialRideNeeded = false,
}: WeddingTemplateProps) {
  const shouldReduceMotion = useReducedMotion();

  // -------------------------------------------------------------
  // TRẠNG THÁI MỞ BÌA (Cover)
  // -------------------------------------------------------------
  const [isOpening, setIsOpening] = React.useState(false);
  const [glitchFlash, setGlitchFlash] = React.useState(false);
  const [vhsLeader, setVhsLeader] = React.useState(false);
  const [coverGone, setCoverGone] = React.useState(false);
  const parentOpenedRef = React.useRef(parentIsOpened);

  React.useEffect(() => {
    if (parentIsOpened && !coverGone && !isOpening) {
      setCoverGone(true);
    } else if (parentIsOpened === false && parentOpenedRef.current === true) {
      setCoverGone(false);
      setIsOpening(false);
      setGlitchFlash(false);
      setVhsLeader(false);
    }
    parentOpenedRef.current = parentIsOpened;
  }, [parentIsOpened, coverGone, isOpening]);

  const handleOpenInvitation = () => {
    if (isOpening || coverGone) return;
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }
    setIsOpening(true);

    playCoverSfx("vhs-shutter");

    if (shouldReduceMotion) {
      setTimeout(() => {
        setCoverGone(true);
        setIsOpening(false);
        if (!contained && typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      }, 200);
      return;
    }

    // Pha 1: Scanlines + Tracking glitch RGB + Flash trắng dịu (0 - 450ms)
    setGlitchFlash(true);

    // Pha 2: Chuyển sang màn đen VHS Leader với tiêu đề zoom-in (450ms - 1100ms)
    setTimeout(() => {
      setVhsLeader(true);
    }, 450);

    // Hoàn tất mở vào thân thiệp (1150ms)
    setTimeout(() => {
      setCoverGone(true);
      setIsOpening(false);
      setGlitchFlash(false);
      setVhsLeader(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 1150);
  };

  // -------------------------------------------------------------
  // TƯƠNG TÁC HỘP QUÀ VHS 3 TRẠNG THÁI (hook)
  // -------------------------------------------------------------
  const {
    stage: boxStage,
    isOpening: isBoxOpening,
    isModalOpen: isGiftModalOpen,
    handleGiftClick,
    handleCloseModal: handleCloseGiftModal,
  } = useGiftBoxInteraction({
    sfxType: "tin-vhs",
    delayMs: shouldReduceMotion ? 150 : 700,
  });

  // -------------------------------------------------------------
  // LIGHTBOX PORTAL CHO ALBUM 35MM
  // -------------------------------------------------------------
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // -------------------------------------------------------------
  // DỮ LIỆU SỰ KIỆN & THỜI GIAN
  // -------------------------------------------------------------
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent?.startsAt || data.date;
  const dateParts = formatWeddingDateParts(eventDateStr);

  // Đếm ngược
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    if (!eventDateStr) return;
    const target = new Date(eventDateStr).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [eventDateStr]);

  // Phân quyền Free/Pro/VIP cho Album
  const plan: WeddingPlan = data.plan || "free";
  const galleryLimit = plan === "free" ? 5 : plan === "pro" ? 30 : 50;
  const rawGallery = data.photos?.gallery || [];
  const galleryPhotos = rawGallery.slice(0, galleryLimit);

  // Song thân
  const [groomFather, groomMother] = parseParents(data.couple.groomParents);
  const [brideFather, brideMother] = parseParents(data.couple.brideParents);

  // Bảng màu Dress Code
  const dressColors = getDressColors(data);

  // Cấu hình ẩn/hiện section
  const hidden = new Set(data.hiddenSections || []);
  const order = data.sectionOrder || [
    "family",
    "calendar",
    "map",
    "dresscode",
    "album",
    "albumQr",
    "gift",
    "rsvp",
  ];
  const orderOf = (key: string) => {
    const idx = order.indexOf(key as any);
    return idx === -1 ? 99 : idx;
  };

  // -------------------------------------------------------------
  // DỮ LIỆU LỊCH THÁNG & NGÀY SỰ KIỆN
  // -------------------------------------------------------------
  const eventDays = React.useMemo(() => {
    const days = new Set<number>();
    const month = parseInt(dateParts.month, 10) || 1;
    const year = parseInt(dateParts.year, 10) || 2027;
    visibleEvents.forEach((evt) => {
      if (evt.startsAt) {
        const d = new Date(evt.startsAt);
        if (d.getFullYear() === year && d.getMonth() + 1 === month) {
          days.add(d.getDate());
        }
      }
    });
    if (days.size === 0 && dateParts.day) {
      days.add(parseInt(dateParts.day, 10));
    }
    return days;
  }, [visibleEvents, dateParts.month, dateParts.year, dateParts.day]);

  const calendarDays = React.useMemo(() => {
    const month = parseInt(dateParts.month, 10) || 1;
    const year = parseInt(dateParts.year, 10) || 2027;
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
    // Chuyển sang T2 là ngày 0
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [dateParts.month, dateParts.year]);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[500px] overflow-x-hidden text-[#F7F4EE] selection:bg-[#FF2D78]/30 selection:text-[#00F5D4]",
        contained ? "h-full" : "min-h-screen",
        !coverGone && (contained ? "overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden"),
      )}
      style={{
        backgroundColor: COLOR_BG,
        fontFamily: BODY_FONT,
      }}
    >
      {/* Nút điều khiển nhạc nền */}
      {!externalMusicControl && !hidden.has("music") && data.music?.src && (
        <LiveMusicFloatingButton
          src={data.music.src}
          title={data.music.title}
          visible={coverGone}
        />
      )}

      {/* Preload ảnh trạng thái mở hộp quà */}
      <img
        src="/templates/huong-cang-dem-neon/vhs_box_open.webp"
        className="hidden"
        aria-hidden="true"
        alt=""
      />

      {/* =========================================================
          BÌA PHỐ ĐÊM NEON + HUD VHS 1990S (COVER)
          ========================================================= */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: shouldReduceMotion ? 1 : 1.05,
              transition: { duration: 0.45, ease: "easeInOut" },
            }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            style={{ backgroundColor: COLOR_BG }}
          >
            {/* z-0: Nền Phố Đêm Neon Mobile / Desktop */}
            <div className="absolute inset-0 z-0">
              <picture className="h-full w-full">
                <source
                  media="(min-width: 640px)"
                  srcSet="/templates/huong-cang-dem-neon/bg_street_desktop.webp"
                />
                <img
                  src="/templates/huong-cang-dem-neon/bg_street_mobile.webp"
                  alt="Hương Cảng Đêm Neon Cover Background"
                  className="h-full w-full object-cover object-center"
                />
              </picture>

              {/* Lớp màng mờ và vệt sáng điện ảnh */}
              <div
                className="absolute inset-0 bg-gradient-to-b from-[#0B0B0F]/60 via-transparent to-[#0B0B0F]/90 pointer-events-none"
                aria-hidden="true"
              />
            </div>

            {/* z-10: VHS HUD OVERLAY (Góc trên & Các thông số vintage) */}
            <div className="absolute inset-0 z-10 pointer-events-none p-5 sm:p-7 flex flex-col justify-between">
              {/* Header HUD: REC nhấp nháy + SP 90s + Retro Star */}
              <div className="flex items-center justify-between text-xs tracking-widest text-[#F7F4EE]">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-[#FF1E3C] animate-pulse shadow-[0_0_8px_#FF1E3C]" />
                  <span className="font-bold text-[#FF1E3C]" style={{ fontFamily: MONO_FONT }}>
                    REC
                  </span>
                  <span className="opacity-70 text-[10px]" style={{ fontFamily: MONO_FONT }}>
                    SP · 00:00:24
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#00F5D4]" style={{ fontFamily: MONO_FONT }}>
                  <span>CH 03</span>
                  <img
                    src="/templates/huong-cang-dem-neon/sticker_retro_stars.webp"
                    alt=""
                    className="h-5 w-5 object-contain"
                  />
                </div>
              </div>

              {/* Footer HUD info */}
              <div className="flex items-center justify-between text-[10px] tracking-wider text-[#9E9AA7]" style={{ fontFamily: MONO_FONT }}>
                <span>PLAY ▶ VHS-HQ</span>
                <span>MONG KOK · 03:25 AM</span>
              </div>
            </div>

            {/* z-20: Nội dung chính bìa thiệp */}
            <div className="relative z-20 flex w-full max-w-sm flex-col items-center px-6 text-center">
              {/* Biển hiệu neon Song Hỷ rực rỡ */}
              <m.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative mb-3 flex items-center justify-center"
              >
                <img
                  src="/templates/huong-cang-dem-neon/neon_sign_song_hy.webp"
                  alt="Biển hiệu Neon Song Hỷ Hương Cảng"
                  className="h-28 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,45,120,0.7)]"
                />
              </m.div>

              {/* Nhãn thể loại phim tình cảm Hong Kong 1990s */}
              <span
                className="mb-2 inline-block rounded-full border border-[#00F5D4]/40 bg-[#0B0B0F]/80 px-3 py-1 text-[10px] font-bold tracking-[0.25em] text-[#00F5D4] uppercase shadow-[0_0_10px_rgba(0,245,212,0.3)]"
                style={{ fontFamily: MONO_FONT }}
              >
                THƯỚC PHIM TÌNH YÊU
              </span>

              {/* Tên Cô Dâu & Chú Rể với hiệu ứng Neon Glow */}
              <div className="my-3 space-y-1">
                <h1
                  className="text-3xl font-extrabold uppercase tracking-widest text-[#F7F4EE] sm:text-4xl drop-shadow-[0_0_12px_rgba(255,45,120,0.6)]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  {data.couple.groomName}
                </h1>
                <div className="flex items-center justify-center gap-3">
                  <span className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#00F5D4]" />
                  <span
                    className="text-lg font-bold text-[#FF2D78] drop-shadow-[0_0_8px_#FF2D78]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    &amp;
                  </span>
                  <span className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#00F5D4]" />
                </div>
                <h1
                  className="text-3xl font-extrabold uppercase tracking-widest text-[#F7F4EE] sm:text-4xl drop-shadow-[0_0_12px_rgba(0,245,212,0.6)]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  {data.couple.brideName}
                </h1>
              </div>

              {/* Lời đề tựa */}
              <p
                className="my-3 text-xs italic tracking-wider text-[#F5B841] max-w-xs leading-relaxed"
                style={{ fontFamily: BODY_FONT }}
              >
                &ldquo;Vào khoảnh khắc rực rỡ nhất của thanh xuân, ta đã tìm thấy nhau giữa ngàn ánh đèn neon.&rdquo;
              </p>

              {/* Ngày cưới định dạng Hong Kong Vintage */}
              <div
                className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-[#F5B841]/30 bg-[#12121A]/85 px-4 py-1.5 text-xs font-semibold tracking-widest text-[#F7F4EE]"
                style={{ fontFamily: MONO_FONT }}
              >
                <span className="text-[#FF2D78] font-bold">{dateParts.day}</span>
                <span className="text-[#00F5D4]">/</span>
                <span className="text-[#FF2D78] font-bold">{dateParts.month}</span>
                <span className="text-[#00F5D4]">/</span>
                <span className="text-[#F7F4EE] font-bold">{dateParts.year}</span>
                {targetEvent?.lunarDate && (
                  <>
                    <span className="mx-1 text-[#00F5D4]">·</span>
                    <span className="text-[10px] text-[#9E9AA7]">
                      {formatLunarDateClean(targetEvent.lunarDate)}
                    </span>
                  </>
                )}
              </div>

              {/* Nút bấm mở thiệp kiểu Play/Eject VHS */}
              <m.button
                type="button"
                onClick={handleOpenInvitation}
                disabled={isOpening}
                whileHover={{ scale: shouldReduceMotion ? 1 : 1.04 }}
                whileTap={{ scale: shouldReduceMotion ? 1 : 0.96 }}
                className="group relative flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#FF2D78] bg-gradient-to-r from-[#FF2D78] via-[#FF1E3C] to-[#FF2D78] px-7 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_20px_rgba(255,45,120,0.5)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,45,120,0.8)] focus:outline-hidden disabled:pointer-events-none"
                style={{ fontFamily: MONO_FONT }}
              >
                <Play className="h-4 w-4 fill-current text-white animate-pulse" />
                <span>PHÁT THƯỚC PHIM · OPEN TAPE</span>
                <span
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  aria-hidden="true"
                />
              </m.button>
            </div>

            {/* HIỆU ỨNG CHỚP SÁNG SCANLINES & VHS GLITCH KHI BẤM MỞ (0 - 450ms) */}
            {glitchFlash && (
              <div
                className="pointer-events-none absolute inset-0 z-40 bg-white/40 mix-blend-screen transition-opacity duration-300"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)",
                }}
                aria-hidden="true"
              />
            )}

            {/* HIỆU ỨNG MÀN ĐEN VHS LEADER (450ms - 1150ms) */}
            {vhsLeader && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0B0F] text-center p-6"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 text-xs tracking-widest text-[#00F5D4]" style={{ fontFamily: MONO_FONT }}>
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#00F5D4] animate-ping" />
                    <span>LOADING TAPE #1990</span>
                  </div>
                  <h2
                    className="text-2xl font-bold uppercase tracking-[0.3em] text-[#F7F4EE] drop-shadow-[0_0_10px_#FF2D78]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    OUR WEDDING
                  </h2>
                  <p className="text-xs text-[#F5B841] tracking-widest" style={{ fontFamily: MONO_FONT }}>
                    MONG KOK NIGHTS · SCENE 01
                  </p>
                </div>
              </m.div>
            )}
          </m.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          THÂN THIỆP CHÍNH (MAIN BODY)
          ========================================================= */}
      <div className="relative z-10 mx-auto w-full max-w-[500px] px-4 pb-16 pt-8 sm:px-6">

        {/* =========================================================
            PHẦN 1: HERO KHUNG PHIM 35MM & BIỂN HIỆU NEON
            ========================================================= */}
        <section className="mb-10 text-center">
          {/* Biển hiệu neon Song Hỷ rực rỡ */}
          <div className="mx-auto mb-4 flex justify-center">
            <img
              src="/templates/huong-cang-dem-neon/neon_sign_song_hy.webp"
              alt="Song Hỷ Neon"
              className="h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,45,120,0.6)]"
            />
          </div>

          <span
            className="inline-block rounded-full border border-[#00F5D4]/40 bg-[#12121A] px-3.5 py-1 text-[10px] font-bold tracking-[0.25em] text-[#00F5D4] uppercase shadow-xs"
            style={{ fontFamily: MONO_FONT }}
          >
            THIỆP BÁO HỶ
          </span>

          <h2
            className="mt-3 text-3xl font-extrabold uppercase tracking-wider text-[#F7F4EE] sm:text-4xl drop-shadow-[0_0_15px_rgba(255,45,120,0.5)]"
            style={{ fontFamily: TITLE_FONT }}
          >
            {data.couple.groomName} <span className="text-[#FF2D78]">&amp;</span> {data.couple.brideName}
          </h2>

          {/* Khung ảnh cưới lồng khung phim 35mm có light leak */}
          <div className="relative mx-auto mt-6 w-full max-w-sm">
            {/* Khung ảnh cưới 35mm chuẩn CSS/SVG không che mặt nhân vật */}
            <FilmFrame35mm
              src={data.photos?.heroUrl || "/templates/huong-cang-dem-neon/bg_street_mobile.webp"}
              alt={`Ảnh cưới ${data.couple.groomName} và ${data.couple.brideName}`}
              aspectRatio="16/10"
              stampSrc="/templates/huong-cang-dem-neon/sticker_pixel_heart.webp"
              stampAlt="Trái tim Pixel"
              stampPosition="bottom-right"
              stampClassName="w-10 sm:w-11 drop-shadow-[0_0_8px_#FF2D78]"
              filmBrand="KODAK VISION3 500T"
              frameCode="FRAME #24A"
              borderColor="border-[#FF2D78]/30"
              accentColor="text-[#00F5D4]"
              imgClassName="filter contrast-105 saturate-110"
            />

            {/* Subtitle vàng ấm kiểu phim Hong Kong 90s */}
            <div className="mt-3 px-4">
              <p
                className="text-xs sm:text-sm italic tracking-wide text-[#F5B841] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                style={{ fontFamily: BODY_FONT }}
              >
                &ldquo;{data.quote || "Vào lúc đẹp nhất của cuộc đời, anh đã gặp được em."}&rdquo;
              </p>
              <p
                className="mt-1 text-[10px] tracking-widest text-[#9E9AA7] uppercase"
                style={{ fontFamily: MONO_FONT }}
              >
                ISO 400 · 35MM · KODAK VISION3 500T
              </p>
            </div>
          </div>
        </section>

        {/* CONTAINER CHỨA CÁC PHẦN ĐƯỢC ĐIỀU KHIỂN BỞI SECTION ORDER */}
        <div className="flex flex-col gap-10">

          {/* =========================================================
              PHẦN 2: CAST CREDIT CARD (family)
              * Thông tin 2 nhân vật chính & Song thân Nhà Trai - Nhà Gái
              * Tách 2 dòng Bố và Mẹ, không dùng '&', không 'Thân sinh:'
              ========================================================= */}
          {!hidden.has("family") && (
            <section style={{ order: orderOf("family") }} className="space-y-4">
              <div className="text-center">
                <span
                  className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-[#00F5D4] uppercase"
                  style={{ fontFamily: MONO_FONT }}
                >
                  OPENING CREDITS · DANH CHIẾU DIỄN VIÊN
                </span>
                <h3
                  className="mt-1 text-2xl font-bold uppercase tracking-wider text-[#F7F4EE]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  HAI NHÂN VẬT CHÍNH &amp; GIA TIÊN
                </h3>
              </div>

              {/* Card 2 Nhân Vật Chính */}
              <div className="grid grid-cols-2 gap-3">
                {/* Chú rể */}
                <div className="relative overflow-hidden rounded-2xl border border-[#FF2D78]/30 bg-[#12121A] p-4 text-center shadow-lg">
                  <div className="mx-auto mb-2 aspect-square w-20 overflow-hidden rounded-full border-2 border-[#FF2D78] shadow-[0_0_10px_rgba(255,45,120,0.4)]">
                    <img
                      src={data.photos?.groomUrl || data.photos?.heroUrl || "/templates/huong-cang-dem-neon/bg_street_mobile.webp"}
                      alt={data.couple.groomName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-[#00F5D4] uppercase" style={{ fontFamily: MONO_FONT }}>
                    NAM CHÍNH / GROOM
                  </span>
                  <h4 className="mt-1 text-base font-bold text-[#F7F4EE]" style={{ fontFamily: TITLE_FONT }}>
                    {data.couple.groomName}
                  </h4>
                </div>

                {/* Cô dâu */}
                <div className="relative overflow-hidden rounded-2xl border border-[#00F5D4]/30 bg-[#12121A] p-4 text-center shadow-lg">
                  <div className="mx-auto mb-2 aspect-square w-20 overflow-hidden rounded-full border-2 border-[#00F5D4] shadow-[0_0_10px_rgba(0,245,212,0.4)]">
                    <img
                      src={data.photos?.brideUrl || data.photos?.heroUrl || "/templates/huong-cang-dem-neon/bg_street_mobile.webp"}
                      alt={data.couple.brideName}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-[#FF2D78] uppercase" style={{ fontFamily: MONO_FONT }}>
                    NỮ CHÍNH / BRIDE
                  </span>
                  <h4 className="mt-1 text-base font-bold text-[#F7F4EE]" style={{ fontFamily: TITLE_FONT }}>
                    {data.couple.brideName}
                  </h4>
                </div>
              </div>

              {/* Card Song Thân Nhà Trai & Nhà Gái */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Nhà trai */}
                <div className="rounded-2xl border border-[#FF2D78]/25 bg-[#12121A] p-4 shadow-md">
                  <span
                    className="block text-[10px] font-bold tracking-[0.2em] text-[#FF2D78] uppercase"
                    style={{ fontFamily: MONO_FONT }}
                  >
                    NHÀ TRAI
                  </span>
                  <div className="mt-2 space-y-1 text-xs text-[#F7F4EE]">
                    {groomFather && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-[#9E9AA7]">Ông:</span>
                        <span className="font-semibold">{groomFather}</span>
                      </p>
                    )}
                    {groomMother && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-[#9E9AA7]">Bà:</span>
                        <span className="font-semibold">{groomMother}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Nhà gái */}
                <div className="rounded-2xl border border-[#00F5D4]/25 bg-[#12121A] p-4 shadow-md">
                  <span
                    className="block text-[10px] font-bold tracking-[0.2em] text-[#00F5D4] uppercase"
                    style={{ fontFamily: MONO_FONT }}
                  >
                    NHÀ GÁI
                  </span>
                  <div className="mt-2 space-y-1 text-xs text-[#F7F4EE]">
                    {brideFather && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-[#9E9AA7]">Ông:</span>
                        <span className="font-semibold">{brideFather}</span>
                      </p>
                    )}
                    {brideMother && (
                      <p className="flex items-center gap-1.5">
                        <span className="text-[#9E9AA7]">Bà:</span>
                        <span className="font-semibold">{brideMother}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 3: LỊCH CÔNG CHIẾU & ĐẾM NGƯỢC RETRO LED (calendar)
              ========================================================= */}
          {!hidden.has("calendar") && (
            <section style={{ order: orderOf("calendar") }} className="space-y-4">
              <div className="text-center">
                <h3
                  className="text-2xl font-bold uppercase tracking-wider text-[#F7F4EE]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  LỊCH CÔNG CHIẾU &amp; CÁC LỄ TIỆC
                </h3>
              </div>

              {/* ĐỒNG HỒ ĐẾM NGƯỢC RETRO LED */}
              <div className="rounded-2xl border border-[#00F5D4]/30 bg-[#12121A] p-5 text-center shadow-lg">
                <span
                  className="text-[10px] font-bold tracking-[0.2em] text-[#00F5D4] uppercase"
                  style={{ fontFamily: MONO_FONT }}
                >
                  ĐẾM NGƯỢC NGÀY HỶ SỰ
                </span>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[
                    { label: "NGÀY", val: timeLeft.days },
                    { label: "GIỜ", val: timeLeft.hours },
                    { label: "PHÚT", val: timeLeft.minutes },
                    { label: "GIÂY", val: timeLeft.seconds },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#FF2D78]/25 bg-[#0B0B0F] py-2.5 px-1 shadow-inner"
                    >
                      <span
                        className="block text-2xl font-black text-[#FF2D78] drop-shadow-[0_0_8px_#FF2D78] sm:text-3xl"
                        style={{ fontFamily: MONO_FONT }}
                      >
                        {String(item.val).padStart(2, "0")}
                      </span>
                      <span
                        className="mt-1 block text-[9px] font-semibold tracking-wider text-[#9E9AA7]"
                        style={{ fontFamily: MONO_FONT }}
                      >
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* BẢNG LỊCH THÁNG VỚI CHẤM ĐỎ NEON */}
              <div className="rounded-2xl border border-[#FF2D78]/30 bg-[#12121A] p-5 shadow-lg">
                <div className="mb-4 flex items-center justify-between border-b border-[#FF2D78]/20 pb-3">
                  <span
                    className="text-xs font-bold tracking-widest text-[#00F5D4] uppercase"
                    style={{ fontFamily: MONO_FONT }}
                  >
                    THÁNG {dateParts.month} / {dateParts.year}
                  </span>
                  {targetEvent?.lunarDate && (
                    <span className="text-[10px] text-[#9E9AA7]">
                      Âm lịch: {formatLunarDateClean(targetEvent.lunarDate)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dow, idx) => (
                    <span
                      key={idx}
                      className="py-1 text-[10px] font-bold text-[#9E9AA7]"
                      style={{ fontFamily: MONO_FONT }}
                    >
                      {dow}
                    </span>
                  ))}
                  {calendarDays.map((dayNum, idx) => {
                    if (dayNum === null) {
                      return <div key={`empty-${idx}`} className="py-1.5" />;
                    }
                    const isWeddingDay = dayNum !== null && eventDays.has(dayNum);
                    return (
                      <div
                        key={`day-${dayNum}`}
                        className={cn(
                          "relative flex items-center justify-center rounded-lg py-1.5 text-xs font-medium transition-colors",
                          isWeddingDay
                            ? "bg-[#FF1E3C] font-bold text-white shadow-[0_0_12px_#FF1E3C]"
                            : "text-[#F7F4EE]/80 hover:bg-[#FF2D78]/10",
                        )}
                        style={{ fontFamily: MONO_FONT }}
                      >
                        {dayNum}
                        {isWeddingDay && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00F5D4] opacity-75" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00F5D4]" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DANH SÁCH SỰ KIỆN CƯỚI (EVENTS) */}
              <div
                className={cn(
                  "grid gap-3",
                  visibleEvents.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                )}
              >
                {visibleEvents.map((evt, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden rounded-2xl border border-[#FF2D78]/30 bg-[#12121A] p-5 shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span
                          className="inline-block rounded-md border border-[#00F5D4]/40 bg-[#0B0B0F] px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-[#00F5D4] uppercase"
                          style={{ fontFamily: MONO_FONT }}
                        >
                          SỰ KIỆN {idx + 1}
                        </span>
                        <h4
                          className="mt-2 text-lg font-bold text-[#F7F4EE]"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {evt.title}
                        </h4>
                      </div>
                      <div className="text-right">
                        <span
                          className="block text-sm font-bold text-[#F5B841]"
                          style={{ fontFamily: MONO_FONT }}
                        >
                          {formatWeddingDateParts(evt.startsAt).time || "18:00"}
                        </span>
                        <span className="text-[10px] text-[#9E9AA7]">
                          {formatWeddingDateParts(evt.startsAt).day}/{formatWeddingDateParts(evt.startsAt).month}/{formatWeddingDateParts(evt.startsAt).year}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 border-t border-[#FF2D78]/20 pt-3 text-xs text-[#9E9AA7] space-y-1">
                      {evt.venueName && (
                        <p className="flex items-center gap-1.5 font-semibold text-[#F7F4EE]">
                          <MapPin className="h-3.5 w-3.5 text-[#FF2D78]" />
                          {evt.venueName}
                        </p>
                      )}
                      {evt.venueAddress && (
                        <p className="pl-5 text-[11px] leading-relaxed">
                          {evt.venueAddress}
                        </p>
                      )}
                      {evt.lunarDate && (
                        <p className="pl-5 text-[10px] text-[#00F5D4]">
                          Âm lịch: {formatLunarDateClean(evt.lunarDate)}
                        </p>
                      )}
                    </div>

                    {evt.mapDirectionsUrl && (
                      <div className="mt-4">
                        <a
                          href={evt.mapDirectionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#00F5D4]/50 bg-[#00F5D4]/10 px-3.5 py-1.5 text-xs font-bold text-[#00F5D4] transition-colors hover:bg-[#00F5D4]/20"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>CHỈ ĐƯỜNG GOOGLE MAPS</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 4: BẢN ĐỒ PHỐ ĐÊM MINI & TAXI ĐỎ (map)
              ========================================================= */}
          {!hidden.has("map") && (
            <section style={{ order: orderOf("map") }} className="space-y-4">
              <div className="text-center">
                <span
                  className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-[#00F5D4] uppercase"
                  style={{ fontFamily: MONO_FONT }}
                >
                  STREET MAP · BẢN ĐỒ PHỐ ĐÊM
                </span>
                <h3
                  className="mt-1 text-2xl font-bold uppercase tracking-wider text-[#F7F4EE]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  CHỈ DẪN ĐƯỜNG ĐẾN ĐÊM TIỆC
                </h3>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-[#FF2D78]/30 bg-[#12121A] p-4 shadow-xl">
                {/* Tấm bản đồ mini phố cổ Hong Kong */}
                <div className="relative mx-auto aspect-[4/3] w-full overflow-hidden rounded-xl bg-[#0B0B0F]">
                  <img
                    src="/templates/huong-cang-dem-neon/hk_mini_map.webp"
                    alt="Bản đồ chỉ dẫn đêm tiệc"
                    className="h-full w-full object-contain"
                  />

                  {/* Chiếc taxi đỏ trượt vào mép bản đồ */}
                  <m.div
                    initial={{ x: 50, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute -bottom-2 -left-2 z-10 w-36 sm:w-44"
                  >
                    <img
                      src="/templates/huong-cang-dem-neon/hk_red_taxi.webp"
                      alt="Taxi đỏ Hong Kong"
                      className="h-auto w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
                    />
                  </m.div>
                </div>

                {/* Thông tin địa điểm & Nút dẫn đường cho từng lễ */}
                <div
                  className={cn(
                    "mt-4 grid gap-3",
                    visibleEvents.length > 1 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
                  )}
                >
                  {visibleEvents.map((evt, idx) => {
                    const directionsUrl = getEventDirectionsUrl(evt);
                    const evtDate = evt.startsAt ? formatWeddingDateParts(evt.startsAt) : null;
                    return (
                      <div
                        key={evt.id || idx}
                        className="rounded-xl border border-[#FF2D78]/25 bg-[#0B0B0F]/80 p-3.5 text-center sm:text-left flex flex-col justify-between"
                      >
                        <div className="space-y-1">
                          <span
                            className="inline-block rounded-md bg-[#FF2D78]/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#FF2D78]"
                            style={{ fontFamily: MONO_FONT }}
                          >
                            {evt.title || "Tiệc Cưới"}
                          </span>
                          {evt.startsAt && (
                            <p className="text-xs font-semibold text-[#00F5D4]">
                              {evtDate?.time ? `${evtDate.time} - ` : ""}{evtDate?.day}/{evtDate?.month}/{evtDate?.year}
                            </p>
                          )}
                          <p className="text-xs font-bold text-[#F7F4EE]">
                            {evt.venueName || "TRUNG TÂM TIỆC CƯỚI"}
                          </p>
                          <p className="text-[11px] text-[#9E9AA7]">
                            {evt.venueAddress || "Địa chỉ tiệc cưới"}
                          </p>
                        </div>
                        {directionsUrl && (
                          <div className="mt-3 pt-2 border-t border-white/5">
                            <a
                              href={directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#FF1E3C] bg-gradient-to-r from-[#FF1E3C] to-[#FF2D78] px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_0_10px_rgba(255,30,60,0.4)] transition-all hover:scale-102 active:scale-98"
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              <span>CHỈ ĐƯỜNG: {evt.title || "BẢN ĐỒ"}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 5: STREET DRESS CODE (dresscode)
              * Chỉ hiển thị các ô màu, không render rác text
              ========================================================= */}
          {!hidden.has("dresscode") && dressColors.length > 0 && (
            <section style={{ order: orderOf("dresscode") }} className="space-y-4">
              <div className="text-center">
                <span
                  className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-[#F5B841] uppercase"
                  style={{ fontFamily: MONO_FONT }}
                >
                  STREET PALETTE · TRANG PHỤC GỢI Ý
                </span>
                <h3
                  className="mt-1 text-2xl font-bold uppercase tracking-wider text-[#F7F4EE]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  BẢNG MÀU ĐÊM HỶ SỰ
                </h3>
              </div>

              <div className="rounded-2xl border border-[#00F5D4]/30 bg-[#12121A] p-5 shadow-lg">
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                  {dressColors.map((color, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className="h-12 w-12 rounded-full border-2 border-white/40 shadow-md transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          boxShadow: `0 0 12px ${color}80`,
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 6: CUỘN PHIM 35MM (ALBUM ẢNH CƯỚI) (album)
              * Contact sheet 35mm, Lightbox portal
              ========================================================= */}
          {!hidden.has("album") && galleryPhotos.length > 0 && (
            <section style={{ order: orderOf("album") }} className="space-y-4">
              <div className="text-center">
                <h3
                  className="text-2xl font-bold uppercase tracking-wider text-[#F7F4EE]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  THƯỚC PHIM
                </h3>
              </div>

              {/* Lưới ảnh phong cách Film Contact Sheet 35mm */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryPhotos.map((photo, idx) => {
                  const photoSrc = typeof photo === "string" ? photo : photo.url;
                  const photoAlt = (typeof photo === "object" && photo.alt) || `Ảnh cưới ${idx + 1}`;
                  return (
                    <button
                      key={(typeof photo === "object" && photo.id) || idx}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-[#FF2D78]/30 bg-[#0B0B0F] p-1 shadow-md transition-all duration-300 hover:scale-[1.03] hover:border-[#00F5D4] focus:outline-hidden"
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-lg">
                        <img
                          src={photoSrc}
                          alt={photoAlt}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100 flex items-end p-2">
                          <span className="text-[9px] font-bold tracking-widest text-[#00F5D4]" style={{ fontFamily: MONO_FONT }}>
                            EXP #{String(idx + 1).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* GUEST ALBUM QR (Tải ảnh chụp của khách mời) */}
          {!hidden.has("albumQr") && weddingSlug && (
            <section style={{ order: orderOf("albumQr") }}>
              <div className="overflow-hidden rounded-2xl border border-[#00F5D4]/30 bg-[#12121A] p-5 shadow-lg text-center">
                <GuestAlbumQr slug={weddingSlug} />
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 7: HỘP QUÀ VHS COLLECTOR 3 TRẠNG THÁI (gift)
              * vhs_box_normal -> vhs_box_glow -> vhs_box_open
              ========================================================= */}
          {!hidden.has("gift") && (
            <section style={{ order: orderOf("gift") }} className="space-y-4">
              <div className="text-center">
                <h3
                  className="text-2xl font-bold uppercase tracking-wider text-[#F7F4EE]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  HỘP QUÀ
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#9E9AA7] max-w-sm mx-auto">
                  Sự hiện diện của Quý khách là niềm vinh dự lớn nhất. Nếu ở xa không tiện ghé mừng, Quý khách có thể chạm mở hộp băng VHS để gửi phong bao chúc phúc.
                </p>
              </div>

              {/* Hộp quà VHS 3 trạng thái */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#FF2D78]/30 bg-[#12121A] p-6 shadow-xl text-center">
                <button
                  type="button"
                  onClick={handleGiftClick}
                  disabled={isBoxOpening}
                  className="group relative flex cursor-pointer items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 disabled:pointer-events-none"
                  aria-label="Mở hộp quà mừng cưới VHS"
                >
                  {/* Hào quang neon phía sau hộp quà */}
                  <div
                    className="pointer-events-none absolute inset-0 -m-4 rounded-3xl bg-gradient-to-r from-[#FF2D78]/20 via-[#00F5D4]/30 to-[#FF1E3C]/20 blur-xl transition-opacity duration-300"
                    style={{
                      opacity: boxStage === "open" || boxStage === "glow" ? 0.9 : 0.3,
                    }}
                    aria-hidden="true"
                  />

                  {/* Ảnh chiếc hộp quà 3 trạng thái căn đáy thẳng hàng tuyệt đối */}
                  <div className="relative z-10 h-48 w-48 sm:h-52 sm:w-52">
                    <img
                      src={
                        boxStage === "open"
                          ? "/templates/huong-cang-dem-neon/vhs_box_open.webp"
                          : boxStage === "glow"
                            ? "/templates/huong-cang-dem-neon/vhs_box_glow.webp"
                            : "/templates/huong-cang-dem-neon/vhs_box_normal.webp"
                      }
                      alt="Hộp quà VHS mừng cưới Hương Cảng"
                      className="mx-auto block h-full w-full object-contain"
                    />
                  </div>
                </button>

                <p
                  className="mt-3 text-[11px] font-bold tracking-[0.2em] text-[#00F5D4] uppercase"
                  style={{ fontFamily: MONO_FONT }}
                >
                  {boxStage === "open" ? "HỘP QUÀ ĐÃ MỞ" : "CHẠM ĐỂ MỞ HỘP QUÀ"}
                </p>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 8: ĐẶT CHỖ & GỬI LỜI CHÚC (rsvp)
              * Đồng bộ theme Dark Neon
              ========================================================= */}
          {!hidden.has("rsvp") && (
            <section style={{ order: orderOf("rsvp") }} className="space-y-4">
              <div className="text-center">
                <h3
                  className="text-2xl font-bold uppercase tracking-wider text-[#F7F4EE]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  XÁC NHẬN THAM DỰ
                </h3>
              </div>

              {/* Form RSVP bọc trong card Dark Neon */}
              <div
                className="overflow-hidden rounded-2xl border border-[#FF2D78]/30 bg-[#12121A] p-5 sm:p-6 shadow-xl"
                style={{ colorScheme: "dark" }}
              >
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="ruby"
                  customTheme={{
                    isDark: true,
                    wrap: "bg-transparent text-[#F7F4EE]",
                    heading: "text-[#FF2D78]",
                    card: "bg-[#12121A] border border-[#FF2D78]/30 text-[#F7F4EE] shadow-lg",
                    input: "bg-[#0B0B0F] border border-[#00F5D4]/40 text-[#F7F4EE] focus:border-[#FF2D78]",
                    primaryBtn: "bg-gradient-to-r from-[#FF2D78] to-[#FF1E3C] text-white hover:brightness-110 font-bold shadow-md shadow-[#FF2D78]/30",
                    outlineBtn: "border border-[#00F5D4]/40 text-[#00F5D4] hover:bg-[#00F5D4]/10",
                    optionBg: "#0B0B0F",
                    optionColor: "#F7F4EE",
                  }}
                  contained={contained}
                  inviteSlug={inviteSlug}
                  weddingSlug={weddingSlug}
                  invitationMode={invitationMode}
                  guestName={guestName}
                  initialStatus={initialStatus}
                  initialPlusOnes={initialPlusOnes}
                  initialDiet={initialDiet}
                  initialSongRequest={initialSongRequest}
                  initialRideNeeded={initialRideNeeded}
                />
              </div>
            </section>
          )}

        </div>

        {/* =========================================================
            PHẦN 9: FOOTER (ĐẶT NGOÀI CONTAINER FLEX CÓ ORDER)
            * Lời kết bộ phim, không lặp ngày cưới
            ========================================================= */}
        <footer className="mt-16 border-t border-[#FF2D78]/30 bg-[#0B0B0F] py-10 text-center text-xs text-[#9E9AA7]">
          <div className="mx-auto max-w-sm px-4 space-y-2">
            <p
              className="text-sm font-bold uppercase tracking-widest text-[#FF2D78]"
              style={{ fontFamily: TITLE_FONT }}
            >
              THE END · HẸN GẶP LẠI TẠI THƯỚC PHIM HẠNH PHÚC
            </p>
            <p
              className="text-[11px] tracking-[0.2em] text-[#00F5D4] uppercase font-mono"
            >
              A FILM BY LOVE · 35MM CINEMA
            </p>
            <p className="text-[10px] text-[#9E9AA7]/80 pt-2">
              © {dateParts.year} {data.couple.groomName} &amp; {data.couple.brideName}. ALL RIGHTS RESERVED.
            </p>
          </div>
        </footer>
      </div>

      {/* ---------------- MODAL QUÀ MỪNG (createPortal) ---------------- */}
      <GiftModal
        open={isGiftModalOpen}
        onClose={handleCloseGiftModal}
        gift={data.gift}
        plan={data.plan || "free"}
        tone="obsidian"
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName}
      />

      {/* ---------------- LIGHTBOX ẢNH 35MM (createPortal) ---------------- */}
      {lightboxIndex !== null && (
        <TemplateLightboxModal
          photos={galleryPhotos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      )}
    </div>
  );
}

export default HuongCangDemNeonTemplate;
