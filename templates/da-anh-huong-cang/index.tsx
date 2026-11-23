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
  Ticket,
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
import { FilmFrame35mm } from "../shared/FilmFrame35mm";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: DẠ ẢNH HƯƠNG CẢNG (da-anh-huong-cang)
   - Nền đêm điện ảnh (Cover, Cinema Hero, Tiệc Đêm): #0D0D10 / #141418
   - Nền giấy báo nghệ thuật (Zine Story, Cặp đôi VS, Lịch & Gia đình): #F3EFE6
   - Thẻ nổi Zine: #FFFFFF, viền mực đen #141418 (1.5px)
   - Đỏ son Hương Cảng (triện đỏ, nút CTA, ngày cưới): #C81E2B (hover #A61621)
   - Xanh ngọc neon trầm: #16A37A
   - Vàng hổ phách phim nhựa: #E5A93B
   - Chữ trên nền giấy sáng: #121214 (chính), #52525B (phụ)
   - Chữ trên nền tối: #F5F2EB (chính), #C4BEB2 (phụ)
   ============================================================ */

const NOIR_BG = "#0D0D10";
const ZINE_PAPER_BG = "#F3EFE6";
const INK_BLACK = "#141418";
const CRIMSON_RED = "#C81E2B";
const JADE_CYAN = "#16A37A";
const AMBER_GOLD = "#E5A93B";

const TEXT_DARK = "#121214";
const TEXT_MUTED_DARK = "#52525B";
const TEXT_LIGHT = "#F5F2EB";
const TEXT_MUTED_LIGHT = "#C4BEB2";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const MONO_FONT = "ui-monospace, SFMono-Regular, \"Space Mono\", Menlo, monospace";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const DEFAULT_DRESS = ["#141418", "#C81E2B", "#E5A93B"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

/* ------------------------------------------------------------
   MÀN HÌNH BÌA POSTER: XÉ VÉ VÀO RẠP & KÉO MÀN CHIẾU PHIM
   - z-0: Nền đêm mưa neon bg_hk_neon.webp sắc nét 100%
   - z-[5]: Khung poster 2 lớp viền mỏng
   - z-20: Tên cặp đôi 3 dòng + Tấm vé rạp phim cinema_ticket.webp
   - Tương tác: Nhấn "XÉ VÉ VÀO RẠP" -> cuống vé tách trượt -> poster kéo lên
   ------------------------------------------------------------ */
function DaAnhCover({
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
  const [isTearing, setIsTearing] = React.useState(false);
  const [isSlidingUp, setIsSlidingUp] = React.useState(false);

  const handleTearTicket = () => {
    if (isTearing || isSlidingUp) return;
    playCoverSfx("ticket-tear");

    if (reduce) {
      setIsSlidingUp(true);
      setTimeout(() => {
        onOpen();
      }, 400);
      return;
    }

    // Phase 1: Cuống vé tách nhẹ và trượt xuống (0 - 400ms)
    setIsTearing(true);

    // Phase 2: Màn chiếu rạp phim kéo lên trên (400ms - 900ms)
    setTimeout(() => {
      setIsSlidingUp(true);
    }, 380);

    // Hoàn tất mở vào thân thiệp
    setTimeout(() => {
      onOpen();
    }, 900);
  };

  return (
    <m.div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden px-4 select-none",
        contained ? "h-full min-h-full py-6" : "h-screen-dvh min-h-screen-dvh py-8",
      )}
      style={{ backgroundColor: NOIR_BG }}
      animate={isSlidingUp ? { y: "-100%" } : { y: "0%" }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Lớp z-0: Nền đêm mưa neon Vương Gia Vệ */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <img
          src="/templates/da-anh-huong-cang/bg_hk_neon.webp"
          alt="Hong Kong Neon Rain Night"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Lớp z-[5]: Lớp phủ gradient tối hai mép + viền phim mỏng */}
      <div
        className="pointer-events-none absolute inset-0 z-[5]"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,13,16,0.85) 0%, rgba(13,13,16,0.35) 45%, rgba(13,13,16,0.7) 75%, rgba(13,13,16,0.96) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Lớp z-20: Bố cục Poster căn giữa tuyệt đối */}
      <div className="relative z-20 mx-auto flex w-full max-w-[328px] sm:max-w-[380px] flex-col items-center text-center">
        {/* Đỉnh poster: Dải nhãn suất chiếu đặc biệt + Con dấu triện đỏ kiểm duyệt */}
        <div className="relative flex w-full items-center justify-between px-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5F2EB]/30 bg-[#0D0D10]/80 px-3.5 py-1 backdrop-blur-xs">
            <span className="h-2 w-2 rounded-full bg-[#C81E2B] animate-pulse" />
            <span
              className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#E5A93B] uppercase"
              style={{ fontFamily: MONO_FONT }}
            >
              SUẤT CHIẾU ĐẶC BIỆT
            </span>
          </div>

          {/* Triện đỏ son đóng dấu góc trên phải */}
          <div className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 -mr-1">
            <img
              src="/templates/da-anh-huong-cang/stamp_song_hy.webp"
              alt="Dấu Son Song Hỷ"
              className="h-full w-full object-contain drop-shadow-[0_2px_8px_rgba(200,30,43,0.7)]"
            />
          </div>
        </div>

        {/* Tâm poster: Tên cặp đôi 3 dòng phong cách bìa phim TVB 90s */}
        <div className="my-6 space-y-1">
          <p
            className="text-[11px] tracking-[0.3em] uppercase text-[#C4BEB2]"
            style={{ fontFamily: BODY_FONT }}
          >
            A ROMANTIC FILM BY
          </p>
          <div className="pt-1">
            <h1
              className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wider text-[#F5F2EB] drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] break-words leading-tight"
              style={{ fontFamily: TITLE_FONT }}
            >
              {data.couple.groomName}
            </h1>
            <span
              className="my-1 block text-lg sm:text-xl font-serif italic text-[#E5A93B]"
              aria-hidden="true"
            >
              &amp;
            </span>
            <h1
              className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wider text-[#F5F2EB] drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] break-words leading-tight"
              style={{ fontFamily: TITLE_FONT }}
            >
              {data.couple.brideName}
            </h1>
          </div>
          <p
            className="pt-2 text-[10px] tracking-[0.25em] text-[#16A37A] uppercase font-mono font-bold"
          >
            HONG KONG CINEMA · SPECIAL EDITION
          </p>
        </div>

        {/* Lời mời cá nhân hóa tên khách (nếu có) */}
        {guestName && (
          <div className="mb-4 rounded-md border border-[#F5F2EB]/30 bg-[#0D0D10]/85 px-4 py-1.5 backdrop-blur-xs">
            <span className="text-[10px] tracking-[0.2em] text-[#C4BEB2] uppercase font-mono">
              KÍNH MỜI:{" "}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#E5A93B]">
              {guestName}
            </span>
          </div>
        )}

        {/* Đáy poster: TẤM VÉ RẠP PHIM CỔ ĐIỂN TƯƠNG TÁC (cinema_ticket.webp) */}
        <div className="relative mt-2 w-full max-w-[320px] sm:max-w-[340px]">
          {/* Nền vé phim */}
          <div className="relative overflow-hidden rounded-xl bg-transparent shadow-[0_12px_28px_rgba(0,0,0,0.85)]">
            <img
              src="/templates/da-anh-huong-cang/cinema_ticket.webp"
              alt="Hong Kong Cinema Ticket"
              className="block h-auto w-full object-contain"
            />

            {/* Nội dung lồng bên trong thân vé */}
            <div className="absolute inset-0 flex items-center justify-between px-5 sm:px-6">
              {/* Thân vé bên trái */}
              <div className="text-left text-[#121214]">
                <p className="text-[9px] font-mono tracking-widest uppercase font-bold text-[#52525B]">
                  ADMIT ONE · CINEMA TICKET
                </p>
                <p className="mt-0.5 text-xs sm:text-sm font-extrabold tracking-tight uppercase text-[#141418]" style={{ fontFamily: TITLE_FONT }}>
                  {data.couple.groomName} &amp; {data.couple.brideName}
                </p>
                <p className="text-[10px] font-mono font-semibold text-[#C81E2B]">
                  NO. 1990-HK-LOVE
                </p>
              </div>

              {/* Cuống vé bên phải với nút XÉ VÉ VÀO RẠP */}
              <m.div
                className="shrink-0"
                animate={
                  isTearing
                    ? {
                      y: 40,
                      rotate: 8,
                      opacity: 0,
                    }
                    : {}
                }
                transition={{ duration: 0.4, ease: "easeIn" }}
              >
                <button
                  type="button"
                  onClick={handleTearTicket}
                  disabled={isTearing || isSlidingUp}
                  className="group relative cursor-pointer overflow-hidden rounded-lg border border-[#C81E2B] bg-[#C81E2B] px-3.5 py-2 text-[10px] sm:text-[11px] font-bold tracking-wider text-white uppercase shadow-md transition-all hover:bg-[#A61621] active:scale-95 disabled:pointer-events-none"
                >
                  <span className="flex items-center gap-1">
                    <Ticket className="h-3.5 w-3.5" />
                    <span>XÉ VÉ VÀO RẠP</span>
                  </span>
                </button>
              </m.div>
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
}

/* ------------------------------------------------------------
   MAIN COMPONENT: DẠ ẢNH HƯƠNG CẢNG
   ------------------------------------------------------------ */
export function DaAnhHuongCangTemplate({
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

  // Hook tương tác Hộp Thiếc Hương Cảng (3 trạng thái: normal -> glow -> open)
  const {
    stage: tinStage,
    isOpening: isTinOpening,
    isModalOpen: isGiftModalOpen,
    handleGiftClick,
    handleCloseModal,
  } = useGiftBoxInteraction({
    sfxType: "tin-vhs",
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
        "relative w-full overflow-x-hidden text-[#121214]",
        !coverGone ? (contained ? "h-full overflow-hidden" : "h-screen-dvh min-h-screen-dvh overflow-hidden") : "",
      )}
      style={{
        backgroundColor: ZINE_PAPER_BG,
        fontFamily: BODY_FONT,
      }}
    >
      {/* ---------------- MÀN HÌNH BÌA POSTER ---------------- */}
      {!coverGone && (
        <div className="absolute inset-0 z-40 h-full w-full">
          <DaAnhCover
            data={data}
            guestName={guestName}
            contained={contained}
            onOpen={handleOpenCover}
          />
        </div>
      )}

      {/* ---------------- THÂN THIỆP DẠ ẢNH HƯƠNG CẢNG ---------------- */}
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
            title={data.music.title || "Bản Tình Ca Dạ Ảnh"}
            visible={coverGone}
            tone="ruby"
          />
        )}

        {/* CONTAINER CHÍNH CĂN GIỮA ĐIỆN THOẠI / DESKTOP */}
        <div className="mx-auto w-full max-w-[480px] sm:max-w-[540px] px-4 py-8 space-y-12 sm:space-y-16">

          {/* =========================================================
              PHẦN 1: HERO KHUNG PHIM 35MM ĐIỆN ẢNH (film_frame_35mm)
              - Lồng ảnh cưới chính ở trung tâm
              - Góc trên: SAVE THE DATE / Tên cặp đôi 3 dòng
              - Góc phải: Triện đỏ stamp_song_hy.webp
              - Tuyệt đối KHÔNG lặp lại ngày cưới ở Hero
              ========================================================= */}
          <section className="relative pt-4 text-center">
            {/* Nhãn chính thức công chiếu */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#141418]/30 bg-[#FFFFFF] px-3.5 py-1 shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C81E2B]" />
              <span
                className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#C81E2B] uppercase"
                style={{ fontFamily: MONO_FONT }}
              >
                CHÍNH THỨC CÔNG CHIẾU
              </span>
            </div>

            {/* Poster Khung Phim 35mm chuẩn CSS/SVG không che mặt nhân vật */}
            <div className="relative mx-auto mt-6 w-full max-w-[340px] sm:max-w-[380px]">
              <FilmFrame35mm
                src={data.photos?.heroUrl || galleryPhotos[0]?.url || "/photos/hero2.webp"}
                alt={data.photos?.heroAlt || `Ảnh cưới ${data.couple.groomName} và ${data.couple.brideName}`}
                aspectRatio="4/5"
                stampSrc="/templates/da-anh-huong-cang/stamp_song_hy.webp"
                stampAlt="Dấu Triện Song Hỷ"
                stampPosition="top-right"
                stampClassName="w-12 sm:w-14 drop-shadow-[0_4px_10px_rgba(200,30,43,0.5)]"
                filmBrand="KODAK VISION3 500T"
                frameCode="FRAME #24A"
                borderColor="border-[#141418]/60"
                accentColor="text-[#E5A93B]"
              />
            </div>

            {/* Tên cặp đôi 3 dòng phong cách Tạp chí / Bìa phim */}
            <div className="mt-8 space-y-1">
              <p className="text-[11px] tracking-[0.25em] text-[#52525B] uppercase font-mono font-semibold">
                THE WEDDING STORY OF
              </p>
              <h2
                className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-[#121214] break-words leading-tight"
                style={{ fontFamily: TITLE_FONT }}
              >
                {data.couple.groomName}
              </h2>
              <span className="block text-xl font-serif italic text-[#C81E2B]" aria-hidden="true">
                &amp;
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-[#121214] break-words leading-tight"
                style={{ fontFamily: TITLE_FONT }}
              >
                {data.couple.brideName}
              </h2>
            </div>

            {/* Lời dẫn duyên dáng chất điện ảnh */}
            <p className="mx-auto mt-4 max-w-sm text-xs sm:text-sm leading-relaxed text-[#52525B] italic">
              “Chúng ta gặp nhau giữa thành phố neon rực rỡ, đi qua những cơn mưa đêm, để rồi nhận ra người kia chính là thước phim đẹp nhất của đời mình.”
            </p>
          </section>

          {/* =========================================================
              PHẦN 2: DẢI CHỮ DỌC "ABOUT US" & CẶP ĐÔI ĐỐI ĐẦU "VS" (family, couple: true)
              - 2 ảnh Polaroid nghiêng đối xứng (-4deg & +4deg)
              - Biểu tượng mực tàu brush_vs.webp ở giữa
              - Tên song thân Nhà Trai & Nhà Gái tách 2 dòng sạch sẽ không dính '&', không "Thân sinh:"
              ========================================================= */}
          {!hidden.has("family") && (
            <section style={{ order: orderOf("family") }} className="space-y-6">
              <div className="text-center">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#C81E2B] uppercase" style={{ fontFamily: MONO_FONT }}>
                  EDITORIAL · HỒ SƠ NHÂN VẬT
                </span>
                <h3 className="mt-1 text-2xl font-bold uppercase tracking-wider text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                  HAI BÊN GIA ĐÌNH
                </h3>
              </div>

              {/* Khối Cặp Đôi Đối Đầu: 2 Polaroid nghiêng + Chữ Mực Tàu VS ở giữa */}
              <div className="relative rounded-2xl border-2 border-[#141418] bg-[#FFFFFF] p-6 shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
                  {/* Polaroid Chú Rể (Nghiêng -4deg) */}
                  <div className="flex flex-col items-center text-center transform -rotate-3 transition-transform hover:rotate-0">
                    <div className="w-36 sm:w-40 rounded-lg border-2 border-[#141418] bg-[#F5F2EB] p-2.5 pb-4 shadow-md">
                      <div className="aspect-[4/5] w-full overflow-hidden rounded bg-[#141418]">
                        <img
                          src={data.photos?.groomUrl || "/photos/portrait_cr.webp"}
                          alt="Ảnh Chú Rể"
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <p className="mt-2 text-[10px] font-mono font-bold tracking-widest text-[#C81E2B] uppercase">
                        {data.couple.groomTitle || "TRƯỞNG NAM"}
                      </p>
                      <h4 className="text-sm font-extrabold uppercase text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                        {data.couple.groomName}
                      </h4>
                    </div>
                  </div>

                  {/* Biểu tượng Mực Tàu VS ở giữa */}
                  <div className="my-2 sm:my-0 flex shrink-0 items-center justify-center">
                    <img
                      src="/templates/da-anh-huong-cang/brush_vs.webp"
                      alt="VS"
                      className="h-auto w-16 sm:w-20 drop-shadow-md"
                    />
                  </div>

                  {/* Polaroid Cô Dâu (Nghiêng +4deg) */}
                  <div className="flex flex-col items-center text-center transform rotate-3 transition-transform hover:rotate-0">
                    <div className="w-36 sm:w-40 rounded-lg border-2 border-[#141418] bg-[#F5F2EB] p-2.5 pb-4 shadow-md">
                      <div className="aspect-[4/5] w-full overflow-hidden rounded bg-[#141418]">
                        <img
                          src={data.photos?.brideUrl || "/photos/portrait_cd.webp"}
                          alt="Ảnh Cô Dâu"
                          className="h-full w-full object-cover object-center"
                        />
                      </div>
                      <p className="mt-2 text-[10px] font-mono font-bold tracking-widest text-[#C81E2B] uppercase">
                        {data.couple.brideTitle || "ÁI NỮ"}
                      </p>
                      <h4 className="text-sm font-extrabold uppercase text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                        {data.couple.brideName}
                      </h4>
                    </div>
                  </div>
                </div>

                {/* Khối thông tin song thân hai bên Nhà Trai & Nhà Gái */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 border-dashed border-[#141418]/20 pt-4 text-xs leading-relaxed text-[#52525B]">
                  <div className="rounded-lg bg-[#F5F2EB] p-3 text-center sm:text-left">
                    <p className="font-bold text-[#C81E2B] tracking-wider uppercase font-mono mb-1">
                      NHÀ TRAI
                    </p>
                    {groomParentsList.map((pName, pIdx) => (
                      <p key={pIdx} className="font-medium text-[#121214]">{pName}</p>
                    ))}
                  </div>

                  <div className="rounded-lg bg-[#F5F2EB] p-3 text-center sm:text-left">
                    <p className="font-bold text-[#C81E2B] tracking-wider uppercase font-mono mb-1">
                      NHÀ GÁI
                    </p>
                    {brideParentsList.map((pName, pIdx) => (
                      <p key={pIdx} className="font-medium text-[#121214]">{pName}</p>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 3: LỊCH CÔNG CHIẾU & TIỆC ĐÊM NEON (calendar, map)
              * LẦN 1 XUẤT HIỆN NGÀY CƯỚI: Thẻ Tiệc Đêm Neon
              * LẦN 2 XUẤT HIỆN NGÀY CƯỚI: Bảng Lịch Báo In Báo Hương Cảng
              ========================================================= */}
          {(!hidden.has("calendar") || !hidden.has("map")) && visibleEvents.length > 0 && (
            <section style={{ order: orderOf("calendar") }} className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                  LỊCH TRÌNH NGÀY VUI
                </h3>
              </div>

              {/* THẺ TIỆC ĐÊM NEON (Hỗ trợ 1..N buổi lễ) */}
              <div className="relative overflow-hidden rounded-2xl border-2 border-[#141418] bg-[#0D0D10] p-5 sm:p-6 text-[#F5F2EB] shadow-xl">
                {/* Nền đêm neon mờ phía sau */}
                <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
                  <img
                    src="/templates/da-anh-huong-cang/bg_hk_neon.webp"
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-[#0D0D10] via-[#0D0D10]/80 to-transparent" />

                {/* Danh sách thẻ sự kiện: 1 thẻ căn giữa max-w-xl, 2+ thẻ chia grid 2 cột */}
                <div className={visibleEvents.length > 1 ? "relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4" : "relative z-10 max-w-xl mx-auto space-y-4"}>
                  {visibleEvents.map((evt, idx) => {
                    const evtDateParts = formatWeddingDateParts(evt.startsAt);
                    const evtLunarStr = formatLunarDateClean(evt.lunarDate);
                    const directionsUrl = getEventDirectionsUrl(evt);

                    return (
                      <div
                        key={evt.id || idx}
                        className="rounded-xl border border-[#141418] bg-[#F3EFE6]/95 p-5 text-[#121214] shadow-lg backdrop-blur-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between border-b border-[#141418]/20 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-[#C81E2B]" />
                              <span className="text-xs font-bold tracking-[0.2em] text-[#C81E2B] uppercase" style={{ fontFamily: MONO_FONT }}>
                                {evt.title || `LỄ HÔN PHỐI #${idx + 1}`}
                              </span>
                            </div>
                          </div>

                          {/* Khối Ngày / Tháng lớn bên trái + Địa điểm bên phải */}
                          <div className="my-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            {/* Ngày tháng lớn */}
                            <div className="flex items-baseline gap-2 text-center sm:text-left">
                              <span className="text-4xl sm:text-5xl font-black text-[#141418] tracking-tight" style={{ fontFamily: TITLE_FONT }}>
                                {evtDateParts?.day}
                              </span>
                              <div className="leading-tight">
                                <p className="text-xs font-bold tracking-wider text-[#C81E2B] uppercase">
                                  THÁNG {evtDateParts?.month}
                                </p>
                                <p className="text-xs text-[#52525B] font-mono">
                                  NĂM {evtDateParts?.year}
                                </p>
                                <p className="text-[11px] font-semibold text-[#141418]">
                                  {evtDateParts?.weekday} · {evtDateParts?.time || "11:00"}
                                </p>
                              </div>
                            </div>

                            {/* Địa điểm tiệc */}
                            <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-[#141418]/15 pt-3 sm:pt-0 sm:pl-4">
                              <p className="text-xs font-bold uppercase tracking-wider text-[#141418]">
                                {evt.venueName || "TRUNG TÂM HỘI NGHỊ TIỆC CƯỚI"}
                              </p>
                              <p className="mt-0.5 text-xs text-[#52525B] leading-relaxed">
                                {evt.venueAddress || "TP. Hồ Chí Minh"}
                              </p>
                            </div>
                          </div>

                          {evtLunarStr && (
                            <p className="text-center text-[11px] text-[#52525B] italic">
                              ({evtLunarStr})
                            </p>
                          )}
                        </div>

                        {/* Nút chỉ đường Google Maps */}
                        {!hidden.has("map") && (
                          <div className="mt-4 flex justify-center pt-2">
                            <a
                              href={directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border border-[#141418] bg-[#C81E2B] px-4 py-2 text-xs font-bold tracking-wider text-white shadow-sm transition-colors hover:bg-[#A61621]"
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
                <div className="relative z-10 mt-5 grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "NGÀY", val: timeLeft.days },
                    { label: "GIỜ", val: timeLeft.hours },
                    { label: "PHÚT", val: timeLeft.minutes },
                    { label: "GIÂY", val: timeLeft.seconds },
                  ].map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-[#F5F2EB]/30 bg-[#0D0D10]/90 py-2">
                      <p className="text-lg sm:text-xl font-bold text-[#E5A93B] font-mono leading-none">
                        {String(item.val).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-[9px] font-semibold tracking-wider text-[#C4BEB2]" style={{ fontFamily: MONO_FONT }}>
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* BẢNG LỊCH THÁNG PHONG CÁCH BÁO IN (Lần 2 xuất hiện ngày cưới) */}
              {!hidden.has("calendar") && dateParts && (
                <div className="rounded-2xl border-2 border-[#141418] bg-[#FFFFFF] p-5 text-[#121214] shadow-md">
                  <div className="mb-4 flex items-center justify-between border-b-2 border-[#141418] pb-2">
                    <span className="text-xs font-bold tracking-[0.2em] text-[#141418] uppercase" style={{ fontFamily: MONO_FONT }}>
                      LỊCH THÁNG
                    </span>
                    <span className="text-xs font-extrabold uppercase text-[#C81E2B]" style={{ fontFamily: TITLE_FONT }}>
                      THÁNG {dateParts.month} / {dateParts.year}
                    </span>
                  </div>

                  {/* Lưới các thứ trong tuần */}
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-[#52525B] uppercase mb-2">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, idx) => (
                      <div key={idx} className="py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Lưới các ô ngày báo in */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                    {(() => {
                      const year = parseInt(dateParts.year, 10);
                      const month = parseInt(dateParts.month, 10);
                      const eventDays = new Set(
                        visibleEvents.map((evt) => {
                          const p = formatWeddingDateParts(evt.startsAt);
                          return parseInt(p.day, 10);
                        })
                      );

                      const firstDay = new Date(year, month - 1, 1).getDay();
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
                                ? "border-[#C81E2B] bg-[#C81E2B] text-white font-extrabold shadow-md scale-105"
                                : "border-[#141418]/20 bg-[#F5F2EB] text-[#121214]",
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
              PHẦN 4: BẢNG MÀU THẢM ĐỎ - DRESS CODE (dresscode)
              * Dải phim kiểm màu 35mm, hiển thị CHỈ các ô màu
              * TUYỆT ĐỐI KHÔNG hiển thị mã màu #XXXXXX
              ========================================================= */}
          {!hidden.has("dresscode") && dressColors.length > 0 && (
            <section style={{ order: orderOf("dresscode") }} className="space-y-4 text-center">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#C81E2B] uppercase" style={{ fontFamily: MONO_FONT }}>
                  DRESS CODE · BẢNG MÀU THẢM ĐỎ
                </span>
                <h3 className="mt-1 text-2xl font-bold uppercase tracking-wider text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                  BẢNG MÀU THẢM ĐỎ
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-xs text-[#52525B]">
                  Gợi ý sắc màu trang phục lịch thiệp để quý khách cùng hòa nhịp vào đêm tiệc điện ảnh.
                </p>
              </div>

              {/* Dải phim kiểm màu 35mm */}
              <div className="mx-auto flex max-w-xs items-center justify-center gap-4 rounded-xl border-2 border-[#141418] bg-[#0D0D10] p-4 shadow-md">
                {dressColors.map((hex, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <div
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg border-2 border-[#E5A93B] shadow-md transition-transform hover:scale-110"
                      style={{ backgroundColor: hex }}
                      aria-label={`Dress Code Swatch ${idx + 1}`}
                    />
                    <span className="text-[9px] font-mono font-bold tracking-widest text-[#E5A93B] uppercase">
                      CODE {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 5: CUỘN PHIM 35MM & LIGHTBOX (album, albumQr)
              * Dải phim nhựa đen đục lỗ răng cưa hai mép
              * Chạm vào mở Lightbox portal
              ========================================================= */}
          {!hidden.has("album") && galleryPhotos.length > 0 && (
            <section style={{ order: orderOf("album") }} className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                  THƯỚC PHIM
                </h3>
              </div>

              {/* Dải phim đen đục lỗ 2 mép */}
              <div className="overflow-hidden rounded-2xl border-2 border-[#141418] bg-[#0D0D10] p-4 text-white shadow-xl">
                {/* Lỗ đục phim mép trên */}
                <div className="mb-3 flex justify-between gap-1 overflow-hidden opacity-60">
                  {Array.from({ length: 14 }).map((_, idx) => (
                    <div key={idx} className="h-2.5 w-3.5 rounded-xs bg-[#F5F2EB]" />
                  ))}
                </div>

                {/* Lưới ảnh khung phim */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {galleryPhotos.map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      onClick={() => setLightboxIndex(idx)}
                      className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-lg border border-[#E5A93B]/40 bg-[#141418] shadow-md transition-all duration-300 hover:border-[#E5A93B]",
                        idx === 0 ? "col-span-2 aspect-[16/10]" : "aspect-[4/5]",
                      )}
                    >
                      <img
                        src={photo.url}
                        alt={photo.alt || `Cuộn phim #${idx + 1}`}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Lớp gradient viền */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0D0D10]/80 via-transparent to-transparent" />

                      {/* Mã khung phim 35mm góc dưới */}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded bg-[#0D0D10]/85 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-[#E5A93B]">
                        <Film className="h-3 w-3 text-[#E5A93B]" />
                        <span>KODAK · {String(idx + 1).padStart(2, "0")}A</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Lỗ đục phim mép dưới */}
                <div className="mt-3 flex justify-between gap-1 overflow-hidden opacity-60">
                  {Array.from({ length: 14 }).map((_, idx) => (
                    <div key={idx} className="h-2.5 w-3.5 rounded-xs bg-[#F5F2EB]" />
                  ))}
                </div>
              </div>

              {/* QR chia sẻ ảnh khách chụp (gói Pro/VIP) */}
              {data.plan !== "free" && !hidden.has("albumQr") && weddingSlug && (
                <div className="mt-6 flex justify-center border-t border-[#141418]/20 pt-6">
                  <GuestAlbumQr
                    slug={weddingSlug}
                    accentColor="#C81E2B"
                    textColor="#121214"
                    mutedColor="#52525B"
                  />
                </div>
              )}
            </section>
          )}

          {/* =========================================================
              PHẦN 6: HỘP THIẾC HƯƠNG CẢNG - MỪNG CƯỚI 3 TRẠNG THÁI (gift)
              * normal -> glow -> open (tin_3states)
              ========================================================= */}
          {!hidden.has("gift") && (
            <section style={{ order: orderOf("gift") }} className="space-y-4 text-center">
              <div>
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                  HỘP QUÀ
                </h3>
                <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#52525B]">
                  Sự hiện diện của Quý khách là điều tuyệt vời nhất trong suất chiếu đặc biệt này. Nếu ở xa không kịp ghé chung vui, Quý khách có thể gửi lời chúc qua chiếc hộp thiếc nhỏ bên dưới.
                </p>
              </div>

              {/* Nút Hộp Thiếc 3 Trạng Thái */}
              <div className="flex flex-col items-center justify-center pt-2">
                {/* Preload ảnh trạng thái open chống giật layout */}
                <img
                  src="/templates/da-anh-huong-cang/tin_open.webp"
                  className="hidden"
                  aria-hidden="true"
                  alt=""
                />

                <button
                  type="button"
                  onClick={handleGiftClick}
                  disabled={isTinOpening}
                  className="group relative flex cursor-pointer items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 disabled:pointer-events-none"
                  aria-label="Mở hộp thiếc mừng cưới"
                >
                  {/* Hào quang đỏ vàng phía sau hộp thiếc */}
                  <div
                    className="pointer-events-none absolute inset-0 -m-4 rounded-3xl bg-gradient-to-r from-[#C81E2B]/20 via-[#E5A93B]/30 to-[#C81E2B]/20 blur-xl transition-opacity duration-300"
                    style={{
                      opacity: tinStage === "open" || tinStage === "glow" ? 0.9 : 0.3,
                    }}
                    aria-hidden="true"
                  />

                  {/* Ảnh chiếc hộp thiếc 3 trạng thái căn đáy thẳng hàng */}
                  <div className="relative z-10 h-44 w-44 sm:h-48 sm:w-48">
                    <img
                      src={
                        tinStage === "open"
                          ? "/templates/da-anh-huong-cang/tin_open.webp"
                          : tinStage === "glow"
                            ? "/templates/da-anh-huong-cang/tin_glow.webp"
                            : "/templates/da-anh-huong-cang/tin_normal.webp"
                      }
                      alt="Hộp thiếc đỏ vàng Hương Cảng"
                      className="mx-auto block h-full w-full object-contain"
                    />
                  </div>
                </button>

                <p className="mt-3 text-[11px] font-bold tracking-[0.2em] text-[#C81E2B] uppercase" style={{ fontFamily: MONO_FONT }}>
                  {tinStage === "open" ? "HỘP THIẾC ĐÃ MỞ" : "CHẠM ĐỂ MỞ HỘP THIẾC"}
                </p>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 7: ĐẶT CHỖ & GỬI LỜI CHÚC (rsvp)
              * Đồng bộ 100% theme Zine báo in
              ========================================================= */}
          {!hidden.has("rsvp") && (
            <section style={{ order: orderOf("rsvp") }} className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                  XÁC NHẬN THAM DỰ
                </h3>
              </div>

              {/* Form RSVP bọc trong card Zine sáng viền mực đen */}
              <div
                className="overflow-hidden rounded-2xl border-2 border-[#141418] bg-[#FFFFFF] p-5 sm:p-6 shadow-md"
                style={{ colorScheme: "light" }}
              >
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="ruby"
                  customTheme={{
                    isDark: false,
                    wrap: "bg-transparent text-[#121214]",
                    heading: "text-[#C81E2B]",
                    card: "bg-[#FFFFFF] border-2 border-[#141418] text-[#121214] shadow-xs",
                    input: "bg-[#FFFFFF] border border-[#141418]/60 text-[#121214] focus:border-[#C81E2B]",
                    primaryBtn: "bg-[#C81E2B] text-white hover:bg-[#A61621] font-bold shadow-xs",
                    outlineBtn: "border border-[#141418] text-[#121214] hover:bg-[#141418]/10",
                    optionBg: "#FFFFFF",
                    optionColor: "#121214",
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
        <footer className="mt-16 border-t-2 border-[#141418] bg-[#0D0D10] py-10 text-center text-xs text-[#C4BEB2]">
          <div className="mx-auto max-w-sm px-4 space-y-2">
            <p className="text-sm font-bold uppercase tracking-widest text-[#F5F2EB]" style={{ fontFamily: TITLE_FONT }}>
              HẸN GẶP QUÝ KHÁCH TẠI BUỔI CÔNG CHIẾU
            </p>
            <p className="text-[11px] tracking-[0.2em] text-[#C81E2B] uppercase font-mono">
              A FILM BY LOVE · 35MM CINEMA
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
        tone="ruby"
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

export default DaAnhHuongCangTemplate;
