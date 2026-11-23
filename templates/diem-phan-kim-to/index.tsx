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
   BẢNG MÀU CHÍNH THỨC: DIỄM PHẤN KIM TƠ (diem-phan-kim-to)
   - Hồng Rượu Vang Sâu (Velvet Rose Burgundy — Chữ chính, nút CTA, trái tim lịch): #6E2331 (sâu #4D1520, hover #852C3D)
   - Hồng Phấn Cổ (Antique Dusty Rose — Chữ phụ, nhấn dịu): #A8626E (nhạt #EED6DA)
   - Lụa Phấn Sứ (Porcelain Rose Silk — Nền ruột thiệp & Thẻ chính): #FDF9F9 (thẻ nổi #FFFFFF, nền phủ bìa #F7E8EA)
   - Vàng Hồng Ánh Kim (Spun Rose Gold — Viền khung oval, chỉ tơ mảnh, ấn sáp, ruy-băng): #D2A08E (sáng #F0D5C8, trầm #B57F6D)
   - Dress Code mặc định: #54121B (Đỏ rượu vang), #8B3A42 (Hồng đất đậm), #F3BFC4 (Hồng phấn sứ)
   ============================================================ */

const ROSE_BURGUNDY = "#6E2331";
const ROSE_BURGUNDY_DARK = "#4D1520";
const ROSE_BURGUNDY_HOVER = "#852C3D";

const DUSTY_ROSE = "#A8626E";
const DUSTY_ROSE_PALE = "#EED6DA";

const PORCELAIN_SILK = "#FDF9F9";
const PORCELAIN_CARD = "#FFFFFF";

const ROSE_GOLD = "#D2A08E";
const ROSE_GOLD_LIGHT = "#F0D5C8";
const ROSE_GOLD_DEEP = "#B57F6D";
const ROSE_GOLD_BORDER = "rgba(210, 160, 142, 0.55)";
const ROSE_GOLD_SUBTLE = "rgba(210, 160, 142, 0.25)";

const TEXT_TITLE = "#6E2331";
const TEXT_BODY = "#4D1520";
const TEXT_MUTED = "#8B525C";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_PARIS = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "17:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm cùng Uyên Ương" },
  { time: "18:30", label: "Lễ thành hôn & Trao lời hẹn ước lụa hồng trăm năm" },
  { time: "19:00", label: "Dạ tiệc thời trang Parisian Rose & Nâng ly chúc phúc" },
  { time: "20:00", label: "Giai điệu âm nhạc lãng mạn & Điệu valse gắn kết" },
  { time: "21:00", label: "Tiễn khách & Trao quà cảm tạ tri ân" },
];

const DEFAULT_DRESS = ["#54121B", "#8B3A42", "#F3BFC4"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Cánh Hoa Hồng Phấn Bay Nhẹ Nhàng
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function RosePetalsFalling({ count = 16 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 17) % 94 + 3}%`,
      size: (idx % 3) * 3 + 8,
      duration: 10 + (idx % 4) * 2.5,
      delay: (idx * 0.6) % 5,
      sway: (idx % 2 === 0 ? 1 : -1) * (15 + (idx % 10)),
      rotation: (idx * 45) % 360,
    }));
  }, [count]);

  if (reduce) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <m.div
          key={p.id}
          className="absolute rounded-full opacity-60"
          style={{
            left: p.left,
            top: "-5%",
            width: p.size,
            height: p.size * 1.3,
            background:
              "radial-gradient(ellipse at 40% 40%, #F7E8EA 0%, #EED6DA 60%, rgba(210,160,142,0.4) 100%)",
            boxShadow: "0 2px 6px rgba(110,35,49,0.08)",
            borderRadius: "60% 40% 70% 30% / 50% 60% 40% 50%",
          }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, p.sway, 0, -p.sway, 0],
            rotate: [p.rotation, p.rotation + 180, p.rotation + 360],
            opacity: [0, 0.75, 0.75, 0],
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
   MÀN HÌNH BÌA: GIẢI LỤA KHAI THIỆP (ENVELOPE COVER)
   - Thẻ cotton trắng sứ #FFFFFF/95 bóng đổ hồng khói mềm
   - Họa tiết floral-drape.webp bất đối xứng 2 góc chéo (TL & BR lật 180°)
   - Nơ ruy-băng ấn sáp ribbon-seal.webp ở đỉnh thẻ
   - Hiệu ứng mở thiệp "Tháo Nơ Lụa" bừng sáng và rèm lụa trượt mở
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
        "relative flex w-full flex-col items-center justify-center overflow-hidden px-4 select-none",
        contained ? "min-h-full py-6" : "min-h-screen py-10",
      )}
      style={{ backgroundColor: "#F7E8EA" }}
    >
      {/* Nền lụa phấn sứ có loang màu nước */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: "url('/templates/diem-phan-kim-to/background-mobile.webp')",
          opacity: 0.85,
          transform: openingStage ? "scale(1.08)" : "scale(1)",
        }}
      />

      {/* Quầng sáng phấn hồng trung tâm */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: "min(90vw, 500px)",
          height: "min(90vw, 500px)",
          background:
            "radial-gradient(circle, rgba(253,249,249,0.9) 0%, rgba(247,232,234,0.6) 65%, transparent 80%)",
          filter: "blur(30px)",
        }}
      />

      {/* Cánh hoa hồng phấn rơi êm dịu */}
      <RosePetalsFalling count={14} />

      {/* Hai lớp màn lụa phấn trượt mở sang 2 bên khi bấm mở thiệp (chỉ kích hoạt khi openingStage, nằm dưới thẻ z-20) */}
      {openingStage && (
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
          <m.div
            className="absolute inset-y-0 left-0 w-1/2 border-r border-[#D2A08E]/40 bg-[#FDF9F9]/90"
            initial={{ x: "0%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 0.7, ease: EASE_PARIS }}
          />
          <m.div
            className="absolute inset-y-0 right-0 w-1/2 border-l border-[#D2A08E]/40 bg-[#FDF9F9]/90"
            initial={{ x: "0%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 0.7, ease: EASE_PARIS }}
          />
        </div>
      )}

      {/* Thẻ Bìa Giấy Cotton Trắng Sứ Trung Tâm */}
      <m.div
        className={cn(
          "relative z-20 my-auto flex w-full max-w-sm flex-col items-center rounded-3xl p-6 text-center transition-all",
          contained ? "py-5" : "py-8",
        )}
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          boxShadow: "0 24px 64px rgba(110, 35, 49, 0.12)",
          backdropFilter: "blur(8px)",
        }}
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={
          openingStage
            ? { opacity: 0, scale: 0.92, y: -25 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{ duration: 0.65, ease: EASE_PARIS }}
      >
        {/* Khung viền đôi chỉ tơ vàng hồng */}
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-[#D2A08E]/60">
          <div className="absolute inset-1 rounded-xl border border-dashed border-[#D2A08E]/40" />

          {/* Họa tiết floral-drape.webp bất đối xứng 2 góc chéo (Top-Left & Bottom-Right lật 180°) */}
          <img
            src="/templates/diem-phan-kim-to/floral-drape.webp"
            alt=""
            className="pointer-events-none absolute -top-1.5 -left-1.5 h-auto w-12 sm:w-14"
            aria-hidden="true"
          />
          <img
            src="/templates/diem-phan-kim-to/floral-drape.webp"
            alt=""
            className="pointer-events-none absolute -bottom-1.5 -right-1.5 h-auto w-12 rotate-180 sm:w-14"
            aria-hidden="true"
          />
        </div>

        {/* Nơ ruy-băng lụa kẹp ấn sáp hoa hồng vàng hồng ở đỉnh thẻ */}
        <m.div
          className="relative mt-1 mb-2 flex h-20 w-auto items-center justify-center sm:h-24"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={
            openingStage
              ? { scale: 1.15, y: -15, opacity: 0 }
              : { scale: 1, y: 0, opacity: 1 }
          }
          transition={{ duration: 0.7, ease: EASE_PARIS }}
        >
          {/* Quầng sáng dịu sau nơ */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(240,213,200,0.5) 0%, rgba(210,160,142,0.15) 60%, transparent 80%)",
              filter: "blur(8px)",
            }}
          />
          <img
            src="/templates/diem-phan-kim-to/ribbon-seal.webp"
            alt="Nơ Ruy-băng Lụa & Ấn Sáp"
            className="relative z-10 h-full w-auto object-contain drop-shadow-md"
          />
        </m.div>

        {/* Phụ đề phong cách */}
        <p
          className="text-[11px] font-semibold tracking-[0.35em] uppercase text-[#A8626E]"
          style={{ fontFamily: BODY_FONT }}
        >
          {data.ui?.eyebrow || "Diễm Phấn Kim Tơ"}
        </p>

        {/* Tên cặp đôi 3 dòng chuẩn Paris (Groom / & / Bride) */}
        <div className="my-2.5 w-full px-2">
          <h1
            className="block text-2xl font-bold tracking-wide text-[#6E2331] break-words sm:text-3xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            {data.couple?.groomName || "Gia Hưng"}
          </h1>
          <div className="my-0.5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#D2A08E]/60" />
            <span
              className="text-lg font-normal italic text-[#D2A08E]"
              style={{ fontFamily: TITLE_FONT }}
            >
              &amp;
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#D2A08E]/60" />
          </div>
          <h1
            className="block text-2xl font-bold tracking-wide text-[#6E2331] break-words sm:text-3xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            {data.couple?.brideName || "Uyển Nhi"}
          </h1>
        </div>

        {/* Dải phân cách tơ vàng hồng */}
        <div className="my-1.5 flex items-center justify-center">
          <img
            src="/templates/diem-phan-kim-to/divider-silk.webp"
            alt=""
            className="h-auto w-36 object-contain opacity-85 sm:w-40"
            aria-hidden="true"
          />
        </div>

        {/* Lời trân trọng kính mời */}
        <p
          className="mt-1 text-xs font-semibold tracking-[0.28em] uppercase text-[#A8626E]"
          style={{ fontFamily: BODY_FONT }}
        >
          {data.ui?.invitePrefix || "Trân Trọng Kính Mời"}
        </p>

        {/* Tên khách mời trang trọng */}
        <div className="my-2 max-w-[270px] rounded-full border border-[#D2A08E]/50 bg-[#FDF9F9] px-4 py-1.5 shadow-xs">
          <p
            className="truncate text-xs font-semibold tracking-wide text-[#6E2331]"
            style={{ fontFamily: BODY_FONT }}
          >
            {guestName || data.ui?.defaultGuestName || "Quý Khách Quý Mến"}
          </p>
        </div>

        {/* Ngày cưới tóm tắt trên bìa */}
        {dateParts && (
          <p
            className="mt-1 text-xs font-medium tracking-[0.2em] text-[#8B525C] uppercase"
            style={{ fontFamily: BODY_FONT }}
          >
            {dateParts.day} · {dateParts.month} · {dateParts.year}
          </p>
        )}

        {/* Nút bấm mở thiệp pill cao cấp */}
        <m.button
          onClick={handleOpenClick}
          disabled={openingStage}
          className="group relative mt-5 flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full border border-[#D2A08E] bg-[#6E2331] px-7 py-2.5 text-xs font-semibold tracking-widest uppercase text-[#FDF9F9] shadow-md transition-all duration-300 hover:bg-[#852C3D] hover:shadow-[0_0_18px_rgba(210,160,142,0.4)] active:scale-95"
          style={{ fontFamily: BODY_FONT }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Vệt sáng quét ngang nút */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#FDF9F9]/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          <span>Mở Thiệp</span>
        </m.button>
      </m.div>
    </div>
  );
}

/* ============================================================
   SECTION 1: HERO — "CAMEO HỒNG PHẤN"
   - Khung oval-cameo.webp ôm trọn ảnh cặp đôi hình bầu dục
   - Không lặp ngày cưới tại Hero
   - Hiệu ứng ánh vàng hồng lướt qua viền khung (whileInView ở wrapper)
   ============================================================ */
function HeroSection({ data }: { data: TemplateData }) {
  const couple = data.couple;
  const heroPhoto = data.photos?.heroUrl || "/photos/hero2.webp";

  return (
    <section className="relative overflow-hidden pt-12 pb-16 text-center text-[#6E2331]">
      <RosePetalsFalling count={10} />

      <div className="relative z-10 mx-auto max-w-xl px-4">
        {/* Phụ đề phong cách */}
        <p
          className="text-xs font-semibold tracking-[0.35em] uppercase text-[#A8626E]"
          style={{ fontFamily: BODY_FONT }}
        >
          {data.ui?.eyebrow || "Haute Couture Phấn Lụa"}
        </p>

        {/* Tên cặp đôi 3 dòng trang trọng */}
        <div className="my-4">
          <h2
            className="block text-3xl font-bold tracking-wide text-[#6E2331] break-words sm:text-4xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            {couple?.groomFullName || couple?.groomName || "Vũ Gia Hưng"}
          </h2>
          <div className="my-1 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#D2A08E]/60" />
            <span
              className="text-xl font-normal italic text-[#D2A08E]"
              style={{ fontFamily: TITLE_FONT }}
            >
              &amp;
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#D2A08E]/60" />
          </div>
          <h2
            className="block text-3xl font-bold tracking-wide text-[#6E2331] break-words sm:text-4xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            {couple?.brideFullName || couple?.brideName || "Đỗ Uyển Nhi"}
          </h2>
        </div>

        {/* Dải phân cách tơ vàng hồng */}
        <div className="my-3 flex justify-center">
          <img
            src="/templates/diem-phan-kim-to/divider-silk.webp"
            alt=""
            className="h-auto w-36 object-contain opacity-85"
            aria-hidden="true"
          />
        </div>

        {/* Khung Oval Cameo ôm ảnh cặp đôi hình bầu dục */}
        <m.div
          className="relative mx-auto mt-4 mb-2 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, ease: EASE_PARIS }}
        >
          <div className="relative aspect-[3/4] w-60 sm:w-68 md:w-76">
            {/* Lớp ảnh cặp đôi hình bầu dục nằm bên dưới khung Cameo */}
            <div className="absolute inset-4 overflow-hidden rounded-[50%] bg-[#F7E8EA] shadow-xl">
              {heroPhoto ? (
                <img
                  src={heroPhoto}
                  alt="Ảnh cưới Uyên Ương"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#FFFFFF] to-[#F7E8EA] p-4 text-[#6E2331]">
                  <span
                    className="text-3xl font-light text-[#D2A08E]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    GH &amp; UN
                  </span>
                  <p className="mt-2 text-[10px] tracking-widest uppercase text-[#A8626E]">
                    Haute Couture Phấn Lụa
                  </p>
                </div>
              )}
            </div>

            {/* Khung Oval Cameo bằng tơ vàng hồng đè lên viền ảnh */}
            <img
              src="/templates/diem-phan-kim-to/oval-cameo.webp"
              alt="Khung Oval Cameo"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain drop-shadow-[0_12px_28px_rgba(110,35,49,0.14)]"
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
            className="text-xs italic leading-relaxed text-[#8B525C] sm:text-sm"
            style={{ fontFamily: BODY_FONT }}
          >
            &ldquo;Nguyện cùng người dệt nên khúc ca tơ hồng, đi qua ngàn năm tháng bình yên và trọn vẹn yêu thương.&rdquo;
          </p>
        </m.div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 2: THÔNG TIN HAI BÊN GIA ĐÌNH (FAMILY)
   - 2 cột gia đình cao bằng nhau (items-stretch, h-full flex flex-col)
   - Tự tách tên phụ huynh tại & thành 2 dòng sạch sẽ (bỏ ký tự &)
   - Font Playfair Display màu #6E2331, groomTitle / brideTitle động
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

  const groomParents = formatParents(couple?.groomParents || "Ông Vũ Quốc Bảo & Bà Lê Mai Hương");
  const brideParents = formatParents(couple?.brideParents || "Ông Đỗ Minh Đức & Bà Trần Mỹ Linh");

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-20">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-3 flex justify-center">
          <img
            src="/templates/diem-phan-kim-to/divider-silk.webp"
            alt=""
            className="h-auto w-32 object-contain opacity-85 sm:w-36"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#6E2331] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Thông Tin Gia Đình
        </h2>
        <p
          className="mt-1 text-xs text-[#8B525C]"
          style={{ fontFamily: BODY_FONT }}
        >
          Trân trọng báo tin lễ thành hôn của con chúng tôi
        </p>

        {/* Lưới 2 nhà: Nhà Trai & Nhà Gái (Cao bằng nhau) */}
        <div className="mt-8 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
          {/* Nhà Trai */}
          <m.div
            className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#D2A08E]/60 bg-[#FFFFFF] p-6 text-center shadow-sm"
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Viền đôi thanh mảnh */}
            <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-dashed border-[#D2A08E]/30" />

            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase text-[#A8626E]"
                style={{ fontFamily: TITLE_FONT }}
              >
                Nhà Trai
              </span>
              <div className="my-3 space-y-1">
                {groomParents.map((name, i) => (
                  <p
                    key={i}
                    className="text-sm font-medium text-[#4D1520]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-[#D2A08E]/30 pt-4">
              <p
                className="text-xs text-[#8B525C]"
                style={{ fontFamily: BODY_FONT }}
              >
                {couple?.groomTitle || "Trưởng Nam"}
              </p>
              <p
                className="text-base font-bold text-[#6E2331]"
                style={{ fontFamily: TITLE_FONT }}
              >
                {couple?.groomFullName || couple?.groomName || "Vũ Gia Hưng"}
              </p>
            </div>
          </m.div>

          {/* Nhà Gái */}
          <m.div
            className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#D2A08E]/60 bg-[#FFFFFF] p-6 text-center shadow-sm"
            initial={{ opacity: 0, x: 15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-dashed border-[#D2A08E]/30" />

            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase text-[#A8626E]"
                style={{ fontFamily: TITLE_FONT }}
              >
                Nhà Gái
              </span>
              <div className="my-3 space-y-1">
                {brideParents.map((name, i) => (
                  <p
                    key={i}
                    className="text-sm font-medium text-[#4D1520]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-[#D2A08E]/30 pt-4">
              <p
                className="text-xs text-[#8B525C]"
                style={{ fontFamily: BODY_FONT }}
              >
                {couple?.brideTitle || "Ái Nữ"}
              </p>
              <p
                className="text-base font-bold text-[#6E2331]"
                style={{ fontFamily: TITLE_FONT }}
              >
                {couple?.brideFullName || couple?.brideName || "Đỗ Uyển Nhi"}
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
   - Bố cục ngày kiểu tạp chí: THỨ | NGÀY | THÁNG màu #6E2331 viền chỉ vàng hồng
   - Âm lịch chuẩn không lặp chữ "ngày", phân cách bằng divider-silk.webp
   - Nút dẫn đường Google Maps nền #6E2331 viền #D2A08E
   ============================================================ */
function EventsSection({ data }: { data: TemplateData }) {
  const visibleEvents = getVisibleEvents(data);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className={`relative z-10 mx-auto text-center ${visibleEvents.length > 1 ? "max-w-4xl" : "max-w-xl"}`}>
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#6E2331] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Sự Kiện Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#8B525C]"
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
                className="relative overflow-hidden rounded-2xl border border-[#D2A08E]/70 bg-[#FFFFFF] p-6 text-center shadow-md"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
              >
                {/* Viền đôi thanh mảnh */}
                <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#D2A08E]/30" />

                {/* Tiêu đề sự kiện */}
                <span
                  className="inline-block rounded-full border border-[#D2A08E]/60 bg-[#F7E8EA]/60 px-4 py-1 text-xs font-semibold tracking-widest uppercase text-[#6E2331]"
                  style={{ fontFamily: BODY_FONT }}
                >
                  {evt.title || "Lễ Thành Hôn"}
                </span>

                {/* Huy hiệu thời gian & ngày tháng kiểu tạp chí */}
                <div className="my-5 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase text-[#8B525C]">
                    <Clock className="h-3.5 w-3.5 text-[#D2A08E]" />
                    <span>{time || "10:00"}</span>
                    <span>•</span>
                    <span>{weekday || "Thứ Bảy"}</span>
                  </div>

                  {/* Cụm ngày lớn kiểu tạp chí sang trọng: THỨ | NGÀY | THÁNG */}
                  <div className="my-2.5 flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold text-[#6E2331] sm:text-4xl" style={{ fontFamily: TITLE_FONT }}>
                      {day || "20"}
                    </span>
                    <div className="text-left text-xs leading-tight text-[#8B525C]">
                      <p className="font-semibold uppercase text-[#6E2331]">Tháng {month || "03"}</p>
                      <p>{year || "2027"}</p>
                    </div>
                  </div>

                  {cleanLunar && (
                    <p className="text-xs italic text-[#8B525C]">
                      (Tức ngày {cleanLunar})
                    </p>
                  )}
                </div>

                {/* Dải phân cách tơ vàng hồng */}
                <div className="my-2 flex justify-center">
                  <img
                    src="/templates/diem-phan-kim-to/divider-silk.webp"
                    alt=""
                    className="h-auto w-28 object-contain opacity-75"
                    aria-hidden="true"
                  />
                </div>

                {/* Địa điểm tổ chức */}
                <div className="my-3 border-t border-[#D2A08E]/30 pt-3">
                  <p
                    className="text-base font-bold text-[#6E2331]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {evt.venueName || "Trung Tâm Hội Nghị & Tiệc Cưới White Palace"}
                  </p>
                  <p
                    className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#4D1520]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {evt.venueAddress || "194 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP. Hồ Chí Minh"}
                  </p>
                </div>

                {/* Nút chỉ đường Google Maps */}
                <div className="mt-4 flex justify-center">
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[#D2A08E] bg-[#6E2331] px-5 py-2 text-xs font-medium tracking-wide text-[#FDF9F9] shadow-sm transition-all hover:bg-[#852C3D] hover:shadow-md active:scale-95"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#D2A08E]" />
                    <span>Xem Bản Đồ Chỉ Đường</span>
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
   - 3D Coverflow / Carousel trên nền lụa phấn sứ
   - Bóng đổ hồng khói mềm rgba(110,35,49,0.16)
   - Gói Free: tối đa 5 ảnh (Pro/VIP tối đa 30)
   - Phóng to qua TemplateLightboxModal (createPortal)
   ============================================================ */
function GallerySection({ data }: { data: TemplateData }) {
  const isFree = (data.plan ?? "free") === "free";
  const rawPhotos = data.photos?.gallery || [];
  const maxPhotos = isFree ? 5 : 30;
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
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-3 flex justify-center">
          <img
            src="/templates/diem-phan-kim-to/divider-silk.webp"
            alt=""
            className="h-auto w-32 object-contain opacity-85"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#6E2331] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Khoảnh Khắc Hạnh Phúc
        </h2>
        <p
          className="mt-1 text-xs text-[#8B525C]"
          style={{ fontFamily: BODY_FONT }}
        >
          Những thước phim lưu giữ hành trình yêu thương
        </p>

        {/* Khung hiển thị Coverflow */}
        <div className="relative mx-auto mt-8 flex max-w-md items-center justify-center">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-[#D2A08E]/60 bg-[#FFFFFF] shadow-[0_16px_36px_rgba(110,35,49,0.16)]">
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
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full border border-[#D2A08E] bg-[#FFFFFF]/90 p-2 text-[#6E2331] backdrop-blur-xs shadow-md transition-transform hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Nút tiến ảnh */}
            <button
              onClick={handleNext}
              aria-label="Ảnh sau"
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full border border-[#D2A08E] bg-[#FFFFFF]/90 p-2 text-[#6E2331] backdrop-blur-xs shadow-md transition-transform hover:scale-110 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Chỉ số ảnh hiện tại */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-[#D2A08E]/50 bg-[#FFFFFF]/90 px-3 py-1 text-[11px] font-medium tracking-widest text-[#6E2331] backdrop-blur-xs shadow-xs">
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
                  ? "w-6 bg-[#6E2331]"
                  : "w-1.5 bg-[#D2A08E]/50 hover:bg-[#D2A08E]",
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
   SECTION 5: TIỆC CƯỚI, ĐẾM NGƯỢC & LỊCH NGÀY VUI (VỊ TRÍ NGÀY CƯỚI #2 - CALENDAR & COUNTDOWN)
   - Khung lịch tháng mảnh màu vàng hồng/rượu vang
   - Trái tim màu #6E2331 nhịp đập nhẹ đánh dấu ngày vui
   - Đồng hồ đếm ngược an toàn hydration
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
          className="text-xl font-bold tracking-widest uppercase text-[#6E2331] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Ngày Chung Đôi
        </h2>
        <p
          className="mt-1 text-xs text-[#8B525C]"
          style={{ fontFamily: BODY_FONT }}
        >
          Cùng đếm ngược từng khoảnh khắc thiêng liêng
        </p>

        {/* Khung Lịch Tháng */}
        <div className="relative mx-auto mt-8 max-w-sm rounded-2xl border border-[#D2A08E]/70 bg-[#FFFFFF] p-6 shadow-md">
          <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-dashed border-[#D2A08E]/30" />

          <p
            className="text-sm font-bold tracking-widest uppercase text-[#6E2331]"
            style={{ fontFamily: TITLE_FONT }}
          >
            Tháng {month} · {year}
          </p>

          {/* Các thứ trong tuần */}
          <div className="mt-4 grid grid-cols-7 gap-1 text-[11px] font-semibold text-[#8B525C]">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span className="text-[#6E2331]">CN</span>
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
                      className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#6E2331] font-bold text-[#FDF9F9] shadow-md"
                      animate={
                        reduce
                          ? {}
                          : {
                            scale: [1, 1.1, 1],
                          }
                      }
                      transition={{
                        duration: 2.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <span>{d}</span>
                      <Heart className="absolute -top-1 -right-1 h-3 w-3 fill-[#D2A08E] text-[#D2A08E]" />
                    </m.div>
                  ) : (
                    <span className="text-[#4D1520]">{d}</span>
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
              className="flex flex-col items-center justify-center rounded-xl border border-[#D2A08E]/60 bg-[#FFFFFF] py-3 shadow-sm"
            >
              <span
                className="text-xl font-bold text-[#6E2331] sm:text-2xl"
                style={{ fontFamily: TITLE_FONT }}
              >
                {String(item.val).padStart(2, "0")}
              </span>
              <span
                className="mt-0.5 text-[10px] font-medium tracking-wider uppercase text-[#8B525C]"
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
   SECTION 6: DRESS CODE & LỊCH TRÌNH NGÀY CƯỚI (TIMELINE & DRESS CODE)
   - "Sợi Tơ Vàng Hồng": Trục dọc mảnh màu vàng hồng #D2A08E tự vẽ từ trên xuống
   - Chấm tròn màu rượu vang #6E2331 viền ngọc trai căn đồng trục
   - 3 vòng tròn Dress Code động có viền trắng ngọc trai & bóng dịu
   ============================================================ */
function TimelineSection({ data }: { data: TemplateData }) {
  const timeline = getTimeline(data);
  const dressColors = getDressColors(data);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#6E2331] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Lịch Trình Hôn Lễ
        </h2>
        <p
          className="mt-1 text-xs text-[#8B525C]"
          style={{ fontFamily: BODY_FONT }}
        >
          Các mốc thời gian trong ngày trọng đại
        </p>

        {/* Danh sách mốc sự kiện */}
        <div className="relative mx-auto mt-10 max-w-md">
          {/* Đường trục "Sợi Tơ Vàng Hồng" */}
          <m.div
            className="absolute top-4 bottom-4 left-[31px] w-px origin-top bg-gradient-to-b from-[#D2A08E] via-[#6E2331]/40 to-[#D2A08E]"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: EASE_PARIS }}
          />

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
                {/* Điểm mốc hình tròn màu rượu vang viền ngọc trai */}
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-[#D2A08E] bg-[#FFFFFF] shadow-sm">
                  <div className="text-center">
                    <span
                      className="text-xs font-bold text-[#6E2331]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {item.time}
                    </span>
                  </div>
                </div>

                {/* Nội dung hoạt động */}
                <div className="flex-1 rounded-2xl border border-[#D2A08E]/50 bg-[#FFFFFF] p-3.5 shadow-sm">
                  <p
                    className="text-xs font-medium text-[#4D1520] sm:text-sm"
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
        <div className="mx-auto mt-14 max-w-sm rounded-2xl border border-[#D2A08E]/60 bg-[#FFFFFF] p-6 shadow-md">
          <p
            className="text-xs font-semibold tracking-widest uppercase text-[#6E2331]"
            style={{ fontFamily: BODY_FONT }}
          >
            Trang Phục Gợi Ý (Dress Code)
          </p>
          <p className="mt-1 text-xs text-[#8B525C]">
            Kính mời quý khách lựa chọn trang phục theo bảng màu hôn lễ
          </p>

          <div className="mt-5 flex items-center justify-center gap-4 sm:gap-6">
            {dressColors.map((color, idx) => (
              <div
                key={idx}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-[#FFFFFF] shadow-md transition-transform hover:scale-110"
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
   SECTION 7: HỘP QUÀ TRÒN NHUNG HỒNG RƯỢU VANG (GIFT)
   - Preload đủ gift-normal.webp, gift-hover.webp, gift-active.webp
   - Hover tỏa ánh vàng hồng, click mở nắp hatbox mượt mà
   - Mở GiftModal qua createPortal (tone obsidian/rượu vang)
   - Chặn VietQR tự động ở gói Free
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
        return "/templates/diem-phan-kim-to/gift-hover.webp";
      case "active":
        return "/templates/diem-phan-kim-to/gift-active.webp";
      default:
        return "/templates/diem-phan-kim-to/gift-normal.webp";
    }
  };

  const handleOpenGiftModal = () => {
    setGiftState("active");
    setGiftModalOpen(true);
  };

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-3 flex justify-center">
          <img
            src="/templates/diem-phan-kim-to/divider-silk.webp"
            alt=""
            className="h-auto w-32 object-contain opacity-85"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#6E2331] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Hộp Mừng Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#8B525C]"
          style={{ fontFamily: BODY_FONT }}
        >
          Món quà chúc phúc ý nghĩa gửi trao ngày chung đôi
        </p>

        {/* Hộp quà tròn nhung hồng rượu vang 3 trạng thái */}
        <div className="mt-8 flex flex-col items-center">
          <m.div
            className="group relative cursor-pointer"
            onClick={handleOpenGiftModal}
            onMouseEnter={() => setGiftState("hover")}
            onMouseLeave={() => setGiftState("normal")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Quầng hào quang vàng hồng dịu dưới hộp */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(210,160,142,0.35) 0%, rgba(247,232,234,0.15) 55%, transparent 75%)",
                filter: "blur(18px)",
              }}
            />
            <img
              src={getGiftBoxImg()}
              alt="Hộp Quà Tròn Nhung Hồng Rượu Vang"
              className="relative z-10 h-auto w-40 object-contain drop-shadow-xl sm:w-48"
            />
          </m.div>

          <button
            onClick={handleOpenGiftModal}
            className="mt-5 rounded-full border border-[#D2A08E] bg-[#6E2331] px-6 py-2.5 text-xs font-semibold tracking-widest uppercase text-[#FDF9F9] shadow-md transition-all hover:bg-[#852C3D] hover:shadow-[0_0_15px_rgba(210,160,142,0.35)] active:scale-95"
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
   MAIN TEMPLATE: DIỄM PHẤN KIM TƠ
   - Điều khiển mở thiệp 2 chiều (isOpened <-> parentOpenedRef)
   - Khóa cuộn container khi !coverGone
   - Section order & hidden sections tuân thủ cấu hình
   - Footer tách rời ngoài container order
   ============================================================ */
export function DiemPhanKimToTemplate({
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
        "relative w-full bg-[#F7E8EA] text-[#4D1520] selection:bg-[#D2A08E]/25",
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
        title={data.music?.title || "Khúc Ca Phấn Lụa"}
        visible={openState}
        tone="obsidian"
      />
      )}

      {/* --------------------------------------------------------
          LỚP 3: RUỘT THIỆP CƯỚI CHÍNH (Ẩn khi chưa mở thiệp)
          - Cột thẻ Lụa Phấn Sứ max-w-[840px]
          -------------------------------------------------------- */}
      <main
        className={cn(
          "relative z-10 transition-opacity duration-700",
          !openState ? "hidden opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {/* Nền cố định phía sau ruột thiệp */}
        <div
          className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: "url('/templates/diem-phan-kim-to/background.webp')" }}
        />

        {/* Khung nội dung trung tâm: Cột thẻ Lụa Phấn Sứ max-w-[840px] */}
        <div className="relative mx-auto my-6 w-full max-w-[840px] rounded-3xl border border-[#D2A08E]/50 bg-[#FDF9F9] shadow-2xl">
          {/* Section 1: Hero — Cameo Hồng Phấn (luôn ở đầu thẻ) */}
          <div className="rounded-t-3xl bg-[#FDF9F9]">
            <HeroSection data={data} />
          </div>

          {/* Container các section động theo orderOf và hiddenSections */}
          <div className="flex flex-col bg-[#FDF9F9]">
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
                <section className="relative overflow-hidden rounded-b-3xl bg-[#F7E8EA] px-4 py-16 text-[#4D1520] md:py-24">
                  <div
                    className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: "url('/templates/diem-phan-kim-to/background-mobile.webp')" }}
                  />
                  <RosePetalsFalling count={14} />

                  <div className="relative z-10 mx-auto max-w-xl">
                    <TemplateRsvpSection
                      data={data}
                      mode={mode}
                      tone="sunset"
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
                          accentColor="#6E2331"
                          textColor="#4D1520"
                          mutedColor="#D2A08E"
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
        <footer className="border-t border-[#D2A08E]/30 bg-[#F7E8EA] px-4 py-12 text-center text-xs text-[#8B525C]">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
            <img
              src="/templates/diem-phan-kim-to/divider-silk.webp"
              alt=""
              className="h-auto w-24 object-contain opacity-75"
              aria-hidden="true"
            />
            <p className="tracking-widest uppercase text-[#6E2331]">
              {data.couple?.groomName ?? "Chú Rể"} &amp; {data.couple?.brideName ?? "Cô Dâu"}
            </p>
            <p className="text-[11px] text-[#8B525C]/80">
              Cảm ơn quý khách đã gửi trọn yêu thương và chung vui cùng chúng tôi
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default DiemPhanKimToTemplate;
