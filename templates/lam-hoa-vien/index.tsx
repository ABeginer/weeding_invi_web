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
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: LAM HOA VIÊN — THANH NHÃ & QUÝ PHÁI
   - Xanh lam quý phái (Aristocratic Blue - Bìa & Nhấn): #1E3557 (sâu #14243D, nút #27446E)
   - Trắng sứ / Kem lạnh (Porcelain Ivory - Ruột thiệp): #F9FAFC (thẻ trắng #FFFFFF, nền phụ #EBF1F7)
   - Vàng champagne nhạt (Pale Gold Accent): #C9B182 (sáng #E8DCB8)
   - Chữ chính trên nền sáng: #1E3557 / #4A5D75
   ============================================================ */

const ARISTOCRATIC_BLUE = "#1E3557";
const BLUE_DARK = "#14243D";
const BLUE_BUTTON = "#27446E";
const BLUE_MUTED = "#4A5D75";
const BLUE_SOFT = "#EBF1F7";

const PORCELAIN_IVORY = "#F9FAFC";
const IVORY_CARD = "#FFFFFF";

const GOLD_PALE = "#C9B182";
const GOLD_LIGHT = "#E8DCB8";
const GOLD_BORDER = "rgba(201, 177, 130, 0.45)";
const GOLD_SOFT = "rgba(201, 177, 130, 0.25)";

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

const DEFAULT_DRESS = ["#1E3557", "#A8C0DB", "#F9FAFC"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Bụi Sáng & Cánh Hoa Cẩm Tú Cầu Trôi Nhẹ
   ------------------------------------------------------------ */
function HydrangeaDustParticles({ count = 16 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 19) % 94 + 3}%`,
      size: (idx % 3) + 2,
      duration: 7 + (idx % 4) * 2,
      delay: (idx * 0.5) % 4,
      yOffset: 25 + (idx % 4) * 20,
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
            background: "radial-gradient(circle, #FFFFFF 20%, #C9B182 70%, transparent 100%)",
            boxShadow: "0 0 6px 1px rgba(201, 177, 130, 0.6)",
          }}
          animate={{
            y: [0, -420 - p.yOffset],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * 18, 0],
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
   - Thẻ trắng sứ ở giữa (my-auto) viền chỉ vàng champagne
   - 4 góc hoa cẩm tú cầu corner-tl.webp đối xứng bằng CSS
   - Con dấu sáp vàng wax-seal.webp
   ============================================================ */
interface EnvelopeCoverProps {
  data: TemplateData;
  guestName?: string | null;
  contained: boolean;
  onOpen: () => void;
}

function EnvelopeCover({ data, guestName, contained, onOpen }: EnvelopeCoverProps) {
  const reduce = useReducedMotion();
  const [openingStage, setOpeningStage] = React.useState(false);

  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const dateParts = targetEvent?.startsAt
    ? formatWeddingDateParts(targetEvent.startsAt)
    : (data.date ? formatWeddingDateParts(data.date) : { weekday: "Chủ Nhật", dotDate: "26.10.2025" });

  const lunarText = targetEvent?.lunarDate
    ? formatLunarDateClean(targetEvent.lunarDate)
    : "13 tháng 02 năm Đinh Mùi";

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
        background: `radial-gradient(circle at 50% 45%, #24406B 0%, ${ARISTOCRATIC_BLUE} 60%, ${BLUE_DARK} 100%)`,
      }}
    >
      {/* Background Texture Mobile */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
        style={{ backgroundImage: "url('/templates/cam-tu-cau-xanh/background-mobile.webp')" }}
      />

      <HydrangeaDustParticles count={16} />

      {/* Thẻ Trắng Sứ Trung Tâm (Porcelain Ivory Card) */}
      <m.div
        className={cn(
          "relative z-10 my-auto flex w-full max-w-sm flex-col items-center rounded-2xl p-6 text-center shadow-2xl transition-all",
          contained ? "py-5" : "py-8",
        )}
        style={{
          backgroundColor: PORCELAIN_IVORY,
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45)",
        }}
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={
          openingStage
            ? { opacity: 0, scale: 0.92, y: -20 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{ duration: 0.6, ease: EASE_EDITORIAL }}
      >
        {/* Khung viền chỉ vàng champagne đôi & 4 góc hoa cẩm tú cầu ôm sát */}
        <div className="pointer-events-none absolute inset-3 rounded-xl border border-[#C9B182]/50">
          <div className="absolute inset-1 rounded-lg border border-[#C9B182]/25" />

          {/* 4 Góc hoa cẩm tú cầu duy nhất từ corner-tl.webp dùng CSS transforms */}
          <img
            src="/templates/cam-tu-cau-xanh/corner-tl.webp"
            alt=""
            className="pointer-events-none absolute left-0 top-0 h-auto w-11 opacity-85 sm:w-13"
            aria-hidden="true"
          />
          <img
            src="/templates/cam-tu-cau-xanh/corner-tl.webp"
            alt=""
            className="pointer-events-none absolute right-0 top-0 h-auto w-11 -scale-x-100 opacity-85 sm:w-13"
            aria-hidden="true"
          />
          <img
            src="/templates/cam-tu-cau-xanh/corner-tl.webp"
            alt=""
            className="pointer-events-none absolute bottom-0 left-0 h-auto w-11 -scale-y-100 opacity-85 sm:w-13"
            aria-hidden="true"
          />
          <img
            src="/templates/cam-tu-cau-xanh/corner-tl.webp"
            alt=""
            className="pointer-events-none absolute bottom-0 right-0 h-auto w-11 -scale-100 opacity-85 sm:w-13"
            aria-hidden="true"
          />
        </div>

        {/* Con dấu sáp vàng hoàng gia (Wax Seal) */}
        <m.div
          className="relative my-1 flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: EASE_EDITORIAL }}
        >
          {/* Quầng sáng thở vàng champagne */}
          <m.div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(201,177,130,0.4) 0%, rgba(201,177,130,0.06) 65%, transparent 80%)",
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
            src="/templates/cam-tu-cau-xanh/wax-seal.webp"
            alt="Con dấu sáp Lam Hoa Viên"
            className="relative z-10 h-full w-full object-contain drop-shadow-md"
          />
        </m.div>

        {/* Lời trân trọng kính mời */}
        <p
          className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#4A5D75]"
          style={{ fontFamily: BODY_FONT }}
        >
          {data.ui?.invitePrefix || "Trân Trọng Kính Mời"}
        </p>

        {/* Tên khách mời cá nhân hóa */}
        {guestName && guestName.trim().length > 0 ? (
          <div
            className="my-2 rounded-full px-4 py-1"
            style={{
              backgroundColor: BLUE_SOFT,
              border: `1px solid ${GOLD_BORDER}`,
            }}
          >
            <span
              className="text-xs font-semibold tracking-wider text-[#1E3557]"
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
            className="text-2xl font-bold tracking-wide text-[#1E3557] sm:text-3xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.groomName ?? "Quang Huy"}
          </span>
          <span
            className="my-0.5 text-lg font-normal italic text-[#C9B182] sm:text-xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            &amp;
          </span>
          <span
            className="text-2xl font-bold tracking-wide text-[#1E3557] sm:text-3xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.brideName ?? "Thanh Trúc"}
          </span>
        </div>

        {/* Dải hoa cẩm tú cầu phân cách */}
        <div className="my-2 flex w-full justify-center">
          <img
            src="/templates/cam-tu-cau-xanh/divider-floral.webp"
            alt=""
            className="h-auto w-44 object-contain opacity-90 sm:w-52"
            aria-hidden="true"
          />
        </div>

        {/* Ngày cưới & Ngày âm lịch */}
        <div className="my-2 flex flex-col items-center gap-1">
          <p
            className="text-xs font-bold tracking-[0.25em] uppercase text-[#1E3557] sm:text-sm"
            style={{ fontFamily: TITLE_FONT }}
          >
            {dateParts.weekday} · {dateParts.dotDate}
          </p>
          <p
            className="text-[11px] tracking-wider text-[#6B7F99]"
            style={{ fontFamily: BODY_FONT }}
          >
            (Tức ngày {lunarText})
          </p>
        </div>

        {/* Nút Chạm để mở thiệp */}
        <m.button
          onClick={handleOpenClick}
          className="group relative mt-5 flex items-center justify-center overflow-hidden rounded-full px-7 py-2.5 shadow-md transition-all active:scale-95"
          style={{
            backgroundColor: ARISTOCRATIC_BLUE,
            border: `1.5px solid ${GOLD_PALE}`,
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Quét ánh kim nút */}
          <div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#C9B182]/25 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
            aria-hidden="true"
          />
          <span
            className="relative z-10 text-xs font-semibold tracking-[0.25em] text-[#F9FAFC] uppercase"
            style={{ fontFamily: BODY_FONT }}
          >
            Chạm để mở thiệp
          </span>
        </m.button>
      </m.div>
    </div>
  );
}

/* ============================================================
   SECTION 1: HERO SECTION — KHUNG VÒM HOA CẨM TÚ CẦU
   - arch-frame.webp ôm trọn ảnh đôi aspect-[3/4]
   - Tiêu đề nghệ thuật & Câu thơ mở đầu
   ============================================================ */
function HeroSection({ data, isOpened }: { data: TemplateData; isOpened: boolean }) {
  const heroPhotoUrl = data.photos?.heroUrl || "/photos/portrait_cr.webp";

  return (
    <section className="relative overflow-hidden bg-[#F9FAFC] px-4 pt-12 pb-16 text-center text-[#1E3557] md:pt-16 md:pb-24">
      {/* Background Decor */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-15"
        style={{ backgroundImage: "url('/templates/cam-tu-cau-xanh/background-mobile.webp')" }}
      />

      <div className="relative z-10 mx-auto max-w-lg">
        {/* Lời tựa mở đầu */}
        <m.p
          className="text-xs uppercase tracking-[0.35em] text-[#4A5D75]"
          style={{ fontFamily: BODY_FONT }}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {data.ui?.eyebrow || "The Wedding of"}
        </m.p>

        {/* Tên cặp đôi thanh lịch */}
        <m.div
          className="my-4 flex flex-col items-center"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <h1
            className="text-3xl font-bold tracking-tight text-[#1E3557] sm:text-4xl md:text-5xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.groomName ?? "Quang Huy"}
          </h1>
          <span
            className="my-1 text-xl italic text-[#C9B182] sm:text-2xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            &amp;
          </span>
          <h1
            className="text-3xl font-bold tracking-tight text-[#1E3557] sm:text-4xl md:text-5xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.brideName ?? "Thanh Trúc"}
          </h1>
        </m.div>

        {/* Khung Vòm Cẩm Tú Cầu (Arch Frame) bọc ảnh đôi */}
        <m.div
          className="relative mx-auto my-6 flex max-w-xs items-center justify-center sm:max-w-sm"
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.25, ease: EASE_EDITORIAL }}
        >
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-[140px] shadow-xl">
            {/* Ảnh cưới cặp đôi bên trong vòm */}
            <img
              src={heroPhotoUrl}
              alt="Ảnh cưới uyên ương"
              className="h-full w-full object-cover"
            />
            {/* Khung vòm nghệ thuật arch-frame.webp xếp lớp mặt trước */}
            <img
              src="/templates/cam-tu-cau-xanh/arch-frame.webp"
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full object-fill"
              aria-hidden="true"
            />
          </div>
        </m.div>

        {/* Câu trích dẫn tình yêu / Câu thơ cẩm tú cầu */}
        <m.div
          className="mx-auto mt-6 max-w-sm px-4"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.35 }}
        >
          <p
            className="text-xs italic leading-relaxed text-[#4A5D75] sm:text-sm"
            style={{ fontFamily: BODY_FONT }}
          >
            &ldquo;Cẩm tú cầu tượng trưng cho lòng biết ơn và sự gắn kết chân thành, nguyện cùng người đi qua ngàn mùa hoa.&rdquo;
          </p>
        </m.div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 2: THÔNG TIN HAI BÊN GIA ĐÌNH & THƯ MỜI
   - Hai họ tách tên phụ huynh theo &
   - Thẻ gia đình cao bằng nhau (items-stretch)
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

  const groomParents = formatParents(couple?.groomParents || "Ông Trần Văn Hùng & Bà Hoàng Thị Mai");
  const brideParents = formatParents(couple?.brideParents || "Ông Lê Quốc Tuấn & Bà Vũ Bích Ngọc");

  return (
    <section className="relative overflow-hidden bg-[#FFFFFF] px-4 py-16 text-[#1E3557] md:py-20">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-4 flex justify-center">
          <img
            src="/templates/cam-tu-cau-xanh/divider-floral.webp"
            alt=""
            className="h-auto w-36 object-contain opacity-85 sm:w-44"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest text-[#1E3557] uppercase sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Thông Tin Gia Đình
        </h2>
        <p
          className="mt-1 text-xs text-[#6B7F99]"
          style={{ fontFamily: BODY_FONT }}
        >
          Trân trọng thông báo tin hỷ đến toàn thể quý thân hữu
        </p>

        {/* Lưới 2 nhà: Nhà Trai & Nhà Gái (Cao bằng nhau) */}
        <div className="mt-8 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
          {/* Nhà Trai */}
          <m.div
            className="flex h-full flex-col justify-between rounded-xl border border-[#C9B182]/30 bg-[#F9FAFC] p-6 text-center shadow-sm"
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase text-[#C9B182]"
                style={{ fontFamily: TITLE_FONT }}
              >
                Nhà Trai
              </span>
              <div className="my-3 space-y-1">
                {groomParents.map((name, i) => (
                  <p
                    key={i}
                    className="text-sm font-medium text-[#1E3557]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-[#C9B182]/20 pt-4">
              <p
                className="text-xs text-[#6B7F99]"
                style={{ fontFamily: BODY_FONT }}
              >
                {couple?.groomTitle || "Tân Lang"}
              </p>
              <p
                className="text-base font-bold text-[#1E3557]"
                style={{ fontFamily: NAME_FONT }}
              >
                {couple?.groomFullName || couple?.groomName || "Trần Quang Huy"}
              </p>
            </div>
          </m.div>

          {/* Nhà Gái */}
          <m.div
            className="flex h-full flex-col justify-between rounded-xl border border-[#C9B182]/30 bg-[#F9FAFC] p-6 text-center shadow-sm"
            initial={{ opacity: 0, x: 15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase text-[#C9B182]"
                style={{ fontFamily: TITLE_FONT }}
              >
                Nhà Gái
              </span>
              <div className="my-3 space-y-1">
                {brideParents.map((name, i) => (
                  <p
                    key={i}
                    className="text-sm font-medium text-[#1E3557]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-[#C9B182]/20 pt-4">
              <p
                className="text-xs text-[#6B7F99]"
                style={{ fontFamily: BODY_FONT }}
              >
                {couple?.brideTitle || "Tân Nương"}
              </p>
              <p
                className="text-base font-bold text-[#1E3557]"
                style={{ fontFamily: NAME_FONT }}
              >
                {couple?.brideFullName || couple?.brideName || "Lê Thanh Trúc"}
              </p>
            </div>
          </m.div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 3: SỰ KIỆN CƯỚI & ĐỊA ĐIỂM (EVENTS)
   ============================================================ */
function EventsSection({ data }: { data: TemplateData }) {
  const visibleEvents = getVisibleEvents(data);

  return (
    <section className="relative overflow-hidden bg-[#F9FAFC] px-4 py-16 text-[#1E3557] md:py-24">
      <div className={`relative z-10 mx-auto text-center ${visibleEvents.length > 1 ? "max-w-4xl" : "max-w-xl"}`}>
        <h2
          className="text-xl font-bold tracking-widest text-[#1E3557] uppercase sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Sự Kiện Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#6B7F99]"
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
                className="relative overflow-hidden rounded-2xl border border-[#C9B182]/35 bg-[#FFFFFF] p-6 text-center shadow-sm md:p-8"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: idx * 0.15 }}
              >
                {/* Góc trang trí cẩm tú cầu */}
                <img
                  src="/templates/cam-tu-cau-xanh/corner-tl.webp"
                  alt=""
                  className="pointer-events-none absolute top-0 left-0 h-auto w-8 opacity-60"
                  aria-hidden="true"
                />
                <img
                  src="/templates/cam-tu-cau-xanh/corner-tl.webp"
                  alt=""
                  className="pointer-events-none absolute top-0 right-0 h-auto w-8 -scale-x-100 opacity-60"
                  aria-hidden="true"
                />

                <span
                  className="inline-block rounded-full bg-[#F9FAFC] px-4 py-1 text-xs font-semibold tracking-wider text-[#C9B182] uppercase"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  {evt.title}
                </span>

                {dateParts && (
                  <div className="my-4">
                    <p
                      className="text-base font-bold text-[#1E3557] sm:text-lg"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {dateParts.weekday} · {dateParts.dotDate}
                    </p>
                    {lunarStr && (
                      <p
                        className="text-xs text-[#6B7F99]"
                        style={{ fontFamily: BODY_FONT }}
                      >
                        (Tức ngày {lunarStr})
                      </p>
                    )}
                  </div>
                )}

                {/* Địa điểm */}
                <div className="my-4 space-y-1">
                  <p
                    className="text-base font-semibold text-[#1E3557]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {evt.venueName}
                  </p>
                  <p
                    className="text-xs text-[#4A5D75]"
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
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#1E3557] bg-[#1E3557] px-5 py-2 text-xs font-medium text-[#F9FAFC] transition-colors hover:bg-[#14243D]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#C9B182]" />
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
   ============================================================ */
function GallerySection({ data }: { data: TemplateData }) {
  const photos = data.photos?.gallery || [];
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  if (photos.length === 0) return null;

  const nextPhoto = () => setActiveIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);

  return (
    <section className="relative overflow-hidden bg-[#FFFFFF] px-4 py-16 text-[#1E3557] md:py-24">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-4 flex justify-center">
          <img
            src="/templates/cam-tu-cau-xanh/divider-floral.webp"
            alt=""
            className="h-auto w-36 object-contain opacity-85 sm:w-44"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest text-[#1E3557] uppercase sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Album Ảnh Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#6B7F99]"
          style={{ fontFamily: BODY_FONT }}
        >
          Khoảnh khắc tình yêu đơm hoa kết trái
        </p>

        {/* Carousel Coverflow */}
        <div className="relative mx-auto mt-8 flex max-w-md items-center justify-center">
          <button
            onClick={prevPhoto}
            aria-label="Ảnh trước"
            className="absolute left-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[#1E3557]/80 text-[#F9FAFC] shadow-md transition-colors hover:bg-[#1E3557]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            onClick={() => setLightboxIndex(activeIndex)}
            className="relative aspect-[3/4] w-full max-w-xs cursor-pointer overflow-hidden rounded-xl border-2 border-[#C9B182]/40 shadow-lg"
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
            className="absolute right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[#1E3557]/80 text-[#F9FAFC] shadow-md transition-colors hover:bg-[#1E3557]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Dots chỉ số ảnh */}
        <div className="mt-4 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                activeIndex === i ? "w-6 bg-[#C9B182]" : "w-2 bg-[#C9B182]/30",
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
   SECTION 5: LỊCH THÁNG NGÀY CƯỚI & ĐẾM NGƯỢC (CALENDAR)
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
    <section className="relative overflow-hidden bg-[#F9FAFC] px-4 py-16 text-[#1E3557] md:py-24">
      <div className="relative z-10 mx-auto max-w-lg text-center">
        <h2
          className="text-xl font-bold tracking-widest text-[#1E3557] uppercase sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Lịch Ngày Vui
        </h2>
        <p
          className="mt-1 text-xs text-[#6B7F99]"
          style={{ fontFamily: BODY_FONT }}
        >
          Tháng {month + 1} Năm {year}
        </p>

        {/* Lưới lịch tháng */}
        <div className="mx-auto mt-6 max-w-xs rounded-2xl border border-[#C9B182]/30 bg-[#FFFFFF] p-5 shadow-sm">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#4A5D75]">
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
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3557] text-xs font-bold text-[#F9FAFC] shadow-md">
                      <span>{day}</span>
                      <Heart className="absolute -top-1 -right-1 h-3 w-3 fill-[#C9B182] text-[#C9B182] animate-pulse" />
                    </div>
                  ) : (
                    <span className="text-[#1E3557]">{day}</span>
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
                className="flex w-16 flex-col items-center justify-center rounded-xl border border-[#C9B182]/30 bg-[#FFFFFF] p-2.5 shadow-sm sm:w-20 sm:p-3"
              >
                <span
                  className="text-xl font-bold text-[#1E3557] sm:text-2xl"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  {String(item.val).padStart(2, "0")}
                </span>
                <span
                  className="mt-0.5 text-[10px] uppercase tracking-wider text-[#6B7F99]"
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
   ============================================================ */
function TimelineSection({ data }: { data: TemplateData }) {
  const timeline = getTimeline(data);
  const dressColors = getDressColors(data);

  return (
    <section className="relative overflow-hidden bg-[#FFFFFF] px-4 py-16 text-[#1E3557] md:py-24">
      <div className="relative z-10 mx-auto max-w-lg text-center">
        <h2
          className="text-xl font-bold tracking-widest text-[#1E3557] uppercase sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Lịch Trình Hôn Lễ
        </h2>
        <p
          className="mt-1 text-xs text-[#6B7F99]"
          style={{ fontFamily: BODY_FONT }}
        >
          Các mốc thời gian quan trọng trong ngày vui
        </p>

        {/* Timeline dọc */}
        <div className="relative mx-auto mt-8 max-w-sm pl-6 text-left">
          <div className="absolute top-3 bottom-3 left-2.5 w-0.5 bg-[#C9B182]/35" />

          <div className="space-y-6">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative flex items-start gap-4">
                <div className="relative z-10 -ml-5.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#C9B182] bg-[#F9FAFC]">
                  <div className="h-2 w-2 rounded-full bg-[#1E3557]" />
                </div>
                <div>
                  <span
                    className="text-xs font-bold text-[#C9B182]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {item.time}
                  </span>
                  <p
                    className="text-sm font-medium text-[#1E3557]"
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
          <div className="mt-12 rounded-2xl border border-[#C9B182]/30 bg-[#F9FAFC] p-6 text-center">
            <h3
              className="text-sm font-bold tracking-widest uppercase text-[#1E3557]"
              style={{ fontFamily: TITLE_FONT }}
            >
              Trang Phục Gợi Ý (Dress Code)
            </h3>
            <p
              className="mt-1 text-xs text-[#6B7F99]"
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
   - Preload 3 ảnh kích thước & baseline đồng nhất 270x490
   - Layout shift = 0px
   - createPortal mở GiftModal với tone "obsidian"
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
    <section className="relative overflow-hidden bg-[#F9FAFC] px-4 py-16 text-[#1E3557] md:py-24">
      <div className="relative z-10 mx-auto max-w-lg text-center">
        <h2
          className="text-xl font-bold tracking-widest text-[#1E3557] uppercase sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Hộp Mừng Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#6B7F99]"
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
            src="/templates/cam-tu-cau-xanh/gift-normal.webp"
            alt="Hộp mừng cưới"
            className={cn(
              "absolute bottom-0 h-full w-full object-contain transition-opacity duration-300",
              giftState === "normal" ? "opacity-100" : "opacity-0",
            )}
          />
          <img
            src="/templates/cam-tu-cau-xanh/gift-hover.webp"
            alt="Hộp mừng cưới mở nắp"
            className={cn(
              "absolute bottom-0 h-full w-full object-contain transition-opacity duration-300",
              giftState === "hover" ? "opacity-100" : "opacity-0",
            )}
          />
          <img
            src="/templates/cam-tu-cau-xanh/gift-active.webp"
            alt="Hộp mừng cưới trao lì xì"
            className={cn(
              "absolute bottom-0 h-full w-full object-contain transition-opacity duration-300",
              giftState === "active" ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <button
          onClick={handleBoxClick}
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#C9B182] bg-[#1E3557] px-6 py-2.5 text-xs font-semibold tracking-wider text-[#F9FAFC] uppercase shadow-md transition-all hover:bg-[#14243D]"
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
        coupleName={`${data.couple?.groomName ?? "Quang Huy"} & ${data.couple?.brideName ?? "Thanh Trúc"}`}
        guestName={guestName}
        tone="obsidian"
      />
    </section>
  );
}

/* ============================================================
   MAIN COMPONENT: LAM HOA VIÊN TEMPLATE
   ============================================================ */
export function LamHoaVienTemplate({
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
    } catch { }

    if (!contained && typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const safeGuestName = guestName || null;

  return (
    <div
      className={cn(
        "relative w-full bg-[#F9FAFC] text-[#1E3557] selection:bg-[#C9B182]/20",
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
        title={data.music?.title || "Giai điệu Lam Hoa"}
        visible={openState}
        tone="obsidian"
      />

      {/* --------------------------------------------------------
          LỚP 3: RUỘT THIỆP CƯỚI CHÍNH (Ẩn khi chưa mở thiệp)
          -------------------------------------------------------- */}
      <main
        className={cn(
          "relative z-10 transition-opacity duration-700",
          !openState ? "hidden opacity-0 pointer-events-none" : "opacity-100",
        )}
      >
        {/* Section 1: Hero chào mừng & Khung vòm hoa cẩm tú cầu */}
        <HeroSection data={data} isOpened={openState} />

        {/* Section 2: Thông tin gia đình */}
        <FamilySection data={data} />

        {/* Section 3: Sự kiện cưới & bản đồ chỉ đường */}
        <EventsSection data={data} />

        {/* Section 4: Album ảnh cưới coverflow */}
        <GallerySection data={data} />

        {/* Section 5: Lịch ngày vui & đếm ngược */}
        <CalendarCountdownSection data={data} />

        {/* Section 6: Lịch trình & Dress code */}
        <TimelineSection data={data} />

        {/* Section 7: Hộp mừng cưới 3 trạng thái & VietQR */}
        <GiftSection data={data} plan={data.plan} guestName={safeGuestName} />

        {/* Section 8: Form xác nhận tham dự RSVP & Sổ lưu bút */}
        <section className="relative overflow-hidden bg-[#14243D] px-4 py-16 text-[#F9FAFC] md:py-24">
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: "url('/templates/cam-tu-cau-xanh/background-mobile.webp')" }}
          />
          <HydrangeaDustParticles count={16} />

          <div className="relative z-10 mx-auto max-w-xl">
            <TemplateRsvpSection
              data={data}
              mode={mode}
              tone="obsidian"
              contained={contained}
              inviteSlug={inviteSlug}
              weddingSlug={weddingSlug}
              invitationMode={invitationMode}
              guestName={guestName}
            />

            {/* QR Album chia sẻ ảnh tiệc cưới cho gói trả phí */}
            {data.plan !== "free" && weddingSlug && (
              <div className="mt-12 flex justify-center">
                <GuestAlbumQr
                  slug={weddingSlug}
                  accentColor="#1E3557"
                  textColor="#F9FAFC"
                  mutedColor="#C9B182"
                />
              </div>
            )}
          </div>
        </section>

        {/* Footer chúc phúc chân trang */}
        <footer className="border-t border-[#C9B182]/20 bg-[#14243D] px-4 py-12 text-center text-xs text-[#F9FAFC]/60">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
            <Heart className="h-4 w-4 text-[#C9B182]" />
            <p className="tracking-widest uppercase text-[#F9FAFC]">
              {data.couple?.groomName ?? "Chú Rể"} &amp; {data.couple?.brideName ?? "Cô Dâu"}
            </p>
            <p className="text-[11px] text-[#F9FAFC]/50">
              Cảm ơn quý khách đã gửi trọn yêu thương cùng chúng tôi
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default LamHoaVienTemplate;
