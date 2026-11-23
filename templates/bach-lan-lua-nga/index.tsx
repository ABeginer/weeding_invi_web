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
   BẢNG MÀU CHÍNH THỨC: BẠCH LAN LỤA NGÀ (bach-lan-lua-nga)
   - Nền tổng thể: #FBF9F4 (Ivory Silk)
   - Bề mặt thẻ nổi: #FFFFFF / rgba(255, 255, 255, 0.94)
   - Nền nhấn ấm: #F3EDE2
   - Viền champagne mảnh: #E5D8BF
   - Viền nhấn / Đường chỉ: #C8AD7F (Champagne Gold)
   - Chữ chính: #3A322C (Nâu trầm ánh than)
   - Chữ phụ / Chú thích: #786D63
   - Nút CTA & Trái tim lịch: #8C724A (hover #735C3A, chữ trắng #FFFFFF)
   - Dress Code mặc định: #C8AD7F (Champagne), #E5D8BF (Lụa ngà), #3A322C (Nâu than)
   ============================================================ */

const IVORY_BG = "#FBF9F4";
const CARD_BG = "#FFFFFF";
const WARM_BG = "#F3EDE2";

const CHAMPAGNE_BORDER = "#E5D8BF";
const CHAMPAGNE_GOLD = "#C8AD7F";

const TEXT_MAIN = "#3A322C";
const TEXT_MUTED = "#786D63";

const CTA_GOLD = "#8C724A";
const CTA_HOVER = "#735C3A";

const TITLE_FONT = "'Playfair Display', Georgia, serif";
const BODY_FONT = "'Be Vietnam Pro', sans-serif";

/* ------------------------------------------------------------
   Hiệu ứng Ánh Sáng Champagne Dịu (ChampagneLightDust)
   - Những đốm sáng champagne lấp lánh nhẹ nhàng
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function ChampagneLightDust({ count = 8 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 13) % 92 + 4}%`,
      size: (idx % 3) * 2 + 6,
      duration: 12 + (idx % 4) * 3,
      delay: (idx * 0.8) % 5,
      sway: 15 + (idx % 3) * 10,
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden z-[5]"
      aria-hidden="true"
    >
      {particles.map((p) => (
        <m.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: "-15px",
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: "radial-gradient(circle, rgba(200,173,127,0.7) 0%, rgba(229,216,191,0.2) 70%, transparent 100%)",
            boxShadow: "0 0 8px rgba(200,173,127,0.3)",
          }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, p.id % 2 === 0 ? p.sway : -p.sway, 0],
            opacity: [0, 0.75, 0.9, 0.4, 0],
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
   MAIN COMPONENT: BachLanLuaNgaTemplate
   ============================================================ */
export default function BachLanLuaNgaTemplate({
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

  // 2-way sync với parent frame qua ref
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
    playCoverSfx("silk");
    setTimeout(() => {
      setIsOpen(true);
      setCoverGone(true);
      setIsOpening(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 700);
  };

  // Gift modal state & Silk Box hover
  // Gift modal state & Parcel interaction (700ms delay + SFX box)
  const {
    stage: activeGiftState,
    setStage: setActiveGiftState,
    isOpening: isGiftOpening,
    isModalOpen: giftModalOpen,
    handleGiftClick,
    handleCloseModal,
  } = useGiftBoxInteraction({
    sfxType: "box",
  });

  // Lightbox modal state
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Album photos (tôn trọng giới hạn Free)
  const albumPhotos = React.useMemo<TemplatePhotoItem[]>(() => {
    const list = data.photos?.gallery || [];
    return data.plan === "free" ? list.slice(0, 5) : list;
  }, [data.photos?.gallery, data.plan]);

  const [activePhotoIdx, setActivePhotoIdx] = React.useState(0);

  // Multi-event support & target event details
  const visibleEvents = React.useMemo(() => getVisibleEvents(data), [data]);
  const targetEvent = React.useMemo(
    () => getNearestUpcomingEvent(visibleEvents, data.date),
    [visibleEvents, data.date]
  );
  const eventDateStr = targetEvent?.startsAt || data.date || "2027-03-20";
  const dateParts = formatWeddingDateParts(eventDateStr);
  const lunarDateClean = targetEvent?.lunarDate
    ? formatLunarDateClean(targetEvent.lunarDate)
    : "Ngày Lành Duyên Đẹp";

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

  // Calendar month days calculation & multi-event date highlight
  const calendarData = React.useMemo(() => {
    const d = new Date(eventDateStr);
    const year = d.getFullYear() || 2027;
    const month = d.getMonth() || 2;
    const currentDay = d.getDate() || 20;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    return { year, month: month + 1, currentDay, firstDayIndex, totalDays };
  }, [eventDateStr]);

  const eventDays = React.useMemo(() => {
    const set = new Set<number>();
    visibleEvents.forEach((evt) => {
      const dStr = evt.startsAt || data.date;
      if (!dStr) return;
      const d = new Date(dStr);
      if (d.getFullYear() === calendarData.year && d.getMonth() + 1 === calendarData.month) {
        set.add(d.getDate());
      }
    });
    if (set.size === 0 && calendarData.currentDay) {
      set.add(calendarData.currentDay);
    }
    return set;
  }, [visibleEvents, data.date, calendarData.year, calendarData.month, calendarData.currentDay]);

  // Section Ordering & Visibility
  const hiddenSections = React.useMemo(() => {
    return new Set(data.hiddenSections || []);
  }, [data.hiddenSections]);

  const isBrideFirst = data.hostFirst === "bride";

  const orderMap = React.useMemo(() => {
    const map = new Map<string, number>();
    const orderList = data.sectionOrder && data.sectionOrder.length > 0
      ? data.sectionOrder
      : ["family", "calendar", "map", "dresscode", "album", "albumQr", "gift", "rsvp"];
    orderList.forEach((key, idx) => map.set(key, idx + 1));
    return map;
  }, [data.sectionOrder]);

  const orderOf = (key: string, defaultOrder: number = 99) => {
    return orderMap.get(key) ?? defaultOrder;
  };

  const calendarGoogleLink = React.useMemo(() => {
    const groomName = data.couple?.groomName || "Chú Rể";
    const brideName = data.couple?.brideName || "Cô Dâu";
    const title = encodeURIComponent(`Lễ Thành Hôn — ${groomName} & ${brideName}`);
    const details = encodeURIComponent(
      `Trân trọng kính mời Quý khách đến chung vui cùng gia đình chúng tôi tại ${targetEvent?.venueName || targetEvent?.venueAddress || "hôn trường"}.`
    );
    const location = encodeURIComponent(targetEvent?.venueAddress || targetEvent?.venueName || "");
    const d = new Date(eventDateStr);
    const startIso = d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(d.getTime() + 3 * 3600 * 1000);
    const endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  }, [data.couple?.groomName, data.couple?.brideName, targetEvent, eventDateStr]);

  // Hero couple photo & Portrait photos
  const heroPhotoUrl = data.photos?.heroUrl;
  const groomPhotoUrl = data.photos?.groomUrl;
  const bridePhotoUrl = data.photos?.brideUrl;

  // Parents name splitting (tách tại & thành 2 dòng riêng, bỏ &)
  const groomParents = data.couple?.groomParents || "";
  const brideParents = data.couple?.brideParents || "";
  const [gDad, gMom] = groomParents.includes("&")
    ? groomParents.split("&").map((s) => s.trim())
    : [groomParents, ""];
  const [bDad, bMom] = brideParents.includes("&")
    ? brideParents.split("&").map((s) => s.trim())
    : [brideParents, ""];

  // Dress code default swatches (không in mã hex)
  const dressCodeSwatches = [
    { color: "#C8AD7F", label: "Vàng Champagne" },
    { color: "#E5D8BF", label: "Trắng Ngà" },
    { color: "#3A322C", label: "Nâu Than" },
  ];

  // Couple display name
  const groomName = data.couple?.groomName || "Chú Rể";
  const brideName = data.couple?.brideName || "Cô Dâu";

  return (
    <div
      className={cn(
        "relative w-full bg-[#FBF9F4] text-[#3A322C] selection:bg-[#F3EDE2] selection:text-[#8C724A]",
        !coverGone && (contained ? "h-full overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden")
      )}
      style={{ fontFamily: BODY_FONT }}
    >
      {/* ============================================================
          1. MÀN HÌNH BÌA MỞ THIỆP (Cover Screen)
          - Phân tầng z-index Anti-Blur chuẩn Quiet Luxury
          ============================================================ */}
      {!coverGone && (
        <div
          className={cn(
            "z-50 w-full max-w-full overflow-hidden flex flex-col items-center justify-center select-none transition-all duration-700",
            contained
              ? "h-full px-4 py-6"
              : "fixed inset-0 px-4 py-4 sm:px-6",
            isOpening && "opacity-0 scale-105 pointer-events-none"
          )}
          style={{
            backgroundColor: IVORY_BG,
          }}
        >
          {/* z-0: Ảnh nền lụa trắng ngà rủ mềm sắc nét 100% */}
          <picture className="absolute inset-0 z-0 pointer-events-none">
            {!contained && (
              <source
                media="(min-width: 641px)"
                srcSet="/templates/bach-lan-lua-nga/bg_desktop.webp"
              />
            )}
            <img
              src="/templates/bach-lan-lua-nga/bg_mobile.webp"
              alt="Bạch Lan Lụa Ngà"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </picture>

          {/* z-[5]: Ánh sáng champagne trôi nhẹ */}
          <ChampagneLightDust count={9} />

          {/* z-20: Thẻ bìa trung tâm giấy lụa satin trắng ngà */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-20 w-full max-w-[328px] sm:max-w-[380px] mx-auto rounded-3xl border border-[#E5D8BF] bg-white/94 p-6 sm:p-8 text-center shadow-[0_24px_60px_rgba(58,50,44,0.08)] backdrop-blur-sm"
          >
            {/* Nhánh lan góc trang trí đối xứng (trên-trái & dưới-phải lật 180°) */}
            <img
              src="/templates/bach-lan-lua-nga/orchid_sprig_corner.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -top-3 -left-3 w-14 sm:w-16 object-contain z-10 opacity-90 drop-shadow-sm"
            />
            <img
              src="/templates/bach-lan-lua-nga/orchid_sprig_corner.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-3 -right-3 w-14 sm:w-16 object-contain z-10 opacity-90 rotate-180 drop-shadow-sm"
            />

            {/* Con dấu sáp ngọc trai Bạch Lan ở đỉnh */}
            <div className="relative mx-auto mb-3 w-16 h-16 sm:w-20 sm:h-20">
              <img
                src="/templates/bach-lan-lua-nga/wax_seal_pearl.webp"
                alt="Con Dấu Ngọc Trai Bạch Lan"
                className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(200,173,127,0.22)]"
              />
            </div>

            {/* Lời ngỏ trang trọng */}
            <p
              className="text-[11px] sm:text-xs uppercase tracking-[0.26em] font-medium text-[#786D63]"
              style={{ fontFamily: BODY_FONT }}
            >
              TRÂN TRỌNG KÍNH MỜI
            </p>
            <p
              className="mt-0.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#C8AD7F]"
              style={{ fontFamily: BODY_FONT }}
            >
              LỄ THÀNH HÔN
            </p>

            {/* Tên cặp đôi 3 dòng: Chú rể / & / Cô dâu */}
            <div className="my-3 space-y-0.5">
              <h1
                className="text-2xl sm:text-3xl font-normal tracking-wide text-[#3A322C] break-words"
                style={{ fontFamily: TITLE_FONT }}
              >
                {groomName}
              </h1>
              <div className="flex items-center justify-center gap-2">
                <span className="h-px w-6 bg-[#C8AD7F]/40" />
                <span
                  className="font-serif italic text-lg sm:text-xl text-[#C8AD7F]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  &amp;
                </span>
                <span className="h-px w-6 bg-[#C8AD7F]/40" />
              </div>
              <h1
                className="text-2xl sm:text-3xl font-normal tracking-wide text-[#3A322C] break-words"
                style={{ fontFamily: TITLE_FONT }}
              >
                {brideName}
              </h1>
            </div>

            {/* Dải phân cách ngọc trai champagne */}
            <div className="my-3">
              <img
                src="/templates/bach-lan-lua-nga/divider_pearl.webp"
                alt=""
                aria-hidden="true"
                className="mx-auto w-36 sm:w-44 object-contain opacity-80"
              />
            </div>

            {/* Lời gửi trao tao nhã & Tên khách mời */}
            <p className="text-xs sm:text-sm text-[#786D63] italic font-serif">
              {guestName ? `Kính mời: ${guestName}` : "Hân hạnh đón tiếp Quý khách"}
            </p>
            <p className="mt-1 text-[11px] text-[#C8AD7F] uppercase tracking-wider">
              Đến chung vui cùng chúng tôi
            </p>

            {/* Nút bấm Mở Thiệp */}
            <button
              type="button"
              onClick={handleOpenCover}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full px-7 py-2.5 text-xs sm:text-sm font-medium tracking-widest uppercase transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-md text-white"
              style={{
                backgroundColor: CTA_GOLD,
              }}
            >
              <span>MỞ THIỆP</span>
            </button>
          </m.div>
        </div>
      )}

      {/* ============================================================
          2. NÚT NHẠC NỀN FLOATING
          ============================================================ */}
      {!hiddenSections.has("music") && data.music && (
        <LiveMusicFloatingButton
          src={data.music.src || "/media/well-be-okay.mp3"}
          title={data.music.title || "Giai điệu Bạch Lan Lụa Ngà"}
          visible={coverGone}
          tone="flowery"
        />
      )}

      {/* ============================================================
          3. RUỘT THIỆP CHÍNH (Quiet Luxury Invitation Content)
          ============================================================ */}
      <div
        className={cn(
          "w-full transition-opacity duration-700",
          !isOpen ? "hidden opacity-0" : "block opacity-100"
        )}
      >
        <div className="mx-auto max-w-[840px] px-4 sm:px-6 py-8 sm:py-16 space-y-12 sm:space-y-18">
          {/* ------------------------------------------------------------
              KHỐI 1: HERO — EDITORIAL QUIET LUXURY
              (Khung Vòm Bạch Lan ôm ảnh cưới, không lặp ngày cưới)
              ------------------------------------------------------------ */}
          <section className="relative text-center pt-4 sm:pt-8 overflow-hidden">
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-25">
              <ChampagneLightDust count={6} />
            </div>

            {/* Tiêu đề thanh tao */}
            <p
              className="text-xs sm:text-sm font-medium uppercase tracking-[0.28em] text-[#C8AD7F]"
              style={{ fontFamily: BODY_FONT }}
            >
              CHUYỆN TÌNH ĐƠM HOA
            </p>

            {/* Tên cặp đôi 3 dòng nghệ thuật */}
            <div className="mt-2 mb-3 space-y-1">
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-wide text-[#3A322C] break-words"
                style={{ fontFamily: TITLE_FONT }}
              >
                {groomName}
              </h1>
              <div className="flex items-center justify-center gap-3">
                <span className="h-px w-10 sm:w-16 bg-[#C8AD7F]/40" />
                <span
                  className="font-serif italic text-xl sm:text-2xl text-[#C8AD7F]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  &amp;
                </span>
                <span className="h-px w-10 sm:w-16 bg-[#C8AD7F]/40" />
              </div>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-wide text-[#3A322C] break-words"
                style={{ fontFamily: TITLE_FONT }}
              >
                {brideName}
              </h1>
            </div>

            {/* Dải phân cách ngọc trai */}
            <div className="my-4">
              <img
                src="/templates/bach-lan-lua-nga/divider_pearl.webp"
                alt=""
                aria-hidden="true"
                className="mx-auto w-40 sm:w-52 object-contain opacity-80"
              />
            </div>

            {/* Khung Vòm Lan Hồ Điệp ôm trọn ảnh cưới */}
            <div className="relative mx-auto mt-6 max-w-[320px] sm:max-w-[400px] aspect-[3/4]">
              {/* Lớp ảnh cặp đôi đặt bên dưới */}
              {heroPhotoUrl ? (
                <div className="absolute inset-[5%_7%_4%_7%] rounded-t-[140px] sm:rounded-t-[175px] overflow-hidden shadow-inner bg-[#F3EDE2]">
                  <img
                    src={heroPhotoUrl}
                    alt="Ảnh cưới đôi uyên ương"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              ) : (
                <div className="absolute inset-[5%_7%_4%_7%] rounded-t-[140px] sm:rounded-t-[175px] overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#FFFFFF] to-[#F3EDE2] text-center border border-[#E5D8BF]">
                  <img
                    src="/templates/bach-lan-lua-nga/wax_seal_pearl.webp"
                    alt=""
                    className="w-16 h-16 sm:w-20 sm:h-20 opacity-85 mb-3"
                  />
                  <p
                    className="font-serif text-lg sm:text-xl font-normal text-[#3A322C]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {groomName} &amp; {brideName}
                  </p>
                  <p className="mt-1 text-xs text-[#786D63] font-serif italic">
                    Bạch Lan Lụa Ngà
                  </p>
                </div>
              )}

              {/* Lớp vòm orchid_arch_frame.webp nằm trên ảnh */}
              <img
                src="/templates/bach-lan-lua-nga/orchid_arch_frame.webp"
                alt="Khung Vòm Bạch Lan"
                className="pointer-events-none absolute inset-0 w-full h-full object-contain z-10 drop-shadow-[0_10px_24px_rgba(58,50,44,0.08)]"
              />
            </div>

            {/* Lời dẫn trang nhã */}
            <p className="mt-6 mx-auto max-w-md text-xs sm:text-sm text-[#786D63] leading-relaxed font-serif italic">
              &ldquo;Như đóa lan trắng vươn mình trong sớm mai, tình yêu dịu dàng lớn lên qua năm tháng, đơm hoa kết trái thành hẹn ước trăm năm.&rdquo;
            </p>
          </section>

          {/* ------------------------------------------------------------
              DYNAMIC SECTIONS THEO THỨ TỰ data.sectionOrder
              ------------------------------------------------------------ */}
          <div className="flex flex-col space-y-12 sm:space-y-18">
            {/* ------------------------------------------------------------
                KHỐI 2: HAI BÊN GIA ĐÌNH & CHÂN DUNG CẶP ĐÔI (family)
                Gộp chung trong 1 section để đảm bảo order kéo thả không bị tách rời
                ------------------------------------------------------------ */}
            {!hiddenSections.has("family") && (
              <section
                style={{ order: orderOf("family", 1) }}
                className="space-y-8"
              >
                {/* Phần thông tin gia đình hai bên */}
                <div className="relative rounded-3xl border border-[#E5D8BF] bg-white/85 p-6 sm:p-10 shadow-[0_12px_36px_rgba(58,50,44,0.05)] backdrop-blur-sm">
                  {/* Góc hoa lan trang trí */}
                  <img
                    src="/templates/bach-lan-lua-nga/orchid_sprig_corner.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute top-2 left-2 w-10 sm:w-12 object-contain opacity-70"
                  />
                  <img
                    src="/templates/bach-lan-lua-nga/orchid_sprig_corner.webp"
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute top-2 right-2 w-10 sm:w-12 object-contain opacity-70 scale-x-[-1]"
                  />

                  <div className="text-center mb-8">
                    <p className="text-[11px] sm:text-xs uppercase tracking-[0.26em] font-medium text-[#C8AD7F]">
                      GẮN KẾT YÊU THƯƠNG
                    </p>
                    <h2
                      className="text-2xl sm:text-3xl font-normal text-[#3A322C] mt-1"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Gia Đình Hai Bên
                    </h2>
                    <p className="text-xs sm:text-sm text-[#786D63] italic font-serif mt-1">
                      Trong niềm hân hoan và sự chúc phúc trọn vẹn
                    </p>
                    <div className="my-3">
                      <img
                        src="/templates/bach-lan-lua-nga/divider_pearl.webp"
                        alt=""
                        aria-hidden="true"
                        className="mx-auto w-32 sm:w-40 object-contain opacity-70"
                      />
                    </div>
                  </div>

                  {/* 2 Cột Nhà Trai & Nhà Gái: Hỗ trợ đảo Nhà Gái lên trước nếu isBrideFirst */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 items-stretch">
                    {/* Cột 1 */}
                    {isBrideFirst ? (
                      <div className="flex flex-col justify-between rounded-2xl border border-[#E5D8BF]/70 bg-[#FBF9F4]/70 p-5 sm:p-6 text-center">
                        <div>
                          <span className="inline-block px-3 py-1 rounded-full bg-[#F3EDE2] text-[#3A322C] text-[11px] uppercase tracking-wider font-semibold mb-3">
                            {data.couple?.brideTitle || "Nhà Gái"}
                          </span>
                          <div className="space-y-1 text-xs sm:text-sm text-[#3A322C]">
                            {bDad ? <p className="font-medium">{bDad}</p> : <p className="font-medium">Ông: Lê Văn C</p>}
                            {bMom ? <p className="font-medium">{bMom}</p> : <p className="font-medium">Bà: Phạm Thị D</p>}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#E5D8BF]/60">
                          <p className="text-[11px] uppercase tracking-wider text-[#C8AD7F] font-medium">
                            Cô Dâu
                          </p>
                          <p
                            className="text-lg sm:text-xl font-normal text-[#3A322C] mt-0.5"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {data.couple?.brideFullName || brideName}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-between rounded-2xl border border-[#E5D8BF]/70 bg-[#FBF9F4]/70 p-5 sm:p-6 text-center">
                        <div>
                          <span className="inline-block px-3 py-1 rounded-full bg-[#F3EDE2] text-[#3A322C] text-[11px] uppercase tracking-wider font-semibold mb-3">
                            {data.couple?.groomTitle || "Nhà Trai"}
                          </span>
                          <div className="space-y-1 text-xs sm:text-sm text-[#3A322C]">
                            {gDad ? <p className="font-medium">{gDad}</p> : <p className="font-medium">Ông: Nguyễn Văn A</p>}
                            {gMom ? <p className="font-medium">{gMom}</p> : <p className="font-medium">Bà: Trần Thị B</p>}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#E5D8BF]/60">
                          <p className="text-[11px] uppercase tracking-wider text-[#C8AD7F] font-medium">
                            Chú Rể
                          </p>
                          <p
                            className="text-lg sm:text-xl font-normal text-[#3A322C] mt-0.5"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {data.couple?.groomFullName || groomName}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Cột 2 */}
                    {isBrideFirst ? (
                      <div className="flex flex-col justify-between rounded-2xl border border-[#E5D8BF]/70 bg-[#FBF9F4]/70 p-5 sm:p-6 text-center">
                        <div>
                          <span className="inline-block px-3 py-1 rounded-full bg-[#F3EDE2] text-[#3A322C] text-[11px] uppercase tracking-wider font-semibold mb-3">
                            {data.couple?.groomTitle || "Nhà Trai"}
                          </span>
                          <div className="space-y-1 text-xs sm:text-sm text-[#3A322C]">
                            {gDad ? <p className="font-medium">{gDad}</p> : <p className="font-medium">Ông: Nguyễn Văn A</p>}
                            {gMom ? <p className="font-medium">{gMom}</p> : <p className="font-medium">Bà: Trần Thị B</p>}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#E5D8BF]/60">
                          <p className="text-[11px] uppercase tracking-wider text-[#C8AD7F] font-medium">
                            Chú Rể
                          </p>
                          <p
                            className="text-lg sm:text-xl font-normal text-[#3A322C] mt-0.5"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {data.couple?.groomFullName || groomName}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-between rounded-2xl border border-[#E5D8BF]/70 bg-[#FBF9F4]/70 p-5 sm:p-6 text-center">
                        <div>
                          <span className="inline-block px-3 py-1 rounded-full bg-[#F3EDE2] text-[#3A322C] text-[11px] uppercase tracking-wider font-semibold mb-3">
                            {data.couple?.brideTitle || "Nhà Gái"}
                          </span>
                          <div className="space-y-1 text-xs sm:text-sm text-[#3A322C]">
                            {bDad ? <p className="font-medium">{bDad}</p> : <p className="font-medium">Ông: Lê Văn C</p>}
                            {bMom ? <p className="font-medium">{bMom}</p> : <p className="font-medium">Bà: Phạm Thị D</p>}
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-[#E5D8BF]/60">
                          <p className="text-[11px] uppercase tracking-wider text-[#C8AD7F] font-medium">
                            Cô Dâu
                          </p>
                          <p
                            className="text-lg sm:text-xl font-normal text-[#3A322C] mt-0.5"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {data.couple?.brideFullName || brideName}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Phần chân dung cặp đôi nằm trong wrapper của family */}
                {!data.hideCouplePhotos && (groomPhotoUrl || bridePhotoUrl) && (
                  <div className="relative rounded-3xl border border-[#E5D8BF] bg-white/85 p-6 sm:p-10 shadow-[0_12px_36px_rgba(58,50,44,0.05)] backdrop-blur-sm text-center">
                    <p className="text-[11px] sm:text-xs uppercase tracking-[0.26em] font-medium text-[#C8AD7F]">
                      ĐÔI UYÊN ƯƠNG
                    </p>
                    <h2
                      className="text-2xl sm:text-3xl font-normal text-[#3A322C] mt-1"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Nhân Duyên Tốt Lành
                    </h2>
                    <div className="my-3">
                      <img
                        src="/templates/bach-lan-lua-nga/divider_pearl.webp"
                        alt=""
                        aria-hidden="true"
                        className="mx-auto w-32 sm:w-40 object-contain opacity-70"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-10 mt-8 items-center max-w-2xl mx-auto">
                      {isBrideFirst ? (
                        <>
                          {/* Cô Dâu */}
                          {bridePhotoUrl && (
                            <div className="flex flex-col items-center">
                              <div className="relative aspect-[3/4] w-48 sm:w-56 rounded-t-[120px] overflow-hidden border-2 border-[#E5D8BF] p-1.5 bg-[#FBF9F4] shadow-md">
                                <img
                                  src={bridePhotoUrl}
                                  alt={brideName}
                                  className="w-full h-full object-cover rounded-t-[115px]"
                                />
                              </div>
                              <p
                                className="text-lg sm:text-xl font-normal text-[#3A322C] mt-4"
                                style={{ fontFamily: TITLE_FONT }}
                              >
                                {data.couple?.brideFullName || brideName}
                              </p>
                              <p className="text-xs uppercase tracking-wider text-[#C8AD7F] font-medium mt-0.5">
                                {data.couple?.brideTitle || "Cô Dâu"}
                              </p>
                            </div>
                          )}
                          {/* Chú Rể */}
                          {groomPhotoUrl && (
                            <div className="flex flex-col items-center">
                              <div className="relative aspect-[3/4] w-48 sm:w-56 rounded-t-[120px] overflow-hidden border-2 border-[#E5D8BF] p-1.5 bg-[#FBF9F4] shadow-md">
                                <img
                                  src={groomPhotoUrl}
                                  alt={groomName}
                                  className="w-full h-full object-cover rounded-t-[115px]"
                                />
                              </div>
                              <p
                                className="text-lg sm:text-xl font-normal text-[#3A322C] mt-4"
                                style={{ fontFamily: TITLE_FONT }}
                              >
                                {data.couple?.groomFullName || groomName}
                              </p>
                              <p className="text-xs uppercase tracking-wider text-[#C8AD7F] font-medium mt-0.5">
                                {data.couple?.groomTitle || "Chú Rể"}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {/* Chú Rể */}
                          {groomPhotoUrl && (
                            <div className="flex flex-col items-center">
                              <div className="relative aspect-[3/4] w-48 sm:w-56 rounded-t-[120px] overflow-hidden border-2 border-[#E5D8BF] p-1.5 bg-[#FBF9F4] shadow-md">
                                <img
                                  src={groomPhotoUrl}
                                  alt={groomName}
                                  className="w-full h-full object-cover rounded-t-[115px]"
                                />
                              </div>
                              <p
                                className="text-lg sm:text-xl font-normal text-[#3A322C] mt-4"
                                style={{ fontFamily: TITLE_FONT }}
                              >
                                {data.couple?.groomFullName || groomName}
                              </p>
                              <p className="text-xs uppercase tracking-wider text-[#C8AD7F] font-medium mt-0.5">
                                {data.couple?.groomTitle || "Chú Rể"}
                              </p>
                            </div>
                          )}
                          {/* Cô Dâu */}
                          {bridePhotoUrl && (
                            <div className="flex flex-col items-center">
                              <div className="relative aspect-[3/4] w-48 sm:w-56 rounded-t-[120px] overflow-hidden border-2 border-[#E5D8BF] p-1.5 bg-[#FBF9F4] shadow-md">
                                <img
                                  src={bridePhotoUrl}
                                  alt={brideName}
                                  className="w-full h-full object-cover rounded-t-[115px]"
                                />
                              </div>
                              <p
                                className="text-lg sm:text-xl font-normal text-[#3A322C] mt-4"
                                style={{ fontFamily: TITLE_FONT }}
                              >
                                {data.couple?.brideFullName || brideName}
                              </p>
                              <p className="text-xs uppercase tracking-wider text-[#C8AD7F] font-medium mt-0.5">
                                {data.couple?.brideTitle || "Cô Dâu"}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ------------------------------------------------------------
                KHỐI 3: LƯU LẠI NGÀY VUI & ĐẾM NGƯỢC (calendar)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("calendar") && (
              <section
                style={{ order: orderOf("calendar", 2) }}
                className="relative rounded-3xl border border-[#E5D8BF] bg-white/85 p-6 sm:p-10 shadow-[0_12px_36px_rgba(58,50,44,0.05)] backdrop-blur-sm text-center"
              >
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.26em] font-medium text-[#C8AD7F]">
                  LƯU LẠI NGÀY VUI
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-normal text-[#3A322C] mt-1"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Đếm Ngược Tới Ngày Chung Đôi
                </h2>
                <div className="my-3">
                  <img
                    src="/templates/bach-lan-lua-nga/divider_pearl.webp"
                    alt=""
                    aria-hidden="true"
                    className="mx-auto w-32 sm:w-40 object-contain opacity-70"
                  />
                </div>

                {/* 4 Ô Đếm Ngược Bo Mềm, Hydration-Safe */}
                {mounted && (
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-sm sm:max-w-md mx-auto my-6">
                    {[
                      { val: timeLeft.days, label: "NGÀY" },
                      { val: timeLeft.hours, label: "GIỜ" },
                      { val: timeLeft.minutes, label: "PHÚT" },
                      { val: timeLeft.seconds, label: "GIÂY" },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#E5D8BF] bg-[#FBF9F4] p-3 sm:p-4 text-center shadow-sm"
                      >
                        <span
                          className="text-2xl sm:text-3xl font-normal text-[#8C724A] font-serif block tabular-nums"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {String(item.val).padStart(2, "0")}
                        </span>
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#786D63] font-semibold mt-1 block">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lịch Tháng với Trái Tim Champagne #8C724A */}
                <div className="mt-8 max-w-sm mx-auto rounded-2xl border border-[#E5D8BF] bg-[#FBF9F4] p-4 sm:p-6">
                  <p className="text-xs uppercase tracking-widest font-semibold text-[#8C724A] mb-3">
                    THÁNG {calendarData.month} &middot; {calendarData.year}
                  </p>
                  <div className="grid grid-cols-7 gap-1 text-[11px] text-[#786D63] font-semibold mb-2">
                    {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d, i) => (
                      <div key={i} className="py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {Array.from({ length: calendarData.firstDayIndex }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: calendarData.totalDays }).map((_, i) => {
                      const day = i + 1;
                      const isWeddingDay = eventDays.has(day);
                      return (
                        <div
                          key={`day-${day}`}
                          className={cn(
                            "relative flex aspect-square items-center justify-center rounded-full font-medium transition-colors",
                            isWeddingDay
                              ? "bg-[#8C724A] text-white font-bold shadow-md"
                              : "text-[#3A322C] hover:bg-[#F3EDE2]"
                          )}
                        >
                          {day}
                          {isWeddingDay && (
                            <Heart className="absolute -top-1 -right-1 w-3 h-3 text-[#C8AD7F] fill-[#C8AD7F] animate-pulse" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hàng nút Thêm vào lịch & Xác nhận tham dự */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={calendarGoogleLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#C8AD7F] bg-white px-5 py-2 text-xs font-semibold text-[#8C724A] shadow-sm hover:bg-[#F3EDE2] transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Thêm vào lịch
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const doc = e.currentTarget.ownerDocument;
                      doc.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full px-6 py-2 text-xs font-semibold shadow-sm transition-transform hover:scale-[1.02] text-white"
                    style={{ backgroundColor: CTA_GOLD }}
                  >
                    <Heart className="w-3.5 h-3.5 fill-white mr-1.5" />
                    Xác nhận tham dự
                  </button>
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------
                KHỐI 4: SỰ KIỆN VÀ CHỈ ĐƯỜNG (map / multi-events)
                Lặp qua toàn bộ mảng visibleEvents để hiển thị đầy đủ các lễ
                ------------------------------------------------------------ */}
            {!hiddenSections.has("map") && visibleEvents.length > 0 && (
              <section
                style={{ order: orderOf("map", 3) }}
                className="relative rounded-3xl border border-[#E5D8BF] bg-white/85 p-6 sm:p-10 shadow-[0_12px_36px_rgba(58,50,44,0.05)] backdrop-blur-sm"
              >
                <div className="text-center mb-8">
                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.26em] font-medium text-[#C8AD7F]">
                    ĐỊA ĐIỂM ĐÓN TIẾP
                  </p>
                  <h2
                    className="text-2xl sm:text-3xl font-normal text-[#3A322C] mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Sự Kiện &amp; Chỉ Đường
                  </h2>
                  <div className="my-3">
                    <img
                      src="/templates/bach-lan-lua-nga/divider_pearl.webp"
                      alt=""
                      aria-hidden="true"
                      className="mx-auto w-32 sm:w-40 object-contain opacity-70"
                    />
                  </div>
                </div>

                <div
                  className={cn(
                    "grid gap-5 sm:gap-6",
                    visibleEvents.length > 1
                      ? "grid-cols-1 md:grid-cols-2 text-left"
                      : "max-w-xl mx-auto text-center"
                  )}
                >
                  {visibleEvents.map((evt, idx) => {
                    const evtDateParts = evt.startsAt ? formatWeddingDateParts(evt.startsAt) : dateParts;
                    const evtLunar = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : null;
                    const directionsUrl = getEventDirectionsUrl(evt);
                    return (
                      <div
                        key={evt.id || idx}
                        className="rounded-2xl bg-gradient-to-b from-[#FFFFFF] to-[#F3EDE2] border border-[#E5D8BF] p-5 sm:p-6 text-center flex flex-col items-center justify-between shadow-sm"
                      >
                        <div className="w-full">
                          <span className="inline-block px-3 py-1 rounded-full bg-[#8C724A]/10 text-[#8C724A] font-semibold text-xs tracking-wider uppercase mb-2">
                            {evt.title || (idx === 0 ? "Lễ Cưới" : `Lễ Cưới ${idx + 1}`)}
                          </span>
                          <div className="text-sm font-medium text-[#786D63] flex items-center justify-center gap-1.5 my-1">
                            <Clock className="w-3.5 h-3.5 text-[#C8AD7F]" />
                            <span>
                              {evtDateParts.time || "10:00"} • {evtDateParts.weekday || "Thứ Bảy"}
                            </span>
                          </div>
                          <p
                            className="text-xl sm:text-2xl font-normal text-[#3A322C] my-1"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {evtDateParts.day} Tháng {evtDateParts.month}, {evtDateParts.year}
                          </p>
                          {evtLunar && (
                            <p className="text-xs text-[#786D63] italic font-serif mb-2">
                              (Nhằm {evtLunar})
                            </p>
                          )}

                          <div className="mt-3 pt-3 border-t border-[#E5D8BF]/60">
                            <p className="font-semibold text-[#8C724A] text-sm sm:text-base">
                              {evt.venueName || "Trung Tâm Tiệc Cưới"}
                            </p>
                            {evt.venueAddress && (
                              <p className="text-xs text-[#786D63] mt-1 max-w-xs mx-auto">
                                {evt.venueAddress}
                              </p>
                            )}
                          </div>
                        </div>

                        {directionsUrl && (
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-medium tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-sm text-white"
                            style={{ backgroundColor: CTA_GOLD }}
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#F3EDE2]" />
                            <span>CHỈ ĐƯỜNG TRÊN GOOGLE MAPS</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------
                KHỐI 5: TRANG PHỤC GỢI Ý & LỊCH TRÌNH (dresscode)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("dresscode") && (
              <div
                style={{ order: orderOf("dresscode", 4) }}
                className="space-y-6"
              >
                <section className="relative rounded-3xl border border-[#E5D8BF] bg-white/85 p-6 sm:p-10 shadow-[0_12px_36px_rgba(58,50,44,0.05)] backdrop-blur-sm text-center">
                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.26em] font-medium text-[#C8AD7F]">
                    TRANG PHỤC GỢI Ý
                  </p>
                  <h2
                    className="text-2xl sm:text-3xl font-normal text-[#3A322C] mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Sắc Màu Đồng Điệu
                  </h2>
                  <div className="my-3">
                    <img
                      src="/templates/bach-lan-lua-nga/divider_pearl.webp"
                      alt=""
                      aria-hidden="true"
                      className="mx-auto w-32 sm:w-40 object-contain opacity-70"
                    />
                  </div>
                  <p className="mx-auto max-w-md text-xs sm:text-sm text-[#786D63] font-serif italic">
                    &ldquo;Gửi gắm vài sắc màu dịu nhẹ để ngày chung vui thêm phần hài hòa và trang trọng.&rdquo;
                  </p>

                  <div className="mt-6 flex items-center justify-center gap-6">
                    {dressCodeSwatches.map((swatch, idx) => (
                      <div
                        key={idx}
                        className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-white shadow-[0_4px_12px_rgba(58,50,44,0.12)] transition-transform hover:scale-110"
                        style={{ backgroundColor: swatch.color }}
                        title={swatch.label}
                      />
                    ))}
                  </div>
                </section>

                {/* Timeline Lịch trình chi tiết ngày cưới (chỉ render khi có dữ liệu thật) */}
                {data.timeline && data.timeline.length > 0 && (
                  <section className="relative rounded-3xl border border-[#E5D8BF] bg-white/85 p-6 sm:p-10 shadow-[0_12px_36px_rgba(58,50,44,0.05)] backdrop-blur-sm">
                    <div className="text-center mb-6">
                      <p className="text-[11px] sm:text-xs uppercase tracking-[0.26em] font-medium text-[#C8AD7F]">
                        NHỊP ĐIỆU NGÀY VUI
                      </p>
                      <h2
                        className="text-2xl sm:text-3xl font-normal text-[#3A322C] mt-1"
                        style={{ fontFamily: TITLE_FONT }}
                      >
                        Lịch Trình Chi Tiết
                      </h2>
                    </div>

                    <div className="relative border-l-2 border-[#C8AD7F]/40 ml-4 sm:ml-8 pl-5 sm:pl-7 space-y-6">
                      {data.timeline.map((item, idx) => (
                        <div key={item.id || idx} className="relative group">
                          <div className="absolute -left-[27px] sm:-left-[35px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#8C724A] ring-4 ring-[#FBF9F4] shadow" />
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-semibold text-[#8C724A] tracking-wider">
                              {item.time}
                            </span>
                            <p
                              className="text-base sm:text-lg font-medium text-[#3A322C] mt-0.5"
                              style={{ fontFamily: TITLE_FONT }}
                            >
                              {item.label}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------
                KHỐI 6: KHOẢNH KHẮC LƯU GIỮ (album)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <section
                style={{ order: orderOf("album", 5) }}
                className="relative rounded-3xl border border-[#E5D8BF] bg-white/85 p-6 sm:p-10 shadow-[0_12px_36px_rgba(58,50,44,0.05)] backdrop-blur-sm text-center"
              >
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.26em] font-medium text-[#C8AD7F]">
                  KỶ NIỆM ĐONG ĐẦY
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-normal text-[#3A322C] mt-1"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Khoảnh Khắc Lưu Giữ
                </h2>
                <div className="my-3">
                  <img
                    src="/templates/bach-lan-lua-nga/divider_pearl.webp"
                    alt=""
                    aria-hidden="true"
                    className="mx-auto w-32 sm:w-40 object-contain opacity-70"
                  />
                </div>

                <div className="relative mx-auto mt-6 max-w-xl">
                  <div
                    onClick={() => setLightboxIndex(activePhotoIdx)}
                    className="group relative aspect-[3/2] sm:aspect-[16/10] overflow-hidden rounded-2xl border border-[#E5D8BF] bg-[#F3EDE2] shadow-md cursor-pointer"
                  >
                    <img
                      src={albumPhotos[activePhotoIdx]?.url}
                      alt={albumPhotos[activePhotoIdx]?.alt || `Ảnh kỷ niệm ${activePhotoIdx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <span className="text-xs text-white font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                        Nhấn để xem phóng to
                      </span>
                    </div>
                  </div>

                  {albumPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : albumPhotos.length - 1));
                        }}
                        aria-label="Ảnh trước"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-[#3A322C] shadow-md hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-sm"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIdx((prev) => (prev < albumPhotos.length - 1 ? prev + 1 : 0));
                        }}
                        aria-label="Ảnh tiếp theo"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-[#3A322C] shadow-md hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-sm"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      <div className="mt-4 flex items-center justify-center gap-1.5 flex-wrap">
                        {albumPhotos.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActivePhotoIdx(idx)}
                            aria-label={`Chuyển đến ảnh ${idx + 1}`}
                            className={cn(
                              "h-2 rounded-full transition-all cursor-pointer",
                              idx === activePhotoIdx
                                ? "w-6 bg-[#8C724A]"
                                : "w-2 bg-[#E5D8BF] hover:bg-[#C8AD7F]"
                            )}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------
                KHỐI 7: QR ALBUM ẢNH CƯỚI (albumQr độc lập)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("albumQr") && data.plan !== "free" && Boolean(weddingSlug) && (
              <section
                style={{ order: orderOf("albumQr", 6) }}
                className="relative rounded-3xl border border-[#E5D8BF] bg-white/85 p-6 sm:p-10 shadow-[0_12px_36px_rgba(58,50,44,0.05)] backdrop-blur-sm text-center flex flex-col items-center justify-center"
              >
                <GuestAlbumQr
                  slug={weddingSlug!}
                  accentColor="#8C724A"
                  textColor="#3A322C"
                  mutedColor="#786D63"
                />
              </section>
            )}

            {/* ------------------------------------------------------------
                KHỐI 8: HỘP QUÀ CHÚC PHÚC (gift)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("gift") && (
              <section
                style={{ order: orderOf("gift", 7) }}
                className="relative rounded-3xl border border-[#E5D8BF] bg-white/85 p-6 sm:p-10 shadow-[0_12px_36px_rgba(58,50,44,0.05)] backdrop-blur-sm text-center"
              >
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.26em] font-medium text-[#C8AD7F]">
                  CHÚC PHÚC YÊU THƯƠNG
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-normal text-[#3A322C] mt-1"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Hộp Quà Chúc Phúc
                </h2>
                <div className="my-3">
                  <img
                    src="/templates/bach-lan-lua-nga/divider_pearl.webp"
                    alt=""
                    aria-hidden="true"
                    className="mx-auto w-32 sm:w-40 object-contain opacity-70"
                  />
                </div>
                <p className="mx-auto max-w-md text-xs sm:text-sm text-[#786D63] italic font-serif leading-relaxed">
                  &ldquo;Sự hiện diện của Quý khách là niềm hạnh phúc trọn vẹn nhất của hai gia đình. Nếu ở xa không tiện ghé chung vui, Quý khách có thể gửi lời chúc qua hộp quà nhỏ bên dưới.&rdquo;
                </p>

                {/* Hộp Quà Lụa Tương Tác 3 Trạng Thái */}
                <div className="relative mx-auto mt-6 max-w-[260px] sm:max-w-[300px]">
                  <div
                    onMouseEnter={() => !isGiftOpening && setActiveGiftState("glow")}
                    onMouseLeave={() => !isGiftOpening && activeGiftState !== "open" && setActiveGiftState("normal")}
                    onClick={handleGiftClick}
                    className="group cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
                  >
                    <img
                      src={
                        activeGiftState === "open"
                          ? "/templates/bach-lan-lua-nga/gift_box_open.webp"
                          : activeGiftState === "glow"
                            ? "/templates/bach-lan-lua-nga/gift_box_glow.webp"
                            : "/templates/bach-lan-lua-nga/gift_box_normal.webp"
                      }
                      alt="Hộp Quà Lụa Bạch Lan"
                      className="mx-auto w-full object-contain drop-shadow-[0_8px_24px_rgba(58,50,44,0.10)] transition-all duration-300"
                    />
                    <div className="mt-3">
                      <span className="inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-medium tracking-wider bg-[#F3EDE2] text-[#3A322C] border border-[#E5D8BF] shadow-sm group-hover:bg-[#8C724A] group-hover:text-white transition-colors">
                        <span>MỞ HỘP QUÀ MỪNG</span>
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------
                KHỐI 9: XÁC NHẬN THAM DỰ & GỬI LỜI CHÚC (rsvp)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("rsvp") && (
              <section
                id="rsvp"
                style={{ order: orderOf("rsvp", 8) }}
                className="relative rounded-3xl border border-[#E5D8BF] bg-white/85 p-6 sm:p-10 shadow-[0_12px_36px_rgba(58,50,44,0.05)] backdrop-blur-sm"
              >
                <span id="rsvp-section" className="sr-only" />
                <div className="text-center mb-6">
                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.26em] font-medium text-[#C8AD7F]">
                    HỒI ĐÁP THÂN TÌNH
                  </p>
                  <h2
                    className="text-2xl sm:text-3xl font-normal text-[#3A322C] mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Xác Nhận Tham Dự &amp; Gửi Lời Chúc
                  </h2>
                  <div className="my-3">
                    <img
                      src="/templates/bach-lan-lua-nga/divider_pearl.webp"
                      alt=""
                      aria-hidden="true"
                      className="mx-auto w-32 sm:w-40 object-contain opacity-70"
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-[#786D63] italic font-serif">
                    Để gia đình chuẩn bị chu đáo nhất cho sự hiện diện của Quý khách
                  </p>
                </div>

                <div className="[&_select]:!bg-white [&_select]:!text-[#3A322C] [&_option]:!bg-white [&_option]:!text-[#3A322C] [&_input]:!bg-[#FAF8F5] [&_input]:!text-[#3A322C] [&_textarea]:!bg-[#FAF8F5] [&_textarea]:!text-[#3A322C]">
                  <TemplateRsvpSection
                    data={data}
                    mode={mode}
                    tone="flowery"
                    customTheme={{
                      isDark: false,
                      card: "border border-[#E5D8BF] bg-white text-[#3A322C]",
                      input: "border border-[#D5C8BA] bg-[#FAF8F5] text-[#3A322C] placeholder:text-[#786D63]/60 focus:border-[#8C724A] focus:ring-[#8C724A]",
                      primaryBtn: "bg-[#8C724A] text-white hover:bg-[#735C3A] font-medium",
                      outlineBtn: "border border-[#8C724A] bg-[#FAF8F5] text-[#8C724A] hover:bg-[#8C724A]/10",
                      alert: "border-[#E5D8BF] bg-[#FBF9F4] text-[#3A322C]",
                      badge: "border-[#E5D8BF] bg-[#FBF9F4] text-[#8C724A]",
                      optionBg: "#FFFFFF",
                      optionColor: "#3A322C",
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
              </section>
            )}
          </div>

          {/* ------------------------------------------------------------
              CHÂN TRANG (FOOTER)
              Độc lập ngoài flex container có order, không lặp ngày cưới
              ------------------------------------------------------------ */}
          <footer className="pt-8 sm:pt-12 pb-4 text-center">
            <div className="mb-4">
              <img
                src="/templates/bach-lan-lua-nga/divider_pearl.webp"
                alt=""
                aria-hidden="true"
                className="mx-auto w-36 sm:w-44 object-contain opacity-75"
              />
            </div>
            <p
              className="text-lg sm:text-xl font-normal text-[#3A322C]"
              style={{ fontFamily: TITLE_FONT }}
            >
              {groomName} &amp; {brideName}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-[#786D63] italic font-serif max-w-md mx-auto leading-relaxed">
              &ldquo;Cảm ơn Quý khách đã dành thời gian sẻ chia niềm vui và chúc phúc cho chúng tôi.&rdquo;
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
        onClose={handleCloseModal}
        gift={data.gift}
        plan={data.plan ?? "free"}
        coupleName={`${groomName} & ${brideName}`}
        guestName={guestName ?? null}
        tone="flowery"
      />
    </div>
  );
}
