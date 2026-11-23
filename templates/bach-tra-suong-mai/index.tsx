"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  Clock,
  Heart,
  ExternalLink,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playOpenCardSound } from "@/lib/sound-effects";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingEvent, WeddingPlan } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: BẠCH TRÀ SƯƠNG MAI
   - Xanh rừng sâu (Deep Sage — Chữ chính, nút CTA, trái tim lịch): #23382B (sâu #18281E, hover #2E4738)
   - Xanh rêu sương (Misty Sage — Chữ phụ, đường kẻ, nhãn phụ): #4A5D50 (nhạt #8FA394)
   - Kem lụa sương mai (Frosted Silk Ivory — Thẻ nội dung bán trong suốt): rgba(252, 250, 246, 0.88)
   - Vàng champagne (Gold Accent — Viền chỉ mảnh, khung vòm, con dấu): #C8A96E (nhạt #E5D3B3)
   - Hồng phấn sương (Soft Blush — Điểm nhấn nhụy hoa & viền phụ): #E8C5C0
   ============================================================ */

const DEEP_SAGE = "#23382B";
const SAGE_DARK = "#18281E";
const SAGE_HOVER = "#2E4738";
const MISTY_SAGE = "#4A5D50";
const SAGE_LIGHT = "#8FA394";

const FROSTED_SILK = "rgba(252, 250, 246, 0.88)";
const FROSTED_CARD = "#FFFFFF";

const GOLD_CHAMPAGNE = "#C8A96E";
const GOLD_LIGHT = "#E5D3B3";
const GOLD_BORDER = "rgba(200, 169, 110, 0.45)";
const GOLD_SUBTLE = "rgba(200, 169, 110, 0.25)";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-lora), Georgia, serif";

const EASE_EDITORIAL = [0.16, 1, 0.3, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "17:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm" },
  { time: "18:30", label: "Lễ thành hôn & Trao lời hẹn ước" },
  { time: "19:00", label: "Khai tiệc mừng uyên ương hạnh phúc" },
  { time: "20:00", label: "Giai điệu âm nhạc & Trò chơi gắn kết" },
  { time: "21:00", label: "Tiễn khách & Trao quà cảm tạ" },
];

const DEFAULT_DRESS = ["#FFFFFF", "#D9C3A9", "#9EAD9B"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Bụi Sương Mai & Cánh Hoa Bạch Trà Trôi Nhẹ
   ------------------------------------------------------------ */
function CamelliaDewParticles({ count = 18 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 17) % 94 + 3}%`,
      size: (idx % 3) + 2.5,
      duration: 8 + (idx % 4) * 2,
      delay: (idx * 0.4) % 4,
      yOffset: 30 + (idx % 4) * 25,
      isGold: idx % 3 === 0,
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <m.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.left,
            bottom: "-10px",
            width: p.size,
            height: p.size,
            background: p.isGold
              ? "radial-gradient(circle, #FFFFFF 20%, #C8A96E 70%, transparent 100%)"
              : "radial-gradient(circle, #FFFFFF 40%, rgba(252,250,246,0.8) 75%, transparent 100%)",
            boxShadow: p.isGold
              ? "0 0 6px 1px rgba(200, 169, 110, 0.6)"
              : "0 0 5px 1px rgba(255, 255, 255, 0.5)",
          }}
          animate={{
            y: [0, -440 - p.yOffset],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * 16, 0],
            opacity: [0, 0.85, 0.95, 0.35, 0],
            scale: [0.6, 1.2, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ============================================================
   LỚP 1: MÀN HÌNH BÌA MỞ THIỆP (ENVELOPE COVER)
   - Khóa h-full overflow-hidden khi contained / 100dvh trên thật
   - Thẻ lụa kính mờ trung tâm (my-auto) viền đôi chỉ vàng champagne
   - 4 góc hoa bạch trà corner-tl.webp đối xứng bằng CSS transforms
   - Con dấu sáp vàng wax-seal.webp tỏa sáng nhẹ
   - Tên cặp đôi 3 dòng chuẩn typographic serif
   ============================================================ */
interface EnvelopeCoverProps {
  data: TemplateData;
  guestName?: string | null;
  contained: boolean;
  onOpen: () => void;
}

function EnvelopeCover({ data, guestName, contained, onOpen }: EnvelopeCoverProps) {
  const [openingStage, setOpeningStage] = React.useState(false);
  const reduce = useReducedMotion();

  const visibleEvents = getVisibleEvents(data);
  const primaryEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const dateParts = primaryEvent?.startsAt
    ? formatWeddingDateParts(primaryEvent.startsAt)
    : { weekday: "Chủ Nhật", dotDate: "26.10.2025" };

  const lunarText = primaryEvent?.lunarDate
    ? formatLunarDateClean(primaryEvent.lunarDate)
    : "06 tháng 09 năm Ất Tỵ";

  const handleOpenClick = () => {
    if (openingStage) return;
    setOpeningStage(true);
    playOpenCardSound();
    setTimeout(() => {
      onOpen();
    }, 550);
  };

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden select-none",
        contained ? "h-full min-h-full" : "min-h-screen-dvh min-h-screen",
      )}
      style={{
        background: `radial-gradient(circle at 50% 40%, #2A4434 0%, ${DEEP_SAGE} 60%, ${SAGE_DARK} 100%)`,
      }}
    >
      {/* Background Texture Mobile */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-35 mix-blend-overlay"
        style={{ backgroundImage: "url('/templates/bach-tra-suong-mai/background-mobile.webp')" }}
      />

      <CamelliaDewParticles count={18} />

      {/* Thẻ Lụa Kính Mờ Trung Tâm (Frosted Silk Ivory Card) */}
      <m.div
        className={cn(
          "relative z-10 my-auto flex w-full max-w-sm flex-col items-center rounded-3xl p-6 text-center backdrop-blur-md shadow-2xl transition-all",
          contained ? "py-5" : "py-8",
        )}
        style={{
          backgroundColor: FROSTED_SILK,
          boxShadow: "0 25px 60px -12px rgba(24, 40, 30, 0.35)",
        }}
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={
          openingStage
            ? { opacity: 0, scale: 0.92, y: -20 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{ duration: 0.6, ease: EASE_EDITORIAL }}
      >
        {/* Khung viền chỉ vàng champagne đôi & 4 góc hoa bạch trà ôm sát */}
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-[#C8A96E]/55">
          <div className="absolute inset-1 rounded-xl border border-[#C8A96E]/30" />

          {/* 4 Góc hoa bạch trà từ corner-tl.webp dùng CSS transforms */}
          <img
            src="/templates/bach-tra-suong-mai/corner-tl.webp"
            alt=""
            className="pointer-events-none absolute top-0 left-0 h-auto w-10 opacity-85 sm:w-12 md:w-14"
            aria-hidden="true"
          />
          <img
            src="/templates/bach-tra-suong-mai/corner-tl.webp"
            alt=""
            className="pointer-events-none absolute top-0 right-0 h-auto w-10 -scale-x-100 opacity-85 sm:w-12 md:w-14"
            aria-hidden="true"
          />
          <img
            src="/templates/bach-tra-suong-mai/corner-tl.webp"
            alt=""
            className="pointer-events-none absolute bottom-0 left-0 h-auto w-10 -scale-y-100 opacity-85 sm:w-12 md:w-14"
            aria-hidden="true"
          />
          <img
            src="/templates/bach-tra-suong-mai/corner-tl.webp"
            alt=""
            className="pointer-events-none absolute bottom-0 right-0 h-auto w-10 -scale-100 opacity-85 sm:w-12 md:w-14"
            aria-hidden="true"
          />
        </div>

        {/* Con dấu sáp vàng champagne (Wax Seal) */}
        <m.div
          className="relative my-1 flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE_EDITORIAL }}
        >
          {/* Quầng sáng thở vàng champagne dịu */}
          <m.div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(200,169,110,0.4) 0%, rgba(200,169,110,0.06) 65%, transparent 80%)",
            }}
            animate={
              reduce
                ? {}
                : {
                  scale: [1, 1.15, 1],
                  opacity: [0.6, 0.95, 0.6],
                }
            }
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <img
            src="/templates/bach-tra-suong-mai/wax-seal.webp"
            alt="Con dấu sáp Bạch Trà"
            className="relative z-10 h-full w-full object-contain drop-shadow-md"
          />
        </m.div>

        {/* Lời trân trọng kính mời */}
        <p
          className="mt-2 text-xs font-semibold tracking-[0.3em] uppercase text-[#4A5D50]"
          style={{ fontFamily: BODY_FONT }}
        >
          {data.ui?.invitePrefix || "Trân Trọng Kính Mời"}
        </p>

        {/* Tên khách mời cá nhân hóa */}
        {guestName && guestName.trim().length > 0 ? (
          <div
            className="my-2 rounded-full px-4 py-1"
            style={{
              backgroundColor: "rgba(240, 244, 241, 0.9)",
              border: `1px solid ${GOLD_BORDER}`,
            }}
          >
            <span
              className="text-xs font-semibold tracking-wider text-[#23382B]"
              style={{ fontFamily: BODY_FONT }}
            >
              {guestName}
            </span>
          </div>
        ) : (
          <div className="h-2" />
        )}

        {/* Tên Cô Dâu & Chú Rể: Chia 3 dòng trang nhã */}
        <div className="my-3 flex flex-col items-center">
          <span
            className="text-2xl font-bold tracking-wide text-[#23382B] sm:text-3xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.groomName ?? "Đức Minh"}
          </span>
          <span
            className="my-0.5 text-lg font-normal italic text-[#C8A96E] sm:text-xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            &amp;
          </span>
          <span
            className="text-2xl font-bold tracking-wide text-[#23382B] sm:text-3xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.brideName ?? "Ngọc Trà"}
          </span>
        </div>

        {/* Dải hoa bạch trà phân cách */}
        <div className="my-2 flex w-full justify-center">
          <img
            src="/templates/bach-tra-suong-mai/divider-floral.webp"
            alt=""
            className="h-auto w-44 object-contain opacity-90 sm:w-52"
            aria-hidden="true"
          />
        </div>

        {/* Ngày cưới & Ngày âm lịch */}
        <div className="my-2 flex flex-col items-center gap-1">
          <p
            className="text-xs font-bold tracking-[0.25em] uppercase text-[#23382B] sm:text-sm"
            style={{ fontFamily: TITLE_FONT }}
          >
            {dateParts.weekday} · {dateParts.dotDate}
          </p>
          <p
            className="text-[11px] tracking-wider text-[#8FA394]"
            style={{ fontFamily: BODY_FONT }}
          >
            (Tức ngày {lunarText})
          </p>
        </div>

        {/* Nút Mở Thiệp */}
        <m.button
          onClick={handleOpenClick}
          className="group relative mt-5 flex items-center justify-center overflow-hidden rounded-full px-7 py-2.5 shadow-md transition-all active:scale-95"
          style={{
            backgroundColor: DEEP_SAGE,
            border: `1.5px solid ${GOLD_CHAMPAGNE}`,
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Quét ánh kim nút */}
          <div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#C8A96E]/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
            aria-hidden="true"
          />
          <span
            className="relative z-10 text-xs font-semibold tracking-[0.25em] uppercase text-[#FAF7F2]"
            style={{ fontFamily: BODY_FONT }}
          >
            Mở Thiệp
          </span>
        </m.button>
      </m.div>
    </div>
  );
}

/* ============================================================
   SECTION 1: HERO SECTION — KHUNG VÒM HOA BẠCH TRÀ
   - arch-frame.webp ôm trọn ảnh đôi aspect-[3/4]
   - Fallback thẻ vòm kính mờ với tên cặp đôi 3 dòng khi chưa có ảnh
   - KHÔNG lặp ngày cưới ở Hero
   ============================================================ */
function HeroSection({ data }: { data: TemplateData }) {
  const heroPhotoUrl = data.photos?.heroUrl;

  return (
    <section className="relative overflow-hidden px-4 pt-12 pb-16 text-center text-[#23382B] md:pt-16 md:pb-24">
      {/* Background Decor */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-15"
        style={{ backgroundImage: "url('/templates/bach-tra-suong-mai/background-mobile.webp')" }}
      />

      <div className="relative z-10 mx-auto max-w-lg">
        {/* Lời tựa mở đầu */}
        <m.p
          className="text-xs uppercase tracking-[0.35em] text-[#4A5D50]"
          style={{ fontFamily: BODY_FONT }}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {data.ui?.eyebrow || "The Wedding of"}
        </m.p>

        {/* Tên cặp đôi thanh lịch: 3 dòng */}
        <m.div
          className="my-4 flex flex-col items-center"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <h1
            className="text-3xl font-bold tracking-tight text-[#23382B] sm:text-4xl md:text-5xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.groomName ?? "Đức Minh"}
          </h1>
          <span
            className="my-1 text-xl italic text-[#C8A96E] sm:text-2xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            &amp;
          </span>
          <h1
            className="text-3xl font-bold tracking-tight text-[#23382B] sm:text-4xl md:text-5xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.brideName ?? "Ngọc Trà"}
          </h1>
        </m.div>

        {/* Khung Vòm Hoa Bạch Trà (Arch Frame) */}
        <m.div
          className="relative mx-auto my-6 flex max-w-xs items-center justify-center sm:max-w-sm"
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.25, ease: EASE_EDITORIAL }}
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-[140px] shadow-xl">
            {heroPhotoUrl ? (
              <img
                src={heroPhotoUrl}
                alt="Ảnh cưới uyên ương"
                className="h-full w-full object-cover"
              />
            ) : (
              /* Fallback thẻ vòm kính mờ sang trọng khi chưa có ảnh */
              <div
                className="flex h-full w-full flex-col items-center justify-center p-6 text-center backdrop-blur-md"
                style={{
                  background:
                    "radial-gradient(circle at 50% 40%, rgba(252,250,246,0.95) 0%, rgba(245,242,235,0.9) 100%)",
                }}
              >
                <span
                  className="text-2xl font-bold text-[#23382B]"
                  style={{ fontFamily: NAME_FONT }}
                >
                  {data.couple?.groomName ?? "Đức Minh"}
                </span>
                <span
                  className="my-1 text-lg italic text-[#C8A96E]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  &amp;
                </span>
                <span
                  className="text-2xl font-bold text-[#23382B]"
                  style={{ fontFamily: NAME_FONT }}
                >
                  {data.couple?.brideName ?? "Ngọc Trà"}
                </span>
              </div>
            )}

            {/* Khung vòm nghệ thuật arch-frame.webp xếp lớp mặt trước */}
            <img
              src="/templates/bach-tra-suong-mai/arch-frame.webp"
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-fill"
              aria-hidden="true"
            />
          </div>
        </m.div>

        {/* Câu trích dẫn tình yêu */}
        <m.div
          className="mx-auto mt-6 max-w-sm px-4"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          <p
            className="text-xs italic leading-relaxed text-[#4A5D50] sm:text-sm"
            style={{ fontFamily: BODY_FONT }}
          >
            &ldquo;Bạch trà tinh khôi như thuở ban đầu, hẹn người trọn kiếp ấm êm cùng sương mai hạnh phúc.&rdquo;
          </p>
        </m.div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 2: THÔNG TIN HAI BÊN GIA ĐÌNH (FAMILY)
   - Tự tách tên phụ huynh tại & thành 2 dòng sạch
   - 2 card gia đình cao bằng nhau (items-stretch, h-full flex flex-col)
   ============================================================ */
function FamilySection({ data }: { data: TemplateData }) {
  const couple = data.couple;

  const formatParents = (parentsStr?: string | null) => {
    if (!parentsStr) return [];
    return parentsStr
      .split("&")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  };

  const groomParents = formatParents(couple?.groomParents || "Ông Lê Văn Tuấn & Bà Trần Thị Bích");
  const brideParents = formatParents(couple?.brideParents || "Ông Nguyễn Đức Thành & Bà Hoàng Thu Mai");

  return (
    <section className="relative overflow-hidden px-4 py-16 text-[#23382B] md:py-20">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-4 flex justify-center">
          <img
            src="/templates/bach-tra-suong-mai/divider-floral.webp"
            alt=""
            className="h-auto w-36 object-contain opacity-85 sm:w-44"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#23382B] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Thông Tin Gia Đình
        </h2>
        <p
          className="mt-1 text-xs text-[#8FA394]"
          style={{ fontFamily: BODY_FONT }}
        >
          Trân trọng báo tin lễ thành hôn của con chúng tôi
        </p>

        {/* Lưới 2 nhà: Nhà Trai & Nhà Gái (Cao bằng nhau) */}
        <div className="mt-8 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
          {/* Nhà Trai */}
          <m.div
            className="flex h-full flex-col justify-between rounded-2xl border border-[#C8A96E]/30 bg-[#FFFFFF]/90 p-6 text-center shadow-sm backdrop-blur-sm"
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase text-[#C8A96E]"
                style={{ fontFamily: TITLE_FONT }}
              >
                Nhà Trai
              </span>
              <div className="my-3 space-y-1">
                {groomParents.map((name, i) => (
                  <p
                    key={i}
                    className="text-sm font-medium text-[#23382B]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-[#C8A96E]/20 pt-4">
              <p
                className="text-xs text-[#8FA394]"
                style={{ fontFamily: BODY_FONT }}
              >
                {couple?.groomTitle || "Trưởng Nam"}
              </p>
              <p
                className="text-base font-bold text-[#23382B]"
                style={{ fontFamily: NAME_FONT }}
              >
                {couple?.groomFullName || couple?.groomName || "Lê Đức Minh"}
              </p>
            </div>
          </m.div>

          {/* Nhà Gái */}
          <m.div
            className="flex h-full flex-col justify-between rounded-2xl border border-[#C8A96E]/30 bg-[#FFFFFF]/90 p-6 text-center shadow-sm backdrop-blur-sm"
            initial={{ opacity: 0, x: 15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase text-[#C8A96E]"
                style={{ fontFamily: TITLE_FONT }}
              >
                Nhà Gái
              </span>
              <div className="my-3 space-y-1">
                {brideParents.map((name, i) => (
                  <p
                    key={i}
                    className="text-sm font-medium text-[#23382B]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-[#C8A96E]/20 pt-4">
              <p
                className="text-xs text-[#8FA394]"
                style={{ fontFamily: BODY_FONT }}
              >
                {couple?.brideTitle || "Ái Nữ"}
              </p>
              <p
                className="text-base font-bold text-[#23382B]"
                style={{ fontFamily: NAME_FONT }}
              >
                {couple?.brideFullName || couple?.brideName || "Trần Ngọc Trà"}
              </p>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 3: SỰ KIỆN CƯỚI (VỊ TRÍ NGÀY CƯỚI #1 - EVENTS & MAP)
   ============================================================ */
function EventsSection({ data }: { data: TemplateData }) {
  const visibleEvents = getVisibleEvents(data);

  return (
    <section className="relative overflow-hidden px-4 py-16 text-[#23382B] md:py-24">
      <div className={`relative z-10 mx-auto text-center ${visibleEvents.length > 1 ? "max-w-4xl" : "max-w-xl"}`}>
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#23382B] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Sự Kiện Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#8FA394]"
          style={{ fontFamily: BODY_FONT }}
        >
          Kính mời quý khách tới tham dự chung vui cùng gia đình
        </p>

        <div className={`mt-8 ${visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}`}>
          {visibleEvents.map((evt, idx) => {
            const dateParts = evt.startsAt ? formatWeddingDateParts(evt.startsAt) : null;
            const lunarStr = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : null;
            const directionsUrl = getEventDirectionsUrl(evt);

            return (
              <m.div
                key={evt.id || idx}
                className="relative overflow-hidden rounded-2xl border border-[#C8A96E]/35 bg-[#FFFFFF]/90 p-6 text-center shadow-sm backdrop-blur-sm md:p-8"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: idx * 0.15 }}
              >
                {/* Góc trang trí hoa bạch trà */}
                <img
                  src="/templates/bach-tra-suong-mai/corner-tl.webp"
                  alt=""
                  className="pointer-events-none absolute top-0 left-0 h-auto w-8 opacity-65"
                  aria-hidden="true"
                />
                <img
                  src="/templates/bach-tra-suong-mai/corner-tl.webp"
                  alt=""
                  className="pointer-events-none absolute top-0 right-0 h-auto w-8 -scale-x-100 opacity-65"
                  aria-hidden="true"
                />

                <span
                  className="inline-block rounded-full bg-[#FCFAF6] px-4 py-1 text-xs font-semibold tracking-wider uppercase text-[#C8A96E]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  {evt.title}
                </span>

                {dateParts && (
                  <div className="my-4">
                    <p
                      className="text-base font-bold text-[#23382B] sm:text-lg"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {dateParts.weekday} · {dateParts.dotDate}
                    </p>
                    {lunarStr && (
                      <p
                        className="text-xs text-[#8FA394]"
                        style={{ fontFamily: BODY_FONT }}
                      >
                        (Tức ngày {lunarStr})
                      </p>
                    )}
                  </div>
                )}

                {/* Phân cách hoa */}
                <div className="my-2 flex justify-center">
                  <img
                    src="/templates/bach-tra-suong-mai/divider-floral.webp"
                    alt=""
                    className="h-auto w-28 object-contain opacity-75"
                    aria-hidden="true"
                  />
                </div>

                {/* Địa điểm */}
                <div className="my-4 space-y-1">
                  <p
                    className="text-base font-semibold text-[#23382B]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {evt.venueName}
                  </p>
                  <p
                    className="text-xs text-[#4A5D50]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {evt.venueAddress}
                  </p>
                </div>

                {/* Nút chỉ đường Google Maps */}
                {directionsUrl && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#C8A96E] bg-[#23382B] px-5 py-2 text-xs font-medium text-[#FAF7F2] transition-colors hover:bg-[#18281E]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#C8A96E]" />
                    <span>Xem vị trí trên Google Maps</span>
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                )}
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 4: ALBUM ẢNH CƯỚI (GALLERY + LIGHTBOX)
   - 3D Coverflow / Carousel
   - Nút < > tròn màu #23382B/80
   - Lightbox modal render qua createPortal
   ============================================================ */
function GallerySection({ data }: { data: TemplateData }) {
  const rawPhotos = data.photos?.gallery || [];
  // Gói Free tối đa 5 ảnh, Pro/VIP tối đa 30 ảnh
  const maxPhotos = data.plan === "free" ? 5 : 30;
  const photos = rawPhotos.slice(0, maxPhotos);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  if (photos.length === 0) return null;

  const nextPhoto = () => setActiveIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);

  return (
    <section className="relative overflow-hidden px-4 py-16 text-[#23382B] md:py-24">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-4 flex justify-center">
          <img
            src="/templates/bach-tra-suong-mai/divider-floral.webp"
            alt=""
            className="h-auto w-36 object-contain opacity-85 sm:w-44"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#23382B] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Album Ảnh Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#8FA394]"
          style={{ fontFamily: BODY_FONT }}
        >
          Khoảnh khắc tình yêu đơm hoa kết trái
        </p>

        {/* Carousel Coverflow */}
        <div className="relative mx-auto mt-8 flex max-w-md items-center justify-center">
          <button
            onClick={prevPhoto}
            aria-label="Ảnh trước"
            className="absolute left-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[#23382B]/85 text-[#FAF7F2] shadow-md transition-colors hover:bg-[#23382B]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            onClick={() => setLightboxIndex(activeIndex)}
            className="relative aspect-[3/4] w-full max-w-xs cursor-pointer overflow-hidden rounded-2xl border-2 border-[#C8A96E]/40 shadow-xl"
          >
            <img
              src={photos[activeIndex]?.url}
              alt={photos[activeIndex]?.alt || "Ảnh cưới"}
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>

          <button
            onClick={nextPhoto}
            aria-label="Ảnh kế tiếp"
            className="absolute right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[#23382B]/85 text-[#FAF7F2] shadow-md transition-colors hover:bg-[#23382B]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Bộ đếm & Dots */}
        <p className="mt-3 text-xs font-medium text-[#4A5D50]">
          {activeIndex + 1} / {photos.length}
        </p>

        <div className="mt-2 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                activeIndex === i ? "w-6 bg-[#C8A96E]" : "w-2 bg-[#C8A96E]/30",
              )}
              aria-label={`Chuyển đến ảnh ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Lightbox Modal qua Portal */}
      {lightboxIndex !== null && (
        <TemplateLightboxModal
          photos={photos}
          activeIndex={lightboxIndex}
          onChangeIndex={(idx) => setLightboxIndex(idx)}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}

/* ============================================================
   SECTION 5: LỊCH THÁNG NGÀY CƯỚI & ĐẾM NGƯỢC (VỊ TRÍ NGÀY CƯỚI #2 - CALENDAR)
   ============================================================ */
function CalendarCountdownSection({ data }: { data: TemplateData }) {
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const targetDate = React.useMemo(() => {
    return targetEvent?.startsAt ? new Date(targetEvent.startsAt) : (data.date ? new Date(data.date) : new Date("2025-10-26T10:00:00+07:00"));
  }, [targetEvent, data.date]);

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();

  const eventDays = React.useMemo(() => {
    const days = new Set<number>();
    visibleEvents.forEach((evt) => {
      if (evt.startsAt) {
        const d = new Date(evt.startsAt);
        if (d.getFullYear() === year && d.getMonth() === month) {
          days.add(d.getDate());
        }
      }
    });
    if (days.size === 0 && targetDate.getFullYear() === year && targetDate.getMonth() === month) {
      days.add(targetDate.getDate());
    }
    return days;
  }, [visibleEvents, year, month, targetDate]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / 1000 / 60) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <section className="relative overflow-hidden px-4 py-16 text-[#23382B] md:py-24">
      <div className="relative z-10 mx-auto max-w-lg text-center">
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#23382B] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Lịch Ngày Vui
        </h2>
        <p
          className="mt-1 text-xs text-[#8FA394]"
          style={{ fontFamily: BODY_FONT }}
        >
          Tháng {month + 1} Năm {year}
        </p>

        {/* Lưới lịch tháng viền bo góc */}
        <div className="mx-auto mt-6 max-w-xs rounded-2xl border border-[#C8A96E]/30 bg-[#FFFFFF]/90 p-5 shadow-sm backdrop-blur-sm">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#4A5D50]">
            <span>CN</span>
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8 w-8" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isWeddingDay = eventDays.has(day);
              return (
                <div
                  key={`day-${day}`}
                  className="flex h-8 w-8 items-center justify-center font-medium"
                >
                  {isWeddingDay ? (
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#23382B] text-xs font-bold text-[#FAF7F2] shadow-md">
                      <span>{day}</span>
                      <Heart className="absolute -top-1 -right-1 h-3 w-3 fill-[#C8A96E] text-[#C8A96E] animate-pulse" />
                    </div>
                  ) : (
                    <span className="text-[#23382B]">{day}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Khối đếm ngược */}
        {isClient && (
          <div className="mt-8 flex justify-center gap-3 text-center sm:gap-4">
            {[
              { val: timeLeft.days, label: "Ngày" },
              { val: timeLeft.hours, label: "Giờ" },
              { val: timeLeft.minutes, label: "Phút" },
              { val: timeLeft.seconds, label: "Giây" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex w-16 flex-col items-center justify-center rounded-2xl border border-[#C8A96E]/30 bg-[#FFFFFF]/90 p-2.5 shadow-sm backdrop-blur-sm sm:w-20 sm:p-3"
              >
                <span
                  className="text-xl font-bold text-[#23382B] sm:text-2xl"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  {String(item.val).padStart(2, "0")}
                </span>
                <span
                  className="mt-0.5 text-[10px] tracking-wider uppercase text-[#8FA394]"
                  style={{ fontFamily: BODY_FONT }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 6: LỊCH TRÌNH TIỆC CƯỚI & DRESS CODE (TIMELINE)
   - 3 vòng tròn màu Dress Code mặc định (#FFFFFF, #D9C3A9, #9EAD9B)
   - Timeline dọc với trục chỉ xanh rêu – vàng mượt
   ============================================================ */
function TimelineSection({ data }: { data: TemplateData }) {
  const timeline = getTimeline(data);
  const dressColors = getDressColors(data);

  return (
    <section className="relative overflow-hidden px-4 py-16 text-[#23382B] md:py-24">
      <div className="relative z-10 mx-auto max-w-lg text-center">
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#23382B] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Lịch Trình Hôn Lễ
        </h2>
        <p
          className="mt-1 text-xs text-[#8FA394]"
          style={{ fontFamily: BODY_FONT }}
        >
          Các mốc thời gian quan trọng trong ngày vui
        </p>

        {/* Timeline dọc */}
        <div className="relative mx-auto mt-8 max-w-sm pl-6 text-left">
          <div className="absolute top-3 bottom-3 left-2.5 w-0.5 bg-[#C8A96E]/35" />

          <div className="space-y-6">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative flex items-start gap-4">
                <div className="relative z-10 -ml-5.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#C8A96E] bg-[#FCFAF6]">
                  <div className="h-2 w-2 rounded-full bg-[#23382B]" />
                </div>
                <div>
                  <span
                    className="text-xs font-bold text-[#C8A96E]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {item.time}
                  </span>
                  <p
                    className="text-sm font-medium text-[#23382B]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dress Code Section */}
        {dressColors && dressColors.length > 0 && (
          <div className="mt-12 rounded-2xl border border-[#C8A96E]/30 bg-[#FFFFFF]/90 p-6 text-center shadow-sm backdrop-blur-sm">
            <h3
              className="text-sm font-bold tracking-widest uppercase text-[#23382B]"
              style={{ fontFamily: TITLE_FONT }}
            >
              Trang Phục Gợi Ý (Dress Code)
            </h3>
            <p
              className="mt-1 text-xs text-[#8FA394]"
              style={{ fontFamily: BODY_FONT }}
            >
              Quý khách có thể lựa chọn các tone màu trang nhã dưới đây
            </p>
            <div className="mt-5 flex items-center justify-center gap-4 sm:gap-6">
              {dressColors.map((hex, idx) => (
                <div
                  key={idx}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-[#FFFFFF] shadow-md transition-transform hover:scale-110"
                  style={{ backgroundColor: hex }}
                  title={hex}
                  aria-label={`Màu trang phục ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 7: HỘP MỪNG CƯỚI 3 TRẠNG THÁI (GIFT BOX & MODAL)
   - Preload 3 ảnh kích thước & baseline đồng nhất
   - Layout shift = 0px
   - GiftModal qua createPortal
   ============================================================ */
function GiftSection({
  data,
  plan,
  guestName,
}: {
  data: TemplateData;
  plan?: WeddingPlan;
  guestName?: string | null;
}) {
  const [giftState, setGiftState] = React.useState<"normal" | "hover" | "active">("normal");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleBoxClick = () => {
    setGiftState("active");
    setTimeout(() => {
      setIsModalOpen(true);
      setGiftState("normal");
    }, 450);
  };

  return (
    <section className="relative overflow-hidden px-4 py-16 text-[#23382B] md:py-24">
      <div className="relative z-10 mx-auto max-w-lg text-center">
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#23382B] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Hộp Mừng Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#8FA394]"
          style={{ fontFamily: BODY_FONT }}
        >
          Gửi trọn yêu thương và lời chúc phúc đến cô dâu & chú rể
        </p>

        {/* Hộp quà 3 trạng thái có baseline và kích thước đồng nhất */}
        <div
          onClick={handleBoxClick}
          onMouseEnter={() => setGiftState("hover")}
          onMouseLeave={() => setGiftState("normal")}
          className="group relative mx-auto my-6 flex h-[350px] w-[180px] cursor-pointer items-end justify-center transition-transform hover:scale-105 active:scale-95 sm:h-[390px] sm:w-[214px]"
        >
          <img
            src="/templates/bach-tra-suong-mai/gift-normal.webp"
            alt="Hộp mừng cưới"
            className={cn(
              "absolute bottom-0 h-full w-full object-contain transition-opacity duration-300",
              giftState === "normal" ? "opacity-100" : "opacity-0",
            )}
          />
          <img
            src="/templates/bach-tra-suong-mai/gift-hover.webp"
            alt="Hộp mừng cưới mở nắp"
            className={cn(
              "absolute bottom-0 h-full w-full object-contain transition-opacity duration-300",
              giftState === "hover" ? "opacity-100" : "opacity-0",
            )}
          />
          <img
            src="/templates/bach-tra-suong-mai/gift-active.webp"
            alt="Hộp mừng cưới trao lì xì"
            className={cn(
              "absolute bottom-0 h-full w-full object-contain transition-opacity duration-300",
              giftState === "active" ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <button
          onClick={handleBoxClick}
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#C8A96E] bg-[#23382B] px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-[#FAF7F2] shadow-md transition-all hover:bg-[#18281E]"
          style={{ fontFamily: BODY_FONT }}
        >
          <span>Gửi Quà Mừng Cưới</span>
        </button>
      </div>

      {/* Modal Mừng Cưới qua Portal */}
      <GiftModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        gift={data.gift}
        plan={plan ?? "free"}
        coupleName={`${data.couple?.groomName ?? "Đức Minh"} & ${data.couple?.brideName ?? "Ngọc Trà"}`}
        guestName={guestName}
        tone="obsidian"
      />
    </section>
  );
}

/* ============================================================
   MAIN COMPONENT: BẠCH TRÀ SƯƠNG MAI TEMPLATE
   ============================================================ */
export function BachTraSuongMaiTemplate({
  data,
  mode = "preview",
  contained = false,
  isOpened = false,
  onOpenedChange,
  guestName,
  weddingSlug,
  inviteSlug,
  invitationMode = "public",
}: WeddingTemplateProps) {
  const [openState, setOpenState] = React.useState(isOpened);
  const [coverGone, setCoverGone] = React.useState(isOpened);
  const parentOpenedRef = React.useRef(isOpened);

  React.useEffect(() => {
    if (isOpened !== parentOpenedRef.current) {
      parentOpenedRef.current = isOpened;
      setOpenState(isOpened);
      if (isOpened) {
        setCoverGone(true);
      } else {
        setCoverGone(false);
      }
    }
  }, [isOpened]);

  const handleOpenInvitation = () => {
    setOpenState(true);
    setCoverGone(true);
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch {}

    if (!contained && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const safeGuestName = guestName || null;

  const hidden = new Set(data.hiddenSections ?? []);
  const order = data.sectionOrder?.length
    ? data.sectionOrder
    : ["family", "map", "calendar", "dresscode", "album", "albumQr", "gift", "rsvp"];
  const orderOf = (key: string) => {
    const index = order.indexOf(key);
    return index < 0 ? 99 : index;
  };

  return (
    <div
      className={cn(
        "relative w-full bg-[#F7F6F1] text-[#23382B] selection:bg-[#C8A96E]/20",
        !coverGone && (contained ? "h-full overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden"),
      )}
    >
      {/* --------------------------------------------------------
          LỚP 1: MÀN HÌNH BÌA PHONG BÌ MỞ THIỆP
          -------------------------------------------------------- */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            className="absolute inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            <EnvelopeCover
              data={data}
              guestName={safeGuestName}
              contained={contained}
              onOpen={handleOpenInvitation}
            />
          </m.div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------
          LỚP 2: NÚT NHẠC NỀN NỔI
          -------------------------------------------------------- */}
      <LiveMusicFloatingButton
        src={data.music?.src}
        title={data.music?.title || "Giai điệu Bạch Trà"}
        visible={openState}
        tone="obsidian"
      />

      {/* --------------------------------------------------------
          LỚP 3: RUỘT THIỆP CƯỚI CHÍNH (Ẩn khi chưa mở thiệp)
          - Nền cố định hoa màu nước sương mai
          - Thẻ lụa sương mai kính mờ max-w-[840px]
          -------------------------------------------------------- */}
      <main
        className={cn(
          "relative z-10 transition-opacity duration-700",
          !openState ? "hidden opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {/* Nền cố định phía sau ruột thiệp */}
        <div
          className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: "url('/templates/bach-tra-suong-mai/background.webp')" }}
        />

        {/* Khung nội dung trung tâm: Cột thẻ lụa sương mai max-w-[840px] */}
        <div className="relative mx-auto my-6 w-full max-w-[840px] rounded-3xl border border-[#C8A96E]/35 bg-[#FCFAF6]/90 shadow-2xl backdrop-blur-md">
          {/* Section 1: Hero chào mừng & Khung vòm hoa bạch trà (luôn ở đầu thẻ) */}
          <HeroSection data={data} />

          {/* Container các section động theo orderOf và hiddenSections */}
          <div className="flex flex-col">
            {/* Section 2: Thông tin gia đình */}
            {!hidden.has("family") && (
              <div style={{ order: orderOf("family") }}>
                <FamilySection data={data} />
              </div>
            )}

            {/* Section 3: Sự kiện cưới & bản đồ chỉ đường (Vị trí ngày cưới #1) */}
            {!hidden.has("map") && (
              <div style={{ order: orderOf("map") }}>
                <EventsSection data={data} />
              </div>
            )}

            {/* Section 4: Album ảnh cưới coverflow */}
            {!hidden.has("album") && (
              <div style={{ order: orderOf("album") }}>
                <GallerySection data={data} />
              </div>
            )}

            {/* Section 5: Lịch ngày vui & đếm ngược (Vị trí ngày cưới #2) */}
            {!hidden.has("calendar") && (
              <div style={{ order: orderOf("calendar") }}>
                <CalendarCountdownSection data={data} />
              </div>
            )}

            {/* Section 6: Lịch trình & Dress code */}
            {!hidden.has("dresscode") && (
              <div style={{ order: orderOf("dresscode") }}>
                <TimelineSection data={data} />
              </div>
            )}

            {/* Section 7: Hộp mừng cưới 3 trạng thái & VietQR */}
            {!hidden.has("gift") && (
              <div style={{ order: orderOf("gift") }}>
                <GiftSection data={data} plan={data.plan} guestName={safeGuestName} />
              </div>
            )}

            {/* Section 8: Form xác nhận tham dự RSVP & Sổ lưu bút */}
            {!hidden.has("rsvp") && (
              <div style={{ order: orderOf("rsvp") }}>
                <section className="relative overflow-hidden rounded-b-3xl bg-[#18281E] px-4 py-16 text-[#FAF7F2] md:py-24">
                  <div
                    className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: "url('/templates/bach-tra-suong-mai/background-mobile.webp')" }}
                  />
                  <CamelliaDewParticles count={16} />

                  <div className="relative z-10 mx-auto max-w-xl">
                    <TemplateRsvpSection
                      data={data}
                      mode={mode}
                      tone="emerald"
                      contained={contained}
                      inviteSlug={inviteSlug}
                      weddingSlug={weddingSlug}
                      invitationMode={invitationMode}
                      guestName={guestName}
                    />

                    {/* QR Album chia sẻ ảnh tiệc cưới cho gói trả phí */}
                    {data.plan !== "free" && !hidden.has("albumQr") && weddingSlug && (
                      <div className="mt-12 flex justify-center">
                        <GuestAlbumQr
                          slug={weddingSlug}
                          accentColor="#23382B"
                          textColor="#FAF7F2"
                          mutedColor="#C8A96E"
                        />
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>

        {/* Footer chúc phúc chân trang (Đặt ngoài flex container có order) */}
        <footer className="border-t border-[#C8A96E]/20 bg-[#18281E] px-4 py-12 text-center text-xs text-[#FAF7F2]/60">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
            <img
              src="/templates/bach-tra-suong-mai/divider-floral.webp"
              alt=""
              className="h-auto w-24 object-contain opacity-60"
              aria-hidden="true"
            />
            <p className="tracking-widest uppercase text-[#FAF7F2]">
              {data.couple?.groomName ?? "Chú Rể"} &amp; {data.couple?.brideName ?? "Cô Dâu"}
            </p>
            <p className="text-[11px] text-[#FAF7F2]/50">
              Cảm ơn quý khách đã gửi trọn yêu thương cùng chúng tôi
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default BachTraSuongMaiTemplate;
