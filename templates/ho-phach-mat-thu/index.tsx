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
import type { TemplateData, WeddingEvent, WeddingPlan } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: HỔ PHÁCH MẬT THƯ (ho-phach-mat-thu)
   - Nâu Cà Phê Trầm (Espresso Walnut): #4E382C (sâu #36251C, trung #6B4F3F)
   - Hổ Phách Đồng Cổ (Antique Amber Bronze): #B68B59 (sáng #D8B78E)
   - Giấy Bông Kem Cổ (Handmade Vintage Parchment): #F6EFE6 (thẻ sáng #FBF8F3, thẻ kraft #EDE2D3)
   - Chữ nội dung trên nền giấy: #5A463A (chính) / #7D695C (phụ)
   - Dress Code mặc định: #0D2B1D (Xanh rừng đậm), #D8B372 (Vàng mật ong), #3F5E45 (Xanh rêu cổ), #F3E7CC (Kem vani)
   ============================================================ */

const ESPRESSO_WALNUT = "#4E382C";
const ESPRESSO_DEEP = "#36251C";
const ESPRESSO_MID = "#6B4F3F";

const AMBER_BRONZE = "#B68B59";
const AMBER_LIGHT = "#D8B78E";
const AMBER_BORDER = "rgba(182, 139, 89, 0.55)";
const AMBER_SUBTLE = "rgba(182, 139, 89, 0.22)";

const PARCHMENT_BG = "#F6EFE6";
const PARCHMENT_CARD_BRIGHT = "#FBF8F3";
const PARCHMENT_KRAFT = "#EDE2D3";

const TEXT_DARK_TITLE = "#4E382C";
const TEXT_DARK_BODY = "#5A463A";
const TEXT_DARK_MUTED = "#7D695C";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_VINTAGE = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "16:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm tại tiền sảnh Mật Thư Cổ Điển" },
  { time: "17:30", label: "Nghi lễ Khải Phong kết duyên & Trao hẹn ước trăm năm" },
  { time: "18:00", label: "Khai tiệc mừng uyên ương & Nâng ly chúc phúc" },
  { time: "19:30", label: "Vũ khúc tình yêu & Những thanh âm lãng mạn" },
  { time: "20:30", label: "Tiễn khách & Trao quà cảm tạ tri ấn" },
];

const DEFAULT_DRESS = ["#0D2B1D", "#D8B372", "#3F5E45", "#F3E7CC"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 4) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Cánh Lá Khô & Bụi Hổ Phách Rơi Chậm
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function HerbLeavesFalling({ count = 12 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 19) % 92 + 4}%`,
      size: (idx % 3) + 2.5,
      duration: 10 + (idx % 4) * 2.5,
      delay: (idx * 0.7) % 5,
      yOffset: 30 + (idx % 4) * 20,
      isAmber: idx % 2 === 0,
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
            height: p.size * 1.4,
            background: p.isAmber
              ? "radial-gradient(ellipse, #D8B78E 0%, rgba(182,139,89,0.3) 70%, transparent 100%)"
              : "radial-gradient(ellipse, #EDE2D3 0%, rgba(107,79,63,0.2) 60%, transparent 100%)",
            boxShadow: "0 0 6px 1px rgba(182,139,89,0.3)",
          }}
          animate={{
            y: [0, 400, 900],
            x: [0, p.id % 2 === 0 ? 15 : -15, 0],
            rotate: [0, 180, 360],
            opacity: [0, 0.75, 0],
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
   COMPONENT CHÍNH: HỔ PHÁCH MẬT THƯ
   ============================================================ */
export function HoPhachMatThuTemplate({
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


  const [mounted, setMounted] = React.useState<boolean>(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Preload 3 trạng thái bưu kiện quà
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const p1 = new Image();
    p1.src = "/templates/ho-phach-mat-thu/gift-normal.webp";
    const p2 = new Image();
    p2.src = "/templates/ho-phach-mat-thu/gift-hover.webp";
    const p3 = new Image();
    p3.src = "/templates/ho-phach-mat-thu/gift-active.webp";
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
    playCoverSfx("envelope");

    if (reduce) {
      setCoverGone(true);
      setOpenState(true);
      setIsOpening(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
      return;
    }

    // Nhịp 1 (0 -> 550ms): lật nắp 3D, nhấc ấn sáp
    // Nhịp 2 (450ms -> 1150ms): trượt ảnh cặp đôi ra khỏi lòng phong thư
    setTimeout(() => {
      setCoverGone(true);
      setOpenState(true);
      setIsOpening(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 1150);
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

  // Ảnh Polaroid Hero
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

  // Lịch tháng vintage
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
        title={data.music.title || "Giai điệu Mật Thư"}
        visible={openState}
        tone="minbrown"
      />
    );
  };

  // Thứ tự hiển thị các khối section
  const sectionOrder = data.sectionOrder ?? [
    "family",
    "calendar",
    "map",
    "dresscode",
    "album",
    "albumQr",
    "gift",
    "rsvp",
  ];
  const hiddenSections = new Set(data.hiddenSections ?? []);

  const orderOf = (key: string) => {
    const idx = sectionOrder.indexOf(key);
    return idx === -1 ? 99 : idx;
  };

  const coupleDisplayName = `${data.couple?.groomName ?? "Chú Rể"} & ${data.couple?.brideName ?? "Cô Dâu"}`;

  return (
    <div
      className={cn(
        "relative w-full text-[#5A463A] selection:bg-[#B68B59] selection:text-white",
        contained ? "h-full overflow-y-auto" : "min-h-screen",
        !coverGone && (contained ? "h-full overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden")
      )}
      style={{
        backgroundColor: PARCHMENT_BG,
        fontFamily: BODY_FONT,
      }}
    >
      {/* ============================================================
          MÀN HÌNH BÌA MỞ THIỆP — "KHẢI PHONG MẬT THƯ"
          ============================================================ */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            key="envelope-cover"
            className={cn(
              "absolute inset-0 z-50 w-full max-w-full overflow-hidden flex flex-col items-center justify-center px-4 py-4 select-none",
              contained ? "h-full" : "h-screen-dvh"
            )}
            style={{
              backgroundImage: viewport === "desktop" ? "url(/templates/ho-phach-mat-thu/background.webp)" : "url(/templates/ho-phach-mat-thu/background-mobile.webp)",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
          >
            {/* Cánh lá khô & bụi hổ phách rơi chậm */}
            <HerbLeavesFalling count={14} />

            {/* Khối Phong Thư Nâu 3D Tương Tác Trực Tiếp */}
            <div className="relative w-full max-w-[328px] sm:max-w-[380px] mx-auto aspect-[640/709] my-auto flex flex-col items-center justify-end">
              {/* LỚP 0 (z-0): envelope-back.webp (lớp lót hoa văn cổ & mặt lưng phong thư)
                  Chỉ hiển thị nắp mở hoa văn khi phong thư bắt đầu mở; khi đóng thì ẩn lớp nắp ngửa này đi */}
              <div
                className={cn(
                  "absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-300",
                  isOpening ? "opacity-100" : "opacity-0"
                )}
              >
                <img
                  src="/templates/ho-phach-mat-thu/envelope-back.webp"
                  alt="Lòng Phong Thư Cổ"
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>

              {/* Lớp lưng phong bì khi đóng (ngăn nhìn xuyên qua khi chưa mở) */}
              {!isOpening && (
                <div
                  className="absolute inset-x-0 bottom-0 top-[39.07%] bg-[#473023] rounded-b-sm pointer-events-none z-0 shadow-2xl"
                  aria-hidden="true"
                />
              )}

              {/* LỚP 10 (z-10): Ảnh Cặp Đôi Polaroid Trượt Ra Từ Trong Lòng Phong Thư
                  Khi !isOpening: ẨN HOÀN TOÀN (opacity-0, khóa bên trong lòng phong bì, không lòi đáy)
                  Khi isOpening: Trượt nhô lên thanh thoát sau khi nắp mở ra */}
              <m.div
                className="absolute inset-x-8 sm:inset-x-10 aspect-[3/4] z-10 origin-bottom pointer-events-none"
                style={{ top: "39.07%" }}
                initial={{ y: "15%", rotate: 0, opacity: 0 }}
                animate={
                  isOpening
                    ? {
                      y: "-45%",
                      rotate: -2,
                      opacity: 1,
                      transition: { delay: 0.45, duration: 0.75, ease: EASE_VINTAGE },
                    }
                    : { y: "15%", rotate: 0, opacity: 0 }
                }
              >
                <div className="relative w-full h-full bg-[#FAF6F1] rounded-xs p-3 pb-8 shadow-2xl border border-[#B68B59]/30 flex flex-col items-center">
                  {/* Mảnh băng keo giấy washi ở đỉnh */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#D8B78E]/40 border-t border-b border-[#B68B59]/35 rounded-xs rotate-1" />

                  {/* Ảnh cưới hoặc thiếp đề tên */}
                  {heroPhotoUrl ? (
                    <img
                      src={heroPhotoUrl}
                      alt="Ảnh cặp đôi"
                      className="w-full h-full object-cover rounded-xs"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F3ECE1] border border-[#DFCBB5] rounded-xs flex flex-col items-center justify-center p-4 text-center">
                      <span className="font-serif italic text-2xl text-[#4E382C]">{data.couple?.groomName || "Huy Hoàng"}</span>
                      <span className="text-[#B68B59] font-serif text-lg my-1">&amp;</span>
                      <span className="font-serif italic text-2xl text-[#4E382C]">{data.couple?.brideName || "Thùy Dung"}</span>
                    </div>
                  )}

                  {/* Dấu sáp nhỏ góc dưới phải ảnh */}
                  <img
                    src="/templates/ho-phach-mat-thu/wax-seal.webp"
                    alt="Wax Seal"
                    className="absolute -bottom-3 -right-3 w-10 h-10 object-contain drop-shadow-md pointer-events-none"
                  />
                </div>
              </m.div>

              {/* LỚP 20 (z-20): envelope-pocket.webp (Túi chữ V màu nâu espresso phía trước) */}
              <img
                src="/templates/ho-phach-mat-thu/envelope-pocket.webp"
                alt="Túi Phong Thư"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
              />

              {/* LỚP 30 (z-30): Nắp Tam Giác 3D Khớp Khít Tuyệt Đối & Ấn Sáp Niêm Phong
                  Bắt đầu chính xác từ đường gấp ngang y=39.07% (y=277/709) và mũi nhọn chạm y=64.88% (y=460/709) */}
              <m.div
                className="absolute inset-x-0 z-30"
                style={{
                  top: "39.07%",
                  height: "25.81%",
                  transformOrigin: "top center",
                  transformStyle: "preserve-3d",
                  perspective: 1000,
                }}
                initial={{ rotateX: 0 }}
                animate={
                  isOpening
                    ? { rotateX: -180, transition: { duration: 0.65, ease: EASE_VINTAGE } }
                    : { rotateX: 0 }
                }
              >
                {/* Nắp tam giác nâu espresso khớp khít mép túi */}
                <svg
                  className="w-full h-full drop-shadow-[0_8px_16px_rgba(40,24,15,0.45)]"
                  viewBox="0 0 640 183"
                  preserveAspectRatio="none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <polygon points="0,0 640,0 320,183" fill="#4E382C" stroke="#3D2B22" strokeWidth="1.5" />
                  <polyline
                    points="12,3 320,175 628,3"
                    stroke="#B68B59"
                    strokeWidth="1"
                    strokeOpacity="0.45"
                  />
                </svg>

                {/* Ấn sáp đồng cổ niêm phong nằm đúng tâm đỉnh mũi nắp tam giác */}
                <m.div
                  className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-1/2 w-14 h-14 sm:w-16 sm:h-16"
                  initial={{ opacity: 1, scale: 1 }}
                  animate={
                    isOpening
                      ? { opacity: 0, scale: 1.25, transition: { duration: 0.3 } }
                      : {
                        scale: [1, 1.04, 1],
                        transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                      }
                  }
                >
                  <img
                    src="/templates/ho-phach-mat-thu/wax-seal.webp"
                    alt="Ấn Sáp Niêm Phong"
                    className="w-full h-full object-contain drop-shadow-[0_4px_14px_rgba(40,24,15,0.6)]"
                  />
                </m.div>
              </m.div>

              {/* LỚP 40 (z-40): Thông tin thiệp & Nút Mở Thiệp trên nền thân phong bì nâu trầm
                  Nằm gọn gàng hoàn toàn bên dưới con dấu sáp (từ y=70% đến 96%), không chạm con dấu sáp */}
              {!isOpening && (
                <div className="absolute inset-x-4 bottom-3 sm:bottom-4 z-40 flex flex-col items-center text-center pointer-events-auto">
                  <p className="text-[10px] sm:text-[11px] tracking-[0.25em] text-[#EDE2D3] uppercase font-medium drop-shadow-sm mb-1">
                    {guestName ? `Kính gửi: ${guestName}` : (data.ui?.invitePrefix || "Trân Trọng Kính Mời")}
                  </p>
                  <div
                    className="text-[#FBF8F3] drop-shadow-md text-base sm:text-lg font-light mb-2.5 max-w-[90%] mx-auto"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    <span className="inline-block leading-tight">{data.couple?.groomName || "Huy Hoàng"}</span>
                    <span className="text-[#D8B78E] text-xs mx-1.5 font-serif">&amp;</span>
                    <span className="inline-block leading-tight">{data.couple?.brideName || "Thùy Dung"}</span>
                  </div>

                  {/* Nút tem thư / pill viền hổ phách */}
                  <button
                    onClick={handleOpenCard}
                    className="group relative px-5 py-1.5 sm:px-6 sm:py-2 rounded-full bg-[#FAF6F0] hover:bg-[#FFFFFF] border border-[#B68B59] shadow-lg flex items-center gap-1.5 text-[#4E382C] font-serif tracking-[0.18em] text-[11px] sm:text-xs font-semibold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <span>MỞ MẬT THƯ</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B68B59] group-hover:scale-125 transition-transform" />
                  </button>
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          RUỘT THIỆP — GIẤY BÔNG KEM CỔ & NÂU ESPRESSO
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
              HERO — "MẬT THƯ ĐÃ MỞ & ẢNH CẶP ĐÔI POLAROID"
              (Không lặp lại ngày cưới tại Hero)
              ============================================================ */}
          <section className="relative w-full flex flex-col items-center text-center pt-4">
            <span
              className="text-xs uppercase tracking-[0.3em] text-[#7D695C] font-semibold mb-2"
              style={{ fontFamily: BODY_FONT }}
            >
              {data.ui?.eyebrow || "The Wedding Invitation"}
            </span>
            <p className="text-xs sm:text-sm tracking-[0.2em] text-[#8C705F] uppercase font-serif mb-6">
              Trân Trọng Báo Tin Lễ Thành Hôn
            </p>

            {/* Bệ nâng phong thư nâu đã mở */}
            <div className="relative w-full max-w-[380px] aspect-[640/709] mx-auto my-2 flex flex-col items-center justify-end">
              {/* Lớp lưng phong thư */}
              <img
                src="/templates/ho-phach-mat-thu/envelope-back.webp"
                alt="Lòng Phong Thư"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-0"
              />

              {/* Tấm ảnh Polaroid nhô cao khỏi lòng phong thư */}
              <div
                className="absolute inset-x-8 top-8 aspect-[3/4] z-10 origin-bottom"
                style={{ transform: "translateY(-16%) rotate(-2deg)" }}
              >
                <div className="relative w-full h-full bg-[#FAF6F1] rounded-xs p-3 pb-8 shadow-2xl border border-[#B68B59]/30 flex flex-col items-center">
                  {/* Băng keo washi */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#D8B78E]/40 border-t border-b border-[#B68B59]/35 rounded-xs rotate-1" />

                  {heroPhotoUrl ? (
                    <img
                      src={heroPhotoUrl}
                      alt="Ảnh cưới Polaroid"
                      className="w-full h-full object-cover rounded-xs"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F3ECE1] border border-[#DFCBB5] rounded-xs flex flex-col items-center justify-center p-4 text-center">
                      <span className="font-serif italic text-2xl text-[#4E382C]">{data.couple?.groomName || "Huy Hoàng"}</span>
                      <span className="text-[#B68B59] font-serif text-lg my-1">&amp;</span>
                      <span className="font-serif italic text-2xl text-[#4E382C]">{data.couple?.brideName || "Thùy Dung"}</span>
                    </div>
                  )}

                  {/* Dấu sáp góc ảnh */}
                  <img
                    src="/templates/ho-phach-mat-thu/wax-seal.webp"
                    alt="Wax Seal"
                    className="absolute -bottom-3 -right-3 w-10 h-10 object-contain drop-shadow-md pointer-events-none"
                  />
                </div>
              </div>

              {/* Cành hoa bi khô leaning mép ảnh */}
              <img
                src="/templates/ho-phach-mat-thu/sprig-gypso.webp"
                alt="Sprig Gypso"
                className="absolute -right-4 top-10 w-24 object-contain pointer-events-none z-15 rotate-12 opacity-90 drop-shadow-sm"
              />

              {/* Lớp túi V phía trước che chân ảnh */}
              <img
                src="/templates/ho-phach-mat-thu/envelope-pocket.webp"
                alt="Mặt Trước Phong Thư"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
              />
            </div>

            {/* Tên cặp đôi 3 dòng nghệ thuật */}
            <div className="mt-6 flex flex-col items-center">
              <h1
                className="text-3xl sm:text-4xl text-[#4E382C] font-normal tracking-wide"
                style={{ fontFamily: TITLE_FONT }}
              >
                <span className="block">{data.couple?.groomFullName || data.couple?.groomName || "Vũ Huy Hoàng"}</span>
                <span className="block text-[#B68B59] text-2xl sm:text-3xl my-1 font-serif italic">&amp;</span>
                <span className="block">{data.couple?.brideFullName || data.couple?.brideName || "Trần Thùy Dung"}</span>
              </h1>
            </div>

            {/* Dải phân cách thư pháp */}
            <div className="w-full max-w-[280px] sm:max-w-[340px] mx-auto mt-6">
              <img
                src="/templates/ho-phach-mat-thu/divider-vintage.webp"
                alt="Divider"
                className="w-full object-contain opacity-80"
              />
            </div>
          </section>

          {/* ============================================================
              DỰNG CÁC KHỐI THEO THỨ TỰ CỦA SECTION ORDER
              ============================================================ */}
          <div className="flex flex-col gap-12 sm:gap-16">
            {/* Section 1: Thông tin gia đình */}
            {!hiddenSections.has("family") && (
              <div style={{ order: orderOf("family") }}>
                <section className="relative w-full rounded-2xl bg-[#EDE2D3]/70 border border-[#D5C4B0] p-6 sm:p-10 shadow-sm overflow-hidden">
                  {/* Cành lá khô trang trí 2 mép nền */}
                  <img
                    src="/templates/ho-phach-mat-thu/sprig-olive.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute -left-6 -top-6 w-28 sm:w-36 object-contain pointer-events-none z-0 opacity-40 -rotate-12"
                  />
                  <img
                    src="/templates/ho-phach-mat-thu/sprig-gypso.webp"
                    alt=""
                    aria-hidden="true"
                    className="absolute -right-6 -bottom-6 w-28 sm:w-36 object-contain pointer-events-none z-0 opacity-40 rotate-12"
                  />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <span className="text-[11px] uppercase tracking-[0.25em] text-[#7D695C] font-semibold mb-1">
                      Hai Bên Gia Đình
                    </span>
                    <h2
                      className="text-xl sm:text-2xl text-[#4E382C] font-normal mb-2"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Thông Tin Gia Đình
                    </h2>
                    <p className="text-xs sm:text-sm text-[#7D695C] italic mb-8 max-w-[500px]">
                      Trân trọng báo tin lễ thành hôn của con chúng tôi
                    </p>

                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-6 items-stretch">
                      {/* Nhà Trai */}
                      <div className="h-full flex flex-col items-center text-center p-5 rounded-xl bg-[#FBF8F3]/80 border border-[#DFCBB5] shadow-xs">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-[#B68B59] font-semibold mb-3">
                          NHÀ TRAI
                        </span>
                        <div className="flex flex-col gap-1 text-sm text-[#5A463A] mb-4">
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
                        <div className="mt-auto pt-3 border-t border-[#B68B59]/25 w-full">
                          <span className="text-xs uppercase tracking-wider text-[#7D695C] block mb-1">
                            {data.couple?.groomTitle || "Chú rể"}
                          </span>
                          <span
                            className="text-lg sm:text-xl text-[#4E382C] font-medium"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {data.couple?.groomFullName || data.couple?.groomName || "Vũ Huy Hoàng"}
                          </span>
                        </div>
                      </div>

                      {/* Nhà Gái */}
                      <div className="h-full flex flex-col items-center text-center p-5 rounded-xl bg-[#FBF8F3]/80 border border-[#DFCBB5] shadow-xs">
                        <span className="text-[11px] uppercase tracking-[0.2em] text-[#B68B59] font-semibold mb-3">
                          NHÀ GÁI
                        </span>
                        <div className="flex flex-col gap-1 text-sm text-[#5A463A] mb-4">
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
                        <div className="mt-auto pt-3 border-t border-[#B68B59]/25 w-full">
                          <span className="text-xs uppercase tracking-wider text-[#7D695C] block mb-1">
                            {data.couple?.brideTitle || "Cô dâu"}
                          </span>
                          <span
                            className="text-lg sm:text-xl text-[#4E382C] font-medium"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {data.couple?.brideFullName || data.couple?.brideName || "Trần Thùy Dung"}
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
                <section className="relative w-full rounded-2xl bg-[#FBF8F3] border border-[#DFCBB5] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#7D695C] font-semibold mb-1">
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
                          className="rounded-xl border border-[#DFCBB5] bg-[#EDE2D3]/40 p-5 sm:p-6 flex flex-col items-center text-center space-y-3"
                        >
                          <h2
                            className="text-xl sm:text-2xl text-[#4E382C] font-normal"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            {evt.title || (idx === 0 ? "Hôn Lễ Thành Hôn" : `Lễ Cưới ${idx + 1}`)}
                          </h2>

                          {/* Thanh ngày ngang THỨ | NGÀY | THÁNG */}
                          <div className="w-full max-w-[380px] my-2 py-2.5 px-4 rounded-xl border border-[#B68B59]/40 bg-[#FBF8F3] flex items-center justify-around text-[#4E382C]">
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase tracking-widest text-[#7D695C]">Thứ</span>
                              <span className="text-sm sm:text-base font-serif font-bold">{evtDateParts.weekday}</span>
                            </div>
                            <div className="h-6 w-[1px] bg-[#B68B59]/40" />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase tracking-widest text-[#7D695C]">Ngày</span>
                              <span className="text-xl sm:text-2xl font-serif font-bold text-[#B68B59]">{evtDateParts.day}</span>
                            </div>
                            <div className="h-6 w-[1px] bg-[#B68B59]/40" />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase tracking-widest text-[#7D695C]">Tháng</span>
                              <span className="text-sm sm:text-base font-serif font-bold">{evtDateParts.month}</span>
                            </div>
                            <div className="h-6 w-[1px] bg-[#B68B59]/40" />
                            <div className="flex flex-col items-center">
                              <span className="text-[10px] uppercase tracking-widest text-[#7D695C]">Năm</span>
                              <span className="text-sm sm:text-base font-serif font-bold">{evtDateParts.year}</span>
                            </div>
                          </div>

                          {/* Âm lịch */}
                          {evtLunar && (
                            <p className="text-xs text-[#7D695C] italic">
                              (Nhằm {evtLunar})
                            </p>
                          )}

                          {/* Giờ và địa điểm */}
                          <div className="flex flex-col items-center gap-1.5 w-full pt-1">
                            {evtDateParts.time && (
                              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#4E382C] font-medium">
                                <Clock className="w-4 h-4 text-[#B68B59]" />
                                <span>Vào lúc {evtDateParts.time}</span>
                              </div>
                            )}
                            {evt.venueName && (
                              <h3
                                className="text-base sm:text-lg text-[#4E382C] font-semibold mt-1"
                                style={{ fontFamily: TITLE_FONT }}
                              >
                                {evt.venueName}
                              </h3>
                            )}
                            {evt.venueAddress && (
                              <p className="text-xs text-[#5A463A] leading-relaxed">
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
                                  className="px-5 py-2 rounded-full bg-[#4E382C] hover:bg-[#36251C] text-[#F6EFE6] border border-[#B68B59] text-xs font-serif tracking-widest uppercase transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 shadow-xs cursor-pointer"
                                >
                                  <MapPin className="w-3.5 h-3.5 text-[#D8B78E]" />
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
                                className="px-5 py-2 rounded-full bg-[#FAF6F0] hover:bg-[#FFFFFF] border border-[#B68B59] text-xs font-serif tracking-widest text-[#4E382C] uppercase shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                              >
                                <Calendar className="w-3.5 h-3.5 text-[#B68B59]" />
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
                <section className="relative w-full rounded-2xl bg-[#EDE2D3]/60 border border-[#D5C4B0] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#7D695C] font-semibold mb-1">
                    Ngày Chung Đôi
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#4E382C] font-normal mb-6"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Lịch Ngày Vui &amp; Đếm Ngược
                  </h2>

                  {/* Khối Lịch Tháng Espresso Nền Tối (#4E382C chữ #F6EFE6) */}
                  <div className="w-full max-w-[380px] p-6 rounded-2xl bg-[#4E382C] text-[#F6EFE6] shadow-xl border border-[#6B4F3F] mb-8">
                    <div className="text-center font-serif tracking-[0.2em] text-sm text-[#D8B78E] font-medium mb-4 pb-3 border-b border-[#6B4F3F]">
                      {calendarGrid.monthYear}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-[#D8B78E]/75 font-semibold">
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
                                ? "relative font-bold text-[#4E382C] bg-[#D8B78E] shadow-md scale-105"
                                : "text-[#EDE2D3]/90 hover:bg-[#6B4F3F]/40"
                            )}
                          >
                            {dayNum}
                            {isSpecial && (
                              <Heart className="absolute -top-1 -right-1 w-3.5 h-3.5 fill-[#B68B59] text-[#B68B59] animate-pulse" />
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
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#FBF8F3] border border-[#DFCBB5] shadow-xs"
                      >
                        <span
                          className="text-xl sm:text-2xl font-bold text-[#4E382C]"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {String(item.val).padStart(2, "0")}
                        </span>
                        <span className="text-[10px] sm:text-xs text-[#7D695C] uppercase tracking-wider mt-1">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Nút thêm vào lịch */}
                  <a
                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                      `Đám cưới ${data.couple?.groomName || "Huy Hoàng"} & ${data.couple?.brideName || "Thùy Dung"}`
                    )}&dates=${new Date(eventDateStr)
                      .toISOString()
                      .replace(/-|:|\.\d\d\d/g, "")}/${new Date(
                        new Date(eventDateStr).getTime() + 3 * 3600 * 1000
                      )
                        .toISOString()
                        .replace(/-|:|\.\d\d\d/g, "")}&details=${encodeURIComponent(
                          `Trân trọng kính mời đến dự lễ cưới của ${data.couple?.groomName || "Huy Hoàng"} & ${data.couple?.brideName || "Thùy Dung"}`
                        )}&location=${encodeURIComponent(targetEvent?.venueAddress || "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 rounded-full bg-[#FAF6F0] hover:bg-[#FFFFFF] border border-[#B68B59] text-xs font-serif tracking-widest text-[#4E382C] uppercase shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#B68B59]" />
                    <span>Thêm Vào Lịch Của Bạn</span>
                  </a>
                </section>
              </div>
            )}

            {/* Section 4: Album ảnh cưới coverflow */}
            {!hiddenSections.has("album") && albumPhotos.length > 0 && (
              <div style={{ order: orderOf("album") }}>
                <section className="relative w-full rounded-2xl bg-[#FBF8F3] border border-[#DFCBB5] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#7D695C] font-semibold mb-1">
                    Kỷ Niệm Tình Yêu
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#4E382C] font-normal mb-8"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Album Ảnh Cưới
                  </h2>

                  {/* Coverflow / Carousel */}
                  <div className="relative w-full max-w-[520px] aspect-[4/3] sm:aspect-[16/10] rounded-xl overflow-hidden shadow-xl border-4 border-[#FAF6F0]">
                    <img
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
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#4E382C]/80 hover:bg-[#4E382C] text-[#F6EFE6] flex items-center justify-center backdrop-blur-xs transition-all shadow-md cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    {/* Nút Next */}
                    <button
                      onClick={() => setActivePhotoIdx((prev) => (prev + 1) % albumPhotos.length)}
                      aria-label="Ảnh sau"
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#4E382C]/80 hover:bg-[#4E382C] text-[#F6EFE6] flex items-center justify-center backdrop-blur-xs transition-all shadow-md cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Bộ đếm ảnh 1 / N */}
                    <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#4E382C]/85 text-[#F6EFE6] text-xs font-serif tracking-widest backdrop-blur-xs">
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
                          "relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                          activePhotoIdx === idx
                            ? "border-[#B68B59] scale-105 shadow-md"
                            : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={p.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>

                  {/* Gói Free giới hạn tối đa 5 ảnh, ẩn QR album */}
                  {!isFree && !hiddenSections.has("albumQr") && weddingSlug && (
                    <div className="mt-6 w-full flex justify-center">
                      <GuestAlbumQr
                        slug={weddingSlug}
                        accentColor="#4E382C"
                        textColor="#F6EFE6"
                        mutedColor="#B68B59"
                      />
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* Section 5: Lịch trình & Dress code */}
            {!hiddenSections.has("dresscode") && (
              <div style={{ order: orderOf("dresscode") }}>
                <section className="relative w-full rounded-2xl bg-[#EDE2D3]/60 border border-[#D5C4B0] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#7D695C] font-semibold mb-1">
                    Trang Phục Gợi Ý
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#4E382C] font-normal mb-4"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Dress Code &amp; Lịch Trình
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7D695C] italic mb-8 max-w-[480px]">
                    Sự hiện diện của quý vị trong trang phục tông màu gợi ý sẽ giúp không gian tiệc thêm phần trọn vẹn
                  </p>

                  {/* 4 vòng tròn màu Dress Code */}
                  <div className="flex items-center justify-center gap-4 sm:gap-6 mb-12">
                    {dressColors.map((hex, idx) => (
                      <div
                        key={idx}
                        className="w-11 h-11 sm:w-14 sm:h-14 rounded-full shadow-md border-2 border-[#FAF6F0] transition-transform hover:scale-110"
                        style={{ backgroundColor: hex }}
                        title={hex}
                        aria-label={`Màu trang phục ${idx + 1}`}
                      />
                    ))}
                  </div>

                  {/* Trục dọc Timeline Nhật Ký Ngày Vui */}
                  <div className="w-full max-w-[480px] flex flex-col items-center">
                    <span className="text-[11px] uppercase tracking-widest text-[#B68B59] font-semibold mb-6">
                      LỊCH TRÌNH HÔN LỄ
                    </span>

                    <div className="relative w-full pl-6 sm:pl-8 border-l-2 border-[#B68B59]/40 flex flex-col gap-6 text-left">
                      {timelineItems.map((item, idx) => (
                        <div key={idx} className="relative flex flex-col gap-1">
                          {/* Dấu chấm mốc tròn */}
                          <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-full bg-[#4E382C] border-2 border-[#FAF6F0] shadow-sm" />
                          <span className="text-xs sm:text-sm font-serif font-bold text-[#B68B59]">
                            {item.time}
                          </span>
                          <span className="text-xs sm:text-sm text-[#5A463A] leading-relaxed">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* Section 6: Hộp mừng cưới 3 trạng thái & VietQR */}
            {!hiddenSections.has("gift") && (
              <div style={{ order: orderOf("gift") }}>
                <section className="relative w-full rounded-2xl bg-[#FBF8F3] border border-[#DFCBB5] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center">
                  <span className="text-[11px] uppercase tracking-[0.25em] text-[#7D695C] font-semibold mb-1">
                    Gửi Lời Chúc Phúc
                  </span>
                  <h2
                    className="text-2xl sm:text-3xl text-[#4E382C] font-normal mb-2"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    Hộp Quà Mừng Cưới
                  </h2>
                  <p className="text-xs sm:text-sm text-[#7D695C] italic mb-8 max-w-[480px]">
                    Sự hiện diện và lời chúc phúc của quý khách là món quà quý giá nhất dành cho chúng tôi
                  </p>

                  {/* Preload ảnh gift-active chống giật/nháy */}
                  <img
                    src="/templates/ho-phach-mat-thu/gift-active.webp"
                    className="hidden"
                    aria-hidden="true"
                    alt=""
                  />

                  {/* Hộp bưu kiện 3 trạng thái tương tác */}
                  <div
                    className="relative w-56 sm:w-64 aspect-[360/274] my-2 cursor-pointer transition-transform hover:scale-105 active:scale-95 group"
                    onMouseEnter={() => !isGiftOpening && setActiveParcel("glow")}
                    onMouseLeave={() => !isGiftOpening && activeParcel !== "open" && setActiveParcel("normal")}
                    onClick={handleGiftClick}
                  >
                    {/* Ảnh trạng thái */}
                    <img
                      src={`/templates/ho-phach-mat-thu/gift-${(activeParcel === "open" || activeParcel === "active") ? "active" : (activeParcel === "glow" || activeParcel === "hover") ? "hover" : "normal"}.webp`}
                      alt="Bưu Kiện Quà Cưới"
                      className="w-full h-full object-contain drop-shadow-xl"
                    />

                    {/* Hiệu ứng ánh sáng hổ phách khi hover */}
                    <div className="absolute inset-0 rounded-2xl bg-radial from-[#D8B78E]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>

                  <button
                    disabled={isGiftOpening}
                    onClick={handleGiftClick}
                    className="mt-6 px-7 py-2.5 rounded-full bg-[#4E382C] hover:bg-[#36251C] text-[#F6EFE6] border border-[#B68B59] text-xs font-serif tracking-widest uppercase shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-80"
                  >
                    <span>Mở Hộp Mừng Cưới</span>
                  </button>
                </section>
              </div>
            )}

            {/* Section 7: Form xác nhận tham dự RSVP & Sổ lưu bút */}
            {!hiddenSections.has("rsvp") && (
              <div style={{ order: orderOf("rsvp") }}>
                <section className="relative w-full rounded-2xl bg-[#EDE2D3]/60 border border-[#D5C4B0] p-4 sm:p-8 shadow-sm flex flex-col items-center">
                  <TemplateRsvpSection
                    data={data}
                    mode={mode}
                    tone="minbrown"
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
          <footer className="w-full flex flex-col items-center text-center pt-8 pb-12 border-t border-[#B68B59]/30">
            <div className="w-full max-w-[240px] sm:max-w-[300px] mb-4">
              <img
                src="/templates/ho-phach-mat-thu/divider-vintage.webp"
                alt="Divider"
                className="w-full object-contain opacity-75"
              />
            </div>
            <h4
              className="text-xl sm:text-2xl text-[#4E382C] font-normal mb-2"
              style={{ fontFamily: TITLE_FONT }}
            >
              Chân Thành Cảm Ơn
            </h4>
            <p className="text-xs sm:text-sm text-[#7D695C] italic max-w-[420px] leading-relaxed">
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
        onClose={handleCloseModal}
        gift={data.gift}
        plan={data.plan ?? "free"}
        coupleName={coupleDisplayName}
        guestName={guestName ?? null}
        tone="minbrown"
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

export default HoPhachMatThuTemplate;
