"use client";

import * as React from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Compass,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { m, useReducedMotion, AnimatePresence } from "motion/react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { useGiftBoxInteraction } from "@/hooks/useGiftBoxInteraction";
import { GuestAlbumQr } from "@/components/invitation/GuestAlbumQr";
import { useInvitationExperience } from "@/components/invitation/InvitationExperienceProvider";
import { playCoverSfx } from "@/lib/sfx";
import { cn, formatLunarDateClean, formatWeddingDateParts } from "@/lib/utils";
import { getVisibleEvents, getNearestUpcomingEvent, getEventDirectionsUrl } from "@/lib/events";
import type { WeddingEvent, TemplatePhotoItem, WeddingPlan } from "@/lib/wedding-types";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import type { WeddingTemplateProps } from "../types";

/* ============================================================
   BẢNG MÀU CHÍNH THỨC: MỘT THỜI ĐỂ NHỚ (mot-thoi-de-nho)
   - Kem giấy cũ ngả vàng: #F5EFE2
   - Be ngả vàng thẻ giấy: #EDE3CE / #FAF6EC
   - Nâu kraft: #C4A484 / #B99976
   - Nâu đất chữ chính & mực viết tay: #4A3728
   - Nâu đất chữ phụ: #5E493A
   - Nâu đỏ trầm dấu sáp / nút chính: #7C3629 (hover #642A1F)
   ============================================================ */

const COLOR_BG = "#F5EFE2";
const COLOR_CARD = "#FAF6EC";
const COLOR_CARD_ALT = "#EDE3CE";
const COLOR_KRAFT = "#C4A484";
const COLOR_TEXT_MAIN = "#4A3728";
const COLOR_TEXT_MUTED = "#5E493A";
const COLOR_TERRACOTTA = "#7C3629";

const FONT_SCRIPT = 'var(--font-dancing-script), "Dancing Script", cursive';
const FONT_SERIF = 'var(--font-cormorant), "Cormorant Garamond", Georgia, serif';
const FONT_BODY = 'var(--font-lora), var(--font-be-vietnam), "Lora", "Be Vietnam Pro", serif';

const DEFAULT_DRESS_CODE = [
  { name: "Kem ngà", color: "#F5EFE2" },
  { name: "Be cổ điển", color: "#EDE3CE" },
  { name: "Nâu kraft", color: "#C4A484" },
  { name: "Nâu đỏ sáp", color: "#7C3629" },
];

interface StoryMilestone {
  year: string;
  title: string;
  content: string;
}

const DEFAULT_STORY_MILESTONES: StoryMilestone[] = [
  {
    year: "2020",
    title: "Lần đầu gặp gỡ",
    content: "Một buổi chiều thu dịu dàng ở góc quán quen, ánh mắt chạm nhau mở đầu cho bao nhung nhớ.",
  },
  {
    year: "2022",
    title: "Lời hẹn ước",
    content: "Dưới ánh hoàng hôn vàng ươm, chúng mình đã nắm tay nhau và hứa sẽ cùng đi qua mọi thăng trầm.",
  },
  {
    year: "2024",
    title: "Khoảnh khắc cầu hôn",
    content: "Chiếc nhẫn trao tay thay cho lời nguyện thề chung một mái nhà, cùng viết tiếp trang đời tươi đẹp.",
  },
  {
    year: "2027",
    title: "Một thời để nhớ",
    content: "Hôm nay, trước sự chứng kiến của những người thương yêu nhất, chúng mình chính thức nên duyên vợ chồng.",
  },
];

export default function MotThoiDeNhoTemplate({
  data,
  mode = "preview",
  contained = false,
  viewport = "phone",
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
  const invitationExp = useInvitationExperience();

  // -------------------------------------------------------------
  // TRẠNG THÁI MỞ BÌA (Interactive Envelope Cover State Machine)
  // -------------------------------------------------------------
  type EnvelopeStage = "closed" | "opening-flap" | "opening-card" | "fading" | "opened";

  const [envelopeStage, setEnvelopeStage] = React.useState<EnvelopeStage>(
    parentIsOpened ? "opened" : "closed",
  );
  const [coverGone, setCoverGone] = React.useState(Boolean(parentIsOpened));
  const timersRef = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  // Dọn dẹp timer khi component unmount
  React.useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
    };
  }, []);

  React.useEffect(() => {
    if (parentIsOpened && envelopeStage !== "opened") {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current = [];
      setEnvelopeStage("opened");
      setCoverGone(true);
    } else if (parentIsOpened === false && envelopeStage === "opened") {
      setEnvelopeStage("closed");
      setCoverGone(false);
    }
  }, [parentIsOpened, envelopeStage]);

  const handleOpenCover = () => {
    if (envelopeStage !== "closed" || coverGone) return;

    // Kích hoạt phát nhạc đồng bộ ngay trong user-gesture onClick
    try {
      invitationExp?.triggerInvitationOpened();
    } catch {}

    onOpenedChange?.(true);

    try {
      window.dispatchEvent(new CustomEvent("inviwedd:open-envelope"));
    } catch {}

    playCoverSfx("envelope");

    if (shouldReduceMotion) {
      const t = setTimeout(() => {
        setEnvelopeStage("opened");
        setCoverGone(true);
        if (!contained && typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      }, 200);
      timersRef.current.push(t);
      return;
    }

    // Giai đoạn 1 (0 -> 450ms): lật nắp tam giác, dấu sáp mờ dần
    setEnvelopeStage("opening-flap");

    // Giai đoạn 2 (450ms -> 1050ms): ruột thiệp trượt nhô lên
    const t1 = setTimeout(() => {
      setEnvelopeStage("opening-card");
    }, 450);

    // Giai đoạn 3 (1050ms -> 1450ms): overlay phong bì fade out
    const t2 = setTimeout(() => {
      setEnvelopeStage("fading");
    }, 1050);

    // Kết thúc (1450ms): unmount phong bì hoàn toàn, mở khóa cuộn
    const t3 = setTimeout(() => {
      setEnvelopeStage("opened");
      setCoverGone(true);
      if (!contained && typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 1450);

    timersRef.current.push(t1, t2, t3);
  };

  // -------------------------------------------------------------
  // HỘP QUÀ KỶ NIỆM (3 TRẠNG THÁI CHUẨN useGiftBoxInteraction)
  // -------------------------------------------------------------
  const {
    stage: giftBoxStage,
    isOpening: isGiftOpening,
    isModalOpen: giftModalOpen,
    handleGiftClick,
    handleCloseModal,
  } = useGiftBoxInteraction({
    sfxType: "box",
  });

  // Lightbox Modal cho Album ảnh
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  // Danh sách sự kiện & ngày giờ
  const visibleEvents = getVisibleEvents(data);
  const targetEvent = getNearestUpcomingEvent(visibleEvents, data.date);
  const eventDateStr = targetEvent?.startsAt || data.date || "2027-03-20T10:00:00+07:00";

  // Đồng hồ đếm ngược phong cách lịch xé cổ điển
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  React.useEffect(() => {
    function calcTime() {
      const target = new Date(eventDateStr).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }

    calcTime();
    const timer = setInterval(calcTime, 1000);
    return () => clearInterval(timer);
  }, [eventDateStr]);

  // Thông tin cặp đôi & gia đình
  const groomName = data.couple?.groomName || "Hoàng Long";
  const brideName = data.couple?.brideName || "Bảo Ngọc";
  const groomFullName = data.couple?.groomFullName || groomName;
  const brideFullName = data.couple?.brideFullName || brideName;

  const groomParentsRaw = data.couple?.groomParents || "";
  const brideParentsRaw = data.couple?.brideParents || "";

  const groomParentsList = React.useMemo(() => {
    if (!groomParentsRaw) return [];
    return groomParentsRaw.split("&").map((s) => s.trim()).filter(Boolean);
  }, [groomParentsRaw]);

  const brideParentsList = React.useMemo(() => {
    if (!brideParentsRaw) return [];
    return brideParentsRaw.split("&").map((s) => s.trim()).filter(Boolean);
  }, [brideParentsRaw]);

  // Định dạng ngày
  const dateParts = formatWeddingDateParts(eventDateStr);
  const fullDateText = `${dateParts.day}/${dateParts.month}/${dateParts.year}`;
  const lunarText = targetEvent?.lunarDate
    ? formatLunarDateClean(targetEvent.lunarDate)
    : "";

  // Phân quyền Album theo gói (Free 5, Pro 30, VIP 50)
  const plan: WeddingPlan = (data.plan as WeddingPlan) || "free";
  const galleryLimit = plan === "free" ? 5 : plan === "pro" ? 30 : 50;
  const rawGallery = (data.photos?.gallery || []).slice(0, galleryLimit);

  const galleryPhotos: TemplatePhotoItem[] = React.useMemo(() => {
    if (rawGallery.length >= 5) return rawGallery;
    const defaultDummies: TemplatePhotoItem[] = [
      { id: "p1", url: data.photos?.heroUrl || "/media/demo-wedding-hero.jpg", alt: "Ngày chung đôi", position: 0 },
      { id: "p2", url: "/media/demo-couple-1.jpg", alt: "Khoảnh khắc hẹn thề", position: 1 },
      { id: "p3", url: "/media/demo-couple-2.jpg", alt: "Một thời để nhớ", position: 2 },
      { id: "p4", url: "/media/demo-couple-3.jpg", alt: "Bình yên bên nhau", position: 3 },
      { id: "p5", url: "/media/demo-couple-4.jpg", alt: "Hành trình yêu thương", position: 4 },
      { id: "p6", url: "/media/demo-wedding-hero.jpg", alt: "Mãi mãi bên nhau", position: 5 },
    ];
    return [...rawGallery, ...defaultDummies].slice(0, 6);
  }, [rawGallery, data.photos?.heroUrl]);

  const heroPhotoUrl = data.photos?.heroUrl || galleryPhotos[0]?.url || "/media/demo-wedding-hero.jpg";

  // Lịch tháng phong cách vẽ mực cổ
  const calendarDays = React.useMemo(() => {
    const d = new Date(eventDateStr);
    const year = d.getFullYear() || 2027;
    const month = d.getMonth() || 2;
    const weddingDay = d.getDate() || 20;

    const daysSet = new Set<number>();
    visibleEvents.forEach((evt) => {
      if (evt.startsAt) {
        const evtD = new Date(evt.startsAt);
        if (evtD.getFullYear() === year && evtD.getMonth() === month) {
          daysSet.add(evtD.getDate());
        }
      }
    });
    if (daysSet.size === 0) {
      daysSet.add(weddingDay);
    }

    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sun
    const totalDays = new Date(year, month + 1, 0).getDate();
    const offset = (firstDay + 6) % 7; // Monday = 0

    const days: Array<{ day: number | null; isWedding: boolean }> = [];
    for (let i = 0; i < offset; i++) {
      days.push({ day: null, isWedding: false });
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, isWedding: daysSet.has(i) });
    }
    return days;
  }, [eventDateStr, visibleEvents]);

  // Dress code color swatches (không in mã hex)
  const dressCodeSwatches = React.useMemo(() => {
    if (data.dressCode && data.dressCode.length > 0) {
      const names = ["Sắc màu chủ đạo", "Sắc màu điểm xuyết", "Sắc màu phối hợp", "Sắc màu thanh nhã"];
      return data.dressCode.map((hex, i) => ({
        name: names[i % names.length],
        color: hex,
      }));
    }
    return DEFAULT_DRESS_CODE;
  }, [data.dressCode]);

  // Toggle Section & Thứ tự Section
  const hidden = React.useMemo(() => new Set(data.hiddenSections || []), [data.hiddenSections]);

  // Câu chuyện tình yêu (tách biệt hoàn toàn khỏi lịch trình ngày cưới timeline, Standard & Pro only)
  const isStoryAllowed = data.plan !== "free";
  const isStoryVisible =
    isStoryAllowed &&
    !hidden.has("story") &&
    !hidden.has("loveStory");

  const storyMilestones: StoryMilestone[] = React.useMemo(() => {
    if (data.story && data.story.length > 0) {
      return data.story.map((item) => ({
        year: item.year || "",
        title: item.title,
        content: item.content,
      }));
    }
    return DEFAULT_STORY_MILESTONES;
  }, [data.story]);
  const order = React.useMemo(
    () =>
      data.sectionOrder || [
        "family",
        "story",
        "album",
        "calendar",
        "gift",
        "rsvp",
        "dresscode",
        "albumQr",
      ],
    [data.sectionOrder],
  );

  const orderOf = React.useCallback(
    (key: string) => {
      const idx = order.indexOf(key);
      return idx === -1 ? 99 : idx;
    },
    [order],
  );

  const isBrideFirst = data.hostFirst === "bride";

  return (
    <div
      data-template-id="mot-thoi-de-nho"
      className={cn(
        "relative w-full mx-auto select-text overflow-x-hidden antialiased",
        contained
          ? !coverGone
            ? "h-full overflow-hidden"
            : "min-h-full"
          : !coverGone
            ? "h-screen-dvh max-h-full overflow-hidden"
            : "min-h-screen",
      )}
      style={{
        backgroundColor: COLOR_BG,
        color: COLOR_TEXT_MAIN,
        fontFamily: FONT_BODY,
      }}
    >
      {/* Nền giấy cũ ngả vàng vintage xuyên suốt toàn thiệp */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-repeat"
        style={{
          backgroundImage: "url('/templates/mot-thoi-de-nho/bg-vintage-paper.webp')",
          backgroundSize: "400px 400px",
        }}
      />

      {/* Nút nhạc nổi (khi không dùng externalMusicControl) */}
      {!externalMusicControl && !hidden.has("music") && (
        <LiveMusicFloatingButton
          src="/media/co-dien.mp3"
          title="Giai Điệu Cổ Điển"
          visible={coverGone}
          tone="minbrown"
        />
      )}

      {/* ============================================================
          1. MÀN BÌA PHONG THƯ MỞ THIỆP (Interactive Envelope Cover)
          ============================================================ */}
      {envelopeStage !== "opened" && !coverGone && (
        <div
          key="vintage-envelope-cover"
          className={cn(
            "absolute inset-0 z-50 flex items-center justify-center p-4 sm:p-6 select-none transition-opacity duration-400 ease-out",
            envelopeStage === "fading" ? "opacity-0 pointer-events-none" : "opacity-100",
          )}
          style={{
            backgroundColor: COLOR_BG,
          }}
        >
          {/* Lớp nền giấy texture phủ nhẹ */}
          <div
            className="absolute inset-0 pointer-events-none opacity-50 bg-repeat"
            style={{
              backgroundImage: "url('/templates/mot-thoi-de-nho/bg-vintage-paper.webp')",
              backgroundSize: "320px 320px",
            }}
          />

          {/* Chiếc phong thư Vintage ở trung tâm */}
          <div
            onClick={handleOpenCover}
            className={cn(
              "relative w-full max-w-[340px] sm:max-w-[380px] h-[480px] sm:h-[520px] rounded-2xl cursor-pointer shadow-[0_20px_50px_rgba(74,55,40,0.22)] transition-transform duration-300 [perspective:1000px]",
              envelopeStage === "closed" && "hover:scale-[1.015]",
            )}
            style={{
              backgroundColor: COLOR_CARD,
              border: "1px solid rgba(196, 164, 132, 0.4)",
            }}
          >
            {/* Cụm hoa ép góc trên trái phong thư */}
            <img
              src="/templates/mot-thoi-de-nho/pressed-flowers-corner-1.webp"
              alt="Hoa ép khô"
              className="absolute -top-3 -left-3 w-24 h-24 object-contain pointer-events-none z-10 opacity-90 drop-shadow-xs"
            />

            {/* Tem thư cổ dán nghiêng góc phải trên */}
            <div className="absolute top-3 right-3 z-10 rotate-[4deg] drop-shadow-sm">
              <img
                src="/templates/mot-thoi-de-nho/vintage-stamp-postmark.webp"
                alt="Tem thư cổ"
                className="w-20 h-auto object-contain pointer-events-none"
              />
            </div>

            {/* Lá thư kem bên trong trượt nhẹ lên trên khi mở */}
            <div
              className={cn(
                "absolute inset-x-4 sm:inset-x-5 top-16 bottom-12 rounded-xl pt-24 pb-6 px-4 sm:px-6 flex flex-col items-center justify-center text-center transition-all duration-600 ease-out z-15",
                (envelopeStage === "opening-card" || envelopeStage === "fading")
                  ? "-translate-y-16 scale-[1.03] shadow-xl"
                  : "translate-y-0 scale-100 opacity-95",
              )}
              style={{
                backgroundColor: "#FCF9F2",
                border: "1px dashed rgba(196, 164, 132, 0.6)",
              }}
            >
              <p
                className="text-xs uppercase tracking-[0.25em] text-[#8C6D53]"
                style={{ fontFamily: FONT_SERIF }}
              >
                Vintage Love Story
              </p>

              <h2
                className="mt-3 text-3xl sm:text-4xl leading-tight font-normal text-[#4A3728]"
                style={{ fontFamily: FONT_SCRIPT }}
              >
                {groomName} &amp; {brideName}
              </h2>

              <div className="mt-3 flex items-center gap-2 text-xs text-[#705642]">
                <span className="w-6 h-[1px] bg-[#C4A484]/60" />
                <span style={{ fontFamily: FONT_SERIF }}>{fullDateText}</span>
                <span className="w-6 h-[1px] bg-[#C4A484]/60" />
              </div>

              <div className="mt-5 flex flex-col items-center gap-1.5 text-xs text-[#7C3629]">
                <p
                  className="italic text-[13px] animate-pulse"
                  style={{ fontFamily: FONT_SCRIPT }}
                >
                  Chạm mở lá thư kỷ niệm
                </p>
                <span className="text-[10px] tracking-widest uppercase text-[#967B66]">
                  (Open Invitation)
                </span>
              </div>
            </div>

            {/* Nắp phong thư tam giác (Flap) có hiệu ứng lật mở 3D */}
            <div
              className={cn(
                "absolute inset-x-0 top-0 h-32 sm:h-36 origin-top transition-transform duration-500 ease-in-out z-20",
                envelopeStage !== "closed"
                  ? "[transform:rotateX(-180deg)] opacity-40"
                  : "[transform:rotateX(0deg)] opacity-100",
              )}
              style={{
                clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                backgroundColor: COLOR_CARD_ALT,
                boxShadow: "0 8px 16px rgba(74, 55, 40, 0.08)",
                borderBottom: "1px solid rgba(196, 164, 132, 0.4)",
              }}
            />

            {/* Con dấu sáp niêm phong ở mũi nắp thư */}
            <div
              className={cn(
                "absolute top-[108px] sm:top-[118px] left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-350",
                envelopeStage !== "closed"
                  ? "scale-75 opacity-0 -translate-y-4"
                  : "scale-100 opacity-100",
              )}
            >
              <img
                src="/templates/mot-thoi-de-nho/wax-seal-terracotta.webp"
                alt="Dấu sáp niêm phong"
                className="w-16 h-16 object-contain drop-shadow-[0_4px_10px_rgba(124,54,41,0.35)]"
              />
            </div>

            {/* Dải ren vải lanh dưới đáy phong thư */}
            <div className="absolute bottom-2 inset-x-4 z-25 flex justify-center opacity-75 pointer-events-none">
              <img
                src="/templates/mot-thoi-de-nho/lace-ribbon-divider.webp"
                alt="Dải ren cổ điển"
                className="w-full max-w-[260px] h-6 object-contain"
              />
            </div>

            {/* Cành lá khô góc dưới đối diện */}
            <img
              src="/templates/mot-thoi-de-nho/pressed-flowers-corner-2.webp"
              alt="Hoa ép khô"
              className="absolute -bottom-3 -right-3 w-20 h-20 object-contain pointer-events-none z-25 opacity-85 drop-shadow-xs"
            />
          </div>
        </div>
      )}

      {/* ============================================================
          2. NỘI DUNG THIỆP CHÍNH (SCRAPBOOK PAGES)
          ============================================================ */}
      <div
        className={cn(
          "mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12 relative z-10 flex flex-col space-y-16 sm:space-y-24",
          envelopeStage === "closed" && "pointer-events-none",
        )}
      >
        {/* ----------------------------------------------------------
            SECTION 1: SCRAPBOOK COVER HERO (Luôn hiển thị đầu tiên)
            ---------------------------------------------------------- */}
        <section style={{ order: -1 }} className="relative text-center pt-2 sm:pt-4">
          {/* Cụm hoa ép góc trên trái */}
          <img
            src="/templates/mot-thoi-de-nho/pressed-flowers-corner-1.webp"
            alt="Hoa ép khô góc"
            className="absolute -top-4 -left-2 w-28 sm:w-36 h-auto object-contain pointer-events-none z-20 opacity-90 drop-shadow-sm"
          />

          {/* Tem thư cổ góc trên phải nghiêng 4deg */}
          <div className="absolute top-0 right-1 sm:right-4 z-20 rotate-[4deg] drop-shadow-sm">
            <img
              src="/templates/mot-thoi-de-nho/vintage-stamp-postmark.webp"
              alt="Tem thư cổ LOVE POST"
              className="w-20 sm:w-24 h-auto object-contain pointer-events-none"
            />
          </div>

          {/* Cành hoa khô góc dưới phải đối xứng */}
          <img
            src="/templates/mot-thoi-de-nho/pressed-flowers-corner-2.webp"
            alt="Hoa cúc khô góc dưới"
            className="absolute -bottom-6 -right-2 w-24 sm:w-32 h-auto object-contain pointer-events-none z-20 opacity-85 drop-shadow-sm"
          />

          {/* Thẻ giấy Scrapbook chính */}
          <div
            className="relative mx-auto rounded-2xl p-6 sm:p-10 shadow-[0_12px_36px_rgba(74,55,40,0.12)] border border-[#C4A484]/40"
            style={{
              backgroundColor: COLOR_CARD,
            }}
          >
            {/* Lời tựa nhỏ */}
            <p
              className="text-xs uppercase tracking-[0.28em] text-[#8C6D53]"
              style={{ fontFamily: FONT_SERIF }}
            >
              Our Wedding Invitation
            </p>

            {/* Tên cặp đôi bằng nét chữ viết tay mềm mại */}
            <h1
              className="mt-4 text-4xl sm:text-6xl font-normal leading-tight text-[#4A3728]"
              style={{ fontFamily: FONT_SCRIPT }}
            >
              {groomName}
            </h1>

            <div className="my-1 text-2xl sm:text-3xl text-[#7C3629]" style={{ fontFamily: FONT_SCRIPT }}>
              &amp;
            </div>

            <h1
              className="text-4xl sm:text-6xl font-normal leading-tight text-[#4A3728]"
              style={{ fontFamily: FONT_SCRIPT }}
            >
              {brideName}
            </h1>

            {/* Ngày cưới & Thứ */}
            <div className="mt-5 inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#FAF6EC] border border-[#C4A484]/40 text-xs sm:text-sm text-[#5E493A]">
              <span className="font-medium" style={{ fontFamily: FONT_SERIF }}>
                {dateParts.weekday || "Thứ Bảy"}, {fullDateText}
              </span>
              {lunarText && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C4A484]" />
                  <span className="italic text-xs">{lunarText}</span>
                </>
              )}
            </div>

            {/* Khung ảnh bìa Hero Photo dán nghiêng nhẹ -1.5deg bằng 2 miếng washi tape */}
            <div className="relative mt-8 mx-auto max-w-[320px] sm:max-w-[360px]">
              {/* Băng keo washi tape góc trái trên */}
              <img
                src="/templates/mot-thoi-de-nho/washi-tape-beige.webp"
                alt="Washi tape"
                className="absolute -top-3.5 -left-4 w-20 h-auto z-30 -rotate-12 pointer-events-none drop-shadow-xs opacity-90"
              />

              {/* Băng keo washi tape góc phải trên */}
              <img
                src="/templates/mot-thoi-de-nho/washi-tape-beige.webp"
                alt="Washi tape"
                className="absolute -top-3.5 -right-4 w-20 h-auto z-30 rotate-12 pointer-events-none drop-shadow-xs opacity-90"
              />

              {/* Khung ảnh nghiêng nhẹ */}
              <div
                className="relative -rotate-[1.5deg] rounded-lg p-2.5 sm:p-3 bg-[#FFFFFF] shadow-md border border-[#E8DFC8] overflow-hidden"
              >
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-md bg-[#FAF6EC]">
                  <img
                    src={heroPhotoUrl}
                    alt={`${groomName} & ${brideName}`}
                    className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <p
                  className="mt-2 text-center text-xs sm:text-sm text-[#7A604D] italic"
                  style={{ fontFamily: FONT_SCRIPT }}
                >
                  "Chúng mình cùng nhau già đi nhé..."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------------
            SECTION 2: LỜI MỜI & HAI BÊN GIA ĐÌNH (family)
            ---------------------------------------------------------- */}
        {!hidden.has("family") && (
          <section style={{ order: orderOf("family") }} className="text-center space-y-6">
            <div className="flex justify-center">
              <img
                src="/templates/mot-thoi-de-nho/lace-ribbon-divider.webp"
                alt="Dải ren vải lanh"
                className="w-full max-w-xs h-6 object-contain pointer-events-none opacity-80"
              />
            </div>

            <div
              className="rounded-2xl p-6 sm:p-8 bg-[#FAF6EC] border border-[#C4A484]/40 shadow-sm relative overflow-hidden"
            >
              {/* Lời mời trân trọng mộc mạc */}
              <p
                className="text-xs uppercase tracking-[0.2em] text-[#8C6D53]"
                style={{ fontFamily: FONT_SERIF }}
              >
                Trân Trọng Kính Mời
              </p>

              <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#5E493A] max-w-lg mx-auto">
                Sự hiện diện và lời chúc phúc của Quý vị là niềm hạnh phúc trọn vẹn nhất cho chúng tôi trong ngày vui trọng đại này.
              </p>

              {/* Thông tin song thân hai bên (Hỗ trợ hostFirst: "bride") */}
              <div className="mt-8 pt-6 border-t border-[#C4A484]/30 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center">
                {/* Cột 1 */}
                {isBrideFirst ? (
                  /* Nhà Gái */
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#F5EFE2]/60">
                    <p
                      className="text-xs uppercase tracking-widest text-[#7C3629] font-medium"
                      style={{ fontFamily: FONT_SERIF }}
                    >
                      Nhà Gái
                    </p>
                    {brideParentsList.length > 0 ? (
                      brideParentsList.map((p, idx) => (
                        <p key={idx} className="text-sm font-medium text-[#4A3728]">
                          {p}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm font-medium text-[#4A3728]">
                        Gia Đình Cô Dâu
                      </p>
                    )}
                    <p className="text-xs text-[#8C6D53] italic pt-1">
                      Cô dâu: <span className="font-semibold text-[#4A3728]">{brideFullName}</span>
                    </p>
                  </div>
                ) : (
                  /* Nhà Trai */
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#F5EFE2]/60">
                    <p
                      className="text-xs uppercase tracking-widest text-[#7C3629] font-medium"
                      style={{ fontFamily: FONT_SERIF }}
                    >
                      Nhà Trai
                    </p>
                    {groomParentsList.length > 0 ? (
                      groomParentsList.map((p, idx) => (
                        <p key={idx} className="text-sm font-medium text-[#4A3728]">
                          {p}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm font-medium text-[#4A3728]">
                        Gia Đình Chú Rể
                      </p>
                    )}
                    <p className="text-xs text-[#8C6D53] italic pt-1">
                      Chú rể: <span className="font-semibold text-[#4A3728]">{groomFullName}</span>
                    </p>
                  </div>
                )}

                {/* Cột 2 */}
                {isBrideFirst ? (
                  /* Nhà Trai */
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#F5EFE2]/60">
                    <p
                      className="text-xs uppercase tracking-widest text-[#7C3629] font-medium"
                      style={{ fontFamily: FONT_SERIF }}
                    >
                      Nhà Trai
                    </p>
                    {groomParentsList.length > 0 ? (
                      groomParentsList.map((p, idx) => (
                        <p key={idx} className="text-sm font-medium text-[#4A3728]">
                          {p}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm font-medium text-[#4A3728]">
                        Gia Đình Chú Rể
                      </p>
                    )}
                    <p className="text-xs text-[#8C6D53] italic pt-1">
                      Chú rể: <span className="font-semibold text-[#4A3728]">{groomFullName}</span>
                    </p>
                  </div>
                ) : (
                  /* Nhà Gái */
                  <div className="space-y-1.5 p-3 rounded-xl bg-[#F5EFE2]/60">
                    <p
                      className="text-xs uppercase tracking-widest text-[#7C3629] font-medium"
                      style={{ fontFamily: FONT_SERIF }}
                    >
                      Nhà Gái
                    </p>
                    {brideParentsList.length > 0 ? (
                      brideParentsList.map((p, idx) => (
                        <p key={idx} className="text-sm font-medium text-[#4A3728]">
                          {p}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm font-medium text-[#4A3728]">
                        Gia Đình Cô Dâu
                      </p>
                    )}
                    <p className="text-xs text-[#8C6D53] italic pt-1">
                      Cô dâu: <span className="font-semibold text-[#4A3728]">{brideFullName}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------
            SECTION 3: CÂU CHUYỆN TÌNH YÊU (story - Standard & Pro only)
            ---------------------------------------------------------- */}
        {isStoryVisible && (
          <section style={{ order: orderOf("story") }} className="space-y-6">
            <div className="text-center">
              <p
                className="text-xs uppercase tracking-[0.25em] text-[#8C6D53]"
                style={{ fontFamily: FONT_SERIF }}
              >
                Love Story
              </p>
              <h2
                className="mt-1 text-3xl sm:text-4xl font-normal text-[#4A3728]"
                style={{ fontFamily: FONT_SCRIPT }}
              >
                Chuyện Chúng Mình
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              {storyMilestones.map((item: StoryMilestone, idx: number) => (
                <div
                  key={idx}
                  className={cn(
                    "relative rounded-xl p-5 sm:p-6 shadow-sm transition-transform duration-300 hover:scale-[1.01]",
                    idx % 2 === 0 ? "rotate-[-0.8deg]" : "rotate-[0.8deg]",
                  )}
                  style={{
                    backgroundImage: "url('/templates/mot-thoi-de-nho/kraft-note-card.webp')",
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  {/* Washi tape cố định mẩu giấy */}
                  <img
                    src="/templates/mot-thoi-de-nho/washi-tape-kraft.webp"
                    alt="Washi tape nâu"
                    className={cn(
                      "absolute -top-3 w-16 h-auto pointer-events-none drop-shadow-xs",
                      idx % 2 === 0 ? "left-4 -rotate-6" : "right-4 rotate-6",
                    )}
                  />

                  <div className="flex items-center gap-2">
                    {item.year ? (
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#7C3629] text-[#FAF6EC]"
                        style={{ fontFamily: FONT_SERIF }}
                      >
                        {item.year}
                      </span>
                    ) : null}
                    <h3
                      className="text-lg font-medium text-[#4A3728]"
                      style={{ fontFamily: FONT_SERIF }}
                    >
                      {item.title}
                    </h3>
                  </div>

                  <p className="mt-2.5 text-xs sm:text-sm leading-relaxed text-[#5E493A] italic">
                    &ldquo;{item.content}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------
            SECTION 4: ALBUM ẢNH KỶ NIỆM (album)
            ---------------------------------------------------------- */}
        {!hidden.has("album") && (
          <section style={{ order: orderOf("album") }} className="space-y-6">
            <div className="text-center">
              <p
                className="text-xs uppercase tracking-[0.25em] text-[#8C6D53]"
                style={{ fontFamily: FONT_SERIF }}
              >
                Memories &amp; Moments
              </p>
              <h2
                className="mt-1 text-3xl sm:text-4xl font-normal text-[#4A3728]"
                style={{ fontFamily: FONT_SCRIPT }}
              >
                Thước Phim Kỷ Niệm
              </h2>
            </div>

            {/* Grid Scrapbook với 4 kiểu khung */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              {/* KIỂU 1: KHUNG POLAROID 1 (Xoay nghiêng -2deg) */}
              {galleryPhotos[0] && (
                <div
                  onClick={() => setLightboxIndex(0)}
                  className="relative rounded-lg p-3 pb-8 bg-white shadow-md border border-[#E8DFC8] rotate-[-2deg] cursor-pointer transition-transform duration-300 hover:scale-[1.03] hover:z-20 group"
                >
                  <img
                    src="/templates/mot-thoi-de-nho/washi-tape-beige.webp"
                    alt="Washi tape"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-auto z-10 -rotate-2 pointer-events-none drop-shadow-xs"
                  />
                  <div className="aspect-[4/5] w-full overflow-hidden rounded bg-[#FAF6EC]">
                    <img
                      src={galleryPhotos[0].url}
                      alt={galleryPhotos[0].alt || "Kỷ niệm"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p
                    className="mt-3 text-center text-xs sm:text-sm text-[#7A604D] italic"
                    style={{ fontFamily: FONT_SCRIPT }}
                  >
                    {galleryPhotos[0].alt || "Ngày chung đôi"}
                  </p>
                </div>
              )}

              {/* KIỂU 1: KHUNG POLAROID 2 (Xoay nghiêng +1.5deg) */}
              {galleryPhotos[1] && (
                <div
                  onClick={() => setLightboxIndex(1)}
                  className="relative rounded-lg p-3 pb-8 bg-white shadow-md border border-[#E8DFC8] rotate-[1.5deg] cursor-pointer transition-transform duration-300 hover:scale-[1.03] hover:z-20 group"
                >
                  <img
                    src="/templates/mot-thoi-de-nho/washi-tape-beige.webp"
                    alt="Washi tape"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-auto z-10 rotate-3 pointer-events-none drop-shadow-xs"
                  />
                  <div className="aspect-[4/5] w-full overflow-hidden rounded bg-[#FAF6EC]">
                    <img
                      src={galleryPhotos[1].url}
                      alt={galleryPhotos[1].alt || "Kỷ niệm"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p
                    className="mt-3 text-center text-xs sm:text-sm text-[#7A604D] italic"
                    style={{ fontFamily: FONT_SCRIPT }}
                  >
                    {galleryPhotos[1].alt || "Một thời để nhớ"}
                  </p>
                </div>
              )}

              {/* KIỂU 2: KHUNG GIẤY XÉ KHÔNG ĐỀU (Torn Paper Mask) */}
              {galleryPhotos[2] && (
                <div
                  onClick={() => setLightboxIndex(2)}
                  className="relative rounded-xl p-3 bg-[#FAF6EC] shadow-sm border border-[#C4A484]/50 cursor-pointer transition-transform duration-300 hover:scale-[1.02] group"
                >
                  <img
                    src="/templates/mot-thoi-de-nho/washi-tape-kraft.webp"
                    alt="Washi tape nâu"
                    className="absolute -top-3 right-6 w-16 h-auto z-10 rotate-6 pointer-events-none drop-shadow-xs"
                  />
                  <div
                    className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-[#EDE3CE]"
                    style={{
                      boxShadow: "inset 0 0 10px rgba(74, 55, 40, 0.15)",
                    }}
                  >
                    <img
                      src={galleryPhotos[2].url}
                      alt={galleryPhotos[2].alt || "Kỷ niệm"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between px-1 text-xs text-[#8C6D53]">
                    <span className="italic" style={{ fontFamily: FONT_SCRIPT }}>
                      {galleryPhotos[2].alt || "Khoảnh khắc bình yên"}
                    </span>
                    <span style={{ fontFamily: FONT_SERIF }}>#03</span>
                  </div>
                </div>
              )}

              {/* KIỂU 3: KHUNG ALBUM CỔ 4 GÓC TAM GIÁC DA NÂU */}
              {galleryPhotos[3] && (
                <div
                  onClick={() => setLightboxIndex(3)}
                  className="relative rounded-xl p-4 bg-[#FCF9F2] shadow-sm border border-[#C4A484]/40 cursor-pointer transition-transform duration-300 hover:scale-[1.02] group"
                >
                  {/* 4 góc tam giác da giữ ảnh */}
                  <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-[#7C3629] z-10 pointer-events-none" />
                  <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-[#7C3629] z-10 pointer-events-none" />
                  <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-[#7C3629] z-10 pointer-events-none" />
                  <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-[#7C3629] z-10 pointer-events-none" />

                  <div className="aspect-[4/3] w-full overflow-hidden rounded bg-[#EDE3CE]">
                    <img
                      src={galleryPhotos[3].url}
                      alt={galleryPhotos[3].alt || "Kỷ niệm"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <p
                    className="mt-2.5 text-center text-xs text-[#7A604D] italic"
                    style={{ fontFamily: FONT_SCRIPT }}
                  >
                    {galleryPhotos[3].alt || "Ánh mắt trao nhau"}
                  </p>
                </div>
              )}
            </div>

            {/* KIỂU 4: DẢI ẢNH PHIM CỔ (FILM STRIP — 2-3 ảnh tiếp theo) */}
            {galleryPhotos.length > 4 && (
              <div className="pt-4">
                <div className="relative rounded-xl p-4 bg-[#3B2C22] shadow-md border border-[#2A1F18] overflow-hidden text-white">
                  {/* Dải lỗ phim trên */}
                  <div className="flex justify-between items-center pb-2.5 px-2 border-b border-[#5E493A]/40 overflow-hidden">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <span
                        key={i}
                        className="w-2.5 h-1.5 rounded-[2px] bg-[#EDE3CE]/80 shrink-0 mx-1"
                      />
                    ))}
                  </div>

                  {/* Danh sách 2 ảnh dải phim */}
                  <div className="grid grid-cols-2 gap-3 py-3">
                    {galleryPhotos.slice(4, 6).map((photo, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => setLightboxIndex(4 + pIdx)}
                        className="relative aspect-[3/2] overflow-hidden rounded bg-black/60 cursor-pointer group"
                      >
                        <img
                          src={photo.url}
                          alt={photo.alt || "Cuộn phim cổ"}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                        />
                        <span className="absolute bottom-1 right-1.5 px-1 rounded bg-black/70 text-[9px] font-mono text-[#E4D1A7]">
                          35mm · #{4 + pIdx + 1}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Dải lỗ phim dưới */}
                  <div className="flex justify-between items-center pt-2.5 px-2 border-t border-[#5E493A]/40 overflow-hidden">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <span
                        key={i}
                        className="w-2.5 h-1.5 rounded-[2px] bg-[#EDE3CE]/80 shrink-0 mx-1"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Lightbox Modal */}
            {lightboxIndex !== null && (
              <TemplateLightboxModal
                photos={galleryPhotos}
                activeIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
                onChangeIndex={(newIdx) => setLightboxIndex(newIdx)}
              />
            )}
          </section>
        )}

        {/* ----------------------------------------------------------
            SECTION 5: THÔNG TIN LỄ CƯỚI & ĐA LỄ (calendar)
            ---------------------------------------------------------- */}
        {!hidden.has("calendar") && (
          <section style={{ order: orderOf("calendar") }} className="space-y-6">
            <div className="text-center">
              <p
                className="text-xs uppercase tracking-[0.25em] text-[#8C6D53]"
                style={{ fontFamily: FONT_SERIF }}
              >
                Wedding Schedule
              </p>
              <h2
                className="mt-1 text-3xl sm:text-4xl font-normal text-[#4A3728]"
                style={{ fontFamily: FONT_SCRIPT }}
              >
                Thời Gian &amp; Địa Điểm
              </h2>
            </div>

            {/* Danh sách tất cả các lễ được mời (Đa Lễ) */}
            <div className="space-y-5 pt-2">
              {visibleEvents.map((evt: WeddingEvent, idx: number) => {
                const evtParts = formatWeddingDateParts(evt.startsAt);
                const evtFullDate = `${evtParts.day}/${evtParts.month}/${evtParts.year}`;
                const evtLunar = evt.lunarDate ? formatLunarDateClean(evt.lunarDate) : "";
                const directionsUrl = getEventDirectionsUrl(evt);

                return (
                  <div
                    key={evt.id || idx}
                    className="relative rounded-2xl p-6 sm:p-7 shadow-sm border border-[#C4A484]/50 transition-all duration-300 hover:shadow-md"
                    style={{
                      backgroundColor: COLOR_CARD,
                    }}
                  >
                    {/* Con dấu sáp nhỏ trang trí góc */}
                    <div className="absolute top-4 right-4 drop-shadow-xs">
                      <img
                        src="/templates/mot-thoi-de-nho/wax-seal-terracotta.webp"
                        alt="Dấu sáp"
                        className="w-10 h-10 object-contain opacity-85"
                      />
                    </div>

                    {/* Tên lễ */}
                    <h3
                      className="text-xl sm:text-2xl font-semibold text-[#7C3629] pr-12"
                      style={{ fontFamily: FONT_SERIF }}
                    >
                      {evt.title || (idx === 0 ? "Lễ Thành Hôn" : "Tiệc Cưới")}
                    </h3>

                    {/* Thời gian */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#4A3728]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-4 h-4 text-[#7C3629] shrink-0" />
                        <span>{evtParts.time || "11:00"}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="w-4 h-4 text-[#7C3629] shrink-0" />
                        <span>
                          {evtParts.weekday || "Thứ Bảy"}, {evtFullDate}
                        </span>
                      </div>
                    </div>

                    {evtLunar && (
                      <p className="mt-1 text-xs text-[#7A604D] italic pl-6">
                        (Tức ngày {evtLunar})
                      </p>
                    )}

                    {/* Địa điểm */}
                    <div className="mt-4 pt-3 border-t border-[#C4A484]/30 space-y-1">
                      <p className="font-semibold text-sm sm:text-base text-[#4A3728] flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 text-[#7C3629] shrink-0 mt-0.5" />
                        <span>{evt.venueName || "Tư gia"}</span>
                      </p>
                      {evt.venueAddress && (
                        <p className="text-xs sm:text-sm text-[#5E493A] pl-5.5 leading-relaxed">
                          {evt.venueAddress}
                        </p>
                      )}
                    </div>

                    {/* Nút chỉ đường Google Maps riêng cho từng lễ */}
                    {directionsUrl && (
                      <div className="mt-5 pl-5.5">
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#7C3629] text-white shadow-xs hover:bg-[#642A1F] transition-colors"
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>Chỉ đường Google Maps</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Lịch tháng cổ điển với vòng mực khoanh tròn ngày cưới */}
            <div
              className="rounded-2xl p-6 bg-[#FAF6EC] border border-[#C4A484]/40 shadow-xs text-center space-y-4"
            >
              <p
                className="text-xs uppercase tracking-widest text-[#8C6D53]"
                style={{ fontFamily: FONT_SERIF }}
              >
                Tháng {dateParts.month} Năm {dateParts.year}
              </p>

              <div className="grid grid-cols-7 gap-1 max-w-xs mx-auto text-xs text-[#5E493A]">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dayName) => (
                  <div key={dayName} className="font-medium py-1 text-[#8C6D53]">
                    {dayName}
                  </div>
                ))}

                {calendarDays.map((item, dIdx) => (
                  <div
                    key={dIdx}
                    className={cn(
                      "relative py-1.5 flex items-center justify-center font-medium",
                      !item.day && "opacity-0 pointer-events-none",
                      item.isWedding && "text-[#7C3629] font-bold",
                    )}
                  >
                    {item.day}
                    {item.isWedding && (
                      <svg
                        className="absolute inset-0 w-full h-full text-[#7C3629] pointer-events-none"
                        viewBox="0 0 36 36"
                        fill="none"
                      >
                        <circle
                          cx="18"
                          cy="18"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeDasharray="4 2"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-[#7A604D] italic pt-1" style={{ fontFamily: FONT_SCRIPT }}>
                "Hẹn gặp bạn trong ngày vui của chúng mình!"
              </p>
            </div>

            {/* Đồng hồ đếm ngược phong cách lịch xé cổ điển */}
            <div className="pt-2">
              <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto text-center">
                {[
                  { label: "Ngày", val: timeLeft.days },
                  { label: "Giờ", val: timeLeft.hours },
                  { label: "Phút", val: timeLeft.minutes },
                  { label: "Giây", val: timeLeft.seconds },
                ].map((box, bIdx) => (
                  <div
                    key={bIdx}
                    className="rounded-xl p-3 bg-white border border-[#C4A484]/40 shadow-xs"
                  >
                    <span
                      className="block text-2xl sm:text-3xl font-bold text-[#7C3629]"
                      style={{ fontFamily: FONT_SERIF }}
                    >
                      {String(box.val).padStart(2, "0")}
                    </span>
                    <span className="block text-[10px] uppercase tracking-wider text-[#8C6D53] mt-0.5">
                      {box.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------
            SECTION 6: HỘP QUÀ KỶ NIỆM (gift)
            ---------------------------------------------------------- */}
        {!hidden.has("gift") && (
          <section style={{ order: orderOf("gift") }} className="text-center space-y-4">
            <p
              className="text-xs uppercase tracking-[0.25em] text-[#8C6D53]"
              style={{ fontFamily: FONT_SERIF }}
            >
              Gift &amp; Wishes
            </p>
            <h2
              className="text-3xl sm:text-4xl font-normal text-[#4A3728]"
              style={{ fontFamily: FONT_SCRIPT }}
            >
              HỘP QUÀ
            </h2>

            <p className="text-xs sm:text-sm text-[#5E493A] max-w-md mx-auto leading-relaxed">
              Món quà ý nghĩa nhất là sự hiện diện của bạn. Nếu bạn muốn gửi lời chúc mừng từ xa, hãy chạm mở hộp quà kỷ niệm bên dưới nhé.
            </p>

            {/* Hộp quà 3 trạng thái căn giữa */}
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleGiftClick}
                disabled={isGiftOpening}
                className="relative group cursor-pointer focus:outline-none transition-transform duration-300 hover:scale-105 active:scale-95"
                aria-label="Mở hộp quà kỷ niệm mừng cưới"
              >
                <div className="relative w-44 sm:w-52 h-44 sm:h-52 flex items-center justify-center">
                  {giftBoxStage === "normal" && (
                    <img
                      src="/templates/mot-thoi-de-nho/gift-box-closed.webp"
                      alt="Hộp quà kỷ niệm giấy kraft"
                      className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 group-hover:rotate-1"
                    />
                  )}

                  {giftBoxStage === "glow" && (
                    <img
                      src="/templates/mot-thoi-de-nho/gift-box-opening.webp"
                      alt="Hộp quà đang hé mở"
                      className="w-full h-full object-contain drop-shadow-lg animate-pulse"
                    />
                  )}

                  {giftBoxStage === "open" && (
                    <img
                      src="/templates/mot-thoi-de-nho/gift-box-opened.webp"
                      alt="Hộp quà đã mở"
                      className="w-full h-full object-contain drop-shadow-xl"
                    />
                  )}
                </div>

                <span
                  className="mt-2 inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-[#7C3629] text-white shadow-xs"
                  style={{ fontFamily: FONT_SERIF }}
                >
                  Chạm gửi mừng cưới
                </span>
              </button>
            </div>

            {/* Modal Mừng Cưới */}
            <GiftModal
              open={giftModalOpen}
              onClose={handleCloseModal}
              gift={data.gift}
              plan={(data.plan as WeddingPlan) || "free"}
              coupleName={`${groomName} & ${brideName}`}
              guestName={guestName}
              tone="minbrown"
            />
          </section>
        )}

        {/* ----------------------------------------------------------
            SECTION 7: XÁC NHẬN THAM DỰ (rsvp)
            ---------------------------------------------------------- */}
        {!hidden.has("rsvp") && (
          <section style={{ order: orderOf("rsvp") }} className="space-y-4">
            <div className="text-center">
              <p
                className="text-xs uppercase tracking-[0.25em] text-[#8C6D53]"
                style={{ fontFamily: FONT_SERIF }}
              >
                Please RSVP
              </p>
              <h2
                className="text-3xl sm:text-4xl font-normal text-[#4A3728]"
                style={{ fontFamily: FONT_SCRIPT }}
              >
                XÁC NHẬN THAM DỰ
              </h2>
            </div>

            <div
              className="rounded-2xl p-6 sm:p-8 bg-[#FAF6EC] border border-[#C4A484]/40 shadow-sm relative overflow-hidden"
            >
              {/* Washi tape dán góc bưu thiếp RSVP */}
              <img
                src="/templates/mot-thoi-de-nho/washi-tape-beige.webp"
                alt="Washi tape"
                className="absolute -top-3 left-8 w-16 h-auto pointer-events-none drop-shadow-xs -rotate-6"
              />

              <TemplateRsvpSection
                data={data}
                mode={mode}
                tone="minbrown"
                customTheme={{
                  isDark: false,
                  wrap: "bg-transparent text-[#4A3728]",
                  heading: "text-[#7C3629]",
                  card: "bg-[#FAF6EC] border border-[#C4A484]/60 text-[#4A3728] shadow-xs",
                  input: "bg-[#FCF9F2] border border-[#C4A484]/50 text-[#4A3728] placeholder:text-[#8C6D53] focus:border-[#7C3629]",
                  primaryBtn: "bg-[#7C3629] text-white hover:bg-[#642A1F] font-semibold shadow-xs",
                  outlineBtn: "border border-[#C4A484] text-[#4A3728] hover:bg-[#C4A484]/15",
                  optionBg: "#FAF6EC",
                  optionColor: "#4A3728",
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

        {/* ----------------------------------------------------------
            SECTION 8: TRANG PHỤC & LỊCH TRÌNH (dresscode)
            ---------------------------------------------------------- */}
        {!hidden.has("dresscode") && (
          <section style={{ order: orderOf("dresscode") }} className="space-y-6 pt-2">
            {/* Lịch trình ngày cưới thật (nếu có mốc) */}
            {data.timeline && data.timeline.length > 0 && (
              <div className="space-y-4">
                <div className="text-center">
                  <p
                    className="text-xs uppercase tracking-[0.2em] text-[#8C6D53]"
                    style={{ fontFamily: FONT_SERIF }}
                  >
                    Wedding Schedule
                  </p>
                  <h3
                    className="text-2xl sm:text-3xl font-normal text-[#4A3728] mt-1"
                    style={{ fontFamily: FONT_SCRIPT }}
                  >
                    Lịch Trình Tiệc Cưới
                  </h3>
                </div>

                <div className="relative mx-auto max-w-md pl-6 sm:pl-8 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#C4A484]/50">
                  {data.timeline.map((step, idx) => (
                    <div key={step.id || idx} className="relative group">
                      <span className="absolute -left-[27px] sm:-left-[35px] top-2.5 h-3.5 w-3.5 rounded-full border-2 border-[#FAF6EC] bg-[#7C3629] shadow-xs" />
                      <div className="rounded-xl border border-[#C4A484]/40 bg-[#FAF6EC] p-3 sm:p-4 text-left shadow-2xs">
                        <span
                          className="text-xs font-bold text-[#7C3629] uppercase tracking-wider"
                          style={{ fontFamily: FONT_SERIF }}
                        >
                          {step.time}
                        </span>
                        <h4 className="text-sm sm:text-base font-medium text-[#4A3728] mt-0.5">
                          {step.label}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trang phục gợi ý */}
            {dressCodeSwatches.length > 0 && (
              <div className="text-center space-y-3 pt-2">
                <p
                  className="text-xs uppercase tracking-[0.2em] text-[#8C6D53]"
                  style={{ fontFamily: FONT_SERIF }}
                >
                  Trang Phục Gợi Ý
                </p>

                <div className="flex items-center justify-center gap-4 pt-1">
                  {dressCodeSwatches.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5">
                      <span
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shadow-xs border border-[#C4A484]/60 transition-transform hover:scale-110"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[11px] text-[#5E493A]">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ----------------------------------------------------------
            SECTION 9: GUEST ALBUM QR (albumQr)
            ---------------------------------------------------------- */}
        {!hidden.has("albumQr") && weddingSlug && (
          <section style={{ order: orderOf("albumQr") }} className="pt-4 flex justify-center">
            <GuestAlbumQr slug={weddingSlug} accentColor={COLOR_TERRACOTTA} />
          </section>
        )}

        {/* Footer lưu bút mộc mạc */}
        <footer
          style={{ order: 999 }}
          className="pt-8 pb-12 text-center text-xs text-[#8C6D53] border-t border-[#C4A484]/30 space-y-1"
        >
          <p className="italic text-sm text-[#4A3728]" style={{ fontFamily: FONT_SCRIPT }}>
            {groomName} &amp; {brideName}
          </p>
          <p>© {dateParts.year || "2027"} Một Thời Để Nhớ · Vintage Love Story</p>
        </footer>
      </div>
    </div>
  );
}
