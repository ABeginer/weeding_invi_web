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
   Đỏ - truyền thống
   Bảng màu theo color_code.txt của khách:
     main #800000 · card #fff7eb · text on red #ffeed2
     text on card #800000 · gold foil #c9a24a
   Font: chỉ dùng font có subset tiếng Việt (card_exp §3).
   ============================================================ */

const RED = "#800000";
const RED_DEEP = "#5c0000";
const CREAM = "#fff7eb";
const ON_RED = "#ffeed2";
const GOLD = "#c9a24a";
const GOLD_SOFT = "rgba(201, 162, 74, 0.45)";
const INK = "#4a1010";
const MUTED = "#8a6a63";

const SERIF = "var(--font-playfair), Georgia, serif";
const SCRIPT = "var(--font-playfair), Georgia, serif";

const EASE = [0.16, 1, 0.3, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "17:30", label: "Đón khách" },
  { time: "18:30", label: "Khai tiệc" },
  { time: "18:45", label: "Rót rượu, cắt bánh" },
  { time: "19:00", label: "Phục vụ món chính" },
  { time: "21:00", label: "Kết thúc tiệc" },
];

const DEFAULT_DRESS = ["#5c1a1a", "#8b2f2f", "#e8b4b4"];

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
function ArchPhoto({
  url,
  alt,
  className,
}: {
  url: string | null;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-t-[999px] p-[3px]", className)}
      style={{ backgroundColor: CREAM, border: `2px solid ${CREAM}` }}
    >
      <div
        className="overflow-hidden rounded-t-[999px]"
        style={{ backgroundColor: "#efe3cf" }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={alt}
            className="block aspect-[2/3] w-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        ) : (
          <TemplatePhotoPlaceholder label="Ảnh cưới" className="aspect-[2/3] w-full" />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Dải tiêu đề đỏ
   ------------------------------------------------------------ */
function RedBand({ children, as: Tag = "h2" }: { children: React.ReactNode; as?: "h2" | "h3" }) {
  return (
    <Tag
      className="flex items-center justify-center gap-3 px-4 py-3 text-center text-[13px] font-semibold uppercase tracking-[0.22em]"
      style={{ backgroundColor: RED, color: ON_RED }}
    >
      <span aria-hidden="true" className="h-px w-6" style={{ backgroundColor: GOLD }} />
      <span>{children}</span>
      <span aria-hidden="true" className="h-px w-6" style={{ backgroundColor: GOLD }} />
    </Tag>
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
  const duration = reduce ? 0.01 : 0.95;

  // 12 chữ 囍 trôi chậm phía sau hai cánh cửa (animation_guide).
  const symbols = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        id: index,
        left: 4 + ((index * 37) % 92),
        top: 6 + ((index * 53) % 86),
        size: 18 + ((index * 13) % 42),
        opacity: 0.05 + ((index * 7) % 9) / 100,
        delay: (index % 6) * 0.8,
        drift: 10 + (index % 5) * 6,
      })),
    [],
  );

  return (
    <div
      className={cn("z-50 overflow-hidden", contained ? "absolute inset-0" : "fixed inset-0")}
      style={{ backgroundColor: "#3d0404" }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {symbols.map((symbol) => (
          <m.span
            key={symbol.id}
            className="absolute select-none"
            style={{
              left: `${symbol.left}%`,
              top: `${symbol.top}%`,
              fontSize: symbol.size,
              color: GOLD,
              opacity: symbol.opacity,
            }}
            animate={reduce ? undefined : { y: [0, -symbol.drift, 0], opacity: [symbol.opacity, symbol.opacity * 1.6, symbol.opacity] }}
            transition={
              reduce
                ? undefined
                : { duration: 9 + (symbol.id % 5), repeat: Infinity, ease: "easeInOut", delay: symbol.delay }
            }
          >
            囍
          </m.span>
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

      {/* cánh trái */}
      <m.div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 z-30 w-1/2 overflow-hidden"
        style={{ backgroundColor: RED }}
        initial={false}
        animate={closing ? { x: reduce ? 0 : "-102%", opacity: reduce ? 0 : 1 } : { x: 0, opacity: 1 }}
        transition={{ duration, ease: EASE }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(90deg, ${RED_DEEP}, ${RED})` }}
        />
        <span className="absolute right-3 top-6 text-[120px] leading-none" style={{ color: "rgba(255,255,255,0.05)" }}>囍</span>
      </m.div>

      {/* cánh phải */}
      <m.div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 z-30 w-1/2 overflow-hidden"
        style={{ backgroundColor: RED }}
        initial={false}
        animate={closing ? { x: reduce ? 0 : "102%", opacity: reduce ? 0 : 1 } : { x: 0, opacity: 1 }}
        transition={{ duration, ease: EASE, delay: reduce ? 0 : 0.06 }}
        onAnimationComplete={() => {
          if (closing) onDoorsClosed();
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(90deg, ${RED}, ${RED_DEEP})` }}
        />
        <span className="absolute left-3 bottom-10 text-[120px] leading-none" style={{ color: "rgba(255,255,255,0.05)" }}>囍</span>
      </m.div>

      {/* nội dung trên cửa */}
      <m.div
        className="pointer-events-none absolute inset-0 z-40 w-full max-w-full overflow-hidden flex flex-col items-center justify-center px-4"
        animate={closing ? { opacity: 0, scale: reduce ? 1 : 0.97 } : { opacity: 1, scale: 1 }}
        transition={{ duration: reduce ? 0.01 : 0.4, ease: "easeOut" }}
      >
        <div
          className="relative w-full max-w-[328px] sm:max-w-[380px] mx-auto px-6 py-9 text-center"
          style={{ backgroundColor: "rgba(128,0,0,0.55)", border: `1px solid ${GOLD_SOFT}`, borderRadius: 16 }}
        >
          <span
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full text-[30px]"
            style={{
              background: "radial-gradient(circle at 35% 30%, #fff8e6, #e8c98a)",
              color: RED,
              boxShadow: `0 0 32px ${GOLD}55`,
            }}
            aria-hidden="true"
          >
            囍
          </span>

          <p className="mt-5 text-[10px] font-medium uppercase tracking-[0.28em]" style={{ color: GOLD }}>
            {data.ui.invitePrefix || "THÂN MỜI"}
          </p>

          <h1 className="mt-4 text-[34px] leading-[1.15]" style={{ fontFamily: SERIF, color: ON_RED }}>
            <span className="block break-words">{data.couple.groomName}</span>
            <span className="my-1 block text-[20px] italic" style={{ color: GOLD }}>
              &amp;
            </span>
            <span className="block break-words">{data.couple.brideName}</span>
          </h1>

          <div className="mt-5 flex items-center justify-center gap-3" aria-hidden="true">
            <span className="h-px w-14" style={{ backgroundColor: GOLD_SOFT }} />
            <span className="text-[12px]" style={{ color: GOLD }}>❦</span>
            <span className="h-px w-14" style={{ backgroundColor: GOLD_SOFT }} />
          </div>

          <p className="mt-4 text-[17px]" style={{ fontFamily: SERIF, color: ON_RED }}>
            {date.dotDate}
          </p>

          <span
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full px-9 text-sm font-medium"
            style={{ backgroundColor: CREAM, color: RED }}
          >
            Mở thiệp
          </span>
        </div>
      </m.div>
    </div>
  );
}

/* ------------------------------------------------------------
   Hero: khối đỏ + ảnh vòm
   ------------------------------------------------------------ */
function Hero({ data, guestName }: { data: TemplateData; guestName: string }) {
  return (
    <section className="relative" data-hero>
      <div className="relative overflow-hidden" style={{ backgroundColor: RED }}>
        <div className="mx-auto w-full max-w-[560px] px-5 pt-7 pb-4 text-center">
          <p className="text-[10px] font-medium uppercase tracking-[0.38em]" style={{ color: ON_RED }}>
            {data.ui.eyebrow || "Trân Trọng Kính Mời"}
          </p>

          <div className="mt-3 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 text-right">
              <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: ON_RED }}>
                {data.couple.groomTitle || "Chú rể"}
              </p>
              <p className="mt-0.5 break-words text-[15px] font-semibold uppercase tracking-[0.08em]" style={{ color: ON_RED }}>
                {data.couple.groomName}
              </p>
            </div>

            <span className="mt-1 text-[34px] leading-none" style={{ color: GOLD }} aria-hidden="true">
              囍
            </span>

            <div className="min-w-0 flex-1 text-left">
              <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: ON_RED }}>
                {data.couple.brideTitle || "Cô dâu"}
              </p>
              <p className="mt-0.5 break-words text-[15px] font-semibold uppercase tracking-[0.08em]" style={{ color: ON_RED }}>
                {data.couple.brideName}
              </p>
            </div>
          </div>

          {guestName && (
            <p
              className="mx-auto mt-3 inline-block max-w-full truncate rounded-full px-4 py-1 text-[11px]"
              style={{ border: `1px solid ${GOLD_SOFT}`, color: ON_RED }}
            >
              {data.ui.invitePrefix}: <strong className="font-semibold">{guestName}</strong>
            </p>
          )}

          <div className="relative z-10 mt-12 pb-1">
            {/* "LOVE NEVER FAILS" đặt đè lên đỉnh vòm thay vì chiếm một dòng
                riêng — nhờ vậy toàn bộ ảnh cưới nằm gọn trong màn hình đầu. */}
            <div
              className="pointer-events-none absolute -top-[52px] left-1/2 z-20 w-[92%] max-w-[360px] -translate-x-1/2"
              aria-hidden="true"
            >
              <svg viewBox="0 0 360 90" className="block w-full">
                <defs>
                  <path id="dt-arc" d="M 26 84 Q 180 6 334 84" fill="none" />
                </defs>
                <text fill={ON_RED} fontSize="11.5" letterSpacing="4.6" fontFamily={SERIF}>
                  <textPath href="#dt-arc" startOffset="50%" textAnchor="middle">
                    LOVE NEVER FAILS
                  </textPath>
                </text>
                <circle cx="14" cy="86" r="2.2" fill={GOLD} />
                <circle cx="346" cy="86" r="2.2" fill={GOLD} />
              </svg>
            </div>

            <ArchPhoto
              url={data.photos.heroUrl}
              alt={data.photos.heroAlt || `Ảnh cưới ${data.couple.groomName} & ${data.couple.brideName}`}
              className="mx-auto w-[74%] max-w-[280px] sm:max-w-[340px] md:max-w-[420px]"
            />
          </div>
        </div>
      </div>
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
    <section className="px-4 py-6" style={{ backgroundColor: CREAM }}>
      <div className="mx-auto max-w-[560px]">
        <RedBand>Thông tin gia đình</RedBand>

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
          <p className="text-[12px] uppercase tracking-[0.14em]" style={{ color: RED }}>
            Trân trọng báo tin lễ thành hôn của con chúng tôi
          </p>

          <h2 className="mt-4 break-words text-[30px] leading-[1.15]" style={{ fontFamily: SERIF, color: RED }}>
            {data.couple.groomFullName || data.couple.groomName}
          </h2>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: MUTED }}>
            {data.couple.groomTitle || "Chú rể"}
          </p>

          <p className="my-2 text-lg" style={{ fontFamily: SERIF, color: MUTED }}>
            &amp;
          </p>

          <h2 className="break-words text-[30px] leading-[1.15]" style={{ fontFamily: SERIF, color: RED }}>
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
    <section className="px-4 py-6" style={{ backgroundColor: CREAM }}>
      <div className="mx-auto max-w-[560px]">
        <RedBand>Sự kiện</RedBand>

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
                style={{ border: `1px solid ${GOLD}`, borderRadius: 12, backgroundColor: "#fffdf8" }}
              >
                <GoldCorners />
                <div>
                  <h3
                    className="text-[12px] font-semibold uppercase tracking-[0.18em]"
                    style={{ color: RED }}
                  >
                    {event.title}
                  </h3>

                  <p className="mt-3 text-[22px]" style={{ fontFamily: SERIF, color: RED }}>
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
                    style={{ border: `1px solid ${RED}`, color: RED }}
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
      <div className="py-2 text-center text-[12px] font-semibold" style={{ color: RED, backgroundColor: "#fbf0dc" }}>
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
                <span
                  className="relative flex h-7 w-7 items-center justify-center"
                  aria-label={`Ngày cưới ${day}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="absolute inset-0 h-full w-full"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 21.2c-.3 0-.6-.1-.9-.3C7.5 18.4 2 14.2 2 8.9 2 5.6 4.4 3.4 7.3 3.4c1.8 0 3.4 1 4.7 2.6 1.3-1.6 2.9-2.6 4.7-2.6C19.6 3.4 22 5.6 22 8.9c0 5.3-5.5 9.5-9.1 12-.3.2-.6.3-.9.3Z"
                      fill={RED}
                    />
                  </svg>
                  <span className="relative mt-[2px] text-[10px] font-semibold text-white">
                    {day}
                  </span>
                </span>
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
    <section className="px-4 py-6" style={{ backgroundColor: CREAM }}>
      <div className="mx-auto max-w-[560px]">
        <RedBand>Thông tin tiệc cưới</RedBand>

        <div className="mt-6 text-center">
          <p className="text-[12px] uppercase tracking-[0.16em]" style={{ color: RED }}>
            Tiệc cưới sẽ diễn ra vào lúc
          </p>
          <p className="mt-2 text-[24px]" style={{ fontFamily: SERIF, color: RED }}>
            {date.time}
          </p>

          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-[11px] capitalize" style={{ color: INK }}>{date.weekday}</span>
            <span className="h-6 w-px" style={{ backgroundColor: GOLD_SOFT }} />
            <span className="text-[26px] leading-none" style={{ fontFamily: SERIF, color: RED }}>{date.day}</span>
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
              style={{ borderColor: RED, color: RED }}
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
            style={{ backgroundColor: RED, color: ON_RED }}
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
    <section className="px-4 py-6" style={{ backgroundColor: CREAM }}>
      <div className="mx-auto max-w-[560px]">
        <RedBand>Trang phục</RedBand>

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
          <RedBand>Lịch trình ngày cưới</RedBand>

          <ol className="relative mt-5">
            {timeline.map((item, index) => (
              <li key={`${item.time}-${index}`} className="relative flex gap-4 pb-5 last:pb-0">
                <span
                  className="w-12 shrink-0 text-right text-[12px] font-semibold tabular-nums"
                  style={{ color: RED }}
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
function AlbumCoverflow({ data }: { data: TemplateData }) {
  const limit = data.plan === "free" ? 5 : 30;
  const photos = data.photos.gallery.slice(0, limit);
  const reduce = useReducedMotion();
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const pausedRef = React.useRef(false);
  const inViewRef = React.useRef(true);
  const [index, setIndex] = React.useState(0);
  const [lightbox, setLightbox] = React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  /**
   * Tự chuyển một ảnh mỗi 1,5 giây. Ảnh xếp theo khoảng cách modulo nên khi
   * quay vòng không có cú nhảy nào (ảnh ra xa đã tắt opacity trước lúc đổi vòng).
   * Tạm dừng khi rê chuột, khi tab ẩn hoặc khối ra khỏi màn hình.
   */
  React.useEffect(() => {
    if (reduce || photos.length < 2) return;
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        inViewRef.current = entries[0]?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    observer.observe(stage);

    const timer = window.setInterval(() => {
      if (pausedRef.current || !inViewRef.current || document.hidden) return;
      setIndex((prev) => (prev + 1) % photos.length);
    }, 1500);

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
    };
  }, [photos.length, reduce]);

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

  const total = photos.length;
  const go = (step: number) => setIndex((prev) => (prev + step + total) % total);

  return (
    <section className="py-6" style={{ backgroundColor: CREAM }}>
      <RedBand>Album ảnh</RedBand>

      <div
        ref={stageRef}
        className="relative mt-6 h-[300px] overflow-hidden sm:h-[360px]"
        style={{ perspective: "1200px" }}
        onPointerEnter={() => {
          pausedRef.current = true;
        }}
        onPointerLeave={() => {
          pausedRef.current = false;
        }}
      >
        <div className="relative mx-auto h-full w-full max-w-[560px]">
          {photos.map((photo, i) => {
            let distance = (((i - index) % total) + total) % total;
            if (distance > total / 2) distance -= total;
            const abs = Math.abs(distance);
            const near = Math.min(abs, 2);

            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => setLightbox(i)}
                aria-label={`Xem ảnh ${i + 1}`}
                className="absolute top-0 left-1/2 h-full w-[62%] origin-center overflow-hidden rounded-xl transition-[transform,opacity] duration-[620ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{
                  border: `1px solid ${GOLD_SOFT}`,
                  backgroundColor: "#efe3cf",
                  transform:
                    `translateX(calc(-50% + ${(distance * 44).toFixed(2)}%)) ` +
                    `scale(${(1 - near * 0.13).toFixed(3)}) ` +
                    `rotateY(${(-distance * 26).toFixed(1)}deg)`,
                  opacity: abs > 2.2 ? 0 : 1 - near * 0.34,
                  zIndex: Math.round(100 - abs * 10),
                  pointerEvents: abs > 0.6 ? "none" : "auto",
                  willChange: "transform, opacity",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.alt}
                  className="h-full w-full object-cover"
                  loading={abs < 3 ? "eager" : "lazy"}
                  decoding="async"
                />
              </button>
            );
          })}
        </div>

        {total > 1 && (
          <div
            className="pointer-events-none absolute inset-0 mx-auto w-full max-w-[560px]"
            style={{ zIndex: 200 }}
          >
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Ảnh trước"
              className="pointer-events-auto absolute top-1/2 left-0 hidden h-10 w-10 sm:flex -translate-y-1/2 items-center justify-center rounded-full shadow-[0_8px_18px_rgba(92,0,0,0.35)] transition-transform hover:scale-105"
              style={{ backgroundColor: RED, border: `1px solid ${RED}`, color: ON_RED }}
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Ảnh sau"
              className="pointer-events-auto absolute top-1/2 right-0 hidden h-10 w-10 sm:flex -translate-y-1/2 items-center justify-center rounded-full shadow-[0_8px_18px_rgba(92,0,0,0.35)] transition-transform hover:scale-105"
              style={{ backgroundColor: RED, border: `1px solid ${RED}`, color: ON_RED }}
            >
              <ChevronRight className="h-5 w-5" strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>
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
          {total > 1 && (
            <div
              className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() =>
                  setLightbox((prev) =>
                    prev === null ? prev : (prev - 1 + total) % total,
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
                  setLightbox((prev) => (prev === null ? prev : (prev + 1) % total))
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
    <section className="px-4 py-6" style={{ backgroundColor: CREAM }}>
      <div className="mx-auto max-w-[560px] text-center">
        <RedBand>Hộp quà mừng</RedBand>

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
            src="/templates/do-truyen-thong/gift-box.webp"
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
    } catch { }
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
      data-template-id="do-truyen-thong"
      className={cn(
        "relative min-w-0 overflow-x-hidden antialiased",
        contained
          ? (!coverGone ? "h-full overflow-hidden" : "min-h-full")
          : (!coverGone ? "h-screen-dvh max-h-full overflow-hidden" : "min-h-screen-dvh"),
        viewport === "desktop" && !contained && "mx-auto w-full max-w-[820px]",
      )}
      style={{ backgroundColor: CREAM, color: INK, fontFamily: "var(--font-be-vietnam), sans-serif" }}
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

      <div
        className={cn(
          "mx-auto w-full",
          !coverGone && !closing && "hidden pointer-events-none"
        )}
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
              <SectionReveal><AlbumCoverflow data={data} /></SectionReveal>
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
                  tone="red"
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

        <footer className="px-4 pb-10 pt-6 text-center" style={{ backgroundColor: CREAM }}>
          <p className="text-[22px]" style={{ fontFamily: SCRIPT, color: RED }}>
            {data.couple.groomName} &amp; {data.couple.brideName}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em]" style={{ color: MUTED }}>
            {data.ui.thankYouHeading || "Trân trọng cảm ơn"}
          </p>
        </footer>
      </div>

      {!resolvedMusicControl && data.music && !hidden.has("music") && (
        <LiveMusicFloatingButton
          src={data.music.src}
          title={data.music.title}
          visible={opened}
          tone="red"
        />
      )}

      <GiftModal
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        gift={data.gift}
        plan={data.plan}
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName ?? null}
        tone="red"
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
