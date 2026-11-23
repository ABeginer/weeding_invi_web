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
   BẢNG MÀU CHÍNH THỨC: HẠC VŨ LƯU LY (hac-vu-luu-ly)
   - Lam Lưu Ly Đêm (Midnight Sapphire Cloisonné — Nền chính & Khối tối): #0B192C (sâu #07111F, lớp thẻ tối #11253E)
   - Ngọc Bích Pháp Lam (Cloisonné Jade Teal — Nhấn phụ & Khung khánh ngọc): #1B4D5C
   - Vàng Bạch Kim / Sâm-panh Sáng (Moonlit Champagne Gold — Viền chỉ mảnh, trăng khuyết): #E5CFA3 (sáng #F4E8CE, trầm #B89C68)
   - Lụa Trăng Ngà (Moonlit Ivory Silk — Thẻ nội dung ruột thiệp): #F8F6F0 (thẻ phụ #FFFFFF)
   - Chữ chính trên nền lụa ngà: #0E2238 (tiêu đề) / #334457 (nội dung, chuẩn tương phản cao)
   - Chữ trên nền tối #0B192C: #F4E8CE / #E5CFA3
   ============================================================ */

const SAPPHIRE_MIDNIGHT = "#0B192C";
const SAPPHIRE_DEEP = "#07111F";
const SAPPHIRE_CARD = "#11253E";

const JADE_CLOISONNE = "#1B4D5C";

const GOLD_CHAMPAGNE = "#E5CFA3";
const GOLD_LIGHT = "#F4E8CE";
const GOLD_DEEP = "#B89C68";
const GOLD_BORDER = "rgba(229, 207, 163, 0.45)";
const GOLD_SUBTLE = "rgba(229, 207, 163, 0.22)";

const IVORY_SILK = "#F8F6F0";
const CARD_WHITE = "#FFFFFF";

const TEXT_DARK_TITLE = "#0E2238";
const TEXT_DARK_BODY = "#334457";
const TEXT_DARK_MUTED = "#5A6D82";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_CLOISONNE = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "17:30", label: "Đón tiếp quan khách & Chụp ảnh kỷ niệm dưới ánh trăng" },
  { time: "18:30", label: "Cử hành hôn lễ Hạc Vũ & Lời thề nguyền sắt son" },
  { time: "19:00", label: "Dạ tiệc Lưu Ly hoàng gia & Nâng ly chúc phúc" },
  { time: "20:00", label: "Khúc Vũ Nguyệt Cung & Điệu valse uyên ương" },
  { time: "21:00", label: "Tiễn khách & Trao quà lưu niệm tri ân" },
];

const DEFAULT_DRESS = ["#0B192C", "#E5CFA3", "#F8F6F0"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Bụi Sao Trăng Ngà & Ánh Kim Sa Pháp Lam
   - Tự tắt chuyển động khi prefers-reduced-motion
   ------------------------------------------------------------ */
function MoonlitDust({ count = 18 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 19) % 94 + 3}%`,
      size: (idx % 3) + 2.5,
      duration: 7 + (idx % 4) * 2,
      delay: (idx * 0.45) % 4,
      yOffset: 25 + (idx % 4) * 20,
      isShimmer: idx % 2 === 0,
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
            bottom: "8%",
            width: p.size,
            height: p.size,
            background: p.isShimmer
              ? "radial-gradient(circle, #F4E8CE 0%, rgba(229,207,163,0.4) 70%, transparent 100%)"
              : "radial-gradient(circle, #FFFFFF 0%, rgba(244,232,206,0.3) 60%, transparent 100%)",
            boxShadow: "0 0 6px 1px rgba(244,232,206,0.5)",
          }}
          animate={{
            y: [-10, -p.yOffset * 3.5, -p.yOffset * 7],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * (10 + (p.id % 12)), 0],
            opacity: [0, 0.85, 0],
            scale: [0.7, 1.25, 0.6],
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
   MÀN HÌNH BÌA: PHÁP LAM ĐÊM TRĂNG (ENVELOPE COVER)
   - Quạt xếp hoàng gia (cover-fan.webp)
   - Khánh ngọc đu đưa tự nhiên dưới tâm quạt (jade-medallion.webp)
   - Tên cặp đôi 3 dòng, nhãn khách mời trang trọng
   - Hiệu ứng mở thiệp "Triển Phiến & Tan Sương Lưu Ly"
   ============================================================ */
function EnvelopeCover({
  data,
  guestName,
  contained,
  onOpen,
}: {
  data: TemplateData;
  guestName: string | null;
  contained?: boolean;
  onOpen: () => void;
}) {
  const reduce = useReducedMotion();
  const [openingStage, setOpeningStage] = React.useState(false);
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const dateParts = targetEvent?.startsAt ? formatWeddingDateParts(targetEvent.startsAt) : (data.date ? formatWeddingDateParts(data.date) : null);

  const handleOpenClick = () => {
    if (openingStage) return;
    setOpeningStage(true);
    playOpenCardSound();
    setTimeout(() => {
      onOpen();
    }, 750);
  };

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden px-4 text-[#F4E8CE] select-none",
        contained ? "min-h-full py-6" : "min-h-screen py-10",
      )}
      style={{ backgroundColor: SAPPHIRE_MIDNIGHT }}
    >
      {/* Nền đêm trăng lưu ly */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: "url('/templates/hac-vu-luu-ly/background-mobile.webp')",
          opacity: 0.38,
          transform: openingStage ? "scale(1.08)" : "scale(1)",
        }}
      />

      {/* Quầng sáng trăng tròn ảo diệu phía sau bìa */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: "min(90vw, 520px)",
          height: "min(90vw, 520px)",
          background:
            "radial-gradient(circle, rgba(27,77,92,0.45) 0%, rgba(11,25,44,0.2) 60%, transparent 80%)",
          filter: "blur(40px)",
        }}
      />

      {/* Bụi trăng ngà bay lơ lửng */}
      <MoonlitDust count={16} />

      {/* Cánh cửa sương mù lưu ly trượt mở sang 2 bên khi bấm mở thiệp (chỉ kích hoạt khi openingStage, nằm dưới thẻ z-20) */}
      {openingStage && !reduce && (
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
          <m.div
            className="absolute inset-y-0 left-0 w-1/2 border-r border-[#E5CFA3]/30 bg-[#07111F]/90"
            initial={{ x: "0%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 0.7, ease: EASE_CLOISONNE }}
          />
          <m.div
            className="absolute inset-y-0 right-0 w-1/2 border-l border-[#E5CFA3]/30 bg-[#07111F]/90"
            initial={{ x: "0%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 0.7, ease: EASE_CLOISONNE }}
          />
        </div>
      )}

      {/* Thẻ Pháp Lam Đêm Trăng Trung Tâm */}
      <m.div
        className={cn(
          "relative z-20 my-auto flex w-full max-w-sm flex-col items-center rounded-3xl p-6 text-center shadow-2xl transition-all",
          contained ? "py-5" : "py-8",
        )}
        style={{
          backgroundColor: SAPPHIRE_CARD,
          boxShadow: "0 25px 60px -12px rgba(7, 17, 31, 0.85)",
        }}
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={
          openingStage
            ? { opacity: 0, scale: 0.92, y: -25 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{ duration: 0.65, ease: EASE_CLOISONNE }}
      >
        {/* Khung viền đôi chỉ vàng bạch kim */}
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-[#E5CFA3]/70">
          <div className="absolute inset-1 rounded-xl border border-[#E5CFA3]/30" />
        </div>

        {/* Quạt xếp hoàng gia (Cover Fan) */}
        <m.div
          className="relative mt-1 mb-0 flex w-full max-w-[210px] items-center justify-center sm:max-w-[240px]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={
            openingStage
              ? { scale: 1.12, rotate: 6, opacity: 0 }
              : { scale: 1, rotate: 0, opacity: 1 }
          }
          transition={{ duration: 0.7, ease: EASE_CLOISONNE }}
        >
          {/* Quầng sáng vàng kim dưới quạt */}
          <div
            className="pointer-events-none absolute inset-0 -bottom-4 rounded-full"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(229,207,163,0.3) 0%, rgba(27,77,92,0.15) 55%, transparent 75%)",
              filter: "blur(12px)",
            }}
          />
          <img
            src="/templates/hac-vu-luu-ly/cover-fan.webp"
            alt="Quạt Xếp Cung Đình — Hạc Vũ Lưu Ly"
            className="relative z-10 h-auto w-full object-contain drop-shadow-xl"
          />
        </m.div>

        {/* Khánh ngọc lưu ly đung đưa tự nhiên dưới tâm quạt (Jade Medallion) */}
        <m.div
          className="relative z-15 -mt-3 mb-2 flex justify-center"
          style={{ transformOrigin: "top center" }}
          animate={
            reduce
              ? {}
              : {
                rotate: [-2.5, 2.5, -2.5],
              }
          }
          transition={{
            duration: 4.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <img
            src="/templates/hac-vu-luu-ly/jade-medallion.webp"
            alt="Khánh Ngọc Lưu Ly"
            className="h-14 w-auto object-contain drop-shadow-md sm:h-16"
          />
        </m.div>

        {/* Lời trân trọng kính mời */}
        <p
          className="mt-1 text-xs font-semibold tracking-[0.32em] uppercase text-[#E5CFA3]"
          style={{ fontFamily: BODY_FONT }}
        >
          {data.ui?.invitePrefix || "Trân Trọng Kính Mời"}
        </p>

        {/* Tên khách mời trang trọng */}
        <div className="my-2.5 max-w-[280px] rounded-full border border-[#E5CFA3]/40 bg-[#0B192C]/75 px-5 py-1.5 shadow-inner backdrop-blur-xs">
          <p
            className="truncate text-sm font-semibold tracking-wide text-[#F4E8CE]"
            style={{ fontFamily: BODY_FONT }}
          >
            {guestName || data.ui?.defaultGuestName || "Quý Khách Quý Mến"}
          </p>
        </div>

        {/* Dải phân cách họa tiết lông hạc mảnh */}
        <div className="my-1 flex items-center justify-center">
          <img
            src="/templates/hac-vu-luu-ly/divider-feather.webp"
            alt=""
            className="h-auto w-28 object-contain opacity-80"
            aria-hidden="true"
          />
        </div>

        {/* Tên cặp đôi 3 dòng chuẩn quy cách (Line 1: Chú rể - Line 2: & - Line 3: Cô dâu) */}
        <div className="my-2 w-full px-2">
          <h1
            className="block text-2xl font-bold tracking-wide text-[#F4E8CE] break-words sm:text-3xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.groomName || "Minh Triết"}
          </h1>
          <div className="my-0.5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#E5CFA3]/60" />
            <span
              className="text-base font-normal italic text-[#E5CFA3]"
              style={{ fontFamily: TITLE_FONT }}
            >
              &amp;
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#E5CFA3]/60" />
          </div>
          <h1
            className="block text-2xl font-bold tracking-wide text-[#F4E8CE] break-words sm:text-3xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.brideName || "Lưu Ly"}
          </h1>
        </div>

        {/* Ngày cưới tóm tắt trên bìa */}
        {dateParts && (
          <p
            className="mt-1 text-xs font-medium tracking-[0.22em] text-[#E5CFA3]/90 uppercase"
            style={{ fontFamily: BODY_FONT }}
          >
            {dateParts.day} · {dateParts.month} · {dateParts.year}
          </p>
        )}

        {/* Nút bấm mở thiệp bùng nổ hiệu ứng */}
        <m.button
          onClick={handleOpenClick}
          disabled={openingStage}
          className="group relative mt-5 flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-[#E5CFA3] bg-gradient-to-r from-[#1B4D5C] via-[#0B192C] to-[#1B4D5C] px-7 py-2.5 text-xs font-semibold tracking-widest uppercase text-[#F4E8CE] shadow-lg transition-all duration-300 hover:border-[#F4E8CE] hover:shadow-[0_0_20px_rgba(229,207,163,0.4)] active:scale-95"
          style={{ fontFamily: BODY_FONT }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Vệt sáng quét ngang nút */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#F4E8CE]/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          <span>Mở Thiệp Cưới</span>
        </m.button>
      </m.div>
    </div>
  );
}

/* ============================================================
   SECTION 1: HERO — CỔNG NGUYỆT MÔN & ĐÔI CÁNH HẠC
   - moon-gate.webp: Cổng tròn nguyệt môn ôm trọn ảnh bìa uyên ương
   - Bảng màu: Nền Lam Lưu Ly Đêm #0B192C, vàng bạch kim #E5CFA3
   ============================================================ */
function HeroSection({ data }: { data: TemplateData }) {
  const reduce = useReducedMotion();
  const couple = data.couple;
  const heroPhoto = data.photos?.heroUrl || "/photos/hero2.webp";

  return (
    <section className="relative overflow-hidden pt-12 pb-16 text-center text-[#F4E8CE]">
      {/* Nền đêm trăng lưu ly */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: "url('/templates/hac-vu-luu-ly/background.webp')" }}
      />
      <MoonlitDust count={12} />

      <div className="relative z-10 mx-auto max-w-xl px-4">
        {/* Phụ đề phong cách */}
        <p
          className="text-xs font-semibold tracking-[0.35em] uppercase text-[#E5CFA3]"
          style={{ fontFamily: BODY_FONT }}
        >
          {data.ui?.eyebrow || "Hạc Vũ Lưu Ly"}
        </p>

        {/* Tên cặp đôi 3 dòng trang trọng */}
        <div className="my-4">
          <h2
            className="block text-3xl font-bold tracking-wide text-[#F4E8CE] break-words sm:text-4xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {couple?.groomFullName || couple?.groomName || "Lê Minh Triết"}
          </h2>
          <div className="my-1 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#E5CFA3]/60" />
            <span
              className="text-lg font-normal italic text-[#E5CFA3]"
              style={{ fontFamily: TITLE_FONT }}
            >
              &amp;
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#E5CFA3]/60" />
          </div>
          <h2
            className="block text-3xl font-bold tracking-wide text-[#F4E8CE] break-words sm:text-4xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {couple?.brideFullName || couple?.brideName || "Trần Lưu Ly"}
          </h2>
        </div>

        {/* Dải phân cách lông hạc */}
        <div className="my-3 flex justify-center">
          <img
            src="/templates/hac-vu-luu-ly/divider-feather.webp"
            alt=""
            className="h-auto w-32 object-contain opacity-85"
            aria-hidden="true"
          />
        </div>

        {/* Cổng Nguyệt Môn tròn ôm trọn ảnh bìa uyên ương */}
        <m.div
          className="relative mx-auto mt-4 mb-2 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, ease: EASE_CLOISONNE }}
        >
          <div className="relative aspect-square w-64 sm:w-72 md:w-80">
            {/* Ảnh chân dung uyên ương bên trong khung tròn */}
            <div className="absolute inset-4 overflow-hidden rounded-full border border-[#E5CFA3]/30 bg-[#07111F] shadow-2xl">
              {heroPhoto ? (
                <img
                  src={heroPhoto}
                  alt="Ảnh cưới Uyên Ương"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#11253E] to-[#07111F] p-4 text-[#F4E8CE]">
                  <span
                    className="text-4xl font-light text-[#E5CFA3]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    鶴
                  </span>
                  <p className="mt-2 text-xs tracking-widest uppercase text-[#E5CFA3]/80">
                    Pháp Lam Đêm Trăng
                  </p>
                </div>
              )}
            </div>

            {/* Khung cổng Nguyệt Môn tròn đè lên viền ảnh */}
            <img
              src="/templates/hac-vu-luu-ly/moon-gate.webp"
              alt="Cổng Nguyệt Môn"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain drop-shadow-[0_10px_25px_rgba(7,17,31,0.8)]"
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
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <p
            className="text-xs italic leading-relaxed text-[#F4E8CE]/85 sm:text-sm"
            style={{ fontFamily: BODY_FONT }}
          >
            &ldquo;Dưới bóng trăng thanh, đôi cánh hạc cùng bay qua biển rộng non cao — Nguyện cùng người nắm tay đi trọn kiếp nhân gian.&rdquo;
          </p>
        </m.div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 2: THÔNG TIN HAI BÊN GIA ĐÌNH (FAMILY)
   - Thẻ Lụa Trăng Ngà #F8F6F0 tương phản cao
   - Tự tách tên phụ huynh tại & thành 2 dòng sạch sẽ
   - 2 cột gia đình cao bằng nhau (items-stretch, h-full flex flex-col)
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

  const groomParents = formatParents(couple?.groomParents || "Ông Lê Văn Thành & Bà Nguyễn Thị Hạnh");
  const brideParents = formatParents(couple?.brideParents || "Ông Trần Quốc Hùng & Bà Phạm Thị Lan");

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-20">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-3 flex justify-center">
          <img
            src="/templates/hac-vu-luu-ly/divider-feather.webp"
            alt=""
            className="h-auto w-32 object-contain opacity-85 sm:w-36"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#0E2238] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Thông Tin Gia Đình
        </h2>
        <p
          className="mt-1 text-xs text-[#5A6D82]"
          style={{ fontFamily: BODY_FONT }}
        >
          Trân trọng báo tin lễ thành hôn của con chúng tôi
        </p>

        {/* Lưới 2 nhà: Nhà Trai & Nhà Gái (Cao bằng nhau) */}
        <div className="mt-8 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
          {/* Nhà Trai */}
          <m.div
            className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#E5CFA3]/70 bg-[#FFFFFF] p-6 text-center shadow-md"
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Viền đôi thanh mảnh */}
            <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#E5CFA3]/30" />

            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase text-[#1B4D5C]"
                style={{ fontFamily: TITLE_FONT }}
              >
                Nhà Trai
              </span>
              <div className="my-3 space-y-1">
                {groomParents.map((name, i) => (
                  <p
                    key={i}
                    className="text-sm font-medium text-[#334457]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-[#E5CFA3]/30 pt-4">
              <p
                className="text-xs text-[#5A6D82]"
                style={{ fontFamily: BODY_FONT }}
              >
                {couple?.groomTitle || "Trưởng Nam"}
              </p>
              <p
                className="text-base font-bold text-[#0E2238]"
                style={{ fontFamily: NAME_FONT }}
              >
                {couple?.groomFullName || couple?.groomName || "Lê Minh Triết"}
              </p>
            </div>
          </m.div>

          {/* Nhà Gái */}
          <m.div
            className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#E5CFA3]/70 bg-[#FFFFFF] p-6 text-center shadow-md"
            initial={{ opacity: 0, x: 15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#E5CFA3]/30" />

            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase text-[#1B4D5C]"
                style={{ fontFamily: TITLE_FONT }}
              >
                Nhà Gái
              </span>
              <div className="my-3 space-y-1">
                {brideParents.map((name, i) => (
                  <p
                    key={i}
                    className="text-sm font-medium text-[#334457]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-[#E5CFA3]/30 pt-4">
              <p
                className="text-xs text-[#5A6D82]"
                style={{ fontFamily: BODY_FONT }}
              >
                {couple?.brideTitle || "Ái Nữ"}
              </p>
              <p
                className="text-base font-bold text-[#0E2238]"
                style={{ fontFamily: NAME_FONT }}
              >
                {couple?.brideFullName || couple?.brideName || "Trần Lưu Ly"}
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
   - Thẻ trắng ngà với huy hiệu thời gian
   - Nút dẫn đường Google Maps chuẩn xác
   ============================================================ */
function EventsSection({ data }: { data: TemplateData }) {
  const visibleEvents = getVisibleEvents(data);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className={`relative z-10 mx-auto text-center ${visibleEvents.length > 1 ? "max-w-4xl" : "max-w-xl"}`}>
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#0E2238] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Sự Kiện Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#5A6D82]"
          style={{ fontFamily: BODY_FONT }}
        >
          Thời gian và địa điểm cử hành hôn lễ
        </p>

        <div className={`mt-8 ${visibleEvents.length > 1 ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-6"}`}>
          {visibleEvents.map((evt, idx) => {
            const { weekday, day, month, year, time } = formatWeddingDateParts(evt.startsAt);
            const cleanLunar = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : null;
            const mapUrl = getEventDirectionsUrl(evt);

            return (
              <m.div
                key={evt.id || idx}
                className="relative overflow-hidden rounded-2xl border border-[#E5CFA3]/70 bg-[#FFFFFF] p-6 text-center shadow-lg"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
              >
                {/* Viền đôi chỉ vàng */}
                <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#E5CFA3]/30" />

                {/* Tiêu đề sự kiện */}
                <span
                  className="inline-block rounded-full border border-[#1B4D5C]/30 bg-[#1B4D5C]/10 px-4 py-1 text-xs font-semibold tracking-widest uppercase text-[#1B4D5C]"
                  style={{ fontFamily: BODY_FONT }}
                >
                  {evt.title || "Lễ Thành Hôn"}
                </span>

                {/* Huy hiệu thời gian & ngày tháng */}
                <div className="my-5 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase text-[#5A6D82]">
                    <Clock className="h-3.5 w-3.5 text-[#1B4D5C]" />
                    <span>{time || "10:00"}</span>
                    <span>•</span>
                    <span>{weekday || "Thứ Bảy"}</span>
                  </div>

                  {/* Cụm ngày lớn kiểu tạp chí sang trọng */}
                  <div className="my-2 flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold text-[#0E2238] sm:text-4xl" style={{ fontFamily: TITLE_FONT }}>
                      {day || "20"}
                    </span>
                    <div className="text-left text-xs leading-tight text-[#5A6D82]">
                      <p className="font-semibold uppercase text-[#0E2238]">Tháng {month || "03"}</p>
                      <p>{year || "2027"}</p>
                    </div>
                  </div>

                  {cleanLunar && (
                    <p className="text-xs italic text-[#5A6D82]">
                      (Tức ngày {cleanLunar})
                    </p>
                  )}
                </div>

                {/* Địa điểm tổ chức */}
                <div className="my-4 border-t border-[#E5CFA3]/30 pt-4">
                  <p
                    className="text-base font-bold text-[#0E2238]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {evt.venueName || "Gem Center — Sảnh Saltus"}
                  </p>
                  <p
                    className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#334457]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {evt.venueAddress || "08 Nguyễn Bỉnh Khiêm, Đa Kao, Quận 1, TP. Hồ Chí Minh"}
                  </p>
                </div>

                {/* Nút chỉ đường Google Maps */}
                <div className="mt-4 flex justify-center">
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[#1B4D5C] bg-[#1B4D5C] px-5 py-2 text-xs font-medium tracking-wide text-[#F4E8CE] transition-all hover:bg-[#0B192C] hover:shadow-md active:scale-95"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Chỉ Đường Đến Hôn Lễ</span>
                    <ExternalLink className="h-3 w-3 opacity-70" />
                  </a>
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 4: ALBUM ẢNH CƯỚI (GALLERY)
   - Nền Lam Lưu Ly Đêm #0B192C huyền ảo
   - Slider 3D Coverflow mượt mà, hỗ trợ phóng to Lightbox modal
   - Gói Free: tối đa 5 ảnh (Pro/VIP tối đa 30)
   ============================================================ */
function GallerySection({ data }: { data: TemplateData }) {
  const rawPhotos = data.photos?.gallery || [];
  const maxPhotos = data.plan === "free" ? 5 : 30;
  const galleryPhotos = rawPhotos.slice(0, maxPhotos);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  if (galleryPhotos.length === 0) return null;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : galleryPhotos.length - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev < galleryPhotos.length - 1 ? prev + 1 : 0));
  };

  return (
    <section className="relative overflow-hidden bg-[#0B192C] px-4 py-16 text-[#F4E8CE] md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url('/templates/hac-vu-luu-ly/background-mobile.webp')" }}
      />
      <MoonlitDust count={12} />

      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-3 flex justify-center">
          <img
            src="/templates/hac-vu-luu-ly/divider-feather.webp"
            alt=""
            className="h-auto w-32 object-contain opacity-85"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#F4E8CE] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Khoảnh Khắc Hạnh Phúc
        </h2>
        <p
          className="mt-1 text-xs text-[#E5CFA3]/80"
          style={{ fontFamily: BODY_FONT }}
        >
          Những thước phim lưu giữ hành trình yêu thương
        </p>

        {/* Khung hiển thị Coverflow */}
        <div className="relative mx-auto mt-8 flex max-w-md items-center justify-center">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#E5CFA3]/40 bg-[#07111F] shadow-2xl">
            <AnimatePresence mode="wait">
              <m.img
                key={activeIndex}
                src={galleryPhotos[activeIndex]?.url}
                alt={galleryPhotos[activeIndex]?.alt || `Ảnh kỷ niệm ${activeIndex + 1}`}
                className="h-full w-full cursor-pointer object-cover"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.45 }}
                onClick={() => setLightboxIndex(activeIndex)}
              />
            </AnimatePresence>

            {/* Nút lùi ảnh */}
            <button
              onClick={handlePrev}
              aria-label="Ảnh trước"
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full border border-[#E5CFA3]/50 bg-[#0B192C]/80 p-2 text-[#F4E8CE] backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Nút tiến ảnh */}
            <button
              onClick={handleNext}
              aria-label="Ảnh sau"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full border border-[#E5CFA3]/50 bg-[#0B192C]/80 p-2 text-[#F4E8CE] backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Chỉ số ảnh hiện tại */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-[#E5CFA3]/30 bg-[#0B192C]/85 px-3 py-1 text-[11px] font-medium tracking-widest text-[#E5CFA3] backdrop-blur-sm">
              {activeIndex + 1} / {galleryPhotos.length}
            </div>
          </div>
        </div>

        {/* Chấm tròn định vị ảnh */}
        <div className="mt-4 flex justify-center gap-1.5">
          {galleryPhotos.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              aria-label={`Chuyển đến ảnh ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === activeIndex
                  ? "w-6 bg-[#E5CFA3]"
                  : "w-1.5 bg-[#E5CFA3]/30 hover:bg-[#E5CFA3]/60",
              )}
            />
          ))}
        </div>
      </div>

      {/* Lightbox Modal phóng to ảnh */}
      {lightboxIndex !== null && (
        <TemplateLightboxModal
          photos={galleryPhotos}
          activeIndex={lightboxIndex}
          onChangeIndex={(idx) => setLightboxIndex(idx)}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}

/* ============================================================
   SECTION 5: LỊCH NGÀY VUI & ĐẾM NGƯỢC (VỊ TRÍ NGÀY CƯỚI #2 - CALENDAR & COUNTDOWN)
   - Lưới lịch tháng cử hành hôn lễ
   - Điểm nhấn trăng tròn / trái tim Lam Lưu Ly #0B192C với nhịp đập êm ái
   - Bộ đếm ngược thời gian chính xác tới giờ cưới
   ============================================================ */
function CalendarCountdownSection({ data }: { data: TemplateData }) {
  const reduce = useReducedMotion();
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const targetDateStr = targetEvent?.startsAt || data.date || "2027-03-20T10:00:00+07:00";
  const targetDate = React.useMemo(() => new Date(targetDateStr), [targetDateStr]);

  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  React.useEffect(() => {
    const calculateTime = () => {
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

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  // Tạo lưới lịch tháng
  const { month, year, eventDays, calendarDays } = React.useMemo(() => {
    const valid = !isNaN(targetDate.getTime());
    const mNum = valid ? targetDate.getMonth() + 1 : 3;
    const yNum = valid ? targetDate.getFullYear() : 2027;

    const daysSet = new Set<number>();
    visibleEvents.forEach((evt) => {
      if (evt.startsAt) {
        const d = new Date(evt.startsAt);
        if (d.getFullYear() === yNum && d.getMonth() + 1 === mNum) {
          daysSet.add(d.getDate());
        }
      }
    });
    if (daysSet.size === 0 && valid) {
      daysSet.add(targetDate.getDate());
    }

    const firstDayOfWeek = new Date(yNum, mNum - 1, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(yNum, mNum, 0).getDate();

    const days: (number | null)[] = [];
    // Thứ Hai là cột đầu tiên (chuyển đổi từ CN=0 sang T2=0)
    const offset = (firstDayOfWeek + 6) % 7;
    for (let i = 0; i < offset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return {
      month: mNum,
      year: yNum,
      eventDays: daysSet,
      calendarDays: days,
    };
  }, [targetDate, visibleEvents]);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#0E2238] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Ngày Chung Đôi
        </h2>
        <p
          className="mt-1 text-xs text-[#5A6D82]"
          style={{ fontFamily: BODY_FONT }}
        >
          Cùng đếm ngược từng khoảnh khắc thiêng liêng
        </p>

        {/* Khung Lịch Tháng */}
        <div className="relative mx-auto mt-8 max-w-sm rounded-2xl border border-[#E5CFA3]/70 bg-[#FFFFFF] p-6 shadow-lg">
          <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#E5CFA3]/30" />

          <p
            className="text-sm font-bold tracking-widest uppercase text-[#1B4D5C]"
            style={{ fontFamily: TITLE_FONT }}
          >
            Tháng {month} · {year}
          </p>

          {/* Các thứ trong tuần */}
          <div className="mt-4 grid grid-cols-7 gap-1 text-[11px] font-semibold text-[#5A6D82]">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span className="text-[#1B4D5C]">CN</span>
          </div>

          {/* Ô các ngày trong tháng */}
          <div className="mt-2 grid grid-cols-7 gap-1 text-xs">
            {calendarDays.map((d, idx) => {
              if (d === null) {
                return <div key={`empty-${idx}`} className="h-8 w-8" />;
              }

              const isWeddingDay = eventDays.has(d);

              return (
                <div
                  key={`day-${d}`}
                  className="flex h-8 w-8 items-center justify-center mx-auto"
                >
                  {isWeddingDay ? (
                    <m.div
                      className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#0B192C] font-bold text-[#F4E8CE] shadow-md"
                      animate={
                        reduce
                          ? {}
                          : {
                            scale: [1, 1.1, 1],
                          }
                      }
                      transition={{
                        duration: 2.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <span>{d}</span>
                      <Heart className="absolute -top-1 -right-1 h-3 w-3 fill-[#E5CFA3] text-[#E5CFA3]" />
                    </m.div>
                  ) : (
                    <span className="text-[#334457]">{d}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4 Khối Đếm Ngược Thời Gian */}
        <div className="mx-auto mt-8 grid max-w-sm grid-cols-4 gap-2 sm:gap-3">
          {[
            { label: "Ngày", val: timeLeft.days },
            { label: "Giờ", val: timeLeft.hours },
            { label: "Phút", val: timeLeft.minutes },
            { label: "Giây", val: timeLeft.seconds },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center rounded-xl border border-[#E5CFA3]/60 bg-[#FFFFFF] py-3 shadow-md"
            >
              <span
                className="text-xl font-bold text-[#0E2238] sm:text-2xl"
                style={{ fontFamily: TITLE_FONT }}
              >
                {String(item.val).padStart(2, "0")}
              </span>
              <span
                className="mt-0.5 text-[10px] font-medium tracking-wider uppercase text-[#5A6D82]"
                style={{ fontFamily: BODY_FONT }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 6: LỊCH TRÌNH TIỆC CƯỚI & TRANG PHỤC (TIMELINE & DRESS CODE)
   - Trục thời gian đứng thanh lịch với họa tiết trăng khuyết & hình thoi
   - Dress code sang trọng: Lam Lưu Ly #0B192C, Vàng bạch kim #E5CFA3, Trắng ngà #F8F6F0
   ============================================================ */
function TimelineSection({ data }: { data: TemplateData }) {
  const timeline = getTimeline(data);
  const dressColors = getDressColors(data);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#0E2238] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Lịch Trình Hôn Lễ
        </h2>
        <p
          className="mt-1 text-xs text-[#5A6D82]"
          style={{ fontFamily: BODY_FONT }}
        >
          Các mốc thời gian trong ngày trọng đại
        </p>

        {/* Danh sách mốc sự kiện */}
        <div className="relative mx-auto mt-10 max-w-md">
          {/* Đường trục thời gian dọc màu vàng bạch kim */}
          <div className="absolute top-4 bottom-4 left-[31px] w-px bg-gradient-to-b from-[#E5CFA3] via-[#1B4D5C]/40 to-[#E5CFA3]" />

          <div className="space-y-6">
            {timeline.map((item, idx) => (
              <m.div
                key={idx}
                className="relative flex items-center gap-4 text-left"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                {/* Điểm mốc hình thoi / ngọc bích */}
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#E5CFA3]/70 bg-[#FFFFFF] shadow-sm">
                  <div className="text-center">
                    <span
                      className="text-xs font-bold text-[#1B4D5C]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {item.time}
                    </span>
                  </div>
                </div>

                {/* Nội dung hoạt động */}
                <div className="flex-1 rounded-2xl border border-[#E5CFA3]/40 bg-[#FFFFFF] p-3.5 shadow-sm">
                  <p
                    className="text-xs font-medium text-[#334457] sm:text-sm"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {item.label}
                  </p>
                </div>
              </m.div>
            ))}
          </div>
        </div>

        {/* Khu vực Dress Code */}
        <div className="mx-auto mt-14 max-w-sm rounded-2xl border border-[#E5CFA3]/60 bg-[#FFFFFF] p-6 shadow-md">
          <p
            className="text-xs font-semibold tracking-widest uppercase text-[#1B4D5C]"
            style={{ fontFamily: BODY_FONT }}
          >
            Trang Phục Gợi Ý (Dress Code)
          </p>
          <p className="mt-1 text-xs text-[#5A6D82]">
            Kính mời quý khách lựa chọn trang phục theo bảng màu hôn lễ
          </p>

          <div className="mt-5 flex items-center justify-center gap-4 sm:gap-6">
            {dressColors.map((color, idx) => (
              <div
                key={idx}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-[#E5CFA3] shadow-md transition-transform hover:scale-110"
                style={{ backgroundColor: color }}
                title={color}
                aria-label={`Màu trang phục ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 7: HỘP MỪNG CƯỚI (GIFT / LI XI)
   - Nền Lam Lưu Ly Đêm #0B192C
   - Tráp trang sức pháp lam 3 trạng thái (normal / hover / active)
   - Mở GiftModal obsidian chuẩn tương thích gói Free/Pro/VIP
   ============================================================ */
function GiftSection({
  data,
  plan,
  guestName,
}: {
  data: TemplateData;
  plan?: WeddingPlan;
  guestName: string | null;
}) {
  const [giftState, setGiftState] = React.useState<"normal" | "hover" | "active">("normal");
  const [giftModalOpen, setGiftModalOpen] = React.useState(false);

  const coupleDisplayName = `${data.couple?.groomName ?? "Chú Rể"} & ${data.couple?.brideName ?? "Cô Dâu"}`;

  const getGiftBoxImg = () => {
    switch (giftState) {
      case "hover":
        return "/templates/hac-vu-luu-ly/gift-hover.webp";
      case "active":
        return "/templates/hac-vu-luu-ly/gift-active.webp";
      default:
        return "/templates/hac-vu-luu-ly/gift-normal.webp";
    }
  };

  const handleOpenGiftModal = () => {
    setGiftState("active");
    setGiftModalOpen(true);
  };

  return (
    <section className="relative overflow-hidden bg-[#0B192C] px-4 py-16 text-[#F4E8CE] md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url('/templates/hac-vu-luu-ly/background-mobile.webp')" }}
      />
      <MoonlitDust count={12} />

      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-3 flex justify-center">
          <img
            src="/templates/hac-vu-luu-ly/divider-feather.webp"
            alt=""
            className="h-auto w-32 object-contain opacity-85"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#F4E8CE] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Hộp Mừng Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#E5CFA3]/80"
          style={{ fontFamily: BODY_FONT }}
        >
          Món quà chúc phúc ý nghĩa gửi trao ngày chung đôi
        </p>

        {/* Tráp trang sức pháp lam 3 trạng thái */}
        <div className="mt-8 flex flex-col items-center">
          <m.div
            className="group relative cursor-pointer"
            onClick={handleOpenGiftModal}
            onMouseEnter={() => setGiftState("hover")}
            onMouseLeave={() => setGiftState("normal")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Quầng hào quang vàng kim dưới tráp */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(229,207,163,0.35) 0%, rgba(27,77,92,0.15) 55%, transparent 75%)",
                filter: "blur(18px)",
              }}
            />
            <img
              src={getGiftBoxImg()}
              alt="Tráp Trang Sức Pháp Lam"
              className="relative z-10 h-auto w-40 object-contain drop-shadow-2xl sm:w-48"
            />
          </m.div>

          <button
            onClick={handleOpenGiftModal}
            className="mt-5 rounded-full border border-[#E5CFA3] bg-gradient-to-r from-[#1B4D5C] via-[#0B192C] to-[#1B4D5C] px-6 py-2.5 text-xs font-semibold tracking-widest uppercase text-[#F4E8CE] shadow-lg transition-all hover:border-[#F4E8CE] hover:shadow-[0_0_15px_rgba(229,207,163,0.3)] active:scale-95"
            style={{ fontFamily: BODY_FONT }}
          >
            Gửi Quà Mừng Cưới
          </button>
        </div>
      </div>

      {/* Modal Mừng Cưới qua cổng GiftModal */}
      {giftModalOpen && (
        <GiftModal
          open={giftModalOpen}
          onClose={() => {
            setGiftModalOpen(false);
            setGiftState("normal");
          }}
          gift={data.gift}
          plan={plan ?? "free"}
          coupleName={coupleDisplayName}
          guestName={guestName}
          tone="obsidian"
        />
      )}
    </section>
  );
}

/* ============================================================
   MAIN TEMPLATE: HẠC VŨ LƯU LY
   - Điều khiển mở thiệp 2 chiều (isOpened <-> parentOpenedRef)
   - Khóa cuộn container khi !coverGone
   - Section order & hidden sections tuân thủ cấu hình
   - Footer tách rời ngoài container order
   ============================================================ */
export function HacVuLuuLyTemplate({
  data,
  isOpened = false,
  onOpenedChange,
  guestName,
  contained = false,
  mode,
  inviteSlug,
  weddingSlug,
  invitationMode,
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
        "relative w-full bg-[#07111F] text-[#0E2238] selection:bg-[#E5CFA3]/25",
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
            transition={{ duration: 0.65 }}
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
      {!data.hiddenSections?.includes("music") && (
        <LiveMusicFloatingButton
        src={data.music?.src}
        title={data.music?.title || "Khúc Vũ Lưu Ly"}
        visible={openState}
        tone="obsidian"
      />
      )}

      {/* --------------------------------------------------------
          LỚP 3: RUỘT THIỆP CƯỚI CHÍNH (Ẩn khi chưa mở thiệp)
          - Cột thẻ Lụa Trăng Ngà max-w-[840px]
          -------------------------------------------------------- */}
      <main
        className={cn(
          "relative z-10 transition-opacity duration-700",
          !openState ? "hidden opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {/* Nền cố định phía sau ruột thiệp */}
        <div
          className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url('/templates/hac-vu-luu-ly/background.webp')" }}
        />

        {/* Khung nội dung trung tâm: Cột thẻ Lụa Trăng Ngà max-w-[840px] */}
        <div className="relative mx-auto my-6 w-full max-w-[840px] rounded-3xl border border-[#E5CFA3]/50 bg-[#F8F6F0] shadow-2xl">
          {/* Section 1: Hero — Cổng Nguyệt Môn (luôn ở đầu thẻ) */}
          <div className="rounded-t-3xl bg-[#0B192C]">
            <HeroSection data={data} />
          </div>

          {/* Container các section động theo orderOf và hiddenSections */}
          <div className="flex flex-col bg-[#F8F6F0]">
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
                <section className="relative overflow-hidden rounded-b-3xl bg-[#07111F] px-4 py-16 text-[#F4E8CE] md:py-24">
                  <div
                    className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
                    style={{ backgroundImage: "url('/templates/hac-vu-luu-ly/background-mobile.webp')" }}
                  />
                  <MoonlitDust count={16} />

                  <div className="relative z-10 mx-auto max-w-xl">
                    <TemplateRsvpSection
                      data={data}
                      mode={mode}
                      tone="sapphire"
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
                          accentColor="#1B4D5C"
                          textColor="#F4E8CE"
                          mutedColor="#E5CFA3"
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
        <footer className="border-t border-[#E5CFA3]/25 bg-[#07111F] px-4 py-12 text-center text-xs text-[#F4E8CE]/70">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
            <img
              src="/templates/hac-vu-luu-ly/divider-feather.webp"
              alt=""
              className="h-auto w-24 object-contain opacity-65"
              aria-hidden="true"
            />
            <p className="tracking-widest uppercase text-[#E5CFA3]">
              {data.couple?.groomName ?? "Chú Rể"} &amp; {data.couple?.brideName ?? "Cô Dâu"}
            </p>
            <p className="text-[11px] text-[#F4E8CE]/60">
              Cảm ơn quý khách đã gửi trọn yêu thương và chung vui cùng chúng tôi
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default HacVuLuuLyTemplate;
