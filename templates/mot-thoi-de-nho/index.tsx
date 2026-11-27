"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Compass,
  MapPin,
  ExternalLink,
  RotateCw,
} from "lucide-react";
import {
  m,
  useReducedMotion,
  AnimatePresence,
} from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { useInvitationExperience } from "@/components/invitation/InvitationExperienceProvider";
import { playCoverSfx, playInteractionSfx } from "@/lib/sfx";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { WeddingEvent, TemplatePhotoItem, WeddingPlan } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import { useWeddingCountdown, padCountdownUnit } from "../shared/useCountdown";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: MỘT THỜI ĐỂ NHỚ (mot-thoi-de-nho)
   - Kem giấy cũ ngả vàng: #F5EFE2
   - Be ngả vàng thẻ giấy: #EDE3CE / #FAF6EC
   - Nâu kraft: #C4A484 / #B99976
   - Nâu đất chữ chính & mực viết tay: #4A3728
   - Nâu đất chữ phụ: #5E493A
   - Nâu đỏ trầm dấu sáp / nút chính: #7C3629 (hover #642A1F)
   ============================================================ */

const COLOR_BG = "#F5EFE2";
const COLOR_CARD = "#FAF6EC";
const COLOR_CARD_ALT = "#EDE3CE";
const COLOR_TEXT_MAIN = "#4A3728";
const COLOR_TERRACOTTA = "#7C3629";

const FONT_SCRIPT = 'var(--font-dancing-script), "Dancing Script", cursive';
const FONT_SERIF = 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif';
const FONT_BODY = 'var(--font-lora), var(--font-be-vietnam), "Lora", "Be Vietnam Pro", serif';

const PAPER_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const ZOOM_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const VIEWPORT_ONCE = { once: true, amount: "some", margin: "0px 0px -56px 0px" } as const;

const DEFAULT_DRESS_CODE = [
  { name: "Kem ngà", color: "#F5EFE2" },
  { name: "Be cổ điển", color: "#EDE3CE" },
  { name: "Nâu kraft", color: "#C4A484" },
  { name: "Nâu đỏ sáp", color: "#7C3629" },
];

const AMBIENT_DUST_SEEDS = [
  { id: 1, left: "12%", top: "18%", size: 5, dur: 6.2, delay: 0.2 },
  { id: 2, left: "82%", top: "14%", size: 4, dur: 7.1, delay: 0.9 },
  { id: 3, left: "24%", top: "72%", size: 6, dur: 6.8, delay: 1.4 },
  { id: 4, left: "76%", top: "68%", size: 5, dur: 7.4, delay: 0.6 },
  { id: 5, left: "48%", top: "10%", size: 4, dur: 5.9, delay: 1.1 },
  { id: 6, left: "88%", top: "44%", size: 5, dur: 6.5, delay: 0.4 },
] as const;

const PRESSED_PETAL_SEEDS = [
  { id: 1, x1: -28, x2: -68, y: -96, rot0: -16, rot1: -56, delay: 0.92, color: "#D9A78B" },
  { id: 2, x1: 28, x2: 66, y: -108, rot0: 14, rot1: 54, delay: 0.99, color: "#E5C69B" },
  { id: 3, x1: -46, x2: -86, y: -50, rot0: -22, rot1: -68, delay: 1.05, color: "#C97C63" },
  { id: 4, x1: 44, x2: 84, y: -58, rot0: 18, rot1: 64, delay: 1.11, color: "#D9A78B" },
  { id: 5, x1: -12, x2: 20, y: -122, rot0: -8, rot1: 30, delay: 0.96, color: "#E5C69B" },
  { id: 6, x1: 32, x2: 56, y: 40, rot0: -12, rot1: -46, delay: 1.16, color: "#C97C63" },
] as const;

interface StoryMilestone {
  year: string;
  title: string;
  content: string;
}

const DEFAULT_STORY_MILESTONES: StoryMilestone[] = [
  {
    year: "2020",
    title: "Lần đầu gặp gỡ",
    content: "Một buổi chiều thu dịu dàng ở góc quán quen, ánh mắt chạm nhau mở đầu cho bao nhung nhớ.",
  },
  {
    year: "2022",
    title: "Lời hẹn ước",
    content: "Dưới ánh hoàng hôn vàng ươm, chúng mình đã nắm tay nhau và hứa sẽ cùng đi qua mọi thăng trầm.",
  },
  {
    year: "2024",
    title: "Khoảnh khắc cầu hôn",
    content: "Chiếc nhẫn trao tay thay cho lời nguyện thề chung một mái nhà, cùng viết tiếp trang đời tươi đẹp.",
  },
  {
    year: "2027",
    title: "Ngày chung đôi",
    content: "Hôm nay, trước sự chứng kiến của những người thương yêu nhất, chúng mình chính thức nên duyên vợ chồng.",
  },
];

/* Helper animation 60fps: chỉ dùng transform & opacity */
function VintageReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.72,
  distance = 16,
  initialRotate = 0,
  finalRotate = 0,
  initialScale = 1,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right" | "none";
  delay?: number;
  duration?: number;
  distance?: number;
  initialRotate?: number;
  finalRotate?: number;
  initialScale?: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return (
      <div
        className={className}
        style={finalRotate ? { transform: `rotate(${finalRotate}deg)` } : undefined}
      >
        {children}
      </div>
    );
  }

  const dx = direction === "left" ? -distance : direction === "right" ? distance : 0;
  const dy = direction === "up" ? distance : direction === "down" ? -distance : 0;

  return (
    <m.div
      initial={{ opacity: 0, x: dx, y: dy, rotate: initialRotate, scale: initialScale }}
      whileInView={{ opacity: 1, x: 0, y: 0, rotate: finalRotate, scale: 1 }}
      viewport={VIEWPORT_ONCE}
      transition={{ duration, delay, ease: PAPER_EASE }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </m.div>
  );
}

/* ============================================================
   THẺ POLAROID CHÂN DUNG LẬT 3D VIẾT TAY (STANDARD EXCLUSIVE)
   ============================================================ */
function VintagePolaroidFlipCard({
  photoUrl,
  displayName,
  fullName,
  roleLabel,
  familyLabel,
  backQuote,
  tiltClass,
  tapeSrc,
  muted,
  enterDirection,
}: {
  photoUrl: string | null;
  displayName: string;
  fullName: string;
  roleLabel: string;
  familyLabel: string;
  backQuote: string;
  tiltClass: string;
  tapeSrc: string;
  muted: boolean;
  enterDirection: "left" | "right";
}) {
  const [flipped, setFlipped] = React.useState(false);
  const reducedMotion = useReducedMotion();

  const handleToggle = () => {
    playInteractionSfx("polaroid-flip", { muted });
    setFlipped((prev) => !prev);
  };

  return (
    <VintageReveal
      direction={enterDirection}
      distance={18}
      delay={enterDirection === "left" ? 0.08 : 0.16}
      initialRotate={enterDirection === "left" ? -5 : 5}
      finalRotate={0}
    >
      <div
        className={cn("relative mx-auto w-full max-w-[168px] transition-transform duration-300", tiltClass)}
        style={{ perspective: "950px" }}
      >
        <img
          loading="lazy"
          decoding="async"
          src={tapeSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -top-3 left-1/2 z-20 h-auto w-14 -translate-x-1/2 drop-shadow-xs"
        />

        <button
          type="button"
          onClick={handleToggle}
          aria-pressed={flipped}
          aria-label={`Lật thẻ ảnh ${roleLabel} ${displayName}`}
          className="relative block aspect-[3/4.1] w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3629]"
        >
          <div
            className="relative h-full w-full transition-transform duration-700"
            style={{
              transformStyle: "preserve-3d",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              willChange: "transform",
            }}
          >
            {/* MẶT TRƯỚC: Khung Polaroid ảnh chân dung */}
            <div
              className="absolute inset-0 flex flex-col rounded-md border border-[#C4A484]/55 bg-[#FFFFFF] p-2.5 pb-3 shadow-[0_8px_20px_rgba(74,55,40,0.14)]"
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
            >
              <div className="relative flex-1 overflow-hidden rounded-[3px] bg-[#EDE3CE]">
                {photoUrl ? (
                  <img
                    loading="lazy"
                    decoding="async"
                    src={photoUrl}
                    alt={`${roleLabel} ${displayName}`}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-[#7A604D]">
                    <span className="text-2xl" style={{ fontFamily: FONT_SCRIPT }}>
                      {displayName.slice(0, 1)}
                    </span>
                    <span className="mt-1 text-[11px]" style={{ fontFamily: FONT_SERIF }}>
                      {roleLabel}
                    </span>
                  </div>
                )}
                <span
                  data-polaroid-flip-glow="true"
                  className="pointer-events-none absolute right-2 bottom-2 flex h-7 w-7 items-center justify-center"
                  aria-hidden="true"
                >
                  {!reducedMotion && !flipped && (
                    <>
                      <m.span
                        className="absolute inset-0 rounded-full border-[1.5px] border-[#F6D5A8] bg-[#E6B88A]/45 shadow-[0_0_14px_rgba(246,213,168,0.95)]"
                        animate={{ scale: [0.88, 1.44, 0.88], opacity: [0.95, 0.12, 0.95] }}
                        transition={{ duration: 1.75, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <m.span
                        className="absolute h-6 w-6 rounded-full bg-[#FAF6EC]/85"
                        animate={{ scale: [1, 1.18, 1], opacity: [0.95, 0.45, 0.95] }}
                        transition={{ duration: 1.75, delay: 0.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </>
                  )}
                  <m.span
                    className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FAF6EC]/95 text-[#7C3629] ring-1 ring-[#F6D5A8] shadow-[0_0_10px_rgba(246,213,168,0.85)]"
                    animate={
                      !reducedMotion && !flipped
                        ? { opacity: [1, 0.68, 1], scale: [1, 1.08, 1] }
                        : { opacity: 1, scale: 1 }
                    }
                    transition={
                      !reducedMotion && !flipped
                        ? { duration: 1.35, repeat: Infinity, ease: "easeInOut" }
                        : { duration: 0.2 }
                    }
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </m.span>
                </span>
              </div>

              <div className="pt-2 text-center">
                <p
                  className="truncate text-base leading-tight text-[#4A3728]"
                  style={{ fontFamily: FONT_SCRIPT }}
                >
                  {displayName}
                </p>
                <p
                  className="text-[10px] tracking-[0.14em] text-[#8C6D53] uppercase"
                  style={{ fontFamily: FONT_SERIF }}
                >
                  {roleLabel}
                </p>
              </div>
            </div>

            {/* MẶT SAU: Giấy viết tay kẻ dòng lưu bút */}
            <div
              className="absolute inset-0 flex flex-col justify-between rounded-md border border-[#C4A484]/70 bg-[#FCF9F2] p-3 text-center shadow-[0_10px_24px_rgba(74,55,40,0.18)]"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 20px, rgba(196,164,132,0.26) 20px, rgba(196,164,132,0.26) 21px)",
                backgroundPosition: "0 10px",
              }}
            >
              <div className="pt-0.5">
                <p
                  className="text-[9px] font-semibold tracking-[0.18em] text-[#7C3629] uppercase"
                  style={{ fontFamily: FONT_SERIF }}
                >
                  {familyLabel}
                </p>
                <p
                  className="mt-0.5 text-base leading-tight text-[#4A3728]"
                  style={{ fontFamily: FONT_SCRIPT }}
                >
                  {fullName}
                </p>
              </div>

              <p className="my-auto px-0.5 text-[11px] leading-[1.45] text-[#5E493A] italic">
                &ldquo;{backQuote}&rdquo;
              </p>

              <span
                className="inline-flex items-center justify-center gap-1 text-[10px] text-[#8C6D53]"
                style={{ fontFamily: FONT_SERIF }}
              >
                <RotateCw className="h-2.5 w-2.5" aria-hidden="true" />
                Chạm để lật lại
              </span>
            </div>
          </div>
        </button>
      </div>
    </VintageReveal>
  );
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
   TỜ LỊCH XÉ PAGE-CURL CANVAS 2D 60FPS (DIAGONAL CORNER PEEL)
   - Góc dưới-phải C=(W,H) hơi vểnh sẵn ở P_rest=(W-26, H-26)
   - Kéo chéo lên-trái: thấy rõ đường gấp chéo, mặt sau cong 3D,
     bóng cong đổ lên trang lịch thật và răng cưa rách dần ở > 35%
   - Thả tay ở < 2/3 (0.66): lò xo spring bật về chỗ cũ + paper-settle
   - Kéo >= 2/3: xé đứt "XOẸT!" bay xoay khỏi canvas -> lộ lịch + dấu mộc
   ============================================================ */
function VintageTearOffCalendar({
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
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const sizeRef = React.useRef<{ w: number; h: number }>({ w: 320, h: 320 });

  // Trạng thái góc giấy & vật lý trong ref (0 React re-render khi kéo)
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

  const computeProgress = React.useCallback((p: CurlPoint, w: number, h: number): number => {
    const rest = getRestCorner(w, h);
    const dx = Math.max(0, rest.x - p.x);
    const dy = Math.max(0, rest.y - p.y);
    const dist = Math.hypot(dx, dy);
    const thresholdSpan = Math.hypot(w, h) * 0.72;
    return Math.max(0, Math.min(1, dist / Math.max(120, thresholdSpan)));
  }, [getRestCorner]);

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

      // Rung nhẹ ±1px khi kéo gần ngưỡng đứt 2/3
      const jitterX = progress > 0.55 && animRef.current.kind === "idle" && isDraggingRef.current
        ? (Math.sin(performance.now() * 0.08) * 1.1)
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

        // 1. Bóng cong mềm đổ từ nếp gấp xuống DOM lịch tháng thật bên dưới
        if (peeledPoly.length >= 3) {
          ctx.save();
          tracePolyPath(ctx, peeledPoly);
          ctx.clip();
          const shadowWidth = Math.min(44, 14 + dist * 0.14);
          const underGrad = ctx.createLinearGradient(
            mx,
            my,
            mx - nx * shadowWidth,
            my - ny * shadowWidth,
          );
          underGrad.addColorStop(0, "rgba(58, 40, 26, 0.34)");
          underGrad.addColorStop(0.5, "rgba(58, 40, 26, 0.14)");
          underGrad.addColorStop(1, "rgba(58, 40, 26, 0)");
          ctx.fillStyle = underGrad;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
      }

      // 2. Mặt trước tờ lịch (nửa mặt phẳng còn nguyên bên trên-trái nếp gấp)
      if (frontPoly.length >= 3) {
        ctx.save();
        drawRoundedRectPath(ctx, 0.5, 0.5, w - 1, h - 1, 16);
        ctx.clip();
        tracePolyPath(ctx, frontPoly);
        ctx.clip();
        ctx.translate(jitterX, 0);

        // Nền giấy cổ + dòng kẻ mờ
        ctx.fillStyle = "#F4EAD5";
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "rgba(196, 164, 132, 0.24)";
        ctx.lineWidth = 1;
        for (let lineY = 30; lineY < h - 12; lineY += 26) {
          ctx.beginPath();
          ctx.moveTo(14, lineY);
          ctx.lineTo(w - 14, lineY);
          ctx.stroke();
        }

        // Đường răng cưa xé ở mép trên + khe rách tách dần theo progress (0.35 -> 0.66)
        const tearOpenRatio = Math.max(0, Math.min(1, (progress - 0.3) / 0.36));
        const toothCount = Math.floor((w - 28) / 10);
        ctx.save();
        ctx.strokeStyle = "rgba(124, 54, 41, 0.45)";
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(16, 40);
        ctx.lineTo(w - 16, 40);
        ctx.stroke();
        ctx.setLineDash([]);

        if (tearOpenRatio > 0) {
          const tearStartX = w - 16 - (w - 32) * tearOpenRatio;
          ctx.strokeStyle = "#7C3629";
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

        // Chữ in phong cách cổ điển trên mặt tờ lịch
        ctx.textAlign = "center";
        ctx.fillStyle = "#7C3629";
        ctx.font = '600 10px "Cormorant Garamond", Georgia, serif';
        ctx.fillText("ĐƯỜNG XÉ TỜ LỊCH", w * 0.5, 25);

        ctx.fillStyle = "#8C6D53";
        ctx.font = '500 12px "Cormorant Garamond", Georgia, serif';
        ctx.fillText(`THÁNG ${monthText} • NĂM ${yearText}`, w * 0.5, h * 0.36);

        ctx.fillStyle = "#4A3728";
        ctx.font = '400 36px "Dancing Script", cursive, Georgia, serif';
        ctx.fillText("Ngày Hỷ Sự", w * 0.5, h * 0.52);

        ctx.fillStyle = "rgba(124, 54, 41, 0.85)";
        ctx.font = 'italic 13px "Cormorant Garamond", Georgia, serif';
        ctx.fillText("Kéo góc giấy lên để xé tờ lịch", w * 0.5, h * 0.66);

        // Viền mảnh giấy kraft
        ctx.strokeStyle = "rgba(196, 164, 132, 0.68)";
        ctx.lineWidth = 1.2;
        drawRoundedRectPath(ctx, 0.6, 0.6, w - 1.2, h - 1.2, 16);
        ctx.stroke();

        // Bóng đổ của tai giấy cuộn lên mặt trước tờ lịch
        if (backPoly.length >= 3) {
          ctx.save();
          ctx.shadowColor = "rgba(48, 30, 16, 0.28)";
          ctx.shadowBlur = 16;
          ctx.shadowOffsetX = -nx * 4;
          ctx.shadowOffsetY = -ny * 4;
          tracePolyPath(ctx, backPoly);
          ctx.fillStyle = "#F4EAD5";
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      }

      // 3. Mặt sau tờ giấy đang cuộn cong 3D (Curl Backside với gradient hình trụ)
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
        curlGrad.addColorStop(0, "#CBB591");
        curlGrad.addColorStop(0.16, "#FAF4E7");
        curlGrad.addColorStop(0.42, "#FFFDF9");
        curlGrad.addColorStop(0.78, "#ECE0C7");
        curlGrad.addColorStop(1, "#D8C29F");
        ctx.fillStyle = curlGrad;
        ctx.fillRect(-w, -h, w * 3, h * 3);

        // Nét viền rõ hơn của mép giấy mặt sau để không bị chìm vào nền kem
        tracePolyPath(ctx, backPoly);
        ctx.strokeStyle = "rgba(140, 102, 66, 0.72)";
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
        // 2 nhịp giật mép giấy rõ ràng (nhấc mạnh rồi nhá lại nhẹ) mời khách kéo
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

  // Đồng bộ kích thước Retina & ResizeObserver
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

  // Theo dõi khi khung lịch vào tầm nhìn để chạy nhịp giật mép giấy (0% CPU khi cuộn ra ngoài)
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsStageInView(entry.isIntersecting);
        }
      },
      { threshold: 0.25 },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

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

    // Góc giấy giữ khoảng cách tương đối từ điểm chạm tới góc hiện tại để kéo tự nhiên
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
    <div className="space-y-2.5">
      <VintageReveal
        className="relative overflow-hidden rounded-2xl p-6 pt-7 bg-[#FAF6EC] border border-[#C4A484]/45 shadow-xs text-center space-y-4"
      >
        <div ref={stageRef} className="relative">
          {/* Con dấu mộc bưu điện HỶ SỰ góc trên phải, tách khỏi T7/CN */}
          <AnimatePresence>
            {isStampShown && (
              <m.div
                initial={
                  reducedMotion
                    ? { opacity: 0.88, scale: 1, rotate: -10 }
                    : { opacity: 0, scale: 1.85, rotate: -20 }
                }
                animate={{ opacity: 0.88, scale: 1, rotate: -10 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 360, damping: 20 }}
                className="pointer-events-none absolute -top-5 -right-2 z-20"
                aria-hidden="true"
              >
                <svg viewBox="0 0 96 96" className="h-14 w-14 sm:h-16 sm:w-16 text-[#7C3629]">
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
                  <text x="48" y="34" textAnchor="middle" fill="currentColor" fontSize="9.5" fontWeight="700" letterSpacing="1.6">
                    HỶ SỰ
                  </text>
                  <text x="48" y="52" textAnchor="middle" fill="currentColor" fontSize="11.5" fontWeight="700" letterSpacing="0.8">
                    {dotDateText}
                  </text>
                  <text x="48" y="67" textAnchor="middle" fill="currentColor" fontSize="8" letterSpacing="1.4">
                    CHUNG ĐÔI
                  </text>
                </svg>
              </m.div>
            )}
          </AnimatePresence>

          {/* Lịch tháng DOM thật bên dưới — lộ dần khi cuộn góc giấy */}
          <div className="space-y-4 py-1">
            <p
              className="text-xs uppercase tracking-widest text-[#8C6D53] pt-1 pb-1"
              style={{ fontFamily: FONT_SERIF }}
            >
              Tháng {monthText} Năm {yearText}
            </p>

            <div className="grid grid-cols-7 gap-1 max-w-xs mx-auto text-xs text-[#5E493A]">
              {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dayName) => (
                <div key={dayName} className="font-medium py-1 text-[#8C6D53]">
                  {dayName}
                </div>
              ))}

              {calendarDays.map((item, dIdx) => (
                <div
                  key={dIdx}
                  className={cn(
                    "relative py-1.5 flex items-center justify-center font-medium",
                    !item.day && "opacity-0 pointer-events-none",
                    item.isWedding && "text-[#7C3629] font-bold",
                  )}
                >
                  {item.day}
                  {item.isWedding && isTorn && (
                    <svg
                      className="absolute inset-0 w-full h-full text-[#7C3629] pointer-events-none"
                      viewBox="0 0 36 36"
                      fill="none"
                    >
                      <m.circle
                        cx="18"
                        cy="18"
                        r="14"
                        stroke="currentColor"
                        strokeWidth="1.9"
                        strokeLinecap="round"
                        initial={reducedMotion ? { pathLength: 1 } : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.75, delay: 0.14, ease: PAPER_EASE }}
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-[#7A604D] italic pt-1" style={{ fontFamily: FONT_SCRIPT }}>
              &ldquo;Hẹn gặp bạn trong ngày vui của chúng mình!&rdquo;
            </p>
          </div>

          {/* Canvas 2D Page-Curl phủ lên toàn thẻ lịch */}
          {isCanvasShown && (
            <canvas
              ref={canvasRef}
              data-tear-canvas="true"
              aria-label="Kéo góc giấy dưới bên phải lên để xé tờ lịch xem ngày cưới"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              className="absolute inset-0 z-30 h-full w-full cursor-grab active:cursor-grabbing select-none"
              style={{
                touchAction: "none",
                pointerEvents: isTorn ? "none" : "auto",
              }}
            />
          )}

          {/* Hiệu ứng vòng sáng dẫn hướng tại góc lật mép giấy (ẩn khi khách bắt đầu kéo hoặc đã xé) */}
          {isCanvasShown && !isTorn && !isDraggingUi && (
            <div
              data-tear-glow="true"
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-1 -right-1 z-35 flex h-12 w-12 items-center justify-center"
            >
              <m.span
                className="absolute inset-0 rounded-full border-2 border-[#7C3629]/55 bg-[#E6B88A]/30 shadow-[0_0_18px_rgba(164,92,48,0.45)]"
                animate={{ scale: [0.72, 1.38, 0.72], opacity: [0.9, 0.15, 0.9] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
              />
              <m.span
                className="absolute h-7 w-7 rounded-full border border-[#B06C36]/70 bg-[#FAF6EC]/70"
                animate={{ scale: [0.9, 1.18, 0.9], opacity: [0.95, 0.45, 0.95] }}
                transition={{ duration: 1.9, delay: 0.25, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[#7C3629] text-[#FAF6EC] shadow-[0_0_12px_rgba(124,54,41,0.65)] ring-2 ring-[#FAF6EC]/90">
                <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 11L5 5" />
                  <path d="M5 9.5V5H9.5" />
                </svg>
              </span>
            </div>
          )}
        </div>
      </VintageReveal>

      {/* Liên kết phụ siêu nhỏ nằm ngoài mép dưới thẻ lịch (Accessibility) */}
      {!reducedMotion && (
        <div className="text-center">
          {!isTorn ? (
            <button
              type="button"
              data-quick-tear="true"
              onClick={completeTear}
              className="cursor-pointer text-[11px] text-[#8C6D53]/85 underline underline-offset-4 hover:text-[#7C3629]"
              style={{ fontFamily: FONT_SERIF }}
            >
              Mở nhanh lịch cưới
            </button>
          ) : (
            <button
              type="button"
              data-replay-tear="true"
              onClick={handleReplay}
              className="cursor-pointer text-[11px] text-[#8C6D53]/85 underline underline-offset-4 hover:text-[#7C3629]"
              style={{ fontFamily: FONT_SERIF }}
            >
              Xem lại tờ lịch xé
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface VintageHeroCardProps {
  groomName: string;
  brideName: string;
  weekdayText: string;
  fullDateText: string;
  lunarText: string;
  heroPhotoUrl: string;
  isHeroLive?: boolean;
  shouldReduceMotion: boolean;
  markerType?: "hero" | "mini";
  onHeroImageLoad?: () => void;
}

const VintageHeroCard = React.forwardRef<HTMLDivElement, VintageHeroCardProps>(
  function VintageHeroCard(
    {
      groomName,
      brideName,
      weekdayText,
      fullDateText,
      lunarText,
      heroPhotoUrl,
      isHeroLive = false,
      shouldReduceMotion,
      markerType = "hero",
      onHeroImageLoad,
    },
    ref,
  ) {
    const isMini = markerType === "mini";
    return (
      <div
        ref={ref}
        data-hero-card={!isMini ? "true" : undefined}
        aria-hidden={isMini ? true : undefined}
        className="relative text-center pt-2 sm:pt-4"
      >
        <m.img
          loading="eager"
          decoding="async"
          src="/templates/mot-thoi-de-nho/pressed-flowers-corner-1.webp"
          alt="Hoa ép khô góc"
          animate={shouldReduceMotion || !isHeroLive ? { rotate: 0 } : { rotate: [-1.2, 1.2, -1.2] }}
          transition={
            shouldReduceMotion || !isHeroLive
              ? { duration: 0.2 }
              : { duration: 6, repeat: Infinity, ease: "easeInOut" }
          }
          className="absolute -top-5 -left-3 w-24 sm:w-32 h-auto object-contain pointer-events-none z-20 opacity-90 drop-shadow-sm origin-top-left"
        />

        <div className="absolute -top-3 -right-1 sm:-top-2 sm:right-2 z-20 rotate-[4deg] drop-shadow-sm pointer-events-none">
          <img
            loading="eager"
            decoding="async"
            src="/templates/mot-thoi-de-nho/vintage-stamp-postmark.webp"
            alt="Tem thư cổ"
            className="w-16 sm:w-22 h-auto object-contain pointer-events-none"
          />
        </div>

        <m.img
          loading="eager"
          decoding="async"
          src="/templates/mot-thoi-de-nho/pressed-flowers-corner-2.webp"
          alt="Hoa cúc khô góc dưới"
          animate={shouldReduceMotion || !isHeroLive ? { rotate: 0 } : { rotate: [1, -1.2, 1] }}
          transition={
            shouldReduceMotion || !isHeroLive
              ? { duration: 0.2 }
              : { duration: 6.5, repeat: Infinity, ease: "easeInOut" }
          }
          className="absolute -bottom-7 -right-3 w-20 sm:w-28 h-auto object-contain pointer-events-none z-20 opacity-85 drop-shadow-sm origin-bottom-right"
        />

        <div
          className="relative mx-auto rounded-2xl px-6 pt-12 pb-10 sm:p-10 shadow-[0_12px_36px_rgba(74,55,40,0.12)] border border-[#C4A484]/40"
          style={{ backgroundColor: COLOR_CARD }}
        >
          <p
            className="text-[11px] uppercase tracking-[0.16em] text-[#8C6D53]"
            style={{ fontFamily: FONT_SERIF }}
          >
            Thiệp mời tham dự lễ cưới
          </p>

          <h1
            className="mt-4 text-4xl sm:text-6xl font-normal leading-tight text-[#4A3728]"
            style={{ fontFamily: FONT_SCRIPT }}
          >
            {groomName}
          </h1>

          <div className="my-1 text-2xl sm:text-3xl text-[#7C3629]" style={{ fontFamily: FONT_SCRIPT }}>
            &amp;
          </div>

          <h1
            className="text-4xl sm:text-6xl font-normal leading-tight text-[#4A3728]"
            style={{ fontFamily: FONT_SCRIPT }}
          >
            {brideName}
          </h1>

          <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2.5 px-4 py-1.5 rounded-full bg-[#FAF6EC] border border-[#C4A484]/40 text-xs sm:text-sm text-[#5E493A]">
            <span className="font-medium" style={{ fontFamily: FONT_SERIF }}>
              {weekdayText}, {fullDateText}
            </span>
            {lunarText && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#C4A484]" />
                <span className="italic text-xs">{lunarText}</span>
              </>
            )}
          </div>

          {/* Khung ảnh bìa Hero Photo nghiêng mượt + 2 washi tape dán góc */}
          <div className="relative mt-8 mx-auto max-w-[320px] sm:max-w-[360px]">
            <img
              loading="eager"
              decoding="async"
              src="/templates/mot-thoi-de-nho/washi-tape-beige.webp"
              alt=""
              aria-hidden="true"
              className="absolute -top-3.5 -left-4 w-20 h-auto z-30 -rotate-12 opacity-92 pointer-events-none drop-shadow-xs"
            />

            <img
              loading="eager"
              decoding="async"
              src="/templates/mot-thoi-de-nho/washi-tape-beige.webp"
              alt=""
              aria-hidden="true"
              className="absolute -top-3.5 -right-4 w-20 h-auto z-30 rotate-12 opacity-92 pointer-events-none drop-shadow-xs"
            />

            <div className="relative -rotate-[1.5deg] rounded-lg p-2.5 sm:p-3 bg-[#FFFFFF] shadow-md border border-[#E8DFC8] overflow-hidden">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-[#FAF6EC]">
                <img
                  loading="eager"
                  decoding="async"
                  src={heroPhotoUrl}
                  alt={`${groomName} & ${brideName}`}
                  onLoad={onHeroImageLoad}
                  className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                />
              </div>
              <p
                className="mt-2 text-center text-xs sm:text-sm text-[#7A604D] italic"
                style={{ fontFamily: FONT_SCRIPT }}
              >
                &ldquo;Chúng mình cùng nhau già đi nhé...&rdquo;
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

interface FlipGeometry {
  heroLeft: number;
  heroTop: number;
  heroWidth: number;
  heroHeight: number;
  startX: number;
  startY: number;
  startScale: number;
}

export default function MotThoiDeNhoTemplate({
  data,
  mode = "preview",
  contained = false,
  externalMusicControl = false,
  isOpened: parentIsOpened,
  onOpenedChange,
  inviteSlug,
  weddingSlug,
  invitationMode = "public",
  guestName,
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = null,
  initialSongRequest = null,
  initialRideNeeded = false,
}: WeddingTemplateProps) {
  const shouldReduceMotion = useReducedMotion();
  const invitationExp = useInvitationExperience();
  // SFX tương tác chỉ phát khi người dùng tự chạm mở/kéo/lật, nên luôn bật kể cả trong chế độ xem thử demo
  const sfxMuted = false;

  // -------------------------------------------------------------
  // TRẠNG THÁI MỞ BÌA 1 BIẾN + 1 TIMER DUY NHẤT CUỐI CHUỖI (3600ms)
  // Bảo vệ bằng coverOpeningRef & đo FLIP tọa độ khớp 100% Hero thật
  // -------------------------------------------------------------
  const [coverOpening, setCoverOpening] = React.useState(false);
  const [coverGone, setCoverGone] = React.useState(Boolean(parentIsOpened));
  const coverOpeningRef = React.useRef(false);
  const coverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const heroCardRef = React.useRef<HTMLDivElement | null>(null);
  const envelopeRef = React.useRef<HTMLDivElement | null>(null);
  const [flipGeom, setFlipGeom] = React.useState<FlipGeometry | null>(null);

  const measureFlipGeometry = React.useCallback((): FlipGeometry | null => {
    const rootEl = rootRef.current;
    const heroEl = heroCardRef.current;
    const envEl = envelopeRef.current;
    if (!rootEl || !heroEl || !envEl) return null;

    const rootRect = rootEl.getBoundingClientRect();
    const heroRect = heroEl.getBoundingClientRect();
    const envRect = envEl.getBoundingClientRect();
    const scaleX = rootEl.offsetWidth > 0 ? rootRect.width / rootEl.offsetWidth : 1;
    const scaleY = rootEl.offsetHeight > 0 ? rootRect.height / rootEl.offsetHeight : 1;
    const sx = scaleX > 0.05 ? scaleX : 1;
    const sy = scaleY > 0.05 ? scaleY : 1;

    const heroWidth = heroRect.width / sx;
    const heroHeight = heroRect.height / sy;
    const envWidth = envRect.width / sx;
    const envHeight = envRect.height / sy;
    if (heroHeight <= 200 || envHeight <= 200 || heroWidth <= 0 || envWidth <= 0) {
      return null;
    }

    const heroLeft = (heroRect.left - rootRect.left) / sx;
    const heroTop = (heroRect.top - rootRect.top) / sy;
    const heroCx = heroLeft + heroWidth / 2;
    const heroCy = heroTop + heroHeight / 2;
    const envCx = (envRect.left - rootRect.left) / sx + envWidth / 2;
    const envCy = (envRect.top - rootRect.top) / sy + envHeight / 2;

    const startScale = Math.min(
      (envWidth * 0.8) / heroWidth,
      (envHeight * 0.7) / heroHeight,
      0.6,
    );

    const next: FlipGeometry = {
      heroLeft,
      heroTop,
      heroWidth,
      heroHeight,
      startX: envCx - heroCx,
      startY: envCy + 8 - heroCy,
      startScale,
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
    if (coverGone || coverOpening) return;
    const rootEl = rootRef.current;
    const heroEl = heroCardRef.current;
    const envEl = envelopeRef.current;
    if (!rootEl || !heroEl || !envEl) return;

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
    ro.observe(envEl);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [coverGone, coverOpening, measureFlipGeometry]);

  const clearCoverTimer = React.useCallback(() => {
    if (coverTimerRef.current) {
      clearTimeout(coverTimerRef.current);
      coverTimerRef.current = null;
    }
  }, []);

  React.useEffect(() => clearCoverTimer, [clearCoverTimer]);

  const prevParentOpenedRef = React.useRef(parentIsOpened);
  React.useEffect(() => {
    if (prevParentOpenedRef.current === parentIsOpened) return;
    prevParentOpenedRef.current = parentIsOpened;

    // Nếu người dùng vừa bấm mở và animation đang chạy, tuyệt đối không cắt ngang
    if (coverOpeningRef.current) return;

    let active = true;
    clearCoverTimer();
    queueMicrotask(() => {
      if (!active || coverOpeningRef.current) return;
      if (parentIsOpened) {
        setCoverOpening(false);
        setCoverGone(true);
      } else if (parentIsOpened === false) {
        setCoverOpening(false);
        setCoverGone(false);
      }
    });
    return () => {
      active = false;
    };
  }, [parentIsOpened, clearCoverTimer]);

  const handleOpenCover = () => {
    if (coverOpeningRef.current || coverOpening || coverGone) return;
    coverOpeningRef.current = true;

    playCoverSfx("vintage-wax-letter", { muted: sfxMuted });

    try {
      invitationExp?.triggerInvitationOpened();
    } catch { }

    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }

    measureFlipGeometry();
    setCoverOpening(true);

    const finishDelayMs = shouldReduceMotion ? 220 : 3380;
    clearCoverTimer();
    coverTimerRef.current = setTimeout(() => {
      coverOpeningRef.current = false;
      setCoverGone(true);
      setCoverOpening(false);
      onOpenedChange?.(true);
      coverTimerRef.current = null;
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: shouldReduceMotion ? "auto" : "smooth" });
      }
    }, finishDelayMs);
  };

  // -------------------------------------------------------------
  // HỘP QUÀ KỶ NIỆM (3 TRẠNG THÁI CHUẨN useGiftBoxInteraction)
  // -------------------------------------------------------------
  const {
    stage: giftBoxStage,
    isOpening: isGiftOpening,
    isModalOpen: giftModalOpen,
    handleGiftClick,
    handleCloseModal,
  } = useGiftBoxInteraction({
    sfxType: "vintage-kraft-gift",
    muted: sfxMuted,
  });

  // Lightbox Modal cho Album ảnh
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Danh sách sự kiện & ngày giờ
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent?.startsAt || data.date || "2027-03-20T10:00:00+07:00";

  // Đếm ngược dùng hook chuẩn (AGENTS.md §4.1)
  const countdown = useWeddingCountdown(eventDateStr);
  const timeLeft = countdown ?? { days: 0, hours: 0, minutes: 0, seconds: 0, finished: false };

  // Thông tin cặp đôi & gia đình
  const groomName = data.couple?.groomName || "Minh Quân";
  const brideName = data.couple?.brideName || "Khánh Vân";
  const groomFullName = data.couple?.groomFullName || groomName;
  const brideFullName = data.couple?.brideFullName || brideName;

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

  // Định dạng ngày
  const dateParts = formatWeddingDateParts(eventDateStr);
  const fullDateText = `${dateParts.day}/${dateParts.month}/${dateParts.year}`;
  const dotDateText = `${dateParts.day}.${dateParts.month}.${dateParts.year}`;
  const lunarText = targetEvent?.lunarDate
    ? formatLunarDateClean(targetEvent.lunarDate)
    : "";

  // Phân quyền Album theo gói (Free 5, Pro 30, VIP 50)
  const plan: WeddingPlan = (data.plan as WeddingPlan) || "free";
  const galleryLimit = plan === "free" ? 5 : plan === "pro" ? 30 : 50;
  const rawGallery = (data.photos?.gallery || []).slice(0, galleryLimit);

  const galleryPhotos: TemplatePhotoItem[] = React.useMemo(() => {
    if (rawGallery.length >= 5) return rawGallery;
    const defaultDummies: TemplatePhotoItem[] = [
      { id: "p1", url: data.photos?.heroUrl || "/media/demo-wedding-hero.jpg", alt: "Ngày chung đôi", position: 0 },
      { id: "p2", url: "/media/demo-couple-1.jpg", alt: "Khoảnh khắc hẹn thề", position: 1 },
      { id: "p3", url: "/media/demo-couple-2.jpg", alt: "Khoảnh khắc chung đôi", position: 2 },
      { id: "p4", url: "/media/demo-couple-3.jpg", alt: "Bình yên bên nhau", position: 3 },
      { id: "p5", url: "/media/demo-couple-4.jpg", alt: "Hành trình yêu thương", position: 4 },
      { id: "p6", url: "/media/demo-wedding-hero.jpg", alt: "Mãi mãi bên nhau", position: 5 },
    ];
    return [...rawGallery, ...defaultDummies].slice(0, 6);
  }, [rawGallery, data.photos?.heroUrl]);

  const heroPhotoUrl = data.photos?.heroUrl || galleryPhotos[0]?.url || "/media/demo-wedding-hero.jpg";
  const groomPortraitUrl = data.photos?.groomUrl || galleryPhotos[1]?.url || null;
  const bridePortraitUrl = data.photos?.brideUrl || galleryPhotos[2]?.url || null;

  const groomQuote =
    data.castDossier?.groomQuote ||
    "Cảm ơn em đã đến và biến từng ngày bình dị thành kỷ niệm đẹp nhất đời anh.";
  const brideQuote =
    data.castDossier?.brideQuote ||
    "Giữa muôn ngàn bức ảnh cuộc đời, nụ cười của anh vẫn là điều em muốn giữ mãi.";

  // Lịch tháng
  const calendarDays = React.useMemo(() => {
    const d = new Date(eventDateStr);
    const year = d.getFullYear() || 2027;
    const month = Number.isNaN(d.getMonth()) ? 2 : d.getMonth();
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

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
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

  // Dress code color swatches
  const dressCodeSwatches = React.useMemo(() => {
    if (data.dressCode && data.dressCode.length > 0) {
      const names = ["Sắc màu chủ đạo", "Sắc màu điểm xuyết", "Sắc màu phối hợp", "Sắc màu thanh nhã"];
      return data.dressCode.map((hex, i) => ({
        name: names[i % names.length],
        color: hex,
      }));
    }
    return DEFAULT_DRESS_CODE;
  }, [data.dressCode]);

  const hidden = React.useMemo(() => new Set(data.hiddenSections || []), [data.hiddenSections]);
  const isStoryAllowed = data.plan !== "free";
  const isStoryVisible = isStoryAllowed && !hidden.has("story") && !hidden.has("loveStory");

  const storyMilestones: StoryMilestone[] = React.useMemo(() => {
    if (data.story && data.story.length > 0) {
      return data.story.map((item) => ({
        year: item.year || "",
        title: item.title,
        content: item.content,
      }));
    }
    return DEFAULT_STORY_MILESTONES;
  }, [data.story]);

  const order = React.useMemo(
    () => (data.sectionOrder?.length ? data.sectionOrder : CANONICAL_SECTION_ORDER),
    [data.sectionOrder],
  );

  const orderOf = React.useCallback(
    (key: string) => {
      const idx = order.indexOf(key);
      return idx === -1 ? 99 : idx;
    },
    [order],
  );

  const isBrideFirst = data.hostFirst === "bride";

  return (
    <div
      ref={rootRef}
      data-template-id="mot-thoi-de-nho"
      className={cn(
        "relative w-full mx-auto select-text overflow-x-hidden antialiased",
        contained
          ? !coverGone
            ? "h-full overflow-hidden"
            : "min-h-full"
          : !coverGone
            ? "h-screen-dvh max-h-full overflow-hidden"
            : "min-h-screen",
      )}
      style={{
        backgroundColor: COLOR_BG,
        color: COLOR_TEXT_MAIN,
        fontFamily: FONT_BODY,
      }}
    >
      {/* Nền giấy cũ ngả vàng vintage xuyên suốt */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-repeat"
        style={{
          backgroundImage: "url('/templates/mot-thoi-de-nho/bg-vintage-paper.webp')",
          backgroundSize: "400px 400px",
        }}
        aria-hidden="true"
      />

      {/* Nút nhạc nổi (khi không dùng externalMusicControl) */}
      {!externalMusicControl && !hidden.has("music") && (
        <LiveMusicFloatingButton
          src="/media/co-dien.mp3"
          title="Giai Điệu Cổ Điển"
          visible={coverGone}
          tone="minbrown"
        />
      )}

      {/* ============================================================
          1. MÀN BÌA PHONG THƯ 3 PHA ĐIỆN ẢNH 60FPS + FLIP KHỚP 100% HERO
          ============================================================ */}
      {!coverGone && (
        <div
          key="vintage-envelope-cover"
          className={cn(
            "absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none overflow-hidden",
            coverOpening && "pointer-events-none",
          )}
        >
          {/* Phông nền bìa riêng — mờ dần ở 2.72s -> 3.20s, KHÔNG làm mờ VintageHeroCard */}
          <m.div
            initial={false}
            animate={coverOpening ? { opacity: 0 } : { opacity: 1 }}
            transition={
              shouldReduceMotion
                ? { duration: 0.18 }
                : { delay: 2.72, duration: 0.48, ease: PAPER_EASE }
            }
            className="pointer-events-none absolute inset-0 z-0"
            style={{ backgroundColor: COLOR_BG, willChange: "opacity" }}
            aria-hidden="true"
          >
            <div
              className="absolute inset-0 opacity-55 bg-repeat"
              style={{
                backgroundImage: "url('/templates/mot-thoi-de-nho/bg-vintage-paper.webp')",
                backgroundSize: "320px 320px",
              }}
            />
          </m.div>

          {/* Hạt bụi nắng vàng nhẹ (tắt ngay khi coverOpening để giải phóng GPU) */}
          {!shouldReduceMotion && !coverOpening && (
            <div className="pointer-events-none absolute inset-0 z-5 overflow-hidden" aria-hidden="true">
              {AMBIENT_DUST_SEEDS.map((dot) => (
                <m.span
                  key={dot.id}
                  className="absolute rounded-full bg-[#C4A484]/45"
                  style={{ left: dot.left, top: dot.top, width: dot.size, height: dot.size }}
                  animate={{ y: [0, -14, 0], x: [0, 6, 0], opacity: [0.18, 0.55, 0.18] }}
                  transition={{ duration: dot.dur, delay: dot.delay, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}
            </div>
          )}

          {/* LỚP 2: SHARED VintageHeroCard ĐO FLIP — ẩn sạch sau bìa ngoài khi chưa mở, hiện & zoom mượt 100% khớp Hero thật */}
          {flipGeom && (
            <m.div
              data-cover-mini-hero="true"
              initial={false}
              animate={
                coverOpening && !shouldReduceMotion
                  ? { x: 0, y: 0, scale: 1, opacity: 1 }
                  : coverOpening
                    ? { x: 0, y: 0, scale: 1, opacity: 1 }
                    : {
                      x: flipGeom.startX,
                      y: flipGeom.startY,
                      scale: flipGeom.startScale,
                      opacity: 0,
                    }
              }
              transition={
                shouldReduceMotion
                  ? { duration: coverOpening ? 0.18 : 0 }
                  : coverOpening
                    ? {
                      x: { delay: 2.25, duration: 0.98, ease: ZOOM_EASE },
                      y: { delay: 2.25, duration: 0.98, ease: ZOOM_EASE },
                      scale: { delay: 2.25, duration: 0.98, ease: ZOOM_EASE },
                      opacity: { delay: 0.14, duration: 0.24, ease: "easeOut" },
                    }
                    : { duration: 0 }
              }
              className="pointer-events-none absolute z-12"
              style={{
                left: flipGeom.heroLeft,
                top: flipGeom.heroTop,
                width: flipGeom.heroWidth,
                height: flipGeom.heroHeight,
                transformOrigin: "center center",
                willChange: "transform, opacity",
              }}
            >
              <VintageHeroCard
                groomName={groomName}
                brideName={brideName}
                weekdayText={dateParts.weekday || "Thứ Bảy"}
                fullDateText={fullDateText}
                lunarText={lunarText}
                heroPhotoUrl={heroPhotoUrl}
                isHeroLive={false}
                shouldReduceMotion={Boolean(shouldReduceMotion)}
                markerType="mini"
              />
            </m.div>
          )}

          {/* Phong thư trung tâm (KHÔNG tạo stacking context để z-index của các lớp con xen kẽ đúng với z-12 Mini Hero) */}
          <div
            ref={envelopeRef}
            role="button"
            tabIndex={0}
            aria-label="Chạm mở lá thư kỷ niệm"
            onClick={handleOpenCover}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOpenCover();
              }
            }}
            className="relative w-full max-w-[340px] sm:max-w-[380px] h-[480px] sm:h-[520px] cursor-pointer"
          >
            {/* LỚP 1: Vỏ phong thư xung quanh (z-10, nằm dưới z-12 Mini Hero) */}
            <m.div
              initial={false}
              animate={
                coverOpening && !shouldReduceMotion
                  ? { scale: 1.16, opacity: 0 }
                  : { scale: 1, opacity: 1 }
              }
              transition={{ delay: 2.2, duration: 0.65, ease: PAPER_EASE }}
              className="absolute inset-0 z-10 rounded-2xl shadow-[0_20px_50px_rgba(74,55,40,0.22)]"
              style={{
                backgroundColor: COLOR_CARD,
                border: "1px solid rgba(196, 164, 132, 0.45)",
                willChange: "transform, opacity",
              }}
            >
              {/* Hoa ép góc trên trái */}
              <img
                loading="eager"
                decoding="async"
                src="/templates/mot-thoi-de-nho/pressed-flowers-corner-1.webp"
                alt="Hoa ép khô"
                className="absolute -top-3 -left-3 w-24 h-24 object-contain pointer-events-none z-10 opacity-90"
              />

              {/* Tem thư cổ góc phải trên */}
              <div className="absolute top-3 right-3 z-10 rotate-[4deg]">
                <img
                  loading="eager"
                  decoding="async"
                  src="/templates/mot-thoi-de-nho/vintage-stamp-postmark.webp"
                  alt="Tem thư cổ"
                  className="w-20 h-auto object-contain pointer-events-none"
                />
              </div>

              {/* Dải ren vải lanh dưới đáy */}
              <div className="absolute bottom-2 inset-x-4 z-15 flex justify-center opacity-75 pointer-events-none">
                <img
                  loading="eager"
                  decoding="async"
                  src="/templates/mot-thoi-de-nho/lace-ribbon-divider.webp"
                  alt="Dải ren cổ điển"
                  className="w-full max-w-[260px] h-6 object-contain"
                />
              </div>

              {/* Cành lá khô góc dưới đối diện */}
              <img
                loading="eager"
                decoding="async"
                src="/templates/mot-thoi-de-nho/pressed-flowers-corner-2.webp"
                alt="Hoa ép khô"
                className="absolute -bottom-3 -right-3 w-20 h-20 object-contain pointer-events-none z-15 opacity-85"
              />
            </m.div>

            {/* LỚP 3: TỜ GIẤY BÌA NGOÀI TÊN CẶP ĐÔI (z-15, nằm trên z-12 Mini Hero, trượt chậm đều sang trái 0.72s -> 2.72s) */}
            <m.div
              data-cover-outer-sheet="true"
              initial={false}
              animate={
                coverOpening && !shouldReduceMotion
                  ? { x: -420, y: -12, rotate: -10, opacity: 0 }
                  : { x: 0, y: 0, rotate: 0, opacity: 1 }
              }
              transition={{
                x: { delay: 0.72, duration: 2.0, ease: [0.42, 0, 0.25, 1] },
                y: { delay: 0.72, duration: 2.0, ease: [0.42, 0, 0.25, 1] },
                rotate: { delay: 0.72, duration: 2.0, ease: [0.42, 0, 0.25, 1] },
                opacity: { delay: 1.85, duration: 0.87, ease: "easeOut" },
              }}
              className="absolute inset-x-4 sm:inset-x-5 top-14 bottom-10 z-15 flex flex-col items-center justify-center rounded-xl px-4 pt-16 pb-5 text-center shadow-lg sm:px-6"
              style={{
                backgroundColor: "#FCF9F2",
                border: "1px dashed rgba(196, 164, 132, 0.65)",
                willChange: "transform, opacity",
              }}
            >
              <p
                className="text-[11px] uppercase tracking-[0.16em] text-[#8C6D53]"
                style={{ fontFamily: FONT_SERIF }}
              >
                Thiệp mời tham dự lễ cưới
              </p>

              <div className="mt-3 flex flex-col items-center">
                <h2
                  className="text-3xl sm:text-4xl leading-tight font-normal text-[#4A3728]"
                  style={{ fontFamily: FONT_SCRIPT }}
                >
                  {groomName}
                </h2>
                <span
                  className="my-0.5 text-xl sm:text-2xl text-[#7C3629]"
                  style={{ fontFamily: FONT_SCRIPT }}
                >
                  &amp;
                </span>
                <h2
                  className="text-3xl sm:text-4xl leading-tight font-normal text-[#4A3728]"
                  style={{ fontFamily: FONT_SCRIPT }}
                >
                  {brideName}
                </h2>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-[#705642]">
                <span className="w-6 h-[1px] bg-[#C4A484]/60" />
                <span style={{ fontFamily: FONT_SERIF }}>{fullDateText}</span>
                <span className="w-6 h-[1px] bg-[#C4A484]/60" />
              </div>

              <div className="mt-6 flex flex-col items-center gap-1 text-xs text-[#7C3629]">
                <p
                  className={cn("italic text-[14px]", !coverOpening && "animate-pulse")}
                  style={{ fontFamily: FONT_SCRIPT }}
                >
                  Chạm dấu sáp để mở lá thư
                </p>
              </div>
            </m.div>

            {/* LỚP 4: NẮP PHONG THƯ TAM GIÁC 3D 2 PHA ĐƠN MẶT (0° -> +90° ngoài, -90° -> 0° trong; không dùng preserve-3d + clip-path để triệt tiêu hoàn toàn Z-fighting & lộn ngược trên iOS WebKit) */}
            {/* Pha 1 (0° -> +90°): Mặt ngoài nắp màu kem nhọn xuống, bật ra phía trước (+Z) và biến mất đúng 90° */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 z-20 h-32 sm:h-36"
              style={{ perspective: "1100px" }}
            >
              <m.div
                data-cover-envelope-flap="true"
                initial={false}
                animate={
                  coverOpening && !shouldReduceMotion
                    ? { rotateX: 90, opacity: 0 }
                    : coverOpening
                      ? { rotateX: 0, opacity: 0 }
                      : { rotateX: 0, opacity: 1 }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0.16 }
                    : {
                      rotateX: { delay: 0.12, duration: 0.36, ease: [0.42, 0, 0.88, 0.86] },
                      opacity: { delay: 0.48, duration: 0.02 },
                    }
                }
                className="relative h-full w-full origin-top"
                style={{
                  clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  WebkitClipPath: "polygon(0 0, 100% 0, 50% 100%)",
                  backgroundColor: COLOR_CARD_ALT,
                  boxShadow: "0 8px 16px rgba(74, 55, 40, 0.09)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  willChange: "transform, opacity",
                }}
              />
            </div>

            {/* Pha 2 (-90° -> 0°): Mặt lót sọc cổ nhọn LÊN TRÊN đặt ngay phía trên nếp gấp (bottom: 100%, origin-bottom), chỉ mount khi đang mở */}
            {coverOpening && !shouldReduceMotion && (
              <div
                className="pointer-events-none absolute inset-x-0 bottom-full z-20 h-32 sm:h-36"
                style={{ perspective: "1100px" }}
              >
                <m.div
                  data-cover-envelope-flap-inner="true"
                  initial={{ rotateX: -90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: [0, 1, 1, 0] }}
                  transition={{
                    rotateX: { delay: 0.48, duration: 0.38, ease: [0.12, 0.62, 0.22, 1] },
                    opacity: { delay: 0.48, duration: 0.54, times: [0, 0.06, 0.7, 1], ease: "easeOut" },
                  }}
                  className="relative h-full w-full origin-bottom"
                  style={{
                    clipPath: "polygon(0 100%, 100% 100%, 50% 0)",
                    WebkitClipPath: "polygon(0 100%, 100% 100%, 50% 0)",
                    backgroundColor: "#E5D7BC",
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(124,54,41,0.06) 0 6px, transparent 6px 12px)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    willChange: "transform, opacity",
                  }}
                />
              </div>
            )}

            {/* Sợi dây gai SVG buộc ngang phong thư tách sang 2 bên (Nhịp 1: 0.05s -> 0.55s) */}
            <div
              className="pointer-events-none absolute inset-x-0 top-[102px] sm:top-[112px] z-25 flex items-center justify-between overflow-hidden"
              style={{ transform: "translateZ(2px)" }}
            >
              <m.svg
                viewBox="0 0 180 14"
                className="h-3.5 w-1/2"
                initial={false}
                animate={coverOpening ? { x: -60, opacity: 0 } : { x: 0, opacity: 0.92 }}
                transition={{ delay: 0.05, duration: 0.5, ease: PAPER_EASE }}
                style={{ willChange: "transform, opacity" }}
              >
                <path
                  d="M0 7 Q45 4 90 7 T180 7"
                  fill="none"
                  stroke="#9C7A58"
                  strokeWidth="2.2"
                  strokeDasharray="4 1.5"
                />
              </m.svg>
              <m.svg
                viewBox="0 0 180 14"
                className="h-3.5 w-1/2"
                initial={false}
                animate={coverOpening ? { x: 60, opacity: 0 } : { x: 0, opacity: 0.92 }}
                transition={{ delay: 0.05, duration: 0.5, ease: PAPER_EASE }}
                style={{ willChange: "transform, opacity" }}
              >
                <path
                  d="M0 7 Q45 10 90 7 T180 7"
                  fill="none"
                  stroke="#9C7A58"
                  strokeWidth="2.2"
                  strokeDasharray="4 1.5"
                />
              </m.svg>
            </div>

            {/* Con dấu sáp niêm phong (Nhịp 1: 0.00s -> 0.45s; tách translateZ(4px) chống nắp 3D đè mất trên iOS WebKit) */}
            <div
              className="pointer-events-none absolute top-[108px] sm:top-[118px] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
              style={{ transform: "translateZ(4px)" }}
            >
              <m.div
                data-cover-wax-seal="true"
                initial={false}
                animate={
                  coverOpening && !shouldReduceMotion
                    ? { scale: 0.72, rotate: -16, opacity: 0 }
                    : { scale: 1, rotate: 0, opacity: 1 }
                }
                transition={{ duration: 0.45, ease: PAPER_EASE }}
                style={{ willChange: "transform, opacity" }}
              >
              <div className="relative flex items-center justify-center">
                {!shouldReduceMotion && !coverOpening && (
                  <m.span
                    className="absolute h-16 w-16 rounded-full border border-[#7C3629]/45"
                    animate={{ scale: [1, 1.38, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
                    aria-hidden="true"
                  />
                )}
                <img
                  loading="eager"
                  decoding="async"
                  src="/templates/mot-thoi-de-nho/wax-seal-terracotta.webp"
                  alt="Dấu sáp niêm phong"
                  className="h-16 w-16 object-contain"
                />
              </div>
              </m.div>
            </div>

            {/* 6 cánh hoa khô ép bay tỏa nhẹ khi tờ giấy tên trượt đi (Nhịp 2) */}
            {!shouldReduceMotion && coverOpening && (
              <div
                className="pointer-events-none absolute top-[112px] left-1/2 z-30 -translate-x-1/2 -translate-y-1/2"
                aria-hidden="true"
              >
                {PRESSED_PETAL_SEEDS.map((petal) => (
                  <m.svg
                    key={petal.id}
                    viewBox="0 0 14 22"
                    className="absolute h-4 w-3"
                    initial={{ x: 0, y: 0, rotate: petal.rot0, scale: 0.4, opacity: 0 }}
                    animate={{
                      x: [0, petal.x1, petal.x2],
                      y: [0, petal.y * 0.55, petal.y],
                      rotate: [petal.rot0, petal.rot1],
                      scale: [0.4, 1, 0.72],
                      opacity: [0, 0.9, 0],
                    }}
                    transition={{ duration: 1.05, delay: petal.delay, ease: PAPER_EASE }}
                  >
                    <path d="M7 1 C11 5, 13 13, 7 21 C1 13, 3 5, 7 1 Z" fill={petal.color} />
                  </m.svg>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          2. NỘI DUNG THIỆP CHÍNH (HERO ĐỨNG SẴN KHỚP FLIP; 9 SECTION DƯỚI CHỈ MỞ KHI coverGone)
          ============================================================ */}
      <div className="mx-auto w-full max-w-2xl px-4 pt-10 pb-8 sm:px-6 sm:py-12 relative z-10 flex flex-col space-y-16 sm:space-y-24">
        {/* ----------------------------------------------------------
            SECTION 1: SCRAPBOOK COVER HERO (order: -1)
            ---------------------------------------------------------- */}
        <section
          style={{ order: -1 }}
          className={cn("relative", !coverGone && "opacity-0 pointer-events-none")}
        >
          <VintageHeroCard
            ref={heroCardRef}
            groomName={groomName}
            brideName={brideName}
            weekdayText={dateParts.weekday || "Thứ Bảy"}
            fullDateText={fullDateText}
            lunarText={lunarText}
            heroPhotoUrl={heroPhotoUrl}
            isHeroLive={coverGone}
            shouldReduceMotion={Boolean(shouldReduceMotion)}
            markerType="hero"
            onHeroImageLoad={measureFlipGeometry}
          />
        </section>

        {coverGone && (
          <>

            {/* ----------------------------------------------------------
            SECTION 2: HAI BÊN GIA ĐÌNH & ĐÔI THẺ POLAROID LẬT 3D (family)
            ---------------------------------------------------------- */}
            {!hidden.has("family") && (
              <section style={{ order: orderOf("family") }} className="text-center space-y-6">
                <m.div
                  initial={shouldReduceMotion ? false : { scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={VIEWPORT_ONCE}
                  transition={{ duration: 0.72, ease: PAPER_EASE }}
                  className="flex justify-center origin-center"
                >
                  <img
                    loading="lazy"
                    decoding="async"
                    src="/templates/mot-thoi-de-nho/lace-ribbon-divider.webp"
                    alt="Dải ren vải lanh"
                    className="w-full max-w-xs h-6 object-contain pointer-events-none opacity-80"
                  />
                </m.div>

                <VintageReveal className="rounded-2xl p-6 sm:p-8 bg-[#FAF6EC] border border-[#C4A484]/40 shadow-sm relative overflow-hidden">
                  <VintageReveal delay={0.05} distance={10}>
                    <h2
                      className="text-3xl sm:text-4xl font-normal text-[#4A3728]"
                      style={{ fontFamily: FONT_SCRIPT }}
                    >
                      Trân Trọng Kính Mời
                    </h2>
                  </VintageReveal>

                  <VintageReveal delay={0.12} distance={10}>
                    <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#5E493A] max-w-lg mx-auto">
                      Sự hiện diện và lời chúc phúc của Quý vị là niềm hạnh phúc trọn vẹn nhất cho chúng tôi trong ngày vui trọng đại này.
                    </p>
                  </VintageReveal>

                  {/* Đôi thẻ Polaroid chân dung lật 3D viết tay (ẩn khi bật data.hideCouplePhotos) */}
                  {!data.hideCouplePhotos && (
                    <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-6 pt-2">
                      {isBrideFirst ? (
                        <>
                          <VintagePolaroidFlipCard
                            photoUrl={bridePortraitUrl}
                            displayName={brideName}
                            fullName={brideFullName}
                            roleLabel="Cô dâu"
                            familyLabel="Nhà Gái"
                            backQuote={brideQuote}
                            tiltClass="rotate-[-2deg] hover:rotate-0"
                            tapeSrc="/templates/mot-thoi-de-nho/washi-tape-beige.webp"
                            muted={sfxMuted}
                            enterDirection="left"
                          />
                          <VintagePolaroidFlipCard
                            photoUrl={groomPortraitUrl}
                            displayName={groomName}
                            fullName={groomFullName}
                            roleLabel="Chú rể"
                            familyLabel="Nhà Trai"
                            backQuote={groomQuote}
                            tiltClass="rotate-[2deg] hover:rotate-0"
                            tapeSrc="/templates/mot-thoi-de-nho/washi-tape-kraft.webp"
                            muted={sfxMuted}
                            enterDirection="right"
                          />
                        </>
                      ) : (
                        <>
                          <VintagePolaroidFlipCard
                            photoUrl={groomPortraitUrl}
                            displayName={groomName}
                            fullName={groomFullName}
                            roleLabel="Chú rể"
                            familyLabel="Nhà Trai"
                            backQuote={groomQuote}
                            tiltClass="rotate-[-2deg] hover:rotate-0"
                            tapeSrc="/templates/mot-thoi-de-nho/washi-tape-kraft.webp"
                            muted={sfxMuted}
                            enterDirection="left"
                          />
                          <VintagePolaroidFlipCard
                            photoUrl={bridePortraitUrl}
                            displayName={brideName}
                            fullName={brideFullName}
                            roleLabel="Cô dâu"
                            familyLabel="Nhà Gái"
                            backQuote={brideQuote}
                            tiltClass="rotate-[2deg] hover:rotate-0"
                            tapeSrc="/templates/mot-thoi-de-nho/washi-tape-beige.webp"
                            muted={sfxMuted}
                            enterDirection="right"
                          />
                        </>
                      )}
                    </div>
                  )}

                  {/* Thông tin song thân hai bên (Hỗ trợ hostFirst: "bride") */}
                  <div className="mt-8 pt-6 border-t border-[#C4A484]/30 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
                    <VintageReveal delay={0.1} distance={12} className="space-y-1.5 p-3 rounded-xl bg-[#F5EFE2]/60">
                      {isBrideFirst ? (
                        <>
                          <p className="text-xs uppercase tracking-widest text-[#7C3629] font-medium" style={{ fontFamily: FONT_SERIF }}>
                            Nhà Gái
                          </p>
                          {brideParentsList.length > 0 ? (
                            brideParentsList.map((p, idx) => (
                              <p key={idx} className="text-sm font-medium text-[#4A3728]">{p}</p>
                            ))
                          ) : (
                            <p className="text-sm font-medium text-[#4A3728]">Gia Đình Cô Dâu</p>
                          )}
                          <p className="text-xs text-[#8C6D53] italic pt-1">
                            Cô dâu: <span className="font-semibold text-[#4A3728]">{brideFullName}</span>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs uppercase tracking-widest text-[#7C3629] font-medium" style={{ fontFamily: FONT_SERIF }}>
                            Nhà Trai
                          </p>
                          {groomParentsList.length > 0 ? (
                            groomParentsList.map((p, idx) => (
                              <p key={idx} className="text-sm font-medium text-[#4A3728]">{p}</p>
                            ))
                          ) : (
                            <p className="text-sm font-medium text-[#4A3728]">Gia Đình Chú Rể</p>
                          )}
                          <p className="text-xs text-[#8C6D53] italic pt-1">
                            Chú rể: <span className="font-semibold text-[#4A3728]">{groomFullName}</span>
                          </p>
                        </>
                      )}
                    </VintageReveal>

                    <VintageReveal delay={0.18} distance={12} className="space-y-1.5 p-3 rounded-xl bg-[#F5EFE2]/60">
                      {isBrideFirst ? (
                        <>
                          <p className="text-xs uppercase tracking-widest text-[#7C3629] font-medium" style={{ fontFamily: FONT_SERIF }}>
                            Nhà Trai
                          </p>
                          {groomParentsList.length > 0 ? (
                            groomParentsList.map((p, idx) => (
                              <p key={idx} className="text-sm font-medium text-[#4A3728]">{p}</p>
                            ))
                          ) : (
                            <p className="text-sm font-medium text-[#4A3728]">Gia Đình Chú Rể</p>
                          )}
                          <p className="text-xs text-[#8C6D53] italic pt-1">
                            Chú rể: <span className="font-semibold text-[#4A3728]">{groomFullName}</span>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs uppercase tracking-widest text-[#7C3629] font-medium" style={{ fontFamily: FONT_SERIF }}>
                            Nhà Gái
                          </p>
                          {brideParentsList.length > 0 ? (
                            brideParentsList.map((p, idx) => (
                              <p key={idx} className="text-sm font-medium text-[#4A3728]">{p}</p>
                            ))
                          ) : (
                            <p className="text-sm font-medium text-[#4A3728]">Gia Đình Cô Dâu</p>
                          )}
                          <p className="text-xs text-[#8C6D53] italic pt-1">
                            Cô dâu: <span className="font-semibold text-[#4A3728]">{brideFullName}</span>
                          </p>
                        </>
                      )}
                    </VintageReveal>
                  </div>
                </VintageReveal>
              </section>
            )}

            {/* ----------------------------------------------------------
            SECTION 3: LỄ CƯỚI & SỰ KIỆN (map)
            ---------------------------------------------------------- */}
            {!hidden.has("map") && (
              <section style={{ order: orderOf("map") }} className="space-y-6">
                <VintageReveal className="text-center">
                  <h2
                    className="text-3xl sm:text-4xl font-normal text-[#4A3728]"
                    style={{ fontFamily: FONT_SCRIPT }}
                  >
                    Lễ Cưới &amp; Sự Kiện
                  </h2>
                </VintageReveal>

                <div className="space-y-5 pt-2">
                  {visibleEvents.map((evt: WeddingEvent, idx: number) => {
                    const evtParts = formatWeddingDateParts(evt.startsAt);
                    const evtFullDate = `${evtParts.day}/${evtParts.month}/${evtParts.year}`;
                    const evtLunar = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : "";
                    const directionsUrl = getEventDirectionsUrl(evt);

                    return (
                      <VintageReveal
                        key={evt.id || idx}
                        delay={idx * 0.1}
                        className="relative rounded-2xl p-6 sm:p-7 shadow-sm border border-[#C4A484]/50 transition-transform duration-300"
                      >
                        <div className="rounded-xl" style={{ backgroundColor: COLOR_CARD }}>
                          {/* Dấu sáp nhỏ xoay đóng vào góc */}
                          <m.div
                            initial={shouldReduceMotion ? false : { scale: 0.7, rotate: -20, opacity: 0 }}
                            whileInView={{ scale: 1, rotate: 0, opacity: 0.88 }}
                            viewport={VIEWPORT_ONCE}
                            transition={{ duration: 0.5, delay: 0.18 + idx * 0.08, ease: PAPER_EASE }}
                            className="absolute top-4 right-4 drop-shadow-xs"
                          >
                            <img
                              loading="lazy"
                              decoding="async"
                              src="/templates/mot-thoi-de-nho/wax-seal-terracotta.webp"
                              alt="Dấu sáp"
                              className="w-10 h-10 object-contain"
                            />
                          </m.div>

                          <h3
                            className="text-xl sm:text-2xl font-semibold text-[#7C3629] pr-12"
                            style={{ fontFamily: FONT_SERIF }}
                          >
                            {evt.title || (idx === 0 ? "Lễ Thành Hôn" : "Tiệc Cưới")}
                          </h3>

                          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#4A3728]">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Clock className="w-4 h-4 text-[#7C3629] shrink-0" />
                              <span>{evtParts.time || "11:00"}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-4 h-4 text-[#7C3629] shrink-0" />
                              <span>
                                {evtParts.weekday || "Thứ Bảy"}, {evtFullDate}
                              </span>
                            </div>
                          </div>

                          {evtLunar && (
                            <p className="mt-1 text-xs text-[#7A604D] italic pl-6">
                              (Tức ngày {evtLunar})
                            </p>
                          )}

                          <div className="mt-4 pt-3 border-t border-[#C4A484]/30 space-y-1">
                            <p className="font-semibold text-sm sm:text-base text-[#4A3728] flex items-start gap-1.5">
                              <MapPin className="w-4 h-4 text-[#7C3629] shrink-0 mt-0.5" />
                              <span>{evt.venueName || "Tư gia"}</span>
                            </p>
                            {evt.venueAddress && (
                              <p className="text-xs sm:text-sm text-[#5E493A] pl-5.5 leading-relaxed">
                                {evt.venueAddress}
                              </p>
                            )}
                          </div>

                          {directionsUrl && (
                            <div className="mt-5 pl-5.5">
                              <a
                                href={directionsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#7C3629] text-white shadow-xs hover:bg-[#642A1F] transition-colors"
                              >
                                <Compass className="w-3.5 h-3.5" />
                                <span>Chỉ đường Google Maps</span>
                                <ExternalLink className="w-3 h-3 opacity-80" />
                              </a>
                            </div>
                          )}
                        </div>
                      </VintageReveal>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ----------------------------------------------------------
            SECTION 4: CÂU CHUYỆN TÌNH YÊU (story - Standard & Pro)
            ---------------------------------------------------------- */}
            {isStoryVisible && (
              <section style={{ order: orderOf("story") }} className="space-y-6">
                <VintageReveal className="text-center">
                  <h2
                    className="text-3xl sm:text-4xl font-normal text-[#4A3728]"
                    style={{ fontFamily: FONT_SCRIPT }}
                  >
                    Chuyện Chúng Mình
                  </h2>
                </VintageReveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                  {storyMilestones.map((item: StoryMilestone, idx: number) => (
                    <VintageReveal
                      key={idx}
                      delay={idx * 0.08}
                      direction={idx % 2 === 0 ? "left" : "right"}
                      distance={16}
                      initialRotate={idx % 2 === 0 ? -3 : 3}
                      finalRotate={idx % 2 === 0 ? -0.8 : 0.8}
                    >
                      <div
                        className="relative rounded-xl p-5 sm:p-6 shadow-sm transition-transform duration-300 hover:scale-[1.015]"
                        style={{
                          backgroundImage: "url('/templates/mot-thoi-de-nho/kraft-note-card.webp')",
                          backgroundSize: "100% 100%",
                          backgroundRepeat: "no-repeat",
                        }}
                      >
                        <m.img
                          loading="lazy"
                          decoding="async"
                          src="/templates/mot-thoi-de-nho/washi-tape-kraft.webp"
                          alt=""
                          aria-hidden="true"
                          initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.12, y: -4 }}
                          whileInView={{ opacity: 1, scale: 1, y: 0 }}
                          viewport={VIEWPORT_ONCE}
                          transition={{ duration: 0.48, delay: 0.16 + idx * 0.08, ease: PAPER_EASE }}
                          className={cn(
                            "absolute -top-3 w-16 h-auto pointer-events-none drop-shadow-xs",
                            idx % 2 === 0 ? "left-4 -rotate-6" : "right-4 rotate-6",
                          )}
                        />

                        <div className="flex flex-wrap items-center gap-2.5">
                          {item.year ? (
                            <span
                              className="inline-block px-4 py-1.5 rounded-full text-xl sm:text-2xl leading-none font-bold bg-[#7C3629] text-[#FAF6EC] shadow-xs tracking-wide shrink-0"
                              style={{ fontFamily: FONT_SERIF }}
                            >
                              {item.year}
                            </span>
                          ) : null}
                          <h3
                            className="text-lg font-medium text-[#4A3728]"
                            style={{ fontFamily: FONT_SERIF }}
                          >
                            {item.title}
                          </h3>
                        </div>

                        <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#5E493A] italic">
                          &ldquo;{item.content}&rdquo;
                        </p>
                      </div>
                    </VintageReveal>
                  ))}
                </div>
              </section>
            )}

            {/* ----------------------------------------------------------
            SECTION 5: TRANG PHỤC & LỊCH TRÌNH (dresscode)
            ---------------------------------------------------------- */}
            {!hidden.has("dresscode") && (
              <section style={{ order: orderOf("dresscode") }} className="space-y-6 pt-2">
                {data.timeline && data.timeline.length > 0 && (
                  <div className="space-y-4">
                    <VintageReveal className="text-center">
                      <h3
                        className="text-2xl sm:text-3xl font-normal text-[#4A3728]"
                        style={{ fontFamily: FONT_SCRIPT }}
                      >
                        Lịch Trình Tiệc Cưới
                      </h3>
                    </VintageReveal>

                    <div className="relative mx-auto max-w-md pl-6 sm:pl-8 space-y-3">
                      <m.span
                        initial={shouldReduceMotion ? false : { scaleY: 0 }}
                        whileInView={{ scaleY: 1 }}
                        viewport={VIEWPORT_ONCE}
                        transition={{ duration: 0.9, ease: PAPER_EASE }}
                        className="absolute left-2 top-2 bottom-2 w-[2px] origin-top bg-[#C4A484]/55"
                        aria-hidden="true"
                      />
                      {data.timeline.map((step, idx) => (
                        <VintageReveal
                          key={step.id || idx}
                          delay={idx * 0.08}
                          direction="left"
                          distance={12}
                          className="relative group"
                        >
                          <m.span
                            initial={shouldReduceMotion ? false : { scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={VIEWPORT_ONCE}
                            transition={{ duration: 0.35, delay: 0.1 + idx * 0.08, ease: PAPER_EASE }}
                            className="absolute -left-[22px] sm:-left-[30px] top-3 h-3.5 w-3.5 rounded-full border-2 border-[#FAF6EC] bg-[#7C3629] shadow-xs"
                          />
                          <div className="rounded-xl border border-[#C4A484]/40 bg-[#FAF6EC] p-3 sm:p-4 text-left shadow-2xs">
                            <span
                              className="text-xs font-bold text-[#7C3629] uppercase tracking-wider"
                              style={{ fontFamily: FONT_SERIF }}
                            >
                              {step.time}
                            </span>
                            <h4 className="text-sm sm:text-base font-medium text-[#4A3728] mt-0.5">
                              {step.label}
                            </h4>
                          </div>
                        </VintageReveal>
                      ))}
                    </div>
                  </div>
                )}

                {dressCodeSwatches.length > 0 && (
                  <VintageReveal className="text-center space-y-3 pt-2">
                    <p
                      className="text-xs uppercase tracking-[0.2em] text-[#8C6D53]"
                      style={{ fontFamily: FONT_SERIF }}
                    >
                      Trang Phục Gợi Ý
                    </p>

                    <div className="flex items-center justify-center gap-4 pt-1">
                      {dressCodeSwatches.map((item, idx) => (
                        <m.div
                          key={idx}
                          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.72, y: 8 }}
                          whileInView={{ opacity: 1, scale: 1, y: 0 }}
                          viewport={VIEWPORT_ONCE}
                          transition={{ duration: 0.45, delay: idx * 0.07, ease: PAPER_EASE }}
                          className="flex flex-col items-center gap-1.5"
                        >
                          <span
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-xs border border-[#C4A484]/60 transition-transform hover:scale-110"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[11px] text-[#5E493A]">{item.name}</span>
                        </m.div>
                      ))}
                    </div>
                  </VintageReveal>
                )}
              </section>
            )}

            {/* ----------------------------------------------------------
            SECTION 6: TỜ LỊCH XÉ VẬT LÝ, DẤU BƯU ĐIỆN & ĐẾM NGƯỢC (calendar)
            ---------------------------------------------------------- */}
            {!hidden.has("calendar") && (
              <section style={{ order: orderOf("calendar") }} className="space-y-6">
                <VintageReveal className="text-center">
                  <h2
                    className="text-3xl sm:text-4xl font-normal text-[#4A3728]"
                    style={{ fontFamily: FONT_SCRIPT }}
                  >
                    Ngày Chung Đôi
                  </h2>
                </VintageReveal>

                <VintageTearOffCalendar
                  monthText={dateParts.month}
                  yearText={dateParts.year}
                  dotDateText={dotDateText}
                  calendarDays={calendarDays}
                  muted={sfxMuted}
                  reducedMotion={Boolean(shouldReduceMotion)}
                />

                {/* 4 ô đếm ngược stagger bật lên nhẹ */}
                <div className="pt-2">
                  <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto text-center">
                    {[
                      { label: "Ngày", val: timeLeft.days },
                      { label: "Giờ", val: timeLeft.hours },
                      { label: "Phút", val: timeLeft.minutes },
                      { label: "Giây", val: timeLeft.seconds },
                    ].map((box, bIdx) => (
                      <VintageReveal
                        key={bIdx}
                        delay={bIdx * 0.07}
                        distance={12}
                        initialScale={0.94}
                        className="rounded-xl p-3 bg-white border border-[#C4A484]/40 shadow-xs"
                      >
                        <span
                          className="block text-2xl sm:text-3xl font-bold text-[#7C3629]"
                          style={{ fontFamily: FONT_SERIF }}
                        >
                          {padCountdownUnit(box.val)}
                        </span>
                        <span className="block text-[10px] uppercase tracking-wider text-[#8C6D53] mt-0.5">
                          {box.label}
                        </span>
                      </VintageReveal>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* ----------------------------------------------------------
            SECTION 7: HỘP QUÀ KỶ NIỆM (gift)
            ---------------------------------------------------------- */}
            {!hidden.has("gift") && (
              <section style={{ order: orderOf("gift") }} className="text-center space-y-4">
                <VintageReveal>
                  <h2
                    className="text-3xl sm:text-4xl font-normal text-[#4A3728]"
                    style={{ fontFamily: FONT_SCRIPT }}
                  >
                    Hộp Mừng Cưới
                  </h2>
                </VintageReveal>

                <VintageReveal delay={0.1} distance={14} className="pt-2 flex justify-center">
                  <m.button
                    type="button"
                    onClick={handleGiftClick}
                    disabled={isGiftOpening}
                    animate={
                      giftBoxStage === "open"
                        ? { scale: 1.05 }
                        : shouldReduceMotion
                          ? undefined
                          : { y: [0, -4, 0] }
                    }
                    transition={
                      giftBoxStage === "open"
                        ? { duration: 0.3 }
                        : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
                    }
                    className="relative group cursor-pointer focus:outline-none transition-transform duration-300 active:scale-95"
                    aria-label="Mở hộp quà kỷ niệm mừng cưới"
                  >
                    <div className="relative w-44 sm:w-52 h-44 sm:h-52 flex items-center justify-center">
                      {giftBoxStage === "normal" && (
                        <img
                          loading="lazy"
                          decoding="async"
                          src="/templates/mot-thoi-de-nho/gift-box-closed.webp"
                          alt="Hộp quà kỷ niệm giấy kraft"
                          className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 group-hover:rotate-1"
                        />
                      )}

                      {giftBoxStage === "glow" && (
                        <img
                          loading="lazy"
                          decoding="async"
                          src="/templates/mot-thoi-de-nho/gift-box-opening.webp"
                          alt="Hộp quà đang hé mở"
                          className="w-full h-full object-contain drop-shadow-lg animate-pulse"
                        />
                      )}

                      {giftBoxStage === "open" && (
                        <img
                          loading="lazy"
                          decoding="async"
                          src="/templates/mot-thoi-de-nho/gift-box-opened.webp"
                          alt="Hộp quà đã mở"
                          className="w-full h-full object-contain drop-shadow-xl"
                        />
                      )}
                    </div>

                    <span
                      className="mt-2 inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-[#7C3629] text-white shadow-xs"
                      style={{ fontFamily: FONT_SERIF }}
                    >
                      Chạm gửi mừng cưới
                    </span>
                  </m.button>
                </VintageReveal>

                <GiftModal
                  open={giftModalOpen}
                  onClose={handleCloseModal}
                  gift={data.gift}
                  plan={(data.plan as WeddingPlan) || "free"}
                  coupleName={`${groomName} & ${brideName}`}
                  guestName={guestName}
                  tone="minbrown"
                />
              </section>
            )}

            {/* ----------------------------------------------------------
            SECTION 8: XÁC NHẬN THAM DỰ (rsvp)
            ---------------------------------------------------------- */}
            {!hidden.has("rsvp") && (
              <section style={{ order: orderOf("rsvp") }} className="space-y-4">
                <VintageReveal className="rounded-2xl p-6 sm:p-8 bg-[#FAF6EC] border border-[#C4A484]/40 shadow-sm relative overflow-hidden">
                  <m.img
                    loading="lazy"
                    decoding="async"
                    src="/templates/mot-thoi-de-nho/washi-tape-beige.webp"
                    alt=""
                    aria-hidden="true"
                    initial={shouldReduceMotion ? false : { opacity: 0, scale: 1.12, y: -4 }}
                    whileInView={{ opacity: 0.92, scale: 1, y: 0 }}
                    viewport={VIEWPORT_ONCE}
                    transition={{ duration: 0.5, delay: 0.2, ease: PAPER_EASE }}
                    className="absolute -top-3 left-8 w-16 h-auto pointer-events-none drop-shadow-xs -rotate-6"
                  />

                  <TemplateRsvpSection
                    data={data}
                    mode={mode}
                    tone="minbrown"
                    customTheme={{
                      isDark: false,
                      wrap: "bg-transparent text-[#4A3728]",
                      heading: "text-[#7C3629]",
                      card: "bg-[#FAF6EC] border border-[#C4A484]/60 text-[#4A3728] shadow-xs",
                      input: "bg-[#FCF9F2] border border-[#C4A484]/50 text-[#4A3728] placeholder:text-[#8C6D53] focus:border-[#7C3629]",
                      primaryBtn: "bg-[#7C3629] text-white hover:bg-[#642A1F] font-semibold shadow-xs",
                      outlineBtn: "border border-[#C4A484] bg-[#FCF9F2] text-[#4A3728] hover:bg-[#C4A484]/15",
                      optionBg: "#FAF6EC",
                      optionColor: "#4A3728",
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
                </VintageReveal>
              </section>
            )}

            {/* ----------------------------------------------------------
            SECTION 9: ALBUM ẢNH KỶ NIỆM (album)
            ---------------------------------------------------------- */}
            {!hidden.has("album") && (
              <section style={{ order: orderOf("album") }} className="space-y-6">
                <VintageReveal className="text-center">
                  <h2
                    className="text-3xl sm:text-4xl font-normal text-[#4A3728]"
                    style={{ fontFamily: FONT_SCRIPT }}
                  >
                    Thước Phim Kỷ Niệm
                  </h2>
                </VintageReveal>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  {galleryPhotos[0] && (
                    <VintageReveal delay={0.05} initialRotate={-4.5} finalRotate={-2}>
                      <div
                        onClick={() => setLightboxIndex(0)}
                        className="relative rounded-lg p-3 pb-8 bg-white shadow-md border border-[#E8DFC8] cursor-pointer transition-transform duration-300 hover:scale-[1.03] hover:z-20 group"
                      >
                        <img
                          loading="lazy"
                          decoding="async"
                          src="/templates/mot-thoi-de-nho/washi-tape-beige.webp"
                          alt=""
                          aria-hidden="true"
                          className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-auto z-10 -rotate-2 pointer-events-none drop-shadow-xs"
                        />
                        <div className="aspect-[4/5] w-full overflow-hidden rounded bg-[#FAF6EC]">
                          <img
                            loading="lazy"
                            decoding="async"
                            src={galleryPhotos[0].url}
                            alt={galleryPhotos[0].alt || "Kỷ niệm"}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <p
                          className="mt-3 text-center text-xs sm:text-sm text-[#7A604D] italic"
                          style={{ fontFamily: FONT_SCRIPT }}
                        >
                          {galleryPhotos[0].alt || "Ngày chung đôi"}
                        </p>
                      </div>
                    </VintageReveal>
                  )}

                  {galleryPhotos[1] && (
                    <VintageReveal delay={0.12} initialRotate={4} finalRotate={1.5}>
                      <div
                        onClick={() => setLightboxIndex(1)}
                        className="relative rounded-lg p-3 pb-8 bg-white shadow-md border border-[#E8DFC8] cursor-pointer transition-transform duration-300 hover:scale-[1.03] hover:z-20 group"
                      >
                        <img
                          loading="lazy"
                          decoding="async"
                          src="/templates/mot-thoi-de-nho/washi-tape-beige.webp"
                          alt=""
                          aria-hidden="true"
                          className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-auto z-10 rotate-3 pointer-events-none drop-shadow-xs"
                        />
                        <div className="aspect-[4/5] w-full overflow-hidden rounded bg-[#FAF6EC]">
                          <img
                            loading="lazy"
                            decoding="async"
                            src={galleryPhotos[1].url}
                            alt={galleryPhotos[1].alt || "Kỷ niệm"}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <p
                          className="mt-3 text-center text-xs sm:text-sm text-[#7A604D] italic"
                          style={{ fontFamily: FONT_SCRIPT }}
                        >
                          {galleryPhotos[1].alt || "Khoảnh khắc chung đôi"}
                        </p>
                      </div>
                    </VintageReveal>
                  )}

                  {galleryPhotos[2] && (
                    <VintageReveal delay={0.18} direction="left" distance={14}>
                      <div
                        onClick={() => setLightboxIndex(2)}
                        className="relative rounded-xl p-3 bg-[#FAF6EC] shadow-sm border border-[#C4A484]/50 cursor-pointer transition-transform duration-300 hover:scale-[1.02] group"
                      >
                        <img
                          loading="lazy"
                          decoding="async"
                          src="/templates/mot-thoi-de-nho/washi-tape-kraft.webp"
                          alt=""
                          aria-hidden="true"
                          className="absolute -top-3 right-6 w-16 h-auto z-10 rotate-6 pointer-events-none drop-shadow-xs"
                        />
                        <div
                          className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#EDE3CE]"
                          style={{ boxShadow: "inset 0 0 10px rgba(74, 55, 40, 0.15)" }}
                        >
                          <img
                            loading="lazy"
                            decoding="async"
                            src={galleryPhotos[2].url}
                            alt={galleryPhotos[2].alt || "Kỷ niệm"}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-[#8C6D53]">
                          <span className="italic" style={{ fontFamily: FONT_SCRIPT }}>
                            {galleryPhotos[2].alt || "Khoảnh khắc bình yên"}
                          </span>
                          <span style={{ fontFamily: FONT_SERIF }}>03</span>
                        </div>
                      </div>
                    </VintageReveal>
                  )}

                  {galleryPhotos[3] && (
                    <VintageReveal delay={0.24} direction="right" distance={14}>
                      <div
                        onClick={() => setLightboxIndex(3)}
                        className="relative rounded-xl p-4 bg-[#FCF9F2] shadow-sm border border-[#C4A484]/40 cursor-pointer transition-transform duration-300 hover:scale-[1.02] group"
                      >
                        <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-[#7C3629] z-10 pointer-events-none" />
                        <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-[#7C3629] z-10 pointer-events-none" />
                        <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-[#7C3629] z-10 pointer-events-none" />
                        <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-[#7C3629] z-10 pointer-events-none" />

                        <div className="aspect-[4/3] w-full overflow-hidden rounded bg-[#EDE3CE]">
                          <img
                            loading="lazy"
                            decoding="async"
                            src={galleryPhotos[3].url}
                            alt={galleryPhotos[3].alt || "Kỷ niệm"}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <p
                          className="mt-2.5 text-center text-xs text-[#7A604D] italic"
                          style={{ fontFamily: FONT_SCRIPT }}
                        >
                          {galleryPhotos[3].alt || "Ánh mắt trao nhau"}
                        </p>
                      </div>
                    </VintageReveal>
                  )}
                </div>

                {galleryPhotos.length > 4 && (
                  <VintageReveal delay={0.14} distance={16} className="pt-4">
                    <div className="relative rounded-xl p-4 bg-[#3B2C22] shadow-md border border-[#2A1F18] overflow-hidden text-white">
                      <div className="flex justify-between items-center pb-2.5 px-2 border-b border-[#5E493A]/40 overflow-hidden">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <span
                            key={i}
                            className="w-2.5 h-1.5 rounded-[2px] bg-[#EDE3CE]/80 shrink-0 mx-1"
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3 py-3">
                        {galleryPhotos.slice(4, 6).map((photo, pIdx) => (
                          <div
                            key={pIdx}
                            onClick={() => setLightboxIndex(4 + pIdx)}
                            className="relative aspect-[3/2] overflow-hidden rounded bg-black/60 cursor-pointer group"
                          >
                            <img
                              loading="lazy"
                              decoding="async"
                              src={photo.url}
                              alt={photo.alt || "Cuộn phim cổ"}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                            />
                            <span className="absolute bottom-1 right-1.5 px-1 rounded bg-black/70 text-[9px] font-mono text-[#E4D1A7]">
                              0{4 + pIdx + 1}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2.5 px-2 border-t border-[#5E493A]/40 overflow-hidden">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <span
                            key={i}
                            className="w-2.5 h-1.5 rounded-[2px] bg-[#EDE3CE]/80 shrink-0 mx-1"
                          />
                        ))}
                      </div>
                    </div>
                  </VintageReveal>
                )}

                {lightboxIndex !== null && (
                  <TemplateLightboxModal
                    photos={galleryPhotos}
                    activeIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    onChangeIndex={(newIdx) => setLightboxIndex(newIdx)}
                  />
                )}
              </section>
            )}

            {/* ----------------------------------------------------------
            SECTION 10: GUEST ALBUM QR (albumQr)
            ---------------------------------------------------------- */}
            {!hidden.has("albumQr") && data.plan !== "free" && (weddingSlug || data.weddingSlug) && (
              <section style={{ order: orderOf("albumQr") }} className="pt-4 flex justify-center">
                <VintageReveal distance={14} className="w-full flex justify-center">
                  <GuestAlbumQr slug={weddingSlug || data.weddingSlug} accentColor={COLOR_TERRACOTTA} />
                </VintageReveal>
              </section>
            )}

            {/* Footer lưu bút mộc mạc */}
            <footer
              style={{ order: 999 }}
              className="pt-8 pb-12 text-center text-xs text-[#8C6D53] border-t border-[#C4A484]/30 space-y-1"
            >
              <VintageReveal distance={10}>
                <p className="italic text-sm text-[#4A3728]" style={{ fontFamily: FONT_SCRIPT }}>
                  {groomName} &amp; {brideName}
                </p>
                <p className="mt-1">© {dateParts.year || "2027"} Trân Trọng Cảm Ơn</p>
              </VintageReveal>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
