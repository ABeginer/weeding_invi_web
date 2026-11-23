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
   BẢNG MÀU CHÍNH THỨC: CHU SA LONG PHỤNG (chu-sa-long-phung)
   - Đỏ Chu Sa Hoàng Cung (Imperial Cinnabar Crimson): #6B0C14 (sâu #42060B, hover #82111B)
   - Vàng 24K Cung Đình (24K Imperial Gold): #D4AF6A (sáng #F2DCA6, trầm #A6833E)
   - Kem Hoàng Gia (Warm Royal Ivory): #FAF5EC (thẻ phụ #FFFFFF, thẻ ấm #F3EAE0)
   - Chữ chính trên nền kem: #5A0B12 (tiêu đề) / #3A2522 (nội dung, tương phản cao)
   - Dress Code mặc định: #6B0C14 (Đỏ chu sa), #D4AF6A (Vàng 24K), #FAF5EC (Kem hoàng gia)
   ============================================================ */

const CINNABAR_MAIN = "#6B0C14";
const CINNABAR_DEEP = "#42060B";
const CINNABAR_CARD = "rgba(107, 12, 20, 0.94)";

const GOLD_24K = "#D4AF6A";
const GOLD_LIGHT = "#F2DCA6";
const GOLD_DEEP = "#A6833E";

const IVORY_ROYAL = "#FAF5EC";
const IVORY_CARD = "#FFFFFF";

const TEXT_TITLE_RED = "#F2DCA6";
const TEXT_BODY_RED = "#FAF5EC";
const TEXT_MUTED_RED = "#E0C8BA";

const TEXT_TITLE_IVORY = "#5A0B12";
const TEXT_BODY_IVORY = "#3A2522";
const TEXT_MUTED_IVORY = "#6E5A57";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_IMPERIAL = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "16:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm tại tiền sảnh Chu Sa Long Phụng" },
  { time: "17:30", label: "Nghi thức Thành Hôn Long Phụng Hòa Minh & Trao lời hẹn ước sắt son" },
  { time: "18:00", label: "Khai tiệc hoàng gia & Nâng ly rượu nồng giao bôi chúc phúc" },
  { time: "19:30", label: "Giai điệu cung đình hoàng gia & Gắn kết thân tình hai họ" },
  { time: "20:30", label: "Tiễn khách & Trao quà cảm tạ tri ân" },
];

const DEFAULT_DRESS = ["#6B0C14", "#D4AF6A", "#FAF5EC"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

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
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10" aria-hidden="true">
      {particles.map((p) => (
        <m.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: "-10px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.isBright ? GOLD_LIGHT : GOLD_24K,
            boxShadow: p.isBright
              ? `0 0 8px ${GOLD_LIGHT}, 0 0 16px rgba(212,175,106,0.6)`
              : `0 0 6px ${GOLD_24K}`,
          }}
          animate={{
            y: ["0vh", "110vh"],
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

/* ============================================================
   MAIN COMPONENT: ChuSaLongPhungTemplate
   ============================================================ */
export default function ChuSaLongPhungTemplate({
  data,
  mode = "preview",
  viewport = "phone",
  contained = false,
  isOpened = false,
  onOpenedChange,
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
    playOpenCardSound();
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
  const [giftModalOpen, setGiftModalOpen] = React.useState(false);
  const [activeParcel, setActiveParcel] = React.useState<"normal" | "hover" | "active">("normal");

  // Lightbox modal state
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Album photos (tôn trọng giới hạn Free)
  const albumPhotos = React.useMemo<TemplatePhotoItem[]>(() => {
    const list = data.photos?.gallery || [];
    return data.plan === "free" ? list.slice(0, 10) : list;
  }, [data.photos?.gallery, data.plan]);

  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);

  // Event details & multi-event support
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent.startsAt || data.date || "2026-12-18";
  const dateParts = formatWeddingDateParts(eventDateStr);
  const lunarDateClean = targetEvent.lunarDate ? formatLunarDateClean(targetEvent.lunarDate) : "Ngày Hoàng Đạo";

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

  const groomDisplayName = data.couple?.groomName || "Quang Khải";
  const brideDisplayName = data.couple?.brideName || "Thanh Uyên";

  const groomParentsList = React.useMemo(() => {
    const raw = data.couple?.groomParents || "Ông Nguyễn Văn Hưng & Bà Trần Thị Ngọc";
    return raw.split("&").map((p) => p.trim()).filter(Boolean);
  }, [data.couple?.groomParents]);

  const brideParentsList = React.useMemo(() => {
    const raw = data.couple?.brideParents || "Ông Phan Quốc Bảo & Bà Lê Hoàng Mai";
    return raw.split("&").map((p) => p.trim()).filter(Boolean);
  }, [data.couple?.brideParents]);

  return (
    <div
      className={cn(
        "relative w-full mx-auto select-text overflow-x-hidden text-[#FAF5EC]",
        !coverGone
          ? contained
            ? "h-full overflow-hidden"
            : "h-screen-dvh max-h-full overflow-hidden"
          : "min-h-screen"
      )}
      style={{
        backgroundColor: CINNABAR_DEEP,
        color: TEXT_BODY_RED,
        fontFamily: BODY_FONT,
      }}
    >
      {/* ============================================================
          MÀN HÌNH BÌA MỞ THIỆP — "KIM ẤN KHAI TRIỀU"
          ============================================================ */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            key="cinnabar-cover"
            className={cn(
              "absolute inset-0 z-50 w-full max-w-full overflow-hidden flex flex-col items-center justify-center px-4 py-4 sm:px-6 select-none",
              contained ? "h-full" : "h-screen-dvh"
            )}
            style={{
              backgroundImage:
                viewport === "desktop"
                  ? "url(/templates/chu-sa-long-phung/background.webp)"
                  : "url(/templates/chu-sa-long-phung/background-mobile.webp)",
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
            {/* Hiệu ứng bụi vàng cung đình */}
            <ImperialGoldDust count={16} />

            {/* Màn gấm đỏ chu sa tách cánh khi bấm Mở Thiệp (z-[5] pointer-events-none) */}
            {isOpening && (
              <div className="pointer-events-none absolute inset-0 z-[5] flex overflow-hidden">
                <m.div
                  className="w-1/2 h-full bg-[#6B0C14] shadow-2xl"
                  initial={{ x: 0 }}
                  animate={{ x: "-100%" }}
                  transition={{ duration: 0.65, ease: EASE_IMPERIAL }}
                />
                <m.div
                  className="w-1/2 h-full bg-[#6B0C14] shadow-2xl"
                  initial={{ x: 0 }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 0.65, ease: EASE_IMPERIAL }}
                />
              </div>
            )}

            {/* Thẻ Gấm Đỏ Chu Sa Trung Tâm (z-20) */}
            <m.div
              className="relative w-full max-w-[328px] sm:max-w-[380px] mx-auto my-auto flex flex-col items-center text-center rounded-3xl p-6 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85)] border border-[#D4AF6A]/50 backdrop-blur-md overflow-hidden z-20"
              style={{ backgroundColor: CINNABAR_CARD }}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={
                isOpening
                  ? { scale: 1.03, opacity: 0, y: -25, transition: { duration: 0.65, ease: EASE_IMPERIAL } }
                  : { scale: 1, opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_IMPERIAL } }
              }
            >
              {/* Viền chỉ vàng cổ lồng bên trong */}
              <div className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#D4AF6A]/35" />

              {/* 4 Góc Hoa Văn Hoàng Cung corner-palace.webp */}
              <img
                src="/templates/chu-sa-long-phung/corner-palace.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-3 left-3 w-10 sm:w-12 object-contain opacity-80 z-10"
              />
              <img
                src="/templates/chu-sa-long-phung/corner-palace.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-3 right-3 w-10 sm:w-12 object-contain opacity-80 -scale-x-100 z-10"
              />
              <img
                src="/templates/chu-sa-long-phung/corner-palace.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 left-3 w-10 sm:w-12 object-contain opacity-80 -scale-y-100 z-10"
              />
              <img
                src="/templates/chu-sa-long-phung/corner-palace.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-3 right-3 w-10 sm:w-12 object-contain opacity-80 -scale-100 z-10"
              />

              {/* Linh vật Rồng & Phượng chầu ở lớp nền (z-0) với hiệu ứng Tách Cánh khi mở */}
              <m.img
                src="/templates/chu-sa-long-phung/dragon-left.webp"
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
                src="/templates/chu-sa-long-phung/phoenix-right.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 w-20 sm:w-28 object-contain opacity-25 sm:opacity-35 z-0"
                animate={
                  isOpening
                    ? { x: 80, opacity: 0, transition: { duration: 0.55, ease: EASE_IMPERIAL } }
                    : { x: 0, opacity: 0.3 }
                }
              />

              {/* Kim Ấn Bát Giác Song Hỷ 囍 vàng 24K nền đỏ chu sa ở đỉnh (relative z-20) */}
              <div className="relative mt-2 mb-3 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center z-20">
                <m.div
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(212,175,106,0.45) 0%, transparent 70%)",
                    filter: "blur(8px)",
                  }}
                  animate={
                    isOpening
                      ? { scale: [1, 1.8], opacity: [0.5, 1], rotate: [0, 45], transition: { duration: 0.4 } }
                      : { scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4], transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } }
                  }
                />
                <img
                  src="/templates/chu-sa-long-phung/seal-octagon.webp"
                  alt="Kim Ấn Bát Giác Song Hỷ"
                  className="relative z-20 w-full h-full object-contain drop-shadow-lg"
                />
              </div>

              {/* Dòng kính mời */}
              <p
                className="relative z-20 text-[11px] uppercase tracking-[0.3em] text-[#D4AF6A] font-semibold mb-2"
                style={{ fontFamily: BODY_FONT }}
              >
                {guestName ? `Trân Trọng Kính Mời ${guestName}` : data.ui?.eyebrow || "Trân Trọng Kính Mời"}
              </p>

              {/* Tên cặp đôi 3 dòng Ánh Vàng Champagne #F2DCA6 sắc nét */}
              <div className="relative z-20 my-2 flex flex-col items-center">
                <h1
                  className="text-2xl sm:text-3xl font-normal text-[#F2DCA6] tracking-wide"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  <span className="block leading-tight">{groomDisplayName}</span>
                  <span className="block text-[#D4AF6A] text-xl sm:text-2xl my-1 font-serif italic">&amp;</span>
                  <span className="block leading-tight">{brideDisplayName}</span>
                </h1>
              </div>

              {/* Dải phân cách hoa văn mây hoàng cung */}
              <div className="relative z-20 my-2.5 w-36 sm:w-44 flex justify-center">
                <img
                  src="/templates/chu-sa-long-phung/divider-palace.webp"
                  alt=""
                  aria-hidden="true"
                  className="w-full object-contain opacity-85"
                />
              </div>

              {/* Lời trân quý */}
              <p className="relative z-20 text-xs sm:text-sm text-[#E0C8BA] max-w-[280px] leading-relaxed mb-6 font-light">
                {data.ui?.heroSubtitle || "Hỷ sự tương phùng • Uyên ương hòa hợp"}
              </p>

              {/* Nút bấm mở thiệp vàng 24K */}
              <m.button
                onClick={handleOpenCover}
                disabled={isOpening}
                className="relative z-20 px-8 py-3 rounded-full text-xs sm:text-sm font-serif tracking-widest font-bold uppercase shadow-2xl transition-all cursor-pointer select-none active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #D4AF6A 0%, #F2DCA6 50%, #D4AF6A 100%)",
                  color: "#42060B",
                  boxShadow: "0 10px 25px rgba(212,175,106,0.45)",
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
          title={data.music?.title || "Giai điệu Cung Đình Hoàng Gia"}
          tone="ruby"
        />
      )}

      {/* ============================================================
          RUỘT THIỆP CHÍNH (Đỏ Chu Sa & Thẻ Kem Hoàng Gia #FAF5EC)
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
                ? "url(/templates/chu-sa-long-phung/background.webp)"
                : "url(/templates/chu-sa-long-phung/background-mobile.webp)",
            backgroundSize: "cover",
            backgroundPosition: "top center",
          }}
        >
          {/* ------------------------------------------------------------
              1. HERO: "LONG PHỤNG CHẦÙ ẤN" (Nền Đỏ Chu Sa Hoàng Cung)
              (Tuyệt đối KHÔNG lặp lại ngày cưới tại Hero)
              ------------------------------------------------------------ */}
          <section className="relative w-full rounded-3xl bg-[#6B0C14]/94 border border-[#D4AF6A]/50 p-6 sm:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden pb-24 sm:pb-28">
            <ImperialGoldDust count={12} />

            {/* 4 Góc Hoa Văn Hoàng Cung */}
            <img
              src="/templates/chu-sa-long-phung/corner-palace.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute top-3 left-3 w-10 sm:w-12 object-contain opacity-75 z-10"
            />
            <img
              src="/templates/chu-sa-long-phung/corner-palace.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute top-3 right-3 w-10 sm:w-12 object-contain opacity-75 -scale-x-100 z-10"
            />
            <img
              src="/templates/chu-sa-long-phung/corner-palace.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 left-3 w-10 sm:w-12 object-contain opacity-75 -scale-y-100 z-10"
            />
            <img
              src="/templates/chu-sa-long-phung/corner-palace.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 right-3 w-10 sm:w-12 object-contain opacity-75 -scale-100 z-10"
            />

            {/* Kim Ấn Bát Giác Song Hỷ ở đỉnh */}
            <div className="relative mb-3 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center z-10">
              <img
                src="/templates/chu-sa-long-phung/seal-octagon.webp"
                alt="Kim Ấn Song Hỷ"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            <p
              className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF6A] font-semibold mb-2 z-10"
              style={{ fontFamily: BODY_FONT }}
            >
              {data.ui?.eyebrow || "Lễ Thành Hôn"}
            </p>

            <h2
              className="text-2xl sm:text-3xl md:text-4xl text-[#F2DCA6] font-normal tracking-wide my-1 z-10"
              style={{ fontFamily: TITLE_FONT }}
            >
              <span className="block leading-tight">{groomDisplayName}</span>
              <span className="block text-[#D4AF6A] text-xl sm:text-2xl my-1 font-serif italic">&amp;</span>
              <span className="block leading-tight">{brideDisplayName}</span>
            </h2>

            <div className="w-36 sm:w-44 my-3 flex justify-center z-10">
              <img
                src="/templates/chu-sa-long-phung/divider-palace.webp"
                alt=""
                aria-hidden="true"
                className="w-full object-contain opacity-85"
              />
            </div>

            <p className="text-xs sm:text-sm text-[#FAF5EC] max-w-[260px] sm:max-w-[340px] md:max-w-[420px] leading-relaxed font-light z-10 mb-4">
              Trân trọng kính mời quý khách đến chung vui cùng gia đình chúng tôi trong ngày lễ thành hôn thiêng liêng.
            </p>

            {/* Đôi linh vật Long - Phụng chầu đối xứng 2 góc đáy (Chống va chạm trên Mobile) */}
            <img
              src="/templates/chu-sa-long-phung/dragon-left.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 left-0 w-20 sm:w-28 md:w-36 object-contain opacity-65 drop-shadow-md z-0"
            />
            <img
              src="/templates/chu-sa-long-phung/phoenix-right.webp"
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
                2. THÔNG TIN HAI BÊN GIA ĐÌNH & LỄ CƯỚI (family — Thẻ Kem Hoàng Gia)
                (VỊ TRÍ NGÀY CƯỚI #1)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("family") && (
              <div style={{ order: orderOf("family") }}>
                <section
                  className="relative w-full rounded-3xl border border-[#D4AF6A]/50 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden"
                  style={{ backgroundColor: IVORY_ROYAL, color: TEXT_BODY_IVORY }}
                >
                  {/* 4 Góc Hoa Văn Hoàng Cung */}
                  <img
                    src="/templates/chu-sa-long-phung/corner-palace.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute top-3 left-3 w-10 sm:w-12 object-contain opacity-85 z-10"
                  />
                  <img
                    src="/templates/chu-sa-long-phung/corner-palace.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute top-3 right-3 w-10 sm:w-12 object-contain opacity-85 -scale-x-100 z-10"
                  />
                  <img
                    src="/templates/chu-sa-long-phung/corner-palace.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-3 left-3 w-10 sm:w-12 object-contain opacity-85 -scale-y-100 z-10"
                  />
                  <img
                    src="/templates/chu-sa-long-phung/corner-palace.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-3 right-3 w-10 sm:w-12 object-contain opacity-85 -scale-100 z-10"
                  />

                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#6B0C14] font-semibold mb-1">
                    Hôn Phối Châu Loan
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#5A0B12] font-normal mb-2"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hai Bên Gia Đình
                  </h3>

                  <div className="w-32 sm:w-40 my-2 flex justify-center">
                    <img
                      src="/templates/chu-sa-long-phung/divider-palace.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain opacity-80"
                    />
                  </div>

                  {/* 2 Cột Gia Đình bằng nhau (items-stretch, h-full) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 w-full mt-6 items-stretch">
                    {/* Nhà Trai */}
                    <div className="h-full flex flex-col justify-between rounded-2xl bg-[#FFFFFF] border border-[#D4AF6A]/35 p-6 shadow-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest text-[#6B0C14] font-bold mb-2">
                          Nhà Trai
                        </span>
                        <div className="text-sm sm:text-base text-[#3A2522] font-medium leading-relaxed">
                          {groomParentsList.map((name, i) => (
                            <p key={i}>{name}</p>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#D4AF6A]/25 flex flex-col items-center">
                        <span className="text-xs text-[#6E5A57] italic">
                          {data.couple?.groomTitle || "Trưởng Nam"}
                        </span>
                        <span
                          className="text-lg sm:text-xl text-[#5A0B12] font-semibold mt-1"
                          style={{ fontFamily: NAME_FONT }}
                        >
                          {data.couple?.groomFullName || groomDisplayName}
                        </span>
                      </div>
                    </div>

                    {/* Nhà Gái */}
                    <div className="h-full flex flex-col justify-between rounded-2xl bg-[#FFFFFF] border border-[#D4AF6A]/35 p-6 shadow-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest text-[#6B0C14] font-bold mb-2">
                          Nhà Gái
                        </span>
                        <div className="text-sm sm:text-base text-[#3A2522] font-medium leading-relaxed">
                          {brideParentsList.map((name, i) => (
                            <p key={i}>{name}</p>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#D4AF6A]/25 flex flex-col items-center">
                        <span className="text-xs text-[#6E5A57] italic">
                          {data.couple?.brideTitle || "Ái Nữ"}
                        </span>
                        <span
                          className="text-lg sm:text-xl text-[#5A0B12] font-semibold mt-1"
                          style={{ fontFamily: NAME_FONT }}
                        >
                          {data.couple?.brideFullName || brideDisplayName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Khối Lễ Cưới Chi Tiết (Hỗ trợ 1..N buổi lễ) */}
                  <div className="w-full mt-8 pt-6 border-t border-[#D4AF6A]/35 flex flex-col items-center">
                    <span className="text-xs uppercase tracking-widest text-[#6B0C14] font-bold mb-3">
                      Thời Gian &amp; Địa Điểm Hôn Lễ
                    </span>

                    <div className={visibleEvents.length > 1 ? "w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6" : "w-full max-w-xl mx-auto space-y-4"}>
                      {visibleEvents.map((evt, idx) => {
                        const evtDateParts = formatWeddingDateParts(evt.startsAt);
                        const evtLunarStr = formatLunarDateClean(evt.lunarDate);
                        const directionsUrl = getEventDirectionsUrl(evt);

                        return (
                          <div
                            key={evt.id || idx}
                            className="flex flex-col items-center justify-between rounded-2xl bg-[#FFFDF8] border border-[#D4AF6A]/40 p-5 shadow-xs text-center"
                          >
                            <div className="w-full">
                              <span className="inline-block text-[10px] font-bold tracking-[0.2em] text-[#6B0C14] uppercase border-b border-[#D4AF6A]/30 pb-1 mb-2">
                                BUỔI LỄ #{idx + 1}
                              </span>
                              <h4
                                className="text-lg sm:text-xl text-[#5A0B12] font-semibold mb-3"
                                style={{ fontFamily: TITLE_FONT }}
                              >
                                {evt.title || "Lễ Thành Hôn"}
                              </h4>

                              <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm text-[#3A2522] my-2">
                                <div className="flex items-center gap-1.5 font-semibold text-[#6B0C14]">
                                  <Clock className="w-4 h-4 text-[#6B0C14]" />
                                  <span>{evtDateParts.time || "11:00"}</span>
                                </div>
                                <div className="flex items-center gap-1.5 font-semibold">
                                  <Calendar className="w-4 h-4 text-[#6B0C14]" />
                                  <span>
                                    {evtDateParts.weekday}, Ngày {evtDateParts.day}/{evtDateParts.month}/{evtDateParts.year}
                                  </span>
                                </div>
                              </div>

                              {evtLunarStr && (
                                <p className="text-xs text-[#6E5A57] italic mt-1">
                                  (Tức {evtLunarStr})
                                </p>
                              )}

                              <div className="mt-3 flex items-center justify-center gap-2 text-xs sm:text-sm text-[#3A2522] max-w-md mx-auto">
                                <MapPin className="w-4 h-4 text-[#6B0C14] shrink-0" />
                                <span className="font-semibold">{evt.venueName || "Trung tâm Hội nghị Tiệc cưới"}</span>
                              </div>
                              {evt.venueAddress && (
                                <p className="text-xs text-[#6E5A57] mt-1 leading-relaxed">
                                  {evt.venueAddress}
                                </p>
                              )}
                            </div>

                            {/* Nút chỉ đường Google Maps riêng cho từng buổi lễ */}
                            <div className="mt-4 pt-3 border-t border-[#D4AF6A]/20 w-full flex justify-center">
                              <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#6B0C14] hover:bg-[#82111B] text-[#FAF5EC] text-xs font-semibold tracking-wider uppercase shadow-xs transition-all hover:scale-105 active:scale-95"
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#D4AF6A]" />
                                <span>Chỉ Đường</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                3. ALBUM ẢNH CƯỚI (album + albumQr — Nền Đỏ Chu Sa)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <div style={{ order: orderOf("album") }}>
                <section className="relative w-full rounded-3xl bg-[#6B0C14]/94 border border-[#D4AF6A]/50 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <ImperialGoldDust count={12} />

                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF6A] font-semibold mb-1">
                    Khoảnh Khắc Hạnh Phúc
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#F2DCA6] font-normal mb-2"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Album Ảnh Cưới
                  </h3>

                  <div className="w-32 sm:w-40 my-2 flex justify-center">
                    <img
                      src="/templates/chu-sa-long-phung/divider-palace.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain opacity-85"
                    />
                  </div>

                  {/* Carousel ảnh cưới viền vàng */}
                  <div className="relative w-full max-w-[540px] aspect-[4/5] sm:aspect-[3/4] mt-6 rounded-2xl overflow-hidden border-2 border-[#D4AF6A]/60 shadow-2xl group cursor-pointer">
                    <img
                      src={albumPhotos[activePhotoIdx]?.url}
                      alt={albumPhotos[activePhotoIdx]?.alt || `Ảnh cưới ${activePhotoIdx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onClick={() => setLightboxIndex(activePhotoIdx)}
                    />

                    {/* Nút điều hướng ảnh */}
                    {albumPhotos.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIdx((prev) => (prev - 1 + albumPhotos.length) % albumPhotos.length);
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#42060B]/85 border border-[#D4AF6A] text-[#F2DCA6] flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
                          aria-label="Ảnh trước"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIdx((prev) => (prev + 1) % albumPhotos.length);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#42060B]/85 border border-[#D4AF6A] text-[#F2DCA6] flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 cursor-pointer"
                          aria-label="Ảnh sau"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    <div className="pointer-events-none absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#42060B]/85 border border-[#D4AF6A]/45 text-[11px] text-[#F2DCA6] font-medium tracking-wider">
                      {activePhotoIdx + 1} / {albumPhotos.length}
                    </div>
                  </div>

                  {/* Thumbnail gallery thu nhỏ */}
                  {albumPhotos.length > 1 && (
                    <div className="flex gap-2 mt-4 overflow-x-auto max-w-full pb-2 px-2 scrollbar-none">
                      {albumPhotos.map((photo: TemplatePhotoItem, idx: number) => (
                        <button
                          key={photo.id || idx}
                          onClick={() => setActivePhotoIdx(idx)}
                          className={cn(
                            "relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer",
                            activePhotoIdx === idx
                              ? "border-[#F2DCA6] scale-105 shadow-md"
                              : "border-[#D4AF6A]/40 opacity-70 hover:opacity-100"
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

                  {/* QR Album dành cho gói Pro/VIP */}
                  {data.plan !== "free" && !hiddenSections.has("albumQr") && weddingSlug && (
                    <div className="mt-8 pt-6 border-t border-[#D4AF6A]/30 w-full flex justify-center">
                      <GuestAlbumQr
                        slug={weddingSlug}
                        accentColor="#D4AF6A"
                        textColor="#FAF5EC"
                        mutedColor="#E0C8BA"
                      />
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                4. LỊCH NGÀY VUI, ĐẾM NGƯỢC & BẢN ĐỒ (calendar + map — Thẻ Kem Hoàng Gia)
                (VỊ TRÍ NGÀY CƯỚI #2)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("calendar") && (
              <div style={{ order: orderOf("calendar") }}>
                <section
                  className="relative w-full rounded-3xl border border-[#D4AF6A]/50 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden"
                  style={{ backgroundColor: IVORY_ROYAL, color: TEXT_BODY_IVORY }}
                >
                  {/* 4 Góc Hoa Văn Hoàng Cung */}
                  <img
                    src="/templates/chu-sa-long-phung/corner-palace.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute top-3 left-3 w-10 sm:w-12 object-contain opacity-85 z-10"
                  />
                  <img
                    src="/templates/chu-sa-long-phung/corner-palace.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute top-3 right-3 w-10 sm:w-12 object-contain opacity-85 -scale-x-100 z-10"
                  />
                  <img
                    src="/templates/chu-sa-long-phung/corner-palace.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-3 left-3 w-10 sm:w-12 object-contain opacity-85 -scale-y-100 z-10"
                  />
                  <img
                    src="/templates/chu-sa-long-phung/corner-palace.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-3 right-3 w-10 sm:w-12 object-contain opacity-85 -scale-100 z-10"
                  />

                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#6B0C14] font-semibold mb-1">
                    Ghi Dấu Ngày Chung Đôi
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#5A0B12] font-normal mb-2"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Lịch Ngày Vui
                  </h3>

                  <div className="w-32 sm:w-40 my-2 flex justify-center">
                    <img
                      src="/templates/chu-sa-long-phung/divider-palace.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain opacity-80"
                    />
                  </div>

                  <p className="text-xs text-[#6E5A57] italic mb-6">
                    {dateParts.weekday}, Ngày {dateParts.day} Tháng {dateParts.month} Năm {dateParts.year}
                  </p>

                  {/* Khung Lịch Tháng */}
                  <div className="relative w-full max-w-[340px] rounded-2xl bg-[#FFFFFF] border border-[#D4AF6A]/45 p-5 shadow-sm">
                    <p className="text-sm font-bold tracking-widest uppercase text-[#5A0B12] mb-4">
                      {calendarData.monthYear}
                    </p>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#6E5A57] pb-2 border-b border-[#D4AF6A]/25">
                      <span>CN</span>
                      <span>T2</span>
                      <span>T3</span>
                      <span>T4</span>
                      <span>T5</span>
                      <span>T6</span>
                      <span>T7</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mt-3 text-center text-xs">
                      {(() => {
                        const eventDays = new Set(
                          visibleEvents.map((evt) => parseInt(formatWeddingDateParts(evt.startsAt).day, 10))
                        );
                        return calendarData.days.map((day, idx) => {
                          const isWeddingDay = day !== null && eventDays.has(day);
                          return (
                            <div
                              key={idx}
                              className={cn(
                                "h-8 flex items-center justify-center rounded-full text-xs transition-all relative",
                                day === null && "opacity-0 pointer-events-none",
                                isWeddingDay
                                  ? "bg-[#6B0C14] text-[#FAF5EC] font-bold shadow-md scale-105"
                                  : "text-[#3A2522]"
                              )}
                            >
                              {day}
                              {isWeddingDay && (
                                <Heart className="w-2.5 h-2.5 absolute -top-1 -right-0.5 text-[#D4AF6A] fill-[#D4AF6A] animate-pulse" />
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Đồng hồ đếm ngược 4 ô */}
                  {mounted && (
                    <div className="mt-8 flex flex-col items-center">
                      <span className="text-xs uppercase tracking-widest text-[#6B0C14] font-semibold mb-3">
                        Cùng Đếm Ngược Từng Khoảnh Khắc
                      </span>
                      <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-[340px] w-full">
                        <div className="flex flex-col items-center rounded-xl bg-[#FFFFFF] border border-[#D4AF6A]/35 py-2.5 px-1 shadow-sm">
                          <span className="text-xl sm:text-2xl font-bold text-[#5A0B12]">
                            {timeLeft.days}
                          </span>
                          <span className="text-[10px] text-[#6E5A57] uppercase tracking-wider mt-0.5">
                            Ngày
                          </span>
                        </div>
                        <div className="flex flex-col items-center rounded-xl bg-[#FFFFFF] border border-[#D4AF6A]/35 py-2.5 px-1 shadow-sm">
                          <span className="text-xl sm:text-2xl font-bold text-[#5A0B12]">
                            {timeLeft.hours}
                          </span>
                          <span className="text-[10px] text-[#6E5A57] uppercase tracking-wider mt-0.5">
                            Giờ
                          </span>
                        </div>
                        <div className="flex flex-col items-center rounded-xl bg-[#FFFFFF] border border-[#D4AF6A]/35 py-2.5 px-1 shadow-sm">
                          <span className="text-xl sm:text-2xl font-bold text-[#5A0B12]">
                            {timeLeft.minutes}
                          </span>
                          <span className="text-[10px] text-[#6E5A57] uppercase tracking-wider mt-0.5">
                            Phút
                          </span>
                        </div>
                        <div className="flex flex-col items-center rounded-xl bg-[#FFFFFF] border border-[#D4AF6A]/35 py-2.5 px-1 shadow-sm">
                          <span className="text-xl sm:text-2xl font-bold text-[#6B0C14]">
                            {timeLeft.seconds}
                          </span>
                          <span className="text-[10px] text-[#6E5A57] uppercase tracking-wider mt-0.5">
                            Giây
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Nút chỉ đường Map */}
                  {visibleEvents.length > 0 && (
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                      {visibleEvents.map((evt, idx) => {
                        const directionsUrl = getEventDirectionsUrl(evt);
                        return (
                          <a
                            key={evt.id || idx}
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#6B0C14] hover:bg-[#82111B] text-[#FAF5EC] text-xs font-semibold tracking-wider uppercase shadow-md transition-all hover:scale-105 active:scale-95"
                          >
                            <MapPin className="w-4 h-4 text-[#D4AF6A]" />
                            <span>Chỉ Đường ({evt.title || `Lễ #${idx + 1}`})</span>
                          </a>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                5. DRESS CODE & LỊCH TRÌNH NGÀY CƯỚI (dresscode — Thẻ Kem Hoàng Gia)
                (TUYỆT ĐỐI KHÔNG in mã hex #XXXXXX ra UI)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("dresscode") && (
              <div style={{ order: orderOf("dresscode") }}>
                <section
                  className="relative w-full rounded-3xl border border-[#D4AF6A]/50 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden"
                  style={{ backgroundColor: IVORY_ROYAL, color: TEXT_BODY_IVORY }}
                >
                  {/* 4 Góc Hoa Văn Hoàng Cung */}
                  <img
                    src="/templates/chu-sa-long-phung/corner-palace.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute top-3 left-3 w-10 sm:w-12 object-contain opacity-85 z-10"
                  />
                  <img
                    src="/templates/chu-sa-long-phung/corner-palace.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute top-3 right-3 w-10 sm:w-12 object-contain opacity-85 -scale-x-100 z-10"
                  />
                  <img
                    src="/templates/chu-sa-long-phung/corner-palace.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-3 left-3 w-10 sm:w-12 object-contain opacity-85 -scale-y-100 z-10"
                  />
                  <img
                    src="/templates/chu-sa-long-phung/corner-palace.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-3 right-3 w-10 sm:w-12 object-contain opacity-85 -scale-100 z-10"
                  />

                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#6B0C14] font-semibold mb-1">
                    Trang Phục Gợi Ý
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#5A0B12] font-normal mb-2"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Dress Code
                  </h3>

                  <div className="w-32 sm:w-40 my-2 flex justify-center">
                    <img
                      src="/templates/chu-sa-long-phung/divider-palace.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain opacity-80"
                    />
                  </div>

                  <p className="text-xs text-[#6E5A57] max-w-[360px] leading-relaxed mb-6 font-light">
                    Kính mong quý khách diện trang phục mang sắc màu gợi ý để những khung hình kỷ niệm thêm phần trọn vẹn và trang trọng.
                  </p>

                  {/* 3 Vòng tròn Swatch màu trực quan (TUYỆT ĐỐI KHÔNG in mã hex hoặc tên màu) */}
                  <div className="flex items-center justify-center gap-6 sm:gap-8 my-2">
                    {getDressColors(data).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#D4AF6A] shadow-md transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  {/* Timeline dọc chỉ vàng 24K */}
                  <div className="w-full max-w-[460px] mt-10 pt-6 border-t border-[#D4AF6A]/30">
                    <span className="text-xs uppercase tracking-widest text-[#6B0C14] font-bold mb-4 block">
                      Lịch Trình Tiệc Cưới
                    </span>
                    <div className="relative flex flex-col gap-6 text-left pl-6 border-l-2 border-[#D4AF6A]/50 ml-6">
                      {getTimeline(data).map((item, idx) => (
                        <div key={idx} className="relative flex flex-col">
                          {/* Chấm tròn đỏ chu sa đồng trục */}
                          <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#6B0C14] border-2 border-[#D4AF6A] shadow-sm" />
                          <span className="text-xs font-bold text-[#6B0C14] tracking-wider">
                            {item.time}
                          </span>
                          <span className="text-xs sm:text-sm text-[#3A2522] mt-0.5 leading-relaxed">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                6. HỘP MỪNG CƯỚI 3 TRẠNG THÁI (gift — Khối Đỏ Chu Sa Hoàng Cung)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("gift") && (
              <div style={{ order: orderOf("gift") }}>
                <section className="relative w-full rounded-3xl bg-[#6B0C14]/94 border border-[#D4AF6A]/50 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <ImperialGoldDust count={12} />

                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#D4AF6A] font-semibold mb-1">
                    Gửi Lời Chúc Phúc
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#F2DCA6] font-normal mb-2"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hộp Mừng Cưới
                  </h3>

                  <div className="w-32 sm:w-40 my-2 flex justify-center">
                    <img
                      src="/templates/chu-sa-long-phung/divider-palace.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain opacity-85"
                    />
                  </div>

                  <p className="text-xs sm:text-sm text-[#FAF5EC] max-w-[420px] mb-8 font-light">
                    Sự hiện diện của quý khách là món quà quý giá nhất. Quý khách cũng có thể gửi quà mừng chúc phúc từ phương xa bằng cách chạm vào phong bì bên dưới:
                  </p>

                  {/* Bao lì xì dập kim 3 trạng thái tương tác */}
                  <div
                    className="relative w-64 sm:w-72 aspect-[320/596] flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95"
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
                        background: "radial-gradient(circle, rgba(212,175,106,0.35) 0%, transparent 70%)",
                        filter: "blur(12px)",
                      }}
                    />
                    <img
                      src={`/templates/chu-sa-long-phung/gift-${activeParcel}.webp`}
                      alt="Bao lì xì hoàng cung"
                      className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                    />
                  </div>

                  <button
                    onClick={() => setGiftModalOpen(true)}
                    className="mt-6 px-8 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF6A] via-[#F2DCA6] to-[#D4AF6A] text-[#42060B] text-xs font-serif tracking-widest font-bold uppercase shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Gửi Mừng Cưới
                  </button>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                7. XÁC NHẬN THAM DỰ & SỔ LƯU BÚT (rsvp — Thẻ Kem Hoàng Gia #FAF5EC)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("rsvp") && (
              <div style={{ order: orderOf("rsvp") }}>
                <section
                  className="relative w-full rounded-3xl border border-[#D4AF6A]/50 p-4 sm:p-8 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col items-center"
                  style={{ backgroundColor: IVORY_ROYAL, color: TEXT_BODY_IVORY }}
                >
                  <TemplateRsvpSection
                    data={data}
                    mode={mode}
                    tone="ruby"
                    customTheme={{
                      isDark: false,
                      wrap: "bg-transparent text-[#3A2522]",
                      eyebrow: "text-[#8C1D28] font-semibold tracking-wider",
                      heading: "text-[#4A0A10] font-display font-bold",
                      subtext: "text-[#6E5A57]",
                      card: "border border-[#D4AF6A]/45 bg-[#FAF5EC] text-[#3A2522]",
                      input: "border border-[#D4AF6A]/50 bg-[#FFFFFF] text-[#3A2522] placeholder:text-[#6E5A57]/70 focus:border-[#6B0C14] focus:ring-[#6B0C14]",
                      primaryBtn: "bg-[#6B0C14] text-[#FAF5EC] hover:bg-[#82111B] font-semibold",
                      outlineBtn: "border border-[#6B0C14] bg-transparent text-[#6B0C14] hover:bg-[#6B0C14]/10",
                      alert: "border-[#D4AF6A]/50 bg-[#FAF5EC] text-[#3A2522]",
                      badge: "border-[#D4AF6A]/50 bg-[#FAF5EC] text-[#6B0C14]",
                      optionBg: "#FFFFFF",
                      optionColor: "#3A2522",
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
              (Tuyệt đối KHÔNG lặp lại ngày cưới)
              ============================================================ */}
          <footer className="w-full flex flex-col items-center text-center pt-8 pb-12 border-t border-[#D4AF6A]/30">
            <div className="w-12 h-12 mb-3 opacity-80">
              <img
                src="/templates/chu-sa-long-phung/seal-octagon.webp"
                alt="Song Hỷ"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="w-32 sm:w-40 mb-3 flex justify-center">
              <img
                src="/templates/chu-sa-long-phung/divider-palace.webp"
                alt=""
                aria-hidden="true"
                className="w-full object-contain opacity-85"
              />
            </div>
            <h4
              className="text-xl sm:text-2xl text-[#F2DCA6] font-normal mb-2"
              style={{ fontFamily: TITLE_FONT }}
            >
              Chân Thành Cảm Ơn
            </h4>
            <p className="text-xs sm:text-sm text-[#E0C8BA] italic max-w-[420px] leading-relaxed">
              Sự hiện diện và lời chúc phúc của quý khách là niềm vinh hạnh lớn nhất của gia đình chúng tôi!
            </p>
          </footer>
        </div>
      </div>

      {/* ============================================================
          MODALS & OVERLAYS QUA PORTAL
          ============================================================ */}
      <TemplateLightboxModal
        photos={albumPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={(idx) => setLightboxIndex(idx)}
      />

      <GiftModal
        open={giftModalOpen}
        onClose={() => {
          setGiftModalOpen(false);
          setActiveParcel("normal");
        }}
        gift={data.gift}
        plan={data.plan ?? "free"}
        coupleName={`${data.couple?.groomName || "Chú Rể"} & ${data.couple?.brideName || "Cô Dâu"}`}
        guestName={guestName ?? null}
        tone="ruby"
      />
    </div>
  );
}
