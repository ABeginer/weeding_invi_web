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
   BẢNG MÀU CHÍNH THỨC: PHỈ THÚY ĐÔNG DƯƠNG (phi-thuy-dong-duong)
   - Xanh Phỉ Thúy Sâu (Imperial Jade Emerald — Nền bìa & Khối kiến trúc): #0F2A1F (sâu #091B13, nhấn #183D2D)
   - Đồng Thau Cổ (Brushed Indochine Brass — Khung cửa, kỷ hà, huy hiệu Song Hỷ, chỉ nhấn): #C9A45C (sáng #E6C98B, trầm #967538)
   - Kem Bơ Indochine (Warm Limestone Cream — Nền ruột thiệp & Thẻ sáng): #FBF6EC (thẻ nổi #FFFFFF, nền ấm #F2E9D8)
   - Chữ chính trên nền kem bơ: #122D22 (tiêu đề) / #3D5247 (nội dung, tương phản cao)
   - Chữ trên nền tối #0F2A1F: #FBF6EC / #E6C98B
   - Dress Code mặc định: #6D825D (Xanh ô-liu), #E9ECEB (Trắng ngọc trai), #DFD3BE (Kem cát ấm)
   ============================================================ */

const JADE_EMERALD = "#0F2A1F";
const JADE_DEEP = "#091B13";
const JADE_ACCENT = "#183D2D";

const BRASS_VINTAGE = "#C9A45C";
const BRASS_LIGHT = "#E6C98B";
const BRASS_DEEP = "#967538";
const BRASS_BORDER = "rgba(201, 164, 92, 0.55)";
const BRASS_SUBTLE = "rgba(201, 164, 92, 0.25)";

const LIMESTONE_CREAM = "#FBF6EC";
const LIMESTONE_WARM = "#F2E9D8";
const CARD_WHITE = "#FFFFFF";

const TEXT_DARK_TITLE = "#122D22";
const TEXT_DARK_BODY = "#3D5247";
const TEXT_DARK_MUTED = "#5A7366";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_INDOCHINE = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "17:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm tại tiền sảnh Đông Dương" },
  { time: "18:30", label: "Nghi lễ Khải Môn kết duyên & Trao hẹn ước sắt son trăm năm" },
  { time: "19:00", label: "Khai tiệc mừng uyên ương phỉ thúy & Nâng ly chúc phúc" },
  { time: "20:00", label: "Vũ khúc Đông Dương & Những bản tình ca lãng mạn" },
  { time: "21:00", label: "Tiễn khách & Trao quà cảm tạ tri ân" },
];

const DEFAULT_DRESS = ["#6D825D", "#E9ECEB", "#DFD3BE"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Bụi Vàng Đồng Thau & Ánh Ngọc Phỉ Thúy
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function BrassMotesFalling({ count = 16 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 17) % 94 + 3}%`,
      size: (idx % 3) + 2.5,
      duration: 8 + (idx % 4) * 2,
      delay: (idx * 0.5) % 4,
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
              ? "radial-gradient(circle, #E6C98B 0%, rgba(201,164,92,0.4) 70%, transparent 100%)"
              : "radial-gradient(circle, #FBF6EC 0%, rgba(230,201,139,0.3) 60%, transparent 100%)",
            boxShadow: "0 0 5px 1px rgba(230,201,139,0.45)",
          }}
          animate={{
            y: [-10, -p.yOffset * 3.5, -p.yOffset * 7],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * (8 + (p.id % 10)), 0],
            opacity: [0, 0.85, 0],
            scale: [0.7, 1.2, 0.6],
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
   MÀN HÌNH BÌA: KHẢI MÔN ĐÔNG DƯƠNG (ENVELOPE COVER)
   - Cấu trúc Cửa Chớp Đôi (Double Shutter Doors) xanh phỉ thúy
   - Trục giữa khép bằng chỉ đồng thau mảnh
   - Huy hiệu bát giác Song Hỷ emblem-songhy.webp làm chốt khóa
   - Animation mở bìa "Khải Môn Tách Cánh" trượt đối xứng sang 2 bên
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
      style={{ backgroundColor: JADE_DEEP }}
    >
      {/* Nền sơn mài xanh phỉ thúy */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: "url('/templates/phi-thuy-dong-duong/background-mobile.webp')",
          opacity: 0.6,
          transform: openingStage ? "scale(1.08)" : "scale(1)",
        }}
      />

      {/* Quầng sáng ngọc bích trung tâm */}
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: "min(90vw, 520px)",
          height: "min(90vw, 520px)",
          background:
            "radial-gradient(circle, rgba(24,61,45,0.65) 0%, rgba(9,27,19,0.3) 60%, transparent 80%)",
          filter: "blur(35px)",
        }}
      />

      {/* Bụi vàng đồng thau bay nhẹ */}
      <BrassMotesFalling count={14} />

      {/* Cấu trúc Cửa Chớp Đôi (Double Shutter Doors) trượt tách sang 2 bên khi bấm mở thiệp (chỉ kích hoạt khi openingStage, nằm dưới thẻ z-20) */}
      {openingStage && (
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
          <m.div
            className="absolute inset-y-0 left-0 w-1/2 border-r border-[#C9A45C]/50 bg-[#0F2A1F]/95"
            initial={{ x: "0%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 0.75, ease: EASE_INDOCHINE }}
          />
          <m.div
            className="absolute inset-y-0 right-0 w-1/2 border-l border-[#C9A45C]/50 bg-[#0F2A1F]/95"
            initial={{ x: "0%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 0.75, ease: EASE_INDOCHINE }}
          />
        </div>
      )}

      {/* Khối Ấn Phẩm Biệt Thự Đông Dương Trung Tâm */}
      <m.div
        className={cn(
          "relative z-20 my-auto flex w-full max-w-sm flex-col items-center rounded-2xl p-6 text-center shadow-2xl transition-all",
          contained ? "py-5" : "py-8",
        )}
        style={{
          backgroundColor: JADE_EMERALD,
          boxShadow: "0 24px 60px -12px rgba(9, 27, 19, 0.9)",
        }}
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={
          openingStage
            ? { opacity: 0, scale: 0.92, y: -25 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{ duration: 0.65, ease: EASE_INDOCHINE }}
      >
        {/* Khung viền đôi kỷ hà đồng thau Art Deco */}
        <div className="pointer-events-none absolute inset-3 rounded-xl border border-[#C9A45C]/70">
          <div className="absolute inset-1 rounded-lg border border-dashed border-[#C9A45C]/35" />

          {/* Góc đồng thau Art Deco */}
          <img
            src="/templates/phi-thuy-dong-duong/corner-brass.webp"
            alt=""
            className="pointer-events-none absolute top-0 left-0 h-auto w-10 opacity-90 sm:w-12"
            aria-hidden="true"
          />
          <img
            src="/templates/phi-thuy-dong-duong/corner-brass.webp"
            alt=""
            className="pointer-events-none absolute top-0 right-0 h-auto w-10 -scale-x-100 opacity-90 sm:w-12"
            aria-hidden="true"
          />
        </div>

        {/* Huy hiệu bát giác Song Hỷ emblem-songhy.webp làm chốt khóa trung tâm */}
        <m.div
          className="relative mt-1 mb-2 flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={
            openingStage
              ? { scale: 1.15, rotate: 45, opacity: 0 }
              : { scale: 1, rotate: 0, opacity: 1 }
          }
          transition={{ duration: 0.7, ease: EASE_INDOCHINE }}
        >
          {/* Quầng sáng đồng thau ấm */}
          <div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(230,201,139,0.4) 0%, rgba(201,164,92,0.15) 60%, transparent 80%)",
              filter: "blur(8px)",
            }}
          />
          <img
            src="/templates/phi-thuy-dong-duong/emblem-songhy.webp"
            alt="Huy Hiệu Song Hỷ Bát Giác"
            className="relative z-10 h-full w-full object-contain drop-shadow-lg"
          />
        </m.div>

        {/* Phụ đề phong cách */}
        <p
          className="text-xs font-semibold tracking-[0.35em] uppercase text-[#C9A45C]"
          style={{ fontFamily: BODY_FONT }}
        >
          {data.ui?.eyebrow || "Kiến Trúc Đông Dương"}
        </p>

        {/* Tên cặp đôi 3 dòng chuẩn Art Deco (Groom / & / Bride) */}
        <div className="my-2.5 w-full px-2">
          <h1
            className="block text-2xl font-bold tracking-wide text-[#FBF6EC] break-words sm:text-3xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            {data.couple?.groomName || "Thế Vinh"}
          </h1>
          <div className="my-0.5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#C9A45C]/60" />
            <span
              className="text-lg font-normal italic text-[#C9A45C]"
              style={{ fontFamily: TITLE_FONT }}
            >
              &amp;
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#C9A45C]/60" />
          </div>
          <h1
            className="block text-2xl font-bold tracking-wide text-[#FBF6EC] break-words sm:text-3xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            {data.couple?.brideName || "Khánh Linh"}
          </h1>
        </div>

        {/* Dải phân cách kỷ hà đồng thau */}
        <div className="my-1.5 flex items-center justify-center">
          <img
            src="/templates/phi-thuy-dong-duong/divider-brass.webp"
            alt=""
            className="h-auto w-36 object-contain opacity-85 sm:w-40"
            aria-hidden="true"
          />
        </div>

        {/* Lời trân trọng kính mời */}
        <p
          className="mt-1 text-xs font-semibold tracking-[0.28em] uppercase text-[#C9A45C]"
          style={{ fontFamily: BODY_FONT }}
        >
          {data.ui?.invitePrefix || "Trân Trọng Kính Mời"}
        </p>

        {/* Tên khách mời trang trọng */}
        <div className="my-2 max-w-[270px] rounded-lg border border-[#C9A45C]/50 bg-[#091B13]/75 px-4 py-1.5 shadow-inner backdrop-blur-xs">
          <p
            className="truncate text-xs font-semibold tracking-wide text-[#FBF6EC]"
            style={{ fontFamily: BODY_FONT }}
          >
            {guestName || data.ui?.defaultGuestName || "Quý Khách Quý Mến"}
          </p>
        </div>

        {/* Ngày cưới tóm tắt trên bìa */}
        {dateParts && (
          <p
            className="mt-1 text-xs font-medium tracking-[0.2em] text-[#E6C98B]/90 uppercase"
            style={{ fontFamily: BODY_FONT }}
          >
            {dateParts.day} · {dateParts.month} · {dateParts.year}
          </p>
        )}

        {/* Nút bấm mở thiệp kiểu đồng thau cổ Art Deco */}
        <m.button
          onClick={handleOpenClick}
          disabled={openingStage}
          className="group relative mt-5 flex cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-md border border-[#E6C98B] bg-[#C9A45C] px-7 py-2.5 text-xs font-bold tracking-widest uppercase text-[#091B13] shadow-lg transition-all duration-300 hover:bg-[#E6C98B] hover:shadow-[0_0_18px_rgba(201,164,92,0.45)] active:scale-95"
          style={{ fontFamily: BODY_FONT }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Vệt sáng quét ngang nút */}
          <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#FFFFFF]/35 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
          <span>Mở Thiệp</span>
        </m.button>
      </m.div>
    </div>
  );
}

/* ============================================================
   SECTION 1: HERO — "CỬA VÒM PHỈ THÚY"
   - Đỉnh trang: dải kiến trúc xanh phỉ thúy #0F2A1F có corner-brass.webp
   - emblem-songhy.webp ở giữa kèm tên cặp đôi
   - Khung cửa vòm indochine-frame.webp ôm trọn ảnh uyên ương
   - Không lặp ngày cưới tại Hero
   ============================================================ */
function HeroSection({ data }: { data: TemplateData }) {
  const couple = data.couple;
  const heroPhoto = data.photos?.heroUrl || "/photos/hero2.webp";

  return (
    <section className="relative overflow-hidden pt-10 pb-16 text-center text-[#FBF6EC]">
      <BrassMotesFalling count={10} />

      {/* Dải kiến trúc đỉnh trang có 2 góc đồng thau đối xứng */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 h-16">
        <img
          src="/templates/phi-thuy-dong-duong/corner-brass.webp"
          alt=""
          className="absolute top-0 left-0 h-auto w-10 opacity-80 sm:w-12"
          aria-hidden="true"
        />
        <img
          src="/templates/phi-thuy-dong-duong/corner-brass.webp"
          alt=""
          className="absolute top-0 right-0 h-auto w-10 -scale-x-100 opacity-80 sm:w-12"
          aria-hidden="true"
        />
      </div>

      <div className="relative z-10 mx-auto max-w-xl px-4">
        {/* Huy hiệu Song Hỷ bát giác ở đỉnh Hero */}
        <div className="mb-2 flex justify-center">
          <img
            src="/templates/phi-thuy-dong-duong/emblem-songhy.webp"
            alt="Huy hiệu Song Hỷ"
            className="h-14 w-14 object-contain drop-shadow-md sm:h-16 sm:w-16"
          />
        </div>

        {/* Phụ đề phong cách */}
        <p
          className="text-xs font-semibold tracking-[0.35em] uppercase text-[#C9A45C]"
          style={{ fontFamily: BODY_FONT }}
        >
          {data.ui?.eyebrow || "Kiến Trúc Đông Dương"}
        </p>

        {/* Tên cặp đôi 3 dòng trang trọng */}
        <div className="my-4">
          <h2
            className="block text-3xl font-bold tracking-wide text-[#FBF6EC] break-words sm:text-4xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            {couple?.groomFullName || couple?.groomName || "Lâm Thế Vinh"}
          </h2>
          <div className="my-1 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#C9A45C]/60" />
            <span
              className="text-xl font-normal italic text-[#C9A45C]"
              style={{ fontFamily: TITLE_FONT }}
            >
              &amp;
            </span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#C9A45C]/60" />
          </div>
          <h2
            className="block text-3xl font-bold tracking-wide text-[#FBF6EC] break-words sm:text-4xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            {couple?.brideFullName || couple?.brideName || "Hoàng Khánh Linh"}
          </h2>
        </div>

        {/* Dải phân cách kỷ hà đồng thau */}
        <div className="my-3 flex justify-center">
          <img
            src="/templates/phi-thuy-dong-duong/divider-brass.webp"
            alt=""
            className="h-auto w-36 object-contain opacity-85"
            aria-hidden="true"
          />
        </div>

        {/* Khung cửa vòm Indochine indochine-frame.webp ôm ảnh uyên ương */}
        <m.div
          className="relative mx-auto mt-5 mb-2 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.85, ease: EASE_INDOCHINE }}
        >
          <div className="relative aspect-[3/4] w-64 sm:w-72 md:w-80">
            {/* Lớp ảnh cặp đôi bên dưới khung vòm */}
            <div className="absolute inset-2.5 overflow-hidden rounded-t-[120px] rounded-b-md bg-[#091B13] shadow-2xl">
              {heroPhoto ? (
                <img
                  src={heroPhoto}
                  alt="Ảnh cưới Uyên Ương"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-b from-[#183D2D] to-[#091B13] p-4 text-[#FBF6EC]">
                  <span
                    className="text-4xl font-light text-[#C9A45C]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    囍
                  </span>
                  <p className="mt-2 text-xs tracking-widest uppercase text-[#C9A45C]/80">
                    Phỉ Thúy Đông Dương
                  </p>
                </div>
              )}
            </div>

            {/* Khung cửa vòm kiến trúc đè lên viền ảnh */}
            <img
              src="/templates/phi-thuy-dong-duong/indochine-frame.webp"
              alt="Khung Cửa Kiến Trúc Đông Dương"
              className="pointer-events-none absolute inset-0 z-10 h-full w-full object-contain drop-shadow-[0_12px_32px_rgba(9,27,19,0.85)]"
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
            className="text-xs italic leading-relaxed text-[#FBF6EC]/85 sm:text-sm"
            style={{ fontFamily: BODY_FONT }}
          >
            &ldquo;Duyên trời định ngọc kết tơ đồng — Nguyện trọn đời cùng người xây đắp chốn bình yên.&rdquo;
          </p>
        </m.div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 2: THÔNG TIN HAI BÊN GIA ĐÌNH (FAMILY)
   - Thanh tiêu đề dạng bảng đồng thau mảnh trên nền kem bơ #FBF6EC
   - 2 cột gia đình cao bằng nhau (items-stretch, h-full flex flex-col)
   - Tự tách tên phụ huynh tại & thành 2 dòng sạch (lược bỏ &)
   - Font Playfair Display màu #122D22, groomTitle / brideTitle động
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

  const groomParents = formatParents(couple?.groomParents || "Ông Lâm Hoài Nam & Bà Đặng Ngọc Hà");
  const brideParents = formatParents(couple?.brideParents || "Ông Hoàng Quốc Tuấn & Bà Vũ Bích Trâm");

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-20">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-3 flex justify-center">
          <img
            src="/templates/phi-thuy-dong-duong/divider-brass.webp"
            alt=""
            className="h-auto w-32 object-contain opacity-85 sm:w-36"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#122D22] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Thông Tin Gia Đình
        </h2>
        <p
          className="mt-1 text-xs text-[#5A7366]"
          style={{ fontFamily: BODY_FONT }}
        >
          Trân trọng báo tin lễ thành hôn của con chúng tôi
        </p>

        {/* Lưới 2 nhà: Nhà Trai & Nhà Gái (Cao bằng nhau) */}
        <div className="mt-8 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
          {/* Nhà Trai */}
          <m.div
            className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-[#C9A45C]/60 bg-[#FFFFFF] p-6 text-center shadow-sm"
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Viền đôi thanh mảnh Art Deco */}
            <div className="pointer-events-none absolute inset-1.5 rounded-lg border border-[#C9A45C]/30" />

            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase text-[#C9A45C]"
                style={{ fontFamily: TITLE_FONT }}
              >
                Nhà Trai
              </span>
              <div className="my-3 space-y-1">
                {groomParents.map((name, i) => (
                  <p
                    key={i}
                    className="text-sm font-medium text-[#3D5247]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-[#C9A45C]/30 pt-4">
              <p
                className="text-xs text-[#5A7366]"
                style={{ fontFamily: BODY_FONT }}
              >
                {couple?.groomTitle || "Trưởng Nam"}
              </p>
              <p
                className="text-base font-bold text-[#122D22]"
                style={{ fontFamily: TITLE_FONT }}
              >
                {couple?.groomFullName || couple?.groomName || "Lâm Thế Vinh"}
              </p>
            </div>
          </m.div>

          {/* Nhà Gái */}
          <m.div
            className="relative flex h-full flex-col justify-between overflow-hidden rounded-xl border border-[#C9A45C]/60 bg-[#FFFFFF] p-6 text-center shadow-sm"
            initial={{ opacity: 0, x: 15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="pointer-events-none absolute inset-1.5 rounded-lg border border-[#C9A45C]/30" />

            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase text-[#C9A45C]"
                style={{ fontFamily: TITLE_FONT }}
              >
                Nhà Gái
              </span>
              <div className="my-3 space-y-1">
                {brideParents.map((name, i) => (
                  <p
                    key={i}
                    className="text-sm font-medium text-[#3D5247]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-[#C9A45C]/30 pt-4">
              <p
                className="text-xs text-[#5A7366]"
                style={{ fontFamily: BODY_FONT }}
              >
                {couple?.brideTitle || "Ái Nữ"}
              </p>
              <p
                className="text-base font-bold text-[#122D22]"
                style={{ fontFamily: TITLE_FONT }}
              >
                {couple?.brideFullName || couple?.brideName || "Hoàng Khánh Linh"}
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
   - Bố cục đối xứng chuẩn kiến trúc: THỨ | NGÀY | THÁNG
   - Âm lịch chuẩn không lặp chữ "ngày", ngăn cách bởi divider-brass.webp
   - Nút dẫn đường Google Maps nền #0F2A1F viền #C9A45C bo góc Art Deco
   ============================================================ */
function EventsSection({ data }: { data: TemplateData }) {
  const visibleEvents = getVisibleEvents(data);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className={`relative z-10 mx-auto text-center ${visibleEvents.length > 1 ? "max-w-4xl" : "max-w-xl"}`}>
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#122D22] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Sự Kiện Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#5A7366]"
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
                className="relative overflow-hidden rounded-xl border border-[#C9A45C]/70 bg-[#FFFFFF] p-6 text-center shadow-md"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
              >
                {/* Viền đôi thanh mảnh Art Deco */}
                <div className="pointer-events-none absolute inset-1.5 rounded-lg border border-[#C9A45C]/30" />

                {/* Tiêu đề sự kiện */}
                <span
                  className="inline-block rounded-md border border-[#C9A45C]/60 bg-[#FBF6EC] px-4 py-1 text-xs font-semibold tracking-widest uppercase text-[#122D22]"
                  style={{ fontFamily: BODY_FONT }}
                >
                  {evt.title || "Lễ Thành Hôn"}
                </span>

                {/* Huy hiệu thời gian & ngày tháng kiểu kiến trúc */}
                <div className="my-5 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase text-[#5A7366]">
                    <Clock className="h-3.5 w-3.5 text-[#C9A45C]" />
                    <span>{time || "10:00"}</span>
                    <span>•</span>
                    <span>{weekday || "Thứ Bảy"}</span>
                  </div>

                  {/* Cụm ngày lớn: THỨ | NGÀY | THÁNG */}
                  <div className="my-2.5 flex items-center justify-center gap-3">
                    <span className="text-3xl font-bold text-[#122D22] sm:text-4xl" style={{ fontFamily: TITLE_FONT }}>
                      {day || "20"}
                    </span>
                    <div className="text-left text-xs leading-tight text-[#5A7366]">
                      <p className="font-semibold uppercase text-[#122D22]">Tháng {month || "03"}</p>
                      <p>{year || "2027"}</p>
                    </div>
                  </div>

                  {cleanLunar && (
                    <p className="text-xs italic text-[#5A7366]">
                      (Tức ngày {cleanLunar})
                    </p>
                  )}
                </div>

                {/* Dải phân cách kỷ hà đồng thau */}
                <div className="my-2 flex justify-center">
                  <img
                    src="/templates/phi-thuy-dong-duong/divider-brass.webp"
                    alt=""
                    className="h-auto w-28 object-contain opacity-75"
                    aria-hidden="true"
                  />
                </div>

                {/* Địa điểm tổ chức */}
                <div className="my-3 border-t border-[#C9A45C]/30 pt-3">
                  <p
                    className="text-base font-bold text-[#122D22]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {evt.venueName || "Khách Sạn Hôtel des Arts Saigon — Mgallery"}
                  </p>
                  <p
                    className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-[#3D5247]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {evt.venueAddress || "76-78 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh"}
                  </p>
                </div>

                {/* Nút chỉ đường Google Maps */}
                <div className="mt-4 flex justify-center">
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-[#C9A45C] bg-[#0F2A1F] px-5 py-2 text-xs font-medium tracking-wide text-[#FBF6EC] shadow-sm transition-all hover:bg-[#183D2D] hover:shadow-md active:scale-95"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#C9A45C]" />
                    <span>Chỉ Đường Google Maps</span>
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
   SECTION 4: ALBUM ẢNH CƯỚI (GALLERY — "PHÒNG TRANH ĐÔNG DƯƠNG")
   - Nền xanh phỉ thúy trầm #0F2A1F
   - Mỗi ảnh lồng khung viền mỏng kem & đồng thau tạo chiều sâu
   - Nút < > hình vuông vát góc Art Deco
   - Gói Free: tối đa 5 ảnh (Pro/VIP tối đa 30)
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
    <section className="relative overflow-hidden bg-[#0F2A1F] px-4 py-16 text-[#FBF6EC] md:py-24">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url('/templates/phi-thuy-dong-duong/background-mobile.webp')" }}
      />
      <BrassMotesFalling count={12} />

      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-3 flex justify-center">
          <img
            src="/templates/phi-thuy-dong-duong/divider-brass.webp"
            alt=""
            className="h-auto w-32 object-contain opacity-85"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#FBF6EC] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Phòng Tranh Kỷ Niệm
        </h2>
        <p
          className="mt-1 text-xs text-[#E6C98B]/80"
          style={{ fontFamily: BODY_FONT }}
        >
          Những thước phim lưu giữ hành trình yêu thương
        </p>

        {/* Khung hiển thị Coverflow Phòng Tranh */}
        <div className="relative mx-auto mt-8 flex max-w-md items-center justify-center">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border-2 border-[#C9A45C] bg-[#091B13] p-2 shadow-[0_16px_36px_rgba(9,27,19,0.8)]">
            <div className="relative h-full w-full overflow-hidden rounded-lg">
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
            </div>

            {/* Nút lùi ảnh hình vuông Art Deco */}
            <button
              onClick={handlePrev}
              aria-label="Ảnh trước"
              className="absolute top-1/2 left-4 -translate-y-1/2 rounded-md border border-[#C9A45C] bg-[#091B13]/85 p-2 text-[#E6C98B] backdrop-blur-xs shadow-md transition-transform hover:scale-110 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Nút tiến ảnh hình vuông Art Deco */}
            <button
              onClick={handleNext}
              aria-label="Ảnh sau"
              className="absolute top-1/2 right-4 -translate-y-1/2 rounded-md border border-[#C9A45C] bg-[#091B13]/85 p-2 text-[#E6C98B] backdrop-blur-xs shadow-md transition-transform hover:scale-110 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* Chỉ số ảnh hiện tại */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md border border-[#C9A45C]/50 bg-[#091B13]/90 px-3 py-1 text-[11px] font-medium tracking-widest text-[#E6C98B] backdrop-blur-xs shadow-xs">
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
                  ? "w-6 bg-[#C9A45C]"
                  : "w-1.5 bg-[#C9A45C]/40 hover:bg-[#C9A45C]",
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
   - Khung lịch tháng tối giản trên nền kem bơ
   - Điểm nhấn hình thoi xanh phỉ thúy #0F2A1F viền đồng thau nhịp đập nhẹ
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
          className="text-xl font-bold tracking-widest uppercase text-[#122D22] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Ngày Chung Đôi
        </h2>
        <p
          className="mt-1 text-xs text-[#5A7366]"
          style={{ fontFamily: BODY_FONT }}
        >
          Cùng đếm ngược từng khoảnh khắc thiêng liêng
        </p>

        {/* Khung Lịch Tháng */}
        <div className="relative mx-auto mt-8 max-w-sm rounded-xl border border-[#C9A45C]/70 bg-[#FFFFFF] p-6 shadow-md">
          <div className="pointer-events-none absolute inset-1.5 rounded-lg border border-[#C9A45C]/30" />

          <p
            className="text-sm font-bold tracking-widest uppercase text-[#122D22]"
            style={{ fontFamily: TITLE_FONT }}
          >
            Tháng {month} · {year}
          </p>

          {/* Các thứ trong tuần */}
          <div className="mt-4 grid grid-cols-7 gap-1 text-[11px] font-semibold text-[#5A7366]">
            <span>T2</span>
            <span>T3</span>
            <span>T4</span>
            <span>T5</span>
            <span>T6</span>
            <span>T7</span>
            <span className="text-[#C9A45C]">CN</span>
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
                      className="relative flex h-8 w-8 items-center justify-center rounded-md bg-[#0F2A1F] font-bold text-[#FBF6EC] border border-[#C9A45C] shadow-md"
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
                      <Heart className="absolute -top-1 -right-1 h-3 w-3 fill-[#C9A45C] text-[#C9A45C]" />
                    </m.div>
                  ) : (
                    <span className="text-[#3D5247]">{d}</span>
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
              className="flex flex-col items-center justify-center rounded-lg border border-[#C9A45C]/60 bg-[#FFFFFF] py-3 shadow-sm"
            >
              <span
                className="text-xl font-bold text-[#122D22] sm:text-2xl"
                style={{ fontFamily: TITLE_FONT }}
              >
                {String(item.val).padStart(2, "0")}
              </span>
              <span
                className="mt-0.5 text-[10px] font-medium tracking-wider uppercase text-[#5A7366]"
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
   SECTION 6: DRESS CODE & LỊCH TRÌNH NGÀY CƯỚI (TIMELINE & DRESS CODE — "HÀNH LANG KIẾN TRÚC")
   - Trục dọc mảnh màu đồng thau #C9A45C tự vẽ từ trên xuống
   - Các mốc thời gian gắn hình thoi ngọc phỉ thúy #0F2A1F viền đồng thau
   - 3 ô màu Dress Code động viền đồng thau
   ============================================================ */
function TimelineSection({ data }: { data: TemplateData }) {
  const timeline = getTimeline(data);
  const dressColors = getDressColors(data);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#122D22] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Lịch Trình Hôn Lễ
        </h2>
        <p
          className="mt-1 text-xs text-[#5A7366]"
          style={{ fontFamily: BODY_FONT }}
        >
          Các mốc thời gian trong ngày trọng đại
        </p>

        {/* Danh sách mốc sự kiện */}
        <div className="relative mx-auto mt-10 max-w-md">
          {/* Đường trục "Hành Lang Kiến Trúc" đồng thau */}
          <m.div
            className="absolute top-4 bottom-4 left-[31px] w-px origin-top bg-gradient-to-b from-[#C9A45C] via-[#0F2A1F]/40 to-[#C9A45C]"
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: EASE_INDOCHINE }}
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
                {/* Điểm mốc hình thoi Art Deco xoay 45° */}
                <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-[#C9A45C] bg-[#FFFFFF] shadow-sm">
                  <div className="text-center">
                    <span
                      className="text-xs font-bold text-[#122D22]"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {item.time}
                    </span>
                  </div>
                </div>

                {/* Nội dung hoạt động */}
                <div className="flex-1 rounded-lg border border-[#C9A45C]/50 bg-[#FFFFFF] p-3.5 shadow-sm">
                  <p
                    className="text-xs font-medium text-[#3D5247] sm:text-sm"
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
        <div className="mx-auto mt-14 max-w-sm rounded-xl border border-[#C9A45C]/60 bg-[#FFFFFF] p-6 shadow-md">
          <p
            className="text-xs font-semibold tracking-widest uppercase text-[#122D22]"
            style={{ fontFamily: BODY_FONT }}
          >
            Trang Phục Gợi Ý (Dress Code)
          </p>
          <p className="mt-1 text-xs text-[#5A7366]">
            Kính mời quý khách lựa chọn trang phục theo bảng màu hôn lễ
          </p>

          <div className="mt-5 flex items-center justify-center gap-4 sm:gap-6">
            {dressColors.map((color, idx) => (
              <div
                key={idx}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-md border border-[#C9A45C] shadow-md transition-transform hover:scale-110"
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
   SECTION 7: RƯƠNG SÍNH LỄ ĐÔNG DƯƠNG (GIFT)
   - Preload đủ gift-normal.webp, gift-hover.webp, gift-active.webp
   - Hover tỏa ánh đồng thau ấm, click bật nắp rương mượt mà
   - Mở GiftModal qua createPortal (tone obsidian/phỉ thúy)
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
        return "/templates/phi-thuy-dong-duong/gift-hover.webp";
      case "active":
        return "/templates/phi-thuy-dong-duong/gift-active.webp";
      default:
        return "/templates/phi-thuy-dong-duong/gift-normal.webp";
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
            src="/templates/phi-thuy-dong-duong/divider-brass.webp"
            alt=""
            className="h-auto w-32 object-contain opacity-85"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#122D22] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Hộp Mừng Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#5A7366]"
          style={{ fontFamily: BODY_FONT }}
        >
          Món quà chúc phúc ý nghĩa gửi trao ngày chung đôi
        </p>

        {/* Rương sính lễ Đông Dương 3 trạng thái */}
        <div className="mt-8 flex flex-col items-center">
          <m.div
            className="group relative cursor-pointer"
            onClick={handleOpenGiftModal}
            onMouseEnter={() => setGiftState("hover")}
            onMouseLeave={() => setGiftState("normal")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Quầng hào quang đồng thau ấm */}
            <div
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(201,164,92,0.35) 0%, rgba(24,61,45,0.15) 55%, transparent 75%)",
                filter: "blur(18px)",
              }}
            />
            <img
              src={getGiftBoxImg()}
              alt="Rương Sính Lễ Đông Dương"
              className="relative z-10 h-auto w-40 object-contain drop-shadow-xl sm:w-48"
            />
          </m.div>

          <button
            onClick={handleOpenGiftModal}
            className="mt-5 rounded-md border border-[#E6C98B] bg-[#0F2A1F] px-6 py-2.5 text-xs font-bold tracking-widest uppercase text-[#FBF6EC] shadow-md transition-all hover:bg-[#183D2D] hover:shadow-[0_0_15px_rgba(201,164,92,0.35)] active:scale-95"
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
   MAIN TEMPLATE: PHỈ THÚY ĐÔNG DƯƠNG
   - Điều khiển mở thiệp 2 chiều (isOpened <-> parentOpenedRef)
   - Khóa cuộn container khi !coverGone
   - Section order & hidden sections tuân thủ cấu hình
   - Footer tách rời ngoài container order
   ============================================================ */
export function PhiThuyDongDuongTemplate({
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
        "relative w-full bg-[#091B13] text-[#3D5247] selection:bg-[#C9A45C]/25",
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
      <LiveMusicFloatingButton
        src={data.music?.src}
        title={data.music?.title || "Khúc Ca Đông Dương"}
        visible={openState}
        tone="obsidian"
      />

      {/* --------------------------------------------------------
          LỚP 3: RUỘT THIỆP CƯỚI CHÍNH (Ẩn khi chưa mở thiệp)
          - Cột thẻ Biệt Thự Indochine max-w-[840px]
          -------------------------------------------------------- */}
      <main
        className={cn(
          "relative z-10 transition-opacity duration-700",
          !openState ? "hidden opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {/* Nền cố định phía sau ruột thiệp */}
        <div
          className="pointer-events-none fixed inset-0 bg-cover bg-center opacity-35"
          style={{ backgroundImage: "url('/templates/phi-thuy-dong-duong/background.webp')" }}
        />

        {/* Khung nội dung trung tâm: Cột thẻ Biệt Thự Indochine max-w-[840px] */}
        <div className="relative mx-auto my-6 w-full max-w-[840px] rounded-2xl border border-[#C9A45C]/50 bg-[#FBF6EC] shadow-2xl">
          {/* Section 1: Hero — Cửa Vòm Phỉ Thúy (luôn ở đầu thẻ) */}
          <div className="rounded-t-2xl bg-[#0F2A1F]">
            <HeroSection data={data} />
          </div>

          {/* Container các section động theo orderOf và hiddenSections */}
          <div className="flex flex-col bg-[#FBF6EC]">
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
                <section className="relative overflow-hidden rounded-b-2xl bg-[#091B13] px-4 py-16 text-[#FBF6EC] md:py-24">
                  <div
                    className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
                    style={{ backgroundImage: "url('/templates/phi-thuy-dong-duong/background-mobile.webp')" }}
                  />
                  <BrassMotesFalling count={14} />

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
                          accentColor="#0F2A1F"
                          textColor="#FBF6EC"
                          mutedColor="#C9A45C"
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
        <footer className="border-t border-[#C9A45C]/30 bg-[#091B13] px-4 py-12 text-center text-xs text-[#FBF6EC]/75">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
            <img
              src="/templates/phi-thuy-dong-duong/divider-brass.webp"
              alt=""
              className="h-auto w-24 object-contain opacity-75"
              aria-hidden="true"
            />
            <p className="tracking-widest uppercase text-[#C9A45C]">
              {data.couple?.groomName ?? "Chú Rể"} &amp; {data.couple?.brideName ?? "Cô Dâu"}
            </p>
            <p className="text-[11px] text-[#FBF6EC]/60">
              Cảm ơn quý khách đã gửi trọn yêu thương và chung vui cùng chúng tôi
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default PhiThuyDongDuongTemplate;
