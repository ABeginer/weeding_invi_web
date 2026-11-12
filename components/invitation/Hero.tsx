"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatWeddingDateParts } from "@/lib/utils";
import { TemplatePhotoPlaceholder } from "@/templates/shared/TemplatePhotoPlaceholder";
import { useWeddingContent } from "./WeddingContentProvider";

interface HeroProps {
  guestName?: string | null;
}

export function Hero({ guestName }: HeroProps) {
  const data = useWeddingContent();
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = React.useState(false);
  const primaryEvent = data.events[0];
  const dateParts = React.useMemo(
    () => formatWeddingDateParts(primaryEvent?.startsAt ?? data.date),
    [primaryEvent?.startsAt, data.date],
  );

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const reducedMotion = mounted && Boolean(prefersReducedMotion);

  return (
    <section className="relative mx-auto w-full bg-inv-bg px-4 pt-10 pb-4 text-center sm:px-6 sm:pt-12 sm:pb-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0.01 }
            : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
        }
        className="space-y-4"
      >
        <p className="font-inv-serif text-xs font-medium uppercase tracking-[0.28em] text-inv-olive-btn">
          {data.ui.eyebrow}
        </p>

        {guestName && (
          <p className="inline-block rounded-full border border-inv-olive/30 bg-inv-tint px-4 py-1 font-inv-serif text-xs font-medium text-inv-ink">
            {data.ui.invitePrefix}:{" "}
            <strong className="font-semibold">{guestName}</strong>
          </p>
        )}

        <h1 className="font-inv-serif text-[clamp(30px,8vw,40px)] leading-[1.18] font-semibold tracking-tight text-inv-olive-deep">
          {data.couple.groomName}
          <span className="ml-1.5 mr-4 inline-block font-inv-script text-[1.12em] font-normal text-inv-olive-btn">
            &amp;
          </span>
          {data.couple.brideName}
        </h1>

        <p className="mx-auto max-w-md font-inv-serif text-sm leading-relaxed text-inv-text sm:text-[15px]">
          {data.ui.heroSubtitle}
        </p>

        <div className="inline-flex items-center gap-3 rounded-full border border-inv-olive/25 bg-inv-bg px-5 py-2 font-inv-serif text-xs font-medium tracking-[0.16em] text-inv-ink uppercase shadow-xs sm:text-sm">
          <span className="capitalize">{dateParts.weekday}</span>
          <span aria-hidden="true" className="text-inv-olive-btn">
            ·
          </span>
          <span>{dateParts.dotDate}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reducedMotion
            ? { duration: 0.01 }
            : { duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }
        }
        className="mx-auto mt-7 w-full max-w-[420px] overflow-hidden rounded-[28px] border border-inv-olive/30 bg-inv-bg p-2.5 shadow-[var(--shadow-soft)]"
      >
        <div className="overflow-hidden rounded-[20px] bg-inv-tint">
          {data.photos.heroUrl ? (
            <img
              src={data.photos.heroUrl}
              alt={data.photos.heroAlt}
              width={600}
              height={900}
              fetchPriority="high"
              className="block h-auto w-full object-cover"
            />
          ) : (
            <TemplatePhotoPlaceholder />
          )}
        </div>
      </motion.div>
    </section>
  );
}
