"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Diamond, Gift, MapPin } from "lucide-react";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { landingThemeCssVars } from "@/lib/theme";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateGiftModal, TemplateLightboxModal } from "../shared/TemplateOverlays";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { padCountdownUnit, useWeddingCountdown } from "../shared/useCountdown";
import type { WeddingTemplateProps } from "../types";

export default function Pro1Template({
  content,
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
  const [giftOpen, setGiftOpen] = React.useState(false);

  React.useEffect(() => {
    setOpened(isOpenedProp);
  }, [isOpenedProp]);

  const primaryEvent = content.events[0];
  const heroDate = React.useMemo(
    () => formatWeddingDateParts(primaryEvent?.date ?? content.date, primaryEvent?.time),
    [primaryEvent?.date, primaryEvent?.time, content.date]
  );
  const countdown = useWeddingCountdown(primaryEvent?.date ?? content.date, primaryEvent?.time);

  const displayGuest =
    guestName && guestName.trim().length > 0
      ? guestName.trim()
      : content.envelope.defaultGuestName;

  const isDesktopLayout = viewport === "desktop" && !contained;
  const photos = content.photos.slice(0, 6);

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
        !opened && (contained ? "h-full overflow-hidden" : "h-dvh max-h-full overflow-hidden")
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
              contained ? "absolute inset-0" : "fixed inset-0"
            )}
          >
            {/* Left curtain */}
            <motion.div
              aria-hidden="true"
              exit={prefersReducedMotion ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: prefersReducedMotion ? 0.2 : 0.85, ease: [0.45, 0, 0.55, 1] }}
              className="absolute inset-y-0 left-0 w-1/2 border-r border-lnd-gold-soft bg-lnd-surface"
            />
            {/* Right curtain */}
            <motion.div
              aria-hidden="true"
              exit={prefersReducedMotion ? { opacity: 0 } : { x: "100%" }}
              transition={{ duration: prefersReducedMotion ? 0.2 : 0.85, ease: [0.45, 0, 0.55, 1] }}
              className="absolute inset-y-0 right-0 w-1/2 border-l border-lnd-gold-soft bg-lnd-surface"
            />

            <button
              type="button"
              onClick={handleOpen}
              aria-label={`${content.envelope.tapHint} - ${content.envelope.invitePrefix} ${displayGuest}`}
              className="group relative z-10 mx-5 flex w-full max-w-[350px] cursor-pointer flex-col items-center rounded-2xl border border-lnd-gold bg-lnd-bg/95 px-6 py-10 text-center shadow-[0_0_50px_rgba(212,175,55,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-3 rounded-xl border border-lnd-gold-soft/60"
              />
              <Diamond className="h-5 w-5 text-lnd-gold" aria-hidden="true" />
              <p className="mt-3 text-[11px] font-medium tracking-[0.22em] text-lnd-gold uppercase">
                {content.hero.eyebrow}
              </p>

              <div className="my-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-lnd-gold bg-lnd-gold-tint font-display text-2xl font-semibold text-lnd-gold">
                {content.envelope.sealLabel}
              </div>

              <h2 className="font-display text-3xl font-semibold text-lnd-body">
                {content.groom.shortName} &amp; {content.bride.shortName}
              </h2>

              <p className="mt-4 text-[11px] tracking-[0.18em] text-lnd-muted uppercase">
                {content.envelope.invitePrefix}
              </p>
              <p className="mt-1 font-display text-2xl italic text-lnd-gold">
                {displayGuest}
              </p>

              <span className="mt-7 inline-flex h-10 items-center rounded-full bg-lnd-gold px-6 text-xs font-semibold tracking-[0.14em] text-lnd-bg uppercase transition-colors group-hover:bg-lnd-gold-bright">
                {content.envelope.tapHint}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "mx-auto w-full bg-lnd-bg",
          isDesktopLayout ? "max-w-[1060px]" : "max-w-[460px]"
        )}
      >
        {/* Hero */}
        <header
          className={cn(
            "relative overflow-hidden px-5 pt-11 pb-10 text-center",
            isDesktopLayout && "md:grid md:grid-cols-12 md:items-center md:gap-10 md:px-10 md:pt-14 md:pb-12 md:text-left"
          )}
        >
          <div className={cn(isDesktopLayout ? "md:col-span-6 space-y-4" : "space-y-4")}>
            <div className={cn("inline-flex items-center gap-2", !isDesktopLayout && "justify-center")}>
              <Diamond className="h-3.5 w-3.5 text-lnd-gold" aria-hidden="true" />
              <span className="text-[11px] font-medium tracking-[0.22em] text-lnd-gold uppercase">
                {content.hero.eyebrow} · {heroDate.dotDate}
              </span>
            </div>
            <h1 className="font-display text-[clamp(34px,9vw,54px)] leading-[1.08] font-semibold text-lnd-gold">
              {content.groom.shortName}
              <span className="mx-2 font-normal italic text-lnd-body">&amp;</span>
              {content.bride.shortName}
            </h1>
            <p className={cn("max-w-md text-sm leading-relaxed text-lnd-body", isDesktopLayout ? "mx-auto md:mx-0" : "mx-auto")}>
              {content.hero.subtitle}
            </p>
            {guestName && (
              <p className="inline-block rounded-full border border-lnd-gold-soft bg-lnd-surface px-4 py-1 text-xs text-lnd-body">
                {content.envelope.invitePrefix}:{" "}
                <strong className="font-semibold text-lnd-gold">{guestName}</strong>
              </p>
            )}
          </div>

          <div className={cn("mt-6", isDesktopLayout && "md:col-span-6 md:mt-0")}>
            <div className="relative rounded-t-full border border-lnd-gold bg-lnd-surface p-2.5 shadow-[0_0_40px_rgba(212,175,55,0.12)]">
              <div className="overflow-hidden rounded-t-full border border-lnd-gold-soft/60">
                <img
                  src={content.hero.coverImage}
                  alt={content.hero.coverAlt}
                  width={600}
                  height={800}
                  className="block aspect-[3/4] w-full object-cover object-[center_20%]"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Quote & Families */}
        <section className="border-t border-lnd-border bg-lnd-surface px-5 py-9 text-center sm:px-8">
          {content.quote && (
            <blockquote className="mx-auto max-w-[540px] font-display text-xl leading-relaxed italic text-lnd-body sm:text-2xl">
              “{content.quote}”
            </blockquote>
          )}

          <div className="mx-auto mt-8 grid max-w-[700px] grid-cols-2 gap-3 sm:gap-6">
            <div className="rounded-xl border border-lnd-gold-soft/70 bg-lnd-bg p-4">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-lnd-gold uppercase">
                {content.families.groom.label}
              </p>
              <p className="mt-2 text-xs font-medium text-lnd-body sm:text-sm">
                {content.families.groom.parents}
              </p>
              <p className="mt-1 text-[11px] text-lnd-muted sm:text-xs">
                {content.families.groom.address}
              </p>
            </div>
            <div className="rounded-xl border border-lnd-gold-soft/70 bg-lnd-bg p-4">
              <p className="text-[11px] font-semibold tracking-[0.18em] text-lnd-gold uppercase">
                {content.families.bride.label}
              </p>
              <p className="mt-2 text-xs font-medium text-lnd-body sm:text-sm">
                {content.families.bride.parents}
              </p>
              <p className="mt-1 text-[11px] text-lnd-muted sm:text-xs">
                {content.families.bride.address}
              </p>
            </div>
          </div>
        </section>

        {/* Couple */}
        <section className="px-5 py-9 sm:px-8">
          <div className="mx-auto grid max-w-[700px] grid-cols-2 gap-3 sm:gap-6">
            {[content.groom, content.bride].map((person) => (
              <div
                key={person.label}
                className="overflow-hidden rounded-xl border border-lnd-gold-soft/70 bg-lnd-surface p-2"
              >
                <img
                  src={person.photo}
                  alt={`${person.name} ${person.fullName}`}
                  width={480}
                  height={640}
                  loading="lazy"
                  className="block aspect-[3/4] w-full rounded-lg object-cover object-[center_20%]"
                />
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
            {content.sections.eventsEyebrow}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-lnd-body">
            {content.sections.eventsTitle}
          </h2>

          <div
            className={cn(
              "mx-auto mt-6 grid gap-4",
              isDesktopLayout ? "max-w-[820px] grid-cols-1 md:grid-cols-2" : "max-w-[440px] grid-cols-1"
            )}
          >
            {content.events.map((evt, idx) => {
              const parts = formatWeddingDateParts(evt.date, evt.time);
              return (
                <article
                  key={`${evt.title}-${idx}`}
                  className="rounded-xl border border-lnd-gold-soft bg-lnd-bg p-5 text-center"
                >
                  <h3 className="font-display text-xl font-semibold text-lnd-gold">
                    {evt.title}
                  </h3>
                  <p className="mt-1.5 text-xs font-medium tracking-[0.14em] text-lnd-body uppercase">
                    {evt.time || parts.time} · {parts.weekday} · {parts.dotDate}
                  </p>
                  {evt.lunarDate && (
                    <p className="mt-1 text-xs italic text-lnd-muted">({evt.lunarDate})</p>
                  )}
                  <p className="mt-3 text-sm font-semibold text-lnd-body">{evt.venue}</p>
                  <p className="mt-1 text-xs text-lnd-muted">{evt.address}</p>
                  {evt.mapDirectionsUrl && (
                    <div className="mt-4">
                      <a
                        href={evt.mapDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-lnd-gold bg-lnd-gold-tint px-4 text-xs font-medium tracking-[0.08em] text-lnd-gold uppercase transition-colors hover:bg-lnd-gold hover:text-lnd-bg"
                      >
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{content.sections.directionsButtonLabel}</span>
                      </a>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {!countdown?.finished && (
            <div className="mx-auto mt-7 grid max-w-[380px] grid-cols-4 gap-2">
              {[
                { label: "Ngày", value: countdown ? String(countdown.days) : "--" },
                { label: "Giờ", value: countdown ? padCountdownUnit(countdown.hours) : "--" },
                { label: "Phút", value: countdown ? padCountdownUnit(countdown.minutes) : "--" },
                { label: "Giây", value: countdown ? padCountdownUnit(countdown.seconds) : "--" },
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
        {photos.length > 0 && (
          <section className="px-5 py-9 text-center sm:px-8">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-lnd-gold uppercase">
              {content.sections.gallery.eyebrow}
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-lnd-body">
              Gala Kỷ Niệm
            </h2>
            <p className="mt-1 text-xs text-lnd-muted">{content.sections.gallery.subtitle}</p>
            <div
              className={cn(
                "mx-auto mt-6 grid gap-2.5",
                isDesktopLayout ? "grid-cols-2 md:grid-cols-3 md:gap-4" : "grid-cols-2"
              )}
            >
              {photos.map((photo, index) => (
                <button
                  key={`${photo.src}-${index}`}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={`Xem ảnh ${index + 1}: ${photo.alt}`}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-lnd-gold-soft bg-lnd-surface p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    className="block aspect-[3/4] w-full rounded-lg object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                </button>
              ))}
            </div>
          </section>
        )}

        {/* RSVP & Wishes */}
        <TemplateRsvpSection
          content={content}
          mode={mode}
          tone="obsidian"
          inviteSlug={inviteSlug}
          weddingSlug={weddingSlug}
          invitationMode={invitationMode}
          guestName={guestName}
          initialStatus={initialStatus}
        />

        {/* Gift */}
        {content.gift.items.length > 0 && (
          <section className="px-5 py-8 text-center">
            <button
              type="button"
              onClick={() => setGiftOpen(true)}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-lnd-gold px-6 text-xs font-semibold tracking-[0.12em] text-lnd-bg uppercase transition-colors hover:bg-lnd-gold-bright"
            >
              <Gift className="h-4 w-4" aria-hidden="true" />
              <span>{content.gift.openButtonLabel}</span>
            </button>
          </section>
        )}

        <footer className="border-t border-lnd-border bg-lnd-surface px-5 py-10 text-center">
          <Diamond className="mx-auto h-5 w-5 text-lnd-gold" aria-hidden="true" />
          <p className="mt-3 font-display text-3xl italic text-lnd-gold">
            {content.sections.footer.thankYouTitle}
          </p>
          <p className="mx-auto mt-2 max-w-[380px] text-xs leading-relaxed text-lnd-body">
            {content.sections.footer.thankYouBody}
          </p>
          <p className="mt-4 text-[11px] tracking-[0.2em] text-lnd-muted uppercase">
            {content.sections.footer.signature}
          </p>
        </footer>
      </div>

      <TemplateLightboxModal
        photos={photos}
        activeIndex={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />

      <TemplateGiftModal
        open={giftOpen}
        onClose={() => setGiftOpen(false)}
        title={content.gift.title}
        subtitle={content.gift.subtitle}
        downloadLabel={content.gift.downloadLabel}
        items={content.gift.items}
        tone="obsidian"
      />

      {mode === "live" && !externalMusicControl && (
        <LiveMusicFloatingButton
          src={content.music.src}
          title={content.music.title}
          visible={opened}
        />
      )}
    </div>
  );
}
