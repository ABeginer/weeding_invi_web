"use client";

import * as React from "react";
import {
  MapPin,
  ExternalLink,
  Heart,
  Camera,
  Calendar as CalendarIcon,
  BookOpen,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { playCoverSfx } from "@/lib/sfx";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { TemplateData, WeddingEvent, WeddingPlan } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: NHẬT KÝ MÙA YÊU (nhat-ky-mua-yeu)
   - Kem ngà giấy vintage: #F6EFE2 (thẻ ghi chú sáng: #FCF9F2)
   - Nâu giấy kraft: #C49A6C / #9E744B
   - Vàng nhạt giấy note: #F3DFA2
   - Xanh sage washi tape: #7D9378
   - Đỏ gạch tem thư & CTA: #B85042 (hover: #9C3F33)
   - Mực nâu trầm chữ đọc rõ: #3B2C22 (chính), #6F5D50 (phụ)
   ============================================================ */

const COLOR_BG = "#F6EFE2";
const COLOR_CARD = "#FCF9F2";
const COLOR_KRAFT = "#C49A6C";
const COLOR_KRAFT_DARK = "#9E744B";
const COLOR_NOTE_YELLOW = "#F3DFA2";
const COLOR_SAGE = "#7D9378";
const COLOR_RED_BRICK = "#B85042";
const COLOR_TEXT_MAIN = "#3B2C22";
const COLOR_TEXT_MUTED = "#6F5D50";

const HAND_FONT = 'var(--font-dancing-script), "Dancing Script", cursive';
const TITLE_FONT = 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif';
const BODY_FONT = 'var(--font-be-vietnam), "Be Vietnam Pro", sans-serif';
const FILM_FONT = '"Space Mono", monospace';

const DEFAULT_DRESS = ["#B85042", "#7D9378", "#C49A6C"];

function getDressColors(data: TemplateData): string[] {
  const source = data.dressCode?.filter((color) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(color));
  return source && source.length > 0 ? source.slice(0, 3) : DEFAULT_DRESS;
}

function parseParents(names?: string | null): [string, string | null] {
  if (!names) return ["", null];
  const parts = names.split(/\s*&\s*/);
  return [parts[0]?.trim() || "", parts[1]?.trim() || null];
}

export function NhatKyMuaYeuTemplate({
  data,
  mode = "preview",
  contained = false,
  viewport = "desktop",
  externalMusicControl = false,
  isOpened: parentIsOpened,
  onOpenedChange,
  inviteSlug,
  weddingSlug,
  invitationMode = "public",
  guestName,
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = null,
  initialSongRequest = null,
  initialRideNeeded = false,
}: WeddingTemplateProps) {
  const shouldReduceMotion = useReducedMotion();

  // -------------------------------------------------------------
  // TRẠNG THÁI MỞ BÌA (Cover) & HIỆU ỨNG LẬT TRANG SỔ 3D
  // -------------------------------------------------------------
  const [isOpening, setIsOpening] = React.useState(false);
  const [coverGone, setCoverGone] = React.useState(false);
  const parentOpenedRef = React.useRef(parentIsOpened);

  React.useEffect(() => {
    if (parentIsOpened && !coverGone && !isOpening) {
      setCoverGone(true);
    } else if (parentIsOpened === false && parentOpenedRef.current === true) {
      setCoverGone(false);
      setIsOpening(false);
    }
    parentOpenedRef.current = parentIsOpened;
  }, [parentIsOpened, coverGone, isOpening]);

  const handleOpenInvitation = () => {
    if (isOpening || coverGone) return;
    onOpenedChange?.(true);
    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch { }
    setIsOpening(true);

    playCoverSfx("envelope");

    if (shouldReduceMotion) {
      setTimeout(() => {
        setCoverGone(true);
        setIsOpening(false);
        if (!contained && typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      }, 200);
      return;
    }

    // Hiệu ứng lật trang sổ 3D kéo dài 850ms
    setTimeout(() => {
      setCoverGone(true);
      setIsOpening(false);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    }, 850);
  };

  // -------------------------------------------------------------
  // TƯƠNG TÁC GÓI QUÀ GIẤY KRAFT 3 TRẠNG THÁI (hook)
  // -------------------------------------------------------------
  const {
    stage: boxStage,
    isOpening: isBoxOpening,
    isModalOpen: isGiftModalOpen,
    handleGiftClick,
    handleCloseModal: handleCloseGiftModal,
  } = useGiftBoxInteraction({
    sfxType: "envelope",
    delayMs: shouldReduceMotion ? 150 : 700,
  });

  // -------------------------------------------------------------
  // LIGHTBOX PORTAL CHO ALBUM ẢNH
  // -------------------------------------------------------------
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // -------------------------------------------------------------
  // DỮ LIỆU SỰ KIỆN & THỜI GIAN
  // -------------------------------------------------------------
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent?.startsAt || data.date;
  const dateParts = formatWeddingDateParts(eventDateStr);

  // Phân quyền Free/Pro/VIP cho Album
  const plan: WeddingPlan = data.plan || "free";
  const galleryLimit = plan === "free" ? 5 : plan === "pro" ? 30 : 50;
  const rawGallery = data.photos?.gallery || [];
  const galleryPhotos = rawGallery.slice(0, galleryLimit);

  // Song thân
  const [groomFather, groomMother] = parseParents(data.couple.groomParents);
  const [brideFather, brideMother] = parseParents(data.couple.brideParents);

  // Bảng màu Dress Code
  const dressColors = getDressColors(data);

  // Cấu hình ẩn/hiện section
  const hidden = new Set(data.hiddenSections || []);
  const order = data.sectionOrder || [
    "family",
    "calendar",
    "map",
    "dresscode",
    "album",
    "albumQr",
    "gift",
    "rsvp",
  ];
  const orderOf = (key: string) => {
    const idx = order.indexOf(key as any);
    return idx === -1 ? 99 : idx;
  };

  // -------------------------------------------------------------
  // DỮ LIỆU LỊCH THÁNG SỔ TAY & NGÀY SỰ KIỆN
  // -------------------------------------------------------------
  const eventDays = React.useMemo(() => {
    const days = new Set<number>();
    const month = parseInt(dateParts.month, 10) || 1;
    const year = parseInt(dateParts.year, 10) || 2027;
    visibleEvents.forEach((evt) => {
      if (evt.startsAt) {
        const d = new Date(evt.startsAt);
        if (d.getFullYear() === year && d.getMonth() + 1 === month) {
          days.add(d.getDate());
        }
      }
    });
    if (days.size === 0 && dateParts.day) {
      days.add(parseInt(dateParts.day, 10));
    }
    return days;
  }, [visibleEvents, dateParts.month, dateParts.year, dateParts.day]);

  const calendarDays = React.useMemo(() => {
    const month = parseInt(dateParts.month, 10) || 1;
    const year = parseInt(dateParts.year, 10) || 2027;
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0 is Sunday
    // Chuyển sang T2 là ngày 0
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }
    return days;
  }, [dateParts.month, dateParts.year]);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[500px] overflow-x-hidden text-[#3B2C22] selection:bg-[#B85042]/20 selection:text-[#B85042]",
        contained ? "h-full" : "min-h-screen",
        !coverGone && (contained ? "overflow-hidden" : "h-screen-dvh max-h-full overflow-hidden"),
      )}
      style={{
        backgroundColor: COLOR_BG,
        fontFamily: BODY_FONT,
      }}
    >
      {/* Nút điều khiển nhạc nền */}
      {!externalMusicControl && !hidden.has("music") && data.music?.src && (
        <LiveMusicFloatingButton
          src={data.music.src}
          title={data.music.title}
          visible={coverGone}
        />
      )}

      {/* Preload ảnh trạng thái mở gói quà */}
      <img
        src="/templates/nhat-ky-mua-yeu/parcel_open.webp"
        className="hidden"
        aria-hidden="true"
        alt=""
      />

      {/* =========================================================
          BÌA TRANG SCRAPBOOK & HIỆU ỨNG LẬT TRANG SỔ 3D (COVER)
          ========================================================= */}
      <AnimatePresence>
        {!coverGone && (
          <m.div
            initial={{ opacity: 1 }}
            exit={{
              opacity: shouldReduceMotion ? 0 : 1,
              transition: { duration: 0.3 },
            }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            style={{
              backgroundColor: COLOR_BG,
              perspective: "1400px",
            }}
          >
            {/* Lớp Bìa Sổ có hiệu ứng lật trang 3D xoay quanh mép trái */}
            <m.div
              animate={
                isOpening && !shouldReduceMotion
                  ? {
                    rotateY: -110,
                    opacity: [1, 1, 0],
                    transition: {
                      duration: 0.85,
                      ease: [0.4, 0.0, 0.2, 1],
                    },
                  }
                  : { rotateY: 0, opacity: 1 }
              }
              style={{
                transformOrigin: "left center",
                transformStyle: "preserve-3d",
              }}
              className="relative h-full w-full flex items-center justify-center overflow-hidden"
            >
              {/* z-0: Nền Trang Sổ Scrapbook Kem Vintage */}
              <div className="absolute inset-0 z-0">
                <picture className="h-full w-full">
                  <source
                    media="(min-width: 640px)"
                    srcSet={
                      contained
                        ? "/templates/nhat-ky-mua-yeu/bg_page_mobile.webp"
                        : "/templates/nhat-ky-mua-yeu/bg_page_desktop.webp"
                    }
                  />
                  <img
                    src="/templates/nhat-ky-mua-yeu/bg_page_mobile.webp"
                    alt="Nhật Ký Mùa Yêu Scrapbook Background"
                    className="h-full w-full object-cover object-center"
                  />
                </picture>
              </div>

              {/* z-10: Các mảnh dán Scrapbook quanh mép bìa */}
              <div className="pointer-events-none absolute inset-0 z-10">
                {/* Washi sage ở góc trên */}
                <div className="absolute -top-3 left-8 w-28 sm:w-32 -rotate-3">
                  <img
                    src="/templates/nhat-ky-mua-yeu/washi_sage.webp"
                    alt=""
                    className="h-auto w-full object-contain drop-shadow-sm opacity-90"
                  />
                </div>

                {/* Tem thư vintage ở góc trên phải */}
                <div className="absolute top-6 right-5 w-16 sm:w-20 rotate-6">
                  <img
                    src="/templates/nhat-ky-mua-yeu/ephemera_stamp.webp"
                    alt=""
                    className="h-auto w-full object-contain drop-shadow-md"
                  />
                </div>

                {/* Sticker hoa cúc ở góc dưới trái */}
                <div className="absolute bottom-6 left-6 w-14 sm:w-16 -rotate-12">
                  <img
                    src="/templates/nhat-ky-mua-yeu/sticker_daisies.webp"
                    alt=""
                    className="h-auto w-full object-contain drop-shadow-sm"
                  />
                </div>
              </div>

              {/* z-20: Tấm Bìa Trang Sổ Trung Tâm (Căn giữa tuyệt đối) */}
              <div className="relative z-20 flex w-full max-w-[328px] sm:max-w-[388px] flex-col items-center px-4 text-center">
                <div className="relative w-full rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2]/95 p-6 sm:p-8 shadow-xl backdrop-blur-xs">
                  {/* Dải Washi Plaid dán nghiêng ở đỉnh tấm thẻ */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 -rotate-2">
                    <img
                      src="/templates/nhat-ky-mua-yeu/washi_plaid.webp"
                      alt=""
                      className="h-auto w-full object-contain drop-shadow-sm"
                    />
                  </div>

                  {/* Dòng chữ viết tay "Our Little Story" */}
                  <div className="mt-2 mb-1">
                    <span
                      className="text-lg sm:text-xl font-normal tracking-wide text-[#B85042]"
                      style={{ fontFamily: HAND_FONT }}
                    >
                      Our Little Story
                    </span>
                  </div>

                  {/* Nhãn bìa sổ */}
                  <span
                    className="inline-block rounded-full border border-[#C49A6C]/30 bg-[#F6EFE2] px-3 py-0.5 text-[9px] font-bold tracking-[0.2em] text-[#9E744B] uppercase"
                  >
                    NHẬT KÝ MÙA YÊU
                  </span>

                  {/* Tên cặp đôi hiển thị chuẩn 3 dòng */}
                  <div className="my-4 space-y-1">
                    <h1
                      className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B2C22] break-words"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {data.couple.groomName}
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                      <span className="h-[1px] w-6 bg-[#C49A6C]/50" />
                      <span
                        className="text-lg font-normal text-[#B85042]"
                        style={{ fontFamily: HAND_FONT }}
                      >
                        &amp;
                      </span>
                      <span className="h-[1px] w-6 bg-[#C49A6C]/50" />
                    </div>
                    <h1
                      className="text-2xl sm:text-3xl font-bold tracking-tight text-[#3B2C22] break-words"
                      style={{ fontFamily: TITLE_FONT }}
                    >
                      {data.couple.brideName}
                    </h1>
                  </div>

                  {/* Nét vẽ tay trang trí doodle_ink */}
                  <div className="mx-auto mb-4 w-20 opacity-80">
                    <img
                      src="/templates/nhat-ky-mua-yeu/doodle_ink.webp"
                      alt=""
                      className="h-auto w-full object-contain"
                    />
                  </div>

                  {/* Thiệp mời gửi tới khách quý (nếu có guestName) */}
                  {guestName && (
                    <div className="mb-4 rounded-lg border border-[#C49A6C]/30 bg-[#F6EFE2]/80 px-3 py-1.5 text-xs text-[#6F5D50]">
                      <span>Thân gửi: </span>
                      <strong className="text-[#3B2C22]">{guestName}</strong>
                    </div>
                  )}

                  {/* Nút bấm mở thiệp kiểu Lật Trang Sổ */}
                  <m.button
                    type="button"
                    onClick={handleOpenInvitation}
                    disabled={isOpening}
                    whileHover={{ scale: shouldReduceMotion ? 1 : 1.03 }}
                    whileTap={{ scale: shouldReduceMotion ? 1 : 0.97 }}
                    className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#B85042] bg-[#B85042] px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white shadow-md transition-all duration-300 hover:bg-[#9C3F33] hover:shadow-lg focus:outline-hidden disabled:pointer-events-none"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>LẬT MỞ TRANG NHẬT KÝ</span>
                  </m.button>
                </div>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* =========================================================
          THÂN THIỆP CHÍNH (MAIN BODY)
          ========================================================= */}
      <div className="relative z-10 mx-auto w-full max-w-[500px] px-4 pb-16 pt-8 sm:px-6">

        {/* =========================================================
            PHẦN 1: HERO KHUNG POLAROID LỚN NGHIÊNG
            * Không lặp ngày cưới ở Hero
            ========================================================= */}
        <section className="mb-12 text-center">
          {/* Huy hiệu nhỏ trên đỉnh */}
          <div className="mb-3 flex items-center justify-center gap-2">
            <span
              className="text-base sm:text-lg font-normal text-[#B85042]"
              style={{ fontFamily: HAND_FONT }}
            >
              Chapter One
            </span>
            <span className="text-xs text-[#9E744B]">·</span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#9E744B] uppercase">
              KHOẢNH KHẮC MÙA YÊU
            </span>
          </div>

          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight text-[#3B2C22] break-words"
            style={{ fontFamily: TITLE_FONT }}
          >
            {data.couple.groomName} <span className="font-normal text-[#B85042]" style={{ fontFamily: HAND_FONT }}>&amp;</span> {data.couple.brideName}
          </h2>

          {/* Khung Polaroid Lớn Nghiêng -2deg */}
          <div className="relative mx-auto mt-7 w-full max-w-[340px] sm:max-w-[360px]">
            {/* Washi Sage ghim mép trên Polaroid */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 w-28 -rotate-1">
              <img
                src="/templates/nhat-ky-mua-yeu/washi_sage.webp"
                alt=""
                className="h-auto w-full object-contain drop-shadow-xs"
              />
            </div>

            {/* Khung Polaroid */}
            <div className="relative rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-4 pb-6 shadow-xl -rotate-2 transition-transform duration-300 hover:rotate-0">
              {/* Cửa sổ ảnh vuông lồng khung */}
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-[#EFE8DC]">
                <img
                  src={data.photos?.heroUrl || "/templates/nhat-ky-mua-yeu/bg_page_mobile.webp"}
                  alt="Ảnh cưới Polaroid"
                  className="h-full w-full object-cover object-center"
                />
              </div>

              {/* Chú thích viết tay dưới chân Polaroid */}
              <div className="mt-3 flex items-center justify-between px-2">
                <span
                  className="text-lg sm:text-xl font-normal text-[#3B2C22]"
                  style={{ fontFamily: HAND_FONT }}
                >
                  The day we said yes
                </span>
                <div className="w-6 opacity-90">
                  <img
                    src="/templates/nhat-ky-mua-yeu/sticker_hearts.webp"
                    alt=""
                    className="h-auto w-full object-contain"
                  />
                </div>
              </div>
            </div>

            {/* Sticker hoa cúc nhỏ đính góc dưới phải */}
            <div className="absolute -bottom-4 -right-3 z-20 w-12 sm:w-14 rotate-12">
              <img
                src="/templates/nhat-ky-mua-yeu/sticker_daisies.webp"
                alt=""
                className="h-auto w-full object-contain drop-shadow-sm"
              />
            </div>
          </div>

          {/* Trích dẫn nhật ký (quote) */}
          {data.quote && (
            <div className="mx-auto mt-6 max-w-sm px-4">
              <p
                className="text-base sm:text-lg italic text-[#6F5D50] leading-relaxed"
                style={{ fontFamily: TITLE_FONT }}
              >
                &ldquo;{data.quote}&rdquo;
              </p>
            </div>
          )}
        </section>

        {/* CONTAINER CHỨA CÁC PHẦN ĐƯỢC ĐIỀU KHIỂN BỞI SECTION ORDER */}
        <div className="flex flex-col gap-10">

          {/* =========================================================
              PHẦN 2: NHỮNG MẢNH GHÉP ĐỜI THƯỜNG & HAI BÊN GIA ĐÌNH (family)
              * Mảnh giấy kraft xé & giấy note kẻ dòng
              * Song thân tách 2 dòng, không dính '&', không 'Thân sinh:'
              ========================================================= */}
          {!hidden.has("family") && (
            <section style={{ order: orderOf("family") }} className="space-y-4">
              <div className="text-center">
                <span
                  className="text-lg font-normal text-[#B85042]"
                  style={{ fontFamily: HAND_FONT }}
                >
                  Family &amp; Loved Ones
                </span>
                <h3
                  className="text-2xl font-bold tracking-tight text-[#3B2C22]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  NHỮNG MẢNH GHÉP ĐỜI THƯỜNG
                </h3>
              </div>

              {/* 2 Mảnh Giấy Nhật Ký: Chú Rể & Cô Dâu */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Chú rể - Giấy note vàng kẻ dòng */}
                <div className="relative rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 shadow-md rotate-1">
                  {/* Washi plaid dán góc trên */}
                  <div className="absolute -top-3 left-6 w-20 -rotate-3">
                    <img
                      src="/templates/nhat-ky-mua-yeu/washi_plaid.webp"
                      alt=""
                      className="h-auto w-full object-contain"
                    />
                  </div>

                  {data.photos?.groomUrl && (
                    <div className="mx-auto mb-3 aspect-square w-20 overflow-hidden rounded-full border-2 border-[#C49A6C]/40 shadow-xs">
                      <img
                        src={data.photos.groomUrl}
                        alt={data.couple.groomName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <span
                    className="block text-center text-xs font-bold tracking-widest text-[#B85042] uppercase"
                  >
                    {data.couple.groomTitle || "CHÚ RỂ"}
                  </span>
                  <h4
                    className="mt-1 text-center text-xl font-bold text-[#3B2C22]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {data.couple.groomName}
                  </h4>

                  {/* Song thân Nhà Trai */}
                  {(groomFather || groomMother) && (
                    <div className="mt-4 border-t border-[#C49A6C]/25 pt-3 text-xs text-[#6F5D50] space-y-1">
                      <span className="block font-bold text-[10px] tracking-wider text-[#9E744B] uppercase">
                        NHÀ TRAI
                      </span>
                      {groomFather && (
                        <p className="flex items-center gap-1.5">
                          <span className="text-[#9E744B]">Ông:</span>
                          <span className="font-semibold text-[#3B2C22]">{groomFather}</span>
                        </p>
                      )}
                      {groomMother && (
                        <p className="flex items-center gap-1.5">
                          <span className="text-[#9E744B]">Bà:</span>
                          <span className="font-semibold text-[#3B2C22]">{groomMother}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Cô dâu - Giấy kraft hoài cổ */}
                <div className="relative rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 shadow-md -rotate-1">
                  {/* Washi sage dán góc trên */}
                  <div className="absolute -top-3 right-6 w-20 rotate-2">
                    <img
                      src="/templates/nhat-ky-mua-yeu/washi_sage.webp"
                      alt=""
                      className="h-auto w-full object-contain"
                    />
                  </div>

                  {data.photos?.brideUrl && (
                    <div className="mx-auto mb-3 aspect-square w-20 overflow-hidden rounded-full border-2 border-[#C49A6C]/40 shadow-xs">
                      <img
                        src={data.photos.brideUrl}
                        alt={data.couple.brideName}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}

                  <span
                    className="block text-center text-xs font-bold tracking-widest text-[#7D9378] uppercase"
                  >
                    {data.couple.brideTitle || "CÔ DÂU"}
                  </span>
                  <h4
                    className="mt-1 text-center text-xl font-bold text-[#3B2C22]"
                    style={{ fontFamily: TITLE_FONT }}
                  >
                    {data.couple.brideName}
                  </h4>

                  {/* Song thân Nhà Gái */}
                  {(brideFather || brideMother) && (
                    <div className="mt-4 border-t border-[#C49A6C]/25 pt-3 text-xs text-[#6F5D50] space-y-1">
                      <span className="block font-bold text-[10px] tracking-wider text-[#9E744B] uppercase">
                        NHÀ GÁI
                      </span>
                      {brideFather && (
                        <p className="flex items-center gap-1.5">
                          <span className="text-[#9E744B]">Ông:</span>
                          <span className="font-semibold text-[#3B2C22]">{brideFather}</span>
                        </p>
                      )}
                      {brideMother && (
                        <p className="flex items-center gap-1.5">
                          <span className="text-[#9E744B]">Bà:</span>
                          <span className="font-semibold text-[#3B2C22]">{brideMother}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 3: TRANG HẸN NGÀY CHUNG ĐÔI (calendar, map)
              * Dấu máy ảnh film 90s + Vé máy bay mini & vé xem phim
              * Bảng lịch sổ tay kẻ ô nhẹ nhàng
              ========================================================= */}
          {!hidden.has("calendar") && (
            <section style={{ order: orderOf("calendar") }} className="space-y-4">
              <div className="text-center">
                <span
                  className="text-lg font-normal text-[#B85042]"
                  style={{ fontFamily: HAND_FONT }}
                >
                  Save The Date
                </span>
                <h3
                  className="text-2xl font-bold tracking-tight text-[#3B2C22]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  TRANG HẸN NGÀY CHUNG ĐÔI
                </h3>
              </div>

              {/* DẤU MÁY ẢNH FILM 90S ('27 01 02) & ÂM LỊCH */}
              <div className="relative overflow-hidden rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 shadow-lg text-center">
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#9E744B] uppercase">
                  DẤU KỶ NIỆM FILM 35MM
                </span>

                <div className="my-2 flex items-center justify-center gap-2">
                  <span
                    className="text-3xl sm:text-4xl font-bold text-[#D95338] tracking-widest"
                    style={{ fontFamily: FILM_FONT }}
                  >
                    &apos;{dateParts.year.slice(-2)} {dateParts.month} {dateParts.day}
                  </span>
                </div>

                <div className="text-xs font-semibold text-[#6F5D50]">
                  {targetEvent?.lunarDate && (
                    <span>Âm lịch: {formatLunarDateClean(targetEvent.lunarDate)}</span>
                  )}
                </div>
              </div>

              {/* BẢNG LỊCH THÁNG SỔ TAY */}
              <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 shadow-lg">
                <div className="mb-4 flex items-center justify-between border-b border-[#C49A6C]/20 pb-3">
                  <span
                    className="text-xs font-bold tracking-widest text-[#B85042] uppercase"
                  >
                    THÁNG {dateParts.month} / {dateParts.year}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-[#9E744B]">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    <span>Lịch chung đôi</span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dow, idx) => (
                    <span
                      key={idx}
                      className="py-1 text-[10px] font-bold text-[#9E744B]"
                    >
                      {dow}
                    </span>
                  ))}
                  {calendarDays.map((dayNum, idx) => {
                    if (dayNum === null) {
                      return <div key={`empty-${idx}`} className="py-2" />;
                    }
                    const isWeddingDay = dayNum !== null && eventDays.has(dayNum);
                    return (
                      <div
                        key={`day-${dayNum}`}
                        className={cn(
                          "relative flex items-center justify-center rounded-lg py-2 text-xs font-medium transition-colors",
                          isWeddingDay
                            ? "bg-[#B85042] font-bold text-white shadow-md"
                            : "text-[#3B2C22] hover:bg-[#C49A6C]/10",
                        )}
                      >
                        {dayNum}
                        {isWeddingDay && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F3DFA2]" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CÁC SỰ KIỆN CƯỚI (EVENTS) TRANG TRÍ VÉ MINI */}
              <div
                className={cn(
                  "grid gap-4",
                  visibleEvents.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
                )}
              >
                {visibleEvents.map((evt, idx) => {
                  const directionsUrl = getEventDirectionsUrl(evt);
                  return (
                    <div
                      key={evt.id || idx}
                      className="relative overflow-hidden rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 shadow-md flex flex-col justify-between"
                    >
                      {/* Vé kỷ niệm mini đính góc phải */}
                      <div className="absolute top-3 right-3 w-16 opacity-85">
                        <img
                          src={
                            idx % 2 === 0
                              ? "/templates/nhat-ky-mua-yeu/ephemera_boarding.webp"
                              : "/templates/nhat-ky-mua-yeu/ephemera_cinema.webp"
                          }
                          alt=""
                          className="h-auto w-full object-contain"
                        />
                      </div>

                      <div>
                        <span
                          className="inline-block rounded-md border border-[#C49A6C]/30 bg-[#F6EFE2] px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-[#B85042] uppercase"
                        >
                          CHẶNG {idx + 1}
                        </span>

                        <h4
                          className="mt-2 text-xl font-bold text-[#3B2C22]"
                          style={{ fontFamily: TITLE_FONT }}
                        >
                          {evt.title || "Tiệc Cưới"}
                        </h4>

                        <div className="mt-3 text-xs text-[#6F5D50] space-y-1">
                          <p className="font-bold text-[#D95338]" style={{ fontFamily: FILM_FONT }}>
                            {formatWeddingDateParts(evt.startsAt).time || "18:00"}
                          </p>
                          {evt.venueName && (
                            <p className="flex items-center gap-1.5 font-semibold text-[#3B2C22]">
                              <MapPin className="h-3.5 w-3.5 text-[#B85042]" />
                              {evt.venueName}
                            </p>
                          )}
                          {evt.venueAddress && (
                            <p className="pl-5 text-[11px] leading-relaxed">
                              {evt.venueAddress}
                            </p>
                          )}
                        </div>
                      </div>

                      {directionsUrl && (
                        <div className="mt-4 pt-2 border-t border-[#C49A6C]/15">
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#B85042] bg-[#B85042] px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[#9C3F33]"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>CHỈ ĐƯỜNG TRÊN GOOGLE MAPS</span>
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 4: BẢNG MÀU MÙA YÊU (dresscode)
              * Chỉ hiển thị các ô màu, TUYỆT ĐỐI KHÔNG hiện mã #XXXXXX
              ========================================================= */}
          {!hidden.has("dresscode") && dressColors.length > 0 && (
            <section style={{ order: orderOf("dresscode") }} className="space-y-4">
              <div className="text-center">
                <span
                  className="text-lg font-normal text-[#B85042]"
                  style={{ fontFamily: HAND_FONT }}
                >
                  Dress Palette
                </span>
                <h3
                  className="text-2xl font-bold tracking-tight text-[#3B2C22]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  BẢNG MÀU MÙA YÊU
                </h3>
              </div>

              <div className="rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 shadow-lg text-center">
                <p className="mb-4 text-xs text-[#6F5D50]">
                  Gợi ý sắc màu trang phục nhẹ nhàng để chúng mình cùng lưu giữ những khung hình kỷ niệm đẹp nhất.
                </p>

                <div className="flex items-center justify-center gap-4 sm:gap-6">
                  {dressColors.map((color, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <div
                        className="h-12 w-12 rounded-full border-2 border-white shadow-md transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                        }}
                      />
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider text-[#9E744B]"
                      >
                        Màu #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 5: CUỘN FILM KỶ NIỆM (ALBUM ẢNH CƯỚI) (album)
              * Lưới Polaroid và ảnh 35mm, Lightbox portal
              ========================================================= */}
          {!hidden.has("album") && galleryPhotos.length > 0 && (
            <section style={{ order: orderOf("album") }} className="space-y-4">
              <div className="text-center">
                <div className="mx-auto mb-1 flex items-center justify-center gap-2">
                  <img
                    src="/templates/nhat-ky-mua-yeu/ephemera_camera.webp"
                    alt=""
                    className="h-6 w-auto object-contain"
                  />
                  <span
                    className="text-lg font-normal text-[#B85042]"
                    style={{ fontFamily: HAND_FONT }}
                  >
                    Our Memories
                  </span>
                </div>
                <h3
                  className="text-2xl font-bold tracking-tight text-[#3B2C22]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  CUỘN FILM KỶ NIỆM
                </h3>
              </div>

              {/* Lưới ảnh phong cách Scrapbook dán so le nhẹ */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {galleryPhotos.map((photo, idx) => {
                  const photoSrc = typeof photo === "string" ? photo : photo.url;
                  const photoAlt = (typeof photo === "object" && photo.alt) || `Khoảnh khắc ${idx + 1}`;
                  const isEven = idx % 2 === 0;
                  return (
                    <button
                      key={(typeof photo === "object" && photo.id) || idx}
                      type="button"
                      onClick={() => setLightboxIndex(idx)}
                      className={cn(
                        "group relative aspect-[3/4] overflow-hidden rounded-xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-1.5 shadow-md transition-all duration-300 hover:scale-[1.03] hover:shadow-lg focus:outline-hidden",
                        isEven ? "-rotate-1" : "rotate-1",
                      )}
                    >
                      <div className="relative h-full w-full overflow-hidden rounded-lg bg-[#EFE8DC]">
                        <img
                          src={photoSrc}
                          alt={photoAlt}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* GUEST ALBUM QR (Tải ảnh chụp của khách mời) */}
          {!hidden.has("albumQr") && weddingSlug && (
            <section style={{ order: orderOf("albumQr") }}>
              <div className="overflow-hidden rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-5 shadow-lg text-center">
                <GuestAlbumQr slug={weddingSlug} />
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 6: GÓI QUÀ GIẤY KRAFT 3 TRẠNG THÁI (gift)
              * parcel_normal -> parcel_glow -> parcel_open
              ========================================================= */}
          {!hidden.has("gift") && (
            <section style={{ order: orderOf("gift") }} className="space-y-4">
              <div className="text-center">
                <span
                  className="text-lg font-normal text-[#B85042]"
                  style={{ fontFamily: HAND_FONT }}
                >
                  Wedding Gift
                </span>
                <h3
                  className="text-2xl font-bold tracking-tight text-[#3B2C22]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  GÓI QUÀ GIẤY KRAFT
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-[#6F5D50] max-w-sm mx-auto">
                  Sự hiện diện của bạn là trang kỷ niệm đẹp nhất trong cuốn sổ nhỏ này. Nếu ở xa chưa kịp ghé chung vui, bạn có thể mở gói quà giấy kraft bên dưới để gửi lời chúc nhé.
                </p>
              </div>

              {/* Gói quà giấy kraft 3 trạng thái căn đáy đồng bộ */}
              <div className="flex flex-col items-center justify-center rounded-2xl border border-[#C49A6C]/40 bg-[#FCF9F2] p-6 shadow-xl text-center">
                <button
                  type="button"
                  onClick={handleGiftClick}
                  disabled={isBoxOpening}
                  className="group relative flex cursor-pointer items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 disabled:pointer-events-none"
                  aria-label="Mở gói quà giấy kraft mừng cưới"
                >
                  {/* Hào quang ấm phía sau gói quà */}
                  <div
                    className="pointer-events-none absolute inset-0 -m-4 rounded-3xl bg-gradient-to-r from-[#F3DFA2]/40 via-[#B85042]/20 to-[#F3DFA2]/40 blur-xl transition-opacity duration-300"
                    style={{
                      opacity: boxStage === "open" || boxStage === "glow" ? 0.9 : 0.3,
                    }}
                    aria-hidden="true"
                  />

                  {/* Ảnh gói quà 3 trạng thái căn đáy thẳng hàng tuyệt đối */}
                  <div className="relative z-10 h-48 w-48 sm:h-52 sm:w-52">
                    <img
                      src={
                        boxStage === "open"
                          ? "/templates/nhat-ky-mua-yeu/parcel_open.webp"
                          : boxStage === "glow"
                            ? "/templates/nhat-ky-mua-yeu/parcel_glow.webp"
                            : "/templates/nhat-ky-mua-yeu/parcel_normal.webp"
                      }
                      alt="Gói quà mừng cưới giấy kraft"
                      className="mx-auto block h-full w-full object-contain"
                    />
                  </div>
                </button>

                <p
                  className="mt-3 text-xs font-bold tracking-[0.2em] text-[#B85042] uppercase"
                >
                  {boxStage === "open" ? "GÓI QUÀ ĐÃ MỞ" : "CHẠM ĐỂ MỞ GÓI QUÀ"}
                </p>
              </div>
            </section>
          )}

          {/* =========================================================
              PHẦN 7: GHI CHÚ THAM DỰ & GỬI LỜI CHÚC (rsvp)
              * Đồng bộ theme Scrapbook sáng ấm
              ========================================================= */}
          {!hidden.has("rsvp") && (
            <section style={{ order: orderOf("rsvp") }} className="space-y-4">
              <div className="text-center">
                <span
                  className="text-lg font-normal text-[#B85042]"
                  style={{ fontFamily: HAND_FONT }}
                >
                  RSVP &amp; Wishes
                </span>
                <h3
                  className="text-2xl font-bold tracking-tight text-[#3B2C22]"
                  style={{ fontFamily: TITLE_FONT }}
                >
                  GHI CHÚ THAM DỰ &amp; GỬI LỜI CHÚC
                </h3>
              </div>

              {/* Form RSVP bọc trong card Giấy Scrapbook sáng */}
              <div
                className="overflow-hidden rounded-2xl border border-[#C49A6C]/50 bg-[#FCF9F2] p-5 sm:p-6 shadow-xl"
                style={{ colorScheme: "light" }}
              >
                <TemplateRsvpSection
                  data={data}
                  mode={mode}
                  tone="minbrown"
                  customTheme={{
                    isDark: false,
                    wrap: "bg-transparent text-[#3B2C22]",
                    heading: "text-[#B85042]",
                    card: "bg-[#FCF9F2] border border-[#C49A6C]/60 text-[#3B2C22] shadow-xs",
                    input: "bg-[#FAF6EE] border border-[#C49A6C]/50 text-[#3B2C22] placeholder:text-[#8A7668] focus:border-[#B85042]",
                    primaryBtn: "bg-[#B85042] text-white hover:bg-[#9C3F33] font-bold shadow-md",
                    outlineBtn: "border border-[#C49A6C] text-[#3B2C22] hover:bg-[#C49A6C]/10",
                    optionBg: "#FCF9F2",
                    optionColor: "#3B2C22",
                  }}
                  contained={contained}
                  inviteSlug={inviteSlug}
                  weddingSlug={weddingSlug}
                  invitationMode={invitationMode}
                  guestName={guestName}
                  initialStatus={initialStatus}
                  initialPlusOnes={initialPlusOnes}
                  initialDiet={initialDiet}
                  initialSongRequest={initialSongRequest}
                  initialRideNeeded={initialRideNeeded}
                />
              </div>
            </section>
          )}

        </div>

        {/* =========================================================
            PHẦN 8: FOOTER (ĐẶT NGOÀI CONTAINER FLEX CÓ ORDER)
            * Không lặp ngày cưới
            ========================================================= */}
        <footer className="mt-16 border-t border-[#C49A6C]/30 bg-[#F6EFE2] py-10 text-center text-xs text-[#6F5D50]">
          <div className="mx-auto max-w-sm px-4 space-y-2">
            <p
              className="text-lg sm:text-xl font-normal text-[#B85042]"
              style={{ fontFamily: HAND_FONT }}
            >
              Cảm ơn bạn đã trở thành một phần trong câu chuyện nhỏ của tụi mình
            </p>
            <p
              className="text-[11px] tracking-[0.2em] text-[#9E744B] uppercase font-mono"
            >
              NHẬT KÝ MÙA YÊU · OUR LITTLE STORY
            </p>
            <p className="text-[10px] text-[#9E744B]/80 pt-2">
              © {dateParts.year} {data.couple.groomName} &amp; {data.couple.brideName}. ALL RIGHTS RESERVED.
            </p>
          </div>
        </footer>
      </div>

      {/* ---------------- MODAL QUÀ MỪNG (createPortal) ---------------- */}
      <GiftModal
        open={isGiftModalOpen}
        onClose={handleCloseGiftModal}
        gift={data.gift}
        plan={data.plan || "free"}
        tone="minbrown"
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName}
      />

      {/* ---------------- LIGHTBOX ẢNH SCRAPBOOK (createPortal) ---------------- */}
      {lightboxIndex !== null && (
        <TemplateLightboxModal
          photos={galleryPhotos}
          activeIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onChangeIndex={setLightboxIndex}
        />
      )}
    </div>
  );
}

export default NhatKyMuaYeuTemplate;
