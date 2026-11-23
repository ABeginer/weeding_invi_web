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
import { playCoverSfx } from "@/lib/sfx";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
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
   BẢNG MÀU CHÍNH THỨC: TƠ HỒNG LỤA THẮM (to-hong-lua-tham)
   - Nền lụa rượu vang sâu: #2A060E -> #450B18
   - Bề mặt thẻ bán trong suốt: rgba(58, 10, 21, 0.78) hoặc #350812
   - Vàng Champagne ánh kim: #E8C987 (sáng #F6E3B6, viền #E8C987/35)
   - Đỏ son lụa nhấn: #B81D3A (sợi tơ #C92A42)
   - Chữ chính trên nền tối: #FDF5EE (tương phản cao chuẩn WCAG AA)
   - Chữ phụ: #DFC4B8
   - Nút CTA / Mở thiệp: Nền #E8C987, chữ #2A060E
   - Dress Code mặc định: #680A22 (Đỏ Rượu Vang), #E8C987 (Vàng Champagne), #DFC4B8 (Hồng Nude Lụa)
   ============================================================ */

const WINE_DEEP = "#2A060E";
const WINE_DARK = "#1E040A";
const WINE_CARD = "#350812";
const WINE_CARD_TRANSLUCENT = "rgba(53, 8, 18, 0.85)";

const GOLD_CHAMPAGNE = "#E8C987";
const GOLD_LIGHT = "#F6E3B6";
const GOLD_BORDER = "rgba(232, 201, 135, 0.35)";

const SILK_CRIMSON = "#B81D3A";
const DESTINY_RED = "#C92A42";

const TEXT_LIGHT = "#FDF5EE";
const TEXT_MUTED = "#DFC4B8";

const TITLE_FONT = "var(--font-playfair), 'Cormorant Garamond', Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_IMPERIAL = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "16:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm tại tiền sảnh Tơ Hồng Lụa Thắm" },
  { time: "17:30", label: "Nghi thức Kết Nút Đồng Tâm & Trao lời hẹn ước trăm năm" },
  { time: "18:00", label: "Khai tiệc mừng se duyên & Nâng ly chúc phúc đôi uyên ương" },
  { time: "19:30", label: "Giai điệu lụa đỏ thính phòng & Gắn kết thân tình hai họ" },
  { time: "20:30", label: "Tiễn khách & Trao túi gấm cảm tạ tri ân" },
];

const DEFAULT_DRESS = [
  { name: "Đỏ Rượu Vang", color: "#680A22" },
  { name: "Vàng Champagne", color: "#E8C987" },
  { name: "Hồng Nude Lụa", color: "#DFC4B8" },
];

function cleanParentLine(line: string): string {
  return line.replace(/^(thân sinh|cha mẹ|song thân)\s*[:：]\s*/i, "").trim();
}

function splitParentNames(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/\s*&\s*|\r?\n/)
    .map((s) => cleanParentLine(s))
    .filter(Boolean);
}



/**
 * Hiệu ứng hạt bụi vàng óng ánh trên bìa lụa đỏ (pointer-events-none, tuyệt đối không dùng emoji hoa hồng)
 */
function SilkGoldDust({ count = 16 }: { count?: number }) {
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (i * 19 + 7) % 100,
      y: (i * 23 + 11) % 100,
      size: (i % 3) + 2,
      duration: 3.8 + (i % 4) * 0.8,
      delay: (i % 5) * 0.4,
    }));
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[6] overflow-hidden">
      {particles.map((p) => (
        <m.div
          key={p.id}
          className="absolute rounded-full bg-[#F6E3B6] shadow-[0_0_8px_#E8C987]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: ["0px", "-24px", "0px"],
            opacity: [0.2, 0.85, 0.2],
            scale: [0.8, 1.25, 0.8],
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

export default function ToHongLuaThamTemplate({
  data,
  mode = "preview",
  isOpened = false,
  onOpenedChange,
  contained = false,
  inviteSlug,
  weddingSlug,
  invitationMode = "personal",
  guestName,
  viewport = "phone",
}: WeddingTemplateProps) {
  const prefersReduced = useReducedMotion();

  // Trạng thái mở bìa rèm lụa 2 cánh
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
    playCoverSfx("silk");
    setTimeout(() => {
      setIsOpen(true);
      setCoverGone(true);
      setIsOpening(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 900);
  };

  // Gift modal state & Pouch interaction (700ms delay + SFX pouch)
  const {
    stage: pouchState,
    setStage: setPouchState,
    isOpening: isPouchOpening,
    isModalOpen: giftModalOpen,
    handleGiftClick: handlePouchClick,
    handleCloseModal: handleClosePouchModal,
  } = useGiftBoxInteraction({
    sfxType: "pouch",
  });

  // Lightbox modal state
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Album photos (gói Free tối đa 5 ảnh, không in dòng chữ quảng cáo)
  const albumPhotos = React.useMemo<TemplatePhotoItem[]>(() => {
    const list = data.photos?.gallery || [];
    return data.plan === "free" ? list.slice(0, 5) : list;
  }, [data.photos?.gallery, data.plan]);

  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);

  // Multi-event support
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent.startsAt || data.date || "2026-12-18";
  const dateParts = formatWeddingDateParts(eventDateStr);
  const lunarDateClean = targetEvent.lunarDate
    ? formatLunarDateClean(targetEvent.lunarDate)
    : "Ngày Hoàng Đạo";

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

  // Calendar month days calculation (hỗ trợ đa lễ)
  const calendarData = React.useMemo(() => {
    const d = new Date(eventDateStr);
    const year = d.getFullYear() || 2026;
    const month = d.getMonth() || 11;
    const currentDay = d.getDate() || 18;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const eventDays = new Set(
      visibleEvents
        .map((evt) => {
          const dt = new Date(evt.startsAt || eventDateStr);
          return dt.getFullYear() === year && dt.getMonth() === month ? dt.getDate() : null;
        })
        .filter((val): val is number => val !== null)
    );
    if (eventDays.size === 0) {
      eventDays.add(currentDay);
    }

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
      "calendar",
      "map",
      "dresscode",
      "album",
      "albumQr",
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

  const groomDisplayName = data.couple?.groomName || "Minh Hoàng";
  const brideDisplayName = data.couple?.brideName || "Mỹ Ngọc";
  const groomFullName = data.couple?.groomFullName || groomDisplayName;
  const brideFullName = data.couple?.brideFullName || brideDisplayName;

  const groomParentsList = splitParentNames(data.couple?.groomParents);
  const brideParentsList = splitParentNames(data.couple?.brideParents);

  const heroPhotoUrl = data.photos?.heroUrl;
  const groomPhotoUrl = data.photos?.groomUrl;
  const bridePhotoUrl = data.photos?.brideUrl;

  // Calendar links
  const calendarLinks = React.useMemo(() => {
    const title = encodeURIComponent(
      `Lễ Thành Hôn: ${groomDisplayName} & ${brideDisplayName}`
    );
    const details = encodeURIComponent(
      `Trân trọng kính mời Quý khách đến chung vui cùng hai gia đình chúng tôi tại ${targetEvent?.venueName || targetEvent?.venueAddress || "Hôn trường"
      }.`
    );
    const location = encodeURIComponent(
      targetEvent?.venueAddress || targetEvent?.venueName || ""
    );
    const d = new Date(eventDateStr);
    const startIso = d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(d.getTime() + 3 * 3600 * 1000);
    const endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
    return { google };
  }, [groomDisplayName, brideDisplayName, targetEvent, eventDateStr]);

  const mapDirectionUrl = targetEvent?.mapDirectionsUrl;

  return (
    <div
      className={cn(
        "relative w-full min-h-screen text-[#FDF5EE] antialiased select-none overflow-x-hidden",
        !coverGone
          ? contained
            ? "h-full overflow-hidden"
            : "h-screen-dvh max-h-full overflow-hidden"
          : ""
      )}
      style={{
        backgroundColor: WINE_DEEP,
        fontFamily: BODY_FONT,
      }}
    >
      {/* --------------------------------------------------------
          TRANG BÌA (COVER SECTION): RÈM LỤA 2 CÁNH & NÚT THẮT ĐỒNG TÂM
          Phân tầng Z-Index chuẩn Anti-Blur & Anti-Drift:
          z-0: Hai cánh rèm curtain_silk_left.webp khép kín màn hình
          z-[5]: Vệt chỉ vàng ánh sáng dọc khe rèm + SilkGoldDust
          z-20: Khối trung tâm sắc nét, Nút Thắt Đồng Tâm, tên 3 dòng
          -------------------------------------------------------- */}
      <AnimatePresence>
        {!coverGone && (
          <div
            key="envelope-cover"
            className="absolute inset-0 z-50 w-full max-w-full overflow-hidden flex items-center justify-center"
          >
            {/* z-0: Cánh rèm lụa TRÁI */}
            <m.div
              className="absolute left-0 top-0 bottom-0 w-1/2 z-0 overflow-hidden"
              initial={{ x: 0 }}
              animate={isOpening ? { x: "-100%" } : { x: 0 }}
              transition={{ duration: 0.9, ease: EASE_IMPERIAL }}
            >
              <img
                src="/templates/to-hong-lua-tham/curtain_silk_left.webp"
                alt="Rèm lụa thắm trái"
                className="w-full h-full object-cover object-right"
                loading="eager"
              />
              <div
                className="absolute inset-0 bg-black/15 pointer-events-none"
                aria-hidden="true"
              />
            </m.div>

            {/* z-0: Cánh rèm lụa PHẢI (lật ngang bằng scale-x-[-1]) */}
            <m.div
              className="absolute right-0 top-0 bottom-0 w-1/2 z-0 overflow-hidden"
              initial={{ x: 0 }}
              animate={isOpening ? { x: "100%" } : { x: 0 }}
              transition={{ duration: 0.9, ease: EASE_IMPERIAL }}
            >
              <img
                src="/templates/to-hong-lua-tham/curtain_silk_left.webp"
                alt="Rèm lụa thắm phải"
                className="w-full h-full object-cover object-right scale-x-[-1]"
                loading="eager"
              />
              <div
                className="absolute inset-0 bg-black/15 pointer-events-none"
                aria-hidden="true"
              />
            </m.div>

            {/* z-[5]: Chỉ vàng ánh sáng mảnh dọc khe rèm */}
            <div
              className="pointer-events-none absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-gradient-to-b from-transparent via-[#E8C987]/70 to-transparent z-[5]"
              aria-hidden="true"
            />

            {/* z-[6]: Bụi vàng lụa sa trôi nhẹ */}
            <SilkGoldDust count={16} />

            {/* z-20: Khối trung tâm sắc nét 100% nằm ngay trên khe rèm */}
            <m.div
              className="relative z-20 flex flex-col items-center text-center max-w-[328px] sm:max-w-[380px] mx-auto px-4 py-6"
              initial={{ opacity: 1, scale: 1 }}
              animate={
                isOpening
                  ? { opacity: 0, scale: 0.94, transition: { duration: 0.35, ease: "easeOut" } }
                  : { opacity: 1, scale: 1, transition: { duration: 0.5, ease: EASE_IMPERIAL } }
              }
            >
              {/* Lời dẫn tao nhã */}
              <p
                className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E8C987] font-semibold mb-1 drop-shadow-md"
                style={{ fontFamily: BODY_FONT }}
              >
                Trân Trọng Kính Mời
              </p>
              <p
                className="text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#DFC4B8] mb-3 drop-shadow-sm"
                style={{ fontFamily: BODY_FONT }}
              >
                Tơ Hồng Lụa Thắm
              </p>

              {/* Tên cặp đôi 3 dòng chuẩn với break-words */}
              <div
                className="text-center my-1 max-w-full px-2"
                style={{ fontFamily: TITLE_FONT }}
              >
                <div className="text-2xl sm:text-3xl text-[#FDF5EE] tracking-wide break-words drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] leading-tight">
                  {groomDisplayName}
                </div>
                <div className="text-lg text-[#E8C987] my-1 font-serif drop-shadow-md">&</div>
                <div className="text-2xl sm:text-3xl text-[#FDF5EE] tracking-wide break-words drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] leading-tight">
                  {brideDisplayName}
                </div>
              </div>

              {/* Nút Thắt Đồng Tâm silk_knot_clasp.webp (tâm điểm đung đưa nhẹ) */}
              <div
                className="relative my-3 cursor-pointer group"
                onClick={handleOpenCover}
              >
                <m.img
                  src="/templates/to-hong-lua-tham/silk_knot_clasp.webp"
                  alt="Nút Thắt Đồng Tâm"
                  className="w-24 sm:w-28 h-auto object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]"
                  animate={
                    !prefersReduced && !isOpening
                      ? {
                        scale: [1, 1.03, 1],
                        rotate: [0, 1.2, -1.2, 0],
                      }
                      : {}
                  }
                  transition={{
                    duration: 4.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              {/* Dành riêng cho khách mời (nếu có) */}
              {guestName && (
                <div className="my-2 px-3 py-1.5 rounded-full bg-[#350812]/90 border border-[#E8C987]/35 max-w-full backdrop-blur-sm shadow-md">
                  <p className="text-xs text-[#DFC4B8] truncate">
                    Kính mời: <span className="text-[#E8C987] font-semibold">{guestName}</span>
                  </p>
                </div>
              )}

              {/* Nút Mở Nút Thắt Tơ Hồng */}
              <button
                type="button"
                onClick={handleOpenCover}
                disabled={isOpening}
                className="mt-3 px-8 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all duration-300 transform active:scale-95 shadow-[0_4px_24px_rgba(232,201,135,0.35)] hover:shadow-[0_6px_30px_rgba(232,201,135,0.55)] hover:brightness-110 cursor-pointer"
                style={{
                  backgroundColor: GOLD_CHAMPAGNE,
                  color: WINE_DEEP,
                  border: "1px solid rgba(246, 227, 182, 0.8)",
                  fontFamily: BODY_FONT,
                }}
              >
                Mở Nút Thắt Tơ Hồng
              </button>
            </m.div>
          </div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------
          THÂN THIỆP CHÍNH (MAIN INVITATION CONTENT)
          Nền lụa đỏ rượu vang điện ảnh bg_crimson_editorial.webp
          -------------------------------------------------------- */}
      <div
        className={cn(
          "relative z-10 w-full min-h-screen",
          !isOpen && !isOpening ? "hidden" : "block"
        )}
      >
        {/* Nền Texture lụa thắm toàn thân */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <img
            src="/templates/to-hong-lua-tham/bg_crimson_editorial.webp"
            alt=""
            className="w-full h-full object-cover opacity-60"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2A060E]/90 via-[#2A060E]/80 to-[#1E040A]/95" />
        </div>

        {/* Khung nội dung tối đa 680px chuẩn typography */}
        <div className="relative z-10 max-w-[680px] mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-10 sm:gap-14">
          {/* ========================================================
              SECTION 1: HERO (KHUNG TRÒN VÒNG LỤA BAY 3D)
              ======================================================== */}
          <section className="relative text-center flex flex-col items-center">
            {/* Nhãn mở đầu & Sợi Tơ Hồng */}
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-gradient-to-r from-transparent to-[#E8C987]/70" />
              <span
                className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E8C987] font-semibold"
                style={{ fontFamily: BODY_FONT }}
              >
                Sợi Tơ Hồng Se Duyên
              </span>
              <span className="w-8 h-px bg-gradient-to-l from-transparent to-[#E8C987]/70" />
            </div>

            {/* Tên cặp đôi 3 dòng ở Hero (tuyệt đối không lặp ngày cưới) */}
            <div
              className="my-3 text-center px-4 max-w-full"
              style={{ fontFamily: TITLE_FONT }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl text-[#FDF5EE] tracking-wide break-words drop-shadow-sm leading-tight">
                {groomDisplayName}
              </h1>
              <div className="text-xl sm:text-2xl text-[#E8C987] my-1 font-serif">&</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl text-[#FDF5EE] tracking-wide break-words drop-shadow-sm leading-tight">
                {brideDisplayName}
              </h2>
            </div>

            <p
              className="text-xs sm:text-sm text-[#DFC4B8] max-w-md mx-auto mt-1 mb-6 px-4 leading-relaxed"
              style={{ fontFamily: BODY_FONT }}
            >
              Nguyệt lão se tơ nối mối nhân duyên · Nút thắt đồng tâm trọn đời son sắt
            </p>

            {/* Khung Tròn Dải Lụa Đỏ 3D ôm ảnh cưới */}
            <div className="relative w-full max-w-[320px] sm:max-w-[360px] aspect-[680/1000] mx-auto flex items-center justify-center">
              {/* Lõi bên trong: Ảnh cặp đôi bo tròn lồng tâm dải lụa bay */}
              <div className="absolute w-[58%] aspect-square rounded-full overflow-hidden border-2 border-[#E8C987]/60 shadow-[0_12px_36px_rgba(0,0,0,0.6)] top-[27%] left-[21%] bg-[#350812]">
                {heroPhotoUrl ? (
                  <img
                    src={heroPhotoUrl}
                    alt={`${groomDisplayName} & ${brideDisplayName}`}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#350812] to-[#1E040A]">
                    <img
                      src="/templates/to-hong-lua-tham/silk_knot_clasp.webp"
                      alt="Tơ Hồng"
                      className="w-14 h-auto mb-2 opacity-85 drop-shadow-md"
                    />
                    <p
                      className="text-[#E8C987] text-xs font-serif tracking-wider font-medium"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Tơ Hồng Lụa Thắm
                    </p>
                  </div>
                )}
              </div>

              {/* Lớp dải lụa bay 3D đè lên trên (pointer-events-none) */}
              <img
                src="/templates/to-hong-lua-tham/silk_ribbon_halo.webp"
                alt="Vòng Lụa Bay 3D"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full object-contain z-10 drop-shadow-[0_12px_36px_rgba(0,0,0,0.5)]"
              />
            </div>

            {/* Dải phân cách dưới Hero */}
            <img
              src="/templates/to-hong-lua-tham/silk_thread_knot.webp"
              alt=""
              aria-hidden="true"
              className="w-48 sm:w-56 h-auto object-contain mt-6 opacity-90"
            />
          </section>

          {/* ========================================================
              CONTAINER CHO CÁC SECTION CÓ THỂ ĐỔI THỨ TỰ (sectionOrder)
              ======================================================== */}
          <div className="flex flex-col gap-10 sm:gap-14">
            {/* ----------------------------------------------------
                SECTION: HAI NỬA TƠ HỒNG (family, couple: true)
                Bố cục sole bất đối xứng: Chú Rể (trái cao hơn), Cô Dâu (phải thấp hơn),
                nối nhau bằng đường cong SVG Sợi Tơ Hồng & silk_thread_knot.webp
                ---------------------------------------------------- */}
            {!hiddenSections.has("family") && (
              <section
                style={{ order: orderOf("family") }}
                className="relative rounded-3xl p-6 sm:p-8 bg-[#350812]/85 border border-[#E8C987]/35 shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div
                  className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#E8C987]/25"
                  aria-hidden="true"
                />

                <div className="relative z-10 text-center mb-8">
                  <span
                    className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E8C987] font-semibold"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Trân Trọng Báo Tin
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#FDF5EE] font-serif mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hai Nửa Tơ Hồng
                  </h3>
                </div>

                {/* Bố cục Sole Bất Đối Xứng Chú Rể & Cô Dâu */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 items-start">
                  {/* Đường cong Sợi Tơ Hồng kết nối ẩn hiện trên md */}
                  <div className="hidden md:block pointer-events-none absolute inset-x-12 top-28 h-24 z-0">
                    <svg className="w-full h-full" viewBox="0 0 400 80" fill="none">
                      <path
                        d="M 50 20 Q 200 80 350 30"
                        stroke="url(#threadGradient)"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      <defs>
                        <linearGradient id="threadGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#E8C987" stopOpacity="0.8" />
                          <stop offset="50%" stopColor="#C92A42" stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#E8C987" stopOpacity="0.8" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* CỘT NHÀ TRAI / CHÚ RỂ (Xếp cao hơn) */}
                  <div className="relative z-10 flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl bg-[#2A060E]/90 border border-[#E8C987]/30 shadow-lg">
                    {/* Ảnh bầu dục viền vàng champagne */}
                    <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-full p-1 border-2 border-[#E8C987] shadow-[0_4px_16px_rgba(232,201,135,0.25)] mb-4 bg-[#1E040A] overflow-hidden">
                      {groomPhotoUrl ? (
                        <img
                          src={groomPhotoUrl}
                          alt={groomDisplayName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center bg-[#350812] text-[#E8C987] font-serif text-2xl">
                          {groomDisplayName.charAt(0)}
                        </div>
                      )}
                    </div>

                    <span
                      className="text-[11px] tracking-[0.2em] uppercase text-[#E8C987] font-semibold mb-1"
                      style={{ fontFamily: BODY_FONT }}
                    >
                      {data.couple?.groomTitle || "Chú Rể"}
                    </span>
                    <h4
                      className="text-xl sm:text-2xl text-[#FDF5EE] font-serif mb-3"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {groomFullName}
                    </h4>

                    {/* Danh tính song thân tách 2 dòng sạch sẽ, không có & và không có "Thân sinh:" */}
                    {groomParentsList.length > 0 && (
                      <div className="w-full pt-3 border-t border-[#E8C987]/25 text-xs sm:text-sm text-[#DFC4B8] space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-[#E8C987] font-semibold mb-1">
                          Nhà Trai
                        </p>
                        {groomParentsList.map((pName, pIdx) => (
                          <p key={pIdx} className="font-light">
                            {pName}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CỘT NHÀ GÁI / CÔ DÂU (Xếp thấp hơn một nhịp trên desktop) */}
                  <div className="relative z-10 md:translate-y-10 flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl bg-[#2A060E]/90 border border-[#E8C987]/30 shadow-lg">
                    {/* Ảnh bầu dục viền vàng champagne */}
                    <div className="relative w-28 h-36 sm:w-32 sm:h-40 rounded-full p-1 border-2 border-[#E8C987] shadow-[0_4px_16px_rgba(232,201,135,0.25)] mb-4 bg-[#1E040A] overflow-hidden">
                      {bridePhotoUrl ? (
                        <img
                          src={bridePhotoUrl}
                          alt={brideDisplayName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center bg-[#350812] text-[#E8C987] font-serif text-2xl">
                          {brideDisplayName.charAt(0)}
                        </div>
                      )}
                    </div>

                    <span
                      className="text-[11px] tracking-[0.2em] uppercase text-[#E8C987] font-semibold mb-1"
                      style={{ fontFamily: BODY_FONT }}
                    >
                      {data.couple?.brideTitle || "Cô Dâu"}
                    </span>
                    <h4
                      className="text-xl sm:text-2xl text-[#FDF5EE] font-serif mb-3"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {brideFullName}
                    </h4>

                    {/* Danh tính song thân tách 2 dòng sạch sẽ */}
                    {brideParentsList.length > 0 && (
                      <div className="w-full pt-3 border-t border-[#E8C987]/25 text-xs sm:text-sm text-[#DFC4B8] space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-[#E8C987] font-semibold mb-1">
                          Nhà Gái
                        </p>
                        {brideParentsList.map((pName, pIdx) => (
                          <p key={pIdx} className="font-light">
                            {pName}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dải phân cách Nút Thắt Duyên ở chân phần gia đình */}
                <div className="mt-14 flex justify-center">
                  <img
                    src="/templates/to-hong-lua-tham/silk_thread_knot.webp"
                    alt=""
                    aria-hidden="true"
                    className="w-44 sm:w-52 h-auto object-contain opacity-85"
                  />
                </div>
              </section>
            )}

            {/* ----------------------------------------------------
                SECTION: LỊCH CƯỚI TẠP CHÍ & ĐẾM NGƯỢC NGANG (calendar, map)
                Kiểu Tờ Lịch Xé Khổ Lớn & Thanh Đếm Ngược Ngang Tối Giản
                ---------------------------------------------------- */}
            {!hiddenSections.has("calendar") && (
              <section
                style={{ order: orderOf("calendar") }}
                className="relative rounded-3xl p-6 sm:p-8 bg-[#350812]/85 border border-[#E8C987]/35 shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div
                  className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#E8C987]/25"
                  aria-hidden="true"
                />

                <div className="relative z-10 text-center mb-8">
                  <span
                    className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E8C987] font-semibold"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Ngày Chung Đôi
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#FDF5EE] font-serif mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hôn Lễ Trân Quý
                  </h3>
                </div>

                {/* TỜ LỊCH XÉ TẠP CHÍ KHỔ LỚN (hỗ trợ đa lễ) */}
                <div
                  className={cn(
                    "relative z-10 w-full grid gap-6 mb-8",
                    visibleEvents.length === 1 ? "max-w-lg mx-auto" : "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
                  )}
                >
                  {visibleEvents.map((evt, idx) => {
                    const evtDateParts = formatWeddingDateParts(evt.startsAt || eventDateStr);
                    const evtLunar = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : lunarDateClean;
                    const directionsUrl = getEventDirectionsUrl(evt);

                    return (
                      <div
                        key={evt.id || `evt-${idx}`}
                        className="p-6 rounded-2xl bg-[#2A060E]/95 border border-[#E8C987]/40 shadow-inner flex flex-col justify-between"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                          {/* Cột Trái: Số ngày cưới siêu lớn */}
                          <div className="flex items-center justify-center sm:justify-start gap-4 border-b sm:border-b-0 sm:border-r border-[#E8C987]/30 pb-4 sm:pb-0 sm:pr-4">
                            <span
                              className="text-6xl sm:text-7xl font-bold font-serif text-[#E8C987] leading-none"
                              style={{ fontFamily: TITLE_FONT }}
                            >
                              {evtDateParts.day}
                            </span>
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-semibold uppercase tracking-wider text-[#FDF5EE]">
                                {evtDateParts.weekday}
                              </span>
                              <span className="text-xs text-[#DFC4B8] uppercase tracking-wider">
                                Tháng {evtDateParts.month} · {evtDateParts.year}
                              </span>
                              {evtLunar && (
                                <span className="text-[11px] text-[#E8C987] italic mt-1">
                                  {evtLunar}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Cột Phải: Thời gian & Địa điểm tiệc */}
                          <div className="flex flex-col text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-[#E8C987] font-semibold uppercase tracking-wider mb-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                {evtDateParts.time || "17:30"} · {evt.title || (idx === 0 ? "Tiệc Cưới Thân Mật" : "Lễ Thành Hôn")}
                              </span>
                            </div>
                            <p
                              className="text-base sm:text-lg text-[#FDF5EE] font-serif font-medium"
                              style={{ fontFamily: TITLE_FONT }}
                            >
                              {evt.venueName || "Trung Tâm Hội Nghị Tiệc Cưới"}
                            </p>
                            <p className="text-xs text-[#DFC4B8] mt-1 leading-relaxed">
                              {evt.venueAddress || "Địa chỉ hôn trường đang cập nhật"}
                            </p>

                            {/* Nút chỉ đường & Thêm vào lịch */}
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                              {!hiddenSections.has("map") && (
                                <a
                                  href={directionsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#E8C987] text-[#2A060E] text-[11px] font-semibold tracking-wider uppercase transition-transform active:scale-95 hover:brightness-110 shadow-sm"
                                  style={{ fontFamily: BODY_FONT }}
                                >
                                  <MapPin className="w-3 h-3" />
                                  <span>Chỉ Đường</span>
                                </a>
                              )}
                              <a
                                href={calendarLinks.google}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-[#E8C987]/60 text-[#E8C987] text-[11px] font-semibold tracking-wider uppercase hover:bg-[#E8C987]/15 transition-colors"
                                style={{ fontFamily: BODY_FONT }}
                              >
                                <Calendar className="w-3 h-3" />
                                <span>Lịch</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* THANH ĐẾM NGƯỢC NGANG TỐI GIẢN */}
                {mounted && (
                  <div className="relative z-10 max-w-md mx-auto mb-8">
                    <p
                      className="text-center text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#E8C987] font-semibold mb-3"
                      style={{ fontFamily: BODY_FONT }}
                    >
                      Đếm Ngược Từng Khoảnh Khắc
                    </p>
                    <div className="grid grid-cols-4 divide-x divide-[#E8C987]/30 py-3 rounded-2xl bg-[#2A060E]/80 border border-[#E8C987]/25 text-center">
                      {[
                        { label: "Ngày", val: timeLeft.days },
                        { label: "Giờ", val: timeLeft.hours },
                        { label: "Phút", val: timeLeft.minutes },
                        { label: "Giây", val: timeLeft.seconds },
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center px-1">
                          <span
                            className="text-2xl sm:text-3xl text-[#E8C987] font-bold font-serif leading-none"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {String(item.val).padStart(2, "0")}
                          </span>
                          <span className="text-[10px] sm:text-xs text-[#DFC4B8] uppercase tracking-wider mt-1.5 font-medium">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BẢNG LỊCH THÁNG TỐI GIẢN (Lần 2 & là lần cuối cùng xuất hiện ngày cưới) */}
                <div className="relative z-10 max-w-sm mx-auto p-4 sm:p-5 rounded-2xl bg-[#2A060E]/80 border border-[#E8C987]/30">
                  <p
                    className="text-center text-xs tracking-widest uppercase font-semibold text-[#E8C987] mb-3"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {calendarData.monthYear}
                  </p>
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] sm:text-xs">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((wDay, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "py-1 font-semibold",
                          idx === 0 ? "text-[#E8C987]" : "text-[#DFC4B8]"
                        )}
                      >
                        {wDay}
                      </div>
                    ))}
                    {calendarData.days.map((day, idx) => {
                      const isWeddingDay = day !== null && calendarData.eventDays.has(day);
                      return (
                        <div
                          key={idx}
                          className="h-8 flex items-center justify-center relative"
                        >
                          {day !== null && (
                            <span
                              className={cn(
                                "w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                                isWeddingDay
                                  ? "bg-[#E8C987] text-[#2A060E] font-bold shadow-[0_0_12px_rgba(232,201,135,0.6)]"
                                  : "text-[#FDF5EE]"
                              )}
                            >
                              {day}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ----------------------------------------------------
                SECTION: SẮC MÀU HÀI HÒA (dresscode)
                Chỉ hiển thị các chấm/viên màu tròn viền vàng champagne
                TUYỆT ĐỐI KHÔNG HIỂN THỊ MÃ MÀU #XXXXXX
                ---------------------------------------------------- */}
            {!hiddenSections.has("dresscode") && (
              <section
                style={{ order: orderOf("dresscode") }}
                className="relative rounded-3xl p-6 sm:p-8 bg-[#350812]/85 border border-[#E8C987]/35 shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden text-center"
              >
                <div
                  className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#E8C987]/25"
                  aria-hidden="true"
                />

                <div className="relative z-10 max-w-md mx-auto">
                  <span
                    className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E8C987] font-semibold"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Ý Niệm Hòa Sắc
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#FDF5EE] font-serif mt-1 mb-2"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Sắc Màu Hài Hòa
                  </h3>
                  <p className="text-xs sm:text-sm text-[#DFC4B8] italic leading-relaxed mb-6">
                    Gửi gắm vài sắc màu thanh nhã để ngày chung đôi thêm phần trọn vẹn
                  </p>

                  {/* Các ô màu tròn viền vàng champagne - KHÔNG CÓ MÃ MÀU */}
                  <div className="flex items-center justify-center gap-6 sm:gap-8">
                    {DEFAULT_DRESS.map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-2">
                        <div
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#E8C987] shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-transform hover:scale-110"
                          style={{ backgroundColor: item.color }}
                          title={item.name}
                        />
                        <span className="text-xs text-[#DFC4B8] font-medium">
                          {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ----------------------------------------------------
                SECTION: THƯỚC PHIM KỶ NIỆM (album, albumQr)
                Bố cục Tạp chí Bất Đối Xứng (Asymmetric Masonry / Filmstrip)
                Không in dòng quảng cáo gói Free/Pro lên mặt thiệp
                ---------------------------------------------------- */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <section
                style={{ order: orderOf("album") }}
                className="relative rounded-3xl p-6 sm:p-8 bg-[#350812]/85 border border-[#E8C987]/35 shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div
                  className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#E8C987]/25"
                  aria-hidden="true"
                />

                <div className="relative z-10 text-center mb-6">
                  <span
                    className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E8C987] font-semibold"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Khoảnh Khắc Lưu Giữ
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#FDF5EE] font-serif mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Thước Phim Kỷ Niệm
                  </h3>
                </div>

                {/* BỐ CỤC TẠP CHÍ BẤT ĐỐI XỨNG (1 ẢNH LỚN + 2 ẢNH NHỎ) */}
                <div className="relative z-10 max-w-xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {/* Ảnh lớn chính (chiếm 2 cột trên sm) */}
                    <div
                      className="sm:col-span-2 aspect-[3/4] rounded-2xl overflow-hidden border border-[#E8C987]/40 shadow-lg cursor-pointer group bg-[#1E040A] relative"
                      onClick={() => setLightboxIndex(0)}
                    >
                      <img
                        src={albumPhotos[0]?.url}
                        alt={albumPhotos[0]?.alt || "Ảnh cưới chính"}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                        <span className="text-xs text-[#FDF5EE] bg-black/50 px-3 py-1 rounded-full border border-white/20">
                          Chạm để phóng to
                        </span>
                      </div>
                    </div>

                    {/* 2 ảnh nhỏ xếp dọc bên phải */}
                    <div className="grid grid-cols-2 sm:grid-cols-1 gap-3">
                      {albumPhotos.slice(1, 3).map((photo, pIdx) => (
                        <div
                          key={pIdx}
                          className="aspect-[3/4] sm:aspect-auto sm:h-[calc(50%-6px)] rounded-xl overflow-hidden border border-[#E8C987]/30 shadow-md cursor-pointer group bg-[#1E040A] relative"
                          onClick={() => setLightboxIndex(pIdx + 1)}
                        >
                          <img
                            src={photo.url}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DẢI FILMSTRIP CUỘN NGANG CHO CÁC ẢNH CÒN LẠI */}
                  {albumPhotos.length > 3 && (
                    <div className="flex items-center gap-3 overflow-x-auto py-2 px-1">
                      {albumPhotos.slice(3).map((photo, fIdx) => (
                        <button
                          key={fIdx}
                          type="button"
                          onClick={() => setLightboxIndex(fIdx + 3)}
                          className="w-24 h-32 sm:w-28 sm:h-36 rounded-xl overflow-hidden border border-[#E8C987]/35 shadow-md shrink-0 cursor-pointer transition-transform hover:scale-105"
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
                </div>

                {/* QR Album dành cho khách tải ảnh lên (chỉ hiện khi có url & không phải gói Free) */}
                {data.plan !== "free" && !hiddenSections.has("albumQr") && (
                  <div className="mt-8 pt-6 border-t border-[#E8C987]/30 flex flex-col items-center">
                    <GuestAlbumQr
                      slug={inviteSlug || weddingSlug}
                      accentColor="#E8C987"
                      textColor="#FDF5EE"
                      mutedColor="#DFC4B8"
                    />
                  </div>
                )}
              </section>
            )}

            {/* ----------------------------------------------------
                SECTION: TÚI GẤM CHÚC PHÚC (gift)
                3 trạng thái túi gấm đỏ rút dây căn đáy bằng nhau tuyệt đối:
                pouch_normal -> pouch_glow -> pouch_open
                Mở GiftModal qua createPortal
                ---------------------------------------------------- */}
            {!hiddenSections.has("gift") && (
              <section
                style={{ order: orderOf("gift") }}
                className="relative rounded-3xl p-6 sm:p-8 bg-[#350812]/85 border border-[#E8C987]/35 shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden text-center"
              >
                <div
                  className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#E8C987]/25"
                  aria-hidden="true"
                />

                <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
                  <span
                    className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E8C987] font-semibold"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Gửi Gắm Yêu Thương
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#FDF5EE] font-serif mt-1 mb-2"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Túi Gấm Chúc Phúc
                  </h3>
                  <p className="text-xs sm:text-sm text-[#DFC4B8] leading-relaxed mb-4">
                    Sự hiện diện của Quý khách là món quà trân quý nhất trong ngày vui của hai gia đình. Nếu ở xa không tiện ghé chung vui, Quý khách có thể gửi lời chúc qua chiếc túi gấm nhỏ bên dưới.
                  </p>

                  {/* Preload ảnh pouch_open chống giật/nháy */}
                  <img
                    src="/templates/to-hong-lua-tham/pouch_open.webp"
                    className="hidden"
                    aria-hidden="true"
                    alt=""
                  />

                  {/* Túi gấm đỏ 3 trạng thái tương tác */}
                  <div
                    className={`relative w-48 sm:w-56 aspect-square my-2 cursor-pointer group transition-all duration-300 ${isPouchOpening ? "pointer-events-none scale-105" : "active:scale-95 hover:scale-102"
                      }`}
                    onClick={handlePouchClick}
                    onMouseEnter={() => !isPouchOpening && setPouchState("glow")}
                    onMouseLeave={() => !isPouchOpening && pouchState !== "open" && setPouchState("normal")}
                  >
                    <img
                      src={
                        pouchState === "open"
                          ? "/templates/to-hong-lua-tham/pouch_open.webp"
                          : pouchState === "glow"
                            ? "/templates/to-hong-lua-tham/pouch_glow.webp"
                            : "/templates/to-hong-lua-tham/pouch_normal.webp"
                      }
                      alt="Túi Gấm Chúc Phúc"
                      className="w-full h-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.6)] transition-all duration-300"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isPouchOpening}
                    onClick={handlePouchClick}
                    className="mt-3 px-8 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 active:scale-95 shadow-[0_4px_20px_rgba(232,201,135,0.35)] hover:brightness-110 cursor-pointer disabled:opacity-80"
                    style={{
                      backgroundColor: GOLD_CHAMPAGNE,
                      color: WINE_DEEP,
                      border: "1px solid rgba(246, 227, 182, 0.8)",
                      fontFamily: BODY_FONT,
                    }}
                  >
                    Mừng Cưới
                  </button>
                </div>
              </section>
            )}

            {/* ----------------------------------------------------
                SECTION: XÁC NHẬN THAM DỰ & LỜI CHÚC (rsvp)
                Đồng bộ 100% theme Tơ Hồng Lụa Thắm
                [color-scheme:dark] và optionBg/Color tường minh
                ---------------------------------------------------- */}
            {!hiddenSections.has("rsvp") && (
              <section
                style={{ order: orderOf("rsvp") }}
                className="relative z-10 [color-scheme:dark]"
              >
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="velvet"
                  customTheme={{
                    isDark: true,
                    wrap: "bg-[#350812]/90 border-[#E8C987]/35 text-[#FDF5EE] shadow-[0_16px_40px_rgba(0,0,0,0.5)] rounded-3xl",
                    card: "bg-[#24050C]/90 border border-[#E8C987]/30 text-[#FDF5EE]",
                    eyebrow: "text-[#E8C987] tracking-[0.25em] uppercase font-semibold text-[11px]",
                    heading: "text-[#FDF5EE] font-serif text-2xl sm:text-3xl",
                    subtext: "text-[#DFC4B8] text-xs sm:text-sm",
                    input: "bg-[#1E040A] border-[#E8C987]/35 text-[#FDF5EE] placeholder:text-[#DFC4B8]/60 focus:border-[#E8C987] focus:ring-1 focus:ring-[#E8C987]",
                    primaryBtn: "bg-[#E8C987] hover:bg-[#F6E3B6] text-[#2A060E] font-semibold shadow-md",
                    outlineBtn: "border-[#E8C987] text-[#E8C987] hover:bg-[#E8C987]/15",
                    alert: "border-[#E8C987]/35 bg-[#24050C] text-[#FDF5EE]",
                    badge: "border-[#E8C987]/35 bg-[#24050C] text-[#E8C987]",
                    optionBg: "#1E040A",
                    optionColor: "#FDF5EE",
                  }}
                  contained={contained}
                  inviteSlug={inviteSlug}
                  weddingSlug={weddingSlug}
                  invitationMode={invitationMode}
                  guestName={guestName}
                />
              </section>
            )}
          </div>

          {/* ========================================================
              FOOTER (BÊN NGOÀI CONTAINER CÓ ORDER)
              Lời cảm ơn ấm áp, không lặp lại ngày cưới
              ======================================================== */}
          <footer className="relative z-10 text-center pt-8 sm:pt-12 pb-16 border-t border-[#E8C987]/30">
            <img
              src="/templates/to-hong-lua-tham/silk_knot_clasp.webp"
              alt="Tơ Hồng Lụa Thắm"
              className="w-10 sm:w-12 h-auto mx-auto mb-4 opacity-85"
            />
            <p
              className="text-base sm:text-lg text-[#FDF5EE] font-serif font-medium mb-1"
              style={{ fontFamily: TITLE_FONT }}
            >
              {groomDisplayName} & {brideDisplayName}
            </p>
            <p className="text-xs sm:text-sm text-[#DFC4B8] max-w-md mx-auto leading-relaxed px-4">
              Chân thành cảm ơn tình cảm và sự hiện diện quý báu của Quý khách trong ngày vui của chúng tôi.
            </p>
          </footer>
        </div>

        {/* ========================================================
            MODALS & OVERLAYS (PORTALS)
            ======================================================== */}
        {/* Modal Túi Gấm Mừng Cưới */}
        <GiftModal
          open={giftModalOpen}
          onClose={handleClosePouchModal}
          gift={data.gift}
          plan={data.plan || "free"}
          coupleName={`${groomDisplayName} & ${brideDisplayName}`}
          guestName={guestName}
          tone="velvet"
        />

        {/* Modal Lightbox Phóng To Ảnh Cưới */}
        <TemplateLightboxModal
          photos={albumPhotos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={(idx) => setLightboxIndex(idx)}
        />

        {/* Nút Nhạc Nền Nổi (LiveMusicFloatingButton) */}
        <LiveMusicFloatingButton
          src={data.music?.src || "/media/priority1.mp3"}
          title={data.music?.title || "Dải Lụa Đỏ & Nút Thắt Đồng Tâm"}
          visible={isOpen || coverGone}
          tone="velvet"
        />
      </div>
    </div>
  );
}
