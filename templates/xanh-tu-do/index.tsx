"use client";

import * as React from "react";
import { AnimatePresence, m } from "motion/react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Heart,
  MapPin,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import type { WeddingTemplateProps } from "../types";
import { formatWeddingDateParts } from "@/lib/utils";
import { cn } from "@/lib/utils";

const RED = "#586D40";
const RED_SOFT = "#6F8456";
const CREAM = "#F8F1EA";
const CREAM_DEEP = "#EFE2D3";
const GOLD = "#C5A059";
const INK = "#2F3D20";

const DEFAULT_DRESS = [RED, "#A5697A", GOLD, "#EFE4D3"];
const TIMELINE = [
  { time: "17:00", label: "Đón khách" },
  { time: "18:00", label: "Khai tiệc" },
  { time: "18:30", label: "Nghi thức cưới" },
  { time: "19:00", label: "Cắt bánh & nhảy" },
  { time: "20:30", label: "Kết thúc tiệc" },
];

function dateLabel(value: string) {
  const parts = formatWeddingDateParts(value);
  return `${parts.day} tháng ${parts.month}, ${parts.year}`;
}

function HeartPetalField() {
  const petals = [
    { left: "9%", top: "17%", size: 13, rotate: -18, opacity: 0.45 },
    { left: "22%", top: "8%", size: 8, rotate: 22, opacity: 0.3 },
    { left: "78%", top: "26%", size: 10, rotate: 32, opacity: 0.3 },
    { left: "90%", top: "13%", size: 7, rotate: -12, opacity: 0.4 },
    { left: "13%", top: "73%", size: 9, rotate: 18, opacity: 0.3 },
    { left: "86%", top: "68%", size: 12, rotate: -25, opacity: 0.35 },
    { left: "72%", top: "87%", size: 7, rotate: 12, opacity: 0.3 },
    { left: "30%", top: "91%", size: 11, rotate: -20, opacity: 0.28 },
  ];
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((p, i) => (
        <span
          key={i}
          className="do-may-heart"
          style={{
            left: p.left,
            top: p.top,
            fontSize: p.size,
            opacity: p.opacity,
            transform: `rotate(${p.rotate}deg)`,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}

function Cover({
  data,
  guestName,
  onOpen,
}: {
  data: WeddingTemplateProps["data"];
  guestName: string;
  onOpen: () => void;
}) {
  const { groomName, brideName } = data.couple;
  return (
    <div
      className="relative flex min-h-full w-full items-center justify-center overflow-hidden px-4 py-10"
      style={{
        background:
          "radial-gradient(circle at 50% 35%, #6F8456 0%, #586D40 48%, #2F3D20 100%)",
      }}
    >
      <HeartPetalField />
      <m.div
        initial={false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[470px] overflow-hidden rounded-[8px] px-5 py-11 text-center shadow-[0_28px_70px_rgba(0,0,0,0.35)] sm:px-10 sm:py-14"
        style={{ backgroundColor: CREAM, color: INK }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/templates/xanh-tu-do/floral.webp"
          alt=""
          className="pointer-events-none absolute -left-12 top-0 z-0 w-[96px] -scale-x-100 opacity-90 sm:-left-16 sm:w-[125px]"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/templates/xanh-tu-do/floral.webp"
          alt=""
          className="pointer-events-none absolute -right-12 top-0 z-0 w-[96px] -scale-y-100 opacity-90 sm:-right-16 sm:w-[125px]"
        />

        <div className="relative z-10">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
          style={{ backgroundColor: RED, color: CREAM }}
        >
          <Heart className="h-6 w-6 fill-current" />
        </div>

        <p
          className="mt-6 text-[10px] font-semibold uppercase tracking-[0.28em]"
          style={{ color: "#7D5A4A" }}
        >
          Trân trọng kính mời
        </p>

        <h1
          className="mt-4 text-[32px] leading-[1.14] sm:text-[40px]"
          style={{ fontFamily: "var(--font-playfair)", color: RED }}
        >
          <span className="block">{groomName}</span>
          <span className="my-1 block text-xl font-normal sm:text-2xl">&amp;</span>
          <span className="block">{brideName}</span>
        </h1>

        <div className="mx-auto my-5 flex items-center justify-center gap-3" style={{ color: RED }}>
          <span className="h-px w-10 bg-current opacity-50" />
          <span className="text-[9px]">❧</span>
          <span className="h-px w-10 bg-current opacity-50" />
        </div>

        <p className="text-sm" style={{ fontFamily: "var(--font-playfair)", color: "#5E3A32" }}>
          {dateLabel(data.date)}
        </p>

        <p className="mt-5 text-[10px] uppercase tracking-[0.32em]" style={{ color: "#8D6A58" }}>
          Thân mời
        </p>
        <p className="mt-1 text-sm font-semibold" style={{ color: INK }}>
          {guestName}
        </p>

        <button
          type="button"
          onClick={onOpen}
          className="mt-8 inline-flex min-h-11 items-center justify-center rounded-full px-9 py-2.5 text-sm font-semibold shadow-lg transition-transform hover:scale-[1.03] active:scale-95"
          style={{ backgroundColor: RED, color: "#FFF8F0" }}
        >
          Mở thiệp
        </button>
        </div>
      </m.div>
    </div>
  );
}

function FamilySection({ data }: { data: WeddingTemplateProps["data"] }) {
  const members = [
    {
      id: "groom",
      label: "Nhà trai",
      title: data.couple.groomTitle || "Trưởng nam",
      name: data.couple.groomFullName || data.couple.groomName,
      parents: data.couple.groomParents,
    },
    {
      id: "bride",
      label: "Nhà gái",
      title: data.couple.brideTitle || "Ái nữ",
      name: data.couple.brideFullName || data.couple.brideName,
      parents: data.couple.brideParents,
    },
  ];
  const ordered =
    data.hostFirst === "bride" ? [members[1], members[0]] : members;

  return (
    <section className="px-4 py-8 sm:py-10">
      <div className="mx-auto max-w-[450px] rounded-[8px] border px-5 py-7 text-center shadow-sm sm:px-8"
        style={{ backgroundColor: "#FFF9F3", borderColor: "#E3CFC0" }}
      >
        <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: "#F0DFD1", color: RED }}>
          <Heart className="h-4 w-4" />
        </div>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: "#8D6A58" }}>
          Trân trọng báo tin
        </p>
        <h2 className="mt-1 text-2xl" style={{ fontFamily: "var(--font-playfair)", color: RED }}>
          Lễ Thành Hôn
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {ordered.map((member, index) => (
            <div
              key={member.id}
              style={{ order: index }}
              className="min-w-0 border-t pt-4 sm:border-t-0 sm:border-r sm:pt-0 sm:last:border-r-0"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: RED }}>
                {member.label} · {member.title}
              </p>
              <p className="mt-2 break-words text-xl font-semibold leading-tight" style={{ fontFamily: "var(--font-playfair)", color: INK }}>
                {member.name}
              </p>
              {member.parents && (
                <p className="mt-2 text-[10px] leading-relaxed" style={{ color: "#7C5B4B" }}>
                  Thân sinh: {member.parents}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SaveTheDateHero({ data }: { data: WeddingTemplateProps["data"] }) {
  const heroUrl = data.photos.heroUrl;
  return (
    <section className="relative overflow-hidden px-4 pb-8 pt-10 text-center sm:pt-14">
      <p
        className="text-[11px] font-semibold uppercase tracking-[0.32em]"
        style={{ color: RED }}
      >
        Save the date
      </p>

      <div className="relative mx-auto mt-7 h-[315px] w-full max-w-[355px] sm:h-[390px] sm:max-w-[420px]">
        <div
          className="absolute bottom-0 left-1/2 h-[220px] w-[290px] -translate-x-1/2 rounded-t-[16px] shadow-[0_20px_40px_rgba(74,22,20,0.25)] sm:h-[270px] sm:w-[350px]"
          style={{
            backgroundColor: RED,
            clipPath: "polygon(0 14%, 50% 44%, 100% 14%, 100% 100%, 0 100%)",
          }}
        />
        <div
          className="absolute bottom-[-2px] left-1/2 h-[120px] w-[290px] -translate-x-1/2 sm:w-[350px]"
          style={{
            background:
              "linear-gradient(150deg, #4A5C36 0%, #586D40 48%, #2A371C 100%)",
            clipPath: "polygon(0 0, 50% 48%, 100% 0, 100% 100%, 0 100%)",
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/templates/xanh-tu-do/floral.webp"
          alt=""
          className="absolute bottom-[92px] left-2 z-10 w-[110px] sm:left-0 sm:w-[135px]"
        />
        <div className="absolute left-1/2 top-2 z-20 w-[205px] -translate-x-1/2 rotate-[-4deg] bg-white p-2 pb-7 shadow-[0_18px_30px_rgba(68,25,24,0.22)] sm:w-[250px] sm:p-2.5 sm:pb-8">
          <div className="relative aspect-[4/5] overflow-hidden bg-[#E9DDD5]">
            {heroUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroUrl}
                alt={data.photos.heroAlt}
                className="h-full w-full object-cover"
              />
            ) : (
              <TemplatePhotoPlaceholder label="Ảnh cưới" className="h-full w-full" />
            )}
          </div>
          <p
            className="absolute bottom-2 left-0 right-0 text-center text-[9px] tracking-[0.18em]"
            style={{ color: "#8D6A58" }}
          >
            OUR WEDDING
          </p>
        </div>
        <div
          className="absolute bottom-[78px] left-1/2 z-30 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border border-[#F3D9A6] shadow-lg"
          style={{ backgroundColor: "#B4893F", color: "#FFF5D9" }}
        >
          <Heart className="h-5 w-5 fill-current" />
        </div>
      </div>

      <p
        className="mx-auto mt-4 max-w-[360px] text-[11px] leading-relaxed"
        style={{ color: "#7C5B4B" }}
      >
        {data.quote || "Một lời hẹn, một đời thương."}
      </p>
    </section>
  );
}

function MiniCalendar({ value }: { value: string }) {
  const target = React.useMemo(() => new Date(value), [value]);
  const year = target.getFullYear();
  const month = target.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const offset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: offset + daysInMonth }, (_, i) =>
    i < offset ? null : i - offset + 1,
  );
  return (
    <div className="rounded-[6px] px-3 py-3 text-left" style={{ backgroundColor: CREAM, color: INK }}>
      <p
        className="text-center text-sm italic"
        style={{ fontFamily: "var(--font-playfair)", color: RED }}
      >
        Tháng {month + 1} / {year}
      </p>
      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[8px] font-semibold uppercase" style={{ color: "#8E6B5B" }}>
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-y-1 text-center text-[10px]" style={{ color: "#5E3A32" }}>
        {cells.map((day, index) => (
          <span
            key={index}
            className={cn(
              "mx-auto flex h-5 w-5 items-center justify-center rounded-full",
              day === target.getDate() && "font-bold",
            )}
            style={
              day === target.getDate()
                ? { backgroundColor: RED, color: "#FFF8F0" }
                : undefined
            }
          >
            {day ?? ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function Countdown({ target }: { target: string }) {
  const [remaining, setRemaining] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const end = new Date(target).getTime();
    if (Number.isNaN(end)) return;
    const tick = () => {
      const distance = Math.max(0, end - Date.now());
      setRemaining({
        days: Math.floor(distance / 86_400_000),
        hours: Math.floor((distance / 3_600_000) % 24),
        minutes: Math.floor((distance / 60_000) % 60),
        seconds: Math.floor((distance / 1000) % 60),
      });
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [target]);

  const units = [
    { label: "Ngày", value: remaining.days, pad: false },
    { label: "Giờ", value: remaining.hours, pad: true },
    { label: "Phút", value: remaining.minutes, pad: true },
    { label: "Giây", value: remaining.seconds, pad: true },
  ];

  return (
    <div className="mt-5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.24em] opacity-70">
        Cùng đếm ngược khoảnh khắc
      </p>
      <div className="mt-2 grid grid-cols-4 gap-1.5 sm:gap-2">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="rounded-[5px] border px-1 py-2 text-center sm:px-2"
            style={{
              borderColor: "rgba(197,160,89,0.55)",
              backgroundColor: "rgba(248,241,234,0.08)",
            }}
          >
            <p
              className="text-xl leading-none tabular-nums sm:text-2xl"
              style={{
                color: CREAM,
                fontFamily: "var(--font-playfair)",
              }}
            >
              {unit.pad ? String(unit.value).padStart(2, "0") : unit.value}
            </p>
            <p className="mt-1 text-[8px] uppercase tracking-[0.16em] opacity-70">
              {unit.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoSection({ data }: { data: WeddingTemplateProps["data"] }) {
  const primary = data.events[0];
  const target = primary?.startsAt ?? data.date;
  const parts = formatWeddingDateParts(target);
  const venue = primary;
  const time = primary ? formatWeddingDateParts(primary.startsAt).time : "18:00";

  return (
    <section className="px-4 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-[450px]">
        <div
          className="relative overflow-hidden rounded-[8px] px-5 py-8 text-center shadow-[0_20px_45px_rgba(68,25,24,0.16)] sm:px-8"
          style={{ backgroundColor: RED, color: CREAM }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]">
            Thông tin tiệc cưới
          </p>
          <p className="mt-4 text-xs">Tiệc cưới sẽ diễn ra vào lúc:</p>
          <p className="mt-2 text-sm font-semibold">
            {time} <span className="mx-2 opacity-60">·</span> {parts.weekday}
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <span
              className="text-[54px] leading-none"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              {parts.day}
            </span>
            <span className="h-12 w-px bg-current opacity-40" />
            <span className="text-left text-sm leading-snug">
              <span className="block">Tháng {parts.month}</span>
              <span className="block text-xl font-semibold">{parts.year}</span>
            </span>
          </div>

          <Countdown target={target} />

          <div className="mt-5">
            <MiniCalendar value={target} />
          </div>

          <a
            href={calendarLink(data)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-[11px] underline underline-offset-4"
          >
            <CalendarDays className="h-3.5 w-3.5" />
            Thêm vào lịch
          </a>

          <a
            href="#rsvp-wishes"
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full px-6 py-2 text-xs font-semibold"
            style={{ backgroundColor: CREAM, color: RED }}
          >
            Xác nhận tham dự
          </a>
        </div>

        <div className="mt-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: RED }}>
            Tiệc cưới sẽ tổ chức tại
          </p>
          <p className="mt-3 text-lg font-semibold leading-snug" style={{ color: INK }}>
            {venue?.venueName || data.ui.eventsTitle || "Địa điểm tổ chức"}
          </p>
          <p className="mx-auto mt-2 max-w-[330px] text-sm leading-relaxed" style={{ color: "#6F4F42" }}>
            {venue?.venueAddress || "Địa chỉ sẽ được cập nhật."}
          </p>
          {venue?.mapDirectionsUrl && (
            <a
              href={venue.mapDirectionsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-6 py-2 text-xs font-semibold shadow-md transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: RED, color: "#FFF8F0" }}
            >
              <MapPin className="h-4 w-4" />
              Chỉ đường trên Google Maps
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function calendarLink(data: WeddingTemplateProps["data"]) {
  const primary = data.events[0];
  const start = new Date(primary?.startsAt ?? data.date);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const title = encodeURIComponent(
    `Đám cưới ${data.couple.groomName} & ${data.couple.brideName}`,
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&location=${encodeURIComponent(
    primary?.venueAddress || "",
  )}`;
}

function DressAndTimeline({ data }: { data: WeddingTemplateProps["data"] }) {
  const colors =
    data.dressCode && data.dressCode.length > 0
      ? data.dressCode.slice(0, 3)
      : DEFAULT_DRESS.slice(0, 3);
  const timeline =
    data.timeline && data.timeline.length > 0 ? data.timeline : TIMELINE;
  return (
    <section className="px-4 py-8 sm:py-10">
      <div className="mx-auto w-full max-w-[450px] text-center">
        <h2
          className="text-[13px] font-bold uppercase tracking-[0.2em]"
          style={{ fontFamily: "var(--font-playfair)", color: RED }}
        >
          Dress code
        </h2>
        <p className="mt-1 text-[11px]" style={{ color: "#7C5B4B" }}>
          Trang phục dự tiệc
        </p>
        <div className="mt-4 flex justify-center gap-3">
          {colors.map((color, index) => (
            <span
              key={`${color}-${index}`}
              className="h-9 w-9 rounded-full border border-black/5 shadow-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="relative mt-7 overflow-hidden rounded-[7px] px-5 py-6 text-left shadow-[0_18px_40px_rgba(68,25,24,0.18)] sm:px-7">
          <div className="absolute inset-0" style={{ backgroundColor: RED }} />
          <img
            src="/templates/xanh-tu-do/floral.webp"
            alt=""
            className="pointer-events-none absolute -right-10 bottom-[-20px] w-[150px] opacity-80"
          />
          <div className="relative z-10">
            <p
              className="text-center text-sm font-semibold uppercase tracking-[0.16em]"
              style={{ fontFamily: "var(--font-playfair)", color: CREAM }}
            >
              Lịch trình ngày cưới
            </p>
            <div className="mx-auto mt-5 max-w-[280px]">
              {timeline.map((item, index) => (
                <div key={`${item.time}-${index}`} className="relative flex items-center gap-3 pb-5 last:pb-0">
                  <span className="w-10 text-right text-[11px] font-semibold" style={{ color: CREAM }}>
                    {item.time}
                  </span>
                  <span className="relative z-10 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: CREAM }} />
                  {index < timeline.length - 1 && (
                    <span className="absolute bottom-0 left-[49px] top-3 w-px bg-white/35" />
                  )}
                  <span className="text-[11px]" style={{ color: "#F4E5D4" }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AlbumSection({ data }: { data: WeddingTemplateProps["data"] }) {
  const limit = data.plan === "free" ? 5 : 30;
  const photos = data.photos.gallery.slice(0, limit);
  const items = photos.length > 0 ? photos : [null, null, null];
  const count = items.length;
  const copies = 3;
  const slides = Array.from({ length: copies }, () => items).flat();
  const [active, setActive] = React.useState(0);
  const [renderedIndex, setRenderedIndex] = React.useState(count);
  const trackRef = React.useRef<HTMLDivElement | null>(null);
  const settleRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToCard = React.useCallback(
    (index: number, behavior: ScrollBehavior = "smooth") => {
      const track = trackRef.current;
      if (!track) return;
      const card = track.querySelector<HTMLElement>(
        `[data-album-card="${index}"]`,
      );
      if (!card) return;
      track.scrollTo({
        left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
        behavior,
      });
      setRenderedIndex(index);
      setActive(index % count);
    },
    [count],
  );

  const syncToCenter = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(
      track.querySelectorAll<HTMLElement>("[data-album-card]"),
    );
    if (cards.length === 0) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closest = 0;
    let distance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const nextDistance = Math.abs(cardCenter - center);
      if (nextDistance < distance) {
        distance = nextDistance;
        closest = index;
      }
    });

    setRenderedIndex(closest);
    setActive(closest % count);

    if (settleRef.current) clearTimeout(settleRef.current);
    settleRef.current = setTimeout(() => {
      let next = closest;
      if (next < count) next += count;
      else if (next >= 2 * count) next -= count;
      if (next !== closest) scrollToCard(next, "auto");
    }, 160);
  }, [count, scrollToCard]);

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      scrollToCard(count, "auto");
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (settleRef.current) clearTimeout(settleRef.current);
    };
  }, [count, scrollToCard]);

  return (
    <section className="overflow-hidden py-8 sm:py-10">
      <p
        className="text-center text-[11px] font-bold uppercase tracking-[0.24em]"
        style={{ fontFamily: "var(--font-playfair)", color: RED }}
      >
        Album ảnh
      </p>
      <div className="relative">
        <button
          type="button"
          aria-label="Ảnh trước"
          onClick={() => scrollToCard(renderedIndex - 1)}
          className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-md"
          style={{ backgroundColor: CREAM, borderColor: "#D9C2AF", color: RED }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={trackRef}
          onScroll={syncToCenter}
          style={{
            paddingLeft: "max(1rem, calc(50% - 105px))",
            paddingRight: "max(1rem, calc(50% - 105px))",
          }}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto"
        >
          {slides.map((photo, index) => (
            <button
              key={`${photo?.id ?? "placeholder"}-${index}`}
              data-album-card={index}
              type="button"
              onClick={() => scrollToCard(index)}
              className={cn(
                "relative h-[295px] w-[210px] shrink-0 snap-center overflow-hidden rounded-[7px] border-4 border-white bg-[#E8DACE] shadow-lg transition-all sm:h-[340px] sm:w-[240px]",
                active === index % count && renderedIndex === index
                  ? "z-10 opacity-100"
                  : "opacity-35",
              )}
              style={{
                transform:
                  renderedIndex === index ? "scale(1)" : "scale(0.9)",
              }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo.url} alt={photo.alt} className="h-full w-full object-cover" />
              ) : (
                <TemplatePhotoPlaceholder label="Ảnh cưới" className="h-full w-full" />
              )}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Ảnh sau"
          onClick={() => scrollToCard(renderedIndex + 1)}
          className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border shadow-md"
          style={{ backgroundColor: CREAM, borderColor: "#D9C2AF", color: RED }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex justify-center gap-1.5">
        {items.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Ảnh ${index + 1}`}
            onClick={() => scrollToCard(count + index)}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: active === index ? 18 : 6,
              backgroundColor: active === index ? RED : "#D8C5B4",
            }}
          />
        ))}
      </div>
    </section>
  );
}

function GiftEnvelopes({ data }: { data: WeddingTemplateProps["data"] }) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [copied, setCopied] = React.useState<string | null>(null);
  React.useEffect(() => setMounted(true), []);

  const accounts = [
    {
      label: data.gift.groomAccountLabel?.trim() || "Tài khoản Nhà ...",
      bank: data.gift.groomBankName,
      number: data.gift.groomAccountNumber,
      name: data.gift.groomAccountName,
      qr: data.gift.groomQrUrl,
    },
    {
      label: data.gift.brideAccountLabel?.trim() || "Tài khoản Nhà ...",
      bank: data.gift.brideBankName,
      number: data.gift.brideAccountNumber,
      name: data.gift.brideAccountName,
      qr: data.gift.brideQrUrl,
    },
  ].filter((account, index) => index === 0 || data.gift.brideAccountEnabled !== false);

  return (
    <section className="relative overflow-hidden px-4 py-9 text-center">
      <div className="mx-auto max-w-[450px]">
        <p
          className="text-[11px] font-bold uppercase tracking-[0.24em]"
          style={{ fontFamily: "var(--font-playfair)", color: RED }}
        >
          Hộp quà mừng
        </p>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="relative mx-auto mt-4 block h-[280px] w-full max-w-[410px] transition-transform hover:scale-[1.02] active:scale-95"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/templates/do-may-man/envelope.webp"
            alt=""
            className="absolute left-[15%] top-4 w-[56%] -rotate-[8deg] drop-shadow-[0_14px_16px_rgba(68,25,24,0.25)]"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/templates/do-may-man/envelope.webp"
            alt="Hộp quà mừng"
            className="absolute right-[12%] top-[82px] w-[49%] rotate-[7deg] drop-shadow-[0_16px_18px_rgba(68,25,24,0.28)]"
          />
        </button>

        <p className="mt-1 text-[11px]" style={{ color: "#7C5B4B" }}>
          Nhấn để mở
        </p>
        <p className="mx-auto mt-4 max-w-[310px] text-[11px] leading-relaxed" style={{ color: "#7C5B4B" }}>
          Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi.
        </p>
      </div>

      {open &&
        mounted &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Hộp quà mừng"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4"
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div
              className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-[22px] p-6 shadow-2xl sm:p-8"
              style={{ backgroundColor: CREAM, color: INK }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: "#8D6A58" }}>
                    Mừng cưới trực tuyến
                  </p>
                  <h3
                    className="mt-1 text-3xl font-semibold sm:text-4xl"
                    style={{ fontFamily: "var(--font-playfair)", color: RED }}
                  >
                    Hộp quà mừng
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Đóng"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border"
                  style={{ borderColor: "#D9C2AF", color: RED }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-4 text-sm leading-relaxed" style={{ color: "#7C5B4B" }}>
                Quét QR hoặc dùng thông tin tài khoản bên dưới.
              </p>

              <div className={cn("mt-5 grid gap-3", accounts.length > 1 ? "sm:grid-cols-2" : "grid-cols-1")}>
                {accounts.map((account) => (
                  <div
                    key={account.label}
                    className="min-w-0 rounded-xl border p-4"
                    style={{ borderColor: "#E3CFC0", backgroundColor: "#FFF9F3" }}
                  >
                    <p className="break-words text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#8D6A58" }}>
                      {account.label}
                    </p>
                    {account.qr && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={account.qr} alt={`QR ${account.label}`} className="mx-auto mt-2 h-28 w-28 object-contain" />
                    )}
                    <p className="mt-3 break-words text-sm font-semibold">{account.bank}</p>
                    <p className="break-all text-xs tabular-nums" style={{ color: "#7C5B4B" }}>
                      {account.number}
                    </p>
                    <p className="mt-0.5 break-words text-[9px] uppercase" style={{ color: "#8D6A58" }}>
                      {account.name}
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(account.number);
                          setCopied(account.number);
                          window.setTimeout(() => setCopied(null), 1400);
                        } catch {
                          setCopied(null);
                        }
                      }}
                      className="mt-3 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold"
                      style={{ borderColor: "#D8B99F", color: RED }}
                    >
                      <Copy className="h-3 w-3" />
                      {copied === account.number ? "Đã chép" : "Sao chép STK"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </section>
  );
}

export default function XanhTuDoTemplate(props: WeddingTemplateProps) {
  const {
    data,
    mode,
    contained = false,
    isOpened: isOpenedProp = false,
    onOpenedChange,
    guestName,
    externalMusicControl,
    inviteSlug,
    weddingSlug,
    invitationMode = "personal",
    initialStatus = "pending",
    initialPlusOnes = 0,
    initialDiet = null,
    initialSongRequest = null,
    initialRideNeeded = false,
  } = props;
  const [opened, setOpened] = React.useState(isOpenedProp || mode === "live");
  const prefersReduced = React.useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  React.useEffect(() => {
    setOpened(isOpenedProp);
  }, [isOpenedProp]);

  const displayGuest =
    guestName && guestName.trim().length > 0
      ? guestName.trim()
      : data.ui.defaultGuestName;

  const hidden = new Set(data.hiddenSections ?? []);
  const order = data.sectionOrder?.length
    ? data.sectionOrder
    : ["family", "calendar", "map", "dresscode", "album", "albumQr", "gift", "rsvp"];
  const orderOf = (key: string) => {
    const index = order.indexOf(key);
    return index < 0 ? 99 : index;
  };

  const open = () => {
    setOpened(true);
    onOpenedChange?.(true);
    if (!contained && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  };

  return (
    <div
      data-template-id="xanh-tu-do"
      className={cn(
        "xanh-tu-do relative min-w-0 overflow-x-hidden font-sans antialiased",
        contained ? "min-h-full" : "min-h-screen-dvh",
      )}
      style={{ backgroundColor: CREAM, color: INK }}
    >
      <AnimatePresence>
        {!opened && (
          <m.div
            key="do-may-cover"
            className={cn(contained ? "absolute inset-0 z-50" : "fixed inset-0 z-50")}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.015 }}
            transition={{ duration: prefersReduced ? 0 : 0.45 }}
          >
            <Cover data={data} guestName={displayGuest} onOpen={open} />
          </m.div>
        )}
      </AnimatePresence>

      {opened && (
        <div className="mx-auto flex w-full max-w-[760px] flex-col pb-16">
          <SaveTheDateHero data={data} />

          {!hidden.has("family") && (
            <div style={{ order: orderOf("family") }}>
              <FamilySection data={data} />
            </div>
          )}

          {!hidden.has("calendar") && (
            <div style={{ order: orderOf("calendar") }}>
              <InfoSection data={data} />
            </div>
          )}

          {!hidden.has("dresscode") && (
            <div style={{ order: orderOf("dresscode") }}>
              <DressAndTimeline data={data} />
            </div>
          )}

          {!hidden.has("album") && (
            <div style={{ order: orderOf("album") }}>
              <AlbumSection data={data} />
            </div>
          )}

          {!hidden.has("albumQr") && (
            <div style={{ order: orderOf("albumQr") }}>
              <GuestAlbumQr
                slug={data.weddingSlug}
                accentColor={RED}
                textColor={RED}
                mutedColor="#7C5B4B"
              />
            </div>
          )}

          {!hidden.has("gift") && (
            <div style={{ order: orderOf("gift") }}>
              <GiftEnvelopes data={data} />
            </div>
          )}

          {!hidden.has("rsvp") && (
            <div style={{ order: orderOf("rsvp") }} className="px-4 py-6">
              <div className="mx-auto max-w-[450px]">
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="sunset"
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
              </div>
            </div>
          )}

          <footer className="px-4 pb-8 text-center">
            <Heart className="mx-auto h-4 w-4" style={{ color: RED }} />
            <p
              className="mt-2 text-xl"
              style={{ fontFamily: "var(--font-playfair)", color: RED }}
            >
              {data.couple.groomName} &amp; {data.couple.brideName}
            </p>
            <p className="mt-1 text-[10px] tracking-[0.2em]" style={{ color: "#8D6A58" }}>
              THANK YOU FOR CELEBRATING WITH US
            </p>
          </footer>

          {!externalMusicControl && data.music && (
            <LiveMusicFloatingButton
              src={data.music.src}
              title={data.music.title}
              visible
            />
          )}
        </div>
      )}
    </div>
  );
}
