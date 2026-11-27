"use client";

import * as React from "react";
import {
  MapPin,
  Clock,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playCoverSfx } from "@/lib/sfx";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingEvent } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: MẶC LAM KIM TUYẾN (mac-lam-kim-tuyen)
   - Xanh Lam Mực Sâu (Midnight Ink Navy): #061630 (sâu #040E21, thẻ #0B2042)
   - Chỉ Vàng Kim Tuyến (Fine Champagne Gold): #D8B878 (sáng #F1DDB0, trầm #A8894D)
   - Trắng Ngà Thanh Nhã (Warm Ivory): #F4EFE6 (chữ phụ #C3CAD6, tương phản > 13:1)
   - Dress Code mặc định: #3D2919 (Nâu trầm), #6D543E (Nâu cát), #EFE2D0 (Kem lụa)
   ============================================================ */

const NAVY_BG = "#061630";
const GOLD_FINE = "#D8B878";
const TEXT_IVORY = "#F4EFE6";

const TITLE_FONT = "var(--font-playfair), 'Playfair Display', Georgia, serif";
const NAME_FONT = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), 'Be Vietnam Pro', sans-serif";

const EASE_EDITORIAL = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "10:30", label: "Đón tiếp quan khách & Chụp ảnh kỷ niệm" },
  { time: "11:30", label: "Cử hành nghi thức Lễ Thành Hôn" },
  { time: "12:00", label: "Khai tiệc mừng cưới & Nâng ly chúc phúc" },
  { time: "13:30", label: "Hòa tấu âm nhạc & Lời cảm tạ tri ân" },
  { time: "14:30", label: "Tiễn khách & Trao quà cảm ơn" },
];

const DEFAULT_DRESS = ["#3D2919", "#6D543E", "#EFE2D0"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   AlternatingSlideText: Chữ trượt luân phiên Trái ↔ Phải
   - Tự tắt chuyển động x khi prefers-reduced-motion
   ------------------------------------------------------------ */
interface AlternatingSlideProps {
  children: React.ReactNode;
  direction?: "left" | "right";
  className?: string;
  delay?: number;
  duration?: number;
}

function AlternatingSlideText({
  children,
  direction = "left",
  className,
  delay = 0,
  duration = 0.65,
}: AlternatingSlideProps) {
  const reduce = useReducedMotion();
  const xOffset = direction === "left" ? -32 : 32;

  return (
    <m.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, x: xOffset }}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration,
        delay,
        ease: EASE_EDITORIAL,
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}

/* ------------------------------------------------------------
   Hạt bụi kim tuyến tinh tế trôi nhẹ trên nền đêm lam mực
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function FineGoldSparkles({ count = 16 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 17) % 94 + 3}%`,
      size: (idx % 3) + 2,
      duration: 8 + (idx % 4) * 2,
      delay: (idx * 0.4) % 3.2,
      yOffset: 30 + (idx % 4) * 20,
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
            background:
              "radial-gradient(circle, #F1DDB0 0%, rgba(216, 184, 120, 0.6) 60%, transparent 100%)",
            boxShadow: "0 0 6px rgba(241, 221, 176, 0.45)",
          }}
          animate={{
            y: [0, -p.yOffset * 10],
            opacity: [0, 0.85, 0],
            scale: [0.8, 1.25, 0.6],
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

/* ------------------------------------------------------------
   Countdown Timer Hydration-Safe
   ------------------------------------------------------------ */
function CountdownClock({ targetDate }: { targetDate: string }) {
  const [mounted, setMounted] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    setMounted(true);
    const target = new Date(targetDate).getTime();
    if (isNaN(target)) return;

    function update() {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!mounted) {
    return (
      <div className="grid grid-cols-4 gap-2.5 sm:gap-4 text-center">
        {["NGÀY", "GIỜ", "PHÚT", "GIÂY"].map((unit) => (
          <div
            key={unit}
            className="rounded-xl border border-[#D8B878]/30 bg-[#0B2042]/70 p-3 backdrop-blur-sm"
          >
            <div className="text-xl sm:text-2xl font-serif font-bold text-[#F1DDB0]">--</div>
            <div className="text-[10px] tracking-widest text-[#C3CAD6]">{unit}</div>
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { label: "NGÀY", value: timeLeft.days },
    { label: "GIỜ", value: timeLeft.hours },
    { label: "PHÚT", value: timeLeft.minutes },
    { label: "GIÂY", value: timeLeft.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2.5 sm:gap-4 text-center">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-[#D8B878]/35 bg-[#0B2042]/70 p-3 sm:p-4 backdrop-blur-sm transition-all duration-300 hover:border-[#D8B878]/70"
        >
          <div
            className="text-2xl sm:text-3xl font-serif font-semibold text-[#F1DDB0]"
            style={{ fontFamily: TITLE_FONT }}
          >
            {String(item.value).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] tracking-widest text-[#C3CAD6]">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------
   Monthly Calendar Grid with Gold Marker
   ------------------------------------------------------------ */
function MonthlyCalendar({ dateStr, eventDays }: { dateStr: string; eventDays?: Set<number> }) {
  const d = new Date(dateStr);
  const isValid = !isNaN(d.getTime());
  const year = isValid ? d.getFullYear() : 2025;
  const month = isValid ? d.getMonth() : 9; // 0-indexed
  const weddingDay = isValid ? d.getDate() : 26;

  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Adjust for Monday first (T2 = 0, ..., CN = 6)
  const startCol = firstDay === 0 ? 6 : firstDay - 1;

  const days: (number | null)[] = [];
  for (let i = 0; i < startCol; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const weekHeaders = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="rounded-2xl border border-[#D8B878]/30 bg-[#0B2042]/70 p-4 sm:p-6 backdrop-blur-sm">
      <div className="mb-4 text-center">
        <span
          className="text-sm sm:text-base font-serif tracking-widest text-[#F1DDB0]"
          style={{ fontFamily: TITLE_FONT }}
        >
          THÁNG {month + 1} . {year}
        </span>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs text-[#C3CAD6] mb-2 font-medium">
        {weekHeaders.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs sm:text-sm">
        {days.map((dayNum, idx) => {
          if (dayNum === null) {
            return <div key={`empty-${idx}`} className="py-2" />;
          }

          const isWedding = eventDays ? eventDays.has(dayNum) : dayNum === weddingDay;

          return (
            <div
              key={`day-${dayNum}`}
              className={cn(
                "relative flex items-center justify-center py-1.5 sm:py-2 rounded-full transition-colors",
                isWedding
                  ? "bg-gradient-to-br from-[#D8B878] to-[#A8894D] text-[#061630] font-bold shadow-md shadow-[#D8B878]/30"
                  : "text-[#F4EFE6] hover:bg-[#D8B878]/10"
              )}
            >
              <span>{dayNum}</span>
              {isWedding && (
                <span className="absolute -top-1 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#F1DDB0]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT: MẶC LAM KIM TUYẾN
   ============================================================ */
export function MacLamKimTuyenTemplate({
  data,
  mode,
  contained = false,
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

  // Khởi tạo trạng thái mở bìa
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


  // Preload 3 trạng thái hộp mừng cưới
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p1 = new Image();
    p1.src = "/templates/mac-lam-kim-tuyen/gift-normal.webp";
    const p2 = new Image();
    p2.src = "/templates/mac-lam-kim-tuyen/gift-hover.webp";
    const p3 = new Image();
    p3.src = "/templates/mac-lam-kim-tuyen/gift-active.webp";
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

  // Xử lý mở thiệp mượt mà
  const handleOpenCard = React.useCallback(() => {
    if (isOpening || coverGone) return;
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }
    setIsOpening(true);
    playCoverSfx("crystal");

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
    }, 850);
  }, [isOpening, coverGone, reduce, onOpenedChange, contained]);

  // Dữ liệu ngày cưới & âm lịch
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent?.startsAt || data.date || "2027-03-20T10:00:00+07:00";
  const dateParts = formatWeddingDateParts(eventDateStr);
  const lunarClean = targetEvent?.lunarDate
    ? formatLunarDateClean(targetEvent.lunarDate)
    : "";

  const targetDateObj = React.useMemo(() => {
    const events = getVisibleEvents(data);
    const ev = getNearestUpcomingEvent(events, data.date);
    return new Date(ev?.startsAt || data.date || "2027-03-20T10:00:00+07:00");
  }, [data]);
  const calYear = targetDateObj.getFullYear();
  const calMonth = targetDateObj.getMonth();
  const eventDays = React.useMemo(() => {
    const events = getVisibleEvents(data);
    const y = targetDateObj.getFullYear();
    const m = targetDateObj.getMonth();
    const days = new Set<number>();
    events.forEach((evt) => {
      if (evt.startsAt) {
        const d = new Date(evt.startsAt);
        if (d.getFullYear() === y && d.getMonth() === m) {
          days.add(d.getDate());
        }
      }
    });
    if (days.size === 0 && !isNaN(targetDateObj.getTime())) {
      days.add(targetDateObj.getDate());
    }
    return days;
  }, [data, targetDateObj]);

  // Album ảnh cưới
  const isFree = (data.plan ?? "free") === "free";
  const rawAlbum = data.photos?.gallery || [];
  const albumPhotos = isFree ? rawAlbum.slice(0, 5) : rawAlbum;

  // Danh sách các section ẩn & thứ tự section
  const hiddenSections = React.useMemo(() => {
    return new Set(data.hiddenSections || []);
  }, [data.hiddenSections]);

  const sectionOrder = data.sectionOrder?.length ? data.sectionOrder : CANONICAL_SECTION_ORDER;
  const orderOf = (name: string) => {
    const idx = sectionOrder.indexOf(name);
    return idx === -1 ? 99 : idx + 1;
  };

  // Tách tên bố mẹ tự động
  const groomParents: string[] = (data.couple?.groomParents || "")
    .split("&")
    .map((s: string) => s.trim())
    .filter(Boolean);
  const brideParents: string[] = (data.couple?.brideParents || "")
    .split("&")
    .map((s: string) => s.trim())
    .filter(Boolean);

  const coupleData = data.couple;
  const groomDisplayName = coupleData?.groomName || "Hoàng Bách";
  const brideDisplayName = coupleData?.brideName || "Khánh Linh";
  const groomFullName = coupleData?.groomFullName || groomDisplayName;
  const brideFullName = coupleData?.brideFullName || brideDisplayName;
  const coupleDisplayName = `${groomDisplayName} & ${brideDisplayName}`;

  const dressColors = getDressColors(data);
  const timelineItems = getTimeline(data);

  return (
    <div
      className={cn(
        "relative w-full min-h-screen text-[#F4EFE6] select-none overflow-x-clip",
        !coverGone && "h-screen overflow-hidden"
      )}
      style={{
        backgroundColor: NAVY_BG,
        fontFamily: BODY_FONT,
      }}
    >
      {/* ============================================================
          MÀN BÌA THIỆP CƯỚI: MẶC LAM KIM TUYẾN
          - QUY TẮC Z-INDEX CHỐNG LỖI MỜ ẢNH BÌA:
            z-0: background-mobile.webp / background.webp sắc nét 100%
            z-[5]: lớp chuyển cảnh trượt khi mở
            z-10: họa tiết đường nét mảnh, crown, corners
            z-20: nội dung chữ, tên cặp đôi, nút Mở Thiệp
          ============================================================ */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            key="mac-lam-cover"
            className="fixed inset-0 z-50 w-full max-w-full overflow-hidden flex items-center justify-center px-4 py-4 sm:px-6"
            initial={{ opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.6 } }}
          >
            {/* Lớp z-0: Ảnh nền sắc nét 100%, TUYỆT ĐỐI KHÔNG BỊ BLUR HOẶC VEIL CHE KHI CHỜ */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              {/* Mobile background */}
              <img loading="lazy" decoding="async"
                src="/templates/mac-lam-kim-tuyen/background-mobile.webp"
                alt="Background Mobile"
                className="h-full w-full object-cover md:hidden"
              />
              {/* Desktop background */}
              <img loading="lazy" decoding="async"
                src="/templates/mac-lam-kim-tuyen/background.webp"
                alt="Background Desktop"
                className="hidden h-full w-full object-cover md:block"
              />
            </div>

            {/* Lớp z-[5]: Lớp chuyển cảnh trượt khi mở thiệp (pointer-events-none, chỉ kích hoạt khi isOpening) */}
            {isOpening && !reduce && (
              <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
                {/* Cánh trên trượt lên */}
                <m.div
                  className="absolute top-0 left-0 right-0 h-1/2 bg-[#061630]"
                  initial={{ y: 0 }}
                  animate={{ y: "-100%" }}
                  transition={{ duration: 0.85, ease: EASE_EDITORIAL }}
                />
                {/* Cánh dưới trượt xuống */}
                <m.div
                  className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#061630]"
                  initial={{ y: 0 }}
                  animate={{ y: "100%" }}
                  transition={{ duration: 0.85, ease: EASE_EDITORIAL }}
                />
              </div>
            )}

            {/* Lớp z-10: Khung viền chỉ vàng mảnh & 4 góc nghệ thuật */}
            <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center p-4 sm:p-8">
              {/* Khung viền kép 1px */}
              <div className="relative w-full max-w-[420px] h-full max-h-[820px] border border-[#D8B878]/50 rounded-2xl p-3 sm:p-5">
                <div className="w-full h-full border border-dashed border-[#D8B878]/30 rounded-xl relative">
                  {/* 4 Góc nghệ thuật */}
                  <img loading="lazy" decoding="async"
                    src="/templates/mac-lam-kim-tuyen/corner-minimal.webp"
                    alt="Corner TL"
                    className="absolute -top-1 -left-1 w-14 sm:w-16 h-auto"
                  />
                  <img loading="lazy" decoding="async"
                    src="/templates/mac-lam-kim-tuyen/corner-minimal.webp"
                    alt="Corner TR"
                    className="absolute -top-1 -right-1 w-14 sm:w-16 h-auto -scale-x-100"
                  />
                  <img loading="lazy" decoding="async"
                    src="/templates/mac-lam-kim-tuyen/corner-minimal.webp"
                    alt="Corner BL"
                    className="absolute -bottom-1 -left-1 w-14 sm:w-16 h-auto -scale-y-100"
                  />
                  <img loading="lazy" decoding="async"
                    src="/templates/mac-lam-kim-tuyen/corner-minimal.webp"
                    alt="Corner BR"
                    className="absolute -bottom-1 -right-1 w-14 sm:w-16 h-auto -scale-x-100 -scale-y-100"
                  />
                </div>
              </div>
            </div>

            {/* Hạt kim tuyến bay nhẹ */}
            <FineGoldSparkles count={14} />

            {/* Lớp z-20: Nội dung chữ bìa sắc nét 100% */}
            <div className="relative z-20 flex flex-col items-center justify-between w-full max-w-[328px] sm:max-w-[380px] mx-auto h-full max-h-[760px] py-12 px-6 text-center">
              {/* Nhóm trên: Tiêu đề & Huy hiệu ô liu */}
              <div className="flex flex-col items-center gap-3">
                <m.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-[11px] sm:text-xs tracking-[0.35em] text-[#F1DDB0] uppercase font-medium">
                    TRÂN TRỌNG BÁO HỶ
                  </span>
                </m.div>

                <m.img
                  src="/templates/mac-lam-kim-tuyen/crest-olive.webp"
                  alt="Olive Crest"
                  className="w-16 sm:w-20 h-auto mt-2 opacity-90 drop-shadow-[0_2px_8px_rgba(216,184,120,0.3)]"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                />
              </div>

              {/* Nhóm giữa: Vương miện lá ô liu & Tên cặp đôi */}
              <div className="flex flex-col items-center w-full my-auto">
                <m.img
                  src="/templates/mac-lam-kim-tuyen/botanical-crown.webp"
                  alt="Botanical Crown"
                  className="w-48 sm:w-60 h-auto mb-2 opacity-95"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                />

                <m.div
                  className="text-3xl sm:text-4xl font-serif font-semibold tracking-wide bg-gradient-to-r from-[#D8B878] via-[#F1DDB0] to-[#D8B878] bg-clip-text text-transparent"
                  style={{ fontFamily: TITLE_FONT }}
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.65, delay: 0.4 }}
                >
                  {groomDisplayName}
                </m.div>

                <m.div
                  className="text-xl sm:text-2xl font-serif italic text-[#F4EFE6]/75 my-1"
                  style={{ fontFamily: NAME_FONT }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  &amp;
                </m.div>

                <m.div
                  className="text-3xl sm:text-4xl font-serif font-semibold tracking-wide bg-gradient-to-r from-[#D8B878] via-[#F1DDB0] to-[#D8B878] bg-clip-text text-transparent"
                  style={{ fontFamily: TITLE_FONT }}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.65, delay: 0.55 }}
                >
                  {brideDisplayName}
                </m.div>

                <m.img
                  src="/templates/mac-lam-kim-tuyen/divider-minimal.webp"
                  alt="Divider"
                  className="w-40 sm:w-48 h-auto mt-4 opacity-80"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                />

                <m.div
                  className="mt-4 flex flex-col items-center gap-1"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.65 }}
                >
                  <span className="text-sm sm:text-base font-serif tracking-[0.25em] text-[#F4EFE6]">
                    {dateParts.day} . {dateParts.month} . {dateParts.year}
                  </span>
                  <span className="text-xs tracking-[0.2em] text-[#C3CAD6]">
                    {dateParts.weekday?.toUpperCase()} | {dateParts.time || "11:30"}
                  </span>
                </m.div>
              </div>

              {/* Nhóm dưới: Nút "MỞ THIỆP" */}
              <m.div
                className="w-full flex justify-center pb-2"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <button
                  type="button"
                  onClick={handleOpenCard}
                  disabled={isOpening}
                  className={cn(
                    "group relative flex items-center justify-center gap-2 px-8 py-3.5 rounded-full",
                    "border border-[#D8B878] bg-[#0B2042] text-[#F1DDB0]",
                    "shadow-[0_4px_20px_rgba(216,184,120,0.25)]",
                    "transition-all duration-300 hover:scale-105 hover:shadow-[0_6px_25px_rgba(216,184,120,0.4)]",
                    "active:scale-95 cursor-pointer"
                  )}
                >
                  <span className="text-xs sm:text-sm font-medium tracking-[0.25em] uppercase">
                    {isOpening ? "ĐANG MỞ..." : "MỞ THIỆP"}
                  </span>
                </button>
              </m.div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          RUỘT THIỆP CƯỚI: NỘI DUNG CHÍNH (INNER INVITATION)
          - Hiển thị sau khi mở thiệp
          - Chữ trượt luân phiên Trái ↔ Phải mượt mà
          - Toàn bộ khối cha đều có overflow-x-clip
          ============================================================ */}
      <div
        className={cn(
          "relative z-10 w-full min-h-screen transition-opacity duration-700",
          !coverGone && "hidden"
        )}
      >
        {/* Nút nhạc nền nổi */}
        {!externalMusicControl && !data.hiddenSections?.includes("music") && (
          <LiveMusicFloatingButton
            src={data.music?.src || "/media/co-dien.mp3"}
            title={data.music?.title || "Nhạc Nền Mặc Lam"}
            visible={openState}
            tone="obsidian"
          />
        )}

        {/* Khung chứa trung tâm cho mobile / tablet */}
        <div className="mx-auto w-full max-w-[480px] px-4 py-8 sm:px-6 sm:py-12 flex flex-col gap-14 sm:gap-20 overflow-x-clip">

          {/* 1. HERO SECTION (Tối Giản Lam Mực) */}
          <section className="relative flex flex-col items-center text-center pt-6 pb-2 overflow-x-clip">
            <AlternatingSlideText direction="left" delay={0.1}>
              <span className="text-[11px] sm:text-xs tracking-[0.35em] text-[#F1DDB0] uppercase font-medium">
                THƯ MỜI THÀNH HÔN
              </span>
            </AlternatingSlideText>

            <AlternatingSlideText direction="right" delay={0.2} className="my-3">
              <img loading="lazy" decoding="async"
                src="/templates/mac-lam-kim-tuyen/botanical-crown.webp"
                alt="Botanical Crown"
                className="w-44 sm:w-56 h-auto opacity-90 mx-auto"
              />
            </AlternatingSlideText>

            {/* Alternating couple names */}
            <AlternatingSlideText direction="left" delay={0.3} className="w-full">
              <div
                className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold tracking-wide bg-gradient-to-r from-[#D8B878] via-[#F1DDB0] to-[#D8B878] bg-clip-text text-transparent"
                style={{ fontFamily: TITLE_FONT }}
              >
                {groomDisplayName}
              </div>
            </AlternatingSlideText>

            <AlternatingSlideText direction="right" delay={0.4}>
              <div
                className="text-xl sm:text-2xl font-serif italic text-[#F4EFE6]/70 my-1.5"
                style={{ fontFamily: NAME_FONT }}
              >
                &amp;
              </div>
            </AlternatingSlideText>

            <AlternatingSlideText direction="left" delay={0.5} className="w-full">
              <div
                className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold tracking-wide bg-gradient-to-r from-[#D8B878] via-[#F1DDB0] to-[#D8B878] bg-clip-text text-transparent"
                style={{ fontFamily: TITLE_FONT }}
              >
                {brideDisplayName}
              </div>
            </AlternatingSlideText>

            <AlternatingSlideText direction="right" delay={0.6} className="mt-4">
              <img loading="lazy" decoding="async"
                src="/templates/mac-lam-kim-tuyen/divider-minimal.webp"
                alt="Divider"
                className="w-40 sm:w-48 h-auto opacity-75 mx-auto"
              />
            </AlternatingSlideText>

            {/* Lời trích dẫn tình yêu */}
            {data.quote && (
              <AlternatingSlideText direction="left" delay={0.7} className="mt-6 px-4">
                <p className="text-xs sm:text-sm font-serif italic text-[#C3CAD6] leading-relaxed max-w-sm mx-auto">
                  &ldquo;{data.quote}&rdquo;
                </p>
              </AlternatingSlideText>
            )}
          </section>

          {/* CÁC SECTION CÓ THỂ ĐIỀU KHIỂN BẬT/ẨN VÀ THỨ TỰ (orderOf) */}
          <div className="flex flex-col gap-14 sm:gap-20">

            {/* 2. FAMILY SECTION (Hai Họ Viên Mãn) */}
            {!hiddenSections.has("family") && (
              <div style={{ order: orderOf("family") }}>
                <section className="relative overflow-x-clip">
                  <AlternatingSlideText direction="right" delay={0.1} className="text-center mb-6">
                    <h2
                      className="text-xl sm:text-2xl font-serif font-semibold text-[#F1DDB0] tracking-wider"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      HAI HỌ VIÊN MÃN
                    </h2>
                    <p className="text-[11px] tracking-widest text-[#C3CAD6] uppercase mt-1">
                      TRÂN TRỌNG BÁO HỶ CÙNG QUAN KHÁCH
                    </p>
                  </AlternatingSlideText>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    {/* Cột Nhà Trai (Slides from left) */}
                    <AlternatingSlideText direction="left" delay={0.2}>
                      <div className="rounded-2xl border border-[#D8B878]/30 bg-[#0B2042]/70 p-5 sm:p-6 backdrop-blur-sm text-center h-full flex flex-col justify-between">
                        <div>
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] tracking-widest font-semibold border border-[#D8B878]/40 bg-[#D8B878]/10 text-[#F1DDB0] uppercase mb-3">
                            NHÀ TRAI
                          </span>
                          <div className="flex flex-col gap-1 text-xs sm:text-sm text-[#F4EFE6]/90">
                            {groomParents.length > 0 ? (
                              groomParents.map((p, idx) => <span key={idx}>{p}</span>)
                            ) : (
                              <span>Ông Nguyễn Văn A &amp; Bà Trần Thị B</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-[#D8B878]/20">
                          <span className="text-[10px] tracking-widest text-[#C3CAD6] uppercase block">
                            CHÚ RỂ
                          </span>
                          <span
                            className="text-lg sm:text-xl font-serif font-semibold text-[#F1DDB0] mt-1 block"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {groomFullName}
                          </span>
                        </div>
                      </div>
                    </AlternatingSlideText>

                    {/* Cột Nhà Gái (Slides from right) */}
                    <AlternatingSlideText direction="right" delay={0.3}>
                      <div className="rounded-2xl border border-[#D8B878]/30 bg-[#0B2042]/70 p-5 sm:p-6 backdrop-blur-sm text-center h-full flex flex-col justify-between">
                        <div>
                          <span className="inline-block px-3 py-1 rounded-full text-[10px] tracking-widest font-semibold border border-[#D8B878]/40 bg-[#D8B878]/10 text-[#F1DDB0] uppercase mb-3">
                            NHÀ GÁI
                          </span>
                          <div className="flex flex-col gap-1 text-xs sm:text-sm text-[#F4EFE6]/90">
                            {brideParents.length > 0 ? (
                              brideParents.map((p, idx) => <span key={idx}>{p}</span>)
                            ) : (
                              <span>Ông Lê Văn C &amp; Bà Phạm Thị D</span>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-[#D8B878]/20">
                          <span className="text-[10px] tracking-widest text-[#C3CAD6] uppercase block">
                            CÔ DÂU
                          </span>
                          <span
                            className="text-lg sm:text-xl font-serif font-semibold text-[#F1DDB0] mt-1 block"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {brideFullName}
                          </span>
                        </div>
                      </div>
                    </AlternatingSlideText>
                  </div>
                </section>
              </div>
            )}

            {/* 3. CALENDAR & COUNTDOWN (Lịch Cưới & Đếm Ngược) */}
            {!hiddenSections.has("calendar") && (
              <div style={{ order: orderOf("calendar") }}>
                <section className="relative overflow-x-clip">
                  <AlternatingSlideText direction="right" delay={0.1} className="text-center mb-6">
                    <h2
                      className="text-xl sm:text-2xl font-serif font-semibold text-[#F1DDB0] tracking-wider"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      KHOẢNH KHẮC CHUNG ĐÔI
                    </h2>
                    <p className="text-[11px] tracking-widest text-[#C3CAD6] uppercase mt-1">
                      LỊCH CƯỚI &amp; ĐẾM NGƯỢC THỜI GIAN
                    </p>
                  </AlternatingSlideText>

                  <div className="flex flex-col gap-6">
                    {/* Monthly Calendar */}
                    <AlternatingSlideText direction="left" delay={0.2}>
                      <MonthlyCalendar dateStr={eventDateStr} eventDays={eventDays} />
                    </AlternatingSlideText>

                    {/* Countdown Clock */}
                    <AlternatingSlideText direction="right" delay={0.3}>
                      <CountdownClock targetDate={eventDateStr} />
                    </AlternatingSlideText>

                    {lunarClean && (
                      <AlternatingSlideText direction="left" delay={0.4} className="text-center">
                        <span className="text-xs italic text-[#C3CAD6]">
                          (Nhằm ngày {lunarClean})
                        </span>
                      </AlternatingSlideText>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* 4. CEREMONY & EVENTS (Sự kiện và chỉ đường) */}
            {!hiddenSections.has("map") && (
              <div style={{ order: orderOf("map") }}>
                <section className="relative overflow-x-clip">
                  <AlternatingSlideText direction="left" delay={0.1} className="text-center mb-6">
                    <h2
                      className="text-xl sm:text-2xl font-serif font-semibold text-[#F1DDB0] tracking-wider"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      SỰ KIỆN TRỌNG ĐẠI
                    </h2>
                    <p className="text-[11px] tracking-widest text-[#C3CAD6] uppercase mt-1">
                      LỄ THÀNH HÔN &amp; TIỆC MỪNG CƯỚI
                    </p>
                  </AlternatingSlideText>

                  <div className={`mt-2 ${visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6" : "flex flex-col gap-5 sm:gap-6 max-w-xl mx-auto"}`}>
                    {visibleEvents.map((evt, idx) => {
                      const evtDate = evt.startsAt ? new Date(evt.startsAt) : new Date(eventDateStr);
                      const isEven = idx % 2 === 0;
                      const directionsUrl = getEventDirectionsUrl(evt);

                      return (
                        <AlternatingSlideText
                          key={evt.id || idx}
                          direction={isEven ? "left" : "right"}
                          delay={0.15 * idx}
                        >
                          <div className="rounded-2xl border border-[#D8B878]/35 bg-[#0B2042]/70 p-5 sm:p-6 backdrop-blur-sm relative overflow-hidden">
                            {/* Thanh ngày tháng ngang */}
                            <div className="flex items-center justify-between pb-3 border-b border-[#D8B878]/20 text-xs sm:text-sm font-serif">
                              <span className="text-[#F1DDB0] font-semibold tracking-wider">
                                {evt.title || "Lễ Thành Hôn"}
                              </span>
                              <span className="text-[#C3CAD6] tracking-widest">
                                {evtDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>

                            {/* Chi tiết sự kiện */}
                            <div className="mt-4 flex flex-col gap-2.5 text-xs sm:text-sm">
                              <div className="flex items-start gap-2.5 text-[#F4EFE6]/90">
                                <Clock className="w-4 h-4 text-[#D8B878] shrink-0 mt-0.5" />
                                <span>
                                  {evtDate.toLocaleDateString("vi-VN", {
                                    weekday: "long",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>

                              <div className="flex items-start gap-2.5 text-[#F4EFE6]/90">
                                <MapPin className="w-4 h-4 text-[#D8B878] shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-medium text-[#F1DDB0]">{evt.venueName}</div>
                                  {evt.venueAddress && (
                                    <div className="text-xs text-[#C3CAD6] mt-0.5">{evt.venueAddress}</div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Nút chỉ đường Google Maps */}
                            {directionsUrl && (
                              <div className="mt-4 pt-3 border-t border-[#D8B878]/15 flex justify-end">
                                <a
                                  href={directionsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#D8B878]/60 bg-[#D8B878]/10 text-xs font-medium text-[#F1DDB0] hover:bg-[#D8B878]/25 transition-colors"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  <span>Chỉ Đường</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </AlternatingSlideText>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* 5. DRESS CODE & TIMELINE */}
            {!hiddenSections.has("dresscode") && (
              <div style={{ order: orderOf("dresscode") }}>
                <section className="relative overflow-x-clip">
                  <AlternatingSlideText direction="left" delay={0.1} className="text-center mb-6">
                    <h2
                      className="text-xl sm:text-2xl font-serif font-semibold text-[#F1DDB0] tracking-wider"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      TRANG PHỤC &amp; LỊCH TRÌNH
                    </h2>
                  </AlternatingSlideText>

                  {/* Dress code swatches */}
                  <AlternatingSlideText direction="right" delay={0.2} className="mb-8">
                    <div className="rounded-2xl border border-[#D8B878]/30 bg-[#0B2042]/70 p-5 backdrop-blur-sm text-center">
                      <span className="text-xs font-medium text-[#F1DDB0] uppercase tracking-wider block mb-3">
                        MÀU SẮC TRANG PHỤC GỢI Ý
                      </span>
                      <div className="flex items-center justify-center gap-4 sm:gap-6">
                        {dressColors.map((color, idx) => (
                          <div
                            key={idx}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#D8B878]/40 shadow-inner transition-transform hover:scale-110"
                            style={{ backgroundColor: color }}
                            title={color}
                            aria-label={`Màu trang phục ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </AlternatingSlideText>

                  {/* Alternating Timeline with center axis */}
                  <div className="relative pl-6 sm:pl-8 border-l border-[#D8B878]/30 flex flex-col gap-6 ml-3 sm:ml-4">
                    {timelineItems.map((item, idx) => {
                      const isEven = idx % 2 === 0;

                      return (
                        <AlternatingSlideText
                          key={idx}
                          direction={isEven ? "left" : "right"}
                          delay={0.1 * idx}
                          className="relative"
                        >
                          {/* Điểm nút trên trục dọc */}
                          <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3 h-3 rounded-full border-2 border-[#D8B878] bg-[#061630]" />

                          <div className="rounded-xl border border-[#D8B878]/25 bg-[#0B2042]/60 p-3.5 backdrop-blur-sm">
                            <div className="text-xs sm:text-sm font-semibold text-[#F1DDB0] font-serif">
                              {item.time}
                            </div>
                            <div className="text-xs text-[#F4EFE6]/85 mt-1 leading-relaxed">
                              {item.label}
                            </div>
                          </div>
                        </AlternatingSlideText>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* 6. ALBUM ẢNH CƯỚI (Gallery Section) */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <div style={{ order: orderOf("album") }}>
                <section className="relative overflow-x-clip">
                  <AlternatingSlideText direction="right" delay={0.1} className="text-center mb-6">
                    <h2
                      className="text-xl sm:text-2xl font-serif font-semibold text-[#F1DDB0] tracking-wider"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      KHOẢNH KHẮC HẠNH PHÚC
                    </h2>
                    <p className="text-[11px] tracking-widest text-[#C3CAD6] uppercase mt-1">
                      WEDDING PHOTO GALLERY
                    </p>
                  </AlternatingSlideText>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
                    {albumPhotos.map((photo, idx) => (
                      <AlternatingSlideText
                        key={idx}
                        direction={idx % 2 === 0 ? "left" : "right"}
                        delay={0.08 * idx}
                      >
                        <div
                          onClick={() => setLightboxIndex(idx)}
                          className="group relative aspect-[3/4] rounded-xl overflow-hidden border border-[#D8B878]/30 bg-[#0B2042] cursor-pointer shadow-sm hover:border-[#D8B878] transition-all duration-300"
                        >
                          <img decoding="async"
                            src={photo.url}
                            alt={photo.alt || `Photo ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#061630]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </AlternatingSlideText>
                    ))}
                  </div>

                </section>
              </div>
            )}

            {/* QR Album dành cho khách */}
            {!isFree && !hiddenSections.has("albumQr") && weddingSlug && (
              <div style={{ order: orderOf("albumQr") }}>
                <section className="relative overflow-x-clip">
                  <GuestAlbumQr slug={weddingSlug} />
                </section>
              </div>
            )}

            {/* 7. HỘP MỪNG CƯỚI (Gift Box 3 Trạng Thái) */}
            {!hiddenSections.has("gift") && (
              <div style={{ order: orderOf("gift") }}>
                <section className="relative overflow-x-clip text-center">
                  <AlternatingSlideText direction="left" delay={0.1} className="mb-4">
                    <h2
                      className="text-xl sm:text-2xl font-serif font-semibold text-[#F1DDB0] tracking-wider"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      HỘP MỪNG CƯỚI
                    </h2>
                    <p className="text-[11px] tracking-widest text-[#C3CAD6] uppercase mt-1">
                      GỬI LỜI CHÚC PHÚC &amp; MỪNG CƯỚI
                    </p>
                  </AlternatingSlideText>

                  <AlternatingSlideText direction="right" delay={0.2}>
                    <div
                      className="relative inline-block cursor-pointer mx-auto my-2"
                      onMouseEnter={() => !isGiftOpening && setActiveParcel("glow")}
                      onMouseLeave={() => !isGiftOpening && activeParcel !== "open" && setActiveParcel("normal")}

                      onClick={handleGiftClick}
                    >
                      <img loading="lazy" decoding="async"
                        src={`/templates/mac-lam-kim-tuyen/gift-${(activeParcel === "open" || activeParcel === "active") ? "active" : (activeParcel === "glow" || activeParcel === "hover") ? "hover" : "normal"}.webp`}
                        alt="Gift Box"
                        className="w-48 sm:w-56 h-auto mx-auto transition-transform duration-300 hover:scale-105"
                      />
                    </div>

                    <div className="mt-3">
                      <button
                        type="button"
                        disabled={isGiftOpening}
                        onClick={handleGiftClick}
                        className="px-6 py-2.5 rounded-full border border-[#D8B878] bg-[#0B2042] text-xs font-medium text-[#F1DDB0] hover:bg-[#D8B878]/20 transition-all cursor-pointer shadow-md"
                      >
                        GỬI MỪNG CƯỚI
                      </button>
                    </div>
                  </AlternatingSlideText>
                </section>
              </div>
            )}

            {/* 8. RSVP SECTION (Xác Nhận Tham Dự) */}
            {!hiddenSections.has("rsvp") && (
              <div style={{ order: orderOf("rsvp") }}>
                <section className="relative overflow-x-clip">
                  <AlternatingSlideText direction="left" delay={0.1}>
                    <div className="rounded-2xl border border-[#D8B878]/30 bg-[#0B2042]/70 p-5 sm:p-7 backdrop-blur-sm">
                      <TemplateRsvpSection
                        data={data}
                        mode={mode}
                        tone="midnight-ink"
                        contained={contained}
                        inviteSlug={inviteSlug}
                        weddingSlug={weddingSlug}
                        guestName={guestName}
                        invitationMode={invitationMode}
                        initialStatus={initialStatus}
                        initialPlusOnes={initialPlusOnes}
                        initialDiet={initialDiet}
                        initialSongRequest={initialSongRequest}
                        initialRideNeeded={initialRideNeeded}
                      />
                    </div>
                  </AlternatingSlideText>
                </section>
              </div>
            )}

          </div>
        </div>

        {/* 9. FOOTER (Lời Tri Ân - Đặt ngoài flex ordered để chống lỗi layout) */}
        <footer className="w-full border-t border-[#D8B878]/25 bg-[#040E21] py-12 px-6 text-center text-xs text-[#C3CAD6]">
          <div className="max-w-md mx-auto flex flex-col items-center gap-3">
            <img loading="lazy" decoding="async"
              src="/templates/mac-lam-kim-tuyen/crest-olive.webp"
              alt="Crest"
              className="w-12 h-auto opacity-75 mb-1"
            />
            <div
              className="text-lg font-serif font-semibold text-[#F1DDB0]"
              style={{ fontFamily: TITLE_FONT }}
            >
              {groomDisplayName} &amp; {brideDisplayName}
            </div>
            <p className="leading-relaxed">
              Sự hiện diện của quý khách là niềm vinh hạnh lớn nhất của gia đình chúng tôi. Xin chân thành cảm ơn!
            </p>
            <div className="mt-4 text-[10px] text-[#C3CAD6]/60 tracking-widest">
              POWERED BY INVIWEDD.DATE
            </div>
          </div>
        </footer>
      </div>

      {/* Lightbox Modal (createPortal) */}
      <TemplateLightboxModal
        photos={albumPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={(idx) => setLightboxIndex(idx)}
      />

      {/* Gift Modal (createPortal) */}
      <GiftModal
        open={giftModalOpen}
        onClose={handleCloseModal}
        gift={data.gift}
        plan={data.plan ?? "free"}
        coupleName={coupleDisplayName}
        guestName={guestName ?? null}
        tone="velvet"
      />
    </div>
  );
}

export default MacLamKimTuyenTemplate;
