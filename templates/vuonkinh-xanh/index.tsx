"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  Mail,
  MapPin,
  X,
} from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingEvent } from "@/lib/wedding-types";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   Vườn Kính Xanh — "Dạ Yến Nhà Kính Hoàng Gia & Hoa Cỏ Mùa Xuân"
   Màu chủ đạo: Forest Emerald, Champagne Gold, Sage Green, Ivory
   ============================================================ */

const EMERALD_DARKEST = "#0D1A12";
const EMERALD_CARD = "#1B3627";
const GOLD_CHAMPAGNE = "#E5C787";
const GOLD_ANTIQUE = "#C6A45E";
const GOLD_MUTED = "rgba(229, 199, 135, 0.35)";

const TEXT_CREAM = "#FAF6F0";
const TEXT_IVORY = "#EDE6DB";
const SAGE_BTN = "#7D9D85";
const SAGE_TEXT = "#0E2417";

const SERIF = "var(--font-playfair), 'Cormorant Garamond', Georgia, serif";
const BODY = "var(--font-lora), Georgia, serif";
const EASE = [0.16, 1, 0.3, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "17:30", label: "Đón tiếp khách quý & Check-in" },
  { time: "18:30", label: "Khai tiệc & Nghi thức thành hôn" },
  { time: "19:00", label: "Dạ tiệc ẩm thực & Giao lưu" },
  { time: "20:00", label: "Âm nhạc acoustic & Chụp ảnh lưu niệm" },
  { time: "21:00", label: "Lời cảm tạ & Tiễn khách" },
];

const DEFAULT_DRESS = ["#1B3627", "#7D9D85", "#FAF6F0"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time.trim() || item.label.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

function eventStart(event: WeddingEvent | undefined, fallback: string): string {
  return event?.startsAt ?? fallback;
}

/**
 * Âm thanh chuông pha lê "ting" nhẹ nhàng khi mở thiệp (Web Audio API)
 */
function playOpenChime() {
  playOpenCardSound();
}

/* ------------------------------------------------------------
   Tiêu đề mục viền vàng hoàng gia kèm cành hoa trang trí
   ------------------------------------------------------------ */
function GlasshouseTitle({
  sub,
  title,
}: {
  sub?: string;
  title: string;
}) {
  return (
    <div className="relative mx-auto my-3 px-4 text-center">
      {sub && (
        <p
          className="text-[10px] font-semibold tracking-[0.28em] uppercase sm:text-[11px]"
          style={{ color: GOLD_CHAMPAGNE, fontFamily: SERIF }}
        >
          {sub}
        </p>
      )}
      <h2
        className="mt-1 text-xl font-normal tracking-wide sm:text-2xl"
        style={{ color: TEXT_CREAM, fontFamily: SERIF }}
      >
        {title}
      </h2>
      <div className="mt-2.5 flex items-center justify-center gap-2">
        <span className="h-px w-12" style={{ backgroundColor: GOLD_MUTED }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/templates/vuonkinh-xanh/flourish-divider.webp"
          alt=""
          aria-hidden="true"
          className="h-3 w-auto max-w-[140px] opacity-80"
        />
        <span className="h-px w-12" style={{ backgroundColor: GOLD_MUTED }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   SectionReveal: Fade-in up mượt mà kèm cánh hoa vàng rơi chìm
   ------------------------------------------------------------ */
function SectionReveal({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <m.div
      className="relative"
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      {/* Cánh hoa vàng kim trang trí chìm ở góc */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/templates/vuonkinh-xanh/corner-tl.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-2 -top-4 w-16 opacity-35 sm:w-20"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/templates/vuonkinh-xanh/corner-tl.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-4 -right-2 w-16 -scale-x-100 -scale-y-100 opacity-35 sm:w-20"
      />
      {children}
    </m.div>
  );
}

/* ------------------------------------------------------------
   Trang bìa (Cover): Nhà kính dạ yến, cánh hoa rơi, thiệp viền vàng
   ------------------------------------------------------------ */
function VuonkinhCover({
  data,
  guestName,
  closing,
  contained,
  onOpen,
  onDoorsClosed,
}: {
  data: TemplateData;
  guestName: string;
  closing: boolean;
  contained: boolean;
  onOpen: () => void;
  onDoorsClosed: () => void;
}) {
  const reduce = useReducedMotion();
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const dateParts = formatWeddingDateParts(targetEvent?.startsAt ?? data.date);

  // Tạo mảng bokeh đom đóm / ánh nến lung linh
  const bokeh = React.useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        id: i,
        left: 4 + ((i * 37) % 92),
        top: 3 + ((i * 41) % 94),
        size: 3 + ((i * 7) % 10),
        delay: (i % 7) * 0.9,
        duration: 5.5 + (i % 5),
      })),
    [],
  );

  return (
    <m.div
      className={cn(
        "z-50 w-full max-w-full flex items-center justify-center overflow-hidden px-4 py-4 sm:px-6",
        contained ? "absolute inset-0" : "fixed inset-0",
      )}
      style={{
        backgroundColor: EMERALD_DARKEST,
      }}
      animate={closing ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.85, delay: closing ? 0.35 : 0, ease: EASE }}
      onAnimationComplete={() => {
        if (closing) onDoorsClosed();
      }}
    >
      {/* Nền nhà kính hoàng gia (ưu tiên ảnh dọc background-mobile.webp khi xem trong khung đt/mobile) */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 bg-cover bg-center transition-transform duration-1000",
          contained
            ? "bg-[image:url('/templates/vuonkinh-xanh/background-mobile.webp')]"
            : "bg-[image:url('/templates/vuonkinh-xanh/background-mobile.webp')] sm:bg-[image:url('/templates/vuonkinh-xanh/background.webp')]",
        )}
        style={{
          filter: "brightness(0.92) contrast(1.05)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0D1A12]/40 via-[#0D1A12]/20 to-[#0D1A12]/80"
      />

      {/* Lớp cánh hoa vàng rơi lơ lửng */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-65 mix-blend-screen"
        style={{
          backgroundImage: "url('/templates/vuonkinh-xanh/falling-petals.webp')",
        }}
      />

      {/* Bokeh ánh sáng đom đóm / nến lung linh */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {bokeh.map((dot) => (
          <m.span
            key={dot.id}
            className="absolute rounded-full"
            style={{
              left: `${dot.left}%`,
              top: `${dot.top}%`,
              width: dot.size,
              height: dot.size,
              backgroundColor: GOLD_CHAMPAGNE,
              filter: "blur(1.2px)",
              boxShadow: `0 0 ${dot.size * 2}px ${GOLD_CHAMPAGNE}`,
            }}
            animate={reduce ? undefined : { opacity: [0.15, 0.85, 0.15], y: [0, -24, 0] }}
            transition={
              reduce
                ? undefined
                : { duration: dot.duration, repeat: Infinity, delay: dot.delay, ease: "easeInOut" }
            }
          />
        ))}
      </div>

      {/* THẺ THIỆP TRUNG TÂM (Emerald Green Card with Double Gold Filigree Border) */}
      <m.div
        className="relative z-10 w-full max-w-[328px] sm:max-w-[380px] mx-auto overflow-hidden rounded-[24px] p-5 text-center shadow-2xl sm:p-7"
        style={{
          backgroundColor: "#1B3627",
          backgroundImage: "linear-gradient(180deg, #1F3E2F 0%, #173023 60%, #12251A 100%)",
          border: `1.5px solid ${GOLD_ANTIQUE}`,
          boxShadow: "0 20px 50px rgba(0,0,0,0.65), 0 0 25px rgba(212,175,55,0.2), inset 0 0 15px rgba(212,175,55,0.12)",
        }}
        initial={reduce ? false : { opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
      >
        {/* Khung hoa văn viền góc vàng - dùng 100% 100% để ôm khít mép thẻ */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[length:100%_100%] bg-center opacity-85"
          style={{
            backgroundImage: "url('/templates/vuonkinh-xanh/card-frame-clean.webp')",
          }}
        />

        {/* Top Branch Motif */}
        <div className="relative mx-auto mt-1 flex justify-center sm:mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/templates/vuonkinh-xanh/branch-motif.webp"
            alt=""
            aria-hidden="true"
            className="h-8 w-auto opacity-95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] sm:h-9"
          />
        </div>

        {/* Couple Names (3 lines: Chú rể / & / Cô dâu) */}
        <div className="relative mt-3 sm:mt-4">
          <span
            className="block text-xl font-normal tracking-wide sm:text-2xl lg:text-3xl"
            style={{ color: TEXT_CREAM, fontFamily: SERIF }}
          >
            {data.couple.groomName}
          </span>
          <span
            className="my-0.5 block text-base italic sm:text-lg"
            style={{ color: GOLD_CHAMPAGNE, fontFamily: SERIF }}
          >
            &amp;
          </span>
          <span
            className="block text-xl font-normal tracking-wide sm:text-2xl lg:text-3xl"
            style={{ color: TEXT_CREAM, fontFamily: SERIF }}
          >
            {data.couple.brideName}
          </span>
        </div>

        {/* Flourish Divider */}
        <div className="relative mx-auto mt-2 flex justify-center sm:mt-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/templates/vuonkinh-xanh/flourish-divider.webp"
            alt=""
            aria-hidden="true"
            className="h-3 w-auto max-w-[180px] opacity-85 drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)] sm:h-3.5 sm:max-w-[200px]"
          />
        </div>

        {/* Date Display */}
        <div className="relative mt-2 sm:mt-3">
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.22em] sm:text-xs sm:tracking-[0.26em]"
            style={{ color: GOLD_CHAMPAGNE, fontFamily: SERIF }}
          >
            {(dateParts.weekday || "THỨ BẢY").toUpperCase()} · {dateParts.dotDate}
          </p>
        </div>

        {/* Salutation Pill */}
        <div className="relative mx-auto mt-4 max-w-[260px] sm:mt-5 sm:max-w-[280px]">
          <div
            className="rounded-full px-3.5 py-1 shadow-sm sm:px-4 sm:py-1.5"
            style={{
              backgroundColor: "rgba(18, 37, 26, 0.75)",
              border: `1px solid ${GOLD_MUTED}`,
              backdropFilter: "blur(4px)",
            }}
          >
            <p
              className="truncate text-[10.5px] font-medium tracking-wide sm:text-xs"
              style={{ color: TEXT_IVORY, fontFamily: BODY }}
            >
              Trân Trọng Kính Mời: {guestName?.trim() || "Quý Khách Quý Mến"}
            </p>
          </div>
        </div>

        {/* Nút MỞ THIỆP (Sage Green Pill Button) */}
        <div className="relative mt-4 flex justify-center pb-1 sm:mt-5 sm:pb-2">
          <m.button
            type="button"
            onClick={() => {
              playOpenChime();
              onOpen();
            }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full px-6 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-lg transition-transform active:scale-95 sm:px-7 sm:py-2.5 sm:text-xs sm:tracking-[0.18em]"
            style={{
              backgroundColor: SAGE_BTN,
              color: SAGE_TEXT,
              border: "1px solid rgba(255,255,255,0.35)",
              boxShadow: "0 4px 18px rgba(125, 157, 133, 0.45)",
            }}
            whileHover={reduce ? undefined : { scale: 1.04, boxShadow: "0 6px 24px rgba(125, 157, 133, 0.6)" }}
            whileTap={reduce ? undefined : { scale: 0.96 }}
          >
            <Mail className="h-3.5 w-3.5 text-[#0E2417]" />
            <span>Mở thiệp</span>
          </m.button>
        </div>
      </m.div>
    </m.div>
  );
}

/* ------------------------------------------------------------
   Đồng hồ đếm ngược ngày cưới (Countdown Timer)
   ------------------------------------------------------------ */
function CountdownBlock({ targetDateIso }: { targetDateIso: string }) {
  const [mounted, setMounted] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    setMounted(true);
    const target = new Date(targetDateIso).getTime();

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDateIso]);

  if (!mounted) {
    return (
      <div className="grid grid-cols-4 gap-2 text-center sm:gap-3">
        {["Ngày", "Giờ", "Phút", "Giây"].map((label) => (
          <div
            key={label}
            className="rounded-2xl p-3"
            style={{ backgroundColor: EMERALD_CARD, border: `1px solid ${GOLD_MUTED}` }}
          >
            <span className="font-mono text-xl font-bold text-[#E5C787] sm:text-2xl">--</span>
            <span className="mt-1 block text-[10px] uppercase text-[#95B09E]">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  const units = [
    { label: "Ngày", val: timeLeft.days },
    { label: "Giờ", val: timeLeft.hours },
    { label: "Phút", val: timeLeft.minutes },
    { label: "Giây", val: timeLeft.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 text-center sm:gap-3">
      {units.map((u) => (
        <div
          key={u.label}
          className="rounded-2xl p-3 shadow-md"
          style={{
            backgroundColor: EMERALD_CARD,
            border: `1px solid ${GOLD_MUTED}`,
            boxShadow: "inset 0 1px 3px rgba(255,255,255,0.08)",
          }}
        >
          <span className="font-mono text-xl font-bold sm:text-2xl" style={{ color: GOLD_CHAMPAGNE }}>
            {String(u.val).padStart(2, "0")}
          </span>
          <span className="mt-1 block text-[10px] font-medium uppercase tracking-wider text-[#95B09E]">
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------
   Lịch tháng đám cưới với trái tim vàng phát sáng (Calendar)
   ------------------------------------------------------------ */
function CalendarBlock({ dateIso, eventDays }: { dateIso: string; eventDays?: Set<number> }) {
  const weddingDate = React.useMemo(() => new Date(dateIso), [dateIso]);
  const year = weddingDate.getFullYear();
  const month = weddingDate.getMonth();
  const day = weddingDate.getDate();

  const { firstDayOfWeek, totalDays } = React.useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDayOfWeek: firstDay === 0 ? 6 : firstDay - 1, totalDays: daysInMonth };
  }, [year, month]);

  const daysArray = React.useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null);
    for (let i = 1; i <= totalDays; i++) arr.push(i);
    return arr;
  }, [firstDayOfWeek, totalDays]);

  return (
    <div
      className="mx-auto max-w-[340px] rounded-3xl p-5 shadow-lg sm:p-6"
      style={{
        backgroundColor: EMERALD_CARD,
        border: `1px solid ${GOLD_MUTED}`,
      }}
    >
      <div className="mb-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: GOLD_CHAMPAGNE }}>
          Tháng {month + 1} · {year}
        </p>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-[#8DAA98]">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center font-mono text-xs">
        {daysArray.map((d, index) => {
          if (d === null) return <span key={`empty-${index}`} />;
          const isWeddingDay = eventDays ? eventDays.has(d) : d === day;
          return (
            <div
              key={`day-${d}`}
              className={cn(
                "relative flex h-8 w-8 items-center justify-center rounded-full mx-auto transition-transform",
                isWeddingDay
                  ? "font-bold text-[#0D1A12] shadow-md"
                  : "text-[#E6ECE8] hover:bg-white/5",
              )}
              style={
                isWeddingDay
                  ? {
                    backgroundColor: GOLD_CHAMPAGNE,
                    boxShadow: `0 0 16px ${GOLD_CHAMPAGNE}`,
                  }
                  : {}
              }
            >
              {isWeddingDay ? (
                <>
                  <span className="relative z-10 text-[11px] font-bold">{d}</span>
                  <Heart className="absolute -top-1 -right-1 h-3 w-3 fill-[#D4AF37] text-[#D4AF37] animate-pulse" />
                </>
              ) : (
                <span>{d}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN TEMPLATE COMPONENT
   ============================================================ */
export default function VuonkinhXanhTemplate({
  data,
  contained = false,
  viewport = "phone",
  isOpened = false,
  onOpenedChange,
  externalMusicControl = false,
  guestName = "",
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = null,
  initialSongRequest = null,
  initialRideNeeded = false,
  inviteSlug,
  weddingSlug,
  invitationMode = "public",
  mode = "live",
}: WeddingTemplateProps) {
  const [opened, setOpened] = React.useState(isOpened);
  const [closing, setClosing] = React.useState(false);
  const [coverGone, setCoverGone] = React.useState(isOpened);
  const [giftModalOpen, setGiftModalOpen] = React.useState(false);
  const [giftBoxOpened, setGiftBoxOpened] = React.useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = React.useState<number | null>(null);

  // Bảo vệ đóng mở bìa an toàn theo card_exp.md §22.26
  const parentOpenedRef = React.useRef(isOpened);
  React.useEffect(() => {
    const wasOpened = parentOpenedRef.current;
    parentOpenedRef.current = isOpened;
    if (isOpened) {
      setOpened(true);
      if (!closing) setCoverGone(true);
      return;
    }
    if (!wasOpened) return; // Chưa từng được cha mở thì đừng reset
    setClosing(false);
    setOpened(false);
    setCoverGone(false);
  }, [isOpened, closing]);

  const handleOpenCover = () => {
    setClosing(true);
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch {}
    setTimeout(() => {
      setOpened(true);
      setCoverGone(true);
      setClosing(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 850);
  };

  const handleGiftBoxClick = () => {
    playOpenChime();
    setGiftBoxOpened(true);
    const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) {
      setTimeout(() => {
        setGiftModalOpen(true);
      }, 420);
    } else {
      setTimeout(() => {
        setGiftModalOpen(true);
      }, 220);
    }
  };

  const hidden = React.useMemo(() => new Set(data.hiddenSections ?? []), [data.hiddenSections]);
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const targetDateIso = targetEvent?.startsAt ?? data.date;

  const targetDateObj = React.useMemo(() => new Date(targetDateIso), [targetDateIso]);
  const calYear = targetDateObj.getFullYear();
  const calMonth = targetDateObj.getMonth();
  const eventDays = React.useMemo(() => {
    const days = new Set<number>();
    visibleEvents.forEach((evt) => {
      if (evt.startsAt) {
        const d = new Date(evt.startsAt);
        if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
          days.add(d.getDate());
        }
      }
    });
    if (days.size === 0 && !isNaN(targetDateObj.getTime())) {
      days.add(targetDateObj.getDate());
    }
    return days;
  }, [visibleEvents, calYear, calMonth, targetDateObj]);

  const timeline = getTimeline(data);
  const dressColors = getDressColors(data);
  const galleryPhotos = data.photos?.gallery ?? [];

  // Tách tên phụ huynh theo dấu & để xuống dòng chuẩn (card_exp.md §20)
  const groomParentsList = React.useMemo(() => {
    const raw = data.couple.groomParents || "";
    return raw.split("&").map((s) => s.trim()).filter(Boolean);
  }, [data.couple.groomParents]);

  const brideParentsList = React.useMemo(() => {
    const raw = data.couple.brideParents || "";
    return raw.split("&").map((s) => s.trim()).filter(Boolean);
  }, [data.couple.brideParents]);

  return (
    <div
      data-template-id="vuonkinh-xanh"
      className={cn(
        "relative w-full min-w-0 text-[#FAF6F0] selection:bg-[#7D9D85] selection:text-[#0E2417] antialiased",
        contained ? "min-h-full" : "min-h-screen-dvh",
        !coverGone &&
        (contained
          ? "h-full overflow-hidden"
          : "h-screen-dvh max-h-full overflow-hidden"),
        !contained && "overflow-x-hidden",
        viewport === "desktop" && !contained && "mx-auto max-w-[820px]",
      )}
      style={{
        backgroundColor: EMERALD_DARKEST,
        backgroundImage: "linear-gradient(180deg, #0D1A12 0%, #13241A 20%, #152A1E 50%, #0E1D15 100%)",
        fontFamily: BODY,
      }}
    >
      {/* 1. TRANG BÌA (Cover) */}
      {!coverGone && (
        <VuonkinhCover
          data={data}
          guestName={guestName || ""}
          closing={closing}
          contained={contained}
          onOpen={handleOpenCover}
          onDoorsClosed={() => {
            setCoverGone(true);
            setClosing(false);
            setOpened(true);
          }}
        />
      )}

      {/* Nút nhạc nền nổi */}
      {!externalMusicControl && !hidden.has("music") && (
        <LiveMusicFloatingButton
          src={data.music?.src || "/media/wedding.mp3"}
          title={data.music?.title || "Dạ Khúc Vườn Kính"}
          visible={opened}
          tone="obsidian"
        />
      )}

      {/* NỘI DUNG CHÍNH (Ruột thiệp) */}
      <div className="relative mx-auto max-w-[480px] px-4 py-10 sm:px-6 sm:py-16">
        {/* SECTION: HERO (Save The Date & Vòm kính nghệ thuật) */}
        <section className="relative pt-4 text-center">
          <SectionReveal>
            <div className="mx-auto max-w-xs">
              <p
                className="text-xs font-semibold uppercase tracking-[0.3em]"
                style={{ color: GOLD_CHAMPAGNE, fontFamily: SERIF }}
              >
                SAVE THE DATE
              </p>
              <h1
                className="mt-3 text-3xl font-normal tracking-wide sm:text-4xl"
                style={{ color: TEXT_CREAM, fontFamily: SERIF }}
              >
                {data.couple.groomName}
              </h1>
              <p
                className="my-1 text-xl italic"
                style={{ color: GOLD_CHAMPAGNE, fontFamily: SERIF }}
              >
                &amp;
              </p>
              <h1
                className="text-3xl font-normal tracking-wide sm:text-4xl"
                style={{ color: TEXT_CREAM, fontFamily: SERIF }}
              >
                {data.couple.brideName}
              </h1>
            </div>

            {/* Khung ảnh cưới vòm kính (Glasshouse Arch Frame) */}
            <div className="relative mx-auto mt-8 w-full max-w-[320px] sm:max-w-[340px]">
              <div
                className="relative aspect-[3/4] overflow-hidden rounded-t-[140px] rounded-b-2xl shadow-2xl"
                style={{
                  border: `2px solid ${GOLD_ANTIQUE}`,
                  boxShadow: "0 15px 40px rgba(0,0,0,0.6), 0 0 20px rgba(212,175,55,0.25)",
                }}
              >
                {data.photos.heroUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.photos.heroUrl}
                    alt="Ảnh cưới"
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <TemplatePhotoPlaceholder label="Ảnh cưới Vườn Kính" />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0D1A12]/60 via-transparent to-transparent" />
              </div>
            </div>

            {/* Lời tựa (Quote) */}
            {data.quote && (
              <div className="mx-auto mt-7 max-w-sm px-4">
                <p
                  className="text-sm italic leading-relaxed text-[#D8E6DC]"
                  style={{ fontFamily: SERIF }}
                >
                  &ldquo;{data.quote}&rdquo;
                </p>
              </div>
            )}
          </SectionReveal>
        </section>

        {/* SECTION: LỊCH CƯỚI & ĐẾM NGƯỢC (key: "calendar") */}
        {!hidden.has("calendar") && (
          <section className="mt-16">
            <SectionReveal>
              <GlasshouseTitle sub="Save Our Date" title="Thời Khắc Hạnh Phúc" />

              <div className="mt-6">
                <CountdownBlock targetDateIso={targetDateIso} />
              </div>

              <div className="mt-8">
                <CalendarBlock dateIso={targetDateIso} eventDays={eventDays} />
              </div>
            </SectionReveal>
          </section>
        )}

        {/* SECTION: THÔNG TIN GIA ĐÌNH HAI HỌ (key: "family") */}
        {!hidden.has("family") && (
          <section className="mt-16">
            <SectionReveal>
              <GlasshouseTitle sub="Hai Bên Gia Đình" title="Thông Tin Gia Đình" />

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch">
                {/* Nhà Trai */}
                <div
                  className="flex h-full flex-col justify-between rounded-3xl p-6 text-center shadow-lg"
                  style={{
                    backgroundColor: EMERALD_CARD,
                    border: `1px solid ${GOLD_MUTED}`,
                  }}
                >
                  <div>
                    <span
                      className="inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: "rgba(125, 157, 133, 0.18)",
                        color: GOLD_CHAMPAGNE,
                        border: `1px solid ${GOLD_MUTED}`,
                      }}
                    >
                      Nhà Trai · {data.couple.groomTitle || "Chú rể"}
                    </span>
                    <h3
                      className="mt-3 text-lg font-normal"
                      style={{ color: TEXT_CREAM, fontFamily: SERIF }}
                    >
                      {data.couple.groomName}
                    </h3>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#C6A45E]/20 text-xs text-[#C6D8CC]">
                    <p className="font-semibold text-white">Thân sinh:</p>
                    {groomParentsList.length > 0 ? (
                      groomParentsList.map((p, idx) => (
                        <p key={idx} className={idx === 0 ? "mt-1" : ""}>
                          {p}
                        </p>
                      ))
                    ) : (
                      <>
                        <p className="mt-1">Ông: {data.couple.groomFullName || "Nguyễn Văn A"}</p>
                        <p>Bà: Trần Thị B</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Nhà Gái */}
                <div
                  className="flex h-full flex-col justify-between rounded-3xl p-6 text-center shadow-lg"
                  style={{
                    backgroundColor: EMERALD_CARD,
                    border: `1px solid ${GOLD_MUTED}`,
                  }}
                >
                  <div>
                    <span
                      className="inline-block rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: "rgba(125, 157, 133, 0.18)",
                        color: GOLD_CHAMPAGNE,
                        border: `1px solid ${GOLD_MUTED}`,
                      }}
                    >
                      Nhà Gái · {data.couple.brideTitle || "Cô dâu"}
                    </span>
                    <h3
                      className="mt-3 text-lg font-normal"
                      style={{ color: TEXT_CREAM, fontFamily: SERIF }}
                    >
                      {data.couple.brideName}
                    </h3>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#C6A45E]/20 text-xs text-[#C6D8CC]">
                    <p className="font-semibold text-white">Thân sinh:</p>
                    {brideParentsList.length > 0 ? (
                      brideParentsList.map((p, idx) => (
                        <p key={idx} className={idx === 0 ? "mt-1" : ""}>
                          {p}
                        </p>
                      ))
                    ) : (
                      <>
                        <p className="mt-1">Ông: {data.couple.brideFullName || "Lê Văn C"}</p>
                        <p>Bà: Phạm Thị D</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </SectionReveal>
          </section>
        )}

        {/* SECTION: LỊCH TRÌNH TIỆC CƯỚI (key: "dresscode" / timeline) */}
        {!hidden.has("dresscode") && timeline.length > 0 && (
          <section className="mt-16">
            <SectionReveal>
              <GlasshouseTitle sub="Chương Trình Hôn Lễ" title="Lịch Trình Dạ Tiệc" />

              <div
                className="relative mt-6 rounded-3xl p-6 shadow-lg"
                style={{
                  backgroundColor: EMERALD_CARD,
                  border: `1px solid ${GOLD_MUTED}`,
                }}
              >
                {/* Đường nối timeline dọc */}
                <div
                  aria-hidden="true"
                  className="absolute left-9 top-8 bottom-8 w-px"
                  style={{
                    background: "linear-gradient(180deg, rgba(212,175,55,0.6) 0%, rgba(212,175,55,0.2) 100%)",
                  }}
                />

                <div className="space-y-6">
                  {timeline.map((item, idx) => (
                    <div key={idx} className="relative flex items-start gap-4 pl-2">
                      <div
                        className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm"
                        style={{
                          backgroundColor: SAGE_BTN,
                          color: SAGE_TEXT,
                          border: `1px solid ${GOLD_CHAMPAGNE}`,
                        }}
                      >
                        <Clock className="h-3.5 w-3.5" />
                      </div>
                      <div className="pt-0.5">
                        <span className="font-mono text-xs font-bold text-[#E5C787]">
                          {item.time}
                        </span>
                        <p className="mt-0.5 text-sm font-medium text-[#FAF6F0]">
                          {item.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dress Code Palette */}
                {dressColors.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-[#C6A45E]/20 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#E5C787]">
                      Gợi Ý Trang Phục (Dress Code)
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-3">
                      {dressColors.map((color, i) => (
                        <div
                          key={i}
                          className="h-8 w-8 rounded-full border border-white/40 shadow-md transition-transform hover:scale-110"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionReveal>
          </section>
        )}

        {/* SECTION: SỰ KIỆN & CHỈ ĐƯỜNG (key: "map") */}
        {!hidden.has("map") && visibleEvents.length > 0 && (
          <section className="mt-16">
            <SectionReveal>
              <GlasshouseTitle sub="Địa Điểm & Thời Gian" title="Sự Kiện & Chỉ Đường" />

              <div className={`mt-6 ${visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto" : "space-y-4 max-w-xl mx-auto"}`}>
                {visibleEvents.map((evt, idx) => {
                  const parts = formatWeddingDateParts(evt.startsAt);
                  const directionsUrl = getEventDirectionsUrl(evt);
                  return (
                    <div
                      key={evt.id || idx}
                      className="rounded-3xl p-6 text-center shadow-lg flex flex-col justify-between"
                      style={{
                        backgroundColor: EMERALD_CARD,
                        border: `1px solid ${GOLD_MUTED}`,
                      }}
                    >
                      <div>
                        <span
                          className="inline-block rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
                          style={{
                            backgroundColor: "rgba(125, 157, 133, 0.2)",
                            color: GOLD_CHAMPAGNE,
                            border: `1px solid ${GOLD_MUTED}`,
                          }}
                        >
                          {evt.title || "Lễ Thành Hôn"}
                        </span>

                        <p
                          className="mt-3 text-lg font-normal"
                          style={{ color: TEXT_CREAM, fontFamily: SERIF }}
                        >
                          {evt.venueName || "Nhà hàng tiệc cưới"}
                        </p>

                        <p className="mt-1 text-xs text-[#C5D8CC]">
                          {evt.venueAddress || "Địa chỉ hôn lễ"}
                        </p>

                        <div className="mt-3 inline-flex items-center gap-2 font-mono text-xs text-[#E5C787]">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <span>
                            {parts.weekday} · {parts.dotDate} {parts.time ? `(${parts.time})` : ""}
                          </span>
                        </div>
                      </div>

                      {directionsUrl && (
                        <div className="mt-5">
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider shadow-md transition-transform hover:scale-105"
                            style={{
                              backgroundColor: SAGE_BTN,
                              color: SAGE_TEXT,
                            }}
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            <span>Xem bản đồ chỉ đường</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionReveal>
          </section>
        )}

        {/* SECTION: ALBUM ẢNH CƯỚI (key: "album") */}
        {!hidden.has("album") && galleryPhotos.length > 0 && (
          <section className="mt-16">
            <SectionReveal>
              <GlasshouseTitle sub="Khoảnh Khắc Yêu Thương" title="Album Ảnh Cưới" />

              <div className="mt-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {galleryPhotos.map((photo, i) => (
                    <button
                      key={photo.id || i}
                      type="button"
                      onClick={() => setActivePhotoIndex(i)}
                      className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl shadow-md transition-transform hover:scale-[1.02]"
                      style={{ border: `1px solid ${GOLD_MUTED}` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={`Ảnh cưới ${i + 1}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            </SectionReveal>
          </section>
        )}

        {/* Lightbox Zoom Modal (createPortal) */}
        {activePhotoIndex !== null &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
              onClick={() => setActivePhotoIndex(null)}
            >
              <button
                type="button"
                onClick={() => setActivePhotoIndex(null)}
                className="absolute right-4 top-4 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
              >
                <X className="h-5 w-5" />
              </button>

              <div
                className="relative max-h-[85vh] max-w-[90vw] overflow-hidden rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={galleryPhotos[activePhotoIndex]?.url}
                  alt="Ảnh cưới phóng to"
                  className="max-h-[85vh] w-auto object-contain"
                />
              </div>

              {galleryPhotos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex((prev) =>
                        prev === null ? 0 : (prev - 1 + galleryPhotos.length) % galleryPhotos.length,
                      );
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2.5 text-white hover:bg-white/30"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex((prev) =>
                        prev === null ? 0 : (prev + 1) % galleryPhotos.length,
                      );
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2.5 text-white hover:bg-white/30"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>,
            document.body,
          )}

        {/* SECTION: GUEST ALBUM QR (key: "albumQr" - Pro gated) */}
        {!hidden.has("albumQr") && (
          <section className="mt-16">
            <SectionReveal>
              <GuestAlbumQr slug={weddingSlug || data.weddingSlug || ""} />
            </SectionReveal>
          </section>
        )}

        {/* SECTION: HỘP QUÀ MỪNG CƯỚI (key: "gift") */}
        {!hidden.has("gift") && (
          <section className="mt-16">
            <SectionReveal>
              <GlasshouseTitle sub="Gửi Lời Chúc Phúc" title="Hộp Quà Mừng Cưới" />

              <div
                className="mt-6 rounded-3xl p-6 text-center shadow-lg"
                style={{
                  backgroundColor: EMERALD_CARD,
                  border: `1px solid ${GOLD_MUTED}`,
                }}
              >
                <p className="text-xs leading-relaxed text-[#D2E2D6]">
                  Sự hiện diện của bạn là niềm vinh hạnh lớn nhất của chúng tôi. Nếu muốn gửi quà mừng
                  từ phương xa, xin mời mở hộp quà bên dưới.
                </p>

                <div className="mt-5 flex justify-center">
                  <button
                    type="button"
                    onClick={handleGiftBoxClick}
                    className="group relative flex flex-col items-center cursor-pointer p-2 transition-transform active:scale-95 focus-visible:outline-none"
                    aria-label="Mở hộp quà mừng cưới"
                  >
                    {/* Khung chứa ảnh hộp quà 2 trạng thái chồng lên nhau */}
                    <div className="relative mx-auto h-32 w-32 sm:h-40 sm:w-40 select-none">
                      {/* Vầng sáng vàng kim tỏa rộng phía sau khi mở hộp */}
                      <div
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute inset-0 -m-3 rounded-full transition-all duration-700 blur-xl",
                          giftBoxOpened
                            ? "bg-[#E5C787]/35 scale-125 opacity-100"
                            : "bg-[#E5C787]/0 scale-90 opacity-0 group-hover:bg-[#E5C787]/30 group-hover:scale-110 group-hover:opacity-100",
                        )}
                      />

                      {/* Hộp quà ĐÓNG (Closed) */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/templates/vuonkinh-xanh/gift-box-closed.webp"
                        alt="Hộp quà mừng cưới"
                        className={cn(
                          "absolute inset-0 h-full w-full object-contain transition-all duration-500 ease-out drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]",
                          giftBoxOpened
                            ? "scale-90 opacity-0 pointer-events-none"
                            : "scale-100 opacity-100 group-hover:scale-95 group-hover:opacity-0",
                        )}
                      />

                      {/* Hộp quà MỞ (Open with sparkles & golden light) */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/templates/vuonkinh-xanh/gift-box-open.webp"
                        alt="Hộp quà phát sáng"
                        className={cn(
                          "absolute inset-0 h-full w-full object-contain transition-all duration-500 ease-out drop-shadow-[0_12px_30px_rgba(212,175,55,0.45)]",
                          giftBoxOpened
                            ? "scale-110 opacity-100"
                            : "scale-100 opacity-0 group-hover:scale-105 group-hover:opacity-100",
                        )}
                      />
                    </div>

                    {/* Nhãn nút bấm sang trọng */}
                    <div
                      className="mt-3 flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider shadow-md transition-all group-hover:scale-105"
                      style={{
                        backgroundColor: SAGE_BTN,
                        color: SAGE_TEXT,
                        border: `1px solid ${GOLD_CHAMPAGNE}`,
                        boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                      }}
                    >
                      <span>{giftBoxOpened ? "Đang Mở Hộp Quà..." : "Mở Hộp Quà Mừng"}</span>
                    </div>
                  </button>
                </div>
              </div>
            </SectionReveal>
          </section>
        )}

        {/* Gift Modal Portal */}
        {giftModalOpen && (
          <GiftModal
            open={giftModalOpen}
            onClose={() => {
              setGiftModalOpen(false);
              setGiftBoxOpened(false);
            }}
            gift={data.gift}
            plan={data.plan}
            coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
            guestName={guestName}
            tone="olive"
          />
        )}

        {/* SECTION: XÁC NHẬN THAM DỰ & LỜI CHÚC (key: "rsvp") */}
        {!hidden.has("rsvp") && (
          <section className="mt-16">
            <SectionReveal>
              <GlasshouseTitle sub="RSVP & Wishes" title="Xác Nhận & Lời Chúc" />

              <div
                className="mt-6 overflow-hidden rounded-3xl shadow-xl"
                style={{
                  backgroundColor: EMERALD_CARD,
                  border: `1px solid ${GOLD_MUTED}`,
                }}
              >
                <div
                  style={
                    {
                      "--color-inv-primary": "#7D9D85",
                      "--color-inv-primary-foreground": "#0D1A12",
                      "--color-inv-background": "#1B3627",
                      "--color-inv-foreground": "#FAF6F0",
                      "--color-inv-muted": "#20402E",
                      "--color-inv-muted-foreground": "#95B09E",
                      "--color-inv-border": "rgba(198, 164, 94, 0.4)",
                      "--color-inv-card": "#173022",
                      "--color-inv-card-foreground": "#FAF6F0",
                    } as React.CSSProperties
                  }
                >
                  <TemplateRsvpSection
                    data={data}
                    mode={mode}
                    tone="obsidian"
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
              </div>
            </SectionReveal>
          </section>
        )}

        {/* FOOTER */}
        <footer className="mt-20 text-center">
          <div className="mx-auto flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/templates/vuonkinh-xanh/branch-motif.webp"
              alt=""
              aria-hidden="true"
              className="h-7 w-auto opacity-70"
            />
          </div>
          <p
            className="mt-3 text-lg font-normal tracking-wide text-[#FAF6F0]"
            style={{ fontFamily: SERIF }}
          >
            {data.couple.groomName} &amp; {data.couple.brideName}
          </p>
          <p className="mt-1 text-xs text-[#8BA594]">
            Chân thành cảm ơn sự hiện diện và chúc phúc của quý khách.
          </p>
          <p className="mt-6 text-[10px] tracking-wider uppercase text-[#5F7867]">
            Thiết kế bởi Inviwedd
          </p>
        </footer>
      </div>
    </div>
  );
}
