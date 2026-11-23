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
import { m, useReducedMotion } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type {
  TemplateData,
  WeddingEvent,
  TemplatePhotoItem,
} from "@/lib/wedding-types";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: MỘC HƯƠNG NẮNG THU (moc-huong-nang-thu)
   - Nền tổng thể: #F7EFE6 (Oat Linen)
   - Bề mặt thẻ nổi: #FFFDFB / rgba(255, 253, 251, 0.94) viền cát ấm #DFCBB5
   - Nền nhấn ấm dịu: #EFE4D6
   - Nâu caramel chủ đạo (tiêu đề, nút CTA, trái tim lịch): #8C5633 (hover #724426, chữ #FFFFFF)
   - Đồng cổ ánh kim (viền chỉ, nhãn phụ): #B5895A
   - Chữ chính trên nền sáng: #422B1D (tương phản cao chuẩn WCAG AA)
   - Chữ phụ: #7D6352
   ============================================================ */

const OAT_LINEN_BG = "#F7EFE6";
const CARD_BG = "#FFFDFB";
const WARM_ACCENT = "#EFE4D6";

const BORDER_SAND = "#DFCBB5";
const BRONZE_GOLD = "#B5895A";

const TEXT_MAIN = "#422B1D";
const TEXT_MUTED = "#7D6352";

const CTA_CARAMEL = "#8C5633";
const CTA_HOVER = "#724426";

const TITLE_FONT = "'Playfair Display', Georgia, serif";
const BODY_FONT = "'Be Vietnam Pro', sans-serif";

/* ------------------------------------------------------------
   Hiệu ứng Hạt Nắng Thu Dịu Nhẹ (AutumnLightDust)
   - Những đốm nắng thu vàng caramel lấp lánh nhẹ nhàng
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function AutumnLightDust({ count = 8 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 13) % 92 + 4}%`,
      size: (idx % 3) * 2 + 5,
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
            background:
              "radial-gradient(circle, rgba(181,137,90,0.65) 0%, rgba(223,203,181,0.2) 70%, transparent 100%)",
            boxShadow: "0 0 8px rgba(181,137,90,0.3)",
          }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, p.id % 2 === 0 ? p.sway : -p.sway, 0],
            opacity: [0, 0.7, 0.85, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function MocHuongNangThuTemplate({
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
    playOpenCardSound();
    setTimeout(() => {
      setIsOpen(true);
      setCoverGone(true);
      setIsOpening(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 700);
  };

  // Gift modal state & Caramel Linen Box hover
  const [giftModalOpen, setGiftModalOpen] = React.useState(false);
  const [activeGiftState, setActiveGiftState] = React.useState<"normal" | "glow" | "open">("normal");

  // Lightbox modal state
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Album photos (tôn trọng phân quyền Free: tối đa 5 ảnh)
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
  const eventDateStr = targetEvent?.startsAt || data.date || "2027-10-24";
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
    const month = d.getMonth() || 9;
    const currentDay = d.getDate() || 24;

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

  const orderMap = React.useMemo(() => {
    const map = new Map<string, number>();
    (data.sectionOrder || []).forEach((key, idx) => map.set(key, idx));
    return map;
  }, [data.sectionOrder]);

  const orderOf = (key: string, defaultOrder: number = 0) => {
    return orderMap.get(key) ?? defaultOrder;
  };

  // Polaroid photos for Hero: Groom & Bride
  const groomPhoto = data.photos?.groomUrl || data.photos?.heroUrl || data.photos?.gallery?.[0]?.url;
  const bridePhoto = data.photos?.brideUrl || data.photos?.gallery?.[1]?.url || groomPhoto;

  // Parents name splitting (tách tại & thành 2 dòng riêng sạch sẽ, loại bỏ ký tự &)
  const groomParents = data.couple?.groomParents || "";
  const brideParents = data.couple?.brideParents || "";
  const [gDad, gMom] = groomParents.includes("&")
    ? groomParents.split("&").map((s) => s.trim())
    : [groomParents, ""];
  const [bDad, bMom] = brideParents.includes("&")
    ? brideParents.split("&").map((s) => s.trim())
    : [brideParents, ""];

  // Dress code visual swatches (chỉ hiển thị swatch tròn, TUYỆT ĐỐI không in mã hex)
  const dressCodeSwatches = [
    { color: "#8C5633", label: "Nâu Caramel" },
    { color: "#F7EFE6", label: "Kem Yến Mạch" },
    { color: "#DFCBB5", label: "Cát Ấm" },
  ];

  // Couple display name
  const groomName = data.couple?.groomName || "Chú Rể";
  const brideName = data.couple?.brideName || "Cô Dâu";

  const reduce = useReducedMotion();

  return (
    <div
      className={cn(
        "relative w-full bg-[#F7EFE6] text-[#422B1D] selection:bg-[#EFE4D6] selection:text-[#8C5633]",
        !coverGone && (contained ? "h-full overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden")
      )}
      style={{ fontFamily: BODY_FONT }}
    >
      {/* ============================================================
          1. MÀN HÌNH BÌA MỞ THIỆP (Cover Screen)
          - Phân tầng z-index Anti-Blur chuẩn Organic Botanical Couture
          ============================================================ */}
      {!coverGone && (
        <div
          className={cn(
            "fixed inset-0 z-50 w-full max-w-full overflow-hidden flex flex-col items-center justify-center px-4 py-4 sm:px-6 select-none transition-all duration-700",
            isOpening && "opacity-0 scale-105 pointer-events-none"
          )}
          style={{
            backgroundColor: OAT_LINEN_BG,
          }}
        >
          {/* z-0: Ảnh nền giấy lanh màu nước lá thu sắc nét 100% */}
          <picture className="absolute inset-0 z-0 pointer-events-none">
            <source
              media="(max-width: 640px)"
              srcSet="/templates/moc-huong-nang-thu/bg_mobile.webp"
            />
            <img
              src="/templates/moc-huong-nang-thu/bg_desktop.webp"
              alt="Mộc Hương Nắng Thu"
              className="w-full h-full object-cover object-center"
              loading="eager"
            />
          </picture>

          {/* z-[5]: Ánh nắng thu dịu nhẹ trôi chậm */}
          <AutumnLightDust count={9} />

          {/* z-20: Thẻ bìa trung tâm giấy kem yến mạch viền cát ấm */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-20 my-auto w-full max-w-[328px] sm:max-w-[380px] mx-auto rounded-3xl border border-[#DFCBB5] bg-[#FFFDFB]/95 p-6 sm:p-8 text-center shadow-[0_24px_60px_rgba(66,43,29,0.08)] backdrop-blur-sm"
          >
            {/* Nhánh lá thu góc trang trí đối xứng (trên-trái & dưới-phải lật 180°) */}
            <img
              src="/templates/moc-huong-nang-thu/autumn_corner.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -top-3 -left-3 w-14 sm:w-16 object-contain z-10 opacity-90 drop-shadow-sm"
            />
            <img
              src="/templates/moc-huong-nang-thu/autumn_corner.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-3 -right-3 w-14 sm:w-16 object-contain z-10 opacity-90 rotate-180 drop-shadow-sm"
            />

            {/* Con dấu sáp đồng cổ Mộc Hương ở đỉnh */}
            <div className="relative mx-auto mb-3 w-16 h-16 sm:w-20 sm:h-20">
              <img
                src="/templates/moc-huong-nang-thu/wax_seal_bronze.webp"
                alt="Con Dấu Sáp Mộc Hương"
                className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(140,86,51,0.22)]"
              />
            </div>

            {/* Lời ngỏ trang trọng */}
            <p
              className="text-[11px] sm:text-xs uppercase tracking-[0.26em] font-medium text-[#7D6352]"
              style={{ fontFamily: BODY_FONT }}
            >
              TRÂN TRỌNG KÍNH MỜI
            </p>
            <p
              className="mt-0.5 text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8C5633]"
              style={{ fontFamily: BODY_FONT }}
            >
              LỄ THÀNH HÔN
            </p>

            {/* Tên cặp đôi 3 dòng: Chú rể / & / Cô dâu */}
            <div className="my-3 space-y-0.5">
              <h1
                className="text-2xl sm:text-3xl font-normal tracking-wide text-[#422B1D] break-words"
                style={{ fontFamily: TITLE_FONT }}
              >
                {groomName}
              </h1>
              <div className="flex items-center justify-center gap-2">
                <span className="h-px w-6 bg-[#DFCBB5]" />
                <span
                  className="font-serif italic text-lg sm:text-xl text-[#8C5633]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  &amp;
                </span>
                <span className="h-px w-6 bg-[#DFCBB5]" />
              </div>
              <h1
                className="text-2xl sm:text-3xl font-normal tracking-wide text-[#422B1D] break-words"
                style={{ fontFamily: TITLE_FONT }}
              >
                {brideName}
              </h1>
            </div>

            {/* Dải phân cách lá thu caramel */}
            <div className="my-3">
              <img
                src="/templates/moc-huong-nang-thu/divider_autumn_leaf.webp"
                alt=""
                aria-hidden="true"
                className="mx-auto w-36 sm:w-44 object-contain opacity-85"
              />
            </div>

            {/* Kính mời tên khách (nếu có) */}
            {guestName && (
              <div className="my-2 px-3 py-1.5 rounded-full bg-[#EFE4D6]/70 border border-[#DFCBB5] inline-block max-w-[90%]">
                <p className="text-xs text-[#7D6352] truncate">
                  Kính gửi:{" "}
                  <span className="font-semibold text-[#8C5633]">
                    {guestName}
                  </span>
                </p>
              </div>
            )}

            {/* Nút bấm mở thiệp */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleOpenCover}
                className="group relative inline-flex items-center justify-center px-7 py-2.5 rounded-full bg-[#8C5633] hover:bg-[#724426] text-white text-xs sm:text-sm font-medium tracking-wider shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 cursor-pointer"
              >
                <span>Mở Thiệp</span>
              </button>
            </div>
          </m.div>
        </div>
      )}

      {/* ============================================================
          2. THÂN THIỆP CHÍNH (Ruột thiệp)
          ============================================================ */}
      <div
        className={cn(
          "relative mx-auto w-full max-w-[640px] px-4 sm:px-6 py-8 transition-opacity duration-700 space-y-12",
          !isOpen && "hidden opacity-0",
          isOpen && "opacity-100"
        )}
      >
        {/* Nền giấy lanh lá thu chìm toàn trang ruột */}
        <div
          className="fixed inset-0 pointer-events-none z-0 opacity-40 mix-blend-multiply"
          style={{
            backgroundImage: "url(/templates/moc-huong-nang-thu/bg_mobile.webp)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-hidden="true"
        />

        {/* Nút nhạc nền lơ lửng */}
        {!hiddenSections.has("music") && (
          <LiveMusicFloatingButton
            src={data.music?.src || "/media/san-vuon.mp3"}
            title={data.music?.title || "Sắc Nâu & Lá Thu Dịu Êm"}
            visible={isOpen}
            tone="flowery"
          />
        )}

        {/* ============================================================
            HERO SECTION: PHONG BÌ CARAMEL LỒNG ĐÔI ẢNH POLAROID
            ============================================================ */}
        <section className="relative z-10 pt-4 sm:pt-8 text-center">
          <m.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-3"
          >
            {/* Lời ngỏ chào đón */}
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.28em] font-medium text-[#7D6352]">
              CHUYỆN TÌNH MÙA THU
            </p>

            {/* Phong bì nâu caramel lồng đôi ảnh Polaroid */}
            <div className="relative mx-auto h-[380px] sm:h-[440px] w-full max-w-[340px] sm:max-w-[380px] flex items-center justify-center mt-2">
              {/* Lớp 1: Phong bì nền lót lụa ngà mở nắp (Lớp sau z-10) */}
              <img
                src="/templates/moc-huong-nang-thu/caramel_envelope.webp"
                alt=""
                aria-hidden="true"
                className="absolute inset-x-0 bottom-2 z-10 mx-auto w-full max-w-[320px] sm:max-w-[360px] object-contain drop-shadow-[0_12px_28px_rgba(66,43,29,0.12)] pointer-events-none select-none"
              />

              {/* Lớp 2: Hai ảnh Polaroid nhô lên từ lòng phong bì (Lớp giữa z-20) */}
              <div className="absolute inset-x-0 bottom-[18%] z-20 flex items-end justify-center pointer-events-none">
                {/* Ảnh Cô Dâu (Trái, nghiêng -5deg) */}
                <m.div
                  initial={reduce ? false : { y: 40, rotate: -7, opacity: 0 }}
                  whileInView={reduce ? undefined : { y: 0, rotate: -5, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.85, delay: 0.2, ease: "easeOut" }}
                  className="relative -mr-6 w-[48%] origin-bottom-right"
                >
                  <div className="rounded-[3px] bg-white p-2 pb-5 sm:pb-6 shadow-[0_10px_25px_rgba(66,43,29,0.18)] border border-[#DFCBB5]/50">
                    {bridePhoto ? (
                      <img
                        src={bridePhoto}
                        alt={brideName}
                        className="aspect-[3/4] w-full rounded-[2px] object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <TemplatePhotoPlaceholder label="Cô dâu" className="aspect-[3/4] w-full rounded-[2px]" />
                    )}
                    <p className="mt-1.5 text-center text-[10px] tracking-wider text-[#7D6352] font-serif italic truncate">
                      {brideName}
                    </p>
                  </div>
                </m.div>

                {/* Ảnh Chú Rể (Phải, nghiêng +5deg) */}
                <m.div
                  initial={reduce ? false : { y: 40, rotate: 7, opacity: 0 }}
                  whileInView={reduce ? undefined : { y: 0, rotate: 5, opacity: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.85, delay: 0.35, ease: "easeOut" }}
                  className="relative w-[48%] origin-bottom-left"
                >
                  <div className="rounded-[3px] bg-white p-2 pb-5 sm:pb-6 shadow-[0_10px_25px_rgba(66,43,29,0.18)] border border-[#DFCBB5]/50">
                    {groomPhoto ? (
                      <img
                        src={groomPhoto}
                        alt={groomName}
                        className="aspect-[3/4] w-full rounded-[2px] object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <TemplatePhotoPlaceholder label="Chú rể" className="aspect-[3/4] w-full rounded-[2px]" />
                    )}
                    <p className="mt-1.5 text-center text-[10px] tracking-wider text-[#7D6352] font-serif italic truncate">
                      {groomName}
                    </p>
                  </div>
                </m.div>
              </div>

              {/* Lớp 3: Túi phong bì phía trước che chân ảnh Polaroid (Lớp trước z-30) */}
              <div
                className="absolute inset-x-0 bottom-2 z-30 mx-auto w-full max-w-[320px] sm:max-w-[360px] pointer-events-none select-none"
                style={{
                  clipPath: "polygon(0 48%, 50% 64%, 100% 48%, 100% 100%, 0 100%)",
                }}
              >
                <img
                  src="/templates/moc-huong-nang-thu/caramel_envelope.webp"
                  alt=""
                  aria-hidden="true"
                  className="w-full object-contain"
                />
              </div>

              {/* Lớp 4: Con dấu sáp đồng cổ ở tâm mép gấp V (Lớp trên cùng z-40) */}
              <div
                className="absolute z-40 pointer-events-none select-none w-12 sm:w-14"
                style={{
                  bottom: "22%",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              >
                <img
                  src="/templates/moc-huong-nang-thu/wax_seal_bronze.webp"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-auto object-contain drop-shadow-[0_4px_10px_rgba(66,43,29,0.3)]"
                />
              </div>
            </div>

            {/* Tên cặp đôi 3 dòng: Chú rể / & / Cô dâu */}
            <div className="pt-2 space-y-1">
              <h2
                className="text-3xl sm:text-4xl font-normal tracking-wide text-[#422B1D] break-words"
                style={{ fontFamily: TITLE_FONT }}
              >
                {groomName}
              </h2>
              <div className="flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-[#DFCBB5]" />
                <span
                  className="font-serif italic text-xl sm:text-2xl text-[#8C5633]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  &amp;
                </span>
                <span className="h-px w-8 bg-[#DFCBB5]" />
              </div>
              <h2
                className="text-3xl sm:text-4xl font-normal tracking-wide text-[#422B1D] break-words"
                style={{ fontFamily: TITLE_FONT }}
              >
                {brideName}
              </h2>
            </div>

            {/* Dải phân cách lá thu */}
            <div className="pt-1">
              <img
                src="/templates/moc-huong-nang-thu/divider_autumn_leaf.webp"
                alt=""
                aria-hidden="true"
                className="mx-auto w-32 sm:w-40 object-contain opacity-85"
              />
            </div>

            {/* Lời tựa dịu êm */}
            <p className="mx-auto max-w-md text-xs sm:text-sm text-[#7D6352] italic leading-relaxed pt-1">
              &ldquo;Chúng mình vô cùng hạnh phúc khi được cùng người thương yêu sẻ chia khoảnh khắc thiêng liêng và ấm áp này.&rdquo;
            </p>

            {guestName && (
              <div className="mt-3 px-4 py-1.5 rounded-full bg-[#FFFDFB] border border-[#DFCBB5] inline-block shadow-sm">
                <p className="text-xs text-[#7D6352]">
                  Hân hạnh đón tiếp:{" "}
                  <span className="font-semibold text-[#8C5633]">
                    {guestName}
                  </span>
                </p>
              </div>
            )}
          </m.div>
        </section>

        {/* ============================================================
            ĐẾM NGƯỢC NGÀY CHUNG ĐÔI (Countdown — thuộc key calendar)
            ============================================================ */}
        {!hiddenSections.has("calendar") && mounted && (
          <section className="relative z-10 text-center">
            <div className="mx-auto max-w-md rounded-2xl border border-[#DFCBB5] bg-[#FFFDFB]/95 p-4 sm:p-5 shadow-sm">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.24em] font-semibold text-[#8C5633] mb-3">
                CÙNG ĐÓN CHỜ NGÀY VUI
              </p>
              <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
                {[
                  { value: timeLeft.days, label: "Ngày" },
                  { value: timeLeft.hours, label: "Giờ" },
                  { value: timeLeft.minutes, label: "Phút" },
                  { value: timeLeft.seconds, label: "Giây" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center rounded-xl bg-[#F7EFE6] p-2 border border-[#DFCBB5]/60"
                  >
                    <span
                      className="text-lg sm:text-2xl font-semibold text-[#422B1D]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {String(item.value).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-[#7D6352]">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            CONTAINER CÁC SECTION DYNAMIC VỚI ORDER
            ============================================================ */}
        <div className="flex flex-col space-y-12">
          {/* ============================================================
              1. HAI BÊN GIA ĐÌNH (family)
              - Tách tên phụ huynh tại & thành 2 dòng riêng sạch sẽ, không có &
              - Tuyệt đối không dùng "Thân sinh:" hay "Gia tộc"
              ============================================================ */}
          {!hiddenSections.has("family") && (
            <section
              style={{ order: orderOf("family", 1) }}
              className="relative z-10"
            >
              <div className="rounded-3xl border border-[#DFCBB5] bg-[#FFFDFB]/95 p-6 sm:p-8 text-center shadow-sm">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-[#8C5633]">
                  HAI BÊN GIA ĐÌNH
                </p>
                <h3
                  className="mt-1 text-xl sm:text-2xl font-normal text-[#422B1D]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Lời Chào Từ Gia Đình
                </h3>

                <div className="my-4">
                  <img
                    src="/templates/moc-huong-nang-thu/divider_autumn_leaf.webp"
                    alt=""
                    aria-hidden="true"
                    className="mx-auto w-28 sm:w-36 object-contain opacity-80"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch my-6">
                  {/* Nhà Trai */}
                  <div className="h-full flex flex-col justify-between p-5 rounded-2xl bg-[#F7EFE6]/60 border border-[#DFCBB5]/60">
                    <div>
                      <p className="text-xs uppercase tracking-widest font-semibold text-[#8C5633] pb-2 border-b border-[#DFCBB5]">
                        NHÀ TRAI
                      </p>
                      <div className="mt-3 space-y-1 text-sm text-[#422B1D] font-medium">
                        {gDad ? <p>{gDad}</p> : null}
                        {gMom ? <p>{gMom}</p> : null}
                        {!gDad && !gMom && <p className="text-[#7D6352] italic">—</p>}
                      </div>
                    </div>
                  </div>

                  {/* Nhà Gái */}
                  <div className="h-full flex flex-col justify-between p-5 rounded-2xl bg-[#F7EFE6]/60 border border-[#DFCBB5]/60">
                    <div>
                      <p className="text-xs uppercase tracking-widest font-semibold text-[#8C5633] pb-2 border-b border-[#DFCBB5]">
                        NHÀ GÁI
                      </p>
                      <div className="mt-3 space-y-1 text-sm text-[#422B1D] font-medium">
                        {bDad ? <p>{bDad}</p> : null}
                        {bMom ? <p>{bMom}</p> : null}
                        {!bDad && !bMom && <p className="text-[#7D6352] italic">—</p>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lời báo tin hôn lễ tao nhã */}
                <div className="mt-4 pt-4 border-t border-[#DFCBB5]/60 text-center">
                  <p className="text-xs text-[#7D6352] italic">
                    Trân trọng báo tin lễ thành hôn của hai con
                  </p>
                  <p
                    className="mt-1 text-lg sm:text-xl font-normal text-[#422B1D]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {data.couple?.groomTitle ? `${data.couple.groomTitle}: ` : ""}{groomName} &amp; {data.couple?.brideTitle ? `${data.couple.brideTitle}: ` : ""}{brideName}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* ============================================================
              2. THÔNG TIN TIỆC & LỊCH THÁNG (calendar)
              - Ngày cưới chỉ hiển thị tối đa 2 lần trong toàn thiệp
              ============================================================ */}
          {!hiddenSections.has("calendar") && (
            <section
              style={{ order: orderOf("calendar", 2) }}
              className="relative z-10"
            >
              <div className="rounded-3xl border border-[#DFCBB5] bg-[#FFFDFB]/95 p-6 sm:p-8 text-center shadow-sm space-y-6">
                <div>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-[#8C5633]">
                    NGHI THỨC THÀNH HÔN
                  </p>
                  <h3
                    className="mt-1 text-xl sm:text-2xl font-normal text-[#422B1D]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Thời Gian &amp; Địa Điểm
                  </h3>
                </div>

                {/* Danh sách sự kiện mời (hỗ trợ đa lễ 100%) */}
                <div
                  className={cn(
                    "grid gap-4",
                    visibleEvents.length > 1
                      ? "grid-cols-1 md:grid-cols-2 text-left"
                      : "max-w-xl mx-auto text-center"
                  )}
                >
                  {visibleEvents.map((evt, idx) => {
                    const evtDateStr = evt.startsAt || data.date || "2027-10-24";
                    const evtDateParts = formatWeddingDateParts(evtDateStr);
                    const evtLunar = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : null;
                    const directionsUrl = getEventDirectionsUrl(evt);

                    return (
                      <div
                        key={evt.id || `event-${idx}`}
                        className="rounded-2xl bg-[#F7EFE6]/70 border border-[#DFCBB5] p-5 sm:p-6 space-y-4"
                      >
                        <h4
                          className="text-lg sm:text-xl font-normal text-[#8C5633]"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {evt.title || (idx === 0 ? "Tiệc Cưới Thân Mật" : `Lễ Cưới ${idx + 1}`)}
                        </h4>

                        {/* Giờ & Ngày tiệc */}
                        <div
                          className={cn(
                            "flex flex-wrap items-center gap-3 sm:gap-6 text-sm text-[#422B1D]",
                            visibleEvents.length > 1 ? "justify-start" : "justify-center"
                          )}
                        >
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-[#8C5633]" />
                            <span>{evtDateParts.time || "11:30"}</span>
                          </div>
                          <span className="text-[#DFCBB5]">•</span>
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-4 h-4 text-[#8C5633]" />
                            <span>
                              {evtDateParts.weekday || "Chủ Nhật"}, {evtDateParts.day} tháng {evtDateParts.month}, {evtDateParts.year}
                            </span>
                          </div>
                        </div>

                        {/* Âm lịch thanh tao */}
                        {evtLunar && (
                          <p className="text-xs text-[#7D6352] italic">
                            (Tức {evtLunar})
                          </p>
                        )}

                        {/* Địa điểm tổ chức */}
                        <div className="pt-2 border-t border-[#DFCBB5]/60 text-xs sm:text-sm text-[#7D6352] space-y-1">
                          {evt.venueName && (
                            <p className="font-semibold text-[#422B1D]">
                              {evt.venueName}
                            </p>
                          )}
                          {evt.venueAddress && (
                            <p>{evt.venueAddress}</p>
                          )}
                        </div>

                        {/* Nút tác vụ Lịch & RSVP */}
                        <div
                          className={cn(
                            "pt-3 flex flex-wrap items-center gap-3",
                            visibleEvents.length > 1 ? "justify-start" : "justify-center"
                          )}
                        >
                          <a
                            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                              `${evt.title || "Lễ Cưới"}: ${groomName} & ${brideName}`
                            )}&dates=${evtDateStr.replace(/-|:|\./g, "").slice(0, 8)}T040000Z/${evtDateStr.replace(/-|:|\./g, "").slice(0, 8)}T080000Z&details=${encodeURIComponent(
                              `Trân trọng kính mời tham dự ${evt.title || "lễ cưới"} của ${groomName} & ${brideName}.`
                            )}&location=${encodeURIComponent(evt.venueAddress || "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#8C5633] bg-[#FFFDFB] hover:bg-[#8C5633] hover:text-white text-xs font-medium text-[#8C5633] transition-colors"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Thêm Vào Lịch</span>
                          </a>

                          {directionsUrl && (
                            <a
                              href={directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#8C5633] bg-[#FFFDFB] hover:bg-[#8C5633] hover:text-white text-xs font-medium text-[#8C5633] transition-colors"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Chỉ Đường</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bảng lịch tháng (Lần hiển thị 2) */}
                <div className="pt-2">
                  <p className="text-xs font-medium text-[#7D6352] mb-3 uppercase tracking-wider">
                    Tháng {calendarData.month} / {calendarData.year}
                  </p>
                  <div className="mx-auto max-w-[320px] rounded-2xl border border-[#DFCBB5] bg-[#FFFDFB] p-4 shadow-sm">
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#8C5633] mb-2 pb-1 border-b border-[#DFCBB5]/50">
                      <span>T2</span>
                      <span>T3</span>
                      <span>T4</span>
                      <span>T5</span>
                      <span>T6</span>
                      <span>T7</span>
                      <span>CN</span>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#422B1D]">
                      {/* Khoảng trống đầu tháng (Thứ 2 là 0) */}
                      {Array.from({
                        length: (calendarData.firstDayIndex + 6) % 7,
                      }).map((_, i) => (
                        <span key={`empty-${i}`} className="py-1.5" />
                      ))}
                      {/* Các ngày trong tháng */}
                      {Array.from({ length: calendarData.totalDays }).map((_, i) => {
                        const day = i + 1;
                        const isWeddingDay = eventDays.has(day);
                        return (
                          <span
                            key={`day-${day}`}
                            className={cn(
                              "flex items-center justify-center py-1.5 rounded-full transition-colors",
                              isWeddingDay
                                ? "bg-[#8C5633] text-white font-bold shadow-sm"
                                : "hover:bg-[#EFE4D6]"
                            )}
                          >
                            {day}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================================
              3. BẢN ĐỒ CHỈ ĐƯỜNG (map)
              ============================================================ */}
          {!hiddenSections.has("map") && visibleEvents.some((e) => e.venueAddress) && (
            <section
              style={{ order: orderOf("map", 3) }}
              className="relative z-10"
            >
              <div className="rounded-3xl border border-[#DFCBB5] bg-[#FFFDFB]/95 p-6 sm:p-8 text-center shadow-sm space-y-6">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-[#8C5633]">
                  ĐỊA ĐIỂM ĐÓN TIẾP
                </p>
                <h3
                  className="text-xl sm:text-2xl font-normal text-[#422B1D]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Chỉ Dẫn Đường Đi
                </h3>

                <div
                  className={cn(
                    "grid gap-4",
                    visibleEvents.filter((e) => e.venueAddress).length > 1
                      ? "grid-cols-1 md:grid-cols-2 text-left"
                      : "max-w-xl mx-auto text-center"
                  )}
                >
                  {visibleEvents
                    .filter((e) => e.venueAddress)
                    .map((evt, idx) => {
                      const directionsUrl = getEventDirectionsUrl(evt);
                      return (
                        <div
                          key={evt.id || `map-${idx}`}
                          className="rounded-2xl border border-[#DFCBB5]/80 bg-[#F7EFE6]/50 p-4 sm:p-5 space-y-3"
                        >
                          <h4 className="font-semibold text-base text-[#422B1D]">
                            {evt.title || "Địa Điểm Tổ Chức"}
                          </h4>
                          <div className="text-xs sm:text-sm text-[#7D6352] space-y-1">
                            {evt.venueName && (
                              <p className="font-medium text-[#422B1D]">
                                {evt.venueName}
                              </p>
                            )}
                            <p>{evt.venueAddress}</p>
                          </div>
                          {directionsUrl && (
                            <div className="pt-2">
                              <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#8C5633] hover:bg-[#724426] text-white text-xs sm:text-sm font-medium shadow-sm transition-colors cursor-pointer"
                              >
                                <MapPin className="w-4 h-4 text-[#DFCBB5]" />
                                <span>Chỉ Đường Trên Google Maps</span>
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </section>
          )}

          {/* ============================================================
              4. TRANG PHỤC GỢI Ý (dresscode)
              - Chỉ 1 tiêu đề duy nhất
              - Chỉ hiển thị swatch màu tròn, TUYỆT ĐỐI không in mã hex #XXXXXX
              ============================================================ */}
          {!hiddenSections.has("dresscode") && (
            <section
              style={{ order: orderOf("dresscode", 4) }}
              className="relative z-10"
            >
              <div className="rounded-3xl border border-[#DFCBB5] bg-[#FFFDFB]/95 p-6 sm:p-8 text-center shadow-sm space-y-4">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-[#8C5633]">
                  TRANG PHỤC GỢI Ý
                </p>
                <h3
                  className="text-xl sm:text-2xl font-normal text-[#422B1D]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Sắc Màu Đồng Điệu
                </h3>

                <p className="text-xs text-[#7D6352] max-w-sm mx-auto leading-relaxed">
                  Để ngày vui thêm phần hài hòa và trọn vẹn, Quý khách có thể ưu tiên những gam màu trang nhã dưới đây:
                </p>

                {/* Swatch màu hình tròn tinh tế (TUYỆT ĐỐI KHÔNG in mã hex hoặc tên màu) */}
                <div className="flex items-center justify-center gap-6 sm:gap-8 pt-3">
                  {dressCodeSwatches.map((item, idx) => (
                    <div
                      key={idx}
                      className="w-12 h-12 rounded-full border-2 border-[#DFCBB5] shadow-sm transform hover:scale-105 transition-transform"
                      style={{ backgroundColor: item.color }}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ============================================================
              5. LỊCH TRÌNH NGÀY CƯỚI (dresscode — Dress code & lịch trình)
              - Chỉ render khi có dữ liệu
              ============================================================ */}
          {!hiddenSections.has("dresscode") && data.timeline && data.timeline.length > 0 && (
            <section
              style={{ order: orderOf("dresscode", 5) }}
              className="relative z-10"
            >
              <div className="rounded-3xl border border-[#DFCBB5] bg-[#FFFDFB]/95 p-6 sm:p-8 text-center shadow-sm space-y-6">
                <div>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-[#8C5633]">
                    NHỊP ĐIỆU NGÀY VUI
                  </p>
                  <h3
                    className="mt-1 text-xl sm:text-2xl font-normal text-[#422B1D]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Lịch Trình Chi Tiết
                  </h3>
                </div>

                <div className="relative mx-auto max-w-md py-4">
                  {/* Trục dọc nối các mốc */}
                  <div className="absolute left-6 sm:left-8 top-6 bottom-6 w-px bg-[#DFCBB5]" />

                  <div className="space-y-6">
                    {data.timeline.map((item, idx) => (
                      <div key={idx} className="relative flex items-center gap-4 sm:gap-6 pl-4 text-left">
                        <div className="relative z-10 flex h-5 w-5 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-[#8C5633] text-white shadow-sm ring-4 ring-[#FFFDFB]">
                          <Clock className="w-3 h-3 text-[#DFCBB5]" />
                        </div>
                        <div className="flex-1 rounded-xl bg-[#F7EFE6]/80 border border-[#DFCBB5]/60 p-3 sm:p-4">
                          <span className="text-xs font-bold text-[#8C5633]">
                            {item.time}
                          </span>
                          <p className="text-sm font-medium text-[#422B1D] mt-0.5">
                            {item.label}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================================
              6. ALBUM ẢNH CƯỚI (album, albumQr)
              - Chỉ 1 tiêu đề duy nhất
              - Carousel mượt mà & Lightbox qua TemplateLightboxModal
              - Gói Free: tối đa 5 ảnh, ẩn albumQr
              ============================================================ */}
          {!hiddenSections.has("album") && albumPhotos.length > 0 && (
            <section
              style={{ order: orderOf("album", 6) }}
              className="relative z-10"
            >
              <div className="rounded-3xl border border-[#DFCBB5] bg-[#FFFDFB]/95 p-6 sm:p-8 text-center shadow-sm space-y-6">
                <div>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-[#8C5633]">
                    KHOẢNH KHẮC LƯU GIỮ
                  </p>
                  <h3
                    className="mt-1 text-xl sm:text-2xl font-normal text-[#422B1D]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Kỷ Niệm Tình Yêu
                  </h3>
                </div>

                {/* Carousel Viewer */}
                <div className="relative mx-auto max-w-lg overflow-hidden rounded-2xl border border-[#DFCBB5] bg-[#F7EFE6] shadow-sm">
                  <div
                    className="cursor-pointer group relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden"
                    onClick={() => setLightboxIndex(activePhotoIdx)}
                  >
                    <img
                      src={albumPhotos[activePhotoIdx]?.url}
                      alt={albumPhotos[activePhotoIdx]?.alt || `Ảnh cưới ${activePhotoIdx + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-full bg-white/90 text-xs text-[#422B1D] font-medium shadow">
                        Phóng to
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
                          setActivePhotoIdx((prev) =>
                            prev === 0 ? albumPhotos.length - 1 : prev - 1
                          );
                        }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-[#422B1D] shadow-md transition-colors cursor-pointer"
                        aria-label="Ảnh trước"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIdx((prev) =>
                            prev === albumPhotos.length - 1 ? 0 : prev + 1
                          );
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white text-[#422B1D] shadow-md transition-colors cursor-pointer"
                        aria-label="Ảnh sau"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Chấm chỉ báo trang ảnh */}
                {albumPhotos.length > 1 && (
                  <div className="flex items-center justify-center gap-1.5 pt-2">
                    {albumPhotos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActivePhotoIdx(i)}
                        className={cn(
                          "h-2 rounded-full transition-all cursor-pointer",
                          i === activePhotoIdx
                            ? "w-6 bg-[#8C5633]"
                            : "w-2 bg-[#DFCBB5]"
                        )}
                        aria-label={`Xem ảnh ${i + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* QR Album Khách Chụp (Chỉ Pro/VIP) */}
                {!hiddenSections.has("albumQr") && data.plan !== "free" && (
                  <div className="pt-4 border-t border-[#DFCBB5]/60">
                    <GuestAlbumQr
                      slug={weddingSlug ?? data.weddingSlug}
                      accentColor="#8C5633"
                      textColor="#422B1D"
                      mutedColor="#7D6352"
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ============================================================
              7. HỘP QUÀ CHÚC PHÚC (gift)
              - 3 trạng thái tương tác: normal -> glow -> open
              - GiftModal qua createPortal
              ============================================================ */}
          {!hiddenSections.has("gift") && (
            <section
              style={{ order: orderOf("gift", 7) }}
              className="relative z-10"
            >
              <div className="rounded-3xl border border-[#DFCBB5] bg-[#FFFDFB]/95 p-6 sm:p-8 text-center shadow-sm space-y-4">
                <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-[#8C5633]">
                  HỘP QUÀ CHÚC PHÚC
                </p>
                <h3
                  className="text-xl sm:text-2xl font-normal text-[#422B1D]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  Gửi Gắm Yêu Thương
                </h3>

                <p className="text-xs sm:text-sm text-[#7D6352] max-w-md mx-auto leading-relaxed">
                  Sự hiện diện của Quý khách là niềm hạnh phúc trọn vẹn nhất của hai gia đình. Nếu ở xa không tiện ghé chung vui, Quý khách có thể gửi lời chúc qua hộp quà nhỏ bên dưới.
                </p>

                {/* Hộp quà vải lanh nâu caramel 3 trạng thái */}
                <div className="py-4">
                  <button
                    type="button"
                    onClick={() => setGiftModalOpen(true)}
                    onMouseEnter={() => setActiveGiftState("glow")}
                    onMouseLeave={() => setActiveGiftState("normal")}
                    className="group relative mx-auto block w-44 sm:w-52 cursor-pointer focus:outline-none"
                  >
                    <div className="relative w-full aspect-square flex items-center justify-center">
                      <img
                        src={`/templates/moc-huong-nang-thu/gift_box_${activeGiftState}.webp`}
                        alt="Hộp quà Mộc Hương"
                        className="w-full h-full object-contain drop-shadow-[0_8px_20px_rgba(140,86,51,0.18)] transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <span className="mt-2 inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#8C5633] text-white text-xs font-medium shadow-sm group-hover:bg-[#724426] transition-colors">
                      <Heart className="w-3.5 h-3.5 fill-current text-[#DFCBB5]" />
                      <span>Mở Hộp Quà Mừng</span>
                    </span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ============================================================
              8. XÁC NHẬN THAM DỰ & LỜI CHÚC (rsvp)
              - Đồng bộ theme 100%
              - Tránh tuyệt đối lỗi chữ sáng trên nền trắng trong thẻ select/option
              ============================================================ */}
          {!hiddenSections.has("rsvp") && (
            <section
              id="rsvp-section"
              style={{ order: orderOf("rsvp", 8) }}
              className="relative z-10"
            >
              <div className="rounded-3xl border border-[#DFCBB5] bg-[#FFFDFB]/95 p-6 sm:p-8 text-center shadow-sm space-y-6">
                <div>
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.26em] font-semibold text-[#8C5633]">
                    XÁC NHẬN THAM DỰ &amp; GỬI LỜI CHÚC
                  </p>
                  <h3
                    className="mt-1 text-xl sm:text-2xl font-normal text-[#422B1D]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Sổ Lưu Bút Mừng Cưới
                  </h3>
                  <p className="mt-2 text-xs text-[#7D6352] max-w-md mx-auto">
                    Để gia đình chuẩn bị chu đáo nhất cho sự hiện diện của Quý khách
                  </p>
                </div>

                <div className="[&_select]:!bg-[#FFFDFB] [&_select]:!text-[#422B1D] [&_option]:!bg-[#FFFDFB] [&_option]:!text-[#422B1D] [&_input]:!bg-[#FFFDFB] [&_input]:!text-[#422B1D] [&_textarea]:!bg-[#FFFDFB] [&_textarea]:!text-[#422B1D]">
                  <TemplateRsvpSection
                    data={data}
                    mode={mode}
                    tone="flowery"
                    customTheme={{
                      isDark: false,
                      card: "border border-[#DFCBB5] bg-[#FFFDFB] text-[#422B1D]",
                      input: "border border-[#DFCBB5] bg-[#FFFDFB] text-[#422B1D] placeholder:text-[#7D6352]/60 focus:border-[#8C5633] focus:ring-[#8C5633]",
                      primaryBtn: "bg-[#8C5633] text-white hover:bg-[#724426] font-medium",
                      outlineBtn: "border border-[#8C5633] bg-transparent text-[#8C5633] hover:bg-[#8C5633]/10",
                      alert: "border-[#DFCBB5] bg-[#F7EFE6] text-[#422B1D]",
                      badge: "border-[#DFCBB5] bg-[#F7EFE6] text-[#8C5633]",
                      optionBg: "#FFFDFB",
                      optionColor: "#422B1D",
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
              </div>
            </section>
          )}
        </div>

        {/* ============================================================
            9. FOOTER (Bên ngoài flex order container)
            - Không lặp lại ngày cưới
            ============================================================ */}
        <footer className="relative z-10 pt-10 pb-16 text-center border-t border-[#DFCBB5]/60 space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-[#DFCBB5]" />
            <span
              className="font-serif italic text-lg text-[#8C5633]"
              style={{ fontFamily: TITLE_FONT }}
            >
              Cảm Ơn
            </span>
            <span className="h-px w-10 bg-[#DFCBB5]" />
          </div>

          <p className="text-xs text-[#7D6352] max-w-sm mx-auto leading-relaxed">
            Chân thành cảm ơn tình cảm và sự hiện diện quý báu của Quý khách trong ngày vui của chúng mình.
          </p>

          <p
            className="text-lg font-normal text-[#422B1D] pt-1"
            style={{ fontFamily: TITLE_FONT }}
          >
            {groomName} &amp; {brideName}
          </p>
        </footer>
      </div>

      {/* ============================================================
          PORTALS: GIFT MODAL & LIGHTBOX
          ============================================================ */}
      <GiftModal
        open={giftModalOpen}
        onClose={() => setGiftModalOpen(false)}
        gift={data.gift}
        plan={data.plan}
        coupleName={`${groomName} & ${brideName}`}
        guestName={guestName}
        tone="minbrown"
      />

      {lightboxIndex !== null && (
        <TemplateLightboxModal
          photos={albumPhotos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={(idx) => setLightboxIndex(idx)}
        />
      )}
    </div>
  );
}
