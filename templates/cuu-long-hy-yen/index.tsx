"use client";

import * as React from "react";
import {
  MapPin,
  Clock,
  ExternalLink,
  ChevronRight,
  RotateCw,
} from "lucide-react";
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playCoverSfx, playInteractionSfx } from "@/lib/sfx";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import {
  getVisibleEvents,
  getNearestUpcomingEvent,
  getEventDirectionsUrl,
} from "@/lib/events";
import type {
  TemplateData,
  WeddingStoryMilestone,
  WeddingTimelineItem,
} from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import {
  HkGoldenSparks,
  HkKowloonVipDoorsOverlay,
  type HkRevealPhase,
} from "../shared/HongKongStandardCovers";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: CỬU LONG HỶ YẾN (cuu-long-hy-yen)
   - Nền chủ đạo: Obsidian & Casino Emerald-Black (#0B0D0E → #0D1F19)
   - Bề mặt thẻ VIP: rgba(17, 21, 20, 0.92) viền vàng 24K rgba(216, 174, 86, 0.38)
   - Vàng 24K ánh kim (tiêu đề, số lớn, nút CTA): #D8AE56 (sáng #F2D488)
   - Đỏ son Hồng Kông (Song Hỷ, chi tiết bài tây, ngày cưới): #C81E2B
   - Xanh lục bảo sòng bài (accent bàn mạt chược): #14533C
   - Chữ chính trên nền tối: #F5EFE4 (WCAG AA)
   - Chữ phụ: #BFB6A4
   ============================================================ */

const KOWLOON_OBSIDIAN = "#0B0D0E";
const KOWLOON_CARD_BG = "rgba(17, 21, 20, 0.92)";

const GOLD_24K = "#D8AE56";
const GOLD_LIGHT = "#F2D488";
const GOLD_BORDER = "rgba(216, 174, 86, 0.38)";

const JADE_GREEN = "#14533C";
const CRIMSON_RED = "#C81E2B";

const TEXT_IVORY = "#F5EFE4";
const TEXT_MUTED = "#BFB6A4";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const MONO_FONT = "ui-monospace, SFMono-Regular, \"Space Mono\", Menlo, monospace";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const DEFAULT_DRESS = ["#0B0D0E", "#C81E2B", "#D8AE56"];

const DEFAULT_TIMELINE: WeddingTimelineItem[] = [
  { time: "17:30", label: "Đón khách & Chụp ảnh thảm đỏ" },
  { time: "18:30", label: "Khai màn Lễ Thành Hôn" },
  { time: "19:00", label: "Nâng ly khai tiệc Cửu Long" },
  { time: "20:00", label: "Âm nhạc & Giao lưu khách quý" },
  { time: "21:30", label: "Tiễn khách & Lưu giữ kỷ niệm" },
];

const DEFAULT_STORY: WeddingStoryMilestone[] = [
  {
    year: "2022",
    title: "Cảnh I · Lần Đầu Chạm Mặt",
    content:
      "Một buổi tối cuối tuần dưới ánh đèn phố cũ — cuộc trò chuyện tưởng chừng ngắn ngủi lại mở ra chương đẹp nhất của cả hai.",
  },
  {
    year: "2024",
    title: "Cảnh II · Đồng Hành Qua Bốn Mùa",
    content:
      "Cùng nhau đi qua những ngày nắng đẹp lẫn cơn mưa bất chợt, nhận ra bình yên lớn nhất chính là người ngồi bên cạnh.",
  },
  {
    year: "2026",
    title: "Cảnh III · Lời Hẹn Ước Trăm Năm",
    content:
      "Từ hai mảnh ghép riêng biệt nay chính thức về chung một nhà, mời những người thương yêu nhất đến chứng kiến đêm hỷ yến.",
  },
];

const ROMAN_ACTS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimelineItems(data: TemplateData): WeddingTimelineItem[] {
  const items = data.timeline?.filter((item) => item.time.trim() || item.label.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

function getStoryItems(data: TemplateData): WeddingStoryMilestone[] {
  const items = data.story?.filter(
    (item) => (item.year?.trim() ?? "") || item.title.trim() || item.content.trim(),
  );
  return items && items.length > 0 ? items : DEFAULT_STORY;
}

/* ------------------------------------------------------------
   TƯƠNG TÁC ĐỘC BẢN STANDARD #1: THẺ CÀO NHŨ VÀNG 24K TIẾT LỘ NGÀY CƯỚI
   - Canvas nhẹ hỗ trợ touch Mobile + mouse Desktop
   - Nút "Mở nhanh" cho người lớn tuổi hoặc reduced-motion
   ------------------------------------------------------------ */
function GoldenScratchCard({
  weekday,
  time,
  day,
  month,
  year,
  lunarStr,
  venueName,
}: {
  weekday: string;
  time: string;
  day: string;
  month: string;
  year: string;
  lunarStr: string;
  venueName?: string | null;
}) {
  const reduce = useReducedMotion();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const drawingRef = React.useRef(false);
  const gridRef = React.useRef<Uint8Array>(new Uint8Array(12 * 6));
  const [revealed, setRevealed] = React.useState(Boolean(reduce));
  const [resetTick, setResetTick] = React.useState(0);

  // Vẽ lớp nhũ vàng 24K lên canvas
  React.useEffect(() => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 340;
    const h = 156;
    canvas.width = w;
    canvas.height = h;
    gridRef.current = new Uint8Array(12 * 6);

    ctx.globalCompositeOperation = "source-over";
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#9E7428");
    grad.addColorStop(0.28, "#E5C16C");
    grad.addColorStop(0.52, "#F6DF9A");
    grad.addColorStop(0.75, "#C7973E");
    grad.addColorStop(1, "#8C6320");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Đường vân sọc ánh kim nhẹ
    ctx.strokeStyle = "rgba(255, 250, 224, 0.22)";
    ctx.lineWidth = 1;
    for (let x = -h; x < w + h; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h, h);
      ctx.stroke();
    }

    // Viền trong khung thẻ cào
    ctx.strokeStyle = "rgba(11, 13, 14, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    // Dòng chữ dập nổi mời cào
    ctx.fillStyle = "#1A1205";
    ctx.font = "700 11px ui-monospace, SFMono-Regular, monospace";
    ctx.textAlign = "center";
    ctx.fillText("★  VIP GOLDEN PASS · STANDARD  ★", w / 2, h / 2 - 14);
    ctx.font = "800 14px Georgia, serif";
    ctx.fillText("CÀO NHŨ VÀNG MỞ GIỜ HOÀNG ĐẠO", w / 2, h / 2 + 12);
    ctx.font = "600 10px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = "rgba(26, 18, 5, 0.72)";
    ctx.fillText("Chạm & kéo ngón tay lên lớp nhũ vàng", w / 2, h / 2 + 34);
  }, [revealed, resetTick]);

  const lastScratchSfxRef = React.useRef(0);

  const scratchAt = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || revealed) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nowMs = Date.now();
    if (nowMs - lastScratchSfxRef.current >= 95) {
      lastScratchSfxRef.current = nowMs;
      playInteractionSfx("scratch-tick");
    }

    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Đánh dấu ô lưới đã cào để tính % mở không tốn CPU
    const col = Math.min(11, Math.max(0, Math.floor((x / canvas.width) * 12)));
    const row = Math.min(5, Math.max(0, Math.floor((y / canvas.height) * 6)));
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const nc = col + dc;
        const nr = row + dr;
        if (nc >= 0 && nc < 12 && nr >= 0 && nr < 6) {
          gridRef.current[nr * 12 + nc] = 1;
        }
      }
    }

    let cleared = 0;
    for (let i = 0; i < gridRef.current.length; i++) {
      if (gridRef.current[i] === 1) cleared++;
    }
    if (cleared / gridRef.current.length >= 0.42) {
      playInteractionSfx("scratch-reveal");
      setRevealed(true);
    }
  };

  return (
    <div className="mx-auto mt-7 w-full max-w-[340px]">
      <div className="mb-2 flex items-center justify-between px-1">
        <span
          className="text-[10px] font-bold tracking-[0.22em] text-[#D8AE56] uppercase"
          style={{ fontFamily: MONO_FONT }}
        >
          VIP SCRATCH · NGÀY TRỌNG ĐẠI
        </span>
        <button
          type="button"
          onClick={() => {
            if (revealed) {
              setRevealed(false);
              setResetTick((t) => t + 1);
            } else {
              playInteractionSfx("scratch-reveal");
              setRevealed(true);
            }
          }}
          className="cursor-pointer text-[10px] font-semibold tracking-wider text-[#BFB6A4] underline underline-offset-4 transition-colors hover:text-[#D8AE56]"
        >
          {revealed ? "Cào lại" : "Mở nhanh"}
        </button>
      </div>

      <div className="relative h-[156px] w-full overflow-hidden rounded-2xl border border-[#D8AE56]/60 bg-gradient-to-br from-[#141A18] via-[#0D1F19] to-[#0B0D0E] shadow-[0_12px_30px_rgba(0,0,0,0.85)]">
        {/* Nội dung ngày cưới lộ ra bên dưới lớp nhũ */}
        <div className="flex h-full w-full flex-col items-center justify-center px-4 text-center">
          <div className="flex items-center gap-2">
            <span className="rounded border border-[#C81E2B]/60 bg-[#C81E2B]/20 px-2 py-0.5 text-[9px] font-bold tracking-[0.2em] text-[#F2D488] uppercase">
              ĐÃ ẤN ĐỊNH
            </span>
            <span
              className="text-[10px] font-semibold tracking-[0.18em] text-[#D8AE56] uppercase"
              style={{ fontFamily: MONO_FONT }}
            >
              {weekday} · {time || "18:00"}
            </span>
          </div>

          <p
            className="mt-2 text-3xl font-black tracking-[0.08em] text-[#F5EFE4]"
            style={{ fontFamily: TITLE_FONT }}
          >
            {day} <span className="text-[#D8AE56]">.</span> {month}{" "}
            <span className="text-[#D8AE56]">.</span> {year}
          </p>

          {lunarStr && (
            <p className="mt-1 text-[11px] italic text-[#BFB6A4]">({lunarStr})</p>
          )}
          {venueName && (
            <p className="mt-1 max-w-full truncate text-[10px] font-semibold tracking-wider text-[#D8AE56]/90 uppercase">
              {venueName}
            </p>
          )}
        </div>

        {/* Lớp nhũ vàng 24K Canvas */}
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            drawingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            scratchAt(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (!drawingRef.current) return;
            scratchAt(e.clientX, e.clientY);
          }}
          onPointerUp={() => {
            drawingRef.current = false;
          }}
          onPointerCancel={() => {
            drawingRef.current = false;
          }}
          aria-label="Khu vực cào nhũ vàng để xem ngày cưới"
          className={cn(
            "absolute inset-0 z-10 h-full w-full touch-none select-none cursor-crosshair transition-opacity duration-500",
            revealed ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   TƯƠNG TÁC ĐỘC BẢN STANDARD #2: LẬT THẺ BÀI 3D HỒ SƠ K♥ & Q♥
   - Không dùng backdrop-blur trong container 3D (chống flicker iOS)
   ------------------------------------------------------------ */
function RoyalFlipCard({
  suitLabel,
  roleLabel,
  displayName,
  fullName,
  photoUrl,
  hidePhoto,
  familyHeading,
  parentsList,
  backQuote,
}: {
  suitLabel: "K ♥" | "Q ♥";
  roleLabel: string;
  displayName: string;
  fullName: string;
  photoUrl: string;
  hidePhoto: boolean;
  familyHeading: string;
  parentsList: string[];
  backQuote: string;
}) {
  const [flipped, setFlipped] = React.useState(false);

  return (
    <div className="relative min-h-[228px] [perspective:1000px]">
      <div
        className="relative h-full min-h-[228px] w-full transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg) translateZ(0)" : "rotateY(0deg) translateZ(0)",
        }}
      >
        {/* MẶT TRƯỚC: Hồ sơ nhân vật & thông tin song thân */}
        <div
          className="relative flex h-full min-h-[228px] flex-col justify-between overflow-hidden rounded-xl border border-[#D8AE56]/40 bg-gradient-to-b from-[#141918] to-[#0E1211] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.65)]"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          <div
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md border border-[#C81E2B]/55 bg-[#C81E2B]/15 text-sm font-extrabold text-[#C81E2B]"
            style={{ fontFamily: TITLE_FONT }}
          >
            {suitLabel}
          </div>

          <div className="flex items-center gap-3.5 pr-9">
            {!hidePhoto && (
              <div className="relative h-18 w-18 shrink-0 overflow-hidden rounded-full border-2 border-[#D8AE56]/65 shadow-md">
                <img
                  loading="lazy"
                  decoding="async"
                  src={photoUrl}
                  alt={`Ảnh ${displayName}`}
                  className="h-full w-full object-cover object-center"
                />
              </div>
            )}
            <div className="min-w-0">
              <span
                className="text-[10px] font-semibold tracking-[0.2em] text-[#D8AE56] uppercase"
                style={{ fontFamily: MONO_FONT }}
              >
                {roleLabel}
              </span>
              <h4
                className="truncate text-lg font-bold leading-snug text-[#F5EFE4]"
                style={{ fontFamily: TITLE_FONT }}
              >
                {displayName}
              </h4>
              {fullName && fullName !== displayName && (
                <p className="truncate text-[11px] text-[#BFB6A4]">{fullName}</p>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-[#D8AE56]/20 pt-3 text-xs leading-relaxed text-[#BFB6A4]">
            <p className="mb-1 font-semibold tracking-wider text-[#D8AE56] uppercase">
              {familyHeading}
            </p>
            {parentsList.length > 0 ? (
              parentsList.map((pName, pIdx) => <p key={pIdx}>{pName}</p>)
            ) : (
              <p>Song thân hai họ</p>
            )}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => {
                playInteractionSfx("card-flip");
                setFlipped(true);
              }}
              className="inline-flex cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border border-[#D8AE56]/45 bg-[#D8AE56]/10 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-[#D8AE56] uppercase transition-colors hover:bg-[#D8AE56] hover:text-[#0B0D0E]"
            >
              <RotateCw className="h-3 w-3" aria-hidden="true" />
              <span>Lật bài {suitLabel}</span>
            </button>
          </div>
        </div>

        {/* MẶT SAU: Lưng lá bài Tây Hoàng Gia Hồng Kông */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-xl border border-[#D8AE56]/70 bg-gradient-to-br from-[#2B070B] via-[#17090B] to-[#0B0D0E] p-5 text-center shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {/* Khung viền kép lá bài */}
          <div className="pointer-events-none absolute inset-2.5 rounded-lg border border-dashed border-[#D8AE56]/40" />

          <div className="relative z-10 flex w-full items-center justify-between text-xs font-extrabold text-[#D8AE56]">
            <span>{suitLabel}</span>
            <span className="text-[9px] tracking-[0.24em] uppercase" style={{ fontFamily: MONO_FONT }}>
              ROYAL DOSSIER
            </span>
            <span>{suitLabel}</span>
          </div>

          <div className="relative z-10 my-2 space-y-2 px-2">
            <p
              className="text-lg font-bold text-[#F2D488]"
              style={{ fontFamily: TITLE_FONT }}
            >
              {fullName || displayName}
            </p>
            <p className="text-xs italic leading-relaxed text-[#F5EFE4]/90">
              “{backQuote}”
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              playInteractionSfx("card-flip");
              setFlipped(false);
            }}
            className="relative z-10 inline-flex cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border border-[#D8AE56]/60 bg-[#0B0D0E]/80 px-3.5 py-1.5 text-[10px] font-bold tracking-[0.16em] text-[#D8AE56] uppercase transition-colors hover:bg-[#D8AE56] hover:text-[#0B0D0E]"
          >
            <RotateCw className="h-3 w-3" aria-hidden="true" />
            <span>Quay lại mặt trước</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   MÀN HÌNH BÌA VIP: LẬT QUÂN MẠT CHƯỢC 3D & 2 CÁNH CỬA CỬU LONG
   - z-0: Nền kowloon neon velvet sắc nét
   - z-10: Cửa thang máy 2 cánh trượt mở sang 2 bên
   - z-20: Quân Mạt Chược Song Hỷ lật 3D (rotateY: 180deg) + Tên cặp đôi
   ------------------------------------------------------------ */
function KowloonCover({
  data,
  guestName,
  contained,
  onRevealStart,
  onOpen,
}: {
  data: TemplateData;
  guestName: string | null;
  contained?: boolean;
  onRevealStart?: () => void;
  onOpen: () => void;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = React.useState<HkRevealPhase>("idle");
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const handleOpenClick = () => {
    if (phase !== "idle") return;
    playCoverSfx("kowloon-vip-doors");

    if (reduce) {
      onRevealStart?.();
      setPhase("stage3");
      timersRef.current.push(setTimeout(() => onOpen(), 380));
      return;
    }

    // Pha 1 (0 - 960ms): Quân Mạt Chược xoay 3D 540° + vòng sóng vàng & 12 tia bụi vàng
    setPhase("stage1");

    // Pha 2 (960 - 1840ms): 2 cánh cửa VIP Cửu Long khép kín + khe sáng vàng xẻ dọc, bật Hero bên dưới
    timersRef.current.push(
      setTimeout(() => {
        onRevealStart?.();
        setPhase("stage2");
      }, 960),
    );

    // Pha 3 (1840 - 3040ms): 2 cánh cửa VIP trượt tách sang 2 bên để lộ trực tiếp Hero thật
    timersRef.current.push(
      setTimeout(() => {
        setPhase("stage3");
      }, 1840),
    );

    timersRef.current.push(
      setTimeout(() => {
        onOpen();
      }, 3040),
    );
  };

  const hidePosterBehindDoors = phase === "stage2" || phase === "stage3";

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden px-4 select-none",
        contained ? "h-full min-h-full py-6" : "h-screen-dvh min-h-screen-dvh py-8",
      )}
      style={{ backgroundColor: hidePosterBehindDoors ? "transparent" : KOWLOON_OBSIDIAN }}
    >
      {/* Lớp z-0: Nền phòng VIP Cửu Long ánh neon đỏ vàng */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-0 overflow-hidden transition-opacity duration-200",
          hidePosterBehindDoors ? "opacity-0" : "opacity-100",
        )}
      >
        <picture className="block h-full w-full">
          <img
            loading="eager"
            fetchPriority="high"
            src="/templates/cuu-long-hy-yen/bg_kowloon_mobile.webp"
            alt="Kowloon VIP Neon Background"
            className="h-full w-full object-cover object-center"
          />
        </picture>
      </div>

      {/* Lớp z-[5]: Lớp phủ gradient tối hai mép */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[5] transition-opacity duration-200",
          hidePosterBehindDoors ? "opacity-0" : "opacity-100",
        )}
        style={{
          background:
            "linear-gradient(180deg, rgba(11,13,14,0.85) 0%, rgba(13,31,25,0.4) 40%, rgba(11,13,14,0.7) 75%, rgba(11,13,14,0.95) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Pha 1: Sóng xung kích vàng & 12 tia bụi vàng khi xoay quân Mạt Chược */}
      <HkGoldenSparks active={phase === "stage1"} primaryColor="#F2D488" secondaryColor="#C81E2B" />

      {/* Pha 2 & 3: Cửa thang máy phòng VIP Cửu Long + khe sáng vàng tách trực tiếp trên Hero */}
      <HkKowloonVipDoorsOverlay
        phase={phase}
        coupleLabel={`${data.couple.groomName} & ${data.couple.brideName}`}
      />

      {/* Lớp z-20: Khối trung tâm căn giữa tuyệt đối */}
      <div
        className={cn(
          "relative z-20 mx-auto flex w-full max-w-[328px] sm:max-w-[380px] flex-col items-center text-center transition-opacity duration-200",
          hidePosterBehindDoors ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        {/* Nhãn VIP Đêm Tiệc */}
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D8AE56]/50 bg-[#0B0D0E]/85 px-4 py-1">
          <span className="h-2 w-2 rounded-full bg-[#C81E2B] animate-pulse" />
          <span
            className="text-[10px] sm:text-[11px] font-bold tracking-[0.14em] text-[#D8AE56] uppercase"
            style={{ fontFamily: MONO_FONT }}
          >
            Thiệp mời tham dự lễ cưới
          </span>
        </div>

        {/* Quân bài Mạt Chược Song Hỷ lật 3D tốc độ cao */}
        <div className="my-5 flex items-center justify-center [perspective:1000px]">
          <m.button
            type="button"
            onClick={handleOpenClick}
            disabled={phase !== "idle"}
            className="relative cursor-pointer transition-transform duration-300 hover:scale-105 active:scale-95 disabled:pointer-events-none"
            aria-label="Chạm quân mạt chược để mở tiệc"
            animate={
              phase === "stage1"
                ? {
                  rotateY: [0, 540],
                  scale: [1, 1.32, 1.15],
                }
                : {}
            }
            transition={{ duration: 0.96, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Hào quang vàng phía sau quân mạt chược */}
            <div
              className="pointer-events-none absolute inset-0 -m-3 rounded-2xl bg-gradient-to-r from-[#C81E2B]/40 via-[#D8AE56]/60 to-[#14533C]/40 blur-md transition-opacity duration-300"
              style={{
                opacity: phase === "stage1" ? 1 : 0.6,
              }}
              aria-hidden="true"
            />
            <img loading="eager" fetchPriority="high"
              src="/templates/cuu-long-hy-yen/mahjong_song_hy.webp"
              alt="Quân Mạt Chược Song Hỷ"
              className="relative z-10 block h-auto w-24 sm:w-28 drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)]"
            />
          </m.button>
        </div>

        {/* Tên cặp đôi 3 dòng phong cách Thần Bài / Anh Đại */}
        <div className="space-y-1">
          <p
            className="text-[11px] tracking-[0.28em] uppercase text-[#BFB6A4]"
            style={{ fontFamily: BODY_FONT }}
          >
            THƯ MỜI ĐÊM TIỆC
          </p>
          <div className="pt-1">
            <h1
              className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wider text-[#F5EFE4] drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] break-words leading-tight"
              style={{ fontFamily: TITLE_FONT }}
            >
              {data.couple.groomName}
            </h1>
            <span
              className="my-1 block text-lg sm:text-xl font-serif italic text-[#D8AE56]"
              aria-hidden="true"
            >
              &amp;
            </span>
            <h1
              className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wider text-[#F5EFE4] drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)] break-words leading-tight"
              style={{ fontFamily: TITLE_FONT }}
            >
              {data.couple.brideName}
            </h1>
          </div>
          {/* Dải phân cách hoa văn Cửu Long Art Deco */}
          <div className="mx-auto mt-3 flex justify-center">
            <img loading="lazy" decoding="async"
              src="/templates/cuu-long-hy-yen/divider_kowloon_deco.webp"
              alt=""
              aria-hidden="true"
              className="h-auto w-40 max-w-full opacity-80"
            />
          </div>
        </div>

        {/* Lời mời cá nhân hóa tên khách (nếu có) */}
        {guestName ? (
          <div className="mt-5 rounded-md border border-[#D8AE56]/35 bg-[#121515]/90 px-4 py-2 backdrop-blur-xs">
            <p className="text-[10px] tracking-[0.2em] text-[#BFB6A4] uppercase" style={{ fontFamily: MONO_FONT }}>
              TRÂN TRỌNG KÍNH MỜI
            </p>
            <p className="mt-0.5 text-sm sm:text-base font-semibold text-[#D8AE56]" style={{ fontFamily: TITLE_FONT }}>
              {guestName}
            </p>
          </div>
        ) : (
          <p
            className="mt-5 text-xs tracking-[0.24em] text-[#BFB6A4] uppercase"
            style={{ fontFamily: BODY_FONT }}
          >
            TRÂN TRỌNG KÍNH MỜI
          </p>
        )}

        {/* Nút CTA VÀO TIỆC CỬU LONG */}
        <div className="mt-6 w-full max-w-[260px]">
          <button
            type="button"
            onClick={handleOpenClick}
            disabled={phase !== "idle"}
            className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-[#D8AE56] bg-gradient-to-r from-[#D8AE56] via-[#F2D488] to-[#D8AE56] px-7 py-3 text-xs sm:text-sm font-bold tracking-[0.2em] text-[#0B0D0E] uppercase shadow-[0_0_24px_rgba(216,174,86,0.45)] transition-all duration-300 hover:shadow-[0_0_32px_rgba(216,174,86,0.7)] active:scale-95 disabled:opacity-75"
          >
            <span>VÀO TIỆC CỬU LONG</span>
            <ChevronRight className="h-4 w-4 text-[#0B0D0E] transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   MAIN COMPONENT: CỬU LONG HỶ YẾN
   ------------------------------------------------------------ */
export function CuuLongHyYenTemplate({
  data,
  mode,
  contained = false,
  isOpened = false,
  onOpenedChange,
  externalMusicControl,
  isMusicPlaying = true,
  onToggleMusic,
  inviteSlug,
  weddingSlug,
  invitationMode = "personal",
  guestName = null,
  initialStatus,
  initialPlusOnes,
  initialDiet,
  initialSongRequest,
  initialRideNeeded,
}: WeddingTemplateProps) {
  const [internalOpened, setInternalOpened] = React.useState(isOpened);
  const [coverGone, setCoverGone] = React.useState(isOpened);
  const [isRevealing, setIsRevealing] = React.useState(false);
  const parentOpenedRef = React.useRef(isOpened);

  // Lightbox Modal
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Hook tương tác Vali Hỷ Sự (3 trạng thái: normal -> glow -> open)
  const {
    stage: briefcaseStage,
    isOpening: isBriefcaseOpening,
    isModalOpen: isGiftModalOpen,
    handleGiftClick,
    handleCloseModal,
  } = useGiftBoxInteraction({
    sfxType: "briefcase-vip",
  });

  // Đồng bộ hai chiều `isOpened` với component cha
  React.useEffect(() => {
    if (parentOpenedRef.current !== isOpened) {
      parentOpenedRef.current = isOpened;
      if (isOpened) {
        setInternalOpened(true);
        setCoverGone(true);
      } else {
        setInternalOpened(false);
        setCoverGone(false);
      }
    }
  }, [isOpened]);

  const handleOpenCover = React.useCallback(() => {
    setInternalOpened(true);
    setCoverGone(true);
    setIsRevealing(false);
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }
    if (!contained && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [contained, onOpenedChange]);

  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const targetDateStr = targetEvent.startsAt || data.date || "2027-03-20T10:00:00+07:00";
  const dateParts = formatWeddingDateParts(targetDateStr);
  const lunarStr = formatLunarDateClean(targetEvent.lunarDate);

  // Parents string formatting: Tách tại '&' thành 2 dòng riêng sạch sẽ, không ghi "Thân sinh:"
  const parseParents = (raw?: string) => {
    if (!raw) return [];
    return raw
      .split("&")
      .map((part) => part.trim().replace(/^thân sinh:\s*/i, ""))
      .filter(Boolean);
  };
  const groomParentsList = parseParents(data.couple.groomParents);
  const brideParentsList = parseParents(data.couple.brideParents);

  const dressColors = getDressColors(data);
  const timelineItems = getTimelineItems(data);
  const storyItems = getStoryItems(data);
  const hideCouplePhotos = Boolean(data.hideCouplePhotos);
  const hostFirst = data.hostFirst ?? "groom";

  // Gallery items (Free max 5, Standard/Pro lên đến 30-50 ảnh)
  const galleryPhotos = React.useMemo(() => {
    const raw = data.photos?.gallery ?? [];
    return data.plan === "free" ? raw.slice(0, 5) : raw;
  }, [data.photos?.gallery, data.plan]);

  // Hidden sections & Section Order
  const hidden = new Set(data.hiddenSections ?? []);
  const resolvedWeddingSlug = weddingSlug || data.weddingSlug;
  const order = data.sectionOrder?.length
    ? data.sectionOrder
    : CANONICAL_SECTION_ORDER;
  const orderOf = (key: string) => {
    const index = order.indexOf(key);
    return index < 0 ? 99 : index;
  };

  // Countdown timer logic
  const targetDate = React.useMemo(() => {
    const events = getVisibleEvents(data);
    const ev = getNearestUpcomingEvent(events, data.date);
    return new Date(ev.startsAt || data.date || "2027-03-20T10:00:00+07:00");
  }, [data]);
  const [timeLeft, setTimeLeft] = React.useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const calculateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, targetDate.getTime() - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimer();
    const interval = setInterval(calculateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div
      className={cn(
        "relative w-full overflow-x-hidden text-[#F5EFE4]",
        !coverGone ? (contained ? "h-full overflow-hidden" : "h-screen-dvh min-h-screen-dvh overflow-hidden") : "",
      )}
      style={{
        backgroundColor: KOWLOON_OBSIDIAN,
        fontFamily: BODY_FONT,
      }}
    >
      {/* ---------------- MÀN HÌNH BÌA VIP ---------------- */}
      {!coverGone && (
        <div className="absolute inset-0 z-40 h-full w-full">
          <KowloonCover
            data={data}
            guestName={guestName}
            contained={contained}
            onRevealStart={() => setIsRevealing(true)}
            onOpen={handleOpenCover}
          />
        </div>
      )}

      {/* ---------------- THÂN THIỆP CỬU LONG ---------------- */}
      <div
        className={cn(
          "relative z-10 w-full transition-all duration-700 ease-out",
          !coverGone && !isRevealing
            ? "hidden pointer-events-none opacity-0"
            : isRevealing
              ? "opacity-100 scale-[1.03]"
              : "opacity-100 scale-100",
        )}
      >
        {/* Nút nhạc nền góc màn hình */}
        {!externalMusicControl && !hidden.has("music") && data.music?.src && (
          <LiveMusicFloatingButton
            src={data.music.src}
            title={data.music.title || "Bản Tình Ca Cửu Long"}
            visible={coverGone}
            tone="obsidian"
          />
        )}

        {/* CONTAINER CHÍNH CĂN GIỮA ĐIỆN THOẠI / DESKTOP */}
        <div className="mx-auto flex w-full max-w-[480px] sm:max-w-[540px] flex-col gap-12 px-4 py-8 sm:gap-16">

          {/* =========================================================
              PHẦN 1: HERO POSTER ĐIỆN ẢNH CỬU LONG (Art-Deco Frame)
              ========================================================= */}
          <section style={{ order: -1 }} className="relative pt-4 text-center">
            {/* Nhãn Đêm Tiệc Thành Hôn */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D8AE56]/40 bg-[#121515]/90 px-3.5 py-1 backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C81E2B]" />
              <span
                className="text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#D8AE56] uppercase"
                style={{ fontFamily: MONO_FONT }}
              >
                TRÂN TRỌNG KÍNH MỜI
              </span>
            </div>

            {/* Poster Khung Art-Deco đen - vàng 24K - đỏ son */}
            <div className="relative mx-auto mt-6 w-full max-w-[340px] sm:max-w-[380px]">
              {/* Đôi lá bài King & Queen hoàng kim đặt phía trên đỉnh khung */}
              <div className="relative z-20 -mb-7 flex justify-center">
                <img loading="lazy" decoding="async"
                  src="/templates/cuu-long-hy-yen/cards_king_queen.webp"
                  alt="K♥ & Q♥ Royal Cards"
                  className="h-auto w-24 sm:w-28 drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)]"
                />
              </div>

              {/* Khung ảnh chính lồng ảnh cưới */}
              <div className="relative aspect-[818/1117] w-full overflow-hidden rounded-xl bg-[#0B0D0E] shadow-[0_16px_36px_rgba(0,0,0,0.95)]">
                {/* Ảnh cưới bên trong khung */}
                <div className="absolute inset-[6.5%] overflow-hidden rounded-lg bg-[#121515]">
                  <img
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    src={data.photos?.heroUrl || galleryPhotos[0]?.url || "/demo/hongkong/01_hero_neon_street.webp"}
                    alt={data.photos?.heroAlt || `Ảnh cưới ${data.couple.groomName} và ${data.couple.brideName}`}
                    className="h-full w-full object-cover object-center"
                  />
                  {/* Lớp ám màu phim 1990s nhẹ */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0D0E]/80 via-transparent to-transparent" />
                </div>

                {/* Khung viền Art-Deco đè lên trên */}
                <img loading="lazy" decoding="async"
                  src="/templates/cuu-long-hy-yen/kowloon_poster_frame.webp"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-10 h-full w-full object-fill"
                />
              </div>
            </div>

            {/* Tên cặp đôi 3 dòng khổ lớn */}
            <div className="mt-8 space-y-1">
              <p className="text-[11px] tracking-[0.25em] text-[#BFB6A4] uppercase" style={{ fontFamily: BODY_FONT }}>
                HỶ YẾN TRĂM NĂM
              </p>
              <h2
                className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-[#F5EFE4] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] break-words leading-tight"
                style={{ fontFamily: TITLE_FONT }}
              >
                {data.couple.groomName}
              </h2>
              <span className="block text-xl font-serif italic text-[#D8AE56]" aria-hidden="true">
                &amp;
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-[#F5EFE4] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] break-words leading-tight"
                style={{ fontFamily: TITLE_FONT }}
              >
                {data.couple.brideName}
              </h2>
              {/* Dải phân cách hoa văn Cửu Long */}
              <div className="mx-auto mt-4 flex justify-center">
                <img loading="lazy" decoding="async"
                  src="/templates/cuu-long-hy-yen/divider_kowloon_deco.webp"
                  alt=""
                  aria-hidden="true"
                  className="h-auto w-36 max-w-full opacity-70"
                />
              </div>
              {dateParts?.dotDate && (
                <p className="pt-2 text-xs font-bold tracking-[0.26em] text-[#D8AE56] uppercase" style={{ fontFamily: MONO_FONT }}>
                  {dateParts.dotDate}
                </p>
              )}
            </div>

            {/* Lời dẫn duyên dáng, khí chất */}
            <p className="mx-auto mt-4 max-w-sm text-xs sm:text-sm leading-relaxed text-[#BFB6A4] italic">
              “{data.quote?.trim() || "Giữa muôn vạn bước chân nơi đô thành náo nhiệt, gặp được một người cùng chung chí hướng, nắm tay đi trọn trăm năm là điều may mắn nhất đời này."}”
            </p>
          </section>

          {/* =========================================================
              PHẦN 2: THẺ BÀI 3D SONG HÙNG K ♥ & Q ♥ VÀ HAI GIA ĐÌNH (family)
              ========================================================= */}
          {!hidden.has("family") && (
            <section style={{ order: orderOf("family") }} className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
                  HAI BÊN GIA ĐÌNH
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(hostFirst === "bride" ? ["bride", "groom"] : ["groom", "bride"]).map((side) =>
                  side === "groom" ? (
                    <RoyalFlipCard
                      key="groom"
                      suitLabel="K ♥"
                      roleLabel={data.castDossier?.groomRole || data.couple.groomTitle || "TRƯỞNG NAM"}
                      displayName={data.couple.groomName}
                      fullName={data.couple.groomFullName || data.couple.groomName}
                      photoUrl={data.photos?.groomUrl || "/demo/hongkong/02_groom_solo_mercedes.webp"}
                      hidePhoto={hideCouplePhotos}
                      familyHeading="NHÀ TRAI"
                      parentsList={groomParentsList}
                      backQuote={data.castDossier?.groomQuote || `Hạnh phúc lớn nhất của ${data.couple.groomName} là được nắm tay ${data.couple.brideName} bước vào chương mới của cuộc đời.`}
                    />
                  ) : (
                    <RoyalFlipCard
                      key="bride"
                      suitLabel="Q ♥"
                      roleLabel={data.castDossier?.brideRole || data.couple.brideTitle || "ÁI NỮ"}
                      displayName={data.couple.brideName}
                      fullName={data.couple.brideFullName || data.couple.brideName}
                      photoUrl={data.photos?.brideUrl || "/demo/hongkong/03_bride_solo_neon_lounge.webp"}
                      hidePhoto={hideCouplePhotos}
                      familyHeading="NHÀ GÁI"
                      parentsList={brideParentsList}
                      backQuote={data.castDossier?.brideQuote || `Cảm ơn mọi người đã luôn thương yêu và có mặt trong đêm hỷ yến đáng nhớ nhất của ${data.couple.brideName} & ${data.couple.groomName}.`}
                    />
                  ),
                )}
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 2B (STANDARD): HỒI ỨC CỬU LONG — CUỘN PHIM 35MM (story)
              ========================================================= */}
          {!hidden.has("story") && storyItems.length > 0 && (
            <section style={{ order: orderOf("story") }} className="space-y-5">
              <div className="text-center">
                <h3
                  className="text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  CHUYỆN CHÚNG MÌNH
                </h3>
              </div>

              {/* Dải cuộn phim 35mm có lỗ đục hai bên */}
              <div className="relative overflow-hidden rounded-2xl border border-[#D8AE56]/40 bg-[#0F1211] px-6 py-5 shadow-[0_14px_32px_rgba(0,0,0,0.85)]">
                {/* Lỗ phim bên trái */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-3 left-1.5 flex w-2.5 flex-col justify-between"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2 rounded-[2px] border border-[#D8AE56]/30 bg-[#050606]"
                    />
                  ))}
                </div>
                {/* Lỗ phim bên phải */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-3 right-1.5 flex w-2.5 flex-col justify-between"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span
                      key={i}
                      className="h-2.5 w-2 rounded-[2px] border border-[#D8AE56]/30 bg-[#050606]"
                    />
                  ))}
                </div>

                <div className="space-y-4">
                  {storyItems.map((milestone, idx) => {
                    const milestonePhoto = milestone.imageUrl?.trim();
                    return (
                      <div
                        key={milestone.id || idx}
                        className="rounded-xl border border-[#D8AE56]/25 bg-gradient-to-br from-[#151A18] to-[#0D1311] p-4"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="inline-flex items-center gap-1 rounded bg-[#C81E2B] px-2 py-0.5 text-[10px] font-bold tracking-[0.18em] text-[#F5EFE4]"
                            style={{ fontFamily: MONO_FONT }}
                          >
                            {milestone.year || `202${idx + 3}`}
                          </span>
                          <span
                            className="text-[10px] font-bold tracking-[0.22em] text-[#D8AE56]/80"
                            style={{ fontFamily: MONO_FONT }}
                          >
                            REEL {String(idx + 1).padStart(2, "0")}
                          </span>
                        </div>

                        <h4
                          className="mt-2.5 text-base font-bold text-[#F2D488]"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {milestone.title}
                        </h4>

                        {milestone.content && (
                          <p className="mt-1.5 text-xs leading-relaxed text-[#BFB6A4]">
                            {milestone.content}
                          </p>
                        )}

                        {milestonePhoto && (
                          <div
                            className="mt-3 block w-full overflow-hidden rounded-lg border border-[#D8AE56]/30 bg-[#0B0D0E] text-left"
                          >
                            <div className="relative aspect-[16/9] w-full overflow-hidden">
                              <img
                                loading="lazy"
                                decoding="async"
                                src={milestonePhoto}
                                alt={milestone.title}
                                className="h-full w-full object-cover"
                              />
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0B0D0E]/65 via-transparent to-transparent" />
                              <span
                                className="absolute right-2 bottom-1.5 text-[9px] font-bold tracking-[0.2em] text-[#D8AE56]"
                                style={{ fontFamily: MONO_FONT }}
                              >
                                FRAME {String(idx + 1).padStart(2, "0")}A
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 3: LỄ CƯỚI & SỰ KIỆN (map)
              ========================================================= */}
          {!hidden.has("map") && visibleEvents.length > 0 && (
            <section style={{ order: orderOf("map") }} className="space-y-5">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
                  LỄ CƯỚI &amp; SỰ KIỆN
                </h3>
              </div>

              {/* THẺ VIP ĐÊM TIỆC: Ngày giờ & Địa điểm (Hỗ trợ 1..N buổi lễ) */}
              <div className={visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "max-w-xl mx-auto space-y-4"}>
                {visibleEvents.map((evt, idx) => {
                  const evtDateParts = formatWeddingDateParts(evt.startsAt);
                  const evtLunarStr = formatLunarDateClean(evt.lunarDate);
                  const directionsUrl = getEventDirectionsUrl(evt);

                  return (
                    <div
                      key={evt.id || idx}
                      className="relative overflow-hidden rounded-2xl border border-[#D8AE56]/45 bg-gradient-to-b from-[#121515] to-[#0D1F19] p-6 shadow-[0_12px_28px_rgba(0,0,0,0.85)] flex flex-col justify-between"
                    >
                      <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-[#D8AE56]/10 blur-xl" />

                      <div>
                        <div className="flex items-center justify-between border-b border-[#D8AE56]/25 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#C81E2B]" />
                            <span className="text-xs font-bold tracking-[0.2em] text-[#D8AE56] uppercase" style={{ fontFamily: MONO_FONT }}>
                              {evt.title || `LỄ HÔN PHỐI #${idx + 1}`}
                            </span>
                          </div>
                        </div>

                        {/* Khối Ngày / Tháng / Năm lớn */}
                        <div className="my-5 flex flex-col items-center justify-center text-center">
                          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-[#D8AE56] uppercase">
                            {evtDateParts?.weekday} · {evtDateParts?.time || "11:00"}
                          </p>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-4xl sm:text-5xl font-black text-[#F5EFE4] tracking-tight" style={{ fontFamily: TITLE_FONT }}>
                              {evtDateParts?.day}
                            </span>
                            <div className="text-left leading-tight">
                              <p className="text-xs font-bold tracking-wider text-[#D8AE56] uppercase">
                                THÁNG {evtDateParts?.month}
                              </p>
                              <p className="text-xs text-[#BFB6A4] font-mono">
                                NĂM {evtDateParts?.year}
                              </p>
                            </div>
                          </div>
                          {evtLunarStr && (
                            <p className="mt-2 text-[11px] text-[#BFB6A4] italic">
                              ({evtLunarStr})
                            </p>
                          )}
                        </div>

                        {/* Địa điểm tiệc */}
                        <div className="rounded-xl border border-[#D8AE56]/20 bg-[#0B0D0E]/80 p-4 text-center">
                          <p className="text-xs font-bold uppercase tracking-wider text-[#D8AE56]">
                            {evt.venueName || "TRUNG TÂM HỘI NGHỊ & TIỆC CƯỚI"}
                          </p>
                          <p className="mt-1 text-xs text-[#BFB6A4] leading-relaxed">
                            {evt.venueAddress || "TP. Hồ Chí Minh"}
                          </p>
                        </div>
                      </div>

                      {/* Nút chỉ đường Google Maps */}
                      <div className="mt-4 flex justify-center">
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#D8AE56]/60 bg-[#D8AE56]/15 px-4 py-2 text-xs font-bold tracking-wider text-[#D8AE56] transition-colors hover:bg-[#D8AE56] hover:text-[#0B0D0E]"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          <span>CHỈ ĐƯỜNG TRÊN GOOGLE MAPS</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 6: LỊCH CƯỚI & ĐẾM NGƯỢC (calendar)
              ========================================================= */}
          {!hidden.has("calendar") && (
            <section style={{ order: orderOf("calendar") }} className="space-y-5">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
                  NGÀY CHUNG ĐÔI
                </h3>
              </div>

              {dateParts && (
                <GoldenScratchCard
                  weekday={dateParts.weekday}
                  time={dateParts.time}
                  day={dateParts.day}
                  month={dateParts.month}
                  year={dateParts.year}
                  lunarStr={lunarStr}
                  venueName={targetEvent.venueName}
                />
              )}

              {/* 4 ô đồng hồ đếm ngược số cơ khí */}
              <div className="rounded-2xl border border-[#D8AE56]/30 bg-[#0D1F19]/80 p-5 shadow-lg max-w-xl mx-auto">
                <p className="text-center text-[10px] sm:text-[11px] font-bold tracking-[0.24em] text-[#D8AE56] uppercase mb-4" style={{ fontFamily: MONO_FONT }}>
                  ĐẾM NGƯỢC NGÀY VUI
                </p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "NGÀY", val: timeLeft.days },
                    { label: "GIỜ", val: timeLeft.hours },
                    { label: "PHÚT", val: timeLeft.minutes },
                    { label: "GIÂY", val: timeLeft.seconds },
                  ].map((item, idx) => (
                    <div key={idx} className="rounded-lg border border-[#D8AE56]/30 bg-[#121515] py-2">
                      <p className="text-lg sm:text-xl font-bold text-[#D8AE56] font-mono leading-none">
                        {String(item.val).padStart(2, "0")}
                      </p>
                      <p className="mt-1 text-[9px] font-semibold tracking-wider text-[#BFB6A4]" style={{ fontFamily: MONO_FONT }}>
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* BÀN LỊCH THÁNG KIỂU Ô GẠCH MẠT CHƯỢC (Lần 2 xuất hiện ngày cưới) */}
              {!hidden.has("calendar") && dateParts && (
                <div className="rounded-2xl border-2 border-[#14533C] bg-[#F5EFE2] p-5 text-[#0B0D0E] shadow-[0_12px_28px_rgba(0,0,0,0.85)] max-w-xl mx-auto">
                  <div className="mb-4 flex items-center justify-between border-b border-[#14533C]/20 pb-2">
                    <span className="text-xs font-bold tracking-[0.2em] text-[#14533C] uppercase" style={{ fontFamily: MONO_FONT }}>
                      BÀN LỊCH CỬU LONG
                    </span>
                    <span className="text-xs font-extrabold uppercase text-[#C81E2B]" style={{ fontFamily: TITLE_FONT }}>
                      THÁNG {dateParts.month} · {dateParts.year}
                    </span>
                  </div>

                  {/* Lưới các thứ trong tuần */}
                  <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-[#14533C] uppercase mb-2">
                    {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day, idx) => (
                      <div key={idx} className="py-1">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Lưới các ô ngày mạt chược */}
                  <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                    {(() => {
                      const year = parseInt(dateParts.year, 10);
                      const month = parseInt(dateParts.month, 10);
                      const eventDays = new Set(
                        visibleEvents.map((evt) => parseInt(formatWeddingDateParts(evt.startsAt).day, 10))
                      );

                      const firstDay = new Date(year, month - 1, 1).getDay();
                      // T2 is index 0 -> adjust from Sunday (0)
                      const offset = firstDay === 0 ? 6 : firstDay - 1;
                      const daysInMonth = new Date(year, month, 0).getDate();

                      const cells = [];
                      for (let i = 0; i < offset; i++) {
                        cells.push(<div key={`empty-${i}`} className="h-8" />);
                      }
                      for (let d = 1; d <= daysInMonth; d++) {
                        const isWedding = eventDays.has(d);
                        cells.push(
                          <div
                            key={`day-${d}`}
                            className={cn(
                              "flex h-8 items-center justify-center rounded border font-semibold text-xs transition-transform",
                              isWedding
                                ? "border-[#C81E2B] bg-[#C81E2B] text-[#F5EFE4] font-extrabold shadow-md scale-105"
                                : "border-[#14533C]/20 bg-white text-[#0B0D0E]",
                            )}
                          >
                            {d}
                          </div>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* =========================================================
              PHẦN 4: LUẬT CHƠI ĐÊM TIỆC - DRESS CODE (dresscode)
              * Phỉnh Casino, viền khía vàng mảnh, KHÔNG lộ mã hex #XXXXXX
              ========================================================= */}
          {!hidden.has("dresscode") && dressColors.length > 0 && (
            <section style={{ order: orderOf("dresscode") }} className="space-y-4 text-center">
              <div>
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
                  LỊCH TRÌNH &amp; TRANG PHỤC
                </h3>
              </div>

              {/* Các chip phỉnh Casino viền khía vàng */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2">
                {dressColors.map((hex, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div
                      className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-dashed border-[#D8AE56] shadow-[0_0_16px_rgba(216,174,86,0.25)] transition-transform hover:scale-110"
                      style={{
                        backgroundColor: hex,
                        boxShadow: `0 0 16px ${hex}40, inset 0 0 8px rgba(0,0,0,0.6)`,
                      }}
                      aria-label={`Dress Code Swatch ${idx + 1}`}
                    >
                      {/* Vòng viền vàng trong hạt phỉnh */}
                      <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-[#D8AE56]/60 pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>

              {/* LỊCH TRÌNH ĐÊM TIỆC */}
              {timelineItems.length > 0 && (
                <div className="mt-6 rounded-2xl border border-[#D8AE56]/35 bg-gradient-to-b from-[#131817] to-[#0D1311] p-5 text-left shadow-[0_12px_28px_rgba(0,0,0,0.8)]">
                  <div className="mb-4 flex items-center justify-between border-b border-[#D8AE56]/25 pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#D8AE56]" aria-hidden="true" />
                      <span
                        className="text-[11px] font-bold tracking-[0.2em] text-[#D8AE56] uppercase"
                        style={{ fontFamily: MONO_FONT }}
                      >
                        LỊCH TRÌNH ĐÊM TIỆC
                      </span>
                    </div>
                  </div>

                  <ol className="relative space-y-3.5 pl-5 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-gradient-to-b before:from-[#D8AE56] before:via-[#D8AE56]/45 before:to-transparent">
                    {timelineItems.map((item, idx) => (
                      <li key={item.id || idx} className="relative flex items-baseline gap-3">
                        <span
                          aria-hidden="true"
                          className="absolute -left-5 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#D8AE56] bg-[#C81E2B]"
                        />
                        <span
                          className="w-12 shrink-0 text-xs font-bold text-[#F2D488]"
                          style={{ fontFamily: MONO_FONT }}
                        >
                          {item.time || "--:--"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs sm:text-sm font-medium text-[#F5EFE4]">
                            {item.label}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>
          )}

          {/* =========================================================
              PHẦN 9: ALBUM ẢNH CƯỚI (album)
              ========================================================= */}
          {!hidden.has("album") && galleryPhotos.length > 0 && (
            <section style={{ order: orderOf("album") }} className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
                  ALBUM ẢNH CƯỚI
                </h3>
              </div>

              {/* Lưới ảnh (5 ảnh nổi bật đầu tiên) */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {galleryPhotos.slice(0, 5).map((photo, idx) => (
                  <div
                    key={photo.id || idx}
                    onClick={() => setLightboxIndex(idx)}
                    className={cn(
                      "group relative cursor-pointer overflow-hidden rounded-xl border border-[#D8AE56]/35 bg-[#121515] shadow-md transition-all duration-300 hover:border-[#D8AE56] hover:shadow-[0_0_20px_rgba(216,174,86,0.35)]",
                      idx === 0 ? "col-span-2 aspect-[16/10]" : "aspect-[4/5]",
                    )}
                  >
                    <img decoding="async"
                      src={photo.url}
                      alt={photo.alt || `Khoảnh khắc #${idx + 1}`}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>

              {/* Dải cuộn ngang cho ảnh mở rộng */}
              {galleryPhotos.length > 5 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span
                      className="text-[10px] font-bold tracking-[0.2em] text-[#D8AE56] uppercase"
                      style={{ fontFamily: MONO_FONT }}
                    >
                      ALBUM MỞ RỘNG ({galleryPhotos.length - 5} ẢNH)
                    </span>
                    <span className="text-[10px] text-[#BFB6A4]">Vuốt ngang →</span>
                  </div>
                  <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-xl border border-[#D8AE56]/30 bg-[#0F1211] p-3">
                    {galleryPhotos.slice(5).map((photo, offsetIdx) => {
                      const realIdx = offsetIdx + 5;
                      return (
                        <button
                          key={photo.id || realIdx}
                          type="button"
                          onClick={() => setLightboxIndex(realIdx)}
                          className="group relative aspect-[3/4] w-36 shrink-0 snap-start cursor-pointer overflow-hidden rounded-lg border border-[#D8AE56]/35 bg-[#121515] transition-all hover:border-[#D8AE56]"
                        >
                          <img
                            loading="lazy"
                            decoding="async"
                            src={photo.url}
                            alt={photo.alt || `Khoảnh khắc #${realIdx + 1}`}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* =========================================================
              PHẦN 10: QR ALBUM CHIA SẺ ẢNH TIỆC CƯỚI (albumQr)
              ========================================================= */}
          {data.plan !== "free" && !hidden.has("albumQr") && resolvedWeddingSlug && (
            <section style={{ order: orderOf("albumQr") }} className="flex justify-center pt-2">
              <GuestAlbumQr
                slug={resolvedWeddingSlug}
                accentColor="#D8AE56"
                textColor="#F5EFE4"
                mutedColor="#BFB6A4"
              />
            </section>
          )}

          {/* =========================================================
              PHẦN 7: VALI HỶ SỰ - MỪNG CƯỚI 3 TRẠNG THÁI (gift)
              ========================================================= */}
          {!hidden.has("gift") && (
            <section style={{ order: orderOf("gift") }} className="space-y-4 text-center">
              <div>
                <h3 className="text-2xl font-bold uppercase tracking-wider text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
                  HỘP MỪNG CƯỚI
                </h3>
              </div>

              {/* Nút Vali Đen Khóa Vàng 3 Trạng Thái */}
              <div className="flex flex-col items-center justify-center pt-2">
                {/* Preload ảnh trạng thái open chống giật layout */}
                <img loading="lazy" decoding="async"
                  src="/templates/cuu-long-hy-yen/briefcase_open.webp"
                  className="hidden"
                  aria-hidden="true"
                  alt=""
                />

                <button
                  type="button"
                  onClick={handleGiftClick}
                  disabled={isBriefcaseOpening}
                  className="group relative flex cursor-pointer items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 disabled:pointer-events-none"
                  aria-label="Mở vali mừng cưới"
                >
                  {/* Hào quang vàng phía sau vali */}
                  <div
                    className="pointer-events-none absolute inset-0 -m-4 rounded-3xl bg-gradient-to-r from-[#D8AE56]/30 via-[#C81E2B]/20 to-[#D8AE56]/30 blur-xl transition-opacity duration-300"
                    style={{
                      opacity: briefcaseStage === "open" || briefcaseStage === "glow" ? 0.9 : 0.4,
                    }}
                    aria-hidden="true"
                  />

                  {/* Ảnh chiếc vali 3 trạng thái căn đáy thẳng hàng */}
                  <div className="relative z-10 h-44 w-44 sm:h-48 sm:w-48">
                    <img loading="lazy" decoding="async"
                      src={
                        briefcaseStage === "open"
                          ? "/templates/cuu-long-hy-yen/briefcase_open.webp"
                          : briefcaseStage === "glow"
                            ? "/templates/cuu-long-hy-yen/briefcase_glow.webp"
                            : "/templates/cuu-long-hy-yen/briefcase_normal.webp"
                      }
                      alt="Vali đen khóa vàng Cửu Long"
                      className="mx-auto block h-full w-full object-contain"
                    />
                  </div>
                </button>

                <p className="mt-3 text-[11px] font-bold tracking-[0.2em] text-[#D8AE56] uppercase" style={{ fontFamily: MONO_FONT }}>
                  {briefcaseStage === "open" ? "VALI ĐÃ MỞ" : "CHẠM ĐỂ MỞ VALI HỶ SỰ"}
                </p>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 7: XÁC NHẬN GÓP MẶT & SỔ LƯU BÚT (rsvp)
              * Đồng bộ 100% theme Cửu Long Hỷ Yến
              ========================================================= */}
          {!hidden.has("rsvp") && (
            <section style={{ order: orderOf("rsvp") }} className="space-y-4">
              {/* Form RSVP bọc trong card Obsidian viền vàng 24K */}
              <div
                className="overflow-hidden rounded-2xl border border-[#D8AE56]/40 bg-[#121615] p-5 sm:p-6 shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
                style={{ colorScheme: "dark" }}
              >
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="obsidian"
                  customTheme={{
                    isDark: true,
                    wrap: "bg-transparent text-[#F5EFE4]",
                    heading: "text-[#D8AE56]",
                    card: "bg-[#0B0D0E] border border-[#D8AE56]/35 text-[#F5EFE4]",
                    input: "bg-[#0B0D0E] border border-[#D8AE56]/35 text-[#F5EFE4] focus:border-[#D8AE56]",
                    primaryBtn: "bg-[#D8AE56] text-[#0B0D0E] hover:bg-[#F2D488] font-bold",
                    outlineBtn: "border-[#D8AE56] text-[#D8AE56] hover:bg-[#D8AE56]/15",
                    optionBg: "#0B0D0E",
                    optionColor: "#F5EFE4",
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
            </section>
          )}

        </div>

        {/* =========================================================
            PHẦN 8: FOOTER (ĐẶT NGOÀI CONTAINER FLEX CÓ ORDER)
            * Không lặp lại ngày cưới
            ========================================================= */}
        <footer className="mt-16 border-t border-[#D8AE56]/20 bg-[#0B0D0E] py-10 text-center text-xs text-[#BFB6A4]">
          <div className="mx-auto max-w-sm px-4 space-y-2">
            {/* Dải phân cách hoa văn Cửu Long */}
            <div className="flex justify-center mb-3">
              <img loading="lazy" decoding="async"
                src="/templates/cuu-long-hy-yen/divider_kowloon_deco.webp"
                alt=""
                aria-hidden="true"
                className="h-auto w-32 max-w-full opacity-60"
              />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#F5EFE4]" style={{ fontFamily: TITLE_FONT }}>
              HẸN GẶP QUÝ KHÁCH TẠI TIỆC CƯỚI
            </p>
            <p className="text-[10px] text-[#737882] pt-2">
              © {dateParts.year} {data.couple.groomName} &amp; {data.couple.brideName}
            </p>
          </div>
        </footer>
      </div>

      {/* ---------------- MODAL QUÀ MỪNG (createPortal) ---------------- */}
      <GiftModal
        open={isGiftModalOpen}
        onClose={handleCloseModal}
        gift={data.gift}
        plan={data.plan || "free"}
        tone="obsidian"
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName}
      />

      {/* ---------------- LIGHTBOX MODAL ---------------- */}
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

export default CuuLongHyYenTemplate;
