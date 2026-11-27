"use client";

import * as React from "react";
import { Clock, RotateCw } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { playInteractionSfx } from "@/lib/sfx";
import type {
  TemplateData,
  TemplatePhotoItem,
  WeddingStoryMilestone,
  WeddingTimelineItem,
} from "@/lib/wedding-types";

export interface HkStandardTheme {
  accent: string;
  accentLight: string;
  crimson: string;
  surfaceBg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textMuted: string;
  foilStops: [string, string, string, string, string];
  badgeText?: string;
  titleFont?: string;
  monoFont?: string;
}

const DEFAULT_TITLE_FONT = "var(--font-playfair), Georgia, serif";
const DEFAULT_MONO_FONT =
  'ui-monospace, SFMono-Regular, "Space Mono", Menlo, monospace';

export const HK_DEFAULT_TIMELINE: WeddingTimelineItem[] = [
  { time: "17:30", label: "Đón khách & Chụp ảnh thảm đỏ" },
  { time: "18:30", label: "Khai màn Lễ Thành Hôn" },
  { time: "19:00", label: "Nâng ly khai tiệc chúc phúc" },
  { time: "20:00", label: "Âm nhạc & Giao lưu khách quý" },
  { time: "21:30", label: "Tiễn khách & Lưu giữ kỷ niệm" },
];

export const HK_DEFAULT_STORY: WeddingStoryMilestone[] = [
  {
    year: "2022",
    title: "Cảnh I · Lần Đầu Gặp Gỡ",
    content:
      "Giữa ánh đèn phố đêm náo nhiệt, một cuộc gặp gỡ tưởng chừng tình cờ lại mở ra chương đẹp nhất của cả hai.",
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
      "Từ hai mảnh ghép riêng biệt nay chính thức về chung một nhà, mời những người thương yêu nhất đến chứng kiến đêm tiệc.",
  },
];

export function getHkTimelineItems(data: TemplateData): WeddingTimelineItem[] {
  const items = data.timeline?.filter(
    (item) => item.time.trim() || item.label.trim(),
  );
  return items && items.length > 0 ? items : HK_DEFAULT_TIMELINE;
}

export function getHkStoryItems(data: TemplateData): WeddingStoryMilestone[] {
  const items = data.story?.filter(
    (item) =>
      (item.year?.trim() ?? "") || item.title.trim() || item.content.trim(),
  );
  return items && items.length > 0 ? items : HK_DEFAULT_STORY;
}

/* ============================================================
   1. THẺ CÀO NHŨ TIẾT LỘ NGÀY CƯỚI (Canvas Scratch-to-Reveal)
   ============================================================ */
export function HkScratchDateCard({
  theme,
  eyebrow = "Ngày Hoàng Đạo",
  foilHeading = "CÀO NHŨ MỞ NGÀY CƯỚI",
  weekday,
  time,
  day,
  month,
  year,
  lunarStr,
  venueName,
}: {
  theme: HkStandardTheme;
  eyebrow?: string;
  foilHeading?: string;
  weekday: string;
  time: string;
  day: string;
  month: string;
  year: string;
  lunarStr?: string | null;
  venueName?: string | null;
}) {
  const reduce = useReducedMotion();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const drawingRef = React.useRef(false);
  const gridRef = React.useRef<Uint8Array>(new Uint8Array(12 * 6));
  const [revealed, setRevealed] = React.useState(Boolean(reduce));
  const [resetTick, setResetTick] = React.useState(0);

  const titleFont = theme.titleFont ?? DEFAULT_TITLE_FONT;
  const monoFont = theme.monoFont ?? DEFAULT_MONO_FONT;

  React.useEffect(() => {
    if (revealed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const w = 340;
    const h = 154;
    canvas.width = w;
    canvas.height = h;
    gridRef.current = new Uint8Array(12 * 6);

    ctx.globalCompositeOperation = "source-over";
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, theme.foilStops[0]);
    grad.addColorStop(0.28, theme.foilStops[1]);
    grad.addColorStop(0.52, theme.foilStops[2]);
    grad.addColorStop(0.75, theme.foilStops[3]);
    grad.addColorStop(1, theme.foilStops[4]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(255, 250, 232, 0.22)";
    ctx.lineWidth = 1;
    for (let x = -h; x < w + h; x += 14) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h, h);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(11, 13, 14, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 10, w - 20, h - 20);

    ctx.fillStyle = "#140F08";
    ctx.font = "800 14px Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText(foilHeading, w / 2, h / 2 - 2);
    ctx.font = "600 10px ui-sans-serif, system-ui, sans-serif";
    ctx.fillStyle = "rgba(20, 15, 8, 0.72)";
    ctx.fillText("Chạm & kéo lên lớp nhũ", w / 2, h / 2 + 22);
  }, [foilHeading, resetTick, revealed, theme.foilStops]);

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
    <div className="mx-auto mt-6 w-full max-w-[340px]">
      <div className="mb-2 flex items-center justify-between px-1">
        {eyebrow ? (
          <span
            className="text-[10px] font-bold tracking-[0.2em] uppercase"
            style={{ fontFamily: monoFont, color: theme.accent }}
          >
            {eyebrow}
          </span>
        ) : (
          <span />
        )}
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
          className="cursor-pointer text-[10px] font-semibold tracking-wider underline underline-offset-4 transition-opacity hover:opacity-100 opacity-80"
          style={{ color: theme.textMuted }}
        >
          {revealed ? "Cào lại" : "Mở nhanh"}
        </button>
      </div>

      <div
        className="relative h-[154px] w-full overflow-hidden rounded-2xl border shadow-[0_12px_30px_rgba(0,0,0,0.75)]"
        style={{
          borderColor: theme.cardBorder,
          backgroundColor: theme.cardBg,
        }}
      >
        <div className="flex h-full w-full flex-col items-center justify-center px-4 text-center">
          <div className="flex items-center gap-2">
            <span
              className="rounded px-2 py-0.5 text-[9px] font-bold tracking-[0.18em] uppercase text-white"
              style={{ backgroundColor: theme.crimson }}
            >
              ĐÃ ẤN ĐỊNH
            </span>
            <span
              className="text-[10px] font-semibold tracking-[0.16em] uppercase"
              style={{ fontFamily: monoFont, color: theme.accent }}
            >
              {weekday} · {time || "18:00"}
            </span>
          </div>

          <p
            className="mt-2 text-3xl font-black tracking-[0.08em]"
            style={{ fontFamily: titleFont, color: theme.textPrimary }}
          >
            {day} <span style={{ color: theme.accent }}>.</span> {month}{" "}
            <span style={{ color: theme.accent }}>.</span> {year}
          </p>

          {lunarStr && (
            <p className="mt-1 text-[11px] italic" style={{ color: theme.textMuted }}>
              ({lunarStr})
            </p>
          )}
          {venueName && (
            <p
              className="mt-1 max-w-full truncate text-[10px] font-semibold tracking-wider uppercase"
              style={{ color: theme.accentLight }}
            >
              {venueName}
            </p>
          )}
        </div>

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
          aria-label="Khu vực cào nhũ để xem ngày cưới"
          className={cn(
            "absolute inset-0 z-10 h-full w-full touch-none select-none cursor-crosshair transition-opacity duration-500",
            revealed ? "pointer-events-none opacity-0" : "opacity-100",
          )}
        />
      </div>
    </div>
  );
}

/* ============================================================
   2. LẬT THẺ BÀI 3D HỒ SƠ CHÚ RỂ & CÔ DÂU
   (Không dùng backdrop-blur trong container 3D chống flicker)
   ============================================================ */
function SingleFlipCard({
  theme,
  badge,
  roleLabel,
  displayName,
  fullName,
  photoUrl,
  hidePhoto,
  familyHeading,
  parentsList,
  backQuote,
}: {
  theme: HkStandardTheme;
  badge: string;
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
  const titleFont = theme.titleFont ?? DEFAULT_TITLE_FONT;
  const monoFont = theme.monoFont ?? DEFAULT_MONO_FONT;

  return (
    <div className="relative min-h-[224px] [perspective:1000px]">
      <div
        className="relative h-full min-h-[224px] w-full transition-transform duration-700"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped
            ? "rotateY(180deg) translateZ(0)"
            : "rotateY(0deg) translateZ(0)",
        }}
      >
        {/* Mặt trước */}
        <div
          className="relative flex h-full min-h-[224px] flex-col justify-between overflow-hidden rounded-xl border p-5 shadow-[0_8px_20px_rgba(0,0,0,0.65)]"
          style={{
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div
            className="absolute right-3 top-3 rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider"
            style={{
              borderColor: theme.crimson,
              color: theme.crimson,
              fontFamily: monoFont,
            }}
          >
            {badge}
          </div>

          <div className="flex items-center gap-3.5 pr-12">
            {!hidePhoto && (
              <div
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 shadow-md"
                style={{ borderColor: theme.accent }}
              >
                <img
                  loading="lazy"
                  decoding="async"
                  src={photoUrl}
                  alt={`Ảnh ${displayName}`}
                  className="h-full w-full object-cover object-center"
                />
              </div>
            )}
            <div className="min-w-0 text-left">
              <span
                className="text-[10px] font-semibold tracking-[0.2em] uppercase"
                style={{ fontFamily: monoFont, color: theme.accent }}
              >
                {roleLabel}
              </span>
              <h4
                className="truncate text-lg font-bold leading-snug"
                style={{ fontFamily: titleFont, color: theme.textPrimary }}
              >
                {displayName}
              </h4>
              {fullName && fullName !== displayName && (
                <p className="truncate text-[11px]" style={{ color: theme.textMuted }}>
                  {fullName}
                </p>
              )}
            </div>
          </div>

          <div
            className="mt-4 border-t pt-3 text-left text-xs leading-relaxed"
            style={{ borderColor: theme.cardBorder, color: theme.textMuted }}
          >
            <p
              className="mb-1 font-semibold tracking-wider uppercase"
              style={{ color: theme.accent }}
            >
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
              className="inline-flex cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.14em] uppercase transition-opacity hover:opacity-90"
              style={{
                borderColor: theme.accent,
                color: theme.accent,
                backgroundColor: "rgba(0,0,0,0.35)",
              }}
            >
              <RotateCw className="h-3 w-3" aria-hidden="true" />
              <span>Lật thẻ {badge}</span>
            </button>
          </div>
        </div>

        {/* Mặt sau */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-xl border p-5 text-center shadow-[0_12px_28px_rgba(0,0,0,0.85)]"
          style={{
            backgroundColor: theme.surfaceBg,
            borderColor: theme.accent,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-2.5 rounded-lg border border-dashed opacity-45"
            style={{ borderColor: theme.accent }}
          />
          <div
            className="relative z-10 flex w-full items-center justify-between text-[10px] font-extrabold uppercase tracking-[0.2em]"
            style={{ fontFamily: monoFont, color: theme.accent }}
          >
            <span>{badge}</span>
            <span>LỜI NHẮN GỬI</span>
            <span>{badge}</span>
          </div>

          <div className="relative z-10 my-2 space-y-2 px-2">
            <p
              className="text-lg font-bold"
              style={{ fontFamily: titleFont, color: theme.accentLight }}
            >
              {fullName || displayName}
            </p>
            <p
              className="text-xs italic leading-relaxed"
              style={{ color: theme.textPrimary }}
            >
              “{backQuote}”
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              playInteractionSfx("card-flip");
              setFlipped(false);
            }}
            className="relative z-10 inline-flex cursor-pointer touch-manipulation items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] font-bold tracking-[0.14em] uppercase transition-opacity hover:opacity-90"
            style={{
              borderColor: theme.accent,
              color: theme.accent,
              backgroundColor: "rgba(0,0,0,0.55)",
            }}
          >
            <RotateCw className="h-3 w-3" aria-hidden="true" />
            <span>Quay lại mặt trước</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function HkCharacterFlipCards({
  theme,
  data,
  groomPhotoFallback,
  bridePhotoFallback,
  groomBadge = "NAM CHÍNH",
  brideBadge = "NỮ CHÍNH",
}: {
  theme: HkStandardTheme;
  data: TemplateData;
  groomPhotoFallback: string;
  bridePhotoFallback: string;
  groomBadge?: string;
  brideBadge?: string;
}) {
  const hidePhoto = Boolean(data.hideCouplePhotos);
  const hostFirst = data.hostFirst ?? "groom";
  const splitParents = (raw?: string | null) =>
    raw
      ? raw
        .split("&")
        .map((s) => s.trim().replace(/^thân sinh:\s*/i, ""))
        .filter(Boolean)
      : [];

  const groomParents = splitParents(data.couple.groomParents);
  const brideParents = splitParents(data.couple.brideParents);

  const sides = hostFirst === "bride" ? (["bride", "groom"] as const) : (["groom", "bride"] as const);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {sides.map((side) =>
        side === "groom" ? (
          <SingleFlipCard
            key="groom"
            theme={theme}
            badge={groomBadge}
            roleLabel={data.castDossier?.groomRole || data.couple.groomTitle || "TRƯỞNG NAM"}
            displayName={data.couple.groomName}
            fullName={data.couple.groomFullName || data.couple.groomName}
            photoUrl={data.photos?.groomUrl || groomPhotoFallback}
            hidePhoto={hidePhoto}
            familyHeading="NHÀ TRAI"
            parentsList={groomParents}
            backQuote={
              data.castDossier?.groomQuote ||
              `Hạnh phúc lớn nhất của ${data.couple.groomName} là được nắm tay ${data.couple.brideName} bước vào chương mới của cuộc đời.`
            }
          />
        ) : (
          <SingleFlipCard
            key="bride"
            theme={theme}
            badge={brideBadge}
            roleLabel={data.castDossier?.brideRole || data.couple.brideTitle || "ÁI NỮ"}
            displayName={data.couple.brideName}
            fullName={data.couple.brideFullName || data.couple.brideName}
            photoUrl={data.photos?.brideUrl || bridePhotoFallback}
            hidePhoto={hidePhoto}
            familyHeading="NHÀ GÁI"
            parentsList={brideParents}
            backQuote={
              data.castDossier?.brideQuote ||
              `Cảm ơn mọi người đã luôn thương yêu và có mặt trong đêm tiệc đáng nhớ nhất của ${data.couple.brideName} & ${data.couple.groomName}.`
            }
          />
        ),
      )}
    </div>
  );
}

/* ============================================================
   3. CHUYỆN CHÚNG MÌNH KIỂU CUỘN PHIM 35MM (story)
   ============================================================ */
export function HkFilmStorySection({
  theme,
  data,
  heading = "CHUYỆN CHÚNG MÌNH",
  eyebrow = "",
}: {
  theme: HkStandardTheme;
  data: TemplateData;
  galleryPhotos?: TemplatePhotoItem[];
  heading?: string;
  eyebrow?: string;
  onPhotoClick?: (index: number) => void;
}) {
  const storyItems = getHkStoryItems(data);
  if (storyItems.length === 0) return null;

  const titleFont = theme.titleFont ?? DEFAULT_TITLE_FONT;
  const monoFont = theme.monoFont ?? DEFAULT_MONO_FONT;

  return (
    <div className="space-y-5">
      <div className="text-center">
        {eyebrow && (
          <span
            className="inline-block text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase"
            style={{ fontFamily: monoFont, color: theme.accent }}
          >
            {eyebrow}
          </span>
        )}
        <h3
          className="text-2xl font-bold uppercase tracking-wider"
          style={{ fontFamily: titleFont, color: theme.textPrimary }}
        >
          {heading}
        </h3>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border px-6 py-5 shadow-[0_14px_32px_rgba(0,0,0,0.8)]"
        style={{
          borderColor: theme.cardBorder,
          backgroundColor: theme.surfaceBg,
        }}
      >
        {/* Lỗ phim 35mm hai bên */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-3 left-1.5 flex w-2.5 flex-col justify-between"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="h-2.5 w-2 rounded-[2px] border bg-[#050606]"
              style={{ borderColor: theme.cardBorder }}
            />
          ))}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-3 right-1.5 flex w-2.5 flex-col justify-between"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="h-2.5 w-2 rounded-[2px] border bg-[#050606]"
              style={{ borderColor: theme.cardBorder }}
            />
          ))}
        </div>

        <div className="space-y-4">
          {storyItems.map((milestone, idx) => {
            const milestonePhoto = milestone.imageUrl?.trim();
            return (
              <div
                key={milestone.id || idx}
                className="rounded-xl border p-4"
                style={{
                  borderColor: theme.cardBorder,
                  backgroundColor: theme.cardBg,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-[0.18em] text-white"
                    style={{ fontFamily: monoFont, backgroundColor: theme.crimson }}
                  >
                    {milestone.year || `202${idx + 3}`}
                  </span>
                  <span
                    className="text-[10px] font-bold tracking-[0.22em]"
                    style={{ fontFamily: monoFont, color: theme.accent }}
                  >
                    CHƯƠNG {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                <h4
                  className="mt-2.5 text-base font-bold"
                  style={{ fontFamily: titleFont, color: theme.accentLight }}
                >
                  {milestone.title}
                </h4>

                {milestone.content && (
                  <p
                    className="mt-1.5 text-xs leading-relaxed"
                    style={{ color: theme.textMuted }}
                  >
                    {milestone.content}
                  </p>
                )}

                {milestonePhoto && (
                  <div
                    className="mt-3 block w-full overflow-hidden rounded-lg border bg-[#0B0D0E] text-left"
                    style={{ borderColor: theme.cardBorder }}
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={milestonePhoto}
                        alt={milestone.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   4. KỊCH BẢN ĐÊM TIỆC — CUE SHEET ĐIỆN ẢNH (timeline)
   ============================================================ */
export function HkCueSheetTimeline({
  theme,
  data,
}: {
  theme: HkStandardTheme;
  data: TemplateData;
}) {
  const items = getHkTimelineItems(data);
  if (items.length === 0) return null;
  const monoFont = theme.monoFont ?? DEFAULT_MONO_FONT;

  return (
    <div
      className="mt-6 rounded-2xl border p-5 text-left shadow-[0_12px_28px_rgba(0,0,0,0.75)]"
      style={{
        borderColor: theme.cardBorder,
        backgroundColor: theme.cardBg,
      }}
    >
      <div
        className="mb-4 flex items-center justify-between border-b pb-3"
        style={{ borderColor: theme.cardBorder }}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" style={{ color: theme.accent }} aria-hidden="true" />
          <span
            className="text-[11px] font-bold tracking-[0.2em] uppercase"
            style={{ fontFamily: monoFont, color: theme.accent }}
          >
            LỊCH TRÌNH ĐÊM TIỆC
          </span>
        </div>
      </div>

      <ol className="relative space-y-3.5 pl-5">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-2 bottom-2 left-[7px] w-px opacity-50"
          style={{ backgroundColor: theme.accent }}
        />
        {items.map((item, idx) => (
          <li key={item.id || idx} className="relative flex items-baseline gap-3">
            <span
              aria-hidden="true"
              className="absolute -left-5 top-1.5 h-3.5 w-3.5 rounded-full border-2"
              style={{ borderColor: theme.accent, backgroundColor: theme.crimson }}
            />
            <span
              className="w-12 shrink-0 text-xs font-bold"
              style={{ fontFamily: monoFont, color: theme.accentLight }}
            >
              {item.time || "--:--"}
            </span>
            <div className="min-w-0 flex-1">
              <span
                className="text-xs sm:text-sm font-medium"
                style={{ color: theme.textPrimary }}
              >
                {item.label}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ============================================================
   5. DẢI FILM STRIP 35MM CUỘN NGANG CHO ẢNH #6..#30+ (Standard)
   ============================================================ */
export function HkExtendedFilmStrip({
  theme,
  photos,
  startIndex = 5,
  onPhotoClick,
}: {
  theme: HkStandardTheme;
  photos: TemplatePhotoItem[];
  startIndex?: number;
  onPhotoClick: (realIndex: number) => void;
}) {
  if (photos.length <= startIndex) return null;
  const monoFont = theme.monoFont ?? DEFAULT_MONO_FONT;
  const rest = photos.slice(startIndex);

  return (
    <div className="space-y-2 pt-3">
      <div className="flex items-center justify-between px-1">
        <span
          className="text-[10px] font-bold tracking-[0.2em] uppercase"
          style={{ fontFamily: monoFont, color: theme.accent }}
        >
          ALBUM MỞ RỘNG ({rest.length} ẢNH)
        </span>
        <span className="text-[10px]" style={{ color: theme.textMuted }}>
          Vuốt ngang →
        </span>
      </div>
      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto rounded-xl border p-3"
        style={{ borderColor: theme.cardBorder, backgroundColor: theme.surfaceBg }}
      >
        {rest.map((photo, offsetIdx) => {
          const realIdx = offsetIdx + startIndex;
          return (
            <button
              key={photo.id || realIdx}
              type="button"
              onClick={() => onPhotoClick(realIdx)}
              className="group relative aspect-[3/4] w-36 shrink-0 snap-start cursor-pointer overflow-hidden rounded-lg border bg-[#0B0D0E] transition-all"
              style={{ borderColor: theme.cardBorder }}
            >
              <img
                loading="lazy"
                decoding="async"
                src={photo.url}
                alt={photo.alt || `Khoảnh khắc #${realIdx + 1}`}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
