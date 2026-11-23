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
   BẢNG MÀU CHÍNH THỨC: YÊN CHI MẪU ĐƠN (yen-chi-mau-don)
   - Nhung đỏ rượu vang chủ đạo: #4A0E17 / #5C1420 (đậm #380911, hover #6B1422)
   - Nền giấy kem ngà: #FBF7F2 (thẻ nổi #FFFFFF, nền nhấn dịu #F4ECE2)
   - Vàng cổ ánh kim: #C6A052 (nhạt #E4D1A7)
   - Chữ trên nền sáng: #3D151C (chính), #7A5C61 (phụ)
   - Chữ trên nền đỏ nhung: #FBF7F2 (chính), #E4D1A7 (nhấn vàng)
   - Dress Code mặc định: #4A0E17 (Đỏ nhung rượu vang), #C6A052 (Vàng cổ ánh kim), #FBF7F2 (Trắng kem ngà)
   ============================================================ */

const BURGUNDY_MAIN = "#4A0E17";
const BURGUNDY_DEEP = "#380911";
const BURGUNDY_HOVER = "#6B1422";
const BURGUNDY_ACCENT = "#5C1420";

const IVORY_BG = "#FBF7F2";
const IVORY_CARD = "#FFFFFF";
const IVORY_SUBTLE = "#F4ECE2";

const GOLD_ANTIQUE = "#C6A052";
const GOLD_LIGHT = "#E4D1A7";

const TEXT_DARK = "#3D151C";
const TEXT_MUTED = "#7A5C61";
const TEXT_LIGHT = "#FBF7F2";

const TITLE_FONT = "'Playfair Display', Georgia, serif";
const BODY_FONT = "'Be Vietnam Pro', sans-serif";

/* ------------------------------------------------------------
   Hiệu ứng Ánh Kim Sa / Hạt Bụi Vàng Trôi Êm (GoldShimmerDrift)
   - Nhẹ nhàng, lấp lánh như bụi vàng sa trên nhung đỏ
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function GoldShimmerDrift({ count = 12 }: { count?: number }) {
  const reduce = useReducedMotion();
  const sparks = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 8.3) % 94 + 3}%`,
      size: (idx % 3) * 2 + 3, // 3px..7px
      duration: 8 + (idx % 4) * 3, // 8s..17s
      delay: (idx * 0.6) % 5,
      sway: 15 + (idx % 3) * 10,
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden z-[5]"
      aria-hidden="true"
    >
      {sparks.map((s) => (
        <m.div
          key={s.id}
          className="absolute rounded-full"
          style={{
            left: s.left,
            top: "-10px",
            width: `${s.size}px`,
            height: `${s.size}px`,
            background: "radial-gradient(circle, #F4ECE2 0%, #C6A052 70%, transparent 100%)",
            boxShadow: "0 0 6px rgba(198, 160, 82, 0.6)",
          }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, s.id % 2 === 0 ? s.sway : -s.sway, 0],
            opacity: [0, 0.85, 0.95, 0.6, 0],
          }}
          transition={{
            duration: s.duration,
            repeat: Infinity,
            delay: s.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT: YenChiMauDonTemplate
   ============================================================ */
export default function YenChiMauDonTemplate({
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
    playCoverSfx("crystal");
    setTimeout(() => {
      setIsOpen(true);
      setCoverGone(true);
      setIsOpening(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 700);
  };

  // Gift modal state & Parcel interaction (700ms delay + SFX box)
  const {
    stage: giftBoxStage,
    setStage: setGiftBoxStage,
    isOpening: isGiftOpening,
    isModalOpen: giftModalOpen,
    handleGiftClick,
    handleCloseModal,
  } = useGiftBoxInteraction({
    sfxType: "box",
  });

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Carousel index
  const [activeSlide, setActiveSlide] = React.useState(0);

  // Countdown & Event state
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent?.startsAt || data.date || "2027-03-20T10:00:00+07:00";
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    function calcTime() {
      const target = new Date(eventDateStr).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }

    calcTime();
    const timer = setInterval(calcTime, 1000);
    return () => clearInterval(timer);
  }, [eventDateStr]);

  // Couple names & Parents
  const groomName = data.couple?.groomName || "Hoàng Long";
  const brideName = data.couple?.brideName || "Bảo Ngọc";
  const groomFullName = data.couple?.groomFullName || groomName;
  const brideFullName = data.couple?.brideFullName || brideName;

  // Split parents neatly at '&' into 2 clean lines without 'Thân sinh:'
  const groomParentsRaw = data.couple?.groomParents || "";
  const brideParentsRaw = data.couple?.brideParents || "";

  const groomParentsList = React.useMemo(() => {
    if (!groomParentsRaw) return [];
    return groomParentsRaw.split("&").map((s) => s.trim()).filter(Boolean);
  }, [groomParentsRaw]);

  const brideParentsList = React.useMemo(() => {
    if (!brideParentsRaw) return [];
    return brideParentsRaw.split("&").map((s) => s.trim()).filter(Boolean);
  }, [brideParentsRaw]);

  // Date formatting
  const dateParts = formatWeddingDateParts(eventDateStr);
  const lunarText = targetEvent?.lunarDate
    ? formatLunarDateClean(targetEvent.lunarDate)
    : "";

  // Album photos with Free/Pro gating
  const isFree = data.plan === "free";
  const rawGallery = data.photos?.gallery || [];
  const galleryPhotos: TemplatePhotoItem[] = React.useMemo(() => {
    return isFree ? rawGallery.slice(0, 5) : rawGallery;
  }, [rawGallery, isFree]);

  const heroPhotoUrl = data.photos?.heroUrl;

  // Dress code colors: NO hex strings printed on UI
  const dressCodeColors = React.useMemo(() => {
    const defaultList = [
      { name: "Đỏ nhung rượu vang", color: BURGUNDY_MAIN },
      { name: "Vàng cổ ánh kim", color: GOLD_ANTIQUE },
      { name: "Trắng kem ngà", color: IVORY_BG },
    ];
    if (data.dressCode && data.dressCode.length > 0) {
      const names = ["Sắc màu chủ đạo", "Sắc màu điểm xuyết", "Sắc màu thanh nhã", "Sắc màu phối hợp"];
      return data.dressCode.map((hex, i) => ({
        name: names[i % names.length],
        color: hex,
      }));
    }
    return defaultList;
  }, [data.dressCode]);

  // Calendar dates for monthly grid
  const calendarDays = React.useMemo(() => {
    const d = new Date(eventDateStr);
    const year = d.getFullYear() || 2027;
    const month = d.getMonth() || 2;
    const weddingDay = d.getDate() || 20;

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
      daysSet.add(weddingDay);
    }

    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Convert Sunday=0 to Monday=0 (Vietnamese calendar style: T2..CN)
    const offset = (firstDay + 6) % 7;

    const days: Array<{ day: number | null; isWedding: boolean }> = [];
    for (let i = 0; i < offset; i++) {
      days.push({ day: null, isWedding: false });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, isWedding: daysSet.has(i) });
    }
    return days;
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

  // Add to Calendar links
  const calendarLinks = React.useMemo(() => {
    const title = encodeURIComponent(`Lễ Thành Hôn — ${groomName} & ${brideName}`);
    const details = encodeURIComponent(
      `Trân trọng kính mời Quý khách đến chung vui cùng gia đình chúng tôi tại ${targetEvent?.venueName || targetEvent?.venueAddress || "hôn trường"}.`
    );
    const location = encodeURIComponent(targetEvent?.venueAddress || targetEvent?.venueName || "");
    const d = new Date(eventDateStr);
    const startIso = d.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endDate = new Date(d.getTime() + 3 * 3600 * 1000);
    const endIso = endDate.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const google = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
    return { google };
  }, [groomName, brideName, targetEvent, eventDateStr]);

  return (
    <div
      className={cn(
        "relative w-full min-h-screen text-[#3D151C] antialiased select-none overflow-x-hidden",
        !coverGone ? (contained ? "h-full overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden") : ""
      )}
      style={{
        backgroundColor: IVORY_BG,
        fontFamily: BODY_FONT,
      }}
    >
      {/* --------------------------------------------------------
          TRANG BÌA (COVER SECTION)
          Phân tầng Z-Index chuẩn Anti-Blur & Anti-Drift:
          z-0: Background nhung đỏ (mobile / desktop)
          z-[5]: Ánh kim sa dịu trôi chậm
          z-10: Thẻ thiệp kem ngà bo góc + peony_corner_cluster (trái & lật phải)
          z-20: Nội dung bìa, wax seal, tên cặp đôi 3 dòng, nút Mở Thiệp
          -------------------------------------------------------- */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            key="envelope-cover"
            className="absolute inset-0 z-50 w-full max-w-full overflow-hidden flex items-center justify-center px-4 py-4 sm:px-6"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.65, ease: "easeInOut" } }}
          >
            {/* z-0: Ảnh nền nhung đỏ sắc nét */}
            <div className="absolute inset-0 z-0">
              <picture>
                <source
                  media="(min-width: 768px)"
                  srcSet="/templates/yen-chi-mau-don/bg_desktop.webp"
                />
                <img
                  src="/templates/yen-chi-mau-don/bg_mobile.webp"
                  alt="Nền nhung đỏ Yên Chi Mẫu Đơn"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </picture>
              <div
                className="absolute inset-0 bg-[#380911]/30 pointer-events-none"
                aria-hidden="true"
              />
            </div>

            {/* z-[5]: Lớp ánh kim sa trôi chậm dưới thẻ bìa */}
            <GoldShimmerDrift count={10} />

            {/* z-10 & z-20: Thẻ bìa kem ngà hoàng gia */}
            <m.div
              className="relative z-10 w-full max-w-[328px] sm:max-w-[380px] mx-auto bg-[#FBF7F2] rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(56,9,17,0.45)] border-[3px] border-[#C6A052] flex flex-col items-center text-center overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {/* Viền chỉ vàng cổ lồng trong */}
              <div
                className="pointer-events-none absolute inset-2.5 rounded-2xl border border-[#C6A052]/40"
                aria-hidden="true"
              />

              {/* Hoa mẫu đơn trang trí góc trên trái */}
              <img
                src="/templates/yen-chi-mau-don/peony_corner_cluster.webp"
                alt=""
                className="pointer-events-none absolute -top-3 -left-3 w-20 sm:w-24 h-auto drop-shadow-sm"
                aria-hidden="true"
              />

              {/* Hoa mẫu đơn trang trí góc trên phải (lật ngang scale-x-[-1]) */}
              <img
                src="/templates/yen-chi-mau-don/peony_corner_cluster.webp"
                alt=""
                className="pointer-events-none absolute -top-3 -right-3 w-20 sm:w-24 h-auto scale-x-[-1] drop-shadow-sm"
                aria-hidden="true"
              />

              {/* z-20: Nội dung thẻ bìa */}
              <div className="relative z-20 flex flex-col items-center w-full pt-2">
                {/* Con dấu sáp vàng cổ */}
                <div className="w-16 h-16 sm:w-18 sm:h-18 mb-3 flex items-center justify-center drop-shadow-md">
                  <img
                    src="/templates/yen-chi-mau-don/wax_seal_gold.webp"
                    alt="Kim Ấn Hoàng Gia"
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Tiêu đề trang trọng */}
                <span className="text-[11px] sm:text-xs tracking-[0.25em] text-[#7A5C61] uppercase font-medium mb-1">
                  Trân Trọng Kính Mời
                </span>
                <span className="text-[12px] sm:text-[13px] tracking-[0.2em] text-[#C6A052] uppercase font-semibold mb-3">
                  Lễ Thành Hôn
                </span>

                {/* Tên cặp đôi 3 dòng chuẩn quy cách */}
                <div
                  className="w-full my-1 flex flex-col items-center"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  <h1 className="text-2xl sm:text-3xl text-[#4A0E17] font-normal tracking-wide break-words">
                    {groomName}
                  </h1>
                  <span className="text-lg sm:text-xl text-[#C6A052] italic my-0.5">
                    &
                  </span>
                  <h2 className="text-2xl sm:text-3xl text-[#4A0E17] font-normal tracking-wide break-words">
                    {brideName}
                  </h2>
                </div>

                {/* Dải phân cách trái tim vàng */}
                <div className="w-36 sm:w-44 my-2.5 opacity-90">
                  <img
                    src="/templates/yen-chi-mau-don/divider_heart_gold.webp"
                    alt=""
                    className="w-full h-auto object-contain"
                    aria-hidden="true"
                  />
                </div>

                {/* Tên khách mời trang trọng */}
                <div className="mt-2 mb-4 px-3 py-1.5 rounded-full bg-[#F4ECE2]/80 border border-[#E4D1A7]/60 max-w-[90%]">
                  <p className="text-[13px] text-[#4A0E17] font-medium truncate">
                    {guestName ? `Kính gửi: ${guestName}` : "Kính gửi: Quý Khách Quý Mến"}
                  </p>
                </div>

                {/* Nút Mở Thiệp */}
                <button
                  type="button"
                  onClick={handleOpenCover}
                  disabled={isOpening}
                  className="group relative px-6 py-2.5 rounded-full bg-[#4A0E17] hover:bg-[#6B1422] text-[#FBF7F2] font-medium text-sm tracking-wider uppercase border border-[#C6A052] shadow-[0_6px_20px_rgba(74,14,23,0.35)] transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                >
                  <span>{isOpening ? "Đang mở thiệp..." : "Mở Thiệp"}</span>
                </button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------
          RUỘT THIỆP CHÍNH (MAIN INVITATION BODY)
          Ẩn hoàn toàn khi !coverGone để chống trôi layout & scroll
          -------------------------------------------------------- */}
      <div
        className={cn(
          "w-full transition-opacity duration-700 max-w-2xl mx-auto pb-16",
          !coverGone ? "hidden" : "block opacity-100"
        )}
      >
        {/* Nút nhạc nền thả nổi */}
        {!hiddenSections.has("music") && (
          <LiveMusicFloatingButton
            src={data.music?.src || "/media/priority1.mp3"}
            visible={coverGone}
            title={data.music?.title || "Yên Chi Mẫu Đơn"}
            tone="velvet"
          />
        )}

        {/* ------------------------------------------------------
            HERO SECTION: CHUYỆN TÌNH ĐƠM HOA
            Ảnh Polaroid lồng túi phong bì nhung đỏ
            ------------------------------------------------------ */}
        <section className="relative pt-12 pb-10 px-4 sm:px-6 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center"
          >
            <span className="text-xs sm:text-sm tracking-[0.25em] text-[#C6A052] uppercase font-semibold mb-2">
              Chuyện Tình Đơm Hoa
            </span>
            <p
              className="text-base sm:text-lg italic text-[#7A5C61] max-w-md mx-auto mb-6 px-4"
              style={{ fontFamily: TITLE_FONT }}
            >
              {data.quote || "“Một lời hẹn ước, một đời thương trao.”"}
            </p>

            {/* Khung phong bì nhung đỏ lồng ảnh Polaroid */}
            <div className="relative w-full max-w-[320px] sm:max-w-[340px] aspect-[4/5] flex items-center justify-center p-3">
              {/* Lớp sau: Ảnh túi phong bì nhung đỏ */}
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                <img
                  src="/templates/yen-chi-mau-don/peony_envelope_pocket.webp"
                  alt="Túi phong bì hoa mẫu đơn"
                  className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(56,9,17,0.3)]"
                />
              </div>

              {/* Lớp giữa: Ảnh cặp đôi Polaroid nghiêng nhẹ -2deg trượt lên */}
              <div className="relative z-10 w-[78%] -mt-6 rotate-[-2deg] bg-[#FFFFFF] p-2.5 pb-6 rounded-lg shadow-xl border border-[#E4D1A7]/80 flex flex-col items-center transition-transform duration-500 hover:rotate-0">
                <div className="w-full aspect-[4/5] overflow-hidden rounded bg-[#F4ECE2]">
                  {heroPhotoUrl ? (
                    <img
                      src={heroPhotoUrl}
                      alt={`${groomName} & ${brideName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#5C1420] to-[#380911] text-[#FBF7F2]">
                      <Heart className="w-10 h-10 text-[#C6A052] mb-2 fill-[#C6A052]/20" />
                      <span className="font-serif text-lg tracking-wider text-[#E4D1A7]">
                        {groomName} & {brideName}
                      </span>
                    </div>
                  )}
                </div>
                <span
                  className="mt-3 text-xs italic text-[#7A5C61] tracking-wide"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  {groomName} & {brideName}
                </span>
              </div>

              {/* Lớp trước: Con dấu sáp vàng cổ đính tại mép miệng phong bì */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-14 h-14 sm:w-16 sm:h-16 drop-shadow-lg">
                <img
                  src="/templates/yen-chi-mau-don/wax_seal_gold.webp"
                  alt="Kim ấn sáp vàng"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </m.div>
        </section>

        {/* Container cho các section có thể kéo thả sắp xếp thứ tự */}
        <div className="flex flex-col">
          {/* ------------------------------------------------------
              SECTION: GIA ĐÌNH HAI BÊN (TRÂN TRỌNG BÁO TIN)
              Thẻ kem ngà #FFFFFF viền mảnh, tách tên phụ huynh sạch sẽ
              ------------------------------------------------------ */}
          {!hiddenSections.has("family") && (
            <section
              style={{ order: orderOf("family", 1) }}
              className="py-8 px-4 sm:px-6"
            >
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E4D1A7] shadow-[0_10px_30px_rgba(198,160,82,0.12)] text-center relative overflow-hidden"
              >
                {/* Đường viền đệm trang trí */}
                <div
                  className="pointer-events-none absolute inset-2 rounded-2xl border border-[#E4D1A7]/40"
                  aria-hidden="true"
                />

                <span className="text-xs sm:text-sm tracking-[0.25em] text-[#C6A052] uppercase font-semibold">
                  Trân Trọng Báo Tin
                </span>
                <h3
                  className="text-2xl sm:text-3xl text-[#4A0E17] font-normal my-2"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Lễ Thành Hôn
                </h3>

                {/* Dải phân cách trái tim vàng */}
                <div className="w-32 sm:w-40 mx-auto my-3 opacity-80">
                  <img
                    src="/templates/yen-chi-mau-don/divider_heart_gold.webp"
                    alt=""
                    className="w-full h-auto object-contain"
                    aria-hidden="true"
                  />
                </div>

                {/* Hai cột gia đình: Hỗ trợ đảo Nhà Gái lên trước nếu isBrideFirst */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mt-6 relative">
                  {/* Vạch chia đôi trên màn hình lớn */}
                  <div
                    className="hidden sm:block absolute top-4 bottom-4 left-1/2 w-px bg-gradient-to-b from-transparent via-[#C6A052]/40 to-transparent -translate-x-1/2"
                    aria-hidden="true"
                  />

                  {/* Cột 1 */}
                  {isBrideFirst ? (
                    <div className="flex flex-col items-center sm:items-end sm:pr-6 text-center sm:text-right">
                      <span className="text-xs tracking-[0.2em] uppercase font-semibold text-[#C6A052] mb-1.5">
                        Nhà Gái
                      </span>
                      {brideParentsList.length > 0 ? (
                        <div className="text-sm text-[#7A5C61] space-y-1 mb-3">
                          {brideParentsList.map((p, i) => (
                            <p key={i} className="font-medium">
                              {p}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-[#7A5C61] mb-3">
                          <p className="font-medium">Ông: Vũ Văn C</p>
                          <p className="font-medium">Bà: Hoàng Thị D</p>
                        </div>
                      )}
                      <span className="text-xs italic text-[#C6A052] mb-1">
                        {data.couple?.brideTitle || "Cô Dâu"}
                      </span>
                      <p
                        className="text-xl sm:text-2xl font-normal text-[#4A0E17]"
                        style={{ fontFamily: TITLE_FONT }}
                      >
                        {brideFullName}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center sm:items-end sm:pr-6 text-center sm:text-right">
                      <span className="text-xs tracking-[0.2em] uppercase font-semibold text-[#C6A052] mb-1.5">
                        Nhà Trai
                      </span>
                      {groomParentsList.length > 0 ? (
                        <div className="text-sm text-[#7A5C61] space-y-1 mb-3">
                          {groomParentsList.map((p, i) => (
                            <p key={i} className="font-medium">
                              {p}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-[#7A5C61] mb-3">
                          <p className="font-medium">Ông: Trần Văn A</p>
                          <p className="font-medium">Bà: Lê Thị B</p>
                        </div>
                      )}
                      <span className="text-xs italic text-[#C6A052] mb-1">
                        {data.couple?.groomTitle || "Chú Rể"}
                      </span>
                      <p
                        className="text-xl sm:text-2xl font-normal text-[#4A0E17]"
                        style={{ fontFamily: TITLE_FONT }}
                      >
                        {groomFullName}
                      </p>
                    </div>
                  )}

                  {/* Cột 2 */}
                  {isBrideFirst ? (
                    <div className="flex flex-col items-center sm:items-start sm:pl-6 text-center sm:text-left">
                      <span className="text-xs tracking-[0.2em] uppercase font-semibold text-[#C6A052] mb-1.5">
                        Nhà Trai
                      </span>
                      {groomParentsList.length > 0 ? (
                        <div className="text-sm text-[#7A5C61] space-y-1 mb-3">
                          {groomParentsList.map((p, i) => (
                            <p key={i} className="font-medium">
                              {p}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-[#7A5C61] mb-3">
                          <p className="font-medium">Ông: Trần Văn A</p>
                          <p className="font-medium">Bà: Lê Thị B</p>
                        </div>
                      )}
                      <span className="text-xs italic text-[#C6A052] mb-1">
                        {data.couple?.groomTitle || "Chú Rể"}
                      </span>
                      <p
                        className="text-xl sm:text-2xl font-normal text-[#4A0E17]"
                        style={{ fontFamily: TITLE_FONT }}
                      >
                        {groomFullName}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center sm:items-start sm:pl-6 text-center sm:text-left">
                      <span className="text-xs tracking-[0.2em] uppercase font-semibold text-[#C6A052] mb-1.5">
                        Nhà Gái
                      </span>
                      {brideParentsList.length > 0 ? (
                        <div className="text-sm text-[#7A5C61] space-y-1 mb-3">
                          {brideParentsList.map((p, i) => (
                            <p key={i} className="font-medium">
                              {p}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-[#7A5C61] mb-3">
                          <p className="font-medium">Ông: Vũ Văn C</p>
                          <p className="font-medium">Bà: Hoàng Thị D</p>
                        </div>
                      )}
                      <span className="text-xs italic text-[#C6A052] mb-1">
                        {data.couple?.brideTitle || "Cô Dâu"}
                      </span>
                      <p
                        className="text-xl sm:text-2xl font-normal text-[#4A0E17]"
                        style={{ fontFamily: TITLE_FONT }}
                      >
                        {brideFullName}
                      </p>
                    </div>
                  )}
                </div>
              </m.div>
            </section>
          )}

          {/* ------------------------------------------------------
              SECTION: LỄ & TIỆC, ĐẾM NGƯỢC & LỊCH THÁNG
              Thẻ nhung đỏ hoàng gia #4A0E17, nút hành động căn hàng thoáng
              ------------------------------------------------------ */}
          {!hiddenSections.has("calendar") && (
            <section
              style={{ order: orderOf("calendar", 2) }}
              className="py-8 px-4 sm:px-6"
            >
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-[#4A0E17] to-[#380911] text-[#FBF7F2] border-2 border-[#C6A052]/50 shadow-[0_20px_45px_rgba(56,9,17,0.35)] text-center relative overflow-hidden"
              >
                {/* Lớp trang trí bụi vàng */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-15 bg-[radial-gradient(#E4D1A7_1px,transparent_1px)] [background-size:16px_16px]"
                  aria-hidden="true"
                />

                <span className="relative z-10 text-xs sm:text-sm tracking-[0.25em] text-[#E4D1A7] uppercase font-semibold">
                  Nghi Thức & Tiệc Chung Vui
                </span>
                <h3
                  className="relative z-10 text-2xl sm:text-3xl text-[#FBF7F2] font-normal my-2"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Cùng Đếm Ngược Khoảnh Khắc
                </h3>

                {/* Thông tin ngày giờ chính */}
                <div className="relative z-10 my-4 inline-flex flex-col items-center">
                  <div className="flex items-center gap-2 text-sm sm:text-base font-medium text-[#E4D1A7]">
                    <Clock className="w-4 h-4 text-[#C6A052]" />
                    <span>
                      {dateParts.time || "11:00"} • {dateParts.weekday || "Chủ Nhật"}
                    </span>
                  </div>
                  <p
                    className="text-3xl sm:text-4xl font-normal text-[#FBF7F2] my-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {dateParts.day} Tháng {dateParts.month}, {dateParts.year}
                  </p>
                  {lunarText && (
                    <span className="text-xs sm:text-sm text-[#E4D1A7]/90 italic">
                      (Tức {lunarText})
                    </span>
                  )}
                </div>

                {/* Đồng hồ đếm ngược 4 ô */}
                <div className="relative z-10 grid grid-cols-4 gap-2 sm:gap-3 max-w-xs sm:max-w-sm mx-auto my-5">
                  {[
                    { label: "Ngày", val: timeLeft.days },
                    { label: "Giờ", val: timeLeft.hours },
                    { label: "Phút", val: timeLeft.minutes },
                    { label: "Giây", val: timeLeft.seconds },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#380911]/80 border border-[#C6A052]/50 rounded-2xl p-2 sm:p-2.5 flex flex-col items-center shadow-inner"
                    >
                      <span
                        className="text-xl sm:text-2xl font-bold text-[#E4D1A7]"
                        style={{ fontFamily: TITLE_FONT }}
                      >
                        {String(item.val).padStart(2, "0")}
                      </span>
                      <span className="text-[10px] sm:text-xs text-[#FBF7F2]/80 uppercase tracking-wider mt-0.5">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Bảng lịch tháng cưới nền kem ngà */}
                <div className="relative z-10 bg-[#FBF7F2] text-[#3D151C] rounded-2xl p-4 sm:p-5 max-w-xs sm:max-w-sm mx-auto shadow-md border border-[#E4D1A7]">
                  <div className="text-xs sm:text-sm font-semibold tracking-wider text-[#4A0E17] uppercase mb-3 text-center">
                    Tháng {dateParts.month} • {dateParts.year}
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((th, i) => (
                      <span key={i} className="font-semibold text-[#7A5C61] py-1">
                        {th}
                      </span>
                    ))}
                    {calendarDays.map((item, idx) => (
                      <div
                        key={idx}
                        className="h-7 flex items-center justify-center text-xs"
                      >
                        {item.day !== null ? (
                          <span
                            className={cn(
                              "w-6 h-6 flex items-center justify-center rounded-full font-medium transition-all",
                              item.isWedding
                                ? "bg-[#4A0E17] text-[#FFFFFF] font-bold shadow-md ring-2 ring-[#C6A052]"
                                : "text-[#3D151C]"
                            )}
                          >
                            {item.day}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hàng nút hành động: Thêm vào lịch & Xác nhận tham dự (không reload iframe) */}
                <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 mt-6">
                  <a
                    href={calendarLinks.google}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-full bg-[#FFFFFF] hover:bg-[#F4ECE2] text-[#4A0E17] border border-[#C6A052] text-xs sm:text-sm font-semibold tracking-wider uppercase shadow-md transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-[#C6A052]" />
                    <span>Thêm vào lịch</span>
                  </a>

                  <button
                    type="button"
                    onClick={(e) => {
                      const doc = e.currentTarget.ownerDocument || document;
                      doc.getElementById("rsvp")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="px-5 py-2.5 rounded-full bg-[#C6A052] hover:bg-[#E4D1A7] text-[#380911] border border-[#E4D1A7] text-xs sm:text-sm font-semibold tracking-wider uppercase shadow-md transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-[#380911]" />
                    <span>Xác nhận tham dự</span>
                  </button>
                </div>
              </m.div>
            </section>
          )}

          {/* ------------------------------------------------------
              SECTION: SỰ KIỆN VÀ CHỈ ĐƯỜNG (MAP / MULTI-EVENTS)
              Lặp qua toàn bộ mảng visibleEvents để hiển thị đầy đủ các lễ
              ------------------------------------------------------ */}
          {!hiddenSections.has("map") && visibleEvents.length > 0 && (
            <section
              style={{ order: orderOf("map", 3) }}
              className="py-8 px-4 sm:px-6"
            >
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E4D1A7] shadow-[0_10px_30px_rgba(198,160,82,0.12)] text-center relative overflow-hidden mx-auto ${visibleEvents.length > 1 ? "max-w-4xl" : "max-w-xl"}`}
              >
                <div
                  className="pointer-events-none absolute inset-2 rounded-2xl border border-[#E4D1A7]/40"
                  aria-hidden="true"
                />

                <span className="text-xs sm:text-sm tracking-[0.25em] text-[#C6A052] uppercase font-semibold">
                  Địa Điểm Đón Tiếp
                </span>
                <h3
                  className="text-2xl sm:text-3xl text-[#4A0E17] font-normal my-2"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Sự Kiện & Chỉ Đường
                </h3>

                <div className="w-32 sm:w-40 mx-auto my-3 opacity-80">
                  <img
                    src="/templates/yen-chi-mau-don/divider_heart_gold.webp"
                    alt=""
                    className="w-full h-auto object-contain"
                    aria-hidden="true"
                  />
                </div>

                <div className={`mt-6 ${visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6" : "space-y-4"}`}>
                  {visibleEvents.map((evt, idx) => {
                    const evtDateParts = evt.startsAt ? formatWeddingDateParts(evt.startsAt) : dateParts;
                    const evtLunar = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : null;
                    const directionsUrl = getEventDirectionsUrl(evt);
                    return (
                      <div
                        key={evt.id || idx}
                        className="rounded-2xl p-5 sm:p-6 bg-[#FBF7F2] border border-[#E4D1A7]/60 text-center flex flex-col items-center justify-between shadow-sm"
                      >
                        <div className="w-full">
                          <span className="inline-block px-3 py-1 rounded-full bg-[#4A0E17]/10 text-[#4A0E17] font-semibold text-xs tracking-wider uppercase mb-2">
                            {evt.title || "Lễ Cưới"}
                          </span>
                          <div className="text-sm font-medium text-[#7A5C61] flex items-center justify-center gap-1.5 my-1">
                            <Clock className="w-3.5 h-3.5 text-[#C6A052]" />
                            <span>
                              {evtDateParts.time || "11:00"} • {evtDateParts.weekday || "Chủ Nhật"}
                            </span>
                          </div>
                          <p
                            className="text-xl sm:text-2xl font-normal text-[#4A0E17] my-1"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {evtDateParts.day} Tháng {evtDateParts.month}, {evtDateParts.year}
                          </p>
                          {evtLunar && (
                            <span className="text-xs text-[#7A5C61] italic block mb-3">
                              (Tức {evtLunar})
                            </span>
                          )}

                          <div className="mt-3 pt-3 border-t border-[#E4D1A7]/40">
                            <p
                              className="text-base sm:text-lg font-medium text-[#4A0E17]"
                              style={{ fontFamily: TITLE_FONT }}
                            >
                              {evt.venueName || "Trung Tâm Tiệc Cưới"}
                            </p>
                            {evt.venueAddress && (
                              <p className="text-xs sm:text-sm text-[#7A5C61] mt-1 max-w-xs mx-auto">
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
                            className="mt-4 px-4 py-2 rounded-full bg-[#4A0E17] hover:bg-[#6B1422] text-[#FBF7F2] text-xs font-medium tracking-wide inline-flex items-center gap-1.5 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                          >
                            <MapPin className="w-3.5 h-3.5 text-[#E4D1A7]" />
                            <span>Chỉ đường trên Google Maps</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </m.div>
            </section>
          )}

          {/* ------------------------------------------------------
              SECTION: TRANG PHỤC GỢI Ý & LỊCH TRÌNH (DRESSCODE)
              ------------------------------------------------------ */}
          {!hiddenSections.has("dresscode") && (
            <div
              style={{ order: orderOf("dresscode", 4) }}
              className="flex flex-col space-y-6"
            >
              {/* Trang phục gợi ý */}
              <section className="py-4 px-4 sm:px-6 text-center">
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-7 border border-[#E4D1A7] shadow-sm max-w-lg mx-auto"
                >
                  <span className="text-xs tracking-[0.25em] text-[#C6A052] uppercase font-semibold">
                    Trang Phục Gợi Ý
                  </span>
                  <p className="text-xs sm:text-sm italic text-[#7A5C61] mt-1.5 mb-5">
                    “Gửi gắm vài sắc màu dịu ấm để ngày chung vui thêm phần hài hòa.”
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-6">
                    {dressCodeColors.map((dc, i) => (
                      <div
                        key={i}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 border-[#C6A052]/50 shadow-md transition-transform duration-300 hover:scale-110"
                        style={{ backgroundColor: dc.color }}
                      />
                    ))}
                  </div>
                </m.div>
              </section>

              {/* Lịch trình chi tiết (chỉ render khi có dữ liệu thật) */}
              {data.timeline && data.timeline.length > 0 && (
                <section className="py-4 px-4 sm:px-6">
                  <m.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="bg-gradient-to-b from-[#4A0E17] to-[#380911] text-[#FBF7F2] rounded-3xl p-6 sm:p-8 border border-[#C6A052]/40 shadow-lg relative overflow-hidden"
                  >
                    <img
                      src="/templates/yen-chi-mau-don/peony_corner_cluster.webp"
                      alt=""
                      className="pointer-events-none absolute -bottom-8 -right-8 w-32 sm:w-44 h-auto opacity-20 scale-x-[-1]"
                      aria-hidden="true"
                    />

                    <div className="text-center mb-6">
                      <span className="text-xs tracking-[0.25em] text-[#E4D1A7] uppercase font-semibold">
                        Nhịp Điệu Ngày Vui
                      </span>
                      <h3
                        className="text-2xl sm:text-3xl font-normal text-[#FBF7F2] mt-1"
                        style={{ fontFamily: TITLE_FONT }}
                      >
                        Lịch Trình Chi Tiết
                      </h3>
                    </div>

                    <div className="relative border-l-2 border-[#C6A052]/40 ml-4 sm:ml-8 pl-5 sm:pl-7 space-y-6">
                      {data.timeline.map((item, idx) => (
                        <div key={item.id || idx} className="relative group">
                          <div className="absolute -left-[27px] sm:-left-[35px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#C6A052] ring-4 ring-[#4A0E17] shadow" />

                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-semibold text-[#E4D1A7] tracking-wider">
                              {item.time}
                            </span>
                            <p
                              className="text-base sm:text-lg font-medium text-[#FBF7F2] mt-0.5"
                              style={{ fontFamily: TITLE_FONT }}
                            >
                              {item.label}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </m.div>
                </section>
              )}
            </div>
          )}

          {/* ------------------------------------------------------
              SECTION: ALBUM ẢNH CƯỚI (KHOẢNH KHẮC LƯU GIỮ)
              ------------------------------------------------------ */}
          {!hiddenSections.has("album") && galleryPhotos.length > 0 && (
            <section
              style={{ order: orderOf("album", 5) }}
              className="py-8 px-4 sm:px-6 text-center"
            >
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex flex-col items-center"
              >
                <span className="text-xs tracking-[0.25em] text-[#C6A052] uppercase font-semibold">
                  Khoảnh Khắc Lưu Giữ
                </span>
                <h3
                  className="text-2xl sm:text-3xl text-[#4A0E17] font-normal my-2"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Album Ảnh Cưới
                </h3>
                <p className="text-xs sm:text-sm italic text-[#7A5C61] mb-6">
                  “Từng ánh mắt, nụ cười đều đong đầy yêu thương.”
                </p>

                {/* Carousel container */}
                <div className="relative w-full max-w-md sm:max-w-lg aspect-[4/3] flex items-center justify-center overflow-hidden rounded-2xl bg-[#F4ECE2]/50 p-2 border border-[#E4D1A7]/60 shadow-sm">
                  <div className="relative w-full h-full flex items-center justify-center">
                    {galleryPhotos.map((photo, index) => {
                      const offset = (index - activeSlide + galleryPhotos.length) % galleryPhotos.length;
                      const isCenter = offset === 0;
                      const isLeft = offset === galleryPhotos.length - 1;
                      const isRight = offset === 1;

                      if (!isCenter && !isLeft && !isRight) return null;

                      return (
                        <m.div
                          key={photo.id || index}
                          className={cn(
                            "absolute w-[72%] sm:w-[68%] aspect-[3/4] rounded-xl overflow-hidden shadow-xl border-2 cursor-pointer transition-all duration-500",
                            isCenter
                              ? "z-20 scale-100 opacity-100 border-[#C6A052]"
                              : "z-10 scale-85 opacity-55 border-transparent pointer-events-none",
                            isLeft ? "-translate-x-[36%]" : "",
                            isRight ? "translate-x-[36%]" : ""
                          )}
                          onClick={() => {
                            if (isCenter) {
                              setLightboxIndex(index);
                            }
                          }}
                        >
                          <img
                            src={photo.url}
                            alt="Ảnh cưới"
                            className="w-full h-full object-cover"
                          />
                        </m.div>
                      );
                    })}
                  </div>

                  {/* Nút điều hướng Carousel */}
                  {galleryPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSlide((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)
                        }
                        className="absolute left-2 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFFFFF]/90 hover:bg-[#FFFFFF] text-[#4A0E17] border border-[#C6A052] flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Ảnh trước"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSlide((prev) => (prev + 1) % galleryPhotos.length)
                        }
                        className="absolute right-2 z-30 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FFFFFF]/90 hover:bg-[#FFFFFF] text-[#4A0E17] border border-[#C6A052] flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Ảnh sau"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Chấm chỉ báo trang Carousel */}
                {galleryPhotos.length > 1 && (
                  <div className="flex items-center gap-1.5 mt-3.5">
                    {galleryPhotos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveSlide(i)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all cursor-pointer",
                          i === activeSlide ? "w-6 bg-[#4A0E17]" : "bg-[#C6A052]/50 hover:bg-[#C6A052]"
                        )}
                        aria-label={`Chuyển tới ảnh ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </m.div>
            </section>
          )}

          {/* ------------------------------------------------------
              SECTION: QR ALBUM ẢNH CƯỚI (ĐỘC LẬP)
              ------------------------------------------------------ */}
          {!hiddenSections.has("albumQr") && data.plan !== "free" && Boolean(weddingSlug) && (
            <section
              style={{ order: orderOf("albumQr", 6) }}
              className="py-8 px-4 sm:px-6"
            >
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E4D1A7] shadow-sm max-w-md mx-auto w-full flex flex-col items-center justify-center text-center"
              >
                <GuestAlbumQr
                  slug={weddingSlug!}
                  accentColor="#4A0E17"
                  textColor="#3D151C"
                  mutedColor="#7A5C61"
                />
              </m.div>
            </section>
          )}

          {/* ------------------------------------------------------
              SECTION: HỘP QUÀ CHÚC PHÚC (GIFT SECTION)
              ------------------------------------------------------ */}
          {!hiddenSections.has("gift") && (
            <section
              style={{ order: orderOf("gift", 7) }}
              className="py-8 px-4 sm:px-6 text-center"
            >
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#E4D1A7] shadow-sm max-w-md mx-auto w-full flex flex-col items-center justify-center"
              >
                <span className="text-xs tracking-[0.25em] text-[#C6A052] uppercase font-semibold">
                  Hộp Quà Chúc Phúc
                </span>
                <h3
                  className="text-2xl sm:text-3xl text-[#4A0E17] font-normal my-2"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Gửi Mừng Yêu Thương
                </h3>
                <p className="text-xs sm:text-sm text-[#7A5C61] leading-relaxed max-w-xs mb-5">
                  “Sự hiện diện của Quý khách là niềm hạnh phúc trọn vẹn nhất của hai gia đình. Nếu ở xa không tiện ghé chung vui, Quý khách có thể gửi lời chúc qua hộp quà nhỏ bên dưới.”
                </p>

                {/* Preload ảnh gift_box_open chống giật/nháy */}
                <img
                  src="/templates/yen-chi-mau-don/gift_box_open.webp"
                  className="hidden"
                  aria-hidden="true"
                  alt=""
                />

                {/* Minh họa 3 trạng thái hộp quà nhung đỏ (căn đáy chuẩn tuyệt đối) */}
                <button
                  type="button"
                  disabled={isGiftOpening}
                  onClick={handleGiftClick}
                  onMouseEnter={() => !isGiftOpening && setGiftBoxStage("glow")}
                  onMouseLeave={() => !isGiftOpening && giftBoxStage !== "open" && setGiftBoxStage("normal")}
                  className={`relative w-48 h-48 sm:w-52 sm:h-52 mx-auto flex items-center justify-center cursor-pointer transition-all duration-300 group focus:outline-none ${isGiftOpening ? "pointer-events-none scale-105" : "hover:scale-105 active:scale-95"
                    }`}
                  aria-label="Mở hộp mừng cưới"
                >
                  <img
                    src={
                      giftBoxStage === "open"
                        ? "/templates/yen-chi-mau-don/gift_box_open.webp"
                        : giftBoxStage === "glow"
                          ? "/templates/yen-chi-mau-don/gift_box_glow.webp"
                          : "/templates/yen-chi-mau-don/gift_box_normal.webp"
                    }
                    alt="Hộp quà nhung đỏ"
                    className="w-full h-full mx-auto block object-contain drop-shadow-[0_12px_24px_rgba(74,14,23,0.2)]"
                  />
                </button>

                <span className="text-xs italic text-[#C6A052] mt-3 font-medium">
                  Chạm vào hộp quà để gửi lời chúc & mừng cưới
                </span>
              </m.div>
            </section>
          )}

          {/* ------------------------------------------------------
              SECTION: XÁC NHẬN THAM DỰ & LỜI CHÚC (RSVP)
              ------------------------------------------------------ */}
          {!hiddenSections.has("rsvp") && (
            <section
              id="rsvp"
              style={{ order: orderOf("rsvp", 8) }}
              className="py-8 px-4 sm:px-6"
            >
              <span id="rsvp-section" className="sr-only" />
              <m.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-lg mx-auto"
              >
                <div className="text-center mb-5">
                  <span className="text-xs tracking-[0.25em] text-[#C6A052] uppercase font-semibold">
                    Xác Nhận Tham Dự & Sổ Lưu Bút
                  </span>
                  <h3
                    className="text-2xl sm:text-3xl text-[#4A0E17] font-normal mt-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Gửi Lời Chúc Phúc
                  </h3>
                </div>

                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="velvet"
                  customTheme={{
                    isDark: false,
                    wrap: "bg-white/95 border border-[#E4D1A7] text-[#3D151C] shadow-[0_16px_40px_rgba(74,14,23,0.08)] rounded-3xl",
                    card: "bg-[#FBF7F2] border border-[#E4D1A7]/40 text-[#3D151C]",
                    eyebrow: "text-[#C6A052] tracking-[0.25em] uppercase font-semibold text-[11px]",
                    heading: "text-[#4A0E17] font-serif text-2xl sm:text-3xl",
                    subtext: "text-[#7A5C61] text-xs sm:text-sm",
                    input: "bg-[#FFFDFB] border border-[#D8C29D] text-[#3D151C] placeholder:text-[#7A5C61]/60 focus:border-[#4A0E17] focus:ring-1 focus:ring-[#4A0E17]",
                    primaryBtn: "bg-[#4A0E17] hover:bg-[#6B1422] text-[#FBF7F2] font-semibold shadow-md",
                    outlineBtn: "border border-[#4A0E17] bg-[#FFFDFB] text-[#4A0E17] hover:bg-[#4A0E17]/10",
                    optionBg: "#FFFFFF",
                    optionColor: "#3D151C",
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
              </m.div>
            </section>
          )}
        </div>

        {/* ------------------------------------------------------
            FOOTER: LỜI CẢM ƠN ẤM ÁP
            Đặt bên ngoài container flex có order, không lặp ngày cưới
            ------------------------------------------------------ */}
        <footer className="pt-10 pb-16 px-4 sm:px-6 text-center text-[#7A5C61] border-t border-[#E4D1A7]/50 mt-12">
          <div className="max-w-md mx-auto flex flex-col items-center">
            {/* Con dấu sáp vàng cổ nhỏ */}
            <div className="w-12 h-12 mb-3 drop-shadow-sm">
              <img
                src="/templates/yen-chi-mau-don/wax_seal_gold.webp"
                alt=""
                className="w-full h-full object-contain"
                aria-hidden="true"
              />
            </div>
            <p
              className="text-2xl sm:text-3xl font-normal text-[#4A0E17] mb-2"
              style={{ fontFamily: TITLE_FONT }}
            >
              {groomName} & {brideName}
            </p>
            <p className="text-xs sm:text-sm text-[#7A5C61] leading-relaxed max-w-sm mb-4">
              Chân thành cảm ơn tình cảm và sự hiện diện quý báu của Quý khách trong ngày hạnh phúc nhất của chúng tôi.
            </p>
            <span className="text-[11px] tracking-[0.2em] text-[#C6A052] uppercase font-medium">
              Yên Chi Mẫu Đơn • Forever & Always
            </span>
          </div>
        </footer>
      </div>

      {/* --------------------------------------------------------
          MODAL & LIGHTBOX QUA PORTAL (document.body)
          -------------------------------------------------------- */}
      <GiftModal
        open={giftModalOpen}
        onClose={handleCloseModal}
        gift={data.gift}
        plan={data.plan}
        coupleName={`${groomName} & ${brideName}`}
        guestName={guestName}
        tone="velvet"
      />

      <TemplateLightboxModal
        photos={galleryPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={(idx) => setLightboxIndex(idx)}
      />
    </div>
  );
}
