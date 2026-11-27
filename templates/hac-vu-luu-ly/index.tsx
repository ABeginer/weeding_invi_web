"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Heart,
  ExternalLink,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { playStandardCoverFoley, playInteractionFoley } from "@/lib/sfx-foley";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingPlan, WeddingStoryMilestone } from "@/lib/wedding-types";
import {
  ImperialReveal,
  HeroReveal,
  GoldButtonShimmer,
  IMPERIAL_EASE,
} from "../shared/ImperialMotion";
import { FilmFrame35mm } from "../shared/FilmFrame35mm";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: HẠC VŨ LƯU LY (hac-vu-luu-ly)
   ============================================================ */

const SAPPHIRE_MIDNIGHT = "#0B192C";
const SAPPHIRE_CARD = "#11253E";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const DEFAULT_TIMELINE = [
  { time: "17:30", label: "Đón tiếp quan khách & Chụp ảnh kỷ niệm dưới ánh trăng" },
  { time: "18:30", label: "Cử hành hôn lễ Hạc Vũ & Lời thề nguyền sắt son" },
  { time: "19:00", label: "Khai tiệc & Nâng ly chúc phúc" },
  { time: "20:00", label: "Khúc Vũ Nguyệt Cung & Điệu valse uyên ương" },
  { time: "21:00", label: "Tiễn khách & Trao quà lưu niệm tri ân" },
];

const DEFAULT_DRESS = ["#0B192C", "#E5CFA3", "#F8F6F0"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

function getDefaultStory(data: TemplateData): WeddingStoryMilestone[] {
  const custom = data.story?.filter(
    (s) => s.title.trim().length > 0 || s.content.trim().length > 0,
  );
  if (custom && custom.length > 0) return custom;
  const groom = data.couple?.groomName || "Chú Rể";
  const bride = data.couple?.brideName || "Cô Dâu";
  return [
    {
      year: "Lần đầu hội ngộ",
      title: "Ánh Trăng Đầu Mùa",
      content: `Giữa muôn ngàn ngã rẽ của nhân gian, ${groom} và ${bride} vô tình bắt gặp ánh mắt nhau — khoảnh khắc lặng lẽ như cánh hạc khẽ đáp xuống mặt hồ thu.`,
    },
    {
      year: "Tháng năm đồng hành",
      title: "Dệt Mộng Lưu Ly",
      content:
        "Từ những buổi tối chuyện trò bất tận đến những chuyến đi xa cùng nhau, mỗi kỷ niệm đều hóa thành mảnh men ngọc sáng trong ký ức hai đứa.",
    },
    {
      year: "Ước hẹn trăm năm",
      title: "Dưới Bóng Nguyệt Môn",
      content:
        "Hôm nay dưới ánh trăng viên mãn và sự chứng giám của gia đình hai họ, chúng mình chính thức chung một mái nhà, nguyện nắm tay đi trọn kiếp người.",
    },
  ];
}

/* ------------------------------------------------------------
   Hiệu ứng Bụi Sao Trăng Ngà & Ánh Kim Sa Pháp Lam
   - Tự tắt chuyển động khi prefers-reduced-motion
   ------------------------------------------------------------ */
function MoonlitDust({ count = 18 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 19) % 94 + 3}%`,
      size: (idx % 3) + 2.5,
      duration: 7 + (idx % 4) * 2,
      delay: (idx * 0.45) % 4,
      yOffset: 25 + (idx % 4) * 20,
      isShimmer: idx % 2 === 0,
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
            bottom: "8%",
            width: p.size,
            height: p.size,
            background: p.isShimmer
              ? "radial-gradient(circle, #F4E8CE 0%, rgba(229,207,163,0.4) 70%, transparent 100%)"
              : "radial-gradient(circle, #FFFFFF 0%, rgba(244,232,206,0.3) 60%, transparent 100%)",
            boxShadow: "0 0 6px 1px rgba(244,232,206,0.5)",
          }}
          animate={{
            y: [-10, -p.yOffset * 3.5, -p.yOffset * 7],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * (10 + (p.id % 12)), 0],
            opacity: [0, 0.85, 0],
            scale: [0.7, 1.25, 0.6],
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

/* ============================================================
   MÀN HÌNH BÌA: "THU NAN — LẬT QUẠT XOAY VÒNG — KHÚC ĐÀN HẠC" (~2.75s)
   - Render Canvas 2D Retina 60fps liên tục 1 mạch (không ngắt quãng setTimeout giữa fold/spin/unfold)
   ============================================================ */
type CoverPhase = "idle" | "animating" | "scroll";

const FAN_W = 620;
const FAN_H = 469;
const FAN_PIVOT_X_PX = 307; // 49.5% of 620
const FAN_PIVOT_Y_PX = 330; // 70.4% of 469
const FAN_RIB_COUNT = 15;
const FAN_TOTAL_MS = 1820;

function easeInOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

function easeOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - c, 3);
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

const CANVAS_SPARKLES = Array.from({ length: 12 }, (_, i) => {
  const deg = -72 + (i / 11) * 144;
  const rad = (deg * Math.PI) / 180;
  return {
    dx: Math.sin(rad) * (135 + (i % 3) * 24),
    dy: -Math.cos(rad) * (120 + (i % 2) * 28),
    size: 2.2 + (i % 3) * 1.1,
    jade: i % 2 === 0,
    delay: (i % 4) * 0.04,
  };
});

function buildFanSlices(img: HTMLImageElement) {
  const slices: Array<{
    canvas: HTMLCanvasElement;
    centerDeg: number;
    foldRotateDeg: number;
    zOrder: number;
  }> = [];

  const stepDeg = 164 / FAN_RIB_COUNT;
  for (let i = 0; i < FAN_RIB_COUNT; i++) {
    const startDeg = -82 + i * stepDeg - 0.85;
    const endDeg = -82 + (i + 1) * stepDeg + 0.85;
    const centerDeg = (startDeg + endDeg) / 2;

    const c = document.createElement("canvas");
    c.width = FAN_W;
    c.height = FAN_H;
    const ctx = c.getContext("2d");
    if (ctx) {
      const rPx = 700;
      const p1x = FAN_PIVOT_X_PX + rPx * Math.sin((startDeg * Math.PI) / 180);
      const p1y = FAN_PIVOT_Y_PX - rPx * Math.cos((startDeg * Math.PI) / 180);
      const pmx = FAN_PIVOT_X_PX + rPx * Math.sin((centerDeg * Math.PI) / 180);
      const pmy = FAN_PIVOT_Y_PX - rPx * Math.cos((centerDeg * Math.PI) / 180);
      const p2x = FAN_PIVOT_X_PX + rPx * Math.sin((endDeg * Math.PI) / 180);
      const p2y = FAN_PIVOT_Y_PX - rPx * Math.cos((endDeg * Math.PI) / 180);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(FAN_PIVOT_X_PX, FAN_PIVOT_Y_PX);
      ctx.lineTo(p1x, p1y);
      ctx.lineTo(pmx, pmy);
      ctx.lineTo(p2x, p2y);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0, FAN_W, FAN_H);
      ctx.restore();
    }

    const midIdx = (FAN_RIB_COUNT - 1) / 2;
    slices.push({
      canvas: c,
      centerDeg,
      foldRotateDeg: -centerDeg * 0.94,
      zOrder: Math.abs(i - midIdx),
    });
  }

  // Lớp Đế chốt gỗ + dây tua rua phía dưới đinh tán
  const tasselCanvas = document.createElement("canvas");
  tasselCanvas.width = FAN_W;
  tasselCanvas.height = FAN_H;
  const tCtx = tasselCanvas.getContext("2d");
  if (tCtx) {
    tCtx.save();
    tCtx.beginPath();
    tCtx.moveTo(FAN_W * 0.45, FAN_H * 0.67);
    tCtx.lineTo(FAN_W * 0.55, FAN_H * 0.67);
    tCtx.lineTo(FAN_W * 0.85, FAN_H);
    tCtx.lineTo(FAN_W * 0.4, FAN_H);
    tCtx.closePath();
    tCtx.clip();
    tCtx.drawImage(img, 0, 0, FAN_W, FAN_H);
    tCtx.restore();
  }

  // Sắp xếp từ trung tâm ra 2 cánh ngoài để thanh nan cái xếp đè lên trên đẹp mắt
  const orderedSlices = [...slices].sort((a, b) => a.zOrder - b.zOrder);
  return { orderedSlices, tasselCanvas };
}

function FanOpeningCanvas({
  active,
  onReady,
}: {
  active: boolean;
  onReady: () => void;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const assetsRef = React.useRef<ReturnType<typeof buildFanSlices> | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.src = "/templates/hac-vu-luu-ly/cover-fan.webp";
    const prepare = () => {
      if (cancelled) return;
      assetsRef.current = buildFanSlices(img);
    };
    if (img.complete && img.naturalWidth > 0) {
      prepare();
    } else {
      img.onload = prepare;
    }
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let notifiedReady = false;
    let startTime = 0;

    const renderFrame = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = Math.min(FAN_TOTAL_MS, now - startTime);

      const assets = assetsRef.current;
      if (!assets) {
        rafId = requestAnimationFrame(renderFrame);
        return;
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const targetW = Math.max(1, Math.round(rect.width * dpr));
      const targetH = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Tỉ lệ fan gốc trong canvas mở rộng (canvas rộng = 1.56x, cao = 1.65x so với fan box)
      const baseW = rect.width / 1.56;
      const baseH = baseW * (FAN_H / FAN_W);
      const scaleToFan = baseW / FAN_W;
      const centerX = rect.width / 2;
      const centerY = rect.height * 0.54;

      // 1. Đường cong thời gian mượt liên tục 1 mạch
      // Pha gấp nan: 0 -> 600ms (0 -> 1)
      const foldUp = easeInOutCubic(elapsed / 600);
      // Pha giữ gấp gọn xoay: 600 -> 1060ms
      // Pha bung xòe domino từ 1060 -> 1700ms
      const globalUnfoldBase = (elapsed - 1040) / 620;

      // Pha lấy đà nghiêng nhẹ (-10°) rồi xoay trọn 1 vòng 360° liên tục (420ms -> 1580ms)
      let rollDeg = 0;
      if (elapsed <= 420) {
        rollDeg = -10 * easeInOutCubic(elapsed / 420);
      } else if (elapsed <= 1580) {
        const spinT = easeInOutCubic((elapsed - 420) / 1160);
        rollDeg = -10 + 370 * spinT;
      } else {
        rollDeg = 360;
      }

      // Nghiêng lật 3D nhẹ có khối quanh trục Y từ 540ms -> 1540ms (giữ độ dày >= 0.22 để không mất nét)
      let flipCos = 1;
      if (elapsed >= 540 && elapsed <= 1540) {
        const flipT = easeInOutCubic((elapsed - 540) / 1000);
        const rawCos = Math.cos(flipT * Math.PI * 2);
        flipCos = rawCos >= 0 ? Math.max(0.24, rawCos) : Math.min(-0.24, rawCos);
      }

      // Nâng nhẹ + phóng dịu khi bung quạt (nhấc cao -28px tách khỏi khánh ngọc bên dưới)
      const liftT = elapsed <= 1050 ? easeInOutCubic(elapsed / 1050) : 1 - easeOutCubic((elapsed - 1050) / 770) * 0.72;
      const liftY = -28 * liftT;
      const burstScaleT = easeOutCubic(clamp01((elapsed - 1060) / 560));
      const returnScaleT = easeInOutCubic(clamp01((elapsed - 1520) / 300));
      const fanScale = 1 + 0.14 * burstScaleT - 0.06 * returnScaleT;

      // 2. Vẽ 2 vòng sóng lưu ly & hạt ánh trăng tỏa nan quạt (1060ms -> 1780ms)
      if (elapsed >= 1040) {
        const ring1 = clamp01((elapsed - 1040) / 700);
        if (ring1 > 0 && ring1 < 1) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY + liftY, 24 + ring1 * (baseW * 0.62), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(229, 207, 163, ${(1 - ring1) * 0.78})`;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.restore();
        }
        const ring2 = clamp01((elapsed - 1160) / 640);
        if (ring2 > 0 && ring2 < 1) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY + liftY, 18 + ring2 * (baseW * 0.5), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(94, 234, 212, ${(1 - ring2) * 0.62})`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
          ctx.restore();
        }

        // Hạt ánh trăng bung xòe
        CANVAS_SPARKLES.forEach((sp) => {
          const st = clamp01((elapsed - (1080 + sp.delay * 1000)) / 620);
          if (st <= 0 || st >= 1) return;
          const e = easeOutCubic(st);
          const alpha = Math.sin(st * Math.PI) * 0.92;
          const px = centerX + sp.dx * e * (baseW / 230);
          const py = centerY + liftY + sp.dy * e * (baseW / 230);
          ctx.save();
          ctx.fillStyle = sp.jade
            ? `rgba(94, 234, 212, ${alpha})`
            : `rgba(244, 232, 206, ${alpha})`;
          ctx.shadowColor = sp.jade ? "rgba(94,234,212,0.85)" : "rgba(229,207,163,0.9)";
          ctx.shadowBlur = 7;
          ctx.beginPath();
          ctx.arc(px, py, sp.size * (0.7 + 0.5 * Math.sin(st * Math.PI)), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 3. Hệ trục quạt chính (tâm xoay ở giữa chiều cao mặt quạt)
      const pivotLocalX = (FAN_PIVOT_X_PX - FAN_W / 2) * scaleToFan;
      const pivotLocalY = (FAN_PIVOT_Y_PX - FAN_H * 0.56) * scaleToFan;

      ctx.save();
      ctx.translate(centerX, centerY + liftY);
      ctx.rotate((rollDeg * Math.PI) / 180);
      ctx.scale(fanScale * flipCos, fanScale);

      // Khi mặt sau (flipCos < 0), phủ bóng lam ngọc ánh kim nhẹ tạo chiều sâu 3D chân thực
      if (flipCos < 0) {
        ctx.filter = "brightness(0.84) sepia(0.25) hue-rotate(-10deg)";
      }

      // Vẽ từng múi nan xoay quanh đúng tâm chốt đinh tán (pivotLocalX, pivotLocalY)
      const totalSlices = assets.orderedSlices.length;
      assets.orderedSlices.forEach((slice, idx) => {
        // Khi bung quạt: bung dần mượt từ nan giữa ra hai cánh
        const sliceDelayNorm = (slice.zOrder / ((FAN_RIB_COUNT - 1) / 2)) * 0.24;
        const sliceUnfold = easeOutCubic(clamp01((globalUnfoldBase - sliceDelayNorm) / 0.76));
        const foldRatio = elapsed < 1040 ? foldUp : 1 - sliceUnfold;
        const ribAngleRad = ((slice.foldRotateDeg * foldRatio) * Math.PI) / 180;

        ctx.save();
        ctx.translate(pivotLocalX, pivotLocalY);
        ctx.rotate(ribAngleRad);
        ctx.translate(-FAN_PIVOT_X_PX * scaleToFan, -FAN_PIVOT_Y_PX * scaleToFan);

        // Bóng đổ nhẹ phân tách lớp giữa các nan khi xếp chồng
        if (foldRatio > 0.15 && idx > totalSlices - 5) {
          ctx.shadowColor = `rgba(5, 12, 24, ${0.32 * foldRatio})`;
          ctx.shadowBlur = 4;
        }
        ctx.drawImage(slice.canvas, 0, 0, baseW, baseH);
        ctx.restore();
      });

      // Vẽ lớp Đế chốt gỗ + dây tua rua gắn chặt ở tâm chốt, đung đưa mềm theo quán tính
      const tasselSwingDeg =
        elapsed <= 600
          ? -20 * easeInOutCubic(elapsed / 600)
          : elapsed <= 1650
            ? -20 * (1 - clamp01((elapsed - 600) / 1050)) + Math.sin((elapsed - 600) * 0.012) * 8
            : 0;
      ctx.save();
      ctx.filter = "none";
      ctx.translate(pivotLocalX, pivotLocalY);
      ctx.rotate((tasselSwingDeg * Math.PI) / 180);
      ctx.translate(-FAN_PIVOT_X_PX * scaleToFan, -FAN_PIVOT_Y_PX * scaleToFan);
      ctx.drawImage(assets.tasselCanvas, 0, 0, baseW, baseH);
      ctx.restore();

      ctx.restore();

      if (!notifiedReady) {
        notifiedReady = true;
        onReady();
      }

      if (elapsed < FAN_TOTAL_MS) {
        rafId = requestAnimationFrame(renderFrame);
      }
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, [active, onReady]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -top-[30%] -left-[28%] h-[165%] w-[156%] z-20",
        !active && "opacity-0",
      )}
    />
  );
}

function EnvelopeCover({
  data,
  guestName,
  contained,
  coverPhase,
  onOpenStart,
}: {
  data: TemplateData;
  guestName: string | null;
  contained?: boolean;
  coverPhase: CoverPhase;
  onOpenStart: () => void;
}) {
  const reduce = useReducedMotion();
  const closing = coverPhase !== "idle";
  const focusOnFan = coverPhase === "animating";
  const [canvasReady, setCanvasReady] = React.useState(false);
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const dateParts = targetEvent?.startsAt ? formatWeddingDateParts(targetEvent.startsAt) : (data.date ? formatWeddingDateParts(data.date) : null);

  const handleCanvasReady = React.useCallback(() => {
    setCanvasReady(true);
  }, []);

  return (
    <m.div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden px-4 text-[#F4E8CE] select-none",
        contained ? "min-h-full py-6" : "min-h-screen py-10",
      )}
      style={{ backgroundColor: SAPPHIRE_MIDNIGHT }}
      animate={
        coverPhase === "scroll"
          ? {
            y: reduce ? 0 : "-102%",
            opacity: reduce ? 0 : [1, 1, 0.85],
            transition: { duration: 0.95, ease: IMPERIAL_EASE },
          }
          : { y: "0%", opacity: 1 }
      }
    >
      {/* Thanh trục tranh thủy mặc ánh vàng kim ở cạnh đáy khi cuộn tranh lên */}
      {coverPhase === "scroll" && !reduce && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-2 bg-gradient-to-r from-[#B89C68] via-[#F4E8CE] to-[#B89C68] shadow-[0_0_18px_rgba(229,207,163,0.75)]"
        />
      )}

      {/* Nền đêm trăng lưu ly */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: "url('/templates/hac-vu-luu-ly/background-mobile.webp')",
          opacity: 0.38,
          transform: closing ? "scale(1.06)" : "scale(1)",
        }}
      />

      {/* Quầng sáng trăng tròn ảo diệu phía sau bìa */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: "min(90vw, 520px)",
          height: "min(90vw, 520px)",
          background:
            "radial-gradient(circle, rgba(27,77,92,0.45) 0%, rgba(11,25,44,0.2) 60%, transparent 80%)",
          filter: "blur(40px)",
        }}
      />

      {/* Bụi trăng ngà bay lơ lửng */}
      <MoonlitDust count={16} />

      {/* Thẻ Pháp Lam Đêm Trăng Trung Tâm */}
      <m.div
        className={cn(
          "relative z-20 my-auto flex w-full max-w-sm flex-col items-center rounded-3xl p-6 text-center shadow-2xl transition-all",
          contained ? "py-5" : "py-8",
        )}
        style={{
          backgroundColor: SAPPHIRE_CARD,
          boxShadow: "0 25px 60px -12px rgba(7, 17, 31, 0.85)",
        }}
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.65, ease: IMPERIAL_EASE }}
      >
        {/* Khung viền đôi chỉ vàng bạch kim */}
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-[#E5CFA3]/70">
          <div className="absolute inset-1 rounded-xl border border-[#E5CFA3]/30" />
        </div>

        {/* Quạt xếp đa nan 60fps Canvas 15 múi xoay đồng tâm quanh đinh tán */}
        <div className="relative mt-1 mb-0 flex w-full max-w-[215px] items-center justify-center sm:max-w-[245px]">
          {/* Quầng sáng vàng kim dưới quạt */}
          <div
            className="pointer-events-none absolute inset-0 -bottom-4 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(229,207,163,0.34) 0%, rgba(27,77,92,0.18) 55%, transparent 75%)",
              filter: "blur(12px)",
            }}
          />

          <div className="relative z-10 w-full aspect-[620/469]">
            <img
              loading="eager"
              decoding="async"
              src="/templates/hac-vu-luu-ly/cover-fan.webp"
              alt="Quạt Xếp Cung Đình — Hạc Vũ Lưu Ly"
              className={cn(
                "relative z-10 h-full w-full object-contain drop-shadow-xl transition-opacity duration-75",
                closing && !reduce && canvasReady ? "opacity-0" : "opacity-100",
              )}
            />
            {!reduce && (
              <FanOpeningCanvas active={closing} onReady={handleCanvasReady} />
            )}
          </div>
        </div>

        {/* Khánh ngọc lưu ly: lắc ánh kim nhẹ khi đang diễn quạt */}
        <m.div
          className="relative z-15 -mt-3 mb-2 flex items-center justify-center"
          style={{ transformOrigin: "top center" }}
          animate={
            reduce
              ? {}
              : focusOnFan
                ? { y: -4, scale: 0.96, rotate: [-4, 6, -3, 0] }
                : { y: 0, scale: 1, rotate: [-2.5, 2.5, -2.5] }
          }
          transition={
            focusOnFan
              ? { duration: 1.1, ease: "easeInOut" }
              : { duration: 4.8, repeat: Infinity, ease: "easeInOut" }
          }
        >
          <img
            loading="eager"
            decoding="async"
            src="/templates/hac-vu-luu-ly/jade-medallion.webp"
            alt="Khánh Ngọc Lưu Ly"
            className="relative z-10 h-14 w-auto object-contain drop-shadow-md sm:h-16"
          />
        </m.div>

        {/* Cụm chữ & nút trên bìa (mờ nhẹ lúc quạt xếp & xoay để tập trung thị giác vào quạt) */}
        <m.div
          className="flex w-full flex-col items-center"
          animate={{ opacity: focusOnFan ? 0.55 : 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >

          {/* Lời trân trọng kính mời */}
          <p
            className="mt-1 text-xs font-semibold tracking-[0.32em] uppercase text-[#E5CFA3]"
            style={{ fontFamily: BODY_FONT }}
          >
            {data.ui?.invitePrefix || "Trân Trọng Kính Mời"}
          </p>

          {/* Tên khách mời trang trọng */}
          <div className="my-2.5 max-w-[280px] rounded-full border border-[#E5CFA3]/50 bg-[#0B192C]/85 px-5 py-1.5 shadow-inner">
            <p
              className="truncate text-sm font-semibold tracking-wide text-[#F4E8CE]"
              style={{ fontFamily: BODY_FONT }}
            >
              {guestName || data.ui?.defaultGuestName || "Quý Khách Quý Mến"}
            </p>
          </div>

          {/* Dải phân cách họa tiết lông hạc mảnh */}
          <div className="my-1 flex items-center justify-center">
            <img loading="eager" decoding="async"
              src="/templates/hac-vu-luu-ly/divider-feather.webp"
              alt=""
              className="h-auto w-28 object-contain opacity-85"
              aria-hidden="true"
            />
          </div>

          {/* Tên cặp đôi 3 dòng chuẩn quy cách (Line 1: Chú rể - Line 2: & - Line 3: Cô dâu) */}
          <div className="my-2 w-full px-2">
            <h1
              className="block text-2xl font-bold tracking-wide text-[#F4E8CE] break-words sm:text-3xl"
              style={{ fontFamily: NAME_FONT }}
            >
              {data.couple?.groomName || "Minh Triết"}
            </h1>
            <div className="my-0.5 flex items-center justify-center gap-3">
              <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#E5CFA3]/60" />
              <span
                className="text-base font-normal italic text-[#E5CFA3]"
                style={{ fontFamily: TITLE_FONT }}
              >
                &amp;
              </span>
              <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#E5CFA3]/60" />
            </div>
            <h1
              className="block text-2xl font-bold tracking-wide text-[#F4E8CE] break-words sm:text-3xl"
              style={{ fontFamily: NAME_FONT }}
            >
              {data.couple?.brideName || "Lưu Ly"}
            </h1>
          </div>

          {/* Ngày cưới tóm tắt trên bìa */}
          {dateParts && (
            <p
              className="mt-1 text-xs font-medium tracking-[0.22em] text-[#E5CFA3]/95 uppercase"
              style={{ fontFamily: BODY_FONT }}
            >
              {dateParts.day} · {dateParts.month} · {dateParts.year}
            </p>
          )}

          {/* Nút bấm mở thiệp bùng nổ hiệu ứng + shimmer */}
          <m.button
            type="button"
            onClick={onOpenStart}
            disabled={closing}
            className="group relative mt-5 flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-[#E5CFA3] bg-gradient-to-r from-[#1B4D5C] via-[#0B192C] to-[#1B4D5C] px-8 py-2.5 text-xs font-semibold tracking-widest uppercase text-[#F4E8CE] shadow-lg transition-all duration-300 hover:border-[#F4E8CE] hover:shadow-[0_0_20px_rgba(229,207,163,0.4)] active:scale-95"
            style={{ fontFamily: BODY_FONT }}
            whileHover={reduce ? {} : { scale: 1.03 }}
            whileTap={reduce ? {} : { scale: 0.97 }}
          >
            <GoldButtonShimmer active={!closing} viaColor="rgba(244, 232, 206, 0.35)" />
            <span className="relative z-10">{closing ? "Đang Mở Tranh..." : "Mở Thiệp Cưới"}</span>
          </m.button>
        </m.div>
      </m.div>
    </m.div>
  );
}

/* ============================================================
   SECTION 1: HERO — CỔNG NGUYỆT MÔN & ĐÔI CÁNH HẠC
   ============================================================ */
function HeroSection({ data, showBody }: { data: TemplateData; showBody: boolean }) {
  const reduce = useReducedMotion();
  const couple = data.couple;
  const heroPhoto = data.photos?.heroUrl || "/photos/hero2.webp";

  return (
    <section className="relative overflow-hidden pt-12 pb-16 text-center text-[#F4E8CE]">
      {/* Nền đêm trăng lưu ly */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/templates/hac-vu-luu-ly/background.webp')" }}
      />
      <MoonlitDust count={12} />

      <div className="relative z-10 mx-auto max-w-xl px-4">
        {/* Phụ đề phong cách */}
        <HeroReveal showBody={showBody} delay={0.14} y={10}>
          <p
            className="text-[11px] sm:text-xs font-semibold tracking-[0.16em] uppercase text-[#E5CFA3]"
            style={{ fontFamily: BODY_FONT }}
          >
            {data.ui?.eyebrow || "Thiệp mời tham dự lễ cưới"}
          </p>
        </HeroReveal>

        {/* Tên cặp đôi 3 dòng trang trọng */}
        <HeroReveal showBody={showBody} delay={0.26} y={16} className="my-4">
          <h2
            className="block text-3xl font-bold tracking-wide text-[#F4E8CE] break-words sm:text-4xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {couple?.groomFullName || couple?.groomName || "Lê Minh Triết"}
          </h2>
          <div className="my-1 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#E5CFA3]/60" />
            <span
              className="text-lg font-normal italic text-[#E5CFA3]"
              style={{ fontFamily: TITLE_FONT }}
            >
              &amp;
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#E5CFA3]/60" />
          </div>
          <h2
            className="block text-3xl font-bold tracking-wide text-[#F4E8CE] break-words sm:text-4xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {couple?.brideFullName || couple?.brideName || "Trần Lưu Ly"}
          </h2>
        </HeroReveal>

        {/* Dải phân cách lông hạc */}
        <HeroReveal showBody={showBody} delay={0.36} scale={0.94} className="my-3 flex justify-center">
          <img loading="eager" decoding="async"
            src="/templates/hac-vu-luu-ly/divider-feather.webp"
            alt=""
            className="h-auto w-32 object-contain opacity-85"
            aria-hidden="true"
          />
        </HeroReveal>

        {/* Cổng Nguyệt Môn tròn ôm trọn ảnh bìa uyên ương */}
        <HeroReveal showBody={showBody} delay={0.46} scale={0.93} duration={1.0} className="relative mx-auto mt-4 mb-2 flex items-center justify-center">
          <div className="relative aspect-square w-64 sm:w-72 md:w-80">
            {/* Quầng sáng đêm trăng thở nhẹ phía sau Cổng Nguyệt Môn */}
            <m.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-4 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(229,207,163,0.22) 0%, rgba(27,77,92,0.16) 52%, transparent 74%)",
              }}
              animate={
                reduce
                  ? {}
                  : {
                    scale: [0.96, 1.05, 0.96],
                    opacity: [0.55, 0.85, 0.55],
                  }
              }
              transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Vòng quỹ đạo nguyệt luân xoay chậm chuẩn Standard */}
            <m.div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-2.5 rounded-full border border-dashed border-[#E5CFA3]/35"
              animate={reduce ? {} : { rotate: 360 }}
              transition={{ duration: 56, repeat: Infinity, ease: "linear" }}
            >
              <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-[#E5CFA3] shadow-[0_0_8px_rgba(229,207,163,0.9)]" />
              <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#E5CFA3]/75" />
            </m.div>

            {/* Ảnh chân dung uyên ương bên trong khung tròn */}
            <div className="absolute inset-4 overflow-hidden rounded-full border border-[#E5CFA3]/30 bg-[#07111F] shadow-2xl">
              {heroPhoto ? (
                <img loading="eager" decoding="async"
                  src={heroPhoto}
                  alt="Ảnh cưới Uyên Ương"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#11253E] to-[#07111F] p-4 text-[#F4E8CE]">
                  <span
                    className="text-4xl font-light text-[#E5CFA3]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    鶴
                  </span>
                  <p className="mt-2 text-xs tracking-widest uppercase text-[#E5CFA3]/80">
                    Lễ Thành Hôn
                  </p>
                </div>
              )}
            </div>

            {/* Khung cổng Nguyệt Môn tròn đè lên viền ảnh */}
            <img loading="eager" decoding="async"
              src="/templates/hac-vu-luu-ly/moon-gate.webp"
              alt="Cổng Nguyệt Môn"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain drop-shadow-[0_10px_25px_rgba(7,17,31,0.8)]"
              aria-hidden="true"
            />
          </div>
        </HeroReveal>

        {/* Câu trích dẫn tình yêu */}
        <HeroReveal showBody={showBody} delay={0.6} y={12} className="mx-auto mt-6 max-w-sm px-4">
          <p
            className="text-xs italic leading-relaxed text-[#F4E8CE]/85 sm:text-sm"
            style={{ fontFamily: BODY_FONT }}
          >
            &ldquo;Dưới bóng trăng thanh, đôi cánh hạc cùng bay qua biển rộng non cao — Nguyện cùng người nắm tay đi trọn kiếp nhân gian.&rdquo;
          </p>
        </HeroReveal>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 2: THÔNG TIN HAI BÊN GIA ĐÌNH + THẺ LẬT 3D CHÂN DUNG (STANDARD)
   - Hỗ trợ sắp thứ tự Nhà Gái trước (hostFirst === "bride")
   - Tích hợp cặp thẻ lật 3D chân dung Cô Dâu / Chú Rể (!data.hideCouplePhotos)
   ============================================================ */
function FlipPortraitCard({
  roleLabel,
  fullName,
  shortName,
  titleLabel,
  photoUrl,
  vowText,
  delay = 0,
}: {
  roleLabel: string;
  fullName: string;
  shortName: string;
  titleLabel: string;
  photoUrl: string;
  vowText: string;
  delay?: number;
}) {
  const [flipped, setFlipped] = React.useState(false);

  const handleToggle = () => {
    playInteractionFoley("card-flip", 0.34);
    setFlipped((prev) => !prev);
  };

  return (
    <ImperialReveal direction="up" delay={delay} className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={`Lật thẻ chân dung ${shortName}`}
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        className="group relative mx-auto aspect-[3/4] w-full max-w-[260px] cursor-pointer select-none focus:outline-none"
        style={{ perspective: "1100px" }}
      >
        <m.div
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.72, ease: IMPERIAL_EASE }}
          className="relative h-full w-full"
          style={{
            transformStyle: "preserve-3d",
            WebkitTransformStyle: "preserve-3d",
          }}
        >
          {/* MẶT TRƯỚC: Ảnh chân dung khung Pháp Lam Lưu Ly */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl border border-[#E5CFA3]/80 bg-[#0B192C] shadow-[0_14px_30px_rgba(11,25,44,0.22)]"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <img
              loading="lazy"
              decoding="async"
              src={photoUrl}
              alt={fullName}
              className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07111F]/90 via-[#07111F]/20 to-transparent" />
            <div className="pointer-events-none absolute inset-2 rounded-xl border border-[#E5CFA3]/45" />

            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-[#E5CFA3]/55 bg-[#07111F]/75 px-2.5 py-1 text-[10px] font-medium tracking-wider uppercase text-[#F4E8CE]">
              <RotateCw className="h-3 w-3 text-[#E5CFA3]" />
              <span>Lật thẻ</span>
            </div>

            <div className="absolute inset-x-0 bottom-0 p-4 text-left text-[#F4E8CE]">
              <span className="inline-block rounded-full border border-[#E5CFA3]/45 bg-[#1B4D5C]/65 px-2.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase text-[#E5CFA3]">
                {roleLabel}
              </span>
              <p
                className="mt-1.5 text-lg font-bold leading-snug text-[#F4E8CE]"
                style={{ fontFamily: NAME_FONT }}
              >
                {fullName}
              </p>
            </div>
          </div>

          {/* MẶT SAU: Tâm tình & Dấu triện Đêm Trăng */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-2xl border border-[#E5CFA3] bg-gradient-to-b from-[#0B192C] via-[#11253E] to-[#07111F] p-5 text-center text-[#F4E8CE] shadow-[0_14px_30px_rgba(11,25,44,0.28)]"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="pointer-events-none absolute inset-2 rounded-xl border border-[#E5CFA3]/40" />

            <div className="relative z-10 flex flex-col items-center">
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase text-[#E5CFA3]">
                {roleLabel} · {titleLabel}
              </span>
              <img
                loading="lazy"
                decoding="async"
                src="/templates/hac-vu-luu-ly/divider-feather.webp"
                alt=""
                aria-hidden="true"
                className="mt-2 h-auto w-20 object-contain opacity-85"
              />
            </div>

            <div className="relative z-10 my-auto space-y-2.5 px-1">
              <h3
                className="text-xl font-bold text-[#F4E8CE]"
                style={{ fontFamily: NAME_FONT }}
              >
                {fullName}
              </h3>
              <p
                className="text-xs italic leading-relaxed text-[#F4E8CE]/85"
                style={{ fontFamily: BODY_FONT }}
              >
                &ldquo;{vowText}&rdquo;
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-1.5 text-[10px] font-medium tracking-widest uppercase text-[#E5CFA3]/80">
              <RotateCw className="h-3 w-3" />
              <span>Chạm để xem ảnh</span>
            </div>
          </div>
        </m.div>
      </div>
    </ImperialReveal>
  );
}

function FamilySection({ data }: { data: TemplateData }) {
  const couple = data.couple;

  const formatParents = (parentsStr?: string | null) => {
    if (!parentsStr) return [];
    return parentsStr
      .split("&")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  };

  const groomParents = formatParents(couple?.groomParents || "Ông Lê Văn Thành & Bà Nguyễn Thị Hạnh");
  const brideParents = formatParents(couple?.brideParents || "Ông Trần Quốc Hùng & Bà Phạm Thị Lan");

  const groomColumn = {
    key: "groom",
    sideLabel: "Nhà Trai",
    parents: groomParents,
    title: couple?.groomTitle || "Trưởng Nam",
    fullName: couple?.groomFullName || couple?.groomName || "Lê Minh Triết",
    shortName: couple?.groomName || "Minh Triết",
    roleLabel: "Chú Rể",
    photoUrl: data.photos?.groomUrl || "/photos/portrait_cr.webp",
    vowText: "Dẫu năm tháng có đổi dời, anh vẫn nguyện là bến đỗ bình yên nhất dành cho em.",
  };

  const brideColumn = {
    key: "bride",
    sideLabel: "Nhà Gái",
    parents: brideParents,
    title: couple?.brideTitle || "Ái Nữ",
    fullName: couple?.brideFullName || couple?.brideName || "Trần Lưu Ly",
    shortName: couple?.brideName || "Lưu Ly",
    roleLabel: "Cô Dâu",
    photoUrl: data.photos?.brideUrl || "/photos/portrait_cd.webp",
    vowText: "Cảm ơn anh đã đến bên đời em, dịu dàng như ánh trăng soi sáng cả bầu trời đêm.",
  };

  const columns =
    data.hostFirst === "bride"
      ? [brideColumn, groomColumn]
      : [groomColumn, brideColumn];

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-20">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <ImperialReveal direction="up">
          <div className="mb-3 flex justify-center">
            <img loading="lazy" decoding="async"
              src="/templates/hac-vu-luu-ly/divider-feather.webp"
              alt=""
              className="h-auto w-32 object-contain opacity-85 sm:w-36"
              aria-hidden="true"
            />
          </div>

          <h2
            className="text-xl font-bold tracking-widest uppercase text-[#0E2238] sm:text-2xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            Thông Tin Gia Đình
          </h2>
        </ImperialReveal>

        {/* Lưới 2 nhà theo cấu hình hostFirst (Cao bằng nhau) */}
        <div className="mt-8 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
          {columns.map((col, idx) => (
            <ImperialReveal
              key={col.key}
              direction={idx === 0 ? "left" : "right"}
              delay={idx === 0 ? 0.08 : 0.14}
              className="h-full"
            >
              <div className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#E5CFA3]/70 bg-[#FFFFFF] p-6 text-center shadow-md">
                {/* Viền đôi thanh mảnh */}
                <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#E5CFA3]/30" />

                <div>
                  <span
                    className="text-xs font-semibold tracking-widest uppercase text-[#1B4D5C]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {col.sideLabel}
                  </span>
                  <div className="my-3 space-y-1">
                    {col.parents.map((name, i) => (
                      <p
                        key={i}
                        className="text-sm font-medium text-[#334457]"
                        style={{ fontFamily: BODY_FONT }}
                      >
                        {name}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="mt-4 border-t border-[#E5CFA3]/30 pt-4">
                  <p
                    className="text-xs text-[#5A6D82]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {col.title}
                  </p>
                  <p
                    className="text-base font-bold text-[#0E2238]"
                    style={{ fontFamily: NAME_FONT }}
                  >
                    {col.fullName}
                  </p>
                </div>
              </div>
            </ImperialReveal>
          ))}
        </div>

        {/* Thẻ Lật 3D Chân Dung Cô Dâu & Chú Rể (Standard Feature) */}
        {!data.hideCouplePhotos && (
          <div className="mt-12">
            <ImperialReveal direction="up" delay={0.1}>
              <p
                className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#1B4D5C]"
                style={{ fontFamily: BODY_FONT }}
              >
                Chân Dung Uyên Ương
              </p>
            </ImperialReveal>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {columns.map((col, idx) => (
                <FlipPortraitCard
                  key={`flip-${col.key}`}
                  roleLabel={col.roleLabel}
                  fullName={col.fullName}
                  shortName={col.shortName}
                  titleLabel={col.title}
                  photoUrl={col.photoUrl}
                  vowText={col.vowText}
                  delay={idx * 0.12}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 3: SỰ KIỆN CƯỚI (VỊ TRÍ NGÀY CƯỚI #1 - EVENTS & MAP)
   - Thẻ trắng ngà với huy hiệu thời gian
   - Nút dẫn đường Google Maps chuẩn xác
   ============================================================ */
function EventsSection({ data }: { data: TemplateData }) {
  const visibleEvents = getVisibleEvents(data);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className={`relative z-10 mx-auto text-center ${visibleEvents.length > 1 ? "max-w-4xl" : "max-w-xl"}`}>
        <ImperialReveal direction="up">
          <h2
            className="text-xl font-bold tracking-widest uppercase text-[#0E2238] sm:text-2xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            Sự Kiện Cưới
          </h2>
        </ImperialReveal>

        <div className={`mt-8 ${visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}`}>
          {visibleEvents.map((evt, idx) => {
            const { weekday, day, month, year, time } = formatWeddingDateParts(evt.startsAt);
            const cleanLunar = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : null;
            const mapUrl = getEventDirectionsUrl(evt);

            return (
              <ImperialReveal key={evt.id || idx} direction="up" delay={idx * 0.12} className="h-full">
                <div
                  className="relative h-full overflow-hidden rounded-2xl border border-[#E5CFA3]/70 bg-[#FFFFFF] p-6 text-center shadow-lg"
                >
                  {/* Viền đôi chỉ vàng */}
                  <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#E5CFA3]/30" />

                  {/* Tiêu đề sự kiện */}
                  <span
                    className="inline-block rounded-full border border-[#1B4D5C]/30 bg-[#1B4D5C]/10 px-4 py-1 text-xs font-semibold tracking-widest uppercase text-[#1B4D5C]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {evt.title || "Lễ Thành Hôn"}
                  </span>

                  {/* Huy hiệu thời gian & ngày tháng */}
                  <div className="my-5 flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 text-xs font-medium uppercase text-[#5A6D82]">
                      <Clock className="h-3.5 w-3.5 text-[#1B4D5C]" />
                      <span>{time || "10:00"}</span>
                      <span>•</span>
                      <span>{weekday || "Thứ Bảy"}</span>
                    </div>

                    {/* Cụm ngày lớn kiểu tạp chí sang trọng */}
                    <div className="my-2 flex items-center justify-center gap-3">
                      <span className="text-3xl font-bold text-[#0E2238] sm:text-4xl" style={{ fontFamily: TITLE_FONT }}>
                        {day || "20"}
                      </span>
                      <div className="text-left text-xs leading-tight text-[#5A6D82]">
                        <p className="font-semibold uppercase text-[#0E2238]">Tháng {month || "03"}</p>
                        <p>{year || "2027"}</p>
                      </div>
                    </div>

                    {cleanLunar && (
                      <p className="text-xs italic text-[#5A6D82]">
                        (Tức ngày {cleanLunar})
                      </p>
                    )}
                  </div>

                  {/* Địa điểm tổ chức */}
                  <div className="my-4 border-t border-[#E5CFA3]/30 pt-4">
                    <p
                      className="text-base font-bold text-[#0E2238]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {evt.venueName || "Gem Center — Sảnh Saltus"}
                    </p>
                    <p
                      className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#334457]"
                      style={{ fontFamily: BODY_FONT }}
                    >
                      {evt.venueAddress || "08 Nguyễn Bỉnh Khiêm, Đa Kao, Quận 1, TP. Hồ Chí Minh"}
                    </p>
                  </div>

                  {/* Nút chỉ đường Google Maps */}
                  <div className="mt-4 flex justify-center">
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-[#1B4D5C] bg-[#1B4D5C] px-5 py-2 text-xs font-medium tracking-wide text-[#F4E8CE] transition-all hover:bg-[#0B192C] hover:shadow-md active:scale-95"
                      style={{ fontFamily: BODY_FONT }}
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Chỉ Đường Đến Hôn Lễ</span>
                      <ExternalLink className="h-3 w-3 opacity-70" />
                    </a>
                  </div>
                </div>
              </ImperialReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 4: ALBUM ẢNH CƯỚI (GALLERY)
   - Nền Lam Lưu Ly Đêm #0B192C huyền ảo
   - Slider 3D Coverflow mượt mà, hỗ trợ phóng to Lightbox modal
   - Gói Free: tối đa 5 ảnh (Pro/VIP tối đa 30)
   ============================================================ */
function GallerySection({ data }: { data: TemplateData }) {
  const rawPhotos = data.photos?.gallery || [];
  const maxPhotos = data.plan === "free" ? 5 : 30;
  const galleryPhotos = rawPhotos.slice(0, maxPhotos);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  if (galleryPhotos.length === 0) return null;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : galleryPhotos.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < galleryPhotos.length - 1 ? prev + 1 : 0));
  };

  return (
    <section className="relative overflow-hidden bg-[#0B192C] px-4 py-16 text-[#F4E8CE] md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url('/templates/hac-vu-luu-ly/background-mobile.webp')" }}
      />
      <MoonlitDust count={12} />

      <div className="relative z-10 mx-auto max-w-xl text-center">
        <ImperialReveal direction="up">
          <div className="mb-3 flex justify-center">
            <img loading="lazy" decoding="async"
              src="/templates/hac-vu-luu-ly/divider-feather.webp"
              alt=""
              className="h-auto w-32 object-contain opacity-85"
              aria-hidden="true"
            />
          </div>

          <h2
            className="text-xl font-bold tracking-widest uppercase text-[#F4E8CE] sm:text-2xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            Album Ảnh Cưới
          </h2>
        </ImperialReveal>

        {/* Khung hiển thị Coverflow */}
        <ImperialReveal direction="up" delay={0.12} scale={0.96} className="relative mx-auto mt-8 flex max-w-md items-center justify-center">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#E5CFA3]/40 bg-[#07111F] shadow-2xl">
            <AnimatePresence mode="wait">
              <m.img
                key={activeIndex}
                src={galleryPhotos[activeIndex]?.url}
                alt={galleryPhotos[activeIndex]?.alt || `Ảnh kỷ niệm ${activeIndex + 1}`}
                className="h-full w-full cursor-pointer object-cover"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.45 }}
                onClick={() => setLightboxIndex(activeIndex)}
              />
            </AnimatePresence>

            {/* Nút lùi ảnh */}
            <button
              onClick={handlePrev}
              aria-label="Ảnh trước"
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full border border-[#E5CFA3]/50 bg-[#0B192C]/80 p-2 text-[#F4E8CE] backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Nút tiến ảnh */}
            <button
              onClick={handleNext}
              aria-label="Ảnh sau"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full border border-[#E5CFA3]/50 bg-[#0B192C]/80 p-2 text-[#F4E8CE] backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Chỉ số ảnh hiện tại */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-[#E5CFA3]/30 bg-[#0B192C]/85 px-3 py-1 text-[11px] font-medium tracking-widest text-[#E5CFA3] backdrop-blur-sm">
              {activeIndex + 1} / {galleryPhotos.length}
            </div>
          </div>
        </ImperialReveal>

        {/* Chấm tròn định vị ảnh */}
        <div className="mt-4 flex justify-center gap-1.5">
          {galleryPhotos.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Chuyển đến ảnh ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex
                  ? "w-6 bg-[#E5CFA3]"
                  : "w-1.5 bg-[#E5CFA3]/30 hover:bg-[#E5CFA3]/60",
              )}
            />
          ))}
        </div>
      </div>

      {/* Lightbox Modal phóng to ảnh */}
      {lightboxIndex !== null && (
        <TemplateLightboxModal
          photos={galleryPhotos}
          activeIndex={lightboxIndex}
          onChangeIndex={(idx) => setLightboxIndex(idx)}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}

/* ============================================================
   THẺ CÀO ÁNH TRĂNG HÉ LỘ NGÀY CƯỚI (STANDARD FEATURE)
   - Canvas DPR cao sắc nét phủ lớp nhũ bạc-vàng lưu ly
   - Cào đạt >= 42% tự động tan lớp phủ & vang chuông reveal
   ============================================================ */
function MoonlightScratchCard({
  dateStr,
  lunarDateStr,
}: {
  dateStr: string;
  lunarDateStr?: string | null;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const scratchingRef = React.useRef(false);
  const lastSoundRef = React.useRef(0);
  const [revealed, setRevealed] = React.useState(false);

  const parts = React.useMemo(() => formatWeddingDateParts(dateStr), [dateStr]);
  const cleanLunar = React.useMemo(
    () => (lunarDateStr ? formatLunarDateClean(lunarDateStr) : null),
    [lunarDateStr],
  );

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;

    const width = 320;
    const height = 132;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Nền nhũ bạch kim & lam lưu ly
    const grad = ctx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "#153252");
    grad.addColorStop(0.5, "#1F4B66");
    grad.addColorStop(1, "#0D2038");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Dải ánh kim chéo
    const foil = ctx.createLinearGradient(0, 0, width, 0);
    foil.addColorStop(0, "rgba(229, 207, 163, 0.08)");
    foil.addColorStop(0.45, "rgba(244, 232, 206, 0.34)");
    foil.addColorStop(0.55, "rgba(229, 207, 163, 0.42)");
    foil.addColorStop(1, "rgba(229, 207, 163, 0.08)");
    ctx.fillStyle = foil;
    ctx.fillRect(0, 0, width, height);

    // Viền đôi chỉ vàng
    ctx.strokeStyle = "rgba(229, 207, 163, 0.65)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(7, 7, width - 14, height - 14);

    // Chữ hướng dẫn cào
    ctx.fillStyle = "#F4E8CE";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 11px sans-serif";
    ctx.fillText("CHẠM & CÀO LỚP NHŨ BẠC", width / 2, height / 2 - 11);
    ctx.fillStyle = "rgba(229, 207, 163, 0.85)";
    ctx.font = "400 10px sans-serif";
    ctx.fillText("để hé lộ Ngày Lành Hạc Vũ", width / 2, height / 2 + 12);

    ctx.restore();
  }, [revealed]);

  const revealWithSound = React.useCallback(() => {
    setRevealed((prev) => {
      if (!prev) {
        playInteractionFoley("scratch-reveal", 0.42);
      }
      return true;
    });
  }, []);

  const scratchAt = (clientX: number, clientY: number) => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const radius = 20 * (canvas.width / 320);

    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const now = performance.now();
    if (now - lastSoundRef.current > 65) {
      lastSoundRef.current = now;
      playInteractionFoley("scratch-tick", 0.24);
    }
  };

  const checkScratchedPercent = () => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0;
    let sampled = 0;
    const step = 32;
    for (let i = 3; i < pixels.length; i += step) {
      sampled += 1;
      if (pixels[i] < 128) cleared += 1;
    }
    if (sampled > 0 && cleared / sampled >= 0.42) {
      revealWithSound();
    }
  };

  return (
    <div className="mx-auto mt-7 max-w-sm">
      <div className="relative overflow-hidden rounded-2xl border border-[#E5CFA3]/80 bg-gradient-to-br from-[#0B192C] via-[#11253E] to-[#07111F] p-5 text-[#F4E8CE] shadow-lg">
        <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#E5CFA3]/30" />

        {/* Nội dung Ngày Lành bên dưới lớp nhũ */}
        <div className="relative z-0 flex min-h-[92px] flex-col items-center justify-center text-center">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.22em] uppercase text-[#E5CFA3]">
            <Sparkles className="h-3 w-3" />
            <span>Ngày Chung Đôi Viên Mãn</span>
            <Sparkles className="h-3 w-3" />
          </div>
          <p
            className="mt-1.5 text-2xl font-bold tracking-wide text-[#F4E8CE]"
            style={{ fontFamily: TITLE_FONT }}
          >
            {parts.weekday ? `${parts.weekday}, ` : ""}
            {parts.day}.{parts.month}.{parts.year}
          </p>
          {cleanLunar && (
            <p className="mt-1 text-xs italic text-[#E5CFA3]/85">
              (Tức ngày {cleanLunar})
            </p>
          )}
        </div>

        {/* Lớp nhũ bạc cào tương tác */}
        <AnimatePresence>
          {!revealed && (
            <m.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.45, ease: IMPERIAL_EASE }}
              className="absolute inset-0 z-10"
            >
              <canvas
                ref={canvasRef}
                onPointerDown={(e) => {
                  scratchingRef.current = true;
                  e.currentTarget.setPointerCapture(e.pointerId);
                  scratchAt(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                  if (!scratchingRef.current) return;
                  scratchAt(e.clientX, e.clientY);
                }}
                onPointerUp={() => {
                  scratchingRef.current = false;
                  checkScratchedPercent();
                }}
                onPointerCancel={() => {
                  scratchingRef.current = false;
                }}
                className="h-full w-full cursor-crosshair touch-none"
              />
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {!revealed && (
        <button
          type="button"
          onClick={revealWithSound}
          className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-[#E5CFA3]/75 bg-[#0B192C] px-3.5 py-1 text-[11px] font-medium text-[#F4E8CE] shadow-sm transition-transform hover:scale-105 active:scale-95"
          style={{ fontFamily: BODY_FONT }}
        >
          <Sparkles className="h-3 w-3 text-[#E5CFA3]" />
          <span>Chạm mở nhanh</span>
        </button>
      )}
    </div>
  );
}

/* ============================================================
   SECTION 5: LỊCH NGÀY VUI & ĐẾM NGƯỢC (VỊ TRÍ NGÀY CƯỚI #2 - CALENDAR & COUNTDOWN)
   - Lưới lịch tháng cử hành hôn lễ
   - Điểm nhấn trăng tròn / trái tim Lam Lưu Ly #0B192C với nhịp đập êm ái
   - Bộ đếm ngược thời gian chính xác tới giờ cưới
   ============================================================ */
function CalendarCountdownSection({ data }: { data: TemplateData }) {
  const reduce = useReducedMotion();
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const targetDateStr = targetEvent?.startsAt || data.date || "2027-03-20T10:00:00+07:00";
  const targetDate = React.useMemo(() => new Date(targetDateStr), [targetDateStr]);

  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Tạo lưới lịch tháng
  const { month, year, eventDays, calendarDays } = React.useMemo(() => {
    const valid = !isNaN(targetDate.getTime());
    const mNum = valid ? targetDate.getMonth() + 1 : 3;
    const yNum = valid ? targetDate.getFullYear() : 2027;

    const daysSet = new Set<number>();
    visibleEvents.forEach((evt) => {
      if (evt.startsAt) {
        const d = new Date(evt.startsAt);
        if (d.getFullYear() === yNum && d.getMonth() + 1 === mNum) {
          daysSet.add(d.getDate());
        }
      }
    });
    if (daysSet.size === 0 && valid) {
      daysSet.add(targetDate.getDate());
    }

    const firstDayOfWeek = new Date(yNum, mNum - 1, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(yNum, mNum, 0).getDate();

    const days: (number | null)[] = [];
    // Thứ Hai là cột đầu tiên (chuyển đổi từ CN=0 sang T2=0)
    const offset = (firstDayOfWeek + 6) % 7;
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return {
      month: mNum,
      year: yNum,
      eventDays: daysSet,
      calendarDays: days,
    };
  }, [targetDate, visibleEvents]);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <ImperialReveal direction="up">
          <h2
            className="text-xl font-bold tracking-widest uppercase text-[#0E2238] sm:text-2xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            Ngày Chung Đôi
          </h2>
        </ImperialReveal>

        {/* Thẻ cào ánh trăng Standard hé lộ ngày lành */}
        <ImperialReveal direction="up" delay={0.06}>
          <MoonlightScratchCard
            dateStr={targetDateStr}
            lunarDateStr={targetEvent?.lunarDate}
          />
        </ImperialReveal>

        {/* Khung Lịch Tháng */}
        <ImperialReveal direction="up" delay={0.1}>
          <div className="relative mx-auto mt-8 max-w-sm rounded-2xl border border-[#E5CFA3]/70 bg-[#FFFFFF] p-6 shadow-lg">
            <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#E5CFA3]/30" />

            <p
              className="text-sm font-bold tracking-widest uppercase text-[#1B4D5C]"
              style={{ fontFamily: TITLE_FONT }}
            >
              Tháng {month} · {year}
            </p>

            {/* Các thứ trong tuần */}
            <div className="mt-4 grid grid-cols-7 gap-1 text-[11px] font-semibold text-[#5A6D82]">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span className="text-[#1B4D5C]">CN</span>
            </div>

            {/* Ô các ngày trong tháng */}
            <div className="mt-2 grid grid-cols-7 gap-1 text-xs">
              {calendarDays.map((d, idx) => {
                if (d === null) {
                  return <div key={`empty-${idx}`} className="h-8 w-8" />;
                }

                const isWeddingDay = eventDays.has(d);

                return (
                  <div
                    key={`day-${d}`}
                    className="flex h-8 w-8 items-center justify-center mx-auto"
                  >
                    {isWeddingDay ? (
                      <m.div
                        className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#0B192C] font-bold text-[#F4E8CE] shadow-md"
                        animate={
                          reduce
                            ? {}
                            : {
                              scale: [1, 1.1, 1],
                            }
                        }
                        transition={{
                          duration: 2.4,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <span>{d}</span>
                        <Heart className="absolute -top-1 -right-1 h-3 w-3 fill-[#E5CFA3] text-[#E5CFA3]" />
                      </m.div>
                    ) : (
                      <span className="text-[#334457]">{d}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ImperialReveal>

        {/* 4 Khối Đếm Ngược Thời Gian */}
        <ImperialReveal direction="up" delay={0.14} className="mx-auto mt-8 grid max-w-sm grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Ngày", val: timeLeft.days },
            { label: "Giờ", val: timeLeft.hours },
            { label: "Phút", val: timeLeft.minutes },
            { label: "Giây", val: timeLeft.seconds },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center rounded-xl border border-[#E5CFA3]/60 bg-[#FFFFFF] py-3 shadow-md"
            >
              <span
                className="text-xl font-bold text-[#0E2238] sm:text-2xl"
                style={{ fontFamily: TITLE_FONT }}
              >
                {String(item.val).padStart(2, "0")}
              </span>
              <span
                className="mt-0.5 text-[10px] font-medium tracking-wider uppercase text-[#5A6D82]"
                style={{ fontFamily: BODY_FONT }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </ImperialReveal>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 6: LỊCH TRÌNH TIỆC CƯỚI & TRANG PHỤC (TIMELINE & DRESS CODE)
   - Trục thời gian đứng thanh lịch với họa tiết trăng khuyết & hình thoi
   - Dress code sang trọng: Lam Lưu Ly #0B192C, Vàng bạch kim #E5CFA3, Trắng ngà #F8F6F0
   ============================================================ */
function TimelineSection({ data }: { data: TemplateData }) {
  const timeline = getTimeline(data);
  const dressColors = getDressColors(data);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <ImperialReveal direction="up">
          <h2
            className="text-xl font-bold tracking-widest uppercase text-[#0E2238] sm:text-2xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            Lịch Trình Hôn Lễ
          </h2>
        </ImperialReveal>

        {/* Danh sách mốc sự kiện */}
        <div className="relative mx-auto mt-10 max-w-md">
          {/* Đường trục thời gian dọc màu vàng bạch kim */}
          <div className="absolute top-4 bottom-4 left-[31px] w-px bg-gradient-to-b from-[#E5CFA3] via-[#1B4D5C]/40 to-[#E5CFA3]" />

          <div className="space-y-6">
            {timeline.map((item, idx) => (
              <ImperialReveal
                key={idx}
                direction="left"
                delay={idx * 0.08}
                className="relative flex items-center gap-4 text-left"
              >
                {/* Điểm mốc hình thoi / ngọc bích */}
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#E5CFA3]/70 bg-[#FFFFFF] shadow-sm">
                  <div className="text-center">
                    <span
                      className="text-xs font-bold text-[#1B4D5C]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {item.time}
                    </span>
                  </div>
                </div>

                {/* Nội dung hoạt động */}
                <div className="flex-1 rounded-2xl border border-[#E5CFA3]/40 bg-[#FFFFFF] p-3.5 shadow-sm">
                  <p
                    className="text-xs font-medium text-[#334457] sm:text-sm"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {item.label}
                  </p>
                </div>
              </ImperialReveal>
            ))}
          </div>
        </div>

        {/* Khu vực Dress Code */}
        <ImperialReveal direction="up" delay={0.12} className="mx-auto mt-14 max-w-sm rounded-2xl border border-[#E5CFA3]/60 bg-[#FFFFFF] p-6 shadow-md">
          <p
            className="text-xs font-semibold tracking-widest uppercase text-[#1B4D5C]"
            style={{ fontFamily: BODY_FONT }}
          >
            Trang Phục Gợi Ý
          </p>

          <div className="mt-5 flex items-center justify-center gap-4 sm:gap-6">
            {dressColors.map((color, idx) => (
              <ImperialReveal key={idx} direction="up" delay={0.08 + idx * 0.08} scale={0.85} blur={false}>
                <div
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-[#E5CFA3] shadow-md transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                  title={color}
                  aria-label={`Màu trang phục ${idx + 1}`}
                />
              </ImperialReveal>
            ))}
          </div>
        </ImperialReveal>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION STORY: THƯỚC PHIM KỶ NIỆM 35MM LƯU LY (STANDARD)
   ============================================================ */
function StoryFilmSection({ data }: { data: TemplateData }) {
  const storyItems = React.useMemo(() => getDefaultStory(data), [data]);
  const galleryFallback = data.photos?.gallery?.length
    ? data.photos.gallery.map((photo) => photo.url)
    : ["/photos/1.webp", "/photos/2.webp", "/photos/3.webp"];

  if (storyItems.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-[#0B192C] px-4 py-16 text-[#F4E8CE] md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: "url('/templates/hac-vu-luu-ly/background-mobile.webp')" }}
      />
      <MoonlitDust count={10} />

      <div className="relative z-10 mx-auto max-w-2xl">
        <ImperialReveal direction="up" className="text-center">
          <div className="mb-3 flex justify-center">
            <img
              loading="lazy"
              decoding="async"
              src="/templates/hac-vu-luu-ly/divider-feather.webp"
              alt=""
              className="h-auto w-32 object-contain opacity-85"
              aria-hidden="true"
            />
          </div>

          <h2
            className="text-xl font-bold tracking-widest uppercase text-[#F4E8CE] sm:text-2xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            Chuyện Chúng Mình
          </h2>
        </ImperialReveal>

        <div className="mt-10 space-y-10">
          {storyItems.map((milestone, idx) => {
            const frameImage =
              milestone.imageUrl?.trim() ||
              galleryFallback[idx % galleryFallback.length] ||
              "/photos/1.webp";

            return (
              <ImperialReveal
                key={milestone.id || idx}
                direction={idx % 2 === 0 ? "left" : "right"}
                delay={idx * 0.1}
              >
                <div className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-[#E5CFA3]/30 bg-[#11253E]/85 p-5 shadow-xl sm:grid-cols-12 sm:p-6">
                  <div className={cn("sm:col-span-6", idx % 2 === 1 && "sm:order-2")}>
                    <FilmFrame35mm
                      src={frameImage}
                      alt={milestone.title}
                      aspectRatio="16/10"
                      frameCode={`CHƯƠNG ${String(idx + 1).padStart(2, "0")}`}
                      borderColor="border-[#E5CFA3]/35"
                      accentColor="text-[#E5CFA3]"
                    />
                  </div>

                  <div
                    className={cn(
                      "text-left sm:col-span-6",
                      idx % 2 === 1 && "sm:order-1",
                    )}
                  >
                    <span className="inline-block rounded-full border border-[#E5CFA3]/55 bg-[#07111F] px-3 py-0.5 text-[10px] font-semibold tracking-widest uppercase text-[#E5CFA3]">
                      {milestone.year || `Mốc ${idx + 1}`}
                    </span>
                    <h3
                      className="mt-3 text-lg font-bold text-[#F4E8CE] sm:text-xl"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {milestone.title}
                    </h3>
                    {milestone.content && (
                      <p
                        className="mt-2 text-xs leading-relaxed text-[#F4E8CE]/80 sm:text-sm"
                        style={{ fontFamily: BODY_FONT }}
                      >
                        {milestone.content}
                      </p>
                    )}
                  </div>
                </div>
              </ImperialReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 7: HỘP MỪNG CƯỚI (GIFT / LI XI)
   - Nền Lam Lưu Ly Đêm #0B192C
   - Tráp trang sức pháp lam 3 trạng thái:
     normal -> hover -> active (700ms rương bật mở + enamel-crane-casket SFX)
   ============================================================ */
function GiftSection({
  data,
  plan,
  guestName,
}: {
  data: TemplateData;
  plan?: WeddingPlan;
  guestName: string | null;
}) {
  const {
    stage,
    isOpening,
    isModalOpen,
    setStage,
    handleGiftClick,
    handleCloseModal,
  } = useGiftBoxInteraction({ sfxType: "enamel-crane-casket" });

  const coupleDisplayName = `${data.couple?.groomName ?? "Chú Rể"} & ${data.couple?.brideName ?? "Cô Dâu"}`;

  const getGiftBoxImg = () => {
    switch (stage) {
      case "hover":
        return "/templates/hac-vu-luu-ly/gift-hover.webp";
      case "open":
        return "/templates/hac-vu-luu-ly/gift-active.webp";
      default:
        return "/templates/hac-vu-luu-ly/gift-normal.webp";
    }
  };

  return (
    <section className="relative overflow-hidden bg-[#0B192C] px-4 py-16 text-[#F4E8CE] md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url('/templates/hac-vu-luu-ly/background-mobile.webp')" }}
      />
      <MoonlitDust count={12} />

      <div className="relative z-10 mx-auto max-w-xl text-center">
        <ImperialReveal direction="up">
          <div className="mb-3 flex justify-center">
            <img loading="lazy" decoding="async"
              src="/templates/hac-vu-luu-ly/divider-feather.webp"
              alt=""
              className="h-auto w-32 object-contain opacity-85"
              aria-hidden="true"
            />
          </div>

          <h2
            className="text-xl font-bold tracking-widest uppercase text-[#F4E8CE] sm:text-2xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            Hộp Mừng Cưới
          </h2>
        </ImperialReveal>

        {/* Tráp trang sức pháp lam 3 trạng thái */}
        <ImperialReveal direction="up" delay={0.12} scale={0.95} className="mt-8 flex flex-col items-center">
          <m.div
            className="group relative cursor-pointer"
            onClick={handleGiftClick}
            onMouseEnter={() => {
              if (!isOpening && !isModalOpen) setStage("hover");
            }}
            onMouseLeave={() => {
              if (!isOpening && !isModalOpen) setStage("normal");
            }}
            animate={
              isOpening
                ? { scale: 1.07, y: -8 }
                : { scale: 1, y: 0 }
            }
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.35, ease: IMPERIAL_EASE }}
          >
            {/* Quầng hào quang vàng kim dưới tráp */}
            <m.div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(229,207,163,0.42) 0%, rgba(27,77,92,0.18) 55%, transparent 75%)",
                filter: "blur(18px)",
              }}
              animate={
                isOpening
                  ? { scale: [1, 1.55], opacity: [0.65, 1] }
                  : { scale: 1, opacity: 0.7 }
              }
              transition={{ duration: 0.55, ease: IMPERIAL_EASE }}
            />
            <img loading="lazy" decoding="async"
              src={getGiftBoxImg()}
              alt="Tráp Trang Sức Pháp Lam"
              className="relative z-10 h-auto w-40 object-contain drop-shadow-2xl sm:w-48"
            />
          </m.div>

          <button
            type="button"
            onClick={handleGiftClick}
            className="mt-5 rounded-full border border-[#E5CFA3] bg-gradient-to-r from-[#1B4D5C] via-[#0B192C] to-[#1B4D5C] px-6 py-2.5 text-xs font-semibold tracking-widest uppercase text-[#F4E8CE] shadow-lg transition-all hover:border-[#F4E8CE] hover:shadow-[0_0_15px_rgba(229,207,163,0.3)] active:scale-95"
            style={{ fontFamily: BODY_FONT }}
          >
            {isOpening ? "Đang Mở Rương Lưu Ly..." : "Gửi Quà Mừng Cưới"}
          </button>
        </ImperialReveal>
      </div>

      {/* Modal Mừng Cưới qua cổng GiftModal */}
      {isModalOpen && (
        <GiftModal
          open={isModalOpen}
          onClose={handleCloseModal}
          gift={data.gift}
          plan={plan ?? "free"}
          coupleName={coupleDisplayName}
          guestName={guestName}
          tone="obsidian"
        />
      )}
    </section>
  );
}

/* ============================================================
   MAIN TEMPLATE: HẠC VŨ LƯU LY
   - Điều khiển mở thiệp 2 chiều (isOpened <-> parentOpenedRef)
   - Khóa cuộn container khi !coverGone
   - Section order & hidden sections tuân thủ cấu hình
   - Footer tách rời ngoài container order
   ============================================================ */
export function HacVuLuuLyTemplate({
  data,
  isOpened = false,
  onOpenedChange,
  guestName,
  contained = false,
  mode,
  inviteSlug,
  weddingSlug,
  invitationMode,
}: WeddingTemplateProps) {
  const reduce = useReducedMotion();
  const [openState, setOpenState] = React.useState(isOpened);
  const [coverGone, setCoverGone] = React.useState(isOpened);
  const [coverPhase, setCoverPhase] = React.useState<CoverPhase>("idle");
  const [prevIsOpened, setPrevIsOpened] = React.useState(isOpened);
  const timeoutsRef = React.useRef<Array<ReturnType<typeof setTimeout>>>([]);

  if (isOpened !== prevIsOpened) {
    setPrevIsOpened(isOpened);
    if (isOpened) {
      setOpenState(true);
      setCoverGone(true);
      setCoverPhase("idle");
    } else {
      setOpenState(false);
      setCoverGone(false);
      setCoverPhase("idle");
    }
  }

  React.useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((id) => clearTimeout(id));
      timeoutsRef.current = [];
    };
  }, []);

  const showBody = coverGone || coverPhase === "scroll";

  const handleOpenStart = () => {
    if (coverPhase !== "idle" || openState) return;
    playStandardCoverFoley("crane-fan-harp", 0.52);

    if (reduce) {
      setOpenState(true);
      setCoverGone(true);
      onOpenedChange?.(true);
      try {
        window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
      } catch { }
      return;
    }

    // 0 -> 1820ms: Canvas 60fps diễn trọn vẹn gấp nan -> xoay vòng -> bung xòe theo Đàn Hạc (1 mạch không ngắt pha)
    setCoverPhase("animating");

    // 1820ms -> 2780ms: Cuốn tranh thủy mặc lên trên & hợp âm ngân lộ Hero
    const t1 = setTimeout(() => {
      setCoverPhase("scroll");
    }, 1820);

    // Hoàn tất (~2780ms): Tháo bìa, báo parent & kích hoạt Auto-Scroll 200px/s
    const t2 = setTimeout(() => {
      setOpenState(true);
      setCoverGone(true);
      setCoverPhase("idle");
      onOpenedChange?.(true);
      try {
        window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
      } catch { }
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 2780);

    timeoutsRef.current.push(t1, t2);
  };

  const safeGuestName = guestName || null;
  const resolvedWeddingSlug = weddingSlug || data.weddingSlug;

  const hidden = new Set(data.hiddenSections ?? []);
  const order = data.sectionOrder?.length
    ? data.sectionOrder
    : CANONICAL_SECTION_ORDER;
  const orderOf = (key: string) => {
    const index = order.indexOf(key);
    return index < 0 ? 99 : index;
  };

  return (
    <div
      className={cn(
        "relative w-full bg-[#07111F] text-[#0E2238] selection:bg-[#E5CFA3]/25",
        !coverGone && (contained ? "h-full overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden"),
      )}
    >
      {/* --------------------------------------------------------
          LỚP 1: MÀN HÌNH BÌA PHONG BÌ MỞ THIỆP
          -------------------------------------------------------- */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            className="absolute inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
          >
            <EnvelopeCover
              data={data}
              guestName={safeGuestName}
              contained={contained}
              coverPhase={coverPhase}
              onOpenStart={handleOpenStart}
            />
          </m.div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------
          LỚP 2: NÚT NHẠC NỀN NỔI
          -------------------------------------------------------- */}
      {!data.hiddenSections?.includes("music") && (
        <LiveMusicFloatingButton
          src={data.music?.src}
          title={data.music?.title || "Khúc Vũ Lưu Ly"}
          visible={openState}
          tone="obsidian"
        />
      )}

      {/* --------------------------------------------------------
          LỚP 3: RUỘT THIỆP CƯỚI CHÍNH (Hiện mượt khi Pha 2 scroll)
          - Cột thẻ Lụa Trăng Ngà max-w-[840px]
          -------------------------------------------------------- */}
      <main
        className={cn(
          "relative z-10 transition-opacity duration-700",
          !showBody ? "hidden opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {/* Nền cố định phía sau ruột thiệp */}
        <div
          className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/templates/hac-vu-luu-ly/background.webp')" }}
        />

        {/* Khung nội dung trung tâm: Cột thẻ Lụa Trăng Ngà max-w-[840px] */}
        <div className="relative mx-auto my-6 w-full max-w-[840px] rounded-3xl border border-[#E5CFA3]/50 bg-[#F8F6F0] shadow-2xl">
          {/* Section 1: Hero — Cổng Nguyệt Môn (luôn ở đầu thẻ) */}
          <div className="rounded-t-3xl bg-[#0B192C]">
            <HeroSection data={data} showBody={showBody} />
          </div>

          {/* Container các section động theo orderOf và hiddenSections */}
          <div className="flex flex-col overflow-hidden rounded-b-3xl bg-[#F8F6F0]">
            {/* Section 2: Thông tin gia đình & Thẻ lật 3D chân dung */}
            {!hidden.has("family") && (
              <div style={{ order: orderOf("family") }}>
                <FamilySection data={data} />
              </div>
            )}

            {/* Section Story (Standard): Thước phim 35mm Chuyện Chúng Mình */}
            {!hidden.has("story") && (
              <div style={{ order: orderOf("story") }}>
                <StoryFilmSection data={data} />
              </div>
            )}

            {/* Section 3: Sự kiện cưới & bản đồ chỉ đường (Vị trí ngày cưới #1) */}
            {!hidden.has("map") && (
              <div style={{ order: orderOf("map") }}>
                <EventsSection data={data} />
              </div>
            )}

            {/* Section 4: Album ảnh cưới coverflow */}
            {!hidden.has("album") && (
              <div style={{ order: orderOf("album") }}>
                <GallerySection data={data} />
              </div>
            )}

            {/* Section 5: Lịch ngày vui & đếm ngược (Vị trí ngày cưới #2) */}
            {!hidden.has("calendar") && (
              <div style={{ order: orderOf("calendar") }}>
                <CalendarCountdownSection data={data} />
              </div>
            )}

            {/* Section 6: Lịch trình & Dress code */}
            {!hidden.has("dresscode") && (
              <div style={{ order: orderOf("dresscode") }}>
                <TimelineSection data={data} />
              </div>
            )}

            {/* Section 7: Hộp mừng cưới 3 trạng thái & VietQR */}
            {!hidden.has("gift") && (
              <div style={{ order: orderOf("gift") }}>
                <GiftSection data={data} plan={data.plan} guestName={safeGuestName} />
              </div>
            )}

            {/* Section 8: Form xác nhận tham dự RSVP & Sổ lưu bút */}
            {!hidden.has("rsvp") && (
              <div style={{ order: orderOf("rsvp") }}>
                <section className="relative overflow-hidden bg-[#07111F] px-4 py-16 text-[#F4E8CE] md:py-24">
                  <div
                    className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
                    style={{ backgroundImage: "url('/templates/hac-vu-luu-ly/background-mobile.webp')" }}
                  />
                  <MoonlitDust count={16} />

                  <ImperialReveal direction="up" className="relative z-10 mx-auto max-w-xl">
                    <TemplateRsvpSection
                      data={data}
                      mode={mode}
                      tone="sapphire"
                      contained={contained}
                      inviteSlug={inviteSlug}
                      weddingSlug={weddingSlug}
                      invitationMode={invitationMode}
                      guestName={guestName}
                    />
                  </ImperialReveal>
                </section>
              </div>
            )}

            {/* QR Album chia sẻ ảnh tiệc cưới cho gói trả phí */}
            {data.plan !== "free" && !hidden.has("albumQr") && resolvedWeddingSlug && (
              <div style={{ order: orderOf("albumQr") }}>
                <section className="relative overflow-hidden border-t border-[#E5CFA3]/20 bg-[#07111F] px-4 py-12 text-[#F4E8CE]">
                  <ImperialReveal direction="up" delay={0.08} className="relative z-10 mx-auto flex max-w-xl justify-center">
                    <GuestAlbumQr
                      slug={resolvedWeddingSlug}
                      accentColor="#1B4D5C"
                      textColor="#F4E8CE"
                      mutedColor="#E5CFA3"
                    />
                  </ImperialReveal>
                </section>
              </div>
            )}
          </div>
        </div>

        {/* Footer chúc phúc chân trang (Đặt ngoài flex container có order) */}
        <footer className="border-t border-[#E5CFA3]/25 bg-[#07111F] px-4 py-12 text-center text-xs text-[#F4E8CE]/70">
          <ImperialReveal direction="up" className="mx-auto flex max-w-sm flex-col items-center gap-2">
            <img loading="lazy" decoding="async"
              src="/templates/hac-vu-luu-ly/divider-feather.webp"
              alt=""
              className="h-auto w-24 object-contain opacity-65"
              aria-hidden="true"
            />
            <p className="tracking-widest uppercase text-[#E5CFA3]">
              {data.couple?.groomName ?? "Chú Rể"} &amp; {data.couple?.brideName ?? "Cô Dâu"}
            </p>
            <p className="text-[11px] text-[#F4E8CE]/60">
              Cảm ơn quý khách đã gửi trọn yêu thương và chung vui cùng chúng tôi
            </p>
          </ImperialReveal>
        </footer>
      </main>
    </div>
  );
}

export default HacVuLuuLyTemplate;
