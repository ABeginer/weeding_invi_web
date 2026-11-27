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
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingEvent, WeddingPlan } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: LAM TÚ NGỌC SƯƠNG (lam-tu-ngoc-suong)
   - Xanh Lam Hoàng Gia (Royal Sapphire Navy): #14325C (sâu #0C2140, hover #1F4A84)
   - Xanh Tú Cầu Sương (Dusty Hydrangea Periwinkle): #4E74A6 (nhạt #BBD0EA)
   - Sứ Ngọc Trai Mờ (Frosted Pearl Porcelain): rgba(248, 251, 255, 0.90) (fallback #F4F8FD, thẻ nổi #FFFFFF)
   - Bạc Ngọc Trai (Luminous Pearl Silver): #C4D2E3 (sáng #E9F0F8)
   - Chữ trên thẻ sứ: #14325C (tiêu đề) / #335075 (nội dung, WCAG AAA)
   - Dress Code mặc định: #14325C (Xanh lam hoàng gia), #7BA1D1 (Xanh tú cầu), #F4F7FB (Trắng ngọc trai)
   ============================================================ */

const NAVY_ROYAL = "#14325C";
const NAVY_DEEP = "#0C2140";
const NAVY_HOVER = "#1F4A84";

const PERIWINKLE_MIST = "#4E74A6";
const PERIWINKLE_LIGHT = "#BBD0EA";
const SILVER_PEARL = "#C4D2E3";
const SILVER_BRIGHT = "#E9F0F8";

const PORCELAIN_BG = "rgba(248, 251, 255, 0.92)";
const PORCELAIN_CARD = "#FFFFFF";

const TEXT_TITLE = "#14325C";
const TEXT_BODY = "#335075";
const TEXT_MUTED = "#6B88AE";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_PEARL = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "16:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm" },
  { time: "17:30", label: "Nghi lễ Khai Hoa trao lời hẹn ước trăm năm" },
  { time: "18:00", label: "Khai tiệc mừng uyên ương & Nâng ly chúc phúc" },
  { time: "19:30", label: "Vũ điệu tình yêu & Những thanh âm lãng mạn" },
  { time: "20:30", label: "Tiễn khách & Trao quà cảm tạ tri ân" },
];

const DEFAULT_DRESS = ["#14325C", "#7BA1D1", "#F4F7FB"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Hạt Sương Pha Lê Rơi Chậm
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function CrystalDewFalling({ count = 14 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 17) % 92 + 4}%`,
      size: (idx % 3) + 2.5,
      duration: 9 + (idx % 4) * 2,
      delay: (idx * 0.6) % 4.5,
      yOffset: 30 + (idx % 4) * 20,
      isSilver: idx % 2 === 0,
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
            top: "-5%",
            width: p.size,
            height: p.size * 1.3,
            background: p.isSilver
              ? "radial-gradient(ellipse, #E9F0F8 0%, rgba(196,210,227,0.4) 65%, transparent 100%)"
              : "radial-gradient(ellipse, #FFFFFF 0%, rgba(187,208,234,0.3) 60%, transparent 100%)",
            boxShadow: "0 0 6px 1.5px rgba(196,210,227,0.35)",
          }}
          animate={{
            y: [0, 450, 950],
            x: [0, p.id % 2 === 0 ? 12 : -12, 0],
            opacity: [0, 0.85, 0],
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
   COMPONENT CHÍNH: LAM TÚ NGỌC SƯƠNG
   ============================================================ */
export function LamTuNgocSuongTemplate({
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

  // Preload 3 trạng thái hộp mừng cưới pha lê
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p1 = new Image();
    p1.src = "/templates/lam-tu-ngoc-suong/gift-normal.webp";
    const p2 = new Image();
    p2.src = "/templates/lam-tu-ngoc-suong/gift-hover.webp";
    const p3 = new Image();
    p3.src = "/templates/lam-tu-ngoc-suong/gift-active.webp";
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
  const lunarClean = targetEvent?.lunarDate ? formatLunarDateClean(targetEvent.lunarDate) : "";

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

  // Ảnh Vòm Pha Lê Hero
  const heroPhotoUrl = data.photos?.heroUrl || "/photos/hero2.webp";

  // Lọc album ảnh cưới
  const isFree = (data.plan ?? "free") === "free";
  const rawAlbum = data.photos?.gallery || [];
  const albumPhotos = isFree ? rawAlbum.slice(0, 5) : rawAlbum;
  const [activePhotoIdx, setActivePhotoIdx] = React.useState<number>(0);

  // Timeline & Dress code
  const timelineItems = getTimeline(data);
  const dressColors = getDressColors(data);

  // Tách tên phụ huynh tại dấu &
  const splitParents = React.useCallback((text?: string | null) => {
    if (!text) return [];
    return text
      .split("&")
      .map((s) => s.trim())
      .filter(Boolean);
  }, []);

  const groomParentsList = splitParents(data.couple?.groomParents);
  const brideParentsList = splitParents(data.couple?.brideParents);

  // Đếm ngược ngày cưới (Hydration safe)
  const [countdown, setCountdown] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  React.useEffect(() => {
    if (!mounted) return;
    const target = new Date(eventDateStr).getTime();
    if (isNaN(target)) return;

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [mounted, eventDateStr]);

  // Lịch tháng vintage trên thẻ sứ
  const calendarGrid = React.useMemo(() => {
    const d = new Date(eventDateStr);
    if (isNaN(d.getTime())) return { days: [], currentDay: 1, monthYear: "" };

    const year = d.getFullYear();
    const month = d.getMonth();
    const currentDay = d.getDate();

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Thứ 2 = 0
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let i = 1; i <= totalDays; i++) cells.push(i);

    const monthYear = `THÁNG ${month + 1} • ${year}`;
    return { days: cells, currentDay, monthYear };
  }, [eventDateStr]);

  // Bộ điều khiển âm nhạc góc màn hình
  const renderMusicControl = () => {
    if (externalMusicControl || !data.music?.src || data.hiddenSections?.includes("music")) return null;
    return (
      <LiveMusicFloatingButton
        src={data.music.src}
        title={data.music.title || "Giai điệu Sương Ngọc"}
        visible={openState}
        tone="flowery"
      />
    );
  };

  // Thứ tự hiển thị các khối section
  const sectionOrder = data.sectionOrder?.length
    ? data.sectionOrder
    : CANONICAL_SECTION_ORDER;
  const hiddenSections = new Set(data.hiddenSections ?? []);

  const orderOf = (key: string) => {
    const idx = sectionOrder.indexOf(key);
    return idx === -1 ? 99 : idx;
  };

  const coupleDisplayName = `${data.couple?.groomName ?? "Chú Rể"} & ${data.couple?.brideName ?? "Cô Dâu"}`;

  return (
    <div
      className={cn(
        "relative w-full text-[#335075] selection:bg-[#14325C] selection:text-white",
        contained ? "h-full overflow-y-auto" : "min-h-screen",
        !coverGone && (contained ? "h-full overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden")
      )}
      style={{
        backgroundColor: "#F4F8FD",
        fontFamily: BODY_FONT,
      }}
    >
      {/* ============================================================
          MÀN HÌNH BÌA MỞ THIỆP — "SƯƠNG NGỌC KHAI HOA"
          ============================================================ */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            key="porcelain-cover"
            className={cn(
              "absolute inset-0 z-50 w-full max-w-full overflow-hidden flex flex-col items-center justify-center px-4 py-4 sm:px-6 select-none",
              contained ? "h-full" : "h-screen-dvh"
            )}
            style={{
              backgroundImage: viewport === "desktop" ? "url(/templates/lam-tu-ngoc-suong/background.webp)" : "url(/templates/lam-tu-ngoc-suong/background-mobile.webp)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.6, ease: EASE_PEARL } }}
          >
            {/* Hạt sương pha lê rơi chậm */}
            <CrystalDewFalling count={16} />

            {/* Thẻ Sứ Ngọc Trai Mờ Trung Tâm */}
            <m.div
              className="relative w-full max-w-[328px] sm:max-w-[380px] mx-auto my-auto flex flex-col items-center text-center rounded-3xl p-6 sm:p-8 shadow-[0_24px_64px_rgba(20,50,92,0.18)] border border-[#C4D2E3]/90 backdrop-blur-md"
              style={{ backgroundColor: PORCELAIN_BG }}
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={
                isOpening
                  ? { scale: 1.03, opacity: 0, y: -25, transition: { duration: 0.65, ease: EASE_PEARL } }
                  : { scale: 1, opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_PEARL } }
              }
            >
              {/* Viền chỉ bạc kép lồng bên trong */}
              <div className="pointer-events-none absolute inset-2.5 rounded-2xl border border-dashed border-[#C4D2E3]/60" />

              {/* Hoa tú cầu góc bất đối xứng trên-trái & dưới-phải (180deg, z-10) */}
              <img loading="lazy" decoding="async"
                src="/templates/lam-tu-ngoc-suong/corner-hydrangea.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -top-3 -left-3 w-16 sm:w-20 object-contain drop-shadow-sm z-10"
              />
              <img loading="lazy" decoding="async"
                src="/templates/lam-tu-ngoc-suong/corner-hydrangea.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-3 -right-3 w-16 sm:w-20 object-contain drop-shadow-sm rotate-180 z-10"
              />

              {/* Lớp nội dung thẻ (relative z-20: 100% sắc nét) */}
              {/* Con dấu sáp pha lê bạc wax-seal.webp ở đỉnh */}
              <div className="relative z-20 mt-2 mb-3 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                <div
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle, rgba(196,210,227,0.4) 0%, transparent 70%)",
                    filter: "blur(6px)",
                  }}
                />
                <img loading="lazy" decoding="async"
                  src="/templates/lam-tu-ngoc-suong/wax-seal.webp"
                  alt="Con Dấu Pha Lê Tú Cầu"
                  className="relative z-10 w-full h-full object-contain drop-shadow-md"
                />
              </div>

              {/* Phụ đề phong cách */}
              <p
                className="relative z-20 text-[11px] uppercase tracking-[0.15em] text-[#4E74A6] font-semibold mb-2"
                style={{ fontFamily: BODY_FONT }}
              >
                {data.ui?.eyebrow || "Thiệp mời tham dự lễ cưới"}
              </p>

              {/* Tên cặp đôi 3 dòng Xanh Lam Hoàng Gia #14325C sắc nét */}
              <div className="relative z-20 my-2 flex flex-col items-center">
                <h1
                  className="text-2xl sm:text-3xl font-normal text-[#14325C] tracking-wide"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  <span className="block leading-tight">{data.couple?.groomName || "Minh Quân"}</span>
                  <span className="block text-[#4E74A6] text-xl sm:text-2xl my-1 font-serif italic">&amp;</span>
                  <span className="block leading-tight">{data.couple?.brideName || "Ngọc Sương"}</span>
                </h1>
              </div>

              {/* Dải phân cách hoa tú cầu & hạt ngọc trai */}
              <div className="relative z-20 my-2.5 w-36 sm:w-44 flex justify-center">
                <img loading="lazy" decoding="async"
                  src="/templates/lam-tu-ngoc-suong/divider-pearl.webp"
                  alt=""
                  aria-hidden="true"
                  className="w-full object-contain opacity-85"
                />
              </div>

              {/* Lời trân trọng kính mời */}
              <p
                className="relative z-20 text-[11px] uppercase tracking-[0.22em] text-[#4E74A6] font-semibold mt-1 mb-2"
                style={{ fontFamily: BODY_FONT }}
              >
                {data.ui?.invitePrefix || "Trân Trọng Kính Mời"}
              </p>

              {/* Khối tên khách mời */}
              <div className="relative z-20 my-1.5 px-5 py-2 rounded-xl bg-[#EBF2FA]/80 border border-[#C4D2E3] shadow-inner max-w-[260px]">
                <p className="text-xs sm:text-sm font-semibold text-[#14325C] truncate">
                  {guestName || data.ui?.defaultGuestName || "Quý Khách Quý Mến"}
                </p>
              </div>

              {/* Nút bấm Mở Thiệp */}
              <button
                onClick={handleOpenCard}
                disabled={isOpening}
                className="group relative z-20 mt-5 px-7 py-2.5 rounded-full bg-[#14325C] hover:bg-[#1F4A84] text-[#F8FBFF] border border-[#C4D2E3] shadow-lg flex items-center justify-center text-xs font-serif tracking-[0.2em] font-semibold uppercase transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span>Mở Thiệp</span>
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          RUỘT THIỆP — THẺ SỨ NGỌC TRAI TRÊN NỀN VƯỜN TÚ CẦU PHỦ SƯƠNG
          - Ẩn hoàn toàn (hidden) khi !coverGone để chống trôi màn hình
          ============================================================ */}
      <div
        className={cn(
          "w-full flex flex-col items-center min-h-screen",
          !coverGone && "hidden"
        )}
      >
        {renderMusicControl()}

        <main className="w-full max-w-[840px] px-4 py-8 sm:py-14 flex flex-col gap-12 sm:gap-16">
          {/* ============================================================
              HERO — "VÒM PHA LÊ TÚ CẦU"
              (Không lặp lại ngày cưới tại Hero)
              ============================================================ */}
          <section className="relative w-full flex flex-col items-center text-center pt-4">
            <span
              className="text-[11px] sm:text-xs uppercase tracking-[0.16em] text-[#4E74A6] font-semibold mb-2"
              style={{ fontFamily: BODY_FONT }}
            >
              {data.ui?.eyebrow || "Thiệp mời tham dự lễ cưới"}
            </span>
            {/* subtitle trimmed for clarity */}

            {/* Khung Vòm Pha Lê crystal-arch.webp lồng ảnh uyên ương */}
            <div className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-[580/742] mx-auto my-2 flex items-center justify-center">
              {/* Lớp ảnh cặp đôi nằm bên trong vòm */}
              <div className="absolute inset-x-[14.5%] top-[2.2%] bottom-[12%] rounded-t-[999px] rounded-b-[45%] overflow-hidden shadow-inner">
                {heroPhotoUrl ? (
                  <img loading="lazy" decoding="async"
                    src={heroPhotoUrl}
                    alt="Ảnh cưới uyên ương"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#EBF2FA] flex flex-col items-center justify-center p-6 text-center">
                    <span className="font-serif italic text-2xl text-[#14325C]">{data.couple?.groomName || "Minh Quân"}</span>
                    <span className="text-[#4E74A6] font-serif text-lg my-1">&amp;</span>
                    <span className="font-serif italic text-2xl text-[#14325C]">{data.couple?.brideName || "Ngọc Sương"}</span>
                  </div>
                )}
              </div>

              {/* Khung vòm pha lê tú cầu đè lên ngoài */}
              <img loading="lazy" decoding="async"
                src="/templates/lam-tu-ngoc-suong/crystal-arch.webp"
                alt="Khung Vòm Pha Lê Tú Cầu"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 drop-shadow-xl"
              />
            </div>

            {/* Tên cặp đôi 3 dòng nghệ thuật */}
            <div className="mt-6 flex flex-col items-center">
              <h1
                className="text-3xl sm:text-4xl text-[#14325C] font-normal tracking-wide"
                style={{ fontFamily: TITLE_FONT }}
              >
                <span className="block">{data.couple?.groomFullName || data.couple?.groomName || "Lê Minh Quân"}</span>
                <span className="block text-[#4E74A6] text-2xl sm:text-3xl my-1 font-serif italic">&amp;</span>
                <span className="block">{data.couple?.brideFullName || data.couple?.brideName || "Đặng Ngọc Sương"}</span>
              </h1>
            </div>

            {/* Dải phân cách hoa tú cầu */}
            <div className="w-full max-w-[280px] sm:max-w-[340px] mx-auto mt-6">
              <img loading="lazy" decoding="async"
                src="/templates/lam-tu-ngoc-suong/divider-pearl.webp"
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
                <section className="relative w-full rounded-3xl bg-[#F8FBFF]/94 border border-[#C4D2E3]/90 p-6 sm:p-10 shadow-md backdrop-blur-md overflow-hidden">
                  {/* Hoa tú cầu trang trí góc */}
                  <img loading="lazy" decoding="async"
                    src="/templates/lam-tu-ngoc-suong/corner-hydrangea.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute -top-3 -left-3 w-20 sm:w-24 object-contain pointer-events-none opacity-40"
                  />
                  <img loading="lazy" decoding="async"
                    src="/templates/lam-tu-ngoc-suong/corner-hydrangea.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute -bottom-3 -right-3 w-20 sm:w-24 object-contain pointer-events-none opacity-40 rotate-180"
                  />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-[#4E74A6] font-semibold mb-1">
                      Hai Bên Gia Đình
                    </span>
                    <h2
                      className="text-xl sm:text-2xl text-[#14325C] font-normal mb-6"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Thông Tin Gia Đình
                    </h2>

                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-6 items-stretch">
                      {/* Nhà Trai */}
                      <div className="h-full flex flex-col items-center text-center p-6 rounded-2xl bg-[#FFFFFF] border border-[#C4D2E3]/70 shadow-xs">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-[#4E74A6] font-semibold mb-3">
                          NHÀ TRAI
                        </span>
                        <div className="flex flex-col gap-1 text-sm text-[#335075] mb-4">
                          {groomParentsList.length > 0 ? (
                            groomParentsList.map((p, idx) => (
                              <span key={idx} className="font-medium">
                                {p}
                              </span>
                            ))
                          ) : (
                            <span>Ông Bà Nhà Trai</span>
                          )}
                        </div>
                        <div className="mt-auto pt-3 border-t border-[#C4D2E3]/40 w-full">
                          <span className="text-xs uppercase tracking-wider text-[#6B88AE] block mb-1">
                            {data.couple?.groomTitle || "Chú rể"}
                          </span>
                          <span
                            className="text-lg sm:text-xl text-[#14325C] font-medium"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {data.couple?.groomFullName || data.couple?.groomName || "Lê Minh Quân"}
                          </span>
                        </div>
                      </div>

                      {/* Nhà Gái */}
                      <div className="h-full flex flex-col items-center text-center p-6 rounded-2xl bg-[#FFFFFF] border border-[#C4D2E3]/70 shadow-xs">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-[#4E74A6] font-semibold mb-3">
                          NHÀ GÁI
                        </span>
                        <div className="flex flex-col gap-1 text-sm text-[#335075] mb-4">
                          {brideParentsList.length > 0 ? (
                            brideParentsList.map((p, idx) => (
                              <span key={idx} className="font-medium">
                                {p}
                              </span>
                            ))
                          ) : (
                            <span>Ông Bà Nhà Gái</span>
                          )}
                        </div>
                        <div className="mt-auto pt-3 border-t border-[#C4D2E3]/40 w-full">
                          <span className="text-xs uppercase tracking-wider text-[#6B88AE] block mb-1">
                            {data.couple?.brideTitle || "Cô dâu"}
                          </span>
                          <span
                            className="text-lg sm:text-xl text-[#14325C] font-medium"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {data.couple?.brideFullName || data.couple?.brideName || "Đặng Ngọc Sương"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Section 2: Sự kiện & chỉ đường (map) — ĐA LỄ 100% */}
            {!hiddenSections.has("map") && (
              <div style={{ order: orderOf("map") }}>
                <section className="relative w-full rounded-3xl bg-[#F8FBFF]/94 border border-[#C4D2E3]/90 p-6 sm:p-10 shadow-md backdrop-blur-md flex flex-col items-center text-center">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#4E74A6] font-semibold mb-1">
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
                        : "";
                      const directionsUrl = getEventDirectionsUrl(evt);

                      return (
                        <div
                          key={evt.id || `event-${idx}`}
                          className="rounded-2xl border border-[#C4D2E3] bg-[#EBF2FA]/40 p-5 sm:p-6 flex flex-col items-center text-center space-y-3"
                        >
                          <h2
                            className="text-xl sm:text-2xl text-[#14325C] font-normal"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {evt.title || (idx === 0 ? "Hôn Lễ Thành Hôn" : `Lễ Cưới ${idx + 1}`)}
                          </h2>

                          {/* Thanh ngày ngang THỨ | NGÀY | THÁNG */}
                          <div className="w-full max-w-[380px] my-2 py-2.5 px-4 rounded-xl border border-[#C4D2E3] bg-[#FFFFFF] flex items-center justify-around text-[#14325C]">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase tracking-widest text-[#4E74A6]">Thứ</span>
                              <span className="text-sm sm:text-base font-serif font-bold">{evtDateParts.weekday}</span>
                            </div>
                            <div className="h-6 w-[1px] bg-[#C4D2E3]" />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase tracking-widest text-[#4E74A6]">Ngày</span>
                              <span className="text-xl sm:text-2xl font-serif font-bold text-[#14325C]">{evtDateParts.day}</span>
                            </div>
                            <div className="h-6 w-[1px] bg-[#C4D2E3]" />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase tracking-widest text-[#4E74A6]">Tháng</span>
                              <span className="text-sm sm:text-base font-serif font-bold">{evtDateParts.month}</span>
                            </div>
                            <div className="h-6 w-[1px] bg-[#C4D2E3]" />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase tracking-widest text-[#4E74A6]">Năm</span>
                              <span className="text-sm sm:text-base font-serif font-bold">{evtDateParts.year}</span>
                            </div>
                          </div>

                          {/* Âm lịch */}
                          {evtLunar && (
                            <p className="text-xs text-[#4E74A6] italic">
                              (Nhằm {evtLunar})
                            </p>
                          )}

                          {/* Giờ và địa điểm */}
                          <div className="flex flex-col items-center gap-1.5 w-full pt-1">
                            {evtDateParts.time && (
                              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#14325C] font-medium">
                                <Clock className="w-4 h-4 text-[#4E74A6]" />
                                <span>Vào lúc {evtDateParts.time}</span>
                              </div>
                            )}
                            {evt.venueName && (
                              <h3
                                className="text-base sm:text-lg text-[#14325C] font-semibold mt-1"
                                style={{ fontFamily: TITLE_FONT }}
                              >
                                {evt.venueName}
                              </h3>
                            )}
                            {evt.venueAddress && (
                              <p className="text-xs text-[#335075] leading-relaxed">
                                {evt.venueAddress}
                              </p>
                            )}

                            {/* Nút xem bản đồ & thêm lịch */}
                            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                              {directionsUrl && (
                                <a
                                  href={directionsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-5 py-2 rounded-full bg-[#14325C] hover:bg-[#1F4A84] text-[#F8FBFF] border border-[#C4D2E3] text-xs font-serif tracking-widest uppercase transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xs cursor-pointer"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-[#E9F0F8]" />
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
                                className="px-5 py-2 rounded-full bg-[#FFFFFF] hover:bg-[#F4F8FD] border border-[#C4D2E3] text-xs font-serif tracking-widest text-[#14325C] uppercase shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5 text-[#14325C]" />
                                <span>Thêm Lịch</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* Section 3: Tiệc cưới, lịch ngày vui & đếm ngược (calendar) — VỊ TRÍ #2 */}
            {!hiddenSections.has("calendar") && (
              <div style={{ order: orderOf("calendar") }}>
                <section className="relative w-full rounded-3xl bg-[#F8FBFF]/94 border border-[#C4D2E3]/90 p-6 sm:p-10 shadow-md backdrop-blur-md flex flex-col items-center text-center">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#4E74A6] font-semibold mb-1">
                    Ngày Chung Đôi
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#14325C] font-normal mb-6"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Lịch Ngày Vui &amp; Đếm Ngược
                  </h2>

                  {/* Khối Lịch Tháng Trên Nền Sứ Trắng Viền Bạc */}
                  <div className="w-full max-w-[380px] p-6 rounded-2xl bg-[#FFFFFF] text-[#14325C] shadow-lg border border-[#C4D2E3] mb-8">
                    <div className="text-center font-serif tracking-[0.2em] text-sm text-[#14325C] font-semibold mb-4 pb-3 border-b border-[#C4D2E3]/60">
                      {calendarGrid.monthYear}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-[#4E74A6] font-semibold">
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
                                ? "relative font-bold text-white bg-[#14325C] shadow-md scale-105"
                                : "text-[#335075] hover:bg-[#EBF2FA]"
                            )}
                          >
                            {dayNum}
                            {isSpecial && (
                              <Heart className="absolute -top-1 -right-1 w-3.5 h-3.5 fill-[#14325C] text-[#14325C] animate-pulse" />
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
                        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#FFFFFF] border border-[#C4D2E3] shadow-xs"
                      >
                        <span
                          className="text-xl sm:text-2xl font-bold text-[#14325C]"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {String(item.val).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#6B88AE] uppercase tracking-wider mt-1">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Nút thêm vào lịch */}
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                      `Đám cưới ${data.couple?.groomName || "Minh Quân"} & ${data.couple?.brideName || "Ngọc Sương"}`
                    )}&dates=${new Date(eventDateStr)
                      .toISOString()
                      .replace(/-|:|\.\d\d\d/g, "")}/${new Date(
                        new Date(eventDateStr).getTime() + 3 * 3600 * 1000
                      )
                        .toISOString()
                        .replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent(
                          `Trân trọng kính mời đến dự lễ cưới của ${data.couple?.groomName || "Minh Quân"} & ${data.couple?.brideName || "Ngọc Sương"}`
                        )}&location=${encodeURIComponent(targetEvent?.venueAddress || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 rounded-full bg-[#FFFFFF] hover:bg-[#F4F8FD] border border-[#C4D2E3] text-xs font-serif tracking-widest text-[#14325C] uppercase shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#14325C]" />
                    <span>Thêm Vào Lịch Của Bạn</span>
                  </a>
                </section>
              </div>
            )}

            {/* Section 4: Album ảnh cưới coverflow */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <div style={{ order: orderOf("album") }}>
                <section className="relative w-full rounded-3xl bg-[#F8FBFF]/94 border border-[#C4D2E3]/90 p-6 sm:p-10 shadow-md backdrop-blur-md flex flex-col items-center text-center">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#4E74A6] font-semibold mb-1">
                    Kỷ Niệm Tình Yêu
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#14325C] font-normal mb-8"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Album Ảnh Cưới
                  </h2>

                  {/* Coverflow / Carousel */}
                  <div className="relative w-full max-w-[520px] aspect-[4/3] sm:aspect-[16/10] rounded-2xl overflow-hidden shadow-[0_16px_36px_rgba(20,50,92,0.18)] border-4 border-[#FFFFFF]">
                    <img loading="lazy" decoding="async"
                      src={albumPhotos[activePhotoIdx]?.url}
                      alt="Ảnh kỷ niệm"
                      className="w-full h-full object-cover transition-all duration-500 hover:scale-105 cursor-pointer"
                      onClick={() => setLightboxIndex(activePhotoIdx)}
                    />

                    {/* Nút Previous */}
                    <button
                      onClick={() =>
                        setActivePhotoIdx((prev) => (prev - 1 + albumPhotos.length) % albumPhotos.length)
                      }
                      aria-label="Ảnh trước"
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#FFFFFF]/90 hover:bg-[#FFFFFF] text-[#14325C] border border-[#C4D2E3] flex items-center justify-center backdrop-blur-xs transition-all shadow-md cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Nút Next */}
                    <button
                      onClick={() => setActivePhotoIdx((prev) => (prev + 1) % albumPhotos.length)}
                      aria-label="Ảnh sau"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#FFFFFF]/90 hover:bg-[#FFFFFF] text-[#14325C] border border-[#C4D2E3] flex items-center justify-center backdrop-blur-xs transition-all shadow-md cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Bộ đếm ảnh 1 / N */}
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#14325C]/85 text-[#F8FBFF] text-xs font-serif tracking-widest backdrop-blur-xs">
                      {activePhotoIdx + 1} / {albumPhotos.length}
                    </div>
                  </div>

                  {/* Dải thumbnail cuộn ngang */}
                  <div className="w-full max-w-[520px] flex items-center gap-2 overflow-x-auto py-4 mt-2 no-scrollbar">
                    {albumPhotos.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIdx(idx)}
                        className={cn(
                          "relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer",
                          activePhotoIdx === idx
                            ? "border-[#14325C] scale-105 shadow-md"
                            : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <img loading="lazy" decoding="async" src={p.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                </section>
              </div>
            )}

            {/* QR Album chia sẻ ảnh tiệc cưới cho gói trả phí */}
            {!isFree && !hiddenSections.has("albumQr") && weddingSlug && (
              <div style={{ order: orderOf("albumQr") }}>
                <section className="relative w-full rounded-3xl bg-[#F8FBFF]/94 border border-[#C4D2E3]/90 p-6 sm:p-10 shadow-md backdrop-blur-md flex flex-col items-center text-center">
                  <GuestAlbumQr
                    slug={weddingSlug}
                    accentColor="#14325C"
                    textColor="#14325C"
                    mutedColor="#4E74A6"
                  />
                </section>
              </div>
            )}

            {/* Section 5: Lịch trình & Dress code */}
            {!hiddenSections.has("dresscode") && (
              <div style={{ order: orderOf("dresscode") }}>
                <section className="relative w-full rounded-3xl bg-[#F8FBFF]/94 border border-[#C4D2E3]/90 p-6 sm:p-10 shadow-md backdrop-blur-md flex flex-col items-center text-center">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#4E74A6] font-semibold mb-1">
                    Trang Phục Gợi Ý
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#14325C] font-normal mb-8"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Lịch Trình &amp; Trang Phục
                  </h2>

                  {/* 3 vòng tròn màu Dress Code */}
                  <div className="flex items-center justify-center gap-4 sm:gap-6 mb-12">
                    {dressColors.map((hex, idx) => (
                      <div
                        key={idx}
                        className="w-11 h-11 sm:w-14 sm:h-14 rounded-full shadow-md border-2 border-[#FFFFFF] transition-transform hover:scale-110"
                        style={{ backgroundColor: hex }}
                        title={hex}
                        aria-label={`Màu trang phục ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Trục dọc Timeline "Giọt Sương Thời Gian" */}
                  <div className="w-full max-w-[480px] flex flex-col items-center">
                    <span className="text-[11px] uppercase tracking-widest text-[#14325C] font-semibold mb-6">
                      LỊCH TRÌNH HÔN LỄ
                    </span>

                    <div className="relative w-full pl-6 sm:pl-8 border-l-2 border-[#9EB4D1]/60 flex flex-col gap-6 text-left">
                      {timelineItems.map((item, idx) => (
                        <div key={idx} className="relative flex flex-col gap-1">
                          {/* Hạt ngọc trai tròn viền xanh lam */}
                          <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-full bg-[#FFFFFF] border-2 border-[#14325C] shadow-xs" />
                          <span className="text-xs sm:text-sm font-serif font-bold text-[#14325C]">
                            {item.time}
                          </span>
                          <span className="text-xs sm:text-sm text-[#335075] leading-relaxed">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Section 6: Hộp mừng cưới pha lê & VietQR */}
            {!hiddenSections.has("gift") && (
              <div style={{ order: orderOf("gift") }}>
                <section className="relative w-full rounded-3xl bg-[#F8FBFF]/94 border border-[#C4D2E3]/90 p-6 sm:p-10 shadow-md backdrop-blur-md flex flex-col items-center text-center">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#4E74A6] font-semibold mb-1">
                    Gửi Lời Chúc Phúc
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#14325C] font-normal mb-6"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hộp Quà Mừng Cưới
                  </h2>

                  {/* Hộp quà pha lê nhung xanh 3 trạng thái */}
                  <div
                    className="relative w-48 sm:w-56 aspect-[330/412] my-2 cursor-pointer transition-transform hover:scale-105 active:scale-95 group"
                    onMouseEnter={() => setActiveParcel("hover")}
                    onMouseLeave={() => setActiveParcel("normal")}
                    onClick={() => {
                      setActiveParcel("active");
                      playOpenCardSound();
                      setTimeout(() => {
                        setGiftModalOpen(true);
                        setActiveParcel("normal");
                      }, 280);
                    }}
                  >
                    <img loading="lazy" decoding="async"
                      src={`/templates/lam-tu-ngoc-suong/gift-${activeParcel}.webp`}
                      alt="Hộp Trang Sức Pha Lê"
                      className="w-full h-full object-contain drop-shadow-xl"
                    />

                    {/* Ánh sương bạc hover */}
                    <div className="absolute inset-0 rounded-2xl bg-radial from-[#E9F0F8]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>

                  <button
                    onClick={() => {
                      playOpenCardSound();
                      setGiftModalOpen(true);
                    }}
                    className="mt-6 px-7 py-2.5 rounded-full bg-[#14325C] hover:bg-[#1F4A84] text-[#F8FBFF] border border-[#C4D2E3] text-xs font-serif tracking-widest uppercase shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                  >
                    <span>Mở Hộp Mừng Cưới</span>
                  </button>
                </section>
              </div>
            )}

            {/* Section 7: Form xác nhận tham dự RSVP & Sổ lưu bút */}
            {!hiddenSections.has("rsvp") && (
              <div style={{ order: orderOf("rsvp") }}>
                <section className="relative w-full rounded-3xl bg-[#F8FBFF]/94 border border-[#C4D2E3]/90 p-4 sm:p-8 shadow-md backdrop-blur-md flex flex-col items-center">
                  <TemplateRsvpSection
                    data={data}
                    mode={mode}
                    tone="minimal"
                    customTheme={{
                      isDark: false,
                      card: "border border-[#C4D2E3] bg-[#FFFFFF] text-[#14325C]",
                      input: "border border-[#C4D2E3] bg-[#F8FBFF] text-[#14325C] placeholder:text-[#4E74A6]/70 focus:border-[#14325C] focus:ring-[#14325C]",
                      primaryBtn: "bg-[#14325C] text-[#FFFFFF] hover:bg-[#1F4A84] font-semibold",
                      outlineBtn: "border border-[#14325C] bg-transparent text-[#14325C] hover:bg-[#14325C]/10",
                      alert: "border-[#C4D2E3] bg-[#F8FBFF] text-[#14325C]",
                      badge: "border-[#C4D2E3] bg-[#F8FBFF] text-[#14325C]",
                      optionBg: "#FFFFFF",
                      optionColor: "#14325C",
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
              (Không lặp lại ngày cưới)
              ============================================================ */}
          <footer className="w-full flex flex-col items-center text-center pt-8 pb-12 border-t border-[#C4D2E3]/60">
            <div className="w-full max-w-[240px] sm:max-w-[300px] mb-4">
              <img loading="lazy" decoding="async"
                src="/templates/lam-tu-ngoc-suong/divider-pearl.webp"
                alt="Divider"
                className="w-full object-contain opacity-80"
              />
            </div>
            <h4
              className="text-xl sm:text-2xl text-[#14325C] font-normal mb-2"
              style={{ fontFamily: TITLE_FONT }}
            >
              Chân Thành Cảm Ơn
            </h4>
            <p className="text-xs sm:text-sm text-[#4E74A6] italic max-w-[420px] leading-relaxed">
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
        onClose={() => setGiftModalOpen(false)}
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

export default LamTuNgocSuongTemplate;
