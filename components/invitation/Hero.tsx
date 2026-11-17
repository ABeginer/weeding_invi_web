"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { TemplatePhotoPlaceholder } from "@/templates/shared/TemplatePhotoPlaceholder";
import { CoupleDisplayName } from "./CoupleDisplayName";
import { OliveGardenHero } from "./OliveGardenHero";
import {
  useInvitationContained,
  useInvitationDesktopLayout,
  useWeddingContent,
} from "./WeddingContentProvider";

interface HeroProps {
  guestName?: string | null;
}

export function Hero({ guestName }: HeroProps) {
  const data = useWeddingContent();
  const isContained = useInvitationContained();
  const isDesktopLayout = useInvitationDesktopLayout();
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

  if (data.templateId === "basic-1") {
    return <OliveGardenHero guestName={guestName} />;
  }

  return (
    <section
      className={cn(
        "relative mx-auto w-full bg-inv-bg text-center",
        isContained
          ? "px-3.5 pt-9 pb-3"
          : "px-4 pt-10 pb-4 sm:px-6 sm:pt-12 sm:pb-6",
        isDesktopLayout &&
        "md:grid md:grid-cols-12 md:items-center md:gap-8 md:px-8 md:pt-8 md:pb-8 md:text-left",
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reducedMotion
            ? { duration: 0.01 }
            : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
        }
        className={cn(isContained ? "space-y-3" : "space-y-4", isDesktopLayout && "md:col-span-6")}
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

        <CoupleDisplayName
          as={isContained ? "p" : "h1"}
          groomName={data.couple.groomName}
          brideName={data.couple.brideName}
          className={cn(
            "font-inv-serif font-semibold tracking-tight text-inv-olive-deep",
            isContained
              ? "text-[clamp(24px,9cqw,34px)] leading-[1.15]"
              : "text-[clamp(30px,8vw,40px)] leading-[1.18]",
            isDesktopLayout && "md:text-[clamp(32px,3.6vw,44px)] md:leading-[1.12]",
          )}
          inlineAmpersandClassName="font-inv-script text-[1.12em] not-italic font-normal text-inv-olive-btn"
          stackedAmpersandClassName="font-inv-script text-[0.95em] not-italic font-normal text-inv-olive-btn"
        />

        <p
          className={cn(
            "max-w-md font-inv-serif text-sm leading-relaxed text-inv-text sm:text-[15px]",
            isContained && "text-[13px]",
            isDesktopLayout ? "mx-auto md:mx-0 md:text-base" : "mx-auto",
          )}
        >
          {data.ui.heroSubtitle}
        </p>

        <div
          className={cn(
            "inline-flex items-center gap-2.5 rounded-full border border-inv-olive/25 bg-inv-bg font-inv-serif font-medium tracking-[0.16em] text-inv-ink uppercase shadow-xs",
            isContained ? "px-4 py-1.5 text-[11px]" : "px-5 py-2 text-xs sm:text-sm",
          )}
        >
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
        className={cn(
          "mx-auto w-full overflow-hidden rounded-[26px] border border-inv-olive/30 bg-inv-bg p-2 shadow-[var(--shadow-soft)]",
          isContained ? "mt-5 max-w-[320px]" : "mt-7 max-w-[420px] p-2.5",
          isDesktopLayout && "md:col-span-6 md:mt-0 md:max-w-[350px]",
        )}
      >
        <div className="overflow-hidden rounded-[20px] bg-inv-tint">
          {data.photos.heroUrl ? (
            <img
              src={data.photos.heroUrl}
              alt={data.photos.heroAlt}
              width={600}
              height={900}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className={cn(
                "hero-photo-scale block aspect-[3/4] w-full object-cover",
                isDesktopLayout && "md:aspect-[3/4] md:object-[center_20%]",
              )}
            />
          ) : (
            <TemplatePhotoPlaceholder />
          )}
        </div>
      </motion.div>
    </section>
  );
}
