"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarHeart, MapPin } from "lucide-react";
import { CoupleDisplayName } from "@/components/invitation/CoupleDisplayName";
import { GiftModal } from "@/components/invitation/GiftModal";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateGiftSection } from "../shared/TemplateGiftSection";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { padCountdownUnit, useWeddingCountdown } from "../shared/useCountdown";
import type { WeddingTemplateProps } from "../types";

export default function Basic3Template({
  data,
  mode,
  contained = false,
  viewport = "phone",
  isOpened: isOpenedProp = false,
  onOpenedChange,
  inviteSlug,
  weddingSlug,
  invitationMode = "personal",
  guestName,
  initialStatus = "pending",
  initialPlusOnes = 0,
  initialDiet = null,
  initialSongRequest = null,
  initialRideNeeded = false,
  externalMusicControl,
}: WeddingTemplateProps) {
  const prefersReducedMotion = useReducedMotion();
  const [opened, setOpened] = React.useState(isOpenedProp);
  const [coverDismissed, setCoverDismissed] = React.useState(isOpenedProp);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [giftOpen, setGiftOpen] = React.useState(false);

  React.useEffect(() => {
    setOpened(isOpenedProp);
    if (!isOpenedProp) {
      setCoverDismissed(false);
    }
  }, [isOpenedProp]);

  const primaryEvent = data.events[0];
  const heroDate = React.useMemo(
    () => formatWeddingDateParts(primaryEvent?.startsAt ?? data.date),
    [primaryEvent?.startsAt, data.date],
  );
  const countdown = useWeddingCountdown(primaryEvent?.startsAt ?? data.date);

  const displayGuest =
    guestName && guestName.trim().length > 0
      ? guestName.trim()
      : data.ui.defaultGuestName;

  const isDesktopLayout = viewport === "desktop" && !contained;
  const photos = data.photos.gallery;
  const hasFamilies = Boolean(data.couple.groomParents || data.couple.brideParents);

  const handleOpen = () => {
    setOpened(true);
    onOpenedChange?.(true);
  };

  return (
    <div
      className={cn(
        "relative w-full bg-[#FCF5F0] text-[#322424] font-sans",
        contained ? "min-h-full" : "min-h-screen-dvh",
        !coverDismissed &&
        (contained
          ? "h-full overflow-hidden"
          : "h-screen-dvh max-h-full overflow-hidden"),
      )}
    >
      <AnimatePresence
        onExitComplete={() => {
          setCoverDismissed(true);
          if (!contained && typeof window !== "undefined") {
            window.scrollTo({ top: 0, behavior: "auto" });
          }
        }}
      >
        {!opened && (
          <motion.div
            key="basic3-cover"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.2 : 0.6 }}
            className={cn(
              "z-30 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F4DFD5] via-[#FBF1EA] to-[#EFE1D6] p-5",
              contained
                ? "absolute inset-0"
                : cn(
                  "fixed inset-y-0 left-1/2 w-full -translate-x-1/2",
                  isDesktopLayout
                    ? "max-w-[960px] md:border-x md:border-[#D7B3A5]/45 md:shadow-[0_12px_40px_rgba(122,53,53,0.1)]"
                    : "max-w-[460px]",
                ),
              opened && "pointer-events-none",
            )}
          >
            <motion.button
              type="button"
              onClick={handleOpen}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 1.03 }
              }
              transition={{ duration: prefersReducedMotion ? 0.2 : 0.5 }}
              aria-label={`${data.ui.tapHint} - ${data.ui.invitePrefix} ${displayGuest}`}
              className={cn(
                "group relative flex h-full w-full cursor-pointer flex-col items-center justify-between rounded-t-full rounded-b-3xl border border-[#CFA89A] bg-[#FFFBF8] text-center shadow-[0_20px_50px_rgba(122,53,53,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A3535]",
                isDesktopLayout ? "max-w-[440px]" : "max-w-[380px]",
                contained ? "max-h-[560px] px-5 pt-10 pb-7" : "max-h-[660px] px-6 pt-14 pb-9",
              )}
            >
              <div className="space-y-1.5">
                <p className="text-[11px] font-medium tracking-[0.22em] text-[#8A4444] uppercase">
                  {data.ui.eyebrow}
                </p>
                <CoupleDisplayName
                  as="h2"
                  groomName={data.couple.groomName}
                  brideName={data.couple.brideName}
                  className={cn(
                    "font-display font-semibold text-[#5C2626]",
                    contained ? "text-2xl" : "text-3xl",
                  )}
                  inlineAmpersandClassName="text-[#8A4444]"
                />
              </div>

              <div className="space-y-2.5">
                <div
                  className={cn(
                    "mx-auto flex items-center justify-center rounded-full bg-[#7A3535] font-display font-semibold text-[#FFF8F4] shadow-md",
                    contained ? "h-14 w-14 text-lg" : "h-16 w-16 text-xl",
                  )}
                >
                  {data.couple.sealLabel}
                </div>
                <p className="text-[11px] tracking-[0.18em] text-[#7D5E57] uppercase">
                  {data.ui.invitePrefix}
                </p>
                <p
                  className={cn(
                    "font-display italic text-[#5C2626]",
                    contained ? "text-xl" : "text-2xl",
                  )}
                >
                  {displayGuest}
                </p>
              </div>

              <span className="inline-flex h-10 items-center rounded-full bg-[#7A3535] px-6 text-xs font-medium tracking-[0.12em] text-white uppercase transition-colors group-hover:bg-[#612828]">
                {data.ui.tapHint}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "mx-auto w-full overflow-x-clip bg-[#FCF5F0]",
          isDesktopLayout ? "max-w-[960px]" : "max-w-[460px]",
          !coverDismissed &&
          (contained
            ? "h-full overflow-hidden"
            : "h-screen-dvh overflow-hidden"),
        )}
      >
        {/* Hero */}
        <header
          className={cn(
            "bg-gradient-to-b from-[#F5E0D5] to-[#FCF5F0] text-center",
            contained ? "px-3.5 pt-9 pb-6" : "px-5 pt-10 pb-8 sm:px-8",
            isDesktopLayout &&
            "md:grid md:grid-cols-12 md:items-center md:gap-8 md:px-8 md:pt-8 md:pb-9 md:text-left",
          )}
        >
          <div className={cn(isDesktopLayout ? "md:col-span-6 space-y-3.5" : "space-y-3")}>
            <p className="text-[11px] font-medium tracking-[0.22em] text-[#8A4444] uppercase">
              {data.ui.eyebrow} · {heroDate.dotDate}
            </p>
            <CoupleDisplayName
              as="h1"
              groomName={data.couple.groomName}
              brideName={data.couple.brideName}
              className={cn(
                "font-display leading-[1.1] font-semibold text-[#5C2626]",
                contained
                  ? "text-[clamp(24px,9cqw,34px)]"
                  : isDesktopLayout
                    ? "text-[clamp(32px,3.6vw,44px)]"
                    : "text-[clamp(32px,9vw,48px)]",
              )}
              inlineAmpersandClassName="text-[#8A4444]"
            />
            <p
              className={cn(
                "max-w-md text-sm leading-relaxed text-[#6B504B]",
                isDesktopLayout ? "mx-auto md:mx-0" : "mx-auto",
              )}
            >
              {data.ui.heroSubtitle}
            </p>
            {guestName && (
              <p className="inline-block rounded-full border border-[#D7B3A5] bg-[#FFFBF8] px-4 py-1 text-xs text-[#5C2626]">
                {data.ui.invitePrefix}: <strong className="font-semibold">{guestName}</strong>
              </p>
            )}
          </div>

          <div className={cn("mt-5", isDesktopLayout && "md:col-span-6 md:mt-0")}>
            <div
              className={cn(
                "mx-auto overflow-hidden rounded-t-full border-2 border-[#D7B3A5] bg-white p-2 shadow-sm",
                isDesktopLayout ? "max-w-[300px] md:max-w-[340px] md:p-2.5" : "max-w-[290px]",
              )}
            >
              <div className="overflow-hidden rounded-t-full bg-[#F5E0D5]/40">
                {data.photos.heroUrl ? (
                  <img
                    src={data.photos.heroUrl}
                    alt={data.photos.heroAlt}
                    width={600}
                    height={800}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="block aspect-[3/4] w-full rounded-t-full object-cover object-[center_20%]"
                  />
                ) : (
                  <TemplatePhotoPlaceholder />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Quote & Families & Couple */}
        <section className={cn("text-center", contained ? "px-3.5 py-7" : "px-5 py-8 sm:px-8")}>
          {data.quote && (
            <p
              className={cn(
                "mx-auto max-w-[520px] rounded-2xl border border-[#E7CFC3] bg-white px-4 py-4 font-display leading-relaxed italic text-[#5C2626]",
                contained ? "text-base" : "px-5 py-5 text-lg sm:text-xl",
              )}
            >
              “{data.quote}”
            </p>
          )}

          {hasFamilies && (
            <div
              className={cn(
                "mx-auto mt-7 grid max-w-[680px] grid-cols-2",
                contained ? "gap-2.5" : "gap-3 sm:gap-6",
              )}
            >
              <div className={cn("min-w-0 rounded-2xl border border-[#E7CFC3] bg-white", contained ? "p-3" : "p-4")}>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8A4444] uppercase">
                  NHÀ TRAI
                </p>
                <p
                  className={cn(
                    "mt-1.5 font-medium text-[#322424] break-words",
                    contained ? "text-xs" : "text-xs sm:text-sm",
                  )}
                >
                  {data.couple.groomParents || "Gia đình nhà trai"}
                </p>
              </div>
              <div className={cn("min-w-0 rounded-2xl border border-[#E7CFC3] bg-white", contained ? "p-3" : "p-4")}>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8A4444] uppercase">
                  NHÀ GÁI
                </p>
                <p
                  className={cn(
                    "mt-1.5 font-medium text-[#322424] break-words",
                    contained ? "text-xs" : "text-xs sm:text-sm",
                  )}
                >
                  {data.couple.brideParents || "Gia đình nhà gái"}
                </p>
              </div>
            </div>
          )}

          <div
            className={cn(
              "mx-auto mt-6 grid max-w-[680px] grid-cols-2",
              contained ? "gap-2.5" : "gap-3 sm:gap-6",
            )}
          >
            {[
              {
                label: "CHÚ RỂ",
                fullName: data.couple.groomFullName,
                photoUrl: data.photos.groomUrl,
              },
              {
                label: "CÔ DÂU",
                fullName: data.couple.brideFullName,
                photoUrl: data.photos.brideUrl,
              },
            ].map((person) => (
              <div
                key={person.label}
                className="min-w-0 overflow-hidden rounded-2xl border border-[#E7CFC3] bg-white"
              >
                {person.photoUrl ? (
                  <img
                    src={person.photoUrl}
                    alt={`${person.label} ${person.fullName}`}
                    width={480}
                    height={640}
                    loading="lazy"
                    decoding="async"
                    className="block aspect-[3/4] w-full object-cover object-[center_20%]"
                  />
                ) : (
                  <TemplatePhotoPlaceholder />
                )}
                <div className="p-2.5 text-center sm:p-3">
                  <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8A4444] uppercase">
                    {person.label}
                  </p>
                  <p
                    className={cn(
                      "mt-0.5 font-display font-semibold text-[#5C2626] break-words",
                      contained ? "text-base" : "text-lg",
                    )}
                  >
                    {person.fullName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Events & Countdown */}
        <section className={cn("text-center", contained ? "px-3.5 py-7" : "px-5 py-8 sm:px-8")}>
          <div
            className={cn(
              "mx-auto max-w-[780px] rounded-3xl border border-[#E7CFC3] bg-white",
              contained ? "p-4" : "p-5 sm:p-8",
            )}
          >
            <CalendarHeart className="mx-auto h-5 w-5 text-[#7A3535]" aria-hidden="true" />
            <h2
              className={cn(
                "mt-2 font-display font-semibold text-[#5C2626]",
                contained ? "text-2xl" : "text-3xl",
              )}
            >
              {data.ui.eventsTitle}
            </h2>

            {data.events.length === 0 ? (
              <div className="mx-auto mt-6 max-w-[420px] rounded-2xl border border-dashed border-[#D7B3A5] bg-[#FCF5F0] px-5 py-7 text-center">
                <p className="text-sm text-[#6B504B]">Thêm lễ để hiển thị</p>
              </div>
            ) : (
              <div
                className={cn(
                  "mx-auto mt-6 grid gap-4",
                  isDesktopLayout && data.events.length > 1
                    ? "max-w-[820px] grid-cols-1 md:grid-cols-2"
                    : "max-w-[460px] grid-cols-1",
                )}
              >
                {data.events.map((evt, idx) => {
                  const parts = formatWeddingDateParts(evt.startsAt);
                  return (
                    <article
                      key={evt.id || `${evt.title}-${idx}`}
                      className="rounded-2xl bg-[#FCF5F0] p-4 text-center"
                    >
                      <h3 className="font-display text-xl font-semibold text-[#7A3535]">
                        {evt.title}
                      </h3>
                      <p className="mt-1 text-xs font-semibold tracking-[0.12em] text-[#5C2626] uppercase">
                        {parts.time} · {parts.weekday} · {parts.dotDate}
                      </p>
                      {evt.lunarDate && (
                        <p className="mt-0.5 text-xs italic text-[#6B504B]">
                          ({evt.lunarDate})
                        </p>
                      )}
                      <p className="mt-2.5 text-sm font-semibold text-[#322424]">
                        {evt.venueName}
                      </p>
                      {evt.venueAddress && (
                        <p className="mt-1 text-xs text-[#6B504B]">{evt.venueAddress}</p>
                      )}
                      {evt.mapDirectionsUrl && (
                        <div className="mt-3">
                          <a
                            href={evt.mapDirectionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center gap-1 rounded-full bg-[#7A3535] px-4 text-[11px] font-medium tracking-[0.08em] text-white uppercase hover:bg-[#612828]"
                          >
                            <MapPin className="h-3 w-3" aria-hidden="true" />
                            <span>{data.ui.directionsButtonLabel}</span>
                          </a>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}

            {countdown && !countdown.finished && (
              <div className="mx-auto mt-6 grid max-w-[360px] grid-cols-4 gap-2">
                {[
                  { label: "Ngày", value: String(countdown.days) },
                  {
                    label: "Giờ",
                    value: padCountdownUnit(countdown.hours),
                  },
                  {
                    label: "Phút",
                    value: padCountdownUnit(countdown.minutes),
                  },
                  {
                    label: "Giây",
                    value: padCountdownUnit(countdown.seconds),
                  },
                ].map((unit) => (
                  <div key={unit.label} className="rounded-xl bg-[#FCF5F0] py-2">
                    <p className="font-display text-2xl font-semibold tabular-nums text-[#7A3535]">
                      {unit.value}
                    </p>
                    <p className="text-[11px] text-[#6B504B]">{unit.label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Gallery */}
        <section className={cn("text-center", contained ? "px-3.5 py-7" : "px-5 py-8 sm:px-8")}>
          <h2
            className={cn(
              "font-display font-semibold text-[#5C2626]",
              contained ? "text-2xl" : "text-3xl",
            )}
          >
            {data.ui.galleryTitle}
          </h2>
          <p className="mt-1 text-xs text-[#6B504B]">{data.ui.gallerySubtitle}</p>

          {photos.length === 0 ? (
            <div className="mx-auto mt-5 max-w-[320px] overflow-hidden rounded-2xl border border-[#E7CFC3] bg-white p-1">
              <TemplatePhotoPlaceholder className="aspect-[4/3] rounded-xl" />
            </div>
          ) : (
            <div
              className={cn(
                "mx-auto mt-5 grid gap-2.5",
                isDesktopLayout ? "grid-cols-2 md:grid-cols-3 md:gap-4" : "grid-cols-2",
              )}
            >
              {photos.map((photo, index) => (
                <button
                  key={photo.id || `${photo.url}-${index}`}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={`Xem ảnh ${index + 1}: ${photo.alt}`}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E7CFC3] bg-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A3535]"
                >
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    width={600}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    className="block aspect-[3/4] w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* RSVP & Wishes */}
        <TemplateRsvpSection
          data={data}
          mode={mode}
          tone="sunset"
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

        {/* Gift (sau khi xác nhận) */}
        <TemplateGiftSection
          tone="sunset"
          contained={contained}
          onOpenGift={() => setGiftOpen(true)}
        />

        {contained ? (
          <div className="bg-gradient-to-t from-[#5C2626] to-[#7A3535] px-5 py-10 text-center text-[#FFF8F4]">
            <p className="font-display text-3xl italic">
              {data.ui.thankYouTitle}
            </p>
            <p className="mx-auto mt-2 max-w-[380px] text-xs leading-relaxed text-[#F5DDD4]">
              {data.ui.thankYouBody}
            </p>
            <p className="mt-4 text-[11px] tracking-[0.2em] text-[#F2CFC2] uppercase">
              {data.ui.signature}
            </p>
          </div>
        ) : (
          <footer className="bg-gradient-to-t from-[#5C2626] to-[#7A3535] px-5 py-10 text-center text-[#FFF8F4]">
            <p className="font-display text-3xl italic">
              {data.ui.thankYouTitle}
            </p>
            <p className="mx-auto mt-2 max-w-[380px] text-xs leading-relaxed text-[#F5DDD4]">
              {data.ui.thankYouBody}
            </p>
            <p className="mt-4 text-[11px] tracking-[0.2em] text-[#F2CFC2] uppercase">
              {data.ui.signature}
            </p>
          </footer>
        )}
      </div>

      <TemplateLightboxModal
        photos={photos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />

      <GiftModal
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        gift={data.gift}
        plan={data.plan}
        coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
        guestName={guestName}
        tone="sunset"
        wishAnchorId="rsvp-wishes"
      />

      {mode === "live" && !externalMusicControl && (
        <LiveMusicFloatingButton
          src={data.music.src}
          title={data.music.title}
          visible={opened}
          tone="sunset"
        />
      )}
    </div>
  );
}
