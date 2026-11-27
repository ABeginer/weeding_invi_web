"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import {
  getVisibleEvents,
  getNearestUpcomingEvent,
  getEventDirectionsUrl,
} from "@/lib/events";
import type {
  TemplatePhotoItem,
} from "@/lib/wedding-types";
import {
  ImperialReveal,
  HeroReveal,
  GoldButtonShimmer,
  IMPERIAL_EASE,
} from "../shared/ImperialMotion";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: PHƯỢNG LOAN GẤM ĐỎ (phuong-loan-gam-do)
   ============================================================ */

const CRIMSON_DEEP = "#3E070D";
const CRIMSON_CARD = "rgba(74, 11, 18, 0.90)";

const TEXT_DARK_ON_GOLD = "#4A0B12";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

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
  const reduce = useReducedMotion();
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

  if (reduce) return null;

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
}: WeddingTemplateProps) {
  const prefersReduced = useReducedMotion();

  // Trạng thái mở bìa thiệp theo 2 pha độc bản: "idle" -> "seal" -> "curtain"
  const [isOpen, setIsOpen] = React.useState(isOpened);
  const [coverPhase, setCoverPhase] = React.useState<"idle" | "seal" | "curtain">("idle");
  const [coverGone, setCoverGone] = React.useState(isOpened);
  const [prevIsOpened, setPrevIsOpened] = React.useState(isOpened);
  const timeoutsRef = React.useRef<Array<ReturnType<typeof setTimeout>>>([]);

  if (isOpened !== prevIsOpened) {
    setPrevIsOpened(isOpened);
    if (isOpened) {
      setIsOpen(true);
      setCoverGone(true);
      setCoverPhase("idle");
    } else {
      setIsOpen(false);
      setCoverGone(false);
      setCoverPhase("idle");
    }
  }

  React.useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  const isOpening = coverPhase === "seal" || coverPhase === "curtain";
  const showBody = coverGone || coverPhase === "curtain";

  const handleOpenCover = () => {
    if (isOpen || isOpening) return;
    playOpenCardSound();

    if (prefersReduced) {
      setIsOpen(true);
      setCoverGone(true);
      onOpenedChange?.(true);
      try {
        window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
      } catch { }
      return;
    }

    setCoverPhase("seal");
    const t1 = setTimeout(() => {
      setCoverPhase("curtain");
    }, 700);
    const t2 = setTimeout(() => {
      setIsOpen(true);
      setCoverGone(true);
      setCoverPhase("idle");
      onOpenedChange?.(true);
      try {
        window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
      } catch { }
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 2050);
    timeoutsRef.current.push(t1, t2);
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

  // Countdown timer an toàn hydration (chỉ khởi tạo từ callback setTimeout(0))
  const [timeLeft, setTimeLeft] = React.useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  React.useEffect(() => {
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

    const boot = setTimeout(calcTime, 0);
    const timer = setInterval(calcTime, 1000);
    return () => {
      clearTimeout(boot);
      clearInterval(timer);
    };
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

  const defaultOrder = CANONICAL_SECTION_ORDER;

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
          TRANG BÌA (COVER SECTION) — KIM ẤN KHAI RÈM GẤM 3D (~2.05s)
          -------------------------------------------------------- */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            key="envelope-cover"
            className="absolute inset-0 z-50 w-full max-w-full overflow-hidden flex items-center justify-center px-4 py-4 sm:px-6"
            initial={{ opacity: 1 }}
            animate={
              coverPhase === "curtain"
                ? { opacity: 0, transition: { duration: 0.65, delay: 0.75, ease: IMPERIAL_EASE } }
                : { opacity: 1 }
            }
            exit={{
              opacity: 0,
              transition: { duration: 0.35, ease: IMPERIAL_EASE },
            }}
          >
            {/* z-0: Ảnh nền gấm lụa đỏ son (tan cùng cửa rèm) */}
            <m.div
              className="absolute inset-0 z-0"
              animate={coverPhase === "curtain" ? { opacity: 0 } : { opacity: 1 }}
              transition={{ duration: 0.55, delay: 0.4 }}
            >
              <picture>
                <source
                  media="(min-width: 768px)"
                  srcSet="/templates/phuong-loan-gam-do/bg_desktop.webp"
                />
                <img decoding="async"
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
            </m.div>

            {/* z-[5]: Bụi vàng hoàng kim sa trôi chậm */}
            <ImperialGoldDust count={16} />

            {/* Hai cánh rèm gấm đỏ 3D xoay mở sang trái/phải khi Pha 2 (curtain) kích hoạt */}
            {isOpening && (
              <div
                className="pointer-events-none absolute inset-0 z-10 flex overflow-hidden"
                style={{ perspective: "1200px" }}
              >
                <m.div
                  className="w-1/2 h-full bg-gradient-to-r from-[#3E070D] via-[#560B12] to-[#6B1019] border-r-2 border-[#E5C173]/60 shadow-[12px_0_40px_rgba(0,0,0,0.6)]"
                  style={{
                    transformOrigin: "left center",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                  initial={{ rotateY: 0, opacity: 1 }}
                  animate={
                    coverPhase === "curtain"
                      ? { rotateY: -82, opacity: 0.15 }
                      : { rotateY: 0, opacity: 1 }
                  }
                  transition={{ duration: 1.25, ease: IMPERIAL_EASE }}
                />
                <m.div
                  className="w-1/2 h-full bg-gradient-to-l from-[#3E070D] via-[#560B12] to-[#6B1019] border-l-2 border-[#E5C173]/60 shadow-[-12px_0_40px_rgba(0,0,0,0.6)]"
                  style={{
                    transformOrigin: "right center",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                  }}
                  initial={{ rotateY: 0, opacity: 1 }}
                  animate={
                    coverPhase === "curtain"
                      ? { rotateY: 82, opacity: 0.15 }
                      : { rotateY: 0, opacity: 1 }
                  }
                  transition={{ duration: 1.25, ease: IMPERIAL_EASE }}
                />
              </div>
            )}

            {/* Thẻ Gấm Đỏ Hoàng Gia Trung Tâm (z-20) */}
            <m.div
              className="relative w-full max-w-[328px] sm:max-w-[380px] mx-auto my-auto flex flex-col items-center text-center rounded-3xl p-6 sm:p-7 shadow-[0_24px_80px_rgba(0,0,0,0.85)] border border-[#E5C173]/55 overflow-hidden z-20"
              style={{ backgroundColor: CRIMSON_CARD }}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={
                coverPhase === "curtain"
                  ? {
                    scale: 0.94,
                    opacity: 0,
                    y: -26,
                    transition: { duration: 0.65, ease: IMPERIAL_EASE },
                  }
                  : {
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: IMPERIAL_EASE },
                  }
              }
            >
              {/* Viền chỉ vàng cổ lồng bên trong */}
              <div
                className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#E5C173]/40"
                aria-hidden="true"
              />

              {/* 4 Góc Mây Vàng Như Ý gold_cloud_corner.webp */}
              <img loading="eager" decoding="async"
                src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-2.5 left-2.5 w-10 sm:w-11 object-contain opacity-85 z-10"
              />
              <img loading="eager" decoding="async"
                src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-2.5 right-2.5 w-10 sm:w-11 object-contain opacity-85 -scale-x-100 z-10"
              />
              <img loading="eager" decoding="async"
                src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2.5 left-2.5 w-10 sm:w-11 object-contain opacity-85 -scale-y-100 z-10"
              />
              <img loading="eager" decoding="async"
                src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2.5 right-2.5 w-10 sm:w-11 object-contain opacity-85 -scale-100 z-10"
              />

              {/* Ấn Triện Bát Giác Song Hỷ Hoàng Kim + Vòng Sóng Nghi Thức Pha 1 */}
              <div className="relative z-20 mt-1 mb-3 flex items-center justify-center">
                {!prefersReduced && (
                  <m.div
                    className="pointer-events-none absolute -inset-3 rounded-full"
                    style={{
                      background: "radial-gradient(circle, rgba(229,193,115,0.45) 0%, transparent 70%)",
                    }}
                    animate={{ scale: [0.95, 1.15, 0.95], opacity: [0.45, 0.85, 0.45] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
                {coverPhase === "seal" && !prefersReduced && (
                  <>
                    <m.span
                      aria-hidden="true"
                      className="pointer-events-none absolute h-16 w-16 rounded-full border border-[#F6DF9F]/80"
                      initial={{ scale: 0.7, opacity: 0.9 }}
                      animate={{ scale: 2.8, opacity: 0 }}
                      transition={{ duration: 0.9, ease: IMPERIAL_EASE }}
                    />
                    <m.span
                      aria-hidden="true"
                      className="pointer-events-none absolute h-14 w-14 rounded-full border border-[#E5C173]/60"
                      initial={{ scale: 0.6, opacity: 0.8 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 0.85, delay: 0.16, ease: IMPERIAL_EASE }}
                    />
                  </>
                )}
                <m.img
                  loading="eager"
                  decoding="async"
                  src="/templates/phuong-loan-gam-do/song_hy_medallion.webp"
                  alt="Kim Ấn Song Hỷ"
                  className="relative z-10 w-14 sm:w-16 h-auto object-contain drop-shadow-[0_4px_12px_rgba(229,193,115,0.45)]"
                  animate={
                    coverPhase === "seal"
                      ? { rotate: 18, scale: 1.12 }
                      : { rotate: 0, scale: 1 }
                  }
                  transition={{ duration: 0.65, ease: IMPERIAL_EASE }}
                />
              </div>

              {/* Lời dẫn tao nhã */}
              <p
                className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E5C173] font-semibold mb-1"
                style={{ fontFamily: BODY_FONT }}
              >
                Trân Trọng Kính Mời
              </p>

              {/* Tên cặp đôi 3 dòng chuẩn với break-words */}
              <div
                className="text-center my-1.5 max-w-full px-2"
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
              <img loading="eager" decoding="async"
                src="/templates/phuong-loan-gam-do/divider_cloud_ruby.webp"
                alt=""
                aria-hidden="true"
                className="w-44 sm:w-52 h-auto object-contain my-2.5 opacity-90"
              />

              {/* Ngày cưới ngắn gọn trên bìa */}
              <p
                className="text-[11px] sm:text-xs tracking-[0.22em] uppercase text-[#F6DF9F] font-medium"
                style={{ fontFamily: TITLE_FONT }}
              >
                {dateParts.weekday} · {dateParts.dotDate}
              </p>

              {/* Dành riêng cho khách mời (nếu có) */}
              {guestName && (
                <div className="mt-2.5 px-3.5 py-1 rounded-full bg-[#36070C]/85 border border-[#E5C173]/35 max-w-full">
                  <p className="text-xs text-[#E8D4B8] truncate">
                    Kính mời: <span className="text-[#FBF5E8] font-medium">{guestName}</span>
                  </p>
                </div>
              )}

              {/* Nút Mở Thiệp mạ vàng 24K + hiệu ứng ánh kim lướt */}
              <button
                type="button"
                onClick={handleOpenCover}
                disabled={isOpening}
                className="relative overflow-hidden mt-4 px-9 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase transition-all duration-300 transform active:scale-95 shadow-[0_4px_20px_rgba(229,193,115,0.45)] hover:shadow-[0_6px_25px_rgba(229,193,115,0.65)] hover:brightness-105 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #F6DF9F 0%, #E5C173 50%, #B88E3F 100%)",
                  color: TEXT_DARK_ON_GOLD,
                  fontFamily: BODY_FONT,
                }}
              >
                <GoldButtonShimmer active={!isOpening} />
                <span className="relative z-10">{isOpening ? "Đang Khai Thiệp..." : "Mở Thiệp"}</span>
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------
          THÂN THIỆP CHÍNH (MAIN INVITATION CONTENT)
          Ẩn hoàn toàn cho đến khi Pha 2 (curtain) bắt đầu mở
          -------------------------------------------------------- */}
      <div
        className={cn(
          "relative z-10 w-full min-h-screen",
          !showBody ? "hidden pointer-events-none" : "block"
        )}
      >
        {/* Nền gấm cố định xuyên suốt ruột thiệp */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <picture>
            <source
              media="(min-width: 768px)"
              srcSet="/templates/phuong-loan-gam-do/bg_desktop.webp"
            />
            <img loading="lazy" decoding="async"
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
            <HeroReveal showBody={showBody} delay={0.15} y={10} className="mb-3 flex items-center justify-center gap-2">
              <span className="w-8 h-px bg-gradient-to-r from-transparent to-[#E5C173]/70" />
              <span
                className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E5C173] font-semibold"
                style={{ fontFamily: BODY_FONT }}
              >
                Lễ Thành Hôn
              </span>
              <span className="w-8 h-px bg-gradient-to-l from-transparent to-[#E5C173]/70" />
            </HeroReveal>

            {/* Tên cặp đôi 3 dòng ở Hero (tuyệt đối không lặp ngày cưới) */}
            <HeroReveal
              showBody={showBody}
              delay={0.28}
              y={16}
              className="my-3 text-center px-4 max-w-full"
            >
              <div style={{ fontFamily: TITLE_FONT }}>
                <h1 className="text-3xl sm:text-4xl md:text-5xl text-[#FBF5E8] tracking-wide break-words drop-shadow-md leading-tight">
                  {groomDisplayName}
                </h1>
                <div className="text-xl sm:text-2xl text-[#E5C173] my-1 font-serif">&</div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl text-[#FBF5E8] tracking-wide break-words drop-shadow-md leading-tight">
                  {brideDisplayName}
                </h2>
              </div>
            </HeroReveal>

            <HeroReveal showBody={showBody} delay={0.4} y={14}>
              <p
                className="text-xs sm:text-sm text-[#E8D4B8] max-w-md mx-auto mt-1 mb-6 px-4 leading-relaxed"
                style={{ fontFamily: BODY_FONT }}
              >
                Trăm năm kết tóc se tơ · Duyên cầm sắt trọn đời gắn bó
              </p>
            </HeroReveal>

            {/* Khung Vòm Long Phụng ôm ảnh cưới (Long Phụng chầu rìa ngoài, 0% che mặt cặp đôi) */}
            <HeroReveal
              showBody={showBody}
              delay={0.5}
              y={22}
              scale={0.96}
              duration={1.05}
              className="relative w-full max-w-[358px] sm:max-w-[460px] aspect-[1010/940] mx-auto flex items-center justify-center"
            >
              {/* Lõi bên trong: Ảnh cặp đôi bo vòm khớp khít 100% lòng đường chỉ vàng kép (canvas 1010x940) */}
              <div
                className="absolute left-[17.4%] right-[18.2%] top-[2.4%] bottom-[2.3%] overflow-hidden bg-[#3E070D]"
                style={{ borderRadius: "50% 50% 0 0 / 34.6% 34.6% 0 0" }}
              >
                {heroPhotoUrl ? (
                  <img loading="eager" decoding="async"
                    src={heroPhotoUrl}
                    alt={`${groomDisplayName} & ${brideDisplayName}`}
                    className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#4A0B12] to-[#2E0509]">
                    <img loading="eager" decoding="async"
                      src="/templates/phuong-loan-gam-do/song_hy_medallion.webp"
                      alt="Song Hỷ"
                      className="w-20 h-auto mb-3 opacity-90 drop-shadow-md"
                    />
                    <p
                      className="text-[#E5C173] text-sm font-serif tracking-wider"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Lễ Thành Hôn
                    </p>
                  </div>
                )}
              </div>

              {/* Lớp khung vòm Phù Điêu Long Phụng 24K đè lên trên (pointer-events-none) */}
              <img loading="eager" decoding="async"
                src="/templates/phuong-loan-gam-do/dragon_phoenix_arch.webp?v=3"
                alt="Khung vòm Long Phụng 24K"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full object-fill z-10 drop-shadow-[0_12px_36px_rgba(0,0,0,0.8)]"
              />
            </HeroReveal>

            {/* Dải phân cách mây ruby dưới Hero */}
            <HeroReveal showBody={showBody} delay={0.7} y={12} blur={false}>
              <img loading="lazy" decoding="async"
                src="/templates/phuong-loan-gam-do/divider_cloud_ruby.webp"
                alt=""
                aria-hidden="true"
                className="w-48 sm:w-56 h-auto object-contain mt-6 opacity-90"
              />
            </HeroReveal>
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
                <img loading="lazy" decoding="async"
                  src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 left-2.5 w-9 sm:w-10 object-contain opacity-75"
                />
                <img loading="lazy" decoding="async"
                  src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 right-2.5 w-9 sm:w-10 object-contain opacity-75 -scale-x-100"
                />

                <ImperialReveal direction="up" className="relative z-10 text-center mb-6">
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
                </ImperialReveal>

                {/* Hai thẻ chân dung Chú Rể & Cô Dâu */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                  {/* CỘT NHÀ TRAI / CHÚ RỂ */}
                  <ImperialReveal direction="left" delay={0.08} className="flex flex-col items-center text-center p-5 rounded-2xl bg-[#36070C]/80 border border-[#E5C173]/35">
                    {/* Ảnh chân dung tròn viền vàng 24K */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 border-2 border-[#E5C173] shadow-[0_4px_16px_rgba(229,193,115,0.3)] mb-4 bg-[#4A0B12] overflow-hidden">
                      {groomPhotoUrl ? (
                        <img loading="lazy" decoding="async"
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
                  </ImperialReveal>

                  {/* CỘT NHÀ GÁI / CÔ DÂU */}
                  <ImperialReveal direction="right" delay={0.14} className="flex flex-col items-center text-center p-5 rounded-2xl bg-[#36070C]/80 border border-[#E5C173]/35">
                    {/* Ảnh chân dung tròn viền vàng 24K */}
                    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 border-2 border-[#E5C173] shadow-[0_4px_16px_rgba(229,193,115,0.3)] mb-4 bg-[#4A0B12] overflow-hidden">
                      {bridePhotoUrl ? (
                        <img loading="lazy" decoding="async"
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
                  </ImperialReveal>
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

                <ImperialReveal direction="up" className="relative z-10 text-center mb-6">
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
                </ImperialReveal>

                {/* BẢNG LỊCH THÁNG (Lần 2 & là lần cuối cùng xuất hiện ngày cưới) */}
                <ImperialReveal direction="up" delay={0.1} className="relative z-10 max-w-sm mx-auto p-4 sm:p-5 rounded-2xl bg-[#36070C]/85 border border-[#E5C173]/35 mb-8">
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
                </ImperialReveal>

                {/* ĐỒNG HỒ ĐẾM NGƯỢC (4 Ô HOÀNG KIM) */}
                {timeLeft && (
                  <ImperialReveal direction="up" delay={0.14} className="relative z-10 mb-8">
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
                  </ImperialReveal>
                )}

              </section>
            )}

            {/* ----------------------------------------------------
                SECTION: SỰ KIỆN & ĐỊA ĐIỂM (map)
                ---------------------------------------------------- */}
            {!hiddenSections.has("map") && visibleEvents.length > 0 && (
              <section
                style={{ order: orderOf("map") }}
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
                <ImperialReveal direction="up" className="relative z-10 text-center mb-6">
                  <h3
                    className="text-2xl sm:text-3xl text-[#FBF5E8] font-serif"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Sự Kiện Cưới
                  </h3>
                </ImperialReveal>
                {/* THỜI GIAN & ĐỊA ĐIỂM TIỆC (Hỗ trợ 1..N buổi lễ) */}
                <div className={visibleEvents.length > 1 ? "relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto" : "relative z-10 max-w-md mx-auto space-y-4"}>
                  {visibleEvents.map((evt, idx) => {
                    const evtDateParts = formatWeddingDateParts(evt.startsAt);
                    const directionsUrl = getEventDirectionsUrl(evt);

                    return (
                      <ImperialReveal
                        key={evt.id || idx}
                        direction="up"
                        delay={idx * 0.1}
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
                      </ImperialReveal>
                    );
                  })}
                </div>
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

                <ImperialReveal direction="up" className="relative z-10 max-w-md mx-auto">
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
                      <ImperialReveal
                        key={idx}
                        direction="up"
                        delay={0.08 + idx * 0.08}
                        scale={0.85}
                        blur={false}
                      >
                        <div
                          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-[#E5C173] shadow-[0_4px_16px_rgba(0,0,0,0.5)] transition-transform hover:scale-110"
                          style={{ backgroundColor: item.color }}
                          title={item.name}
                        />
                      </ImperialReveal>
                    ))}
                  </div>
                </ImperialReveal>
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
                <img loading="lazy" decoding="async"
                  src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 left-2.5 w-9 sm:w-10 object-contain opacity-75"
                />
                <img loading="lazy" decoding="async"
                  src="/templates/phuong-loan-gam-do/gold_cloud_corner.webp"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute top-2.5 right-2.5 w-9 sm:w-10 object-contain opacity-75 -scale-x-100"
                />

                <ImperialReveal direction="up" className="relative z-10 text-center mb-6">
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
                </ImperialReveal>

                {/* CAROUSEL HIỂN THỊ ẢNH CHÍNH */}
                <ImperialReveal direction="up" delay={0.1} scale={0.97} className="relative z-10 max-w-lg mx-auto">
                  <div
                    className="relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden border border-[#E5C173]/40 shadow-[0_12px_36px_rgba(0,0,0,0.7)] cursor-pointer group bg-[#3E070D]"
                    onClick={() => setLightboxIndex(activePhotoIdx)}
                  >
                    <img loading="lazy" decoding="async"
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
                          <img loading="lazy" decoding="async"
                            src={photo.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </ImperialReveal>

              </section>
            )}

            {/* QR Album dành cho khách tải ảnh lên (chỉ hiện khi có url & không phải gói Free) */}
            {data.plan !== "free" && !hiddenSections.has("albumQr") && (inviteSlug || weddingSlug) && (
              <section
                style={{ order: orderOf("albumQr") }}
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
                <ImperialReveal direction="up" delay={0.12} className="relative z-10 flex flex-col items-center">
                  <GuestAlbumQr
                    slug={inviteSlug || weddingSlug}
                    accentColor="#E5C173"
                    textColor="#FBF5E8"
                    mutedColor="#E8D4B8"
                  />
                </ImperialReveal>
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

                <ImperialReveal direction="up" className="relative z-10 max-w-md mx-auto flex flex-col items-center">
                  <span
                    className="text-[11px] sm:text-xs tracking-[0.25em] uppercase text-[#E5C173] font-semibold"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Gửi Gắm Yêu Thương
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#FBF5E8] font-serif mt-1 mb-4"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hộp Quà Chúc Phúc
                  </h3>

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
                    <img loading="lazy" decoding="async"
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
                </ImperialReveal>
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
                <ImperialReveal direction="up">
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
                </ImperialReveal>
              </section>
            )}
          </div>

          {/* ========================================================
              FOOTER (BÊN NGOÀI CONTAINER CÓ ORDER)
              Lời cảm ơn ấm áp, không lặp lại ngày cưới
              ======================================================== */}
          <footer className="relative z-10 text-center pt-8 sm:pt-12 pb-16 border-t border-[#E5C173]/30">
            <ImperialReveal direction="up">
              <img loading="lazy" decoding="async"
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
            </ImperialReveal>
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
