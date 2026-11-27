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
import { useInvitationExperience } from "@/components/invitation/InvitationExperienceProvider";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playCoverSfx, playInteractionSfx } from "@/lib/sfx";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type {
  TemplateData,
  TemplatePhotoItem,
  WeddingPlan,
} from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import { useWeddingCountdown, padCountdownUnit } from "../shared/useCountdown";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: HỔ PHÁCH MẬT THƯ (ho-phach-mat-thu) — STANDARD EDITION
   - Nâu Cà Phê Trầm (Espresso Walnut): #4E382C (sâu #36251C, trung #6B4F3F)
   - Hổ Phách Đồng Cổ (Antique Amber Bronze): #B68B59 (sáng #D8B78E)
   - Giấy Bông Kem Cổ (Handmade Vintage Parchment): #F6EFE6 (thẻ sáng #FBF8F3, thẻ kraft #EDE2D3)
   - Chữ nội dung trên nền giấy: #5A463A (chính) / #7D695C (phụ)
   ============================================================ */

const ESPRESSO_WALNUT = "#4E382C";
const AMBER_BRONZE = "#B68B59";
const PARCHMENT_BG = "#F6EFE6";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_VINTAGE = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "16:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm" },
  { time: "17:30", label: "Nghi lễ Khải Phong kết duyên & Trao hẹn ước trăm năm" },
  { time: "18:00", label: "Khai tiệc mừng uyên ương & Nâng ly chúc phúc" },
  { time: "19:30", label: "Vũ khúc tình yêu & Những thanh âm lãng mạn" },
  { time: "20:30", label: "Tiễn khách & Trao quà cảm tạ tri ân" },
];

const DEFAULT_DRESS = ["#0D2B1D", "#D8B372", "#3F5E45", "#F3E7CC"];

type StoryMilestone = NonNullable<TemplateData["story"]>[number];

const DEFAULT_STORY_MILESTONES: StoryMilestone[] = [
  {
    year: "2022",
    title: "Lần đầu gặp gỡ",
    content: "Một buổi chiều thu dịu nắng bên tách cà phê ấm, ánh mắt giao nhau và câu chuyện chưa từng dứt.",
  },
  {
    year: "2024",
    title: "Những chuyến đi chung",
    content: "Cùng nhau bước qua bốn mùa nắng mưa, gom góp từng kỷ niệm nhỏ thành bức thư tình gửi tương lai.",
  },
  {
    year: "2026",
    title: "Lời hẹn ước",
    content: "Dưới ánh đèn vàng cổ điển, cái gật đầu dịu dàng đánh dấu chặng đường mới mang tên gia đình.",
  },
  {
    year: "2027",
    title: "Ngày chung đôi",
    content: "Khải phong lá mật thư trăm năm, trân trọng đón chào người thân yêu đến chung vui ngày trọng đại.",
  },
];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 4) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ============================================================
   HÌNH HỌC PAGE-CURL CANVAS 2D (Sutherland-Hodgman Clipping)
   ============================================================ */
interface CurlPoint {
  x: number;
  y: number;
}

function clipPolygonHalfPlane(
  poly: CurlPoint[],
  mx: number,
  my: number,
  nx: number,
  ny: number,
  keepPositive: boolean,
): CurlPoint[] {
  if (poly.length === 0) return [];
  const sign = keepPositive ? 1 : -1;
  const distOf = (p: CurlPoint) => ((p.x - mx) * nx + (p.y - my) * ny) * sign;

  const out: CurlPoint[] = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const dCur = distOf(cur);
    const dPrev = distOf(prev);

    if (dCur >= 0) {
      if (dPrev < 0) {
        const t = dPrev / (dPrev - dCur);
        out.push({ x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y) });
      }
      out.push(cur);
    } else if (dPrev >= 0) {
      const t = dPrev / (dPrev - dCur);
      out.push({ x: prev.x + t * (cur.x - prev.x), y: prev.y + t * (cur.y - prev.y) });
    }
  }
  return out;
}

function tracePolyPath(ctx: CanvasRenderingContext2D, poly: CurlPoint[]): void {
  if (poly.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(poly[0].x, poly[0].y);
  for (let i = 1; i < poly.length; i++) {
    ctx.lineTo(poly[i].x, poly[i].y);
  }
  ctx.closePath();
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ============================================================
   Hiệu ứng xuất hiện mượt GPU — chỉ kích hoạt khi khối lên được 1/3 màn hình
   ============================================================ */
interface AmberScrollContextValue {
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  contained: boolean;
}

const AmberScrollContext = React.createContext<AmberScrollContextValue>({
  scrollRootRef: { current: null },
  contained: false,
});

function findAmberScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node: HTMLElement | null = el?.parentElement ?? null;
  while (node && node !== document.body && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const overflowY = style.overflowY;
    if (
      (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
      node.scrollHeight > node.clientHeight + 2
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

function AmberReveal({
  children,
  className,
  delay = 0,
  distance = 28,
  duration = 1.1,
  initialScale = 1,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  duration?: number;
  initialScale?: number;
}) {
  const reduce = Boolean(useReducedMotion());
  const { scrollRootRef, contained } = React.useContext(AmberScrollContext);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (reduce || isVisible) return;
    const el = containerRef.current;
    if (!el) return;

    const detectedParent = findAmberScrollParent(el);
    const fallbackRoot =
      contained &&
        scrollRootRef.current &&
        scrollRootRef.current.scrollHeight > scrollRootRef.current.clientHeight + 2
        ? scrollRootRef.current
        : null;
    const rootEl = detectedParent ?? fallbackRoot;

    const revealIfInOneThirdZone = () => {
      const rect = el.getBoundingClientRect();
      const viewportHeight = rootEl ? rootEl.clientHeight : window.innerHeight;
      const rootTop = rootEl ? rootEl.getBoundingClientRect().top : 0;
      const triggerY = rootTop + viewportHeight * (2 / 3);

      // Component đã cuộn lên ít nhất 1/3 màn hình (tính từ cạnh dưới)
      if (rect.top <= triggerY) {
        setIsVisible(true);
        return true;
      }

      // Dự phòng cuối trang: chỉ mở các khối sát đáy khi người dùng đã cuộn gần chạm đáy thật
      const scroller = rootEl ?? (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
      const maxScroll = Math.max(0, scroller.scrollHeight - (rootEl ? rootEl.clientHeight : window.innerHeight));
      const curScroll = rootEl ? rootEl.scrollTop : window.scrollY;
      const atBottom = maxScroll > 16 && maxScroll - curScroll <= 24;
      if (atBottom && rect.top < rootTop + viewportHeight - 8) {
        setIsVisible(true);
        return true;
      }
      return false;
    };

    const rafId = requestAnimationFrame(() => {
      revealIfInOneThirdZone();
    });

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry?.isIntersecting) {
              setIsVisible(true);
            }
          },
          {
            root: rootEl,
            rootMargin: "0px 0px -33% 0px",
            threshold: 0,
          },
        )
        : null;

    io?.observe(el);

    const scrollTarget: EventTarget = rootEl ?? window;
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;
    const onScrollOrResize = () => {
      if (throttleTimer !== null) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        revealIfInOneThirdZone();
      }, 160);
    };
    scrollTarget.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      if (throttleTimer !== null) {
        clearTimeout(throttleTimer);
      }
      io?.disconnect();
      scrollTarget.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [contained, isVisible, reduce, scrollRootRef]);

  const shown = reduce || isVisible;

  return (
    <div ref={containerRef} className={className}>
      <m.div
        initial={reduce ? false : { opacity: 0, y: distance, scale: initialScale }}
        animate={shown ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: distance, scale: initialScale }}
        transition={reduce ? { duration: 0.01 } : { duration, delay, ease: EASE_VINTAGE }}
        className={
          className?.includes("sm:h-full")
            ? "sm:h-full"
            : className?.includes("h-full")
              ? "h-full"
              : undefined
        }
        style={shown ? undefined : { willChange: "transform, opacity" }}
      >
        {children}
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------
   Hiệu ứng Cánh Lá Khô & Bụi Hổ Phách Rơi Chậm
   - Tắt khi prefers-reduced-motion hoặc đang mở bìa
   ------------------------------------------------------------ */
function HerbLeavesFalling({ count = 12, paused = false }: { count?: number; paused?: boolean }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 19) % 92 + 4}%`,
      size: (idx % 3) + 2.5,
      duration: 10 + (idx % 4) * 2.5,
      delay: (idx * 0.7) % 5,
      isAmber: idx % 2 === 0,
    }));
  }, [count]);

  if (reduce || paused) return null;

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
   STAGE PHONG THƯ CHUNG CHO BÌA (COVER) & HERO (SHARED FLIP)
   - Đảm bảo tọa độ, tỷ lệ 640:709, Polaroid & nhánh hoa bi khớp 100%
   - perspective: 1100px CHỈ đặt trên wrapper nắp tam giác 3D
   ============================================================ */
interface AmberEnvelopeHeroStageProps {
  mode: "cover" | "hero";
  isOpening?: boolean;
  reduce: boolean;
  heroPhotoUrl: string;
  groomName: string;
  brideName: string;
  inviteEyebrow: string;
  onOpenCover?: () => void;
  onHeroPhotoLoad?: () => void;
}

const AmberEnvelopeHeroStage = React.forwardRef<HTMLDivElement, AmberEnvelopeHeroStageProps>(
  function AmberEnvelopeHeroStage(
    {
      mode,
      isOpening = false,
      reduce,
      heroPhotoUrl,
      groomName,
      brideName,
      inviteEyebrow,
      onOpenCover,
      onHeroPhotoLoad,
    },
    ref,
  ) {
    const isCover = mode === "cover";
    const showOpenedInterior = !isCover || isOpening;

    return (
      <div
        ref={ref}
        data-hero-envelope={mode === "hero" ? "true" : undefined}
        role={isCover ? "button" : undefined}
        tabIndex={isCover ? 0 : undefined}
        aria-label={isCover ? "Chạm dấu sáp mở mật thư" : undefined}
        onClick={isCover ? onOpenCover : undefined}
        onKeyDown={
          isCover
            ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpenCover?.();
              }
            }
            : undefined
        }
        className={cn(
          "relative w-full aspect-[640/709] select-none flex flex-col items-center justify-end",
          isCover && !isOpening && "cursor-pointer",
        )}
      >
        {/* LỚP 0 (z-0): Lòng hoa văn cổ bên dưới (clip y >= 39.07%) + Nắp trên envelope-back.webp xoay 3D liền mạch (+90° -> 0°) ở pha 2
            Đảm bảo CHỈ CÓ 1 NẮP DUY NHẤT tại mọi thời điểm (KHÔNG còn 2 mép thiệp chồng nhau!) */}
        {isCover ? (
          <>
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 top-[39.07%] bg-[#473023] rounded-b-sm pointer-events-none z-0 shadow-2xl transition-opacity duration-200",
                isOpening ? "opacity-0" : "opacity-100",
              )}
              aria-hidden="true"
            />

            <m.div
              initial={false}
              animate={{ opacity: showOpenedInterior ? 1 : 0 }}
              transition={reduce ? { duration: 0.15 } : { duration: 0.25, delay: isOpening ? 0.16 : 0 }}
              className="absolute inset-0 w-full h-full pointer-events-none z-0"
              style={{
                clipPath: "inset(39.07% 0 0 0)",
                WebkitClipPath: "inset(39.07% 0 0 0)",
              }}
            >
              <img
                loading="eager"
                decoding="async"
                src="/templates/ho-phach-mat-thu/envelope-back.webp"
                alt="Lòng Phong Thư Cổ"
                className="w-full h-full object-contain pointer-events-none"
              />
            </m.div>

            {/* Nửa 2 của nắp mở (90° -> 0° quanh nếp gấp y = 39.07%): Đúng nắp thật của envelope-back.webp */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-0"
              style={{
                height: "39.07%",
                perspective: "1100px",
              }}
            >
              <m.div
                data-cover-outer-flap="true"
                className="relative w-full h-full overflow-hidden"
                style={{
                  transformOrigin: "bottom center",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  willChange: "transform, opacity",
                }}
                initial={false}
                animate={
                  isOpening
                    ? { rotateX: 0, opacity: 1 }
                    : { rotateX: -90, opacity: 0 }
                }
                transition={
                  reduce
                    ? { duration: 0.16 }
                    : {
                      rotateX: { delay: isOpening ? 0.72 : 0, duration: 0.64, ease: [0.12, 0.62, 0.22, 1] },
                      opacity: { delay: isOpening ? 0.7 : 0, duration: 0.04 },
                    }
                }
              >
                <img
                  loading="eager"
                  decoding="async"
                  src="/templates/ho-phach-mat-thu/envelope-back.webp"
                  alt=""
                  aria-hidden="true"
                  className="w-full max-w-none object-fill pointer-events-none"
                  style={{ height: "255.951%" }}
                />
              </m.div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <img
              loading="eager"
              decoding="async"
              src="/templates/ho-phach-mat-thu/envelope-back.webp"
              alt="Lòng Phong Thư Cổ"
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        )}

        {/* LỚP 10 (z-10): Ảnh Cặp Đôi Polaroid Trượt Mượt Ra Từ Trong Lòng Phong Thư
            clipPath chặn phần đáy khỏi lòi xuống dưới mép đáy phong bì trong lúc slide */}
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            clipPath: "inset(-220px -60px 2% -60px)",
            WebkitClipPath: "inset(-220px -60px 2% -60px)",
          }}
        >
          {isCover ? (
            <m.div
              data-cover-polaroid="true"
              className="absolute inset-x-8 top-8 aspect-[3/4] origin-bottom pointer-events-none"
              style={{ willChange: "transform, opacity" }}
              initial={false}
              animate={
                isOpening
                  ? reduce
                    ? { y: "-16%", rotate: -2, opacity: 1 }
                    : { y: "-16%", rotate: -2, opacity: 1 }
                  : { y: "26%", rotate: 0, opacity: 0 }
              }
              transition={
                reduce
                  ? { duration: 0.18 }
                  : { delay: 1.18, duration: 1.56, ease: [0.18, 0.95, 0.28, 1] }
              }
            >
              <div className="relative w-full h-full bg-[#FAF6F1] rounded-xs p-3 pb-8 shadow-2xl border border-[#B68B59]/30 flex flex-col items-center">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#D8B78E]/40 border-t border-b border-[#B68B59]/35 rounded-xs rotate-1" />
                {heroPhotoUrl ? (
                  <img
                    loading="eager"
                    decoding="async"
                    src={heroPhotoUrl}
                    alt="Ảnh cưới Polaroid"
                    onLoad={onHeroPhotoLoad}
                    className="w-full h-full object-cover rounded-xs"
                  />
                ) : (
                  <div className="w-full h-full bg-[#F3ECE1] border border-[#DFCBB5] rounded-xs flex flex-col items-center justify-center p-4 text-center">
                    <span className="font-serif italic text-2xl text-[#4E382C]">{groomName}</span>
                    <span className="text-[#B68B59] font-serif text-lg my-1">&amp;</span>
                    <span className="font-serif italic text-2xl text-[#4E382C]">{brideName}</span>
                  </div>
                )}
                <img
                  loading="eager"
                  decoding="async"
                  src="/templates/ho-phach-mat-thu/wax-seal.webp"
                  alt=""
                  aria-hidden="true"
                  className="absolute -bottom-3 -right-3 w-10 h-10 object-contain drop-shadow-md pointer-events-none"
                />
              </div>
            </m.div>
          ) : (
            <div
              className="absolute inset-x-8 top-8 aspect-[3/4] origin-bottom pointer-events-none"
              style={{ transform: "translateY(-16%) rotate(-2deg)" }}
            >
              <div className="relative w-full h-full bg-[#FAF6F1] rounded-xs p-3 pb-8 shadow-2xl border border-[#B68B59]/30 flex flex-col items-center">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-16 h-4 bg-[#D8B78E]/40 border-t border-b border-[#B68B59]/35 rounded-xs rotate-1" />
                {heroPhotoUrl ? (
                  <img
                    loading="eager"
                    decoding="async"
                    src={heroPhotoUrl}
                    alt="Ảnh cưới Polaroid"
                    onLoad={onHeroPhotoLoad}
                    className="w-full h-full object-cover rounded-xs"
                  />
                ) : (
                  <div className="w-full h-full bg-[#F3ECE1] border border-[#DFCBB5] rounded-xs flex flex-col items-center justify-center p-4 text-center">
                    <span className="font-serif italic text-2xl text-[#4E382C]">{groomName}</span>
                    <span className="text-[#B68B59] font-serif text-lg my-1">&amp;</span>
                    <span className="font-serif italic text-2xl text-[#4E382C]">{brideName}</span>
                  </div>
                )}
                <img
                  loading="eager"
                  decoding="async"
                  src="/templates/ho-phach-mat-thu/wax-seal.webp"
                  alt=""
                  aria-hidden="true"
                  className="absolute -bottom-3 -right-3 w-10 h-10 object-contain drop-shadow-md pointer-events-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* LỚP 15 (z-15): Nhánh hoa bi khô tựa mép phong thư */}
        {isCover ? (
          <m.img
            loading="eager"
            decoding="async"
            src="/templates/ho-phach-mat-thu/sprig-gypso.webp"
            alt="Cành hoa bi khô"
            initial={false}
            animate={isOpening ? { opacity: 0.9, scale: 1 } : { opacity: 0, scale: 0.86 }}
            transition={
              reduce
                ? { duration: 0.15 }
                : { delay: isOpening ? 2.0 : 0, duration: 0.8, ease: EASE_VINTAGE }
            }
            className="absolute -right-4 top-10 w-24 object-contain pointer-events-none z-15 rotate-12 drop-shadow-sm"
          />
        ) : (
          <img
            loading="eager"
            decoding="async"
            src="/templates/ho-phach-mat-thu/sprig-gypso.webp"
            alt="Cành hoa bi khô"
            className="absolute -right-4 top-10 w-24 object-contain pointer-events-none z-15 rotate-12 opacity-90 drop-shadow-sm"
          />
        )}

        {/* LỚP 20 (z-20): Túi chữ V màu nâu espresso phía trước */}
        <img
          loading="eager"
          decoding="async"
          src="/templates/ho-phach-mat-thu/envelope-pocket.webp"
          alt="Túi Phong Thư Nâu"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
        />

        {/* LỚP 30 (z-30): Nắp trước nâu khép kín (0° -> -90°, biến mất đúng điểm -90° nhường chỗ nắp thật ở z-0) + Con Dấu Sáp & Sóng Vàng */}
        {isCover && (
          <div
            className="pointer-events-none absolute inset-x-0 z-30"
            style={{
              top: "39.07%",
              height: "25.81%",
              perspective: "1100px",
              transform: "translateZ(2px)",
            }}
          >
            <m.div
              className="relative w-full h-full"
              style={{
                transformOrigin: "top center",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                willChange: "transform, opacity",
              }}
              initial={false}
              animate={
                isOpening
                  ? { rotateX: 90, opacity: 0 }
                  : { rotateX: 0, opacity: 1 }
              }
              transition={
                reduce
                  ? { duration: 0.16 }
                  : {
                    rotateX: { delay: isOpening ? 0.2 : 0, duration: 0.52, ease: [0.42, 0, 0.88, 0.86] },
                    opacity: { delay: isOpening ? 0.72 : 0, duration: 0.03 },
                  }
              }
            >
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
                  strokeWidth="1.2"
                  strokeOpacity="0.5"
                />
              </svg>

              {/* Con dấu sáp đồng cổ & Hiệu ứng Sóng Vàng mời khách nhấp vào */}
              <m.div
                className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-1/2 w-14 h-14 sm:w-[60px] sm:h-[60px] flex items-center justify-center"
                initial={false}
                animate={
                  isOpening
                    ? { opacity: 0, scale: 1.18, rotate: 16 }
                    : { opacity: 1, scale: 1, rotate: 0 }
                }
                transition={{ duration: 0.48, ease: EASE_VINTAGE }}
              >
                {!isOpening && !reduce && (
                  <div
                    data-wax-glow="true"
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-4 flex items-center justify-center"
                  >
                    <m.span
                      className="absolute inset-0 rounded-full border-2 border-[#D8B78E]/75 shadow-[0_0_22px_rgba(216,183,142,0.55)]"
                      animate={{ scale: [0.76, 1.38, 1.5], opacity: [0.85, 0.35, 0] }}
                      transition={{ duration: 2.1, repeat: Infinity, ease: "easeOut" }}
                    />
                    <m.span
                      className="absolute inset-1 rounded-full border border-[#B68B59]/85 bg-[#D8B78E]/15"
                      animate={{ scale: [0.84, 1.28, 1.38], opacity: [0.9, 0.25, 0] }}
                      transition={{ duration: 2.1, delay: 0.7, repeat: Infinity, ease: "easeOut" }}
                    />
                  </div>
                )}

                <m.img
                  loading="eager"
                  decoding="async"
                  src="/templates/ho-phach-mat-thu/wax-seal.webp"
                  alt="Con dấu sáp mở mật thư"
                  animate={
                    !isOpening && !reduce
                      ? { scale: [1, 1.045, 1] }
                      : { scale: 1 }
                  }
                  transition={
                    !isOpening && !reduce
                      ? { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.15 }
                  }
                  className="relative z-10 w-full h-full object-contain drop-shadow-[0_6px_14px_rgba(32,18,10,0.68)]"
                />
              </m.div>
            </m.div>
          </div>
        )}

        {/* LỚP 40 (z-40): Trân trọng kính mời + Tên Khách Mời + gợi ý nghiêng có dấu * */}
        {isCover && (
          <m.div
            initial={false}
            animate={isOpening ? { opacity: 0, y: 8 } : { opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="pointer-events-none absolute inset-x-4 top-[73.5%] bottom-2 z-40 flex flex-col items-center justify-center text-center"
          >
            <p className="text-[9px] sm:text-[10px] tracking-[0.2em] text-[#EDE2D3]/90 uppercase font-medium drop-shadow-sm leading-none mb-2">
              Trân Trọng Kính Mời
            </p>
            <p
              className="text-lg sm:text-xl text-[#FBF8F3] font-medium tracking-wide drop-shadow-md leading-tight max-w-[92%] truncate"
              style={{ fontFamily: TITLE_FONT }}
            >
              {inviteEyebrow}
            </p>
            <p
              className="mt-2 inline-block -skew-x-6 text-[10.5px] sm:text-[11px] italic text-[#D8B78E]/90 tracking-wide drop-shadow-xs leading-none"
              style={{ fontFamily: TITLE_FONT }}
            >
              *Chạm dấu sáp để mở mật thư
            </p>
          </m.div>
        )}
      </div>
    );
  },
);

/* ============================================================
   TỜ LỊCH XÉ PAGE-CURL CANVAS 2D 60FPS (HỔ PHÁCH MẬT THƯ)
   - Nền DOM lịch tối Espresso Walnut (#4E382C) + điểm nhấn Hổ Phách (#D8B78E)
   - Tờ giấy lịch phủ trên bằng Giấy Bông Kem Cổ (#F4EAD8) trên <canvas> 2D
   - Kéo >= 2/3 -> xé đứt "XOẸT!" -> lộ lịch tháng & mộc son HỶ SỰ
   - IntersectionObserver chỉ chạy nhịp rung mép giấy khi lịch vào tầm nhìn
   ============================================================ */
function AmberTearOffCalendar({
  monthText,
  yearText,
  dotDateText,
  calendarDays,
  muted,
  reducedMotion,
}: {
  monthText: string;
  yearText: string;
  dotDateText: string;
  calendarDays: Array<{ day: number | null; isWedding: boolean }>;
  muted: boolean;
  reducedMotion: boolean;
}) {
  const [torn, setTorn] = React.useState(false);
  const [canvasMounted, setCanvasMounted] = React.useState(true);
  const [stampLanded, setStampLanded] = React.useState(false);
  const [isDraggingUi, setIsDraggingUi] = React.useState(false);
  const [isStageInView, setIsStageInView] = React.useState(false);

  const isTorn = torn || reducedMotion;
  const isCanvasShown = canvasMounted && !reducedMotion;
  const isStampShown = stampLanded || reducedMotion;

  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const { scrollRootRef, contained } = React.useContext(AmberScrollContext);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const sizeRef = React.useRef<{ w: number; h: number }>({ w: 320, h: 320 });

  const cornerRef = React.useRef<CurlPoint>({ x: 284, y: 284 });
  const dragOffsetRef = React.useRef<CurlPoint>({ x: 0, y: 0 });
  const pointerDownPosRef = React.useRef<CurlPoint | null>(null);
  const isDraggingRef = React.useRef(false);
  const tearingRef = React.useRef(false);
  const maxProgressRef = React.useRef(0);
  const lastRustleAtRef = React.useRef(0);
  const rustleMarksRef = React.useRef<{ first: boolean; second: boolean }>({
    first: false,
    second: false,
  });

  const animRef = React.useRef<
    | { kind: "idle" }
    | { kind: "spring"; vx: number; vy: number }
    | { kind: "peek"; startMs: number }
    | { kind: "nudge"; startMs: number }
    | { kind: "tear"; startMs: number; startCorner: CurlPoint }
  >({ kind: "idle" });
  const rafIdRef = React.useRef<number | null>(null);
  const stampTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const getRestCorner = React.useCallback((w: number, h: number): CurlPoint => {
    return { x: Math.max(0, w - 36), y: Math.max(0, h - 36) };
  }, []);

  const clearTimersAndRaf = React.useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (stampTimerRef.current) {
      clearTimeout(stampTimerRef.current);
      stampTimerRef.current = null;
    }
    if (unmountTimerRef.current) {
      clearTimeout(unmountTimerRef.current);
      unmountTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => clearTimersAndRaf, [clearTimersAndRaf]);

  const computeProgress = React.useCallback(
    (p: CurlPoint, w: number, h: number): number => {
      const rest = getRestCorner(w, h);
      const dx = Math.max(0, rest.x - p.x);
      const dy = Math.max(0, rest.y - p.y);
      const dist = Math.hypot(dx, dy);
      const thresholdSpan = Math.hypot(w, h) * 0.72;
      return Math.max(0, Math.min(1, dist / Math.max(120, thresholdSpan)));
    },
    [getRestCorner],
  );

  const drawCurlFrame = React.useCallback(
    (flyOffsetX = 0, flyOffsetY = 0, flyRotate = 0, flyAlpha = 1) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const { w, h } = sizeRef.current;
      if (w <= 0 || h <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalAlpha = Math.max(0, Math.min(1, flyAlpha));

      if (flyOffsetX !== 0 || flyOffsetY !== 0 || flyRotate !== 0) {
        ctx.translate(w * 0.35 + flyOffsetX, h * 0.35 + flyOffsetY);
        ctx.rotate(flyRotate);
        ctx.translate(-w * 0.35, -h * 0.35);
      }

      const P = cornerRef.current;
      const C = { x: w, y: h };
      const vx = P.x - C.x;
      const vy = P.y - C.y;
      const dist = Math.hypot(vx, vy);
      const progress = computeProgress(P, w, h);

      const jitterX =
        progress > 0.55 && animRef.current.kind === "idle" && isDraggingRef.current
          ? Math.sin(performance.now() * 0.08) * 1.1
          : 0;

      const rectPoly: CurlPoint[] = [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
        { x: 0, y: h },
      ];

      let frontPoly = rectPoly;
      let backPoly: CurlPoint[] = [];
      let mx = w;
      let my = h;
      let nx = -0.707;
      let ny = -0.707;

      if (dist > 2) {
        mx = (C.x + P.x) * 0.5;
        my = (C.y + P.y) * 0.5;
        nx = vx / dist;
        ny = vy / dist;

        frontPoly = clipPolygonHalfPlane(rectPoly, mx, my, nx, ny, true);
        const peeledPoly = clipPolygonHalfPlane(rectPoly, mx, my, nx, ny, false);

        backPoly = peeledPoly.map((q) => {
          const d = (q.x - mx) * nx + (q.y - my) * ny;
          return { x: q.x - 2 * d * nx, y: q.y - 2 * d * ny };
        });

        // 1. Bóng đổ từ mép giấy cong lên nền Espresso Wallet tối
        if (peeledPoly.length >= 3) {
          ctx.save();
          tracePolyPath(ctx, peeledPoly);
          ctx.clip();
          const shadowWidth = Math.min(48, 16 + dist * 0.14);
          const underGrad = ctx.createLinearGradient(
            mx,
            my,
            mx - nx * shadowWidth,
            my - ny * shadowWidth,
          );
          underGrad.addColorStop(0, "rgba(22, 13, 8, 0.52)");
          underGrad.addColorStop(0.5, "rgba(22, 13, 8, 0.22)");
          underGrad.addColorStop(1, "rgba(22, 13, 8, 0)");
          ctx.fillStyle = underGrad;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
      }

      // 2. Mặt trước tờ lịch giấy bông kem cổ (#F4EAD8)
      if (frontPoly.length >= 3) {
        ctx.save();
        drawRoundedRectPath(ctx, 0.5, 0.5, w - 1, h - 1, 16);
        ctx.clip();
        tracePolyPath(ctx, frontPoly);
        ctx.clip();
        ctx.translate(jitterX, 0);

        ctx.fillStyle = "#F4EAD8";
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "rgba(182, 139, 89, 0.24)";
        ctx.lineWidth = 1;
        for (let lineY = 30; lineY < h - 12; lineY += 26) {
          ctx.beginPath();
          ctx.moveTo(14, lineY);
          ctx.lineTo(w - 14, lineY);
          ctx.stroke();
        }

        // Đường xé răng cưa hổ phách ở mép trên
        const tearOpenRatio = Math.max(0, Math.min(1, (progress - 0.3) / 0.36));
        const toothCount = Math.floor((w - 28) / 10);
        ctx.save();
        ctx.strokeStyle = "rgba(78, 56, 44, 0.42)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(16, 40);
        ctx.lineTo(w - 16, 40);
        ctx.stroke();
        ctx.setLineDash([]);

        if (tearOpenRatio > 0) {
          const tearStartX = w - 16 - (w - 32) * tearOpenRatio;
          ctx.strokeStyle = "#4E382C";
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          for (let i = 0; i <= toothCount; i++) {
            const tx = w - 16 - i * 10;
            if (tx < tearStartX) break;
            const ty = i % 2 === 0 ? 37 : 43;
            if (i === 0) ctx.moveTo(tx, 40);
            else ctx.lineTo(tx, ty);
          }
          ctx.stroke();
        }
        ctx.restore();

        // Chữ in cổ điển trên mặt tờ lịch kem
        ctx.textAlign = "center";
        ctx.fillStyle = "#6B4F3F";
        ctx.font = '600 10px "Playfair Display", Georgia, serif';
        ctx.fillText("ĐƯỜNG XÉ TỜ LỊCH", w * 0.5, 25);

        ctx.fillStyle = "#B68B59";
        ctx.font = '600 12px "Playfair Display", Georgia, serif';
        ctx.fillText(`THÁNG ${monthText} • NĂM ${yearText}`, w * 0.5, h * 0.38);

        ctx.fillStyle = "#4E382C";
        ctx.font = 'italic 30px "Playfair Display", Georgia, serif';
        ctx.fillText("Ngày Hỷ Sự", w * 0.5, h * 0.53);

        ctx.fillStyle = "rgba(78, 56, 44, 0.78)";
        ctx.font = 'italic 12.5px "Be Vietnam Pro", sans-serif';
        ctx.fillText("Kéo góc giấy lên để xé tờ lịch", w * 0.5, h * 0.67);

        ctx.strokeStyle = "rgba(182, 139, 89, 0.75)";
        ctx.lineWidth = 1.3;
        drawRoundedRectPath(ctx, 0.6, 0.6, w - 1.2, h - 1.2, 16);
        ctx.stroke();

        // Bóng đổ của tai giấy cuộn lên mặt trước tờ lịch
        if (backPoly.length >= 3) {
          ctx.save();
          ctx.shadowColor = "rgba(38, 22, 14, 0.32)";
          ctx.shadowBlur = 16;
          ctx.shadowOffsetX = -nx * 4;
          ctx.shadowOffsetY = -ny * 4;
          tracePolyPath(ctx, backPoly);
          ctx.fillStyle = "#F4EAD8";
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      }

      // 3. Mặt sau tờ giấy đang cuộn cong 3D
      if (backPoly.length >= 3) {
        ctx.save();
        tracePolyPath(ctx, backPoly);
        ctx.clip();

        let maxD = 24;
        for (const q of backPoly) {
          const d = (q.x - mx) * nx + (q.y - my) * ny;
          if (d > maxD) maxD = d;
        }

        const curlGrad = ctx.createLinearGradient(mx, my, mx + nx * maxD, my + ny * maxD);
        curlGrad.addColorStop(0, "#B89A74");
        curlGrad.addColorStop(0.16, "#FAF4E7");
        curlGrad.addColorStop(0.42, "#FFFDF9");
        curlGrad.addColorStop(0.78, "#EADCC6");
        curlGrad.addColorStop(1, "#CEB491");
        ctx.fillStyle = curlGrad;
        ctx.fillRect(-w, -h, w * 3, h * 3);

        tracePolyPath(ctx, backPoly);
        ctx.strokeStyle = "rgba(107, 79, 63, 0.72)";
        ctx.lineWidth = 1.25;
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    },
    [computeProgress, monthText, yearText],
  );

  const stepRef = React.useRef<(nowMs: number) => void>(null);

  const stepAnimation = React.useCallback(
    (nowMs: number) => {
      const anim = animRef.current;
      const { w, h } = sizeRef.current;
      const rest = getRestCorner(w, h);

      if (anim.kind === "idle") {
        rafIdRef.current = null;
        return;
      }

      const scheduleNext = () => {
        rafIdRef.current = requestAnimationFrame((ts) => stepRef.current?.(ts));
      };

      if (anim.kind === "spring") {
        const P = cornerRef.current;
        const stiffness = 0.2;
        const damping = 0.72;
        const ax = (rest.x - P.x) * stiffness;
        const ay = (rest.y - P.y) * stiffness;
        anim.vx = (anim.vx + ax) * damping;
        anim.vy = (anim.vy + ay) * damping;
        P.x += anim.vx;
        P.y += anim.vy;
        drawCurlFrame();

        if (Math.hypot(rest.x - P.x, rest.y - P.y) < 0.6 && Math.hypot(anim.vx, anim.vy) < 0.4) {
          cornerRef.current = { ...rest };
          animRef.current = { kind: "idle" };
          drawCurlFrame();
          rafIdRef.current = null;
          return;
        }
        scheduleNext();
        return;
      }

      if (anim.kind === "nudge") {
        const elapsed = (nowMs - anim.startMs) / 760;
        if (elapsed >= 1) {
          cornerRef.current = { ...rest };
          animRef.current = { kind: "idle" };
          drawCurlFrame();
          rafIdRef.current = null;
          return;
        }
        const lift =
          elapsed < 0.52
            ? Math.sin((elapsed / 0.52) * Math.PI) * 18
            : Math.sin(((elapsed - 0.52) / 0.48) * Math.PI) * 10;
        cornerRef.current = {
          x: Math.max(0, rest.x - lift),
          y: Math.max(0, rest.y - lift),
        };
        drawCurlFrame();
        scheduleNext();
        return;
      }

      if (anim.kind === "peek") {
        const elapsed = (nowMs - anim.startMs) / 560;
        if (elapsed >= 1) {
          cornerRef.current = { ...rest };
          animRef.current = { kind: "idle" };
          drawCurlFrame();
          rafIdRef.current = null;
          return;
        }
        const wave = Math.sin(elapsed * Math.PI);
        cornerRef.current = {
          x: rest.x - wave * (w * 0.24),
          y: rest.y - wave * (h * 0.24),
        };
        drawCurlFrame();
        scheduleNext();
        return;
      }

      if (anim.kind === "tear") {
        const elapsed = Math.min(1, (nowMs - anim.startMs) / 540);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        cornerRef.current = {
          x: anim.startCorner.x + (-w * 0.5 - anim.startCorner.x) * eased,
          y: anim.startCorner.y + (-h * 0.5 - anim.startCorner.y) * eased,
        };
        drawCurlFrame(-w * 0.36 * eased, -h * 0.55 * eased, -0.26 * eased, 1 - eased);

        if (elapsed >= 1) {
          animRef.current = { kind: "idle" };
          rafIdRef.current = null;
          return;
        }
        scheduleNext();
      }
    },
    [drawCurlFrame, getRestCorner],
  );

  React.useEffect(() => {
    stepRef.current = stepAnimation;
  }, [stepAnimation]);

  const ensureRafRunning = React.useCallback(() => {
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(stepAnimation);
    }
  }, [stepAnimation]);

  React.useEffect(() => {
    if (!isCanvasShown) return;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    const updateCanvasSize = () => {
      const rect = stage.getBoundingClientRect();
      const w = Math.max(240, Math.round(rect.width));
      const h = Math.max(240, Math.round(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      sizeRef.current = { w, h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      if (!isDraggingRef.current && !tearingRef.current && animRef.current.kind === "idle") {
        cornerRef.current = getRestCorner(w, h);
      }
      drawCurlFrame();
    };

    updateCanvasSize();
    const ro = new ResizeObserver(updateCanvasSize);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [drawCurlFrame, getRestCorner, isCanvasShown]);

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === "undefined") return;
    const detectedRoot =
      findAmberScrollParent(stage) ??
      (contained &&
        scrollRootRef.current &&
        scrollRootRef.current.scrollHeight > scrollRootRef.current.clientHeight + 2
        ? scrollRootRef.current
        : null);
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsStageInView(entry.isIntersecting);
        }
      },
      {
        root: detectedRoot,
        rootMargin: "0px 0px -25% 0px",
        threshold: 0.2,
      },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, [contained, scrollRootRef]);

  React.useEffect(() => {
    if (!isCanvasShown || isTorn || !isStageInView || reducedMotion) return;

    const triggerNudge = () => {
      if (isDraggingRef.current || tearingRef.current || animRef.current.kind !== "idle") {
        return;
      }
      animRef.current = { kind: "nudge", startMs: performance.now() };
      ensureRafRunning();
    };

    const initialTimer = setTimeout(triggerNudge, 550);
    const repeatTimer = setInterval(triggerNudge, 2600);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(repeatTimer);
    };
  }, [ensureRafRunning, isCanvasShown, isStageInView, isTorn, reducedMotion]);

  const completeTear = React.useCallback(() => {
    if (tearingRef.current) return;
    tearingRef.current = true;
    isDraggingRef.current = false;
    setIsDraggingUi(false);
    pointerDownPosRef.current = null;

    playInteractionSfx("paper-tear", { muted });
    setTorn(true);

    if (reducedMotion) {
      setStampLanded(true);
      setCanvasMounted(false);
      return;
    }

    animRef.current = {
      kind: "tear",
      startMs: performance.now(),
      startCorner: { ...cornerRef.current },
    };
    ensureRafRunning();

    if (stampTimerRef.current) clearTimeout(stampTimerRef.current);
    stampTimerRef.current = setTimeout(() => {
      playInteractionSfx("vintage-stamp", { muted });
      setStampLanded(true);
      stampTimerRef.current = null;
    }, 320);

    if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current);
    unmountTimerRef.current = setTimeout(() => {
      setCanvasMounted(false);
      unmountTimerRef.current = null;
    }, 560);
  }, [ensureRafRunning, muted, reducedMotion]);

  const handleReplay = () => {
    clearTimersAndRaf();
    tearingRef.current = false;
    isDraggingRef.current = false;
    pointerDownPosRef.current = null;
    maxProgressRef.current = 0;
    rustleMarksRef.current = { first: false, second: false };
    animRef.current = { kind: "idle" };
    setIsDraggingUi(false);
    setTorn(false);
    setStampLanded(false);
    setCanvasMounted(true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tearingRef.current || isTorn) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    animRef.current = { kind: "idle" };
    isDraggingRef.current = true;
    setIsDraggingUi(true);
    pointerDownPosRef.current = { x: localX, y: localY };
    maxProgressRef.current = 0;
    rustleMarksRef.current = { first: false, second: false };

    const cur = cornerRef.current;
    dragOffsetRef.current = { x: cur.x - localX, y: cur.y - localY };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch { }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || tearingRef.current || isTorn) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const { w, h } = sizeRef.current;
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    const nextX = Math.max(-w * 0.45, Math.min(w - 6, localX + dragOffsetRef.current.x));
    const nextY = Math.max(-h * 0.45, Math.min(h - 6, localY + dragOffsetRef.current.y));
    cornerRef.current = { x: nextX, y: nextY };
    drawCurlFrame();

    const progress = computeProgress(cornerRef.current, w, h);
    if (progress > maxProgressRef.current) {
      maxProgressRef.current = progress;
    }

    const nowMs = Date.now();
    if (
      progress >= 0.22 &&
      !rustleMarksRef.current.first &&
      nowMs - lastRustleAtRef.current >= 180
    ) {
      rustleMarksRef.current.first = true;
      lastRustleAtRef.current = nowMs;
      playInteractionSfx("paper-rustle", { muted });
    } else if (
      progress >= 0.48 &&
      !rustleMarksRef.current.second &&
      nowMs - lastRustleAtRef.current >= 180
    ) {
      rustleMarksRef.current.second = true;
      lastRustleAtRef.current = nowMs;
      playInteractionSfx("paper-rustle", { muted });
    }

    if (progress >= 0.68) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch { }
      completeTear();
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || tearingRef.current || isTorn) return;
    isDraggingRef.current = false;
    setIsDraggingUi(false);
    pointerDownPosRef.current = null;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch { }

    const { w, h } = sizeRef.current;
    const progress = computeProgress(cornerRef.current, w, h);

    if (progress >= 0.66) {
      completeTear();
      return;
    }

    if (progress >= 0.06 || maxProgressRef.current >= 0.06) {
      playInteractionSfx("paper-settle", { muted });
      animRef.current = { kind: "spring", vx: 0, vy: 0 };
      ensureRafRunning();
      return;
    }

    playInteractionSfx("paper-rustle", { muted });
    animRef.current = { kind: "peek", startMs: performance.now() };
    ensureRafRunning();
  };

  return (
    <div className="w-full max-w-[380px] space-y-2.5 mb-8">
      <div className="relative overflow-hidden rounded-2xl p-6 bg-[#4E382C] text-[#F6EFE6] shadow-xl border border-[#6B4F3F]">
        <div ref={stageRef} className="relative">
          {/* Con dấu hổ phách HỶ SỰ góc trên phải, không đè chữ */}
          <AnimatePresence>
            {isStampShown && (
              <m.div
                initial={
                  reducedMotion
                    ? { opacity: 0.92, scale: 1, rotate: -10 }
                    : { opacity: 0, scale: 1.85, rotate: -20 }
                }
                animate={{ opacity: 0.92, scale: 1, rotate: -10 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 20 }}
                className="pointer-events-none absolute -top-5 -right-4 z-20"
                aria-hidden="true"
              >
                <svg viewBox="0 0 96 96" className="h-12 w-12 sm:h-14 sm:w-14 text-[#D8B78E]">
                  <circle
                    cx="48"
                    cy="48"
                    r="42"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeDasharray="5 2.5"
                  />
                  <circle cx="48" cy="48" r="35" fill="none" stroke="currentColor" strokeWidth="1.2" />
                  <text
                    x="48"
                    y="34"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="9.5"
                    fontWeight="700"
                    letterSpacing="1.6"
                  >
                    HỶ SỰ
                  </text>
                  <text
                    x="48"
                    y="52"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="11.5"
                    fontWeight="700"
                    letterSpacing="0.8"
                  >
                    {dotDateText}
                  </text>
                  <text
                    x="48"
                    y="67"
                    textAnchor="middle"
                    fill="currentColor"
                    fontSize="8"
                    letterSpacing="1.4"
                  >
                    CHUNG ĐÔI
                  </text>
                </svg>
              </m.div>
            )}
          </AnimatePresence>

          {/* Lịch tháng DOM thật nền Espresso tối bên dưới */}
          <div className="space-y-3 py-1">
            <div className="text-center pr-10 sm:pr-8 font-serif tracking-[0.16em] text-xs sm:text-sm text-[#D8B78E] font-medium mb-3 pt-1 pb-3 border-b border-[#6B4F3F]">
              THÁNG {monthText} • NĂM {yearText}
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-1 text-[#D8B78E]/75 font-semibold">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span>CN</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-serif">
              {calendarDays.map((item, idx) => {
                if (item.day === null) {
                  return <div key={`empty-${idx}`} className="h-8" />;
                }
                return (
                  <div
                    key={`day-${item.day}`}
                    className={cn(
                      "relative h-8 flex items-center justify-center rounded-full text-xs transition-all",
                      item.isWedding
                        ? "font-bold text-[#4E382C] bg-[#D8B78E] shadow-md scale-105"
                        : "text-[#EDE2D3]/90 hover:bg-[#6B4F3F]/40",
                    )}
                  >
                    {item.day}
                    {item.isWedding && isTorn && (
                      <Heart className="absolute -top-1 -right-1 w-3.5 h-3.5 fill-[#B68B59] text-[#FBF8F3]" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tờ lịch giấy kem Canvas 2D Page-Curl phủ lên */}
          {isCanvasShown && (
            <canvas
              ref={canvasRef}
              data-tear-canvas="true"
              aria-label="Kéo góc giấy dưới bên phải lên để xé tờ lịch xem ngày cưới"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              className="absolute inset-0 z-30 h-full w-full cursor-grab active:cursor-grabbing select-none rounded-xl"
              style={{
                touchAction: "none",
                pointerEvents: isTorn ? "none" : "auto",
              }}
            />
          )}

          {/* Vòng sáng hổ phách dẫn hướng góc lật giấy */}
          {isCanvasShown && !isTorn && !isDraggingUi && (
            <div
              data-tear-glow="true"
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-1 -right-1 z-35 flex h-12 w-12 items-center justify-center"
            >
              <m.span
                className="absolute inset-0 rounded-full border-2 border-[#B68B59]/75 bg-[#D8B78E]/30 shadow-[0_0_18px_rgba(182,139,89,0.5)]"
                animate={{ scale: [0.72, 1.38, 0.72], opacity: [0.9, 0.15, 0.9] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
              />
              <m.span
                className="absolute h-7 w-7 rounded-full border border-[#D8B78E]/80 bg-[#FAF6EC]/80"
                animate={{ scale: [0.9, 1.18, 0.9], opacity: [0.95, 0.45, 0.95] }}
                transition={{ duration: 1.9, delay: 0.25, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[#4E382C] text-[#FAF6EC] shadow-[0_0_12px_rgba(78,56,44,0.65)] ring-2 ring-[#D8B78E]/90">
                <svg
                  viewBox="0 0 16 16"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 11L5 5" />
                  <path d="M5 9.5V5H9.5" />
                </svg>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Liên kết phụ Accessibility nằm ngoài mép dưới thẻ lịch */}
      {!reducedMotion && (
        <div className="text-center">
          {!isTorn ? (
            <button
              type="button"
              data-quick-tear="true"
              onClick={completeTear}
              className="cursor-pointer text-[11px] text-[#7D695C] underline underline-offset-4 hover:text-[#4E382C]"
            >
              Mở nhanh lịch cưới
            </button>
          ) : (
            <button
              type="button"
              data-replay-tear="true"
              onClick={handleReplay}
              className="cursor-pointer text-[11px] text-[#7D695C] underline underline-offset-4 hover:text-[#4E382C]"
            >
              Xem lại tờ lịch xé
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   COMPONENT CHÍNH: HỔ PHÁCH MẬT THƯ (STANDARD EDITION)
   ============================================================ */
interface FlipGeometry {
  heroLeft: number;
  heroTop: number;
  heroWidth: number;
  heroHeight: number;
  startX: number;
  startY: number;
  startScale: number;
}

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
  const reduce = Boolean(useReducedMotion());
  const invitationExp = useInvitationExperience();
  // SFX tương tác chỉ phát khi khách tự chạm mở/kéo/mở hộp quà nên luôn bật kể cả khi xem demo
  const sfxMuted = false;

  const [initialOpened] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return isOpened;
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("opened") === "1" || isOpened;
    } catch {
      return isOpened;
    }
  });

  const [coverGone, setCoverGone] = React.useState<boolean>(initialOpened);
  const [isOpening, setIsOpening] = React.useState<boolean>(false);
  const coverOpeningRef = React.useRef(false);
  const coverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRafRef = React.useRef<number | null>(null);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContextValue = React.useMemo(
    () => ({ scrollRootRef: rootRef, contained }),
    [contained],
  );
  const heroEnvelopeRef = React.useRef<HTMLDivElement | null>(null);
  const coverSlotRef = React.useRef<HTMLDivElement | null>(null);
  const [flipGeom, setFlipGeom] = React.useState<FlipGeometry | null>(null);

  const measureFlipGeometry = React.useCallback((): FlipGeometry | null => {
    const rootEl = rootRef.current;
    const heroEl = heroEnvelopeRef.current;
    const slotEl = coverSlotRef.current;
    if (!rootEl || !heroEl || !slotEl) return null;

    const rootRect = rootEl.getBoundingClientRect();
    const heroRect = heroEl.getBoundingClientRect();
    const slotRect = slotEl.getBoundingClientRect();
    const scaleX = rootEl.offsetWidth > 0 ? rootRect.width / rootEl.offsetWidth : 1;
    const scaleY = rootEl.offsetHeight > 0 ? rootRect.height / rootEl.offsetHeight : 1;
    const sx = scaleX > 0.05 ? scaleX : 1;
    const sy = scaleY > 0.05 ? scaleY : 1;

    const heroWidth = heroRect.width / sx;
    const heroHeight = heroRect.height / sy;
    const slotWidth = slotRect.width / sx;
    const slotHeight = slotRect.height / sy;
    if (heroWidth <= 0 || heroHeight <= 0 || slotWidth <= 0 || slotHeight <= 0) {
      return null;
    }

    const heroLeft = (heroRect.left - rootRect.left) / sx;
    const heroTop = (heroRect.top - rootRect.top) / sy;
    const heroCx = heroLeft + heroWidth / 2;
    const heroCy = heroTop + heroHeight / 2;
    const slotCx = (slotRect.left - rootRect.left) / sx + slotWidth / 2;
    const slotCy = (slotRect.top - rootRect.top) / sy + slotHeight / 2;

    const next: FlipGeometry = {
      heroLeft,
      heroTop,
      heroWidth,
      heroHeight,
      startX: slotCx - heroCx,
      startY: slotCy - heroCy,
      startScale: slotWidth / heroWidth,
    };

    setFlipGeom((prev) => {
      if (
        prev &&
        Math.abs(prev.heroLeft - next.heroLeft) < 0.25 &&
        Math.abs(prev.heroTop - next.heroTop) < 0.25 &&
        Math.abs(prev.heroWidth - next.heroWidth) < 0.25 &&
        Math.abs(prev.heroHeight - next.heroHeight) < 0.25 &&
        Math.abs(prev.startX - next.startX) < 0.25 &&
        Math.abs(prev.startY - next.startY) < 0.25 &&
        Math.abs(prev.startScale - next.startScale) < 0.002
      ) {
        return prev;
      }
      return next;
    });

    return next;
  }, []);

  React.useEffect(() => {
    if (coverGone || isOpening) return;
    const rootEl = rootRef.current;
    const heroEl = heroEnvelopeRef.current;
    const slotEl = coverSlotRef.current;
    if (!rootEl || !heroEl || !slotEl) return;

    const rafId = requestAnimationFrame(() => {
      measureFlipGeometry();
    });

    if (typeof ResizeObserver === "undefined") {
      return () => cancelAnimationFrame(rafId);
    }

    const ro = new ResizeObserver(() => {
      measureFlipGeometry();
    });
    ro.observe(rootEl);
    ro.observe(heroEl);
    ro.observe(slotEl);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [coverGone, isOpening, measureFlipGeometry]);

  const clearCoverTimer = React.useCallback(() => {
    if (coverTimerRef.current) {
      clearTimeout(coverTimerRef.current);
      coverTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    return () => {
      clearCoverTimer();
      if (openRafRef.current !== null) {
        cancelAnimationFrame(openRafRef.current);
        openRafRef.current = null;
      }
    };
  }, [clearCoverTimer]);

  // Đồng bộ 2 chiều isOpened từ props (không cắt ngang animation đang chạy)
  const parentOpenedRef = React.useRef(isOpened);
  React.useEffect(() => {
    if (parentOpenedRef.current === isOpened) return;
    parentOpenedRef.current = isOpened;
    if (coverOpeningRef.current) return;

    let active = true;
    clearCoverTimer();
    queueMicrotask(() => {
      if (!active || coverOpeningRef.current) return;
      if (!isOpened) {
        setCoverGone(false);
        setIsOpening(false);
      } else {
        setCoverGone(true);
        setIsOpening(false);
      }
    });
    return () => {
      active = false;
    };
  }, [isOpened, clearCoverTimer]);

  // Gift modal state & Parcel interaction (bộ SFX amber-parcel-gift Châu Âu cổ điển)
  const {
    stage: activeParcel,
    setStage: setActiveParcel,
    isOpening: isGiftOpening,
    isModalOpen: giftModalOpen,
    handleGiftClick,
    handleCloseModal,
  } = useGiftBoxInteraction({
    sfxType: "amber-parcel-gift",
    muted: sfxMuted,
  });

  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

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

  // Xử lý mở bìa FLIP 60fps 2.45s
  const handleOpenCard = React.useCallback(() => {
    if (coverOpeningRef.current || isOpening || coverGone) return;
    coverOpeningRef.current = true;

    // Gọi SFX trước CustomEvent (AGENTS.md §1.4)
    playCoverSfx("amber-secret-letter", { muted: sfxMuted });

    try {
      invitationExp?.triggerInvitationOpened();
    } catch { }

    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }

    const hadGeom = Boolean(flipGeom);
    measureFlipGeometry();

    const startOpening = () => {
      setIsOpening(true);
      const finishDelayMs = reduce ? 220 : 3640;
      clearCoverTimer();
      coverTimerRef.current = setTimeout(() => {
        coverOpeningRef.current = false;
        setCoverGone(true);
        setIsOpening(false);
        onOpenedChange?.(true);
        coverTimerRef.current = null;
        if (!contained && typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      }, finishDelayMs);
    };

    if (hadGeom) {
      startOpening();
    } else {
      if (openRafRef.current !== null) cancelAnimationFrame(openRafRef.current);
      openRafRef.current = requestAnimationFrame(() => {
        openRafRef.current = null;
        startOpening();
      });
    }
  }, [
    isOpening,
    coverGone,
    sfxMuted,
    invitationExp,
    flipGeom,
    measureFlipGeometry,
    reduce,
    clearCoverTimer,
    onOpenedChange,
    contained,
  ]);

  // Dữ liệu ngày cưới & đa lễ
  const visibleEvents = React.useMemo(() => getVisibleEvents(data), [data]);
  const targetEvent = React.useMemo(
    () => getNearestUpcomingEvent(visibleEvents, data.date),
    [visibleEvents, data.date],
  );
  const eventDateStr = targetEvent?.startsAt || data.date || "2027-03-20T10:00:00+07:00";
  const dateParts = formatWeddingDateParts(eventDateStr);

  // Hook đếm ngược chuẩn shared (AGENTS.md §4.1)
  const countdownRaw = useWeddingCountdown(eventDateStr);
  const countdown = countdownRaw ?? { days: 0, hours: 0, minutes: 0, seconds: 0, finished: false };

  // Lịch tháng cho AmberTearOffCalendar
  const calendarData = React.useMemo(() => {
    const d = new Date(eventDateStr);
    const year = Number.isNaN(d.getTime()) ? 2027 : d.getFullYear();
    const month = Number.isNaN(d.getTime()) ? 2 : d.getMonth();
    const fallbackDay = dateParts.day ? parseInt(dateParts.day, 10) : 20;

    const weddingDaysSet = new Set<number>();
    visibleEvents.forEach((evt) => {
      const dStr = evt.startsAt || data.date;
      if (!dStr) return;
      const evtD = new Date(dStr);
      if (!Number.isNaN(evtD.getTime()) && evtD.getFullYear() === year && evtD.getMonth() === month) {
        weddingDaysSet.add(evtD.getDate());
      }
    });
    if (weddingDaysSet.size === 0) {
      weddingDaysSet.add(fallbackDay);
    }

    const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Array<{ day: number | null; isWedding: boolean }> = [];
    for (let i = 0; i < firstDayIndex; i++) days.push({ day: null, isWedding: false });
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, isWedding: weddingDaysSet.has(i) });
    }

    return {
      monthText: String(month + 1).padStart(2, "0"),
      yearText: String(year),
      dotDateText: `${dateParts.day || "20"}.${dateParts.month || "03"}.${dateParts.year || "2027"}`,
      days,
    };
  }, [eventDateStr, visibleEvents, data.date, dateParts.day, dateParts.month, dateParts.year]);

  // Google Calendar link an toàn
  const calendarHref = React.useMemo(() => {
    const d = new Date(eventDateStr);
    const validStart = Number.isNaN(d.getTime()) ? new Date("2027-03-20T10:00:00+07:00") : d;
    const startIso = validStart.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endIso = new Date(validStart.getTime() + 3 * 3600 * 1000)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");
    const gName = data.couple?.groomName || "Huy Hoàng";
    const bName = data.couple?.brideName || "Thùy Dung";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Đám cưới ${gName} & ${bName}`,
    )}&dates=${startIso}/${endIso}&details=${encodeURIComponent(
      `Trân trọng kính mời đến dự lễ cưới của ${gName} & ${bName}`,
    )}&location=${encodeURIComponent(targetEvent?.venueAddress || "")}`;
  }, [eventDateStr, data.couple?.groomName, data.couple?.brideName, targetEvent?.venueAddress]);

  const groomName = data.couple?.groomName || "Huy Hoàng";
  const brideName = data.couple?.brideName || "Thùy Dung";
  const groomFullName = data.couple?.groomFullName || groomName;
  const brideFullName = data.couple?.brideFullName || brideName;
  const coupleDisplayName = `${groomName} & ${brideName}`;
  const inviteEyebrow = guestName?.trim() || data.ui?.defaultGuestName || "Quý Khách Quý Mến";

  const heroPhotoUrl = data.photos?.heroUrl || "/photos/hero2.webp";

  const plan: WeddingPlan = (data.plan as WeddingPlan) || "free";
  const isFree = plan === "free";
  const galleryLimit = plan === "free" ? 5 : plan === "pro" ? 30 : 50;
  const rawAlbum: TemplatePhotoItem[] = data.photos?.gallery || [];
  const albumPhotos = rawAlbum.slice(0, galleryLimit);
  const [activePhotoIdx, setActivePhotoIdx] = React.useState<number>(0);

  const timelineItems = getTimeline(data);
  const dressColors = getDressColors(data);

  const splitParents = React.useCallback((text?: string | null) => {
    if (!text) return [];
    return text
      .split("&")
      .map((s) => s.trim())
      .filter(Boolean);
  }, []);

  const groomParentsList = splitParents(data.couple?.groomParents);
  const brideParentsList = splitParents(data.couple?.brideParents);

  const hiddenSections = React.useMemo(
    () => new Set(data.hiddenSections ?? []),
    [data.hiddenSections],
  );
  const sectionOrder = React.useMemo(
    () => (data.sectionOrder?.length ? data.sectionOrder : CANONICAL_SECTION_ORDER),
    [data.sectionOrder],
  );
  const orderOf = React.useCallback(
    (key: string) => {
      const idx = sectionOrder.indexOf(key);
      return idx === -1 ? 99 : idx;
    },
    [sectionOrder],
  );

  const isBrideFirst = data.hostFirst === "bride";
  const isStoryVisible = !isFree && !hiddenSections.has("story") && !hiddenSections.has("loveStory");
  const storyMilestones: StoryMilestone[] = React.useMemo(() => {
    if (data.story && data.story.length > 0) {
      return data.story;
    }
    return DEFAULT_STORY_MILESTONES;
  }, [data.story]);

  const effectiveWeddingSlug = weddingSlug || data.weddingSlug;

  const renderMusicControl = () => {
    if (externalMusicControl || !data.music?.src || hiddenSections.has("music")) return null;
    return (
      <LiveMusicFloatingButton
        src={data.music.src}
        title={data.music.title || "Giai điệu Mật Thư"}
        visible={coverGone}
        tone="minbrown"
      />
    );
  };

  return (
    <div
      ref={rootRef}
      data-template-id="ho-phach-mat-thu"
      className={cn(
        "relative w-full text-[#5A463A] selection:bg-[#B68B59] selection:text-white antialiased",
        contained
          ? !coverGone
            ? "h-full overflow-hidden"
            : "min-h-full"
          : !coverGone
            ? "h-screen-dvh max-h-full overflow-hidden"
            : "min-h-screen overflow-x-hidden",
      )}
      style={{
        backgroundColor: PARCHMENT_BG,
        fontFamily: BODY_FONT,
      }}
    >
      {/* ============================================================
          1. MÀN BÌA MỞ THIỆP FLIP 60FPS — PHONG THƯ NÂU CỔ ĐIỂN
          ============================================================ */}
      {!coverGone && (
        <div
          key="envelope-cover"
          className={cn(
            "absolute inset-0 z-50 w-full max-w-full overflow-hidden flex flex-col items-center justify-center px-4 py-4 select-none",
            isOpening && "pointer-events-none",
          )}
        >
          {/* Phông nền bìa riêng — chỉ mờ dần lớp backdrop ở pha cuối để bàn giao mượt vào Hero */}
          <m.div
            initial={false}
            animate={isOpening ? { opacity: 0 } : { opacity: 1 }}
            transition={
              reduce
                ? { duration: 0.16 }
                : { delay: isOpening ? 2.22 : 0, duration: 1.24, ease: "easeInOut" }
            }
            className="pointer-events-none absolute inset-0 z-0"
            style={{
              backgroundImage:
                viewport === "desktop"
                  ? "url(/templates/ho-phach-mat-thu/background.webp)"
                  : "url(/templates/ho-phach-mat-thu/background-mobile.webp)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              willChange: "opacity",
            }}
            aria-hidden="true"
          />

          {/* Cánh lá khô & bụi hổ phách rơi chậm (dừng ngay khi bắt đầu mở bìa) */}
          <HerbLeavesFalling count={14} paused={isOpening} />

          {/* Khung định vị trung tâm đo tọa độ FLIP (không chứa node tương tác để tránh unmount mất ref bấm) */}
          <div
            ref={coverSlotRef}
            className="relative w-full max-w-[340px] sm:max-w-[380px] mx-auto aspect-[640/709] my-auto pointer-events-none"
            aria-hidden="true"
          />

          {/* Khối Phong Thư FLIP 1-1 luôn gắn cố định trong cây DOM để nút bấm không bị detach khi đo FLIP */}
          <m.div
            data-cover-envelope="true"
            initial={false}
            animate={
              !flipGeom
                ? { x: 0, y: 0, scale: 1, opacity: 0 }
                : isOpening && !reduce
                  ? { x: 0, y: 0, scale: 1, opacity: 1 }
                  : { x: flipGeom.startX, y: flipGeom.startY, scale: flipGeom.startScale, opacity: 1 }
            }
            transition={
              reduce
                ? { duration: isOpening ? 0.16 : 0 }
                : isOpening
                  ? { delay: 0.12, duration: 1.28, ease: [0.19, 1, 0.22, 1] }
                  : { duration: 0 }
            }
            className={cn(
              "absolute z-20",
              !flipGeom && "inset-x-0 mx-auto w-[calc(100%-2rem)] max-w-[340px] sm:max-w-[380px] aspect-[640/709]",
            )}
            style={
              flipGeom
                ? {
                  left: flipGeom.heroLeft,
                  top: flipGeom.heroTop,
                  width: flipGeom.heroWidth,
                  height: flipGeom.heroHeight,
                  transformOrigin: "center center",
                  willChange: "transform, opacity",
                }
                : {
                  top: "50%",
                  marginTop: "-170px",
                  transformOrigin: "center center",
                  willChange: "transform, opacity",
                }
            }
          >
            <AmberEnvelopeHeroStage
              mode="cover"
              isOpening={isOpening}
              reduce={reduce}
              heroPhotoUrl={heroPhotoUrl}
              groomName={groomName}
              brideName={brideName}
              inviteEyebrow={inviteEyebrow}
              onOpenCover={handleOpenCard}
            />
          </m.div>
        </div>
      )}

      {/* ============================================================
          2. RUỘT THIỆP — CANONICAL FLEX COLUMN + CÁC KHỐI ĐỒ HỌA MƯỢT 60FPS
          - Hero đứng sẵn trong DOM (opacity-0 trước coverGone) để đo FLIP chính xác
          - Các section dưới trì hoãn mount tới khi coverGone === true (0ms reflow)
          ============================================================ */}
      <AmberScrollContext.Provider value={scrollContextValue}>
        <div className="w-full flex flex-col items-center min-h-screen">
          {coverGone && renderMusicControl()}

          <main className="w-full max-w-[840px] px-4 pt-11 pb-8 sm:py-14 flex flex-col gap-12 sm:gap-16">
            {/* ============================================================
              HERO (order: -1) — "MẬT THƯ ĐÃ MỞ & ẢNH CẶP ĐÔI POLAROID"
              ============================================================ */}
            <section
              style={{ order: -1 }}
              className="relative w-full flex flex-col items-center text-center pt-4"
            >
              <m.span
                initial={false}
                animate={
                  coverGone || isOpening
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 10 }
                }
                transition={
                  reduce
                    ? { duration: 0.16 }
                    : { delay: isOpening ? 2.24 : 0, duration: 0.95, ease: EASE_VINTAGE }
                }
                className="text-[11px] sm:text-xs uppercase tracking-[0.16em] text-[#7D695C] font-semibold mb-10 sm:mb-12"
                style={{ fontFamily: BODY_FONT }}
              >
                {data.ui?.eyebrow || "Thiệp mời tham dự lễ cưới"}
              </m.span>

              {/* Khung phong thư Hero trùng khớp 100% tọa độ data-cover-envelope */}
              <div
                className={cn(
                  "w-full max-w-[340px] sm:max-w-[380px] mx-auto my-2",
                  !coverGone && "opacity-0 pointer-events-none",
                )}
              >
                <AmberEnvelopeHeroStage
                  ref={heroEnvelopeRef}
                  mode="hero"
                  reduce={reduce}
                  heroPhotoUrl={heroPhotoUrl}
                  groomName={groomName}
                  brideName={brideName}
                  inviteEyebrow={inviteEyebrow}
                  onHeroPhotoLoad={measureFlipGeometry}
                />
              </div>

              {/* Tên cặp đôi 3 dòng nghệ thuật & Dải phân cách */}
              <m.div
                initial={false}
                animate={
                  coverGone || isOpening
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 14 }
                }
                transition={
                  reduce
                    ? { duration: 0.16 }
                    : { delay: isOpening ? 2.48 : 0, duration: 1.02, ease: EASE_VINTAGE }
                }
                className="w-full flex flex-col items-center"
              >
                <div className="mt-6 flex flex-col items-center">
                  <h1
                    className="text-3xl sm:text-4xl text-[#4E382C] font-normal tracking-wide"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    <span className="block">{groomFullName}</span>
                    <span className="block text-[#B68B59] text-2xl sm:text-3xl my-1 font-serif italic">
                      &amp;
                    </span>
                    <span className="block">{brideFullName}</span>
                  </h1>
                </div>

                <div className="w-full max-w-[280px] sm:max-w-[340px] mx-auto mt-6">
                  <img
                    loading="eager"
                    decoding="async"
                    src="/templates/ho-phach-mat-thu/divider-vintage.webp"
                    alt="Đường phân cách cổ điển"
                    className="w-full object-contain opacity-80"
                  />
                </div>
              </m.div>
            </section>

            {coverGone && (
              <>
                {/* Section 1: Thông tin gia đình (family) */}
                {!hiddenSections.has("family") && (
                  <div style={{ order: orderOf("family") }}>
                    <AmberReveal>
                      <section className="relative w-full rounded-2xl bg-[#EDE2D3]/70 border border-[#D5C4B0] p-6 sm:p-10 shadow-sm overflow-hidden">
                        <img
                          loading="lazy"
                          decoding="async"
                          src="/templates/ho-phach-mat-thu/sprig-olive.webp"
                          alt=""
                          aria-hidden="true"
                          className="absolute -left-6 -top-6 w-28 sm:w-36 object-contain pointer-events-none z-0 opacity-40 -rotate-12"
                        />
                        <img
                          loading="lazy"
                          decoding="async"
                          src="/templates/ho-phach-mat-thu/sprig-gypso.webp"
                          alt=""
                          aria-hidden="true"
                          className="absolute -right-6 -bottom-6 w-28 sm:w-36 object-contain pointer-events-none z-0 opacity-40 rotate-12"
                        />

                        <div className="relative z-10 flex flex-col items-center text-center">
                          <h2
                            className="text-2xl sm:text-3xl text-[#4E382C] font-normal mb-6"
                            style={{ fontFamily: TITLE_FONT }}
                          >
                            Thông Tin Gia Đình
                          </h2>

                          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-6 sm:items-stretch">
                            {isBrideFirst ? (
                              <>
                                {/* Nhà Gái */}
                                <AmberReveal delay={0.14} distance={24} duration={1.05} className="sm:h-full">
                                  <div className="sm:h-full flex flex-col items-center text-center p-5 rounded-xl bg-[#FBF8F3]/85 border border-[#DFCBB5] shadow-xs">
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
                                    <div className="sm:mt-auto pt-3 border-t border-[#B68B59]/25 w-full">
                                      <span className="text-xs uppercase tracking-wider text-[#7D695C] block mb-1">
                                        {data.couple?.brideTitle || "Cô dâu"}
                                      </span>
                                      <span
                                        className="text-lg sm:text-xl text-[#4E382C] font-medium"
                                        style={{ fontFamily: TITLE_FONT }}
                                      >
                                        {brideFullName}
                                      </span>
                                    </div>
                                  </div>
                                </AmberReveal>

                                {/* Nhà Trai */}
                                <AmberReveal delay={0.28} distance={24} duration={1.05} className="sm:h-full">
                                  <div className="sm:h-full flex flex-col items-center text-center p-5 rounded-xl bg-[#FBF8F3]/85 border border-[#DFCBB5] shadow-xs">
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
                                    <div className="sm:mt-auto pt-3 border-t border-[#B68B59]/25 w-full">
                                      <span className="text-xs uppercase tracking-wider text-[#7D695C] block mb-1">
                                        {data.couple?.groomTitle || "Chú rể"}
                                      </span>
                                      <span
                                        className="text-lg sm:text-xl text-[#4E382C] font-medium"
                                        style={{ fontFamily: TITLE_FONT }}
                                      >
                                        {groomFullName}
                                      </span>
                                    </div>
                                  </div>
                                </AmberReveal>
                              </>
                            ) : (
                              <>
                                {/* Nhà Trai */}
                                <AmberReveal delay={0.14} distance={24} duration={1.05} className="sm:h-full">
                                  <div className="sm:h-full flex flex-col items-center text-center p-5 rounded-xl bg-[#FBF8F3]/85 border border-[#DFCBB5] shadow-xs">
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
                                    <div className="sm:mt-auto pt-3 border-t border-[#B68B59]/25 w-full">
                                      <span className="text-xs uppercase tracking-wider text-[#7D695C] block mb-1">
                                        {data.couple?.groomTitle || "Chú rể"}
                                      </span>
                                      <span
                                        className="text-lg sm:text-xl text-[#4E382C] font-medium"
                                        style={{ fontFamily: TITLE_FONT }}
                                      >
                                        {groomFullName}
                                      </span>
                                    </div>
                                  </div>
                                </AmberReveal>

                                {/* Nhà Gái */}
                                <AmberReveal delay={0.28} distance={24} duration={1.05} className="sm:h-full">
                                  <div className="sm:h-full flex flex-col items-center text-center p-5 rounded-xl bg-[#FBF8F3]/85 border border-[#DFCBB5] shadow-xs">
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
                                    <div className="sm:mt-auto pt-3 border-t border-[#B68B59]/25 w-full">
                                      <span className="text-xs uppercase tracking-wider text-[#7D695C] block mb-1">
                                        {data.couple?.brideTitle || "Cô dâu"}
                                      </span>
                                      <span
                                        className="text-lg sm:text-xl text-[#4E382C] font-medium"
                                        style={{ fontFamily: TITLE_FONT }}
                                      >
                                        {brideFullName}
                                      </span>
                                    </div>
                                  </div>
                                </AmberReveal>
                              </>
                            )}
                          </div>
                        </div>
                      </section>
                    </AmberReveal>
                  </div>
                )}

                {/* Section 2: Lễ Cưới & Địa Điểm (map) */}
                {!hiddenSections.has("map") && (
                  <div style={{ order: orderOf("map") }}>
                    <AmberReveal>
                      <section className="relative w-full rounded-2xl bg-[#FBF8F3] border border-[#DFCBB5] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center">
                        <h2
                          className="text-2xl sm:text-3xl text-[#4E382C] font-normal mb-2"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          Lễ Cưới &amp; Địa Điểm
                        </h2>

                        <div
                          className={cn(
                            "grid gap-6 w-full mt-5",
                            visibleEvents.length > 1
                              ? "grid-cols-1 md:grid-cols-2 text-left"
                              : "max-w-xl mx-auto text-center",
                          )}
                        >
                          {visibleEvents.map((evt, idx) => {
                            const evtDateStr = evt.startsAt || data.date || "2027-03-20T10:00:00+07:00";
                            const evtDateParts = formatWeddingDateParts(evtDateStr);
                            const evtLunar = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : "";
                            const directionsUrl = getEventDirectionsUrl(evt);

                            return (
                              <div
                                key={evt.id || `event-${idx}`}
                                className="md:h-full rounded-xl border border-[#DFCBB5] bg-[#EDE2D3]/40 p-5 sm:p-6 flex flex-col items-center text-center space-y-3"
                              >
                                  <h3
                                    className="text-xl sm:text-2xl text-[#4E382C] font-normal"
                                    style={{ fontFamily: TITLE_FONT }}
                                  >
                                    {evt.title || (idx === 0 ? "Hôn Lễ Thành Hôn" : `Lễ Cưới ${idx + 1}`)}
                                  </h3>

                                  {/* Thanh ngày ngang THỨ | NGÀY | THÁNG | NĂM */}
                                  <div className="w-full max-w-[380px] my-2 py-2.5 px-4 rounded-xl border border-[#B68B59]/40 bg-[#FBF8F3] flex items-center justify-around text-[#4E382C]">
                                    <div className="flex flex-col items-center">
                                      <span className="text-[10px] uppercase tracking-widest text-[#7D695C]">Thứ</span>
                                      <span className="text-sm sm:text-base font-serif font-bold">
                                        {evtDateParts.weekday}
                                      </span>
                                    </div>
                                    <div className="h-6 w-[1px] bg-[#B68B59]/40" />
                                    <div className="flex flex-col items-center">
                                      <span className="text-[10px] uppercase tracking-widest text-[#7D695C]">Ngày</span>
                                      <span className="text-xl sm:text-2xl font-serif font-bold text-[#B68B59]">
                                        {evtDateParts.day}
                                      </span>
                                    </div>
                                    <div className="h-6 w-[1px] bg-[#B68B59]/40" />
                                    <div className="flex flex-col items-center">
                                      <span className="text-[10px] uppercase tracking-widest text-[#7D695C]">Tháng</span>
                                      <span className="text-sm sm:text-base font-serif font-bold">
                                        {evtDateParts.month}
                                      </span>
                                    </div>
                                    <div className="h-6 w-[1px] bg-[#B68B59]/40" />
                                    <div className="flex flex-col items-center">
                                      <span className="text-[10px] uppercase tracking-widest text-[#7D695C]">Năm</span>
                                      <span className="text-sm sm:text-base font-serif font-bold">
                                        {evtDateParts.year}
                                      </span>
                                    </div>
                                  </div>

                                  {evtLunar && (
                                    <p className="text-xs text-[#7D695C] italic">(Nhằm {evtLunar})</p>
                                  )}

                                  <div className="flex flex-col items-center gap-1.5 w-full pt-1">
                                    {evtDateParts.time && (
                                      <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[#4E382C] font-medium">
                                        <Clock className="w-4 h-4 text-[#B68B59]" />
                                        <span>Vào lúc {evtDateParts.time}</span>
                                      </div>
                                    )}
                                    {evt.venueName && (
                                      <h4
                                        className="text-base sm:text-lg text-[#4E382C] font-semibold mt-1"
                                        style={{ fontFamily: TITLE_FONT }}
                                      >
                                        {evt.venueName}
                                      </h4>
                                    )}
                                    {evt.venueAddress && (
                                      <p className="text-xs text-[#5A463A] leading-relaxed">
                                        {evt.venueAddress}
                                      </p>
                                    )}

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
                                          `${evt.title || "Lễ Cưới"}: ${groomName} & ${brideName}`,
                                        )}&dates=${evtDateStr.replace(/-|:|\./g, "").slice(0, 8)}T040000Z/${evtDateStr.replace(/-|:|\./g, "").slice(0, 8)}T080000Z&details=${encodeURIComponent(
                                          `Trân trọng kính mời tham dự ${evt.title || "lễ cưới"} của ${groomName} & ${brideName}.`,
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
                    </AmberReveal>
                  </div>
                )}

                {/* Section 3: Chuyện Chúng Mình (story — Standard Edition) */}
                {isStoryVisible && (
                  <div style={{ order: orderOf("story") }}>
                    <AmberReveal>
                      <section className="relative w-full rounded-2xl bg-[#EDE2D3]/65 border border-[#D5C4B0] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center">
                        <h2
                          className="text-2xl sm:text-3xl text-[#4E382C] font-normal mb-7"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          Chuyện Chúng Mình
                        </h2>

                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
                          {storyMilestones.map((item, idx) => (
                            <AmberReveal
                              key={idx}
                              delay={0.14 + (idx % 2) * 0.18}
                              distance={26}
                              duration={1.05}
                              className="h-full"
                            >
                              <div className="h-full rounded-xl bg-[#FBF8F3] border border-[#B68B59]/45 p-5 sm:p-6 shadow-xs flex flex-col gap-3">
                                <div className="flex flex-wrap items-center gap-3">
                                  {item.year ? (
                                    <span
                                      className="inline-block px-4 py-1.5 rounded-full text-xl sm:text-2xl leading-none font-bold bg-[#4E382C] text-[#F6EFE6] border border-[#B68B59] shadow-xs tracking-wide shrink-0"
                                      style={{ fontFamily: TITLE_FONT }}
                                    >
                                      {item.year}
                                    </span>
                                  ) : null}
                                  <h3
                                    className="text-lg text-[#4E382C] font-semibold"
                                    style={{ fontFamily: TITLE_FONT }}
                                  >
                                    {item.title}
                                  </h3>
                                </div>
                                <p className="text-xs sm:text-sm text-[#5A463A] leading-relaxed italic">
                                  &ldquo;{item.content}&rdquo;
                                </p>
                              </div>
                            </AmberReveal>
                          ))}
                        </div>
                      </section>
                    </AmberReveal>
                  </div>
                )}

                {/* Section 4: Lịch Trình & Trang Phục (dresscode) */}
                {!hiddenSections.has("dresscode") && (
                  <div style={{ order: orderOf("dresscode") }}>
                    <AmberReveal>
                      <section className="relative w-full rounded-2xl bg-[#EDE2D3]/60 border border-[#D5C4B0] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center">
                        <h2
                          className="text-2xl sm:text-3xl text-[#4E382C] font-normal mb-8"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          Lịch Trình &amp; Trang Phục
                        </h2>

                        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-10">
                          {dressColors.map((hex, idx) => (
                            <AmberReveal
                              key={idx}
                              delay={0.14 + idx * 0.12}
                              distance={18}
                              duration={0.95}
                              initialScale={0.82}
                            >
                              <div
                                className="w-11 h-11 sm:w-14 sm:h-14 rounded-full shadow-md border-2 border-[#FAF6F0] transition-transform hover:scale-110"
                                style={{ backgroundColor: hex }}
                                title={hex}
                                aria-label={`Màu trang phục ${idx + 1}`}
                              />
                            </AmberReveal>
                          ))}
                        </div>

                        <div className="w-full max-w-[480px] flex flex-col items-center">
                          <span className="text-[11px] uppercase tracking-widest text-[#B68B59] font-semibold mb-6">
                            LỊCH TRÌNH HÔN LỄ
                          </span>

                          <div className="relative w-full pl-6 sm:pl-8 border-l-2 border-[#B68B59]/40 flex flex-col gap-6 text-left">
                            {timelineItems.map((item, idx) => (
                              <AmberReveal
                                key={idx}
                                delay={0.08 + Math.min(idx, 2) * 0.12}
                                distance={22}
                                duration={0.98}
                                className="w-full"
                              >
                                <div className="relative flex flex-col gap-1">
                                  <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-3.5 h-3.5 rounded-full bg-[#4E382C] border-2 border-[#FAF6F0] shadow-sm" />
                                  <span className="text-xs sm:text-sm font-serif font-bold text-[#B68B59]">
                                    {item.time}
                                  </span>
                                  <span className="text-xs sm:text-sm text-[#5A463A] leading-relaxed">
                                    {item.label}
                                  </span>
                                </div>
                              </AmberReveal>
                            ))}
                          </div>
                        </div>
                      </section>
                    </AmberReveal>
                  </div>
                )}

                {/* Section 5: Lịch Ngày Vui (Xé Tờ Lịch Page-Curl 2D) & Đếm Ngược (calendar) */}
                {!hiddenSections.has("calendar") && (
                  <div style={{ order: orderOf("calendar") }}>
                    <AmberReveal>
                      <section className="relative w-full rounded-2xl bg-[#EDE2D3]/60 border border-[#D5C4B0] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center">
                        <h2
                          className="text-2xl sm:text-3xl text-[#4E382C] font-normal mb-6"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          Lịch Ngày Vui &amp; Đếm Ngược
                        </h2>

                        <AmberReveal delay={0.14} distance={26} duration={1.08} className="w-full flex justify-center">
                          <AmberTearOffCalendar
                            monthText={calendarData.monthText}
                            yearText={calendarData.yearText}
                            dotDateText={calendarData.dotDateText}
                            calendarDays={calendarData.days}
                            muted={sfxMuted}
                            reducedMotion={reduce}
                          />
                        </AmberReveal>

                        <div className="w-full max-w-[420px] grid grid-cols-4 gap-2 sm:gap-3 text-center mb-6">
                          {[
                            { label: "Ngày", val: padCountdownUnit(countdown.days) },
                            { label: "Giờ", val: padCountdownUnit(countdown.hours) },
                            { label: "Phút", val: padCountdownUnit(countdown.minutes) },
                            { label: "Giây", val: padCountdownUnit(countdown.seconds) },
                          ].map((item, idx) => (
                            <AmberReveal
                              key={idx}
                              delay={0.12 + idx * 0.12}
                              distance={20}
                              duration={0.95}
                              className="h-full"
                            >
                              <div className="h-full flex flex-col items-center justify-center p-3 rounded-xl bg-[#FBF8F3] border border-[#DFCBB5] shadow-xs">
                                <span
                                  className="text-xl sm:text-2xl font-bold text-[#4E382C]"
                                  style={{ fontFamily: TITLE_FONT }}
                                >
                                  {item.val}
                                </span>
                                <span className="text-[10px] sm:text-xs text-[#7D695C] uppercase tracking-wider mt-1">
                                  {item.label}
                                </span>
                              </div>
                            </AmberReveal>
                          ))}
                        </div>

                        <AmberReveal delay={0.22} distance={18} duration={0.95}>
                          <a
                            href={calendarHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-6 py-2.5 rounded-full bg-[#FAF6F0] hover:bg-[#FFFFFF] border border-[#B68B59] text-xs font-serif tracking-widest text-[#4E382C] uppercase shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5 text-[#B68B59]" />
                            <span>Thêm Vào Lịch Của Bạn</span>
                          </a>
                        </AmberReveal>
                      </section>
                    </AmberReveal>
                  </div>
                )}

                {/* Section 6: Hộp Quà Mừng Cưới 3 Trạng Thái (gift) */}
                {!hiddenSections.has("gift") && (
                  <div style={{ order: orderOf("gift") }}>
                    <AmberReveal>
                      <section className="relative w-full rounded-2xl bg-[#FBF8F3] border border-[#DFCBB5] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center">
                        <h2
                          className="text-2xl sm:text-3xl text-[#4E382C] font-normal mb-6"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          Hộp Quà Mừng Cưới
                        </h2>

                        <img
                          loading="lazy"
                          decoding="async"
                          src="/templates/ho-phach-mat-thu/gift-active.webp"
                          className="hidden"
                          aria-hidden="true"
                          alt=""
                        />

                        <AmberReveal delay={0.16} distance={24} duration={1.08} className="w-full flex flex-col items-center">
                          <div
                            className="relative w-56 sm:w-64 aspect-[360/274] my-2 cursor-pointer transition-transform hover:scale-105 active:scale-95 group"
                            onMouseEnter={() => !isGiftOpening && setActiveParcel("glow")}
                            onMouseLeave={() =>
                              !isGiftOpening && activeParcel !== "open" && setActiveParcel("normal")
                            }
                            onClick={handleGiftClick}
                          >
                            <img
                              loading="lazy"
                              decoding="async"
                              src={`/templates/ho-phach-mat-thu/gift-${activeParcel === "open" || activeParcel === "active"
                                ? "active"
                                : activeParcel === "glow" || activeParcel === "hover"
                                  ? "hover"
                                  : "normal"
                                }.webp`}
                              alt="Bưu Kiện Quà Cưới"
                              className="w-full h-full object-contain drop-shadow-xl"
                            />

                            <div className="absolute inset-0 rounded-2xl bg-radial from-[#D8B78E]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          </div>

                          <button
                            type="button"
                            disabled={isGiftOpening}
                            onClick={handleGiftClick}
                            className="mt-6 px-7 py-2.5 rounded-full bg-[#4E382C] hover:bg-[#36251C] text-[#F6EFE6] border border-[#B68B59] text-xs font-serif tracking-widest uppercase shadow-md transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer disabled:opacity-80"
                          >
                            <span>Mở Hộp Mừng Cưới</span>
                          </button>
                        </AmberReveal>
                      </section>
                    </AmberReveal>
                  </div>
                )}

                {/* Section 7: Form xác nhận tham dự RSVP & Sổ lưu bút (rsvp) */}
                {!hiddenSections.has("rsvp") && (
                  <div style={{ order: orderOf("rsvp") }}>
                    <AmberReveal>
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
                    </AmberReveal>
                  </div>
                )}

                {/* Section 8: Album Ảnh Cưới (album) */}
                {!hiddenSections.has("album") && albumPhotos.length > 0 && (
                  <div style={{ order: orderOf("album") }}>
                    <AmberReveal>
                      <section className="relative w-full rounded-2xl bg-[#FBF8F3] border border-[#DFCBB5] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center">
                        <h2
                          className="text-2xl sm:text-3xl text-[#4E382C] font-normal mb-8"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          Album Ảnh Cưới
                        </h2>

                        <AmberReveal delay={0.16} distance={24} duration={1.08} className="w-full flex flex-col items-center">
                          <div className="relative w-full max-w-[520px] aspect-[4/3] sm:aspect-[16/10] rounded-xl overflow-hidden shadow-xl border-4 border-[#FAF6F0]">
                            <img
                              loading="lazy"
                              decoding="async"
                              src={albumPhotos[activePhotoIdx]?.url}
                              alt="Ảnh kỷ niệm"
                              className="w-full h-full object-cover transition-all duration-500 hover:scale-105 cursor-pointer"
                              onClick={() => setLightboxIndex(activePhotoIdx)}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setActivePhotoIdx((prev) => (prev - 1 + albumPhotos.length) % albumPhotos.length)
                              }
                              aria-label="Ảnh trước"
                              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#4E382C]/90 hover:bg-[#4E382C] text-[#F6EFE6] flex items-center justify-center transition-all shadow-md cursor-pointer"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setActivePhotoIdx((prev) => (prev + 1) % albumPhotos.length)}
                              aria-label="Ảnh sau"
                              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-[#4E382C]/90 hover:bg-[#4E382C] text-[#F6EFE6] flex items-center justify-center transition-all shadow-md cursor-pointer"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>

                            <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-[#4E382C]/90 text-[#F6EFE6] text-xs font-serif tracking-widest">
                              {activePhotoIdx + 1} / {albumPhotos.length}
                            </div>
                          </div>

                          <div className="w-full max-w-[520px] flex items-center gap-2 overflow-x-auto py-4 mt-2 no-scrollbar">
                            {albumPhotos.map((p, idx) => (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => setActivePhotoIdx(idx)}
                                className={cn(
                                  "relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer",
                                  activePhotoIdx === idx
                                    ? "border-[#B68B59] scale-105 shadow-md"
                                    : "border-transparent opacity-60 hover:opacity-100",
                                )}
                              >
                                <img loading="lazy" decoding="async" src={p.url} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        </AmberReveal>
                      </section>
                    </AmberReveal>
                  </div>
                )}

                {/* Section 9: QR Album chia sẻ ảnh tiệc cưới (albumQr — Standard Edition) */}
                {!isFree && !hiddenSections.has("albumQr") && effectiveWeddingSlug && (
                  <div style={{ order: orderOf("albumQr") }}>
                    <AmberReveal>
                      <section className="relative w-full rounded-2xl bg-[#FBF8F3] border border-[#DFCBB5] p-6 sm:p-10 shadow-sm flex flex-col items-center text-center">
                        <GuestAlbumQr
                          slug={effectiveWeddingSlug}
                          accentColor={ESPRESSO_WALNUT}
                          textColor={ESPRESSO_WALNUT}
                          mutedColor="#7D695C"
                        />
                      </section>
                    </AmberReveal>
                  </div>
                )}

                {/* FOOTER (order: 999) */}
                <footer
                  style={{ order: 999 }}
                  className="w-full pt-8 pb-12 border-t border-[#B68B59]/30"
                >
                  <AmberReveal distance={22} duration={1.05} className="w-full flex flex-col items-center text-center">
                    <div className="w-full max-w-[240px] sm:max-w-[300px] mb-4">
                      <img
                        loading="lazy"
                        decoding="async"
                        src="/templates/ho-phach-mat-thu/divider-vintage.webp"
                        alt="Đường phân cách"
                        className="w-full object-contain opacity-75"
                      />
                    </div>
                    <h4
                      className="text-xl sm:text-2xl font-normal mb-2"
                      style={{ fontFamily: TITLE_FONT, color: AMBER_BRONZE }}
                    >
                      Chân Thành Cảm Ơn
                    </h4>
                    <p className="text-xs sm:text-sm text-[#7D695C] italic max-w-[420px] leading-relaxed">
                      Sự hiện diện và lời chúc phúc chân thành của quý vị là niềm vinh hạnh to lớn cho gia đình chúng tôi.
                    </p>
                  </AmberReveal>
                </footer>
              </>
            )}
          </main>
        </div>
      </AmberScrollContext.Provider>

      {/* MODALS */}
      <GiftModal
        open={giftModalOpen}
        onClose={handleCloseModal}
        gift={data.gift}
        plan={plan}
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
