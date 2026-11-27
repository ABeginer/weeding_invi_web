"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Heart,
  MapPin,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
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
   BẢNG MÀU CHÍNH THỨC: RÁNG HỒNG HOÀNG HÔN (rang-hong-hoang-hon)
   - Hồng Mận Hoàng Hôn (Dusty Sunset Berry): #7E3945 (sâu #5E2731, hover #964755)
   - Hồng Đào Ánh Nắng (Warm Sunset Rose): #D69288 (nhạt #F5DDD8)
   - Lụa Ráng Hồng (Blush-Peach Silk): #FFF7F5 (thẻ nổi #FFFFFF, nền ấm #FCECE8)
   - Vàng Hồng Hoàng Hôn (Sunset Rose-Gold): #D69F8E
   - Chữ nội dung trên nền sáng: #694349 / #8C686E (tương phản cao, dịu mắt)
   - Dress Code mặc định: #6E2C35 (Đỏ rượu ấm), #CFA498 (Hồng cát hoàng hôn), #FAF5F2 (Trắng ngà)
   ============================================================ */

const BERRY_MAIN = "#7E3945";
const BERRY_DEEP = "#5E2731";
const BERRY_HOVER = "#964755";

const ROSE_WARM = "#D69288";
const ROSE_LIGHT = "#F5DDD8";

const SILK_BG = "#FFF7F5";
const SILK_CARD = "#FFFFFF";
const SILK_WARM = "#FCECE8";

const ROSE_GOLD = "#D69F8E";

const TEXT_MAIN = "#694349";
const TEXT_MUTED = "#8C686E";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_SMOOTH = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "16:30", label: "Đón tiếp người thương & Lưu giữ khoảnh khắc hoàng hôn" },
  { time: "17:30", label: "Nghi thức Thành Hôn & Lời hẹn ước dưới ráng chiều" },
  { time: "18:00", label: "Khai tiệc dạ yến & Nâng ly chúc phúc trăm năm" },
  { time: "19:30", label: "Giai điệu ráng hồng & Giao lưu thân tình" },
  { time: "20:30", label: "Lời cảm tạ tri ân & Gửi gắm yêu thương" },
];

const DEFAULT_DRESS = [
  { hex: "#6E2C35", label: "Đỏ Rượu Ấm" },
  { hex: "#CFA498", label: "Hồng Cát Hoàng Hôn" },
  { hex: "#FAF5F2", label: "Trắng Ngà" },
];

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Đốm Nắng Hoàng Hôn Trôi Nhẹ
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function SunsetGlowDust({ count = 14 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 19) % 94 + 3}%`,
      size: (idx % 3) + 3,
      duration: 10 + (idx % 4) * 2.5,
      delay: (idx * 0.6) % 5,
      yOffset: 25 + (idx % 4) * 15,
      isRose: idx % 2 === 0,
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-[5]">
      {particles.map((p) => (
        <m.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            background: p.isRose
              ? "radial-gradient(circle, #D69288 0%, rgba(214,146,136,0.3) 70%, transparent 100%)"
              : "radial-gradient(circle, #D69F8E 0%, rgba(214,159,142,0.3) 80%, transparent 100%)",
            boxShadow: p.isRose ? "0 0 10px rgba(214, 146, 136, 0.7)" : "none",
          }}
          animate={{
            y: [0, -750],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * p.yOffset, 0],
            opacity: [0, 0.75, 0.85, 0.35, 0],
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

export default function RangHongHoangHonTemplate({
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

  // Hero couple photo
  const heroPhotoUrl =
    data.photos?.heroUrl ||
    data.photos?.gallery?.[0]?.url ||
    "/photos/hero-wedding.webp";

  // Individual couple portraits
  const groomPortraitUrl = data.photos?.groomUrl || "/photos/portrait-groom.webp";
  const bridePortraitUrl = data.photos?.brideUrl || "/photos/portrait-bride.webp";

  // Visible events & nearest upcoming
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent?.startsAt || data.date || "2027-03-20T17:30:00+07:00";
  const dateParts = formatWeddingDateParts(eventDateStr);
  const lunarDateClean = targetEvent?.lunarDate ? formatLunarDateClean(targetEvent.lunarDate) : "Ngày Hoàng Đạo Cát Khánh";

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
    const year = d.getFullYear() || 2027;
    const month = d.getMonth() || 2;
    const currentDay = d.getDate() || 20;

    const daysSet = new Set<number>();
    visibleEvents.forEach((evt) => {
      if (evt.startsAt) {
        const evtD = new Date(evt.startsAt);
        if (evtD.getFullYear() === year && evtD.getMonth() === month) {
          daysSet.add(evtD.getDate());
        }
      }
    });
    if (daysSet.size === 0) {
      daysSet.add(currentDay);
    }

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
      eventDays: daysSet,
      currentDay,
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

  const groomDisplayName = data.couple?.groomName || "Hoàng Việt";
  const brideDisplayName = data.couple?.brideName || "Khánh Linh";
  const groomFullName = data.couple?.groomFullName || "Phạm Hoàng Việt";
  const brideFullName = data.couple?.brideFullName || "Vũ Khánh Linh";

  // Monogram initials động (TUYỆT ĐỐI KHÔNG HARDCODE "K&B")
  const groomInitial = (data.couple?.groomName || "H").trim().charAt(0).toUpperCase();
  const brideInitial = (data.couple?.brideName || "L").trim().charAt(0).toUpperCase();
  const monogram = `${groomInitial} & ${brideInitial}`;

  const groomParentsList = React.useMemo(() => {
    const p = data.couple?.groomParents;
    if (!p) return ["Ông Phạm Đình Trung & Bà Đỗ Minh Phương"];
    return p.includes("&") ? p.split("&").map((s) => s.trim()) : [p];
  }, [data.couple?.groomParents]);

  const brideParentsList = React.useMemo(() => {
    const p = data.couple?.brideParents;
    if (!p) return ["Ông Vũ Mạnh Hùng & Bà Hoàng Lan Chi"];
    return p.includes("&") ? p.split("&").map((s) => s.trim()) : [p];
  }, [data.couple?.brideParents]);

  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn(
        "relative w-full min-h-screen overflow-x-hidden selection:bg-[#D69288]/30 selection:text-[#7E3945]",
        contained ? "max-w-[480px] mx-auto shadow-2xl" : "w-full"
      )}
      style={{
        backgroundColor: SILK_BG,
        fontFamily: BODY_FONT,
        color: TEXT_MAIN,
      }}
    >
      {/* ============================================================
          1. BÌA MỞ THIỆP (Cover: "Ráng Hồng Cánh Bướm" — Z-Index Chuẩn Sắc Nét)
          ============================================================ */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            className="fixed inset-0 z-50 w-full max-w-full overflow-hidden flex items-center justify-center px-4 py-4 sm:px-6"
            style={{
              backgroundColor: SILK_BG,
              backgroundImage:
                viewport === "desktop"
                  ? "url(/templates/rang-hong-hoang-hon/background.webp)"
                  : "url(/templates/rang-hong-hoang-hon/background-mobile.webp)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 0.97,
              transition: { duration: 0.65, ease: EASE_SMOOTH },
            }}
          >
            {/* z-[5]: Đốm nắng hoàng hôn trôi nhẹ */}
            <SunsetGlowDust count={16} />

            {/* z-10: Cánh bướm bay lượn ở góc bìa */}
            <m.img
              src="/templates/rang-hong-hoang-hon/butterfly-l.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute top-12 left-6 sm:left-16 w-12 sm:w-16 object-contain z-10 opacity-70 drop-shadow-sm"
              animate={reduceMotion ? undefined : { y: [0, -12, 0], x: [0, 8, 0], rotate: [0, 6, 0] }}
              transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            <m.img
              src="/templates/rang-hong-hoang-hon/butterfly-r.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-16 right-6 sm:right-16 w-12 sm:w-16 object-contain z-10 opacity-70 drop-shadow-sm"
              animate={reduceMotion ? undefined : { y: [0, -10, 0], x: [0, -6, 0], rotate: [0, -5, 0] }}
              transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            {/* z-20: Thẻ Lụa Trắng Ráng Hồng Trung Tâm */}
            <m.div
              className="relative w-full max-w-[328px] sm:max-w-[380px] mx-auto my-auto flex flex-col items-center text-center rounded-3xl p-6 sm:p-8 shadow-[0_24px_64px_rgba(126,57,69,0.12)] border border-[#D69F8E]/50 backdrop-blur-md overflow-hidden z-20 bg-white/92"
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={
                isOpening
                  ? { scale: 1.03, opacity: 0, y: -25, transition: { duration: 0.65, ease: EASE_SMOOTH } }
                  : { scale: 1, opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_SMOOTH } }
              }
            >
              {/* Viền chỉ vàng hồng mảnh bên trong */}
              <div className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#D69F8E]/40" />

              {/* Hoa Mẫu Đơn Điểm Góc (Bất đối xứng 2 góc chéo) */}
              <img loading="lazy" decoding="async"
                src="/templates/rang-hong-hoang-hon/corner-peony.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-2 left-2 w-14 sm:w-16 object-contain opacity-85 z-10"
              />
              <img loading="lazy" decoding="async"
                src="/templates/rang-hong-hoang-hon/corner-peony.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-2 right-2 w-14 sm:w-16 object-contain opacity-85 -scale-100 z-10"
              />

              {/* Chú bướm nhỏ đậu nhẹ góc trên phải của thẻ */}
              <m.img
                src="/templates/rang-hong-hoang-hon/butterfly-r.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-3 right-4 w-9 sm:w-10 object-contain z-10 opacity-80"
                animate={reduceMotion ? undefined : { scaleX: [1, 0.85, 1], rotate: [0, 4, 0] }}
                transition={reduceMotion ? undefined : { duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              />

              {/* Vòng hoa tròn rỗng tâm wreath-floral.webp lồng Monogram chữ cái đầu ĐỘNG */}
              <div className="relative mt-2 mb-2 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center z-10">
                <img loading="lazy" decoding="async"
                  src="/templates/rang-hong-hoang-hon/wreath-floral.webp"
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-sm"
                />
                <span
                  className="relative z-10 text-lg sm:text-xl font-serif text-[#7E3945] font-semibold italic select-none"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  {monogram}
                </span>
              </div>

              {/* Dòng kính mời tao nhã */}
              <p
                className="relative z-10 text-[11px] uppercase tracking-[0.28em] text-[#D69288] font-semibold mb-2"
                style={{ fontFamily: BODY_FONT }}
              >
                {guestName ? `Gửi Người Thương Mến ${guestName}` : data.ui?.eyebrow || "Gửi Người Thương Mến"}
              </p>

              {/* Tên cặp đôi 3 dòng màu Hồng Mận Hoàng Hôn #7E3945 */}
              <div className="relative z-10 my-1 flex flex-col items-center">
                <h1
                  className="text-2xl sm:text-3xl font-normal text-[#7E3945] tracking-wide"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  <span className="block leading-tight">{groomDisplayName}</span>
                  <span className="block text-[#D69288] text-xl sm:text-2xl my-0.5 font-serif italic">&amp;</span>
                  <span className="block leading-tight">{brideDisplayName}</span>
                </h1>
              </div>

              {/* Dải phân cách hoa hồng đào & cỏ lau */}
              <div className="relative z-10 my-2 w-36 sm:w-44 flex justify-center">
                <img loading="lazy" decoding="async"
                  src="/templates/rang-hong-hoang-hon/divider-roses.webp"
                  alt=""
                  aria-hidden="true"
                  className="w-full object-contain opacity-90"
                />
              </div>

              {/* Lời dẫn thanh tao */}
              <p className="relative z-10 text-xs sm:text-sm text-[#8C686E] max-w-[280px] leading-relaxed mb-6 font-light">
                {data.ui?.heroSubtitle || "Dưới ráng chiều dịu ngọt, mình chung một mái nhà"}
              </p>

              {/* Nút bấm mở thiệp pill màu Hồng Mận */}
              <m.button
                onClick={handleOpenCover}
                disabled={isOpening}
                className="relative z-10 px-8 py-3 rounded-full text-xs sm:text-sm font-serif tracking-widest font-semibold uppercase shadow-lg transition-all cursor-pointer select-none active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #7E3945 0%, #964755 100%)",
                  color: "#FFF7F5",
                  boxShadow: "0 8px 24px rgba(126,57,69,0.28)",
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
          NÚT NHẠC NỀN HOÀNG HÔN (Góc phải màn hình)
          ============================================================ */}
      {!data.hiddenSections?.includes("music") && (
        <LiveMusicFloatingButton
          src={data.music?.src || "/media/moonlight.mp3"}
          visible={coverGone}
          title={data.music?.title || "Khúc Nhạc Ráng Hồng"}
          tone="sunset"
        />
      )}

      {/* ============================================================
          RUỘT THIỆP CHÍNH (Lụa Ráng Hồng & Thẻ Trắng Thanh Tao)
          - Chỉ hiện khi coverGone = true (Chống trôi layout)
          ============================================================ */}
      <div
        className={cn(
          "w-full transition-opacity duration-700",
          !coverGone && "hidden pointer-events-none"
        )}
      >
        <div
          className="relative w-full max-w-[840px] mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-16 md:py-20 flex flex-col gap-12 sm:gap-16"
          style={{
            backgroundImage:
              viewport === "desktop"
                ? "url(/templates/rang-hong-hoang-hon/background.webp)"
                : "url(/templates/rang-hong-hoang-hon/background-mobile.webp)",
            backgroundSize: "cover",
            backgroundPosition: "top center",
          }}
        >
          {/* ------------------------------------------------------------
              1. HERO: "KHUNG VÒM RÁNG HỒNG" (Lồng Ảnh Cặp Đôi Trong Vòm Hoa)
              (Tuyệt đối KHÔNG lặp lại ngày cưới tại Hero)
              ------------------------------------------------------------ */}
          <section className="relative w-full rounded-3xl bg-white/94 border border-[#D69F8E]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(126,57,69,0.08)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden pb-16 sm:pb-20">
            <SunsetGlowDust count={10} />

            {/* Hoa Mẫu Đơn Điểm Góc */}
            <img loading="lazy" decoding="async"
              src="/templates/rang-hong-hoang-hon/corner-peony.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute top-3 left-3 w-12 sm:w-16 object-contain opacity-75 z-10"
            />
            <img loading="lazy" decoding="async"
              src="/templates/rang-hong-hoang-hon/corner-peony.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute top-3 right-3 w-12 sm:w-16 object-contain opacity-75 -scale-x-100 z-10"
            />

            {/* Vòng hoa monogram thu nhỏ ở đỉnh */}
            <div className="relative mb-3 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center z-10">
              <img loading="lazy" decoding="async"
                src="/templates/rang-hong-hoang-hon/wreath-floral.webp"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />
              <span
                className="relative z-10 text-sm sm:text-base font-serif text-[#7E3945] font-semibold italic"
                style={{ fontFamily: TITLE_FONT }}
              >
                {monogram}
              </span>
            </div>

            <p
              className="text-[11px] uppercase tracking-[0.16em] text-[#D69288] font-semibold mb-2 z-10"
              style={{ fontFamily: BODY_FONT }}
            >
              {data.ui?.eyebrow || "Thiệp mời tham dự lễ cưới"}
            </p>

            <h2
              className="text-2xl sm:text-3xl md:text-4xl text-[#7E3945] font-normal tracking-wide my-1 z-10"
              style={{ fontFamily: TITLE_FONT }}
            >
              <span className="block leading-tight">{groomDisplayName}</span>
              <span className="block text-[#D69288] text-xl sm:text-2xl my-0.5 font-serif italic">&amp;</span>
              <span className="block leading-tight">{brideDisplayName}</span>
            </h2>

            <div className="w-36 sm:w-44 my-3 flex justify-center z-10">
              <img loading="lazy" decoding="async"
                src="/templates/rang-hong-hoang-hon/divider-roses.webp"
                alt=""
                aria-hidden="true"
                className="w-full object-contain opacity-85"
              />
            </div>

            <p className="text-xs sm:text-sm text-[#8C686E] max-w-[420px] leading-relaxed font-light mb-6 z-10 italic">
              &ldquo;Dưới ráng chiều dịu ngọt, mình nắm tay nhau đi qua giông bão để cùng xây một mái nhà.&rdquo;
            </p>

            {/* KHUNG VÒM HOA HOÀNG HÔN sunset-arch.webp ÔM ẢNH CẶP ĐÔI */}
            <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[360px] aspect-[440/575] flex items-center justify-center z-10">
              {/* Lớp ảnh cặp đôi lồng trong vòm */}
              <div className="absolute left-[18%] right-[18%] top-[2.5%] bottom-[16%] rounded-t-full overflow-hidden shadow-sm z-10 bg-[#F5E6E8]">
                <img loading="lazy" decoding="async"
                  src={heroPhotoUrl}
                  alt={`${groomDisplayName} & ${brideDisplayName}`}
                  className="w-full h-full object-cover object-top transition-transform duration-700 hover:scale-105"
                />
              </div>

              {/* Lớp khung vòm hoa hoàng hôn úp lên trên viền ảnh */}
              <img loading="lazy" decoding="async"
                src="/templates/rang-hong-hoang-hon/sunset-arch.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 w-full h-full object-contain z-20 drop-shadow-md"
              />
            </div>

            {/* Cánh bướm bay nhẹ ở góc đáy vòm */}
            <m.img
              src="/templates/rang-hong-hoang-hon/butterfly-r.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-4 right-6 w-10 sm:w-12 object-contain opacity-75 z-20"
              animate={reduceMotion ? undefined : { y: [0, -8, 0], x: [0, -4, 0] }}
              transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </section>

          {/* ============================================================
              FLEX ORDERED CONTAINER (Hỗ trợ sectionOrder và hiddenSections)
              ============================================================ */}
          <div className="flex flex-col gap-12 sm:gap-16 w-full">
            {/* ------------------------------------------------------------
                2. LỊCH NGÀY HẠNH PHÚC & ĐẾM NGƯỢC (calendar — VỊ TRÍ NGÀY CƯỚI #1)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("calendar") && (
              <div style={{ order: orderOf("calendar") }}>
                <section className="relative w-full rounded-3xl bg-white/94 border border-[#D69F8E]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(126,57,69,0.08)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <CalendarIcon className="w-8 h-8 text-[#D69288] mb-2" />
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[#D69288] font-semibold mb-2"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Chờ Ngày Chung Đôi
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl text-[#7E3945] font-normal mb-3"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Lịch Ngày Hạnh Phúc
                  </h3>

                  <div className="w-28 sm:w-36 mb-6 flex justify-center">
                    <img loading="lazy" decoding="async"
                      src="/templates/rang-hong-hoang-hon/divider-roses.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain"
                    />
                  </div>

                  {/* 4 Ô đếm ngược bo mềm */}
                  {mounted && (
                    <div className="grid grid-cols-4 gap-2 sm:gap-4 w-full max-w-[420px] mb-8">
                      <div className="p-3 sm:p-4 rounded-2xl bg-[#FFF7F5] border border-[#D69F8E]/40 shadow-sm flex flex-col items-center">
                        <span className="text-xl sm:text-2xl font-bold text-[#7E3945] font-mono">
                          {timeLeft.days}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#8C686E] uppercase mt-1">
                          Ngày
                        </span>
                      </div>
                      <div className="p-3 sm:p-4 rounded-2xl bg-[#FFF7F5] border border-[#D69F8E]/40 shadow-sm flex flex-col items-center">
                        <span className="text-xl sm:text-2xl font-bold text-[#7E3945] font-mono">
                          {timeLeft.hours}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#8C686E] uppercase mt-1">
                          Giờ
                        </span>
                      </div>
                      <div className="p-3 sm:p-4 rounded-2xl bg-[#FFF7F5] border border-[#D69F8E]/40 shadow-sm flex flex-col items-center">
                        <span className="text-xl sm:text-2xl font-bold text-[#7E3945] font-mono">
                          {timeLeft.minutes}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#8C686E] uppercase mt-1">
                          Phút
                        </span>
                      </div>
                      <div className="p-3 sm:p-4 rounded-2xl bg-[#FFF7F5] border border-[#D69F8E]/40 shadow-sm flex flex-col items-center">
                        <span className="text-xl sm:text-2xl font-bold text-[#7E3945] font-mono">
                          {timeLeft.seconds}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#8C686E] uppercase mt-1">
                          Giây
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Lưới lịch tháng — Trái tim hồng mận #7E3945 nhịp đập đánh dấu ngày cưới */}
                  <div className="w-full max-w-[380px] p-5 rounded-2xl bg-[#FFF7F5] border border-[#D69F8E]/40 shadow-sm">
                    <p className="text-sm font-bold text-[#7E3945] uppercase tracking-wider mb-4">
                      {calendarData.monthYear}
                    </p>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#8C686E] mb-2">
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
                        const isWeddingDay = calendarData.eventDays.has(day);
                        return (
                          <div
                            key={`day-${day}`}
                            className={cn(
                              "relative h-8 w-8 mx-auto flex items-center justify-center rounded-full font-medium transition-colors",
                              isWeddingDay
                                ? "bg-[#7E3945] text-white font-bold shadow-md ring-2 ring-[#D69288]"
                                : "text-[#694349] hover:bg-[#D69288]/15"
                            )}
                          >
                            {day}
                            {isWeddingDay && (
                              <m.div
                                className="absolute -top-1 -right-1"
                                animate={reduceMotion ? undefined : { scale: [1, 1.25, 1] }}
                                transition={reduceMotion ? undefined : { duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                              >
                                <Heart className="w-3 h-3 fill-[#7E3945] text-[#7E3945]" />
                              </m.div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                3. BẢN ĐỒ & ĐỊA ĐIỂM (map)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("map") && (
              <div style={{ order: orderOf("map") }}>
                <section className="relative w-full rounded-3xl bg-white/94 border border-[#D69F8E]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(126,57,69,0.08)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <MapPin className="w-8 h-8 text-[#D69288] mb-2" />
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[#D69288] font-semibold mb-2"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Chỉ Đường Đến Tiệc Cưới
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl text-[#7E3945] font-normal mb-3"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Địa Điểm Tổ Chức
                  </h3>

                  <div className="w-28 sm:w-36 mb-6 flex justify-center">
                    <img loading="lazy" decoding="async"
                      src="/templates/rang-hong-hoang-hon/divider-roses.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain"
                    />
                  </div>

                  <div className={`w-full ${visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl" : "flex flex-col items-center max-w-xl mx-auto"}`}>
                    {visibleEvents.map((evt, idx) => {
                      const directionsUrl = getEventDirectionsUrl(evt);
                      return (
                        <div key={evt.id || idx} className="w-full p-5 sm:p-6 rounded-2xl bg-[#FFF7F5] border border-[#D69F8E]/35 shadow-sm flex flex-col items-center text-center justify-between">
                          <div>
                            <span className="inline-block px-3 py-1 rounded-full text-[10px] tracking-widest font-semibold border border-[#D69F8E]/40 bg-[#D69F8E]/10 text-[#7E3945] uppercase mb-2">
                              {evt.title || "Lễ Thành Hôn"}
                            </span>
                            <p className="text-base sm:text-lg font-bold text-[#7E3945] mb-1">
                              {evt.venueName || "Trung Tâm Hội Nghị Tiệc Cưới Ráng Hồng"}
                            </p>
                            <p className="text-xs sm:text-sm text-[#8C686E] max-w-[420px] mb-4">
                              {evt.venueAddress || "456 Đại Lộ Hoàng Hôn, Quận 1, TP. Hồ Chí Minh"}
                            </p>
                          </div>
                          {directionsUrl && (
                            <a
                              href={directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all shadow-md active:scale-95"
                              style={{
                                background: "linear-gradient(135deg, #7E3945 0%, #964755 100%)",
                                color: "#FFF7F5",
                                boxShadow: "0 6px 18px rgba(126,57,69,0.22)",
                              }}
                            >
                              <MapPin className="w-4 h-4 text-[#F5DDD8]" />
                              <span>Xem Bản Đồ Google Maps</span>
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                4. HAI GIA ĐÌNH CHUNG VUI, CHÂN DUNG ĐÔI & LỄ THÀNH HÔN (family — VỊ TRÍ NGÀY CƯỚI #2)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("family") && (
              <div style={{ order: orderOf("family") }}>
                <section className="relative w-full rounded-3xl bg-white/94 border border-[#D69F8E]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(126,57,69,0.08)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[#D69288] font-semibold mb-2"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Hai Gia Đình Chung Vui
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl text-[#7E3945] font-normal mb-3"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Trong Niềm Hân Hoan Của Hai Gia Đình
                  </h3>

                  <div className="w-28 sm:w-36 mb-8 flex justify-center">
                    <img loading="lazy" decoding="async"
                      src="/templates/rang-hong-hoang-hon/divider-roses.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain"
                    />
                  </div>

                  {/* 2 Cột Gia Đình bằng nhau */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 w-full max-w-[620px] mb-10 items-stretch">
                    {/* Nhà Trai */}
                    <div className="h-full flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#FFF7F5] border border-[#D69F8E]/35 shadow-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest text-[#7E3945] font-bold mb-2">
                          Nhà Trai
                        </span>
                        <div className="text-sm sm:text-base font-semibold text-[#694349] leading-relaxed">
                          {groomParentsList.map((name, i) => (
                            <p key={i}>{name}</p>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#D69F8E]/25 flex flex-col items-center">
                        <span className="text-xs text-[#8C686E] italic">
                          {data.couple?.groomTitle || "Trưởng Nam"}
                        </span>
                        <h4
                          className="text-lg sm:text-xl text-[#7E3945] font-bold mt-1"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {groomFullName}
                        </h4>
                      </div>
                    </div>

                    {/* Nhà Gái */}
                    <div className="h-full flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#FFF7F5] border border-[#D69F8E]/35 shadow-sm">
                      <div className="flex flex-col items-center">
                        <span className="text-xs uppercase tracking-widest text-[#7E3945] font-bold mb-2">
                          Nhà Gái
                        </span>
                        <div className="text-sm sm:text-base font-semibold text-[#694349] leading-relaxed">
                          {brideParentsList.map((name, i) => (
                            <p key={i}>{name}</p>
                          ))}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#D69F8E]/25 flex flex-col items-center">
                        <span className="text-xs text-[#8C686E] italic">
                          {data.couple?.brideTitle || "Ái Nữ"}
                        </span>
                        <h4
                          className="text-lg sm:text-xl text-[#7E3945] font-bold mt-1"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {brideFullName}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {/* 2 THẺ CHÂN DUNG ĐÔI TRONG KHUNG CHÂN DUNG portrait-frame.webp (couple: true) */}
                  <div className="w-full max-w-[620px] mb-10">
                    <p
                      className="text-[11px] uppercase tracking-[0.2em] text-[#D69288] font-semibold mb-4"
                      style={{ fontFamily: BODY_FONT }}
                    >
                      Đôi Uyên Ương
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                      {/* Chân dung Chú Rể */}
                      <div className="flex flex-col items-center p-4 rounded-2xl bg-[#FFF7F5] border border-[#D69F8E]/30">
                        <div className="relative w-48 sm:w-52 aspect-[400/567] flex items-center justify-center overflow-hidden mb-3">
                          <div className="w-[84%] h-[84%] rounded-xl overflow-hidden shadow-sm">
                            <img loading="lazy" decoding="async"
                              src={groomPortraitUrl}
                              alt={groomDisplayName}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                          </div>
                          <img loading="lazy" decoding="async"
                            src="/templates/rang-hong-hoang-hon/portrait-frame.webp"
                            alt=""
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 w-full h-full object-contain drop-shadow-sm z-10"
                          />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-[#D69288] font-semibold">
                          Chàng
                        </span>
                        <h5
                          className="text-base sm:text-lg font-bold text-[#7E3945] mt-0.5"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {groomDisplayName}
                        </h5>
                      </div>

                      {/* Chân dung Cô Dâu */}
                      <div className="flex flex-col items-center p-4 rounded-2xl bg-[#FFF7F5] border border-[#D69F8E]/30">
                        <div className="relative w-48 sm:w-52 aspect-[400/567] flex items-center justify-center overflow-hidden mb-3">
                          <div className="w-[84%] h-[84%] rounded-xl overflow-hidden shadow-sm">
                            <img loading="lazy" decoding="async"
                              src={bridePortraitUrl}
                              alt={brideDisplayName}
                              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                            />
                          </div>
                          <img loading="lazy" decoding="async"
                            src="/templates/rang-hong-hoang-hon/portrait-frame.webp"
                            alt=""
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 w-full h-full object-contain drop-shadow-sm z-10"
                          />
                        </div>
                        <span className="text-xs uppercase tracking-wider text-[#D69288] font-semibold">
                          Nàng
                        </span>
                        <h5
                          className="text-base sm:text-lg font-bold text-[#7E3945] mt-0.5"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {brideDisplayName}
                        </h5>
                      </div>
                    </div>
                  </div>

                  {/* VỊ TRÍ NGÀY CƯỚI #2: KHỐI LỄ THÀNH HÔN CHÍNH THỨC */}
                  <div className={`w-full ${visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl" : "max-w-[560px]"}`}>
                    {visibleEvents.map((evt, idx) => {
                      const evtParts = formatWeddingDateParts(evt.startsAt);
                      const evtLunar = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : "Ngày Hoàng Đạo Cát Khánh";
                      return (
                        <div key={evt.id || idx} className="w-full p-6 rounded-2xl bg-gradient-to-br from-[#7E3945] to-[#5E2731] text-[#FFF7F5] border border-[#D69F8E]/50 shadow-lg flex flex-col items-center justify-between text-center">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.25em] text-[#F5DDD8] font-semibold mb-2">
                              {evt.title || "Lễ Thành Hôn"} Cử Hành Vào Lúc
                            </p>
                            <p
                              className="text-2xl sm:text-3xl font-bold text-[#FFF7F5] mb-1"
                              style={{ fontFamily: TITLE_FONT }}
                            >
                              {evtParts.time || "17:30"}
                            </p>
                            <p className="text-base sm:text-lg text-[#F5DDD8] font-medium mb-1">
                              {evtParts.weekday || "Thứ Bảy"}, Ngày {evtParts.day} Tháng {evtParts.month} Năm {evtParts.year}
                            </p>
                            <p className="text-xs sm:text-sm text-[#F5DDD8]/80 italic font-light">
                              (Tức {evtLunar})
                            </p>
                          </div>
                          <div className="mt-4 pt-4 border-t border-[#D69F8E]/30 w-full text-center">
                            <p className="text-xs sm:text-sm text-[#F5DDD8]">
                              Địa điểm: <strong className="text-white">{evt.venueName || "Trung Tâm Hội Nghị Tiệc Cưới Ráng Hồng"}</strong>
                            </p>
                            {evt.venueAddress && (
                              <p className="text-[11px] sm:text-xs text-[#F5DDD8]/80 mt-0.5">
                                {evt.venueAddress}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                5. DRESS CODE & LỊCH TRÌNH (dresscode)
                (TUYỆT ĐỐI KHÔNG IN MÃ HEX LÊN UI)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("dresscode") && (
              <div style={{ order: orderOf("dresscode") }}>
                <section className="relative w-full rounded-3xl bg-white/94 border border-[#D69F8E]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(126,57,69,0.08)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[#D69288] font-semibold mb-2"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Khoảnh Khắc Ngày Chung Vui
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl text-[#7E3945] font-normal mb-3"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Lịch Trình &amp; Trang Phục
                  </h3>

                  <div className="w-28 sm:w-36 mb-6 flex justify-center">
                    <img loading="lazy" decoding="async"
                      src="/templates/rang-hong-hoang-hon/divider-roses.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain"
                    />
                  </div>

                  {/* Lịch trình hôn lễ (Timeline) */}
                  <div className="w-full max-w-[520px] flex flex-col gap-4 text-left mb-8">
                    {getTimeline(data).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-4 p-4 rounded-xl bg-[#FFF7F5] border border-[#D69F8E]/30"
                      >
                        <div className="px-3 py-1.5 rounded-lg bg-[#7E3945] text-[#FFF7F5] text-xs font-bold font-mono shrink-0 shadow-sm">
                          {item.time}
                        </div>
                        <div className="text-xs sm:text-sm text-[#694349] font-medium leading-relaxed pt-0.5">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p
                    className="text-[11px] uppercase tracking-[0.2em] text-[#D69288] font-semibold mb-3"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Trang Phục Gợi Ý
                  </p>

                  {/* 3 Ô Màu Dress Code TRỰC QUAN (TUYỆT ĐỐI KHÔNG IN MÃ HEX HOẶC TÊN MÀU!) */}
                  <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-4">
                    {DEFAULT_DRESS.map((item, idx) => (
                      <div
                        key={idx}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-md border-2 border-[#D69F8E]/60 flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: item.hex }}
                      >
                        {item.hex === "#FAF5F2" && (
                          <div className="w-3 h-3 rounded-full bg-[#7E3945]/20" />
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-[#8C686E] max-w-[420px] italic sr-only">
                    Bảng màu gợi ý
                  </p>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                6. GÓC NHỎ LƯU GIỮ THANH XUÂN (album + albumQr)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <div style={{ order: orderOf("album") }}>
                <section className="relative w-full rounded-3xl bg-white/94 border border-[#D69F8E]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(126,57,69,0.08)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <SunsetGlowDust count={8} />
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[#D69288] font-semibold mb-2 z-10"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Góc Nhỏ Lưu Giữ Thanh Xuân
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl text-[#7E3945] font-normal mb-3 z-10"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Album Kỷ Niệm
                  </h3>

                  <div className="w-28 sm:w-36 mb-6 flex justify-center z-10">
                    <img loading="lazy" decoding="async"
                      src="/templates/rang-hong-hoang-hon/divider-roses.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain opacity-85"
                    />
                  </div>

                  {/* Carousel ảnh chính */}
                  <div className="relative w-full max-w-[580px] aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden border border-[#D69F8E]/50 shadow-xl z-10 group">
                    <img loading="lazy" decoding="async"
                      src={albumPhotos[activePhotoIdx]?.url || heroPhotoUrl}
                      alt={albumPhotos[activePhotoIdx]?.alt || "Ảnh cưới"}
                      className="w-full h-full object-cover cursor-pointer transition-transform duration-500 group-hover:scale-105"
                      onClick={() => setLightboxIndex(activePhotoIdx)}
                    />

                    {albumPhotos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePhotoIdx((prev) => (prev - 1 + albumPhotos.length) % albumPhotos.length);
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 text-[#7E3945] border border-[#D69F8E]/50 flex items-center justify-center hover:bg-white/90 transition-colors shadow-md"
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/70 text-[#7E3945] border border-[#D69F8E]/50 flex items-center justify-center hover:bg-white/90 transition-colors shadow-md"
                          aria-label="Ảnh sau"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}

                    <div className="pointer-events-none absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/80 text-[11px] text-[#7E3945] font-mono border border-[#D69F8E]/40 shadow-sm">
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
                            "relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer",
                            activePhotoIdx === idx
                              ? "border-[#7E3945] scale-105 shadow-md"
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
                </section>
              </div>
            )}

            {/* Guest Album QR (albumQr) */}
            {!hiddenSections.has("albumQr") && data.plan !== "free" && weddingSlug && (
              <div style={{ order: orderOf("albumQr") }}>
                <section className="relative w-full rounded-3xl bg-white/94 border border-[#D69F8E]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(126,57,69,0.08)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <GuestAlbumQr
                    slug={weddingSlug}
                    accentColor="#7E3945"
                    textColor="#694349"
                    mutedColor="#8C686E"
                  />
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                7. HỘP QUÀ HOÀNG HÔN 3 TRẠNG THÁI (gift)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("gift") && (
              <div style={{ order: orderOf("gift") }}>
                <section className="relative w-full rounded-3xl bg-white/94 border border-[#D69F8E]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(126,57,69,0.08)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <SunsetGlowDust count={8} />
                  <Heart className="w-8 h-8 text-[#D69288] mb-2 z-10" />
                  <p
                    className="text-[11px] uppercase tracking-[0.25em] text-[#D69288] font-semibold mb-2 z-10"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    Gửi Trao Yêu Thương
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl text-[#7E3945] font-normal mb-3 z-10"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hộp Mừng Cưới Hoàng Hôn
                  </h3>

                  <div className="w-28 sm:w-36 mb-6 flex justify-center z-10">
                    <img loading="lazy" decoding="async"
                      src="/templates/rang-hong-hoang-hon/divider-roses.webp"
                      alt=""
                      aria-hidden="true"
                      className="w-full object-contain opacity-85"
                    />
                  </div>

                  <p className="text-xs sm:text-sm text-[#8C686E] max-w-[420px] leading-relaxed mb-6 font-light z-10">
                    Sự hiện diện và nụ cười của bạn là món quà trân quý nhất với chúng mình.
                  </p>

                  {/* Giỏ quà hoàng hôn 3 trạng thái tương tác */}
                  <div className="relative my-2 flex justify-center z-10">
                    <button
                      type="button"
                      onClick={() => setGiftModalOpen(true)}
                      onMouseEnter={() => setActiveParcel("hover")}
                      onMouseLeave={() => setActiveParcel("normal")}
                      onMouseDown={() => setActiveParcel("active")}
                      onMouseUp={() => setActiveParcel("hover")}
                      className="relative w-56 sm:w-64 aspect-[320/350] flex items-end justify-center cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7E3945]"
                      aria-label="Mở hộp mừng cưới"
                    >
                      <img loading="lazy" decoding="async"
                        src="/templates/rang-hong-hoang-hon/gift-normal.webp"
                        alt="Hộp mừng cưới"
                        className={cn(
                          "absolute inset-0 w-full h-full object-contain transition-opacity duration-300",
                          activeParcel === "normal" ? "opacity-100" : "opacity-0"
                        )}
                      />

                      <img loading="lazy" decoding="async"
                        src="/templates/rang-hong-hoang-hon/gift-hover.webp"
                        alt="Hộp mừng cưới hé nắp"
                        className={cn(
                          "absolute inset-0 w-full h-full object-contain transition-opacity duration-300",
                          activeParcel === "hover" ? "opacity-100" : "opacity-0"
                        )}
                      />

                      <img loading="lazy" decoding="async"
                        src="/templates/rang-hong-hoang-hon/gift-active.webp"
                        alt="Hộp mừng cưới mở nắp trao thiệp"
                        className={cn(
                          "absolute inset-0 w-full h-full object-contain transition-opacity duration-300",
                          activeParcel === "active" ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGiftModalOpen(true)}
                    className="z-10 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold tracking-wider uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                    style={{
                      background: "linear-gradient(135deg, #7E3945 0%, #964755 100%)",
                      color: "#FFF7F5",
                      boxShadow: "0 6px 18px rgba(126,57,69,0.25)",
                    }}
                  >
                    Gửi Quà Mừng
                  </button>
                </section>
              </div>
            )}

            {/* ------------------------------------------------------------
                8. ĐÔI LỜI NHẮN GỬI & HỒI ĐÁP (rsvp — ĐỒNG BỘ THEME 100%)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("rsvp") && (
              <div style={{ order: orderOf("rsvp") }}>
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="sunset"
                  customTheme={{
                    isDark: false,
                    wrap: "bg-white/94 border-[#D69F8E]/40 text-[#694349] shadow-[0_16px_40px_rgba(126,57,69,0.08)] backdrop-blur-md rounded-3xl",
                    card: "bg-[#FFF7F5] border border-[#D69F8E]/30 text-[#694349]",
                    eyebrow: "text-[#D69288] tracking-[0.25em] uppercase font-semibold text-[11px]",
                    heading: "text-[#7E3945] font-serif text-2xl sm:text-3xl",
                    subtext: "text-[#8C686E] text-xs sm:text-sm",
                    input: "bg-white border-[#D69F8E]/50 text-[#694349] placeholder:text-[#8C686E]/40 focus:border-[#7E3945] focus:ring-1 focus:ring-[#7E3945]",
                    primaryBtn: "bg-gradient-to-r from-[#7E3945] to-[#964755] text-white font-semibold hover:opacity-95 shadow-md",
                    outlineBtn: "border-[#7E3945] text-[#7E3945] hover:bg-[#7E3945]/10",
                    optionBg: "#FFF7F5",
                    optionColor: "#7E3945",
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
          <footer className="w-full flex flex-col items-center text-center pt-8 pb-12 mt-4 text-[#694349]">
            <div className="w-16 h-16 mb-2 flex items-center justify-center opacity-85">
              <img loading="lazy" decoding="async"
                src="/templates/rang-hong-hoang-hon/wreath-floral.webp"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>
            <h4
              className="text-xl sm:text-2xl text-[#7E3945] font-normal mb-2"
              style={{ fontFamily: TITLE_FONT }}
            >
              Chân Thành Cảm Tạ
            </h4>
            <div className="w-24 sm:w-32 my-1 flex justify-center">
              <img loading="lazy" decoding="async"
                src="/templates/rang-hong-hoang-hon/divider-roses.webp"
                alt=""
                aria-hidden="true"
                className="w-full object-contain opacity-75"
              />
            </div>
            <p className="text-xs sm:text-sm text-[#8C686E] max-w-[380px] leading-relaxed font-light mb-4">
              Sự hiện diện và lời chúc phúc của quý khách là niềm hạnh phúc đong đầy cho ngày chung đôi của chúng mình.
            </p>
            <p className="text-[11px] text-[#D69288] tracking-widest uppercase font-mono">
              {groomDisplayName} &amp; {brideDisplayName} • 2027
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
        onClose={() => setGiftModalOpen(false)}
        gift={data.gift}
        plan={data.plan}
        coupleName={`${groomDisplayName} & ${brideDisplayName}`}
        guestName={guestName}
        tone="sunset"
      />
    </div>
  );
}
