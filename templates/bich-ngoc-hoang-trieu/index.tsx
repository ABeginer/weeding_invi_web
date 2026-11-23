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
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playCoverSfx } from "@/lib/sfx";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import {
  getVisibleEvents,
  getNearestUpcomingEvent,
  getEventDirectionsUrl,
} from "@/lib/events";
import type {
  TemplateData,
  WeddingEvent,
  TemplatePhotoItem,
} from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: BÍCH NGỌC HOÀNG TRIỀU (bich-ngoc-hoang-trieu)
   - Xanh Ngọc Lục Bảo Hoàng Gia (Imperial Emerald Jade): #093426 (sâu #051F17, hover #0F4836)
   - Vàng Trống Đồng 24K (Đông Sơn Imperial Gold): #D4B26A (sáng #F0D89C, trầm #A3823D)
   - Kem Giấy Dó Hoàng Gia (Warm Heritage Ivory): #FAF7F0 (thẻ phụ #FFFFFF, thẻ ấm #F3EFE6)
   - Chữ chính trên nền kem: #093426 (tiêu đề) / #334A41 (nội dung, tương phản > 7:1)
   - Chữ chính trên nền ngọc: #F0D89C (tiêu đề nhấn) / #FAF7F0 (nội dung)
   - Dress Code mặc định: #093426 (Ngọc Lục Bảo), #D4B26A (Vàng Trống Đồng), #FAF7F0 (Kem Giấy Dó)
   ============================================================ */

const EMERALD_MAIN = "#093426";
const EMERALD_DEEP = "#051F17";
const EMERALD_CARD = "rgba(9, 52, 38, 0.95)";

const GOLD_24K = "#D4B26A";
const GOLD_LIGHT = "#F0D89C";
const GOLD_DEEP = "#A3823D";

const IVORY_ROYAL = "#FAF7F0";

const TEXT_BODY_EMERALD = "#FAF7F0";
const TEXT_BODY_IVORY = "#334A41";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_IMPERIAL = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "16:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm tại tiền sảnh Bích Ngọc Hoàng Triều" },
  { time: "17:30", label: "Nghi thức Thành Hôn Long Phụng Hòa Minh & Trao lời hẹn ước vàng son" },
  { time: "18:00", label: "Khai tiệc hoàng gia & Nâng ly rượu nồng giao bôi chúc phúc" },
  { time: "19:30", label: "Giai điệu cung đình hoàng gia & Gắn kết thân tình hai họ" },
  { time: "20:30", label: "Tiễn khách & Trao quà cảm tạ tri ân" },
];

const DEFAULT_DRESS = [
  { hex: "#093426", label: "Ngọc Lục Bảo" },
  { hex: "#D4B26A", label: "Vàng Trống Đồng" },
  { hex: "#FAF7F0", label: "Kem Giấy Dó" },
];

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Bụi Vàng Cung Đình Trôi Chậm
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function ImperialGoldDust({ count = 16 }: { count?: number }) {
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-[1]">
      {particles.map((p) => (
        <m.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            background: p.isBright
              ? "radial-gradient(circle, #F0D89C 0%, #D4B26A 70%, transparent 100%)"
              : "radial-gradient(circle, #D4B26A 0%, rgba(212,178,106,0.3) 80%, transparent 100%)",
            boxShadow: p.isBright ? "0 0 8px rgba(240, 216, 156, 0.8)" : "none",
          }}
          animate={{
            y: [0, -700],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * p.yOffset, 0],
            opacity: [0, 0.85, 0.95, 0.4, 0],
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

export default function BichNgocHoangTrieuTemplate({
  data,
  isOpened = false,
  onOpenedChange,
  viewport = "desktop",
  contained = false,
  mode = "preview",
  inviteSlug,
  weddingSlug,
  invitationMode = "personal",
  guestName,
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = "meat",
  initialSongRequest = "",
  initialRideNeeded = false,
}: WeddingTemplateProps) {
  const [isOpen, setIsOpen] = React.useState(isOpened);
  const [isOpening, setIsOpening] = React.useState(false);
  const [coverGone, setCoverGone] = React.useState(isOpened);

  // 2-way sync với parent frame
  const parentOpenedRef = React.useRef(isOpened);
  React.useEffect(() => {
    if (isOpened && !isOpen) {
      setIsOpen(true);
      setCoverGone(true);
    } else if (!isOpened && parentOpenedRef.current) {
      setIsOpen(false);
      setCoverGone(false);
      setIsOpening(false);
    }
    parentOpenedRef.current = isOpened;
  }, [isOpened, isOpen]);

  const handleOpenCover = () => {
    if (isOpen || isOpening) return;
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }
    setIsOpening(true);
    playCoverSfx("royal");
    setTimeout(() => {
      setIsOpen(true);
      setCoverGone(true);
      setIsOpening(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 700);
  };

  // Gift modal state & Parcel hover


  // Lightbox modal state
  // Gift modal state & Parcel interaction (700ms delay + SFX box)
  const {
    stage: activeParcel,
    setStage: setActiveParcel,
    isOpening: isGiftOpening,
    isModalOpen: giftModalOpen,
    setGiftModalOpen,
    handleGiftClick,
    handleCloseModal,
  } = useGiftBoxInteraction({
    sfxType: "box",
  });
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Album photos (tôn trọng giới hạn Free)
  const albumPhotos = React.useMemo<TemplatePhotoItem[]>(() => {
    const list = data.photos?.gallery || [];
    return data.plan === "free" ? list.slice(0, 10) : list;
  }, [data.photos?.gallery, data.plan]);

  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);

  // Hero couple photo
  const heroPhotoUrl =
    data.photos?.heroUrl ||
    data.photos?.gallery?.[0]?.url ||
    "/photos/hero-wedding.webp";

  // Multi-event support
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent.startsAt || data.date || "2026-12-18";
  const dateParts = formatWeddingDateParts(eventDateStr);
  const lunarDateClean = targetEvent.lunarDate ? formatLunarDateClean(targetEvent.lunarDate) : "Ngày Hoàng Đạo Cát Khánh";

  // Countdown timer an toàn hydration
  const [mounted, setMounted] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    setMounted(true);
    const target = new Date(eventDateStr).getTime();

    const calcTime = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calcTime();
    const timer = setInterval(calcTime, 1000);
    return () => clearInterval(timer);
  }, [eventDateStr]);

  // Calendar month days calculation
  const calendarData = React.useMemo(() => {
    const d = new Date(eventDateStr);
    const year = d.getFullYear() || 2026;
    const month = d.getMonth() || 11;
    const currentDay = d.getDate() || 18;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let day = 1; day <= totalDays; day++) {
      days.push(day);
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

  const groomDisplayName = data.couple?.groomName || "Quốc Đạt";
  const brideDisplayName = data.couple?.brideName || "Khánh Huyền";
  const groomFullName = data.couple?.groomFullName || "Trần Quốc Đạt";
  const brideFullName = data.couple?.brideFullName || "Nguyễn Khánh Huyền";

  const groomParentsList = React.useMemo(() => {
    const p = data.couple?.groomParents;
    if (!p) return ["Trần Quốc Hùng & Lê Thị Mai"];
    return p.includes("&") ? p.split("&").map((s) => s.trim()) : [p];
  }, [data.couple?.groomParents]);

  const brideParentsList = React.useMemo(() => {
    const p = data.couple?.brideParents;
    if (!p) return ["Nguyễn Văn Đức & Phạm Thị Hương"];
    return p.includes("&") ? p.split("&").map((s) => s.trim()) : [p];
  }, [data.couple?.brideParents]);

  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative w-full min-h-screen overflow-x-hidden selection:bg-[#D4B26A]/30 selection:text-[#F0D89C]",
        contained ? "max-w-[480px] mx-auto shadow-2xl" : "w-full"
      )}
      style={{
        backgroundColor: EMERALD_DEEP,
        fontFamily: BODY_FONT,
        color: TEXT_BODY_EMERALD,
      }}
    >
      {/* ============================================================
          1. BÌA MỞ THIỆP (Cover: Màn Nhung Ngọc Lục Bảo & Mặt Trống Đồng 24K)
          ============================================================ */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            className="fixed inset-0 z-50 w-full max-w-full overflow-hidden flex items-center justify-center px-4 py-4 sm:px-6"
            style={{
              backgroundColor: EMERALD_DEEP,
              backgroundImage:
                viewport === "desktop"
                  ? "radial-gradient(circle at center, #0B4230 0%, #051F17 100%)"
                  : "radial-gradient(circle at center, #0B4230 0%, #051F17 100%)",
            }}
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 0.96,
              transition: { duration: 0.65, ease: EASE_IMPERIAL },
            }}
          >
            {/* Hiệu ứng bụi vàng cung đình */}
            <ImperialGoldDust count={16} />

            {/* Màn xanh ngọc lục bảo tách cánh khi bấm Mở Thiệp (z-[5] pointer-events-none) */}
            {isOpening && (
              <div className="pointer-events-none absolute inset-0 z-[5] flex overflow-hidden">
                <m.div
                  className="w-1/2 h-full bg-[#093426] shadow-2xl"
                  initial={{ x: 0 }}
                  animate={{ x: "-100%" }}
                  transition={{ duration: 0.65, ease: EASE_IMPERIAL }}
                />
                <m.div
                  className="w-1/2 h-full bg-[#093426] shadow-2xl"
                  initial={{ x: 0 }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 0.65, ease: EASE_IMPERIAL }}
                />
              </div>
            )}

            {/* Thẻ Ngọc Lục Bảo Trung Tâm (z-20) */}
            <m.div
              className="relative w-full max-w-[328px] sm:max-w-[380px] mx-auto my-auto flex flex-col items-center text-center rounded-3xl p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85)] border border-[#D4B26A]/50 backdrop-blur-md overflow-hidden z-20"
              style={{ backgroundColor: EMERALD_CARD }}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={
                isOpening
                  ? { scale: 1.03, opacity: 0, y: -25, transition: { duration: 0.65, ease: EASE_IMPERIAL } }
                  : { scale: 1, opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_IMPERIAL } }
              }
            >
              {/* Viền chỉ vàng đôi bên trong */}
              <div className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#D4B26A]/35" />

              {/* Linh vật Rồng & Phượng chầu ở lớp nền (z-0) với hiệu ứng Tách Cánh khi mở */}
              <m.img
                src="/templates/bich-ngoc-hoang-trieu/dragon-left.webp"
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
                src="/templates/bich-ngoc-hoang-trieu/phoenix-right.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-20 sm:w-28 object-contain opacity-25 sm:opacity-35 z-0"
                animate={
                  isOpening
                    ? { x: 80, opacity: 0, transition: { duration: 0.55, ease: EASE_IMPERIAL } }
                    : { x: 0, opacity: 0.3 }
                }
              />

              {/* Mặt Trống Đồng Đông Sơn 24K ở đỉnh: xoay chậm 60s, tỏa hào quang vàng */}
              <div className="relative mt-2 mb-3 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center z-20">
                <m.div
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(212,178,106,0.45) 0%, transparent 70%)",
                    filter: "blur(10px)",
                  }}
                  animate={
                    isOpening
                      ? { scale: [1, 1.8], opacity: [0.5, 1], rotate: [0, 45], transition: { duration: 0.4 } }
                      : { scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }
                  }
                />
                <m.img
                  src="/templates/bich-ngoc-hoang-trieu/drum-medallion.webp"
                  alt="Mặt Trống Đồng Đông Sơn 24K"
                  className="relative z-20 w-full h-full object-contain drop-shadow-xl"
                  animate={reduceMotion ? undefined : { rotate: 360 }}
                  transition={reduceMotion ? undefined : { duration: 60, repeat: Infinity, ease: "linear" }}
                />
              </div>

              {/* Dòng kính mời */}
              <p
                className="relative z-20 text-[11px] uppercase tracking-[0.3em] text-[#D4B26A] font-semibold mb-2"
                style={{ fontFamily: BODY_FONT }}
              >
                {guestName ? `Trân Trọng Kính Mời ${guestName}` : data.ui?.eyebrow || "Trân Trọng Kính Mời"}
              </p>

              {/* Tên cặp đôi 3 dòng Ánh Vàng Vua Chúa #F0D89C sắc nét */}
              <div className="relative z-20 my-2 flex flex-col items-center">
                <h1
                  className="text-2xl sm:text-3xl font-normal text-[#F0D89C] tracking-wide"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  <span className="block leading-tight">{groomDisplayName}</span>
                  <span className="block text-[#D4B26A] text-xl sm:text-2xl my-1 font-serif italic">&amp;</span>
                  <span className="block leading-tight">{brideDisplayName}</span>
                </h1>
              </div>

              {/* Dải phân cách hoa sen vàng */}
              <div className="relative z-20 my-2.5 w-36 sm:w-44 flex justify-center">
                <img
                  src="/templates/bich-ngoc-hoang-trieu/divider-lotus.webp"
                  alt=""
                  aria-hidden="true"
                  className="w-full object-contain opacity-85"
                />
              </div>

              {/* Lời chúc phúc / phụ đề */}
              <p className="relative z-20 text-xs sm:text-sm text-[#C4DEC9] max-w-[280px] leading-relaxed mb-6 font-light">
                {data.ui?.heroSubtitle || "Hỷ sự tương phùng • Uyên ương hòa hợp"}
              </p>

              {/* Nút bấm mở thiệp vàng 24K */}
              <m.button
                onClick={handleOpenCover}
                disabled={isOpening}
                className="relative z-20 px-8 py-3 rounded-full text-xs sm:text-sm font-serif tracking-widest font-bold uppercase shadow-2xl transition-all cursor-pointer select-none active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #D4B26A 0%, #F0D89C 50%, #D4B26A 100%)",
                  color: "#051F17",
                  boxShadow: "0 10px 25px rgba(212,178,106,0.45)",
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center justify-center">
                  <span>{isOpening ? "Đang Mở..." : "Mở Thiệp"}</span>
                </span>
              </m.button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          NÚT NHẠC NỀN HOÀNG GIA (Góc phải màn hình)
          ============================================================ */}
      {!data.hiddenSections?.includes("music") && (
        <LiveMusicFloatingButton
          src={data.music?.src || "/media/co-dien.mp3"}
          visible={coverGone}
          title={data.music?.title || "Giai điệu Cung Đình Bích Ngọc"}
          tone="ruby"
        />
      )}

      {/* ============================================================
          RUỘT THIỆP CHÍNH (Xanh Ngọc Lục Bảo & Thẻ Giấy Dó #FAF7F0)
          - Chỉ hiện khi coverGone = true (Chống trôi layout)
          ============================================================ */}
      <div
        className={cn(
          "w-full transition-opacity duration-700",
          !coverGone && "hidden pointer-events-none"
        )}
      >
        {/* Nền gấm hoàng cung chìm toàn trang */}
        <div
          className="relative w-full max-w-[840px] mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-20 flex flex-col gap-12 sm:gap-16"
          style={{
            backgroundImage:
              viewport === "desktop"
                ? "url(/templates/bich-ngoc-hoang-trieu/background.webp)"
                : "url(/templates/bich-ngoc-hoang-trieu/background-mobile.webp)",
            backgroundSize: "cover",
            backgroundPosition: "top center",
          }}
        >
          {/* ------------------------------------------------------------
              1. HERO: "ĐÀI SEN HOÀNG TRIỀU & KHUNG VÒM ĐÀI SEN VÀNG"
              (Tuyệt đối KHÔNG lặp lại ngày cưới tại Hero)
              ------------------------------------------------------------ */}
          <section className="relative w-full rounded-3xl bg-[#093426]/95 border border-[#D4B26A]/50 p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden pb-20 sm:pb-24">
            <ImperialGoldDust count={12} />

            {/* Mặt Trống Đồng Đông Sơn 24K nhỏ ở đỉnh */}
            <div className="relative mb-4 w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center z-10">
              <img
                src="/templates/bich-ngoc-hoang-trieu/drum-medallion.webp"
                alt="Trống Đồng"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            <p
              className="text-[11px] uppercase tracking-[0.25em] text-[#D4B26A] font-semibold mb-3 z-10"
              style={{ fontFamily: BODY_FONT }}
            >
              {data.ui?.eyebrow || "Lễ Thành Hôn"}
            </p>

            {/* KHUNG VÒM ĐÀI SEN VÀNG VỚI ẢNH CẶP ĐÔI BÊN TRONG */}
            <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[380px] aspect-[3/4] mb-6 flex items-center justify-center overflow-hidden z-10">
              {/* Lớp ảnh cặp đôi lồng trong vòm */}
              <div className="w-[82%] h-[82%] mb-3 rounded-t-[140px] sm:rounded-t-[170px] rounded-b-2xl overflow-hidden shadow-2xl relative z-10">
                <img
                  src={heroPhotoUrl}
                  alt={`${groomDisplayName} & ${brideDisplayName}`}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Lớp khung vòm đài sen vàng úp lên trên viền ảnh */}
              <img
                src="/templates/bich-ngoc-hoang-trieu/lotus-arch.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full object-contain z-20 drop-shadow-2xl"
              />
            </div>

            {/* Tên cặp đôi */}
            <h2
              className="text-2xl sm:text-3xl md:text-4xl text-[#F0D89C] font-normal tracking-wide my-1 z-10"
              style={{ fontFamily: TITLE_FONT }}
            >
              <span className="block leading-tight">{groomDisplayName}</span>
              <span className="block text-[#D4B26A] text-xl sm:text-2xl my-1 font-serif italic">&amp;</span>
              <span className="block leading-tight">{brideDisplayName}</span>
            </h2>

            <div className="w-36 sm:w-44 my-3 flex justify-center z-10">
              <img
                src="/templates/bich-ngoc-hoang-trieu/divider-lotus.webp"
                alt=""
                aria-hidden="true"
                className="w-full object-contain opacity-85"
              />
            </div>

            <p className="text-xs sm:text-sm text-[#FAF7F0] max-w-[440px] leading-relaxed font-light z-10">
              Trân trọng kính mời quý khách đến chung vui cùng gia đình chúng tôi trong ngày lễ thành hôn thiêng liêng.
            </p>

            {/* Đôi linh vật Long - Phượng chầu đối xứng 2 góc đáy (Chống va chạm trên Mobile) */}
            <img
              src="/templates/bich-ngoc-hoang-trieu/dragon-left.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 w-20 sm:w-28 md:w-36 object-contain opacity-65 drop-shadow-md z-0"
            />
            <img
              src="/templates/bich-ngoc-hoang-trieu/phoenix-right.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 w-20 sm:w-28 md:w-36 object-contain opacity-65 drop-shadow-md z-0"
            />
          </section>

          {/* ============================================================
              FLEX ORDERED CONTAINER (Hỗ trợ sectionOrder và hiddenSections)
              ============================================================ */}
          <div className="flex flex-col gap-12 sm:gap-16 w-full">
            {/* ------------------------------------------------------------
                2. THÔNG TIN HAI BÊN GIA ĐÌNH & LỄ CƯỚI (family — Thẻ Kem Giấy Dó)
                (VỊ TRÍ NGÀY CƯỚI #1)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("family") && (
              <div style={{ order: orderOf("family") }}>
                <section
                  className="relative w-full rounded-3xl border border-[#D4B26A]/50 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden"
                  style={{ backgroundColor: IVORY_ROYAL, color: TEXT_BODY_IVORY }}
                >
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[#A3823D] font-semibold mb-2"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Hôn Lễ Hoàn Hảo
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl text-[#093426] font-normal mb-3"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Thông Tin Hai Bên Gia Đình
                  </h3>

                  <div className="w-28 sm:w-36 mb-8 flex justify-center">
                    <img
                      src="/templates/bich-ngoc-hoang-trieu/divider-lotus.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain"
                    />
                  </div>

                  {/* Hai bên gia đình */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 w-full max-w-[620px] mb-8 items-stretch">
                    {/* Nhà Trai */}
                    <div className="h-full flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white/80 border border-[#D4B26A]/35 shadow-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest text-[#A3823D] font-bold mb-2">
                          Nhà Trai
                        </span>
                        <div className="text-sm sm:text-base font-semibold text-[#093426] leading-relaxed">
                          {groomParentsList.map((name, i) => (
                            <p key={i}>{name}</p>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#D4B26A]/25 flex flex-col items-center">
                        <span className="text-xs text-[#5B756C] italic">
                          {data.couple?.groomTitle || "Trưởng Nam"}
                        </span>
                        <h4
                          className="text-lg sm:text-xl text-[#093426] font-bold mt-1"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {groomFullName}
                        </h4>
                      </div>
                    </div>

                    {/* Nhà Gái */}
                    <div className="h-full flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-white/80 border border-[#D4B26A]/35 shadow-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest text-[#A3823D] font-bold mb-2">
                          Nhà Gái
                        </span>
                        <div className="text-sm sm:text-base font-semibold text-[#093426] leading-relaxed">
                          {brideParentsList.map((name, i) => (
                            <p key={i}>{name}</p>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#D4B26A]/25 flex flex-col items-center">
                        <span className="text-xs text-[#5B756C] italic">
                          {data.couple?.brideTitle || "Ái Nữ"}
                        </span>
                        <h4
                          className="text-lg sm:text-xl text-[#093426] font-bold mt-1"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {brideFullName}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* VỊ TRÍ NGÀY CƯỚI #1: KHỐI THỜI GIAN LỄ CƯỚI CHÍNH THỨC (Hỗ trợ 1..N buổi lễ) */}
                  <div className={visibleEvents.length > 1 ? "w-full grid grid-cols-1 md:grid-cols-2 gap-4" : "w-full max-w-[560px] mx-auto space-y-4"}>
                    {visibleEvents.map((evt, idx) => {
                      const evtDateParts = formatWeddingDateParts(evt.startsAt);
                      const evtLunar = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : "Ngày Hoàng Đạo Cát Khánh";
                      return (
                        <div
                          key={evt.id || idx}
                          className="p-6 rounded-2xl bg-gradient-to-br from-[#093426] to-[#051F17] text-[#FAF7F0] border border-[#D4B26A]/60 shadow-lg flex flex-col items-center justify-between text-center"
                        >
                          <div className="w-full">
                            <span className="inline-block text-[10px] font-bold tracking-[0.2em] text-[#D4B26A] uppercase border-b border-[#D4B26A]/30 pb-1 mb-2">
                              {evt.title || `BUỔI LỄ #${idx + 1}`}
                            </span>
                            <p className="text-[11px] uppercase tracking-[0.25em] text-[#D4B26A] font-semibold mb-2">
                              Hôn Lễ Cử Hành Vào Lúc
                            </p>
                            <p
                              className="text-2xl sm:text-3xl font-bold text-[#F0D89C] mb-1"
                              style={{ fontFamily: TITLE_FONT }}
                            >
                              {evtDateParts.time || "17:30"}
                            </p>
                            <p className="text-base sm:text-lg text-[#FAF7F0] font-medium mb-1">
                              {evtDateParts.weekday || "Chủ Nhật"}, Ngày {evtDateParts.day} Tháng {evtDateParts.month} Năm {evtDateParts.year}
                            </p>
                            <p className="text-xs sm:text-sm text-[#D4B26A] italic font-light">
                              (Tức {evtLunar})
                            </p>
                            <div className="mt-4 pt-4 border-t border-[#D4B26A]/30 w-full text-center">
                              <p className="text-xs sm:text-sm text-[#C4DEC9]">
                                Địa điểm: <strong className="text-[#FAF7F0]">{evt.venueName || "Trung Tâm Hội Nghị Tiệc Cưới Bích Ngọc"}</strong>
                              </p>
                              {evt.venueAddress && (
                                <p className="text-[11px] sm:text-xs text-[#FAF7F0]/80 mt-0.5">
                                  {evt.venueAddress}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                3. BẢN ĐỒ & ĐỊA ĐIỂM (map — Thẻ Giấy Dó, hỗ trợ 1..N lễ)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("map") && visibleEvents.length > 0 && (
              <div style={{ order: orderOf("map") }}>
                <section
                  className="relative w-full rounded-3xl border border-[#D4B26A]/50 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden"
                  style={{ backgroundColor: IVORY_ROYAL, color: TEXT_BODY_IVORY }}
                >
                  <MapPin className="w-8 h-8 text-[#A3823D] mb-2" />
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[#A3823D] font-semibold mb-2"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Chỉ Đường Đến Hôn Lễ
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl text-[#093426] font-normal mb-3"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Địa Điểm Tổ Chức
                  </h3>

                  <div className="w-28 sm:w-36 mb-6 flex justify-center">
                    <img
                      src="/templates/bich-ngoc-hoang-trieu/divider-lotus.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain"
                    />
                  </div>

                  <div className={visibleEvents.length > 1 ? "w-full grid grid-cols-1 md:grid-cols-2 gap-6" : "w-full max-w-[480px] mx-auto space-y-4"}>
                    {visibleEvents.map((evt, idx) => {
                      const directionsUrl = getEventDirectionsUrl(evt);
                      return (
                        <div key={evt.id || idx} className="p-5 rounded-2xl bg-[#093426]/5 border border-[#D4B26A]/30 flex flex-col items-center justify-between">
                          <div>
                            <span className="inline-block text-[10px] font-bold tracking-[0.2em] text-[#A3823D] uppercase mb-1">
                              {evt.title || `LỄ #${idx + 1}`}
                            </span>
                            <p className="text-base sm:text-lg font-bold text-[#093426] mb-1">
                              {evt.venueName || "Trung Tâm Hội Nghị Tiệc Cưới Bích Ngọc"}
                            </p>
                            <p className="text-xs sm:text-sm text-[#5B756C] mb-4">
                              {evt.venueAddress || "123 Đại Lộ Hoàng Triều, Quận 1, TP. Hồ Chí Minh"}
                            </p>
                          </div>

                          {/* Nút chỉ đường Google Maps */}
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all shadow-md active:scale-95 hover:scale-105"
                            style={{
                              background: "linear-gradient(135deg, #093426 0%, #0F4836 100%)",
                              color: "#F0D89C",
                              border: "1px solid #D4B26A",
                            }}
                          >
                            <MapPin className="w-4 h-4 text-[#D4B26A]" />
                            <span>Chỉ Đường ({evt.title || `Lễ #${idx + 1}`})</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                4. ALBUM ẢNH CƯỚI HOÀNG TRIỀU (album — Nền Ngọc Lục Bảo)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <div style={{ order: orderOf("album") }}>
                <section className="relative w-full rounded-3xl bg-[#093426]/95 border border-[#D4B26A]/50 p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <ImperialGoldDust count={10} />
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[#D4B26A] font-semibold mb-2 z-10"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Khoảnh Khắc Vàng Son
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl text-[#F0D89C] font-normal mb-3 z-10"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Album Ảnh Cưới
                  </h3>

                  <div className="w-28 sm:w-36 mb-6 flex justify-center z-10">
                    <img
                      src="/templates/bich-ngoc-hoang-trieu/divider-lotus.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain opacity-85"
                    />
                  </div>

                  {/* Carousel ảnh chính */}
                  <div className="relative w-full max-w-[580px] aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-[#D4B26A]/60 shadow-2xl z-10 group">
                    <img
                      src={albumPhotos[activePhotoIdx]?.url || heroPhotoUrl}
                      alt={albumPhotos[activePhotoIdx]?.alt || "Ảnh cưới"}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
                      onClick={() => setLightboxIndex(activePhotoIdx)}
                    />

                    {/* Nút lùi ảnh */}
                    {albumPhotos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIdx((prev) => (prev - 1 + albumPhotos.length) % albumPhotos.length);
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-[#F0D89C] border border-[#D4B26A]/50 flex items-center justify-center hover:bg-black/75 transition-colors"
                          aria-label="Ảnh trước"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIdx((prev) => (prev + 1) % albumPhotos.length);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-[#F0D89C] border border-[#D4B26A]/50 flex items-center justify-center hover:bg-black/75 transition-colors"
                          aria-label="Ảnh sau"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}

                    <div className="pointer-events-none absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 text-[11px] text-[#F0D89C] font-mono border border-[#D4B26A]/40">
                      {activePhotoIdx + 1} / {albumPhotos.length}
                    </div>
                  </div>

                  {/* Thumbnail dải ảnh nhỏ */}
                  {albumPhotos.length > 1 && (
                    <div className="flex gap-2 sm:gap-3 mt-4 overflow-x-auto max-w-full pb-2 z-10">
                      {albumPhotos.map((photo, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhotoIdx(idx)}
                          className={cn(
                            "relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer",
                            activePhotoIdx === idx
                              ? "border-[#D4B26A] scale-105 shadow-md"
                              : "border-transparent opacity-60 hover:opacity-100"
                          )}
                        >
                          <img
                            src={photo.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                Guest Album QR (albumQr)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("albumQr") && weddingSlug && (
              <div style={{ order: orderOf("albumQr") }}>
                <section
                  className="relative w-full rounded-3xl border border-[#D4B26A]/50 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden"
                  style={{ backgroundColor: IVORY_ROYAL, color: TEXT_BODY_IVORY }}
                >
                  <GuestAlbumQr
                    slug={weddingSlug}
                    accentColor="#093426"
                    textColor="#093426"
                    mutedColor="#5B756C"
                  />
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                5. ĐẾM NGƯỢC & LỊCH CƯỚI (calendar — Thẻ Giấy Dó)
                (VỊ TRÍ NGÀY CƯỚI #2)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("calendar") && (
              <div style={{ order: orderOf("calendar") }}>
                <section
                  className="relative w-full rounded-3xl border border-[#D4B26A]/50 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden"
                  style={{ backgroundColor: IVORY_ROYAL, color: TEXT_BODY_IVORY }}
                >
                  <Calendar className="w-8 h-8 text-[#A3823D] mb-2" />
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[#A3823D] font-semibold mb-2"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Ngày Chung Đôi
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl text-[#093426] font-normal mb-3"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Đếm Ngược Ngày Cưới
                  </h3>

                  <div className="w-28 sm:w-36 mb-6 flex justify-center">
                    <img
                      src="/templates/bich-ngoc-hoang-trieu/divider-lotus.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain"
                    />
                  </div>

                  {/* 4 Ô đếm ngược */}
                  {mounted && (
                    <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full max-w-[420px] mb-8">
                      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-b from-[#093426] to-[#051F17] text-[#FAF7F0] border border-[#D4B26A]/50 flex flex-col items-center">
                        <span className="text-xl sm:text-2xl font-bold text-[#F0D89C] font-mono">
                          {timeLeft.days}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#C4DEC9] uppercase mt-1">
                          Ngày
                        </span>
                      </div>
                      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-b from-[#093426] to-[#051F17] text-[#FAF7F0] border border-[#D4B26A]/50 flex flex-col items-center">
                        <span className="text-xl sm:text-2xl font-bold text-[#F0D89C] font-mono">
                          {timeLeft.hours}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#C4DEC9] uppercase mt-1">
                          Giờ
                        </span>
                      </div>
                      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-b from-[#093426] to-[#051F17] text-[#FAF7F0] border border-[#D4B26A]/50 flex flex-col items-center">
                        <span className="text-xl sm:text-2xl font-bold text-[#F0D89C] font-mono">
                          {timeLeft.minutes}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#C4DEC9] uppercase mt-1">
                          Phút
                        </span>
                      </div>
                      <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-b from-[#093426] to-[#051F17] text-[#FAF7F0] border border-[#D4B26A]/50 flex flex-col items-center">
                        <span className="text-xl sm:text-2xl font-bold text-[#F0D89C] font-mono">
                          {timeLeft.seconds}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#C4DEC9] uppercase mt-1">
                          Giây
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lưới lịch tháng */}
                  <div className="w-full max-w-[380px] p-5 rounded-2xl bg-white/80 border border-[#D4B26A]/35 shadow-sm">
                    <p className="text-sm font-bold text-[#093426] uppercase tracking-wider mb-4">
                      {calendarData.monthYear}
                    </p>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#5B756C] mb-2">
                      <span>CN</span>
                      <span>T2</span>
                      <span>T3</span>
                      <span>T4</span>
                      <span>T5</span>
                      <span>T6</span>
                      <span>T7</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {calendarData.days.map((day, idx) => {
                        if (!day) {
                          return <div key={`empty-${idx}`} className="h-8 w-8" />;
                        }
                        const isWeddingDay = day === calendarData.currentDay;
                        return (
                          <div
                            key={`day-${day}`}
                            className={cn(
                              "h-8 w-8 mx-auto flex items-center justify-center rounded-full font-medium transition-colors",
                              isWeddingDay
                                ? "bg-[#093426] text-[#F0D89C] font-bold shadow-md ring-2 ring-[#D4B26A]"
                                : "text-[#334A41] hover:bg-[#D4B26A]/15"
                            )}
                          >
                            {day}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                6. DRESS CODE & LỊCH TRÌNH (dresscode — Thẻ Giấy Dó)
                (TUYỆT ĐỐI KHÔNG IN MÃ HEX LÊN UI)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("dresscode") && (
              <div style={{ order: orderOf("dresscode") }}>
                <section
                  className="relative w-full rounded-3xl border border-[#D4B26A]/50 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden"
                  style={{ backgroundColor: IVORY_ROYAL, color: TEXT_BODY_IVORY }}
                >
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[#A3823D] font-semibold mb-2"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Trang Phục Tham Dự
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl text-[#093426] font-normal mb-3"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Dress Code &amp; Lịch Trình
                  </h3>

                  <div className="w-28 sm:w-36 mb-6 flex justify-center">
                    <img
                      src="/templates/bich-ngoc-hoang-trieu/divider-lotus.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain"
                    />
                  </div>

                  {/* 3 Ô Màu Dress Code TRỰC QUAN (TUYỆT ĐỐI KHÔNG IN MÃ HEX HOẶC TÊN MÀU!) */}
                  <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-8">
                    {DEFAULT_DRESS.map((item, idx) => (
                      <div
                        key={idx}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg border-2 border-[#D4B26A]/60 flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: item.hex }}
                      >
                        {item.hex === "#FAF7F0" && (
                          <div className="w-3 h-3 rounded-full bg-[#093426]/30" />
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs sm:text-sm text-[#5B756C] max-w-[420px] mb-8 italic">
                    Để tạo nên không gian hoàng gia hài hòa, quý khách vui lòng ưu tiên trang phục theo bảng màu trên.
                  </p>

                  {/* Lịch trình hôn lễ (Timeline) */}
                  <div className="w-full max-w-[520px] flex flex-col gap-4 text-left">
                    {getTimeline(data).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-4 p-4 rounded-xl bg-white/70 border border-[#D4B26A]/30"
                      >
                        <div className="px-3 py-1.5 rounded-lg bg-[#093426] text-[#F0D89C] text-xs font-bold font-mono shrink-0 border border-[#D4B26A]/50">
                          {item.time}
                        </div>
                        <div className="text-xs sm:text-sm text-[#334A41] font-medium leading-relaxed pt-0.5">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                7. HỘP MỪNG CƯỚI HOÀNG TRIỀU (gift — Nền Ngọc Lục Bảo)
                (3 TRẠNG THÁI PHONG BAO LÌ XÌ BẢO NGỌC)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("gift") && (
              <div style={{ order: orderOf("gift") }}>
                <section className="relative w-full rounded-3xl bg-[#093426]/95 border border-[#D4B26A]/50 p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <ImperialGoldDust count={10} />
                  <Heart className="w-8 h-8 text-[#D4B26A] mb-2 z-10" />
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[#D4B26A] font-semibold mb-2 z-10"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Hỷ Phúc Gửi Trao
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl text-[#F0D89C] font-normal mb-3 z-10"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hộp Mừng Cưới Hoàng Triều
                  </h3>

                  <div className="w-28 sm:w-36 mb-6 flex justify-center z-10">
                    <img
                      src="/templates/bich-ngoc-hoang-trieu/divider-lotus.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain opacity-85"
                    />
                  </div>

                  <p className="text-xs sm:text-sm text-[#FAF7F0] max-w-[420px] leading-relaxed mb-6 font-light z-10">
                    Sự hiện diện và lời chúc phúc của quý khách là món quà quý giá nhất dành cho chúng tôi.
                  </p>

                  {/* Phong bao lì xì ngọc lục bảo 3 trạng thái tương tác */}
                  <div className="relative my-2 flex justify-center z-10">
                    <button
                      type="button"
                      disabled={isGiftOpening}
                      onClick={handleGiftClick}
                      onMouseEnter={() => !isGiftOpening && setActiveParcel("glow")}
                      onMouseLeave={() => !isGiftOpening && activeParcel !== "open" && setActiveParcel("normal")}


                      className="relative w-48 sm:w-56 aspect-[280/600] flex items-end justify-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4B26A]"
                      aria-label="Mở hộp mừng cưới"
                    >
                      {/* Trạng thái 1: Normal */}
                      <img
                        src="/templates/bich-ngoc-hoang-trieu/gift-normal.webp"
                        alt="Hộp mừng cưới"
                        className={cn(
                          "absolute inset-0 w-full h-full object-contain transition-opacity duration-300",
                          activeParcel === "normal" ? "opacity-100" : "opacity-0"
                        )}
                      />

                      {/* Trạng thái 2: Hover */}
                      <img
                        src="/templates/bich-ngoc-hoang-trieu/gift-hover.webp"
                        alt="Hộp mừng cưới mở nắp"
                        className={cn(
                          "absolute inset-0 w-full h-full object-contain transition-opacity duration-300",
                          activeParcel === "hover" || activeParcel === "glow" ? "opacity-100" : "opacity-0"
                        )}
                      />

                      {/* Trạng thái 3: Active */}
                      <img
                        src="/templates/bich-ngoc-hoang-trieu/gift-active.webp"
                        alt="Hộp mừng cưới trao thiệp"
                        className={cn(
                          "absolute inset-0 w-full h-full object-contain transition-opacity duration-300",
                          activeParcel === "active" || activeParcel === "open" ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </button>
                  </div>

                  <p className="text-xs text-[#D4B26A] mt-2 mb-4 italic z-10 font-medium">
                    (Nhấn vào bao lì xì để gửi quà mừng &amp; lời chúc)
                  </p>

                  <button
                    type="button"
                    disabled={isGiftOpening}
                    onClick={handleGiftClick}
                    className="z-10 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #D4B26A 0%, #F0D89C 50%, #D4B26A 100%)",
                      color: "#051F17",
                      boxShadow: "0 8px 20px rgba(212,178,106,0.35)",
                    }}
                  >
                    Gửi Quà Mừng
                  </button>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                8. XÁC NHẬN THAM DỰ & SỔ LƯU BÚT (rsvp — ĐỒNG BỘ THEME 100%)
                (CHỐNG TRIỆT ĐỂ LỖI CHỮ SÁNG TRÊN NỀN TRẮNG)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("rsvp") && (
              <div style={{ order: orderOf("rsvp") }}>
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="emerald"
                  customTheme={{
                    isDark: true,
                    wrap: "bg-[#093426]/95 border-[#D4B26A]/50 text-[#FAF7F0] shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md rounded-3xl",
                    card: "bg-[#051F17]/90 border border-[#D4B26A]/40 text-[#FAF7F0]",
                    eyebrow: "text-[#D4B26A] tracking-[0.25em] uppercase font-semibold text-[11px]",
                    heading: "text-[#F0D89C] font-serif text-2xl sm:text-3xl",
                    subtext: "text-[#FAF7F0] text-xs sm:text-sm",
                    input: "bg-[#051F17] border-[#D4B26A]/50 text-[#FAF7F0] placeholder:text-[#FAF7F0]/40 focus:border-[#F0D89C] focus:ring-1 focus:ring-[#F0D89C]",
                    primaryBtn: "bg-gradient-to-r from-[#D4B26A] via-[#F0D89C] to-[#D4B26A] text-[#051F17] font-semibold hover:opacity-95 shadow-md",
                    outlineBtn: "border-[#D4B26A] text-[#F0D89C] hover:bg-[#D4B26A]/20",
                    optionBg: "#051F17",
                    optionColor: "#FAF7F0",
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
            )}
          </div>

          {/* ============================================================
              9. LỜI CẢM TẠ TRI ÂN (FOOTER — LUÔN NẰM NGOÀI FLEX ORDERED)
              ============================================================ */}
          <footer className="w-full flex flex-col items-center text-center pt-8 pb-12 mt-4 text-[#FAF7F0]">
            <div className="w-20 h-20 mb-3 flex items-center justify-center opacity-85">
              <img
                src="/templates/bich-ngoc-hoang-trieu/drum-medallion.webp"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
            <h4
              className="text-xl sm:text-2xl text-[#F0D89C] font-normal mb-2"
              style={{ fontFamily: TITLE_FONT }}
            >
              Chân Thành Cảm Tạ
            </h4>
            <p className="text-xs sm:text-sm text-[#C4DEC9] max-w-[380px] leading-relaxed font-light mb-4">
              Sự hiện diện và lời chúc phúc của quý khách là niềm vinh hạnh to lớn cho gia đình chúng tôi.
            </p>
            <p className="text-[11px] text-[#D4B26A] tracking-widest uppercase font-mono">
              {groomDisplayName} &amp; {brideDisplayName} • 2026
            </p>
          </footer>
        </div>
      </div>

      {/* ============================================================
          MODAL LIGHTBOX ẢNH CƯỚI (Qua Portal)
          ============================================================ */}
      <TemplateLightboxModal
        photos={albumPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={(idx) => setLightboxIndex(idx)}
      />

      {/* ============================================================
          MODAL HỘP MỪNG CƯỚI (Qua Portal)
          ============================================================ */}
      <GiftModal
        open={giftModalOpen}
        onClose={handleCloseModal}
        gift={data.gift}
        plan={data.plan}
        coupleName={`${groomDisplayName} & ${brideDisplayName}`}
        guestName={guestName}
        tone="ruby"
      />
    </div>
  );
}
