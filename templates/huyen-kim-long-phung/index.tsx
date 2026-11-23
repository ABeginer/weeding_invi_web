"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Heart,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
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
   BẢNG MÀU CHÍNH THỨC: HUYỀN KIM LONG PHỤNG (huyen-kim-long-phung)
   - Đen Huyền Sơn Mài (Obsidian Black Lacquer): #0B0A09 (sâu #060504, thẻ #12100E)
   - Vàng Lá 24K (24K Sovereign Gold): #D9B368 (sáng #F4DC9E, trầm #A37E3B)
   - Kem Bạch Kim Ấm (Warm Champagne Ivory): #F2EAE0 (phụ #C8B9A6)
   - Gradient Vàng 24K: from-[#C89F51] via-[#E8C97E] to-[#C89F51]
   - Dress Code mặc định: #0B0A09 (Đen huyền), #D9B368 (Vàng 24K), #5E141C (Đỏ rượu)
   ============================================================ */

const OBSIDIAN_MAIN = "#0B0A09";
const OBSIDIAN_DEEP = "#060504";
const OBSIDIAN_CARD = "rgba(18, 16, 14, 0.94)";

const GOLD_24K = "#D9B368";
const GOLD_LIGHT = "#F4DC9E";
const GOLD_DEEP = "#A37E3B";

const TEXT_LIGHT = "#F4DC9E";
const TEXT_BODY = "#F2EAE0";
const TEXT_MUTED = "#C8B9A6";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_IMPERIAL = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "16:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm tại tiền sảnh Huyền Kim Long Phụng" },
  { time: "17:30", label: "Nghi thức Thành Hôn Long Phụng Hòa Minh & Lời hẹn ước trăm năm" },
  { time: "18:00", label: "Dạ tiệc hoàng gia & Nâng ly rượu nồng giao bôi chúc phúc" },
  { time: "19:30", label: "Vũ điệu tình yêu & Hòa tấu hoàng kim du dương" },
  { time: "20:30", label: "Tiễn khách & Trao quà cảm tạ tri ân" },
];

const DEFAULT_DRESS = ["#0B0A09", "#D9B368", "#5E141C"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Bụi Vàng Lá 24K Trôi Siêu Chậm
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function GoldLeafDust({ count = 16 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 17) % 94 + 3}%`,
      size: (idx % 3) + 2.5,
      duration: 9 + (idx % 4) * 2.5,
      delay: (idx * 0.5) % 4.5,
      yOffset: 30 + (idx % 4) * 20,
      isBright: idx % 2 === 0,
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
            bottom: "6%",
            width: p.size,
            height: p.size,
            background: p.isBright
              ? "radial-gradient(circle, #F4DC9E 0%, rgba(217,179,104,0.45) 65%, transparent 100%)"
              : "radial-gradient(circle, #FFFFFF 0%, rgba(244,220,158,0.3) 60%, transparent 100%)",
            boxShadow: "0 0 6px 1.5px rgba(217,179,104,0.45)",
          }}
          animate={{
            y: [-10, -p.yOffset * 3.5, -p.yOffset * 7],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * (10 + (p.id % 12)), 0],
            opacity: [0, 0.85, 0],
            scale: [0.7, 1.25, 0.6],
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

/* ============================================================
   COMPONENT CHÍNH: HUYỀN KIM LONG PHỤNG
   ============================================================ */
export function HuyenKimLongPhungTemplate({
  data,
  mode,
  contained = false,
  viewport = "phone",
  isOpened = false,
  onOpenedChange,
  externalMusicControl = false,
  inviteSlug,
  weddingSlug,
  invitationMode = "personal",
  guestName,
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = null,
  initialSongRequest = null,
  initialRideNeeded = false,
}: WeddingTemplateProps) {
  const reduce = useReducedMotion();

  // Kiểm tra URL search params có ?opened=1 không
  const [initialOpened] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return isOpened;
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("opened") === "1" || isOpened;
    } catch {
      return isOpened;
    }
  });

  const [openState, setOpenState] = React.useState<boolean>(initialOpened);
  const [coverGone, setCoverGone] = React.useState<boolean>(initialOpened);
  const [isOpening, setIsOpening] = React.useState<boolean>(false);
  const [giftModalOpen, setGiftModalOpen] = React.useState<boolean>(false);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [activeParcel, setActiveParcel] = React.useState<"normal" | "hover" | "active">("normal");

  const [mounted, setMounted] = React.useState<boolean>(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Preload 3 trạng thái hộp mừng cưới sơn mài đen khảm vàng
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p1 = new Image();
    p1.src = "/templates/huyen-kim-long-phung/gift-normal.webp";
    const p2 = new Image();
    p2.src = "/templates/huyen-kim-long-phung/gift-hover.webp";
    const p3 = new Image();
    p3.src = "/templates/huyen-kim-long-phung/gift-active.webp";
  }, []);

  // Đồng bộ 2 chiều isOpened từ props
  const parentOpenedRef = React.useRef(isOpened);
  React.useEffect(() => {
    if (parentOpenedRef.current !== isOpened) {
      parentOpenedRef.current = isOpened;
      setOpenState(isOpened);
      if (!isOpened) {
        setCoverGone(false);
        setIsOpening(false);
      } else {
        setCoverGone(true);
        setIsOpening(false);
      }
    }
  }, [isOpened]);

  // Xử lý khi nhấn nút "Mở Thiệp" — Hiệu ứng "Long Phụng Tách Cánh"
  const handleOpenCard = React.useCallback(() => {
    if (isOpening || coverGone) return;
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }
    setIsOpening(true);
    playOpenCardSound();

    if (reduce) {
      setCoverGone(true);
      setOpenState(true);
      setIsOpening(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      return;
    }

    setTimeout(() => {
      setCoverGone(true);
      setOpenState(true);
      setIsOpening(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 750);
  }, [isOpening, coverGone, reduce, onOpenedChange, contained]);

  // Multi-event support
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent.startsAt || "2027-03-20T10:00:00+07:00";
  const dateParts = formatWeddingDateParts(eventDateStr);
  const lunarClean = formatLunarDateClean(eventDateStr);

  // Lọc album ảnh cưới
  const isFree = (data.plan ?? "free") === "free";
  const rawAlbum = data.photos?.gallery || [];
  const albumPhotos = isFree ? rawAlbum.slice(0, 5) : rawAlbum;
  const [activePhotoIdx, setActivePhotoIdx] = React.useState<number>(0);

  // Timeline & Dress code
  const timelineItems = getTimeline(data);
  const dressColors = getDressColors(data);

  // Countdown timer an toàn hydration
  const [countdown, setCountdown] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const target = new Date(eventDateStr).getTime();
    const updateCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [eventDateStr]);

  // Sinh ma trận ngày tháng cho lịch (hỗ trợ nhiều lễ)
  const calendarGrid = React.useMemo(() => {
    const targetDate = new Date(eventDateStr);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const currentDay = targetDate.getDate();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const eventDays = new Set(
      visibleEvents
        .map((evt) => {
          const d = new Date(evt.startsAt || eventDateStr);
          return d.getFullYear() === year && d.getMonth() === month ? d.getDate() : null;
        })
        .filter((d): d is number => d !== null)
    );
    if (eventDays.size === 0) {
      eventDays.add(currentDay);
    }

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    return {
      days,
      currentDay,
      eventDays,
      monthYear: `THÁNG ${month + 1} / ${year}`,
    };
  }, [eventDateStr, visibleEvents]);

  // Section order & hidden sections
  const hiddenSections = React.useMemo(() => {
    return new Set(data.hiddenSections || []);
  }, [data.hiddenSections]);

  const defaultOrder = React.useMemo(
    () => [
      "family",
      "map",
      "album",
      "albumQr",
      "calendar",
      "dresscode",
      "gift",
      "rsvp",
    ],
    []
  );

  const sectionOrder = React.useMemo(() => {
    const order = data.sectionOrder || defaultOrder;
    const seen = new Set(order);
    const remaining = defaultOrder.filter((key) => !seen.has(key));
    return [...order, ...remaining];
  }, [data.sectionOrder, defaultOrder]);

  const orderOf = React.useCallback(
    (key: string) => {
      const idx = sectionOrder.indexOf(key);
      return idx === -1 ? 99 : idx;
    },
    [sectionOrder]
  );

  const coupleDisplayName = `${data.couple?.groomName || "Long Vũ"} & ${data.couple?.brideName || "Phụng Hoàng"}`;

  return (
    <div
      className={cn(
        "relative w-full mx-auto select-text overflow-x-hidden text-[#F2EAE0]",
        contained
          ? (!coverGone ? "h-full overflow-hidden" : "min-h-full")
          : (!coverGone ? "h-screen-dvh max-h-full overflow-hidden" : "min-h-screen")
      )}
      style={{
        backgroundColor: OBSIDIAN_MAIN,
        color: TEXT_BODY,
        fontFamily: BODY_FONT,
      }}
    >
      {/* ============================================================
          MÀN HÌNH BÌA MỞ THIỆP — "LONG PHỤNG KHAI MÔN"
          ============================================================ */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            key="obsidian-cover"
            className={cn(
              "absolute inset-0 z-50 w-full max-w-full overflow-hidden flex flex-col items-center justify-center px-4 py-4 sm:px-6 select-none",
              contained ? "h-full" : "h-screen-dvh"
            )}
            style={{
              backgroundImage:
                viewport === "desktop"
                  ? "url(/templates/huyen-kim-long-phung/background.webp)"
                  : "url(/templates/huyen-kim-long-phung/background-mobile.webp)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 0.96,
              transition: { duration: 0.65, ease: EASE_IMPERIAL },
            }}
          >
            {/* Hiệu ứng bụi vàng lá trôi cực chậm */}
            <GoldLeafDust count={16} />

            {/* Thẻ Sơn Mài Đen Huyền Trung Tâm */}
            <m.div
              className="relative w-full max-w-[328px] sm:max-w-[380px] mx-auto my-auto flex flex-col items-center text-center rounded-3xl p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85)] border border-[#D9B368]/50 backdrop-blur-md overflow-hidden"
              style={{ backgroundColor: OBSIDIAN_CARD }}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={
                isOpening
                  ? { scale: 1.03, opacity: 0, y: -25, transition: { duration: 0.65, ease: EASE_IMPERIAL } }
                  : { scale: 1, opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_IMPERIAL } }
              }
            >
              {/* Viền chỉ vàng cổ kép lồng bên trong */}
              <div className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#D9B368]/35" />

              {/* 4 Góc Hoa Văn Kim Khắc corner-gold.webp */}
              <img
                src="/templates/huyen-kim-long-phung/corner-gold.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-3 left-3 w-10 sm:w-12 object-contain opacity-75 z-10"
              />
              <img
                src="/templates/huyen-kim-long-phung/corner-gold.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-3 right-3 w-10 sm:w-12 object-contain opacity-75 -scale-x-100 z-10"
              />
              <img
                src="/templates/huyen-kim-long-phung/corner-gold.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 left-3 w-10 sm:w-12 object-contain opacity-75 -scale-y-100 z-10"
              />
              <img
                src="/templates/huyen-kim-long-phung/corner-gold.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 right-3 w-10 sm:w-12 object-contain opacity-75 -scale-100 z-10"
              />

              {/* Linh vật Rồng & Phượng chầu ở lớp nền (z-0) với hiệu ứng Tách Cánh khi mở */}
              <m.img
                src="/templates/huyen-kim-long-phung/dragon-left.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 w-20 sm:w-28 object-contain opacity-25 sm:opacity-35 z-0"
                animate={
                  isOpening
                    ? { x: -80, opacity: 0, transition: { duration: 0.55, ease: EASE_IMPERIAL } }
                    : { x: 0, opacity: 0.3 }
                }
              />
              <m.img
                src="/templates/huyen-kim-long-phung/phoenix-right.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-20 sm:w-28 object-contain opacity-25 sm:opacity-35 z-0"
                animate={
                  isOpening
                    ? { x: 80, opacity: 0, transition: { duration: 0.55, ease: EASE_IMPERIAL } }
                    : { x: 0, opacity: 0.3 }
                }
              />

              {/* Lớp nội dung trước (relative z-20: 100% sắc nét) */}
              {/* Kim Ấn Song Hỷ 囍 vàng 24K nền men đen ở đỉnh */}
              <div className="relative mt-2 mb-3 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center z-20">
                <m.div
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(217,179,104,0.45) 0%, transparent 70%)",
                    filter: "blur(8px)",
                  }}
                  animate={
                    isOpening
                      ? { scale: [1, 1.8], opacity: [0.5, 1], rotate: [0, 45], transition: { duration: 0.4 } }
                      : { scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }
                  }
                />
                <img
                  src="/templates/huyen-kim-long-phung/emblem-songhy.webp"
                  alt="Kim Ấn Song Hỷ"
                  className="relative z-20 w-full h-full object-contain drop-shadow-lg"
                />
              </div>

              {/* Phụ đề phong cách */}
              <p
                className="relative z-20 text-[11px] uppercase tracking-[0.3em] text-[#D9B368] font-semibold mb-2"
                style={{ fontFamily: BODY_FONT }}
              >
                {data.ui?.eyebrow || "The Wedding Invitation"}
              </p>

              {/* Tên cặp đôi 3 dòng Ánh Vàng Champagne #F4DC9E sắc nét */}
              <div className="relative z-20 my-2 flex flex-col items-center">
                <h1
                  className="text-2xl sm:text-3xl font-normal text-[#F4DC9E] tracking-wide"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  <span className="block leading-tight">{data.couple?.groomName || "Long Vũ"}</span>
                  <span className="block text-[#D9B368] text-xl sm:text-2xl my-1 font-serif italic">&amp;</span>
                  <span className="block leading-tight">{data.couple?.brideName || "Phụng Hoàng"}</span>
                </h1>
              </div>

              {/* Dải phân cách hoa văn vàng 24K */}
              <div className="relative z-20 my-2.5 w-36 sm:w-44 flex justify-center">
                <img
                  src="/templates/huyen-kim-long-phung/divider-gold.webp"
                  alt=""
                  aria-hidden="true"
                  className="w-full object-contain opacity-85"
                />
              </div>

              {/* Lời trân trọng kính mời */}
              <p
                className="relative z-20 text-[11px] uppercase tracking-[0.22em] text-[#C8B9A6] font-semibold mt-1 mb-2"
                style={{ fontFamily: BODY_FONT }}
              >
                {data.ui?.invitePrefix || "Trân Trọng Kính Mời"}
              </p>

              {/* Khối tên khách mời */}
              <div className="relative z-20 my-1.5 px-5 py-2 rounded-xl bg-[#0B0A09]/80 border border-[#D9B368]/45 shadow-inner max-w-[260px]">
                <p className="text-xs sm:text-sm font-semibold text-[#F2EAE0] truncate">
                  {guestName || data.ui?.defaultGuestName || "Quý Khách Quý Mến"}
                </p>
              </div>

              {/* Nút bấm Mở Thiệp ánh vàng 24K */}
              <button
                onClick={handleOpenCard}
                disabled={isOpening}
                className="group relative z-20 mt-5 px-8 py-2.5 rounded-full bg-gradient-to-r from-[#C89F51] via-[#E8C97E] to-[#C89F51] text-[#0B0A09] border border-[#F4DC9E] shadow-xl flex items-center justify-center text-xs font-serif tracking-[0.2em] font-bold uppercase transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Mở Thiệp</span>
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          RUỘT THIỆP — NỀN SƠN MÀI ĐEN HUYỀN #0B0A09 + KHUNG TRƯNG BÀY DESKTOP
          - Ẩn hoàn toàn (hidden) khi !coverGone để chống trôi màn hình
          ============================================================ */}
      <div
        className={cn(
          "relative w-full flex flex-col items-center",
          !coverGone && "hidden"
        )}
        style={{
          backgroundImage: viewport === "desktop" ? "url(/templates/huyen-kim-long-phung/background.webp)" : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* Nút nhạc nổi góc dưới màn hình */}
        {!externalMusicControl && data.music?.src && !data.hiddenSections?.includes("music") && (
          <LiveMusicFloatingButton
            src={data.music.src}
            title={data.music.title || "Huyền Kim Hoàng Gia"}
            visible={openState}
            tone="velvet"
          />
        )}

        <main className="relative z-10 w-full max-w-[840px] px-4 sm:px-6 pt-12 pb-24 flex flex-col gap-12 sm:gap-16 border-x border-[#D9B368]/20 bg-[#0B0A09]/95 shadow-[0_0_80px_rgba(0,0,0,0.9)]">
          {/* ============================================================
              HERO SECTION — "LONG PHỤNG HÒA MINH"
              - Vòng hào quang vàng xoay siêu chậm
              - Rồng và Phượng chầu đối xứng 2 góc đáy (thu gọn w-20 trên mobile, chừa >= 200px ở giữa)
              - Kim Ấn Song Hỷ + tên cặp đôi 3 dòng nổi bật
              - Tuyệt đối không lặp ngày cưới tại Hero
              ============================================================ */}
          <section className="relative w-full rounded-3xl bg-[#12100E]/94 border border-[#D9B368]/50 p-6 sm:p-12 pb-16 sm:pb-20 md:pb-24 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
            {/* 4 Góc Hoa Văn Kim Khắc corner-gold.webp */}
            <img
              src="/templates/huyen-kim-long-phung/corner-gold.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute top-3 left-3 w-10 sm:w-14 object-contain opacity-70 z-10"
            />
            <img
              src="/templates/huyen-kim-long-phung/corner-gold.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute top-3 right-3 w-10 sm:w-14 object-contain opacity-70 -scale-x-100 z-10"
            />
            <img
              src="/templates/huyen-kim-long-phung/corner-gold.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 left-3 w-10 sm:w-14 object-contain opacity-70 -scale-y-100 z-10"
            />
            <img
              src="/templates/huyen-kim-long-phung/corner-gold.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 right-3 w-10 sm:w-14 object-contain opacity-70 -scale-100 z-10"
            />

            {/* Vòng hào quang vàng 24K xoay siêu chậm ở nền */}
            <m.div
              className="pointer-events-none absolute top-12 sm:top-16 w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-dashed border-[#D9B368]/30 z-0"
              animate={reduce ? {} : { rotate: 360 }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            />

            {/* Linh vật Rồng (trái) và Phượng (phải) chầu ở góc đáy, không che chữ */}
            <m.img
              src="/templates/huyen-kim-long-phung/dragon-left.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 w-20 sm:w-28 md:w-36 object-contain opacity-35 sm:opacity-60 z-0"
              animate={reduce ? {} : { y: [-3, 3, -3] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <m.img
              src="/templates/huyen-kim-long-phung/phoenix-right.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 w-20 sm:w-28 md:w-36 object-contain opacity-35 sm:opacity-60 z-0"
              animate={reduce ? {} : { y: [3, -3, 3] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Kim Ấn Song Hỷ tỏa ánh vàng */}
            <div className="relative mt-4 mb-4 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center z-10">
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(217,179,104,0.4) 0%, transparent 70%)",
                  filter: "blur(6px)",
                }}
              />
              <img
                src="/templates/huyen-kim-long-phung/emblem-songhy.webp"
                alt="Kim Ấn Song Hỷ"
                className="relative z-10 w-full h-full object-contain drop-shadow-md"
              />
            </div>

            {/* Tiêu đề & Lời ngỏ */}
            <span className="relative z-10 text-[11px] uppercase tracking-[0.3em] text-[#D9B368] font-semibold mb-3">
              {data.ui?.eyebrow || "Hôn Lễ Khắc Vàng Hoàng Gia"}
            </span>

            {/* Tên cặp đôi 3 dòng nghệ thuật */}
            <div className="relative z-10 my-2 flex flex-col items-center">
              <h1
                className="text-3xl sm:text-5xl text-[#F4DC9E] font-normal tracking-wide"
                style={{ fontFamily: TITLE_FONT }}
              >
                <span className="block">{data.couple?.groomFullName || data.couple?.groomName || "Lê Long Vũ"}</span>
                <span className="block text-[#D9B368] text-2xl sm:text-3xl my-2 font-serif italic">&amp;</span>
                <span className="block">{data.couple?.brideFullName || data.couple?.brideName || "Nguyễn Phụng Hoàng"}</span>
              </h1>
            </div>

            {/* Châm ngôn tình yêu (quote) nếu có */}
            {data.quote && (
              <p
                className="relative z-10 mt-4 text-xs sm:text-sm text-[#F2EAE0] italic max-w-[480px] leading-relaxed"
                style={{ fontFamily: NAME_FONT }}
              >
                &ldquo;{data.quote}&rdquo;
              </p>
            )}

            {/* Dải phân cách hoa văn vàng 24K */}
            <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] mx-auto mt-6">
              <img
                src="/templates/huyen-kim-long-phung/divider-gold.webp"
                alt="Divider"
                className="w-full object-contain opacity-85"
              />
            </div>
          </section>

          {/* ============================================================
              DỰNG CÁC KHỐI THEO THỨ TỰ CỦA SECTION ORDER
              ============================================================ */}
          <div className="flex flex-col gap-12 sm:gap-16">
            {/* Section 1: Thông tin gia đình (family) */}
            {!hiddenSections.has("family") && (
              <div style={{ order: orderOf("family") }}>
                <section className="relative w-full rounded-3xl bg-[#12100E]/94 border border-[#D9B368]/45 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-md overflow-hidden">
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B368] font-semibold mb-1">
                      Hai Bên Gia Đình
                    </span>
                    <h2
                      className="text-2xl sm:text-3xl text-[#F4DC9E] font-normal mb-2"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Trân Trọng Báo Tin
                    </h2>
                    <p className="text-xs sm:text-sm text-[#C8B9A6] max-w-[420px] mb-8">
                      Lễ Thành Hôn của con chúng tôi được tổ chức với sự chứng kiến và chúc phúc của hai họ:
                    </p>

                    {/* 2 Cột gia đình cao bằng nhau (items-stretch) */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
                      {/* Nhà Trai */}
                      <div className="h-full flex flex-col items-center justify-between p-6 rounded-2xl bg-[#0B0A09]/80 border border-[#D9B368]/35 shadow-inner">
                        <span className="text-xs uppercase tracking-widest text-[#D9B368] font-semibold mb-3">
                          Nhà Trai
                        </span>
                        <div className="flex-1 flex flex-col justify-center my-2 text-sm text-[#F2EAE0] leading-relaxed">
                          {data.couple?.groomParents ? (
                            data.couple.groomParents.split("&").map((parent, idx) => (
                              <p key={idx} className="font-medium text-[#F4DC9E]">
                                {parent.trim()}
                              </p>
                            ))
                          ) : (
                            <>
                              <p className="font-medium text-[#F4DC9E]">Ông Lê Văn Long</p>
                              <p className="font-medium text-[#F4DC9E]">Bà Trần Thị Ngọc</p>
                            </>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#D9B368]/30 w-full flex flex-col items-center">
                          <span className="text-[11px] uppercase tracking-wider text-[#D9B368] mb-1">
                            {data.couple?.groomTitle || "Chú Rể"}
                          </span>
                          <span
                            className="text-lg sm:text-xl text-[#F4DC9E] font-semibold"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {data.couple?.groomFullName || data.couple?.groomName || "Long Vũ"}
                          </span>
                        </div>
                      </div>

                      {/* Nhà Gái */}
                      <div className="h-full flex flex-col items-center justify-between p-6 rounded-2xl bg-[#0B0A09]/80 border border-[#D9B368]/35 shadow-inner">
                        <span className="text-xs uppercase tracking-widest text-[#D9B368] font-semibold mb-3">
                          Nhà Gái
                        </span>
                        <div className="flex-1 flex flex-col justify-center my-2 text-sm text-[#F2EAE0] leading-relaxed">
                          {data.couple?.brideParents ? (
                            data.couple.brideParents.split("&").map((parent, idx) => (
                              <p key={idx} className="font-medium text-[#F4DC9E]">
                                {parent.trim()}
                              </p>
                            ))
                          ) : (
                            <>
                              <p className="font-medium text-[#F4DC9E]">Ông Nguyễn Hoàng Nam</p>
                              <p className="font-medium text-[#F4DC9E]">Bà Phạm Thị Mai</p>
                            </>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#D9B368]/30 w-full flex flex-col items-center">
                          <span className="text-[11px] uppercase tracking-wider text-[#D9B368] mb-1">
                            {data.couple?.brideTitle || "Cô Dâu"}
                          </span>
                          <span
                            className="text-lg sm:text-xl text-[#F4DC9E] font-semibold"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {data.couple?.brideFullName || data.couple?.brideName || "Phụng Hoàng"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Section 2: Thông tin Lễ Cưới (map / ceremony — Vị trí ngày cưới #1) */}
            {!hiddenSections.has("map") && (
              <div style={{ order: orderOf("map") }}>
                <section className="relative w-full rounded-3xl bg-[#12100E]/94 border border-[#D9B368]/45 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B368] font-semibold mb-1">
                    Thời Gian & Địa Điểm
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F4DC9E] font-normal mb-6"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {visibleEvents.length > 1 ? "Sự Kiện Trọng Đại" : (visibleEvents[0]?.title || "Lễ Thành Hôn")}
                  </h2>

                  <div
                    className={cn(
                      "w-full grid gap-6",
                      visibleEvents.length === 1 ? "max-w-[480px]" : "grid-cols-1 md:grid-cols-2 max-w-4xl"
                    )}
                  >
                    {visibleEvents.map((evt, idx) => {
                      const evtDateParts = formatWeddingDateParts(evt.startsAt || eventDateStr);
                      const evtLunar = formatLunarDateClean(evt.startsAt || eventDateStr);
                      const directionsUrl = getEventDirectionsUrl(evt);

                      return (
                        <div
                          key={evt.id || `evt-${idx}`}
                          className="w-full p-5 sm:p-6 rounded-2xl bg-[#0B0A09]/85 border border-[#D9B368]/40 shadow-inner flex flex-col items-center justify-between"
                        >
                          <span className="text-xs uppercase tracking-[0.2em] text-[#D9B368] font-bold mb-3">
                            {evt.title || (idx === 0 ? "Lễ Vu Quy" : "Tiệc Báo Hỷ")}
                          </span>

                          {/* Khối ngày ngang (THỨ | NGÀY | THÁNG) ánh vàng 24K */}
                          <div className="w-full p-4 rounded-xl bg-[#12100E]/90 border border-[#D9B368]/30 mb-4">
                            <div className="flex items-center justify-around text-center divide-x divide-[#D9B368]/40">
                              <div className="flex-1 px-1">
                                <span className="block text-[10px] text-[#D9B368] uppercase tracking-wider mb-1">
                                  Thứ
                                </span>
                                <span
                                  className="text-xs sm:text-sm font-bold text-[#F4DC9E]"
                                  style={{ fontFamily: TITLE_FONT }}
                                >
                                  {evtDateParts.weekday || "Thứ Bảy"}
                                </span>
                              </div>
                              <div className="flex-1 px-1">
                                <span className="block text-[10px] text-[#D9B368] uppercase tracking-wider mb-1">
                                  Ngày
                                </span>
                                <span
                                  className="text-xl sm:text-2xl font-bold text-[#F4DC9E]"
                                  style={{ fontFamily: TITLE_FONT }}
                                >
                                  {evtDateParts.day || "20"}
                                </span>
                              </div>
                              <div className="flex-1 px-1">
                                <span className="block text-[10px] text-[#D9B368] uppercase tracking-wider mb-1">
                                  Tháng
                                </span>
                                <span
                                  className="text-xs sm:text-sm font-bold text-[#F4DC9E]"
                                  style={{ fontFamily: TITLE_FONT }}
                                >
                                  {evtDateParts.month || "Tháng 03"}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2.5 border-t border-[#D9B368]/20 flex items-center justify-center gap-3 text-[11px] text-[#C8B9A6]">
                              <span>Năm {evtDateParts.year || "2027"}</span>
                              <span className="text-[#D9B368]">&bull;</span>
                              <span>(Tức {evtLunar})</span>
                            </div>
                          </div>

                          {/* Giờ cử hành & Địa điểm */}
                          <div className="w-full flex flex-col items-center gap-3 mb-5">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#F2EAE0] font-medium">
                              <Clock className="w-4 h-4 text-[#D9B368]" />
                              <span>
                                Giờ Cử Hành:{" "}
                                <strong className="text-[#D9B368] font-semibold">
                                  {evtDateParts.time || "10:00"}
                                </strong>
                              </span>
                            </div>

                            <div className="flex flex-col items-center">
                              <div className="flex items-center gap-1.5 text-sm sm:text-base text-[#F4DC9E] font-semibold mb-1">
                                <MapPin className="w-4 h-4 text-[#D9B368] shrink-0" />
                                <span>{evt.venueName || "Trung Tâm Hội Nghị"}</span>
                              </div>
                              <p className="text-xs text-[#C8B9A6]">
                                {evt.venueAddress}
                              </p>
                            </div>
                          </div>

                          {/* Nút chỉ đường Google Maps */}
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#C89F51] via-[#E8C97E] to-[#C89F51] text-[#0B0A09] text-xs font-serif tracking-widest font-bold uppercase shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer mt-auto"
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#0B0A09]" />
                            <span>Chỉ Đường Google Maps</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* Section 3: Album Ảnh Cưới Black-Tie (album & albumQr) */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <div style={{ order: orderOf("album") }}>
                <section className="relative w-full rounded-3xl bg-[#12100E]/94 border border-[#D9B368]/45 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B368] font-semibold mb-1">
                    Khoảnh Khắc Hoàng Gia
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F4DC9E] font-normal mb-8"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Album Ảnh Cưới
                  </h2>

                  {/* 3D Coverflow / Carousel */}
                  <div className="relative w-full max-w-[560px] flex items-center justify-center">
                    {albumPhotos.length > 1 && (
                      <button
                        onClick={() =>
                          setActivePhotoIdx((prev) => (prev - 1 + albumPhotos.length) % albumPhotos.length)
                        }
                        className="absolute left-2 z-20 w-10 h-10 rounded-full bg-[#0B0A09]/80 border border-[#D9B368] text-[#F4DC9E] flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Ảnh trước"
                      >
                        <ChevronLeft className="w-5 h-5 text-[#D9B368]" />
                      </button>
                    )}

                    <div
                      className="relative w-full aspect-[4/5] sm:aspect-[3/4] max-w-[400px] rounded-2xl overflow-hidden shadow-2xl border border-[#D9B368]/60 cursor-pointer group"
                      onClick={() => setLightboxIndex(activePhotoIdx)}
                    >
                      <img
                        src={albumPhotos[activePhotoIdx]?.url || "/photos/hero2.webp"}
                        alt="Ảnh cưới"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A09]/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <span className="text-xs text-[#F2EAE0] bg-[#0B0A09]/80 px-4 py-1.5 rounded-full border border-[#D9B368]/50 flex items-center gap-1.5">
                          Phóng to xem ảnh
                        </span>
                      </div>
                    </div>

                    {albumPhotos.length > 1 && (
                      <button
                        onClick={() =>
                          setActivePhotoIdx((prev) => (prev + 1) % albumPhotos.length)
                        }
                        className="absolute right-2 z-20 w-10 h-10 rounded-full bg-[#0B0A09]/80 border border-[#D9B368] text-[#F4DC9E] flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Ảnh kế tiếp"
                      >
                        <ChevronRight className="w-5 h-5 text-[#D9B368]" />
                      </button>
                    )}
                  </div>

                  {/* Bộ đếm ảnh 1 / N */}
                  {albumPhotos.length > 1 && (
                    <div className="flex items-center gap-2 mt-6">
                      <span className="text-xs font-serif tracking-widest text-[#D9B368]">
                        {activePhotoIdx + 1} / {albumPhotos.length}
                      </span>
                    </div>
                  )}

                  {/* QR tải ảnh khách mời (chỉ hiện ở gói trả phí) */}
                  {!isFree && !hiddenSections.has("albumQr") && (
                    <div className="mt-8 pt-6 border-t border-[#D9B368]/30 w-full flex justify-center">
                      <GuestAlbumQr slug={weddingSlug} accentColor="#D9B368" textColor="#F4DC9E" mutedColor="#C8B9A6" />
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* Section 4: Tiệc Cưới, Đếm Ngược & Lịch Ngày Vui (calendar — Vị trí ngày cưới #2) */}
            {!hiddenSections.has("calendar") && (
              <div style={{ order: orderOf("calendar") }}>
                <section className="relative w-full rounded-3xl bg-[#12100E]/94 border border-[#D9B368]/45 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B368] font-semibold mb-1">
                    Đếm Ngược Ngày Vui
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F4DC9E] font-normal mb-6"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Ngày Hạnh Phúc
                  </h2>

                  {/* Khối Lịch Tháng Trên Nền Đen Huyền Viền Vàng 24K */}
                  <div className="w-full max-w-[380px] p-6 rounded-2xl bg-[#0B0A09]/90 text-[#F2EAE0] shadow-lg border border-[#D9B368]/50 mb-8">
                    <div className="text-center font-serif tracking-[0.2em] text-sm text-[#D9B368] font-semibold mb-4 pb-3 border-b border-[#D9B368]/40">
                      {calendarGrid.monthYear}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-[#D9B368] font-semibold">
                      <span>T2</span>
                      <span>T3</span>
                      <span>T4</span>
                      <span>T5</span>
                      <span>T6</span>
                      <span>T7</span>
                      <span>CN</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-serif">
                      {calendarGrid.days.map((dayNum, idx) => {
                        if (dayNum === null) {
                          return <div key={`empty-${idx}`} className="h-8" />;
                        }
                        const isSpecial = calendarGrid.eventDays.has(dayNum);
                        return (
                          <div
                            key={`day-${dayNum}`}
                            className={cn(
                              "h-8 flex items-center justify-center rounded-full text-xs transition-all",
                              isSpecial
                                ? "relative font-bold text-[#0B0A09] bg-[#D9B368] shadow-md scale-105"
                                : "text-[#F2EAE0] hover:bg-[#1C1814]"
                            )}
                          >
                            {dayNum}
                            {isSpecial && (
                              <Heart className="absolute -top-1 -right-1 w-3.5 h-3.5 fill-[#D9B368] text-[#D9B368] animate-pulse" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Đồng hồ đếm ngược */}
                  <div className="w-full max-w-[420px] grid grid-cols-4 gap-2 sm:gap-3 text-center mb-6">
                    {[
                      { label: "Ngày", val: countdown.days },
                      { label: "Giờ", val: countdown.hours },
                      { label: "Phút", val: countdown.minutes },
                      { label: "Giây", val: countdown.seconds },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0B0A09]/80 border border-[#D9B368]/40 shadow-xs"
                      >
                        <span
                          className="text-xl sm:text-2xl font-bold text-[#F4DC9E]"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {String(item.val).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#D9B368] uppercase tracking-wider mt-1">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Nút thêm vào lịch */}
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                      `Đám cưới ${data.couple?.groomName || "Long Vũ"} & ${data.couple?.brideName || "Phụng Hoàng"}`
                    )}&dates=${new Date(eventDateStr)
                      .toISOString()
                      .replace(/-|:|\.\d\d\d/g, "")}/${new Date(
                        new Date(eventDateStr).getTime() + 3 * 3600 * 1000
                      )
                        .toISOString()
                        .replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent(
                          `Trân trọng kính mời đến dự lễ cưới của ${data.couple?.groomName || "Long Vũ"} & ${data.couple?.brideName || "Phụng Hoàng"}`
                        )}&location=${encodeURIComponent(targetEvent.venueAddress || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 rounded-full bg-[#0B0A09] hover:bg-[#1C1814] border border-[#D9B368] text-xs font-serif tracking-widest text-[#D9B368] uppercase shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#D9B368]" />
                    <span>Thêm Vào Lịch Của Bạn</span>
                  </a>
                </section>
              </div>
            )}

            {/* Section 5: Dress Code & Lịch Trình (dresscode) */}
            {!hiddenSections.has("dresscode") && (
              <div style={{ order: orderOf("dresscode") }}>
                <section className="relative w-full rounded-3xl bg-[#12100E]/94 border border-[#D9B368]/45 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B368] font-semibold mb-1">
                    Gợi Ý Trang Phục
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F4DC9E] font-normal mb-3"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Dress Code
                  </h2>
                  <p className="text-xs sm:text-sm text-[#C8B9A6] max-w-[420px] mb-6">
                    Để buổi tiệc thêm phần trang trọng và đồng điệu, quý khách có thể chọn trang phục theo tông màu:
                  </p>

                  {/* 3 vòng tròn màu Dress Code động có viền chỉ vàng 24K */}
                  <div className="flex items-center justify-center gap-4 sm:gap-6 mb-12">
                    {dressColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 border-[#D9B368] shadow-lg transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={color}
                        aria-label={`Màu trang phục ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Timeline "Hành Trình Hoàng Kim" */}
                  <div className="w-full max-w-[460px] pt-8 border-t border-[#D9B675]/30">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B368] font-semibold block mb-2">
                      Lịch Trình Tiệc Cưới
                    </span>
                    <h3
                      className="text-xl sm:text-2xl text-[#F4DC9E] font-normal mb-8"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Hành Trình Hoàng Kim
                    </h3>

                    <div className="relative flex flex-col gap-6 text-left pl-6">
                      {/* Trục dọc chỉ vàng 24K tự vẽ mượt (scaleY) */}
                      <m.div
                        className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-[#D9B368]/60 origin-top"
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: EASE_IMPERIAL }}
                      />

                      {timelineItems.map((item, idx) => (
                        <div key={idx} className="relative flex items-start gap-4">
                          {/* Hình thoi vàng 24K phát sáng dịu đồng trục */}
                          <div className="absolute -left-6 top-1.5 w-3 h-3 rotate-45 bg-[#D9B368] shadow-sm" />
                          <div className="flex flex-col">
                            <span
                              className="text-sm font-bold text-[#D9B368]"
                              style={{ fontFamily: TITLE_FONT }}
                            >
                              {item.time}
                            </span>
                            <span className="text-xs sm:text-sm text-[#F2EAE0] mt-0.5 leading-relaxed">
                              {item.label}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Section 6: Hộp Quà Sơn Mài Đen Khảm Vàng 3 Trạng Thái (gift) */}
            {!hiddenSections.has("gift") && (
              <div style={{ order: orderOf("gift") }}>
                <section className="relative w-full rounded-3xl bg-[#12100E]/94 border border-[#D9B368]/45 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B368] font-semibold mb-1">
                    Gửi Lời Chúc Phúc
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F4DC9E] font-normal mb-3"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hộp Mừng Cưới
                  </h2>
                  <p className="text-xs sm:text-sm text-[#C8B9A6] max-w-[420px] mb-8">
                    Sự hiện diện của quý khách là món quà quý giá nhất. Nếu muốn gửi tặng món quà chúc phúc từ phương xa, quý khách có thể chạm vào hộp quà bên dưới:
                  </p>

                  {/* Hộp quà sơn mài đen khảm vàng tương tác 3 trạng thái */}
                  <div
                    className="relative w-64 sm:w-72 aspect-[320/380] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
                    onMouseEnter={() => setActiveParcel("hover")}
                    onMouseLeave={() => setActiveParcel("normal")}
                    onClick={() => {
                      setActiveParcel("active");
                      setTimeout(() => setGiftModalOpen(true), 300);
                    }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 rounded-3xl"
                      style={{
                        background: "radial-gradient(circle, rgba(217,179,104,0.35) 0%, transparent 70%)",
                        filter: "blur(12px)",
                      }}
                    />
                    <img
                      src={`/templates/huyen-kim-long-phung/gift-${activeParcel}.webp`}
                      alt="Hộp mừng cưới sơn mài đen"
                      className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>

                  <button
                    onClick={() => setGiftModalOpen(true)}
                    className="mt-6 px-8 py-2.5 rounded-full bg-gradient-to-r from-[#C89F51] via-[#E8C97E] to-[#C89F51] text-[#0B0A09] text-xs font-serif tracking-widest font-bold uppercase shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Gửi Mừng Cưới
                  </button>
                </section>
              </div>
            )}

            {/* Section 7: Xác nhận tham dự & Sổ Lưu Bút (rsvp) */}
            {!hiddenSections.has("rsvp") && (
              <div style={{ order: orderOf("rsvp") }}>
                <section className="relative w-full rounded-3xl bg-[#12100E]/94 border border-[#D9B368]/45 p-4 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.7)] backdrop-blur-md flex flex-col items-center">
                  <TemplateRsvpSection
                    data={data}
                    mode={mode}
                    tone="obsidian"
                    customTheme={{
                      isDark: true,
                      card: "border border-[#D9B368]/40 bg-[#141210] text-[#F8EED9]",
                      input: "border border-[#D9B368]/40 bg-[#0B0A09] text-[#F8EED9] placeholder:text-[#A37E3B]/70 focus:border-[#D9B368] focus:ring-[#D9B368]",
                      primaryBtn: "bg-gradient-to-r from-[#C89F51] via-[#E8C97E] to-[#C89F51] text-[#0B0A09] hover:opacity-90 font-bold",
                      outlineBtn: "border border-[#D9B368] bg-transparent text-[#D9B368] hover:bg-[#D9B368]/15",
                      alert: "border-[#D9B368]/40 bg-[#141210] text-[#F8EED9]",
                      badge: "border-[#D9B368]/40 bg-[#141210] text-[#D9B368]",
                      optionBg: "#141210",
                      optionColor: "#F8EED9",
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
          </div>

          {/* ============================================================
              FOOTER — ĐẶT NGOÀI FLEX CONTAINER CÓ ORDER
              (Tuyệt đối không lặp lại ngày cưới)
              ============================================================ */}
          <footer className="w-full flex flex-col items-center text-center pt-8 pb-12 border-t border-[#D9B368]/30">
            <div className="w-12 h-12 mb-3 opacity-80">
              <img
                src="/templates/huyen-kim-long-phung/emblem-songhy.webp"
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
            <div className="w-full max-w-[240px] sm:max-w-[300px] mb-4">
              <img
                src="/templates/huyen-kim-long-phung/divider-gold.webp"
                alt="Divider"
                className="w-full object-contain opacity-85"
              />
            </div>
            <h4
              className="text-xl sm:text-2xl text-[#F4DC9E] font-normal mb-2"
              style={{ fontFamily: TITLE_FONT }}
            >
              Chân Thành Cảm Ơn
            </h4>
            <p className="text-xs sm:text-sm text-[#C8B9A6] italic max-w-[420px] leading-relaxed">
              Sự hiện diện và lời chúc phúc chân thành của quý vị là niềm vinh hạnh to lớn cho gia đình chúng tôi!
            </p>
          </footer>
        </main>
      </div>

      {/* ============================================================
          MODALS — RENDER QUA PORTAL (KHI !CONTAINED)
          ============================================================ */}
      <GiftModal
        open={giftModalOpen}
        onClose={() => {
          setGiftModalOpen(false);
          setActiveParcel("normal");
        }}
        gift={data.gift}
        plan={data.plan ?? "free"}
        coupleName={coupleDisplayName}
        guestName={guestName ?? null}
        tone="velvet"
      />

      <TemplateLightboxModal
        photos={albumPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={(idx) => setLightboxIndex(idx)}
      />
    </div>
  );
}

export default HuyenKimLongPhungTemplate;
