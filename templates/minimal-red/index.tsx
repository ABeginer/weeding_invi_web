"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { m, useReducedMotion } from "motion/react"; import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingEvent } from "@/lib/wedding-types";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   Minimal Red - mẫu "Hoàng Kim Đỏ" (minimal)
   Mã màu khách đưa (color_code.md):
     main theme #390102 · text #390102 · button #e1bc7c
   Trên nền đỏ, chữ dùng vàng #e1bc7c; chữ #390102 chỉ dùng trên nút/nền sáng.
   Font: Cormorant italic cho tên (có dấu tiếng Việt), Playfair cho tiêu đề, Lora nội dung.
   ============================================================ */

const RED = "#390102";
const RED_DEEP = "#2C0102";
const BG_DARK = "#1E0101";
const CREAM = "#FBF3E6";
const ON_RED = "#F2E2C4";
const GOLD = "#E1BC7C";
const GOLD_DEEP = "#C29A5B";
const GOLD_SOFT = "rgba(225, 188, 124, 0.36)";
const INK = "#E9D4AE";
const MUTED = "#B89667";

const SERIF = "var(--font-playfair), Georgia, serif";
/** Tên cô dâu chú rể: chữ nghiêng mềm, có dấu tiếng Việt. */
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
/** Nội dung: Lora. */
const BODY = "var(--font-lora), Georgia, serif";

const EASE = [0.16, 1, 0.3, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "17:30", label: "Đón khách" },
  { time: "18:30", label: "Khai tiệc" },
  { time: "18:45", label: "Rót rượu, cắt bánh" },
  { time: "19:00", label: "Phục vụ món chính" },
  { time: "21:00", label: "Kết thúc tiệc" },
];

const DEFAULT_DRESS = ["#4A1214", "#7C3438", "#E9C9C9"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time.trim() || item.label.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

function eventStart(event: WeddingEvent | undefined, fallback: string): string {
  return event?.startsAt ?? fallback;
}

/**
 * Tiếng "ting" khi mở thiệp — tổng hợp bằng Web Audio nên không cần thêm asset
 * và không phụ thuộc mạng. Nếu trình duyệt chặn audio thì bỏ qua im lặng.
 */
function playOpenChime() {
  playOpenCardSound();
}

/* ------------------------------------------------------------
   Ảnh vòm (arch) — khung ảnh chính của thiệp
   ------------------------------------------------------------ */
/* ------------------------------------------------------------
   Dải tiêu đề đỏ
   ------------------------------------------------------------ */
function GoldTitle({ children, as: Tag = "h2" }: { children: React.ReactNode; as?: "h2" | "h3" }) {
  // Gạch trang trí đặt TRÊN/DƯỚI thay vì hai bên: khung preview 390px trên
  // desktop vẫn có viewport rộng nên breakpoint `sm:` sẽ bật gạch hai bên và
  // làm tiêu đề xuống dòng (card_exp §22.22).
  return (
    <div className="px-4 py-3 text-center">
      <span
        aria-hidden="true"
        className="mx-auto mb-2 block h-px w-12"
        style={{ backgroundColor: GOLD_SOFT }}
      />
      <Tag
        className="text-[11px] font-semibold uppercase tracking-[0.24em] sm:text-[12px] sm:tracking-[0.28em]"
        style={{ color: GOLD }}
      >
        {children}
      </Tag>
      <span
        aria-hidden="true"
        className="mx-auto mt-2 block h-px w-12"
        style={{ backgroundColor: GOLD_SOFT }}
      />
    </div>
  );
}

/* ------------------------------------------------------------
   Hoa văn góc — 4 góc của khung chỉ vàng
   ------------------------------------------------------------ */
function GoldCorners({ color = GOLD }: { color?: string }) {
  const base = "pointer-events-none absolute h-3 w-3";
  return (
    <>
      <span className={cn(base, "left-1.5 top-1.5")} style={{ borderLeft: `1px solid ${color}`, borderTop: `1px solid ${color}` }} />
      <span className={cn(base, "right-1.5 top-1.5")} style={{ borderRight: `1px solid ${color}`, borderTop: `1px solid ${color}` }} />
      <span className={cn(base, "left-1.5 bottom-1.5")} style={{ borderLeft: `1px solid ${color}`, borderBottom: `1px solid ${color}` }} />
      <span className={cn(base, "right-1.5 bottom-1.5")} style={{ borderRight: `1px solid ${color}`, borderBottom: `1px solid ${color}` }} />
    </>
  );
}

/* ------------------------------------------------------------
   Fade-in Up khi cuộn tới (theo animation_guide: một hiệu ứng duy nhất,
   chạy một lần rồi đứng yên — không có chuyển động nền).
   ------------------------------------------------------------ */
function SectionReveal({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <m.div
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.75, ease: EASE }}
    >
      {children}
    </m.div>
  );
}

/* ------------------------------------------------------------
   Bìa: hai cánh cửa đỏ trượt sang hai bên
   ------------------------------------------------------------ */
function Cover({
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
}) {
  const reduce = useReducedMotion();
  const visibleEvents = getVisibleEvents(data);
  const primary = getNearestUpcomingEvent(visibleEvents, data.date);
  const date = formatWeddingDateParts(eventStart(primary, data.date));

  // 12 ngôi sao 4 cánh rải ở hậu cảnh (theo mô tả)
  const stars = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        id: index,
        left: 5 + ((index * 41) % 90),
        top: 6 + ((index * 57) % 84),
        size: 7 + ((index * 5) % 9),
        delay: (index % 6) * 0.8,
        duration: 4 + (index % 4),
      })),
    [],
  );

  return (
    <m.div
      className={cn("z-50 overflow-hidden", contained ? "absolute inset-0" : "fixed inset-0")}
      style={{ backgroundColor: BG_DARK }}
      animate={closing ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.9, delay: closing ? 0.55 : 0, ease: "easeInOut" }}
    >
      {/* hai cánh cửa son */}
      <m.div
        className="absolute inset-y-0 left-0 w-1/2"
        style={{ background: `linear-gradient(90deg, ${BG_DARK}, ${RED})` }}
        animate={closing ? { x: reduce ? 0 : "-101%" } : { x: 0 }}
        transition={{ duration: reduce ? 0.01 : 1.05, ease: [0.32, 0.72, 0, 1] }}
      />
      <m.div
        className="absolute inset-y-0 right-0 w-1/2"
        style={{ background: `linear-gradient(270deg, ${BG_DARK}, ${RED})` }}
        animate={closing ? { x: reduce ? 0 : "101%" } : { x: 0 }}
        transition={{ duration: reduce ? 0.01 : 1.05, ease: [0.32, 0.72, 0, 1] }}
        onAnimationComplete={() => {
          if (closing) onDoorsClosed();
        }}
      />

      {/* hạt bụi kim tuyến trôi nhẹ */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {stars.map((star) => (
          <m.span
            key={star.id}
            className="absolute rounded-full"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: Math.max(2, Math.round(star.size / 4)),
              height: Math.max(2, Math.round(star.size / 4)),
              backgroundColor: GOLD,
            }}
            animate={reduce ? undefined : { opacity: [0.2, 0.75, 0.2], scale: [0.92, 1.05, 0.92] }}
            transition={reduce ? undefined : { duration: star.duration, repeat: Infinity, delay: star.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

      {/* khung chỉ vàng kép (dùng border để nét không bị méo theo tỷ lệ) */}
      <m.div
        className="pointer-events-none absolute inset-3"
        style={{ border: `1px solid ${GOLD}` }}
        initial={reduce ? false : { opacity: 0, scale: 0.985 }}
        animate={{ opacity: 0.9, scale: 1 }}
        transition={{ duration: 1.4, delay: 0.35, ease: EASE }}
      />
      <m.div
        className="pointer-events-none absolute inset-[18px]"
        style={{ border: `1px solid ${GOLD_SOFT}` }}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.6 }}
      />

      {!closing && (
        <button
          type="button"
          onClick={onOpen}
          aria-label={`${data.ui.tapHint} - ${data.ui.invitePrefix} ${guestName}`}
          className="absolute inset-0 z-40 cursor-pointer focus-visible:outline-none"
        />
      )}

      <div
        className="absolute inset-0 z-30 w-full max-w-full overflow-hidden flex flex-col items-center justify-center px-4"
      >
        <m.div
          className="relative w-full max-w-[328px] sm:max-w-[380px] mx-auto text-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={closing ? { opacity: 0, scale: reduce ? 1 : 0.97 } : { opacity: 1, scale: 1 }}
          transition={{ duration: closing ? 0.45 : 0.9, ease: EASE }}
        >
          {/* cụm hoa vàng trên đỉnh */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/templates/minimal-red/ornament.webp"
            alt=""
            aria-hidden="true"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="mx-auto mb-1 w-full max-w-[280px] opacity-95"
          />

          <p
            className="minred-wipe mt-1 text-[9px] uppercase tracking-[0.34em]"
            style={{ color: MUTED, animationDelay: "0.5s" }}
          >
            The wedding of
          </p>

          <h1 className="mt-4" style={{ fontFamily: NAME_FONT, color: GOLD }}>
            <span className="minred-wipe block text-[34px] italic leading-tight" style={{ animationDelay: "0.7s" }}>
              {data.couple.groomName}
            </span>
            <span className="my-1 block text-[16px]" style={{ fontFamily: SERIF, color: GOLD_DEEP }}>
              &amp;
            </span>
            <span className="minred-wipe block text-[34px] italic leading-tight" style={{ animationDelay: "0.95s" }}>
              {data.couple.brideName}
            </span>
          </h1>

          <div className="mx-auto mt-4 flex items-center justify-center gap-3" aria-hidden="true">
            <span className="h-px w-12" style={{ backgroundColor: GOLD_SOFT }} />
            <span className="text-[10px]" style={{ color: GOLD }}>❦</span>
            <span className="h-px w-12" style={{ backgroundColor: GOLD_SOFT }} />
          </div>

          <p className="mt-3 text-[15px]" style={{ fontFamily: BODY, color: ON_RED }}>
            {date.dotDate}
          </p>

          {/* khối cá nhân hoá khách mời */}
          <div className="mt-6">
            <p className="text-[9px] uppercase tracking-[0.3em]" style={{ color: MUTED }}>
              Thân mời
            </p>
            <p
              className="mx-auto mt-1.5 max-w-full truncate px-2 text-[22px] font-semibold tracking-[0.04em]"
              style={{ fontFamily: SERIF, color: GOLD }}
            >
              {guestName || data.ui.defaultGuestName}
            </p>
            <p className="mt-1 text-[10px] italic" style={{ color: MUTED }}>
              Đến dự buổi tiệc chung vui cùng chúng em
            </p>
          </div>

          {/* dấu triện sáp vàng */}
          <button
            type="button"
            onClick={onOpen}
            className="group relative mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 hover:scale-[1.06] active:scale-95"
            style={{
              background: `radial-gradient(circle at 35% 30%, #F4DFB6, ${GOLD} 55%, ${GOLD_DEEP})`,
              boxShadow: `0 0 0 6px rgba(225,188,124,0.16), 0 10px 26px rgba(0,0,0,0.45)`,
            }}
            aria-label="Mở thiệp"
          >
            <span className="text-[18px] font-serif" style={{ color: RED_DEEP }} aria-hidden="true">囍</span>
          </button>
          <p className="mt-2 text-[10px] uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Mở thiệp
          </p>
        </m.div>
      </div>
    </m.div>
  );
}

/* ------------------------------------------------------------
   Hero: tối giản, KHÔNG ảnh — chỉ tên, ngày, khách mời
   ------------------------------------------------------------ */
function Hero({ data, guestName }: { data: TemplateData; guestName: string }) {
  const visibleEvents = getVisibleEvents(data);
  const primary = getNearestUpcomingEvent(visibleEvents, data.date);
  const date = formatWeddingDateParts(eventStart(primary, data.date));

  return (
    <section className="px-5 pt-12 pb-8 text-center">
      <p className="text-[9px] uppercase tracking-[0.34em]" style={{ color: GOLD }}>
        {data.ui.eyebrow || "Welcome to our wedding"}
      </p>

      <h1 className="mt-4" style={{ fontFamily: NAME_FONT, color: GOLD }}>
        <span className="block text-[32px] italic leading-tight break-words">
          {data.couple.groomName}
        </span>
        <span className="my-1 block text-[15px]" style={{ fontFamily: SERIF, color: GOLD_DEEP }}>
          &amp;
        </span>
        <span className="block text-[32px] italic leading-tight break-words">
          {data.couple.brideName}
        </span>
      </h1>

      <div className="mx-auto mt-5 flex items-center justify-center gap-3" aria-hidden="true">
        <span className="h-px w-14" style={{ backgroundColor: GOLD_SOFT }} />
        <span className="text-[11px]" style={{ color: GOLD }}>❦</span>
        <span className="h-px w-14" style={{ backgroundColor: GOLD_SOFT }} />
      </div>

      <p className="mt-4 text-[15px]" style={{ fontFamily: BODY, color: ON_RED }}>
        {date.dotDate}
      </p>

      {guestName && (
        <p
          className="mx-auto mt-4 inline-block max-w-full truncate rounded-full px-4 py-1 text-[11px]"
          style={{ border: `1px solid ${GOLD_SOFT}`, color: ON_RED }}
        >
          {data.ui.invitePrefix}: <strong className="font-semibold">{guestName}</strong>
        </p>
      )}
    </section>
  );
}

/** Tách "Ông A & Bà B" thành 2 dòng để dấu & luôn mở đầu dòng dưới. */
function ParentsLine({ text }: { text: string }) {
  const value = (text ?? "").trim();
  if (!value) {
    return <span style={{ color: MUTED }}>—</span>;
  }
  const [first, ...rest] = value.split(/\s*&\s*/);
  if (rest.length === 0) {
    return <span className="block break-words">{value}</span>;
  }
  return (
    <>
      <span className="block break-words">{first}</span>
      <span className="block break-words">&amp; {rest.join(" & ")}</span>
    </>
  );
}

/**
 * Thông tin hai họ + tên cô dâu chú rể.
 * Không hiện ngày giờ ở đây nữa — ngày chỉ còn ở "Sự kiện" và "Thông tin tiệc cưới"
 * (tránh lặp 3 lần cùng một ngày).
 */
function FamilySection({ data }: { data: TemplateData }) {
  // "Nhà xuất hiện trước" trong dashboard: bride → nhà gái đứng bên trái.
  const hostFirst = data.hostFirst ?? "groom";
  const leftParents =
    hostFirst === "bride" ? data.couple.brideParents : data.couple.groomParents;
  const rightParents =
    hostFirst === "bride" ? data.couple.groomParents : data.couple.brideParents;
  const leftLabel = hostFirst === "bride" ? "Nhà gái" : "Nhà trai";
  const rightLabel = hostFirst === "bride" ? "Nhà trai" : "Nhà gái";

  return (
    <section className="px-4 py-6" style={{ backgroundColor: "transparent" }}>
      <div className="mx-auto max-w-[560px]">
        <GoldTitle>Thông tin gia đình</GoldTitle>

        <div className="mt-6 grid grid-cols-2 gap-0">
          <div className="min-w-0 px-3 text-center">
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>
              {leftLabel}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: INK }}>
              <ParentsLine text={leftParents} />
            </p>
          </div>
          <div className="min-w-0 border-l px-3 text-center" style={{ borderColor: GOLD_SOFT }}>
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: MUTED }}>
              {rightLabel}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: INK }}>
              <ParentsLine text={rightParents} />
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[12px] uppercase tracking-[0.14em]" style={{ color: GOLD }}>
            Trân trọng báo tin lễ thành hôn của con chúng tôi
          </p>

          <h2 className="mt-4 break-words text-[30px] leading-[1.15]" style={{ fontFamily: NAME_FONT, fontStyle: "italic", color: GOLD }}>
            {data.couple.groomFullName || data.couple.groomName}
          </h2>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: MUTED }}>
            {data.couple.groomTitle || "Chú rể"}
          </p>

          <p className="my-2 text-lg" style={{ fontFamily: NAME_FONT, color: GOLD_DEEP }}>
            &amp;
          </p>

          <h2 className="break-words text-[30px] leading-[1.15]" style={{ fontFamily: NAME_FONT, fontStyle: "italic", color: GOLD }}>
            {data.couple.brideFullName || data.couple.brideName}
          </h2>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: MUTED }}>
            {data.couple.brideTitle || "Cô dâu"}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Sự kiện — mỗi lễ một thẻ, theo theme đỏ/vàng
   ------------------------------------------------------------ */
function EventsSection({ data }: { data: TemplateData }) {
  const visibleEvents = getVisibleEvents(data);
  if (visibleEvents.length === 0) return null;

  return (
    <section className="px-4 py-6" style={{ backgroundColor: "transparent" }}>
      <div className="mx-auto max-w-[560px]">
        <GoldTitle>Sự kiện</GoldTitle>

        <div className={cn("mt-5", visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4")}>
          {visibleEvents.map((event, idx) => {
            const date = formatWeddingDateParts(event.startsAt);
            const directionsUrl = getEventDirectionsUrl(event);
            return (
              <article
                key={event.id || `event-${idx}`}
                className="relative px-5 py-5 text-center"
                style={{ border: `1px solid ${GOLD}`, borderRadius: 12, backgroundColor: "rgba(96,14,14,0.55)" }}
              >
                <GoldCorners />
                <h3
                  className="text-[12px] font-semibold uppercase tracking-[0.18em]"
                  style={{ color: GOLD }}
                >
                  {event.title}
                </h3>

                <p className="mt-3 text-[22px]" style={{ fontFamily: SERIF, color: GOLD }}>
                  {date.time}
                </p>

                <div className="mt-1 flex items-center justify-center gap-2 text-[12px]" style={{ color: INK }}>
                  <span className="capitalize">{date.weekday}</span>
                  <span aria-hidden="true">·</span>
                  <span>{date.dotDate}</span>
                </div>

                {event.lunarDate && (
                  <p className="mt-1 text-[11px]" style={{ color: MUTED }}>
                    (Tức ngày {formatLunarDateClean(event.lunarDate)})
                  </p>
                )}

                <p className="mt-3 text-[14px] font-semibold" style={{ color: INK }}>
                  {event.venueName}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: MUTED }}>
                  {event.venueAddress}
                </p>

                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex h-9 items-center justify-center rounded-full px-5 text-[12px] font-medium"
                    style={{ border: `1px solid ${GOLD}`, color: GOLD, backgroundColor: "rgba(233,206,145,0.08)" }}
                  >
                    {data.ui.directionsButtonLabel || "Chỉ đường"}
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Lịch tháng có trái tim ở ngày cưới
   ------------------------------------------------------------ */
function MonthGrid({ iso, eventDays }: { iso: string; eventDays?: Set<number> }) {
  const reduce = useReducedMotion();
  const cells = React.useMemo(() => {
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return null;
    const vn = new Date(parsed.getTime() + 7 * 3600 * 1000);
    const year = vn.getUTCFullYear();
    const month = vn.getUTCMonth();
    const day = vn.getUTCDate();
    const first = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0 = CN
    const lead = (first + 6) % 7; // tuần bắt đầu thứ 2
    const total = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const list: (number | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= total; d += 1) list.push(d);
    return { year, month, day, list };
  }, [iso]);

  if (!cells) return null;

  return (
    <div className="mt-5 overflow-hidden rounded-xl" style={{ border: `1px solid ${GOLD_SOFT}` }}>
      <div className="py-2 text-center text-[12px] font-semibold" style={{ color: GOLD, backgroundColor: "rgba(233,206,145,0.12)" }}>
        Tháng {cells.month + 1} / {cells.year}
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] uppercase" style={{ color: MUTED }}>
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
          <span key={label} className="py-1.5">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 pb-2 text-center text-[12px]" style={{ color: INK }}>
        {cells.list.map((day, index) => {
          const isWeddingDay = day !== null && (eventDays ? eventDays.has(day) : day === cells.day);
          return (
            <span key={index} className="flex h-7 items-center justify-center">
              {day === null ? null : isWeddingDay ? (
                <m.span
                  className="relative flex h-7 w-7 items-center justify-center"
                  aria-label={`Ngày cưới ${day}`}
                  initial={reduce ? false : { scale: 0.9, filter: "drop-shadow(0 0 0 rgba(233,206,145,0))" }}
                  whileInView={
                    reduce
                      ? undefined
                      : {
                        scale: [0.9, 1.1, 1],
                        filter: [
                          "drop-shadow(0 0 0 rgba(233,206,145,0))",
                          "drop-shadow(0 0 10px rgba(233,206,145,0.95))",
                          "drop-shadow(0 0 4px rgba(233,206,145,0.45))",
                        ],
                      }
                  }
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 1.3, ease: "easeOut" }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="absolute inset-0 h-full w-full"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 21.2c-.3 0-.6-.1-.9-.3C7.5 18.4 2 14.2 2 8.9 2 5.6 4.4 3.4 7.3 3.4c1.8 0 3.4 1 4.7 2.6 1.3-1.6 2.9-2.6 4.7-2.6C19.6 3.4 22 5.6 22 8.9c0 5.3-5.5 9.5-9.1 12-.3.2-.6.3-.9.3Z"
                      fill={GOLD}
                    />
                  </svg>
                  <span className="relative mt-[2px] text-[10px] font-semibold" style={{ color: RED_DEEP }}>
                    {day}
                  </span>
                </m.span>
              ) : (
                day
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Thông tin tiệc + CTA xác nhận
   ------------------------------------------------------------ */
function PartySection({ data }: { data: TemplateData }) {
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const iso = eventStart(targetEvent, data.date);
  const date = formatWeddingDateParts(iso);

  const eventDays = React.useMemo(() => {
    const set = new Set<number>();
    visibleEvents.forEach((evt) => {
      const dStr = evt.startsAt || data.date;
      if (!dStr) return;
      const d = new Date(dStr);
      set.add(d.getDate());
    });
    return set;
  }, [visibleEvents, data.date]);

  const calendarUrl = React.useMemo(() => {
    const start = new Date(iso);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start.getTime() + 3 * 3600 * 1000);
    const fmt = (value: Date) => value.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `Tiệc cưới ${data.couple.groomName} & ${data.couple.brideName}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      location: targetEvent ? `${targetEvent.venueName}, ${targetEvent.venueAddress}` : "",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }, [data.couple.brideName, data.couple.groomName, iso, targetEvent]);

  return (
    <section className="px-4 py-6" style={{ backgroundColor: "transparent" }}>
      <div className="mx-auto max-w-[560px]">
        <GoldTitle>Thông tin tiệc cưới</GoldTitle>

        <div className="mt-6 text-center">
          <p className="text-[12px] uppercase tracking-[0.16em]" style={{ color: GOLD }}>
            {targetEvent?.title || "Tiệc cưới sẽ diễn ra vào lúc"}
          </p>
          <p className="mt-2 text-[24px]" style={{ fontFamily: SERIF, color: GOLD }}>
            {date.time}
          </p>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-[11px] capitalize" style={{ color: INK }}>{date.weekday}</span>
            <span className="h-6 w-px" style={{ backgroundColor: GOLD_SOFT }} />
            <span className="text-[26px] leading-none" style={{ fontFamily: SERIF, color: GOLD }}>{date.day}</span>
            <span className="h-6 w-px" style={{ backgroundColor: GOLD_SOFT }} />
            <span className="text-[11px] uppercase" style={{ color: INK }}>Tháng {date.month}</span>
          </div>
          <p className="mt-1 text-[13px]" style={{ color: INK }}>{date.year}</p>
          {targetEvent?.lunarDate && (
            <p className="mt-1 text-[11px]" style={{ color: MUTED }}>(Tức ngày {formatLunarDateClean(targetEvent.lunarDate)})</p>
          )}
        </div>

        <MonthGrid iso={iso} eventDays={eventDays} />

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {calendarUrl && (
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-full border px-6 text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ borderColor: GOLD, color: GOLD }}
            >
              Thêm vào lịch
            </a>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              const doc = e.currentTarget.ownerDocument;
              const targetEl = doc.getElementById("rsvp") || doc.getElementById("rsvp-wishes") || doc.getElementById("rsvp-section");
              targetEl?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full px-8 text-[12px] font-semibold uppercase tracking-[0.14em] transition-transform hover:scale-[1.02]"
            style={{ backgroundColor: GOLD, color: RED_DEEP }}
          >
            Xác nhận tham dự
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Dress code + Lịch trình ngày cưới (data.timeline — sửa ở dashboard)
   ------------------------------------------------------------ */
function DressAndTimeline({ data }: { data: TemplateData }) {
  const colors = getDressColors(data);
  const timeline = getTimeline(data);

  return (
    <section className="px-4 py-6" style={{ backgroundColor: "transparent" }}>
      <div className="mx-auto max-w-[560px]">
        <GoldTitle>Trang phục</GoldTitle>

        <div className="mt-5 text-center">
          <p className="text-[12px] uppercase tracking-[0.2em]" style={{ color: GOLD }}>
            Dress code
          </p>
          <p className="mt-1 text-[11px]" style={{ color: MUTED }}>Trang phục dự tiệc</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            {colors.map((color) => (
              <span
                key={color}
                className="h-9 w-9 rounded-full"
                style={{ backgroundColor: color, border: `1px solid ${GOLD_SOFT}` }}
                aria-label={`Màu ${color}`}
              />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <GoldTitle>Lịch trình ngày cưới</GoldTitle>

          <ol className="relative mt-5">
            {timeline.map((item, index) => (
              <li key={`${item.time}-${index}`} className="relative flex gap-4 pb-5 last:pb-0">
                <span
                  className="w-12 shrink-0 text-right text-[12px] font-semibold tabular-nums"
                  style={{ color: GOLD }}
                >
                  {item.time}
                </span>
                <span className="relative flex w-3 shrink-0 justify-center">
                  <span
                    className="absolute top-1.5 h-2 w-2 rounded-full"
                    style={{ backgroundColor: RED }}
                  />
                  {index < timeline.length - 1 && (
                    <span
                      className="absolute top-4 bottom-[-20px] w-px"
                      style={{ backgroundColor: GOLD_SOFT }}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="min-w-0 flex-1 pb-1 text-[13px]" style={{ color: INK }}>
                  {item.label}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Album: coverflow 3D + lightbox (phá cách theo thiết kế)
   ------------------------------------------------------------ */
function AlbumGrid({ data }: { data: TemplateData }) {
  const reduce = useReducedMotion();
  const limit = data.plan === "free" ? 5 : 30;
  const photos = data.photos.gallery.slice(0, limit);
  const [lightbox, setLightbox] = React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (lightbox === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") {
        setLightbox((prev) => (prev === null ? prev : (prev + 1) % photos.length));
      }
      if (event.key === "ArrowLeft") {
        setLightbox((prev) =>
          prev === null ? prev : (prev - 1 + photos.length) % photos.length,
        );
      }
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [lightbox, photos.length]);

  if (photos.length === 0) return null;

  return (
    <section className="px-4 py-6">
      <div className="mx-auto max-w-[560px]">
        <GoldTitle>Album ảnh</GoldTitle>

        {/* Lưới editorial: cứ 3 ảnh thì 1 ảnh ngang lớn + 2 ảnh dọc, xen kẽ. */}
        <div className="mt-4 grid grid-cols-2 gap-2" style={{ perspective: "900px" }}>
          {photos.map((photo, index) => {
            const wide = index % 3 === 0;
            return (
              <m.button
                key={photo.id}
                type="button"
                onClick={() => setLightbox(index)}
                aria-label={`Xem ảnh ${index + 1}`}
                className={cn(
                  "group relative overflow-hidden rounded-md",
                  wide ? "col-span-2 aspect-[3/2]" : "col-span-1 aspect-[3/4]",
                )}
                style={{ border: `1px solid ${GOLD_SOFT}`, backgroundColor: "#3A0807" }}
                initial={reduce ? false : { opacity: 0, y: 24 }}
                whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: EASE, delay: (index % 3) * 0.15 }}
                whileHover={reduce ? undefined : { scale: 1.015, rotateX: 1.4, rotateY: -1.4 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.alt}
                  className="h-full w-full object-cover"
                  loading={index < 3 ? "eager" : "lazy"}
                  decoding="async"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ boxShadow: `inset 0 0 0 1px ${GOLD}` }}
                />
              </m.button>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>
          Chạm vào ảnh để phóng to
        </p>
      </div>

      {mounted && lightbox !== null && photos[lightbox] && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Ảnh cưới"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Đóng"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[lightbox].url}
            alt={photos[lightbox].alt}
            className="max-h-[86vh] max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
          {photos.length > 1 && (
            <div
              className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() =>
                  setLightbox((prev) =>
                    prev === null ? prev : (prev - 1 + photos.length) % photos.length,
                  )
                }
                aria-label="Ảnh trước"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setLightbox((prev) => (prev === null ? prev : (prev + 1) % photos.length))
                }
                aria-label="Ảnh sau"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </section>
  );
}

/* ------------------------------------------------------------
   Hộp quà mừng — bấm vào mở popup QR
   ------------------------------------------------------------ */
function GiftBox({ data, onOpen }: { data: TemplateData; onOpen: () => void }) {
  const reduce = useReducedMotion();

  return (
    <section className="px-4 py-6" style={{ backgroundColor: "transparent" }}>
      <div className="mx-auto max-w-[560px] text-center">
        <GoldTitle>Hộp quà mừng</GoldTitle>

        <m.button
          type="button"
          onClick={onOpen}
          className="mx-auto mt-5 block w-[62%] max-w-[240px] cursor-pointer focus-visible:outline-none"
          whileHover={reduce ? undefined : { scale: 1.03 }}
          whileTap={reduce ? undefined : { scale: 0.98 }}
          aria-label="Mở hộp quà mừng"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/templates/minimal-red/envelope.webp"
            alt="Hộp quà mừng cưới"
            width={760}
            height={760}
            className="h-auto w-full"
            loading="lazy"
            decoding="async"
          />
        </m.button>

        <p className="mt-2 text-[11px]" style={{ color: MUTED }}>
          Nhấn để mở
        </p>

        <p className="mx-auto mt-5 max-w-[420px] text-[13px] leading-relaxed" style={{ color: INK }}>
          {data.ui.thankYouBody ||
            "Gia đình xin chân thành cảm ơn quý khách đã đến chung vui."}
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------
   Template
   ------------------------------------------------------------ */
export default function DoTruyenThongTemplate({
  data,
  mode,
  contained = false,
  viewport = "phone",
  isOpened = false,
  onOpenedChange,
  externalMusicControl,
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
  const [opened, setOpened] = React.useState(isOpened);
  const [coverGone, setCoverGone] = React.useState(isOpened);
  const [closing, setClosing] = React.useState(false);
  const [giftOpen, setGiftOpen] = React.useState(false);

  const isReadOnlyPreview = mode === "demo" || mode === "preview";
  const resolvedMusicControl = externalMusicControl ?? isReadOnlyPreview;
  const displayGuest =
    guestName && guestName.trim().length > 0
      ? guestName.trim()
      : data.ui.defaultGuestName;

  const hidden = new Set(data.hiddenSections ?? []);
  const order = data.sectionOrder?.length
    ? data.sectionOrder
    : ["family", "map", "calendar", "dresscode", "album", "albumQr", "gift", "rsvp"];
  const orderOf = (key: string) => {
    const index = order.indexOf(key);
    return index < 0 ? 99 : index;
  };

  // Bìa khoá cuộn trang (animation_guide: màn hình bìa khoá chặt thao tác cuộn).
  React.useEffect(() => {
    if (contained || typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    if (!opened) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [contained, opened]);

  const handleOpen = () => {
    if (closing) return;
    playOpenChime();
    setClosing(true);
    setOpened(true);
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch {}
    // Dự phòng: nếu animation không bắn callback (reduced-motion, tab ẩn)
    // thì vẫn phải gỡ bìa sau khi hiệu ứng mở chạy xong.
    window.setTimeout(() => setCoverGone(true), 1100);
  };

  // Chỉ "đóng bì thư" khi CHA thực sự chuyển từ mở → đóng.
  // Trang công khai không truyền onOpenedChange nên `isOpened` luôn false;
  // nếu reset vô điều kiện thì mỗi lần `closing` đổi, effect sẽ huỷ luôn
  // hiệu ứng mở (mất animation + khoá cuộn — card_exp §22.26).
  const parentOpenedRef = React.useRef(isOpened);

  React.useEffect(() => {
    const wasOpened = parentOpenedRef.current;
    parentOpenedRef.current = isOpened;

    if (isOpened) {
      setOpened(true);
      // Chỉ gỡ bìa ngay khi mở từ bên ngoài; nếu chính thiệp đang chạy
      // hiệu ứng mở thì để animation/timer lo (card_exp §22.21).
      if (!closing) setCoverGone(true);
      return;
    }

    if (!wasOpened) return;

    setClosing(false);
    setOpened(false);
    setCoverGone(false);
  }, [isOpened, closing]);

  return (
    <div
      data-template-id="minimal-red"
      className={cn(
        "relative min-w-0 overflow-x-hidden antialiased",
        contained ? "min-h-full" : "min-h-screen-dvh",
        viewport === "desktop" && !contained && "mx-auto w-full max-w-[820px]",
      )}
      style={{
        backgroundColor: BG_DARK,
        backgroundImage: `radial-gradient(120% 80% at 50% 0%, ${RED} 0%, ${RED_DEEP} 45%, ${BG_DARK} 100%)`,
        color: INK,
        fontFamily: BODY,
      }}
    >
      {!coverGone && (
        <Cover
          data={data}
          guestName={displayGuest}
          closing={closing}
          contained={contained}
          onOpen={handleOpen}
          onDoorsClosed={() => setCoverGone(true)}
        />
      )}

      <m.div
        className="mx-auto w-full"
        initial={false}
        animate={{ scale: closing || coverGone ? 1 : 0.96 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <Hero data={data} guestName={displayGuest} />

        <div className="flex flex-col">
          {!hidden.has("family") && (
            <div style={{ order: orderOf("family") }}>
              <SectionReveal><FamilySection data={data} /></SectionReveal>
            </div>
          )}

          {!hidden.has("map") && (
            <div style={{ order: orderOf("map") }}>
              <SectionReveal><EventsSection data={data} /></SectionReveal>
            </div>
          )}
          {!hidden.has("calendar") && (
            <div style={{ order: orderOf("calendar") }}>
              <SectionReveal><PartySection data={data} /></SectionReveal>
            </div>
          )}

          {!hidden.has("dresscode") && (
            <div style={{ order: orderOf("dresscode") }}>
              <SectionReveal><DressAndTimeline data={data} /></SectionReveal>
            </div>
          )}

          {!hidden.has("album") && (
            <div style={{ order: orderOf("album") }}>
              <SectionReveal><AlbumGrid data={data} /></SectionReveal>
            </div>
          )}

          {/* QR album: chỉ gói Pro/VIP, và chủ thiệp có thể tắt trong dashboard. */}
          {data.plan !== "free" && data.weddingSlug && !hidden.has("albumQr") && (
            <div style={{ order: orderOf("albumQr") }}>
              <SectionReveal>
                <GuestAlbumQr
                  slug={data.weddingSlug}
                  accentColor={RED}
                  textColor={INK}
                  mutedColor={MUTED}
                />
              </SectionReveal>
            </div>
          )}

          {!hidden.has("gift") && (
            <div style={{ order: orderOf("gift") }}>
              <SectionReveal><GiftBox data={data} onOpen={() => setGiftOpen(true)} /></SectionReveal>
            </div>
          )}

          {!hidden.has("rsvp") && (
            <div id="rsvp-wishes" className="scroll-mt-6" style={{ order: orderOf("rsvp") }}>
              <SectionReveal>
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="minred"
                  contained={contained}
                  inviteSlug={inviteSlug}
                  weddingSlug={weddingSlug ?? data.weddingSlug}
                  invitationMode={invitationMode}
                  guestName={displayGuest}
                  initialStatus={initialStatus}
                  initialPlusOnes={initialPlusOnes}
                  initialDiet={initialDiet}
                  initialSongRequest={initialSongRequest}
                  initialRideNeeded={initialRideNeeded}
                />
              </SectionReveal>
            </div>
          )}
        </div>

        <footer className="px-4 pb-10 pt-6 text-center" style={{ backgroundColor: "transparent" }}>
          <p className="text-[22px]" style={{ fontFamily: NAME_FONT, fontStyle: "italic", color: GOLD }}>
            {data.couple.groomName} &amp; {data.couple.brideName}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: MUTED }}>
            {data.ui.thankYouHeading || "Thank you for celebrating with us"}
          </p>
        </footer>
      </m.div>

      {!resolvedMusicControl && data.music && !hidden.has("music") && (
        <LiveMusicFloatingButton
          src={data.music.src}
          title={data.music.title}
          visible={opened}
          tone="minred"
        />
      )}

      <GiftModal
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        gift={data.gift}
        plan={data.plan}
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName ?? null}
        tone="minred"
        wishAnchorId="rsvp-wishes"
      />

      {!reduce && !coverGone && (
        <span className="sr-only" aria-live="polite">
          Thiệp đang đóng, nhấn Mở thiệp để xem nội dung.
        </span>
      )}
    </div>
  );
}
