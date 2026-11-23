"use client";

import * as React from "react";
import Image from "next/image";
import {
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Camera,
  Film,
  ChevronRight,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playCoverSfx } from "@/lib/sfx";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import {
  getVisibleEvents,
  getNearestUpcomingEvent,
  getEventDirectionsUrl,
} from "@/lib/events";
import type { TemplateData, WeddingEvent, WeddingPlan } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: CỬU LONG HỶ YẾN (cuu-long-hy-yen)
   - Nền chủ đạo: Obsidian & Casino Emerald-Black (#0B0D0E → #0D1F19)
   - Bề mặt thẻ VIP: rgba(17, 21, 20, 0.92) viền vàng 24K rgba(216, 174, 86, 0.38)
   - Vàng 24K ánh kim (tiêu đề, số lớn, nút CTA): #D8AE56 (sáng #F2D488)
   - Đỏ son Hồng Kông (Song Hỷ, chi tiết bài tây, ngày cưới): #C81E2B
   - Xanh lục bảo sòng bài (accent bàn mạt chược): #14533C
   - Chữ chính trên nền tối: #F5EFE4 (WCAG AA)
   - Chữ phụ: #BFB6A4
   ============================================================ */

const KOWLOON_OBSIDIAN = "#0B0D0E";
const KOWLOON_CARD_BG = "rgba(17, 21, 20, 0.92)";

const GOLD_24K = "#D8AE56";
const GOLD_LIGHT = "#F2D488";
const GOLD_BORDER = "rgba(216, 174, 86, 0.38)";

const JADE_GREEN = "#14533C";
const CRIMSON_RED = "#C81E2B";

const TEXT_IVORY = "#F5EFE4";
const TEXT_MUTED = "#BFB6A4";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const MONO_FONT = "ui-monospace, SFMono-Regular, \"Space Mono\", Menlo, monospace";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const DEFAULT_DRESS = ["#0B0D0E", "#C81E2B", "#D8AE56"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

/* ------------------------------------------------------------
   MÀN HÌNH BÌA VIP: LẬT QUÂN MẠT CHƯỢC 3D & 2 CÁNH CỬA CỬU LONG
   - z-0: Nền kowloon neon velvet sắc nét
   - z-10: Cửa thang máy 2 cánh trượt mở sang 2 bên
   - z-20: Quân Mạt Chược Song Hỷ lật 3D (rotateY: 180deg) + Tên cặp đôi
   ------------------------------------------------------------ */
function KowloonCover({
  data,
  guestName,
  contained,
  onOpen,
}: {
  data: TemplateData;
  guestName: string | null;
  contained?: boolean;
  onOpen: () => void;
}) {
  const reduce = useReducedMotion();
  const [openingPhase, setOpeningPhase] = React.useState<"idle" | "flipping" | "opening-doors">("idle");

  const handleOpenClick = () => {
    if (openingPhase !== "idle") return;
    playCoverSfx("mahjong");

    if (reduce) {
      setOpeningPhase("opening-doors");
      setTimeout(() => {
        onOpen();
      }, 400);
      return;
    }

    // Phase 1: Lật quân mạt chược 3D (0 - 450ms)
    setOpeningPhase("flipping");

    // Phase 2: Cửa trượt mở sang 2 bên (450ms - 900ms)
    setTimeout(() => {
      setOpeningPhase("opening-doors");
    }, 450);

    // Hoàn tất mở vào thân thiệp
    setTimeout(() => {
      onOpen();
    }, 950);
  };

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden px-4 select-none",
        contained ? "h-full min-h-full py-6" : "h-screen-dvh min-h-screen-dvh py-8",
      )}
      style={{ backgroundColor: KOWLOON_OBSIDIAN }}
    >
      {/* Lớp z-0: Nền phòng VIP Cửu Long ánh neon đỏ vàng */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <picture>
          {!contained && (
            <source
              media="(min-width: 768px)"
              srcSet="/templates/cuu-long-hy-yen/bg_kowloon_desktop.webp"
            />
          )}
          <img
            src="/templates/cuu-long-hy-yen/bg_kowloon_mobile.webp"
            alt="Kowloon VIP Neon Background"
            className="h-full w-full object-cover object-center"
          />
        </picture>
      </div>

      {/* Lớp z-[5]: Lớp phủ gradient tối hai mép */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,13,14,0.85) 0%, rgba(13,31,25,0.4) 40%, rgba(11,13,14,0.7) 75%, rgba(11,13,14,0.95) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Lớp z-10: 2 cánh cửa thang máy phòng VIP Hồng Kông trượt sang hai bên */}
      <AnimatePresence>
        {openingPhase === "opening-doors" && (
          <div className="pointer-events-none fixed inset-0 z-30 flex overflow-hidden">
            {/* Cánh cửa bên trái */}
            <m.div
              className="h-full w-1/2 border-r border-[#D8AE56]/40 bg-[#0B0D0E]"
              style={{
                boxShadow: "inset -10px 0 30px rgba(0,0,0,0.8)",
              }}
              initial={{ x: "0%" }}
              animate={{ x: "-100%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* Cánh cửa bên phải */}
            <m.div
              className="h-full w-1/2 border-l border-[#D8AE56]/40 bg-[#0B0D0E]"
              style={{
                boxShadow: "inset 10px 0 30px rgba(0,0,0,0.8)",
              }}
              initial={{ x: "0%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Lớp z-20: Khối trung tâm căn giữa tuyệt đối */}
      <div className="relative z-20 mx-auto flex w-full max-w-[328px] sm:max-w-[380px] flex-col items-center text-center">
        {/* Nhãn VIP Đêm Tiệc */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D8AE56]/50 bg-[#0B0D0E]/85 px-4 py-1 backdrop-blur-xs">
          <span className="h-2 w-2 rounded-full bg-[#C81E2B] animate-pulse" />
          <span
            className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#D8AE56] uppercase"
            style={{ fontFamily: MONO_FONT }}
          >
            CỬU LONG HỶ YẾN · VIP
          </span>
        </div>

        {/* Quân bài Mạt Chược Song Hỷ lật 3D */}
        <div className="my-5 flex items-center justify-center [perspective:1000px]">
          <m.button
            type="button"
            onClick={handleOpenClick}
            disabled={openingPhase !== "idle"}
            className="relative cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 disabled:pointer-events-none"
            aria-label="Chạm quân mạt chược để mở tiệc"
            animate={
              openingPhase === "flipping"
                ? {
                  rotateY: [0, 180],
                  scale: [1, 1.18, 1.1],
                }
                : {}
            }
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {/* Hào quang vàng phía sau quân mạt chược */}
            <div
              className="pointer-events-none absolute inset-0 -m-3 rounded-2xl bg-gradient-to-r from-[#C81E2B]/40 via-[#D8AE56]/50 to-[#14533C]/40 blur-md transition-opacity duration-300"
              style={{
                opacity: openingPhase === "flipping" ? 1 : 0.6,
              }}
              aria-hidden="true"
            />
            <img
              src="/templates/cuu-long-hy-yen/mahjong_song_hy.webp"
              alt="Quân Mạt Chược Song Hỷ"
              className="relative z-10 block h-auto w-24 sm:w-28 drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
            />
          </m.button>
        </div>

        {/* Tên cặp đôi 3 dòng phong cách Thần Bài / Anh Đại */}
        <div className="space-y-1">
          <p
            className="text-[11px] tracking-[0.28em] uppercase text-[#BFB6A4]"
            style={{ fontFamily: BODY_FONT }}
          >
            THƯ MỜI ĐÊM TIỆC
          </p>
          <div className="pt-1">
            <h1
              className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wider text-[#F5EFE4] drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] break-words leading-tight"
              style={{ fontFamily: TITLE_FONT }}
            >
              {data.couple.groomName}
            </h1>
            <span
              className="my-1 block text-lg sm:text-xl font-serif italic text-[#D8AE56]"
              aria-hidden="true"
            >
              &amp;
            </span>
            <h1
              className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wider text-[#F5EFE4] drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] break-words leading-tight"
              style={{ fontFamily: TITLE_FONT }}
            >
              {data.couple.brideName}
            </h1>
          </div>
          {/* Dải phân cách hoa văn Cửu Long Art Deco */}
          <div className="mx-auto mt-3 flex justify-center">
            <img
              src="/templates/cuu-long-hy-yen/divider_kowloon_deco.webp"
              alt=""
              aria-hidden="true"
              className="h-auto w-40 max-w-full opacity-80"
            />
          </div>
        </div>

        {/* Lời mời cá nhân hóa tên khách (nếu có) */}
        {guestName ? (
          <div className="mt-5 rounded-md border border-[#D8AE56]/35 bg-[#121515]/90 px-4 py-2 backdrop-blur-xs">
            <p className="text-[10px] tracking-[0.2em] text-[#BFB6A4] uppercase" style={{ fontFamily: MONO_FONT }}>
              TRÂN TRỌNG KÍNH MỜI
            </p>
            <p className="mt-0.5 text-sm sm:text-base font-semibold text-[#D8AE56]" style={{ fontFamily: TITLE_FONT }}>
              {guestName}
            </p>
          </div>
        ) : (
          <p
            className="mt-5 text-xs tracking-[0.24em] text-[#BFB6A4] uppercase"
            style={{ fontFamily: BODY_FONT }}
          >
            TRÂN TRỌNG KÍNH MỜI
          </p>
        )}

        {/* Nút CTA VÀO TIỆC CỬU LONG */}
        <div className="mt-6 w-full max-w-[260px]">
          <button
            type="button"
            onClick={handleOpenClick}
            disabled={openingPhase !== "idle"}
            className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-[#D8AE56] bg-gradient-to-r from-[#D8AE56] via-[#F2D488] to-[#D8AE56] px-7 py-3 text-xs sm:text-sm font-bold tracking-[0.2em] text-[#0B0D0E] uppercase shadow-[0_0_24px_rgba(216,174,86,0.45)] transition-all duration-300 hover:shadow-[0_0_32px_rgba(216,174,86,0.7)] active:scale-95 disabled:opacity-75"
          >
            <span>VÀO TIỆC CỬU LONG</span>
            <ChevronRight className="h-4 w-4 text-[#0B0D0E] transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   MAIN COMPONENT: CỬU LONG HỶ YẾN
   ------------------------------------------------------------ */
export function CuuLongHyYenTemplate({
  data,
  mode,
  contained = false,
  isOpened = false,
  onOpenedChange,
  externalMusicControl,
  isMusicPlaying = true,
  onToggleMusic,
  inviteSlug,
  weddingSlug,
  invitationMode = "personal",
  guestName = null,
  initialStatus,
  initialPlusOnes,
  initialDiet,
  initialSongRequest,
  initialRideNeeded,
}: WeddingTemplateProps) {
  const [internalOpened, setInternalOpened] = React.useState(isOpened);
  const [coverGone, setCoverGone] = React.useState(isOpened);
  const parentOpenedRef = React.useRef(isOpened);

  // Lightbox Modal
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Hook tương tác Vali Hỷ Sự (3 trạng thái: normal -> glow -> open)
  const {
    stage: briefcaseStage,
    isOpening: isBriefcaseOpening,
    isModalOpen: isGiftModalOpen,
    handleGiftClick,
    handleCloseModal,
  } = useGiftBoxInteraction({
    sfxType: "briefcase",
  });

  // Đồng bộ hai chiều `isOpened` với component cha
  React.useEffect(() => {
    if (parentOpenedRef.current !== isOpened) {
      parentOpenedRef.current = isOpened;
      if (isOpened) {
        setInternalOpened(true);
        setCoverGone(true);
      } else {
        setInternalOpened(false);
        setCoverGone(false);
      }
    }
  }, [isOpened]);

  const handleOpenCover = React.useCallback(() => {
    setInternalOpened(true);
    setCoverGone(true);
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }
    if (!contained && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [contained, onOpenedChange]);

  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const targetDateStr = targetEvent.startsAt || data.date || "2027-03-20T10:00:00+07:00";
  const dateParts = formatWeddingDateParts(targetDateStr);
  const lunarStr = formatLunarDateClean(targetEvent.lunarDate);

  // Parents string formatting: Tách tại '&' thành 2 dòng riêng sạch sẽ, không ghi "Thân sinh:"
  const parseParents = (raw?: string) => {
    if (!raw) return [];
    return raw
      .split("&")
      .map((part) => part.trim().replace(/^thân sinh:\s*/i, ""))
      .filter(Boolean);
  };
  const groomParentsList = parseParents(data.couple.groomParents);
  const brideParentsList = parseParents(data.couple.brideParents);

  const dressColors = getDressColors(data);

  // Gallery items (Free max 5)
  const galleryPhotos = React.useMemo(() => {
    const raw = data.photos?.gallery ?? [];
    return data.plan === "free" ? raw.slice(0, 5) : raw;
  }, [data.photos?.gallery, data.plan]);

  // Hidden sections & Section Order
  const hidden = new Set(data.hiddenSections ?? []);
  const order = data.sectionOrder?.length
    ? data.sectionOrder
    : ["family", "calendar", "map", "dresscode", "album", "albumQr", "gift", "rsvp"];
  const orderOf = (key: string) => {
    const index = order.indexOf(key);
    return index < 0 ? 99 : index;
  };

  // Countdown timer logic
  const targetDate = React.useMemo(() => new Date(targetDateStr), [targetDateStr]);
  const [timeLeft, setTimeLeft] = React.useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const calculateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, targetDate.getTime() - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimer();
    const interval = setInterval(calculateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div
      className={cn(
        "relative w-full overflow-x-hidden text-[#F5EFE4]",
        !coverGone ? (contained ? "h-full overflow-hidden" : "h-screen-dvh min-h-screen-dvh overflow-hidden") : "",
      )}
      style={{
        backgroundColor: KOWLOON_OBSIDIAN,
        fontFamily: BODY_FONT,
      }}
    >
      {/* ---------------- MÀN HÌNH BÌA VIP ---------------- */}
      {!coverGone && (
        <div className="absolute inset-0 z-40 h-full w-full">
          <KowloonCover
            data={data}
            guestName={guestName}
            contained={contained}
            onOpen={handleOpenCover}
          />
        </div>
      )}

      {/* ---------------- THÂN THIỆP CỬU LONG ---------------- */}
      <div
        className={cn(
          "relative z-10 w-full transition-opacity duration-700",
          !coverGone ? "hidden pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        {/* Nút nhạc nền góc màn hình */}
        {!externalMusicControl && !hidden.has("music") && data.music?.src && (
          <LiveMusicFloatingButton
            src={data.music.src}
            title={data.music.title || "Bản Tình Ca Cửu Long"}
            visible={coverGone}
            tone="obsidian"
          />
        )}

        {/* CONTAINER CHÍNH CĂN GIỮA ĐIỆN THOẠI / DESKTOP */}
        <div className="mx-auto w-full max-w-[480px] sm:max-w-[540px] px-4 py-8 space-y-12 sm:space-y-16">

          {/* =========================================================
              PHẦN 1: HERO POSTER ĐIỆN ẢNH CỬU LONG (Art-Deco Frame)
              ========================================================= */}
          <section className="relative pt-4 text-center">
            {/* Nhãn Đêm Tiệc Thành Hôn */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D8AE56]/40 bg-[#121515]/90 px-3.5 py-1 backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C81E2B]" />
              <span
                className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#D8AE56] uppercase"
                style={{ fontFamily: MONO_FONT }}
              >
                TRÂN TRỌNG KÍNH MỜI
              </span>
            </div>

            {/* Poster Khung Art-Deco đen - vàng 24K - đỏ son */}
            <div className="relative mx-auto mt-6 w-full max-w-[340px] sm:max-w-[380px]">
              {/* Đôi lá bài King & Queen hoàng kim đặt phía trên đỉnh khung */}
              <div className="relative z-20 -mb-7 flex justify-center">
                <img
                  src="/templates/cuu-long-hy-yen/cards_king_queen.webp"
                  alt="K♥ & Q♥ Royal Cards"
                  className="h-auto w-24 sm:w-28 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
                />
              </div>

              {/* Khung ảnh chính lồng ảnh cưới */}
              <div className="relative aspect-[818/1117] w-full overflow-hidden rounded-xl bg-[#0B0D0E] shadow-[0_16px_36px_rgba(0,0,0,0.95)]">
                {/* Ảnh cưới bên trong khung */}
                <div className="absolute inset-[6.5%] overflow-hidden rounded-lg bg-[#121515]">
                  <img
                    src={data.photos?.heroUrl || galleryPhotos[0]?.url || "/photos/hero2.webp"}
                    alt={data.photos?.heroAlt || `Ảnh cưới ${data.couple.groomName} và ${data.couple.brideName}`}
                    className="h-full w-full object-cover object-center"
                  />
                  {/* Lớp ám màu phim 1990s nhẹ */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0D0E]/80 via-transparent to-transparent" />
                </div>

                {/* Khung viền Art-Deco đè lên trên */}
                <img
                  src="/templates/cuu-long-hy-yen/kowloon_poster_frame.webp"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-10 h-full w-full object-fill"
                />
              </div>
            </div>

            {/* Tên cặp đôi 3 dòng khổ lớn */}
            <div className="mt-8 space-y-1">
              <p className="text-[11px] tracking-[0.25em] text-[#BFB6A4] uppercase" style={{ fontFamily: BODY_FONT }}>
                HỶ YẾN TRĂM NĂM
              </p>
              <h2
                className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-[#F5EFE4] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] break-words leading-tight"
                style={{ fontFamily: TITLE_FONT }}
              >
                {data.couple.groomName}
              </h2>
              <span className="block text-xl font-serif italic text-[#D8AE56]" aria-hidden="true">
                &amp;
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-[#F5EFE4] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] break-words leading-tight"
                style={{ fontFamily: TITLE_FONT }}
              >
                {data.couple.brideName}
              </h2>
              {/* Dải phân cách hoa văn Cửu Long */}
              <div className="mx-auto mt-4 flex justify-center">
                <img
                  src="/templates/cuu-long-hy-yen/divider_kowloon_deco.webp"
                  alt=""
                  aria-hidden="true"
                  className="h-auto w-36 max-w-full opacity-70"
                />
              </div>
            </div>

            {/* Lời dẫn duyên dáng, khí chất */}
            <p className="mx-auto mt-4 max-w-sm text-xs sm:text-sm leading-relaxed text-[#BFB6A4] italic">
              “Giữa muôn vạn bước chân nơi đô thành náo nhiệt, gặp được một người cùng chung chí hướng, nắm tay đi trọn trăm năm là điều may mắn nhất đời này.”
            </p>
          </section>

          {/* =========================================================
              PHẦN 2: THẺ HỒ SƠ SONG HÙNG K ♥ & Q ♥ VÀ HAI GIA ĐÌNH (family)
              ========================================================= */}
          {!hidden.has("family") && (
            <section style={{ order: orderOf("family") }} className="space-y-4">
              <div className="text-center">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#D8AE56] uppercase" style={{ fontFamily: MONO_FONT }}>
                  DOSSIER · NHÂN VẬT CHÍNH
                </span>
                <h3 className="mt-1 text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
                  HAI BÊN GIA ĐÌNH
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Thẻ Chú Rể (K ♥) */}
                <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#D8AE56]/35 bg-[#121515] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                  {/* Huy hiệu K ♥ góc trên phải */}
                  <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-[#C81E2B]/50 bg-[#C81E2B]/15 text-sm font-extrabold text-[#C81E2B]" style={{ fontFamily: TITLE_FONT }}>
                    K ♥
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Ảnh chân dung Chú rể */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[#D8AE56]/60 shadow-md">
                      <img
                        src={data.photos?.groomUrl || "/photos/portrait_cr.webp"}
                        alt="Ảnh Chú Rể"
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] tracking-[0.2em] text-[#D8AE56] uppercase font-semibold" style={{ fontFamily: MONO_FONT }}>
                        {data.couple.groomTitle || "TRƯỞNG NAM"}
                      </span>
                      <h4 className="text-lg font-bold text-[#F5EFE4] leading-snug" style={{ fontFamily: TITLE_FONT }}>
                        {data.couple.groomName}
                      </h4>
                    </div>
                  </div>

                  {/* Thông tin song thân Nhà Trai */}
                  <div className="mt-4 border-t border-[#D8AE56]/20 pt-3 text-xs leading-relaxed text-[#BFB6A4]">
                    <p className="font-semibold text-[#D8AE56] tracking-wider uppercase mb-1">NHÀ TRAI</p>
                    {groomParentsList.map((pName, pIdx) => (
                      <p key={pIdx}>{pName}</p>
                    ))}
                  </div>
                </div>

                {/* Thẻ Cô Dâu (Q ♥) */}
                <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-[#D8AE56]/35 bg-[#121515] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                  {/* Huy hiệu Q ♥ góc trên phải */}
                  <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-[#C81E2B]/50 bg-[#C81E2B]/15 text-sm font-extrabold text-[#C81E2B]" style={{ fontFamily: TITLE_FONT }}>
                    Q ♥
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Ảnh chân dung Cô dâu */}
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-[#D8AE56]/60 shadow-md">
                      <img
                        src={data.photos?.brideUrl || "/photos/portrait_cd.webp"}
                        alt="Ảnh Cô Dâu"
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] tracking-[0.2em] text-[#D8AE56] uppercase font-semibold" style={{ fontFamily: MONO_FONT }}>
                        {data.couple.brideTitle || "ÁI NỮ"}
                      </span>
                      <h4 className="text-lg font-bold text-[#F5EFE4] leading-snug" style={{ fontFamily: TITLE_FONT }}>
                        {data.couple.brideName}
                      </h4>
                    </div>
                  </div>

                  {/* Thông tin song thân Nhà Gái */}
                  <div className="mt-4 border-t border-[#D8AE56]/20 pt-3 text-xs leading-relaxed text-[#BFB6A4]">
                    <p className="font-semibold text-[#D8AE56] tracking-wider uppercase mb-1">NHÀ GÁI</p>
                    {brideParentsList.map((pName, pIdx) => (
                      <p key={pIdx}>{pName}</p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 3: GIỜ VÀNG KHAI TIỆC & BÀN LỊCH MẠT CHƯỢC (calendar, map)
              * LẦN 1 XUẤT HIỆN NGÀY CƯỚI: Thẻ VIP sự kiện
              * LẦN 2 XUẤT HIỆN NGÀY CƯỚI: Bàn Lịch Tháng Mạt Chược
              ========================================================= */}
          {(!hidden.has("calendar") || !hidden.has("map")) && visibleEvents.length > 0 && (
            <section style={{ order: orderOf("calendar") }} className="space-y-5">
              <div className="text-center">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#D8AE56] uppercase" style={{ fontFamily: MONO_FONT }}>
                  TIMETABLE · GIỜ VÀNG KHAI TIỆC
                </span>
                <h3 className="mt-1 text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
                  LỊCH HẸN TRĂM NĂM
                </h3>
              </div>

              {/* THẺ VIP ĐÊM TIỆC: Ngày giờ & Địa điểm (Hỗ trợ 1..N buổi lễ) */}
              <div className={visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "max-w-xl mx-auto space-y-4"}>
                {visibleEvents.map((evt, idx) => {
                  const evtDateParts = formatWeddingDateParts(evt.startsAt);
                  const evtLunarStr = formatLunarDateClean(evt.lunarDate);
                  const directionsUrl = getEventDirectionsUrl(evt);

                  return (
                    <div
                      key={evt.id || idx}
                      className="relative overflow-hidden rounded-2xl border border-[#D8AE56]/45 bg-gradient-to-b from-[#121515] to-[#0D1F19] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.85)] flex flex-col justify-between"
                    >
                      {/* Viền hoa văn vàng trang trí góc */}
                      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-[#D8AE56]/10 blur-xl" />

                      <div>
                        <div className="flex items-center justify-between border-b border-[#D8AE56]/25 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#C81E2B]" />
                            <span className="text-xs font-bold tracking-[0.2em] text-[#D8AE56] uppercase" style={{ fontFamily: MONO_FONT }}>
                              {evt.title || `LỄ HÔN PHỐI #${idx + 1}`}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono tracking-wider text-[#BFB6A4]">
                            VIP PASS
                          </span>
                        </div>

                        {/* Khối Ngày / Tháng / Năm lớn */}
                        <div className="my-5 flex flex-col items-center justify-center text-center">
                          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#D8AE56] uppercase">
                            {evtDateParts?.weekday} · {evtDateParts?.time || "11:00"}
                          </p>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-4xl sm:text-5xl font-black text-[#F5EFE4] tracking-tight" style={{ fontFamily: TITLE_FONT }}>
                              {evtDateParts?.day}
                            </span>
                            <div className="text-left leading-tight">
                              <p className="text-xs font-bold tracking-wider text-[#D8AE56] uppercase">
                                THÁNG {evtDateParts?.month}
                              </p>
                              <p className="text-xs text-[#BFB6A4] font-mono">
                                NĂM {evtDateParts?.year}
                              </p>
                            </div>
                          </div>
                          {evtLunarStr && (
                            <p className="mt-2 text-[11px] text-[#BFB6A4] italic">
                              ({evtLunarStr})
                            </p>
                          )}
                        </div>

                        {/* Địa điểm tiệc */}
                        <div className="rounded-xl border border-[#D8AE56]/20 bg-[#0B0D0E]/80 p-4 text-center">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#D8AE56]">
                            {evt.venueName || "TRUNG TÂM HỘI NGHỊ & TIỆC CƯỚI"}
                          </p>
                          <p className="mt-1 text-xs text-[#BFB6A4] leading-relaxed">
                            {evt.venueAddress || "TP. Hồ Chí Minh"}
                          </p>
                        </div>
                      </div>

                      {/* Nút chỉ đường Google Maps */}
                      {!hidden.has("map") && (
                        <div className="mt-4 flex justify-center">
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#D8AE56]/60 bg-[#D8AE56]/15 px-4 py-2 text-xs font-bold tracking-wider text-[#D8AE56] transition-colors hover:bg-[#D8AE56] hover:text-[#0B0D0E]"
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            <span>CHỈ ĐƯỜNG TRÊN GOOGLE MAPS</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 4 ô đồng hồ đếm ngược số cơ khí */}
              <div className="rounded-2xl border border-[#D8AE56]/30 bg-[#0D1F19]/80 p-5 shadow-lg max-w-xl mx-auto">
                <p className="text-center text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#D8AE56] uppercase mb-4" style={{ fontFamily: MONO_FONT }}>
                  COUNTDOWN · CÙNG ĐẾM NGƯỢC
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "NGÀY", val: timeLeft.days },
                    { label: "GIỜ", val: timeLeft.hours },
                    { label: "PHÚT", val: timeLeft.minutes },
                    { label: "GIÂY", val: timeLeft.seconds },
                  ].map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-[#D8AE56]/30 bg-[#121515] py-2">
                      <p className="text-lg sm:text-xl font-bold text-[#D8AE56] font-mono leading-none">
                        {String(item.val).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-[9px] font-semibold tracking-wider text-[#BFB6A4]" style={{ fontFamily: MONO_FONT }}>
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* BÀN LỊCH THÁNG KIỂU Ô GẠCH MẠT CHƯỢC (Lần 2 xuất hiện ngày cưới) */}
              {!hidden.has("calendar") && dateParts && (
                <div className="rounded-2xl border-2 border-[#14533C] bg-[#F5EFE2] p-5 text-[#0B0D0E] shadow-[0_12px_28px_rgba(0,0,0,0.85)] max-w-xl mx-auto">
                  <div className="mb-4 flex items-center justify-between border-b border-[#14533C]/20 pb-2">
                    <span className="text-xs font-bold tracking-[0.2em] text-[#14533C] uppercase" style={{ fontFamily: MONO_FONT }}>
                      BÀN LỊCH CỬU LONG
                    </span>
                    <span className="text-xs font-extrabold uppercase text-[#C81E2B]" style={{ fontFamily: TITLE_FONT }}>
                      THÁNG {dateParts.month} · {dateParts.year}
                    </span>
                  </div>

                  {/* Lưới các thứ trong tuần */}
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-[#14533C] uppercase mb-2">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, idx) => (
                      <div key={idx} className="py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Lưới các ô ngày mạt chược */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                    {(() => {
                      const year = parseInt(dateParts.year, 10);
                      const month = parseInt(dateParts.month, 10);
                      const eventDays = new Set(
                        visibleEvents.map((evt) => parseInt(formatWeddingDateParts(evt.startsAt).day, 10))
                      );

                      const firstDay = new Date(year, month - 1, 1).getDay();
                      // T2 is index 0 -> adjust from Sunday (0)
                      const offset = firstDay === 0 ? 6 : firstDay - 1;
                      const daysInMonth = new Date(year, month, 0).getDate();

                      const cells = [];
                      for (let i = 0; i < offset; i++) {
                        cells.push(<div key={`empty-${i}`} className="h-8" />);
                      }
                      for (let d = 1; d <= daysInMonth; d++) {
                        const isWedding = eventDays.has(d);
                        cells.push(
                          <div
                            key={`day-${d}`}
                            className={cn(
                              "flex h-8 items-center justify-center rounded border font-semibold text-xs transition-transform",
                              isWedding
                                ? "border-[#C81E2B] bg-[#C81E2B] text-[#F5EFE4] font-extrabold shadow-md scale-105"
                                : "border-[#14533C]/20 bg-white text-[#0B0D0E]",
                            )}
                          >
                            {d}
                          </div>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* =========================================================
              PHẦN 4: LUẬT CHƠI ĐÊM TIỆC - DRESS CODE (dresscode)
              * Phỉnh Casino, viền khía vàng mảnh, KHÔNG lộ mã hex #XXXXXX
              ========================================================= */}
          {!hidden.has("dresscode") && dressColors.length > 0 && (
            <section style={{ order: orderOf("dresscode") }} className="space-y-4 text-center">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#D8AE56] uppercase" style={{ fontFamily: MONO_FONT }}>
                  DRESS CODE · QUY CHUẨN ĐÊM TIỆC
                </span>
                <h3 className="mt-1 text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
                  LUẬT CHƠI ĐÊM TIỆC
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-xs text-[#BFB6A4]">
                  Gợi ý sắc màu trang phục để cả bàn tiệc cùng lên hình thật chất.
                </p>
              </div>

              {/* Các chip phỉnh Casino viền khía vàng */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2">
                {dressColors.map((hex, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div
                      className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-dashed border-[#D8AE56] shadow-[0_0_16px_rgba(216,174,86,0.25)] transition-transform hover:scale-110"
                      style={{
                        backgroundColor: hex,
                        boxShadow: `0 0 16px ${hex}40, inset 0 0 8px rgba(0,0,0,0.6)`,
                      }}
                      aria-label={`Dress Code Swatch ${idx + 1}`}
                    >
                      {/* Vòng viền vàng trong hạt phỉnh */}
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-[#D8AE56]/60 pointer-events-none" />
                    </div>
                    <span className="text-[10px] font-semibold tracking-wider text-[#D8AE56] uppercase font-mono">
                      TONE {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 5: HỒ SƠ ẢNH ĐÊM CỬU LONG & LIGHTBOX (album, albumQr)
              ========================================================= */}
          {!hidden.has("album") && galleryPhotos.length > 0 && (
            <section style={{ order: orderOf("album") }} className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
                  THƯỚC PHIM
                </h3>
              </div>

              {/* Lưới ảnh phong cách khung phim TVB đánh số 01, 02... */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {galleryPhotos.map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={cn(
                      "group relative cursor-pointer overflow-hidden rounded-xl border border-[#D8AE56]/35 bg-[#121515] shadow-md transition-all duration-300 hover:border-[#D8AE56] hover:shadow-[0_0_20px_rgba(216,174,86,0.35)]",
                      idx === 0 ? "col-span-2 aspect-[16/10]" : "aspect-[4/5]",
                    )}
                  >
                    <img
                      src={photo.url}
                      alt={photo.alt || `Khoảnh khắc #${idx + 1}`}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {/* Lớp gradient viền */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0D0E]/80 via-transparent to-transparent" />

                    {/* Số khung phim góc dưới */}
                    <div className="absolute bottom-2 left-2.5 flex items-center gap-1 rounded bg-[#0B0D0E]/85 px-2 py-0.5 text-[10px] font-mono font-bold tracking-widest text-[#D8AE56]">
                      <Film className="h-3 w-3 text-[#D8AE56]" />
                      <span>SCENE {String(idx + 1).padStart(2, "0")}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* QR chia sẻ ảnh khách chụp (gói Pro/VIP) */}
              {data.plan !== "free" && !hidden.has("albumQr") && weddingSlug && (
                <div className="mt-6 flex justify-center border-t border-[#D8AE56]/20 pt-6">
                  <GuestAlbumQr
                    slug={weddingSlug}
                    accentColor="#D8AE56"
                    textColor="#F5EFE4"
                    mutedColor="#BFB6A4"
                  />
                </div>
              )}
            </section>
          )}

          {/* =========================================================
              PHẦN 6: VALI HỶ SỰ - MỪNG CƯỚI 3 TRẠNG THÁI (gift)
              * normal -> glow -> open (briefcase_3states)
              ========================================================= */}
          {!hidden.has("gift") && (
            <section style={{ order: orderOf("gift") }} className="space-y-4 text-center">
              <div>
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
                  HỘP QUÀ
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#BFB6A4]">
                  Sự hiện diện của Quý khách là điều đáng quý nhất trong đêm tiệc này. Nếu ở xa chưa thể ghé chung vui, Quý khách có thể chạm mở chiếc vali nhỏ bên dưới để gửi lời chúc phúc.
                </p>
              </div>

              {/* Nút Vali Đen Khóa Vàng 3 Trạng Thái */}
              <div className="flex flex-col items-center justify-center pt-2">
                {/* Preload ảnh trạng thái open chống giật layout */}
                <img
                  src="/templates/cuu-long-hy-yen/briefcase_open.webp"
                  className="hidden"
                  aria-hidden="true"
                  alt=""
                />

                <button
                  type="button"
                  onClick={handleGiftClick}
                  disabled={isBriefcaseOpening}
                  className="group relative flex cursor-pointer items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 disabled:pointer-events-none"
                  aria-label="Mở vali mừng cưới"
                >
                  {/* Hào quang vàng phía sau vali */}
                  <div
                    className="pointer-events-none absolute inset-0 -m-4 rounded-3xl bg-gradient-to-r from-[#D8AE56]/30 via-[#C81E2B]/20 to-[#D8AE56]/30 blur-xl transition-opacity duration-300"
                    style={{
                      opacity: briefcaseStage === "open" || briefcaseStage === "glow" ? 0.9 : 0.4,
                    }}
                    aria-hidden="true"
                  />

                  {/* Ảnh chiếc vali 3 trạng thái căn đáy thẳng hàng */}
                  <div className="relative z-10 h-44 w-44 sm:h-48 sm:w-48">
                    <img
                      src={
                        briefcaseStage === "open"
                          ? "/templates/cuu-long-hy-yen/briefcase_open.webp"
                          : briefcaseStage === "glow"
                            ? "/templates/cuu-long-hy-yen/briefcase_glow.webp"
                            : "/templates/cuu-long-hy-yen/briefcase_normal.webp"
                      }
                      alt="Vali đen khóa vàng Cửu Long"
                      className="mx-auto block h-full w-full object-contain"
                    />
                  </div>
                </button>

                <p className="mt-3 text-[11px] font-bold tracking-[0.2em] text-[#D8AE56] uppercase" style={{ fontFamily: MONO_FONT }}>
                  {briefcaseStage === "open" ? "VALI ĐÃ MỞ" : "CHẠM ĐỂ MỞ VALI HỶ SỰ"}
                </p>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 7: XÁC NHẬN GÓP MẶT & SỔ LƯU BÚT (rsvp)
              * Đồng bộ 100% theme Cửu Long Hỷ Yến
              ========================================================= */}
          {!hidden.has("rsvp") && (
            <section style={{ order: orderOf("rsvp") }} className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
                  XÁC NHẬN THAM DỰ
                </h3>
              </div>

              {/* Form RSVP bọc trong card Obsidian viền vàng 24K */}
              <div
                className="overflow-hidden rounded-2xl border border-[#D8AE56]/40 bg-[#121615] p-5 sm:p-6 shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
                style={{ colorScheme: "dark" }}
              >
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="obsidian"
                  customTheme={{
                    isDark: true,
                    wrap: "bg-transparent text-[#F5EFE4]",
                    heading: "text-[#D8AE56]",
                    card: "bg-[#0B0D0E] border border-[#D8AE56]/35 text-[#F5EFE4]",
                    input: "bg-[#0B0D0E] border border-[#D8AE56]/35 text-[#F5EFE4] focus:border-[#D8AE56]",
                    primaryBtn: "bg-[#D8AE56] text-[#0B0D0E] hover:bg-[#F2D488] font-bold",
                    outlineBtn: "border-[#D8AE56] text-[#D8AE56] hover:bg-[#D8AE56]/15",
                    optionBg: "#0B0D0E",
                    optionColor: "#F5EFE4",
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
        <footer className="mt-16 border-t border-[#D8AE56]/20 bg-[#0B0D0E] py-10 text-center text-xs text-[#BFB6A4]">
          <div className="mx-auto max-w-sm px-4 space-y-2">
            {/* Dải phân cách hoa văn Cửu Long */}
            <div className="flex justify-center mb-3">
              <img
                src="/templates/cuu-long-hy-yen/divider_kowloon_deco.webp"
                alt=""
                aria-hidden="true"
                className="h-auto w-32 max-w-full opacity-60"
              />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
              HẸN GẶP QUÝ KHÁCH TẠI ĐÊM TIỆC CỬU LONG
            </p>
            <p className="text-[11px] tracking-[0.2em] text-[#D8AE56] uppercase font-mono">
              CỬU LONG HỶ YẾN · VIP PASSION 1990S
            </p>
            <p className="text-[10px] text-[#737882] pt-2">
              © {dateParts.year} {data.couple.groomName} &amp; {data.couple.brideName}. ALL RIGHTS RESERVED.
            </p>
          </div>
        </footer>
      </div>

      {/* ---------------- MODAL QUÀ MỪNG (createPortal) ---------------- */}
      <GiftModal
        open={isGiftModalOpen}
        onClose={handleCloseModal}
        gift={data.gift}
        plan={data.plan || "free"}
        tone="obsidian"
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName}
      />

      {/* ---------------- LIGHTBOX MODAL ---------------- */}
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

export default CuuLongHyYenTemplate;
