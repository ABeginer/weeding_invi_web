"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Heart,
  Mail,
  MapPin,
} from "lucide-react";
import { m, useReducedMotion } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingEvent } from "@/lib/wedding-types";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   Basic 3 (Ánh Nắng Hoàng Hôn / Lễ Vu Quy)
   Bảng màu chủ đạo: Deep Wine, Warm Sand, Blush Peach, Rose Gold
   ============================================================ */

const WINE_DEEP = "#5C2626";
const WINE_PRIMARY = "#7A3535";
const WINE_HOVER = "#612828";
const ROSE_GOLD = "#C6A45E";
const ROSE_BORDER = "rgba(215, 179, 165, 0.5)";
const ROSE_COPPER = "#8A4444";
const TEXT_MUTED = "#7D5E57";
const TEXT_DARK = "#322424";

const BG_PEACH = "#FCF5F0";
const CARD_BG = "#FFFBF8";

const SERIF = "var(--font-cormorant), var(--font-playfair), Georgia, serif";
const BODY = "var(--font-lora), Georgia, serif";
const EASE = [0.16, 1, 0.3, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "17:30", label: "Đón tiếp khách quý & Chụp ảnh lưu niệm" },
  { time: "18:30", label: "Nghi lễ hôn lễ & Trao lời hẹn ước" },
  { time: "19:00", label: "Khai tiệc dạ yến hoàng hôn" },
  { time: "20:00", label: "Âm nhạc giao lưu & Tung hoa cưới" },
  { time: "21:00", label: "Lời cảm tạ & Tiễn khách" },
];

const DEFAULT_DRESS = [
  { name: "Đỏ rượu", color: "#7A3535" },
  { name: "Hồng cát", color: "#D7B3A5" },
  { name: "Trắng ngà", color: "#FFFBF8" },
];

function getDressColors(data: TemplateData) {
  const source = data.dressCode?.filter((c) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c));
  if (source && source.length > 0) {
    return source.slice(0, 3).map((color, idx) => ({
      name: DEFAULT_DRESS[idx]?.name || `Màu ${idx + 1}`,
      color,
    }));
  }
  return DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time.trim() || item.label.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

function eventStart(event: WeddingEvent | undefined, fallback: string): string {
  return event?.startsAt ?? fallback;
}

function getCoupleMonogram(groomName?: string, brideName?: string): string {
  const getInitial = (name?: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    const lastName = parts[parts.length - 1];
    return lastName ? lastName.charAt(0).toUpperCase() : "";
  };
  const g = getInitial(groomName) || "K";
  const b = getInitial(brideName) || "N";
  return `${g} & ${b}`;
}

/**
 * Âm thanh chuông pha lê "ting" nhẹ nhàng khi mở thiệp (Web Audio API)
 */
function playOpenChime() {
  playOpenCardSound();
}

/* ------------------------------------------------------------
   Tiêu đề mục phong cách hoàng hôn & cành nguyệt quế
   ------------------------------------------------------------ */
function SunsetSectionTitle({
  sub,
  title,
}: {
  sub?: string;
  title: string;
}) {
  return (
    <div className="relative mx-auto my-3 px-4 text-center">
      {sub && (
        <p
          className="text-[10px] font-semibold tracking-[0.28em] uppercase sm:text-[11px]"
          style={{ color: ROSE_COPPER, fontFamily: SERIF }}
        >
          {sub}
        </p>
      )}
      <h2
        className="mt-1 text-xl font-semibold tracking-wide sm:text-2xl"
        style={{ color: WINE_DEEP, fontFamily: SERIF }}
      >
        {title}
      </h2>
      <div className="mt-2.5 flex items-center justify-center gap-2">
        <span className="h-px w-10 sm:w-14" style={{ backgroundColor: ROSE_BORDER }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img loading="lazy" decoding="async"
          src="/templates/basic-3/divider-floral-wine.webp"
          alt=""
          aria-hidden="true"
          className="h-3 w-auto max-w-[120px] opacity-85"
        />
        <span className="h-px w-10 sm:w-14" style={{ backgroundColor: ROSE_BORDER }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   SectionReveal: Fade-in up mượt mà kèm hiệu ứng chuyển động
   ------------------------------------------------------------ */
function SectionReveal({
  children,
  showLaurel = false,
}: {
  children: React.ReactNode;
  showLaurel?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <m.div
      className="relative"
      initial={reduce ? false : { opacity: 0, y: 22 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.8, ease: EASE }}
    >
      {showLaurel && (
        <div className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 opacity-35">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async"
            src="/templates/basic-3/laurel-pair.webp"
            alt=""
            aria-hidden="true"
            className="h-8 w-auto"
          />
        </div>
      )}
      {children}
    </m.div>
  );
}

/* ------------------------------------------------------------
   Hiệu ứng hạt bụi sao hoàng hôn lung linh (Floating Sunset Sparks)
   ------------------------------------------------------------ */
function FloatingSunsetSparks() {
  const reduce = useReducedMotion();

  const sparks = React.useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        id: i,
        left: 4 + ((i * 37) % 92),
        size: 5 + ((i * 5) % 8),
        delay: (i % 6) * 1.1,
        duration: 8 + (i % 6),
        sway: (i % 2 === 0 ? 1 : -1) * (12 + (i % 16)),
      })),
    [],
  );

  if (reduce) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {sparks.map((s) => (
        <m.span
          key={s.id}
          className="absolute block rounded-full opacity-0"
          style={{
            left: `${s.left}%`,
            top: "-4%",
            width: s.size,
            height: s.size,
            background:
              "radial-gradient(circle, #FFF3D6 0%, #E5C787 60%, rgba(229,199,135,0) 100%)",
            boxShadow: "0 0 10px rgba(229, 199, 135, 0.7)",
            filter: "blur(0.5px)",
          }}
          animate={{
            opacity: [0, 0.8, 0.8, 0],
            y: ["0vh", "110vh"],
            x: [0, s.sway, -s.sway, 0],
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

/* ------------------------------------------------------------
   Trang bìa (Cover): Cổng vòm hoa dại, dấu triện monogram & nút mở thiệp
   ------------------------------------------------------------ */
function Basic3Cover({
  data,
  guestName,
  closing,
  contained,
  onOpen,
  onDoorsClosed,
}: {
  data: TemplateData;
  guestName: string;
  closing: boolean;
  contained: boolean;
  onOpen: () => void;
  onDoorsClosed: () => void;
  weddingDateIso: string;
}) {
  const reduce = useReducedMotion();
  const monogram = getCoupleMonogram(data.couple.groomName, data.couple.brideName);

  return (
    <m.div
      className={cn(
        "z-50 flex items-center justify-center overflow-hidden px-3 py-4 sm:px-4 sm:py-8",
        contained ? "absolute inset-0" : "fixed inset-0",
      )}
      style={{
        backgroundColor: BG_PEACH,
      }}
      animate={closing ? { opacity: 0, scale: 1.04 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.85, delay: closing ? 0.35 : 0, ease: EASE }}
      onAnimationComplete={() => {
        if (closing) onDoorsClosed();
      }}
    >
      {/* Nền hoàng hôn ấm áp có hoa văn dập nổi (ảnh dọc cho mobile/contained, ảnh ngang cho desktop) */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 bg-cover bg-center transition-transform duration-1000",
          contained
            ? "bg-[image:url('/templates/basic-3/background-mobile.webp')]"
            : "bg-[image:url('/templates/basic-3/background-mobile.webp')] sm:bg-[image:url('/templates/basic-3/background.webp')]",
        )}
        style={{
          filter: "brightness(0.98) contrast(1.02)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FCF5F0]/40 via-transparent to-[#FCF5F0]/70"
      />

      {/* Hiệu ứng bụi sao lơ lửng trên bìa */}
      <FloatingSunsetSparks />

      {/* THẺ CỔNG VÒM TRUNG TÂM (Arch Card Gate with Botanical Wildflowers) */}
      <m.div
        className="relative z-10 flex w-full max-w-[340px] flex-col items-center justify-between overflow-hidden rounded-t-[140px] rounded-b-[24px] px-6 pt-10 pb-6 text-center shadow-2xl sm:max-w-[380px] sm:px-7 sm:pt-12 sm:pb-8"
        style={{
          backgroundColor: "#FFFDFB",
          backgroundImage: "linear-gradient(180deg, #FFFFFF 0%, #FFF9F6 60%, #FDF3EE 100%)",
          border: "1.5px solid rgba(215, 179, 165, 0.55)",
          boxShadow:
            "0 20px 50px rgba(122, 53, 53, 0.16), 0 0 25px rgba(215, 179, 165, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.9)",
        }}
        initial={reduce ? false : { opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
      >
        {/* Khung cổng vòm hoa dại ôm khít mép thẻ */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[length:100%_100%] bg-center opacity-95"
          style={{
            backgroundImage: "url('/templates/basic-3/cover-gate.webp')",
          }}
        />

        {/* Khối tiêu đề bìa */}
        <div className="relative mt-2">
          <p
            className="text-[10px] font-semibold tracking-[0.14em] uppercase sm:text-xs"
            style={{ color: ROSE_COPPER, fontFamily: SERIF }}
          >
            Thiệp mời tham dự lễ cưới
          </p>
        </div>

        {/* Tên cặp đôi: 3 dòng (Groom / & / Bride) */}
        <div className="relative mt-2 space-y-0.5 sm:mt-3">
          <h1
            className="text-xl font-semibold tracking-wide sm:text-2xl lg:text-3xl"
            style={{
              color: WINE_DEEP,
              fontFamily: SERIF,
              textShadow: "0 1px 2px rgba(255,255,255,0.8)",
            }}
          >
            {data.couple.groomName}
          </h1>

          <p
            className="text-sm italic sm:text-base"
            style={{
              color: ROSE_COPPER,
              fontFamily: SERIF,
            }}
          >
            &amp;
          </p>

          <h1
            className="text-xl font-semibold tracking-wide sm:text-2xl lg:text-3xl"
            style={{
              color: WINE_DEEP,
              fontFamily: SERIF,
              textShadow: "0 1px 2px rgba(255,255,255,0.8)",
            }}
          >
            {data.couple.brideName}
          </h1>
        </div>

        {/* Dấu triện Monogram tròn hoa văn nguyệt quế */}
        <div className="relative my-3 flex h-14 w-14 items-center justify-center sm:my-4 sm:h-16 sm:w-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async"
            src="/templates/basic-3/monogram-wine.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-contain drop-shadow-sm"
          />
          <span
            className="relative text-xs font-semibold tracking-wider uppercase sm:text-sm"
            style={{
              color: WINE_DEEP,
              fontFamily: SERIF,
            }}
          >
            {monogram}
          </span>
        </div>

        {/* Nhãn xưng hô & Tên khách mời */}
        <div className="relative space-y-1">
          <p
            className="text-[10px] font-medium tracking-[0.2em] uppercase sm:text-[11px]"
            style={{ color: TEXT_MUTED, fontFamily: BODY }}
          >
            TRÂN TRỌNG KÍNH MỜI
          </p>
          <p
            className="text-xl font-normal italic sm:text-2xl"
            style={{
              color: WINE_DEEP,
              fontFamily: SERIF,
            }}
          >
            {guestName?.trim() || "Quý Khách Quý Mến"}
          </p>
        </div>

        {/* Nút CHẠM ĐỂ MỞ THIỆP */}
        <div className="relative mt-4 pt-1 sm:mt-5 sm:pt-2">
          <m.button
            type="button"
            onClick={() => {
              playOpenChime();
              onOpen();
            }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full px-7 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] shadow-lg transition-transform active:scale-95 sm:px-8 sm:py-3 sm:text-xs"
            style={{
              backgroundColor: WINE_PRIMARY,
              color: "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.4)",
              boxShadow: "0 6px 20px rgba(122, 53, 53, 0.4)",
            }}
            whileHover={
              reduce
                ? undefined
                : {
                  scale: 1.04,
                  backgroundColor: WINE_HOVER,
                  boxShadow: "0 8px 25px rgba(97, 40, 40, 0.55)",
                }
            }
            whileTap={reduce ? undefined : { scale: 0.96 }}
          >
            <span>Chạm để mở thiệp</span>
          </m.button>
        </div>
      </m.div>
    </m.div>
  );
}

/* ------------------------------------------------------------
   Đồng hồ đếm ngược ngày cưới (Countdown Block)
   ------------------------------------------------------------ */
function CountdownBlock({ targetDateIso }: { targetDateIso: string }) {
  const [mounted, setMounted] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  React.useEffect(() => {
    setMounted(true);
    const target = new Date(targetDateIso).getTime();

    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDateIso]);

  if (!mounted) {
    return (
      <div className="grid grid-cols-4 gap-2 text-center sm:gap-3">
        {["Ngày", "Giờ", "Phút", "Giây"].map((label) => (
          <div
            key={label}
            className="rounded-2xl p-3"
            style={{ backgroundColor: CARD_BG, border: `1px solid ${ROSE_BORDER}` }}
          >
            <span className="font-mono text-xl font-bold sm:text-2xl" style={{ color: WINE_DEEP }}>
              --
            </span>
            <span className="mt-1 block text-[10px] uppercase text-[#7D5E57]">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  const units = [
    { label: "Ngày", val: timeLeft.days },
    { label: "Giờ", val: timeLeft.hours },
    { label: "Phút", val: timeLeft.minutes },
    { label: "Giây", val: timeLeft.seconds },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 text-center sm:gap-3">
      {units.map((u) => (
        <div
          key={u.label}
          className="rounded-2xl p-3 shadow-sm transition-transform hover:scale-105"
          style={{
            backgroundColor: CARD_BG,
            border: `1px solid ${ROSE_BORDER}`,
            boxShadow: "0 4px 15px rgba(215, 179, 165, 0.15)",
          }}
        >
          <span
            className="font-mono text-xl font-bold sm:text-2xl"
            style={{ color: WINE_DEEP }}
          >
            {String(u.val).padStart(2, "0")}
          </span>
          <span
            className="mt-1 block text-[10px] font-medium uppercase tracking-wider"
            style={{ color: TEXT_MUTED }}
          >
            {u.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------
   Lịch tháng đám cưới với trái tim vàng phát sáng (Calendar Block)
   ------------------------------------------------------------ */
function CalendarBlock({ dateIso, eventDays }: { dateIso: string; eventDays?: Set<number> }) {
  const weddingDate = React.useMemo(() => new Date(dateIso), [dateIso]);
  const year = weddingDate.getFullYear();
  const month = weddingDate.getMonth();
  const day = weddingDate.getDate();

  const { firstDayOfWeek, totalDays } = React.useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDayOfWeek: firstDay === 0 ? 6 : firstDay - 1, totalDays: daysInMonth };
  }, [year, month]);

  const daysArray = React.useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      arr.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      arr.push(i);
    }
    return arr;
  }, [firstDayOfWeek, totalDays]);

  return (
    <div
      className="overflow-hidden rounded-3xl p-5 shadow-sm sm:p-6"
      style={{
        backgroundColor: CARD_BG,
        border: `1px solid ${ROSE_BORDER}`,
        boxShadow: "0 6px 20px rgba(215, 179, 165, 0.15)",
      }}
    >
      <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: ROSE_BORDER }}>
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-[#7A3535]" />
          <span
            className="text-xs font-semibold tracking-wider uppercase sm:text-sm"
            style={{ color: WINE_DEEP, fontFamily: SERIF }}
          >
            Tháng {month + 1} / {year}
          </span>
        </div>
        <span className="text-[11px] font-medium" style={{ color: ROSE_COPPER }}>
          Thời Khắc Hạnh Phúc
        </span>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center font-mono text-[11px] font-semibold text-[#7D5E57]">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d, i) => (
          <div key={d} className={cn("py-1", i >= 5 && "text-[#8A4444]")}>
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 text-center font-mono text-xs">
        {daysArray.map((d, i) => {
          if (d === null) return <div key={`empty-${i}`} className="py-2" />;
          const isWeddingDay = eventDays ? eventDays.has(d) : d === day;
          return (
            <div key={`day-${d}`} className="relative flex items-center justify-center py-2">
              {isWeddingDay ? (
                <div className="relative flex h-8 w-8 items-center justify-center">
                  <span
                    className="absolute inset-0 animate-ping rounded-full opacity-35"
                    style={{ backgroundColor: WINE_PRIMARY }}
                  />
                  <div
                    className="relative flex h-7 w-7 items-center justify-center rounded-full text-white shadow-md font-bold"
                    style={{
                      backgroundColor: WINE_PRIMARY,
                    }}
                  >
                    {d}
                  </div>
                </div>
              ) : (
                <span className="text-[#322424] transition-colors hover:text-[#7A3535]">
                  {d}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   TEMPLATE CHÍNH: BASIC 3 (Ánh Nắng Hoàng Hôn / Lễ Vu Quy)
   ============================================================ */
export default function Basic3Template({
  data,
  mode = "preview",
  contained = false,
  viewport = "phone",
  isOpened: isOpenedProp = false,
  onOpenedChange,
  inviteSlug,
  weddingSlug,
  invitationMode = "personal",
  guestName,
  initialStatus,
  initialPlusOnes,
  initialDiet,
  initialSongRequest,
  initialRideNeeded,
  externalMusicControl,
}: WeddingTemplateProps) {
  // Trạng thái mở bìa thiệp — đồng bộ chuẩn hai chiều (card_exp.md §22.26)
  const [opened, setOpened] = React.useState(isOpenedProp);
  const [closing, setClosing] = React.useState(false);
  const [coverGone, setCoverGone] = React.useState(isOpenedProp);

  const parentOpenedRef = React.useRef(isOpenedProp);
  React.useEffect(() => {
    const wasOpened = parentOpenedRef.current;
    parentOpenedRef.current = isOpenedProp;
    if (isOpenedProp) {
      setOpened(true);
      if (!closing) setCoverGone(true);
      return;
    }
    if (!wasOpened) return;
    setClosing(false);
    setOpened(false);
    setCoverGone(false);
  }, [isOpenedProp, closing]);

  // Lightbox xem ảnh cưới
  const [activePhotoIndex, setActivePhotoIndex] = React.useState<number | null>(null);

  // Modal hộp quà mừng cưới
  const [giftModalOpen, setGiftModalOpen] = React.useState(false);
  const [giftBoxOpened, setGiftBoxOpened] = React.useState(false);

  const handleOpenCover = () => {
    setClosing(true);
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }
    if (!contained && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  const handleGiftBoxClick = () => {
    setGiftBoxOpened(true);
    setTimeout(() => {
      setGiftModalOpen(true);
    }, 280);
  };

  const hidden = React.useMemo(() => new Set(data.hiddenSections ?? []), [data.hiddenSections]);
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const targetDateIso = targetEvent?.startsAt ?? data.date;

  const targetDateObj = React.useMemo(() => new Date(targetDateIso), [targetDateIso]);
  const calYear = targetDateObj.getFullYear();
  const calMonth = targetDateObj.getMonth();
  const eventDays = React.useMemo(() => {
    const days = new Set<number>();
    visibleEvents.forEach((evt) => {
      if (evt.startsAt) {
        const d = new Date(evt.startsAt);
        if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
          days.add(d.getDate());
        }
      }
    });
    if (days.size === 0 && !isNaN(targetDateObj.getTime())) {
      days.add(targetDateObj.getDate());
    }
    return days;
  }, [visibleEvents, calYear, calMonth, targetDateObj]);

  const timeline = getTimeline(data);
  const dressColors = getDressColors(data);
  const galleryPhotos = data.photos?.gallery ?? [];

  // Tách tên phụ huynh theo dấu & để xuống dòng chuẩn (card_exp.md §20)
  const groomParentsList = React.useMemo(() => {
    const raw = data.couple.groomParents || "";
    return raw.split("&").map((s) => s.trim()).filter(Boolean);
  }, [data.couple.groomParents]);

  const brideParentsList = React.useMemo(() => {
    const raw = data.couple.brideParents || "";
    return raw.split("&").map((s) => s.trim()).filter(Boolean);
  }, [data.couple.brideParents]);

  return (
    <div
      data-template-id="basic-3"
      className={cn(
        "relative w-full min-w-0 text-[#322424] selection:bg-[#F4DFD5] selection:text-[#5C2626] antialiased",
        contained ? "min-h-full" : "min-h-screen-dvh",
        !coverGone &&
        (contained
          ? "h-full overflow-hidden"
          : "h-screen-dvh max-h-full overflow-hidden"),
        !contained && "overflow-x-hidden",
        viewport === "desktop" && !contained && "mx-auto max-w-[820px]",
      )}
      style={{
        backgroundColor: BG_PEACH,
        backgroundImage: "linear-gradient(180deg, #F9ECE6 0%, #FDF7F4 50%, #FAF1EC 100%)",
        fontFamily: BODY,
      }}
    >
      {/* 1. TRANG BÌA (Cover) */}
      {!coverGone && (
        <Basic3Cover
          data={data}
          guestName={guestName || ""}
          closing={closing}
          contained={contained}
          onOpen={handleOpenCover}
          onDoorsClosed={() => {
            setCoverGone(true);
            setClosing(false);
            setOpened(true);
            onOpenedChange?.(true);
          }}
          weddingDateIso={targetDateIso}
        />
      )}

      {/* Hiệu ứng bụi sao lơ lửng khi mở thiệp */}
      {opened && <FloatingSunsetSparks />}

      {/* Nút nhạc nền nổi với đĩa than xoay */}
      {!externalMusicControl && !hidden.has("music") && (
        <LiveMusicFloatingButton
          src={data.music?.src || "/media/wedding.mp3"}
          title={data.music?.title || "Khúc Nhạc Hoàng Hôn"}
          visible={opened}
          tone="sunset"
        />
      )}

      {/* NỘI DUNG CHÍNH (Ruột thiệp) */}
      <div className="relative mx-auto max-w-[480px] px-4 py-10 sm:px-6 sm:py-16">
        {/* SECTION: HERO (Save The Date & Vòm Cổng Nghệ Thuật) */}
        <section className="relative pt-4 text-center">
          <SectionReveal>
            <div className="mx-auto max-w-xs">
              <p
                className="text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ color: ROSE_COPPER, fontFamily: SERIF }}
              >
                Thiệp mời tham dự lễ cưới
              </p>
              <h1
                className="mt-3 text-3xl font-semibold tracking-wide sm:text-4xl"
                style={{ color: WINE_DEEP, fontFamily: SERIF }}
              >
                {data.couple.groomName}
              </h1>
              <p
                className="my-1 text-xl italic"
                style={{ color: ROSE_COPPER, fontFamily: SERIF }}
              >
                &amp;
              </p>
              <h1
                className="text-3xl font-semibold tracking-wide sm:text-4xl"
                style={{ color: WINE_DEEP, fontFamily: SERIF }}
              >
                {data.couple.brideName}
              </h1>
            </div>

            {/* Dải phân cách hoa văn thanh lịch */}
            <div className="relative mx-auto mt-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img loading="lazy" decoding="async"
                src="/templates/basic-3/divider-branch-gold.webp"
                alt=""
                aria-hidden="true"
                className="h-6 w-auto max-w-[220px] object-contain opacity-85"
              />
            </div>

            {/* Khung ảnh cưới vòm cong nghệ thuật (Arch Photo Frame) */}
            <div className="relative mx-auto mt-6 w-full max-w-[320px] sm:max-w-[340px]">
              {/* Bó hoa dại trang trí góc trái */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img loading="lazy" decoding="async"
                src="/templates/basic-3/sprig-flower.webp"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -left-4 -top-5 z-10 w-16 drop-shadow-md sm:w-20"
              />

              <div
                className="relative aspect-[3/4] overflow-hidden rounded-t-[140px] rounded-b-2xl shadow-xl"
                style={{
                  border: "2px solid rgba(215, 179, 165, 0.75)",
                  boxShadow: "0 15px 40px rgba(122, 53, 53, 0.14), 0 0 20px rgba(215, 179, 165, 0.25)",
                }}
              >
                {data.photos.heroUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img loading="lazy" decoding="async"
                    src={data.photos.heroUrl}
                    alt="Ảnh cưới"
                    className="h-full w-full object-cover object-center"
                  />
                ) : (
                  <TemplatePhotoPlaceholder label="Ảnh cưới Hoàng Hôn" />
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#5C2626]/20 via-transparent to-transparent" />
              </div>
            </div>

            {/* Lời tựa (Quote) */}
            {data.quote && (
              <div className="mx-auto mt-7 max-w-sm px-4">
                <p
                  className="text-sm italic leading-relaxed text-[#7A3535]"
                  style={{ fontFamily: SERIF }}
                >
                  &ldquo;{data.quote}&rdquo;
                </p>
              </div>
            )}
          </SectionReveal>
        </section>

        {/* SECTION: LỊCH CƯỚI & ĐẾM NGƯỢC (key: "calendar") */}
        {!hidden.has("calendar") && (
          <section className="mt-16">
            <SectionReveal>
              <SunsetSectionTitle title="Lịch cưới & Đếm ngược" />

              <div className="mt-6">
                <CountdownBlock targetDateIso={targetDateIso} />
              </div>

              <div className="mt-8">
                <CalendarBlock dateIso={targetDateIso} eventDays={eventDays} />
              </div>
            </SectionReveal>
          </section>
        )}

        {/* SECTION: THÔNG TIN GIA ĐÌNH HAI HỌ (key: "family") */}
        {!hidden.has("family") && (
          <section className="mt-16">
            <SectionReveal showLaurel>
              <SunsetSectionTitle sub="Hai Bên Gia Đình" title="Đại Diện Gia Tộc" />

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-stretch">
                {/* Nhà Trai */}
                <div
                  className="flex h-full flex-col justify-between rounded-3xl p-6 text-center shadow-md transition-shadow hover:shadow-lg"
                  style={{
                    backgroundColor: CARD_BG,
                    border: `1px solid ${ROSE_BORDER}`,
                  }}
                >
                  <div>
                    <span
                      className="inline-block rounded-full px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: "rgba(244, 223, 213, 0.5)",
                        color: WINE_DEEP,
                        border: `1px solid ${ROSE_BORDER}`,
                      }}
                    >
                      Nhà Trai · {data.couple.groomTitle || "Chú rể"}
                    </span>
                    <h3
                      className="mt-3 text-lg font-semibold"
                      style={{ color: WINE_DEEP, fontFamily: SERIF }}
                    >
                      {data.couple.groomName}
                    </h3>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#E7CFC3] text-xs text-[#6B504B]">
                    <p className="font-semibold text-[#5C2626]">Thân sinh:</p>
                    {groomParentsList.length > 0 ? (
                      groomParentsList.map((p, idx) => (
                        <p key={idx} className={idx === 0 ? "mt-1" : ""}>
                          {p}
                        </p>
                      ))
                    ) : (
                      <>
                        <p className="mt-1">Ông: {data.couple.groomFullName || "Nguyễn Văn A"}</p>
                        <p>Bà: Trần Thị B</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Nhà Gái */}
                <div
                  className="flex h-full flex-col justify-between rounded-3xl p-6 text-center shadow-md transition-shadow hover:shadow-lg"
                  style={{
                    backgroundColor: CARD_BG,
                    border: `1px solid ${ROSE_BORDER}`,
                  }}
                >
                  <div>
                    <span
                      className="inline-block rounded-full px-3.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: "rgba(244, 223, 213, 0.5)",
                        color: WINE_DEEP,
                        border: `1px solid ${ROSE_BORDER}`,
                      }}
                    >
                      Nhà Gái · {data.couple.brideTitle || "Cô dâu"}
                    </span>
                    <h3
                      className="mt-3 text-lg font-semibold"
                      style={{ color: WINE_DEEP, fontFamily: SERIF }}
                    >
                      {data.couple.brideName}
                    </h3>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#E7CFC3] text-xs text-[#6B504B]">
                    <p className="font-semibold text-[#5C2626]">Thân sinh:</p>
                    {brideParentsList.length > 0 ? (
                      brideParentsList.map((p, idx) => (
                        <p key={idx} className={idx === 0 ? "mt-1" : ""}>
                          {p}
                        </p>
                      ))
                    ) : (
                      <>
                        <p className="mt-1">Ông: {data.couple.brideFullName || "Lê Văn C"}</p>
                        <p>Bà: Phạm Thị D</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Chân dung cô dâu chú rể (nếu có) */}
              {(data.photos.groomUrl || data.photos.brideUrl) && (
                <div className="mt-6 grid grid-cols-2 gap-4">
                  {[
                    {
                      label: "CHÚ RỂ",
                      name: data.couple.groomFullName || data.couple.groomName,
                      url: data.photos.groomUrl,
                    },
                    {
                      label: "CÔ DÂU",
                      name: data.couple.brideFullName || data.couple.brideName,
                      url: data.photos.brideUrl,
                    },
                  ].map((p, idx) => (
                    <div
                      key={idx}
                      className="overflow-hidden rounded-2xl border bg-white p-2 text-center shadow-sm"
                      style={{ borderColor: ROSE_BORDER }}
                    >
                      <div className="aspect-[3/4] overflow-hidden rounded-xl bg-[#F5E0D5]/30">
                        {p.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img loading="lazy" decoding="async"
                            src={p.url}
                            alt={p.name}
                            className="h-full w-full object-cover object-[center_20%]"
                          />
                        ) : (
                          <TemplatePhotoPlaceholder label={p.label} />
                        )}
                      </div>
                      <p className="mt-2 text-[10px] font-semibold tracking-wider text-[#8A4444] uppercase">
                        {p.label}
                      </p>
                      <p
                        className="mt-0.5 text-sm font-semibold truncate"
                        style={{ color: WINE_DEEP, fontFamily: SERIF }}
                      >
                        {p.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </SectionReveal>
          </section>
        )}

        {/* SECTION: LỊCH TRÌNH & DRESS CODE (key: "dresscode") */}
        {!hidden.has("dresscode") && (
          <section className="mt-16">
            <SectionReveal>
              <SunsetSectionTitle sub="Chương Trình & Trang Phục" title="Lịch Trình Hôn Lễ" />

              <div
                className="mt-6 rounded-3xl p-6 shadow-md"
                style={{
                  backgroundColor: CARD_BG,
                  border: `1px solid ${ROSE_BORDER}`,
                }}
              >
                {/* Timeline kết nối hoa văn hoàng hôn */}
                <div className="relative space-y-6 before:absolute before:bottom-2 before:left-[17px] before:top-2 before:w-0.5 before:bg-[#D7B3A5]">
                  {timeline.map((item, idx) => (
                    <div key={idx} className="relative flex items-center gap-4 pl-1">
                      <div
                        className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full shadow-sm"
                        style={{
                          backgroundColor: "#FFF9F6",
                          border: "1.5px solid #C6A45E",
                        }}
                      >
                        <Clock className="h-4 w-4 text-[#7A3535]" />
                      </div>
                      <div className="flex-1">
                        <span
                          className="font-mono text-xs font-bold"
                          style={{ color: WINE_DEEP }}
                        >
                          {item.time}
                        </span>
                        <p className="text-xs text-[#5C2626] sm:text-sm">{item.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dress Code Palette */}
                {dressColors.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-[#E7CFC3] text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A4444]">
                      Gợi Ý Trang Phục (Dress Code)
                    </p>
                    <div className="mt-3 flex items-center justify-center gap-3">
                      {dressColors.map((dc, i) => (
                        <div
                          key={i}
                          className="h-8 w-8 rounded-full border border-black/10 shadow-sm transition-transform hover:scale-110"
                          style={{ backgroundColor: dc.color }}
                          title={dc.name}
                          aria-label={dc.name || `Màu trang phục ${i + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionReveal>
          </section>
        )}

        {/* SECTION: SỰ KIỆN & CHỈ ĐƯỜNG (key: "map") */}
        {!hidden.has("map") && visibleEvents.length > 0 && (
          <section className="mt-16">
            <SectionReveal>
              <SunsetSectionTitle sub="Địa Điểm & Thời Gian" title="Sự Kiện & Chỉ Đường" />

              <div className={`mt-6 ${visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto" : "space-y-4 max-w-xl mx-auto"}`}>
                {visibleEvents.map((evt, idx) => {
                  const parts = formatWeddingDateParts(evt.startsAt);
                  const directionsUrl = getEventDirectionsUrl(evt);
                  return (
                    <div
                      key={evt.id || idx}
                      className="rounded-3xl p-6 text-center shadow-md transition-shadow hover:shadow-lg flex flex-col justify-between"
                      style={{
                        backgroundColor: CARD_BG,
                        border: `1px solid ${ROSE_BORDER}`,
                      }}
                    >
                      <div>
                        <span
                          className="inline-block rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
                          style={{
                            backgroundColor: "rgba(244, 223, 213, 0.4)",
                            color: WINE_DEEP,
                            border: `1px solid ${ROSE_BORDER}`,
                          }}
                        >
                          {evt.title || "Lễ Thành Hôn"}
                        </span>

                        <p
                          className="mt-3 text-lg font-semibold"
                          style={{ color: WINE_DEEP, fontFamily: SERIF }}
                        >
                          {evt.venueName || "Nhà hàng tiệc cưới"}
                        </p>

                        <p className="mt-1 text-xs text-[#6B504B]">
                          {evt.venueAddress || "Địa chỉ hôn lễ"}
                        </p>

                        <div className="mt-3 inline-flex items-center gap-2 font-mono text-xs text-[#7D5E57]">
                          <CalendarIcon className="h-3.5 w-3.5 text-[#8A4444]" />
                          <span>
                            {parts.weekday} · {parts.dotDate} {parts.time ? `(${parts.time})` : ""}
                          </span>
                        </div>
                      </div>

                      {directionsUrl && (
                        <div className="mt-5">
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-transform hover:scale-105 active:scale-95"
                            style={{
                              backgroundColor: WINE_PRIMARY,
                            }}
                          >
                            <MapPin className="h-3.5 w-3.5" />
                            <span>Xem bản đồ chỉ đường</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SectionReveal>
          </section>
        )}

        {/* SECTION: ALBUM ẢNH CƯỚI (key: "album") */}
        {!hidden.has("album") && galleryPhotos.length > 0 && (
          <section className="mt-16">
            <SectionReveal>
              <SunsetSectionTitle sub="Khoảnh Khắc Yêu Thương" title="Album Ảnh Cưới" />

              <div className="mt-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {galleryPhotos.map((photo, i) => (
                    <button
                      key={photo.id || i}
                      type="button"
                      onClick={() => setActivePhotoIndex(i)}
                      className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-2xl shadow-sm transition-transform hover:scale-[1.02] focus-visible:outline-none"
                      style={{
                        border: `1px solid ${ROSE_BORDER}`,
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" decoding="async"
                        src={photo.url}
                        alt={`Ảnh cưới ${i + 1}`}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-[#5C2626]/0 transition-colors group-hover:bg-[#5C2626]/20" />
                    </button>
                  ))}
                </div>
              </div>
            </SectionReveal>
          </section>
        )}

        {/* Lightbox Modal (createPortal to document.body) */}
        {activePhotoIndex !== null && (
          <TemplateLightboxModal
            photos={galleryPhotos}
            activeIndex={activePhotoIndex}
            onClose={() => setActivePhotoIndex(null)}
            onChangeIndex={setActivePhotoIndex}
          />
        )}

        {/* SECTION: MÃ QR ALBUM KHÁCH CHỤP (key: "albumQr") */}
        {!hidden.has("albumQr") && (
          <section className="mt-16">
            <SectionReveal>
              <GuestAlbumQr
                slug={weddingSlug || data.weddingSlug || ""}
                accentColor={WINE_PRIMARY}
                textColor={WINE_DEEP}
                mutedColor={TEXT_MUTED}
              />
            </SectionReveal>
          </section>
        )}

        {/* SECTION: HỘP QUÀ MỪNG CƯỚI (key: "gift") */}
        {!hidden.has("gift") && (
          <section className="mt-16">
            <SectionReveal>
              <SunsetSectionTitle sub="Chúc Phúc Trăm Năm" title="Hộp Quà Mừng Cưới" />

              <div
                className="mt-6 overflow-hidden rounded-3xl p-6 text-center shadow-md sm:p-8"
                style={{
                  backgroundColor: CARD_BG,
                  border: `1px solid ${ROSE_BORDER}`,
                  backgroundImage: "radial-gradient(circle at 50% 30%, #FFF5EF 0%, #FFFBF8 85%)",
                }}
              >
                <p className="mx-auto max-w-sm text-xs leading-relaxed text-[#6B504B] sm:text-sm">
                  Sự hiện diện và lời chúc phúc của quý khách là món quà quý giá nhất dành cho chúng
                  mình trong ngày trọng đại.
                </p>

                {/* Hộp quà tương tác */}
                <div className="mt-6 flex flex-col items-center justify-center">
                  <button
                    type="button"
                    onClick={handleGiftBoxClick}
                    className="group relative flex flex-col items-center cursor-pointer p-2 transition-transform active:scale-95 focus-visible:outline-none"
                    aria-label="Mở hộp quà mừng cưới"
                  >
                    <div className="relative mx-auto h-32 w-32 sm:h-36 sm:w-36 select-none">
                      {/* Vầng hào quang phát sáng nhẹ */}
                      <div
                        aria-hidden="true"
                        className={cn(
                          "pointer-events-none absolute inset-0 -m-3 rounded-full transition-all duration-700 blur-xl",
                          giftBoxOpened
                            ? "bg-[#E5C787]/40 scale-125 opacity-100"
                            : "bg-[#E5C787]/0 scale-90 opacity-0 group-hover:bg-[#E5C787]/35 group-hover:scale-110 group-hover:opacity-100",
                        )}
                      />

                      {/* Hộp quà rượu vang nơ vàng */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" decoding="async"
                        src="/templates/basic-3/gift-box.webp"
                        alt="Hộp quà mừng cưới"
                        className={cn(
                          "absolute inset-0 h-full w-full object-contain transition-all duration-500 ease-out drop-shadow-[0_8px_20px_rgba(122,53,53,0.3)]",
                          giftBoxOpened ? "scale-105 rotate-3" : "scale-100 group-hover:scale-105",
                        )}
                      />
                    </div>

                    {/* Nhãn nút bấm sang trọng */}
                    <div
                      className="mt-3 flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition-all group-hover:scale-105"
                      style={{
                        backgroundColor: WINE_PRIMARY,
                        boxShadow: "0 4px 15px rgba(122, 53, 53, 0.35)",
                      }}
                    >
                      <span>{giftBoxOpened ? "Đang Mở Hộp Quà..." : "Gửi Mừng Chúc Phúc"}</span>
                    </div>
                  </button>
                </div>
              </div>
            </SectionReveal>
          </section>
        )}

        {/* Gift Modal Portal */}
        {giftModalOpen && (
          <GiftModal
            open={giftModalOpen}
            onClose={() => {
              setGiftModalOpen(false);
              setGiftBoxOpened(false);
            }}
            gift={data.gift}
            plan={data.plan}
            coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
            guestName={guestName}
            tone="sunset"
          />
        )}

        {/* SECTION: XÁC NHẬN THAM DỰ & LỜI CHÚC (key: "rsvp") */}
        {!hidden.has("rsvp") && (
          <section className="mt-16">
            <SectionReveal>
              <SunsetSectionTitle sub="RSVP & Wishes" title="Xác Nhận & Lời Chúc" />

              <div
                className="mt-6 overflow-hidden rounded-3xl shadow-md"
                style={{
                  backgroundColor: CARD_BG,
                  border: `1px solid ${ROSE_BORDER}`,
                }}
              >
                <div
                  style={
                    {
                      "--color-inv-primary": "#7A3535",
                      "--color-inv-primary-foreground": "#FFFFFF",
                      "--color-inv-background": "#FFFFFF",
                      "--color-inv-foreground": "#322424",
                      "--color-inv-muted": "#FAF1EC",
                      "--color-inv-muted-foreground": "#7D5E57",
                      "--color-inv-border": "rgba(215, 179, 165, 0.45)",
                      "--color-inv-card": "#FFFBF8",
                      "--color-inv-card-foreground": "#322424",
                    } as React.CSSProperties
                  }
                >
                  <TemplateRsvpSection
                    data={data}
                    mode={mode}
                    tone="sunset"
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
            </SectionReveal>
          </section>
        )}

        {/* FOOTER */}
        <footer className="mt-20 text-center">
          <div className="mx-auto flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img loading="lazy" decoding="async"
              src="/templates/basic-3/divider-branch-gold.webp"
              alt=""
              aria-hidden="true"
              className="h-6 w-auto opacity-75"
            />
          </div>
          <p
            className="mt-3 text-lg font-semibold tracking-wide text-[#5C2626]"
            style={{ fontFamily: SERIF }}
          >
            {data.couple.groomName} &amp; {data.couple.brideName}
          </p>
          <p className="mt-1 text-xs text-[#7D5E57]">
            Chân thành cảm ơn sự hiện diện và chúc phúc của quý khách.
          </p>
          <p className="mt-6 text-[10px] tracking-wider uppercase text-[#B89A8F]">
            Thiết kế bởi Inviwedd
          </p>
        </footer>
      </div>
    </div>
  );
}
