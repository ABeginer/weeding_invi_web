"use client";

import * as React from "react";
import "./fonts.css";
import { RotateCw, Clock } from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { playCoverSfx, playInteractionSfx } from "@/lib/sfx";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import {
  getVisibleEvents,
  getNearestUpcomingEvent,
  getEventDirectionsUrl,
} from "@/lib/events";
import type { TemplateData, WeddingStoryMilestone } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   SEN NGỌC TRĂM NĂM (sen-ngoc-tram-nam) — STANDARD EDITION
   - Bảng màu Truyền thống Việt Nam:
     + Xanh rêu sen ngọc (Primary): #3A4932 / #3E4D35
     + Kem phấn hồng nhạt (Paper):  #FDF2EF
     + Vàng kim vân mây & nhũ:      #C8A858 / #D4AF5A
     + Đỏ son chữ Song Hỷ:          #B81D18
     + Hồng sen phấn:               #E87EA1
   ============================================================ */

const OLIVE_PRIMARY = "#3A4932";
const PAPER_BLUSH = "#FDF2EF";
const GOLD_ACCENT = "#C8A858";
const ASSET_BASE = "/templates/sen-ngoc-tram-nam";
const ASSET_VER = "v=8";

const TAN_FONT = "var(--font-tan-nightingale), 'TAN Nightingale', var(--font-cormorant), Georgia, serif";
const BLACKER_FONT = "var(--font-blacker-sans), 'Blacker Sans', var(--font-be-vietnam), sans-serif";
const PICTURAMA_FONT = "var(--font-picturama), 'Picturama Founder', var(--font-carattere), cursive";

const DISPLAY_FONT = TAN_FONT;
const SCRIPT_FONT = PICTURAMA_FONT;
const SERIF_FONT = "var(--font-cormorant), var(--font-lora), Georgia, serif";
const SANS_FONT = "var(--font-be-vietnam), system-ui, sans-serif";
const TIMES_FONT = "'Times New Roman', Times, Georgia, serif";

const DEFAULT_DRESS_CODE = ["#3A4932", "#C8A858", "#E892A5"];

const DEFAULT_SECTION_ORDER = CANONICAL_SECTION_ORDER;

const RSVP_CUSTOM_THEME = {
  isDark: false,
  wrap: "bg-transparent text-[#3A4932]",
  eyebrow: "text-[#3A4932]",
  card: "bg-[#FDF2EF]/70 border border-[#C8A858]/35 text-[#3A4932]",
  heading: "text-[#3A4932]",
  subtext: "text-[#5B6854]",
  input:
    "bg-white border border-[#C8A858]/45 text-[#3A4932] placeholder:text-[#7E8C75] focus:border-[#3A4932]",
  primaryBtn: "border-[#3A4932] bg-[#3A4932] text-[#FDF2EF] hover:bg-[#2F3C28] font-semibold",
  outlineBtn:
    "border-[#3A4932]/70 bg-[#F5F7F2] text-[#3A4932] hover:bg-[#E7ECE2] hover:border-[#3A4932]",
  alert: "border-[#C8A858]/60 bg-[#FDF2EF] text-[#3A4932]",
  badge: "border-[#3A4932]/30 bg-[#F5F7F2] text-[#3A4932]",
  optionBg: "#FFFFFF",
  optionColor: "#3A4932",
};

const DEFAULT_TIMELINE: Array<{ id?: string; time: string; label: string }> = [
  { time: "10:00", label: "Đón khách & chụp ảnh lưu niệm cùng hai họ" },
  { time: "11:00", label: "Nghi lễ Thành Hôn & trao nhẫn giao bôi" },
  { time: "11:30", label: "Khai tiệc chung vui cùng gia đình & bạn bè" },
  { time: "13:00", label: "Giao lưu văn nghệ & gửi lời chúc trăm năm" },
];

function getDefaultStory(data: TemplateData): WeddingStoryMilestone[] {
  const custom = data.story?.filter(
    (s) => s.title.trim().length > 0 || s.content.trim().length > 0,
  );
  if (custom && custom.length > 0) return custom;
  return [
    {
      year: "Lần đầu gặp gỡ",
      title: "Duyên lành chớm nở",
      content: `Giữa muôn vàn ngã rẽ, ${data.couple.groomName} và ${data.couple.brideName} đã tình cờ gặp nhau trong một ngày nắng nhẹ — khởi đầu cho câu chuyện bình yên nhất đời mình.`,
    },
    {
      year: "Lời hẹn trăm năm",
      title: "Cùng nhau viết tiếp hành trình",
      content: `Qua bao mùa sen nở, chúng mình chọn nắm tay nhau bước vào chương mới, trân trọng từng khoảnh khắc có gia đình và người thân chứng giám.`,
    },
  ];
}

function splitParents(raw: string): string[] {
  return raw
    .split(/\r?\n|\s*&\s*|\s*-\s*/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitNameLines(fullName: string): string[] {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return parts;
  if (parts.length === 3) return parts;
  return [parts[0], parts.slice(1, -1).join(" "), parts[parts.length - 1]];
}

/* ============================================================
   HỆ CHUYỂN ĐỘNG ĐỘC BẢN "THỦY MẶC & LỤA SEN"
   - Sương tan · Mực thấm (Blur-to-Sharp + Soft Slide)
   - Dịu mắt, thanh tao, tôn trọng prefers-reduced-motion
   ============================================================ */
const SILK_EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];
// Kích hoạt khi phần tử đã trồi lên khỏi mép đáy màn hình 80px để khách nhìn thấy
// trọn vẹn hiệu ứng chữ từ mờ sang rõ & trượt êm ngay trong tầm mắt.
const VIEWPORT_ONCE = { once: true, amount: "some", margin: "0px 0px -80px 0px" } as const;

const LOTUS_PETAL_SEEDS = [
  { id: 1, x1: -32, x2: -74, y: -112, rot0: -18, rot1: -58, delay: 0.04, dur: 1.55, scale: 1.05, color: "#F4A7BE" },
  { id: 2, x1: 28, x2: 68, y: -124, rot0: 14, rot1: 54, delay: 0.1, dur: 1.65, scale: 0.96, color: "#F8C4D4" },
  { id: 3, x1: -50, x2: -96, y: -64, rot0: -26, rot1: -72, delay: 0.14, dur: 1.5, scale: 0.88, color: "#E87EA1" },
  { id: 4, x1: 48, x2: 94, y: -72, rot0: 22, rot1: 68, delay: 0.18, dur: 1.55, scale: 0.92, color: "#F4A7BE" },
  { id: 5, x1: -14, x2: 22, y: -145, rot0: -8, rot1: 32, delay: 0.08, dur: 1.75, scale: 0.82, color: "#F8C4D4" },
  { id: 6, x1: -38, x2: -62, y: 48, rot0: 12, rot1: 50, delay: 0.2, dur: 1.48, scale: 0.8, color: "#F4A7BE" },
  { id: 7, x1: 36, x2: 64, y: 44, rot0: -14, rot1: -48, delay: 0.24, dur: 1.52, scale: 0.84, color: "#E87EA1" },
] as const;

function SenReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.78,
  blur = true,
  distance = 16,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  blur?: boolean;
  distance?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const dx = direction === "left" ? -distance : direction === "right" ? distance : 0;
  const dy = direction === "up" ? distance : direction === "down" ? -distance : 0;

  return (
    <m.div
      initial={{
        opacity: 0,
        x: dx,
        y: dy,
        ...(blur ? { filter: "blur(7px)" } : {}),
      }}
      whileInView={{
        opacity: 1,
        x: 0,
        y: 0,
        ...(blur ? { filter: "blur(0px)" } : {}),
      }}
      viewport={VIEWPORT_ONCE}
      transition={{ duration, delay, ease: SILK_EASE }}
      className={className}
    >
      {children}
    </m.div>
  );
}

/* Gợn nước hồ sen & 7 cánh sen hồng lả lơi khi tháo niêm phong */
function SenUnsealPetals({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center overflow-visible"
      aria-hidden="true"
    >
      {/* 2 vòng gợn nước mặt hồ mảnh lan chậm rãi màu vàng nhạt */}
      <m.span
        className="absolute h-16 w-16 rounded-full border border-[#E5C97B]/65"
        initial={{ scale: 0.65, opacity: 0.85 }}
        animate={{ scale: 3.1, opacity: 0 }}
        transition={{ duration: 1.55, ease: SILK_EASE }}
      />
      <m.span
        className="absolute h-14 w-14 rounded-full border border-[#F3DF9E]/45"
        initial={{ scale: 0.55, opacity: 0.75 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 1.45, delay: 0.24, ease: SILK_EASE }}
      />
      {/* 7 cánh sen hồng vẽ SVG mềm mại bay tản nhẹ */}
      {LOTUS_PETAL_SEEDS.map((petal) => (
        <m.svg
          key={petal.id}
          viewBox="0 0 18 28"
          className="absolute h-5 w-3.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
          initial={{ x: 0, y: 0, rotate: petal.rot0, scale: 0.3, opacity: 0 }}
          animate={{
            x: [0, petal.x1, petal.x2],
            y: [0, petal.y * 0.55, petal.y],
            rotate: [petal.rot0, (petal.rot0 + petal.rot1) * 0.5, petal.rot1],
            scale: [0.35, petal.scale, petal.scale * 0.72],
            opacity: [0, 0.92, 0],
          }}
          transition={{ duration: petal.dur, delay: petal.delay, ease: SILK_EASE }}
        >
          <path
            d="M9 1 C14.5 7, 16.5 16.5, 9 27 C1.5 16.5, 3.5 7, 9 1 Z"
            fill={petal.color}
          />
          <path
            d="M9 3 C11.5 9, 12.2 16, 9 24.5 C5.8 16, 6.5 9, 9 3 Z"
            fill="#FFF4F7"
            fillOpacity="0.45"
          />
        </m.svg>
      ))}
    </div>
  );
}

/* ============================================================
   HỌA TIẾT VÂN MÂY VÀNG KIM TÁI SỬ DỤNG
   ============================================================ */
const GoldCloudDecor = React.memo(function GoldCloudDecor({
  className,
  opacity = 0.36,
}: {
  className?: string;
  opacity?: number;
}) {
  return (
    <img
      loading="lazy"
      decoding="async"
      src={`${ASSET_BASE}/cloud_gold.webp?${ASSET_VER}`}
      alt=""
      aria-hidden="true"
      className={cn("pointer-events-none select-none object-contain", className)}
      style={{ opacity }}
    />
  );
});

/* ============================================================
   THẺ LẬT 3D CHÂN DUNG CHÚ RỂ & CÔ DÂU (STANDARD EXCLUSIVE)
   - Mặt trước: Khung viền góc cổ điển xanh ngọc (portrait_frame.webp)
   - Mặt sau:   Vai diễn & Lời tự bạch (data.castDossier)
   ============================================================ */
function SenNgocPortraitFlipCard({
  photoUrl,
  displayName,
  roleLabel,
  backQuote,
  familyLabel,
  muted,
}: {
  photoUrl: string | null;
  displayName: string;
  roleLabel: string;
  backQuote: string;
  familyLabel: string;
  muted: boolean;
}) {
  const [flipped, setFlipped] = React.useState(false);

  const handleToggle = () => {
    playInteractionSfx("card-flip", { muted });
    setFlipped((prev) => !prev);
  };

  return (
    <div
      className="relative mx-auto w-full max-w-[172px] aspect-[333/533]"
      style={{ perspective: "900px" }}
    >
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`Lật thẻ hồ sơ ${displayName}`}
        className="relative block h-full w-full cursor-pointer text-left focus:outline-none"
      >
        <div
          className="relative h-full w-full transition-transform duration-700"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* MẶT TRƯỚC: Ảnh chân dung khớp sát viền trong khung góc truyền thống */}
          <div
            className="absolute inset-0 overflow-hidden shadow-md"
            style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
          >
            <div className="absolute inset-0 overflow-hidden bg-[#2E3B28]/10">
              {photoUrl ? (
                <img
                  loading="lazy"
                  decoding="async"
                  src={photoUrl}
                  alt={displayName}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center text-[#3A4932]/60">
                  <span className="text-xs font-medium" style={{ fontFamily: SERIF_FONT }}>
                    {displayName}
                  </span>
                </div>
              )}
            </div>

            {/* Lớp khung góc truyền thống xanh ngọc phủ chính xác lên trên */}
            <img
              loading="lazy"
              decoding="async"
              src={`${ASSET_BASE}/portrait_frame.webp?${ASSET_VER}`}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-fill"
            />
          </div>

          {/* MẶT SAU: Vai diễn & Lời tự bạch (Cast Dossier) */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-sm border-2 border-[#C8A858]/70 bg-[#3A4932] p-3.5 text-center text-[#FDF2EF] shadow-lg"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <GoldCloudDecor className="absolute top-1.5 right-1.5 w-12" opacity={0.22} />
            <GoldCloudDecor className="absolute bottom-2 left-1.5 w-12" opacity={0.22} />

            <div className="relative z-10 w-full">
              <p
                className="text-[9px] font-semibold tracking-[0.2em] text-[#E5C97B] uppercase"
                style={{ fontFamily: SANS_FONT }}
              >
                {familyLabel}
              </p>
              <p
                className="mt-1 text-base font-normal text-[#FDF2EF]"
                style={{ fontFamily: SCRIPT_FONT, fontSynthesis: "none" }}
              >
                {displayName}
              </p>
              <p
                className="mt-0.5 text-[9px] tracking-[0.14em] text-[#D7E0CE] uppercase"
                style={{ fontFamily: SANS_FONT }}
              >
                {roleLabel}
              </p>
            </div>

            <div className="relative z-10 my-auto py-2">
              <div className="mx-auto mb-2 h-px w-8 bg-[#C8A858]/60" />
              <p
                className="text-[11px] leading-relaxed italic text-[#F8EFEA]"
                style={{ fontFamily: SERIF_FONT }}
              >
                &ldquo;{backQuote}&rdquo;
              </p>
            </div>

            <span
              className="relative z-10 inline-flex items-center gap-1 text-[9px] tracking-wider text-[#E5C97B]"
              style={{ fontFamily: SANS_FONT }}
            >
              <RotateCw className="h-2.5 w-2.5" />
              Chạm để quay lại
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ============================================================
   BÌA MỞ THIỆP ẤN TƯỢNG 3 PHA (STANDARD COVER — GIỐNG HỆT bìa.png)
   ============================================================ */
function SenNgocCover({
  data,
  contained,
  onOpenStart,
  onOpenComplete,
  disableAudio,
}: {
  data: TemplateData;
  contained?: boolean;
  onOpenStart: () => void;
  onOpenComplete: () => void;
  disableAudio?: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = React.useState<"idle" | "crack" | "opening">("idle");
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
      timers.length = 0;
    };
  }, []);

  const dateParts = formatWeddingDateParts(data.date);
  const dotDate = `${String(dateParts.day).padStart(2, "0")}.${String(dateParts.month).padStart(2, "0")}.${dateParts.year}`;

  const handleOpen = () => {
    if (phase !== "idle") return;
    playCoverSfx("lotus-wax-envelope", { muted: Boolean(disableAudio) });
    onOpenStart();

    if (prefersReducedMotion) {
      setPhase("opening");
      const t = setTimeout(onOpenComplete, 260);
      timersRef.current.push(t);
      return;
    }

    setPhase("crack");
    const t1 = setTimeout(() => setPhase("opening"), 750);
    const t2 = setTimeout(() => onOpenComplete(), 2150);
    timersRef.current.push(t1, t2);
  };

  return (
    <div
      onClick={handleOpen}
      className={cn(
        "absolute inset-0 z-40 flex flex-col overflow-hidden select-none cursor-pointer",
        contained ? "h-full" : "h-full min-h-[100dvh]",
      )}
      style={{
        backgroundColor: OLIVE_PRIMARY,
      }}
    >
      {/* Nắp phong bì chữ V màu kem phấn lật 3D mở ngược chậm rãi như giấy gió thật (tách perspective riêng tránh lỗi depth-buffer trên iOS WebKit) */}
      <div
        className="relative z-20 h-[41%] min-h-[250px] w-full shrink-0"
        style={{ perspective: "1200px" }}
      >
        <m.div
          animate={
            phase === "opening"
              ? { rotateX: 115, y: "-16%", opacity: 0 }
              : { rotateX: 0, y: "0%", opacity: 1 }
          }
          transition={{ duration: 1.35, ease: SILK_EASE }}
          style={{
            transformOrigin: "top center",
            transformStyle: "preserve-3d",
            WebkitTransformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
          className="relative h-full w-full"
        >
          <div
            className="relative flex h-full w-full flex-col items-center justify-start px-4 pt-20 sm:pt-24"
            style={{
              backgroundColor: PAPER_BLUSH,
              clipPath: "polygon(0 0, 100% 0, 100% 48%, 50% 100%, 0 48%)",
              WebkitClipPath: "polygon(0 0, 100% 0, 100% 48%, 50% 100%, 0 48%)",
              filter: "drop-shadow(0 6px 12px rgba(0, 0, 0, 0.25))",
            }}
          >
            <m.h1
              initial={
                prefersReducedMotion
                  ? false
                  : { opacity: 0, y: 10, filter: "blur(6px)" }
              }
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.95, ease: SILK_EASE }}
              className="whitespace-nowrap text-center text-[28px] font-normal leading-tight tracking-normal sm:text-[32px]"
              style={{ fontFamily: SCRIPT_FONT, color: OLIVE_PRIMARY, fontSynthesis: "none" }}
            >
              Ngày Chung Đôi
            </m.h1>
          </div>

          {/* Con dấu sáp xanh rêu dập nổi nhành hoa vàng nằm đúng đỉnh chữ V */}
          <div className="absolute bottom-0 left-1/2 z-30 -translate-x-1/2 translate-y-1/2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpen();
              }}
              aria-label="Chạm con dấu sáp để mở thiệp cưới"
              className="group relative flex h-[66px] w-[66px] cursor-pointer items-center justify-center rounded-full focus:outline-none sm:h-[74px] sm:w-[74px]"
            >
              {/* Gợn nước hồ sen & cánh sen hồng bung nhẹ khi chạm tháo niêm phong */}
              <SenUnsealPetals active={!prefersReducedMotion && phase !== "idle"} />
              <m.img
                loading="eager"
                fetchPriority="high"
                src={`${ASSET_BASE}/wax_seal.webp?${ASSET_VER}`}
                alt="Con dấu sáp mở thiệp"
                animate={
                  phase === "crack"
                    ? { scale: [1, 0.92, 1.08], rotate: [0, -14, 6] }
                    : phase === "opening"
                      ? { scale: 0.68, opacity: 0 }
                      : { scale: 1, rotate: 0 }
                }
                transition={{ duration: 0.68, ease: SILK_EASE }}
                className="relative z-10 h-full w-full object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.38)] transition-transform duration-300 group-hover:scale-105"
              />
            </button>
          </div>
        </m.div>
      </div>

      {/* Thân bìa xanh rêu vân mây vàng trôi nhẹ + tên cặp đôi + khóm sen hồng */}
      <m.div
        animate={
          phase === "opening"
            ? { y: "16%", opacity: 0 }
            : { y: "0%", opacity: 1 }
        }
        transition={{ duration: 1.3, ease: SILK_EASE }}
        className="relative flex flex-1 flex-col items-center justify-start px-4 pt-14 pb-8 text-center sm:pt-16"
      >
        {/* Các cụm vân mây vàng kim trôi cực chậm và dạt nhẹ sang hai bên khi mở thiệp */}
        <m.div
          animate={
            prefersReducedMotion
              ? undefined
              : phase === "opening"
                ? { x: -42, opacity: 0 }
                : { x: [-4, 4, -4] }
          }
          transition={
            phase === "opening"
              ? { duration: 1.15, ease: SILK_EASE }
              : { duration: 10, repeat: Infinity, ease: "easeInOut" }
          }
          className="pointer-events-none absolute -top-16 -left-3 w-24 sm:w-28"
        >
          <GoldCloudDecor className="w-full" opacity={0.4} />
        </m.div>
        <m.div
          animate={
            prefersReducedMotion
              ? undefined
              : phase === "opening"
                ? { x: 42, opacity: 0 }
                : { x: [4, -4, 4] }
          }
          transition={
            phase === "opening"
              ? { duration: 1.15, ease: SILK_EASE }
              : { duration: 11.5, repeat: Infinity, ease: "easeInOut" }
          }
          className="pointer-events-none absolute -top-14 -right-3 w-28 sm:w-32"
        >
          <GoldCloudDecor className="w-full" opacity={0.4} />
        </m.div>
        <GoldCloudDecor className="absolute top-[36%] -right-2 w-24" opacity={0.34} />
        <GoldCloudDecor className="absolute top-[48%] left-[36%] w-28" opacity={0.36} />
        <GoldCloudDecor className="absolute right-1 bottom-16 w-28" opacity={0.36} />
        <GoldCloudDecor className="absolute bottom-1 left-[44%] w-24" opacity={0.34} />

        {/* Tên cặp đôi & Ngày cưới hiện từ sương mờ sang rõ nét như mực thấm giấy gió */}
        <m.div
          initial={
            prefersReducedMotion
              ? false
              : { opacity: 0, y: 12, filter: "blur(6px)" }
          }
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.95, delay: 0.16, ease: SILK_EASE }}
          className="relative z-10 space-y-2"
        >
          <h2
            className="whitespace-nowrap text-center text-[16.5px] font-normal tracking-[0.05em] text-[#FDF2EF] uppercase sm:text-[18.5px]"
            style={{ fontFamily: TAN_FONT, fontSynthesis: "none" }}
          >
            <span>{data.couple.groomName}</span>
            <span className="mx-2 text-[15px] text-[#FDF2EF] sm:text-[17px]">&amp;</span>
            <span>{data.couple.brideName}</span>
          </h2>
          <p
            className="text-[18px] font-semibold tracking-[0.06em] text-[#DDE7C4] sm:text-[20px]"
            style={{ fontFamily: SERIF_FONT }}
          >
            {dotDate}
          </p>
        </m.div>

        {/* Khóm sen hồng vươn cao góc dưới trái đung đưa dịu nhẹ */}
        <m.img
          loading="eager"
          fetchPriority="high"
          src={`${ASSET_BASE}/lotus_cover_cluster.webp?${ASSET_VER}`}
          alt="Khóm hoa sen hồng"
          animate={
            prefersReducedMotion
              ? undefined
              : { rotate: [-1.2, 1.2, -1.2], y: [0, -3, 0] }
          }
          transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "bottom left" }}
          className="pointer-events-none absolute bottom-0 left-0 z-10 w-[45%] max-w-[200px] select-none object-contain object-bottom"
        />
      </m.div>
    </div>
  );
}

/* ============================================================
   NÉT VẼ CÔ DÂU CHÚ RỂ FOOTER — TỰ VẼ NÉT MẢNH KHI CUỘN TỚI
   ============================================================ */
function CoupleLineArtSvg({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const draw = prefersReducedMotion
    ? {}
    : {
      initial: { pathLength: 0, opacity: 0.2 },
      whileInView: { pathLength: 1, opacity: 1 },
      viewport: VIEWPORT_ONCE,
    };

  return (
    <svg
      viewBox="0 0 120 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Chú rể bên trái */}
      <m.circle
        cx="42"
        cy="18"
        r="6"
        stroke="currentColor"
        strokeWidth="1.4"
        {...draw}
        transition={{ duration: 0.9, delay: 0.05, ease: SILK_EASE }}
      />
      <m.path
        d="M32 34 C33 27, 51 27, 52 34 L54 62 L47 62 L46 88 M38 88 L37 62 L30 62 L32 34 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...draw}
        transition={{ duration: 1.35, delay: 0.12, ease: SILK_EASE }}
      />
      {/* Tay chú rể nắm tay cô dâu */}
      <m.path
        d="M52 38 C55 46, 58 51, 61 52"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        {...draw}
        transition={{ duration: 0.8, delay: 0.35, ease: SILK_EASE }}
      />
      {/* Cô dâu bên phải + khăn voan bay + bó hoa giơ cao */}
      <m.circle
        cx="72"
        cy="21"
        r="5.5"
        stroke="currentColor"
        strokeWidth="1.4"
        {...draw}
        transition={{ duration: 0.9, delay: 0.15, ease: SILK_EASE }}
      />
      <m.path
        d="M66 33 C68 28, 77 28, 79 34 L90 86 L58 86 L66 33 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...draw}
        transition={{ duration: 1.4, delay: 0.22, ease: SILK_EASE }}
      />
      {/* Khăn voan dài bay ra sau */}
      <m.path
        d="M75 18 C88 26, 94 56, 102 82"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        {...draw}
        transition={{ duration: 1.25, delay: 0.45, ease: SILK_EASE }}
      />
      {/* Tay cô dâu giơ cao cầm bó hoa */}
      <m.path
        d="M79 34 C86 27, 92 20, 96 14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        {...draw}
        transition={{ duration: 0.85, delay: 0.5, ease: SILK_EASE }}
      />
      {/* Bó hoa nhỏ */}
      <m.circle
        cx="98"
        cy="11"
        r="3"
        stroke="currentColor"
        strokeWidth="1.2"
        {...draw}
        transition={{ duration: 0.6, delay: 0.65, ease: SILK_EASE }}
      />
      <m.circle
        cx="94"
        cy="9"
        r="2.2"
        stroke="currentColor"
        strokeWidth="1.1"
        {...draw}
        transition={{ duration: 0.6, delay: 0.72, ease: SILK_EASE }}
      />
      <m.circle
        cx="101"
        cy="14"
        r="2.2"
        stroke="currentColor"
        strokeWidth="1.1"
        {...draw}
        transition={{ duration: 0.6, delay: 0.78, ease: SILK_EASE }}
      />
    </svg>
  );
}

/* ============================================================
   COMPONENT CHÍNH: SEN NGỌC TRĂM NĂM
   ============================================================ */
export default function SenNgocTramNamTemplate({
  data,
  mode = "live",
  contained = false,
  isOpened = false,
  onOpenedChange,
  externalMusicControl = false,
  inviteSlug,
  weddingSlug,
  invitationMode,
  guestName,
  initialStatus,
  initialPlusOnes,
  initialDiet,
  initialSongRequest,
  initialRideNeeded,
}: WeddingTemplateProps) {
  const prefersReducedMotion = useReducedMotion();
  const [coverGone, setCoverGone] = React.useState(Boolean(isOpened));
  const [prevIsOpened, setPrevIsOpened] = React.useState(isOpened);
  const [closing, setClosing] = React.useState(false);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const disableAudio = Boolean(externalMusicControl);

  if (isOpened !== prevIsOpened) {
    setPrevIsOpened(isOpened);
    setCoverGone(Boolean(isOpened));
  }

  const {
    stage: giftStage,
    isOpening: isGiftOpening,
    isModalOpen: giftModalOpen,
    handleGiftClick,
    handleCloseModal: handleCloseGiftModal,
  } = useGiftBoxInteraction({
    sfxType: "lotus-silk-giftbox",
    muted: Boolean(disableAudio),
    delayMs: 620,
  });

  const hidden = React.useMemo(
    () => new Set(data.hiddenSections ?? []),
    [data.hiddenSections],
  );

  const sectionOrder =
    data.sectionOrder && data.sectionOrder.length > 0
      ? data.sectionOrder
      : DEFAULT_SECTION_ORDER;

  const orderOf = (key: string) => {
    const idx = sectionOrder.indexOf(key);
    return idx === -1 ? 50 : idx;
  };

  // Ngày cưới & Lịch tháng
  const visibleEvents = React.useMemo(() => getVisibleEvents(data), [data]);
  const primaryEvent = React.useMemo(
    () => getNearestUpcomingEvent(visibleEvents) ?? visibleEvents[0] ?? null,
    [visibleEvents],
  );
  const weddingIso = data.date || primaryEvent?.startsAt;
  const dateParts = React.useMemo(() => formatWeddingDateParts(weddingIso), [weddingIso]);
  const weddingDayNum = Number(dateParts.day) || 1;
  const weddingMonthNum = Number(dateParts.month) || 1;
  const weddingYearNum = Number(dateParts.year) || new Date().getFullYear();
  const dotDate = `${String(weddingDayNum).padStart(2, "0")}.${String(weddingMonthNum).padStart(2, "0")}.${weddingYearNum}`;

  const calendarDays = React.useMemo(() => {
    const firstDayOfWeek = new Date(weddingYearNum, weddingMonthNum - 1, 1).getDay(); // 0=CN, 1=T2..6=T7
    const leadingBlanks = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Bắt đầu từ Thứ 2 giống mẫu
    const daysInMonth = new Date(weddingYearNum, weddingMonthNum, 0).getDate();
    const cells: Array<number | null> = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [weddingMonthNum, weddingYearNum]);

  // Dữ liệu ảnh
  const heroUrl = data.photos?.heroUrl ?? null;
  const groomPhotoUrl = data.photos?.groomUrl || null;
  const bridePhotoUrl = data.photos?.brideUrl || null;
  const galleryPhotos = data.photos?.gallery ?? [];
  const footerPhotoUrl =
    galleryPhotos[galleryPhotos.length - 1]?.url || heroUrl;

  // Dữ liệu gia đình & cặp đôi
  const hostFirst = data.hostFirst === "bride" ? "bride" : "groom";
  const groomParents = splitParents(data.couple.groomParents);
  const brideParents = splitParents(data.couple.brideParents);
  const groomNameLines = splitNameLines(data.couple.groomFullName || data.couple.groomName);
  const brideNameLines = splitNameLines(data.couple.brideFullName || data.couple.brideName);

  // Story, Timeline, Dress Code
  const storyItems = React.useMemo(() => getDefaultStory(data), [data]);
  const timelineItems =
    data.timeline && data.timeline.length > 0 ? data.timeline : DEFAULT_TIMELINE;
  const dressColors =
    data.dressCode && data.dressCode.length > 0 ? data.dressCode : DEFAULT_DRESS_CODE;

  const resolvedGuestName =
    guestName?.trim() || data.ui?.defaultGuestName || "Quý Khách";

  const showBody = coverGone || closing;

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[480px] overflow-x-hidden shadow-2xl",
        !coverGone
          ? contained
            ? "h-full overflow-hidden"
            : "h-[100dvh] max-h-full overflow-hidden"
          : "min-h-screen",
      )}
      style={{
        backgroundColor: PAPER_BLUSH,
        color: OLIVE_PRIMARY,
        fontFamily: SANS_FONT,
      }}
    >
      {/* BÌA MỞ THIỆP 3 PHA */}
      <AnimatePresence>
        {!coverGone && (
          <SenNgocCover
            data={data}
            contained={contained}
            disableAudio={disableAudio}
            onOpenStart={() => {
              setClosing(true);
            }}
            onOpenComplete={() => {
              setCoverGone(true);
              setClosing(false);
              onOpenedChange?.(true);
              try {
                window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
              } catch {
                // ignore
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* NỘI DUNG THÂN THIỆP (flex-col hỗ trợ sectionOrder) */}
      <main
        className={cn(
          "relative flex flex-col",
          !showBody && "hidden pointer-events-none",
        )}
      >
        {/* ============================================================
            PHẦN 1: HERO PHONG BÌ XANH RÊU LỒNG ẢNH CƯỚI (order: -1)
            Giống hệt nửa trên Screenshot 2026-11-24 185023.png
            ============================================================ */}
        <section
          style={{ order: -1 }}
          className="relative px-4 pt-8 pb-6 sm:px-6 sm:pt-10"
        >
          <div className="relative mx-auto w-full max-w-[360px] pt-4 pb-10">
            {/* Lớp 1 (Sau cùng): Nắp sau phong bì xanh rêu */}
            <div className="relative mx-auto w-[86%]">
              <img
                loading="eager"
                decoding="async"
                src={`${ASSET_BASE}/envelope_back.webp?${ASSET_VER}`}
                alt=""
                aria-hidden="true"
                className="block w-full select-none object-contain"
              />

              {/* Lớp 2 (Giữa): Tấm ảnh cưới vòm bo góc rút êm lên từ lòng phong bì */}
              <m.div
                initial={prefersReducedMotion ? false : { y: 40, opacity: 0.35 }}
                animate={
                  showBody
                    ? { y: 0, opacity: 1 }
                    : prefersReducedMotion
                      ? { y: 0, opacity: 1 }
                      : { y: 40, opacity: 0.35 }
                }
                transition={{ duration: 1.35, delay: 0.25, ease: SILK_EASE }}
                className="absolute inset-x-[7%] top-[7%] z-10 overflow-hidden rounded-t-[26px] border-[1.5px] border-[#3A4932] bg-[#F4ECE7] shadow-md"
                style={{ aspectRatio: "4 / 4.4" }}
              >
                {heroUrl ? (
                  <img
                    loading="eager"
                    decoding="async"
                    src={heroUrl}
                    alt={data.photos?.heroAlt || `${data.couple.groomName} & ${data.couple.brideName}`}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#EFE6E1] text-xs text-[#5B6854]">
                    Ảnh cưới chính
                  </div>
                )}

                {/* Nhãn vòm kem phấn đính nhẫn nhỏ + tên + ngày mờ-rõ theo sau */}
                <m.div
                  initial={
                    prefersReducedMotion
                      ? false
                      : { opacity: 0, y: 12, filter: "blur(6px)" }
                  }
                  animate={
                    showBody
                      ? { opacity: 1, y: 0, filter: "blur(0px)" }
                      : prefersReducedMotion
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 12, filter: "blur(6px)" }
                  }
                  transition={{ duration: 1.05, delay: 0.65, ease: SILK_EASE }}
                  className="absolute inset-x-[8%] bottom-[12%] z-20 flex flex-col items-center rounded-t-[44px] border-t-2 border-x-2 border-[#C8A858]/80 bg-[#FDF7F4] px-3 pt-2 pb-5 text-center shadow-md"
                >
                  <img
                    loading="eager"
                    decoding="async"
                    src={`${ASSET_BASE}/rings_small.webp?${ASSET_VER}`}
                    alt=""
                    aria-hidden="true"
                    className="-mt-5 mb-0.5 h-6 w-auto object-contain"
                  />
                  <p
                    className="whitespace-nowrap text-[8.5px] font-normal tracking-[0.03em] text-[#3A4932] uppercase sm:text-[9px]"
                    style={{ fontFamily: TAN_FONT, fontSynthesis: "none" }}
                  >
                    {data.couple.groomName} &amp; {data.couple.brideName}
                  </p>
                  <p
                    className="mt-0.5 whitespace-nowrap text-[8.5px] font-normal tracking-[0.12em] text-[#3A4932] sm:text-[8px]"
                    style={{ fontFamily: TAN_FONT }}
                  >
                    {dotDate}
                  </p>
                </m.div>
              </m.div>

              {/* Lớp 3 (Trước): Mặt túi phong bì xanh rêu ôm lấy chân ảnh */}
              <div className="pointer-events-none relative z-20 -mt-[42%] w-full">
                <img
                  loading="eager"
                  decoding="async"
                  src={`${ASSET_BASE}/envelope_front.webp?${ASSET_VER}`}
                  alt=""
                  aria-hidden="true"
                  className="block w-full select-none object-contain drop-shadow-[0_8px_14px_rgba(32,42,27,0.22)]"
                />
                {/* Vân mây vàng nhẹ trên mặt phong bì */}
                <GoldCloudDecor className="absolute top-[22%] left-[8%] w-16" opacity={0.28} />
                <GoldCloudDecor className="absolute top-[24%] right-[8%] w-16" opacity={0.28} />
                <GoldCloudDecor className="absolute bottom-[18%] left-1/2 w-20 -translate-x-1/2" opacity={0.25} />
              </div>

              {/* Lớp 4: Bó hoa sen & rum rủ góc dưới trái phong bì khẽ nghiêng vào vị trí */}
              <m.img
                loading="eager"
                decoding="async"
                src={`${ASSET_BASE}/bouquet_envelope.webp?${ASSET_VER}`}
                alt="Bó hoa sen trang trí"
                initial={prefersReducedMotion ? false : { opacity: 0, rotate: -4, y: 10 }}
                animate={
                  showBody
                    ? { opacity: 1, rotate: 0, y: 0 }
                    : prefersReducedMotion
                      ? { opacity: 1, rotate: 0, y: 0 }
                      : { opacity: 0, rotate: -4, y: 10 }
                }
                transition={{ duration: 1.2, delay: 0.5, ease: SILK_EASE }}
                style={{ transformOrigin: "top center" }}
                className="pointer-events-none absolute -bottom-[24%] -left-[8%] z-30 w-[34%] max-w-[115px] select-none object-contain drop-shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* ============================================================
            PHẦN 2: LỊCH THÁNG MÀU XANH RÊU + TRÁI TIM VÀNG (calendar)
            Giống hệt nửa dưới Screenshot 2026-11-24 185023.png
            ============================================================ */}
        {!hidden.has("calendar") && (
          <m.section
            style={{ order: orderOf("calendar") }}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEWPORT_ONCE}
            transition={{ duration: 0.85, ease: SILK_EASE }}
            className="relative px-4 pt-14 pb-24 sm:px-5 sm:pt-16 sm:pb-28"
          >
            <div
              className="relative overflow-visible rounded-[24px] px-3.5 py-6 text-[#FDF2EF] shadow-lg sm:px-5 sm:py-7"
              style={{ backgroundColor: OLIVE_PRIMARY }}
            >
              <div className="grid grid-cols-[80px_1fr] items-center gap-1.5 sm:grid-cols-[96px_1fr] sm:gap-3">
                {/* Cột trái: THÁNG / số tháng / NĂM (mờ-rõ trượt từ trái) */}
                <SenReveal
                  direction="left"
                  duration={0.95}
                  distance={16}
                  className="flex flex-col items-center justify-center text-center leading-tight"
                >
                  <span
                    className="text-lg tracking-[0.06em] uppercase sm:text-2xl"
                    style={{ fontFamily: TAN_FONT }}
                  >
                    THÁNG
                  </span>
                  <span
                    className="my-1 text-2xl font-normal sm:text-3xl"
                    style={{ fontFamily: TAN_FONT }}
                  >
                    {dateParts.month}
                  </span>
                  <span
                    className="text-xl tracking-[0.06em] sm:text-3xl"
                    style={{ fontFamily: TAN_FONT }}
                  >
                    {dateParts.year}
                  </span>
                </SenReveal>

                {/* Cột phải: Bảng lịch Thứ 2 -> Chủ nhật (Blacker Sans) */}
                <SenReveal direction="up" delay={0.14} duration={0.9} blur={false} distance={14}>
                  <div
                    className="grid grid-cols-7 border-b border-[#FDF2EF]/25 pb-1.5 text-center text-[7.5px] font-semibold text-[#FDF2EF] whitespace-nowrap tracking-tight sm:text-[9.5px]"
                    style={{ fontFamily: BLACKER_FONT }}
                  >
                    {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"].map(
                      (dayLabel) => (
                        <span key={dayLabel} className="leading-tight">
                          {dayLabel}
                        </span>
                      ),
                    )}
                  </div>

                  <div className="mt-2 grid grid-cols-7 gap-y-2 text-center text-xs font-semibold">
                    {calendarDays.map((dayNum, idx) => {
                      if (dayNum === null) {
                        return <span key={`blank-${idx}`} />;
                      }
                      const isWeddingDay = dayNum === weddingDayNum;
                      return (
                        <div
                          key={`day-${dayNum}`}
                          className="relative flex h-7 items-center justify-center"
                        >
                          {isWeddingDay && (
                            <m.img
                              loading="lazy"
                              decoding="async"
                              src={`${ASSET_BASE}/heart_gold.webp?${ASSET_VER}`}
                              alt="Ngày cưới"
                              initial={prefersReducedMotion ? false : { scale: 0.65, opacity: 0 }}
                              whileInView={{ scale: 1, opacity: 1 }}
                              viewport={VIEWPORT_ONCE}
                              transition={{ duration: 0.75, delay: 0.35, ease: SILK_EASE }}
                              className="pointer-events-none absolute h-7 w-7 object-contain"
                            />
                          )}
                          <span
                            className={cn(
                              "relative z-10 text-[11px] sm:text-xs",
                              isWeddingDay
                                ? "font-bold text-[#F5D68E]"
                                : "text-[#FDF2EF]",
                            )}
                          >
                            {dayNum}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </SenReveal>
              </div>

              {/* Nhánh nụ sen & lá sen góc dưới phải tràn nhẹ xuống lề */}
              <m.img
                loading="lazy"
                decoding="async"
                src={`${ASSET_BASE}/lotus_bud_leaf.webp?${ASSET_VER}`}
                alt=""
                aria-hidden="true"
                animate={prefersReducedMotion ? undefined : { rotate: [-1.5, 1.5, -1.5] }}
                transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformOrigin: "bottom center" }}
                className="pointer-events-none absolute -right-3 -bottom-24 z-10 w-14 select-none object-contain sm:-bottom-28 sm:w-16"
              />
            </div>
          </m.section>
        )}

        {/* ============================================================
            PHẦN 3: THÔNG TIN LỄ CƯỚI, HAI HỌ & THẺ LẬT 3D CHÂN DUNG (family)
            Giống hệt Screenshot 2026-11-24 185036.png
            ============================================================ */}
        {!hidden.has("family") && (
          <section style={{ order: orderOf("family") }} className="relative pt-4 pb-8">
            {/* Đầu vòm xanh rêu vân mây + THÔNG TIN LỄ CƯỚI */}
            <div
              className="relative overflow-hidden px-4 pt-8 pb-20 text-center text-[#FDF2EF]"
              style={{ backgroundColor: OLIVE_PRIMARY }}
            >
              <GoldCloudDecor className="absolute top-2 left-2 w-24" opacity={0.35} />
              <GoldCloudDecor className="absolute top-3 right-3 w-24" opacity={0.35} />
              <GoldCloudDecor className="absolute bottom-6 left-1 w-20" opacity={0.28} />
              <GoldCloudDecor className="absolute right-2 bottom-4 w-24" opacity={0.28} />

              <SenReveal direction="up" duration={0.95}>
                <h3
                  className="relative z-10 text-[21px] font-normal tracking-[0.06em] uppercase sm:text-[24px]"
                  style={{ fontFamily: SERIF_FONT, fontSynthesis: "none" }}
                >
                  THÔNG TIN LỄ CƯỚI
                </h3>
              </SenReveal>
            </div>

            {/* Vòm kem phấn nhô lên chứa chữ Song Hỷ đỏ son */}
            <div className="relative z-10 -mt-14 px-4">
              <div
                className="relative mx-auto flex w-full flex-col items-center rounded-t-[90px] px-2 pt-5 pb-4"
                style={{ backgroundColor: PAPER_BLUSH }}
              >
                {/* Vòm đỉnh trung tâm cho chữ Song Hỷ */}
                <div
                  className="-mt-12 flex h-24 w-36 items-center justify-center rounded-t-full"
                  style={{ backgroundColor: PAPER_BLUSH }}
                >
                  <m.img
                    loading="lazy"
                    decoding="async"
                    src={`${ASSET_BASE}/song_hy.webp?${ASSET_VER}`}
                    alt="Chữ Song Hỷ"
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.84 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={VIEWPORT_ONCE}
                    transition={{ duration: 0.85, delay: 0.1, ease: SILK_EASE }}
                    className="mt-2 h-16 w-16 object-contain"
                  />
                </div>

                {/* Hai cột Nhà Trai / Nhà Gái trượt dịu từ hai bên */}
                <div className="mt-2 grid w-full grid-cols-2 gap-3 text-center">
                  {(hostFirst === "bride" ? ["bride", "groom"] : ["groom", "bride"]).map(
                    (side, colIdx) => {
                      const isGroom = side === "groom";
                      const heading = isGroom ? "Nhà Trai" : "Nhà Gái";
                      const parents = isGroom ? groomParents : brideParents;
                      return (
                        <SenReveal
                          key={side}
                          direction={colIdx === 0 ? "left" : "right"}
                          delay={0.12}
                          duration={0.9}
                          distance={16}
                          className="space-y-1"
                        >
                          <p
                            className="text-base font-semibold text-[#3A4932] sm:text-lg"
                            style={{ fontFamily: SERIF_FONT }}
                          >
                            {heading}
                          </p>
                          <div className="space-y-0.5">
                            {parents.length > 0 ? (
                              parents.map((line, idx) => (
                                <p
                                  key={idx}
                                  className={cn(
                                    "text-xs font-semibold sm:text-sm",
                                    idx === parents.length - 1 && parents.length >= 3
                                      ? "mx-auto max-w-[145px] pt-1 text-[10px] font-normal leading-tight text-[#4A5742]"
                                      : "text-[#C8A858]",
                                  )}
                                  style={{ fontFamily: SERIF_FONT }}
                                >
                                  {line}
                                </p>
                              ))
                            ) : (
                              <p
                                className="text-xs font-semibold"
                                style={{ color: GOLD_ACCENT, fontFamily: SERIF_FONT }}
                              >
                                {isGroom ? "Gia đình Nhà Trai" : "Gia đình Nhà Gái"}
                              </p>
                            )}
                          </div>
                        </SenReveal>
                      );
                    },
                  )}
                </div>

                {/* Tên đầy đủ xếp dọc thư pháp thấm hiện từng chữ một + Đôi nhẫn cưới */}
                <div className="mt-7 grid w-full grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 text-center">
                  {(hostFirst === "bride"
                    ? [brideNameLines, groomNameLines]
                    : [groomNameLines, brideNameLines]
                  ).map((lines, colIdx) => (
                    <React.Fragment key={colIdx}>
                      <div className="space-y-0.5 leading-[1.15]">
                        {lines.map((word, wIdx) => (
                          <SenReveal
                            key={wIdx}
                            direction="up"
                            delay={0.08 + wIdx * 0.14}
                            duration={0.9}
                            distance={12}
                          >
                            <p
                              className="text-[22px]/[42px] font-normal sm:text-[27px]"
                              style={{ fontFamily: SCRIPT_FONT, color: OLIVE_PRIMARY, fontSynthesis: "none" }}
                            >
                              {word}
                            </p>
                          </SenReveal>
                        ))}
                      </div>
                      {colIdx === 0 && (
                        <m.img
                          loading="lazy"
                          decoding="async"
                          src={`${ASSET_BASE}/rings_large.webp?${ASSET_VER}`}
                          alt="Đôi nhẫn cưới"
                          animate={
                            prefersReducedMotion
                              ? undefined
                              : { scale: [1, 1.06, 1], rotate: [-2, 2, -2] }
                          }
                          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                          className="mx-auto w-16 object-contain sm:w-20"
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Hai thẻ chân dung Lật 3D trượt dịu từ hai bên + Bông sen vươn lên */}
                {!data.hideCouplePhotos && (
                  <div className="mt-7 w-full">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-1.5 sm:gap-2">
                      {(hostFirst === "bride" ? ["bride", "groom"] : ["groom", "bride"]).map(
                        (side, idx) => (
                          <React.Fragment key={side}>
                            <SenReveal
                              direction={idx === 0 ? "left" : "right"}
                              delay={idx * 0.12}
                              duration={0.95}
                              blur={false}
                              distance={18}
                            >
                              {side === "groom" ? (
                                <SenNgocPortraitFlipCard
                                  photoUrl={groomPhotoUrl}
                                  displayName={data.couple.groomName}
                                  roleLabel={
                                    data.castDossier?.groomRole ||
                                    data.couple.groomTitle ||
                                    "TRƯỞNG NAM"
                                  }
                                  backQuote={
                                    data.castDossier?.groomQuote ||
                                    `Hạnh phúc lớn nhất của ${data.couple.groomName} là được nắm tay ${data.couple.brideName} đi trọn trăm năm.`
                                  }
                                  familyLabel="NHÀ TRAI"
                                  muted={Boolean(disableAudio)}
                                />
                              ) : (
                                <SenNgocPortraitFlipCard
                                  photoUrl={bridePhotoUrl}
                                  displayName={data.couple.brideName}
                                  roleLabel={
                                    data.castDossier?.brideRole ||
                                    data.couple.brideTitle ||
                                    "ÁI NỮ"
                                  }
                                  backQuote={
                                    data.castDossier?.brideQuote ||
                                    `Cảm ơn gia đình và người thân đã luôn thương yêu, chứng giám cho ngày vui của ${data.couple.brideName} & ${data.couple.groomName}.`
                                  }
                                  familyLabel="NHÀ GÁI"
                                  muted={Boolean(disableAudio)}
                                />
                              )}
                            </SenReveal>
                            {idx === 0 && (
                              <SenReveal direction="up" delay={0.22} duration={0.9} blur={false} distance={16}>
                                <img
                                  loading="lazy"
                                  decoding="async"
                                  src={`${ASSET_BASE}/lotus_center_pod.webp?${ASSET_VER}`}
                                  alt="Hoa sen và đài sen"
                                  className="mx-auto mb-1 w-14 shrink-0 select-none object-contain sm:w-16"
                                />
                              </SenReveal>
                            )}
                          </React.Fragment>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            PHẦN 4: KÍNH MỜI & THẺ SỰ KIỆN / GOOGLE MAP (map)
            Giống hệt Screenshot 2026-11-24 185057.png
            ============================================================ */}
        {!hidden.has("map") && (
          <section
            style={{ order: orderOf("map") }}
            className="space-y-5 px-4 pt-4 pb-8 sm:px-5"
          >
            {/* Lời kính mời cá nhân hóa tên khách — Sương tan từ mờ sang rõ */}
            <div className="space-y-1.5 text-center">
              <SenReveal direction="up" duration={0.85} distance={12}>
                <p
                  className="text-[18px] font-normal tracking-[0.08em] uppercase sm:text-[20px]"
                  style={{ fontFamily: SERIF_FONT, color: OLIVE_PRIMARY, fontSynthesis: "none" }}
                >
                  KÍNH MỜI
                </p>
              </SenReveal>
              <SenReveal direction="up" delay={0.14} duration={1.0} distance={14}>
                <p
                  className="whitespace-nowrap text-[24px] font-normal sm:text-[28px]"
                  style={{ fontFamily: SCRIPT_FONT, color: GOLD_ACCENT, fontSynthesis: "none" }}
                >
                  {resolvedGuestName}
                </p>
              </SenReveal>
              <SenReveal direction="up" delay={0.26} duration={0.9} distance={12}>
                <p
                  className="mx-auto max-w-xs text-sm leading-relaxed text-[#3A4932]/90"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  {data.quote ||
                    "Đến tham dự buổi tiệc thân mật chung vui cùng gia đình chúng tôi"}
                </p>
              </SenReveal>
            </div>

            {/* Danh sách các lễ cưới (Lễ Thành Hôn, Lễ Vu Quy...) */}
            <div className="space-y-4">
              {visibleEvents.map((ev, idx) => {
                const evParts = formatWeddingDateParts(ev.startsAt);
                const lunarClean = formatLunarDateClean(ev.lunarDate);
                const directionsUrl = getEventDirectionsUrl(ev);
                const isEven = idx % 2 === 0;

                return (
                  <m.div
                    key={ev.id}
                    initial={
                      prefersReducedMotion
                        ? false
                        : { opacity: 0, x: isEven ? -14 : 14, y: 20 }
                    }
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={VIEWPORT_ONCE}
                    transition={{ duration: 0.85, delay: idx * 0.12, ease: SILK_EASE }}
                    className="relative overflow-hidden rounded-[24px] px-5 py-6 text-center text-[#FDF2EF] shadow-lg"
                    style={{ backgroundColor: OLIVE_PRIMARY }}
                  >
                    {/* Hoa sen trang trí mép phải / mép trái xen kẽ đúng như mẫu */}
                    {isEven ? (
                      <img
                        loading="lazy"
                        decoding="async"
                        src={`${ASSET_BASE}/lotus_event_right.webp?${ASSET_VER}`}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 -right-2 w-24 -translate-y-1/2 select-none object-contain"
                      />
                    ) : (
                      <img
                        loading="lazy"
                        decoding="async"
                        src={`${ASSET_BASE}/lotus_event_left.webp?${ASSET_VER}`}
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute bottom-0 -left-1 w-20 select-none object-contain"
                      />
                    )}

                    {/* Tiêu đề sự kiện trong viên thuốc kem phấn */}
                    <SenReveal direction="up" delay={0.08} duration={0.75} distance={10}>
                      <div
                        className="relative z-10 mx-auto w-full max-w-[290px] rounded-full px-4 py-2 shadow-xs"
                        style={{ backgroundColor: PAPER_BLUSH }}
                      >
                        <h4
                          className="whitespace-nowrap text-[22px] leading-tight font-normal sm:text-[25px]"
                          style={{ fontFamily: SCRIPT_FONT, color: OLIVE_PRIMARY, fontSynthesis: "none" }}
                        >
                          {ev.title}
                        </h4>
                      </div>
                    </SenReveal>

                    {/* Địa điểm & Thời gian — Times New Roman đúng tỷ lệ mẫu thiết kế */}
                    <SenReveal
                      direction="up"
                      delay={0.16}
                      duration={0.8}
                      distance={12}
                      className="relative z-10 mt-4 text-[#FDF2EF]"
                    >
                      <div className="space-y-1" style={{ fontFamily: TIMES_FONT }}>
                        {ev.venueName && (
                          <p className="text-[18px] leading-snug font-normal sm:text-[19px]">
                            {ev.venueName}
                          </p>
                        )}
                        {ev.venueAddress && (
                          <p className="mx-auto max-w-[290px] text-[18px] leading-snug font-normal text-[#FDF2EF] sm:text-[19px]">
                            {ev.venueAddress}
                          </p>
                        )}
                        <p className="pt-2.5 text-[18px] leading-none font-normal sm:text-[19px]">
                          Vào lúc:{" "}
                          <span className="text-[28px] font-normal tracking-[0.02em] sm:text-[30px]">
                            {evParts.time}
                          </span>
                        </p>
                        <p className="pt-1.5 text-[18px] leading-snug font-normal sm:text-[19px]">
                          Ngày {String(evParts.day).padStart(2, "0")} tháng{" "}
                          {String(evParts.month).padStart(2, "0")} năm {evParts.year}
                        </p>
                        {lunarClean && (
                          <p className="text-[16px] leading-snug font-normal not-italic text-[#FDF2EF]/95 sm:text-[17px]">
                            ( {lunarClean} )
                          </p>
                        )}
                      </div>
                    </SenReveal>

                    {/* Nút GOOGLE MAP viên thuốc kem phấn */}
                    {directionsUrl && (
                      <SenReveal direction="up" delay={0.22} duration={0.75} blur={false} distance={10} className="relative z-10 mt-5">
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full max-w-[260px] items-center justify-center rounded-full px-6 py-2.5 text-[15px] font-normal tracking-[0.1em] uppercase shadow-sm transition-transform hover:scale-[1.02] active:scale-95"
                          style={{
                            backgroundColor: PAPER_BLUSH,
                            color: OLIVE_PRIMARY,
                            fontFamily: SERIF_FONT,
                          }}
                        >
                          GOOGLE MAP
                        </a>
                      </SenReveal>
                    )}
                  </m.div>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================
            PHẦN 5 (STANDARD EXCLUSIVE): CHUYỆN CHÚNG MÌNH — SỔ SEN NGỌC (story)
            Chỉ hiển thị ảnh khi khách có tải milestone.imageUrl
            ============================================================ */}
        {!hidden.has("story") && storyItems.length > 0 && (
          <section
            style={{ order: orderOf("story") }}
            className="space-y-4 px-4 py-6 sm:px-5"
          >
            <SenReveal direction="up" duration={0.9} className="text-center">
              <h3
                className="text-2xl font-normal sm:text-4xl"
                style={{ fontFamily: SCRIPT_FONT, color: OLIVE_PRIMARY, fontSynthesis: "none" }}
              >
                Chuyện Chúng Mình
              </h3>
            </SenReveal>

            <div className="space-y-4">
              {storyItems.map((milestone, idx) => {
                const photoUrl = milestone.imageUrl?.trim();
                return (
                  <SenReveal
                    key={milestone.id || idx}
                    direction="up"
                    delay={idx * 0.12}
                    duration={0.9}
                    distance={18}
                    className="relative overflow-hidden rounded-2xl border border-[#C8A858]/40 bg-white/80 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center rounded-full px-3 py-0.5 text-[10px] font-semibold tracking-wider text-[#FDF2EF]"
                        style={{ backgroundColor: OLIVE_PRIMARY }}
                      >
                        {milestone.year || `Mốc ${idx + 1}`}
                      </span>
                      <span
                        className="text-[10px] font-semibold tracking-[0.18em] uppercase"
                        style={{ color: GOLD_ACCENT }}
                      >
                        CHƯƠNG {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <h4
                      className="mt-2.5 text-lg font-bold"
                      style={{ fontFamily: SERIF_FONT, color: OLIVE_PRIMARY }}
                    >
                      {milestone.title}
                    </h4>

                    {milestone.content && (
                      <p className="mt-1.5 text-xs leading-relaxed text-[#4B5843]">
                        {milestone.content}
                      </p>
                    )}

                    {/* Chỉ hiển thị ảnh khi khách chủ động tải ảnh cho mốc này */}
                    {photoUrl && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-[#C8A858]/35 bg-[#F5ECE8]">
                        <div className="relative aspect-[16/10] w-full overflow-hidden">
                          <img
                            loading="lazy"
                            decoding="async"
                            src={photoUrl}
                            alt={milestone.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </SenReveal>
                );
              })}
            </div>
          </section>
        )}

        {/* ============================================================
            PHẦN 6 (STANDARD EXCLUSIVE): LỊCH TRÌNH & DRESS CODE (dresscode)
            ============================================================ */}
        {!hidden.has("dresscode") && (
          <section
            style={{ order: orderOf("dresscode") }}
            className="px-4 py-6 sm:px-5"
          >
            <div className="rounded-[24px] border border-[#C8A858]/45 bg-white/85 p-5 shadow-sm">
              <SenReveal direction="up" duration={0.9} className="text-center">
                <h3
                  className={cn(
                    "font-normal",
                    contained || mode !== "live"
                      ? "whitespace-nowrap text-[19px]"
                      : "text-2xl",
                  )}
                  style={{ fontFamily: SCRIPT_FONT, color: OLIVE_PRIMARY, fontSynthesis: "none" }}
                >
                  Lịch Trình &amp; Trang Phục
                </h3>
              </SenReveal>

              {/* Dòng thời gian ngày cưới — xuất hiện từng mốc nối tiếp */}
              <div className="mt-5 space-y-3 border-l-2 border-[#C8A858]/50 pl-4">
                {timelineItems.map((item, idx) => (
                  <SenReveal
                    key={item.id || idx}
                    direction="left"
                    delay={idx * 0.1}
                    duration={0.85}
                    distance={14}
                    className="relative"
                  >
                    <span
                      className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#FDF2EF]"
                      style={{ backgroundColor: OLIVE_PRIMARY }}
                    />
                    <div className="flex items-baseline gap-2.5">
                      <span
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold text-[#FDF2EF]"
                        style={{ backgroundColor: OLIVE_PRIMARY }}
                      >
                        <Clock className="h-3 w-3" />
                        {item.time}
                      </span>
                      <span className="text-xs font-medium text-[#3A4932] sm:text-sm">
                        {item.label}
                      </span>
                    </div>
                  </SenReveal>
                ))}
              </div>

              {/* 3 gam màu Dress Code */}
              <div className="mt-6 border-t border-[#C8A858]/30 pt-4 text-center">
                <SenReveal direction="up" duration={0.8} distance={10}>
                  <p
                    className="text-[11px] font-semibold tracking-[0.2em] uppercase"
                    style={{ color: GOLD_ACCENT }}
                  >
                    TRANG PHỤC GỢI Ý
                  </p>
                </SenReveal>
                <div className="mt-3 flex items-center justify-center gap-4">
                  {dressColors.slice(0, 3).map((hex, idx) => (
                    <m.div
                      key={idx}
                      initial={prefersReducedMotion ? false : { scale: 0.7, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={VIEWPORT_ONCE}
                      transition={{ duration: 0.7, delay: 0.1 + idx * 0.12, ease: SILK_EASE }}
                      className="flex flex-col items-center gap-1"
                    >
                      <span
                        className="h-10 w-10 rounded-full border-2 border-white shadow-md ring-1 ring-[#C8A858]/40"
                        style={{ backgroundColor: hex }}
                      />
                    </m.div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            PHẦN 7: ALBUM KHOẢNH KHẮC & POLAROID BỒ CÂU (album)
            Giống hệt Screenshot 2026-11-24 185328.png
            ============================================================ */}
        {!hidden.has("album") && (
          <section style={{ order: orderOf("album") }} className="relative pt-4 pb-8">
            {/* Khối đầu xanh rêu vân mây uốn vòm ngược + Hoa sen góc trên phải */}
            <div
              className="relative overflow-hidden px-4 pt-9 pb-20 text-center text-[#FDF2EF]"
              style={{
                backgroundColor: OLIVE_PRIMARY,
                borderBottomLeftRadius: "50% 24px",
                borderBottomRightRadius: "50% 24px",
              }}
            >
              <GoldCloudDecor className="absolute top-2 left-3 w-24" opacity={0.34} />
              <GoldCloudDecor className="absolute bottom-5 left-2 w-24" opacity={0.3} />
              <GoldCloudDecor className="absolute right-4 bottom-6 w-24" opacity={0.3} />

              <img
                loading="lazy"
                decoding="async"
                src={`${ASSET_BASE}/lotus_corner_top.webp?${ASSET_VER}`}
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute top-0 right-0 w-16 select-none object-contain"
              />

              <SenReveal direction="up" duration={0.9} distance={12}>
                <p
                  className="relative z-10 px-6 text-xs font-medium tracking-wide text-[#F5EFE6] sm:text-sm"
                  style={{ fontFamily: SERIF_FONT }}
                >
                  Một số khoảng khắc lưu giữ kỷ niệm
                </p>
              </SenReveal>
              <SenReveal direction="up" delay={0.14} duration={0.95} distance={14}>
                <h3
                  className="relative z-10 mt-2 flex items-center justify-center gap-2 px-3 text-center whitespace-nowrap text-base tracking-[0.05em] uppercase text-[#FDF2EF] sm:text-lg"
                  style={{ fontFamily: TAN_FONT }}
                >
                  <span>{data.couple.groomName}</span>
                  <span className="text-[#E5C97B]">♡</span>
                  <span>{data.couple.brideName}</span>
                </h3>
              </SenReveal>
            </div>

            {/* Dải ảnh cưới bo góc trượt ngang gối lên đáy vòm xanh rêu */}
            <div className="relative z-10 -mt-12 px-4">
              {galleryPhotos.length > 0 ? (
                <>
                  <SenReveal direction="up" delay={0.1} duration={0.85} blur={false} distance={20}>
                    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 no-scrollbar">
                      {galleryPhotos.map((photo, idx) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setLightboxIndex(idx)}
                          className="relative w-[68%] shrink-0 snap-center cursor-pointer overflow-hidden rounded-2xl border-2 border-[#FDF2EF] bg-[#EDE3DF] shadow-md transition-transform hover:scale-[1.01]"
                          style={{ aspectRatio: "3 / 4" }}
                        >
                          <img
                            loading="lazy"
                            decoding="async"
                            src={photo.url}
                            alt={photo.alt || `Khoảnh khắc ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </SenReveal>

                  {/* Cụm 2 ảnh Polaroid kích thước lớn giống ảnh mẫu + Đôi bồ câu bay lượn + Nhánh sen góc dưới trái */}
                  {galleryPhotos.length >= 2 && (
                    <div className="relative mx-auto mt-8 mb-6 h-[370px] w-full max-w-[420px] sm:h-[400px]">
                      {/* Đôi chim bồ câu ngậm nhẫn vàng bay lượn dịu nhẹ */}
                      <m.img
                        loading="lazy"
                        decoding="async"
                        src={`${ASSET_BASE}/doves_rings.webp?${ASSET_VER}`}
                        alt="Đôi chim bồ câu"
                        animate={
                          prefersReducedMotion
                            ? undefined
                            : { y: [0, -5, 0], rotate: [-1.5, 1.5, -1.5] }
                        }
                        transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut" }}
                        className="pointer-events-none absolute -top-3 right-5 z-30 w-28 select-none object-contain sm:w-32"
                      />

                      {/* Ảnh Polaroid trái nghiêng nhẹ (ảnh kỷ niệm 2 đúng mẫu) */}
                      <m.button
                        type="button"
                        onClick={() => setLightboxIndex(galleryPhotos.length >= 3 ? 1 : 0)}
                        initial={prefersReducedMotion ? false : { opacity: 0, x: -24, rotate: -10 }}
                        whileInView={{ opacity: 1, x: 0, rotate: -6 }}
                        viewport={VIEWPORT_ONCE}
                        transition={{ duration: 0.8, ease: SILK_EASE }}
                        whileHover={{ scale: 1.03, zIndex: 30 }}
                        className="absolute top-3 left-2 z-10 w-[58%] cursor-pointer border border-[#D8D0C8] bg-white p-2.5 pb-10 shadow-lg"
                      >
                        <div className="aspect-[3/4] w-full overflow-hidden bg-[#EFE8E4]">
                          <img
                            loading="lazy"
                            decoding="async"
                            src={galleryPhotos[1]?.url || galleryPhotos[0].url}
                            alt="Kỷ niệm 1"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </m.button>

                      {/* Ảnh Polaroid phải đứng thẳng chồng nhẹ lên (ảnh kỷ niệm 3 đúng mẫu) */}
                      <m.button
                        type="button"
                        onClick={() => setLightboxIndex(galleryPhotos.length >= 3 ? 2 : 1)}
                        initial={prefersReducedMotion ? false : { opacity: 0, x: 24, y: 14 }}
                        whileInView={{ opacity: 1, x: 0, y: 0 }}
                        viewport={VIEWPORT_ONCE}
                        transition={{ duration: 0.85, delay: 0.1, ease: SILK_EASE }}
                        whileHover={{ scale: 1.03, zIndex: 30 }}
                        className="absolute top-14 right-1 z-20 w-[60%] cursor-pointer border border-[#D8D0C8] bg-white p-2.5 pb-10 shadow-xl"
                      >
                        <div className="aspect-[3/4] w-full overflow-hidden bg-[#EFE8E4]">
                          <img
                            loading="lazy"
                            decoding="async"
                            src={galleryPhotos[2]?.url || galleryPhotos[1]?.url || galleryPhotos[0].url}
                            alt="Kỷ niệm 2"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </m.button>

                      {/* Nhánh nụ sen & lá sen góc dưới trái */}
                      <m.img
                        loading="lazy"
                        decoding="async"
                        src={`${ASSET_BASE}/lotus_corner_bottom.webp?${ASSET_VER}`}
                        alt=""
                        aria-hidden="true"
                        animate={prefersReducedMotion ? undefined : { rotate: [-1.5, 1.5, -1.5] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        style={{ transformOrigin: "bottom center" }}
                        className="pointer-events-none absolute -bottom-5 -left-2 z-30 w-24 select-none object-contain sm:w-28"
                      />
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#3A4932]/30 bg-white/70 p-8 text-center text-xs text-[#5B6854]">
                  Album ảnh cưới sẽ hiển thị tại đây khi bạn tải ảnh lên trong mục Ảnh cưới.
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================
            PHẦN 8: MÃ QR ALBUM KHÁCH (albumQr — chuẩn AGENTS.md §5)
            ============================================================ */}
        {data.plan !== "free" && !hidden.has("albumQr") && (weddingSlug || data.weddingSlug) && (
          <section
            style={{ order: orderOf("albumQr") }}
            className="flex justify-center px-4 py-4 sm:px-5"
          >
            <SenReveal direction="up" duration={0.85} blur={false} distance={18}>
              <GuestAlbumQr
                slug={weddingSlug || data.weddingSlug}
                accentColor={OLIVE_PRIMARY}
                textColor={OLIVE_PRIMARY}
                mutedColor="#5B6854"
              />
            </SenReveal>
          </section>
        )}

        {/* ============================================================
            PHẦN 9: HỘP MỪNG CƯỚI SEN NGỌC TƯƠNG TÁC (gift)
            Giống hệt Screenshot 2026-11-24 190025.png
            ============================================================ */}
        {!hidden.has("gift") && (
          <section
            style={{ order: orderOf("gift") }}
            className="space-y-4 px-4 py-6 text-center sm:px-5"
          >
            <SenReveal direction="up" duration={0.9} distance={14}>
              <h3
                className="text-2xl font-normal tracking-wide"
                style={{
                  fontFamily: SCRIPT_FONT,
                  color: OLIVE_PRIMARY,
                  fontSynthesis: "none",
                  textShadow: "0 1px 0 rgba(200, 168, 88, 0.55)",
                }}
              >
                Hộp Mừng Cưới
              </h3>
            </SenReveal>

            <SenReveal direction="up" delay={0.08} duration={0.85} blur={false} distance={20}>
              <div
                className="relative overflow-hidden rounded-[24px] px-5 py-7 text-[#FDF2EF] shadow-lg"
                style={{ backgroundColor: OLIVE_PRIMARY }}
              >
                <GoldCloudDecor className="absolute top-12 left-2 w-24" opacity={0.36} />
                <GoldCloudDecor className="absolute top-14 right-2 w-24" opacity={0.36} />
                <GoldCloudDecor className="absolute bottom-14 left-4 w-24" opacity={0.32} />
                <GoldCloudDecor className="absolute right-3 bottom-12 w-24" opacity={0.32} />

                <div className="relative z-10 mt-6 flex flex-col items-center justify-center">
                  <button
                    type="button"
                    onClick={handleGiftClick}
                    disabled={isGiftOpening}
                    aria-label="Mở hộp mừng cưới Sen Ngọc"
                    className="group relative flex cursor-pointer items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 disabled:pointer-events-none"
                  >
                    {/* Hào quang vàng kim tỏa nhẹ sau hộp quà */}
                    <span
                      className={cn(
                        "pointer-events-none absolute inset-0 -m-3 rounded-full bg-gradient-to-tr from-[#C8A858]/30 via-[#F6DF9C]/40 to-[#E87EA1]/25 blur-xl transition-opacity duration-300",
                        giftStage === "open" ? "opacity-95 scale-110" : "opacity-55",
                      )}
                      aria-hidden="true"
                    />

                    <m.img
                      loading="lazy"
                      decoding="async"
                      src={`${ASSET_BASE}/gift_box_lotus.webp?${ASSET_VER}`}
                      alt="Hộp mừng cưới hoa sen Song Hỷ"
                      animate={
                        giftStage === "open"
                          ? { scale: 1.08, rotate: -2, y: -4 }
                          : prefersReducedMotion
                            ? undefined
                            : { y: [0, -5, 0], rotate: [0, 0.8, 0, -0.8, 0] }
                      }
                      transition={
                        giftStage === "open"
                          ? { duration: 0.3 }
                          : { duration: 4.0, repeat: Infinity, ease: "easeInOut" }
                      }
                      className="relative z-10 h-44 w-44 object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)] sm:h-48 sm:w-48"
                    />
                  </button>

                  <SenReveal direction="up" delay={0.18} duration={0.8} distance={10}>
                    <p className="mt-3 text-[10px] font-semibold tracking-[0.2em] text-[#E5C97B] uppercase">
                      Chạm để mở hộp mừng cưới
                    </p>
                  </SenReveal>
                </div>
              </div>
            </SenReveal>
          </section>
        )}

        {/* ============================================================
            PHẦN 10: LỜI CHÚC PHÚC & XÁC NHẬN THAM DỰ (rsvp)
            Thanh tiêu đề viên thuốc xanh rêu đính hoa sen giống Screenshot 190025
            ============================================================ */}
        {!hidden.has("rsvp") && (
          <section
            style={{ order: orderOf("rsvp") }}
            className="space-y-4 px-4 pt-4 pb-10 sm:px-5"
          >
            {/* Thanh tiêu đề Lời chúc phúc */}
            <SenReveal direction="up" duration={0.85} distance={14}>
              <div
                className="relative mx-auto flex items-center justify-center rounded-full px-8 py-2.5 text-center shadow-md"
                style={{ backgroundColor: OLIVE_PRIMARY }}
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src={`${ASSET_BASE}/lotus_pill_small.webp?${ASSET_VER}`}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-2.5 left-1.5 h-12 w-auto select-none object-contain"
                />
                <h3
                  className="text-2xl font-normal text-[#FDF2EF]"
                  style={{ fontFamily: SCRIPT_FONT, fontSynthesis: "none" }}
                >
                  Lời chúc phúc
                </h3>
              </div>
            </SenReveal>

            <SenReveal
              direction="up"
              delay={0.12}
              duration={0.85}
              blur={false}
              distance={18}
              className="overflow-hidden rounded-2xl border border-[#C8A858]/40 bg-white/90 p-4 shadow-sm sm:p-5"
            >
              <TemplateRsvpSection
                data={data}
                mode={mode}
                tone="emerald"
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
                customTheme={RSVP_CUSTOM_THEME}
              />
            </SenReveal>
          </section>
        )}

        {/* ============================================================
            PHẦN 11: FOOTER CẢM ƠN TOÀN CHIỀU RỘNG (order: 999)
            Giống hệt Screenshot 2026-11-24 191120.png
            ============================================================ */}
        <footer
          style={{ order: 999 }}
          className="relative mt-2 w-full overflow-hidden"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#2F523B]">
            {footerPhotoUrl && (
              <m.img
                loading="lazy"
                decoding="async"
                src={footerPhotoUrl}
                alt={`Cảm ơn từ ${data.couple.groomName} & ${data.couple.brideName}`}
                initial={prefersReducedMotion ? false : { scale: 1.06, opacity: 0.7 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={VIEWPORT_ONCE}
                transition={{ duration: 1.35, ease: SILK_EASE }}
                className="h-full w-full object-cover object-top"
              />
            )}

            {/* Lớp chuyển sắc xanh ngọc rêu mượt từ giữa xuống đậm ở đáy */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(43,91,63,0) 28%, rgba(43,91,63,0.62) 62%, rgba(43,91,63,0.96) 88%, #2B5B3F 100%)",
              }}
              aria-hidden="true"
            />

            {/* Nét vẽ cô dâu chú rể tự vẽ + Tên + Lời cảm ơn sương tan */}
            <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-5 pb-8 text-center">
              <CoupleLineArtSvg className="mb-1 h-20 w-24 text-[#F3EFE6]/90" />

              <SenReveal direction="up" delay={0.28} duration={0.95} distance={14}>
                <p
                  className="whitespace-nowrap text-xl tracking-[0.06em] text-[#FFFFFF] uppercase sm:text-2xl"
                  style={{ fontFamily: DISPLAY_FONT }}
                >
                  {data.couple.groomName}{" "}
                  <span className="mx-1.5 text-[#E5E8B6]">&amp;</span>{" "}
                  {data.couple.brideName}
                </p>
              </SenReveal>

              <SenReveal direction="up" delay={0.46} duration={1.05} distance={14}>
                <p
                  className="mt-2 max-w-xs text-2xl font-normal leading-snug text-[#E5EEB5] sm:text-3xl"
                  style={{ fontFamily: SCRIPT_FONT, fontSynthesis: "none" }}
                >
                  Chân thành cám ơn sự yêu thương và hiện diện của Quý vị
                </p>
              </SenReveal>
            </div>
          </div>
        </footer>
      </main>

      {/* NÚT NHẠC NỔI NỘI BỘ (tuân thủ AGENTS.md §1 & §5) */}
      <LiveMusicFloatingButton
        src={data.music?.src}
        title={data.music?.title}
        visible={!disableAudio && !hidden.has("music") && coverGone}
        tone="emerald"
      />

      {/* MODAL QUÀ MỪNG VIETQR */}
      <GiftModal
        open={giftModalOpen}
        onClose={handleCloseGiftModal}
        gift={data.gift}
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName}
        plan={data.plan}
        tone="olive"
      />

      {/* LIGHTBOX XEM ẢNH ALBUM */}
      <TemplateLightboxModal
        photos={galleryPhotos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />
    </div>
  );
}
