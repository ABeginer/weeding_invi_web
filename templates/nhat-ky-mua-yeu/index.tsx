"use client";

import * as React from "react";
import {
  MapPin,
  ExternalLink,
  Calendar as CalendarIcon,
  RotateCcw,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playCoverSfx, playInteractionSfx } from "@/lib/sfx";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingPlan } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import { useWeddingCountdown, padCountdownUnit } from "../shared/useCountdown";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: NHẬT KÝ MÙA YÊU (nhat-ky-mua-yeu) — STANDARD EDITION
   - Kem ngà giấy vintage: #F6EFE2 (thẻ ghi chú sáng: #FCF9F2)
   - Nâu giấy kraft: #C49A6C / #9E744B
   - Vàng nhạt giấy note: #F3DFA2
   - Xanh sage washi tape: #7D9378
   - Đỏ gạch tem thư & CTA: #B85042 (hover: #9C3F33)
   - Mực nâu trầm chữ đọc rõ: #3B2C22 (chính), #6F5D50 (phụ)
   ============================================================ */

const COLOR_BG = "#F6EFE2";
const COLOR_SAGE = "#7D9378";
const COLOR_RED_BRICK = "#B85042";
const COLOR_TEXT_MAIN = "#3B2C22";
const COLOR_TEXT_MUTED = "#6F5D50";

const TITLE_FONT = 'var(--font-playfair), "Playfair Display", Georgia, serif';
const SCRIPT_FONT = 'var(--font-great-vibes), "Great Vibes", cursive';
const BODY_FONT = 'var(--font-montserrat), "Montserrat", sans-serif';

const DIARY_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const COVER_FINISH_MS = 3300;

const DEFAULT_DRESS = ["#B85042", "#7D9378", "#C49A6C"];

type StoryMilestone = NonNullable<TemplateData["story"]>[number];

const DEFAULT_STORY_MILESTONES: StoryMilestone[] = [
  {
    year: "2021",
    title: "Trang nhật ký đầu tiên",
    content:
      "Cơn mưa chiều tháng Mười níu hai người xa lạ đứng chung mái hiên quán sách cũ, mở đầu cho những dòng viết tay còn dang dở.",
  },
  {
    year: "2023",
    title: "Cuộn phim mùa hạ",
    content:
      "Cùng nhau rong ruổi qua những cung đường đầy nắng gió, lưu lại từng bức ảnh Polaroid nhỏ xíu dán kín một góc bàn.",
  },
  {
    year: "2025",
    title: "Lời hẹn dưới ánh đèn vàng",
    content:
      "Chiếc nhẫn giản dị lồng vào tay trong buổi tối bình yên, khép lại những ngày chờ đợi để bước sang chương mới.",
  },
  {
    year: "2027",
    title: "Chung một mái nhà",
    content:
      "Gửi tấm thiệp nhỏ thay lời mời chân thành, mong được đón bạn đến chứng kiến ngày tụi mình chính thức về chung một nhà.",
  },
];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function parseParents(names?: string | null): [string, string | null] {
  if (!names) return ["", null];
  const parts = names.split(/\s*&\s*/);
  return [parts[0]?.trim() || "", parts[1]?.trim() || null];
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
   BĂNG KEO WASHI SẠCH CẠNH (washi_plaid cần cắt gọn phần thừa ở đáy)
   ============================================================ */
function WashiTapeGraphic({
  variant,
  eager = false,
  className,
}: {
  variant: "sage" | "plaid";
  eager?: boolean;
  className?: string;
}) {
  if (variant === "plaid") {
    return (
      <div className={cn("aspect-[430/136] w-full overflow-hidden drop-shadow-sm", className)}>
        <img
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          src="/templates/nhat-ky-mua-yeu/washi_plaid.webp"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-top"
        />
      </div>
    );
  }
  return (
    <img
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      src="/templates/nhat-ky-mua-yeu/washi_sage.webp"
      alt=""
      aria-hidden="true"
      className={cn("h-auto w-full object-contain drop-shadow-sm", className)}
    />
  );
}

/* ============================================================
   HỆ THỐNG DÒ VÙNG CUỘN & REVEAL 1/3 MÀN HÌNH + DÁN BĂNG KEO CUỘN ÉP
   ============================================================ */
interface DiaryScrollContextValue {
  scrollRootRef: React.RefObject<HTMLDivElement | null>;
  contained: boolean;
}

const DiaryScrollContext = React.createContext<DiaryScrollContextValue>({
  scrollRootRef: { current: null },
  contained: false,
});

function findDiaryScrollParent(el: HTMLElement | null): HTMLElement | null {
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

const DiaryRevealVisibleContext = React.createContext<boolean>(false);

function DiaryTapeReveal({
  children,
  className,
  delay = 0,
  distance = 26,
  duration = 0.85,
  initialRotate = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
  duration?: number;
  initialRotate?: number;
}) {
  const reduce = Boolean(useReducedMotion());
  const { scrollRootRef, contained } = React.useContext(DiaryScrollContext);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    if (reduce || isVisible) return;
    const el = containerRef.current;
    if (!el) return;

    const detectedParent = findDiaryScrollParent(el);
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

      if (rect.top <= triggerY) {
        setIsVisible(true);
        return true;
      }

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
    <DiaryRevealVisibleContext.Provider value={shown}>
      <div ref={containerRef} className={className}>
        <m.div
          initial={reduce ? false : { opacity: 0, y: distance, scale: 0.975, rotate: initialRotate }}
          animate={
            shown
              ? { opacity: 1, y: 0, scale: 1, rotate: 0 }
              : { opacity: 0, y: distance, scale: 0.975, rotate: initialRotate }
          }
          transition={reduce ? { duration: 0.01 } : { duration, delay, ease: DIARY_EASE }}
          className={className?.includes("h-full") ? "h-full" : undefined}
          style={shown ? undefined : { willChange: "transform, opacity" }}
        >
          {children}
        </m.div>
      </div>
    </DiaryRevealVisibleContext.Provider>
  );
}

const washiImgCache = new Map<"sage" | "plaid", HTMLImageElement>();

function getCachedWashiImage(variant: "sage" | "plaid"): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  const cached = washiImgCache.get(variant);
  if (cached) return cached;
  const img = new window.Image();
  img.decoding = "async";
  img.src =
    variant === "sage"
      ? "/templates/nhat-ky-mua-yeu/washi_sage.webp"
      : "/templates/nhat-ky-mua-yeu/washi_plaid.webp";
  washiImgCache.set(variant, img);
  return img;
}

/* Hiệu ứng miếng băng keo Washi cuộn tròn thành ống nhỏ rồi lăn nhẹ, hạ phẳng xuống mép ảnh (Canvas 2D) */
function AnimatedWashiTape({
  variant,
  direction = "left-to-right",
  delay = 0.42,
  rotateDeg = 0,
  className,
}: {
  variant: "sage" | "plaid";
  direction?: "left-to-right" | "right-to-left";
  delay?: number;
  rotateDeg?: number;
  className?: string;
}) {
  const reduce = Boolean(useReducedMotion());
  const parentVisible = React.useContext(DiaryRevealVisibleContext);
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [settled, setSettled] = React.useState(false);

  const isLtr = direction === "left-to-right";

  React.useEffect(() => {
    if (reduce || !parentVisible || settled) return;

    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const washiImg = getCachedWashiImage(variant);
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    let rafId = 0;
    const durationMs = 1080;

    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const quintic = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    // Kích thước thực tế phần thân băng keo trong wrapper
    const tapeW = host.clientWidth || 88;
    const tapeH = host.clientHeight || Math.round(tapeW * (variant === "plaid" ? 136 / 430 : 140 / 465));
    // Đệm không gian canvas phía trên & hai bên để vòng cuộn giấy lăn thoáng không bị cắt
    const padX = Math.max(18, Math.round(tapeW * 0.24));
    const padTop = Math.max(28, Math.round(tapeH * 1.45));
    const padBot = Math.max(12, Math.round(tapeH * 0.45));
    const cw = tapeW + padX * 2;
    const ch = tapeH + padTop + padBot;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.left = `-${padX}px`;
    canvas.style.top = `-${padTop}px`;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const drawTapeFrame = (p: number) => {
      ctx.clearRect(0, 0, cw, ch);
      if (p <= 0.001) return;

      // C² quintic giúp tốc độ lăn & hạ xuống mượt như lông vũ
      const u = quintic(clamp01(p));
      const rem = clamp01(1 - u);
      const fade = easeOutQuart(clamp01(p / 0.14));

      const hasImg = Boolean(washiImg && washiImg.complete && washiImg.naturalWidth > 0);
      const imgW = hasImg ? washiImg!.naturalWidth : 430;
      const imgH = hasImg
        ? variant === "plaid"
          ? Math.round(washiImg!.naturalHeight * (136 / 350))
          : washiImg!.naturalHeight
        : 136;

      ctx.save();
      ctx.globalAlpha = fade;

      const anchorX = isLtr ? padX : padX + tapeW;
      const rollEdgeX = isLtr ? padX + tapeW * u : padX + tapeW * (1 - u);
      const dir = isLtr ? 1 : -1;

      // 1. Đoạn băng keo đã dán phẳng xuống bề mặt giấy (u > 0.02)
      const stickW = tapeW * Math.min(1, u * 1.015);
      if (stickW > 0.5) {
        const destX = isLtr ? padX : padX + tapeW - stickW;
        const srcX = isLtr ? 0 : imgW * (1 - stickW / tapeW);
        const srcW = Math.max(1, imgW * (stickW / tapeW));

        ctx.save();
        ctx.shadowColor = "rgba(59, 44, 34, 0.16)";
        ctx.shadowBlur = 2.5;
        ctx.shadowOffsetY = 1.5;

        if (hasImg) {
          ctx.drawImage(washiImg!, srcX, 0, srcW, imgH, destX, padTop, stickW, tapeH);
        } else {
          ctx.fillStyle = variant === "sage" ? "rgba(155, 178, 148, 0.85)" : "rgba(196, 112, 92, 0.85)";
          ctx.fillRect(destX, padTop, stickW, tapeH);
        }
        ctx.restore();
      }

      // 2. Phần băng dính đang cuộn tròn thành ống và thả phẳng từ từ ra (rem > 0.005)
      if (rem > 0.005) {
        // Bán kính ống cuộn thu nhỏ dần khi phần băng keo chưa dán ít đi
        const touchScale = Math.pow(rem, 0.58);
        const coilR = tapeH * (0.12 + 0.54 * touchScale);
        const cx = rollEdgeX + dir * coilR * 0.38;
        const cy = padTop + tapeH * 0.5 - coilR * 0.92 * touchScale;

        // Bóng đổ mềm trên giấy phía dưới ống cuộn (nhỏ và nhạt dần khi sát giấy)
        const shadowAlpha = 0.24 * Math.sin(Math.PI * Math.min(0.96, rem));
        if (shadowAlpha > 0.01) {
          ctx.save();
          const sGrad = ctx.createRadialGradient(
            cx + dir * 2,
            padTop + tapeH * 0.72,
            coilR * 0.2,
            cx + dir * 2,
            padTop + tapeH * 0.72,
            coilR * 1.45,
          );
          sGrad.addColorStop(0, `rgba(59, 44, 34, ${shadowAlpha.toFixed(3)})`);
          sGrad.addColorStop(1, "rgba(59, 44, 34, 0)");
          ctx.fillStyle = sGrad;
          ctx.beginPath();
          ctx.ellipse(
            cx + dir * 2,
            padTop + tapeH * 0.72,
            coilR * 1.45,
            Math.max(4, tapeH * 0.45),
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.restore();
        }

        // Nhịp cong mềm chuyển tiếp từ mặt giấy lên đáy cuộn băng dính (triệt tiêu vết cắt thẳng)
        const curveSpan = Math.min(tapeW * 0.22, Math.max(8, coilR * 1.35));
        const baseLiftX = rollEdgeX - dir * curveSpan * 0.42;
        if (Math.abs(rollEdgeX - anchorX) > 2) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(baseLiftX, padTop);
          ctx.quadraticCurveTo(rollEdgeX, padTop - coilR * 0.35, cx, padTop - coilR * 0.45);
          ctx.lineTo(cx, padTop + tapeH - coilR * 0.25);
          ctx.quadraticCurveTo(rollEdgeX, padTop + tapeH - coilR * 0.2, baseLiftX, padTop + tapeH);
          ctx.closePath();
          ctx.fillStyle = variant === "sage" ? "rgba(182, 200, 174, 0.75)" : "rgba(218, 152, 130, 0.75)";
          ctx.fill();
          ctx.restore();
        }

        // Ống cuộn băng keo 3D (hình trụ bo mềm chứa hoa văn washi + ánh sáng khối tròn + lõi xoắn ốc ở đầu ống)
        const cylW = Math.max(4.5, coilR * 1.32);
        const cylH = tapeH * (0.94 + 0.08 * touchScale);
        const cylTop = cy - cylH * 0.5;
        const cylLeft = cx - cylW * 0.5;
        const capR = Math.max(2, cylW * 0.46);

        ctx.save();
        // Thân trụ cuộn tròn
        ctx.beginPath();
        ctx.roundRect(cylLeft, cylTop, cylW, cylH, capR);
        ctx.clip();

        ctx.fillStyle = "#F5ECE0";
        ctx.fillRect(cylLeft, cylTop, cylW, cylH);

        if (hasImg) {
          // Bọc hoa văn washi quanh bề mặt cong của cuộn
          const wrapSrcX = isLtr ? imgW * Math.min(0.75, u) : imgW * Math.max(0.05, 0.8 - u);
          ctx.globalAlpha = fade * 0.88;
          ctx.drawImage(
            washiImg!,
            wrapSrcX,
            0,
            Math.max(20, imgW * 0.22),
            imgH,
            cylLeft,
            cylTop,
            cylW,
            cylH,
          );
          ctx.globalAlpha = fade;
        } else {
          ctx.fillStyle = variant === "sage" ? "#A4BA9D" : "#CA6B59";
          ctx.fillRect(cylLeft, cylTop, cylW, cylH);
        }

        // Phủ khối ánh sáng trụ (tối dịu ở mép đáy tiếp xúc, sáng kem mềm ở sống cuộn)
        const cylGrad = ctx.createLinearGradient(cylLeft, cylTop, cylLeft + cylW, cylTop);
        cylGrad.addColorStop(0, "rgba(59, 44, 34, 0.26)");
        cylGrad.addColorStop(0.38, "rgba(255, 253, 248, 0.58)");
        cylGrad.addColorStop(0.72, "rgba(252, 249, 242, 0.18)");
        cylGrad.addColorStop(1, "rgba(59, 44, 34, 0.34)");
        ctx.fillStyle = cylGrad;
        ctx.fillRect(cylLeft, cylTop, cylW, cylH);

        // Đường xoắn giấy cuộn ở đầu trên ống cho cảm giác ống giấy rỗng ruột cuốn vòng
        if (coilR > 6) {
          ctx.strokeStyle = "rgba(122, 92, 62, 0.45)";
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.ellipse(cx, cylTop + capR * 0.58, cylW * 0.36, capR * 0.32, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();

        // Viền sáng mảnh định hình ống cuộn trên nền kem
        ctx.save();
        ctx.strokeStyle = "rgba(145, 118, 88, 0.34)";
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.roundRect(cylLeft, cylTop, cylW, cylH, capR);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
    };

    const startDelayMs = Math.max(0, Math.round(delay * 1000));
    delayTimer = setTimeout(() => {
      const tStart = performance.now();
      const step = (now: number) => {
        const p = clamp01((now - tStart) / durationMs);
        drawTapeFrame(p);
        if (p < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          setSettled(true);
        }
      };
      rafId = requestAnimationFrame(step);
    }, startDelayMs);

    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [delay, isLtr, parentVisible, reduce, settled, variant]);

  if (reduce) {
    return (
      <div
        className={cn("pointer-events-none select-none", className)}
        style={rotateDeg ? { transform: `rotate(${rotateDeg}deg)` } : undefined}
      >
        <WashiTapeGraphic variant={variant} />
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      data-washi-animated={parentVisible ? "revealed" : "waiting"}
      className={cn("pointer-events-none select-none", className)}
      style={rotateDeg ? { transform: `rotate(${rotateDeg}deg)` } : undefined}
    >
      <div className={settled ? "opacity-100" : "opacity-0"}>
        <WashiTapeGraphic variant={variant} />
      </div>

      {!settled && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="pointer-events-none absolute z-20"
        />
      )}
    </div>
  );
}

/* ============================================================
   HIỆU ỨNG GIÓ CUỘN & VẠCH TỐC ĐỘ TRUYỆN TRANH 60FPS KHI RƠI
   ============================================================ */
interface WindRibbonSeed {
  xBase: number;
  yOffset: number;
  speed: number;
  length: number;
  amp: number;
  freq: number;
  phase: number;
  alpha: number;
  width: number;
  color: string;
}

interface WindSpeedLineSeed {
  xFrac: number;
  yOffset: number;
  speed: number;
  length: number;
  width: number;
  alpha: number;
  color: string;
}

interface PetalDustSeed {
  xBase: number;
  yOffset: number;
  speed: number;
  driftAmp: number;
  size: number;
  rotSpeed: number;
  color: string;
  alpha: number;
}

const WIND_SPEED_LINES: WindSpeedLineSeed[] = [
  { xFrac: 0.06, yOffset: 0.12, speed: 1.55, length: 165, width: 1.8, alpha: 0.44, color: "#C49A6C" },
  { xFrac: 0.11, yOffset: 0.58, speed: 1.85, length: 205, width: 1.5, alpha: 0.58, color: "#FFFDF8" },
  { xFrac: 0.17, yOffset: 0.88, speed: 1.45, length: 140, width: 1.4, alpha: 0.34, color: "#9E744B" },
  { xFrac: 0.25, yOffset: 0.36, speed: 1.72, length: 175, width: 1.3, alpha: 0.42, color: "#D9B98C" },
  { xFrac: 0.74, yOffset: 0.44, speed: 1.68, length: 170, width: 1.4, alpha: 0.44, color: "#C49A6C" },
  { xFrac: 0.83, yOffset: 0.18, speed: 1.9, length: 215, width: 1.6, alpha: 0.56, color: "#FFFDF8" },
  { xFrac: 0.89, yOffset: 0.74, speed: 1.6, length: 185, width: 2.0, alpha: 0.42, color: "#9E744B" },
  { xFrac: 0.94, yOffset: 0.51, speed: 1.78, length: 155, width: 1.4, alpha: 0.46, color: "#D9B98C" },
];

const WIND_RIBBONS: WindRibbonSeed[] = [
  { xBase: 0.14, yOffset: 0.25, speed: 0.92, length: 215, amp: 28, freq: 3.1, phase: 0.2, alpha: 0.58, width: 2.6, color: "#FFFDF8" },
  { xBase: 0.31, yOffset: 0.72, speed: 1.05, length: 235, amp: 34, freq: 2.6, phase: 1.5, alpha: 0.44, width: 2.2, color: "#C49A6C" },
  { xBase: 0.52, yOffset: 0.45, speed: 0.98, length: 195, amp: 26, freq: 3.4, phase: 2.4, alpha: 0.62, width: 2.8, color: "#FFFDF8" },
  { xBase: 0.73, yOffset: 0.88, speed: 1.08, length: 245, amp: 36, freq: 2.7, phase: 0.8, alpha: 0.46, width: 2.3, color: "#C49A6C" },
  { xBase: 0.88, yOffset: 0.35, speed: 0.95, length: 185, amp: 24, freq: 3.2, phase: 3.7, alpha: 0.56, width: 2.1, color: "#FFFDF8" },
  { xBase: 0.22, yOffset: 0.96, speed: 1.15, length: 175, amp: 20, freq: 3.8, phase: 4.1, alpha: 0.42, width: 1.9, color: "#9E744B" },
];

const WIND_PETALS: PetalDustSeed[] = [
  { xBase: 0.16, yOffset: 0.6, speed: 0.88, driftAmp: 24, size: 6.2, rotSpeed: 3.2, color: "#F3DFA2", alpha: 0.82 },
  { xBase: 0.36, yOffset: 0.88, speed: 0.96, driftAmp: 28, size: 5.0, rotSpeed: -2.8, color: "#FCF9F2", alpha: 0.86 },
  { xBase: 0.64, yOffset: 0.42, speed: 0.92, driftAmp: 26, size: 6.5, rotSpeed: 2.4, color: "#E9C797", alpha: 0.78 },
  { xBase: 0.84, yOffset: 0.78, speed: 1.02, driftAmp: 30, size: 5.2, rotSpeed: -3.4, color: "#F3DFA2", alpha: 0.82 },
  { xBase: 0.48, yOffset: 0.2, speed: 1.06, driftAmp: 22, size: 4.6, rotSpeed: 3.5, color: "#B85042", alpha: 0.46 },
  { xBase: 0.27, yOffset: 0.32, speed: 0.84, driftAmp: 26, size: 5.4, rotSpeed: -2.2, color: "#7D9378", alpha: 0.5 },
  { xBase: 0.72, yOffset: 0.14, speed: 0.98, driftAmp: 20, size: 4.8, rotSpeed: 2.9, color: "#7D9378", alpha: 0.48 },
];

function WindSwirlCanvas({ active }: { active: boolean }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    const startMs = performance.now();

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth || 390;
      const h = parent.clientHeight || 844;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resizeCanvas) : null;
    if (canvas.parentElement) ro?.observe(canvas.parentElement);

    const drawFrame = (nowMs: number) => {
      const elapsedSec = (nowMs - startMs) / 1000;
      const w = canvas.clientWidth || 390;
      const h = canvas.clientHeight || 844;
      ctx.clearRect(0, 0, w, h);

      // Gió & vạch tốc độ truyện tranh vọt lên rõ rệt trong pha rơi (0.50s -> 2.75s)
      const rampIn = Math.min(1, Math.max(0, (elapsedSec - 0.48) / 0.32));
      const rampOut = Math.min(1, Math.max(0, 1 - (elapsedSec - 2.38) / 0.95));
      const windAlpha = rampIn * rampOut;

      if (windAlpha > 0.01) {
        // 1. Vạch tốc độ truyện tranh lao thẳng từ đáy lên đỉnh tạo ảo giác rơi tự do
        for (const line of WIND_SPEED_LINES) {
          const prog = (line.yOffset + elapsedSec * line.speed) % 1.45;
          const tailY = h * (1.22 - prog);
          const x = w * line.xFrac;
          const grad = ctx.createLinearGradient(x, tailY, x, tailY - line.length);
          grad.addColorStop(0, "rgba(252,249,242,0)");
          grad.addColorStop(0.4, line.color);
          grad.addColorStop(1, "rgba(252,249,242,0)");
          ctx.save();
          ctx.strokeStyle = grad;
          ctx.globalAlpha = line.alpha * windAlpha;
          ctx.lineWidth = line.width;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x, tailY);
          ctx.lineTo(x, tailY - line.length);
          ctx.stroke();
          ctx.restore();
        }

        // 2. Dải gió xoáy cong cuộn từ dưới lên trên quanh tờ thiệp
        for (const ribbon of WIND_RIBBONS) {
          const progress = (ribbon.yOffset + elapsedSec * ribbon.speed) % 1.4;
          const tailY = h * (1.18 - progress);
          const xCenter = w * ribbon.xBase + Math.sin(elapsedSec * ribbon.freq + ribbon.phase) * ribbon.amp;

          ctx.save();
          ctx.beginPath();
          const segs = 16;
          for (let s = 0; s <= segs; s++) {
            const t = s / segs;
            const y = tailY - t * ribbon.length;
            const swirl =
              Math.sin(t * Math.PI * 1.65 + elapsedSec * ribbon.freq + ribbon.phase) *
              ribbon.amp *
              (0.45 + 0.55 * t);
            const x = xCenter + swirl;
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          const grad = ctx.createLinearGradient(xCenter, tailY, xCenter, tailY - ribbon.length);
          grad.addColorStop(0, "rgba(252,249,242,0)");
          grad.addColorStop(0.5, ribbon.color);
          grad.addColorStop(1, "rgba(252,249,242,0)");
          ctx.strokeStyle = grad;
          ctx.globalAlpha = ribbon.alpha * windAlpha;
          ctx.lineWidth = ribbon.width;
          ctx.lineCap = "round";
          ctx.stroke();
          ctx.restore();
        }

        // 3. Cánh hoa & mẩu giấy nhỏ bay ngược theo luồng gió rơi
        for (const petal of WIND_PETALS) {
          const progress = (petal.yOffset + elapsedSec * petal.speed) % 1.3;
          const y = h * (1.15 - progress);
          const x = w * petal.xBase + Math.sin(elapsedSec * 3.1 + petal.yOffset * 5) * petal.driftAmp;

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(elapsedSec * petal.rotSpeed);
          ctx.globalAlpha = petal.alpha * windAlpha;
          ctx.fillStyle = petal.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, petal.size, petal.size * 0.56, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (elapsedSec < 3.6) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    rafId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      data-wind-canvas="true"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-15 h-full w-full"
    />
  );
}

/* ============================================================
   THÀNH PHẦN HERO DÙNG CHUNG (CHO MẶT SAU BÌA 3D & HERO THẬT ĐỂ FLIP 1-1)
   ============================================================ */
const DiaryHeroStage = React.forwardRef<
  HTMLDivElement,
  {
    groomName: string;
    brideName: string;
    heroUrl: string;
    quote?: string | null;
    stickerEager?: boolean;
    animateTape?: boolean;
    onHeroImageLoad?: () => void;
  }
>(function DiaryHeroStage(
  { groomName, brideName, heroUrl, quote, stickerEager = false, animateTape = false, onHeroImageLoad },
  ref,
) {
  return (
    <div ref={ref} className="w-full text-center">
      <span
        className="mb-2 inline-block text-[11px] font-bold tracking-[0.18em] text-[#9E744B] uppercase"
        style={{ fontFamily: BODY_FONT }}
      >
        Thiệp mời tham dự lễ cưới
      </span>

      <h2
        className="flex flex-col items-center justify-center gap-0.5 text-4xl sm:text-[42px] font-normal leading-[1.15] py-1 text-[#3B2C22] break-words"
        style={{ fontFamily: SCRIPT_FONT, fontSynthesis: "none" }}
      >
        <span className="block">{groomName}</span>
        <span className="block text-2xl sm:text-[28px] leading-none text-[#B85042] py-0.5">
          &amp;
        </span>
        <span className="block">{brideName}</span>
      </h2>

      {/* Khung Polaroid Lớn Nghiêng -2deg */}
      <div className="relative mx-auto mt-6 w-full max-w-[310px] sm:max-w-[348px]">
        {animateTape ? (
          <AnimatedWashiTape
            variant="sage"
            direction="left-to-right"
            delay={0.28}
            rotateDeg={-2}
            className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-28"
          />
        ) : (
          <div className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-28 -rotate-2">
            <WashiTapeGraphic variant="sage" eager={stickerEager} />
          </div>
        )}

        <div className="relative rounded-2xl border border-[#C49A6C]/45 bg-[#FCF9F2] p-3.5 sm:p-4 pb-6 shadow-xl -rotate-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#EFE8DC]">
            <img
              loading="eager"
              decoding="async"
              src={heroUrl}
              alt={`Ảnh cưới ${groomName} và ${brideName}`}
              onLoad={onHeroImageLoad}
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div className="mt-3 flex items-center justify-between px-1.5">
            <span className="text-sm sm:text-base font-medium tracking-wide text-[#3B2C22]">
              Ngày chung đôi
            </span>
            <div className="w-6 opacity-90">
              <img
                loading={stickerEager ? "eager" : "lazy"}
                decoding="async"
                src="/templates/nhat-ky-mua-yeu/sticker_hearts.webp"
                alt=""
                aria-hidden="true"
                className="h-auto w-full object-contain"
              />
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-4 -right-3 z-20 w-12 sm:w-14 rotate-12">
          <img
            loading={stickerEager ? "eager" : "lazy"}
            decoding="async"
            src="/templates/nhat-ky-mua-yeu/sticker_daisies.webp"
            alt=""
            aria-hidden="true"
            className="h-auto w-full object-contain drop-shadow-sm"
          />
        </div>
      </div>

      {quote && (
        <div className="mx-auto mt-5 max-w-sm px-3">
          <p className="text-xs sm:text-sm italic text-[#6F5D50] leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
});

/* ============================================================
   CHỒNG GIẤY KÉO LẬT TƯƠNG TÁC "CHUYỆN CHÚNG MÌNH" (SECTION story)
   - Mỗi lần kéo lên lật 1 tờ kỷ niệm -> tờ đã lật chìm đi hoàn toàn
   - Tờ cuối cùng khóa kéo (không lật tiếp được nữa) & hiện nút "Kéo giấy lại từ đầu"
   ============================================================ */
function DiaryStoryPullStack({
  milestones,
  muted,
  reducedMotion,
}: {
  milestones: StoryMilestone[];
  muted: boolean;
  reducedMotion: boolean;
}) {
  const { scrollRootRef, contained } = React.useContext(DiaryScrollContext);
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const titleFontProbeRef = React.useRef<HTMLSpanElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isDraggingUi, setIsDraggingUi] = React.useState(false);
  const [isStageInView, setIsStageInView] = React.useState(false);

  const sizeRef = React.useRef<{ w: number; h: number }>({ w: 340, h: 320 });
  const cornerRef = React.useRef<CurlPoint>({ x: 306, y: 286 });
  const dragOffsetRef = React.useRef<CurlPoint>({ x: 0, y: 0 });
  const pointerDownPosRef = React.useRef<CurlPoint | null>(null);
  const isDraggingRef = React.useRef(false);
  const flippingRef = React.useRef(false);
  const rustleMarksRef = React.useRef<{ first: boolean; second: boolean }>({
    first: false,
    second: false,
  });

  const animRef = React.useRef<
    | { kind: "idle" }
    | { kind: "spring"; vx: number; vy: number }
    | { kind: "nudge"; startMs: number }
    | { kind: "flipOut"; startMs: number; startCorner: CurlPoint }
  >({ kind: "idle" });
  const rafIdRef = React.useRef<number | null>(null);

  const safeMilestones = milestones.length > 0 ? milestones : DEFAULT_STORY_MILESTONES;
  const clampedIdx = Math.min(activeIndex, safeMilestones.length - 1);
  const currentStory = safeMilestones[clampedIdx];
  const nextStory = clampedIdx + 1 < safeMilestones.length ? safeMilestones[clampedIdx + 1] : null;
  const isLastPage = clampedIdx >= safeMilestones.length - 1;
  const isCanvasActive = !isLastPage && !reducedMotion;

  const getRestCorner = React.useCallback((w: number, h: number): CurlPoint => {
    return { x: Math.max(0, w - 34), y: Math.max(0, h - 34) };
  }, []);

  React.useEffect(() => {
    cornerRef.current = getRestCorner(sizeRef.current.w, sizeRef.current.h);
  }, [clampedIdx, getRestCorner]);

  // Vẽ trang nhật ký hiện tại lên Canvas 2D cho mặt trước tờ đang kéo
  const drawStorySheetOnCanvas = React.useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const pad = 22;

      // Nền giấy sổ kem ấm
      const paperGrad = ctx.createLinearGradient(0, 0, w, h);
      paperGrad.addColorStop(0, "#FDFBF7");
      paperGrad.addColorStop(0.55, "#FCF9F2");
      paperGrad.addColorStop(1, "#F3E8D4");
      drawRoundedRectPath(ctx, 0, 0, w, h, 18);
      ctx.fillStyle = paperGrad;
      ctx.fill();

      // Đường kẻ dòng sổ tay mảnh
      ctx.strokeStyle = "rgba(196, 154, 108, 0.16)";
      ctx.lineWidth = 1;
      for (let y = 64; y < h - 22; y += 28) {
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        ctx.stroke();
      }

      // Viền khung mảnh
      ctx.strokeStyle = "rgba(196, 154, 108, 0.45)";
      ctx.lineWidth = 1.5;
      drawRoundedRectPath(ctx, 1, 1, w - 2, h - 2, 17);
      ctx.stroke();

      const bodyFamily =
        (typeof window !== "undefined" && stageRef.current
          ? window.getComputedStyle(stageRef.current).fontFamily
          : "") || '"Montserrat", sans-serif';
      const titleFamily =
        (typeof window !== "undefined" && titleFontProbeRef.current
          ? window.getComputedStyle(titleFontProbeRef.current).fontFamily
          : "") || '"Playfair Display", Georgia, serif';

      // Số trang & Badge năm (Montserrat)
      const pageLabel = `${String(clampedIdx + 1).padStart(2, "0")} / ${String(safeMilestones.length).padStart(2, "0")}`;
      ctx.fillStyle = "#9E744B";
      ctx.font = `700 11px ${bodyFamily}`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(pageLabel, w - pad, 34);

      if (currentStory.year) {
        const yearText = String(currentStory.year);
        ctx.font = `700 13px ${bodyFamily}`;
        const badgeW = Math.max(66, ctx.measureText(yearText).width + 28);
        drawRoundedRectPath(ctx, pad, 20, badgeW, 28, 14);
        ctx.fillStyle = clampedIdx % 2 === 0 ? COLOR_RED_BRICK : COLOR_SAGE;
        ctx.fill();

        ctx.fillStyle = "#FCF9F2";
        ctx.textAlign = "center";
        ctx.fillText(yearText, pad + badgeW / 2, 34);
      }

      // Tiêu đề mốc (Playfair Display)
      ctx.fillStyle = COLOR_TEXT_MAIN;
      ctx.font = `700 22px ${titleFamily}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(currentStory.title || "Kỷ niệm đẹp", pad, 72, w - pad * 2);

      // Nội dung câu chuyện (Montserrat)
      ctx.fillStyle = COLOR_TEXT_MUTED;
      ctx.font = `italic 14px ${bodyFamily}`;
      const words = `“${currentStory.content || ""}”`.split(/\s+/);
      const maxLineW = w - pad * 2;
      let line = "";
      let lineY = 112;
      const lineH = 22.75;
      for (let i = 0; i < words.length; i++) {
        const testLine = line ? `${line} ${words[i]}` : words[i];
        if (ctx.measureText(testLine).width > maxLineW && line) {
          ctx.fillText(line, pad, lineY);
          line = words[i];
          lineY += lineH;
          if (lineY > h - 54) break;
        } else {
          line = testLine;
        }
      }
      if (line && lineY <= h - 42) {
        ctx.fillText(line, pad, lineY);
      }

      // Gợi ý kéo ở đáy trái (Montserrat)
      ctx.fillStyle = "rgba(184, 80, 66, 0.78)";
      ctx.font = `500 11px ${bodyFamily}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText("Kéo góc giấy lên để sang trang", pad, h - 20);
    },
    [clampedIdx, currentStory.content, currentStory.title, currentStory.year, safeMilestones.length],
  );

  const drawCurlFrame = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isCanvasActive) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { w, h } = sizeRef.current;
    const dpr = canvas.width / Math.max(1, w);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (flippingRef.current && animRef.current.kind === "flipOut") {
      // Sau khi lật qua nửa tờ: vẽ tờ bay lên & chìm mờ dần
      const anim = animRef.current;
      const t = Math.min(1, (performance.now() - anim.startMs) / 480);
      if (t >= 0.6) {
        ctx.globalAlpha = Math.max(0, 1 - (t - 0.6) / 0.4);
      }
    }

    const cx = cornerRef.current.x;
    const cy = cornerRef.current.y;
    const dx = w - cx;
    const dy = h - cy;
    const dist = Math.hypot(dx, dy);

    const rectPoly: CurlPoint[] = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
    ];

    if (dist < 2.5) {
      drawStorySheetOnCanvas(ctx, w, h);
      return;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    const mx = (cx + w) / 2;
    const my = (cy + h) / 2;

    const keepPoly = clipPolygonHalfPlane(rectPoly, mx, my, nx, ny, false);
    const curlTriPoly = clipPolygonHalfPlane(rectPoly, mx, my, nx, ny, true);

    const reflectedPoly = curlTriPoly.map((p) => {
      const dot = (p.x - mx) * nx + (p.y - my) * ny;
      return { x: p.x - 2 * dot * nx, y: p.y - 2 * dot * ny };
    });

    if (keepPoly.length >= 3) {
      ctx.save();
      tracePolyPath(ctx, keepPoly);
      ctx.clip();
      drawStorySheetOnCanvas(ctx, w, h);

      const shadowGrad = ctx.createLinearGradient(mx, my, mx - nx * 40, my - ny * 40);
      shadowGrad.addColorStop(0, "rgba(59, 44, 34, 0.22)");
      shadowGrad.addColorStop(1, "rgba(59, 44, 34, 0)");
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    if (reflectedPoly.length >= 3) {
      ctx.save();
      ctx.shadowColor = "rgba(59, 44, 34, 0.28)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetX = -nx * 6;
      ctx.shadowOffsetY = -ny * 6;
      tracePolyPath(ctx, reflectedPoly);
      const backGrad = ctx.createLinearGradient(mx, my, cx, cy);
      backGrad.addColorStop(0, "#DECBB0");
      backGrad.addColorStop(0.28, "#F2E6D3");
      backGrad.addColorStop(0.75, "#FAF4E8");
      backGrad.addColorStop(1, "#EDE0CA");
      ctx.fillStyle = backGrad;
      ctx.fill();
      ctx.restore();

      ctx.save();
      tracePolyPath(ctx, reflectedPoly);
      ctx.strokeStyle = "rgba(158, 116, 75, 0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();
    }
  }, [drawStorySheetOnCanvas, isCanvasActive]);

  const stopRaf = React.useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const ensureRafRunning = React.useCallback(() => {
    if (rafIdRef.current !== null) return;

    const tick = (nowMs: number) => {
      const { w, h } = sizeRef.current;
      const rest = getRestCorner(w, h);
      const anim = animRef.current;

      if (anim.kind === "nudge") {
        const elapsed = nowMs - anim.startMs;
        const dur = 1150;
        if (elapsed >= dur) {
          cornerRef.current = { ...rest };
          animRef.current = { kind: "idle" };
          drawCurlFrame();
          rafIdRef.current = null;
          return;
        }
        const wave = Math.sin((elapsed / dur) * Math.PI);
        cornerRef.current = {
          x: rest.x - 16 * wave * wave,
          y: rest.y - 20 * wave * wave,
        };
        drawCurlFrame();
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      if (anim.kind === "spring") {
        const target = rest;
        const ax = (target.x - cornerRef.current.x) * 0.22;
        const ay = (target.y - cornerRef.current.y) * 0.22;
        anim.vx = (anim.vx + ax) * 0.72;
        anim.vy = (anim.vy + ay) * 0.72;
        cornerRef.current.x += anim.vx;
        cornerRef.current.y += anim.vy;
        drawCurlFrame();

        if (
          Math.hypot(target.x - cornerRef.current.x, target.y - cornerRef.current.y) < 0.7 &&
          Math.hypot(anim.vx, anim.vy) < 0.4
        ) {
          cornerRef.current = { ...target };
          animRef.current = { kind: "idle" };
          drawCurlFrame();
          rafIdRef.current = null;
          return;
        }
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      if (anim.kind === "flipOut") {
        const t = Math.min(1, (nowMs - anim.startMs) / 480);
        const eased = 1 - Math.pow(1 - t, 3);
        const endX = -w * 0.65;
        const endY = -h * 0.85;
        cornerRef.current = {
          x: anim.startCorner.x + (endX - anim.startCorner.x) * eased,
          y: anim.startCorner.y + (endY - anim.startCorner.y) * eased,
        };
        drawCurlFrame();
        if (t >= 1) {
          animRef.current = { kind: "idle" };
          flippingRef.current = false;
          rafIdRef.current = null;
          setActiveIndex((prev) => Math.min(safeMilestones.length - 1, prev + 1));
          return;
        }
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      drawCurlFrame();
      rafIdRef.current = null;
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [drawCurlFrame, getRestCorner, safeMilestones.length]);

  React.useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas || !isCanvasActive) return;

    const updateSize = () => {
      const rect = stage.getBoundingClientRect();
      const w = Math.max(240, rect.width);
      const h = Math.max(240, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { w, h };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (!isDraggingRef.current && !flippingRef.current && animRef.current.kind === "idle") {
        cornerRef.current = getRestCorner(w, h);
      }
      drawCurlFrame();
    };

    updateSize();
    let cancelled = false;
    document.fonts?.ready?.then(() => {
      if (!cancelled) drawCurlFrame();
    });
    const ro = new ResizeObserver(updateSize);
    ro.observe(stage);
    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [clampedIdx, drawCurlFrame, getRestCorner, isCanvasActive]);

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === "undefined") return;
    const rootEl =
      findDiaryScrollParent(stage) ??
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
      { root: rootEl, rootMargin: "0px 0px -25% 0px", threshold: 0.2 },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, [contained, scrollRootRef]);

  React.useEffect(() => {
    if (!isCanvasActive || !isStageInView || reducedMotion) return;
    const triggerNudge = () => {
      if (isDraggingRef.current || flippingRef.current || animRef.current.kind !== "idle") return;
      animRef.current = { kind: "nudge", startMs: performance.now() };
      ensureRafRunning();
    };
    const t0 = setTimeout(triggerNudge, 600);
    const tInt = setInterval(triggerNudge, 2800);
    return () => {
      clearTimeout(t0);
      clearInterval(tInt);
    };
  }, [ensureRafRunning, isCanvasActive, isStageInView, reducedMotion]);

  React.useEffect(() => {
    return () => stopRaf();
  }, [stopRaf]);

  const completePull = React.useCallback(() => {
    if (flippingRef.current || isLastPage) return;
    flippingRef.current = true;
    isDraggingRef.current = false;
    setIsDraggingUi(false);
    pointerDownPosRef.current = null;
    playInteractionSfx("paper-tear", { muted });

    if (reducedMotion) {
      flippingRef.current = false;
      setActiveIndex((prev) => Math.min(safeMilestones.length - 1, prev + 1));
      return;
    }

    animRef.current = {
      kind: "flipOut",
      startMs: performance.now(),
      startCorner: { ...cornerRef.current },
    };
    ensureRafRunning();
  }, [ensureRafRunning, isLastPage, muted, reducedMotion, safeMilestones.length]);

  const getLocalPoint = (e: React.PointerEvent<HTMLCanvasElement>): CurlPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isCanvasActive || flippingRef.current || isLastPage) return;
    const pt = getLocalPoint(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    pointerDownPosRef.current = pt;
    isDraggingRef.current = true;
    setIsDraggingUi(true);
    animRef.current = { kind: "idle" };
    rustleMarksRef.current = { first: false, second: false };

    const { w, h } = sizeRef.current;
    const isNearCorner = pt.x >= w - 96 && pt.y >= h - 96;
    if (isNearCorner) {
      dragOffsetRef.current = { x: cornerRef.current.x - pt.x, y: cornerRef.current.y - pt.y };
    } else {
      dragOffsetRef.current = { x: 0, y: 0 };
      cornerRef.current = { x: Math.min(w - 18, pt.x), y: Math.min(h - 18, pt.y) };
      drawCurlFrame();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || flippingRef.current) return;
    const pt = getLocalPoint(e);
    const { w, h } = sizeRef.current;

    const nx = Math.max(-w * 0.45, Math.min(w - 10, pt.x + dragOffsetRef.current.x));
    const ny = Math.max(-h * 0.5, Math.min(h - 10, pt.y + dragOffsetRef.current.y));
    cornerRef.current = { x: nx, y: ny };

    const pullProgress = Math.min(1, Math.max(0, (h - ny) / (h * 0.92)));
    if (pullProgress >= 0.25 && !rustleMarksRef.current.first) {
      rustleMarksRef.current.first = true;
      playInteractionSfx("paper-rustle", { muted });
    }
    if (pullProgress >= 0.5 && !rustleMarksRef.current.second) {
      rustleMarksRef.current.second = true;
      playInteractionSfx("paper-rustle", { muted });
    }

    drawCurlFrame();
    if (pullProgress >= 0.62) {
      completePull();
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDraggingUi(false);

    const pt = getLocalPoint(e);
    const downPt = pointerDownPosRef.current;
    pointerDownPosRef.current = null;
    const { w, h } = sizeRef.current;

    // Chạm nhanh vào góc phải dưới để lật mượt sang tờ kế tiếp
    if (downPt && Math.hypot(pt.x - downPt.x, pt.y - downPt.y) < 12 && pt.x >= w * 0.45 && pt.y >= h * 0.45) {
      completePull();
      return;
    }

    const pullProgress = Math.min(1, Math.max(0, (h - cornerRef.current.y) / (h * 0.92)));
    if (pullProgress >= 0.34) {
      completePull();
      return;
    }

    animRef.current = { kind: "spring", vx: 0, vy: 0 };
    ensureRafRunning();
  };

  const handleResetStack = () => {
    if (flippingRef.current) return;
    playInteractionSfx("paper-rustle", { muted });
    setActiveIndex(0);
  };

  const renderCardDom = (story: StoryMilestone, idx: number, interactiveHint: boolean) => (
    <div
      className="relative h-full w-full rounded-[18px] border border-[#C49A6C]/50 bg-[#FCF9F2] p-5 sm:p-6 shadow-md flex flex-col justify-between text-left"
      style={{
        backgroundImage:
          "repeating-linear-gradient(transparent, transparent 27px, rgba(196,154,108,0.14) 27px, rgba(196,154,108,0.14) 28px)",
      }}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          {story.year ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-3.5 py-1 text-xs font-bold text-[#FCF9F2] shadow-xs",
                idx % 2 === 0 ? "bg-[#B85042]" : "bg-[#7D9378]",
              )}
            >
              {story.year}
            </span>
          ) : (
            <span />
          )}
          <span className="text-[11px] font-bold tracking-widest text-[#9E744B]">
            {String(idx + 1).padStart(2, "0")} / {String(safeMilestones.length).padStart(2, "0")}
          </span>
        </div>

        <h4
          className="text-xl sm:text-2xl font-bold text-[#3B2C22] mb-2.5"
          style={{ fontFamily: TITLE_FONT }}
        >
          {story.title}
        </h4>

        <p className="text-sm italic leading-relaxed text-[#6F5D50]">
          &ldquo;{story.content}&rdquo;
        </p>
      </div>

      <div className="pt-3 flex items-center justify-between text-[11px] font-medium">
        {interactiveHint ? (
          <span className="text-[#B85042]">Kéo góc giấy lên để sang trang</span>
        ) : (
          <span className="text-[#7D9378]">Trang cuối kỷ niệm</span>
        )}
        <img
          loading="lazy"
          decoding="async"
          src="/templates/nhat-ky-mua-yeu/sticker_hearts.webp"
          alt=""
          aria-hidden="true"
          className="h-5 w-auto object-contain opacity-80"
        />
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[380px] mx-auto flex flex-col items-center">
      <div className="relative w-full pb-4">
        {/* Hai mép giấy nền cố định phía dưới — không thêm bớt làm xê dịch kích thước khung */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-2 top-2 bottom-2 rounded-[18px] border border-[#C49A6C]/35 bg-[#EFE4D0] shadow-sm rotate-2 transition-opacity duration-300",
            clampedIdx + 2 < safeMilestones.length ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-1 top-1 bottom-3 rounded-[18px] border border-[#C49A6C]/40 bg-[#F6EFE2] shadow-sm -rotate-1 transition-opacity duration-300",
            clampedIdx + 1 < safeMilestones.length ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Khung lưới đồng chiều cao theo thẻ cao nhất: triệt tiêu 100% nhảy/giật khi kéo sang trang */}
        <div ref={stageRef} className="relative grid w-full min-h-[300px] sm:min-h-[314px]">
          <span
            ref={titleFontProbeRef}
            aria-hidden="true"
            className="sr-only"
            style={{ fontFamily: TITLE_FONT }}
          >
            A
          </span>
          {safeMilestones.map((story, idx) => (
            <div
              key={`sizer-${idx}`}
              aria-hidden="true"
              className="invisible pointer-events-none select-none [grid-area:1/1] h-full min-h-[300px] sm:min-h-[314px]"
            >
              {renderCardDom(story, idx, idx < safeMilestones.length - 1)}
            </div>
          ))}

          {/* Tờ kế tiếp nằm chờ phía dưới (hoặc tờ cuối cùng khi isLastPage === true) */}
          <div className="relative [grid-area:1/1] h-full min-h-[300px] sm:min-h-[314px]">
            {isLastPage || reducedMotion
              ? renderCardDom(currentStory, clampedIdx, !isLastPage)
              : nextStory
                ? renderCardDom(nextStory, clampedIdx + 1, clampedIdx + 1 < safeMilestones.length - 1)
                : null}
          </div>

          {/* Tờ hiện tại vẽ bằng Canvas 2D Page-Curl (chỉ hiện khi chưa tới trang cuối & !reducedMotion) */}
          {isCanvasActive && (
            <canvas
              ref={canvasRef}
              data-story-pull-canvas="true"
              aria-label={`Kéo góc tờ giấy chuyện chúng mình trang ${clampedIdx + 1} lên để xem trang kế tiếp`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              className="absolute inset-0 z-30 h-full w-full cursor-grab active:cursor-grabbing select-none rounded-[18px]"
              style={{ touchAction: "none" }}
            />
          )}

          {/* Vòng sáng gợi ý góc kéo dưới phải */}
          {isCanvasActive && !isDraggingUi && isStageInView && (
            <div
              data-story-pull-cue="true"
              aria-hidden="true"
              className="pointer-events-none absolute bottom-1 right-1 z-35 flex h-11 w-11 items-center justify-center"
            >
              <m.span
                className="absolute inset-0 rounded-full border-2 border-[#B85042]/70 bg-[#F3DFA2]/35 shadow-[0_0_16px_rgba(184,80,66,0.45)]"
                animate={{ scale: [0.75, 1.32, 0.75], opacity: [0.85, 0.15, 0.85] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-[#B85042] text-white shadow-sm">
                <svg
                  viewBox="0 0 16 16"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 12V4" />
                  <path d="m4.5 7.5 3.5-3.5 3.5 3.5" />
                </svg>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Thanh chỉ báo trang + Nút Kéo giấy lại giữ chiều cao cố định tránh xô lệch tab */}
      <div className="mt-2 flex min-h-[68px] flex-col items-center justify-start gap-3">
        <div className="flex items-center gap-2">
          {safeMilestones.map((_, idx) => (
            <span
              key={idx}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                idx === clampedIdx
                  ? "w-6 bg-[#B85042]"
                  : idx < clampedIdx
                    ? "w-2 bg-[#7D9378]/60"
                    : "w-2 bg-[#C49A6C]/40",
              )}
            />
          ))}
        </div>

        {reducedMotion && !isLastPage && (
          <button
            type="button"
            onClick={completePull}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#B85042] bg-[#B85042] px-4 py-1.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#9C3F33]"
          >
            <span>Lật trang tiếp theo</span>
          </button>
        )}

        {isLastPage && (
          <button
            type="button"
            onClick={handleResetStack}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[#C49A6C] bg-[#FCF9F2] px-4 py-2 text-xs font-bold text-[#3B2C22] shadow-xs transition-all hover:border-[#B85042] hover:bg-[#B85042] hover:text-white active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Kéo giấy lại từ đầu</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   COMPONENT CHÍNH: NHẬT KÝ MÙA YÊU (STANDARD EDITION)
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

export function NhatKyMuaYeuTemplate({
  data,
  mode = "preview",
  contained = false,
  viewport = "phone",
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
  const shouldReduceMotion = Boolean(useReducedMotion());
  const sfxMuted = false;

  const [initialOpened] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return Boolean(parentIsOpened);
    try {
      const sp = new URLSearchParams(window.location.search);
      return sp.get("opened") === "1" || Boolean(parentIsOpened);
    } catch {
      return Boolean(parentIsOpened);
    }
  });

  const [isOpening, setIsOpening] = React.useState(false);
  const [coverGone, setCoverGone] = React.useState(initialOpened);
  const coverOpeningRef = React.useRef(false);
  const coverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openRafRef = React.useRef<number | null>(null);
  const parentOpenedRef = React.useRef(parentIsOpened);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const heroStageRef = React.useRef<HTMLDivElement | null>(null);
  const coverCardSlotRef = React.useRef<HTMLDivElement | null>(null);
  const leftTapeRef = React.useRef<HTMLDivElement | null>(null);
  const rightTapeRef = React.useRef<HTMLDivElement | null>(null);
  const coverBackdropRef = React.useRef<HTMLDivElement | null>(null);
  const coverDecorUpRef = React.useRef<HTMLDivElement | null>(null);
  const risingComicRef = React.useRef<HTMLDivElement | null>(null);
  const fallingWrapperRef = React.useRef<HTMLDivElement | null>(null);
  const sheet3dRef = React.useRef<HTMLDivElement | null>(null);
  const [flipGeom, setFlipGeom] = React.useState<FlipGeometry | null>(null);
  const onOpenedChangeRef = React.useRef(onOpenedChange);
  const flipGeomRef = React.useRef<FlipGeometry | null>(flipGeom);
  const coverStartedAtRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    onOpenedChangeRef.current = onOpenedChange;
  }, [onOpenedChange]);

  React.useEffect(() => {
    flipGeomRef.current = flipGeom;
  }, [flipGeom]);

  const scrollContextValue = React.useMemo(
    () => ({ scrollRootRef: rootRef, contained }),
    [contained],
  );

  const measureFlipGeometry = React.useCallback((): FlipGeometry | null => {
    const rootEl = rootRef.current;
    const heroEl = heroStageRef.current;
    const slotEl = coverCardSlotRef.current;
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
      startScale: Math.min(1, slotWidth / heroWidth),
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
    const heroEl = heroStageRef.current;
    const slotEl = coverCardSlotRef.current;
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

  React.useEffect(() => {
    if (coverOpeningRef.current) {
      parentOpenedRef.current = parentIsOpened;
      return;
    }
    const wasOpened = parentOpenedRef.current;
    parentOpenedRef.current = parentIsOpened;

    let active = true;
    queueMicrotask(() => {
      if (!active || coverOpeningRef.current) return;
      if (parentIsOpened && !coverGone && !isOpening) {
        setCoverGone(true);
      } else if (parentIsOpened === false && wasOpened === true) {
        setCoverGone(false);
        setIsOpening(false);
      }
    });
    return () => {
      active = false;
    };
  }, [parentIsOpened, coverGone, isOpening]);

  React.useEffect(() => {
    return () => {
      if (coverTimerRef.current) {
        clearTimeout(coverTimerRef.current);
      }
      if (openRafRef.current !== null) {
        cancelAnimationFrame(openRafRef.current);
        openRafRef.current = null;
      }
    };
  }, []);

  const finishCoverOpening = React.useCallback(() => {
    if (!coverOpeningRef.current) return;
    coverOpeningRef.current = false;
    coverStartedAtRef.current = null;
    if (coverTimerRef.current) {
      clearTimeout(coverTimerRef.current);
      coverTimerRef.current = null;
    }
    setCoverGone(true);
    setIsOpening(false);
    onOpenedChangeRef.current?.(true);
    if (!contained && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:cover-settled"));
    } catch { }
  }, [contained]);

  const hasFlipGeom = Boolean(flipGeom);

  // Vũ đạo mở bìa liên tục C² quintic 60/120fps: mượt tuyệt đối không điểm gãy,
  // khi zoom khớp Hero ở p = 1.0 sẽ mở khóa & chạy auto-scroll ngay lập tức.
  React.useEffect(() => {
    if (coverGone || !isOpening) {
      coverStartedAtRef.current = null;
      return;
    }
    if (shouldReduceMotion || !hasFlipGeom) return;

    const totalMs = COVER_FINISH_MS;
    if (coverStartedAtRef.current === null) {
      coverStartedAtRef.current = performance.now();
    }
    const tStart = coverStartedAtRef.current;
    let rafId = 0;

    const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const quintic = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);

    const drawCoverFrame = (nowMs: number) => {
      const geom = flipGeomRef.current;
      if (!geom) return;
      const p = clamp01((nowMs - tStart) / totalMs);

      // 1. Băng keo phải bung & cuộn lên (0 -> 0.14)
      const uRight = easeOutQuart(clamp01(p / 0.14));
      if (rightTapeRef.current) {
        rightTapeRef.current.style.transform = `translate3d(${(12 * uRight).toFixed(2)}px, ${(-30 * uRight).toFixed(2)}px, 0px) rotate(${(6 - 34 * uRight).toFixed(2)}deg) rotateX(${(56 * uRight).toFixed(2)}deg) scaleX(${(1 - 0.24 * uRight).toFixed(3)})`;
        rightTapeRef.current.style.opacity = String(1 - uRight);
      }

      // 2. Băng keo trái giữ rồi bật "PỰC!" (0.145 -> 0.22)
      const uLeft = easeOutQuart(clamp01((p - 0.145) / 0.075));
      if (leftTapeRef.current) {
        leftTapeRef.current.style.transform = `translate3d(${(-20 * uLeft).toFixed(2)}px, ${(-46 * uLeft).toFixed(2)}px, 0px) rotate(${(-6 - 40 * uLeft).toFixed(2)}deg) scale(${(1 - 0.16 * uLeft).toFixed(3)})`;
        leftTapeRef.current.style.opacity = String(1 - uLeft);
      }

      // 3. Các asset trang trí & vật thể truyện tranh lao ngược từ dưới lên (0.11 -> 0.89)
      const rootH = rootRef.current?.clientHeight || 844;
      const skyFly = quintic(clamp01((p - 0.11) / 0.78));
      if (coverDecorUpRef.current) {
        const upPx = -rootH * 1.18 * skyFly;
        coverDecorUpRef.current.style.transform = `translate3d(0px, ${upPx.toFixed(1)}px, 0px)`;
        coverDecorUpRef.current.style.opacity = String(1 - quintic(clamp01((p - 0.56) / 0.3)));
      }
      if (risingComicRef.current) {
        const comicUpPx = -rootH * 2.4 * skyFly;
        const comicOpacity =
          quintic(clamp01((p - 0.13) / 0.14)) * (1 - quintic(clamp01((p - 0.7) / 0.2)));
        risingComicRef.current.style.transform = `translate3d(0px, ${comicUpPx.toFixed(1)}px, 0px)`;
        risingComicRef.current.style.opacity = String(comicOpacity);
      }

      // 4. Tờ giấy lắc lư & zoom C² quintic liên tục tới đúng p = 1.00 (không đứng khựng cuối nhịp)
      const hingeW =
        quintic(clamp01(p / 0.16)) * (1 - quintic(clamp01((p - 0.14) / 0.22)));
      const dropEnv = Math.pow(
        Math.sin(Math.PI * quintic(clamp01((p - 0.1) / 0.82))),
        1.15,
      );
      const settleT = quintic(clamp01((p - 0.12) / 0.88));

      const curX =
        geom.startX * (1 - settleT) +
        4 * hingeW +
        dropEnv * Math.sin((p - 0.1) * Math.PI * 2.4) * 20;
      const curY =
        geom.startY * (1 - settleT) +
        14 * hingeW +
        dropEnv * 86;
      const curScale =
        geom.startScale + (1 - geom.startScale) * settleT - dropEnv * 0.14;

      if (fallingWrapperRef.current) {
        fallingWrapperRef.current.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0px) scale(${curScale.toFixed(4)})`;
      }

      const spinU = quintic(clamp01((p - 0.14) / 0.64));
      const rotY = 180 * spinU;
      const rotZ =
        13 * hingeW +
        dropEnv * Math.sin((p - 0.1) * Math.PI * 2.1 - 0.35) * -8.5;
      const rotX = dropEnv * Math.sin((p - 0.1) * Math.PI * 1.85) * 12;

      if (sheet3dRef.current) {
        sheet3dRef.current.style.transform = `rotateY(${rotY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg)`;
      }

      // 5. Lớp nền bìa mờ êm trong pha zoom (0.64 -> 0.98)
      if (coverBackdropRef.current) {
        const bgFade = quintic(clamp01((p - 0.64) / 0.34));
        coverBackdropRef.current.style.opacity = String(1 - bgFade);
      }

      if (p < 1) {
        rafId = requestAnimationFrame(drawCoverFrame);
      } else {
        finishCoverOpening();
      }
    };

    rafId = requestAnimationFrame(drawCoverFrame);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [coverGone, finishCoverOpening, hasFlipGeom, isOpening, shouldReduceMotion]);

  const handleOpenInvitation = () => {
    if (coverOpeningRef.current || isOpening || coverGone) return;

    coverOpeningRef.current = true;
    const hadGeom = Boolean(flipGeom);
    measureFlipGeometry();

    // Bắt buộc gọi Pure Foley trước inviwedd:open-envelope để chặn /sfx/*.mp3 cũ
    playCoverSfx("diary-tape-peel-fall", { muted: sfxMuted });
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }

    const startOpening = () => {
      setIsOpening(true);
      // Backup timer phòng tab bị throttle ngoài focus; khi active thì drawCoverFrame chốt ở đúng p = 1.00
      const delayMs = shouldReduceMotion ? 220 : COVER_FINISH_MS + 60;
      if (coverTimerRef.current) clearTimeout(coverTimerRef.current);
      coverTimerRef.current = setTimeout(() => {
        finishCoverOpening();
      }, delayMs);
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
  };

  // Gói quà giấy kraft 3 trạng thái
  const {
    stage: boxStage,
    isOpening: isBoxOpening,
    isModalOpen: isGiftModalOpen,
    handleGiftClick,
    handleCloseModal: handleCloseGiftModal,
  } = useGiftBoxInteraction({
    sfxType: "diary-kraft-parcel",
    muted: sfxMuted,
    delayMs: shouldReduceMotion ? 150 : 720,
  });

  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Dữ liệu sự kiện & đếm ngược dùng chung
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent?.startsAt || data.date || "2027-03-20T10:00:00+07:00";
  const dateParts = formatWeddingDateParts(eventDateStr);
  const countdown = useWeddingCountdown(eventDateStr) ?? {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    finished: false,
  };

  const plan: WeddingPlan = data.plan || "free";
  const isFree = plan === "free";
  const galleryLimit = isFree ? 5 : plan === "pro" ? 30 : 50;
  const rawGallery = data.photos?.gallery || [];
  const galleryPhotos = rawGallery.slice(0, galleryLimit);

  const [groomFather, groomMother] = parseParents(data.couple.groomParents);
  const [brideFather, brideMother] = parseParents(data.couple.brideParents);
  const isBrideFirst = data.hostFirst === "bride";
  const dressColors = getDressColors(data);

  const hidden = new Set(data.hiddenSections || []);
  const order = data.sectionOrder?.length ? data.sectionOrder : CANONICAL_SECTION_ORDER;
  const orderOf = (key: string) => {
    const idx = (order as readonly string[]).indexOf(key);
    return idx === -1 ? 99 : idx;
  };

  const storyMilestones = React.useMemo(() => {
    const raw = data.story?.filter((item) => item.title?.trim() || item.content?.trim());
    return raw && raw.length > 0 ? raw : DEFAULT_STORY_MILESTONES;
  }, [data.story]);
  const isStoryVisible = !isFree && !hidden.has("story") && storyMilestones.length > 0;
  const effectiveWeddingSlug = weddingSlug || data.weddingSlug;
  const heroUrl = data.photos?.heroUrl || "/templates/nhat-ky-mua-yeu/bg_page_mobile.webp";

  // Lịch tháng sổ tay
  const eventDays = React.useMemo(() => {
    const events = getVisibleEvents(data);
    const days = new Set<number>();
    const month = parseInt(dateParts.month, 10) || 1;
    const year = parseInt(dateParts.year, 10) || 2027;
    events.forEach((evt) => {
      if (evt.startsAt) {
        const d = new Date(evt.startsAt);
        if (d.getFullYear() === year && d.getMonth() + 1 === month) {
          days.add(d.getDate());
        }
      }
    });
    if (days.size === 0 && dateParts.day) {
      days.add(parseInt(dateParts.day, 10));
    }
    return days;
  }, [data, dateParts.month, dateParts.year, dateParts.day]);

  const calendarDays = React.useMemo(() => {
    const month = parseInt(dateParts.month, 10) || 1;
    const year = parseInt(dateParts.year, 10) || 2027;
    const firstDay = new Date(year, month - 1, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [dateParts.month, dateParts.year]);

  const cleanCalendarDate = eventDateStr.replace(/-|:|\./g, "").slice(0, 8);
  const calendarHref = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    `Lễ Cưới ${data.couple.groomName} & ${data.couple.brideName}`,
  )}&dates=${cleanCalendarDate}T040000Z/${cleanCalendarDate}T080000Z&details=${encodeURIComponent(
    `Trân trọng kính mời tham dự ngày vui của ${data.couple.groomName} & ${data.couple.brideName}.`,
  )}&location=${encodeURIComponent(targetEvent?.venueAddress || "")}`;

  const renderCoverFrontCard = (interactive: boolean) => (
    <div className="relative w-full rounded-2xl border border-[#C49A6C]/45 bg-[#FCF9F2]/95 p-6 sm:p-8 shadow-xl text-center">
      {/* Miếng băng keo bên TRÁI — giữ đến 0.52s rồi bật tung "PỰC!" */}
      <div
        ref={interactive ? leftTapeRef : undefined}
        data-cover-tape-left={interactive ? "true" : undefined}
        className="pointer-events-none absolute -top-3.5 left-4 z-20 w-24 origin-center"
        style={{
          transform: "rotate(-6deg)",
          opacity: isOpening && shouldReduceMotion ? 0 : 1,
          transition: shouldReduceMotion ? "opacity 0.14s ease" : undefined,
          willChange: interactive ? "transform, opacity" : undefined,
        }}
      >
        <WashiTapeGraphic variant="sage" eager />
      </div>

      {/* Miếng băng keo bên PHẢI — bung cuộn lên ngay khi bấm mở thiệp */}
      <div
        className="pointer-events-none absolute -top-3.5 right-4 z-20 w-24"
        style={{ perspective: "280px" }}
      >
        <div
          ref={interactive ? rightTapeRef : undefined}
          data-cover-tape-right={interactive ? "true" : undefined}
          className="w-full origin-left"
          style={{
            transform: "rotate(6deg)",
            opacity: isOpening && shouldReduceMotion ? 0 : 1,
            transition: shouldReduceMotion ? "opacity 0.14s ease" : undefined,
            willChange: interactive ? "transform, opacity" : undefined,
          }}
        >
          <WashiTapeGraphic variant="plaid" eager />
        </div>
      </div>

      <div className="mt-3 mb-1">
        <span
          className="text-lg sm:text-xl font-semibold tracking-wide text-[#B85042]"
          style={{ fontFamily: TITLE_FONT }}
        >
          Trân Trọng Kính Mời
        </span>
      </div>

      <span className="inline-block rounded-full border border-[#C49A6C]/35 bg-[#F6EFE2] px-3 py-0.5 text-[9px] font-bold tracking-[0.14em] text-[#9E744B] uppercase">
        Thiệp mời tham dự lễ cưới
      </span>

      <div className="my-4 space-y-1">
        <p
          className="text-3xl sm:text-4xl font-normal leading-[1.18] text-[#3B2C22] break-words"
          style={{ fontFamily: SCRIPT_FONT, fontSynthesis: "none" }}
        >
          {data.couple.groomName}
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="h-[1px] w-6 bg-[#C49A6C]/50" />
          <span
            className="text-xl font-normal text-[#B85042]"
            style={{ fontFamily: SCRIPT_FONT, fontSynthesis: "none" }}
          >
            &amp;
          </span>
          <span className="h-[1px] w-6 bg-[#C49A6C]/50" />
        </div>
        <p
          className="text-3xl sm:text-4xl font-normal leading-[1.18] text-[#3B2C22] break-words"
          style={{ fontFamily: SCRIPT_FONT, fontSynthesis: "none" }}
        >
          {data.couple.brideName}
        </p>
      </div>

      <div className="mx-auto mb-4 w-20 opacity-80">
        <img
          loading="eager"
          decoding="async"
          src="/templates/nhat-ky-mua-yeu/doodle_ink.webp"
          alt=""
          aria-hidden="true"
          className="h-auto w-full object-contain"
        />
      </div>

      {guestName && (
        <div className="mb-4 rounded-lg border border-[#C49A6C]/30 bg-[#F6EFE2]/80 px-3 py-1.5 text-xs text-[#6F5D50]">
          <span>Thân gửi: </span>
          <strong className="text-[#3B2C22]">{guestName}</strong>
        </div>
      )}

      {interactive ? (
        <m.button
          type="button"
          onClick={handleOpenInvitation}
          disabled={isOpening}
          whileHover={{ scale: shouldReduceMotion ? 1 : 1.03 }}
          whileTap={{ scale: shouldReduceMotion ? 1 : 0.97 }}
          className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#B85042] bg-[#B85042] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-md transition-all duration-300 hover:bg-[#9C3F33] hover:shadow-lg focus:outline-hidden disabled:pointer-events-none"
        >
          <span>MỞ THIỆP</span>
        </m.button>
      ) : (
        <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#B85042] bg-[#B85042] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-md">
          <span>MỞ THIỆP</span>
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={rootRef}
      data-template-id="nhat-ky-mua-yeu"
      className={cn(
        "relative mx-auto w-full max-w-[500px] text-[#3B2C22] selection:bg-[#B85042]/20 selection:text-[#B85042] antialiased",
        contained
          ? !coverGone
            ? "h-full overflow-hidden"
            : "min-h-full overflow-x-hidden"
          : !coverGone
            ? "h-screen-dvh max-h-full overflow-hidden"
            : "min-h-screen overflow-x-hidden",
      )}
      style={{
        backgroundColor: COLOR_BG,
        fontFamily: BODY_FONT,
      }}
    >
      {/* Nút điều khiển nhạc nền (ẩn khi Preview/Modal dùng externalMusicControl) */}
      {!externalMusicControl && !hidden.has("music") && data.music?.src && (
        <LiveMusicFloatingButton
          src={data.music.src}
          title={data.music.title}
          visible={coverGone}
        />
      )}

      {/* Preload ảnh trạng thái mở gói quà */}
      <img
        loading="lazy"
        decoding="async"
        src="/templates/nhat-ky-mua-yeu/parcel_open.webp"
        className="hidden"
        aria-hidden="true"
        alt=""
      />

      {/* =========================================================
          1. MÀN BÌA BUNG BĂNG KEO → RƠI TRONG GIÓ (ẢO ẢNH TRUYỆN TRANH) → ZOOM HERO
          ========================================================= */}
      <AnimatePresence>
        {!coverGone && (
          <div
            key="diary-tape-fall-cover"
            className={cn(
              "absolute inset-0 z-50 flex items-center justify-center overflow-hidden px-4 py-4 select-none",
              isOpening && "pointer-events-none",
            )}
          >
            {/* Lớp Backdrop bìa — mờ dần mượt theo RAF khi mặt sau Hero tiến về 1:1 */}
            <div
              ref={coverBackdropRef}
              className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
              style={{
                backgroundColor: COLOR_BG,
                opacity: isOpening && shouldReduceMotion ? 0 : 1,
                transition: shouldReduceMotion ? "opacity 0.16s ease" : undefined,
                willChange: "opacity",
              }}
              aria-hidden="true"
            >
              <picture className="h-full w-full block">
                <source
                  media="(min-width: 640px)"
                  srcSet={
                    contained || viewport === "phone"
                      ? "/templates/nhat-ky-mua-yeu/bg_page_mobile.webp"
                      : "/templates/nhat-ky-mua-yeu/bg_page_desktop.webp"
                  }
                />
                <img
                  loading="eager"
                  decoding="async"
                  src="/templates/nhat-ky-mua-yeu/bg_page_mobile.webp"
                  alt=""
                  className="h-full w-full object-cover object-center"
                />
              </picture>

              {/* Các mảnh dán góc bìa ban đầu — bay vọt ngược lên khi tờ giấy rời chốt */}
              <div
                ref={coverDecorUpRef}
                className="pointer-events-none absolute inset-0"
                style={{ willChange: "transform, opacity" }}
              >
                <div className="absolute -top-3 left-8 w-28 sm:w-32 -rotate-3">
                  <WashiTapeGraphic variant="sage" eager className="opacity-90" />
                </div>
                <div className="absolute top-6 right-5 w-16 sm:w-20 rotate-6">
                  <img
                    loading="eager"
                    decoding="async"
                    src="/templates/nhat-ky-mua-yeu/ephemera_stamp.webp"
                    alt=""
                    className="h-auto w-full object-contain drop-shadow-md"
                  />
                </div>
                <div className="absolute bottom-6 left-6 w-14 sm:w-16 -rotate-12">
                  <img
                    loading="eager"
                    decoding="async"
                    src="/templates/nhat-ky-mua-yeu/sticker_daisies.webp"
                    alt=""
                    className="h-auto w-full object-contain drop-shadow-sm"
                  />
                </div>
              </div>

              {/* Lớp phụ kiện truyện tranh lao ngược từ dưới lên tạo ảo ảnh rơi từ trên cao */}
              <div
                ref={risingComicRef}
                data-comic-rising-layer="true"
                className="pointer-events-none absolute inset-x-0 top-full h-[210%]"
                style={{ opacity: 0, willChange: "transform, opacity" }}
              >
                <div className="relative h-full w-full">
                  <div className="absolute top-[6%] left-[8%] w-16 -rotate-12 opacity-85">
                    <img
                      loading="eager"
                      decoding="async"
                      src="/templates/nhat-ky-mua-yeu/sticker_daisies.webp"
                      alt=""
                      className="h-auto w-full object-contain"
                    />
                  </div>
                  <div className="absolute top-[16%] right-[7%] w-20 rotate-12 opacity-80">
                    <img
                      loading="eager"
                      decoding="async"
                      src="/templates/nhat-ky-mua-yeu/ephemera_boarding.webp"
                      alt=""
                      className="h-auto w-full object-contain drop-shadow-sm"
                    />
                  </div>
                  <div className="absolute top-[30%] left-[12%] w-24 rotate-6 opacity-75">
                    <WashiTapeGraphic variant="plaid" eager />
                  </div>
                  <div className="absolute top-[42%] right-[12%] w-14 -rotate-6 opacity-85">
                    <img
                      loading="eager"
                      decoding="async"
                      src="/templates/nhat-ky-mua-yeu/ephemera_stamp.webp"
                      alt=""
                      className="h-auto w-full object-contain"
                    />
                  </div>
                  <div className="absolute top-[56%] left-[7%] w-18 rotate-12 opacity-80">
                    <img
                      loading="eager"
                      decoding="async"
                      src="/templates/nhat-ky-mua-yeu/ephemera_cinema.webp"
                      alt=""
                      className="h-auto w-full object-contain drop-shadow-sm"
                    />
                  </div>
                  <div className="absolute top-[68%] right-[10%] w-16 -rotate-12 opacity-85">
                    <img
                      loading="eager"
                      decoding="async"
                      src="/templates/nhat-ky-mua-yeu/sticker_daisies.webp"
                      alt=""
                      className="h-auto w-full object-contain"
                    />
                  </div>
                  <div className="absolute top-[80%] left-[15%] w-10 rotate-12 opacity-80">
                    <img
                      loading="eager"
                      decoding="async"
                      src="/templates/nhat-ky-mua-yeu/sticker_hearts.webp"
                      alt=""
                      className="h-auto w-full object-contain"
                    />
                  </div>
                  <div className="absolute top-[88%] right-[18%] w-24 -rotate-6 opacity-75">
                    <WashiTapeGraphic variant="sage" eager />
                  </div>
                </div>
              </div>
            </div>

            {/* Hiệu ứng gió cuộn & vạch tốc độ truyện tranh 60fps trên <canvas> */}
            <WindSwirlCanvas active={isOpening && !coverGone && !shouldReduceMotion} />

            {/* Điểm neo trung tâm đo FLIP (ẩn tĩnh để giữ kích thước, không chứa button để tránh detach khi mount FLIP) */}
            <div
              ref={coverCardSlotRef}
              className="relative z-10 w-full max-w-[328px] sm:max-w-[360px] pointer-events-none invisible select-none"
              aria-hidden="true"
            >
              {renderCoverFrontCard(false)}
            </div>

            {/* Khối giấy 2 mặt FLIP luôn gắn cố định trong DOM, rơi xoay trong gió & zoom khớp 1-1 Hero */}
            <div
              ref={fallingWrapperRef}
              data-cover-falling-wrapper="true"
              className={cn(
                "absolute z-20",
                !flipGeom && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-[328px] sm:max-w-[360px]",
              )}
              style={
                flipGeom
                  ? {
                    left: flipGeom.heroLeft,
                    top: flipGeom.heroTop,
                    width: flipGeom.heroWidth,
                    height: flipGeom.heroHeight,
                    transform: `translate3d(${flipGeom.startX}px, ${flipGeom.startY}px, 0px) scale(${flipGeom.startScale})`,
                    transformOrigin: "center center",
                    willChange: "transform",
                  }
                  : {
                    transformOrigin: "center center",
                    willChange: "transform",
                  }
              }
            >
              {/* Perspective tách riêng trên lớp bọc 3D */}
              <div className="relative h-full w-full" style={{ perspective: "1400px" }}>
                <div
                  ref={sheet3dRef}
                  data-cover-3d-sheet="true"
                  className="relative h-full w-full"
                  style={{
                    transformStyle: "preserve-3d",
                    WebkitTransformStyle: "preserve-3d",
                    transform: "rotateY(0deg) rotateZ(0deg) rotateX(0deg)",
                    willChange: "transform",
                  }}
                >
                  {/* MẶT TRƯỚC: Thẻ bìa có 2 miếng băng keo */}
                  <div
                    className={cn(
                      "z-10",
                      flipGeom ? "absolute inset-0 flex items-center justify-center" : "relative flex items-center justify-center",
                    )}
                    style={{
                      transform: "translateZ(1px)",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    {renderCoverFrontCard(true)}
                  </div>

                  {/* MẶT SAU (rotateY 180°): Khung Hero thật lộ ra khi tờ giấy xoay trong gió */}
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 flex items-start justify-center",
                      !flipGeom && "hidden",
                    )}
                    style={{
                      transform: "rotateY(180deg) translateZ(1px)",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                    }}
                  >
                    <DiaryHeroStage
                      groomName={data.couple.groomName}
                      brideName={data.couple.brideName}
                      heroUrl={heroUrl}
                      quote={data.quote}
                      stickerEager
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================
          2. THÂN THIỆP CHÍNH (CANONICAL FLEX COLUMN + DÁN BĂNG KEO CUỘN)
          ========================================================= */}
      <DiaryScrollContext.Provider value={scrollContextValue}>
        <div className="relative z-10 mx-auto w-full max-w-[500px] px-4 pb-16 pt-8 sm:px-6 flex flex-col gap-10">
          {/* HERO (order: -1) */}
          <section
            style={{ order: -1 }}
            className={cn(
              "text-center",
              !coverGone && "opacity-0 pointer-events-none",
            )}
          >
            <DiaryHeroStage
              ref={heroStageRef}
              groomName={data.couple.groomName}
              brideName={data.couple.brideName}
              heroUrl={heroUrl}
              quote={data.quote}
              stickerEager
              onHeroImageLoad={measureFlipGeometry}
            />
          </section>

          {coverGone && (
            <>
              {/* 1. THÔNG TIN GIA ĐÌNH (family) */}
              {!hidden.has("family") && (
                <section style={{ order: orderOf("family") }} className="space-y-4">
                  <DiaryTapeReveal>
                    <h3
                      className="text-center text-2xl font-bold tracking-tight text-[#3B2C22]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Hai Bên Gia Đình
                    </h3>
                  </DiaryTapeReveal>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {(isBrideFirst ? (["bride", "groom"] as const) : (["groom", "bride"] as const)).map(
                      (side, idx) => {
                        const isBride = side === "bride";
                        const photoUrl = isBride ? data.photos?.brideUrl : data.photos?.groomUrl;
                        const roleTitle = isBride
                          ? data.couple.brideTitle || "CÔ DÂU"
                          : data.couple.groomTitle || "CHÚ RỂ";
                        const personName = isBride ? data.couple.brideName : data.couple.groomName;
                        const familyLabel = isBride ? "NHÀ GÁI" : "NHÀ TRAI";
                        const father = isBride ? brideFather : groomFather;
                        const mother = isBride ? brideMother : groomMother;

                        return (
                          <DiaryTapeReveal
                            key={side}
                            delay={idx === 0 ? 0.1 : 0.22}
                            className="h-full"
                          >
                            <div
                              className={cn(
                                "relative h-full rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 pt-6 shadow-md",
                                isBride ? "-rotate-1" : "rotate-1",
                              )}
                            >
                              <AnimatedWashiTape
                                variant={isBride ? "sage" : "plaid"}
                                direction={isBride ? "right-to-left" : "left-to-right"}
                                delay={idx === 0 ? 0.42 : 0.44}
                                rotateDeg={isBride ? 2 : -2}
                                className="absolute -top-3 right-5 w-20"
                              />

                              {/* Nửa trên: Ô ảnh vuông bo góc bên trái + danh xưng & tên bên phải */}
                              <div className="flex items-center gap-3.5 text-left">
                                {photoUrl && (
                                  <div className="aspect-square w-20 shrink-0 overflow-hidden rounded-2xl border border-[#C49A6C]/45 bg-[#EFE8DC] shadow-xs">
                                    <img
                                      loading="lazy"
                                      decoding="async"
                                      src={photoUrl}
                                      alt={personName}
                                      className="h-full w-full object-cover object-top"
                                    />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <span
                                    className={cn(
                                      "block text-xs font-bold tracking-widest uppercase",
                                      isBride ? "text-[#7D9378]" : "text-[#B85042]",
                                    )}
                                  >
                                    {roleTitle}
                                  </span>
                                  <h4
                                    className="mt-1 text-3xl sm:text-[32px] font-normal leading-[1.15] text-[#3B2C22] break-words"
                                    style={{ fontFamily: SCRIPT_FONT, fontSynthesis: "none" }}
                                  >
                                    {personName}
                                  </h4>
                                </div>
                              </div>

                              {(father || mother) && (
                                <div className="mt-4 border-t border-[#C49A6C]/25 pt-3 text-xs text-[#6F5D50] space-y-1 text-left">
                                  <span className="block font-bold text-[10px] tracking-wider text-[#9E744B] uppercase">
                                    {familyLabel}
                                  </span>
                                  {father && (
                                    <p className="flex items-center gap-1.5">
                                      <span className="text-[#9E744B]">Ông:</span>
                                      <span className="font-semibold text-[#3B2C22]">{father}</span>
                                    </p>
                                  )}
                                  {mother && (
                                    <p className="flex items-center gap-1.5">
                                      <span className="text-[#9E744B]">Bà:</span>
                                      <span className="font-semibold text-[#3B2C22]">{mother}</span>
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </DiaryTapeReveal>
                        );
                      },
                    )}
                  </div>
                </section>
              )}

              {/* 2. SỰ KIỆN CƯỚI & ĐỊA ĐIỂM (map) */}
              {!hidden.has("map") && (
                <section style={{ order: orderOf("map") }} className="space-y-4">
                  <DiaryTapeReveal>
                    <h3
                      className="text-center text-2xl font-bold tracking-tight text-[#3B2C22]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Lễ Cưới &amp; Địa Điểm
                    </h3>
                  </DiaryTapeReveal>

                  <div
                    className={cn(
                      "grid gap-4",
                      visibleEvents.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
                    )}
                  >
                    {visibleEvents.map((evt, idx) => {
                      const directionsUrl = getEventDirectionsUrl(evt);
                      const evtParts = formatWeddingDateParts(evt.startsAt || eventDateStr);
                      return (
                        <DiaryTapeReveal
                          key={evt.id || idx}
                          delay={0.1 + (idx % 2) * 0.14}
                          className="h-full"
                        >
                          <div className="relative h-full rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 pt-6 shadow-md flex flex-col justify-between">
                            <AnimatedWashiTape
                              variant={idx % 2 === 0 ? "plaid" : "sage"}
                              direction="left-to-right"
                              delay={0.44}
                              rotateDeg={-3}
                              className="absolute -top-2.5 left-4 z-20 w-20"
                            />

                            {/* Vé kỷ niệm mini đính góc phải */}
                            <div className="pointer-events-none absolute top-3 right-3 w-14 opacity-85">
                              <img
                                loading="lazy"
                                decoding="async"
                                src={
                                  idx % 2 === 0
                                    ? "/templates/nhat-ky-mua-yeu/ephemera_boarding.webp"
                                    : "/templates/nhat-ky-mua-yeu/ephemera_cinema.webp"
                                }
                                alt=""
                                aria-hidden="true"
                                className="h-auto w-full object-contain"
                              />
                            </div>

                            <div className="pr-14">
                              <h4
                                className="text-xl font-bold text-[#3B2C22]"
                                style={{ fontFamily: TITLE_FONT }}
                              >
                                {evt.title || "Tiệc Cưới"}
                              </h4>

                              <div className="mt-3 text-xs text-[#6F5D50] space-y-1">
                                <p className="font-bold text-[#D95338]">
                                  {evtParts.time || "10:00"} · {evtParts.day}/{evtParts.month}/{evtParts.year}
                                </p>
                                {evt.lunarDate && (
                                  <p className="italic text-[11px]">
                                    (Nhằm {formatLunarDateClean(evt.lunarDate)})
                                  </p>
                                )}
                                {evt.venueName && (
                                  <p className="flex items-center gap-1.5 font-semibold text-[#3B2C22] pt-0.5">
                                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#B85042]" />
                                    <span>{evt.venueName}</span>
                                  </p>
                                )}
                                {evt.venueAddress && (
                                  <p className="pl-5 text-[11px] leading-relaxed">{evt.venueAddress}</p>
                                )}
                              </div>
                            </div>

                            {directionsUrl && (
                              <div className="mt-4 pt-2 border-t border-[#C49A6C]/15">
                                <a
                                  href={directionsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#B85042] bg-[#B85042] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#9C3F33]"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  <span>Chỉ Đường</span>
                                </a>
                              </div>
                            )}
                          </div>
                        </DiaryTapeReveal>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 3. CHUYỆN CHÚNG MÌNH — CHỒNG GIẤY KÉO TAY TƯƠNG TÁC (story — Standard) */}
              {isStoryVisible && (
                <section style={{ order: orderOf("story") }} className="space-y-4">
                  <DiaryTapeReveal>
                    <h3
                      className="text-center text-2xl font-bold tracking-tight text-[#3B2C22]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Chuyện Chúng Mình
                    </h3>
                  </DiaryTapeReveal>

                  <DiaryTapeReveal delay={0.12}>
                    <DiaryStoryPullStack
                      milestones={storyMilestones}
                      muted={sfxMuted}
                      reducedMotion={shouldReduceMotion}
                    />
                  </DiaryTapeReveal>
                </section>
              )}

              {/* 4. TRANG PHỤC GỢI Ý (dresscode) */}
              {!hidden.has("dresscode") && dressColors.length > 0 && (
                <section style={{ order: orderOf("dresscode") }} className="space-y-4">
                  <DiaryTapeReveal>
                    <h3
                      className="text-center text-2xl font-bold tracking-tight text-[#3B2C22]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Trang Phục Gợi Ý
                    </h3>
                  </DiaryTapeReveal>

                  <DiaryTapeReveal delay={0.1}>
                    <div className="relative rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 pt-7 shadow-lg text-center">
                      <AnimatedWashiTape
                        variant="sage"
                        direction="left-to-right"
                        delay={0.42}
                        rotateDeg={-1}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-24"
                      />
                      <div className="flex items-center justify-center gap-4 sm:gap-6">
                        {dressColors.map((color, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-2">
                            <div
                              className="h-12 w-12 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110"
                              style={{ backgroundColor: color }}
                              aria-label={`Màu trang phục ${idx + 1}`}
                            />
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E744B]">
                              Màu #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DiaryTapeReveal>
                </section>
              )}

              {/* 5. LỊCH NGÀY VUI & ĐẾM NGƯỢC (calendar) */}
              {!hidden.has("calendar") && (
                <section style={{ order: orderOf("calendar") }} className="space-y-4">
                  <DiaryTapeReveal>
                    <h3
                      className="text-center text-2xl font-bold tracking-tight text-[#3B2C22]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Lịch Ngày Vui &amp; Đếm Ngược
                    </h3>
                  </DiaryTapeReveal>

                  {/* Dấu ngày phim 35mm */}
                  <DiaryTapeReveal delay={0.08}>
                    <div className="relative overflow-hidden rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 shadow-lg text-center">
                      <span className="text-[10px] font-bold tracking-[0.2em] text-[#9E744B] uppercase">
                        NGÀY HẠNH PHÚC
                      </span>

                      <div className="my-2.5 flex flex-col items-center justify-center gap-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C49A6C]/30 bg-[#F6EFE2] px-3 py-0.5 text-xs font-semibold text-[#6F5D50]">
                          <span>{dateParts.time ? `Lúc ${dateParts.time}` : "Lễ Cưới"}</span>
                          {dateParts.weekday && (
                            <>
                              <span aria-hidden="true" className="text-[#C49A6C]">
                                •
                              </span>
                              <span className="capitalize">{dateParts.weekday}</span>
                            </>
                          )}
                        </span>
                        <span className="text-3xl sm:text-4xl font-bold text-[#D95338] tracking-wide">
                          {dateParts.day} / {dateParts.month} / {dateParts.year}
                        </span>
                      </div>

                      {targetEvent?.lunarDate && (
                        <div className="text-xs font-semibold text-[#6F5D50]">
                          <span>Âm lịch: {formatLunarDateClean(targetEvent.lunarDate)}</span>
                        </div>
                      )}
                    </div>
                  </DiaryTapeReveal>

                  {/* Bảng lịch tháng sổ tay có băng keo dán đỉnh */}
                  <DiaryTapeReveal delay={0.14}>
                    <div className="relative rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 pt-7 shadow-lg">
                      <AnimatedWashiTape
                        variant="plaid"
                        direction="left-to-right"
                        delay={0.44}
                        rotateDeg={-1}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 w-24"
                      />

                      <div className="mb-4 flex items-center justify-between border-b border-[#C49A6C]/20 pb-3">
                        <span className="text-xs font-bold tracking-widest text-[#B85042] uppercase">
                          THÁNG {dateParts.month} / {dateParts.year}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-[#9E744B]">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <span>Lịch chung đôi</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-xs">
                        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dow, idx) => (
                          <span key={idx} className="py-1 text-[10px] font-bold text-[#9E744B]">
                            {dow}
                          </span>
                        ))}
                        {calendarDays.map((dayNum, idx) => {
                          if (dayNum === null) {
                            return <div key={`empty-${idx}`} className="py-2" />;
                          }
                          const isWeddingDay = eventDays.has(dayNum);
                          return (
                            <div
                              key={`day-${dayNum}`}
                              className={cn(
                                "relative flex items-center justify-center rounded-lg py-2 text-xs font-medium transition-colors",
                                isWeddingDay
                                  ? "bg-[#B85042] font-bold text-white shadow-md"
                                  : "text-[#3B2C22] hover:bg-[#C49A6C]/10",
                              )}
                            >
                              {dayNum}
                              {isWeddingDay && (
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F3DFA2]" />
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </DiaryTapeReveal>

                  {/* Đồng hồ đếm ngược + Thêm lịch */}
                  <DiaryTapeReveal delay={0.18}>
                    <div className="flex flex-col items-center gap-4">
                      <div className="grid w-full grid-cols-4 gap-2 sm:gap-3 text-center">
                        {[
                          { label: "Ngày", val: padCountdownUnit(countdown.days) },
                          { label: "Giờ", val: padCountdownUnit(countdown.hours) },
                          { label: "Phút", val: padCountdownUnit(countdown.minutes) },
                          { label: "Giây", val: padCountdownUnit(countdown.seconds) },
                        ].map((item, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col items-center justify-center rounded-xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-3 shadow-xs"
                          >
                            <span className="text-xl sm:text-2xl font-bold text-[#3B2C22]">
                              {item.val}
                            </span>
                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[#9E744B]">
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      <a
                        href={calendarHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-[#C49A6C] bg-[#FCF9F2] px-5 py-2 text-xs font-bold tracking-wider text-[#3B2C22] uppercase shadow-xs transition-colors hover:border-[#B85042] hover:text-[#B85042]"
                      >
                        <CalendarIcon className="h-3.5 w-3.5 text-[#B85042]" />
                        <span>Thêm Vào Lịch Của Bạn</span>
                      </a>
                    </div>
                  </DiaryTapeReveal>
                </section>
              )}

              {/* 6. GÓI QUÀ GIẤY KRAFT 3 TRẠNG THÁI (gift) */}
              {!hidden.has("gift") && (
                <section style={{ order: orderOf("gift") }} className="space-y-4">
                  <DiaryTapeReveal>
                    <h3
                      className="text-center text-2xl font-bold tracking-tight text-[#3B2C22]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      Gói Quà Mừng Cưới
                    </h3>
                  </DiaryTapeReveal>

                  <DiaryTapeReveal delay={0.12}>
                    <div className="relative flex flex-col items-center justify-center rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-6 pt-8 shadow-xl text-center">
                      <AnimatedWashiTape
                        variant="sage"
                        direction="right-to-left"
                        delay={0.44}
                        rotateDeg={2}
                        className="absolute -top-3 right-8 w-20"
                      />

                      <button
                        type="button"
                        onClick={handleGiftClick}
                        disabled={isBoxOpening}
                        className="group relative flex cursor-pointer items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 disabled:pointer-events-none"
                        aria-label="Mở gói quà giấy kraft mừng cưới"
                      >
                        <div
                          className="pointer-events-none absolute inset-0 -m-4 rounded-3xl bg-gradient-to-r from-[#F3DFA2]/40 via-[#B85042]/20 to-[#F3DFA2]/40 blur-xl transition-opacity duration-300"
                          style={{
                            opacity: boxStage === "open" || boxStage === "glow" ? 0.9 : 0.3,
                          }}
                          aria-hidden="true"
                        />

                        <div className="relative z-10 h-48 w-48 sm:h-52 sm:w-52">
                          <img
                            loading="lazy"
                            decoding="async"
                            src={
                              boxStage === "open"
                                ? "/templates/nhat-ky-mua-yeu/parcel_open.webp"
                                : boxStage === "glow"
                                  ? "/templates/nhat-ky-mua-yeu/parcel_glow.webp"
                                  : "/templates/nhat-ky-mua-yeu/parcel_normal.webp"
                            }
                            alt="Gói quà mừng cưới giấy kraft"
                            className="mx-auto block h-full w-full object-contain"
                          />
                        </div>
                      </button>

                      <p className="mt-3 text-xs font-bold tracking-[0.2em] text-[#B85042] uppercase">
                        {boxStage === "open" ? "GÓI QUÀ ĐÃ MỞ" : "CHẠM ĐỂ MỞ GÓI QUÀ"}
                      </p>
                    </div>
                  </DiaryTapeReveal>
                </section>
              )}

              {/* 7. XÁC NHẬN THAM DỰ RSVP (rsvp) */}
              {!hidden.has("rsvp") && (
                <section style={{ order: orderOf("rsvp") }} className="space-y-4">
                  <DiaryTapeReveal>
                    <div
                      className="overflow-hidden rounded-2xl border border-[#C49A6C]/50 bg-[#FCF9F2] p-5 sm:p-6 shadow-xl"
                      style={{ colorScheme: "light" }}
                    >
                      <TemplateRsvpSection
                        data={data}
                        mode={mode}
                        tone="minbrown"
                        customTheme={{
                          isDark: false,
                          wrap: "bg-transparent text-[#3B2C22]",
                          heading:
                            "text-[#B85042] [font-family:var(--font-playfair),'Playfair_Display',Georgia,serif]",
                          card: "bg-[#FCF9F2] border border-[#C49A6C]/60 text-[#3B2C22] shadow-xs",
                          input:
                            "bg-[#FAF6EE] border border-[#C49A6C]/50 text-[#3B2C22] placeholder:text-[#8A7668] focus:border-[#B85042]",
                          primaryBtn: "bg-[#B85042] text-white hover:bg-[#9C3F33] font-bold shadow-md",
                          outlineBtn: "border border-[#C49A6C] text-[#3B2C22] hover:bg-[#C49A6C]/10",
                          optionBg: "#FCF9F2",
                          optionColor: "#3B2C22",
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
                  </DiaryTapeReveal>
                </section>
              )}

              {/* 8. CUỘN FILM KỶ NIỆM — TỪNG ẢNH FADE IN RỒI BĂNG DÍNH WASHI CUỘN DÁN LÊN MÉP ẢNH (album) */}
              {!hidden.has("album") && galleryPhotos.length > 0 && (
                <section style={{ order: orderOf("album") }} className="space-y-4">
                  <DiaryTapeReveal>
                    <div className="flex items-center justify-center gap-2">
                      <img
                        loading="lazy"
                        decoding="async"
                        src="/templates/nhat-ky-mua-yeu/ephemera_camera.webp"
                        alt=""
                        aria-hidden="true"
                        className="h-6 w-auto object-contain"
                      />
                      <h3
                        className="text-2xl font-bold tracking-tight text-[#3B2C22]"
                        style={{ fontFamily: TITLE_FONT }}
                      >
                        Album Ảnh Cưới
                      </h3>
                    </div>
                  </DiaryTapeReveal>

                  <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
                    {galleryPhotos.map((photo, idx) => {
                      const photoSrc = typeof photo === "string" ? photo : photo.url;
                      const photoAlt = (typeof photo === "object" && photo.alt) || `Khoảnh khắc ${idx + 1}`;
                      const isEven = idx % 2 === 0;
                      return (
                        <DiaryTapeReveal
                          key={(typeof photo === "object" && photo.id) || idx}
                          delay={(idx % 3) * 0.1}
                          distance={22}
                          duration={0.85}
                        >
                          <div className={cn("relative pt-2", isEven ? "-rotate-1" : "rotate-1")}>
                            <AnimatedWashiTape
                              variant={isEven ? "plaid" : "sage"}
                              direction={isEven ? "left-to-right" : "right-to-left"}
                              delay={0.4 + (idx % 3) * 0.08}
                              rotateDeg={isEven ? -6 : 5}
                              className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 w-16 sm:w-18"
                            />
                            <button
                              type="button"
                              onClick={() => setLightboxIndex(idx)}
                              className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-xl border border-[#C49A6C]/45 bg-[#FCF9F2] p-1.5 shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-lg focus:outline-hidden"
                            >
                              <div className="relative h-full w-full overflow-hidden rounded-lg bg-[#EFE8DC]">
                                <img
                                  loading="lazy"
                                  decoding="async"
                                  src={photoSrc}
                                  alt={photoAlt}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              </div>
                            </button>
                          </div>
                        </DiaryTapeReveal>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* 9. ALBUM QR KHÁCH MỜI (albumQr — Standard Edition) */}
              {!isFree && !hidden.has("albumQr") && effectiveWeddingSlug && (
                <section style={{ order: orderOf("albumQr") }}>
                  <DiaryTapeReveal>
                    <div className="overflow-hidden rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 shadow-lg text-center">
                      <GuestAlbumQr
                        slug={effectiveWeddingSlug}
                        accentColor={COLOR_RED_BRICK}
                        textColor={COLOR_TEXT_MAIN}
                        mutedColor={COLOR_TEXT_MUTED}
                      />
                    </div>
                  </DiaryTapeReveal>
                </section>
              )}

              {/* FOOTER (order: 999) */}
              <footer
                style={{ order: 999 }}
                className="mt-6 border-t border-[#C49A6C]/30 bg-[#F6EFE2] py-10 text-center text-xs text-[#6F5D50]"
              >
                <DiaryTapeReveal>
                  <div className="mx-auto max-w-sm px-4 space-y-2">
                    <p className="text-sm sm:text-base font-medium text-[#B85042]">
                      Cảm ơn bạn đã trở thành một phần trong câu chuyện nhỏ của tụi mình
                    </p>
                    <p className="text-[11px] font-semibold tracking-[0.2em] text-[#9E744B] uppercase">
                      TRÂN TRỌNG CẢM ƠN
                    </p>
                    <p className="text-[10px] text-[#9E744B]/80 pt-2">
                      {dateParts.year} · {data.couple.groomName} &amp; {data.couple.brideName}
                    </p>
                  </div>
                </DiaryTapeReveal>
              </footer>
            </>
          )}
        </div>
      </DiaryScrollContext.Provider>

      {/* MODAL QUÀ MỪNG */}
      <GiftModal
        open={isGiftModalOpen}
        onClose={handleCloseGiftModal}
        gift={data.gift}
        plan={plan}
        tone="minbrown"
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName}
      />

      {/* LIGHTBOX ẢNH */}
      {lightboxIndex !== null && (
        <TemplateLightboxModal
          photos={galleryPhotos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      )}
    </div>
  );
}

export default NhatKyMuaYeuTemplate;
