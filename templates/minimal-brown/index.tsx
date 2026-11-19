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
   Minimal Brown - "Nâu Đất & Kem Gấm"
   color_code.txt để trống nên palette sample từ bìa.png:
     nền be #F1E5D9 / #EBDBCC · thẻ kem #FBF7F0 · nâu #5A3A22
     nâu đậm #3A2314 · vàng nhũ #C9A25E
   Font: Playfair cho tên/tiêu đề, Lora cho nội dung (có dấu tiếng Việt).
   ============================================================ */

const BROWN = "#A76B43";
const BROWN_DEEP = "#7E4E2E";
const BEIGE = "#F4EAE2";
const CREAM = "#F7F7F8";
const ON_BROWN = "#FFFFFF";
const GOLD = "#A76B43";
const GOLD_DEEP = "#7E4E2E";
const GOLD_SOFT = "rgba(167, 107, 67, 0.30)";
const INK = "#5B3B26";
const MUTED = "#9A7A63";

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

  const dust = React.useMemo(
    () =>
      Array.from({ length: 16 }, (_, index) => ({
        id: index,
        left: 4 + ((index * 47) % 92),
        top: 8 + ((index * 61) % 80),
        size: 2 + ((index * 3) % 3),
        delay: (index % 7) * 1.1,
        duration: 9 + (index % 5) * 2,
      })),
    [],
  );

  return (
    <m.div
      className={cn("z-50 overflow-hidden", contained ? "absolute inset-0" : "fixed inset-0")}
      style={{ backgroundColor: BEIGE }}
      animate={closing ? { opacity: 0, scale: reduce ? 1 : 1.18 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.75, delay: closing ? 0.55 : 0, ease: "easeInOut" }}
      onAnimationComplete={() => {
        if (closing) onDoorsClosed();
      }}
    >
      {/* c\u00e0nh l\u00e1 m\u00e0u n\u01b0\u1edbc l\u1edbn ph\u1ee7 hai b\u00ean n\u1ec1n */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/templates/minimal-brown/leafs.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -left-[14%] top-0 w-[64%] opacity-95"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/templates/minimal-brown/leafs.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-[14%] top-[4%] w-[64%] -scale-x-100 opacity-95"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/templates/minimal-brown/leafs.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[8%] -left-[16%] w-[58%] opacity-80"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/templates/minimal-brown/leafs.webp"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-[16%] -bottom-[6%] w-[58%] -scale-x-100 opacity-80"
      />

      {/* b\u1ee5i nh\u0169 v\u00e0ng */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {dust.map((p) => (
          <m.span
            key={p.id}
            className="absolute rounded-full"
            style={{ left: `${p.left}%`, top: `${p.top}%`, width: p.size, height: p.size, backgroundColor: GOLD }}
            animate={reduce ? undefined : { opacity: [0.1, 0.65, 0.1], y: [0, -10, 0] }}
            transition={reduce ? undefined : { duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
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
        className={cn(
          "absolute inset-0 z-30 flex justify-center px-5",
          contained ? "items-start pt-[8vh]" : "items-center",
        )}
        style={{ perspective: "1400px" }}
      >
        <m.div
          className="relative w-full max-w-[360px]"
          style={{ transformStyle: "preserve-3d", transformOrigin: "right center" }}
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={
            closing
              ? { rotateY: reduce ? 0 : -102, opacity: 1, y: 0, scale: reduce ? 0.94 : 1.02 }
              : { rotateY: 0, opacity: 1, y: 0, scale: 1 }
          }
          transition={{ duration: closing ? 0.9 : 0.8, ease: closing ? [0.42, 0, 0.2, 1] : EASE }}
        >
          <div
            className="relative overflow-hidden rounded-md px-6 pt-10 pb-8 text-center"
            style={{
              backgroundColor: CREAM,
              border: `1px solid ${GOLD_SOFT}`,
              boxShadow: "0 18px 40px rgba(58,35,20,0.14)",
            }}
          >
            {/* vi\u1ec1n ch\u1ec9 v\u00e0ng */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-2.5 rounded-sm"
              style={{ border: `1px solid ${GOLD_SOFT}` }}
            />

            {/* c\u00e0nh l\u00e1 v\u1eaft ch\u00e9o qua m\u00e9p th\u1ebb nh\u01b0 m\u1eabu */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/templates/minimal-brown/leafs.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -top-12 -left-16 w-[58%] opacity-80"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/templates/minimal-brown/leafs.webp"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -bottom-12 w-[58%] -scale-x-100 opacity-80"
            />

            <h1 className="relative z-10" style={{ fontFamily: NAME_FONT, color: INK }}>
              <span className="block text-[32px] leading-tight break-words">
                {data.couple.groomName}
              </span>
              <span className="my-1 block text-[15px]" style={{ fontFamily: SERIF, color: MUTED }}>
                &amp;
              </span>
              <span className="block text-[32px] leading-tight break-words">
                {data.couple.brideName}
              </span>
            </h1>

            <div className="relative z-10 mx-auto mt-4 flex items-center justify-center gap-3" aria-hidden="true">
              <span className="h-px w-14" style={{ backgroundColor: GOLD_SOFT }} />
              <span className="text-[11px]" style={{ color: GOLD }}>❧</span>
              <span className="h-px w-14" style={{ backgroundColor: GOLD_SOFT }} />
            </div>

            <p className="relative z-10 mt-3 text-[15px]" style={{ fontFamily: BODY, color: INK }}>
              {date.dotDate}
            </p>
            <p className="relative z-10 mt-1.5 text-[9px] uppercase tracking-[0.3em]" style={{ color: MUTED }}>
              Thân mời
            </p>
            {guestName && (
              <p
                className="relative z-10 mx-auto mt-2 max-w-full truncate text-[13px] font-semibold"
                style={{ fontFamily: SERIF, color: BROWN }}
              >
                {guestName}
              </p>
            )}

            <span
              className="relative z-10 mt-6 inline-flex h-11 items-center justify-center rounded-full px-10 text-[12px] font-medium uppercase tracking-[0.18em]"
              style={{
                border: `1px solid ${BROWN}`,
                color: BROWN,
                backgroundColor: "rgba(167, 107, 67, 0.08)",
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
   Hero "Save The Date": phong bì + hai \u1ea3nh polaroid tr\u01b0\u1ee3t ra
   ------------------------------------------------------------ */
function Hero({ data, guestName }: { data: TemplateData; guestName: string }) {
  const reduce = useReducedMotion();
  const primary = getPrimaryEvent(data);
  const date = formatWeddingDateParts(eventStart(primary, data.date));
  const groom = data.photos.groomUrl;
  const bride = data.photos.brideUrl;

  return (
    <section className="px-5 pt-12 pb-8">
      <p className="text-center text-[9px] uppercase tracking-[0.38em]" style={{ color: MUTED }}>
        Save the date
      </p>
      <div className="mx-auto mt-2 mb-6 flex items-center justify-center gap-3" aria-hidden="true">
        <span className="h-px w-12" style={{ backgroundColor: GOLD_SOFT }} />
        <span className="text-[11px]" style={{ color: GOLD }}>❧</span>
        <span className="h-px w-12" style={{ backgroundColor: GOLD_SOFT }} />
      </div>

      <div className="relative mx-auto h-[330px] w-full max-w-[330px]">
        {/* hai \u1ea3nh ch\u00e2n dung tr\u01b0\u1ee3t ra kh\u1ecfi phong b\u00ec */}
        <m.div
          className="absolute bottom-[30%] left-1/2 z-40 w-[44%] -translate-x-[104%] origin-bottom"
          initial={reduce ? false : { y: 70, rotate: -9, opacity: 0 }}
          whileInView={reduce ? undefined : { y: 0, rotate: -7, opacity: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.85, delay: 0.55, ease: EASE }}
        >
          <m.div
            animate={reduce ? undefined : { rotate: [-1.2, 1.2, -1.2] }}
            transition={reduce ? undefined : { duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="rounded-[3px] bg-white p-1.5 shadow-[0_10px_24px_rgba(58,35,20,0.22)]">
              {bride ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bride} alt="" className="aspect-[3/4] w-full rounded-[2px] object-cover" />
              ) : (
                <TemplatePhotoPlaceholder label="Cô dâu" className="aspect-[3/4] w-full rounded-[2px]" />
              )}
            </div>
          </m.div>
        </m.div>

        <m.div
          className="absolute bottom-[34%] left-1/2 z-40 w-[44%] -translate-x-[4%] origin-bottom"
          initial={reduce ? false : { y: 86, rotate: 8, opacity: 0 }}
          whileInView={reduce ? undefined : { y: 0, rotate: 6, opacity: 1 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.85, delay: 0.35, ease: EASE }}
        >
          <m.div
            animate={reduce ? undefined : { rotate: [1, -1, 1] }}
            transition={reduce ? undefined : { duration: 6.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="rounded-[3px] bg-white p-1.5 shadow-[0_10px_24px_rgba(58,35,20,0.22)]">
              {groom ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={groom} alt="" className="aspect-[3/4] w-full rounded-[2px] object-cover" />
              ) : (
                <TemplatePhotoPlaceholder label="Chú rể" className="aspect-[3/4] w-full rounded-[2px]" />
              )}
            </div>
          </m.div>
        </m.div>

        {/* phong b\u00ec n\u00e2u \u1edf d\u01b0\u1edbi, che ch\u00e2n \u1ea3nh */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/templates/minimal-brown/envelope.webp"
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 z-30 w-full max-w-[320px] -translate-x-1/2"
        />
      </div>

      <div className="relative mt-2 text-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-6 select-none text-[76px] leading-none"
          style={{ fontFamily: SERIF, color: "rgba(90,58,34,0.10)" }}
        >
          &amp;
        </span>
        <p className="relative" style={{ fontFamily: NAME_FONT, color: INK }}>
          <span className="block text-[26px] italic leading-tight break-words">{data.couple.groomName}</span>
          <span className="block text-[26px] italic leading-tight break-words">{data.couple.brideName}</span>
        </p>
        <p className="relative mt-2 text-[13px]" style={{ fontFamily: BODY, color: MUTED }}>
          {date.dotDate}
        </p>
        {guestName && (
          <p
            className="relative mx-auto mt-3 inline-block max-w-full truncate rounded-full px-4 py-1 text-[11px]"
            style={{ border: `1px solid ${GOLD_SOFT}`, color: BROWN }}
          >
            {data.ui.invitePrefix}: <strong className="font-semibold">{guestName}</strong>
          </p>
        )}
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
                <span className="relative mt-[2px] text-[10px] font-semibold" style={{ color: "#FFFFFF" }}>
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
              style={{ backgroundColor: BROWN, color: "#FFFFFF" }}
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
                    <span
                      className="absolute top-4 bottom-[-20px] w-px"
                      style={{ backgroundColor: GOLD_SOFT }}
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
          <img
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
            src="/templates/minimal-brown/gift.webp"
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
      data-template-id="minimal-brown"
      className={cn(
        "relative min-w-0 overflow-x-hidden antialiased",
        contained ? "min-h-full" : "min-h-screen-dvh",
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
                tone="minbrown"
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
          tone="minbrown"
        />
      )}

      <GiftModal
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        gift={data.gift}
        plan={data.plan}
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName ?? null}
                tone="minbrown"
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
