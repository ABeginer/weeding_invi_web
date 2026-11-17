"use client";

import * as React from "react";
import { motion, type Variants } from "framer-motion";
import { formatWeddingDateParts } from "@/lib/utils";
import { TemplatePhotoPlaceholder } from "@/templates/shared/TemplatePhotoPlaceholder";
import { useWeddingContent, useInvitationOpened } from "./WeddingContentProvider";

interface OliveGardenHeroProps {
  guestName?: string | null;
}

const OLIVE = "#586D40";

/**
 * Vườn Ô Liu — hero riêng, bố cục mobile làm chuẩn.
 * Desktop vẫn giữ đúng một cột, không chuyển sang grid 2 cột của Hero mặc định.
 */
const HERO_ITEM = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.5, ease: [0.22, 1, 0.36, 1] },
  },
} as const;

const HERO_PHOTO: Variants = {
  hidden: { opacity: 0, x: 0 },
  show: {
    opacity: 1,
    x: [0, -4, 4, -2, 2, 0],
    transition: {
      opacity: { duration: 1.5, ease: "easeOut" as const },
      x: { duration: 1.5, ease: "easeInOut" as const },
    },
  },
};

const HERO_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.16, delayChildren: 0.12 } },
} as const;

export function OliveGardenHero({ guestName }: OliveGardenHeroProps) {
  const data = useWeddingContent();
  const opened = useInvitationOpened();
  const primaryEvent = data.events[0];
  const dateParts = React.useMemo(
    () => formatWeddingDateParts(primaryEvent?.startsAt ?? data.date),
    [primaryEvent?.startsAt, data.date],
  );

  return (
    <motion.section
      data-guest={guestName ?? undefined}
      className="relative w-full overflow-hidden bg-[#F8F1EA] px-4 pb-10 pt-9 text-center sm:pb-14 sm:pt-12"
      style={{ color: "#2F3D20" }}
      variants={HERO_CONTAINER}
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
        <motion.p variants={HERO_ITEM} className="text-[11px] font-semibold uppercase tracking-[0.34em]" style={{ color: OLIVE }}>
          {data.ui.eyebrow || "SAVE THE DATE"}
        </motion.p>

        <motion.h1
          variants={HERO_ITEM}
          className="mt-5 flex w-full flex-col items-center leading-[1.08]"
          style={{
            color: OLIVE,
            fontFamily: "var(--font-playfair)",
            fontSize: "clamp(30px, 8vw, 44px)",
          }}
        >
          <span className="block max-w-full break-words">{data.couple.groomName}</span>
          <span className="my-1 block text-[0.48em] font-normal italic" style={{ color: "#6F7F52" }}>
            &amp;
          </span>
          <span className="block max-w-full break-words">{data.couple.brideName}</span>
        </motion.h1>

        <motion.p
          variants={HERO_ITEM}
          className="mt-4 max-w-[330px] text-sm leading-relaxed"
          style={{ color: "#5C6650" }}
        >
          {data.ui.heroSubtitle}
        </motion.p>

        <motion.div
          variants={HERO_ITEM}
          className="mt-5 inline-flex min-h-9 items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase"
          style={{ borderColor: "#C9D3B8", backgroundColor: "#FFFDF8", color: "#3F4D31" }}
        >
          <span className="capitalize">{dateParts.weekday}</span>
          <span style={{ color: "#8D9A78" }}>·</span>
          <span>{dateParts.dotDate}</span>
        </motion.div>

        <motion.div variants={HERO_PHOTO} className="relative mt-7 w-full max-w-[310px] pb-9 sm:max-w-[340px]">
          <div
            className="relative z-10 mx-auto w-full -rotate-[3.5deg] bg-white p-2.5 pb-10 shadow-[0_22px_40px_rgba(58,70,42,0.25)]"
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
        </motion.div>
      </div>
    </motion.section>
  );
}
