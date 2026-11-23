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
   BẢNG MÀU CHÍNH THỨC: ANH ĐÀO PHẤN TUYẾT (anh-dao-phan-tuyet)
   - Hồng Mận Trầm (Velvet Rose Berry): #7A3447 (sâu #592231, hover #914056)
   - Hồng Anh Đào Phấn (Soft Sakura Blush): #D48A9B (nhạt #F5DCE2)
   - Lụa Phấn Tuyết (Snow-Blush Silk): #FFF9FA (thẻ nổi #FFFFFF, nền ấm #FCEFF2)
   - Vàng Hồng Nhạt (Soft Rose-Gold): #D9A7A0
   - Chữ nội dung trên nền sáng: #6D4550 / #8C6872 (tương phản cao, dịu mắt)
   - Dress Code mặc định: #6E2233 (Đỏ mận dịu), #E5A9B4 (Hồng anh đào), #FAF6F2 (Trắng kem ngà)
   ============================================================ */

const BERRY_MAIN = "#7A3447";
const BERRY_DEEP = "#592231";
const BERRY_HOVER = "#914056";

const SAKURA_BLUSH = "#D48A9B";
const SAKURA_LIGHT = "#F5DCE2";

const SILK_SNOW = "#FFF9FA";
const SILK_CARD = "#FFFFFF";
const SILK_WARM = "#FCEFF2";

const ROSE_GOLD = "#D9A7A0";

const TEXT_TITLE = "#7A3447";
const TEXT_BODY = "#6D4550";
const TEXT_MUTED = "#8C6872";

const TITLE_FONT = "'Playfair Display', Georgia, serif";
const BODY_FONT = "'Be Vietnam Pro', sans-serif";



/* ------------------------------------------------------------
   Hiệu ứng Cánh Đào Bay Nhẹ (SakuraPetalsDrift)
   - 8–10 cánh hoa anh đào trôi êm đềm
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function SakuraPetalsDrift({ count = 9 }: { count?: number }) {
  const reduce = useReducedMotion();
  const petals = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 11) % 92 + 4}%`,
      size: (idx % 3) * 3 + 10, // 10px..16px
      duration: 10 + (idx % 4) * 3, // 10s..19s
      delay: (idx * 0.7) % 6,
      sway: 20 + (idx % 3) * 15,
      rotateInit: idx * 37,
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden z-[5]"
      aria-hidden="true"
    >
      {petals.map((p) => (
        <m.div
          key={p.id}
          className="absolute"
          style={{
            left: p.left,
            top: "-24px",
            width: `${p.size}px`,
            height: `${p.size * 1.25}px`,
          }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, p.id % 2 === 0 ? p.sway : -p.sway, 0],
            rotate: [p.rotateInit, p.rotateInit + 360],
            opacity: [0, 0.85, 0.95, 0.7, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        >
          {/* SVG cánh hoa anh đào hình giọt nước cong mềm */}
          <svg
            viewBox="0 0 20 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_2px_4px_rgba(212,138,155,0.25)]"
          >
            <path
              d="M10 0C6 7 0 13 0 18C0 22 4 25 10 25C16 25 20 22 20 18C20 13 14 7 10 0Z"
              fill="url(#sakura-petal-grad)"
              opacity="0.88"
            />
            <defs>
              <linearGradient
                id="sakura-petal-grad"
                x1="10"
                y1="0"
                x2="10"
                y2="25"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#F5DCE2" />
                <stop offset="0.6" stopColor="#E5A9B4" />
                <stop offset="1" stopColor="#D48A9B" />
              </linearGradient>
            </defs>
          </svg>
        </m.div>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT: AnhDaoPhanTuyetTemplate
   ============================================================ */
export default function AnhDaoPhanTuyetTemplate({
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
    } catch { }
    setIsOpening(true);
    playCoverSfx("silk");
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

  // Multi-event support
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent.startsAt || data.date || "2027-03-20";
  const dateParts = formatWeddingDateParts(eventDateStr);
  const lunarDateClean = targetEvent.lunarDate
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

  // Calendar month days calculation (hỗ trợ đa lễ)
  const calendarData = React.useMemo(() => {
    const d = new Date(eventDateStr);
    const year = d.getFullYear() || 2027;
    const month = d.getMonth() || 2;
    const currentDay = d.getDate() || 20;

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

    return { year, month: month + 1, currentDay, eventDays, firstDayIndex, totalDays };
  }, [eventDateStr, visibleEvents]);

  // Section Ordering & Visibility
  const hiddenSections = React.useMemo(() => {
    return new Set(data.hiddenSections || []);
  }, [data.hiddenSections]);

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

  const isBrideFirst = data.hostFirst === "bride";

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

  // Hero couple photo
  const heroPhotoUrl = data.photos?.heroUrl;

  // Parents name splitting
  const groomParents = data.couple?.groomParents || "";
  const brideParents = data.couple?.brideParents || "";
  const [gDad, gMom] = groomParents.includes("&")
    ? groomParents.split("&").map((s) => s.trim())
    : [groomParents, ""];
  const [bDad, bMom] = brideParents.includes("&")
    ? brideParents.split("&").map((s) => s.trim())
    : [brideParents, ""];

  // Dress code default swatches
  const dressCodeSwatches = ["#6E2233", "#E5A9B4", "#FAF6F2"];

  // Couple display name
  const groomName = data.couple?.groomName || "Chú Rể";
  const brideName = data.couple?.brideName || "Cô Dâu";

  return (
    <div
      className={cn(
        "relative w-full bg-[#FFF9FA] text-[#6D4550] selection:bg-[#F5DCE2] selection:text-[#7A3447]",
        !coverGone && (contained ? "h-full overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden")
      )}
      style={{ fontFamily: BODY_FONT }}
    >
      {/* ============================================================
          1. MÀN HÌNH BÌA MỞ THIỆP (Cover Screen)
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
            backgroundColor: SILK_SNOW,
          }}
        >
          {/* z-0: Ảnh nền lụa hoa anh đào sắc nét 100% */}
          <picture className="absolute inset-0 z-0 pointer-events-none">
            {!contained && (
              <source
                media="(min-width: 641px)"
                srcSet="/templates/anh-dao-phan-tuyet/background.webp"
              />
            )}
            <img
              src="/templates/anh-dao-phan-tuyet/background-mobile.webp"
              alt="Mùa hoa anh đào"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </picture>

          {/* z-[5]: Cánh hoa anh đào rơi êm đềm */}
          <SakuraPetalsDrift count={10} />

          {/* z-20: Thẻ bìa trung tâm giấy lụa trắng phấn */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-20 my-auto w-full max-w-[328px] sm:max-w-[380px] mx-auto rounded-3xl border border-[#D9A7A0]/50 bg-white/94 p-6 sm:p-8 text-center shadow-[0_20px_56px_rgba(122,52,71,0.10)] backdrop-blur-sm"
          >
            {/* Nhánh hoa góc trang trí bất đối xứng (trên-trái & dưới-phải lật 180°) */}
            <img
              src="/templates/anh-dao-phan-tuyet/corner-sakura.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -top-3 -left-3 w-14 sm:w-16 object-contain z-10 opacity-90 drop-shadow-sm"
            />
            <img
              src="/templates/anh-dao-phan-tuyet/corner-sakura.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-3 -right-3 w-14 sm:w-16 object-contain z-10 opacity-90 rotate-180 drop-shadow-sm"
            />

            {/* Con dấu sáp phấn ngọc khắc bông anh đào */}
            <div className="relative mx-auto mb-3 w-16 h-16 sm:w-20 sm:h-20">
              <img
                src="/templates/anh-dao-phan-tuyet/wax-seal.webp"
                alt="Con Dấu Sáp Hoa Anh Đào"
                className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(122,52,71,0.18)]"
              />
            </div>

            {/* Tiêu đề thiệp */}
            <p
              className="text-[11px] sm:text-xs uppercase tracking-[0.24em] font-medium text-[#D48A9B]"
              style={{ fontFamily: BODY_FONT }}
            >
              THIỆP BÁO HỶ &middot; MÙA YÊU
            </p>

            {/* Tên cặp đôi 3 dòng: Chú rể / & / Cô dâu */}
            <div className="my-3 space-y-0.5">
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight text-[#7A3447] break-words"
                style={{ fontFamily: TITLE_FONT }}
              >
                {groomName}
              </h1>
              <div className="flex items-center justify-center gap-2">
                <span className="h-px w-6 bg-[#D9A7A0]/50" />
                <span
                  className="font-serif italic text-lg sm:text-xl text-[#D48A9B]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  &amp;
                </span>
                <span className="h-px w-6 bg-[#D9A7A0]/50" />
              </div>
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight text-[#7A3447] break-words"
                style={{ fontFamily: TITLE_FONT }}
              >
                {brideName}
              </h1>
            </div>

            {/* Dải nhánh hoa anh đào ngang */}
            <div className="my-3">
              <img
                src="/templates/anh-dao-phan-tuyet/divider-sakura.webp"
                alt=""
                aria-hidden="true"
                className="mx-auto w-36 sm:w-44 object-contain opacity-85"
              />
            </div>

            {/* Lời gửi trao tao nhã & Tên khách mời */}
            <p className="text-xs sm:text-sm text-[#8C6872] italic font-serif">
              {guestName ? `Kính mời ${guestName}` : "Thân gửi người thương"}
            </p>
            <p className="mt-1 text-[11px] text-[#D48A9B] uppercase tracking-wider">
              Cùng chung vui trong ngày hạnh phúc
            </p>

            {/* Nút bấm Mở Thiệp */}
            <button
              type="button"
              onClick={handleOpenCover}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full px-7 py-2.5 text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
              style={{
                backgroundColor: BERRY_MAIN,
                color: SILK_SNOW,
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
          src={data.music.src || "/media/priority1.mp3"}
          title={data.music.title || "Giai điệu Mùa Hoa Anh Đào"}
          visible={coverGone}
          tone="flowery"
        />
      )}

      {/* ============================================================
          3. RUỘT THIỆP CHÍNH (Main Wedding Invitation Content)
          ============================================================ */}
      <div
        className={cn(
          "w-full transition-opacity duration-700",
          !isOpen ? "hidden opacity-0" : "block opacity-100"
        )}
      >
        <div className="mx-auto max-w-[840px] px-4 sm:px-6 py-8 sm:py-16 space-y-12 sm:space-y-18">
          {/* ------------------------------------------------------------
              KHỐI 1: HERO — "KHUNG VÒM CÀNH ANH ĐÀO"
              (Không lặp ngày cưới tại Hero)
              ------------------------------------------------------------ */}
          <section className="relative text-center pt-4 sm:pt-8 overflow-hidden">
            {/* Cánh hoa nhẹ trang trí nền Hero */}
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-30">
              <SakuraPetalsDrift count={6} />
            </div>

            {/* Dòng thơ mở đầu tao nhã */}
            <p
              className="text-sm sm:text-base font-serif italic text-[#D48A9B] tracking-wide"
              style={{ fontFamily: TITLE_FONT }}
            >
              Gửi trao một mùa xuân vẹn tròn
            </p>

            {/* Tên cặp đôi 3 dòng nghệ thuật */}
            <div className="mt-2 mb-3 space-y-1">
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#7A3447] break-words"
                style={{ fontFamily: TITLE_FONT }}
              >
                {groomName}
              </h1>
              <div className="flex items-center justify-center gap-3">
                <span className="h-px w-10 sm:w-16 bg-[#D9A7A0]/40" />
                <span
                  className="font-serif italic text-xl sm:text-2xl text-[#D48A9B]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  &amp;
                </span>
                <span className="h-px w-10 sm:w-16 bg-[#D9A7A0]/40" />
              </div>
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#7A3447] break-words"
                style={{ fontFamily: TITLE_FONT }}
              >
                {brideName}
              </h1>
            </div>

            {/* Dải phân cách hoa anh đào */}
            <div className="my-4">
              <img
                src="/templates/anh-dao-phan-tuyet/divider-sakura.webp"
                alt=""
                aria-hidden="true"
                className="mx-auto w-40 sm:w-52 object-contain opacity-85"
              />
            </div>

            {/* Khung Vòm Cành Anh Đào ôm trọn ảnh cưới */}
            <div className="relative mx-auto mt-6 max-w-[320px] sm:max-w-[400px] aspect-[3/4]">
              {/* Lớp ảnh cặp đôi đặt bên dưới */}
              {heroPhotoUrl ? (
                <div className="absolute inset-[5%_7%_4%_7%] rounded-t-[140px] sm:rounded-t-[175px] overflow-hidden shadow-inner bg-[#FCEFF2]">
                  <img
                    src={heroPhotoUrl}
                    alt="Ảnh cưới đôi uyên ương"
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                </div>
              ) : (
                <div className="absolute inset-[5%_7%_4%_7%] rounded-t-[140px] sm:rounded-t-[175px] overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#FFF0F3] to-[#FCEFF2] text-center border border-[#F5DCE2]">
                  <img
                    src="/templates/anh-dao-phan-tuyet/wax-seal.webp"
                    alt=""
                    className="w-16 h-16 sm:w-20 sm:h-20 opacity-85 mb-3"
                  />
                  <p
                    className="font-serif text-lg sm:text-xl font-bold text-[#7A3447]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {groomName} &amp; {brideName}
                  </p>
                  <p className="mt-1 text-xs text-[#8C6872] font-serif italic">
                    Mùa Hoa Anh Đào
                  </p>
                </div>
              )}

              {/* Lớp vòm hoa anh đào sakura-arch.webp nằm trên ảnh */}
              <img
                src="/templates/anh-dao-phan-tuyet/sakura-arch.webp"
                alt="Khung Vòm Cành Anh Đào"
                className="pointer-events-none absolute inset-0 w-full h-full object-contain z-10 drop-shadow-[0_10px_24px_rgba(122,52,71,0.12)]"
              />
            </div>

            {/* Câu mở lời ngỏ trang nhã */}
            <p className="mt-6 mx-auto max-w-md text-xs sm:text-sm text-[#8C6872] leading-relaxed font-serif italic">
              &ldquo;Khoảnh khắc hoa anh đào nở rộ cũng là khi hai trái tim tìm thấy bến đỗ bình yên, hẹn ước trọn đời bên nhau.&rdquo;
            </p>
          </section>

          {/* ------------------------------------------------------------
              DYNAMIC SECTIONS THEO THỨ TỰ data.sectionOrder
              ------------------------------------------------------------ */}
          <div className="flex flex-col space-y-12 sm:space-y-18">
            {/* ------------------------------------------------------------
                KHỐI 2: HAI MÁI ẤM CHUNG VUI & LỄ THÀNH HÔN
                (family — Vị trí ngày cưới #1)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("family") && (
              <section
                style={{ order: orderOf("family", 1) }}
                className="relative rounded-3xl border border-[#F2D5DC] bg-white/80 p-6 sm:p-10 shadow-[0_12px_36px_rgba(217,167,160,0.10)] backdrop-blur-sm"
              >
                {/* Tiêu đề phần gia đình văn phong tao nhã */}
                <div className="text-center mb-8">
                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.24em] font-medium text-[#D48A9B]">
                    GẮN KẾT YÊU THƯƠNG
                  </p>
                  <h2
                    className="text-2xl sm:text-3xl font-bold text-[#7A3447] mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hai Mái Ấm Chung Vui
                  </h2>
                  <p className="text-xs sm:text-sm text-[#8C6872] italic font-serif mt-1">
                    Trong niềm hân hoan và phúc lành của hai gia đình
                  </p>
                  <div className="my-3">
                    <img
                      src="/templates/anh-dao-phan-tuyet/divider-sakura.webp"
                      alt=""
                      aria-hidden="true"
                      className="mx-auto w-32 sm:w-40 object-contain opacity-75"
                    />
                  </div>
                </div>

                {/* 2 Cột Nhà Trai & Nhà Gái cao bằng nhau */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 items-stretch">
                  {(isBrideFirst ? [
                    // Cột Nhà Gái
                    <div key="bride" className="flex flex-col justify-between rounded-2xl border border-[#F5DCE2] bg-[#FFF9FA]/80 p-5 sm:p-6 text-center">
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-[#FCEFF2] text-[#7A3447] text-[11px] uppercase tracking-wider font-semibold mb-3">
                          {data.couple?.brideTitle || "Nhà Gái"}
                        </span>
                        <div className="space-y-1 text-xs sm:text-sm text-[#6D4550]">
                          {bDad ? <p className="font-medium">{bDad}</p> : <p className="font-medium">Ông: Lê Văn C</p>}
                          {bMom ? <p className="font-medium">{bMom}</p> : <p className="font-medium">Bà: Phạm Thị D</p>}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#F5DCE2]">
                        <p className="text-[11px] uppercase tracking-wider text-[#D48A9B]">
                          Cô Dâu
                        </p>
                        <p
                          className="text-lg sm:text-xl font-bold text-[#7A3447] mt-0.5"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {data.couple?.brideFullName || brideName}
                        </p>
                      </div>
                    </div>,
                    // Cột Nhà Trai
                    <div key="groom" className="flex flex-col justify-between rounded-2xl border border-[#F5DCE2] bg-[#FFF9FA]/80 p-5 sm:p-6 text-center">
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-[#FCEFF2] text-[#7A3447] text-[11px] uppercase tracking-wider font-semibold mb-3">
                          {data.couple?.groomTitle || "Nhà Trai"}
                        </span>
                        <div className="space-y-1 text-xs sm:text-sm text-[#6D4550]">
                          {gDad ? <p className="font-medium">{gDad}</p> : <p className="font-medium">Ông: Nguyễn Văn A</p>}
                          {gMom ? <p className="font-medium">{gMom}</p> : <p className="font-medium">Bà: Trần Thị B</p>}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#F5DCE2]">
                        <p className="text-[11px] uppercase tracking-wider text-[#D48A9B]">
                          Chú Rể
                        </p>
                        <p
                          className="text-lg sm:text-xl font-bold text-[#7A3447] mt-0.5"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {data.couple?.groomFullName || groomName}
                        </p>
                      </div>
                    </div>
                  ] : [
                    // Cột Nhà Trai
                    <div key="groom" className="flex flex-col justify-between rounded-2xl border border-[#F5DCE2] bg-[#FFF9FA]/80 p-5 sm:p-6 text-center">
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-[#FCEFF2] text-[#7A3447] text-[11px] uppercase tracking-wider font-semibold mb-3">
                          {data.couple?.groomTitle || "Nhà Trai"}
                        </span>
                        <div className="space-y-1 text-xs sm:text-sm text-[#6D4550]">
                          {gDad ? <p className="font-medium">{gDad}</p> : <p className="font-medium">Ông: Nguyễn Văn A</p>}
                          {gMom ? <p className="font-medium">{gMom}</p> : <p className="font-medium">Bà: Trần Thị B</p>}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#F5DCE2]">
                        <p className="text-[11px] uppercase tracking-wider text-[#D48A9B]">
                          Chú Rể
                        </p>
                        <p
                          className="text-lg sm:text-xl font-bold text-[#7A3447] mt-0.5"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {data.couple?.groomFullName || groomName}
                        </p>
                      </div>
                    </div>,
                    // Cột Nhà Gái
                    <div key="bride" className="flex flex-col justify-between rounded-2xl border border-[#F5DCE2] bg-[#FFF9FA]/80 p-5 sm:p-6 text-center">
                      <div>
                        <span className="inline-block px-3 py-1 rounded-full bg-[#FCEFF2] text-[#7A3447] text-[11px] uppercase tracking-wider font-semibold mb-3">
                          {data.couple?.brideTitle || "Nhà Gái"}
                        </span>
                        <div className="space-y-1 text-xs sm:text-sm text-[#6D4550]">
                          {bDad ? <p className="font-medium">{bDad}</p> : <p className="font-medium">Ông: Lê Văn C</p>}
                          {bMom ? <p className="font-medium">{bMom}</p> : <p className="font-medium">Bà: Phạm Thị D</p>}
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#F5DCE2]">
                        <p className="text-[11px] uppercase tracking-wider text-[#D48A9B]">
                          Cô Dâu
                        </p>
                        <p
                          className="text-lg sm:text-xl font-bold text-[#7A3447] mt-0.5"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {data.couple?.brideFullName || brideName}
                        </p>
                      </div>
                    </div>
                  ])}
                </div>

                {/* Lời ngỏ báo tin gia đình */}
                <div className="mt-8 rounded-2xl bg-gradient-to-b from-[#FFF0F3] to-[#FCEFF2] border border-[#F5DCE2] p-5 sm:p-7 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] font-semibold text-[#7A3447]">
                    TRÂN TRỌNG BÁO TIN
                  </p>
                  <p className="mt-1 text-sm sm:text-base font-serif italic text-[#8C6872]">
                    &ldquo;Hôn lễ được tổ chức trong sự yêu thương và chúc phúc của hai bên gia đình.&rdquo;
                  </p>
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------
                KHỐI 3: ĐẾM NGƯỢC, LỊCH NGÀY CHUNG ĐÔI & BẢN ĐỒ
                (calendar + map — Vị trí ngày cưới #2)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("calendar") && (
              <section
                style={{ order: orderOf("calendar", 2) }}
                className="relative rounded-3xl border border-[#F2D5DC] bg-white/80 p-6 sm:p-10 shadow-[0_12px_36px_rgba(217,167,160,0.10)] backdrop-blur-sm text-center"
              >
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.24em] font-medium text-[#D48A9B]">
                  KHOẢNH KHẮC THIÊNG LIÊNG
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-bold text-[#7A3447] mt-1"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Đếm Ngược Tới Ngày Chung Đôi
                </h2>
                <div className="my-3">
                  <img
                    src="/templates/anh-dao-phan-tuyet/divider-sakura.webp"
                    alt=""
                    aria-hidden="true"
                    className="mx-auto w-32 sm:w-40 object-contain opacity-75"
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
                        className="rounded-2xl border border-[#F5DCE2] bg-[#FFF9FA] p-3 sm:p-4 text-center shadow-sm"
                      >
                        <span
                          className="text-2xl sm:text-3xl font-bold text-[#7A3447] font-serif block tabular-nums"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {String(item.val).padStart(2, "0")}
                        </span>
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#8C6872] font-semibold mt-1 block">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Lịch Tháng với Trái Tim Hồng Mận #7A3447 */}
                <div className="mt-8 max-w-sm mx-auto rounded-2xl border border-[#F5DCE2] bg-[#FFF9FA] p-4 sm:p-6">
                  <p className="text-xs uppercase tracking-widest font-semibold text-[#7A3447] mb-3">
                    THÁNG {calendarData.month} &middot; {calendarData.year}
                  </p>
                  <div className="grid grid-cols-7 gap-1 text-[11px] text-[#8C6872] font-semibold mb-2">
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
                      const isWeddingDay = calendarData.eventDays.has(day);
                      return (
                        <div
                          key={`day-${day}`}
                          className={cn(
                            "relative flex aspect-square items-center justify-center rounded-full font-medium transition-colors",
                            isWeddingDay
                              ? "bg-[#7A3447] text-white font-bold shadow-md"
                              : "text-[#6D4550] hover:bg-[#F5DCE2]/50"
                          )}
                        >
                          {day}
                          {isWeddingDay && (
                            <Heart className="absolute -top-1 -right-1 w-3 h-3 text-[#D48A9B] fill-[#D48A9B] animate-pulse" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hàng nút Thêm vào lịch & Xác nhận tham dự */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <a
                    href={calendarGoogleLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-[#D9A7A0] bg-[#FFF9FA] px-5 py-2 text-xs font-semibold text-[#7A3447] shadow-2xs hover:bg-[#FCEFF2] transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Thêm vào lịch
                  </a>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const doc = e.currentTarget.ownerDocument;
                      const targetEl = doc.getElementById("rsvp") || doc.getElementById("rsvp-wishes") || doc.getElementById("rsvp-section");
                      targetEl?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full px-6 py-2 text-xs font-semibold shadow-2xs transition-transform hover:scale-[1.02] text-white"
                    style={{ backgroundColor: BERRY_MAIN }}
                  >
                    Xác nhận tham dự
                  </button>
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------
                KHỐI SỰ KIỆN VÀ CHỈ ĐƯỜNG (map)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("map") && (
              <section
                style={{ order: orderOf("map", 3) }}
                className="relative rounded-3xl border border-[#F2D5DC] bg-white/80 p-6 sm:p-10 shadow-[0_12px_36px_rgba(217,167,160,0.10)] backdrop-blur-sm text-center"
              >
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.24em] font-medium text-[#D48A9B]">
                  SỰ KIỆN &amp; ĐỊA ĐIỂM
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-bold text-[#7A3447] mt-1"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Sự Kiện Cưới
                </h2>
                <div className="my-3">
                  <img
                    src="/templates/anh-dao-phan-tuyet/divider-sakura.webp"
                    alt=""
                    aria-hidden="true"
                    className="mx-auto w-32 sm:w-40 object-contain opacity-75"
                  />
                </div>

                <div
                  className={cn(
                    "mt-6 grid gap-6",
                    visibleEvents.length === 1 ? "max-w-xl mx-auto" : "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
                  )}
                >
                  {visibleEvents.map((evt, idx) => {
                    const evtDateParts = evt.startsAt ? formatWeddingDateParts(evt.startsAt) : dateParts;
                    const evtLunar = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : null;
                    const directionsUrl = getEventDirectionsUrl(evt);

                    return (
                      <div
                        key={evt.id || idx}
                        className="rounded-2xl border border-[#F5DCE2] bg-[#FFF9FA] p-5 sm:p-7 text-center shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <span
                            className="inline-block px-4 py-1 rounded-full text-xs font-semibold tracking-wider uppercase text-[#FFF9FA]"
                            style={{ backgroundColor: BERRY_MAIN }}
                          >
                            {evt.title || (idx === 0 ? "LỄ THÀNH HÔN" : "TIỆC BÁO HỶ")}
                          </span>

                          <div className="my-3 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm font-semibold text-[#7A3447]">
                            <span className="uppercase">{evtDateParts.weekday}</span>
                            <span className="h-3.5 w-px bg-[#D9A7A0]" />
                            <span>{evtDateParts.time}</span>
                            <span className="h-3.5 w-px bg-[#D9A7A0]" />
                            <span>{evtDateParts.day}/{evtDateParts.month}/{evtDateParts.year}</span>
                          </div>

                          {evtLunar && (
                            <p className="text-xs text-[#8C6872] italic font-serif">
                              (Nhằm {evtLunar})
                            </p>
                          )}

                          <div className="mt-4 pt-3 border-t border-[#F5DCE2]">
                            <h3
                              className="text-lg sm:text-xl font-bold text-[#7A3447]"
                              style={{ fontFamily: TITLE_FONT }}
                            >
                              {evt.venueName}
                            </h3>
                            <p className="text-xs sm:text-sm text-[#8C6872] mt-0.5 max-w-md mx-auto">
                              {evt.venueAddress}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-semibold tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-sm text-white"
                            style={{ backgroundColor: BERRY_MAIN }}
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#F5DCE2]" />
                            <span>CHỈ ĐƯỜNG ĐẾN {(evt.title || "HÔN TRƯỜNG").toUpperCase()}</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------
                KHỐI 4: NHỊP ĐIỆU NGÀY CHUNG VUI & DRESS CODE
                (dresscode)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("dresscode") && (
              <section
                style={{ order: orderOf("dresscode", 4) }}
                className="relative rounded-3xl border border-[#F2D5DC] bg-white/80 p-6 sm:p-10 shadow-[0_12px_36px_rgba(217,167,160,0.10)] backdrop-blur-sm"
              >
                <div className="text-center mb-8">
                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.24em] font-medium text-[#D48A9B]">
                    KHOẢNH KHẮC ĐÁNG NHỚ
                  </p>
                  <h2
                    className="text-2xl sm:text-3xl font-bold text-[#7A3447] mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Nhịp Điệu Ngày Chung Vui
                  </h2>
                  <div className="my-3">
                    <img
                      src="/templates/anh-dao-phan-tuyet/divider-sakura.webp"
                      alt=""
                      aria-hidden="true"
                      className="mx-auto w-32 sm:w-40 object-contain opacity-75"
                    />
                  </div>
                </div>

                {/* Timeline trục dọc màu hồng phấn */}
                {data.timeline && data.timeline.length > 0 && (
                  <div className="relative mx-auto max-w-md pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#D9A7A0]/50 mb-8">
                    {data.timeline.map((step, idx) => (
                      <div key={step.id || idx} className="relative group">
                        <span className="absolute -left-[27px] sm:-left-[35px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#7A3447] shadow-sm transition-transform group-hover:scale-125" />
                        <div className="rounded-xl border border-[#F5DCE2] bg-[#FFF9FA] p-3 sm:p-4 transition-all hover:shadow-sm">
                          <span className="text-xs font-bold text-[#D48A9B] uppercase tracking-wider">
                            {step.time}
                          </span>
                          <h4
                            className="text-sm sm:text-base font-bold text-[#7A3447] mt-0.5"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {step.label}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dress Code: Hiển thị vòng tròn màu trực quan, KHÔNG in mã Hex */}
                {dressCodeSwatches.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-[#F5DCE2] text-center">
                    <p className="text-xs uppercase tracking-widest font-semibold text-[#D48A9B]">
                      DRESS CODE GỢI Ý
                    </p>
                    <p className="text-xs text-[#8C6872] mt-1 font-serif italic">
                      Gợi ý sắc phục dịu nhẹ để cùng lưu giữ những khung hình tươi đẹp nhất
                    </p>
                    <div className="mt-4 flex items-center justify-center gap-4">
                      {dressCodeSwatches.map((color, i) => (
                        <div
                          key={i}
                          className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-white shadow-[0_4px_12px_rgba(122,52,71,0.15)] transition-transform hover:scale-110"
                          style={{ backgroundColor: color }}
                          title={`Gợi ý màu ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ------------------------------------------------------------
                KHỐI 5: LƯU GIỮ MÙA YÊU (CAROUSEL & LIGHTBOX)
                (album)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <section
                style={{ order: orderOf("album", 5) }}
                className="relative rounded-3xl border border-[#F2D5DC] bg-white/80 p-6 sm:p-10 shadow-[0_12px_36px_rgba(217,167,160,0.10)] backdrop-blur-sm text-center"
              >
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.24em] font-medium text-[#D48A9B]">
                  KỶ NIỆM NGỌT NGÀO
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-bold text-[#7A3447] mt-1"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Lưu Giữ Mùa Yêu
                </h2>
                <div className="my-3">
                  <img
                    src="/templates/anh-dao-phan-tuyet/divider-sakura.webp"
                    alt=""
                    aria-hidden="true"
                    className="mx-auto w-32 sm:w-40 object-contain opacity-75"
                  />
                </div>

                {/* Carousel mượt mà bo tròn mềm */}
                <div className="relative mx-auto mt-6 max-w-xl">
                  <div
                    onClick={() => setLightboxIndex(activePhotoIdx)}
                    className="group relative aspect-[3/2] sm:aspect-[16/10] overflow-hidden rounded-2xl border border-[#F5DCE2] bg-[#FFF0F3] shadow-md cursor-pointer"
                  >
                    <img
                      src={albumPhotos[activePhotoIdx]?.url}
                      alt={albumPhotos[activePhotoIdx]?.alt || `Ảnh kỷ niệm ${activePhotoIdx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <span className="text-xs text-white font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                        Nhấn để phóng to
                      </span>
                    </div>
                  </div>

                  {/* Nút điều hướng Carousel */}
                  {albumPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : albumPhotos.length - 1));
                        }}
                        aria-label="Ảnh trước"
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-[#7A3447] shadow-md hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-sm"
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
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-[#7A3447] shadow-md hover:bg-white hover:scale-110 active:scale-95 transition-all cursor-pointer backdrop-blur-sm"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Dải chấm tròn thumbnail */}
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
                                ? "w-6 bg-[#7A3447]"
                                : "w-2 bg-[#D9A7A0]/50 hover:bg-[#D48A9B]"
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
                KHỐI 6: QR ALBUM KHÁCH CHỤP
                (albumQr)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("albumQr") && data.plan !== "free" && weddingSlug && (
              <section
                style={{ order: orderOf("albumQr", 6) }}
                className="relative rounded-3xl border border-[#F2D5DC] bg-white/80 p-6 sm:p-10 shadow-[0_12px_36px_rgba(217,167,160,0.10)] backdrop-blur-sm text-center"
              >
                <GuestAlbumQr />
              </section>
            )}

            {/* ------------------------------------------------------------
                KHỐI 6: HỘP QUÀ BỌC LỤA FUROSHIKI 3 TRẠNG THÁI
                (gift)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("gift") && (
              <section
                style={{ order: orderOf("gift", 5) }}
                className="relative rounded-3xl border border-[#F2D5DC] bg-white/80 p-6 sm:p-10 shadow-[0_12px_36px_rgba(217,167,160,0.10)] backdrop-blur-sm text-center"
              >
                <p className="text-[11px] sm:text-xs uppercase tracking-[0.24em] font-medium text-[#D48A9B]">
                  CHÚC PHÚC Ý NGHĨA
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-bold text-[#7A3447] mt-1"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Gửi Trao Lời Chúc
                </h2>
                <div className="my-3">
                  <img
                    src="/templates/anh-dao-phan-tuyet/divider-sakura.webp"
                    alt=""
                    aria-hidden="true"
                    className="mx-auto w-32 sm:w-40 object-contain opacity-75"
                  />
                </div>
                <p className="mx-auto max-w-md text-xs sm:text-sm text-[#8C6872] italic font-serif leading-relaxed">
                  &ldquo;Sự hiện diện và lời chúc phúc của bạn trong ngày vui là món quà ấm áp nhất với chúng mình.&rdquo;
                </p>

                {/* Hộp Quà Furoshiki Tương Tác 3 Trạng Thái */}
                <div className="relative mx-auto mt-6 max-w-[260px] sm:max-w-[300px]">
                  <div
                    onMouseEnter={() => !isGiftOpening && setActiveParcel("glow")}
                    onMouseLeave={() => !isGiftOpening && activeParcel !== "open" && setActiveParcel("normal")}

                    onClick={handleGiftClick}
                    className="group cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95"
                  >
                    <img
                      src={
                        activeParcel === "active" || activeParcel === "open"
                          ? "/templates/anh-dao-phan-tuyet/gift-active.webp"
                          : activeParcel === "hover" || activeParcel === "glow"
                            ? "/templates/anh-dao-phan-tuyet/gift-hover.webp"
                            : "/templates/anh-dao-phan-tuyet/gift-normal.webp"
                      }
                      alt="Hộp Quà Bọc Lụa Furoshiki"
                      className="mx-auto w-full object-contain drop-shadow-[0_8px_24px_rgba(122,52,71,0.16)] transition-all duration-300"
                    />
                    <div className="mt-3">
                      <span className="inline-flex items-center justify-center rounded-full px-5 py-2 text-xs font-semibold tracking-wider bg-[#FCEFF2] text-[#7A3447] border border-[#F5DCE2] shadow-sm group-hover:bg-[#7A3447] group-hover:text-white transition-colors">
                        <span>MỞ HỘP QUÀ MỪNG</span>
                      </span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ------------------------------------------------------------
                KHỐI 7: GỬI LỜI HỒI ĐÁP & SỔ LƯU BÚT (RSVP)
                (rsvp)
                ------------------------------------------------------------ */}
            {!hiddenSections.has("rsvp") && (
              <section
                id="rsvp"
                style={{ order: orderOf("rsvp", 8) }}
                className="relative rounded-3xl border border-[#F2D5DC] bg-white/80 p-6 sm:p-10 shadow-[0_12px_36px_rgba(217,167,160,0.10)] backdrop-blur-sm"
              >
                <div className="text-center mb-6">
                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.24em] font-medium text-[#D48A9B]">
                    XÁC NHẬN THAM DỰ
                  </p>
                  <h2
                    className="text-2xl sm:text-3xl font-bold text-[#7A3447] mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Gửi Lời Hồi Đáp &amp; Chúc Phúc
                  </h2>
                  <div className="my-3">
                    <img
                      src="/templates/anh-dao-phan-tuyet/divider-sakura.webp"
                      alt=""
                      aria-hidden="true"
                      className="mx-auto w-32 sm:w-40 object-contain opacity-75"
                    />
                  </div>
                  <p className="text-xs sm:text-sm text-[#8C6872] italic font-serif">
                    Để gia đình chuẩn bị chu đáo nhất cho sự hiện diện của bạn
                  </p>
                </div>

                <div className="[&_select]:!bg-white [&_select]:!text-[#6D4550] [&_option]:!bg-white [&_option]:!text-[#6D4550] [&_input]:!bg-[#FFF9FA] [&_input]:!text-[#6D4550] [&_textarea]:!bg-[#FFF9FA] [&_textarea]:!text-[#6D4550]">
                  <TemplateRsvpSection
                    data={data}
                    mode={mode}
                    tone="flowery"
                    customTheme={{
                      isDark: false,
                      card: "border border-[#F2D5DC] bg-white text-[#6D4550]",
                      input: "border border-[#D9A7A0] bg-[#FFF9FA] text-[#6D4550] placeholder:text-[#8C6872]/60 focus:border-[#7A3447] focus:ring-[#7A3447]",
                      primaryBtn: "bg-[#7A3447] text-[#FFF9FA] hover:bg-[#914056] font-semibold",
                      outlineBtn: "border border-[#7A3447] bg-[#FFF9FA] text-[#7A3447] hover:bg-[#7A3447]/10",
                      alert: "border-[#F2D5DC] bg-[#FFF9FA] text-[#6D4550]",
                      badge: "border-[#F2D5DC] bg-[#FFF9FA] text-[#7A3447]",
                      optionBg: "#FFFFFF",
                      optionColor: "#6D4550",
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
                src="/templates/anh-dao-phan-tuyet/divider-sakura.webp"
                alt=""
                aria-hidden="true"
                className="mx-auto w-36 sm:w-44 object-contain opacity-80"
              />
            </div>
            <p
              className="text-lg sm:text-xl font-bold text-[#7A3447]"
              style={{ fontFamily: TITLE_FONT }}
            >
              {groomName} &amp; {brideName}
            </p>
            <p className="mt-2 text-xs sm:text-sm text-[#8C6872] italic font-serif max-w-md mx-auto leading-relaxed">
              &ldquo;Chân thành cảm ơn sự hiện diện và những lời chúc phúc ngọt ngào của bạn dành cho chúng mình trong mùa xuân hạnh phúc.&rdquo;
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
        tone="ruby"
      />
    </div>
  );
}
