"use client";

import * as React from "react";
import { m, useReducedMotion, type Variants } from "motion/react";
import { formatWeddingDateParts } from "@/lib/utils";
import { TemplatePhotoPlaceholder } from "@/templates/shared/TemplatePhotoPlaceholder";
import { useWeddingContent, useInvitationOpened } from "./WeddingContentProvider";

interface OliveGardenHeroProps {
  guestName?: string | null;
}

const OLIVE = "#586D40";

/** Spring chung: vào chậm rãi, dừng mềm — cố ý dưới ngưỡng tới hạn để không nảy. */
const SPRING = { type: "spring", stiffness: 85, damping: 17, mass: 1.05 } as const;

const HERO_ITEM: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: SPRING },
};

/**
 * Polaroid: rơi nhẹ rồi nghiêng dần về -3,5° — đây là khoảnh khắc chính của
 * thiệp, nên nó chậm và mềm hơn các dòng chữ.
 */
const HERO_PHOTO: Variants = {
  hidden: { opacity: 0, y: -14, rotate: -8, scale: 1.06 },
  show: {
    opacity: 1,
    y: 0,
    rotate: -3.5,
    scale: 1,
    transition: { type: "spring", stiffness: 70, damping: 16, mass: 1.2 },
  },
};

/** Dấu "&" nảy nhẹ, đến trễ hơn tên — chi tiết nhỏ có chủ đích. */
const HERO_AMPERSAND: Variants = {
  hidden: { scale: 0.86 },
  show: { scale: 1, transition: { ...SPRING, delay: 0.5 } },
};

const HERO_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.08 } },
};

/** Giảm chuyển động: giữ nguyên thứ tự, bỏ hết transform và stagger. */
const REDUCED_ITEM: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.01 } },
};
const REDUCED_CONTAINER: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0, delayChildren: 0 } },
};

/**
 * Vườn Ô Liu — hero riêng, bố cục mobile làm chuẩn.
 * Desktop vẫn giữ đúng một cột, không chuyển sang grid 2 cột của Hero mặc định.
 */
export function OliveGardenHero({ guestName }: OliveGardenHeroProps) {
  const data = useWeddingContent();
  const opened = useInvitationOpened();
  const prefersReducedMotion = useReducedMotion();
  const reduce = Boolean(prefersReducedMotion);
  const containerVariants = reduce ? REDUCED_CONTAINER : HERO_CONTAINER;
  const itemVariants = reduce ? REDUCED_ITEM : HERO_ITEM;
  const photoVariants = reduce ? REDUCED_ITEM : HERO_PHOTO;
  const primaryEvent = data.events[0];
  const dateParts = React.useMemo(
    () => formatWeddingDateParts(primaryEvent?.startsAt ?? data.date),
    [primaryEvent?.startsAt, data.date],
  );

  return (
    <m.section
      data-guest={guestName ?? undefined}
      className="relative w-full overflow-hidden bg-[#F8F1EA] px-4 pb-10 pt-9 text-center sm:pb-14 sm:pt-12"
      style={{ color: "#2F3D20" }}
      variants={containerVariants}
      initial="hidden"
      animate={opened ? "show" : "hidden"}
    >
      {/* Green diagonal field behind the polaroid. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[43%]"
        style={{
          backgroundColor: OLIVE,
          clipPath: "polygon(0 38%, 100% 0, 100% 100%, 0 100%)",
        }}
      />



      <div className="relative z-10 mx-auto flex w-full max-w-[430px] flex-col items-center">
        <m.p variants={itemVariants} className="text-[11px] font-semibold uppercase tracking-[0.34em]" style={{ color: OLIVE }}>
          {data.ui.eyebrow || "SAVE THE DATE"}
        </m.p>

        <m.h1
          variants={itemVariants}
          className="mt-5 flex w-full flex-col items-center leading-[1.08]"
          style={{
            color: OLIVE,
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(30px, 8vw, 44px)",
          }}
        >
          <span className="block max-w-full break-words">{data.couple.groomName}</span>
          <m.span
            variants={reduce ? REDUCED_CONTAINER : HERO_AMPERSAND}
            className="my-1 block text-[0.48em] font-normal italic"
            style={{ color: "#6F7F52" }}
          >
            &amp;
          </m.span>
          <span className="block max-w-full break-words">{data.couple.brideName}</span>
        </m.h1>

        <m.p
          variants={itemVariants}
          className="mt-4 max-w-[330px] text-sm leading-relaxed"
          style={{ color: "#5C6650" }}
        >
          {data.ui.heroSubtitle}
        </m.p>

        <m.div
          variants={itemVariants}
          className="mt-5 inline-flex min-h-9 items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase"
          style={{ borderColor: "#C9D3B8", backgroundColor: "#FFFDF8", color: "#3F4D31" }}
        >
          <span className="capitalize">{dateParts.weekday}</span>
          <span style={{ color: "#8D9A78" }}>·</span>
          <span>{dateParts.dotDate}</span>
        </m.div>

        <m.div variants={photoVariants} className="relative mt-7 w-full max-w-[310px] pb-9 sm:max-w-[340px]">
          <div
            className="relative z-10 mx-auto w-full bg-white p-2.5 pb-10 shadow-[0_22px_40px_rgba(58,70,42,0.25)]"
            style={{ transformOrigin: "center" }}
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#E8E2D5]">
              {data.photos.heroUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.photos.heroUrl}
                  alt={data.photos.heroAlt}
                  className="h-full w-full object-cover"
                />
              ) : (
                <TemplatePhotoPlaceholder label="Ảnh cưới" className="h-full w-full" />
              )}
            </div>
            <p
              className="absolute bottom-3 left-0 right-0 text-center text-[8px] tracking-[0.26em]"
              style={{ color: "#7D705D" }}
            >
              OUR WEDDING
            </p>
          </div>
        </m.div>
      </div>
    </m.section>
  );
}
