"use client";

import * as React from "react";
import {
  MapPin,
  ExternalLink,
  Film,
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
   BẢNG MÀU CHÍNH THỨC: HÀO QUANG HƯƠNG CẢNG (hao-quang-huong-cang)
   - Đỏ đô (nền poster, thẻ chủ đạo, lễ tiệc): #520914 / #6E0F1D
   - Đen (nền sâu, khung 35mm, chiều sâu tương phản): #0A090B / #131114
   - Vàng kim (viền Art Deco, tiêu đề, nút nhấn): #D8B15B (sáng #F1D693)
   - Kem ngà (chữ chính & thẻ lịch sáng lịch lãm): #F4ECE0
   - Xanh neon (điểm nhấn điện ảnh tiết chế): #00D8B4
   ============================================================ */

const COLOR_BURGUNDY = "#520914";
const COLOR_BURGUNDY_DARK = "#6E0F1D";
const COLOR_OBSIDIAN = "#0A090B";
const COLOR_CARD_DARK = "#131114";
const COLOR_GOLD = "#D8B15B";
const COLOR_GOLD_BRIGHT = "#F1D693";
const COLOR_IVORY = "#F4ECE0";
const COLOR_NEON_CYAN = "#00D8B4";
const COLOR_NEON_RED = "#FF1E3C";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const MONO_FONT = "var(--font-be-vietnam), ui-monospace, SFMono-Regular, monospace";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const DEFAULT_DRESS = ["#520914", "#0A090B", "#D8B15B"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function parseParents(names?: string | null): [string, string | null] {
  if (!names) return ["", null];
  const parts = names.split(/\s*&\s*/);
  return [parts[0]?.trim() || "", parts[1]?.trim() || null];
}

export function HaoQuangHuongCangTemplate({
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
  const [neonFlash, setNeonFlash] = React.useState(false);
  const [shutterCut, setShutterCut] = React.useState(false);
  const [coverGone, setCoverGone] = React.useState(Boolean(parentIsOpened));
  const parentOpenedRef = React.useRef(parentIsOpened);

  React.useEffect(() => {
    if (parentIsOpened && !coverGone && !isOpening) {
      setCoverGone(true);
    } else if (parentIsOpened === false && parentOpenedRef.current === true) {
      setCoverGone(false);
      setIsOpening(false);
      setNeonFlash(false);
      setShutterCut(false);
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

    // Giai đoạn A: Bật sáng đèn neon + chớp scanlines (0 - 450ms)
    setNeonFlash(true);

    // Giai đoạn B: Shutter cut chuyển cảnh trailer 90s (450ms - 900ms)
    setTimeout(() => {
      setShutterCut(true);
    }, 450);

    // Hoàn tất mở vào thân thiệp (900ms)
    setTimeout(() => {
      setCoverGone(true);
      setIsOpening(false);
      setNeonFlash(false);
      setShutterCut(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 900);
  };

  // -------------------------------------------------------------
  // TƯƠNG TÁC HỘP QUÀ ART DECO 3 TRẠNG THÁI (hook)
  // -------------------------------------------------------------
  const {
    stage: boxStage,
    isOpening: isBoxOpening,
    isModalOpen: isGiftModalOpen,
    handleGiftClick,
    handleCloseModal: handleCloseGiftModal,
  } = useGiftBoxInteraction({
    sfxType: "box",
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
        "relative mx-auto w-full max-w-[500px] overflow-x-hidden text-[#F4ECE0] selection:bg-[#D8B15B]/30 selection:text-[#F1D693]",
        contained ? "h-full" : "min-h-screen",
        !coverGone && (contained ? "overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden"),
      )}
      style={{
        backgroundColor: COLOR_OBSIDIAN,
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
        src="/templates/hao-quang-huong-cang/deco_box_open.webp"
        className="hidden"
        aria-hidden="true"
        alt=""
      />

      {/* =========================================================
          BÌA POSTER TỐI GIẢN & HIỆU ỨNG MỞ ĐÈN NEON + TRAILER CŨ (COVER)
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
            style={{ backgroundColor: COLOR_OBSIDIAN }}
          >
            {/* z-0: Nền Poster Mobile / Desktop */}
            <div className="absolute inset-0 z-0">
              <picture className="h-full w-full">
                <source
                  media="(min-width: 640px)"
                  srcSet="/templates/hao-quang-huong-cang/bg_poster_desktop.webp"
                />
                <img
                  src="/templates/hao-quang-huong-cang/bg_poster_mobile.webp"
                  alt="Hào Quang Hương Cảng Poster Background"
                  className="h-full w-full object-cover object-center"
                />
              </picture>
            </div>

            {/* z-[5]: Lớp hạt film grain siêu nhẹ + vầng sáng neon đáy */}
            <div
              className="pointer-events-none absolute inset-0 z-[5] bg-gradient-to-t from-[#FF1E3C]/20 via-transparent to-transparent opacity-80"
              aria-hidden="true"
            />

            {/* Hiệu ứng nhấp nháy đèn Neon & Nhiễu VHS khi mở thiệp (Bước A: 0 - 450ms) */}
            {neonFlash && !shouldReduceMotion && (
              <div
                className="pointer-events-none absolute inset-0 z-30 animate-pulse bg-gradient-to-r from-[#FF1E3C]/30 via-[#00D8B4]/25 to-[#FF1E3C]/30 mix-blend-screen"
                style={{
                  boxShadow: "inset 0 0 100px rgba(255, 30, 60, 0.4)",
                }}
                aria-hidden="true"
              />
            )}

            {/* Hiệu ứng Chuyển cảnh Shutter Cut / Trailer Phim Cũ (Bước B: 450 - 900ms) */}
            {shutterCut && !shouldReduceMotion && (
              <m.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-none absolute inset-0 z-40 bg-[#0A090B]"
                aria-hidden="true"
              />
            )}

            {/* Container Khung Poster căn giữa hoàn hảo */}
            <div className="relative z-10 flex h-full w-full max-w-[328px] sm:max-w-[388px] flex-col items-center justify-center p-3 text-center">

              {/* z-10: Khung viền vàng Art Deco ôm trọn tấm poster */}
              <div className="pointer-events-none absolute inset-1 sm:inset-2 z-10">
                <img
                  src="/templates/hao-quang-huong-cang/deco_poster_border.webp"
                  alt="Khung viền vàng Art Deco"
                  className="h-full w-full object-contain"
                />
              </div>

              {/* z-20: Nội dung Poster nằm gọn gàng bên trong khung viền vàng */}
              <div
                className={cn(
                  "relative z-20 flex w-full flex-col items-center justify-between py-6 px-4 sm:py-8 sm:px-6 transition-all duration-300",
                  neonFlash && "brightness-125 contrast-125",
                )}
                style={{ maxHeight: "88%" }}
              >
                {/* Đỉnh khung: Biểu tượng Song Hỷ mạ vàng + Nhãn retro */}
                <div className="flex flex-col items-center space-y-1">
                  <div className="relative h-12 w-12 sm:h-14 sm:w-14 transition-transform duration-300 hover:scale-105">
                    <img
                      src="/templates/hao-quang-huong-cang/emblem_song_hy_gold.webp"
                      alt="Chữ Hán Song Hỷ Vàng Kim"
                      className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(216,177,91,0.5)]"
                    />
                  </div>
                  <p
                    className="text-[9px] sm:text-[10px] font-bold tracking-[0.25em] text-[#D8B15B] uppercase"
                    style={{ fontFamily: MONO_FONT }}
                  >
                    HỒNG KÔNG RETRO · 1990S
                  </p>
                  <p className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] text-[#F4ECE0]/90 uppercase">
                    TRÂN TRỌNG KÍNH MỜI
                  </p>
                </div>

                {/* Trung tâm: Tên cô dâu chú rể 3 dòng cỡ lớn (Điểm nhấn lớn nhất) */}
                <div className="my-auto w-full py-3 space-y-1 sm:space-y-2">
                  <h1
                    className="text-3xl sm:text-4xl font-extrabold uppercase leading-tight tracking-wider text-[#F4ECE0] break-words drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {data.couple.groomName}
                  </h1>
                  <p
                    className="text-xl sm:text-2xl font-light italic text-[#D8B15B]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    &amp;
                  </p>
                  <h1
                    className="text-3xl sm:text-4xl font-extrabold uppercase leading-tight tracking-wider text-[#F4ECE0] break-words drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {data.couple.brideName}
                  </h1>
                </div>

                {/* Phần dưới: Dải mây Art Deco, Ngày cưới vàng kim, Dấu triện đỏ & Nút Mở Thiệp */}
                <div className="flex w-full flex-col items-center space-y-3">
                  {/* Dải phân cách mây Art Deco */}
                  <div className="w-36 sm:w-44 opacity-85">
                    <img
                      src="/templates/hao-quang-huong-cang/divider_cloud_deco.webp"
                      alt="Dải mây Art Deco"
                      className="h-auto w-full object-contain"
                    />
                  </div>

                  {/* Ngày cưới màu vàng kim (Lần 1) */}
                  <div className="flex items-center justify-center gap-2">
                    <p
                      className="text-sm sm:text-base font-bold tracking-[0.18em] text-[#D8B15B]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {dateParts.day} · {dateParts.month} · {dateParts.year}
                    </p>
                    {/* Dấu triện đỏ góc tinh tế */}
                    <div className="relative h-7 w-7 sm:h-8 sm:w-8">
                      <img
                        src="/templates/hao-quang-huong-cang/stamp_red_chop.webp"
                        alt="Dấu Triện Đỏ"
                        className="h-full w-full object-contain drop-shadow-[0_2px_6px_rgba(255,30,60,0.4)]"
                      />
                    </div>
                  </div>

                  {/* Lời mời đích danh nếu có */}
                  {guestName && (
                    <p className="rounded-full bg-[#131114]/80 px-3 py-1 text-[11px] font-medium tracking-wide text-[#F4ECE0]/85 border border-[#D8B15B]/30">
                      Kính gửi: <span className="font-bold text-[#F1D693]">{guestName}</span>
                    </p>
                  )}

                  {/* Nút MỞ THIỆP */}
                  <button
                    type="button"
                    onClick={handleOpenInvitation}
                    disabled={isOpening}
                    className="group relative cursor-pointer overflow-hidden rounded-full border border-[#F1D693] bg-[#D8B15B] px-8 py-2.5 sm:px-10 sm:py-3 text-xs sm:text-sm font-extrabold tracking-[0.25em] text-[#0A090B] uppercase shadow-[0_4px_20px_rgba(216,177,91,0.45)] transition-all duration-300 hover:scale-105 hover:bg-[#F1D693] active:scale-95 disabled:pointer-events-none"
                    style={{ fontFamily: MONO_FONT }}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      BẬT ĐÈN MỞ THIỆP
                    </span>
                    {/* Ánh sáng neon lướt qua nút */}
                    <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  </button>
                </div>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          THÂN THIỆP ĐỒ HỌA ART DECO & KHUNG FILM 35MM
          ========================================================= */}
      <div className={cn("relative z-10 w-full transition-opacity duration-500", !coverGone && "hidden")}>

        {/* Nền toàn trang có vệt sáng đỏ rượu vang Art Deco */}
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#520914]/25 via-transparent to-[#520914]/30"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col gap-10 px-4 py-8 sm:px-6">

          {/* =========================================================
              PHẦN 1: HERO KHUNG FILM 35MM TRẦM ẤM + CREDIT PHIM (hero)
              ========================================================= */}
          <section className="space-y-5 text-center">

            {/* Huy hiệu đỉnh Hero */}
            <div className="flex flex-col items-center space-y-1">
              <span
                className="text-[10px] sm:text-[11px] font-bold tracking-[0.25em] text-[#D8B15B] uppercase"
                style={{ fontFamily: MONO_FONT }}
              >
                THIỆP BÁO HỶ
              </span>
              <div className="w-28 opacity-80">
                <img
                  src="/templates/hao-quang-huong-cang/divider_cloud_deco.webp"
                  alt="Dải mây"
                  className="h-auto w-full object-contain"
                />
              </div>
            </div>

            {/* Khung Film 35mm chuẩn CSS/SVG không che mặt nhân vật */}
            <FilmFrame35mm
              src={data.photos?.heroUrl || "/photos/hero2.webp"}
              alt={`Ảnh cưới ${data.couple.groomName} và ${data.couple.brideName}`}
              aspectRatio="4/5"
              stampSrc="/templates/hao-quang-huong-cang/stamp_red_chop.webp"
              stampAlt="Dấu Triện Đỏ"
              stampPosition="bottom-right"
              stampClassName="w-11 sm:w-12 drop-shadow-[0_2px_8px_rgba(255,30,60,0.5)]"
              filmBrand="KODAK VISION3 500T"
              frameCode="FRAME #24A"
              borderColor="border-[#D8B15B]/40"
              accentColor="text-[#D8B15B]"
              imgClassName="contrast-[1.06] saturate-[0.92] sepia-[0.08]"
            />

            {/* Khối Credit Phim Hồng Kông 90s */}
            <div className="mx-auto max-w-sm space-y-2 pt-2">
              <p
                className="text-[10px] font-extrabold tracking-[0.28em] text-[#D8B15B] uppercase"
                style={{ fontFamily: MONO_FONT }}
              >
                STARRING
              </p>

              {/* Tên cặp đôi 3 dòng */}
              <h2
                className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wider text-[#F4ECE0]"
                style={{ fontFamily: TITLE_FONT }}
              >
                {data.couple.groomName}
              </h2>
              <p className="text-lg italic text-[#D8B15B]" style={{ fontFamily: TITLE_FONT }}>
                &amp;
              </p>
              <h2
                className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wider text-[#F4ECE0]"
                style={{ fontFamily: TITLE_FONT }}
              >
                {data.couple.brideName}
              </h2>

              <p
                className="pt-1 text-[9px] sm:text-[10px] tracking-[0.22em] text-[#D8B15B]/80 uppercase"
                style={{ fontFamily: MONO_FONT }}
              >
                A CINEMATIC WEDDING STORY · 35MM
              </p>

              {/* Lời ngỏ yêu thương */}
              {data.quote && (
                <p className="pt-3 text-xs leading-relaxed text-[#F4ECE0]/80 italic font-serif px-4">
                  “{data.quote}”
                </p>
              )}
            </div>
          </section>

          {/* =========================================================
              PHẦN 2: HAI BÊN GIA ĐÌNH & CHÂN DUNG (family, couple: true)
              ========================================================= */}
          {!hidden.has("family") && (
            <section style={{ order: orderOf("family") }} className="space-y-4">
              <div className="text-center">
                <span
                  className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#D8B15B] uppercase"
                  style={{ fontFamily: MONO_FONT }}
                >
                  EDITORIAL · HỒ SƠ NHÂN VẬT
                </span>
                <h3
                  className="mt-1 text-2xl font-bold uppercase tracking-wider text-[#F4ECE0]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  HAI BÊN GIA ĐÌNH
                </h3>
              </div>

              {/* Thẻ Gia Đình 2 Cột với biểu tượng bài Tây & mạt chược ở giữa */}
              <div className="relative rounded-2xl border border-[#D8B15B]/40 bg-[#131114] p-5 shadow-xl">

                {/* Biểu tượng Bài Tây & Mạt Chược Art Deco trung tâm */}
                <div className="mx-auto mb-4 flex justify-center">
                  <div className="relative h-14 w-14">
                    <img
                      src="/templates/hao-quang-huong-cang/emblem_card_mahjong.webp"
                      alt="Quân Bài Tây và Mạt Chược"
                      className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(216,177,91,0.4)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Cột Nhà Trai */}
                  <div className="flex flex-col items-center space-y-3 rounded-xl border border-[#D8B15B]/20 bg-[#0A090B]/60 p-4 text-center">
                    {data.photos?.groomUrl && (
                      <div className="relative aspect-[3/4] w-28 overflow-hidden rounded-lg border border-[#D8B15B]/40 shadow-md">
                        <img
                          src={data.photos.groomUrl}
                          alt="Ảnh Chú Rể"
                          className="h-full w-full object-cover contrast-[1.05]"
                        />
                      </div>
                    )}
                    <span
                      className="text-[10px] font-bold tracking-[0.2em] text-[#D8B15B] uppercase"
                      style={{ fontFamily: MONO_FONT }}
                    >
                      {data.couple.groomTitle || "TRƯỞNG NAM"}
                    </span>
                    <h4
                      className="text-lg font-bold uppercase tracking-wide text-[#F4ECE0]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {data.couple.groomName}
                    </h4>

                    {/* Song thân Nhà Trai tách 2 dòng không có & */}
                    <div className="pt-2 text-xs leading-relaxed text-[#F4ECE0]/85 border-t border-[#D8B15B]/15 w-full">
                      <p className="font-semibold text-[#D8B15B]/90 tracking-wider text-[11px] uppercase mb-1">
                        NHÀ TRAI
                      </p>
                      {groomFather && <p>{groomFather}</p>}
                      {groomMother && <p>{groomMother}</p>}
                    </div>
                  </div>

                  {/* Cột Nhà Gái */}
                  <div className="flex flex-col items-center space-y-3 rounded-xl border border-[#D8B15B]/20 bg-[#0A090B]/60 p-4 text-center">
                    {data.photos?.brideUrl && (
                      <div className="relative aspect-[3/4] w-28 overflow-hidden rounded-lg border border-[#D8B15B]/40 shadow-md">
                        <img
                          src={data.photos.brideUrl}
                          alt="Ảnh Cô Dâu"
                          className="h-full w-full object-cover contrast-[1.05]"
                        />
                      </div>
                    )}
                    <span
                      className="text-[10px] font-bold tracking-[0.2em] text-[#D8B15B] uppercase"
                      style={{ fontFamily: MONO_FONT }}
                    >
                      {data.couple.brideTitle || "ÁI NỮ"}
                    </span>
                    <h4
                      className="text-lg font-bold uppercase tracking-wide text-[#F4ECE0]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {data.couple.brideName}
                    </h4>

                    {/* Song thân Nhà Gái tách 2 dòng không có & */}
                    <div className="pt-2 text-xs leading-relaxed text-[#F4ECE0]/85 border-t border-[#D8B15B]/15 w-full">
                      <p className="font-semibold text-[#D8B15B]/90 tracking-wider text-[11px] uppercase mb-1">
                        NHÀ GÁI
                      </p>
                      {brideFather && <p>{brideFather}</p>}
                      {brideMother && <p>{brideMother}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 3: LỊCH CƯỚI, ĐẾM NGƯỢC & ĐỊA ĐIỂM (calendar, map)
              ========================================================= */}
          {(!hidden.has("calendar") || !hidden.has("map")) && (
            <section style={{ order: orderOf("calendar") }} className="space-y-6">

              <div className="text-center">
                <h3
                  className="text-2xl font-bold uppercase tracking-wider text-[#F4ECE0]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  LỊCH CÔNG CHIẾU &amp; TIỆC CƯỚI
                </h3>
              </div>

              {/* Thẻ Sự Kiện nền đỏ đô Art Deco */}
              <div
                className={cn(
                  "grid gap-4",
                  visibleEvents.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                )}
              >
                {visibleEvents.map((evt, idx) => {
                  const evtDate = formatWeddingDateParts(evt.startsAt);
                  const directionsUrl = getEventDirectionsUrl(evt);
                  return (
                    <div
                      key={evt.id || idx}
                      className="relative overflow-hidden rounded-2xl border border-[#D8B15B]/40 bg-[#520914]/90 p-5 shadow-2xl text-center space-y-4"
                    >
                      {/* Dải mây trang trí đỉnh thẻ */}
                      <div className="mx-auto w-32 opacity-70">
                        <img
                          src="/templates/hao-quang-huong-cang/divider_cloud_deco.webp"
                          alt=""
                          className="h-auto w-full object-contain"
                        />
                      </div>

                      <div>
                        <span
                          className="inline-block rounded-full bg-[#0A090B]/60 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-[#D8B15B] uppercase border border-[#D8B15B]/30"
                          style={{ fontFamily: MONO_FONT }}
                        >
                          {evt.title || "LỄ THÀNH HÔN"}
                        </span>
                      </div>

                      {/* Ngày tháng năm to đẹp */}
                      <div className="space-y-1">
                        <p
                          className="text-4xl sm:text-5xl font-extrabold tracking-wider text-[#F1D693]"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {evtDate.day}
                        </p>
                        <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#F4ECE0] uppercase">
                          THÁNG {evtDate.month} · NĂM {evtDate.year}
                        </p>
                        <p className="text-xs text-[#D8B15B]/90 font-medium">
                          {evtDate.weekday} · {evtDate.time}
                        </p>
                      </div>

                      {/* Địa điểm & Sảnh tiệc */}
                      <div className="space-y-1.5 pt-2 border-t border-[#D8B15B]/25">
                        <p className="text-sm font-bold uppercase tracking-wide text-[#F4ECE0]">
                          {evt.venueName}
                        </p>
                        <p className="text-xs text-[#F4ECE0]/80 leading-relaxed max-w-xs mx-auto">
                          {evt.venueAddress}
                        </p>
                        {/* Ngày âm lịch không lặp chữ ngày */}
                        <p className="text-[11px] text-[#D8B15B]/85 italic">
                          ({formatLunarDateClean(evt.startsAt)})
                        </p>
                      </div>

                      {/* Nút Chỉ đường trên Google Maps */}
                      {!hidden.has("map") && directionsUrl && (
                        <div className="pt-2">
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-[#D8B15B] bg-[#0A090B] px-5 py-2 text-xs font-bold tracking-wider text-[#D8B15B] transition-colors hover:bg-[#D8B15B] hover:text-[#0A090B]"
                            style={{ fontFamily: MONO_FONT }}
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            CHỈ ĐƯỜNG TRÊN GOOGLE MAPS
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bảng Đếm Ngược 4 Ô tối giản */}
              <div className="rounded-2xl border border-[#D8B15B]/30 bg-[#131114] p-4 text-center">
                <p
                  className="mb-3 text-[10px] font-bold tracking-[0.25em] text-[#D8B15B] uppercase"
                  style={{ fontFamily: MONO_FONT }}
                >
                  COUNTDOWN · THỜI GIAN ĐẾM NGƯỢC
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "NGÀY", val: timeLeft.days },
                    { label: "GIỜ", val: timeLeft.hours },
                    { label: "PHÚT", val: timeLeft.minutes },
                    { label: "GIÂY", val: timeLeft.seconds },
                  ].map((unit, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-[#D8B15B]/25 bg-[#0A090B] p-2.5 shadow-inner"
                    >
                      <div
                        className="text-xl sm:text-2xl font-black text-[#F1D693]"
                        style={{ fontFamily: TITLE_FONT }}
                      >
                        {String(unit.val).padStart(2, "0")}
                      </div>
                      <div
                        className="text-[9px] font-bold tracking-widest text-[#D8B15B]/70"
                        style={{ fontFamily: MONO_FONT }}
                      >
                        {unit.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bảng Lịch Tháng Nền Kem Ngà Nghệ Thuật (Lần 2 hiển thị ngày cưới) */}
              <div className="overflow-hidden rounded-2xl border border-[#D8B15B] bg-[#F4ECE0] p-5 text-[#0A090B] shadow-2xl">
                <div className="text-center pb-3 border-b border-[#0A090B]/15">
                  <span
                    className="text-[10px] font-bold tracking-[0.22em] text-[#6E0F1D] uppercase"
                    style={{ fontFamily: MONO_FONT }}
                  >
                    LỊCH THÁNG
                  </span>
                  <p
                    className="text-lg font-bold tracking-wider text-[#0A090B]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    THÁNG {dateParts.month} / {dateParts.year}
                  </p>
                </div>

                {/* Thứ trong tuần */}
                <div className="grid grid-cols-7 gap-1 pt-3 text-center text-xs font-bold text-[#6E0F1D]">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dow, idx) => (
                    <div key={idx} className="py-1">
                      {dow}
                    </div>
                  ))}
                </div>

                {/* Các ngày trong tháng */}
                <div className="grid grid-cols-7 gap-1 pt-1 text-center text-xs font-medium">
                  {calendarDays.map((d, idx) => {
                    if (d === null) {
                      return <div key={`empty-${idx}`} className="py-2" />;
                    }
                    const isWeddingDay = d !== null && eventDays.has(d);
                    return (
                      <div
                        key={`day-${d}`}
                        className={cn(
                          "py-2 flex items-center justify-center rounded-lg transition-transform",
                          isWeddingDay
                            ? "bg-[#6E0F1D] text-[#F4ECE0] font-extrabold shadow-md scale-105"
                            : "text-[#0A090B] hover:bg-[#0A090B]/5",
                        )}
                      >
                        {d}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 4: TRANG PHỤC GỢI Ý (dresscode)
              * CHỈ HIỆN Ô MÀU TRONG KHUNG HÌNH HỌC ART DECO
              * TUYỆT ĐỐI KHÔNG HIỆN MÃ MÀU #XXXXXX
              ========================================================= */}
          {!hidden.has("dresscode") && dressColors.length > 0 && (
            <section style={{ order: orderOf("dresscode") }} className="space-y-4">
              <div className="text-center">
                <span
                  className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#D8B15B] uppercase"
                  style={{ fontFamily: MONO_FONT }}
                >
                  DRESS CODE · BẢNG MÀU THẢM ĐỎ
                </span>
                <h3
                  className="mt-1 text-2xl font-bold uppercase tracking-wider text-[#F4ECE0]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  TRANG PHỤC GỢI Ý
                </h3>
                <p className="mt-1 text-xs text-[#F4ECE0]/75">
                  Gợi ý sắc màu trang phục lịch thiệp để quý khách cùng hòa nhịp vào đêm tiệc điện ảnh.
                </p>
              </div>

              {/* Khung ô màu hình học Art Deco */}
              <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-[#D8B15B]/30 bg-[#131114] p-5 shadow-xl">
                {dressColors.map((color, idx) => (
                  <div key={idx} className="flex flex-col items-center space-y-2">
                    <div
                      className="relative h-14 w-14 rounded-xl border-2 border-[#D8B15B] shadow-md transition-transform hover:scale-110"
                      style={{ backgroundColor: color }}
                    >
                      {/* Vệt sáng góc Art Deco */}
                      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-black/30 via-transparent to-white/20" />
                    </div>
                    <span
                      className="text-[10px] font-bold tracking-widest text-[#D8B15B] uppercase"
                      style={{ fontFamily: MONO_FONT }}
                    >
                      CODE {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 5: THƯỚC PHIM 35MM & LIGHTBOX (album, albumQr)
              ========================================================= */}
          {!hidden.has("album") && galleryPhotos.length > 0 && (
            <section style={{ order: orderOf("album") }} className="space-y-4">
              <div className="text-center">
                <h3
                  className="text-2xl font-bold uppercase tracking-wider text-[#F4ECE0]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  THƯỚC PHIM
                </h3>
              </div>

              {/* Dải phim đen Art Deco */}
              <div className="overflow-hidden rounded-2xl border border-[#D8B15B]/40 bg-[#131114] p-4 shadow-xl">
                {/* Lỗ đục phim mép trên */}
                <div className="mb-3 flex justify-between gap-1 overflow-hidden opacity-50">
                  {Array.from({ length: 14 }).map((_, idx) => (
                    <div key={idx} className="h-2.5 w-3.5 rounded-xs bg-[#D8B15B]" />
                  ))}
                </div>

                {/* Lưới ảnh khung phim */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {galleryPhotos.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      onClick={() => setLightboxIndex(idx)}
                      className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-lg border border-[#D8B15B]/30 bg-[#0A090B] shadow-md transition-all duration-300 hover:border-[#D8B15B]",
                        idx === 0 ? "col-span-2 aspect-[16/10]" : "aspect-[4/5]",
                      )}
                    >
                      <img
                        src={photo.url}
                        alt={photo.alt || `Khoảnh khắc #${idx + 1}`}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 contrast-[1.05]"
                        loading="lazy"
                      />
                      {/* Lớp gradient viền */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A090B]/80 via-transparent to-transparent" />

                      {/* Mã khung phim 35mm */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-[#0A090B]/85 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-[#D8B15B]">
                        <Film className="h-3 w-3 text-[#D8B15B]" />
                        <span>KODAK · {String(idx + 1).padStart(2, "0")}A</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lỗ đục phim mép dưới */}
                <div className="mt-3 flex justify-between gap-1 overflow-hidden opacity-50">
                  {Array.from({ length: 14 }).map((_, idx) => (
                    <div key={idx} className="h-2.5 w-3.5 rounded-xs bg-[#D8B15B]" />
                  ))}
                </div>
              </div>

              {/* QR Album dành riêng cho gói Pro/VIP */}
              {!hidden.has("albumQr") && plan !== "free" && weddingSlug && (
                <div className="mt-4">
                  <GuestAlbumQr
                    slug={weddingSlug}
                    accentColor="#D8B15B"
                    textColor="#F4ECE0"
                    mutedColor="#A89F91"
                  />
                </div>
              )}
            </section>
          )}

          {/* =========================================================
              PHẦN 6: HỘP QUÀ HỶ SỰ (gift)
              * Hộp quà Art Deco 3 trạng thái căn đáy vật lý đồng bộ
              ========================================================= */}
          {!hidden.has("gift") && (
            <section style={{ order: orderOf("gift") }} className="space-y-4">
              <div className="text-center">
                <h3
                  className="text-2xl font-bold uppercase tracking-wider text-[#F4ECE0]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  HỘP QUÀ
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#F4ECE0]/75 max-w-sm mx-auto">
                  Sự hiện diện của Quý khách là niềm vinh dự lớn nhất trong đêm tiệc này. Nếu ở xa không tiện ghé chung vui, Quý khách có thể chạm mở chiếc hộp bên dưới để gửi lời chúc phúc.
                </p>
              </div>

              {/* Hộp quà Art Deco 3 trạng thái */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#D8B15B]/40 bg-[#131114] p-6 shadow-xl text-center">
                <button
                  type="button"
                  onClick={handleGiftClick}
                  disabled={isBoxOpening}
                  className="group relative flex cursor-pointer items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 disabled:pointer-events-none"
                  aria-label="Mở hộp quà hỷ sự mừng cưới"
                >
                  {/* Hào quang đỏ vàng phía sau hộp quà */}
                  <div
                    className="pointer-events-none absolute inset-0 -m-4 rounded-3xl bg-gradient-to-r from-[#FF1E3C]/20 via-[#D8B15B]/30 to-[#FF1E3C]/20 blur-xl transition-opacity duration-300"
                    style={{
                      opacity: boxStage === "open" || boxStage === "glow" ? 0.9 : 0.3,
                    }}
                    aria-hidden="true"
                  />

                  {/* Ảnh chiếc hộp quà 3 trạng thái căn đáy thẳng hàng tuyệt đối */}
                  <div className="relative z-10 h-44 w-44 sm:h-48 sm:w-48">
                    <img
                      src={
                        boxStage === "open"
                          ? "/templates/hao-quang-huong-cang/deco_box_open.webp"
                          : boxStage === "glow"
                            ? "/templates/hao-quang-huong-cang/deco_box_glow.webp"
                            : "/templates/hao-quang-huong-cang/deco_box_normal.webp"
                      }
                      alt="Hộp quà hỷ sự Art Deco Hồng Kông"
                      className="mx-auto block h-full w-full object-contain"
                    />
                  </div>
                </button>

                <p
                  className="mt-3 text-[11px] font-bold tracking-[0.2em] text-[#D8B15B] uppercase"
                  style={{ fontFamily: MONO_FONT }}
                >
                  {boxStage === "open" ? "HỘP QUÀ ĐÃ MỞ" : "CHẠM ĐỂ MỞ HỘP QUÀ"}
                </p>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 7: ĐẶT CHỖ & GỬI LỜI CHÚC (rsvp)
              * Đồng bộ 100% theme Hào Quang Hương Cảng (nền dark)
              ========================================================= */}
          {!hidden.has("rsvp") && (
            <section style={{ order: orderOf("rsvp") }} className="space-y-4">
              <div className="text-center">
                <h3
                  className="text-2xl font-bold uppercase tracking-wider text-[#F4ECE0]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  XÁC NHẬN THAM DỰ
                </h3>
              </div>

              {/* Form RSVP bọc trong card Dark Art Deco viền vàng kim */}
              <div
                className="overflow-hidden rounded-2xl border border-[#D8B15B]/40 bg-[#131114] p-5 sm:p-6 shadow-xl"
                style={{ colorScheme: "dark" }}
              >
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="ruby"
                  customTheme={{
                    isDark: true,
                    wrap: "bg-transparent text-[#F4ECE0]",
                    heading: "text-[#D8B15B]",
                    card: "bg-[#131114] border border-[#D8B15B]/40 text-[#F4ECE0] shadow-xs",
                    input: "bg-[#0A090B] border border-[#D8B15B]/35 text-[#F4ECE0] focus:border-[#00D8B4]",
                    primaryBtn: "bg-[#D8B15B] text-[#0A090B] hover:bg-[#F1D693] font-bold shadow-md",
                    outlineBtn: "border border-[#D8B15B]/40 text-[#F4ECE0] hover:bg-[#D8B15B]/10",
                    optionBg: "#0A090B",
                    optionColor: "#F4ECE0",
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
            PHẦN 8: FOOTER (ĐẶT NGOÀI CONTAINER FLEX CÓ ORDER)
            * Không lặp lại ngày cưới
            ========================================================= */}
        <footer className="mt-16 border-t border-[#D8B15B]/30 bg-[#0A090B] py-10 text-center text-xs text-[#F4ECE0]/60">
          <div className="mx-auto max-w-sm px-4 space-y-2">
            <p
              className="text-sm font-bold uppercase tracking-widest text-[#F1D693]"
              style={{ fontFamily: TITLE_FONT }}
            >
              HẸN GẶP QUÝ KHÁCH TẠI ĐÊM ĐẠI TIỆC
            </p>
            <p
              className="text-[11px] tracking-[0.2em] text-[#D8B15B] uppercase font-mono"
            >
              A FILM BY LOVE · 35MM CINEMA
            </p>
            <p className="text-[10px] text-[#A89F91] pt-2">
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

export default HaoQuangHuongCangTemplate;
