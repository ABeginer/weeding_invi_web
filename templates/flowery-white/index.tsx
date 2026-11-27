"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { m, useReducedMotion } from "motion/react"; import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { CANONICAL_SECTION_ORDER } from "@/config/template-sections";
import {
  getVisibleEvents,
  getNearestUpcomingEvent,
  getEventDirectionsUrl,
} from "@/lib/events";
import type { TemplateData, WeddingEvent } from "@/lib/wedding-types";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   Flowery White - "Xanh Rêu – Hoa Mộc Lan"
   color_code.md: theme #464e25 · card #fdfaf5 · text #595638
   ============================================================ */

const OLIVE = "#464E25";
const OLIVE_DARK = "#3A411E";
const OLIVE_SOFT = "rgba(70, 78, 37, 0.30)";
const CARD = "#FDFAF5";
const PAGE = "#F6F2E8";
const GOLD_LIGHT = "#C9A96A";
const INK = "#595638";
const MUTED = "#8A8460";

// bí danh giữ nguyên tên cũ để phần thân thiệp không phải sửa
const BROWN = OLIVE;
const BROWN_DEEP = OLIVE_DARK;
const BEIGE = PAGE;
const CREAM = CARD;
const ON_BROWN = CARD;
const GOLD = OLIVE;
const GOLD_DEEP = "#5B6340";
const GOLD_SOFT = OLIVE_SOFT;

const SERIF = "var(--font-playfair), Georgia, serif";
/** Tên cô dâu chú rể: chữ nghiêng mềm. */
const NAME_FONT = "var(--font-playfair), Georgia, serif";
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
      className="relative"
      initial={reduce ? false : { opacity: 0, y: 18 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 0.75, ease: EASE }}
    >
      {/* hoa chìm trang trí cho mọi section */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img loading="lazy" decoding="async"
        src="/templates/flowery-white/corner-b.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -left-12 w-[38%] max-w-[170px] opacity-[0.10]"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img loading="lazy" decoding="async"
        src="/templates/flowery-white/corner-a.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -bottom-10 w-[34%] max-w-[150px] -scale-x-100 opacity-[0.10]"
      />
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

  const bokeh = React.useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        id: index,
        left: 3 + ((index * 43) % 94),
        top: (index * 37) % 92,
        size: 3 + ((index * 7) % 12),
        delay: (index % 8) * 1.2,
        duration: 7 + (index % 6),
      })),
    [],
  );

  return (
    <m.div
      className={cn("z-50 overflow-hidden", contained ? "absolute inset-0" : "fixed inset-0")}
      style={{
        backgroundColor: OLIVE_DARK,
        backgroundImage: `radial-gradient(120% 85% at 50% 42%, #4d5729 0%, ${OLIVE_DARK} 62%, #353c1c 100%)`,
      }}
      animate={closing ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.7, delay: closing ? 0.5 : 0, ease: "easeInOut" }}
      onAnimationComplete={() => {
        if (closing) onDoorsClosed();
      }}
    >
      {/* bokeh v\u00e0ng kim */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {bokeh.map((dot) => (
          <m.span
            key={dot.id}
            className="absolute rounded-full"
            style={{
              left: `${dot.left}%`,
              top: `${dot.top}%`,
              width: dot.size,
              height: dot.size,
              backgroundColor: GOLD_LIGHT,
              filter: "blur(1.5px)",
            }}
            animate={reduce ? undefined : { opacity: [0.05, 0.6, 0.05], y: [0, -26, 0] }}
            transition={reduce ? undefined : { duration: dot.duration, repeat: Infinity, delay: dot.delay, ease: "easeInOut" }}
          />
        ))}
      </div>

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
          className="relative w-full max-w-[328px] sm:max-w-[380px] mx-auto"
          initial={reduce ? false : { opacity: 0, y: 26 }}
          animate={closing ? { opacity: 0, y: reduce ? 0 : -46, scale: reduce ? 1 : 0.97 } : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: closing ? 0.7 : 0.9, ease: EASE }}
        >
          {/* hai cụm hoa lớn ôm góc thẻ */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <m.div
              className="absolute -bottom-[16%] -left-[30%] w-[78%] origin-bottom-left"
              animate={closing ? { x: reduce ? 0 : -40, opacity: 0 } : { x: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <m.div
                animate={reduce ? undefined : { rotate: [-1.5, 1.5, -1.5] }}
                transition={reduce ? undefined : { duration: 9, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" decoding="async" src="/templates/flowery-white/corner-b.webp" alt="" aria-hidden="true" className="w-full" />
              </m.div>
            </m.div>
            <m.div
              className="absolute -top-[16%] -right-[30%] w-[78%] origin-top-right"
              animate={closing ? { x: reduce ? 0 : 40, opacity: 0 } : { x: 0, opacity: 1 }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              <m.div
                animate={reduce ? undefined : { rotate: [1.5, -1.5, 1.5] }}
                transition={reduce ? undefined : { duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" decoding="async"
                  src="/templates/flowery-white/corner-a.webp"
                  alt=""
                  aria-hidden="true"
                  className="w-full -scale-x-100"
                />
              </m.div>
            </m.div>
          </div>

          <div
            className="relative overflow-hidden rounded-[10px] px-6 pt-8 pb-8 text-center"
            style={{
              backgroundColor: CARD,
              boxShadow: "0 26px 60px rgba(20, 24, 8, 0.35)",
            }}
          >
            {/* vi\u1ec1n kim m\u1ea3nh */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-2.5 rounded-[6px]"
              style={{ border: `1px solid rgba(70, 78, 37, 0.18)` }}
            />

            {/* hoa b\u1ed1n g\u00f3c trong th\u1ebb */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/templates/flowery-white/corner-b.webp"
              alt=""
              aria-hidden="true"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="pointer-events-none absolute -top-14 -left-14 w-[52%]"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/templates/flowery-white/corner-a.webp"
              alt=""
              aria-hidden="true"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="pointer-events-none absolute -right-14 -bottom-14 w-[52%] -scale-x-100"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/templates/flowery-white/corner-b.webp"
              alt=""
              aria-hidden="true"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="pointer-events-none absolute -top-16 -right-16 w-[38%] -scale-x-100 opacity-80"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/templates/flowery-white/corner-a.webp"
              alt=""
              aria-hidden="true"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="pointer-events-none absolute -bottom-16 -left-16 w-[38%] opacity-80"
            />

            {/* v\u01b0\u01a1ng mi\u1ec7n hoa tr\u00ean t\u00ean */}
            <m.div
              className="relative z-10 mx-auto -mt-1 w-[62%] max-w-[190px]"
              initial={reduce ? false : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.1, delay: 0.25, ease: EASE }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/templates/flowery-white/wreath.webp"
                alt=""
                aria-hidden="true"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="w-full"
              />
            </m.div>

            <h1 className="relative z-10 -mt-4" style={{ fontFamily: SERIF, color: OLIVE }}>
              <span className="block text-[34px] leading-tight break-words">
                {data.couple.groomName}
              </span>
              <span className="my-0.5 block text-[14px]" style={{ fontFamily: SERIF, color: INK }}>
                &amp;
              </span>
              <span className="block text-[34px] leading-tight break-words">
                {data.couple.brideName}
              </span>
            </h1>

            <div className="relative z-10 mx-auto mt-4 flex items-center justify-center gap-3" aria-hidden="true">
              <span className="h-px w-12" style={{ backgroundColor: OLIVE_SOFT }} />
              <span className="text-[11px]" style={{ color: OLIVE }}>❀</span>
              <span className="h-px w-12" style={{ backgroundColor: OLIVE_SOFT }} />
            </div>

            <p className="relative z-10 mt-3 text-[15px]" style={{ fontFamily: BODY, color: INK }}>
              {date.dotDate}
            </p>
            <p className="relative z-10 mt-1.5 text-[9px] uppercase tracking-[0.32em]" style={{ color: MUTED }}>
              Thân mời
            </p>
            {guestName && (
              <p
                className="relative z-10 mx-auto mt-2 max-w-full truncate text-[13px] font-semibold"
                style={{ fontFamily: SERIF, color: OLIVE }}
              >
                {guestName}
              </p>
            )}

            <span
              className="relative z-10 mt-6 inline-flex h-11 items-center justify-center rounded-full px-10 text-[13px]"
              style={{
                backgroundColor: OLIVE,
                color: CARD,
                border: `1px solid ${GOLD_LIGHT}`,
                boxShadow: "0 8px 20px rgba(70,78,37,0.28)",
              }}
            >
              Mở thiệp
            </span>
          </div>
        </m.div>
      </div>
    </m.div>
  );
}

/* ------------------------------------------------------------
   Hero: khung v\u00f2m hoa, KH\u00d4NG \u1ea3nh — t\u00ean + ng\u00e0y
   ------------------------------------------------------------ */
function Hero({ data, guestName }: { data: TemplateData; guestName: string }) {
  const visibleEvents = getVisibleEvents(data);
  const primary = getNearestUpcomingEvent(visibleEvents, data.date);
  const date = formatWeddingDateParts(eventStart(primary, data.date));

  return (
    <section className="relative px-5 pt-12 pb-8 text-center">
      {/* vòm cung nét đôi tự vẽ */}
      <svg
        viewBox="0 0 300 420"
        preserveAspectRatio="xMidYMax meet"
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-4 mx-auto w-[86%] max-w-[300px]"
      >
        <m.path
          d="M14 420 V150 A136 136 0 0 1 286 150 V420"
          fill="none"
          stroke={OLIVE_SOFT}
          strokeWidth="1.2"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        <m.path
          d="M24 420 V150 A126 126 0 0 1 276 150 V420"
          fill="none"
          stroke="rgba(201,169,106,0.35)"
          strokeWidth="0.8"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1.5, delay: 0.25, ease: "easeInOut" }}
        />
      </svg>
      {/* hoa ở chân vòm */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/templates/flowery-white/corner-a.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute -bottom-6 -left-8 w-[40%] max-w-[150px] opacity-90"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/templates/flowery-white/corner-b.webp"
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute -right-8 -bottom-6 w-[40%] max-w-[150px] -scale-x-100 opacity-90"
      />

      <p className="text-[9px] uppercase tracking-[0.38em]" style={{ color: OLIVE }}>
        Lễ Thành Hôn
      </p>

      <h1 className="mt-4" style={{ fontFamily: SERIF, color: OLIVE }}>
        <span className="block text-[30px] leading-tight break-words">{data.couple.groomName}</span>
        <span className="my-0.5 block text-[14px]" style={{ color: INK }}>&amp;</span>
        <span className="block text-[30px] leading-tight break-words">{data.couple.brideName}</span>
      </h1>

      <div className="mx-auto mt-4 flex items-center justify-center gap-3" aria-hidden="true">
        <span className="h-px w-14" style={{ backgroundColor: OLIVE_SOFT }} />
        <span className="text-[11px]" style={{ color: OLIVE }}>❀</span>
        <span className="h-px w-14" style={{ backgroundColor: OLIVE_SOFT }} />
      </div>

      <p className="mt-4 text-[15px]" style={{ fontFamily: BODY, color: INK }}>
        {date.dotDate}
      </p>

      {guestName && (
        <p
          className="mx-auto mt-4 inline-block max-w-full truncate rounded-full px-4 py-1 text-[11px]"
          style={{ border: `1px solid ${OLIVE_SOFT}`, color: INK }}
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

        <div
          className={cn(
            "mt-5 grid gap-4",
            visibleEvents.length === 1
              ? "max-w-[480px] mx-auto"
              : "grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto"
          )}
        >
          {visibleEvents.map((event) => {
            const date = formatWeddingDateParts(event.startsAt);
            const directionsUrl = getEventDirectionsUrl(event);
            return (
              <article
                key={event.id}
                className="relative px-5 py-5 text-center flex flex-col justify-between"
                style={{
                  border: `1px solid ${OLIVE_SOFT}`,
                  borderRadius: 12,
                  backgroundColor: CARD,
                  boxShadow: "0 10px 26px rgba(70,78,37,0.10)",
                }}
              >
                <GoldCorners />
                <div>
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
                </div>

                <div className="mt-4">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-full px-5 text-[12px] font-medium"
                    style={{
                      border: `1px solid ${OLIVE_SOFT}`,
                      color: OLIVE,
                      backgroundColor: "rgba(70,78,37,0.05)",
                    }}
                  >
                    {data.ui.directionsButtonLabel || "Chỉ đường"}
                  </a>
                </div>
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
      <div className="py-2 text-center text-[12px] font-semibold" style={{ color: OLIVE, backgroundColor: "rgba(70,78,37,0.07)" }}>
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
          const isEventDay = day !== null && (eventDays ? eventDays.has(day) : day === cells.day);
          return (
            <span key={index} className="flex h-7 items-center justify-center">
              {day === null ? null : isEventDay ? (
                <m.span
                  className="relative flex h-7 w-7 items-center justify-center"
                  aria-label={`Ngày cưới ${day}`}
                  initial={reduce ? false : { scale: 0.9, filter: "drop-shadow(0 0 0 rgba(201,169,106,0))" }}
                  whileInView={
                    reduce
                      ? undefined
                      : {
                        scale: [0.9, 1.1, 1],
                        filter: [
                          "drop-shadow(0 0 0 rgba(201,169,106,0))",
                          "drop-shadow(0 0 10px rgba(201,169,106,0.95))",
                          "drop-shadow(0 0 4px rgba(201,169,106,0.45))",
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
                  <span className="relative mt-[2px] text-[10px] font-semibold" style={{ color: "#FFFFFF" }}>
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
  const primary = getNearestUpcomingEvent(visibleEvents, data.date);
  const iso = eventStart(primary, data.date);
  const date = formatWeddingDateParts(iso);

  const eventDays = React.useMemo(() => {
    const d = new Date(iso);
    const yr = d.getFullYear();
    const mo = d.getMonth();
    const days = new Set(
      visibleEvents
        .map((evt) => {
          const dt = new Date(eventStart(evt, data.date));
          return dt.getFullYear() === yr && dt.getMonth() === mo ? dt.getDate() : null;
        })
        .filter((val): val is number => val !== null)
    );
    if (days.size === 0 && !isNaN(d.getDate())) {
      days.add(d.getDate());
    }
    return days;
  }, [iso, visibleEvents, data.date]);

  const calendarUrl = React.useMemo(() => {
    const start = new Date(iso);
    if (Number.isNaN(start.getTime())) return null;
    const end = new Date(start.getTime() + 3 * 3600 * 1000);
    const fmt = (value: Date) => value.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `Tiệc cưới ${data.couple.groomName} & ${data.couple.brideName}`,
      dates: `${fmt(start)}/${fmt(end)}`,
      location: primary ? `${primary.venueName}, ${primary.venueAddress}` : "",
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }, [data.couple.brideName, data.couple.groomName, iso, primary]);

  return (
    <section className="px-4 py-6" style={{ backgroundColor: "transparent" }}>
      <div className="mx-auto max-w-[560px]">
        <GoldTitle>Thông tin tiệc cưới</GoldTitle>

        <div className="mt-6 text-center">
          <p className="text-[12px] uppercase tracking-[0.16em]" style={{ color: GOLD }}>
            Tiệc cưới sẽ diễn ra vào lúc
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
          {primary?.lunarDate && (
            <p className="mt-1 text-[11px]" style={{ color: MUTED }}>(Tức ngày {formatLunarDateClean(primary.lunarDate)})</p>
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
            style={{ backgroundColor: BROWN, color: "#FFFFFF" }}
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
          <div className="flex items-center justify-center gap-3">
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

          <ol className="relative mx-auto mt-5 w-fit">
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
                    style={{ backgroundColor: BROWN }}
                  />
                  {index < timeline.length - 1 && (
                    <m.span
                      className="absolute top-4 bottom-[-20px] w-px origin-top"
                      style={{ backgroundColor: OLIVE_SOFT }}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <span className="shrink-0 pb-1 text-[13px]" style={{ color: INK }}>
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
function AlbumLoop({ data }: { data: TemplateData }) {
  const limit = data.plan === "free" ? 5 : 30;
  const photos = data.photos.gallery.slice(0, limit);
  const [lightbox, setLightbox] = React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (lightbox === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") setLightbox((p) => (p === null ? p : (p + 1) % photos.length));
      if (event.key === "ArrowLeft") setLightbox((p) => (p === null ? p : (p - 1 + photos.length) % photos.length));
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

  const card = (photo: TemplateData["photos"]["gallery"][number], index: number, key: string) => (
    <button
      key={key}
      type="button"
      onClick={() => setLightbox(index)}
      aria-label={`Xem ảnh ${index + 1}`}
      className="group relative h-[210px] w-[156px] shrink-0 overflow-hidden rounded-md"
      style={{ border: `1px solid ${GOLD_SOFT}`, backgroundColor: CREAM }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt={photo.alt}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        loading={index < 3 ? "eager" : "lazy"}
        decoding="async"
      />
    </button>
  );

  return (
    <section className="py-6">
      <GoldTitle>Album ảnh</GoldTitle>

      {/* Dải ảnh chạy ngang vô tận: 2 nhóm giống hệt + translateX(-50%) */}
      <div className="relative mt-4 overflow-hidden">
        <div className="album-track flex w-max">
          {[0, 1].map((group) => (
            <div
              key={group}
              className="flex shrink-0 gap-2 pr-2"
              aria-hidden={group === 1 ? true : undefined}
            >
              {photos.map((photo, index) => card(photo, index, `${group}-${photo.id}`))}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>
        Chạm vào ảnh để phóng to
      </p>

      {mounted && lightbox !== null && photos[lightbox] && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
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
          <img loading="lazy" decoding="async"
            src={photos[lightbox].url}
            alt={photos[lightbox].alt}
            className="max-h-[86vh] max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
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
            src="/templates/flowery-white/gift.webp"
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
    : CANONICAL_SECTION_ORDER;
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
      data-template-id="flowery-white"
      className={cn(
        "relative min-w-0 overflow-x-hidden antialiased",
        contained
          ? (!coverGone ? "h-full overflow-hidden" : "min-h-full")
          : (!coverGone ? "h-screen-dvh max-h-full overflow-hidden" : "min-h-screen-dvh"),
        viewport === "desktop" && !contained && "mx-auto w-full max-w-[820px]",
      )}
      style={{
        backgroundColor: BEIGE,
        backgroundImage: `radial-gradient(120% 82% at 50% 0%, #FDFCFB 0%, ${BEIGE} 55%, #E9DACD 100%)`,
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
        className={cn(
          "mx-auto w-full",
          !coverGone && !closing && "hidden pointer-events-none",
        )}
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
              <SectionReveal><AlbumLoop data={data} /></SectionReveal>
            </div>
          )}

          {/* QR album: chỉ gói Pro/VIP, và chủ thiệp có thể tắt trong dashboard. */}
          {data.plan !== "free" && data.weddingSlug && !hidden.has("albumQr") && (
            <div style={{ order: orderOf("albumQr") }}>
              <SectionReveal>
                <GuestAlbumQr
                  slug={data.weddingSlug}
                  accentColor={BROWN}
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
                  tone="flowery"
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
            {data.ui.thankYouHeading || "Trân trọng cảm ơn"}
          </p>
        </footer>
      </m.div>

      {!resolvedMusicControl && data.music && !hidden.has("music") && (
        <LiveMusicFloatingButton
          src={data.music.src}
          title={data.music.title}
          visible={opened}
          tone="flowery"
        />
      )}

      <GiftModal
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        gift={data.gift}
        plan={data.plan}
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName ?? null}
        tone="flowery"
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
