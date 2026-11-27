"use client";

import * as React from "react";
import Image from "next/image";
import {
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Camera,
  ChevronRight,
  Ticket,
} from "lucide-react";
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
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
import {
  HkCharacterFlipCards,
  HkCueSheetTimeline,
  HkExtendedFilmStrip,
  HkFilmStorySection,
  HkScratchDateCard,
  type HkStandardTheme,
} from "../shared/HongKongStandardBlocks";
import {
  HkVelvetCurtainOverlay,
  type HkRevealPhase,
} from "../shared/HongKongStandardCovers";
import type { WeddingTemplateProps } from "../types";

const DA_ANH_STANDARD_THEME: HkStandardTheme = {
  accent: "#E5A93B",
  accentLight: "#F5D082",
  crimson: "#C81E2B",
  surfaceBg: "#0D0D10",
  cardBg: "#16161C",
  cardBorder: "rgba(229, 169, 59, 0.42)",
  textPrimary: "#F5F2EB",
  textMuted: "#C4BEB2",
  foilStops: ["#9C6B1D", "#E5A93B", "#F6DA8D", "#C88A29", "#7F5312"],
};

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
  onRevealStart,
  onOpen,
}: {
  data: TemplateData;
  guestName: string | null;
  contained?: boolean;
  onRevealStart?: () => void;
  onOpen: () => void;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = React.useState<HkRevealPhase>("idle");
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const handleTearTicket = () => {
    if (phase !== "idle") return;
    playCoverSfx("cinema-ticket-curtain");

    if (reduce) {
      onRevealStart?.();
      setPhase("stage3");
      timersRef.current.push(setTimeout(() => onOpen(), 380));
      return;
    }

    // Pha 1 (0 - 880ms): Cuống vé xé đứt rơi nghiêng + Dấu son đỏ đóng sập xuống "ĐÃ SOÁT VÉ"
    setPhase("stage1");

    // Pha 2 (880 - 1840ms): Rèm nhung đỏ khép kín + Luồng sáng máy chiếu rọi đỉnh, bật Hero bên dưới
    timersRef.current.push(
      setTimeout(() => {
        onRevealStart?.();
        setPhase("stage2");
      }, 880),
    );

    // Pha 3 (1840 - 3000ms): Hai cánh rèm nhung đỏ viền vàng vén mở sang 2 bên để lộ Hero thật
    timersRef.current.push(
      setTimeout(() => {
        setPhase("stage3");
      }, 1840),
    );

    timersRef.current.push(
      setTimeout(() => {
        onOpen();
      }, 3000),
    );
  };

  const hidePosterBehindCurtain = phase === "stage2" || phase === "stage3";

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden px-4 select-none",
        contained ? "h-full min-h-full py-6" : "h-screen-dvh min-h-screen-dvh py-8",
      )}
      style={{ backgroundColor: hidePosterBehindCurtain ? "transparent" : NOIR_BG }}
    >
      {/* Lớp z-0: Nền đêm mưa neon Vương Gia Vệ */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-200",
          hidePosterBehindCurtain ? "opacity-0" : "opacity-100",
        )}
      >
        <img loading="eager" fetchPriority="high"
          src="/templates/da-anh-huong-cang/bg_hk_neon.webp"
          alt="Hong Kong Neon Rain Night"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Lớp z-[5]: Lớp phủ gradient tối hai mép + viền phim mỏng */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[5] transition-opacity duration-200",
          hidePosterBehindCurtain ? "opacity-0" : "opacity-100",
        )}
        style={{
          background:
            "linear-gradient(180deg, rgba(13,13,16,0.85) 0%, rgba(13,13,16,0.35) 45%, rgba(13,13,16,0.7) 75%, rgba(13,13,16,0.96) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Vũ đạo Standard 3 pha: Dấu son đỏ + Luồng sáng máy chiếu + Rèm nhung đỏ vén sang 2 bên */}
      <HkVelvetCurtainOverlay
        phase={phase}
        coupleLabel={`${data.couple.groomName} & ${data.couple.brideName}`}
        titleFont={TITLE_FONT}
        monoFont={MONO_FONT}
      />

      {/* Lớp z-20: Bố cục Poster căn giữa tuyệt đối */}
      <div
        className={cn(
          "relative z-20 mx-auto flex w-full max-w-[328px] sm:max-w-[380px] flex-col items-center text-center transition-opacity duration-200",
          hidePosterBehindCurtain ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
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
            <img loading="lazy" decoding="async"
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
            <img loading="lazy" decoding="async"
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
                  phase !== "idle"
                    ? {
                      x: 44,
                      y: 52,
                      rotate: 18,
                      opacity: 0,
                    }
                    : {}
                }
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                <button
                  type="button"
                  onClick={handleTearTicket}
                  disabled={phase !== "idle"}
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
    </div>
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
  const [isRevealing, setIsRevealing] = React.useState(false);
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
    sfxType: "tin-vhs-retro",
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
    setIsRevealing(false);
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
  const resolvedWeddingSlug = weddingSlug || data.weddingSlug;
  const order = data.sectionOrder?.length
    ? data.sectionOrder
    : CANONICAL_SECTION_ORDER;
  const orderOf = (key: string) => {
    const index = order.indexOf(key);
    return index < 0 ? 99 : index;
  };

  // Countdown timer logic
  const targetDate = React.useMemo(() => {
    const events = getVisibleEvents(data);
    const ev = getNearestUpcomingEvent(events, data.date);
    return new Date(ev.startsAt || data.date || "2027-03-20T10:00:00+07:00");
  }, [data]);
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
            onRevealStart={() => setIsRevealing(true)}
            onOpen={handleOpenCover}
          />
        </div>
      )}

      {/* ---------------- THÂN THIỆP DẠ ẢNH HƯƠNG CẢNG ---------------- */}
      <div
        className={cn(
          "relative z-10 w-full transition-all duration-700 ease-out",
          !coverGone && !isRevealing
            ? "hidden pointer-events-none opacity-0"
            : isRevealing
              ? "opacity-100 scale-[1.03]"
              : "opacity-100 scale-100",
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
        <div className="mx-auto flex w-full max-w-[480px] sm:max-w-[540px] flex-col gap-12 px-4 py-8 sm:gap-16">

          {/* =========================================================
              PHẦN 1: HERO KHUNG PHIM 35MM ĐIỆN ẢNH (film_frame_35mm)
              - Lồng ảnh cưới chính ở trung tâm
              - Góc trên: SAVE THE DATE / Tên cặp đôi 3 dòng
              - Góc phải: Triện đỏ stamp_song_hy.webp
              - Tuyệt đối KHÔNG lặp lại ngày cưới ở Hero
              ========================================================= */}
          <section style={{ order: -1 }} className="relative pt-4 text-center">
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
                src={data.photos?.heroUrl || galleryPhotos[0]?.url || "/demo/hongkong/01_hero_neon_street.webp"}
                alt={data.photos?.heroAlt || `Ảnh cưới ${data.couple.groomName} và ${data.couple.brideName}`}
                aspectRatio="4/5"
                stampSrc="/templates/da-anh-huong-cang/stamp_song_hy.webp"
                stampAlt="Dấu Triện Song Hỷ"
                stampPosition="top-right"
                stampClassName="w-12 sm:w-14 drop-shadow-[0_4px_10px_rgba(200,30,43,0.5)]"
                borderColor="border-[#141418]/60"
                accentColor="text-[#E5A93B]"
              />
            </div>

            {/* Tên cặp đôi 3 dòng phong cách Tạp chí */}
            <div className="mt-8 space-y-1">
              <p className="text-[11px] tracking-[0.25em] text-[#52525B] uppercase font-mono font-semibold">
                {data.ui?.invitePrefix || "TRÂN TRỌNG KÍNH MỜI"}
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
              {dateParts?.dotDate && (
                <p className="pt-2 text-xs font-bold tracking-[0.24em] text-[#C81E2B] uppercase font-mono">
                  {dateParts.dotDate}
                </p>
              )}
            </div>

            {/* Lời dẫn duyên dáng */}
            <p className="mx-auto mt-4 max-w-sm text-xs sm:text-sm leading-relaxed text-[#52525B] italic">
              “{data.quote?.trim() || "Chúng ta gặp nhau giữa thành phố neon rực rỡ, đi qua những cơn mưa đêm, để rồi nhận ra người kia chính là thước phim đẹp nhất của đời mình."}”
            </p>
          </section>

          {/* =========================================================
              PHẦN 2: HỒ SƠ NHÂN VẬT LẬT THẺ 3D & HAI BÊN GIA ĐÌNH (family)
              ========================================================= */}
          {!hidden.has("family") && (
            <section style={{ order: orderOf("family") }} className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                  HAI BÊN GIA ĐÌNH
                </h3>
              </div>

              <HkCharacterFlipCards
                theme={DA_ANH_STANDARD_THEME}
                data={data}
                groomPhotoFallback="/demo/hongkong/02_groom_solo_mercedes.webp"
                bridePhotoFallback="/demo/hongkong/03_bride_solo_neon_lounge.webp"
                groomBadge="CHÚ RỂ"
                brideBadge="CÔ DÂU"
              />
            </section>
          )}

          {/* =========================================================
              PHẦN 4 (STANDARD): CHUYỆN CHÚNG MÌNH (story)
              ========================================================= */}
          {!hidden.has("story") && (
            <section style={{ order: orderOf("story") }}>
              <HkFilmStorySection
                theme={DA_ANH_STANDARD_THEME}
                data={data}
                galleryPhotos={galleryPhotos}
                heading="CHUYỆN CHÚNG MÌNH"
                eyebrow=""
                onPhotoClick={(idx) => setLightboxIndex(idx)}
              />
            </section>
          )}

          {/* =========================================================
              PHẦN 3: LỄ CƯỚI & SỰ KIỆN (map)
              ========================================================= */}
          {!hidden.has("map") && visibleEvents.length > 0 && (
            <section style={{ order: orderOf("map") }} className="space-y-5">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                  LỄ CƯỚI &amp; SỰ KIỆN
                </h3>
              </div>

              <div className="relative overflow-hidden rounded-2xl border-2 border-[#141418] bg-[#0D0D10] p-5 sm:p-6 text-[#F5F2EB] shadow-xl">
                <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
                  <img loading="lazy" decoding="async"
                    src="/templates/da-anh-huong-cang/bg_hk_neon.webp"
                    alt=""
                    aria-hidden="true"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-[#0D0D10] via-[#0D0D10]/80 to-transparent" />

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

                          <div className="my-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 6: LỊCH CƯỚI & ĐẾM NGƯỢC (calendar)
              ========================================================= */}
          {!hidden.has("calendar") && (
            <section style={{ order: orderOf("calendar") }} className="space-y-6">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                  NGÀY CHUNG ĐÔI
                </h3>
              </div>

              {dateParts && (
                <HkScratchDateCard
                  theme={DA_ANH_STANDARD_THEME}
                  eyebrow=""
                  foilHeading="CÀO NHŨ MỞ NGÀY CƯỚI"
                  weekday={dateParts.weekday}
                  time={dateParts.time}
                  day={dateParts.day}
                  month={dateParts.month}
                  year={dateParts.year}
                  lunarStr={lunarStr}
                  venueName={targetEvent.venueName}
                />
              )}

              <div className="rounded-2xl border-2 border-[#141418] bg-[#0D0D10] p-4 shadow-xl">
                <div className="grid grid-cols-4 gap-2 text-center">
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
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                  LỊCH TRÌNH &amp; TRANG PHỤC
                </h3>
              </div>

              {/* Dải phim kiểm màu 35mm */}
              <div className="mx-auto flex max-w-xs items-center justify-center gap-4 rounded-xl border-2 border-[#141418] bg-[#0D0D10] p-4 shadow-md">
                {dressColors.map((hex, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-lg border-2 border-[#E5A93B] shadow-md transition-transform hover:scale-110"
                      style={{ backgroundColor: hex }}
                      aria-label={`Dress Code Swatch ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>

              <HkCueSheetTimeline theme={DA_ANH_STANDARD_THEME} data={data} />
            </section>
          )}

          {/* =========================================================
              PHẦN 9: ALBUM ẢNH CƯỚI (album)
              ========================================================= */}
          {!hidden.has("album") && galleryPhotos.length > 0 && (
            <section style={{ order: orderOf("album") }} className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#121214]" style={{ fontFamily: TITLE_FONT }}>
                  ALBUM ẢNH CƯỚI
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

                {/* Lưới ảnh khung phim (5 ảnh nổi bật đầu tiên) */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {galleryPhotos.slice(0, 5).map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      onClick={() => setLightboxIndex(idx)}
                      className={cn(
                        "group relative cursor-pointer overflow-hidden rounded-lg border border-[#E5A93B]/40 bg-[#141418] shadow-md transition-all duration-300 hover:border-[#E5A93B]",
                        idx === 0 ? "col-span-2 aspect-[16/10]" : "aspect-[4/5]",
                      )}
                    >
                      <img decoding="async"
                        src={photo.url}
                        alt={photo.alt || `Ảnh cưới #${idx + 1}`}
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
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

              <HkExtendedFilmStrip
                theme={DA_ANH_STANDARD_THEME}
                photos={galleryPhotos}
                onPhotoClick={(realIdx) => setLightboxIndex(realIdx)}
              />
            </section>
          )}

          {/* =========================================================
              PHẦN 10: QR ALBUM CHIA SẺ ẢNH TIỆC CƯỚI (albumQr)
              ========================================================= */}
          {data.plan !== "free" && !hidden.has("albumQr") && resolvedWeddingSlug && (
            <section style={{ order: orderOf("albumQr") }} className="flex justify-center pt-2">
              <GuestAlbumQr
                slug={resolvedWeddingSlug}
                accentColor="#C81E2B"
                textColor="#121214"
                mutedColor="#52525B"
              />
            </section>
          )}

          {/* =========================================================
              PHẦN 7: HỘP THIẾC HƯƠNG CẢNG - MỪNG CƯỚI 3 TRẠNG THÁI (gift)
              ========================================================= */}
          {!hidden.has("gift") && (
            <section
              style={{ order: orderOf("gift") }}
              className="relative overflow-hidden rounded-2xl border-2 border-[#1E1E24] bg-[#0E0F12] p-6 text-center text-[#F5F2EB] shadow-2xl"
            >
              {/* Ánh sáng spotlight điện ảnh Hồng Kông */}
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#C81E2B]/15 via-transparent to-transparent"
                aria-hidden="true"
              />

              <div className="relative z-10 space-y-4">
                <div>
                  <h3
                    className="text-2xl font-bold uppercase tracking-wider text-[#D4A359]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    HỘP MỪNG CƯỚI
                  </h3>
                </div>

                {/* Nút Hộp Thiếc 3 Trạng Thái */}
                <div className="flex flex-col items-center justify-center pt-2">
                  {/* Preload ảnh trạng thái open chống giật layout */}
                  <img loading="lazy" decoding="async"
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
                      <img loading="lazy" decoding="async"
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

                  <p className="mt-3 text-[11px] font-bold tracking-[0.2em] text-[#E5A93B] uppercase" style={{ fontFamily: MONO_FONT }}>
                    {tinStage === "open" ? "HỘP THIẾC ĐÃ MỞ" : "CHẠM ĐỂ MỞ HỘP THIẾC"}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 7: ĐẶT CHỖ & GỬI LỜI CHÚC (rsvp)
              * Đồng bộ 100% theme Zine báo in
              ========================================================= */}
          {!hidden.has("rsvp") && (
            <section style={{ order: orderOf("rsvp") }} className="space-y-4">
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
              HẸN GẶP QUÝ KHÁCH TẠI ĐÊM TIỆC CHUNG VUI
            </p>
            <p className="text-[10px] text-[#737882] pt-2">
              © {dateParts.year} {data.couple.groomName} &amp; {data.couple.brideName}
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
