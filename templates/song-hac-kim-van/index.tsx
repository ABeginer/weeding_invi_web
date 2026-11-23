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
   BẢNG MÀU CHÍNH THỨC: SONG HẠC KIM VÂN
   - Đỏ son sơn mài (Imperial Vermilion Lacquer — Nền chính & Bìa): #6E0F14 (sâu #4A080C, nhấn #8C161C)
   - Vàng kim ánh cổ (Antique Imperial Gold — Viền khung, Song Hỷ, sóng thủy ba, chỉ nhấn): #D4AF6A (sáng #F2DCA6, trầm #A88440)
   - Lam chàm hoàng cung (Midnight Indigo — Mây tường vân, trái tim lịch, điểm nhấn quý tộc): #12233B
   - Kem giấy dó (Warm Heritage Ivory — Thẻ nội dung chính): #FAF5EC (thẻ phụ #FFFFFF)
   - Chữ chính trên nền kem giấy dó: #5C0D12 (tiêu đề) / #2B1B18 (nội dung, tương phản cao)
   ============================================================ */

const LACQUER_RED = "#6E0F14";
const LACQUER_DARK = "#4A080C";
const LACQUER_ACCENT = "#8C161C";

const GOLD_ANTIQUE = "#D4AF6A";
const GOLD_LIGHT = "#F2DCA6";
const GOLD_DEEP = "#A88440";
const GOLD_BORDER = "rgba(212, 175, 106, 0.55)";
const GOLD_SUBTLE = "rgba(212, 175, 106, 0.25)";

const MIDNIGHT_INDIGO = "#12233B";

const HERITAGE_IVORY = "#FAF5EC";
const CARD_WHITE = "#FFFFFF";

const TEXT_TITLE = "#5C0D12";
const TEXT_BODY = "#2B1B18";
const TEXT_MUTED = "#6B5A55";

const TITLE_FONT = "var(--font-playfair), Georgia, serif";
const NAME_FONT = "var(--font-cormorant), Georgia, serif";
const BODY_FONT = "var(--font-be-vietnam), sans-serif";

const EASE_IMPERIAL = [0.22, 1, 0.36, 1] as const;

const DEFAULT_TIMELINE = [
  { time: "17:30", label: "Đón tiếp quan khách & Chụp ảnh lưu niệm" },
  { time: "18:30", label: "Lễ thành hôn & Trao lời hẹn ước trăm năm" },
  { time: "19:00", label: "Khai tiệc mừng uyên ương sắt son hạnh phúc" },
  { time: "20:00", label: "Giai điệu âm nhạc hoàng gia & Gắn kết thân tình" },
  { time: "21:00", label: "Tiễn khách & Trao quà cảm tạ tri ân" },
];

const DEFAULT_DRESS = ["#F6F2EB", "#F2DCA6", "#12233B"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function getTimeline(data: TemplateData) {
  const items = data.timeline?.filter((item) => item.time?.trim() || item.label?.trim());
  return items && items.length > 0 ? items : DEFAULT_TIMELINE;
}

/* ------------------------------------------------------------
   Hiệu ứng Bụi Vàng Cung Đình & Ánh Sóng Thủy Ba
   - Tự tắt khi prefers-reduced-motion
   ------------------------------------------------------------ */
function ImperialGoldDust({ count = 18 }: { count?: number }) {
  const reduce = useReducedMotion();
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, idx) => ({
      id: idx,
      left: `${(idx * 17) % 94 + 3}%`,
      size: (idx % 3) + 2.5,
      duration: 8 + (idx % 4) * 2,
      delay: (idx * 0.4) % 4,
      yOffset: 30 + (idx % 4) * 25,
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
            bottom: "-10px",
            width: p.size,
            height: p.size,
            background: p.isShimmer
              ? "radial-gradient(circle, #FFFFFF 20%, #F2DCA6 70%, transparent 100%)"
              : "radial-gradient(circle, #F2DCA6 30%, #D4AF6A 80%, transparent 100%)",
            boxShadow: "0 0 6px 1px rgba(212, 175, 106, 0.65)",
          }}
          animate={{
            y: [0, -440 - p.yOffset],
            x: [0, (p.id % 2 === 0 ? 1 : -1) * 16, 0],
            opacity: [0, 0.9, 0.95, 0.4, 0],
            scale: [0.6, 1.25, 1, 0.5],
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
   LỚP 1: MÀN HÌNH BÌA MỞ THIỆP — HIỆU ỨNG "RẼ MÂY KHAI THIỆP"
   - Khóa h-full overflow-hidden khi contained / 100dvh trên thật
   - Thẻ sơn mài đỏ son trầm (#6E0F14 với viền đôi chỉ vàng cổ #D4AF6A)
   - 4 góc hoa mây tường vân corner-tl.webp đối xứng bằng CSS transforms
   - Ấn triện sáp vàng wax-seal.webp (Song Hỷ 囍)
   - Tên cặp đôi 3 dòng chuẩn typographic serif màu vàng champagne
   - Animation mở bìa: 2 lớp cánh màn sơn mài tách ngang sang 2 bên
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
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const dateParts = targetEvent?.startsAt
    ? formatWeddingDateParts(targetEvent.startsAt)
    : (data.date ? formatWeddingDateParts(data.date) : { weekday: "Chủ Nhật", dotDate: "26.10.2025" });

  const lunarText = targetEvent?.lunarDate
    ? formatLunarDateClean(targetEvent.lunarDate)
    : "06 tháng 09 năm Ất Tỵ";

  const handleOpenClick = () => {
    if (openingStage) return;
    setOpeningStage(true);
    playOpenCardSound();
    setTimeout(() => {
      onOpen();
    }, 650);
  };

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden select-none",
        contained ? "h-full min-h-full" : "min-h-screen-dvh min-h-screen",
      )}
      style={{
        background: `radial-gradient(circle at 50% 35%, #8C161C 0%, ${LACQUER_RED} 55%, ${LACQUER_DARK} 100%)`,
      }}
    >
      {/* Background Texture Mobile */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
        style={{ backgroundImage: "url('/templates/song-hac-kim-van/background-mobile.webp')" }}
      />

      <ImperialGoldDust count={18} />

      {/* Hai lớp cánh rèm sơn mài / mây rẽ ngang khi mở (chỉ kích hoạt khi openingStage, nằm dưới thẻ z-20) */}
      {openingStage && !reduce && (
        <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden">
          <m.div
            className="absolute inset-y-0 left-0 w-1/2 border-r border-[#D4AF6A]/30 bg-[#4A080C]/90"
            initial={{ x: "0%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 0.7, ease: EASE_IMPERIAL }}
          />
          <m.div
            className="absolute inset-y-0 right-0 w-1/2 border-l border-[#D4AF6A]/30 bg-[#4A080C]/90"
            initial={{ x: "0%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 0.7, ease: EASE_IMPERIAL }}
          />
        </div>
      )}

      {/* Thẻ Sơn Mài Đỏ Son Trung Tâm */}
      <m.div
        className={cn(
          "relative z-20 my-auto flex w-full max-w-sm flex-col items-center rounded-3xl p-6 text-center shadow-2xl transition-all",
          contained ? "py-5" : "py-8",
        )}
        style={{
          backgroundColor: LACQUER_RED,
          boxShadow: "0 25px 60px -12px rgba(40, 8, 12, 0.75)",
        }}
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={
          openingStage
            ? { opacity: 0, scale: 0.92, y: -25 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        transition={{ duration: 0.65, ease: EASE_IMPERIAL }}
      >
        {/* Khung viền đôi chỉ vàng cổ & 4 góc mây tường vân ôm sát */}
        <div className="pointer-events-none absolute inset-3 rounded-2xl border border-[#D4AF6A]/70">
          <div className="absolute inset-1 rounded-xl border border-[#D4AF6A]/35" />

          {/* 4 Góc hoa mây tường vân từ corner-tl.webp dùng CSS transforms */}
          <img
            src="/templates/song-hac-kim-van/corner-tl.webp"
            alt=""
            className="pointer-events-none absolute top-0 left-0 h-auto w-10 opacity-85 sm:w-12 md:w-14"
            aria-hidden="true"
          />
          <img
            src="/templates/song-hac-kim-van/corner-tl.webp"
            alt=""
            className="pointer-events-none absolute top-0 right-0 h-auto w-10 -scale-x-100 opacity-85 sm:w-12 md:w-14"
            aria-hidden="true"
          />
          <img
            src="/templates/song-hac-kim-van/corner-tl.webp"
            alt=""
            className="pointer-events-none absolute bottom-0 left-0 h-auto w-10 -scale-y-100 opacity-85 sm:w-12 md:w-14"
            aria-hidden="true"
          />
          <img
            src="/templates/song-hac-kim-van/corner-tl.webp"
            alt=""
            className="pointer-events-none absolute bottom-0 right-0 h-auto w-10 -scale-100 opacity-85 sm:w-12 md:w-14"
            aria-hidden="true"
          />
        </div>

        {/* Ấn triện Song Hỷ vàng kim (Wax Seal) */}
        <m.div
          className="relative my-1 flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={
            openingStage
              ? { scale: 1.15, rotate: 8, opacity: 0 }
              : { scale: 1, rotate: 0, opacity: 1 }
          }
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_IMPERIAL }}
        >
          {/* Quầng sáng hào quang ấm */}
          <m.div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(242,220,166,0.45) 0%, rgba(212,175,106,0.12) 65%, transparent 80%)",
            }}
            animate={
              reduce
                ? {}
                : {
                  scale: [1, 1.18, 1],
                  opacity: [0.65, 0.95, 0.65],
                }
            }
            transition={{
              duration: 3.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <img
            src="/templates/song-hac-kim-van/wax-seal.webp"
            alt="Ấn triện Song Hỷ"
            className="relative z-10 h-full w-full object-contain drop-shadow-lg"
          />
        </m.div>

        {/* Lời trân trọng kính mời */}
        <p
          className="mt-2 text-xs font-semibold tracking-[0.32em] uppercase text-[#D4AF6A]"
          style={{ fontFamily: BODY_FONT }}
        >
          {data.ui?.invitePrefix || "Trân Trọng Kính Mời"}
        </p>

        {/* Tên khách mời cá nhân hóa */}
        {guestName && guestName.trim().length > 0 ? (
          <div
            className="my-2 rounded-full px-4 py-1"
            style={{
              backgroundColor: "rgba(18, 35, 59, 0.75)",
              border: `1px solid ${GOLD_BORDER}`,
            }}
          >
            <span
              className="text-xs font-semibold tracking-wider text-[#F2DCA6]"
              style={{ fontFamily: BODY_FONT }}
            >
              {guestName}
            </span>
          </div>
        ) : (
          <div className="h-2" />
        )}

        {/* Tên Cô Dâu & Chú Rể: Chia 3 dòng trang nhã màu vàng champagne */}
        <div className="my-3 flex flex-col items-center">
          <span
            className="text-2xl font-bold tracking-wide text-[#F2DCA6] sm:text-3xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.groomName ?? "Quốc Thái"}
          </span>
          <span
            className="my-0.5 text-lg font-normal italic text-[#D4AF6A] sm:text-xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            &amp;
          </span>
          <span
            className="text-2xl font-bold tracking-wide text-[#F2DCA6] sm:text-3xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.brideName ?? "Huyền Trang"}
          </span>
        </div>

        {/* Dải phân cách mây tường vân */}
        <div className="my-2 flex w-full justify-center">
          <img
            src="/templates/song-hac-kim-van/divider-cloud.webp"
            alt=""
            className="h-auto w-40 object-contain opacity-90 sm:w-48"
            aria-hidden="true"
          />
        </div>

        {/* Ngày cưới & Ngày âm lịch */}
        <div className="my-2 flex flex-col items-center gap-1">
          <p
            className="text-xs font-bold tracking-[0.25em] uppercase text-[#F2DCA6] sm:text-sm"
            style={{ fontFamily: TITLE_FONT }}
          >
            {dateParts.weekday} · {dateParts.dotDate}
          </p>
          <p
            className="text-[11px] tracking-wider text-[#D4AF6A]/85"
            style={{ fontFamily: BODY_FONT }}
          >
            (Tức ngày {lunarText})
          </p>
        </div>

        {/* Nút Mở Thiệp ánh vàng cổ */}
        <m.button
          onClick={handleOpenClick}
          className="group relative mt-5 flex items-center justify-center overflow-hidden rounded-full px-8 py-2.5 shadow-lg transition-all active:scale-95"
          style={{
            backgroundColor: GOLD_ANTIQUE,
            border: `1.5px solid ${GOLD_LIGHT}`,
          }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          {/* Quét ánh sáng mượt trên nút */}
          <div
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#FFFFFF]/35 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
            aria-hidden="true"
          />
          <span
            className="relative z-10 text-xs font-bold tracking-[0.25em] uppercase text-[#4A080C]"
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
   SECTION 1: HERO SECTION — HIỆU ỨNG "NHẬT NGUYỆT SONG HẠC"
   - Biểu tượng sơn mài hero-cranes.webp làm trung tâm nghệ thuật
   - Vòng hào quang chỉ vàng xoay chậm + nhịp thở đôi hạc
   - KHÔNG lặp ngày cưới ở Hero
   ============================================================ */
function HeroSection({ data }: { data: TemplateData }) {
  const reduce = useReducedMotion();

  return (
    <section className="relative overflow-hidden px-4 pt-12 pb-16 text-center text-[#F2DCA6] md:pt-16 md:pb-24">
      {/* Background Decor */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: "url('/templates/song-hac-kim-van/background-mobile.webp')" }}
      />

      <div className="relative z-10 mx-auto max-w-lg">
        {/* Ấn Song Hỷ ở đỉnh */}
        <m.div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center sm:h-16 sm:w-16"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <img
            src="/templates/song-hac-kim-van/wax-seal.webp"
            alt="Song Hỷ"
            className="h-full w-full object-contain drop-shadow-md"
          />
        </m.div>

        {/* Lời tựa mở đầu */}
        <m.p
          className="text-xs uppercase tracking-[0.35em] text-[#D4AF6A]"
          style={{ fontFamily: BODY_FONT }}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {data.ui?.eyebrow || "Imperial Wedding Invitation"}
        </m.p>

        {/* Tên cặp đôi: 3 dòng màu vàng champagne */}
        <m.div
          className="my-4 flex flex-col items-center"
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <h1
            className="text-3xl font-bold tracking-tight text-[#F2DCA6] sm:text-4xl md:text-5xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.groomName ?? "Quốc Thái"}
          </h1>
          <span
            className="my-1 text-xl italic text-[#D4AF6A] sm:text-2xl"
            style={{ fontFamily: TITLE_FONT }}
          >
            &amp;
          </span>
          <h1
            className="text-3xl font-bold tracking-tight text-[#F2DCA6] sm:text-4xl md:text-5xl"
            style={{ fontFamily: NAME_FONT }}
          >
            {data.couple?.brideName ?? "Huyền Trang"}
          </h1>
        </m.div>

        {/* Tác phẩm Song Hạc Kim Vân trên vòng hào quang xoay siêu chậm */}
        <m.div
          className="relative mx-auto my-6 flex max-w-sm items-center justify-center sm:max-w-md"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.25, ease: EASE_IMPERIAL }}
        >
          {/* Vòng hào quang chỉ vàng xoay chậm */}
          <m.div
            className="pointer-events-none absolute h-64 w-64 rounded-full border border-[#D4AF6A]/30 border-dashed sm:h-80 sm:w-80"
            animate={reduce ? {} : { rotate: 360 }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          />

          {/* Vòng sáng hào quang mờ */}
          <div
            className="pointer-events-none absolute h-52 w-52 rounded-full sm:h-64 sm:w-64"
            style={{
              background:
                "radial-gradient(circle, rgba(212,175,106,0.2) 0%, rgba(110,15,20,0.1) 70%, transparent 100%)",
            }}
          />

          {/* Biểu tượng Song Hạc Kim Vân với chuyển động thở êm dịu */}
          <m.div
            className="relative z-10 w-full"
            animate={
              reduce
                ? {}
                : {
                  y: [-4, 4, -4],
                }
            }
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              src="/templates/song-hac-kim-van/hero-cranes.webp"
              alt="Song Hạc Kim Vân — Tranh Sơn Mài Cung Đình"
              className="mx-auto h-auto w-full max-w-xs object-contain drop-shadow-2xl sm:max-w-sm"
            />
          </m.div>
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
            className="text-xs italic leading-relaxed text-[#F2DCA6]/90 sm:text-sm"
            style={{ fontFamily: BODY_FONT }}
          >
            &ldquo;Song hạc tề phi, mây lành hội tụ — Nguyện ước trăm năm gắn bó sắt son như gấm dệt thêu hoa.&rdquo;
          </p>
        </m.div>
      </div>
    </section>
  );
}

/* ============================================================
   SECTION 2: THÔNG TIN HAI BÊN GIA ĐÌNH (FAMILY)
   - Thẻ giấy dó cung đình #FAF5EC viền vàng cổ
   - Tự tách tên phụ huynh tại & thành 2 dòng sạch
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

  const groomParents = formatParents(couple?.groomParents || "Ông Nguyễn Văn Hưng & Bà Trần Thị Ngọc");
  const brideParents = formatParents(couple?.brideParents || "Ông Phan Quốc Bảo & Bà Lê Hoàng Mai");

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-20">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-4 flex justify-center">
          <img
            src="/templates/song-hac-kim-van/divider-cloud.webp"
            alt=""
            className="h-auto w-36 object-contain opacity-85 sm:w-44"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#5C0D12] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Thông Tin Gia Đình
        </h2>
        <p
          className="mt-1 text-xs text-[#6B5A55]"
          style={{ fontFamily: BODY_FONT }}
        >
          Trân trọng báo tin lễ thành hôn của con chúng tôi
        </p>

        {/* Lưới 2 nhà: Nhà Trai & Nhà Gái (Cao bằng nhau) */}
        <div className="mt-8 grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
          {/* Nhà Trai */}
          <m.div
            className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#D4AF6A]/60 bg-[#FAF5EC] p-6 text-center shadow-md"
            initial={{ opacity: 0, x: -15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Viền góc cung đình */}
            <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#D4AF6A]/30" />

            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase text-[#5C0D12]"
                style={{ fontFamily: TITLE_FONT }}
              >
                Nhà Trai
              </span>
              <div className="my-3 space-y-1">
                {groomParents.map((name, i) => (
                  <p
                    key={i}
                    className="text-sm font-medium text-[#2B1B18]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-[#D4AF6A]/30 pt-4">
              <p
                className="text-xs text-[#6B5A55]"
                style={{ fontFamily: BODY_FONT }}
              >
                {couple?.groomTitle || "Trưởng Nam"}
              </p>
              <p
                className="text-base font-bold text-[#5C0D12]"
                style={{ fontFamily: NAME_FONT }}
              >
                {couple?.groomFullName || couple?.groomName || "Nguyễn Quốc Thái"}
              </p>
            </div>
          </m.div>

          {/* Nhà Gái */}
          <m.div
            className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-[#D4AF6A]/60 bg-[#FAF5EC] p-6 text-center shadow-md"
            initial={{ opacity: 0, x: 15 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="pointer-events-none absolute inset-1.5 rounded-xl border border-[#D4AF6A]/30" />

            <div>
              <span
                className="text-xs font-semibold tracking-widest uppercase text-[#5C0D12]"
                style={{ fontFamily: TITLE_FONT }}
              >
                Nhà Gái
              </span>
              <div className="my-3 space-y-1">
                {brideParents.map((name, i) => (
                  <p
                    key={i}
                    className="text-sm font-medium text-[#2B1B18]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    {name}
                  </p>
                ))}
              </div>
            </div>
            <div className="mt-4 border-t border-[#D4AF6A]/30 pt-4">
              <p
                className="text-xs text-[#6B5A55]"
                style={{ fontFamily: BODY_FONT }}
              >
                {couple?.brideTitle || "Ái Nữ"}
              </p>
              <p
                className="text-base font-bold text-[#5C0D12]"
                style={{ fontFamily: NAME_FONT }}
              >
                {couple?.brideFullName || couple?.brideName || "Phan Huyền Trang"}
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
   - Bố cục ngày kiểu ấn phẩm hoàng gia
   - Nhãn thứ màu lam chàm hoàng cung #12233B
   ============================================================ */
function EventsSection({ data }: { data: TemplateData }) {
  const visibleEvents = getVisibleEvents(data);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className={`relative z-10 mx-auto text-center ${visibleEvents.length > 1 ? "max-w-4xl" : "max-w-xl"}`}>
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#5C0D12] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Sự Kiện Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#6B5A55]"
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
                className="relative overflow-hidden rounded-2xl border border-[#D4AF6A]/60 bg-[#FAF5EC] p-6 text-center shadow-md md:p-8"
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: idx * 0.15 }}
              >
                {/* 4 Góc hoa mây tường vân tinh xảo */}
                <img
                  src="/templates/song-hac-kim-van/corner-tl.webp"
                  alt=""
                  className="pointer-events-none absolute top-0 left-0 h-auto w-8 opacity-70"
                  aria-hidden="true"
                />
                <img
                  src="/templates/song-hac-kim-van/corner-tl.webp"
                  alt=""
                  className="pointer-events-none absolute top-0 right-0 h-auto w-8 -scale-x-100 opacity-70"
                  aria-hidden="true"
                />

                <span
                  className="inline-block rounded-full bg-[#12233B] px-4 py-1 text-xs font-semibold tracking-wider uppercase text-[#F2DCA6]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  {evt.title}
                </span>

                {dateParts && (
                  <div className="my-4">
                    <p
                      className="text-base font-bold text-[#5C0D12] sm:text-lg"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {dateParts.weekday} · {dateParts.dotDate}
                    </p>
                    {lunarStr && (
                      <p
                        className="text-xs text-[#6B5A55]"
                        style={{ fontFamily: BODY_FONT }}
                      >
                        (Tức ngày {lunarStr})
                      </p>
                    )}
                  </div>
                )}

                {/* Dải phân cách mây */}
                <div className="my-2 flex justify-center">
                  <img
                    src="/templates/song-hac-kim-van/divider-cloud.webp"
                    alt=""
                    className="h-auto w-28 object-contain opacity-80"
                    aria-hidden="true"
                  />
                </div>

                {/* Địa điểm */}
                <div className="my-4 space-y-1">
                  <p
                    className="text-base font-semibold text-[#5C0D12]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {evt.venueName}
                  </p>
                  <p
                    className="text-xs text-[#2B1B18]"
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
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#D4AF6A] bg-[#6E0F14] px-5 py-2 text-xs font-medium text-[#FAF5EC] shadow-sm transition-colors hover:bg-[#4A080C]"
                    style={{ fontFamily: BODY_FONT }}
                  >
                    <MapPin className="h-3.5 w-3.5 text-[#D4AF6A]" />
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
   - 3D Coverflow / Carousel trên nền đỏ son sâu
   - Nút < > tròn viền vàng tinh gọn
   ============================================================ */
function GallerySection({ data }: { data: TemplateData }) {
  const rawPhotos = data.photos?.gallery || [];
  const maxPhotos = data.plan === "free" ? 5 : 30;
  const photos = rawPhotos.slice(0, maxPhotos);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  if (photos.length === 0) return null;

  const nextPhoto = () => setActiveIndex((prev) => (prev + 1) % photos.length);
  const prevPhoto = () => setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="relative z-10 mx-auto max-w-xl text-center">
        <div className="mb-4 flex justify-center">
          <img
            src="/templates/song-hac-kim-van/divider-cloud.webp"
            alt=""
            className="h-auto w-36 object-contain opacity-85 sm:w-44"
            aria-hidden="true"
          />
        </div>

        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#5C0D12] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Album Ảnh Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#6B5A55]"
          style={{ fontFamily: BODY_FONT }}
        >
          Khoảnh khắc tình yêu sắt son đơm hoa kết trái
        </p>

        {/* Carousel Coverflow */}
        <div className="relative mx-auto mt-8 flex max-w-md items-center justify-center">
          <button
            onClick={prevPhoto}
            aria-label="Ảnh trước"
            className="absolute left-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF6A] bg-[#6E0F14]/90 text-[#F2DCA6] shadow-md transition-colors hover:bg-[#6E0F14]"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div
            onClick={() => setLightboxIndex(activeIndex)}
            className="relative aspect-[3/4] w-full max-w-xs cursor-pointer overflow-hidden rounded-2xl border-2 border-[#D4AF6A]/60 shadow-xl"
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
            className="absolute right-2 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF6A] bg-[#6E0F14]/90 text-[#F2DCA6] shadow-md transition-colors hover:bg-[#6E0F14]"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Bộ đếm & Dots */}
        <p className="mt-3 text-xs font-medium text-[#2B1B18]">
          {activeIndex + 1} / {photos.length}
        </p>

        <div className="mt-2 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                activeIndex === i ? "w-6 bg-[#D4AF6A]" : "w-2 bg-[#D4AF6A]/30",
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
   - Khung lịch tháng trên nền giấy dó
   - Trái tim màu lam chàm hoàng cung #12233B
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
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="relative z-10 mx-auto max-w-lg text-center">
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#5C0D12] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Lịch Ngày Vui
        </h2>
        <p
          className="mt-1 text-xs text-[#6B5A55]"
          style={{ fontFamily: BODY_FONT }}
        >
          Tháng {month + 1} Năm {year}
        </p>

        {/* Lưới lịch tháng viền bo góc cung đình */}
        <div className="mx-auto mt-6 max-w-xs rounded-2xl border border-[#D4AF6A]/60 bg-[#FAF5EC] p-5 shadow-md">
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-[#12233B]">
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
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#12233B] text-xs font-bold text-[#F2DCA6] shadow-md">
                      <span>{day}</span>
                      <Heart className="absolute -top-1 -right-1 h-3 w-3 fill-[#D4AF6A] text-[#D4AF6A] animate-pulse" />
                    </div>
                  ) : (
                    <span className="text-[#2B1B18]">{day}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Khối đếm ngược lam chàm hoàng cung */}
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
                className="flex w-16 flex-col items-center justify-center rounded-2xl border border-[#D4AF6A]/40 bg-[#12233B] p-2.5 shadow-md sm:w-20 sm:p-3"
              >
                <span
                  className="text-xl font-bold text-[#F2DCA6] sm:text-2xl"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  {String(item.val).padStart(2, "0")}
                </span>
                <span
                  className="mt-0.5 text-[10px] tracking-wider uppercase text-[#D4AF6A]/90"
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
   - 3 vòng tròn màu Dress Code mặc định (#F6F2EB, #F2DCA6, #12233B)
   - Timeline "Chỉ Vàng Tự Dệt" tự vẽ mượt, chấm tròn lam chàm viền vàng
   - KHÔNG dùng emoji lòe loẹt
   ============================================================ */
function TimelineSection({ data }: { data: TemplateData }) {
  const timeline = getTimeline(data);
  const dressColors = getDressColors(data);

  return (
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="relative z-10 mx-auto max-w-lg text-center">
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#5C0D12] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Lịch Trình Hôn Lễ
        </h2>
        <p
          className="mt-1 text-xs text-[#6B5A55]"
          style={{ fontFamily: BODY_FONT }}
        >
          Các mốc thời gian quan trọng trong ngày vui
        </p>

        {/* Timeline dọc với trục chỉ vàng tự vẽ mượt */}
        <div className="relative mx-auto mt-8 max-w-sm pl-6 text-left">
          <div className="absolute top-3 bottom-3 left-2.5 w-0.5 bg-[#D4AF6A]/45" />

          <div className="space-y-6">
            {timeline.map((item, idx) => (
              <div key={idx} className="relative flex items-start gap-4">
                <div className="relative z-10 -ml-5.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#D4AF6A] bg-[#12233B]">
                  <div className="h-2 w-2 rounded-full bg-[#F2DCA6]" />
                </div>
                <div>
                  <span
                    className="text-xs font-bold text-[#5C0D12]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {item.time}
                  </span>
                  <p
                    className="text-sm font-medium text-[#2B1B18]"
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
          <div className="mt-12 rounded-2xl border border-[#D4AF6A]/60 bg-[#FAF5EC] p-6 text-center shadow-md">
            <h3
              className="text-sm font-bold tracking-widest uppercase text-[#5C0D12]"
              style={{ fontFamily: TITLE_FONT }}
            >
              Trang Phục Gợi Ý (Dress Code)
            </h3>
            <p
              className="mt-1 text-xs text-[#6B5A55]"
              style={{ fontFamily: BODY_FONT }}
            >
              Quý khách có thể lựa chọn các tone màu trang nhã dưới đây
            </p>
            <div className="mt-5 flex items-center justify-center gap-4 sm:gap-6">
              {dressColors.map((hex, idx) => (
                <div
                  key={idx}
                  className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 border-[#D4AF6A] shadow-md transition-transform hover:scale-110"
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
   - Preload 3 ảnh kích thước & baseline đồng nhất 270x524
   - Layout shift = 0px
   - GiftModal qua createPortal với tone obsidian/dark lacquer
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
    <section className="relative overflow-hidden px-4 py-16 md:py-24">
      <div className="relative z-10 mx-auto max-w-lg text-center">
        <h2
          className="text-xl font-bold tracking-widest uppercase text-[#5C0D12] sm:text-2xl"
          style={{ fontFamily: TITLE_FONT }}
        >
          Hộp Mừng Cưới
        </h2>
        <p
          className="mt-1 text-xs text-[#6B5A55]"
          style={{ fontFamily: BODY_FONT }}
        >
          Gửi trọn yêu thương và lời chúc phúc đến cô dâu & chú rể
        </p>

        {/* Hộp quà 3 trạng thái có baseline và kích thước đồng nhất */}
        <div
          onClick={handleBoxClick}
          onMouseEnter={() => setGiftState("hover")}
          onMouseLeave={() => setGiftState("normal")}
          className="group relative mx-auto my-6 flex h-[350px] w-[180px] cursor-pointer items-end justify-center transition-transform hover:scale-105 active:scale-95 sm:h-[390px] sm:w-[200px]"
        >
          <img
            src="/templates/song-hac-kim-van/gift-normal.webp"
            alt="Hộp mừng cưới Song Hạc"
            className={cn(
              "absolute bottom-0 h-full w-full object-contain transition-opacity duration-300",
              giftState === "normal" ? "opacity-100" : "opacity-0",
            )}
          />
          <img
            src="/templates/song-hac-kim-van/gift-hover.webp"
            alt="Hộp mừng cưới mở nắp"
            className={cn(
              "absolute bottom-0 h-full w-full object-contain transition-opacity duration-300",
              giftState === "hover" ? "opacity-100" : "opacity-0",
            )}
          />
          <img
            src="/templates/song-hac-kim-van/gift-active.webp"
            alt="Hộp mừng cưới trao lì xì"
            className={cn(
              "absolute bottom-0 h-full w-full object-contain transition-opacity duration-300",
              giftState === "active" ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <button
          onClick={handleBoxClick}
          className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#D4AF6A] bg-[#6E0F14] px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-[#FAF5EC] shadow-md transition-all hover:bg-[#4A080C]"
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
        coupleName={`${data.couple?.groomName ?? "Quốc Thái"} & ${data.couple?.brideName ?? "Huyền Trang"}`}
        guestName={guestName}
        tone="obsidian"
      />
    </section>
  );
}

/* ============================================================
   MAIN COMPONENT: SONG HẠC KIM VÂN TEMPLATE
   ============================================================ */
export function SongHacKimVanTemplate({
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
        "relative w-full bg-[#4A080C] text-[#2B1B18] selection:bg-[#D4AF6A]/25",
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
        title={data.music?.title || "Khúc Ca Song Hạc"}
        visible={openState}
        tone="obsidian"
      />

      {/* --------------------------------------------------------
          LỚP 3: RUỘT THIỆP CƯỚI CHÍNH (Ẩn khi chưa mở thiệp)
          - Nền đỏ son sơn mài #6E0F14
          - Cột thẻ giấy dó cung đình max-w-[840px]
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
          style={{ backgroundImage: "url('/templates/song-hac-kim-van/background.webp')" }}
        />

        {/* Khung nội dung trung tâm: Cột thẻ giấy dó cung đình max-w-[840px] */}
        <div className="relative mx-auto my-6 w-full max-w-[840px] rounded-3xl border border-[#D4AF6A]/50 bg-[#FAF5EC] shadow-2xl">
          {/* Section 1: Hero — Nhật Nguyệt Song Hạc (luôn ở đầu thẻ) */}
          <div className="rounded-t-3xl bg-[#6E0F14]">
            <HeroSection data={data} />
          </div>

          {/* Container các section động theo orderOf và hiddenSections */}
          <div className="flex flex-col bg-[#FAF5EC]">
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
                <section className="relative overflow-hidden rounded-b-3xl bg-[#4A080C] px-4 py-16 text-[#FAF5EC] md:py-24">
                  <div
                    className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25"
                    style={{ backgroundImage: "url('/templates/song-hac-kim-van/background-mobile.webp')" }}
                  />
                  <ImperialGoldDust count={16} />

                  <div className="relative z-10 mx-auto max-w-xl">
                    <TemplateRsvpSection
                      data={data}
                      mode={mode}
                      tone="velvet"
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
                          accentColor="#6E0F14"
                          textColor="#FAF5EC"
                          mutedColor="#D4AF6A"
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
        <footer className="border-t border-[#D4AF6A]/25 bg-[#4A080C] px-4 py-12 text-center text-xs text-[#FAF5EC]/70">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
            <img
              src="/templates/song-hac-kim-van/divider-cloud.webp"
              alt=""
              className="h-auto w-24 object-contain opacity-65"
              aria-hidden="true"
            />
            <p className="tracking-widest uppercase text-[#F2DCA6]">
              {data.couple?.groomName ?? "Chú Rể"} &amp; {data.couple?.brideName ?? "Cô Dâu"}
            </p>
            <p className="text-[11px] text-[#FAF5EC]/60">
              Cảm ơn quý khách đã gửi trọn yêu thương và chung vui cùng chúng tôi
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default SongHacKimVanTemplate;
