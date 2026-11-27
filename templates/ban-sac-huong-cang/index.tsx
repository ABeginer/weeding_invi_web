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
  Tv,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playCoverSfx } from "@/lib/sfx";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import {
  getVisibleEvents,
  getNearestUpcomingEvent,
  getEventDirectionsUrl,
} from "@/lib/events";
import type { TemplateData, WeddingEvent, WeddingPlan } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import {
  HkCharacterFlipCards,
  HkCueSheetTimeline,
  HkExtendedFilmStrip,
  HkFilmStorySection,
  HkScratchDateCard,
  type HkStandardTheme,
} from "../shared/HongKongStandardBlocks";
import {
  HkCinemaShutterOverlay,
  type HkRevealPhase,
} from "../shared/HongKongStandardCovers";
import type { WeddingTemplateProps } from "../types";

const BAN_SAC_STANDARD_THEME: HkStandardTheme = {
  accent: "#DFC07C",
  accentLight: "#F2DCA8",
  crimson: "#8F1524",
  surfaceBg: "#0A0A0E",
  cardBg: "#121218",
  cardBorder: "rgba(223, 192, 124, 0.4)",
  textPrimary: "#F4F1EA",
  textMuted: "#A1A6B0",
  foilStops: ["#8C6F38", "#DFC07C", "#F6E4B4", "#C29C52", "#6E5224"],
};

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: BẢN SẮC HƯƠNG CẢNG (ban-sac-huong-cang)
   - Đen tuyền (nền chủ đạo): #070709 / #101014
   - Đỏ rượu vang (bề mặt nhấn, nút CTA): #6B0F1A / #8F1524 (hover #A81A2C)
   - Vàng champagne (tiêu đề TVB, khung viền, số đếm ngược): #DFC07C (sáng #F2DCA8)
   - Xanh neon (ánh viền điện ảnh tiết chế từ phố mưa đêm): #00D4AA / rgba(0, 212, 170, 0.35)
   - Xám khói (viền phụ, chú thích, lớp khói nhẹ): #737882 / #A1A6B0
   - Chữ chính trên nền tối: #F4F1EA (WCAG AA contrast)
   ============================================================ */

const NOIR_BLACK = "#070709";
const NOIR_CARD = "#101014";
const WINE_RED = "#8F1524";
const WINE_RED_DEEP = "#6B0F1A";
const WINE_RED_HOVER = "#A81A2C";

const CHAMPAGNE = "#DFC07C";
const CHAMPAGNE_LIGHT = "#F2DCA8";
const CHAMPAGNE_BORDER = "rgba(223, 192, 124, 0.4)";
const CHAMPAGNE_SUBTLE = "rgba(223, 192, 124, 0.18)";

const NEON_CYAN = "#00D4AA";
const NEON_CYAN_GLOW = "rgba(0, 212, 170, 0.35)";

const SMOKE_GREY = "#737882";
const SMOKE_LIGHT = "#A1A6B0";
const SMOKE_BORDER = "rgba(115, 120, 130, 0.35)";

const TEXT_LIGHT = "#F4F1EA";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const MONO_FONT = "ui-monospace, SFMono-Regular, \"Space Mono\", Menlo, monospace";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const DEFAULT_DRESS = ["#101014", "#8F1524", "#DFC07C"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

/* ------------------------------------------------------------
   Hiệu ứng Mưa Đêm Rơi Chéo & Khói Mờ Trôi Nhẹ
   - Tự động tắt khi bật prefers-reduced-motion
   ------------------------------------------------------------ */
function HongKongRainParticles({ count = 18 }: { count?: number }) {
  const reduce = useReducedMotion();
  const raindrops = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 16) % 96 + 2}%`,
      duration: 1.1 + (idx % 4) * 0.25,
      delay: (idx * 0.15) % 2,
      length: 22 + (idx % 3) * 8,
      opacity: 0.18 + (idx % 3) * 0.08,
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {raindrops.map((r) => (
        <m.div
          key={r.id}
          className="absolute w-[1px] bg-gradient-to-b from-transparent via-[#F4F1EA]/60 to-transparent"
          style={{
            left: r.left,
            top: "-15%",
            height: `${r.length}px`,
            opacity: r.opacity,
            transform: "rotate(15deg)",
          }}
          animate={{
            y: ["0%", "1200%"],
            x: ["0%", "80%"],
          }}
          transition={{
            duration: r.duration,
            delay: r.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------
   MÀN HÌNH BÌA POSTER PHỐ ĐÊM & HIỆU ỨNG MỞ "THE BIG DAY"
   - Phân tầng z-index chống mờ & responsive 360px
   - Bước A: VHS noise + scanline + camera flash (160ms)
   - Bước B: Hiện "THE BIG DAY" sắc lạnh trên nền đen tuyền
   ------------------------------------------------------------ */
function HongKongCover({
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

  const handleOpenClick = () => {
    if (phase !== "idle") return;
    playCoverSfx("cinema-clapper-35mm");

    if (reduce) {
      onRevealStart?.();
      setPhase("stage3");
      timersRef.current.push(setTimeout(() => onOpen(), 380));
      return;
    }

    // Pha 1 (0 - 800ms): Clapperboard sập xuống + Vòng lá khẩu máy ảnh chớp hổ phách
    setPhase("stage1");

    // Pha 2 (800 - 1840ms): 2 dải phim 35mm kẹp Widescreen + "THE BIG DAY" + bật Hero bên dưới
    timersRef.current.push(
      setTimeout(() => {
        onRevealStart?.();
        setPhase("stage2");
      }, 800),
    );

    // Pha 3 (1840 - 2960ms): 2 màn trập phim 35mm tách trên/dưới để lộ Hero thật
    timersRef.current.push(
      setTimeout(() => {
        setPhase("stage3");
      }, 1840),
    );

    timersRef.current.push(
      setTimeout(() => {
        onOpen();
      }, 2960),
    );
  };

  const hidePosterBehindShutters = phase === "stage2" || phase === "stage3";

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden px-4 select-none",
        contained ? "h-full min-h-full py-6" : "h-screen-dvh min-h-screen-dvh py-8",
      )}
      style={{ backgroundColor: hidePosterBehindShutters ? "transparent" : NOIR_BLACK }}
    >
      {/* Lớp z-0: Ảnh phố đêm mưa có chiếc Mercedes-Benz W126 sắc nét */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-200",
          hidePosterBehindShutters ? "opacity-0" : "opacity-100",
        )}
      >
        {/* Mobile background (mặc định và khi contained) */}
        <picture className="block h-full w-full">
          {!contained && (
            <source
              media="(min-width: 768px)"
              srcSet="/templates/ban-sac-huong-cang/bg_noir_desktop.webp"
            />
          )}
          <img loading="eager" fetchPriority="high"
            src="/templates/ban-sac-huong-cang/bg_noir_mobile.webp"
            alt="Hong Kong Noir Mercedes-Benz W126"
            className="h-full w-full object-cover object-center"
          />
        </picture>
      </div>

      {/* Lớp z-[5]: Gradient tối bầu trời + Mưa đêm mảnh + Khói mờ trôi nhẹ */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[5] transition-opacity duration-200",
          hidePosterBehindShutters ? "opacity-0" : "opacity-100",
        )}
        style={{
          background:
            "linear-gradient(180deg, rgba(7,7,9,0.85) 0%, rgba(7,7,9,0.3) 40%, rgba(7,7,9,0.6) 75%, rgba(7,7,9,0.95) 100%)",
        }}
        aria-hidden="true"
      />
      {!hidePosterBehindShutters && (
        <div className="z-[6] pointer-events-none absolute inset-0">
          <HongKongRainParticles count={20} />
        </div>
      )}

      {/* Lớp z-20: Khối Poster TVB 90s căn giữa tuyệt đối */}
      <div
        className={cn(
          "relative z-20 mx-auto flex w-full max-w-[328px] sm:max-w-[380px] flex-col items-center text-center transition-opacity duration-200",
          hidePosterBehindShutters ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-[#DFC07C]/40 bg-[#070709]/80 px-3.5 py-1 backdrop-blur-xs">
          <span
            className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] text-[#DFC07C] uppercase"
            style={{ fontFamily: MONO_FONT }}
          >
            Thiệp mời tham dự lễ cưới
          </span>
        </div>

        {/* Bầu trời trên: Tên cặp đôi 3 dòng khổ lớn */}
        <div className="mt-5 space-y-1">
          <div className="pt-1">
            <h1
              className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wider text-[#F4F1EA] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] break-words leading-tight"
              style={{ fontFamily: TITLE_FONT }}
            >
              {data.couple.groomName}
            </h1>
            <span
              className="my-1 block text-lg sm:text-xl font-serif italic text-[#DFC07C]"
              aria-hidden="true"
            >
              &amp;
            </span>
            <h1
              className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wider text-[#F4F1EA] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] break-words leading-tight"
              style={{ fontFamily: TITLE_FONT }}
            >
              {data.couple.brideName}
            </h1>
          </div>
          {/* Thanh gạch vàng champagne mảnh */}
          <div className="mx-auto mt-2 h-[1px] w-28 bg-gradient-to-r from-transparent via-[#DFC07C] to-transparent" />
        </div>

        {/* Lời mời cá nhân hóa tên khách (nếu có) */}
        {guestName ? (
          <div className="mt-6 rounded-md border border-[#DFC07C]/30 bg-[#101014]/90 px-4 py-2 backdrop-blur-xs">
            <p className="text-[10px] tracking-[0.2em] text-[#A1A6B0] uppercase" style={{ fontFamily: MONO_FONT }}>
              TRÂN TRỌNG KÍNH MỜI
            </p>
            <p className="mt-0.5 text-sm sm:text-base font-semibold text-[#DFC07C]" style={{ fontFamily: TITLE_FONT }}>
              {guestName}
            </p>
          </div>
        ) : (
          <p
            className="mt-6 text-xs tracking-[0.24em] text-[#A1A6B0] uppercase"
            style={{ fontFamily: BODY_FONT }}
          >
            TRÂN TRỌNG KÍNH MỜI
          </p>
        )}

        {/* Nút CTA MỞ THIỆP nền đỏ rượu vang viền vàng champagne */}
        <div className="mt-6 w-full max-w-[260px]">
          <button
            type="button"
            onClick={handleOpenClick}
            disabled={phase !== "idle"}
            className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-[#DFC07C]/70 bg-gradient-to-r from-[#6B0F1A] via-[#8F1524] to-[#6B0F1A] px-7 py-3 text-xs sm:text-sm font-bold tracking-[0.2em] text-[#F4F1EA] uppercase shadow-[0_0_20px_rgba(143,21,36,0.55)] transition-all duration-300 hover:border-[#DFC07C] hover:shadow-[0_0_28px_rgba(223,192,124,0.4)] active:scale-95 disabled:opacity-75"
          >
            {/* Vệt sáng lướt qua */}
            <span
              className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
              aria-hidden="true"
            />
            <Film className="h-4 w-4 text-[#DFC07C]" aria-hidden="true" />
            <span>MỞ THIỆP</span>
            <ChevronRight className="h-4 w-4 text-[#DFC07C] transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Vũ đạo Standard 3 pha: Clapperboard 35mm + Màn trập đục lỗ tách dọc lộ Hero */}
      <HkCinemaShutterOverlay
        phase={phase}
        coupleLabel={`${data.couple.groomName} & ${data.couple.brideName}`}
        titleFont={TITLE_FONT}
        monoFont={MONO_FONT}
      />
    </div>
  );
}

/* ------------------------------------------------------------
   THÂN THIỆP BẢN SẮC HƯƠNG CẢNG
   ------------------------------------------------------------ */
export function BanSacHuongCangTemplate({
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
  const [openState, setOpenState] = React.useState(isOpened);
  const [coverGone, setCoverGone] = React.useState(isOpened);
  const [isRevealing, setIsRevealing] = React.useState(false);
  const parentOpenedRef = React.useRef(isOpened);

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Gift Interaction (3 states: normal -> glow -> open)
  const {
    stage: giftStage,
    isModalOpen: isGiftModalOpen,
    setIsModalOpen: setIsGiftModalOpen,
    handleGiftClick,
    handleCloseModal: handleCloseGiftModal,
  } = useGiftBoxInteraction({
    sfxType: "artdeco-box-luxury",
    delayMs: 700,
  });

  // Đồng bộ 2 chiều với trang cha
  React.useEffect(() => {
    if (isOpened !== parentOpenedRef.current) {
      parentOpenedRef.current = isOpened;
      setOpenState(isOpened);
      if (isOpened) {
        setCoverGone(true);
      } else {
        setCoverGone(false);
      }
    }
  }, [isOpened]);

  const handleOpenInvitation = () => {
    setOpenState(true);
    setCoverGone(true);
    setIsRevealing(false);
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }

    if (!contained && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const targetDateStr = targetEvent.startsAt || data.date || "2027-03-20T10:00:00+07:00";
  const dateParts = formatWeddingDateParts(targetDateStr);
  const lunarClean = formatLunarDateClean(targetEvent.lunarDate);

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

  // Gallery items (Free max 5)
  const galleryPhotos = React.useMemo(() => {
    const raw = data.photos?.gallery ?? [];
    return data.plan === "free" ? raw.slice(0, 5) : raw;
  }, [data.photos?.gallery, data.plan]);

  // Dress code
  const dressColors = getDressColors(data);

  // Parents string formatting: Tách tại '&' thành 2 dòng riêng sạch sẽ, không ghi "Thân sinh:"
  const parseParents = (raw: string) => {
    if (!raw) return [];
    return raw
      .split("&")
      .map((part) => part.trim().replace(/^thân sinh:\s*/i, ""))
      .filter(Boolean);
  };
  const groomParentsList = parseParents(data.couple.groomParents);
  const brideParentsList = parseParents(data.couple.brideParents);

  // Countdown & Calendar calculation
  const targetDate = React.useMemo(() => {
    const events = getVisibleEvents(data);
    const ev = getNearestUpcomingEvent(events, data.date);
    return new Date(ev.startsAt || data.date || "2027-03-20T10:00:00+07:00");
  }, [data]);

  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  // Calendar Days Grid (Monday first)
  const { monthNum, yearNum, highlightDay, calendarDays } = React.useMemo(() => {
    const valid = !isNaN(targetDate.getTime());
    const mNum = valid ? targetDate.getMonth() + 1 : 3;
    const yNum = valid ? targetDate.getFullYear() : 2027;
    const hDay = valid ? targetDate.getDate() : 20;

    const firstDayOfWeek = new Date(yNum, mNum - 1, 1).getDay();
    const daysInMonth = new Date(yNum, mNum, 0).getDate();

    const days: (number | null)[] = [];
    const offset = (firstDayOfWeek + 6) % 7;
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return {
      monthNum: mNum,
      yearNum: yNum,
      highlightDay: hDay,
      calendarDays: days,
    };
  }, [targetDate]);

  return (
    <div
      className={cn(
        "relative w-full bg-[#070709] text-[#F4F1EA] selection:bg-[#8F1524]/40 selection:text-white",
        !coverGone && (contained ? "h-full overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden"),
      )}
      style={{ fontFamily: BODY_FONT }}
    >
      {/* --------------------------------------------------------
          LỚP 1: MÀN HÌNH BÌA POSTER PHỐ ĐÊM
          -------------------------------------------------------- */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            className="absolute inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
          >
            <HongKongCover
              data={data}
              guestName={guestName}
              contained={contained}
              onRevealStart={() => setIsRevealing(true)}
              onOpen={handleOpenInvitation}
            />
          </m.div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------
          LỚP 2: NÚT NHẠC NỀN NỔI
          -------------------------------------------------------- */}
      {!data.hiddenSections?.includes("music") && (
        <LiveMusicFloatingButton
          src={data.music?.src}
          title={data.music?.title || "Bản Tình Ca Hương Cảng"}
          visible={openState}
          tone="obsidian"
        />
      )}

      {/* --------------------------------------------------------
          LỚP 3: THÂN THIỆP NOIR CHÍNH (HIỆN KHI BÌA ĐÃ MỞ / ĐANG VÉN MÀN)
          -------------------------------------------------------- */}
      <div
        className={cn(
          "relative w-full transition-transform duration-700 ease-out",
          !openState && !isRevealing
            ? "hidden"
            : isRevealing
              ? "scale-[1.03]"
              : "scale-100",
        )}
      >
        {/* Nền phim trường tối & mưa đêm nhẹ */}
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#181822] via-[#070709] to-[#070709]" />
        <div className="pointer-events-none absolute inset-0 z-0 opacity-20">
          <HongKongRainParticles count={14} />
        </div>

        {/* CONTAINER CHÍNH */}
        <div className="relative z-10 mx-auto flex max-w-xl flex-col">
          {/* ========================================================
              SECTION 1: HERO POSTER PHIM XÃ HỘI ĐEN HONG KONG
              - Đỉnh treo biển neon neon_sign_noir.webp
              - Viewfinder CAM-01 · 24FPS · REC ●
              - Góc dưới: prop_sunglasses.webp & prop_red_chop.webp
              - TUYỆT ĐỐI KHÔNG lặp lại ngày cưới ở Hero!
              ======================================================== */}
          <section className="relative px-4 pt-10 pb-14 text-center">
            {/* Biển hiệu Neon chữ Hoa đỉnh khối */}
            <div className="mx-auto mb-6 flex justify-center max-w-[280px] sm:max-w-[340px]">
              <img decoding="async"
                src="/templates/ban-sac-huong-cang/neon_sign_noir.webp"
                alt="Hong Kong Neon Sign"
                className="h-auto w-full drop-shadow-[0_0_15px_rgba(0,212,170,0.45)]"
                loading="eager"
              />
            </div>

            {/* Khung Poster Ảnh Cặp Đôi Kiểu Camera Viewfinder */}
            <div className="relative mx-auto max-w-[340px] sm:max-w-[380px] rounded-lg border-2 border-[#DFC07C]/50 bg-[#101014] p-3 shadow-[0_0_30px_rgba(0,0,0,0.85)]">
              {/* Vạch ngắm góc Viewfinder */}
              <div className="pointer-events-none absolute top-1.5 left-1.5 h-3.5 w-3.5 border-t-2 border-l-2 border-[#DFC07C]" />
              <div className="pointer-events-none absolute top-1.5 right-1.5 h-3.5 w-3.5 border-t-2 border-r-2 border-[#DFC07C]" />
              <div className="pointer-events-none absolute bottom-1.5 left-1.5 h-3.5 w-3.5 border-b-2 border-l-2 border-[#DFC07C]" />
              <div className="pointer-events-none absolute bottom-1.5 right-1.5 h-3.5 w-3.5 border-b-2 border-r-2 border-[#DFC07C]" />

              {/* Nhãn góc trên */}
              <div className="mb-2 flex items-center justify-between gap-2 px-1 text-[9px] sm:text-[10px] tracking-[0.08em] text-[#A1A6B0]" style={{ fontFamily: MONO_FONT }}>
                <span className="text-[#DFC07C] uppercase">Thiệp mời tham dự lễ cưới</span>
                <span className="text-[#DFC07C]/80 shrink-0">
                  {dateParts.day}.{dateParts.month}.{dateParts.year}
                </span>
              </div>

              {/* Ảnh chính cặp đôi */}
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded bg-[#070709]">
                <img loading="lazy" decoding="async"
                  src={data.photos?.heroUrl || "/demo/hongkong/01_hero_neon_street.webp"}
                  alt={data.photos?.heroAlt || "Ảnh cưới cặp đôi"}
                  className="h-full w-full object-cover object-center filter contrast-105"
                />

                {/* Vạch kẻ phim & grain */}
                <div className="pointer-events-none absolute inset-0 border border-white/10" />
              </div>

              {/* Góc dưới điểm Kính râm đen & Dấu đỏ triện */}
              <div className="relative mt-3 flex items-center justify-between px-1">
                <img loading="lazy" decoding="async"
                  src="/templates/ban-sac-huong-cang/prop_sunglasses.webp"
                  alt="Boss Sunglasses"
                  className="h-7 w-auto drop-shadow-md"
                />
                <span className="text-[10px] tracking-[0.2em] text-[#A1A6B0] uppercase" style={{ fontFamily: MONO_FONT }}>
                  SCENE 01 · NOIR
                </span>
                <img loading="lazy" decoding="async"
                  src="/templates/ban-sac-huong-cang/prop_red_chop.webp"
                  alt="Red Chop Seal"
                  className="h-8 w-auto drop-shadow-md"
                />
              </div>
            </div>

            {/* Tiêu đề & Lời tựa (KHÔNG lặp lại ngày cưới) */}
            <div className="mt-8 space-y-3 px-4">
              <p
                className="text-xs font-bold tracking-[0.3em] text-[#DFC07C] uppercase"
                style={{ fontFamily: MONO_FONT }}
              >
                BẢN SẮC TÌNH YÊU
              </p>
              <h2
                className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-[#F4F1EA]"
                style={{ fontFamily: TITLE_FONT }}
              >
                {data.couple.groomName} &amp; {data.couple.brideName}
              </h2>

              {data.quote ? (
                <p className="mx-auto max-w-md text-xs sm:text-sm leading-relaxed text-[#A1A6B0] italic">
                  &ldquo;{data.quote}&rdquo;
                </p>
              ) : (
                <p className="mx-auto max-w-md text-xs sm:text-sm leading-relaxed text-[#A1A6B0] italic">
                  &ldquo;Giữa vạn dặm hồng trần và những đêm mưa Hương Cảng, chỉ cần một ánh mắt để nhận ra bến đỗ bình yên.&rdquo;
                </p>
              )}

              {dateParts?.dotDate && (
                <p className="text-xs font-bold tracking-[0.26em] text-[#DFC07C] uppercase" style={{ fontFamily: MONO_FONT }}>
                  {dateParts.dotDate}
                </p>
              )}
            </div>
          </section>

          {/* SẮP XẾP CÁC SECTION THEO ORDER */}
          <div className="flex flex-col">
            {/* ========================================================
                SECTION 2: NHÂN VẬT CHÍNH LẬT THẺ 3D & HAI GIA ĐÌNH
                ======================================================== */}
            {!hidden.has("family") && (
              <div style={{ order: orderOf("family") }} className="px-4 py-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F4F1EA]" style={{ fontFamily: TITLE_FONT }}>
                    HAI BÊN GIA ĐÌNH
                  </h3>
                </div>

                <div className="mt-6">
                  <HkCharacterFlipCards
                    theme={BAN_SAC_STANDARD_THEME}
                    data={data}
                    groomPhotoFallback="/demo/hongkong/02_groom_solo_mercedes.webp"
                    bridePhotoFallback="/demo/hongkong/03_bride_solo_neon_lounge.webp"
                    groomBadge="A ♠"
                    brideBadge="Q ♥"
                  />
                </div>

                {/* Quân Bài Tây A♠ Q♥ ở vị trí trung tâm nối hai người */}
                <div className="mt-6 flex items-center justify-center">
                  <div className="flex items-center gap-3 rounded-full border border-[#DFC07C]/30 bg-[#070709] px-4 py-1.5 shadow-md">
                    <img loading="lazy" decoding="async"
                      src="/templates/ban-sac-huong-cang/prop_playing_cards.webp"
                      alt="Playing Cards Ace and Queen"
                      className="h-8 w-auto"
                    />
                    <span className="text-xs font-semibold tracking-widest text-[#DFC07C]" style={{ fontFamily: MONO_FONT }}>
                      A♠ &amp; Q♥ · TRĂM NĂM ĐỊNH MỆNH
                    </span>
                  </div>
                </div>

                {/* Dải chuyển chương Zippo & Bao thuốc vintage */}
                <div className="mt-8 flex items-center justify-center gap-6 opacity-75">
                  <img loading="lazy" decoding="async"
                    src="/templates/ban-sac-huong-cang/prop_zippo.webp"
                    alt="Zippo Lighter"
                    className="h-10 w-auto"
                  />
                  <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#DFC07C]/50 to-transparent" />
                  <img loading="lazy" decoding="async"
                    src="/templates/ban-sac-huong-cang/prop_vintage_pack.webp"
                    alt="Vintage Cigarette Pack"
                    className="h-10 w-auto"
                  />
                </div>
              </div>
            )}

            {/* ========================================================
                SECTION 2B (STANDARD): CHUYỆN CHÚNG MÌNH CUỘN PHIM 35MM
                ======================================================== */}
            {!hidden.has("story") && (
              <div style={{ order: orderOf("story") }} className="px-4 py-8">
                <HkFilmStorySection
                  theme={BAN_SAC_STANDARD_THEME}
                  data={data}
                  galleryPhotos={galleryPhotos}
                  heading="CHUYỆN CHÚNG MÌNH"
                  eyebrow=""
                  onPhotoClick={(idx) => setLightboxIndex(idx)}
                />
              </div>
            )}

            {!hidden.has("calendar") && (
              <div style={{ order: orderOf("calendar") }} className="px-4 py-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F4F1EA]" style={{ fontFamily: TITLE_FONT }}>
                    NGÀY CHUNG ĐÔI
                  </h3>
                </div>

                {dateParts && (
                  <HkScratchDateCard
                    theme={BAN_SAC_STANDARD_THEME}
                    eyebrow=""
                    foilHeading="CÀO NHŨ MỞ NGÀY THÀNH HÔN"
                    weekday={dateParts.weekday}
                    time={dateParts.time}
                    day={dateParts.day}
                    month={dateParts.month}
                    year={dateParts.year}
                    lunarStr={lunarClean}
                    venueName={targetEvent.venueName}
                  />
                )}

                {/* TẤM VÉ CÁ CƯỢC CỔ ĐIỂN (Vị trí ngày cưới #1) */}
                <div className="relative mx-auto mt-6 max-w-md overflow-hidden rounded-xl border border-[#DFC07C]/40 bg-[#FAF7F0] text-[#1F1D1A] shadow-2xl">
                  {/* Ảnh nền vé cá cược giữ trọn viền răng cưa cổ điển */}
                  <div className="p-6 relative">
                    {/* Header vé cá cược */}
                    <div className="flex items-center justify-between border-b-2 border-dashed border-[#1F1D1A]/30 pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold tracking-[0.24em] text-[#8F1524] uppercase" style={{ fontFamily: MONO_FONT }}>
                          VÉ ĐẶT CƯỢC TRĂM NĂM
                        </span>
                        <p className="text-xs font-bold text-[#1F1D1A]">NO. 1980-LOVE-WIN</p>
                      </div>
                      <img loading="lazy" decoding="async"
                        src="/templates/ban-sac-huong-cang/prop_red_chop.webp"
                        alt="Official Seal"
                        className="h-10 w-auto"
                      />
                    </div>

                    {/* Nội dung ngày giờ chính trên vé */}
                    {dateParts && (
                      <div className="my-5 text-center">
                        <p className="text-xs font-semibold tracking-widest text-[#8F1524] uppercase" style={{ fontFamily: TITLE_FONT }}>
                          {dateParts.weekday} · {dateParts.time}
                        </p>
                        <div className="my-2 flex items-center justify-center gap-3">
                          <span className="text-4xl sm:text-5xl font-black text-[#1F1D1A]" style={{ fontFamily: TITLE_FONT }}>
                            {dateParts.day}
                          </span>
                          <div className="text-left font-bold text-xs uppercase leading-tight text-[#6B0F1A]">
                            <p>THÁNG {dateParts.month}</p>
                            <p>NĂM {dateParts.year}</p>
                          </div>
                        </div>
                        {lunarClean && (
                          <p className="text-xs text-[#555048] italic">
                            (Nhằm {lunarClean})
                          </p>
                        )}
                      </div>
                    )}

                    {/* Địa điểm trên vé */}
                    {visibleEvents.length > 0 && (
                      <div className="border-t-2 border-dashed border-[#1F1D1A]/30 pt-3 text-center text-xs text-[#1F1D1A] space-y-2">
                        {visibleEvents.map((evt, idx) => (
                          <div key={evt.id || idx} className="py-1">
                            <p className="font-bold uppercase tracking-wider text-[#8F1524]">
                              {evt.title || `TIỆC CƯỚI BẢN SẮC #${idx + 1}`}
                            </p>
                            <p className="mt-0.5 font-medium">{evt.venueName}</p>
                            <p className="text-[11px] text-[#555048]">{evt.venueAddress}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ĐỒNG HỒ ĐẾM NGƯỢC VỚI prop_watch.webp */}
                <div className="mt-10 rounded-xl border border-[#DFC07C]/30 bg-[#101014] p-6 text-center shadow-lg">
                  <div className="flex items-center justify-center gap-2">
                    <img loading="lazy" decoding="async"
                      src="/templates/ban-sac-huong-cang/prop_watch.webp"
                      alt="Vintage Watch"
                      className="h-8 w-auto"
                    />
                    <p className="text-xs font-bold tracking-[0.24em] text-[#DFC07C] uppercase" style={{ fontFamily: MONO_FONT }}>
                      COUNTDOWN · THỜI GIAN ĐẾM NGƯỢC
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2.5 sm:gap-4 max-w-sm mx-auto">
                    {[
                      { label: "NGÀY", value: timeLeft.days },
                      { label: "GIỜ", value: timeLeft.hours },
                      { label: "PHÚT", value: timeLeft.minutes },
                      { label: "GIÂY", value: timeLeft.seconds },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-[#DFC07C]/30 bg-[#070709] py-3 text-center shadow-inner"
                      >
                        <span
                          className="block text-2xl sm:text-3xl font-extrabold text-[#DFC07C]"
                          style={{ fontFamily: MONO_FONT }}
                        >
                          {String(item.value).padStart(2, "0")}
                        </span>
                        <span className="mt-1 block text-[9px] font-semibold tracking-wider text-[#A1A6B0] uppercase">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BẢNG LỊCH THÁNG NOIR (Vị trí ngày cưới #2) */}
                <div className="mt-8 rounded-xl border border-[#DFC07C]/35 bg-[#101014] p-6 text-center shadow-lg max-w-md mx-auto">
                  <p className="text-xs font-bold tracking-[0.2em] text-[#DFC07C] uppercase" style={{ fontFamily: MONO_FONT }}>
                    LỊCH THÁNG {monthNum} · NĂM {yearNum}
                  </p>

                  <div className="mt-4 grid grid-cols-7 gap-1.5 text-xs">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dayName) => (
                      <span key={dayName} className="py-1 font-bold text-[#A1A6B0]">
                        {dayName}
                      </span>
                    ))}
                    {(() => {
                      const eventDays = new Set(
                        visibleEvents.map((evt) => parseInt(formatWeddingDateParts(evt.startsAt).day, 10))
                      );
                      return calendarDays.map((day, idx) => {
                        if (!day) return <span key={idx} className="py-2" />;
                        const isTarget = eventDays.has(day);
                        return (
                          <div key={idx} className="flex items-center justify-center py-1">
                            <span
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                                isTarget
                                  ? "bg-[#8F1524] text-white font-bold ring-2 ring-[#DFC07C] shadow-[0_0_10px_rgba(223,192,124,0.5)]"
                                  : "text-[#F4F1EA]/80 hover:bg-white/5",
                              )}
                            >
                              {day}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                SECTION: ĐIỂM HẸN PHỐ ĐÊM & BẢN ĐỒ CHỈ ĐƯỜNG
                - Kèm Taxi Hong Kong & Điện thoại bàn retro (Hỗ trợ 1..N lễ)
                ======================================================== */}
            {!hidden.has("map") && visibleEvents.length > 0 && (
              <div style={{ order: orderOf("map") }} className="px-4 py-8">
                <div className={visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "max-w-xl mx-auto space-y-4"}>
                  {visibleEvents.map((evt, idx) => {
                    const directionsUrl = getEventDirectionsUrl(evt);
                    return (
                      <div
                        key={evt.id || idx}
                        className="rounded-xl border border-[#DFC07C]/35 bg-[#101014] p-6 text-center shadow-lg flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-center gap-4 mb-3">
                            <img loading="lazy" decoding="async"
                              src="/templates/ban-sac-huong-cang/prop_hk_taxi.webp"
                              alt="Hong Kong Taxi"
                              className="h-10 w-auto"
                            />
                            <img loading="lazy" decoding="async"
                              src="/templates/ban-sac-huong-cang/prop_retro_phone.webp"
                              alt="Retro Telephone"
                              className="h-10 w-auto"
                            />
                          </div>

                          <p className="text-[11px] font-bold tracking-[0.24em] text-[#DFC07C] uppercase" style={{ fontFamily: MONO_FONT }}>
                            {evt.title || `LOCATION · ĐIỂM HẸN PHỐ ĐÊM #${idx + 1}`}
                          </p>
                          <h3 className="mt-1 text-2xl font-bold uppercase tracking-wider text-[#F4F1EA]" style={{ fontFamily: TITLE_FONT }}>
                            {evt.venueName || "TRUNG TÂM TIỆC CƯỚI"}
                          </h3>
                          <p className="mt-1 text-xs text-[#A1A6B0] max-w-md mx-auto">
                            {evt.venueAddress}
                          </p>
                        </div>

                        {/* Nút chỉ đường Google Maps */}
                        <div className="mt-5">
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#DFC07C] bg-[#8F1524] px-6 py-2.5 text-xs font-bold tracking-wider text-white uppercase shadow-md transition-colors hover:bg-[#A81A2C]"
                          >
                            <MapPin className="h-4 w-4" />
                            <span>CHỈ ĐƯỜNG TRÊN GOOGLE MAPS</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================================
                SECTION 4: QUY CHUẨN ĐÊM TIỆC (DRESS CODE)
                - CHỈ hiển thị các ô màu sắc nét
                - TUYỆT ĐỐI KHÔNG hiển thị mã màu #XXXXXX
                ======================================================== */}
            {!hidden.has("dresscode") && (
              <div style={{ order: orderOf("dresscode") }} className="px-4 py-8">
                <div className="rounded-xl border border-[#DFC07C]/30 bg-[#101014] p-6 text-center shadow-lg">
                  <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F4F1EA]" style={{ fontFamily: TITLE_FONT }}>
                    LỊCH TRÌNH &amp; TRANG PHỤC
                  </h3>

                  {/* CHỈ hiển thị các ô màu - KHÔNG hiện mã hex */}
                  <div className="mt-5 flex items-center justify-center gap-4">
                    {dressColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-[#DFC07C] shadow-[0_0_12px_rgba(0,0,0,0.6)] transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                        aria-label={`Dress Code Swatch ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* KỊCH BẢN ĐÊM TIỆC (STANDARD — Cue Sheet) */}
                <HkCueSheetTimeline theme={BAN_SAC_STANDARD_THEME} data={data} />
              </div>
            )}

            {/* ========================================================
                SECTION 5: THƯỚC PHIM ĐÊM MƯA (ALBUM ẢNH CƯỚI)
                ======================================================== */}
            {!hidden.has("album") && galleryPhotos.length > 0 && (
              <div style={{ order: orderOf("album") }} className="px-4 py-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F4F1EA]" style={{ fontFamily: TITLE_FONT }}>
                    ALBUM ẢNH CƯỚI
                  </h3>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {galleryPhotos.slice(0, 5).map((photo, idx) => (
                    <div
                      key={photo.id || idx}
                      onClick={() => setLightboxIndex(idx)}
                      className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-lg border border-[#DFC07C]/30 bg-[#101014] shadow-md transition-all hover:border-[#DFC07C]"
                    >
                      <img decoding="async"
                        src={photo.url}
                        alt={photo.alt || `Thước phim ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Badge số cảnh SCENE XX */}
                      <span
                        className="absolute bottom-2 left-2 rounded bg-[#070709]/85 px-2 py-0.5 text-[9px] font-bold tracking-wider text-[#DFC07C] uppercase backdrop-blur-xs"
                        style={{ fontFamily: MONO_FONT }}
                      >
                        SCENE {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                  ))}
                </div>

                <HkExtendedFilmStrip
                  theme={BAN_SAC_STANDARD_THEME}
                  photos={galleryPhotos}
                  onPhotoClick={(realIdx) => setLightboxIndex(realIdx)}
                />
              </div>
            )}

            {/* ========================================================
                SECTION 6: HỘP SƠN MÀI HỶ SỰ (3 TRẠNG THÁI)
                - humidor_normal -> humidor_glow -> humidor_open
                - Bấm vào mở GiftModal portal chuẩn
                ======================================================== */}
            {!hidden.has("gift") && (
              <div style={{ order: orderOf("gift") }} className="px-4 py-8">
                <div className="rounded-xl border border-[#DFC07C]/35 bg-[#101014] p-6 text-center shadow-lg">
                  <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F4F1EA]" style={{ fontFamily: TITLE_FONT }}>
                    HỘP MỪNG CƯỚI
                  </h3>

                  {/* Tương tác 3 trạng thái của hộp sơn mài */}
                  <div className="mt-6 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={handleGiftClick}
                      className="group relative cursor-pointer outline-none transition-transform active:scale-95"
                      aria-label="Mở hộp mừng cưới sơn mài"
                    >
                      <div className="relative h-44 w-44 sm:h-52 sm:w-52">
                        {/* 1. Trạng thái Normal */}
                        <img loading="lazy" decoding="async"
                          src="/templates/ban-sac-huong-cang/humidor_normal.webp"
                          alt="Hộp sơn mài đen"
                          className={cn(
                            "absolute inset-0 h-full w-full object-contain transition-opacity duration-300",
                            giftStage === "normal" ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {/* 2. Trạng thái Glow (Hover / Nhấn) */}
                        <img loading="lazy" decoding="async"
                          src="/templates/ban-sac-huong-cang/humidor_glow.webp"
                          alt="Hộp sơn mài phát sáng"
                          className={cn(
                            "absolute inset-0 h-full w-full object-contain transition-opacity duration-300",
                            giftStage === "glow" || giftStage === "hover" ? "opacity-100" : "opacity-0",
                          )}
                        />
                        {/* 3. Trạng thái Open */}
                        <img loading="lazy" decoding="async"
                          src="/templates/ban-sac-huong-cang/humidor_open.webp"
                          alt="Hộp sơn mài mở nắp"
                          className={cn(
                            "absolute inset-0 h-full w-full object-contain transition-opacity duration-300",
                            giftStage === "open" ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </div>
                    </button>

                    <p className="mt-2 text-[11px] font-semibold tracking-wider text-[#DFC07C] uppercase" style={{ fontFamily: MONO_FONT }}>
                      {giftStage === "open" ? "HỘP ĐÃ MỞ" : "CHẠM ĐỂ MỞ HỘP SƠN MÀI"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================
                SECTION 7: XÁC NHẬN GÓP MẶT & GỬI LỜI CHÚC (RSVP)
                - Đồng bộ 100% theme Noir
                - colorScheme: dark, option dark rõ nét
                ======================================================== */}
            {!hidden.has("rsvp") && (
              <div style={{ order: orderOf("rsvp") }} className="px-4 py-8">
                <section className="relative overflow-hidden rounded-xl border border-[#DFC07C]/35 bg-[#101014] p-5 sm:p-7 shadow-xl">
                  <TemplateRsvpSection
                    data={data}
                    mode={mode}
                    tone="obsidian"
                    customTheme={{
                      isDark: true,
                      wrap: "bg-transparent text-[#F4F1EA]",
                      heading: "text-[#DFC07C]",
                      card: "bg-[#070709] border border-[#DFC07C]/30 text-[#F4F1EA]",
                      input: "bg-[#070709] border border-[#737882]/50 text-[#F4F1EA] focus:border-[#DFC07C]",
                      primaryBtn: "bg-[#8F1524] text-white hover:bg-[#A81A2C] font-bold",
                      outlineBtn: "border-[#DFC07C] text-[#DFC07C] hover:bg-[#DFC07C]/15",
                      optionBg: "#070709",
                      optionColor: "#F4F1EA",
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
                </section>
              </div>
            )}

            {/* QR Album chia sẻ ảnh tiệc cưới cho gói trả phí */}
            {data.plan !== "free" && !hidden.has("albumQr") && resolvedWeddingSlug && (
              <div style={{ order: orderOf("albumQr") }} className="px-4 py-8">
                <div className="flex justify-center rounded-xl border border-[#DFC07C]/35 bg-[#101014] p-5 shadow-xl">
                  <GuestAlbumQr
                    slug={resolvedWeddingSlug}
                    accentColor="#8F1524"
                    textColor="#F4F1EA"
                    mutedColor="#DFC07C"
                  />
                </div>
              </div>
            )}
          </div>

          <footer className="mt-12 border-t border-[#DFC07C]/30 bg-[#070709] px-4 py-12 text-center text-xs text-[#A1A6B0]">
            <p className="text-sm font-semibold text-[#DFC07C] tracking-widest uppercase" style={{ fontFamily: TITLE_FONT }}>
              Hẹn gặp Quý khách tại đêm tiệc chung vui
            </p>
            <p className="mt-4 text-[10px] text-[#737882]">
              © {yearNum} {data.couple.groomName} &amp; {data.couple.brideName}
            </p>
          </footer>
        </div>
      </div>

      {/* --------------------------------------------------------
          LIGHTBOX MODAL (QUAN TRỌNG: MỞ QUA PORTAL)
          -------------------------------------------------------- */}
      {lightboxIndex !== null && (
        <TemplateLightboxModal
          photos={galleryPhotos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      )}

      {/* --------------------------------------------------------
          GIFT MODAL (QUAN TRỌNG: MỞ QUA PORTAL)
          -------------------------------------------------------- */}
      <GiftModal
        open={isGiftModalOpen}
        onClose={handleCloseGiftModal}
        gift={data.gift}
        plan={data.plan}
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName}
        tone="obsidian"
      />
    </div>
  );
}

export default BanSacHuongCangTemplate;
