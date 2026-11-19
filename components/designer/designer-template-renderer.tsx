"use client";

import * as React from "react";
import {
  CalendarDays,
  Camera,
  Flower2,
  Gift,
  Heart,
  Mail,
  MapPin,
  Music,
  QrCode,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react";
import type {
  DesignerCanvasContent,
  DesignerElement,
  DesignerIconName,
} from "@/components/ops/designer-types";
import type { DesignerElementOverride } from "@/lib/wedding-types";
import { resolveDesignerText } from "@/lib/designer-text";
import { getTextEffectStyles } from "./designer-fonts";
import { sortDesignerElementsByLayer } from "./layer-order";
import { ElementAnimator } from "./element-animator";
import { FallingEffectCanvas } from "./falling-effect-canvas";

export type DesignerPreviewValues = Record<string, string>;

const ICON_MAP: Record<DesignerIconName, LucideIcon> = {
  Heart,
  Star,
  MapPin,
  CalendarDays,
  Music,
  QrCode,
  Camera,
  Flower2,
  Sparkles,
  Mail,
};

const ACTION_LABELS: Record<string, string> = {
  rsvp: "Xác nhận tham dự",
  map: "Xem bản đồ",
  gift: "Mừng cưới",
  album: "Mở album",
  music: "Bật nhạc",
};

const BLOCK_LABELS: Record<string, string> = {
  countdown: "Đếm ngược",
  calendar: "Lịch cưới",
  map: "Địa điểm",
  rsvp: "Xác nhận tham dự",
  gift: "Mừng cưới QR",
  gallery: "Album ảnh",
  music: "Nhạc nền",
};

function readInviteDate(values: Record<string, string>): {
  day: number;
  month: number;
  year: number;
  weekday: string;
  time: string;
} | null {
  const iso = values.dateIso?.trim();
  if (iso) {
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) {
      const parts = new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Bangkok",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        weekday: "long",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).formatToParts(date);
      const pick = (type: string) =>
        parts.find((part) => part.type === type)?.value ?? "";
      return {
        day: Number(pick("day")),
        month: Number(pick("month")),
        year: Number(pick("year")),
        weekday: pick("weekday"),
        time: `${pick("hour")}:${pick("minute")}`,
      };
    }
  }
  const fallback = /^(\d{1,2})[./](\d{1,2})[./](\d{4})/.exec(values.date ?? "");
  if (!fallback) return null;
  return {
    day: Number(fallback[1]),
    month: Number(fallback[2]),
    year: Number(fallback[3]),
    weekday: "",
    time: "",
  };
}

function DesignerMapBlock({
  values,
  color,
  buttonColor,
}: {
  values: Record<string, string>;
  color: string;
  buttonColor?: string;
}) {
  const count = Number(values.eventsCount) || (values.venue2 ? 2 : 1);

  if (count <= 1) {
    const venue = values.eventVenueName || values.venue;
    const address = values.eventAddress;
    return (
      <div className="flex h-full w-full flex-col items-center justify-center px-2 text-center leading-tight">
        <p className="text-[9px] font-semibold tracking-[0.12em] uppercase">
          {values.eventTitle || "LỄ THÀNH HÔN"}
        </p>
        <p className="mt-0.5 text-[7px] tracking-[0.08em] uppercase opacity-80">
          Vào lúc {values.eventTime || values.date} · {values.eventWeekday || "ngày cưới"}
        </p>

        <div className="mt-1.5 flex w-[94%] items-center gap-1.5">
          <span className="h-px flex-1 bg-current opacity-30" />
          <span className="text-[7px] tracking-[0.08em] uppercase opacity-75">
            Tháng {values.eventMonth || "--"}
          </span>
          <span className="text-[26px] leading-none font-semibold">
            {values.eventDay || "--"}
          </span>
          <span className="text-[7px] tracking-[0.08em] uppercase opacity-75">
            Năm {values.eventYear || "----"}
          </span>
          <span className="h-px flex-1 bg-current opacity-30" />
        </div>

        {values.eventLunar && (
          <p className="mt-1 text-[7px] italic opacity-75">
            (Nhằm {values.eventLunar})
          </p>
        )}

        <p className="mt-1.5 max-h-[2.2em] overflow-hidden text-[8px] font-semibold tracking-wide uppercase">
          {venue || "Địa điểm tổ chức"}
        </p>
        {address && (
          <p className="mt-0.5 line-clamp-2 max-w-[94%] text-[7px] leading-snug opacity-80">
            {address}
          </p>
        )}

        {values.mapUrl && (
          <a
            href={values.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex h-6 items-center justify-center rounded-full px-4 text-[7px] font-semibold tracking-[0.08em] text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: buttonColor || color }}
          >
            CHỈ ĐƯỜNG
          </a>
        )}
      </div>
    );
  }

  // Chế độ hiển thị đa sự kiện (2 hoặc 3 lễ): danh sách gọn, có link chỉ đường cho từng lễ
  const items = Array.from({ length: Math.min(count, 3) }, (_, i) => ({
    title: values[`event_${i}_title`] || (i === 0 ? values.eventTitle || "LỄ THÀNH HÔN" : `LỄ ${i + 1}`),
    time: values[`event_${i}_time`] || (i === 0 ? values.eventTime : ""),
    day: values[`event_${i}_day`] || (i === 0 ? values.eventDay : ""),
    month: values[`event_${i}_month`] || (i === 0 ? values.eventMonth : ""),
    venue: values[`event_${i}_venue`] || values[`event_${i}_venueName`] || (i === 0 ? values.venue : values.venue2) || "Địa điểm tổ chức",
    address: values[`event_${i}_address`] || (i === 0 ? values.eventAddress : ""),
    mapUrl: values[`event_${i}_mapUrl`] || (i === 0 ? values.mapUrl : values.mapUrl2),
  }));

  return (
    <div className="flex h-full w-full flex-col justify-center gap-1.5 p-2 text-center leading-tight overflow-y-auto">
      {items.map((item, idx) => (
        <div
          key={idx}
          className="rounded-lg border border-current/10 bg-white/40 p-1.5 backdrop-blur-xs"
        >
          <div className="flex items-center justify-between text-[7px] font-semibold tracking-[0.06em] uppercase">
            <span className="truncate max-w-[65%]">{item.title}</span>
            <span className="opacity-80">
              {item.time ? item.time : ""}
              {item.day && item.month ? ` · ${item.day}/${item.month}` : ""}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[7.5px] font-semibold">
            {item.venue}
          </p>
          {item.address && (
            <p className="truncate text-[6.5px] opacity-75">
              {item.address}
            </p>
          )}
          {item.mapUrl && (
            <a
              href={item.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex h-4.5 items-center justify-center rounded-full px-2.5 text-[6.5px] font-semibold tracking-[0.06em] text-white shadow-xs transition-transform hover:scale-105 active:scale-95"
              style={{ backgroundColor: buttonColor || color }}
            >
              CHỈ ĐƯỜNG
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function DesignerCalendar({
  values,
  color,
}: {
  values: Record<string, string>;
  color: string;
}) {
  const date = readInviteDate(values);
  if (!date) {
    return <p className="text-[11px] font-medium">Ngày cưới sẽ hiển thị tại đây</p>;
  }
  const daysInMonth = new Date(Date.UTC(date.year, date.month, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(date.year, date.month - 1, 1)).getUTCDay() + 6) % 7;
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-0.5">
      <p className="text-[8px] font-semibold tracking-[0.18em] uppercase opacity-80">
        {date.weekday || "Ngày cưới"}
      </p>
      <p className="text-[10px] leading-tight font-semibold">
        Tháng {String(date.month).padStart(2, "0")} · {date.year}
      </p>
      <div className="grid w-[94%] grid-cols-7 gap-[1px] text-center text-[7px] leading-none">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
          <span key={day} className="py-[1px] font-semibold opacity-60">
            {day}
          </span>
        ))}
        {cells.map((day, index) => (
          <span
            key={`${day ?? "empty"}-${index}`}
            className="relative flex h-[12px] items-center justify-center rounded-[2px] text-[7px]"
            style={
              day === date.day
                ? { backgroundColor: color, color: "#fff", fontWeight: 700 }
                : undefined
            }
          >
            {day ?? ""}
            {day === date.day && (
              <Heart className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 fill-current" aria-hidden="true" />
            )}
          </span>
        ))}
      </div>
      <p className="text-[7px] font-medium opacity-75">{date.time || values.date}</p>
    </div>
  );
}

export type DesignerMovePatch = Pick<
  DesignerElementOverride,
  "xPct" | "yPct"
>;

function EditorHotspot({
  element,
  override,
  onSelect,
  onMove,
}: {
  element: DesignerElement;
  override?: DesignerElementOverride;
  onSelect: (element: DesignerElement) => void;
  onMove?: (id: string, patch: DesignerMovePatch) => void;
}) {
  const dragRef = React.useRef<{
    startX: number;
    startY: number;
    xPct: number;
    yPct: number;
    width: number;
    height: number;
    moved: boolean;
  } | null>(null);
  const canDrag = element.type === "image" || element.type === "photo";
  const xPct = override?.xPct ?? element.xPct;
  const yPct = override?.yPct ?? element.yPct;
  const wPct = override?.wPct ?? element.wPct;
  const hPct =
    override?.hPct ??
    ("hPct" in element && typeof element.hPct === "number"
      ? element.hPct
      : element.type === "text"
        ? 10
        : 18);

  return (
    <button
      type="button"
      aria-label={`Chỉnh ${element.type === "text" ? element.text : "ảnh"}`}
      className="pointer-events-auto absolute z-40 rounded-md border border-transparent bg-transparent outline-none transition-colors hover:border-accent/70 hover:bg-accent/5 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/40"
      style={{
        left: `${xPct}%`,
        top: `${yPct}%`,
        width: `${wPct}%`,
        height: `${hPct}%`,
        touchAction: canDrag ? "none" : "pan-y",
        cursor: canDrag ? "grab" : "pointer",
      }}
      onPointerDown={(event) => {
        if (!canDrag) return;
        event.stopPropagation();
        const parent = event.currentTarget.parentElement;
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        dragRef.current = {
          startX: event.clientX,
          startY: event.clientY,
          xPct,
          yPct,
          width: rect.width,
          height: rect.height,
          moved: false,
        };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const drag = dragRef.current;
        if (!drag || !onMove) return;
        const dx = ((event.clientX - drag.startX) / drag.width) * 100;
        const dy = ((event.clientY - drag.startY) / drag.height) * 100;
        if (Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) drag.moved = true;
        onMove(element.id, {
          xPct: Math.max(0, Math.min(100 - wPct, drag.xPct + dx)),
          yPct: Math.max(0, Math.min(96, drag.yPct + dy)),
        });
      }}
      onPointerUp={(event) => {
        const drag = dragRef.current;
        dragRef.current = null;
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
        if (!drag?.moved) onSelect(element);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(element);
        }
      }}
    />
  );
}

function DesignerCountdown({
  values,
  color,
}: {
  values: DesignerPreviewValues;
  color: string;
}) {
  const target = React.useMemo(() => {
    const raw = values.dateIso || values.date;
    const parsed = raw ? Date.parse(raw) : Number.NaN;
    return Number.isFinite(parsed) ? parsed : null;
  }, [values.date, values.dateIso]);
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!target) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  const diff = target ? Math.max(0, target - now) : 0;
  const units = [
    { label: "Ngày", value: Math.floor(diff / 86_400_000) },
    { label: "Giờ", value: Math.floor((diff / 3_600_000) % 24) },
    { label: "Phút", value: Math.floor((diff / 60_000) % 60) },
    { label: "Giây", value: Math.floor((diff / 1000) % 60) },
  ];

  return (
    <div className="w-full text-center" style={{ color }}>
      <p className="text-[8px] font-semibold tracking-[0.22em] uppercase opacity-75">
        Còn lại đến ngày cưới
      </p>
      <div className="mt-1.5 grid grid-cols-4 gap-1">
        {units.map((unit) => (
          <div key={unit.label} className="rounded-md border border-current/15 px-1 py-1">
            <p className="font-display text-sm font-semibold leading-none tabular-nums">
              {String(unit.value).padStart(2, "0")}
            </p>
            <p className="mt-0.5 text-[6px] uppercase opacity-70">{unit.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface DesignerTemplateRendererProps {
  canvas: DesignerCanvasContent;
  values?: DesignerPreviewValues;
  pageIndex?: number;
  /**
   * `framed` (mặc định) là khung xem trước có viền; `plain` dùng cho thiệp thật,
   * tràn viền theo bề rộng khung chứa.
   */
  variant?: "framed" | "plain";
  /**
   * Placeholder thiếu dữ liệu: `true` (mặc định) hiện giá trị mẫu cho preview,
   * `false` để trống trên thiệp thật.
   */
  sampleFallback?: boolean;
  /** Ghi đè theo từng thiệp (vị trí/chữ/ảnh/zoom). */
  overrides?: Record<string, DesignerElementOverride>;
  /** Chế độ chỉnh trực tiếp trong dashboard. */
  editable?: boolean;
  onElementClick?: (element: DesignerElement) => void;
  onElementMove?: (id: string, patch: DesignerMovePatch) => void;
}

/** Render layout JSON của designer: nền + element đặt theo %, thay placeholder bằng dữ liệu thật. */
export function DesignerTemplateRenderer({
  canvas,
  values = {},
  pageIndex = 0,
  variant = "framed",
  sampleFallback = true,
  overrides,
  editable = false,
  onElementClick,
  onElementMove,
}: DesignerTemplateRendererProps) {
  const page =
    Array.isArray(canvas.pages) && canvas.pages[pageIndex]
      ? canvas.pages[pageIndex]
      : canvas;
  const elements = Array.isArray(page.elements)
    ? page.elements
    : Array.isArray(canvas.elements)
      ? canvas.elements
      : [];
  const background = page.background ?? canvas.background;
  const backgroundUrl = page.backgroundUrl ?? canvas.backgroundUrl;
  const pageWidth = canvas.width > 0 ? canvas.width : 390;

  return (
    <div
      className={
        variant === "plain"
          ? "relative w-full overflow-hidden"
          : "relative mx-auto w-full max-w-[390px] overflow-hidden rounded-2xl border border-border shadow-xl"
      }
      style={{
        aspectRatio: `${canvas.width} / ${canvas.height}`,
        background,
        containerType: "inline-size",
      }}
    >
      <noscript>
        <style>{`[data-anim-in],[data-text-play="false"]{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important;animation:none!important}.anim-char,.anim-word{opacity:1!important;transform:none!important;animation:none!important}[data-loop]::after{display:none!important}`}</style>
      </noscript>

      {backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}

      {sortDesignerElementsByLayer(elements).map((element, index) => {
        const override = overrides?.[element.id];
        const fixedHeight =
          "hPct" in element && typeof element.hPct === "number";
        const baseStyle = {
          left: `${override?.xPct ?? element.xPct}%`,
          top: `${override?.yPct ?? element.yPct}%`,
          width: `${override?.wPct ?? element.wPct}%`,
          height:
            override?.hPct !== undefined
              ? `${override.hPct}%`
              : fixedHeight
                ? `${element.hPct}%`
                : undefined,
          overflow: fixedHeight || override?.hPct !== undefined ? "hidden" : undefined,
          transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
        } as const;

        const animatorClass = fixedHeight ? "h-full w-full" : "w-full";
        const customImage =
          override?.imageUrl ||
          (element.guestField && values[`field:${element.id}`]
            ? values[`field:${element.id}`]
            : "");
        const imageUrl = customImage || ("url" in element ? element.url : "");
        const imageStyle = {
          objectFit: "fit" in element ? element.fit : "cover",
          borderRadius: override?.radius,
          transform:
            override?.imageScale || override?.imageX || override?.imageY
              ? `scale(${override?.imageScale ?? 1}) translate(${override?.imageX ?? 0}%, ${override?.imageY ?? 0}%)`
              : undefined,
          transformOrigin: "center",
        } as const;

        if (element.type === "image") {
          return (
            <div key={element.id} className="absolute" style={baseStyle}>
              <ElementAnimator
                animation={element.animation}
                order={index}
                className={animatorClass}
                fill={fixedHeight}
                shimmerMaskUrl={imageUrl}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="block h-auto w-full" style={imageStyle} />
              </ElementAnimator>
            </div>
          );
        }

        if (element.type === "photo") {
          return (
            <div key={element.id} className="absolute" style={baseStyle}>
              <ElementAnimator
                animation={element.animation}
                order={index}
                className="h-full w-full"
                fill
                shimmerMaskUrl={imageUrl}
              >
                <div
                  className="h-full w-full overflow-hidden"
                  style={{
                    borderRadius: override?.radius,
                    background: "rgba(0,0,0,0.06)",
                  }}
                >
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt=""
                      className="h-full w-full"
                      style={imageStyle}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] opacity-60">
                      Ảnh: {element.slot}
                    </div>
                  )}
                </div>
              </ElementAnimator>
            </div>
          );
        }

        if (element.type === "fallingEffect") {
          return (
            <div
              key={element.id}
              className="absolute"
              style={{ ...baseStyle, pointerEvents: "none" }}
            >
              <FallingEffectCanvas effect={element} mode="live" />
            </div>
          );
        }

        if (element.type === "box") {
          return (
            <div key={element.id} className="absolute" style={baseStyle}>
              <ElementAnimator
                animation={element.animation}
                order={index}
                className="h-full w-full"
                fill
              >
                <div
                  className="h-full w-full"
                  style={{
                    background: element.fill,
                    border:
                      element.border === "none"
                        ? undefined
                        : `1px solid ${element.border}`,
                    borderRadius: element.radius,
                  }}
                />
              </ElementAnimator>
            </div>
          );
        }

        if (element.type === "icon") {
          const Icon = ICON_MAP[element.icon] ?? Star;
          return (
            <div key={element.id} className="absolute" style={baseStyle}>
              <ElementAnimator
                animation={element.animation}
                order={index}
                className={animatorClass}
                fill={fixedHeight}
              >
                <Icon
                  style={{ color: element.color, width: "100%", height: "auto" }}
                  strokeWidth={1.4}
                  aria-hidden="true"
                />
              </ElementAnimator>
            </div>
          );
        }

        if (element.type === "button") {
          return (
            <div key={element.id} className="absolute" style={baseStyle}>
              <ElementAnimator
                animation={element.animation}
                order={index}
                className={animatorClass}
                fill={fixedHeight}
              >
                <span
                  className="flex h-11 items-center justify-center px-4 text-sm font-semibold"
                  style={{
                    background: element.fill,
                    color: element.textColor,
                    borderRadius: element.radius,
                  }}
                >
                  {element.label || ACTION_LABELS[element.action] || "Nút"}
                </span>
              </ElementAnimator>
            </div>
          );
        }

        if (element.type === "block") {
          const blockBackground =
            element.fill ?? "rgba(255,255,255,0.55)";
          return (
            <div key={element.id} className="absolute" style={baseStyle}>
              <ElementAnimator
                animation={element.animation}
                order={index}
                className="h-full w-full"
                fill
              >
                <div
                  className="flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border border-current/15 p-2 text-center"
                  style={{
                    color: element.color,
                    background: blockBackground,
                  }}
                >
                  {element.block === "countdown" ? (
                    <DesignerCountdown values={values} color={element.color} />
                  ) : element.block === "calendar" ? (
                    <DesignerCalendar values={values} color={element.color} />
                  ) : element.block === "map" ? (
                    <DesignerMapBlock
                      values={values}
                      color={element.color}
                      buttonColor={element.buttonColor ?? canvas.accentColor}
                    />
                  ) : element.block === "rsvp" ? (
                    <>
                      <Heart className="h-5 w-5" aria-hidden="true" />
                      <span className="text-[11px] font-semibold">Xác nhận tham dự</span>
                      <a
                        href="#rsvp-wishes"
                        className="mt-1 rounded-full px-3 py-1 text-[9px] font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor:
                            element.buttonColor ?? canvas.accentColor ?? element.color,
                        }}
                      >
                        Xác nhận ngay
                      </a>
                    </>
                  ) : element.block === "music" ? (
                    values.hasMusic === "false" ? null : (
                      <>
                        <Music className="h-5 w-5" aria-hidden="true" />
                        <span className="text-[11px] font-semibold">
                          {values.musicTitle || "Nhạc nền"}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== "undefined") {
                              window.dispatchEvent(
                                new CustomEvent("inviwedd:toggle-music"),
                              );
                            }
                          }}
                          className="mt-1 rounded-full px-3 py-1 text-[9px] font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                          style={{
                            backgroundColor:
                              element.buttonColor ?? canvas.accentColor ?? element.color,
                          }}
                        >
                          Bật / Tắt nhạc
                        </button>
                      </>
                    )
                  ) : element.block === "gift" ? (
                    <>
                      <Gift className="h-5 w-5" aria-hidden="true" />
                      <span className="text-[11px] font-semibold">Mừng cưới</span>
                      <a
                        href="#wedding-gift-section"
                        className="mt-1 rounded-full px-3 py-1 text-[9px] font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor:
                            element.buttonColor ?? canvas.accentColor ?? element.color,
                        }}
                      >
                        Gửi quà mừng
                      </a>
                    </>
                  ) : element.block === "gallery" ? (
                    <>
                      <Camera className="h-5 w-5" aria-hidden="true" />
                      <span className="text-[11px] font-semibold">Album ảnh cưới</span>
                      <a
                        href="#wedding-gallery-section"
                        className="mt-1 rounded-full px-3 py-1 text-[9px] font-semibold text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                        style={{
                          backgroundColor:
                            element.buttonColor ?? canvas.accentColor ?? element.color,
                        }}
                      >
                        {Number(values.photoCount) > 0
                          ? `Xem ${values.photoCount} ảnh`
                          : "Xem album"}
                      </a>
                    </>
                  ) : (
                    <>
                      <Heart className="h-5 w-5" aria-hidden="true" />
                      <span className="text-[11px] font-medium">
                        {BLOCK_LABELS[element.block] ?? element.block}
                      </span>
                    </>
                  )}
                </div>
              </ElementAnimator>
            </div>
          );
        }

        const customText =
          element.guestField && values[`field:${element.id}`]
            ? values[`field:${element.id}`]
            : "";
        const resolvedText =
          override?.text ||
          customText ||
          resolveDesignerText(
            element.text,
            element.placeholder,
            values,
            sampleFallback,
          );

        return (
          <div
            key={element.id}
            className="absolute"
            style={{
              ...baseStyle,
              color: override?.color ?? element.color,
              fontFamily: element.fontFamily,
              fontSize: `calc(${override?.fontSize ?? element.fontSize} * 100cqw / ${pageWidth})`,
              lineHeight: element.lineHeight ?? 1.25,
              letterSpacing: `${element.letterSpacing ?? 0}em`,
              fontWeight: element.fontWeight ?? 400,
              fontStyle: element.fontStyle ?? "normal",
              textTransform: element.textTransform ?? "none",
              whiteSpace: "pre-wrap",
              textAlign: element.align ?? "left",
              ...getTextEffectStyles(element.textEffect),
            }}
          >
            <ElementAnimator
              animation={element.animation}
              order={index}
              className={animatorClass}
              fill={fixedHeight}
              text={resolvedText}
            >
              {resolvedText}
            </ElementAnimator>
          </div>
        );
      })}

      {editable && onElementClick && (
        <div className="absolute inset-0 z-30">
          {sortDesignerElementsByLayer(elements)
            .filter(
              (element) =>
                element.type === "text" ||
                element.type === "image" ||
                element.type === "photo",
            )
            .map((element) => (
              <EditorHotspot
                key={`edit-${element.id}`}
                element={element}
                override={overrides?.[element.id]}
                onSelect={onElementClick}
                onMove={onElementMove}
              />
            ))}
        </div>
      )}
    </div>
  );
}
