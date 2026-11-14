import {
  CalendarDays,
  Camera,
  Flower2,
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
  DesignerIconName,
} from "@/components/ops/designer-types";
import { resolveDesignerText } from "@/lib/designer-text";

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
  calendar: "Thứ Bảy · 20.03.2027",
  map: "White Palace, TP.HCM",
  rsvp: "Xác nhận tham dự",
  gift: "Mừng cưới QR",
  gallery: "Album ảnh",
  music: "Nhạc nền",
};

interface DesignerTemplateRendererProps {
  canvas: DesignerCanvasContent;
  values?: DesignerPreviewValues;
  pageIndex?: number;
}

/** Render layout JSON của designer: nền + element đặt theo %, thay placeholder bằng dữ liệu thật. */
export function DesignerTemplateRenderer({
  canvas,
  values = {},
  pageIndex = 0,
}: DesignerTemplateRendererProps) {
  const page = canvas.pages?.[pageIndex] ?? canvas;
  const elements = page.elements ?? canvas.elements ?? [];
  const background = page.background ?? canvas.background;
  const backgroundUrl = page.backgroundUrl ?? canvas.backgroundUrl;

  return (
    <div
      className="relative mx-auto w-full max-w-[390px] overflow-hidden rounded-2xl border border-border shadow-xl"
      style={{
        aspectRatio: `${canvas.width} / ${canvas.height}`,
        background,
      }}
    >
      {backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}

      {elements.map((element) => {
        const baseStyle = {
          left: `${element.xPct}%`,
          top: `${element.yPct}%`,
          width: `${element.wPct}%`,
        } as const;

        if (element.type === "image") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={element.id}
              src={element.url}
              alt=""
              className="absolute h-auto"
              style={baseStyle}
            />
          );
        }

        if (element.type === "box") {
          return (
            <div
              key={element.id}
              className="absolute"
              style={{
                ...baseStyle,
                height: `${element.hPct}%`,
                background: element.fill,
                border: element.border === "none" ? undefined : `1px solid ${element.border}`,
                borderRadius: element.radius,
              }}
            />
          );
        }

        if (element.type === "icon") {
          const Icon = ICON_MAP[element.icon] ?? Star;
          return (
            <div key={element.id} className="absolute" style={baseStyle}>
              <Icon
                style={{ color: element.color, width: "100%", height: "auto" }}
                strokeWidth={1.4}
                aria-hidden="true"
              />
            </div>
          );
        }

        if (element.type === "button") {
          return (
            <div key={element.id} className="absolute" style={baseStyle}>
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
            </div>
          );
        }

        if (element.type === "block") {
          return (
            <div
              key={element.id}
              className="absolute overflow-hidden rounded-xl border border-current/15"
              style={{
                ...baseStyle,
                height: `${element.hPct}%`,
                color: element.color,
                background: "rgba(255,255,255,0.55)",
              }}
            >
              <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
                {element.block === "map" ? (
                  <MapPin className="h-5 w-5" aria-hidden="true" />
                ) : element.block === "calendar" ? (
                  <CalendarDays className="h-5 w-5" aria-hidden="true" />
                ) : element.block === "music" ? (
                  <Music className="h-5 w-5" aria-hidden="true" />
                ) : element.block === "gift" ? (
                  <QrCode className="h-5 w-5" aria-hidden="true" />
                ) : element.block === "gallery" ? (
                  <Camera className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Heart className="h-5 w-5" aria-hidden="true" />
                )}
                <span className="text-[11px] font-medium">
                  {BLOCK_LABELS[element.block] ?? element.block}
                </span>
              </div>
            </div>
          );
        }

        return (
          <div
            key={element.id}
            className="absolute"
            style={{
              ...baseStyle,
              color: element.color,
              fontFamily: element.fontFamily,
              fontSize: element.fontSize,
              lineHeight: 1.25,
              whiteSpace: "pre-wrap",
            }}
          >
            {resolveDesignerText(element.text, element.placeholder, values)}
          </div>
        );
      })}
    </div>
  );
}
