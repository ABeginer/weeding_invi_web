"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { m, useReducedMotion } from "motion/react";import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import type { TemplateData, WeddingEvent } from "@/lib/wedding-types";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   Đỏ Rượu Vang — mẫu "Hoàng Kim II Đỏ"
   Mã màu khách đưa (color_code.txt):
     theme main #390202 · text #E5E4D0
   Dòng "golder outline: #390202" trong file là lỗi copy (trùng màu nền) nên
   viền vàng lấy theo mô tả: champagne #E5C787 → #F7E7CE.
   Phụ: burgundy #6E0B14 → #8F111D (nền thẻ), espresso #2C1618, kem #FDFBF7.
   Font: tên cặp đôi dùng Playfair italic (mockup là serif, và có dấu tiếng
   Việt); nội dung Lora. Không dùng Pattaya vì thiếu glyph tiếng Việt.
   ============================================================ */

const RED = "#6E0B14";
const RED_DEEP = "#4A060C";
const BG_DARK = "#390202";
const CREAM = "#FDFBF7";
const ON_RED = "#E5E4D0";
const GOLD = "#E5C787";
const GOLD_DEEP = "#C9A15E";
const GOLD_LIGHT = "#F7E7CE";
const GOLD_SOFT = "rgba(229, 199, 135, 0.38)";
const INK = "#E5E4D0";
const MUTED = "#B3B2A0";

const SERIF = "var(--font-playfair), Georgia, serif";
/** Tên cô dâu chú rể: serif nghiêng, đủ dấu tiếng Việt. */
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

function getPrimaryEvent(data: TemplateData): WeddingEvent | undefined {
  return data.events[0];
}

function eventStart(event: WeddingEvent | undefined, fallback: string): string {
  return event?.startsAt ?? fallback;
}

/**
 * Tiếng "ting" khi mở thiệp — tổng hợp bằng Web Audio nên không cần thêm asset
 * và không phụ thuộc mạng. Nếu trình duyệt chặn audio thì bỏ qua im lặng.
 */
function playOpenChime() {
  try {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.012);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
    master.connect(ctx.destination);

    // E6 + B6: quãng năm, nghe như chuông thuỷ tinh rất nhẹ.
    [1318.5, 1975.5].forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.value = index === 0 ? 1 : 0.32;
      osc.connect(gain);
      gain.connect(master);
      osc.start(now);
      osc.stop(now + (index === 0 ? 0.9 : 0.55));
    });

    window.setTimeout(() => void ctx.close(), 1300);
  } catch {
    // Không có audio thì bỏ qua.
  }
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
  const reduce = useReducedMotion();
  return (
    <div
      className={cn("rounded-t-[999px] p-[4px]", className)}
      style={{ border: `1px solid ${GOLD}`, backgroundColor: "rgba(104,14,14,0.45)" }}
    >
      <div
        className="relative overflow-hidden rounded-t-[999px]"
        style={{ border: `1px solid ${GOLD_SOFT}`, backgroundColor: "#3A0807" }}
      >
        {url ? (
          // Observer phải đặt trên KHUNG (luôn hiện), không đặt trên ảnh đang
          // trượt từ dưới lên: ảnh bị clip kín nên intersection = 0 và
          // whileInView không bao giờ chạy (xem card_exp §22.20).
          <m.div
            className="relative aspect-[2/3] w-full overflow-hidden rounded-t-[999px]"
            initial={reduce ? false : "hidden"}
            whileInView={reduce ? undefined : "show"}
            viewport={{ once: true, amount: 0.25 }}
          >
            <m.div
              className="absolute inset-0"
              variants={{ hidden: { y: "100%" }, show: { y: "0%" } }}
              transition={{ duration: 0.9, ease: EASE }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <m.img
                src={url}
                alt={alt}
                className="block h-full w-full object-cover"
                loading="eager"
                decoding="async"
                animate={reduce ? undefined : { scale: [1, 1.04] }}
                transition={reduce ? undefined : { duration: 8, ease: "easeOut" }}
              />
            </m.div>
          </m.div>
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
  const primary = getPrimaryEvent(data);
  const date = formatWeddingDateParts(eventStart(primary, data.date));

  // 12 ngôi sao 4 cánh rải ở hậu cảnh, mỗi ngôi lệch chu kỳ
  const stars = React.useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => ({
        id: index,
        left: 4 + ((index * 37) % 92),
        top: 5 + ((index * 53) % 88),
        size: 8 + ((index * 7) % 12),
        delay: (index % 6) * 0.7,
        duration: 3.4 + (index % 5) * 1.1,
        opacity: 0.28 + ((index * 13) % 40) / 100,
      })),
    [],
  );

  return (
    <m.div
      className={cn("z-50 overflow-hidden", contained ? "absolute inset-0" : "fixed inset-0")}
      style={{ backgroundColor: BG_DARK }}
      animate={closing ? { opacity: 0, scale: reduce ? 1 : 1.04 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      onAnimationComplete={() => {
        if (closing) onDoorsClosed();
      }}
    >
      {/* nền rượu vang */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(120% 85% at 50% 45%, #4E060C 0%, #390202 55%, #2A0101 100%)`,
        }}
      />

      {/* sao 4 cánh lấp lánh */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {stars.map((star) => (
          <m.span
            key={star.id}
            className="absolute select-none leading-none"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              fontSize: star.size,
              color: GOLD_LIGHT,
              opacity: star.opacity,
            }}
            animate={
              reduce
                ? undefined
                : {
                    opacity: [star.opacity * 0.45, star.opacity, star.opacity * 0.45],
                    rotate: [0, 18, 0],
                    scale: [0.94, 1.06, 0.94],
                  }
            }
            transition={
              reduce
                ? undefined
                : {
                    duration: star.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: star.delay,
                  }
            }
          >
            ✦
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

      <div
        className={cn(
          "absolute inset-0 z-30 flex justify-center px-6",
          // Trong preview (contained) bìa phủ toàn trang dài nên phải neo lên đỉnh
          // (card_exp §22.3).
          contained ? "items-start pt-[7vh]" : "items-center",
        )}
      >
        <m.div
          className="pointer-events-none relative w-full max-w-[360px]"
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {/* khung thẻ */}
          <div
            className="relative overflow-visible rounded-[18px] px-6 py-10 text-center"
            style={{
              background: `linear-gradient(165deg, ${RED} 0%, ${RED_DEEP} 55%, #37040A 100%)`,
              boxShadow: "0 26px 60px rgba(0,0,0,0.55)",
            }}
          >
            {/* viền kép */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-2.5 rounded-[12px]"
              style={{ border: `1px solid ${GOLD}` }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-[18px] rounded-[8px]"
              style={{ border: `1px solid ${GOLD_SOFT}` }}
            />

            {/* cụm hoa góc trên trái — lật + xoay đặt trên <img> tĩnh để không
                xung đột transform với Motion ở lớp ngoài */}
            <m.div
              className="pointer-events-none absolute -top-16 -left-14 w-[42%] max-w-[160px]"
              initial={reduce ? false : { x: -36, y: -18, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: EASE, delay: 0.12 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/templates/do-ruou-vang/rose.webp"
                alt=""
                aria-hidden="true"
                className="block w-full"
                style={{ transform: "rotate(-12deg)" }}
              />
            </m.div>

            {/* cụm hoa góc dưới phải (lật ngang) */}
            <m.div
              className="pointer-events-none absolute -right-16 -bottom-20 w-[40%] max-w-[150px]"
              initial={reduce ? false : { x: 36, y: 18, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: EASE, delay: 0.22 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/templates/do-ruou-vang/rose.webp"
                alt=""
                aria-hidden="true"
                className="block w-full"
                style={{ transform: "scaleX(-1) rotate(14deg)" }}
              />
            </m.div>

            {/* nội dung */}
            <div className="relative z-10">
              <span
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: GOLD_LIGHT }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill={BG_DARK}>
                  <path d="M12 21.2c-.3 0-.6-.1-.9-.3C7.5 18.4 2 14.2 2 8.9 2 5.6 4.4 3.4 7.3 3.4c1.8 0 3.4 1 4.7 2.6 1.3-1.6 2.9-2.6 4.7-2.6C19.6 3.4 22 5.6 22 8.9c0 5.3-5.5 9.5-9.1 12-.3.2-.6.3-.9.3Z" />
                </svg>
              </span>

              <p
                className="mt-4 text-[9px] uppercase tracking-[0.3em]"
                style={{ color: MUTED }}
              >
                You are invited to the wedding of
              </p>

              <h1
                className="mt-3 text-[32px] leading-[1.2]"
                style={{ fontFamily: NAME_FONT, color: GOLD_LIGHT }}
              >
                <span className="block break-words">{data.couple.groomName}</span>
                <span className="my-1 block text-[17px]" style={{ fontFamily: SERIF, color: GOLD }}>
                  &amp;
                </span>
                <span className="block break-words">{data.couple.brideName}</span>
              </h1>

              <div className="mx-auto mt-4 flex items-center justify-center gap-3" aria-hidden="true">
                <span className="h-px w-12" style={{ backgroundColor: GOLD_SOFT }} />
                <span className="text-[11px]" style={{ color: GOLD }}>❦</span>
                <span className="h-px w-12" style={{ backgroundColor: GOLD_SOFT }} />
              </div>

              <p className="mt-3 text-[15px]" style={{ fontFamily: BODY, color: ON_RED }}>
                {date.dotDate}
              </p>
              <p className="mt-1.5 text-[9px] uppercase tracking-[0.26em]" style={{ color: MUTED }}>
                Thân Mời
              </p>

              <span
                className="mt-6 inline-flex h-10 items-center justify-center rounded-full px-9 text-[13px]"
                style={{ backgroundColor: GOLD_LIGHT, color: RED_DEEP }}
              >
                Mở thiệp
              </span>
            </div>
          </div>
        </m.div>
      </div>

    </m.div>
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
            {data.ui.eyebrow || "WELCOME TO OUR WEDDING"}
          </p>

          <div className="mt-3 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 text-right">
              <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: ON_RED }}>
                {data.couple.groomTitle || "Chú rể"}
              </p>
              <p className="mt-0.5 break-words text-[21px]" style={{ fontFamily: NAME_FONT, fontStyle: "italic", color: GOLD }}>
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
              <p className="mt-0.5 break-words text-[21px]" style={{ fontFamily: NAME_FONT, fontStyle: "italic", color: GOLD }}>
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

          <div className="relative z-10 mt-8 pb-1">
            <div className="mb-3 flex items-center justify-center gap-3" aria-hidden="true">
              <span className="h-px w-12" style={{ backgroundColor: GOLD_SOFT }} />
              <span className="text-[13px]" style={{ color: GOLD }}>❦</span>
              <span className="h-px w-12" style={{ backgroundColor: GOLD_SOFT }} />
            </div>

            <ArchPhoto
              url={data.photos.heroUrl}
              alt={data.photos.heroAlt || `Ảnh cưới ${data.couple.groomName} & ${data.couple.brideName}`}
              className="mx-auto w-[68%] max-w-[240px] sm:max-w-[300px] md:max-w-[380px]"
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
  if (data.events.length === 0) return null;

  return (
    <section className="px-4 py-6" style={{ backgroundColor: "transparent" }}>
      <div className="mx-auto max-w-[560px]">
        <GoldTitle>Sự kiện</GoldTitle>

        <div className="mt-5 space-y-4">
          {data.events.map((event) => {
            const date = formatWeddingDateParts(event.startsAt);
            return (
              <article
                key={event.id}
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
                    (Tức ngày {event.lunarDate})
                  </p>
                )}

                <p className="mt-3 text-[14px] font-semibold" style={{ color: INK }}>
                  {event.venueName}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed" style={{ color: MUTED }}>
                  {event.venueAddress}
                </p>

                {event.mapDirectionsUrl && (
                  <a
                    href={event.mapDirectionsUrl}
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
function MonthGrid({ iso }: { iso: string }) {
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
        {cells.list.map((day, index) => (
          <span key={index} className="flex h-7 items-center justify-center">
            {day === null ? null : day === cells.day ? (
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
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Đếm ngược tới giờ cưới
   ------------------------------------------------------------ */
function Countdown({ iso }: { iso: string }) {
  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const target = new Date(iso).getTime();
  if (Number.isNaN(target) || now === null) return null;

  const diff = Math.max(0, target - now);
  const parts = [
    { value: Math.floor(diff / 86400000), label: "ngày" },
    { value: Math.floor((diff % 86400000) / 3600000), label: "giờ" },
    { value: Math.floor((diff % 3600000) / 60000), label: "phút" },
    { value: Math.floor((diff % 60000) / 1000), label: "giây" },
  ];

  return (
    <p className="mt-2 text-[14px]" style={{ fontFamily: SERIF, color: ON_RED }}>
      {parts.map((part, index) => (
        <span key={part.label}>
          <span style={{ color: GOLD, fontSize: 20 }}>{part.value}</span>{" "}
          <span style={{ color: MUTED }}>{part.label}</span>
          {index < parts.length - 1 ? " · " : ""}
        </span>
      ))}
    </p>
  );
}

/* ------------------------------------------------------------
   Thông tin tiệc + CTA xác nhận
   ------------------------------------------------------------ */
function PartySection({ data }: { data: TemplateData }) {
  const primary = getPrimaryEvent(data);
  const iso = eventStart(primary, data.date);
  const date = formatWeddingDateParts(iso);

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
            <p className="mt-1 text-[11px]" style={{ color: MUTED }}>(Tức ngày {primary.lunarDate})</p>
          )}
        </div>

        {/* Đón khách / Khai tiệc + đếm ngược (theo mockup pic4) */}
        {(() => {
          const timeline = getTimeline(data);
          const arrival = timeline[0];
          const start = timeline[1] ?? timeline[0];
          return (
            <div className="mt-5 text-center">
              {arrival && start && (
                <div className="flex items-center justify-center gap-8">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.22em]" style={{ color: MUTED }}>
                      Đón khách
                    </p>
                    <p className="mt-1 text-[17px]" style={{ fontFamily: SERIF, color: GOLD }}>
                      {arrival.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.22em]" style={{ color: MUTED }}>
                      Khai tiệc
                    </p>
                    <p className="mt-1 text-[17px]" style={{ fontFamily: SERIF, color: GOLD }}>
                      {start.time}
                    </p>
                  </div>
                </div>
              )}

              <p className="mt-5 text-[11px] uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                Cùng đếm ngược
              </p>
              <Countdown iso={iso} />
            </div>
          );
        })()}

        <MonthGrid iso={iso} />

        <div className="mt-5 text-center">
          {calendarUrl && (
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] underline underline-offset-4"
              style={{ color: GOLD }}
            >
              Thêm vào lịch
            </a>
          )}
          <div className="mt-4">
            <a
              href="#rsvp-wishes"
              className="inline-flex h-11 items-center justify-center rounded-full px-8 text-[12px] font-semibold uppercase tracking-[0.14em]"
              style={{ backgroundColor: GOLD, color: RED_DEEP }}
            >
              Xác nhận tham dự
            </a>
          </div>
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
function AlbumCarousel({ data }: { data: TemplateData }) {
  const reduce = useReducedMotion();
  const limit = data.plan === "free" ? 5 : 30;
  const photos = data.photos.gallery.slice(0, limit);
  const total = photos.length;
  const [index, setIndex] = React.useState(0);
  const [lightbox, setLightbox] = React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const go = React.useCallback(
    (step: number) => setIndex((prev) => (prev + step + total) % total),
    [total],
  );

  // tự chuyển nhẹ nhàng; dừng khi đang xem ảnh lớn hoặc rê chuột
  React.useEffect(() => {
    if (reduce || paused || lightbox !== null || total < 2) return;
    const timer = window.setInterval(() => go(1), 4200);
    return () => window.clearInterval(timer);
  }, [go, lightbox, paused, reduce, total]);

  React.useEffect(() => {
    if (lightbox === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
      if (event.key === "ArrowRight") {
        setLightbox((prev) => (prev === null ? prev : (prev + 1) % total));
      }
      if (event.key === "ArrowLeft") {
        setLightbox((prev) => (prev === null ? prev : (prev - 1 + total) % total));
      }
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [lightbox, total]);

  if (total === 0) return null;

  return (
    <section className="px-4 py-6">
      <GoldTitle>Album ảnh</GoldTitle>

      <div
        className="relative mt-4 h-[330px] overflow-hidden sm:h-[380px]"
        style={{ perspective: "1100px" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="relative mx-auto h-full w-full max-w-[520px]">
          {photos.map((photo, i) => {
            let distance = i - index;
            if (distance > total / 2) distance -= total;
            if (distance < -total / 2) distance += total;
            const abs = Math.abs(distance);
            const near = Math.min(abs, 2);

            return (
              <button
                key={photo.id}
                type="button"
                onClick={() => (distance === 0 ? setLightbox(i) : setIndex(i))}
                aria-label={distance === 0 ? `Xem ảnh ${i + 1}` : `Chuyển tới ảnh ${i + 1}`}
                className="absolute top-0 left-1/2 h-full w-[64%] origin-center overflow-hidden rounded-xl transition-[transform,opacity] duration-[620ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{
                  border: `1px solid ${GOLD}`,
                  backgroundColor: "#2E0409",
                  transform:
                    `translateX(calc(-50% + ${(distance * 46).toFixed(2)}%)) ` +
                    `scale(${(1 - near * 0.12).toFixed(3)}) ` +
                    `rotateY(${(-distance * 22).toFixed(1)}deg)`,
                  opacity: abs > 2.2 ? 0 : 1 - near * 0.32,
                  zIndex: Math.round(100 - abs * 10),
                  pointerEvents: abs > 0.6 && abs < 1.6 ? "auto" : abs > 1.6 ? "none" : "auto",
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
            className="pointer-events-none absolute inset-0 mx-auto w-full max-w-[520px]"
            style={{ zIndex: 200 }}
          >
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Ảnh trước"
              className="pointer-events-auto absolute top-1/2 left-0 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full sm:flex"
              style={{ backgroundColor: GOLD_LIGHT, color: RED_DEEP }}
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Ảnh sau"
              className="pointer-events-auto absolute top-1/2 right-0 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full sm:flex"
              style={{ backgroundColor: GOLD_LIGHT, color: RED_DEEP }}
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2.4} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {total > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1.5">
          {photos.map((photo, i) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ảnh ${i + 1}`}
              aria-current={i === index}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 18 : 6,
                backgroundColor: i === index ? GOLD : GOLD_SOFT,
              }}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em]" style={{ color: MUTED }}>
        Chạm vào ảnh để phóng to
      </p>

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
          {total > 1 && (
            <div
              className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-3"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightbox((prev) => (prev === null ? prev : (prev - 1 + total) % total))}
                aria-label="Ảnh trước"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setLightbox((prev) => (prev === null ? prev : (prev + 1) % total))}
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
            src="/templates/long-phung/gift-box.webp"
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
      data-template-id="do-ruou-vang"
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
              <SectionReveal><AlbumCarousel data={data} /></SectionReveal>
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
              {/* dải hoa vàng làm nhịp chuyển vào phần lời chúc.
                  Neo đáy để mép cắt của asset trùng đường phân cách section. */}
              <div aria-hidden="true" className="relative -mb-4 h-20 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/templates/do-ruou-vang/garland.webp"
                  alt=""
                  className="absolute inset-x-0 bottom-0 mx-auto w-[118%] max-w-none opacity-75"
                />
              </div>
              <SectionReveal>
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                tone="ruby"
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
          tone="ruby"
        />
      )}

      <GiftModal
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        gift={data.gift}
        plan={data.plan}
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName ?? null}
                tone="ruby"
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
