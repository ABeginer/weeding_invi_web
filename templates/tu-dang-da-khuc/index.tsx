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
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingEvent, WeddingPlan } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: TỬ ĐẰNG DẠ KHÚC (tu-dang-da-khuc)
   - Nhung Tím Đêm (Nocturnal Amethyst Velvet): #1B0F26 (sâu #12091A, thẻ nhung #221230)
   - Tím Tử Đằng & Diên Vĩ: #A882D6 / #6F429E (nhạt #D7C3F0)
   - Vàng Hoàng Kim Cổ (Antique Baroque Gold): #D9B675 (sáng #F2DBA8, trầm #A88446)
   - Chữ chính trên nền tím: #F8F4FC (Trắng ngọc trai ánh tím, contrast > 13:1)
   - Chữ phụ: #DFD3EC (Tím sương khói)
   - Dress Code mặc định: #2B143D, #D9B675, #A882D6, #F5EFFA
   ============================================================ */

const VELVET_MAIN = "#1B0F26";
const VELVET_DEEP = "#12091A";
const VELVET_CARD = "rgba(34, 18, 48, 0.92)";

const WISTERIA_PURPLE = "#A882D6";
const WISTERIA_LIGHT = "#D7C3F0";

const GOLD_ANTIQUE = "#D9B675";
const GOLD_LIGHT = "#F2DBA8";
const GOLD_DEEP = "#A88446";

const TEXT_LIGHT = "#F8F4FC";
const TEXT_MUTED = "#DFD3EC";
const TEXT_SUBTLE = "#A692BA";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_AMETHYST = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "16:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm tại tiền sảnh Dạ Khúc Tử Đằng" },
  { time: "17:30", label: "Nghi lễ Thành Hôn dưới rèm hoa tử đằng & Lời thề sắt son" },
  { time: "18:00", label: "Dạ tiệc hoàng gia & Nâng ly rượu nồng chúc phúc" },
  { time: "19:30", label: "Vũ khúc tình yêu & Hòa tấu thạch anh du dương" },
  { time: "20:30", label: "Tiễn khách & Trao quà cảm tạ tri ân" },
];

const DEFAULT_DRESS = ["#2B143D", "#D9B675", "#A882D6", "#F5EFFA"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 4) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Hạt Bụi Sao Vàng Kim Lấp Lánh
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function AmethystStarDust({ count = 16 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 19) % 94 + 3}%`,
      size: (idx % 3) + 2.5,
      duration: 8 + (idx % 4) * 2.5,
      delay: (idx * 0.5) % 4,
      yOffset: 30 + (idx % 4) * 20,
      isGold: idx % 2 === 0,
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
            background: p.isGold
              ? "radial-gradient(circle, #F2DBA8 0%, rgba(217,182,117,0.4) 65%, transparent 100%)"
              : "radial-gradient(circle, #FFFFFF 0%, rgba(168,130,214,0.35) 60%, transparent 100%)",
            boxShadow: "0 0 6px 1.5px rgba(217,182,117,0.4)",
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
   COMPONENT CHÍNH: TỬ ĐẰNG DẠ KHÚC
   ============================================================ */
export function TuDangDaKhucTemplate({
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

  // Preload 3 trạng thái phong bì nhung tím hoa diên vĩ
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p1 = new Image();
    p1.src = "/templates/tu-dang-da-khuc/gift-normal.webp";
    const p2 = new Image();
    p2.src = "/templates/tu-dang-da-khuc/gift-hover.webp";
    const p3 = new Image();
    p3.src = "/templates/tu-dang-da-khuc/gift-active.webp";
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

  // Xử lý khi nhấn nút "Mở Thiệp"
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

  // Dữ liệu ngày cưới & đa lễ
  const visibleEvents = React.useMemo(() => getVisibleEvents(data), [data]);
  const targetEvent = React.useMemo(
    () => getNearestUpcomingEvent(visibleEvents, data.date),
    [visibleEvents, data.date]
  );
  const eventDateStr = targetEvent?.startsAt || data.date || "2027-03-20T10:00:00+07:00";
  const dateParts = formatWeddingDateParts(eventDateStr);
  const lunarClean = formatLunarDateClean(eventDateStr);

  const eventDays = React.useMemo(() => {
    const set = new Set<number>();
    visibleEvents.forEach((evt) => {
      const dStr = evt.startsAt || data.date;
      if (!dStr) return;
      const d = new Date(dStr);
      set.add(d.getDate());
    });
    if (set.size === 0 && dateParts.day) {
      set.add(parseInt(dateParts.day, 10));
    }
    return set;
  }, [visibleEvents, data.date, dateParts.day]);

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

  // Sinh ma trận ngày tháng cho lịch
  const calendarGrid = React.useMemo(() => {
    const targetDate = new Date(eventDateStr);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth();
    const currentDay = targetDate.getDate();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

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
      monthYear: `THÁNG ${month + 1} / ${year}`,
    };
  }, [eventDateStr]);

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

  const coupleDisplayName = `${data.couple?.groomName || "Đăng Khoa"} & ${data.couple?.brideName || "Dạ Thảo"}`;

  return (
    <div
      className={cn(
        "relative w-full mx-auto select-text overflow-x-hidden text-[#F8F4FC]",
        contained
          ? (!coverGone ? "h-full overflow-hidden" : "min-h-full")
          : (!coverGone ? "h-screen-dvh max-h-full overflow-hidden" : "min-h-screen")
      )}
      style={{
        backgroundColor: VELVET_MAIN,
        color: TEXT_LIGHT,
        fontFamily: BODY_FONT,
      }}
    >
      {/* ============================================================
          MÀN HÌNH BÌA MỞ THIỆP — HIỆU ỨNG "MÀN HOA TỬ ĐẰNG"
          ============================================================ */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            key="wisteria-cover"
            className={cn(
              "absolute inset-0 z-50 w-full max-w-full overflow-hidden flex flex-col items-center justify-center px-4 py-4 sm:px-6 select-none",
              contained ? "h-full" : "h-screen-dvh"
            )}
            style={{
              backgroundImage:
                viewport === "desktop"
                  ? "url(/templates/tu-dang-da-khuc/background.webp)"
                  : "url(/templates/tu-dang-da-khuc/background-mobile.webp)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 0.96,
              transition: { duration: 0.6, ease: EASE_AMETHYST },
            }}
          >
            {/* Hạt bụi sao vàng kim lấp lánh */}
            <AmethystStarDust count={16} />

            {/* Thẻ Nhung Tím Trầm Trung Tâm */}
            <m.div
              className="relative w-full max-w-[328px] sm:max-w-[380px] mx-auto my-auto flex flex-col items-center text-center rounded-3xl p-6 sm:p-8 shadow-[0_24px_64px_rgba(8,3,14,0.65)] border border-[#D9B675]/45 backdrop-blur-md overflow-hidden"
              style={{ backgroundColor: VELVET_CARD }}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={
                isOpening
                  ? { scale: 1.03, opacity: 0, y: -25, transition: { duration: 0.65, ease: EASE_AMETHYST } }
                  : { scale: 1, opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_AMETHYST } }
              }
            >
              {/* Viền chỉ vàng cổ kép lồng bên trong */}
              <div className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#D9B675]/35" />

              {/* Rèm hoa tử đằng rủ nhẹ ở mép trên thẻ với chuyển động đung đưa êm ái */}
              <m.div
                className="pointer-events-none absolute -top-1 left-0 right-0 w-full flex justify-center z-10"
                animate={
                  reduce
                    ? {}
                    : {
                      rotate: [-1, 1, -1],
                      transition: {
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
                }
              >
                <img
                  src="/templates/tu-dang-da-khuc/wisteria-canopy.webp"
                  alt=""
                  aria-hidden="true"
                  className="w-full max-w-[340px] object-contain drop-shadow-md"
                />
              </m.div>

              {/* Cụm hoa diên vĩ đặt gọn gàng ở góc dưới phải */}
              <img
                src="/templates/tu-dang-da-khuc/iris-corner.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-2 -right-2 w-12 sm:w-14 object-contain drop-shadow-md rotate-180 opacity-90 z-10"
              />

              {/* Trâm thạch anh tím nạm khung vàng cổ phát ánh vàng dịu ở đỉnh */}
              <div className="relative mt-12 sm:mt-14 mb-3 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center z-20">
                <m.div
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(217,182,117,0.45) 0%, transparent 70%)",
                    filter: "blur(8px)",
                  }}
                  animate={
                    isOpening
                      ? { scale: [1, 1.8], opacity: [0.5, 1], transition: { duration: 0.4 } }
                      : { scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }
                  }
                />
                <img
                  src="/templates/tu-dang-da-khuc/amethyst-crest.webp"
                  alt="Trâm Thạch Anh Tử Đằng"
                  className="relative z-10 w-full h-full object-contain drop-shadow-md"
                />
              </div>

              {/* Phụ đề phong cách */}
              <p
                className="relative z-20 text-[11px] uppercase tracking-[0.3em] text-[#D9B675] font-semibold mb-2"
                style={{ fontFamily: BODY_FONT }}
              >
                {data.ui?.eyebrow || "The Wedding Invitation"}
              </p>

              {/* Tên cặp đôi 3 dòng Trắng Ngọc Ánh Tím #F8F4FC sắc nét */}
              <div className="relative z-20 my-2 flex flex-col items-center">
                <h1
                  className="text-2xl sm:text-3xl font-normal text-[#F8F4FC] tracking-wide"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  <span className="block leading-tight">{data.couple?.groomName || "Đăng Khoa"}</span>
                  <span className="block text-[#D9B675] text-xl sm:text-2xl my-1 font-serif italic">&amp;</span>
                  <span className="block leading-tight">{data.couple?.brideName || "Dạ Thảo"}</span>
                </h1>
              </div>

              {/* Dải phân cách hoa văn vàng cổ & chùm tử đằng tím */}
              <div className="relative z-20 my-2.5 w-36 sm:w-44 flex justify-center">
                <img
                  src="/templates/tu-dang-da-khuc/divider-wisteria.webp"
                  alt=""
                  aria-hidden="true"
                  className="w-full object-contain opacity-85"
                />
              </div>

              {/* Lời trân trọng kính mời */}
              <p
                className="relative z-20 text-[11px] uppercase tracking-[0.22em] text-[#DFD3EC] font-semibold mt-1 mb-2"
                style={{ fontFamily: BODY_FONT }}
              >
                {data.ui?.invitePrefix || "Trân Trọng Kính Mời"}
              </p>

              {/* Khối tên khách mời */}
              <div className="relative z-20 my-1.5 px-5 py-2 rounded-xl bg-[#12091A]/70 border border-[#D9B675]/40 shadow-inner max-w-[260px]">
                <p className="text-xs sm:text-sm font-semibold text-[#F8F4FC] truncate">
                  {guestName || data.ui?.defaultGuestName || "Quý Khách Quý Mến"}
                </p>
              </div>

              {/* Nút bấm Mở Thiệp */}
              <button
                onClick={handleOpenCard}
                disabled={isOpening}
                className="group relative z-20 mt-5 px-7 py-2.5 rounded-full bg-[#D9B675] hover:bg-[#F2DBA8] text-[#12091A] border border-[#F2DBA8] shadow-lg flex items-center justify-center text-xs font-serif tracking-[0.2em] font-semibold uppercase transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Mở Thiệp</span>
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          RUỘT THIỆP — NỀN NHUNG TÍM ĐÊM #1B0F26 & ĐƯỜNG CHỈ VÀNG HOÀNG KIM
          - Ẩn hoàn toàn (hidden) khi !coverGone để chống trôi màn hình
          ============================================================ */}
      <div
        className={cn(
          "relative w-full flex flex-col items-center",
          !coverGone && "hidden"
        )}
      >
        {/* Nút nhạc nổi góc dưới màn hình */}
        {!externalMusicControl && data.music?.src && !data.hiddenSections?.includes("music") && (
          <LiveMusicFloatingButton
            src={data.music.src}
            title={data.music.title || "Dạ Khúc Tử Đằng"}
            visible={openState}
            tone="velvet"
          />
        )}

        <main className="relative z-10 w-full max-w-[840px] px-4 sm:px-6 pt-12 pb-24 flex flex-col gap-12 sm:gap-16">
          {/* ============================================================
              HERO SECTION — "DẠ KHÚC TỬ ĐẰNG & DIÊN VĨ"
              - Khung viền đôi chỉ vàng cổ Baroque
              - Rèm tử đằng rủ mềm ở đỉnh
              - 2 hoa diên vĩ đối xứng 2 góc chéo
              - Trâm thạch anh tím + tên cặp đôi 3 dòng nổi bật
              - Tuyệt đối không lặp ngày cưới tại Hero
              ============================================================ */}
          <section className="relative w-full rounded-3xl bg-[#221230]/92 border border-[#D9B675]/50 p-6 sm:p-12 shadow-[0_20px_50px_rgba(8,3,14,0.7)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
            {/* Rèm hoa tử đằng rủ ở đỉnh khung */}
            <div className="pointer-events-none absolute -top-1 left-0 right-0 w-full flex justify-center z-10">
              <img
                src="/templates/tu-dang-da-khuc/wisteria-canopy.webp"
                alt=""
                aria-hidden="true"
                className="w-full max-w-[540px] object-contain opacity-95 drop-shadow-md"
              />
            </div>

            {/* 2 góc chéo trên-trái và dưới-phải gắn iris-corner.webp đối xứng */}
            <img
              src="/templates/tu-dang-da-khuc/iris-corner.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -top-3 -left-3 w-16 sm:w-20 object-contain opacity-80 z-10"
            />
            <img
              src="/templates/tu-dang-da-khuc/iris-corner.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-3 -right-3 w-16 sm:w-20 object-contain opacity-80 rotate-180 z-10"
            />

            {/* Viền đôi chỉ vàng cổ kiểu Baroque hiện đại */}
            <div className="pointer-events-none absolute inset-3 rounded-2xl border border-dashed border-[#D9B675]/30" />

            {/* Trâm thạch anh tím thu gọn tỏa ánh vàng dịu */}
            <div className="relative mt-8 sm:mt-12 mb-4 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center z-20">
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(217,182,117,0.4) 0%, transparent 70%)",
                  filter: "blur(6px)",
                }}
              />
              <img
                src="/templates/tu-dang-da-khuc/amethyst-crest.webp"
                alt="Trâm Thạch Anh Tử Đằng"
                className="relative z-10 w-full h-full object-contain drop-shadow-md"
              />
            </div>

            {/* Tiêu đề & Lời ngỏ */}
            <span className="relative z-20 text-[11px] uppercase tracking-[0.3em] text-[#D9B675] font-semibold mb-3">
              {data.ui?.eyebrow || "Lời Hẹn Ước Trăm Năm"}
            </span>

            {/* Tên cặp đôi 3 dòng nghệ thuật */}
            <div className="relative z-20 my-2 flex flex-col items-center">
              <h1
                className="text-3xl sm:text-5xl text-[#F8F4FC] font-normal tracking-wide"
                style={{ fontFamily: TITLE_FONT }}
              >
                <span className="block">{data.couple?.groomFullName || data.couple?.groomName || "Nguyễn Đăng Khoa"}</span>
                <span className="block text-[#D9B675] text-2xl sm:text-3xl my-2 font-serif italic">&amp;</span>
                <span className="block">{data.couple?.brideFullName || data.couple?.brideName || "Trần Dạ Thảo"}</span>
              </h1>
            </div>

            {/* Châm ngôn tình yêu (quote) nếu có */}
            {data.quote && (
              <p
                className="relative z-20 mt-4 text-xs sm:text-sm text-[#DFD3EC] italic max-w-[480px] leading-relaxed"
                style={{ fontFamily: NAME_FONT }}
              >
                &ldquo;{data.quote}&rdquo;
              </p>
            )}

            {/* Dải phân cách hoa văn vàng cổ */}
            <div className="relative z-20 w-full max-w-[280px] sm:max-w-[340px] mx-auto mt-6">
              <img
                src="/templates/tu-dang-da-khuc/divider-wisteria.webp"
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
                <section className="relative w-full rounded-3xl bg-[#221230]/92 border border-[#D9B675]/45 p-6 sm:p-10 shadow-[0_16px_40px_rgba(8,3,14,0.6)] backdrop-blur-md overflow-hidden">
                  {/* Hoa diên vĩ trang trí góc */}
                  <img
                    src="/templates/tu-dang-da-khuc/iris-corner.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute -top-3 -left-3 w-16 sm:w-20 object-contain pointer-events-none opacity-40"
                  />
                  <img
                    src="/templates/tu-dang-da-khuc/iris-corner.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute -bottom-3 -right-3 w-16 sm:w-20 object-contain pointer-events-none opacity-40 rotate-180"
                  />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B675] font-semibold mb-1">
                      Hai Bên Gia Đình
                    </span>
                    <h2
                      className="text-2xl sm:text-3xl text-[#F8F4FC] font-normal mb-2"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Trân Trọng Báo Tin
                    </h2>
                    <p className="text-xs sm:text-sm text-[#DFD3EC] max-w-[420px] mb-8">
                      Lễ Thành Hôn của con chúng tôi được tổ chức với sự chứng kiến và chúc phúc của hai họ:
                    </p>

                    {/* 2 Cột gia đình cao bằng nhau (items-stretch) */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
                      {/* Nhà Trai */}
                      <div className="h-full flex flex-col items-center justify-between p-6 rounded-2xl bg-[#12091A]/60 border border-[#D9B675]/35 shadow-inner">
                        <span className="text-xs uppercase tracking-widest text-[#D9B675] font-semibold mb-3">
                          Nhà Trai
                        </span>
                        <div className="flex-1 flex flex-col justify-center my-2 text-sm text-[#DFD3EC] leading-relaxed">
                          {data.couple?.groomParents ? (
                            data.couple.groomParents.split("&").map((parent, idx) => (
                              <p key={idx} className="font-medium text-[#F8F4FC]">
                                {parent.trim()}
                              </p>
                            ))
                          ) : (
                            <>
                              <p className="font-medium text-[#F8F4FC]">Ông Nguyễn Văn A</p>
                              <p className="font-medium text-[#F8F4FC]">Bà Trần Thị B</p>
                            </>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#D9B675]/30 w-full flex flex-col items-center">
                          <span className="text-[11px] uppercase tracking-wider text-[#D9B675] mb-1">
                            {data.couple?.groomTitle || "Chú Rể"}
                          </span>
                          <span
                            className="text-lg sm:text-xl text-[#F8F4FC] font-semibold"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {data.couple?.groomFullName || data.couple?.groomName || "Đăng Khoa"}
                          </span>
                        </div>
                      </div>

                      {/* Nhà Gái */}
                      <div className="h-full flex flex-col items-center justify-between p-6 rounded-2xl bg-[#12091A]/60 border border-[#D9B675]/35 shadow-inner">
                        <span className="text-xs uppercase tracking-widest text-[#D9B675] font-semibold mb-3">
                          Nhà Gái
                        </span>
                        <div className="flex-1 flex flex-col justify-center my-2 text-sm text-[#DFD3EC] leading-relaxed">
                          {data.couple?.brideParents ? (
                            data.couple.brideParents.split("&").map((parent, idx) => (
                              <p key={idx} className="font-medium text-[#F8F4FC]">
                                {parent.trim()}
                              </p>
                            ))
                          ) : (
                            <>
                              <p className="font-medium text-[#F8F4FC]">Ông Trần Văn C</p>
                              <p className="font-medium text-[#F8F4FC]">Bà Lê Thị D</p>
                            </>
                          )}
                        </div>
                        <div className="mt-4 pt-3 border-t border-[#D9B675]/30 w-full flex flex-col items-center">
                          <span className="text-[11px] uppercase tracking-wider text-[#D9B675] mb-1">
                            {data.couple?.brideTitle || "Cô Dâu"}
                          </span>
                          <span
                            className="text-lg sm:text-xl text-[#F8F4FC] font-semibold"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {data.couple?.brideFullName || data.couple?.brideName || "Dạ Thảo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Section 2: Thông tin Lễ Cưới (map / ceremony — ĐA LỄ 100%) */}
            {!hiddenSections.has("map") && (
              <div style={{ order: orderOf("map") }}>
                <section className="relative w-full rounded-3xl bg-[#221230]/92 border border-[#D9B675]/45 p-6 sm:p-10 shadow-[0_16px_40px_rgba(8,3,14,0.6)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B675] font-semibold mb-1">
                    Thời Gian &amp; Địa Điểm
                  </span>

                  <div
                    className={cn(
                      "grid gap-6 w-full mt-4",
                      visibleEvents.length > 1
                        ? "grid-cols-1 md:grid-cols-2 text-left"
                        : "max-w-xl mx-auto text-center"
                    )}
                  >
                    {visibleEvents.map((evt, idx) => {
                      const evtDateStr = evt.startsAt || data.date || "2027-03-20T10:00:00+07:00";
                      const evtDateParts = formatWeddingDateParts(evtDateStr);
                      const evtLunar = evt.lunarDate
                        ? formatLunarDateClean(evt.lunarDate)
                        : formatLunarDateClean(evtDateStr);
                      const directionsUrl = getEventDirectionsUrl(evt);

                      return (
                        <div
                          key={evt.id || `event-${idx}`}
                          className="rounded-2xl border border-[#D9B675]/40 bg-[#12091A]/70 p-5 sm:p-6 flex flex-col items-center text-center space-y-3"
                        >
                          <h2
                            className="text-xl sm:text-2xl text-[#F8F4FC] font-normal"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {evt.title || (idx === 0 ? "Lễ Thành Hôn" : `Lễ Cưới ${idx + 1}`)}
                          </h2>

                          {/* Khối ngày ngang (THỨ | NGÀY | THÁNG) */}
                          <div className="w-full max-w-[380px] p-4 rounded-xl bg-[#221230]/60 border border-[#D9B675]/30 shadow-inner">
                            <div className="flex items-center justify-around text-center divide-x divide-[#D9B675]/40">
                              <div className="flex-1 px-2">
                                <span className="block text-[10px] text-[#D9B675] uppercase tracking-wider mb-0.5">
                                  Thứ
                                </span>
                                <span
                                  className="text-xs sm:text-sm font-bold text-[#F8F4FC]"
                                  style={{ fontFamily: TITLE_FONT }}
                                >
                                  {evtDateParts.weekday || "Thứ Bảy"}
                                </span>
                              </div>
                              <div className="flex-1 px-2">
                                <span className="block text-[10px] text-[#D9B675] uppercase tracking-wider mb-0.5">
                                  Ngày
                                </span>
                                <span
                                  className="text-xl sm:text-2xl font-bold text-[#F8F4FC]"
                                  style={{ fontFamily: TITLE_FONT }}
                                >
                                  {evtDateParts.day || "20"}
                                </span>
                              </div>
                              <div className="flex-1 px-2">
                                <span className="block text-[10px] text-[#D9B675] uppercase tracking-wider mb-0.5">
                                  Tháng
                                </span>
                                <span
                                  className="text-xs sm:text-sm font-bold text-[#F8F4FC]"
                                  style={{ fontFamily: TITLE_FONT }}
                                >
                                  {evtDateParts.month || "Tháng 03"}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2.5 border-t border-[#D9B675]/25 flex items-center justify-center gap-3 text-xs text-[#DFD3EC]">
                              <span>Năm {evtDateParts.year || "2027"}</span>
                              {evtLunar && (
                                <>
                                  <span className="text-[#D9B675]">&bull;</span>
                                  <span>(Tức {evtLunar})</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Giờ cử hành & Địa điểm */}
                          <div className="w-full flex flex-col items-center gap-2 pt-1">
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#F8F4FC] font-medium">
                              <Clock className="w-4 h-4 text-[#D9B675]" />
                              <span>
                                Giờ Cử Hành Lễ:{" "}
                                <strong className="text-[#D9B675] font-semibold">
                                  {evtDateParts.time || "10:00"}
                                </strong>
                              </span>
                            </div>

                            <div className="flex flex-col items-center">
                              {evt.venueName && (
                                <div className="flex items-center gap-1.5 text-sm sm:text-base text-[#F8F4FC] font-semibold mb-0.5">
                                  <MapPin className="w-4 h-4 text-[#D9B675]" />
                                  <span>{evt.venueName}</span>
                                </div>
                              )}
                              {evt.venueAddress && (
                                <p className="text-xs text-[#DFD3EC]">
                                  {evt.venueAddress}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Nút tác vụ: Chỉ đường & Thêm vào lịch */}
                          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                            {directionsUrl && (
                              <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2 rounded-full bg-[#D9B675] hover:bg-[#F2DBA8] text-[#12091A] text-xs font-serif tracking-widest font-semibold uppercase shadow-md transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#12091A]" />
                                <span>Chỉ Đường</span>
                              </a>
                            )}
                            <a
                              href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                                `${evt.title || "Lễ Cưới"}: ${data.couple?.groomName || "Chú Rể"} & ${data.couple?.brideName || "Cô Dâu"}`
                              )}&dates=${evtDateStr.replace(/-|:|\./g, "").slice(0, 8)}T040000Z/${evtDateStr.replace(/-|:|\./g, "").slice(0, 8)}T080000Z&details=${encodeURIComponent(
                                `Trân trọng kính mời tham dự ${evt.title || "lễ cưới"} của ${data.couple?.groomName || "Chú Rể"} & ${data.couple?.brideName || "Cô Dâu"}.`
                              )}&location=${encodeURIComponent(evt.venueAddress || "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-5 py-2 rounded-full bg-[#12091A] hover:bg-[#221230] border border-[#D9B675] text-xs font-serif tracking-widest text-[#D9B675] uppercase shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5 text-[#D9B675]" />
                              <span>Thêm Lịch</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* Section 3: Album Ảnh Cưới (album & albumQr) */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <div style={{ order: orderOf("album") }}>
                <section className="relative w-full rounded-3xl bg-[#221230]/92 border border-[#D9B675]/45 p-6 sm:p-10 shadow-[0_16px_40px_rgba(8,3,14,0.6)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B675] font-semibold mb-1">
                    Khoảnh Khắc Kỷ Niệm
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F8F4FC] font-normal mb-8"
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
                        className="absolute left-2 z-20 w-10 h-10 rounded-full bg-[#12091A]/80 border border-[#D9B675] text-[#F8F4FC] flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Ảnh trước"
                      >
                        <ChevronLeft className="w-5 h-5 text-[#D9B675]" />
                      </button>
                    )}

                    <div
                      className="relative w-full aspect-[4/5] sm:aspect-[3/4] max-w-[400px] rounded-2xl overflow-hidden shadow-2xl border border-[#D9B675]/60 cursor-pointer group"
                      onClick={() => setLightboxIndex(activePhotoIdx)}
                    >
                      <img
                        src={albumPhotos[activePhotoIdx]?.url || "/photos/hero2.webp"}
                        alt="Ảnh cưới"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#12091A]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <span className="text-xs text-[#F8F4FC] bg-[#12091A]/80 px-4 py-1.5 rounded-full border border-[#D9B675]/50 flex items-center gap-1.5">
                          Phóng to xem ảnh
                        </span>
                      </div>
                    </div>

                    {albumPhotos.length > 1 && (
                      <button
                        onClick={() =>
                          setActivePhotoIdx((prev) => (prev + 1) % albumPhotos.length)
                        }
                        className="absolute right-2 z-20 w-10 h-10 rounded-full bg-[#12091A]/80 border border-[#D9B675] text-[#F8F4FC] flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Ảnh kế tiếp"
                      >
                        <ChevronRight className="w-5 h-5 text-[#D9B675]" />
                      </button>
                    )}
                  </div>

                  {/* Chấm tròn điều hướng album */}
                  {albumPhotos.length > 1 && (
                    <div className="flex items-center gap-2 mt-6">
                      {albumPhotos.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActivePhotoIdx(idx)}
                          className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all cursor-pointer",
                            idx === activePhotoIdx
                              ? "bg-[#D9B675] scale-125 shadow-md"
                              : "bg-[#D9B675]/35 hover:bg-[#D9B675]/60"
                          )}
                          aria-label={`Xem ảnh ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* QR tải ảnh khách mời (chỉ hiện ở gói trả phí) */}
                  {!isFree && !hiddenSections.has("albumQr") && (
                    <div className="mt-8 pt-6 border-t border-[#D9B675]/30 w-full flex justify-center">
                      <GuestAlbumQr slug={weddingSlug} accentColor="#D9B675" textColor="#F8F4FC" mutedColor="#DFD3EC" />
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* Section 4: Tiệc Cưới, Đếm Ngược & Lịch Ngày Vui (calendar — Vị trí ngày cưới #2) */}
            {!hiddenSections.has("calendar") && (
              <div style={{ order: orderOf("calendar") }}>
                <section className="relative w-full rounded-3xl bg-[#221230]/92 border border-[#D9B675]/45 p-6 sm:p-10 shadow-[0_16px_40px_rgba(8,3,14,0.6)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B675] font-semibold mb-1">
                    Đếm Ngược Ngày Vui
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F8F4FC] font-normal mb-6"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Ngày Hạnh Phúc
                  </h2>

                  {/* Khối Lịch Tháng Trên Nền Tím Đêm Viền Vàng Cổ */}
                  <div className="w-full max-w-[380px] p-6 rounded-2xl bg-[#12091A]/80 text-[#F8F4FC] shadow-lg border border-[#D9B675]/50 mb-8">
                    <div className="text-center font-serif tracking-[0.2em] text-sm text-[#D9B675] font-semibold mb-4 pb-3 border-b border-[#D9B675]/40">
                      {calendarGrid.monthYear}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-[#D9B675] font-semibold">
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
                        const isSpecial = eventDays.has(dayNum);
                        return (
                          <div
                            key={`day-${dayNum}`}
                            className={cn(
                              "h-8 flex items-center justify-center rounded-full text-xs transition-all",
                              isSpecial
                                ? "relative font-bold text-[#12091A] bg-[#D9B675] shadow-md scale-105"
                                : "text-[#DFD3EC] hover:bg-[#221230]"
                            )}
                          >
                            {dayNum}
                            {isSpecial && (
                              <Heart className="absolute -top-1 -right-1 w-3.5 h-3.5 fill-[#D9B675] text-[#D9B675] animate-pulse" />
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
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#12091A]/70 border border-[#D9B675]/40 shadow-xs"
                      >
                        <span
                          className="text-xl sm:text-2xl font-bold text-[#F8F4FC]"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {String(item.val).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#D9B675] uppercase tracking-wider mt-1">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Nút thêm vào lịch */}
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                      `Đám cưới ${data.couple?.groomName || "Đăng Khoa"} & ${data.couple?.brideName || "Dạ Thảo"}`
                    )}&dates=${new Date(eventDateStr)
                      .toISOString()
                      .replace(/-|:|\.\d\d\d/g, "")}/${new Date(
                        new Date(eventDateStr).getTime() + 3 * 3600 * 1000
                      )
                        .toISOString()
                        .replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent(
                          `Trân trọng kính mời đến dự lễ cưới của ${data.couple?.groomName || "Đăng Khoa"} & ${data.couple?.brideName || "Dạ Thảo"}`
                        )}&location=${encodeURIComponent(targetEvent?.venueAddress || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 rounded-full bg-[#12091A] hover:bg-[#221230] border border-[#D9B675] text-xs font-serif tracking-widest text-[#D9B675] uppercase shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#D9B675]" />
                    <span>Thêm Vào Lịch Của Bạn</span>
                  </a>
                </section>
              </div>
            )}

            {/* Section 5: Dress Code & Lịch Trình (dresscode) */}
            {!hiddenSections.has("dresscode") && (
              <div style={{ order: orderOf("dresscode") }}>
                <section className="relative w-full rounded-3xl bg-[#221230]/92 border border-[#D9B675]/45 p-6 sm:p-10 shadow-[0_16px_40px_rgba(8,3,14,0.6)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B675] font-semibold mb-1">
                    Gợi Ý Trang Phục
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F8F4FC] font-normal mb-3"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Dress Code
                  </h2>
                  <p className="text-xs sm:text-sm text-[#DFD3EC] max-w-[420px] mb-6">
                    Để buổi tiệc thêm phần trang trọng và đồng điệu, quý khách có thể chọn trang phục theo tông màu:
                  </p>

                  {/* 4 vòng tròn màu Dress Code động có viền chỉ vàng mảnh */}
                  <div className="flex items-center justify-center gap-4 sm:gap-6 mb-12">
                    {dressColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-11 h-11 sm:w-14 sm:h-14 rounded-full border-2 border-[#D9B675] shadow-lg transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={color}
                        aria-label={`Màu trang phục ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Timeline "Ánh Vàng Dạ Khúc" */}
                  <div className="w-full max-w-[460px] pt-8 border-t border-[#D9B675]/30">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B675] font-semibold block mb-2">
                      Lịch Trình Tiệc Cưới
                    </span>
                    <h3
                      className="text-xl sm:text-2xl text-[#F8F4FC] font-normal mb-8"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Dạ Khúc Thời Gian
                    </h3>

                    <div className="relative flex flex-col gap-6 text-left pl-6">
                      {/* Trục dọc chỉ vàng cổ tự vẽ mượt (scaleY) */}
                      <m.div
                        className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-[#D9B675]/60 origin-top"
                        initial={{ scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: EASE_AMETHYST }}
                      />

                      {timelineItems.map((item, idx) => (
                        <div key={idx} className="relative flex items-start gap-4">
                          {/* Chấm tròn trắng ngọc viền vàng cổ căn thẳng trục */}
                          <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-[#F8F4FC] border-2 border-[#D9B675] shadow-sm" />
                          <div className="flex flex-col">
                            <span
                              className="text-sm font-bold text-[#D9B675]"
                              style={{ fontFamily: TITLE_FONT }}
                            >
                              {item.time}
                            </span>
                            <span className="text-xs sm:text-sm text-[#F8F4FC] mt-0.5 leading-relaxed">
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

            {/* Section 6: Hộp Mừng Cưới / Phong Bì Nhung Tím 3 Trạng Thái (gift) */}
            {!hiddenSections.has("gift") && (
              <div style={{ order: orderOf("gift") }}>
                <section className="relative w-full rounded-3xl bg-[#221230]/92 border border-[#D9B675]/45 p-6 sm:p-10 shadow-[0_16px_40px_rgba(8,3,14,0.6)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D9B675] font-semibold mb-1">
                    Gửi Lời Chúc Phúc
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F8F4FC] font-normal mb-3"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hộp Mừng Cưới
                  </h2>
                  <p className="text-xs sm:text-sm text-[#DFD3EC] max-w-[420px] mb-8">
                    Sự hiện diện của quý khách là món quà quý giá nhất. Nếu muốn gửi tặng món quà chúc phúc từ phương xa, quý khách có thể chạm vào phong bì bên dưới:
                  </p>

                  {/* Phong bì nhung tím hoa diên vĩ tương tác 3 trạng thái */}
                  <div
                    className="relative w-64 sm:w-72 aspect-[340/516] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
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
                        background: "radial-gradient(circle, rgba(217,182,117,0.35) 0%, transparent 70%)",
                        filter: "blur(12px)",
                      }}
                    />
                    <img
                      src={`/templates/tu-dang-da-khuc/gift-${activeParcel}.webp`}
                      alt="Hộp mừng cưới nhung tím"
                      className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>

                  <button
                    onClick={() => setGiftModalOpen(true)}
                    className="mt-6 px-7 py-2.5 rounded-full bg-[#D9B675] hover:bg-[#F2DBA8] text-[#12091A] text-xs font-serif tracking-widest font-semibold uppercase shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Gửi Mừng Cưới
                  </button>
                </section>
              </div>
            )}

            {/* Section 7: Xác nhận tham dự & Sổ Lưu Bút (rsvp) */}
            {!hiddenSections.has("rsvp") && (
              <div style={{ order: orderOf("rsvp") }}>
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="amethyst"
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
            )}
          </div>

          {/* ============================================================
              FOOTER — ĐẶT NGOÀI FLEX CONTAINER CÓ ORDER
              (Tuyệt đối không lặp lại ngày cưới)
              ============================================================ */}
          <footer className="w-full flex flex-col items-center text-center pt-8 pb-12 border-t border-[#D9B675]/40">
            <div className="w-full max-w-[240px] sm:max-w-[300px] mb-4">
              <img
                src="/templates/tu-dang-da-khuc/divider-wisteria.webp"
                alt="Divider"
                className="w-full object-contain opacity-85"
              />
            </div>
            <h4
              className="text-xl sm:text-2xl text-[#F8F4FC] font-normal mb-2"
              style={{ fontFamily: TITLE_FONT }}
            >
              Chân Thành Cảm Ơn
            </h4>
            <p className="text-xs sm:text-sm text-[#DFD3EC] italic max-w-[420px] leading-relaxed">
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
        tone="flowery"
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

export default TuDangDaKhucTemplate;
