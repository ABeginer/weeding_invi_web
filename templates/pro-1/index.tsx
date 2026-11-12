"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Diamond, MapPin } from "lucide-react";
import { landingThemeCssVars } from "@/lib/theme";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import { TemplatePhotoPlaceholder } from "../shared/TemplatePhotoPlaceholder";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { padCountdownUnit, useWeddingCountdown } from "../shared/useCountdown";
import type { WeddingTemplateProps } from "../types";

export default function Pro1Template({
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
  externalMusicControl,
}: WeddingTemplateProps) {
  const prefersReducedMotion = useReducedMotion();
  const [opened, setOpened] = React.useState(isOpenedProp);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    setOpened(isOpenedProp);
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
      style={landingThemeCssVars as React.CSSProperties}
      className={cn(
        "landing-theme relative w-full bg-lnd-bg text-lnd-body font-sans",
        contained ? "min-h-full" : "min-h-dvh",
        !opened &&
          (contained ? "h-full overflow-hidden" : "h-dvh max-h-full overflow-hidden"),
      )}
    >
      {/* Pro Double-Curtain Art Deco Gate */}
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="pro1-curtains"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0.25 : 0.7 }}
            className={cn(
              "z-30 flex items-center justify-center overflow-hidden bg-lnd-bg",
              contained ? "absolute inset-0" : "fixed inset-0",
            )}
          >
            {/* Left curtain */}
            <motion.div
              aria-hidden="true"
              exit={prefersReducedMotion ? { opacity: 0 } : { x: "-100%" }}
              transition={{
                duration: prefersReducedMotion ? 0.2 : 0.85,
                ease: [0.45, 0, 0.55, 1],
              }}
              className="absolute inset-y-0 left-0 w-1/2 border-r border-lnd-gold-soft bg-lnd-surface"
            />
            {/* Right curtain */}
            <motion.div
              aria-hidden="true"
              exit={prefersReducedMotion ? { opacity: 0 } : { x: "100%" }}
              transition={{
                duration: prefersReducedMotion ? 0.2 : 0.85,
                ease: [0.45, 0, 0.55, 1],
              }}
              className="absolute inset-y-0 right-0 w-1/2 border-l border-lnd-gold-soft bg-lnd-surface"
            />

            <button
              type="button"
              onClick={handleOpen}
              aria-label={`${data.ui.tapHint} - ${data.ui.invitePrefix} ${displayGuest}`}
              className="group relative z-10 mx-5 flex w-full max-w-[350px] cursor-pointer flex-col items-center rounded-2xl border border-lnd-gold bg-lnd-bg/95 px-6 py-10 text-center shadow-[0_0_50px_rgba(212,175,55,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-3 rounded-xl border border-lnd-gold-soft/60"
              />
              <Diamond className="h-5 w-5 text-lnd-gold" aria-hidden="true" />
              <p className="mt-3 text-[11px] font-medium tracking-[0.22em] text-lnd-gold uppercase">
                {data.ui.eyebrow}
              </p>

              <div className="my-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-lnd-gold bg-lnd-gold-tint font-display text-2xl font-semibold text-lnd-gold">
                {data.couple.sealLabel}
              </div>

              <h2 className="font-display text-3xl font-semibold text-lnd-body">
                {data.couple.groomName} &amp; {data.couple.brideName}
              </h2>

              <p className="mt-4 text-[11px] tracking-[0.18em] text-lnd-muted uppercase">
                {data.ui.invitePrefix}
              </p>
              <p className="mt-1 font-display text-2xl italic text-lnd-gold">
                {displayGuest}
              </p>

              <span className="mt-7 inline-flex h-10 items-center rounded-full bg-lnd-gold px-6 text-xs font-semibold tracking-[0.14em] text-lnd-bg uppercase transition-colors group-hover:bg-lnd-gold-bright">
                {data.ui.tapHint}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "mx-auto w-full bg-lnd-bg",
          isDesktopLayout ? "max-w-[1060px]" : "max-w-[460px]",
        )}
      >
        {/* Hero */}
        <header
          className={cn(
            "relative overflow-hidden px-5 pt-11 pb-10 text-center",
            isDesktopLayout &&
              "md:grid md:grid-cols-12 md:items-center md:gap-10 md:px-10 md:pt-14 md:pb-12 md:text-left",
          )}
        >
          <div className={cn(isDesktopLayout ? "md:col-span-6 space-y-4" : "space-y-4")}>
            <div
              className={cn(
                "inline-flex items-center gap-2",
                !isDesktopLayout && "justify-center",
              )}
            >
              <Diamond className="h-3.5 w-3.5 text-lnd-gold" aria-hidden="true" />
              <span className="text-[11px] font-medium tracking-[0.22em] text-lnd-gold uppercase">
                {data.ui.eyebrow} · {heroDate.dotDate}
              </span>
            </div>
            <h1 className="font-display text-[clamp(34px,9vw,54px)] leading-[1.08] font-semibold text-lnd-gold">
              {data.couple.groomName}
              <span className="mx-2 font-normal italic text-lnd-body">&amp;</span>
              {data.couple.brideName}
            </h1>
            <p
              className={cn(
                "max-w-md text-sm leading-relaxed text-lnd-body",
                isDesktopLayout ? "mx-auto md:mx-0" : "mx-auto",
              )}
            >
              {data.ui.heroSubtitle}
            </p>
            {guestName && (
              <p className="inline-block rounded-full border border-lnd-gold-soft bg-lnd-surface px-4 py-1 text-xs text-lnd-body">
                {data.ui.invitePrefix}:{" "}
                <strong className="font-semibold text-lnd-gold">{guestName}</strong>
              </p>
            )}
          </div>

          <div className={cn("mt-6", isDesktopLayout && "md:col-span-6 md:mt-0")}>
            <div className="relative rounded-t-full border border-lnd-gold bg-lnd-surface p-2.5 shadow-[0_0_40px_rgba(212,175,55,0.12)]">
              <div className="overflow-hidden rounded-t-full border border-lnd-gold-soft/60">
                {data.photos.heroUrl ? (
                  <img
                    src={data.photos.heroUrl}
                    alt={data.photos.heroAlt}
                    width={600}
                    height={800}
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
          <section className="border-t border-lnd-border bg-lnd-surface px-5 py-9 text-center sm:px-8">
            {data.quote && (
              <blockquote className="mx-auto max-w-[540px] font-display text-xl leading-relaxed italic text-lnd-body sm:text-2xl">
                “{data.quote}”
              </blockquote>
            )}

            {hasFamilies && (
              <div className="mx-auto mt-8 grid max-w-[700px] grid-cols-2 gap-3 sm:gap-6">
                <div className="rounded-xl border border-lnd-gold-soft/70 bg-lnd-bg p-4">
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-lnd-gold uppercase">
                    NHÀ TRAI
                  </p>
                  <p className="mt-2 text-xs font-medium text-lnd-body sm:text-sm">
                    {data.couple.groomParents || "Gia đình nhà trai"}
                  </p>
                </div>
                <div className="rounded-xl border border-lnd-gold-soft/70 bg-lnd-bg p-4">
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-lnd-gold uppercase">
                    NHÀ GÁI
                  </p>
                  <p className="mt-2 text-xs font-medium text-lnd-body sm:text-sm">
                    {data.couple.brideParents || "Gia đình nhà gái"}
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Couple */}
        <section className="px-5 py-9 sm:px-8">
          <div className="mx-auto grid max-w-[700px] grid-cols-2 gap-3 sm:gap-6">
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
                className="overflow-hidden rounded-xl border border-lnd-gold-soft/70 bg-lnd-surface p-2"
              >
                {person.photoUrl ? (
                  <img
                    src={person.photoUrl}
                    alt={`${person.label} ${person.fullName}`}
                    width={480}
                    height={640}
                    loading="lazy"
                    className="block aspect-[3/4] w-full rounded-lg object-cover object-[center_20%]"
                  />
                ) : (
                  <TemplatePhotoPlaceholder className="rounded-lg" />
                )}
                <div className="pt-3 pb-1 text-center">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-lnd-gold uppercase">
                    {person.label}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-lnd-body sm:text-xl">
                    {person.fullName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Events & Countdown */}
        <section className="border-t border-lnd-border bg-lnd-surface px-5 py-9 text-center sm:px-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-lnd-gold uppercase">
            {data.ui.eventsEyebrow}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-lnd-body">
            {data.ui.eventsTitle}
          </h2>

          {data.events.length === 0 ? (
            <div className="mx-auto mt-6 max-w-[440px] rounded-xl border border-dashed border-lnd-gold-soft bg-lnd-bg px-5 py-8 text-center">
              <p className="text-sm text-lnd-muted">Thêm lễ để hiển thị</p>
            </div>
          ) : (
            <div
              className={cn(
                "mx-auto mt-6 grid gap-4",
                isDesktopLayout
                  ? "max-w-[820px] grid-cols-1 md:grid-cols-2"
                  : "max-w-[440px] grid-cols-1",
              )}
            >
              {data.events.map((evt, idx) => {
                const parts = formatWeddingDateParts(evt.startsAt);
                return (
                  <article
                    key={evt.id || `${evt.title}-${idx}`}
                    className="rounded-xl border border-lnd-gold-soft bg-lnd-bg p-5 text-center"
                  >
                    <h3 className="font-display text-xl font-semibold text-lnd-gold">
                      {evt.title}
                    </h3>
                    <p className="mt-1.5 text-xs font-medium tracking-[0.14em] text-lnd-body uppercase">
                      {parts.time} · {parts.weekday} · {parts.dotDate}
                    </p>
                    {evt.lunarDate && (
                      <p className="mt-1 text-xs italic text-lnd-muted">
                        ({evt.lunarDate})
                      </p>
                    )}
                    <p className="mt-3 text-sm font-semibold text-lnd-body">
                      {evt.venueName}
                    </p>
                    {evt.venueAddress && (
                      <p className="mt-1 text-xs text-lnd-muted">{evt.venueAddress}</p>
                    )}

                    {evt.mapEmbedUrl && (
                      <div className="mt-4 overflow-hidden rounded-lg border border-lnd-border bg-lnd-surface">
                        <iframe
                          src={evt.mapEmbedUrl}
                          title={`Bản đồ ${evt.venueName}`}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          className="h-44 w-full border-0"
                        />
                      </div>
                    )}

                    {evt.mapDirectionsUrl && (
                      <div className="mt-4">
                        <a
                          href={evt.mapDirectionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-lnd-gold bg-lnd-gold-tint px-4 text-xs font-medium tracking-[0.08em] text-lnd-gold uppercase transition-colors hover:bg-lnd-gold hover:text-lnd-bg"
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

          {!countdown?.finished && (
            <div className="mx-auto mt-7 grid max-w-[380px] grid-cols-4 gap-2">
              {[
                { label: "Ngày", value: countdown ? String(countdown.days) : "--" },
                {
                  label: "Giờ",
                  value: countdown ? padCountdownUnit(countdown.hours) : "--",
                },
                {
                  label: "Phút",
                  value: countdown ? padCountdownUnit(countdown.minutes) : "--",
                },
                {
                  label: "Giây",
                  value: countdown ? padCountdownUnit(countdown.seconds) : "--",
                },
              ].map((unit) => (
                <div
                  key={unit.label}
                  className="rounded-xl border border-lnd-gold-soft/70 bg-lnd-bg py-2.5"
                >
                  <p className="font-display text-2xl font-semibold tabular-nums text-lnd-gold">
                    {unit.value}
                  </p>
                  <p className="text-[11px] text-lnd-muted">{unit.label}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Gallery */}
        <section className="px-5 py-9 text-center sm:px-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-lnd-gold uppercase">
            {data.ui.galleryEyebrow}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-lnd-body">
            {data.ui.galleryTitle}
          </h2>
          <p className="mt-1 text-xs text-lnd-muted">{data.ui.gallerySubtitle}</p>

          {photos.length === 0 ? (
            <div className="mx-auto mt-6 max-w-[320px] overflow-hidden rounded-xl border border-lnd-gold-soft bg-lnd-surface p-1">
              <TemplatePhotoPlaceholder className="aspect-[4/3] rounded-lg" />
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
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-lnd-gold-soft bg-lnd-surface p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
                >
                  <img
                    src={photo.url}
                    alt={photo.alt}
                    width={600}
                    height={800}
                    loading="lazy"
                    className="block aspect-[3/4] w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
          tone="obsidian"
          inviteSlug={inviteSlug}
          weddingSlug={weddingSlug}
          invitationMode={invitationMode}
          guestName={guestName}
          initialStatus={initialStatus}
        />

        <footer className="border-t border-lnd-border bg-lnd-surface px-5 py-10 text-center">
          <Diamond className="mx-auto h-5 w-5 text-lnd-gold" aria-hidden="true" />
          <p className="mt-3 font-display text-3xl italic text-lnd-gold">
            {data.ui.thankYouTitle}
          </p>
          <p className="mx-auto mt-2 max-w-[380px] text-xs leading-relaxed text-lnd-body">
            {data.ui.thankYouBody}
          </p>
          <p className="mt-4 text-[11px] tracking-[0.2em] text-lnd-muted uppercase">
            {data.ui.signature}
          </p>
        </footer>
      </div>

      <TemplateLightboxModal
        photos={photos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />

      {mode === "live" && !externalMusicControl && (
        <LiveMusicFloatingButton
          src={data.music.src}
          title={data.music.title}
          visible={opened}
        />
      )}
    </div>
  );
}
