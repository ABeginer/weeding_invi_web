"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingEvent } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: HẮC KIM NHẬT THỰC (hac-kim-nhat-thuc)
   - Đen Hắc Diệu Thạch (Obsidian Pitch Black): #09090B (sâu #050506, thẻ #121215)
   - Vàng Nhật Thực 24K (Solar Eclipse 24K Gold): #E0B866 (sáng #F6E2B3, trầm #A8833D)
   - Trắng Bạch Kim Ấm (Warm Platinum Ivory): #F5EFE6 (chữ phụ #B9AFA2)
   - Dress Code mặc định: #09090B (Đen tuyền), #E0B866 (Vàng 24K), #D9D4CC (Bạch kim ấm)
   ============================================================ */

const OBSIDIAN_MAIN = "#09090B";
const OBSIDIAN_CARD = "rgba(18, 18, 21, 0.94)";

const GOLD_24K = "#E0B866";
const GOLD_LIGHT = "#F6E2B3";

const TEXT_MUTED = "#B9AFA2";

const TITLE_FONT = "var(--font-playfair), 'Playfair Display', Georgia, serif";
const NAME_FONT = "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), 'Be Vietnam Pro', sans-serif";

const EASE_ECLIPSE = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "16:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm tại tiền sảnh Hắc Kim Nhật Thực" },
  { time: "17:30", label: "Nghi thức Nhật Nguyệt Giao Thoa & Lời hẹn ước vĩnh cửu" },
  { time: "18:00", label: "Dạ tiệc Black-Tie & Nâng ly chúc phúc tình yêu son sắt" },
  { time: "19:30", label: "Vũ điệu tình yêu & Hòa tấu thính phòng dưới ánh sao" },
  { time: "20:30", label: "Tiễn khách & Trao kỷ vật tri ân" },
];

const DEFAULT_DRESS = ["#09090B", "#E0B866", "#D9D4CC"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Bụi Vàng Sao Băng Nhật Thực (Stardust)
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function EclipseStardust({ count = 16 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 17) % 94 + 3}%`,
      size: (idx % 3) + 2.5,
      duration: 8 + (idx % 4) * 2,
      delay: (idx * 0.4) % 4,
      yOffset: 30 + (idx % 4) * 20,
      isBright: idx % 2 === 0,
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
            background: p.isBright
              ? "radial-gradient(circle, #F6E2B3 0%, rgba(224,184,102,0.45) 65%, transparent 100%)"
              : "radial-gradient(circle, #FFFFFF 0%, rgba(246,226,179,0.3) 60%, transparent 100%)",
            boxShadow: "0 0 6px 1.5px rgba(224,184,102,0.45)",
          }}
          animate={{
            y: [-10, -p.yOffset * 3.5, -p.yOffset * 7],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * (10 + (p.id % 12)), 0],
            opacity: [0, 0.85, 0],
            scale: [0.7, 1.25, 0.6],
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
   COMPONENT CHÍNH: HẮC KIM NHẬT THỰC
   ============================================================ */
export function HacKimNhatThucTemplate({
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

  // Preload 3 trạng thái hộp mừng cưới monolith hắc diệu thạch
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p1 = new Image();
    p1.src = "/templates/hac-kim-nhat-thuc/gift-normal.webp";
    const p2 = new Image();
    p2.src = "/templates/hac-kim-nhat-thuc/gift-hover.webp";
    const p3 = new Image();
    p3.src = "/templates/hac-kim-nhat-thuc/gift-active.webp";
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

  // Xử lý khi nhấn nút "Mở Thiệp" — Hiệu ứng "Diamond Ring Burst"
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
  const lunarClean = formatLunarDateClean(eventDateStr);

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

  // Lọc album ảnh cưới
  const isFree = (data.plan ?? "free") === "free";
  const rawAlbum = data.photos?.gallery || [];
  const albumPhotos = isFree ? rawAlbum.slice(0, 5) : rawAlbum;
  const [activePhotoIdx, setActivePhotoIdx] = React.useState<number>(0);

  // Timeline & Dress code
  const timelineItems = getTimeline(data);
  const dressColors = getDressColors(data);

  // Countdown timer an toàn hydration
  const [countdown, setCountdown] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const target = new Date(eventDateStr).getTime();
    function update() {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [eventDateStr]);

  // Danh sách các section ẩn & thứ tự section
  const hiddenSections = React.useMemo(() => {
    return new Set(data.hiddenSections || []);
  }, [data.hiddenSections]);

  const sectionOrder = data.sectionOrder || ["family", "calendar", "map", "dresscode", "album", "gift", "rsvp"];
  const orderOf = (name: string) => {
    const idx = sectionOrder.indexOf(name);
    return idx === -1 ? 99 : idx + 1;
  };

  // Tách tên phụ huynh tại &
  const groomParents: string[] = (data.couple?.groomParents || "")
    .split("&")
    .map((s: string) => s.trim())
    .filter(Boolean);
  const brideParents: string[] = (data.couple?.brideParents || "")
    .split("&")
    .map((s: string) => s.trim())
    .filter(Boolean);

  const groomName = data.couple?.groomName || "Nhật Minh";
  const brideName = data.couple?.brideName || "Kim Cương";
  const groomFullName = data.couple?.groomFullName || data.couple?.groomName || "Trần Nhật Minh";
  const brideFullName = data.couple?.brideFullName || data.couple?.brideName || "Vũ Kim Cương";
  const coupleDisplayName = `${groomName} & ${brideName}`;

  // Ảnh đại diện Hero
  const heroPhoto = data.photos?.heroUrl;

  return (
    <div
      className={cn(
        "relative w-full text-[#F5EFE6] select-none",
        contained
          ? "h-full overflow-y-auto overflow-x-hidden"
          : "min-h-screen overflow-x-hidden",
        !coverGone && (contained ? "h-full overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden")
      )}
      style={{
        backgroundColor: OBSIDIAN_MAIN,
        fontFamily: BODY_FONT,
      }}
    >
      {/* Nút nhạc nổi (Floating Music Button) */}
      {!externalMusicControl && data.music?.src && !data.hiddenSections?.includes("music") && (
        <LiveMusicFloatingButton
          src={data.music.src}
          title={data.music.title || "Nhật Thực Kim Cương"}
          visible={openState}
          tone="velvet"
        />
      )}

      {/* ============================================================
          BÌA MỞ THIỆP — HIỆU ỨNG "KHOẢNH KHẮC NHẬT THỰC"
          ============================================================ */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            key="hac-kim-cover"
            className={cn(
              "fixed inset-0 z-50 w-full max-w-full overflow-hidden flex flex-col items-center justify-between px-4 py-4 sm:px-6",
              contained ? "absolute h-full" : "h-screen-dvh"
            )}
            style={{ backgroundColor: OBSIDIAN_MAIN }}
            initial={{ opacity: 1 }}
            exit={
              reduce
                ? { opacity: 0 }
                : {
                  opacity: 0,
                  scale: 1.08,
                  filter: "blur(6px)",
                  transition: { duration: 0.75, ease: EASE_ECLIPSE },
                }
            }
          >
            {/* Hình nền cẩm thạch Kintsugi (hiển thị sắc nét 100%, z-0) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              <picture>
                <source
                  media="(min-width: 768px)"
                  srcSet="/templates/hac-kim-nhat-thuc/background.webp"
                />
                <img
                  src="/templates/hac-kim-nhat-thuc/background-mobile.webp"
                  alt="Nền cẩm thạch đen Kintsugi"
                  className="w-full h-full object-cover object-center"
                />
              </picture>
            </div>

            {/* Họa tiết Kintsugi góc */}
            <img
              src="/templates/hac-kim-nhat-thuc/corner-kintsugi.webp"
              alt="Họa tiết Kintsugi"
              className="absolute top-3 left-3 sm:top-5 sm:left-5 w-16 sm:w-20 pointer-events-none z-10 opacity-70"
            />
            <img
              src="/templates/hac-kim-nhat-thuc/corner-kintsugi.webp"
              alt="Họa tiết Kintsugi"
              className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 w-16 sm:w-20 pointer-events-none z-10 opacity-70 rotate-180"
            />

            {/* Bụi vàng lơ lửng */}
            <EclipseStardust count={18} />

            {/* NỘI DUNG TÂM ĐIỂM BÌA (my-auto) */}
            <div className="relative z-20 my-auto flex flex-col items-center text-center px-4 w-full max-w-[328px] sm:max-w-[380px] mx-auto">
              {/* Vòng Nhật Thực Xoay Quỹ Đạo Siêu Chậm */}
              <div className="relative w-[280px] sm:w-[330px] aspect-square flex items-center justify-center">
                {/* Vòng Nhật Thực */}
                <m.img
                  src="/templates/hac-kim-nhat-thuc/eclipse-ring.webp"
                  alt="Vòng Nhật Thực 24K"
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_0_25px_rgba(224,184,102,0.35)]"
                  animate={
                    isOpening
                      ? {
                        scale: [1, 1.38],
                        opacity: [1, 0],
                        rotate: 45,
                        transition: { duration: 0.75, ease: EASE_ECLIPSE },
                      }
                      : reduce
                        ? {}
                        : { rotate: 360 }
                  }
                  transition={
                    isOpening
                      ? undefined
                      : {
                        repeat: Infinity,
                        duration: 60,
                        ease: "linear",
                      }
                  }
                />

                {/* Quầng sáng kim cương bừng nở khi nhấn mở */}
                {isOpening && !reduce && (
                  <m.div
                    className="absolute inset-0 rounded-full pointer-events-none"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: [0.8, 1.8],
                      opacity: [0, 0.9, 0],
                    }}
                    transition={{ duration: 0.75, ease: EASE_ECLIPSE }}
                    style={{
                      background:
                        "radial-gradient(circle, rgba(246,226,179,0.9) 0%, rgba(224,184,102,0.5) 45%, transparent 70%)",
                    }}
                  />
                )}

                {/* Nội dung lọt lòng bên trong vòng tròn nhật thực */}
                <div className="relative z-10 flex flex-col items-center justify-center px-6">
                  {/* Huy hiệu đôi nhẫn vàng */}
                  <img
                    src="/templates/hac-kim-nhat-thuc/rings-crest.webp"
                    alt="Huy hiệu đôi nhẫn"
                    className="w-12 h-auto mb-2 opacity-90 drop-shadow-[0_0_8px_rgba(224,184,102,0.4)]"
                  />

                  <span className="text-[10px] sm:text-[11px] tracking-[0.35em] text-[#E0B866] uppercase font-light mb-1">
                    Wedding Invitation
                  </span>

                  {/* Tên cặp đôi 3 dòng: Groom / & / Bride */}
                  <div
                    className="flex flex-col items-center text-[#F6E2B3] tracking-widest leading-snug drop-shadow-md my-1"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    <span className="text-xl sm:text-2xl font-medium uppercase break-words text-center">
                      {groomName}
                    </span>
                    <span
                      className="text-lg sm:text-xl font-normal italic my-0.5 text-[#E0B866]"
                      style={{ fontFamily: NAME_FONT }}
                    >
                      &amp;
                    </span>
                    <span className="text-xl sm:text-2xl font-medium uppercase break-words text-center">
                      {brideName}
                    </span>
                  </div>

                  {/* Dải phân cách 5 pha trăng */}
                  <img
                    src="/templates/hac-kim-nhat-thuc/divider-lunar.webp"
                    alt="Dải phân cách trăng khuyết"
                    className="w-32 h-auto my-1.5 opacity-80"
                  />
                </div>
              </div>

              {/* Lời mời & Tên khách mời */}
              <div className="mt-3 mb-5 flex flex-col items-center">
                <span className="text-[11px] tracking-[0.25em] text-[#B9AFA2] uppercase">
                  Trân Trọng Kính Mời
                </span>
                {guestName && (
                  <span
                    className="mt-1 text-base sm:text-lg text-[#F6E2B3] font-medium tracking-wider"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {guestName}
                  </span>
                )}
              </div>

              {/* Nút Mở Thiệp Sắc Cạnh */}
              <button
                type="button"
                onClick={handleOpenCard}
                disabled={isOpening}
                className={cn(
                  "group relative px-8 py-2.5 rounded-[2px] border border-[#E0B866] bg-[#09090B]/90 text-[#E0B866] font-medium text-xs sm:text-sm tracking-[0.25em] uppercase transition-all duration-300 shadow-[0_0_15px_rgba(224,184,102,0.25)] hover:bg-[#E0B866] hover:text-[#09090B] hover:shadow-[0_0_25px_rgba(224,184,102,0.6)] cursor-pointer active:scale-95",
                  isOpening && "opacity-80 scale-95"
                )}
              >
                <span className="relative z-10 flex items-center justify-center">
                  Mở Thiệp
                </span>
              </button>
            </div>

            {/* Chân trang bìa tối giản */}
            <div className="relative z-10 pb-4 text-[10px] tracking-[0.2em] text-[#B9AFA2]/60 uppercase">
              Black-Tie Couture Invitation
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          RUỘT THIỆP — CẨM THẠCH ĐEN & THẺ ĐEN NHÁM VIỀN VÀNG 24K 1PX
          ============================================================ */}
      <div
        className={cn(
          "relative z-10 w-full transition-opacity duration-700",
          !coverGone && "hidden"
        )}
      >
        {/* Nền cẩm thạch cho Desktop & Mobile */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <picture>
            <source
              media="(min-width: 768px)"
              srcSet="/templates/hac-kim-nhat-thuc/background.webp"
            />
            <img
              src="/templates/hac-kim-nhat-thuc/background-mobile.webp"
              alt="Nền cẩm thạch đen Kintsugi"
              className="w-full h-full object-cover object-center"
            />
          </picture>
          <div className="absolute inset-0 bg-[#09090B]/75" />
        </div>

        {/* Khung nội dung tối đa 840px căn giữa trên Desktop */}
        <div className="relative z-10 mx-auto w-full max-w-[840px] px-4 py-8 sm:py-16 md:border-x md:border-[#E0B866]/30 min-h-screen">
          {/* Bụi vàng nhẹ nhàng trong ruột thiệp */}
          <EclipseStardust count={12} />

          {/* ------------------------------------------------------------
              HERO — "NHẬT NGUYỆT GIAO THOA"
              (Lồng ảnh cặp đôi tròn bên trong Vòng Nhật Thực)
              ------------------------------------------------------------ */}
          <m.header
            className="relative mb-12 sm:mb-20 flex flex-col items-center text-center overflow-hidden pt-4 pb-6"
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: EASE_ECLIPSE }}
          >
            {/* Nhãn mở đầu */}
            <span className="text-[11px] sm:text-xs tracking-[0.35em] text-[#E0B866] uppercase mb-4 font-light">
              Lễ Thành Hôn
            </span>

            {/* Vòng Nhật Thực Ôm Trọn Ảnh Cặp Đôi */}
            <div className="relative w-[260px] sm:w-[320px] aspect-square mx-auto mb-6 flex items-center justify-center">
              {/* Ảnh tròn hoặc Fallback tên 3 dòng */}
              {heroPhoto ? (
                <div className="absolute inset-[15%] rounded-full overflow-hidden shadow-2xl border border-[#E0B866]/40 group">
                  <img
                    src={heroPhoto}
                    alt="Ảnh cặp đôi"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Hiệu ứng ánh sáng vàng lướt chéo */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#E0B866]/20 via-transparent to-[#F6E2B3]/30 pointer-events-none" />
                </div>
              ) : (
                <div className="absolute inset-[15%] rounded-full bg-[#121215] flex flex-col items-center justify-center p-4 border border-[#E0B866]/30">
                  <img
                    src="/templates/hac-kim-nhat-thuc/rings-crest.webp"
                    alt="Huy hiệu đôi nhẫn"
                    className="w-10 h-auto mb-1 opacity-80"
                  />
                  <span
                    className="text-sm sm:text-base text-[#F6E2B3] uppercase font-medium leading-tight"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {groomName}
                  </span>
                  <span className="text-xs italic text-[#E0B866] my-0.5" style={{ fontFamily: NAME_FONT }}>
                    &amp;
                  </span>
                  <span
                    className="text-sm sm:text-base text-[#F6E2B3] uppercase font-medium leading-tight"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {brideName}
                  </span>
                </div>
              )}

              {/* Vành Nhật Thực 24K xoay nhẹ viền ngoài */}
              <m.img
                src="/templates/hac-kim-nhat-thuc/eclipse-ring.webp"
                alt="Vòng Nhật Thực"
                className="relative z-10 w-full h-full object-contain pointer-events-none drop-shadow-[0_0_20px_rgba(224,184,102,0.4)]"
                animate={reduce ? {} : { rotate: 360 }}
                transition={{ repeat: Infinity, duration: 90, ease: "linear" }}
              />
            </div>

            {/* Tên cặp đôi đầy đủ */}
            <h1
              className="text-2xl sm:text-4xl text-[#F6E2B3] font-normal tracking-wider uppercase mb-2 flex items-center gap-3"
              style={{ fontFamily: TITLE_FONT }}
            >
              <span>{groomName}</span>
              <span className="text-[#E0B866] italic font-serif">&amp;</span>
              <span>{brideName}</span>
            </h1>

            {/* Dải phân cách 5 pha trăng */}
            <img
              src="/templates/hac-kim-nhat-thuc/divider-lunar.webp"
              alt="Dải phân cách"
              className="w-40 sm:w-56 h-auto my-3 opacity-80"
            />

            {/* Thông điệp tình yêu */}
            <p className="max-w-[480px] text-xs sm:text-sm text-[#B9AFA2] leading-relaxed font-light italic px-4">
              {data.quote ||
                "Khoảnh khắc hai tâm hồn gặp nhau trong vầng hào quang vĩnh cửu, cùng nhau viết nên chương mới trọn đời yêu thương."}
            </p>
          </m.header>

          {/* ------------------------------------------------------------
              DANH SÁCH CÁC SECTION DYNAMIC (THEO SECTION ORDER)
              ------------------------------------------------------------ */}
          <div className="flex flex-col gap-10 sm:gap-16">
            {/* Section 1: Thông tin hai bên gia đình (family) */}
            {!hiddenSections.has("family") && (
              <div style={{ order: orderOf("family") }}>
                <section className="relative w-full rounded-2xl bg-[#121215]/94 border border-[#E0B866]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden">
                  {/* Họa tiết Kintsugi góc chéo */}
                  <img
                    src="/templates/hac-kim-nhat-thuc/corner-kintsugi.webp"
                    alt="Kintsugi"
                    className="absolute top-2 left-2 w-12 sm:w-16 pointer-events-none opacity-60"
                  />
                  <img
                    src="/templates/hac-kim-nhat-thuc/corner-kintsugi.webp"
                    alt="Kintsugi"
                    className="absolute bottom-2 right-2 w-12 sm:w-16 pointer-events-none opacity-60 rotate-180"
                  />

                  <div className="text-center mb-8">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0B866] font-semibold">
                      Gia Tộc Thông Báo
                    </span>
                    <p className="text-xs sm:text-sm text-[#B9AFA2] mt-1 italic">
                      Trân trọng báo tin lễ thành hôn của con chúng tôi
                    </p>
                  </div>

                  {/* 2 cột gia đình cân đối cao bằng nhau */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative">
                    {/* Đường phân cách giữa 2 cột trên Desktop */}
                    <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-[#E0B866]/40 to-transparent -translate-x-1/2" />

                    {/* Nhà Trai */}
                    <div className="flex flex-col items-center text-center space-y-3">
                      <span className="text-xs tracking-[0.2em] text-[#E0B866] uppercase font-semibold border-b border-[#E0B866]/30 pb-1">
                        Nhà Trai
                      </span>
                      <div className="text-xs sm:text-sm text-[#F5EFE6] space-y-1">
                        {groomParents.map((p: string, idx: number) => (
                          <p key={idx} className="font-normal">
                            {p}
                          </p>
                        ))}
                      </div>
                      <div className="pt-2">
                        <span className="text-[11px] text-[#B9AFA2] block">
                          {data.couple?.groomTitle || "Chú rể"}
                        </span>
                        <h3
                          className="text-lg sm:text-xl text-[#F6E2B3] font-medium tracking-wide mt-0.5"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {groomFullName}
                        </h3>
                      </div>
                    </div>

                    {/* Nhà Gái */}
                    <div className="flex flex-col items-center text-center space-y-3">
                      <span className="text-xs tracking-[0.2em] text-[#E0B866] uppercase font-semibold border-b border-[#E0B866]/30 pb-1">
                        Nhà Gái
                      </span>
                      <div className="text-xs sm:text-sm text-[#F5EFE6] space-y-1">
                        {brideParents.map((p: string, idx: number) => (
                          <p key={idx} className="font-normal">
                            {p}
                          </p>
                        ))}
                      </div>
                      <div className="pt-2">
                        <span className="text-[11px] text-[#B9AFA2] block">
                          {data.couple?.brideTitle || "Cô dâu"}
                        </span>
                        <h3
                          className="text-lg sm:text-xl text-[#F6E2B3] font-medium tracking-wide mt-0.5"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {brideFullName}
                        </h3>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Section 2: Thông tin Lễ Cưới (Ceremony — Đa Lễ 100%) */}
            <div style={{ order: orderOf("calendar") }}>
              <section className="relative w-full rounded-2xl bg-[#121215]/94 border border-[#E0B866]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0B866] font-semibold mb-1">
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
                      : formatLunarDateClean(evtDateStr);
                    const directionsUrl = getEventDirectionsUrl(evt);

                    return (
                      <div
                        key={evt.id || `event-${idx}`}
                        className="rounded-xl border border-[#E0B866]/30 bg-[#09090B]/70 p-5 sm:p-6 flex flex-col items-center text-center space-y-3"
                      >
                        <h2
                          className="text-xl sm:text-2xl text-[#F6E2B3] font-normal tracking-wide uppercase"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {evt.title || (idx === 0 ? "Lễ Thành Hôn" : `Lễ Cưới ${idx + 1}`)}
                        </h2>

                        {/* Giờ tổ chức */}
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#E0B866] tracking-widest uppercase">
                          <Clock className="w-4 h-4 text-[#E0B866]" />
                          <span>
                            VÀO LÚC {evtDateParts.time || "10:00"}
                          </span>
                        </div>

                        {/* Khối Ngày Ngang: THỨ | NGÀY | THÁNG */}
                        <div className="flex items-center justify-center gap-4 sm:gap-6 py-2.5 px-4 sm:px-6 rounded border border-[#E0B866]/30 bg-[#121215]/90 my-1">
                          <div className="text-center">
                            <span className="block text-[10px] sm:text-[11px] tracking-[0.2em] text-[#B9AFA2] uppercase">
                              {evtDateParts.weekday || "Chủ Nhật"}
                            </span>
                          </div>
                          <div className="w-px h-8 bg-[#E0B866]/40" />
                          <div className="text-center">
                            <span
                              className="block text-2xl sm:text-4xl font-bold text-[#E0B866] leading-none"
                              style={{ fontFamily: TITLE_FONT }}
                            >
                              {evtDateParts.day || "20"}
                            </span>
                          </div>
                          <div className="w-px h-8 bg-[#E0B866]/40" />
                          <div className="text-center">
                            <span className="block text-[10px] sm:text-[11px] tracking-[0.2em] text-[#B9AFA2] uppercase">
                              Tháng {evtDateParts.month || "03"}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] tracking-widest text-[#B9AFA2]">
                          NĂM {evtDateParts.year || "2027"}
                        </span>

                        {/* Ngày Âm Lịch */}
                        {evtLunar && (
                          <p className="text-xs text-[#E0B866] font-medium tracking-wider">
                            {evtLunar}
                          </p>
                        )}

                        {/* Địa điểm tổ chức */}
                        <div className="pt-3 border-t border-[#E0B866]/20 w-full space-y-1">
                          {evt.venueName && (
                            <h4
                              className="text-base sm:text-lg text-[#F6E2B3] font-medium"
                              style={{ fontFamily: TITLE_FONT }}
                            >
                              {evt.venueName}
                            </h4>
                          )}
                          {evt.venueAddress && (
                            <p className="text-xs text-[#B9AFA2] leading-relaxed">
                              {evt.venueAddress}
                            </p>
                          )}
                        </div>

                        {/* Nút tác vụ: Chỉ đường & Thêm vào lịch */}
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                          {directionsUrl && (
                            <a
                              href={directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[2px] bg-[#E0B866] text-[#09090B] text-xs font-semibold tracking-widest uppercase transition-all duration-300 hover:bg-[#F6E2B3] hover:shadow-[0_0_12px_rgba(224,184,102,0.5)] cursor-pointer"
                            >
                              <MapPin className="w-3.5 h-3.5 text-[#09090B]" />
                              <span>Chỉ Đường</span>
                            </a>
                          )}
                          <a
                            href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                              `${evt.title || "Lễ Cưới"}: ${groomName} & ${brideName}`
                            )}&dates=${evtDateStr.replace(/-|:|\./g, "").slice(0, 8)}T040000Z/${evtDateStr.replace(/-|:|\./g, "").slice(0, 8)}T080000Z&details=${encodeURIComponent(
                              `Trân trọng kính mời tham dự ${evt.title || "lễ cưới"} của ${groomName} & ${brideName}.`
                            )}&location=${encodeURIComponent(evt.venueAddress || "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-[2px] border border-[#E0B866]/50 hover:bg-[#E0B866]/20 text-[#E0B866] text-xs font-medium tracking-wider uppercase transition-colors"
                          >
                            <span>Thêm Vào Lịch</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* Section 3: Album Ảnh Cưới (album & albumQr — "Vogue Nocturne Gallery") */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <div style={{ order: orderOf("album") }}>
                <section className="relative w-full rounded-2xl bg-[#121215]/94 border border-[#E0B866]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0B866] font-semibold mb-1">
                    Vogue Nocturne Gallery
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F6E2B3] font-normal mb-8 tracking-wide uppercase"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Khoảnh Khắc Kim Cương
                  </h2>

                  {/* 3D Coverflow / Carousel */}
                  <div className="relative w-full max-w-[560px] flex items-center justify-center">
                    {albumPhotos.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIdx((prev) => (prev - 1 + albumPhotos.length) % albumPhotos.length)
                        }
                        className="absolute left-2 z-20 w-9 h-9 rounded-[2px] bg-[#09090B]/90 border border-[#E0B866] text-[#E0B866] flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Ảnh trước"
                      >
                        <ChevronLeft className="w-5 h-5 text-[#E0B866]" />
                      </button>
                    )}

                    <div
                      className="relative w-full aspect-[4/5] sm:aspect-[3/4] max-w-[400px] rounded-sm overflow-hidden shadow-2xl border border-[#E0B866]/60 cursor-pointer group"
                      onClick={() => setLightboxIndex(activePhotoIdx)}
                    >
                      <img
                        src={albumPhotos[activePhotoIdx]?.url || "/photos/hero2.webp"}
                        alt="Ảnh cưới"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#09090B]/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                        <span className="text-xs text-[#F5EFE6] bg-[#09090B]/80 px-4 py-1.5 rounded-[2px] border border-[#E0B866]/50 flex items-center gap-1.5">
                          Phóng to xem ảnh
                        </span>
                      </div>
                    </div>

                    {albumPhotos.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIdx((prev) => (prev + 1) % albumPhotos.length)
                        }
                        className="absolute right-2 z-20 w-9 h-9 rounded-[2px] bg-[#09090B]/90 border border-[#E0B866] text-[#E0B866] flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label="Ảnh kế tiếp"
                      >
                        <ChevronRight className="w-5 h-5 text-[#E0B866]" />
                      </button>
                    )}
                  </div>

                  {/* Bộ đếm ảnh phong cách biên tập: 01 — 05 */}
                  {albumPhotos.length > 1 && (
                    <div className="flex items-center gap-2 mt-6">
                      <span className="text-xs font-serif tracking-widest text-[#E0B866]">
                        {String(activePhotoIdx + 1).padStart(2, "0")} — {String(albumPhotos.length).padStart(2, "0")}
                      </span>
                    </div>
                  )}

                  {/* QR tải ảnh khách mời (chỉ hiện ở gói trả phí) */}
                  {!isFree && !hiddenSections.has("albumQr") && (
                    <div className="mt-8 pt-6 border-t border-[#E0B866]/30 w-full flex justify-center">
                      <GuestAlbumQr slug={weddingSlug} accentColor={GOLD_24K} textColor={GOLD_LIGHT} mutedColor={TEXT_MUTED} />
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* Section 4: Tiệc Cưới, Đếm Ngược & Lịch Ngày Vui (calendar — Vị trí ngày cưới #2) */}
            {!hiddenSections.has("calendar") && (
              <div style={{ order: orderOf("calendar") }}>
                <section className="relative w-full rounded-2xl bg-[#121215]/94 border border-[#E0B866]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0B866] font-semibold mb-1">
                    Đếm Ngược Ngày Vui
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F6E2B3] font-normal mb-6 tracking-wide uppercase"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Ngày Hạnh Phúc
                  </h2>

                  {/* Đồng hồ đếm ngược an toàn hydration */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-[420px] w-full mb-8">
                    {[
                      { label: "NGÀY", val: countdown.days },
                      { label: "GIỜ", val: countdown.hours },
                      { label: "PHÚT", val: countdown.minutes },
                      { label: "GIÂY", val: countdown.seconds },
                    ].map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center justify-center p-3 rounded-[2px] bg-[#09090B]/90 border border-[#E0B866]/40 shadow-inner"
                      >
                        <span
                          className="text-xl sm:text-3xl font-bold text-[#E0B866]"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {String(item.val).padStart(2, "0")}
                        </span>
                        <span className="text-[9px] sm:text-[10px] tracking-widest text-[#B9AFA2] uppercase mt-1">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Khung lịch tháng với điểm nhấn vòng tròn Nhật Thực */}
                  <div className="w-full max-w-[360px] p-5 rounded-[2px] bg-[#09090B]/90 border border-[#E0B866]/40">
                    <div className="text-center mb-4">
                      <span
                        className="text-sm font-semibold text-[#F6E2B3] tracking-widest uppercase"
                        style={{ fontFamily: TITLE_FONT }}
                      >
                        THÁNG {dateParts.month} — {dateParts.year}
                      </span>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d, i) => (
                        <div key={i} className="text-[#B9AFA2] font-semibold py-1">
                          {d}
                        </div>
                      ))}

                      {/* Mock calendar days */}
                      {Array.from({ length: 31 }, (_, i) => {
                        const dayNum = i + 1;
                        const isWeddingDay = eventDays.has(dayNum);
                        return (
                          <div
                            key={i}
                            className={cn(
                              "relative flex items-center justify-center h-8 rounded-full text-xs transition-colors",
                              isWeddingDay
                                ? "bg-[#E0B866] text-[#09090B] font-bold shadow-[0_0_12px_rgba(224,184,102,0.8)]"
                                : "text-[#F5EFE6]/80 hover:bg-[#E0B866]/10"
                            )}
                          >
                            {dayNum}
                            {isWeddingDay && (
                              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E0B866] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F6E2B3]" />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Section 5: Dress Code & Lịch trình ngày cưới (dresscode) */}
            {!hiddenSections.has("dresscode") && (
              <div style={{ order: orderOf("dresscode") }}>
                <section className="relative w-full rounded-2xl bg-[#121215]/94 border border-[#E0B866]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0B866] font-semibold mb-1">
                    Trang Phục Gợi Ý
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F6E2B3] font-normal mb-6 tracking-wide uppercase"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Dress Code
                  </h2>

                  <p className="text-xs sm:text-sm text-[#B9AFA2] max-w-[480px] leading-relaxed mb-6 font-light">
                    Để tạo nên không gian đêm tiệc trang trọng và đồng điệu, quý khách vui lòng ưu tiên trang phục mang các sắc màu:
                  </p>

                  {/* 3 vòng tròn màu Dress Code động */}
                  <div className="flex items-center justify-center gap-6 mb-12">
                    {dressColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-12 rounded-full border border-[#E0B866]/60 shadow-[0_4px_12px_rgba(0,0,0,0.6)] transition-transform hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={color}
                        aria-label={`Màu trang phục ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Timeline: Quỹ Đạo Đêm Tiệc */}
                  <div className="w-full max-w-[540px] pt-8 border-t border-[#E0B866]/30">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0B866] font-semibold mb-2 block">
                      Lịch Trình Chi Tiết
                    </span>
                    <h3
                      className="text-xl sm:text-2xl text-[#F6E2B3] font-normal mb-8 tracking-wide"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Quỹ Đạo Đêm Tiệc
                    </h3>

                    <div className="relative pl-6 sm:pl-8 text-left space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-[#E0B866] before:via-[#E0B866]/50 before:to-transparent">
                      {timelineItems.map((item, idx) => (
                        <div key={idx} className="relative group">
                          {/* Ngôi sao 4 cánh / hình thoi phát sáng */}
                          <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-[1px] rotate-45 bg-[#E0B866] border border-[#F6E2B3] shadow-[0_0_8px_rgba(224,184,102,0.7)] group-hover:scale-125 transition-transform" />
                          <span
                            className="text-sm sm:text-base font-semibold text-[#E0B866] tracking-wider block"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {item.time}
                          </span>
                          <p className="text-xs sm:text-sm text-[#F5EFE6] leading-relaxed mt-0.5">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Section 6: Hộp Mừng Cưới Monolith Kintsugi 3 Trạng Thái (gift) */}
            {!hiddenSections.has("gift") && (
              <div style={{ order: orderOf("gift") }}>
                <section className="relative w-full rounded-2xl bg-[#121215]/94 border border-[#E0B866]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col items-center text-center overflow-hidden">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0B866] font-semibold mb-1">
                    Gửi Lời Chúc Phúc
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#F6E2B3] font-normal mb-4 tracking-wide uppercase"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hộp Mừng Cưới
                  </h2>

                  <p className="text-xs sm:text-sm text-[#B9AFA2] max-w-[460px] leading-relaxed mb-6 font-light">
                    Sự hiện diện và lời chúc phúc của quý khách là món quà quý giá nhất. Quý khách cũng có thể gửi quà mừng qua tráp sính lễ hắc diệu thạch:
                  </p>

                  {/* Hộp quà Monolith 3 trạng thái tương tác */}
                  <div
                    className="relative w-[240px] sm:w-[280px] h-[260px] sm:h-[300px] flex items-center justify-center cursor-pointer group"
                    onMouseEnter={() => setActiveParcel("hover")}
                    onMouseLeave={() => setActiveParcel("normal")}
                    onClick={() => {
                      setActiveParcel("active");
                      setTimeout(() => setGiftModalOpen(true), 300);
                    }}
                  >
                    <img
                      src={`/templates/hac-kim-nhat-thuc/gift-${activeParcel}.webp`}
                      alt="Hộp mừng cưới Hắc Diệu Thạch"
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)]"
                    />

                    {/* Hào quang khi hover */}
                    <div className="absolute inset-0 rounded-full bg-radial from-[#E0B866]/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveParcel("active");
                      setGiftModalOpen(true);
                    }}
                    className="mt-6 px-8 py-2.5 rounded-[2px] border border-[#E0B866] bg-[#09090B]/90 text-[#E0B866] text-xs font-semibold tracking-widest uppercase transition-all duration-300 hover:bg-[#E0B866] hover:text-[#09090B] hover:shadow-[0_0_20px_rgba(224,184,102,0.5)] cursor-pointer"
                  >
                    Mở Hộp Mừng Cưới
                  </button>
                </section>
              </div>
            )}

            {/* Section 7: Xác nhận tham dự & Sổ lưu bút (rsvp) */}
            {!hiddenSections.has("rsvp") && (
              <div style={{ order: orderOf("rsvp") }}>
                <section className="relative w-full rounded-2xl bg-[#121215]/94 border border-[#E0B866]/40 p-6 sm:p-10 shadow-[0_16px_40px_rgba(0,0,0,0.8)] backdrop-blur-md overflow-hidden">
                  <div className="text-center mb-8">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-[#E0B866] font-semibold">
                      Phúc Đáp
                    </span>
                    <h2
                      className="text-2xl sm:text-3xl text-[#F6E2B3] font-normal mt-1 tracking-wide uppercase"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Xác Nhận Tham Dự
                    </h2>
                    <p className="text-xs sm:text-sm text-[#B9AFA2] mt-2 italic">
                      Xin vui lòng phản hồi trước ngày {dateParts.day} tháng {dateParts.month} để chúng tôi chuẩn bị đón tiếp chu đáo nhất.
                    </p>
                  </div>

                  <TemplateRsvpSection
                    data={data}
                    mode={mode}
                    tone="obsidian"
                    customTheme={{
                      isDark: true,
                      card: "border border-[#E0B866]/40 bg-[#121215] text-[#F5EFE6]",
                      input: "border border-[#E0B866]/40 bg-[#09090B] text-[#F5EFE6] placeholder:text-[#9F7A38]/70 focus:border-[#E0B866] focus:ring-[#E0B866]",
                      primaryBtn: "bg-gradient-to-r from-[#D4A853] via-[#F6E2B3] to-[#D4A853] text-[#09090B] hover:opacity-90 font-bold",
                      outlineBtn: "border border-[#E0B866] bg-transparent text-[#E0B866] hover:bg-[#E0B866]/15",
                      alert: "border-[#E0B866]/40 bg-[#121215] text-[#F5EFE6]",
                      badge: "border-[#E0B866]/40 bg-[#121215] text-[#E0B866]",
                      optionBg: "#121215",
                      optionColor: "#F5EFE6",
                    }}
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
                </section>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------
              FOOTER (ĐẶT NGOÀI FLEX CONTAINER CÓ ORDER)
              ------------------------------------------------------------ */}
          <footer className="mt-16 sm:mt-24 pt-12 pb-8 border-t border-[#E0B866]/30 flex flex-col items-center text-center">
            <img
              src="/templates/hac-kim-nhat-thuc/rings-crest.webp"
              alt="Huy hiệu đôi nhẫn"
              className="w-12 h-auto mb-3 opacity-90"
            />
            <img
              src="/templates/hac-kim-nhat-thuc/divider-lunar.webp"
              alt="Trăng khuyết"
              className="w-40 sm:w-52 h-auto my-2 opacity-80"
            />
            <p className="text-xs sm:text-sm text-[#F5EFE6] max-w-[420px] leading-relaxed my-3 font-light">
              Sự hiện diện của quý khách là niềm vinh hạnh lớn nhất của gia đình chúng tôi. Xin chân thành cảm ơn!
            </p>
            <div
              className="text-base sm:text-lg text-[#F6E2B3] tracking-widest uppercase mt-2"
              style={{ fontFamily: TITLE_FONT }}
            >
              {groomName} &amp; {brideName}
            </div>
            <span className="text-[10px] tracking-[0.25em] text-[#B9AFA2]/60 uppercase mt-6">
              Hắc Kim Nhật Thực • Black-Tie Wedding
            </span>
          </footer>
        </div>
      </div>

      {/* ============================================================
          MODALS & OVERLAYS QUA PORTAL
          ============================================================ */}
      {/* Lightbox Album Ảnh Cưới */}
      <TemplateLightboxModal
        photos={albumPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={(idx) => setLightboxIndex(idx)}
      />

      {/* Hộp Mừng Cưới (Gift Modal) */}
      <GiftModal
        open={giftModalOpen}
        onClose={() => {
          setGiftModalOpen(false);
          setActiveParcel("normal");
        }}
        gift={data.gift}
        plan={data.plan ?? "free"}
        coupleName={coupleDisplayName}
        guestName={guestName ?? null}
        tone="velvet"
      />
    </div>
  );
}

export default HacKimNhatThucTemplate;
