"use client";

import * as React from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { Heart, MailOpen, MapPin } from "lucide-react";
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

export default function Basic2Template({
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
        "relative w-full bg-[#FAF7F0] text-[#1F1D1A] font-sans",
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
          <m.div
            key="basic2-cover"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
            className={cn(
              "z-30 flex items-center justify-center overflow-hidden bg-[#FAF7F0] p-5",
              contained
                ? "absolute inset-0"
                : cn(
                  "fixed inset-y-0 left-1/2 w-full -translate-x-1/2",
                  isDesktopLayout
                    ? "max-w-[960px] md:border-x md:border-[#C6A962]/25 md:shadow-[0_12px_40px_rgba(31,29,26,0.08)]"
                    : "max-w-[460px]",
                ),
              opened && "pointer-events-none",
            )}
          >
            <m.button
              type="button"
              onClick={handleOpen}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -24 }
              }
              transition={{
                duration: prefersReducedMotion ? 0.2 : 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              aria-label={`${data.ui.tapHint} - ${data.ui.invitePrefix} ${displayGuest}`}
              className={cn(
                "group relative flex h-full w-full cursor-pointer flex-col items-center justify-between border border-[#C6A962] bg-white text-center shadow-[0_18px_45px_rgba(31,29,26,0.08)] transition-colors hover:border-[#9E803B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#706040]",
                isDesktopLayout ? "max-w-[440px]" : "max-w-[380px]",
                contained ? "max-h-[560px] px-5 py-7" : "max-h-[660px] px-6 py-10",
              )}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-2.5 border border-[#E5DCCB]"
              />
              <div className="relative space-y-2 pt-2">
                <p className="text-[11px] font-medium tracking-[0.22em] text-[#706040] uppercase">
                  {data.ui.eyebrow}
                </p>
                <p className="text-xs tracking-[0.14em] text-[#5E574B] uppercase">
                  {heroDate.dotDate}
                </p>
              </div>

              <div className="relative space-y-2.5 py-3">
                <div
                  className={cn(
                    "mx-auto flex items-center justify-center rounded-full border border-[#C6A962] bg-[#FAF7F0] font-display font-semibold text-[#5E4D2B]",
                    contained ? "h-16 w-16 text-xl" : "h-20 w-20 text-2xl",
                  )}
                >
                  {data.couple.sealLabel}
                </div>
                <CoupleDisplayName
                  as="h2"
                  groomName={data.couple.groomName}
                  brideName={data.couple.brideName}
                  className={cn(
                    "font-display font-semibold text-[#1F1D1A]",
                    contained ? "text-2xl" : "text-3xl",
                  )}
                  inlineAmpersandClassName="text-[#8A7344]"
                />
                <div className="pt-1.5">
                  <p className="text-[11px] tracking-[0.18em] text-[#665E52] uppercase">
                    {data.ui.invitePrefix}
                  </p>
                  <p
                    className={cn(
                      "mt-1 font-display italic text-[#1F1D1A]",
                      contained ? "text-xl" : "text-2xl",
                    )}
                  >
                    {displayGuest}
                  </p>
                </div>
              </div>

              <span className="relative inline-flex items-center gap-2 rounded-full border border-[#C6A962] bg-[#FAF7F0] px-5 py-2 text-xs font-medium tracking-[0.14em] text-[#3F3626] uppercase transition-colors group-hover:bg-[#EFEAE0]">
                <MailOpen className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{data.ui.tapHint}</span>
              </span>
            </m.button>
          </m.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "mx-auto w-full overflow-x-clip bg-[#FAF7F0]",
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
            "text-center",
            contained ? "px-3.5 pt-9 pb-6" : "px-5 pt-10 pb-8",
            isDesktopLayout &&
            "md:grid md:grid-cols-12 md:items-center md:gap-8 md:px-8 md:pt-8 md:pb-9 md:text-left",
          )}
        >
          <div className={cn(isDesktopLayout ? "md:col-span-6 space-y-3.5" : "space-y-3.5")}>
            <p className="text-[11px] font-medium tracking-[0.24em] text-[#706040] uppercase">
              {data.ui.eyebrow} · {heroDate.dotDate}
            </p>
            <CoupleDisplayName
              as="h1"
              groomName={data.couple.groomName}
              brideName={data.couple.brideName}
              className={cn(
                "font-display leading-[1.08] font-semibold text-[#1F1D1A]",
                contained
                  ? "text-[clamp(24px,9cqw,34px)]"
                  : isDesktopLayout
                    ? "text-[clamp(32px,3.6vw,44px)]"
                    : "text-[clamp(32px,9vw,48px)]",
              )}
              inlineAmpersandClassName="text-[#8A7344]"
            />
            <p
              className={cn(
                "text-sm leading-relaxed text-[#5E574B]",
                isDesktopLayout ? "mx-auto max-w-md md:mx-0" : "mx-auto max-w-md",
              )}
            >
              {data.ui.heroSubtitle}
            </p>
            {guestName && (
              <p className="inline-block border-y border-[#C6A962]/70 py-1.5 text-xs tracking-wide text-[#4F473A]">
                {data.ui.invitePrefix}: <strong className="font-semibold">{guestName}</strong>
              </p>
            )}
          </div>

          <div
            className={cn(
              "mt-5",
              isDesktopLayout && "md:col-span-6 md:mt-0 md:mx-auto md:w-full md:max-w-[340px]",
            )}
          >
            <div className="overflow-hidden rounded-t-full border border-[#C6A962]/80 bg-white p-2 shadow-sm sm:p-2.5">
              <div className="overflow-hidden rounded-t-full bg-[#EFEAE0]">
                {data.photos.heroUrl ? (
                  <img
                    src={data.photos.heroUrl}
                    alt={data.photos.heroAlt}
                    width={600}
                    height={800}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="block aspect-[3/4] w-full object-cover object-[center_20%]"
                  />
                ) : (
                  <TemplatePhotoPlaceholder />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Quote & Families */}
        {(data.quote || hasFamilies) && (
          <section
            className={cn(
              "border-t border-[#E2D9C8] text-center",
              contained ? "px-3.5 py-7" : "px-5 py-9 sm:px-8",
            )}
          >
            {data.quote && (
              <blockquote
                className={cn(
                  "mx-auto max-w-[540px] font-display leading-relaxed italic text-[#3F382E]",
                  contained ? "text-lg" : "text-xl sm:text-2xl",
                )}
              >
                “{data.quote}”
              </blockquote>
            )}

            {hasFamilies && (
              <div
                className={cn(
                  "mx-auto mt-7 grid max-w-[680px] grid-cols-2 text-center",
                  contained ? "gap-2.5" : "gap-4 sm:gap-8",
                )}
              >
                <div className={cn("min-w-0 border border-[#E2D9C8] bg-white", contained ? "p-3" : "p-4")}>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-[#706040] uppercase">
                    NHÀ TRAI
                  </p>
                  <p
                    className={cn(
                      "mt-2 font-medium leading-relaxed text-[#1F1D1A] break-words",
                      contained ? "text-xs" : "text-xs sm:text-sm",
                    )}
                  >
                    {data.couple.groomParents || "Gia đình nhà trai"}
                  </p>
                </div>
                <div className={cn("min-w-0 border border-[#E2D9C8] bg-white", contained ? "p-3" : "p-4")}>
                  <p className="text-[11px] font-semibold tracking-[0.16em] text-[#706040] uppercase">
                    NHÀ GÁI
                  </p>
                  <p
                    className={cn(
                      "mt-2 font-medium leading-relaxed text-[#1F1D1A] break-words",
                      contained ? "text-xs" : "text-xs sm:text-sm",
                    )}
                  >
                    {data.couple.brideParents || "Gia đình nhà gái"}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Couple */}
        <section className={cn(contained ? "px-3.5 py-7" : "px-5 py-8 sm:px-8")}>
          <div
            className={cn(
              "mx-auto grid max-w-[720px] grid-cols-2",
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
                className={cn("min-w-0 border border-[#E2D9C8] bg-white shadow-xs", contained ? "p-2" : "p-2.5")}
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
                <div className="px-1 pt-2.5 pb-1 text-center">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-[#706040] uppercase">
                    {person.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 font-display font-semibold text-[#1F1D1A] break-words",
                      contained ? "text-base" : "text-lg sm:text-xl",
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
        <section
          className={cn(
            "border-t border-[#E2D9C8] text-center",
            contained ? "px-3.5 py-7" : "px-5 py-9 sm:px-8",
          )}
        >
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#706040] uppercase">
            {data.ui.eventsEyebrow}
          </p>
          <h2
            className={cn(
              "mt-1 font-display font-semibold text-[#1F1D1A]",
              contained ? "text-2xl" : "text-3xl",
            )}
          >
            {data.ui.eventsTitle}
          </h2>

          {data.events.length === 0 ? (
            <div className="mx-auto mt-6 max-w-[440px] border border-dashed border-[#C6A962] bg-white px-5 py-8 text-center">
              <p className="text-sm text-[#5E574B]">Thêm lễ để hiển thị</p>
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
                    className="flex flex-col justify-between border border-[#C6A962]/70 bg-white p-5 text-center"
                  >
                    <div>
                      <h3 className="font-display text-xl font-semibold text-[#1F1D1A]">
                        {evt.title}
                      </h3>
                      <p className="mt-1.5 text-xs font-medium tracking-[0.14em] text-[#706040] uppercase">
                        {parts.time} · {parts.weekday} · {parts.dotDate}
                      </p>
                      {evt.lunarDate && (
                        <p className="mt-1 text-xs italic text-[#5E574B]">
                          ({evt.lunarDate})
                        </p>
                      )}
                      <p className="mt-3 text-sm font-semibold text-[#1F1D1A]">
                        {evt.venueName}
                      </p>
                      {evt.venueAddress && (
                        <p className="mt-1 text-xs leading-relaxed text-[#5E574B]">
                          {evt.venueAddress}
                        </p>
                      )}
                    </div>
                    {evt.mapDirectionsUrl && (
                      <div className="mt-4">
                        <a
                          href={evt.mapDirectionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#9A8966] px-4 text-xs font-medium tracking-[0.08em] text-[#23201C] uppercase transition-colors hover:bg-[#EFEAE0]"
                        >
                          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{data.ui.directionsButtonLabel}</span>
                        </a>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {countdown && (
            <div className="mx-auto mt-8 max-w-[420px]">
              <p className="text-[11px] tracking-[0.2em] text-[#706040] uppercase">
                {data.ui.countdownTitle}
              </p>
              {countdown.finished ? (
                <p className="mt-2 font-display text-xl italic text-[#4F473A]">
                  {data.ui.countdownFinished}
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-4 gap-2">
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
                    <div
                      key={unit.label}
                      className="border border-[#E2D9C8] bg-white py-2.5 text-center"
                    >
                      <p className="font-display text-2xl font-semibold tabular-nums text-[#1F1D1A]">
                        {unit.value}
                      </p>
                      <p className="text-[11px] text-[#5E574B]">{unit.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Gallery */}
        <section className={cn("text-center", contained ? "px-3.5 py-7" : "px-5 py-9 sm:px-8")}>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#706040] uppercase">
            {data.ui.galleryEyebrow}
          </p>
          <h2
            className={cn(
              "mt-1 font-display font-semibold text-[#1F1D1A]",
              contained ? "text-2xl" : "text-3xl",
            )}
          >
            {data.ui.galleryTitle}
          </h2>
          <p className="mt-1.5 text-xs text-[#5E574B]">{data.ui.gallerySubtitle}</p>

          {photos.length === 0 ? (
            <div className="mx-auto mt-6 max-w-[320px] border border-[#E2D9C8] bg-white p-1">
              <TemplatePhotoPlaceholder className="aspect-[4/3]" />
            </div>
          ) : (
            <div
              className={cn(
                "mx-auto mt-6 grid gap-2.5",
                isDesktopLayout ? "grid-cols-2 md:grid-cols-3 md:gap-4" : "grid-cols-2",
              )}
            >
              {photos.map((photo, index) => (
                <button
                  key={photo.id || `${photo.url}-${index}`}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={`Xem ảnh ${index + 1}: ${photo.alt}`}
                  className="group cursor-pointer overflow-hidden border border-[#E2D9C8] bg-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#706040]"
                >
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    width={600}
                    height={800}
                    loading="lazy"
                    decoding="async"
                    className="block aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
          tone="minimal"
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
          tone="minimal"
          contained={contained}
          onOpenGift={() => setGiftOpen(true)}
        />

        {contained ? (
          <div className="border-t border-[#E2D9C8] bg-[#23201C] px-5 py-10 text-center text-[#FAF7F0]">
            <Heart className="mx-auto h-5 w-5 text-[#C6A962]" aria-hidden="true" />
            <p className="mt-3 font-display text-3xl italic">
              {data.ui.thankYouTitle}
            </p>
            <p className="mx-auto mt-2 max-w-[380px] text-xs leading-relaxed text-[#D8D0C2]">
              {data.ui.thankYouBody}
            </p>
            <p className="mt-4 text-[11px] tracking-[0.2em] text-[#C6A962] uppercase">
              {data.ui.signature}
            </p>
          </div>
        ) : (
          <footer className="border-t border-[#E2D9C8] bg-[#23201C] px-5 py-10 text-center text-[#FAF7F0]">
            <Heart className="mx-auto h-5 w-5 text-[#C6A962]" aria-hidden="true" />
            <p className="mt-3 font-display text-3xl italic">
              {data.ui.thankYouTitle}
            </p>
            <p className="mx-auto mt-2 max-w-[380px] text-xs leading-relaxed text-[#D8D0C2]">
              {data.ui.thankYouBody}
            </p>
            <p className="mt-4 text-[11px] tracking-[0.2em] text-[#C6A962] uppercase">
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
        tone="minimal"
        wishAnchorId="rsvp-wishes"
      />

      {mode === "live" && !externalMusicControl && (
        <LiveMusicFloatingButton
          src={data.music.src}
          title={data.music.title}
          visible={opened}
          tone="minimal"
        />
      )}
    </div>
  );
}
