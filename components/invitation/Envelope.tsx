"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { wedding } from "@/content/wedding";

interface EnvelopeProps {
  guestName?: string | null;
  onOpen: () => void;
}

const DOOR_EASE = [0.45, 0, 0.55, 1] as const;

function BotanicalLineArt() {
  return (
    <svg
      viewBox="0 0 500 844"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="h-full w-full text-inv-olive-deep/80"
    >
      {/* Mảng hoa bên trái vươn tới đường gấp giữa */}
      <g fill="var(--inv-paper)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* Cành lá nền bên trái */}
        <path
          d="M-12 458 C45 435, 92 412, 148 398"
          fill="none"
          strokeWidth="2.1"
        />
        <path
          d="M18 446 C34 410, 62 394, 72 415 C54 432, 34 440, 18 446 Z"
          strokeWidth="1.6"
        />
        <path
          d="M66 424 C74 388, 102 372, 114 394 C98 412, 80 420, 66 424 Z"
          strokeWidth="1.6"
        />
        <path
          d="M112 406 C130 374, 158 368, 168 386 C148 400, 128 406, 112 406 Z"
          strokeWidth="1.5"
        />
        <path
          d="M40 442 C46 474, 72 496, 86 474 C76 456, 58 444, 40 442 Z"
          strokeWidth="1.6"
        />
        <path
          d="M96 420 C110 454, 144 470, 156 446 C136 428, 114 420, 96 420 Z"
          strokeWidth="1.6"
        />

        {/* Đóa hoa lớn trái */}
        <g transform="translate(88 492) rotate(-14)">
          <path d="M0 0 C-28 -44, -68 -36, -62 6 C-56 36, -24 38, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C-10 -56, 38 -64, 48 -24 C56 4, 24 22, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C44 -28, 72 16, 40 42 C18 58, -4 34, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C22 46, -28 66, -42 32 C-52 10, -24 -4, 0 0 Z" strokeWidth="1.8" />
          <path d="M-26 -14 C-14 -8, -8 -4, -3 0 M18 -26 C12 -14, 6 -6, 2 0 M28 14 C16 10, 8 4, 2 0 M-14 26 C-8 16, -4 8, -1 2" fill="none" strokeWidth="1.1" />
          <circle cx="0" cy="0" r="6" fill="currentColor" strokeWidth="1.2" />
          <circle cx="-10" cy="-7" r="2" fill="currentColor" stroke="none" />
          <circle cx="9" cy="-9" r="2" fill="currentColor" stroke="none" />
          <circle cx="8" cy="9" r="2" fill="currentColor" stroke="none" />
        </g>

        {/* Đóa hoa vừa hướng về tâm */}
        <g transform="translate(174 366) rotate(12)">
          <path d="M0 0 C-26 -38, -56 -24, -48 12 C-42 36, -16 30, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C-6 -48, 38 -48, 44 -14 C48 10, 20 18, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C38 -18, 56 24, 26 40 C6 50, -6 26, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C12 40, -30 48, -36 18 C-40 2, -16 -6, 0 0 Z" strokeWidth="1.8" />
          <circle cx="0" cy="0" r="5" fill="currentColor" strokeWidth="1.2" />
        </g>

        {/* Nụ & cành lá vươn gần con dấu */}
        <path
          d="M148 398 C184 398, 214 408, 238 424"
          fill="none"
          strokeWidth="1.9"
        />
        <path
          d="M188 404 C202 382, 224 378, 232 394 C216 402, 200 406, 188 404 Z"
          strokeWidth="1.5"
        />
        <path
          d="M182 410 C186 436, 206 452, 222 440 C212 424, 198 414, 182 410 Z"
          strokeWidth="1.5"
        />
        {/* Thân rũ phía dưới bên trái */}
        <path
          d="M72 522 C52 562, 34 592, 16 626"
          fill="none"
          strokeWidth="1.8"
        />
        <path
          d="M44 568 C22 572, 6 594, 14 612 C32 602, 42 586, 44 568 Z"
          strokeWidth="1.5"
        />
        <path
          d="M52 556 C72 574, 80 598, 64 612 C52 596, 48 576, 52 556 Z"
          strokeWidth="1.5"
        />

        {/* Mảng hoa lily & nhành olive bên phải */}
        <path
          d="M512 412 C456 410, 398 416, 336 426"
          fill="none"
          strokeWidth="2.1"
        />
        <path
          d="M474 410 C456 376, 424 366, 412 388 C430 404, 452 412, 474 410 Z"
          strokeWidth="1.6"
        />
        <path
          d="M432 414 C420 384, 386 382, 376 404 C394 416, 414 418, 432 414 Z"
          strokeWidth="1.6"
        />
        <path
          d="M454 420 C442 454, 414 470, 400 448 C416 432, 434 422, 454 420 Z"
          strokeWidth="1.6"
        />
        <path
          d="M360 424 C346 446, 316 452, 302 436 C322 424, 342 420, 360 424 Z"
          strokeWidth="1.5"
        />

        {/* Hoa lily trên phải */}
        <g transform="translate(388 352) rotate(-18)">
          <path d="M0 0 C-16 -54, 16 -70, 26 -24 C30 -4, 14 10, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C-56 -22, -58 -62, -16 -56 C2 -52, 8 -20, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C-62 10, -48 52, -12 32 C6 22, 8 6, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C22 -48, 66 -32, 46 6 C34 28, 12 16, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C44 10, 42 54, 4 38 C-14 30, -8 10, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 L-22 -30 M0 0 L12 -34 M0 0 L24 -4" fill="none" strokeWidth="1.2" />
          <circle cx="-23" cy="-32" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="13" cy="-36" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="26" cy="-5" r="2.2" fill="currentColor" stroke="none" />
        </g>

        {/* Hoa lily lớn dưới phải hướng về mép giữa */}
        <g transform="translate(418 486) rotate(22)">
          <path d="M0 0 C-18 -58, 18 -72, 28 -22 C32 0, 14 12, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C-62 -20, -64 -62, -18 -58 C4 -54, 10 -20, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C-64 14, -48 56, -12 34 C8 22, 8 6, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C24 -50, 70 -34, 48 8 C36 30, 14 16, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 C46 12, 42 58, 4 40 C-14 32, -8 10, 0 0 Z" strokeWidth="1.8" />
          <path d="M0 0 L-24 -30 M0 0 L10 -36 M0 0 L26 -6" fill="none" strokeWidth="1.2" />
          <circle cx="-25" cy="-32" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="11" cy="-38" r="2.2" fill="currentColor" stroke="none" />
          <circle cx="28" cy="-7" r="2.2" fill="currentColor" stroke="none" />
        </g>

        {/* Nụ vươn sang đường gấp giữa ở phía phải */}
        <path
          d="M338 426 C306 426, 282 418, 258 408"
          fill="none"
          strokeWidth="1.7"
        />
        <path
          d="M286 418 C272 396, 254 396, 252 410 C264 418, 276 420, 286 418 Z"
          strokeWidth="1.5"
        />
      </g>
    </svg>
  );
}

export function Envelope({ guestName, onOpen }: EnvelopeProps) {
  const prefersReducedMotion = useReducedMotion();
  const [opening, setOpening] = React.useState(false);

  const displayName =
    guestName && guestName.trim().length > 0
      ? guestName.trim()
      : wedding.envelope.defaultGuestName;

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
    // Kích hoạt nhạc ngay trong sự kiện chạm để trình duyệt cho phép phát âm thanh
    onOpen();
  };

  return (
    <div
      className={
        opening
          ? "pointer-events-none fixed inset-y-0 left-1/2 z-50 h-dvh w-full max-w-[500px] -translate-x-1/2 overflow-hidden"
          : "fixed inset-y-0 left-1/2 z-50 h-dvh w-full max-w-[500px] -translate-x-1/2 overflow-hidden"
      }
      aria-label="Thiệp mời cưới"
    >
      {/* Cánh trái bất đối xứng (63.2%): 79.1139% là tờ giấy trái khớp đúng tâm 50%, phần thừa chứa con dấu sáp */}
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={
          opening
            ? prefersReducedMotion
              ? { opacity: 0 }
              : { x: "-105%" }
            : { x: "0%", opacity: 1 }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0.3, ease: "easeOut" }
            : { duration: 2.05, ease: DOOR_EASE }
        }
        className="pointer-events-none absolute inset-y-0 left-0 z-20 w-[63.2%] will-change-transform"
      >
        {/* Nửa giấy bên trái (50% màn hình = 79.1139% của cánh trái) */}
        <div
          className="relative h-full w-[79.1139%] overflow-hidden border-r border-inv-olive/20 bg-inv-paper shadow-[4px_0_18px_color-mix(in_srgb,var(--inv-olive-deep)_12%,transparent)]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--inv-bg) 70%, transparent) 0%, transparent 65%), repeating-linear-gradient(115deg, color-mix(in srgb, var(--inv-olive-deep) 1.4%, transparent) 0px, transparent 1px, transparent 3px)",
          }}
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[200%]">
            <BotanicalLineArt />
          </div>
        </div>

        {/* Con dấu sáp olive 3D vắt ngay trên đường mép giữa */}
        <div className="absolute top-1/2 left-[79.1139%] z-30 h-[96px] w-[96px] -translate-x-1/2 -translate-y-1/2 sm:h-[108px] sm:w-[108px]">
          <img
            src="/images/olive-wax-seal.webp"
            alt=""
            width={320}
            height={320}
            decoding="async"
            fetchPriority="high"
            aria-hidden="true"
            draggable={false}
            className="h-full w-full select-none object-contain drop-shadow-[2px_5px_10px_color-mix(in_srgb,var(--inv-olive-deep)_42%,transparent)]"
          />
        </div>
      </motion.div>

      {/* Cánh phải (50%) */}
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={
          opening
            ? prefersReducedMotion
              ? { opacity: 0 }
              : { x: "105%" }
            : { x: "0%", opacity: 1 }
        }
        transition={
          prefersReducedMotion
            ? { duration: 0.3, ease: "easeOut" }
            : { duration: 2.05, ease: DOOR_EASE }
        }
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-[50%] overflow-hidden bg-inv-paper will-change-transform"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 25%, color-mix(in srgb, var(--inv-bg) 70%, transparent) 0%, transparent 65%), repeating-linear-gradient(115deg, color-mix(in srgb, var(--inv-olive-deep) 1.4%, transparent) 0px, transparent 1px, transparent 3px)",
        }}
      >
        <div className="pointer-events-none absolute inset-y-0 right-0 w-[200%]">
          <BotanicalLineArt />
        </div>
      </motion.div>

      {/* Vùng chạm toàn màn hình, lời mời tên khách & dòng "Chạm để mở thiệp" ở đáy */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={opening}
        aria-label={`${wedding.envelope.tapHint} - ${wedding.envelope.invitePrefix} ${displayName}`}
        className="relative z-30 flex h-full w-full cursor-pointer flex-col items-center justify-between px-6 pt-[13dvh] pb-[6dvh] text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inv-olive-deep"
      >
        {/* Trân trọng kính mời {tên khách} đặt trang nhã ở khoảng trống phía trên */}
        <motion.div
          animate={opening ? { opacity: 0, y: -6 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="max-w-[340px] px-4 py-2"
        >
          <p className="font-inv-serif text-[11px] font-medium uppercase tracking-[0.26em] text-inv-text">
            {wedding.envelope.invitePrefix}
          </p>
          <p className="mt-2 font-inv-script text-[clamp(32px,9.5vw,44px)] leading-[1.15] text-inv-olive-deep">
            {displayName}
          </p>
        </motion.div>

        {/* Dòng "CHẠM ĐỂ MỞ THIỆP" nhấp nháy nhẹ ở đáy màn */}
        <motion.span
          animate={opening ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="w-full"
        >
          <span className="inline-block font-inv-serif text-[12px] tracking-[0.14em] uppercase text-inv-tap-hint [text-shadow:0_1px_4px_rgba(255,255,255,0.95),0_0_10px_rgba(255,255,255,0.85)] motion-safe:animate-[inv-tap-hint-pulse_2.4s_ease-in-out_infinite]">
            {wedding.envelope.tapHint}
          </span>
        </motion.span>
      </button>
    </div>
  );
}
