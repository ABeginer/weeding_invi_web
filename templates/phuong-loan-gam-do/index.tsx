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
   BẢNG MÀU CHÍNH THỨC: PHƯỢNG LOAN GẤM ĐỎ (phuong-loan-gam-do)
   - Nền gấm đỏ son hoàng gia: #560B12 → #6B1019 (sâu #3E070D)
   - Bề mặt thẻ gấm nổi: rgba(74, 11, 18, 0.88) viền vàng 24K rgba(229, 193, 115, 0.42)
   - Vàng 24K hoàng kim: #E5C173 (sáng #F6DF9F, trầm #B88E3F)
   - Chữ chính trên nền gấm đỏ: #FBF5E8 (kem ngà sáng, tương phản chuẩn WCAG AA)
   - Chữ phụ / nhãn: #E8D4B8
   - Nút CTA chính: Nền gradient #E5C173 → #F4DC9A, chữ đỏ trầm #4A0B12
   - Dress Code mặc định: #680E0E (Đỏ son gấm), #E5C173 (Vàng 24K), #FBF5E8 (Kem ngà)
   ============================================================ */

const CRIMSON_BG = "#560B12";
const CRIMSON_DEEP = "#3E070D";
const CRIMSON_CARD = "rgba(74, 11, 18, 0.90)";
const CRIMSON_INNER = "rgba(54, 7, 12, 0.95)";

const GOLD_24K = "#E5C173";
const GOLD_LIGHT = "#F6DF9F";
const GOLD_DEEP = "#B88E3F";
const GOLD_BORDER = "rgba(229, 193, 115, 0.45)";

const TEXT_MAIN = "#FBF5E8";
const TEXT_MUTED = "#E8D4B8";
const TEXT_DARK_ON_GOLD = "#4A0B12";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_IMPERIAL = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "16:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm tại tiền sảnh Phượng Loan Gấm Đỏ" },
  { time: "17:30", label: "Nghi thức Thành Hôn Long Phụng Hòa Minh & Trao lời hẹn ước trăm năm" },
  { time: "18:00", label: "Khai tiệc mừng giao bôi & Nâng ly chúc phúc đôi uyên ương" },
  { time: "19:30", label: "Giai điệu cung đình hoàng gia & Gắn kết thân tình hai họ" },
  { time: "20:30", label: "Tiễn khách & Trao quà cảm tạ tri ân" },
];

const DEFAULT_DRESS = [
  { name: "Đỏ Son Gấm", color: "#680E0E" },
  { name: "Vàng 24K", color: "#E5C173" },
  { name: "Kem Ngà Hoàng Gia", color: "#FBF5E8" },
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
 * Hiệu ứng bụi vàng hoàng kim sa trôi nhẹ trên bìa thiệp (pointer-events-none, tuyệt đối không dùng emoji)
 */
function ImperialGoldDust({ count = 16 }: { count?: number }) {
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: (i * 19 + 7) % 100,
      y: (i * 23 + 11) % 100,
      size: (i % 3) + 2,
      duration: 3.5 + (i % 4) * 0.8,
      delay: (i % 5) * 0.4,
    }));
  }, [count]);

  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden">
      {particles.map((p) => (
        <m.div
          key={p.id}
          className="absolute rounded-full bg-[#F6DF9F] shadow-[0_0_8px_#E5C173]"
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

export default function PhuongLoanGamDoTemplate({
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

  // Trạng thái mở bìa thiệp
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
    } catch {}
    setIsOpening(true);
    playOpenCardSound();
    setTimeout(() => {
      setIsOpen(true);
      setCoverGone(true);
      setIsOpening(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 650);
  };

  // Gift modal state & Parcel hover
  const [giftModalOpen, setGiftModalOpen] = React.useState(false);
  const [boxState, setBoxState] = React.useState<"normal" | "glow" | "open">("normal");

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
        .filter((dayNum): dayNum is number => dayNum !== null)
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

  const groomDisplayName = data.couple?.groomName || "Trung Hiếu";
  const brideDisplayName = data.couple?.brideName || "Minh Nguyệt";
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
        "relative w-full min-h-screen text-[#FBF5E8] antialiased select-none overflow-x-hidden",
        !coverGone
          ? contained
            ? "h-full overflow-hidden"
            : "h-screen-dvh max-h-full overflow-hidden"
          : ""
      )}
      style={{
        backgroundColor: CRIMSON_DEEP,
        fontFamily: BODY_FONT,
      }}
    >
      {/* --------------------------------------------------------
          TRANG BÌA (COVER SECTION)
          Phân tầng Z-Index chuẩn Anti-Blur & Anti-Drift:
          z-0: Background gấm đỏ son (mobile / desktop)
          z-[5]: Bụi vàng hoàng kim sa trôi nhẹ
          z-10: Thẻ gấm đỏ viền vàng 24K + gold_cloud_corner ở 4 góc
          z-20: Ấn triện Song Hỷ, tên cặp đôi 3 dòng, dải phân cách, nút Mở Thiệp
          -------------------------------------------------------- */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            key="envelope-cover"
            className="absolute inset-0 z-50 w-full max-w-full overflow-hidden flex items-center justify-center px-4 py-4 sm:px-6"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 0.96,
              transition: { duration: 0.65, ease: EASE_IMPERIAL },
            }}
          >
            {/* z-0: Ảnh nền gấm lụa đỏ son sắc nét 100% */}
            <div className="absolute inset-0 z-0">
              <picture>
                <source
                  media="(min-width: 768px)"
                  srcSet="/templates/phuong-loan-gam-do/bg_desktop.webp"
                />
                <img
                  src="/templates/phuong-loan-gam-do/bg_mobile.webp"
                  alt="Nền gấm đỏ Phượng Loan Gấm Đỏ"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </picture>
              <div
                className="absolute inset-0 bg-[#3E070D]/40 pointer-events-none"
                aria-hidden="true"
              />
            </div>

            {/* z-[5]: Bụi vàng hoàng kim sa trôi chậm */}
            <ImperialGoldDust count={16} />

            {/* Màn gấm đỏ tách cánh khi bấm Mở Thiệp (z-[5] pointer-events-none) */}
            {isOpening && (
              <div className="pointer-events-none absolute inset-0 z-[5] flex overflow-hidden">
                <m.div
                  className="w-1/2 h-full bg-[#560B12] shadow-2xl"
                  initial={{ x: 0 }}
                  animate={{ x: "-100%" }}
                  transition={{ duration: 0.65, ease: EASE_IMPERIAL }}
                />
                <m.div
                  className="w-1/2 h-full bg-[#560B12] shadow-2xl"
                  initial={{ x: 0 }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 0.65, ease: EASE_IMPERIAL }}
                />
              </div>
            )}

            {/* Thẻ Gấm Đỏ Hoàng Gia Trung Tâm (z-20) */}
            <m.div
              className="relative w-full max-w-[328px] sm:max-w-[380px] mx-auto my-auto flex flex-col items-center text-center rounded-3xl p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.85)] border border-[#E5C173]/50 overflow-hidden z-20"
              style={{ backgroundColor: CRIMSON_CARD }}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={
                isOpening
                  ? {
                    scale: 1.03,
                    opacity: 0,
                    y: -25,
                    transition: { duration: 0.65, ease: EASE_IMPERIAL },
                  }
                  : {
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: EASE_IMPERIAL },
                  }
              }
            >
              {/* Viền chỉ vàng cổ lồng bên trong */}
              <div
                className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#E5C173]/35"
                aria-hidden="true"
              />

              {/* 4 Góc Mây Vàng Như Ý gold_cloud_corner.webp */}
              <img
                src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-2.5 left-2.5 w-10 sm:w-11 object-contain opacity-85 z-10"
              />
              <img
                src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-2.5 right-2.5 w-10 sm:w-11 object-contain opacity-85 -scale-x-100 z-10"
              />
              <img
                src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2.5 left-2.5 w-10 sm:w-11 object-contain opacity-85 -scale-y-100 z-10"
              />
              <img
                src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2.5 right-2.5 w-10 sm:w-11 object-contain opacity-85 -scale-100 z-10"
              />

              {/* Ấn Triện Bát Giác Song Hỷ Hoàng Kim */}
              <div className="relative z-20 mt-1 mb-3">
                <img
                  src="/templates/phuong-loan-gam-do/song_hy_medallion.webp"
                  alt="Kim Ấn Song Hỷ"
                  className="w-14 sm:w-16 h-auto object-contain drop-shadow-[0_4px_12px_rgba(229,193,115,0.4)]"
                />
              </div>

              {/* Lời dẫn tao nhã */}
              <p
                className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E5C173] font-semibold mb-1"
                style={{ fontFamily: BODY_FONT }}
              >
                Trân Trọng Kính Mời
              </p>
              <p
                className="text-[10px] sm:text-[11px] tracking-[0.15em] uppercase text-[#E8D4B8] mb-3"
                style={{ fontFamily: BODY_FONT }}
              >
                Long Phụng Hòa Minh
              </p>

              {/* Tên cặp đôi 3 dòng chuẩn với break-words */}
              <div
                className="text-center my-2 max-w-full px-2"
                style={{ fontFamily: TITLE_FONT }}
              >
                <div className="text-2xl sm:text-3xl text-[#FBF5E8] tracking-wide break-words drop-shadow-sm leading-tight">
                  {groomDisplayName}
                </div>
                <div className="text-lg text-[#E5C173] my-1 font-serif">&</div>
                <div className="text-2xl sm:text-3xl text-[#FBF5E8] tracking-wide break-words drop-shadow-sm leading-tight">
                  {brideDisplayName}
                </div>
              </div>

              {/* Dải phân cách mây ngọc ruby */}
              <img
                src="/templates/phuong-loan-gam-do/divider_cloud_ruby.webp"
                alt=""
                aria-hidden="true"
                className="w-44 sm:w-52 h-auto object-contain my-3 opacity-90"
              />

              {/* Dành riêng cho khách mời (nếu có) */}
              {guestName && (
                <div className="my-2 px-3 py-1.5 rounded-full bg-[#36070C]/80 border border-[#E5C173]/30 max-w-full">
                  <p className="text-xs text-[#E8D4B8] truncate">
                    Kính mời: <span className="text-[#FBF5E8] font-medium">{guestName}</span>
                  </p>
                </div>
              )}

              {/* Nút Mở Thiệp mạ vàng 24K */}
              <button
                type="button"
                onClick={handleOpenCover}
                disabled={isOpening}
                className="mt-4 px-8 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-widest uppercase transition-all duration-300 transform active:scale-95 shadow-[0_4px_20px_rgba(229,193,115,0.45)] hover:shadow-[0_6px_25px_rgba(229,193,115,0.65)] hover:brightness-105 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #F6DF9F 0%, #E5C173 50%, #B88E3F 100%)",
                  color: TEXT_DARK_ON_GOLD,
                  fontFamily: BODY_FONT,
                }}
              >
                Mở Thiệp
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------
          THÂN THIỆP CHÍNH (MAIN INVITATION CONTENT)
          Ẩn hoàn toàn cho đến khi mở thiệp để chống cuộn lệch
          -------------------------------------------------------- */}
      <div
        className={cn(
          "relative z-10 w-full min-h-screen",
          !isOpen && !isOpening ? "hidden" : "block"
        )}
      >
        {/* Nền gấm cố định xuyên suốt ruột thiệp */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <picture>
            <source
              media="(min-width: 768px)"
              srcSet="/templates/phuong-loan-gam-do/bg_desktop.webp"
            />
            <img
              src="/templates/phuong-loan-gam-do/bg_mobile.webp"
              alt=""
              className="w-full h-full object-cover"
            />
          </picture>
          <div
            className="absolute inset-0 bg-[#3E070D]/65 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Bụi vàng kim sa nhẹ nhàng ở background */}
        <ImperialGoldDust count={12} />

        {/* Khung nội dung tối đa 680px chuẩn typography */}
        <div className="relative z-10 max-w-[680px] mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col gap-10 sm:gap-14">
          {/* ========================================================
              SECTION 1: HERO (KHUNG VÒM LONG PHỤNG HOÀNG KIM)
              ======================================================== */}
          <section className="relative text-center flex flex-col items-center">
            {/* Nhãn mở đầu & Song Hỷ */}
            <div className="mb-3 flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-gradient-to-r from-transparent to-[#E5C173]/70" />
              <span
                className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E5C173] font-semibold"
                style={{ fontFamily: BODY_FONT }}
              >
                Lễ Thành Hôn
              </span>
              <span className="w-8 h-px bg-gradient-to-l from-transparent to-[#E5C173]/70" />
            </div>

            {/* Tên cặp đôi 3 dòng ở Hero (tuyệt đối không lặp ngày cưới) */}
            <div
              className="my-3 text-center px-4 max-w-full"
              style={{ fontFamily: TITLE_FONT }}
            >
              <h1 className="text-3xl sm:text-4xl md:text-5xl text-[#FBF5E8] tracking-wide break-words drop-shadow-md leading-tight">
                {groomDisplayName}
              </h1>
              <div className="text-xl sm:text-2xl text-[#E5C173] my-1 font-serif">&</div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl text-[#FBF5E8] tracking-wide break-words drop-shadow-md leading-tight">
                {brideDisplayName}
              </h2>
            </div>

            <p
              className="text-xs sm:text-sm text-[#E8D4B8] max-w-md mx-auto mt-1 mb-6 px-4 leading-relaxed"
              style={{ fontFamily: BODY_FONT }}
            >
              Trăm năm kết tóc se tơ · Long Phụng Hòa Minh duyên cầm sắt trọn đời
            </p>

            {/* Khung Vòm Long Phụng ôm ảnh cưới */}
            <div className="relative w-full max-w-[320px] sm:max-w-[360px] aspect-[680/917] mx-auto flex items-center justify-center">
              {/* Lõi bên trong: Ảnh cặp đôi bo vòm khớp lòng khung vòm */}
              <div className="absolute inset-x-[10%] top-[11.5%] bottom-[2%] rounded-t-full overflow-hidden bg-[#3E070D]">
                {heroPhotoUrl ? (
                  <img
                    src={heroPhotoUrl}
                    alt={`${groomDisplayName} & ${brideDisplayName}`}
                    className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#4A0B12] to-[#2E0509]">
                    <img
                      src="/templates/phuong-loan-gam-do/song_hy_medallion.webp"
                      alt="Song Hỷ"
                      className="w-20 h-auto mb-3 opacity-90 drop-shadow-md"
                    />
                    <p
                      className="text-[#E5C173] text-sm font-serif tracking-wider"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Long Phụng Hòa Minh
                    </p>
                  </div>
                )}
              </div>

              {/* Lớp khung vòm Phù Điêu Long Phụng 24K đè lên trên (pointer-events-none) */}
              <img
                src="/templates/phuong-loan-gam-do/dragon_phoenix_arch.webp"
                alt="Khung vòm Long Phụng 24K"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full object-contain z-10 drop-shadow-[0_12px_36px_rgba(0,0,0,0.8)]"
              />
            </div>

            {/* Dải phân cách mây ruby dưới Hero */}
            <img
              src="/templates/phuong-loan-gam-do/divider_cloud_ruby.webp"
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
                SECTION: GIA ĐÌNH & CHÂN DUNG CẶP ĐÔI (family, couple: true)
                ---------------------------------------------------- */}
            {!hiddenSections.has("family") && (
              <section
                style={{ order: orderOf("family") }}
                className="relative rounded-3xl p-6 sm:p-8 border border-[#E5C173]/45 shadow-[0_20px_50px_rgba(0,0,0,0.65)] overflow-hidden"
                style-bg={CRIMSON_CARD}
              >
                <div
                  className="absolute inset-0 pointer-events-none rounded-3xl"
                  style={{ backgroundColor: CRIMSON_CARD }}
                />
                <div
                  className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#E5C173]/30"
                  aria-hidden="true"
                />

                {/* Góc mây trang trí */}
                <img
                  src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 left-2.5 w-9 sm:w-10 object-contain opacity-75"
                />
                <img
                  src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 right-2.5 w-9 sm:w-10 object-contain opacity-75 -scale-x-100"
                />

                <div className="relative z-10 text-center mb-6">
                  <span
                    className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E5C173] font-semibold"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Trân Trọng Báo Tin
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#FBF5E8] font-serif mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hai Họ Tác Hợp
                  </h3>
                </div>

                {/* Hai thẻ chân dung Chú Rể & Cô Dâu */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {/* CỘT NHÀ TRAI / CHÚ RỂ */}
                  <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-[#36070C]/80 border border-[#E5C173]/35">
                    {/* Ảnh chân dung tròn viền vàng 24K */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 border-2 border-[#E5C173] shadow-[0_4px_16px_rgba(229,193,115,0.3)] mb-4 bg-[#4A0B12] overflow-hidden">
                      {groomPhotoUrl ? (
                        <img
                          src={groomPhotoUrl}
                          alt={groomDisplayName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center bg-[#4A0B12] text-[#E5C173] font-serif text-2xl">
                          {groomDisplayName.charAt(0)}
                        </div>
                      )}
                    </div>

                    <span
                      className="text-[11px] tracking-[0.2em] uppercase text-[#E5C173] font-semibold mb-1"
                      style={{ fontFamily: BODY_FONT }}
                    >
                      {data.couple?.groomTitle || "Chú Rể"}
                    </span>
                    <h4
                      className="text-xl sm:text-2xl text-[#FBF5E8] font-serif mb-3"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {groomFullName}
                    </h4>

                    {/* Danh tính song thân tách 2 dòng sạch sẽ, không có & và không có "Thân sinh:" */}
                    {groomParentsList.length > 0 && (
                      <div className="w-full pt-3 border-t border-[#E5C173]/25 text-xs sm:text-sm text-[#E8D4B8] space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-[#E5C173]/80 font-medium mb-1">
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

                  {/* CỘT NHÀ GÁI / CÔ DÂU */}
                  <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-[#36070C]/80 border border-[#E5C173]/35">
                    {/* Ảnh chân dung tròn viền vàng 24K */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 border-2 border-[#E5C173] shadow-[0_4px_16px_rgba(229,193,115,0.3)] mb-4 bg-[#4A0B12] overflow-hidden">
                      {bridePhotoUrl ? (
                        <img
                          src={bridePhotoUrl}
                          alt={brideDisplayName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full flex items-center justify-center bg-[#4A0B12] text-[#E5C173] font-serif text-2xl">
                          {brideDisplayName.charAt(0)}
                        </div>
                      )}
                    </div>

                    <span
                      className="text-[11px] tracking-[0.2em] uppercase text-[#E5C173] font-semibold mb-1"
                      style={{ fontFamily: BODY_FONT }}
                    >
                      {data.couple?.brideTitle || "Cô Dâu"}
                    </span>
                    <h4
                      className="text-xl sm:text-2xl text-[#FBF5E8] font-serif mb-3"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {brideFullName}
                    </h4>

                    {/* Danh tính song thân tách 2 dòng sạch sẽ */}
                    {brideParentsList.length > 0 && (
                      <div className="w-full pt-3 border-t border-[#E5C173]/25 text-xs sm:text-sm text-[#E8D4B8] space-y-1">
                        <p className="text-[11px] uppercase tracking-wider text-[#E5C173]/80 font-medium mb-1">
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
              </section>
            )}

            {/* ----------------------------------------------------
                SECTION: LỊCH CƯỚI, ĐẾM NGƯỢC & BẢN ĐỒ (calendar, map)
                ---------------------------------------------------- */}
            {!hiddenSections.has("calendar") && (
              <section
                style={{ order: orderOf("calendar") }}
                className="relative rounded-3xl p-6 sm:p-8 border border-[#E5C173]/45 shadow-[0_20px_50px_rgba(0,0,0,0.65)] overflow-hidden"
              >
                <div
                  className="absolute inset-0 pointer-events-none rounded-3xl"
                  style={{ backgroundColor: CRIMSON_CARD }}
                />
                <div
                  className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#E5C173]/30"
                  aria-hidden="true"
                />

                <div className="relative z-10 text-center mb-6">
                  <span
                    className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E5C173] font-semibold"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Nghi Thức Thành Hôn
                  </span>
                  {/* Lần 1 xuất hiện ngày cưới trên toàn thiệp */}
                  <h3
                    className="text-2xl sm:text-3xl text-[#FBF5E8] font-serif mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {dateParts.weekday}, Ngày {dateParts.day} Tháng {dateParts.month} Năm {dateParts.year}
                  </h3>
                  {lunarDateClean && (
                    <p className="text-xs sm:text-sm text-[#E8D4B8] mt-1 italic">
                      ({lunarDateClean})
                    </p>
                  )}
                </div>

                {/* BẢNG LỊCH THÁNG (Lần 2 & là lần cuối cùng xuất hiện ngày cưới) */}
                <div className="relative z-10 max-w-sm mx-auto p-4 sm:p-5 rounded-2xl bg-[#36070C]/85 border border-[#E5C173]/35 mb-8">
                  <p
                    className="text-center text-xs tracking-widest uppercase font-semibold text-[#E5C173] mb-3"
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
                          idx === 0 ? "text-[#E5C173]" : "text-[#E8D4B8]/80"
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
                                  ? "bg-[#E5C173] text-[#4A0B12] font-bold shadow-[0_0_10px_rgba(229,193,115,0.7)]"
                                  : "text-[#FBF5E8]/85"
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

                {/* ĐỒNG HỒ ĐẾM NGƯỢC (4 Ô HOÀNG KIM) */}
                {mounted && (
                  <div className="relative z-10 mb-8">
                    <p
                      className="text-center text-[11px] sm:text-xs tracking-[0.2em] uppercase text-[#E5C173] font-semibold mb-3"
                      style={{ fontFamily: BODY_FONT }}
                    >
                      Cùng Đếm Ngược Khoảnh Khắc
                    </p>
                    <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-md mx-auto text-center">
                      {[
                        { label: "Ngày", val: timeLeft.days },
                        { label: "Giờ", val: timeLeft.hours },
                        { label: "Phút", val: timeLeft.minutes },
                        { label: "Giây", val: timeLeft.seconds },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 sm:p-4 rounded-2xl bg-[#36070C]/90 border border-[#E5C173]/40 shadow-inner flex flex-col items-center"
                        >
                          <span
                            className="text-2xl sm:text-3xl text-[#E5C173] font-bold font-serif leading-none"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {String(item.val).padStart(2, "0")}
                          </span>
                          <span className="text-[10px] sm:text-xs text-[#E8D4B8] uppercase tracking-wider mt-1.5">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* THỜI GIAN & ĐỊA ĐIỂM TIỆC (Hỗ trợ 1..N buổi lễ) */}
                {visibleEvents.length > 0 && (
                  <div className={visibleEvents.length > 1 ? "relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto" : "relative z-10 max-w-md mx-auto space-y-4"}>
                    {visibleEvents.map((evt, idx) => {
                      const evtDateParts = formatWeddingDateParts(evt.startsAt);
                      const directionsUrl = getEventDirectionsUrl(evt);

                      return (
                        <div
                          key={evt.id || idx}
                          className="p-5 rounded-2xl bg-[#36070C]/80 border border-[#E5C173]/35 text-center flex flex-col items-center justify-between gap-3 shadow-sm"
                        >
                          <div className="w-full flex flex-col items-center">
                            <span className="inline-block text-[10px] font-bold tracking-[0.2em] text-[#E5C173] uppercase border-b border-[#E5C173]/40 pb-1 mb-2">
                              BUỔI LỄ #{idx + 1}
                            </span>
                            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#E5C173] font-semibold tracking-wider uppercase">
                              <Clock className="w-4 h-4 text-[#E5C173]" />
                              <span>{evtDateParts.time || "17:30"} · {evt.title || "Tiệc Cưới Hoàng Gia"}</span>
                            </div>
                            <p className="text-xs text-[#E8D4B8] mt-1 font-medium">
                              {evtDateParts.weekday}, {evtDateParts.day}/{evtDateParts.month}/{evtDateParts.year}
                            </p>

                            <div className="flex flex-col items-center text-center mt-2">
                              <p
                                className="text-lg sm:text-xl text-[#FBF5E8] font-serif font-medium"
                                style={{ fontFamily: TITLE_FONT }}
                              >
                                {evt.venueName || "Trung Tâm Hội Nghị Tiệc Cưới"}
                              </p>
                              <p className="text-xs sm:text-sm text-[#E8D4B8] mt-1 leading-relaxed">
                                {evt.venueAddress || "Địa chỉ hôn trường đang cập nhật"}
                              </p>
                            </div>
                          </div>

                          {/* Nút chỉ đường & Thêm vào lịch */}
                          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                            {!hiddenSections.has("map") && (
                              <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#E5C173] text-[#4A0B12] text-xs font-semibold tracking-wider uppercase transition-transform active:scale-95 hover:brightness-105"
                                style={{ fontFamily: BODY_FONT }}
                              >
                                <MapPin className="w-3.5 h-3.5" />
                                <span>Chỉ Đường</span>
                              </a>
                            )}
                            <a
                              href={calendarLinks.google}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E5C173] text-[#E5C173] text-xs font-semibold tracking-wider uppercase hover:bg-[#E5C173]/15 transition-colors"
                              style={{ fontFamily: BODY_FONT }}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Thêm Vào Lịch</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ----------------------------------------------------
                SECTION: TRANG PHỤC GỢI Ý (dresscode)
                Chỉ hiển thị các chấm/ô màu tròn viền vàng kim
                TUYỆT ĐỐI KHÔNG HIỂN THỊ MÃ MÀU #XXXXXX
                ---------------------------------------------------- */}
            {!hiddenSections.has("dresscode") && (
              <section
                style={{ order: orderOf("dresscode") }}
                className="relative rounded-3xl p-6 sm:p-8 border border-[#E5C173]/45 shadow-[0_20px_50px_rgba(0,0,0,0.65)] overflow-hidden text-center"
              >
                <div
                  className="absolute inset-0 pointer-events-none rounded-3xl"
                  style={{ backgroundColor: CRIMSON_CARD }}
                />
                <div
                  className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#E5C173]/30"
                  aria-hidden="true"
                />

                <div className="relative z-10 max-w-md mx-auto">
                  <span
                    className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E5C173] font-semibold"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Ý Niệm Hòa Sắc
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#FBF5E8] font-serif mt-1 mb-2"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Trang Phục Gợi Ý
                  </h3>
                  <p className="text-xs sm:text-sm text-[#E8D4B8] italic leading-relaxed mb-6">
                    Gửi gắm vài sắc màu dịu ấm để những bức ảnh lưu niệm thêm phần hài hòa
                  </p>

                  {/* Các ô màu tròn viền vàng 24K - TUYỆT ĐỐI KHÔNG IN MÃ HEX HOẶC TÊN MÀU */}
                  <div className="flex items-center justify-center gap-6 sm:gap-8">
                    {DEFAULT_DRESS.map((item, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#E5C173] shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-transform hover:scale-110"
                        style={{ backgroundColor: item.color }}
                        title={item.name}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ----------------------------------------------------
                SECTION: ALBUM ẢNH CƯỚI (album, albumQr)
                Khung gấm đỏ trầm viền vàng 24K, góc mây, Carousel mượt mà
                Không còn khung xám đục, không in chữ quảng cáo
                ---------------------------------------------------- */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <section
                style={{ order: orderOf("album") }}
                className="relative rounded-3xl p-6 sm:p-8 border border-[#E5C173]/45 shadow-[0_20px_50px_rgba(0,0,0,0.65)] overflow-hidden"
              >
                <div
                  className="absolute inset-0 pointer-events-none rounded-3xl"
                  style={{ backgroundColor: CRIMSON_CARD }}
                />
                <div
                  className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#E5C173]/30"
                  aria-hidden="true"
                />

                {/* Góc mây trang trí */}
                <img
                  src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 left-2.5 w-9 sm:w-10 object-contain opacity-75"
                />
                <img
                  src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 right-2.5 w-9 sm:w-10 object-contain opacity-75 -scale-x-100"
                />

                <div className="relative z-10 text-center mb-6">
                  <span
                    className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E5C173] font-semibold"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Khoảnh Khắc Lưu Giữ
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#FBF5E8] font-serif mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Album Tình Yêu
                  </h3>
                </div>

                {/* CAROUSEL HIỂN THỊ ẢNH CHÍNH */}
                <div className="relative z-10 max-w-lg mx-auto">
                  <div
                    className="relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden border border-[#E5C173]/40 shadow-[0_12px_36px_rgba(0,0,0,0.7)] cursor-pointer group bg-[#3E070D]"
                    onClick={() => setLightboxIndex(activePhotoIdx)}
                  >
                    <img
                      src={albumPhotos[activePhotoIdx]?.url}
                      alt={albumPhotos[activePhotoIdx]?.alt || `Ảnh cưới ${activePhotoIdx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                      <span className="text-xs text-[#FBF5E8] bg-black/40 px-3 py-1.5 rounded-full border border-white/20">
                        Chạm để phóng to
                      </span>
                    </div>

                    {/* Nút chuyển ảnh Trước / Sau */}
                    {albumPhotos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIdx(
                              (prev) => (prev - 1 + albumPhotos.length) % albumPhotos.length
                            );
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-[#FBF5E8] hover:bg-black/75 border border-[#E5C173]/40 flex items-center justify-center transition-all cursor-pointer"
                          aria-label="Ảnh trước"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIdx(
                              (prev) => (prev + 1) % albumPhotos.length
                            );
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-[#FBF5E8] hover:bg-black/75 border border-[#E5C173]/40 flex items-center justify-center transition-all cursor-pointer"
                          aria-label="Ảnh kế tiếp"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Chấm chỉ báo trang ảnh */}
                  {albumPhotos.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                      {albumPhotos.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhotoIdx(idx)}
                          className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all cursor-pointer",
                            idx === activePhotoIdx
                              ? "bg-[#E5C173] w-6 shadow-[0_0_8px_#E5C173]"
                              : "bg-[#E5C173]/30 hover:bg-[#E5C173]/60"
                          )}
                          aria-label={`Xem ảnh ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Thumbnail dải ảnh nhỏ */}
                  {albumPhotos.length > 1 && (
                    <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4 overflow-x-auto py-2">
                      {albumPhotos.map((photo, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActivePhotoIdx(idx)}
                          className={cn(
                            "w-12 h-16 sm:w-14 sm:h-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer",
                            idx === activePhotoIdx
                              ? "border-[#E5C173] scale-105 shadow-md"
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
                </div>

                {/* QR Album dành cho khách tải ảnh lên (chỉ hiện khi có url & không phải gói Free) */}
                {data.plan !== "free" && !hiddenSections.has("albumQr") && (
                  <div className="mt-8 pt-6 border-t border-[#E5C173]/25 flex flex-col items-center">
                    <GuestAlbumQr
                      slug={inviteSlug || weddingSlug}
                      accentColor="#E5C173"
                      textColor="#FBF5E8"
                      mutedColor="#E8D4B8"
                    />
                  </div>
                )}
              </section>
            )}

            {/* ----------------------------------------------------
                SECTION: HỘP QUÀ CHÚC PHÚC (gift)
                3 trạng thái dùng đúng 3 asset chuẩn 360x360:
                gift_box_normal -> gift_box_glow -> gift_box_open
                Mở GiftModal qua createPortal
                ---------------------------------------------------- */}
            {!hiddenSections.has("gift") && (
              <section
                style={{ order: orderOf("gift") }}
                className="relative rounded-3xl p-6 sm:p-8 border border-[#E5C173]/45 shadow-[0_20px_50px_rgba(0,0,0,0.65)] overflow-hidden text-center"
              >
                <div
                  className="absolute inset-0 pointer-events-none rounded-3xl"
                  style={{ backgroundColor: CRIMSON_CARD }}
                />
                <div
                  className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#E5C173]/30"
                  aria-hidden="true"
                />

                <div className="relative z-10 max-w-md mx-auto flex flex-col items-center">
                  <span
                    className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E5C173] font-semibold"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Gửi Gắm Yêu Thương
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#FBF5E8] font-serif mt-1 mb-2"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hộp Quà Chúc Phúc
                  </h3>
                  <p className="text-xs sm:text-sm text-[#E8D4B8] leading-relaxed mb-4">
                    Sự hiện diện của Quý khách là niềm hạnh phúc trọn vẹn nhất của hai gia đình. Nếu ở xa không tiện ghé chung vui, Quý khách có thể gửi lời chúc qua hộp quà nhỏ bên dưới.
                  </p>

                  {/* Hộp quà gấm đỏ 3 trạng thái tương tác */}
                  <div
                    className="relative w-48 sm:w-56 aspect-square my-2 cursor-pointer group transition-transform active:scale-95"
                    onClick={() => {
                      setBoxState("open");
                      setTimeout(() => setGiftModalOpen(true), 350);
                    }}
                    onMouseEnter={() => setBoxState("glow")}
                    onMouseLeave={() => setBoxState("normal")}
                  >
                    <img
                      src={
                        boxState === "open"
                          ? "/templates/phuong-loan-gam-do/gift_box_open.webp"
                          : boxState === "glow"
                            ? "/templates/phuong-loan-gam-do/gift_box_glow.webp"
                            : "/templates/phuong-loan-gam-do/gift_box_normal.webp"
                      }
                      alt="Hộp Quà Chúc Phúc"
                      className="w-full h-full object-contain drop-shadow-[0_8px_24px_rgba(229,193,115,0.4)] transition-all duration-300"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBoxState("open");
                      setTimeout(() => setGiftModalOpen(true), 350);
                    }}
                    className="mt-3 px-8 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all duration-300 active:scale-95 shadow-[0_4px_16px_rgba(229,193,115,0.4)] hover:brightness-105 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #F6DF9F 0%, #E5C173 50%, #B88E3F 100%)",
                      color: TEXT_DARK_ON_GOLD,
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
                Đồng bộ 100% theme Phượng Loan Gấm Đỏ
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
                  tone="ruby"
                  customTheme={{
                    isDark: true,
                    wrap: "bg-[#4A0B12]/95 border-[#E5C173]/45 text-[#FBF5E8] shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-3xl",
                    card: "bg-[#36070C]/90 border border-[#E5C173]/40 text-[#FBF5E8]",
                    eyebrow: "text-[#E5C173] tracking-[0.25em] uppercase font-semibold text-[11px]",
                    heading: "text-[#E5C173] font-serif text-2xl sm:text-3xl",
                    subtext: "text-[#E8D4B8] text-xs sm:text-sm",
                    input: "bg-[#36070C] border-[#E5C173]/40 text-[#FBF5E8] placeholder:text-[#D4B898]/70 focus:border-[#E5C173] focus:ring-1 focus:ring-[#E5C173]",
                    primaryBtn: "bg-[#E5C173] hover:bg-[#F6DF9F] text-[#4A0B12] font-semibold shadow-md",
                    outlineBtn: "border-[#E5C173] text-[#E5C173] hover:bg-[#E5C173]/15",
                    alert: "border-[#E5C173]/40 bg-[#36070C] text-[#FBF5E8]",
                    badge: "border-[#E5C173]/40 bg-[#36070C] text-[#E5C173]",
                    optionBg: "#36070C",
                    optionColor: "#FBF5E8",
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
          <footer className="relative z-10 text-center pt-8 sm:pt-12 pb-16 border-t border-[#E5C173]/30">
            <img
              src="/templates/phuong-loan-gam-do/song_hy_medallion.webp"
              alt="Song Hỷ"
              className="w-10 sm:w-12 h-auto mx-auto mb-4 opacity-85"
            />
            <p
              className="text-base sm:text-lg text-[#FBF5E8] font-serif font-medium mb-1"
              style={{ fontFamily: TITLE_FONT }}
            >
              {groomDisplayName} & {brideDisplayName}
            </p>
            <p className="text-xs sm:text-sm text-[#E8D4B8] max-w-md mx-auto leading-relaxed px-4">
              Chân thành cảm ơn tình cảm và sự hiện diện quý báu của Quý khách trong ngày vui của chúng tôi.
            </p>
          </footer>
        </div>

        {/* ========================================================
            MODALS & OVERLAYS (PORTALS)
            ======================================================== */}
        {/* Modal Hộp Quà Mừng Cưới */}
        <GiftModal
          open={giftModalOpen}
          onClose={() => {
            setGiftModalOpen(false);
            setBoxState("normal");
          }}
          gift={data.gift}
          plan={data.plan || "free"}
          coupleName={`${groomDisplayName} & ${brideDisplayName}`}
          guestName={guestName}
          tone="ruby"
        />

        {/* Modal Lightbox Phóng To Ảnh Cưới */}
        <TemplateLightboxModal
          photos={albumPhotos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={(idx) => setLightboxIndex(idx)}
        />

        {/* Nút Nhạc Nền Nổi (LiveMusicFloatingButton) */}
        {!data.hiddenSections?.includes("music") && (
          <LiveMusicFloatingButton
          src={data.music?.src || "/media/co-dien.mp3"}
          title={data.music?.title || "Long Phụng Hòa Minh"}
          visible={isOpen || coverGone}
          tone="ruby"
        />
        )}
      </div>
    </div>
  );
}
