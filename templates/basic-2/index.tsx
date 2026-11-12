"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Gift, Heart, MapPin, Sparkles } from "lucide-react";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateGiftModal, TemplateLightboxModal } from "../shared/TemplateOverlays";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { padCountdownUnit, useWeddingCountdown } from "../shared/useCountdown";
import type { WeddingTemplateProps } from "../types";

export default function Basic2Template({
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
      className={cn(
        "relative w-full bg-[#FAF7F0] text-[#1F1D1A] font-sans",
        contained ? "min-h-full" : "min-h-dvh",
        !opened && (contained ? "h-full overflow-hidden" : "h-dvh max-h-full overflow-hidden")
      )}
    >
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="basic2-cover"
            initial={{ opacity: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: "-6%" }
            }
            transition={{ duration: prefersReducedMotion ? 0.2 : 0.65, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "z-30 flex items-center justify-center bg-[#FAF7F0] p-5",
              contained ? "absolute inset-0" : "fixed inset-0"
            )}
          >
            <button
              type="button"
              onClick={handleOpen}
              aria-label={`${content.envelope.tapHint} - ${content.envelope.invitePrefix} ${displayGuest}`}
              className="group relative flex h-full max-h-[660px] w-full max-w-[380px] cursor-pointer flex-col items-center justify-between border border-[#C6A962] bg-white px-6 py-10 text-center shadow-[0_18px_45px_rgba(31,29,26,0.08)] transition-colors hover:border-[#9E803B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#706040]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-2.5 border border-[#E5DCCB]"
              />
              <div className="relative space-y-2 pt-2">
                <p className="text-[11px] font-medium tracking-[0.22em] text-[#706040] uppercase">
                  {content.hero.eyebrow}
                </p>
                <p className="text-xs tracking-[0.14em] text-[#5E574B] uppercase">
                  {heroDate.dotDate}
                </p>
              </div>

              <div className="relative space-y-3 py-4">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[#C6A962] bg-[#FAF7F0] font-display text-2xl font-semibold text-[#5E4D2B]">
                  {content.envelope.sealLabel}
                </div>
                <h2 className="font-display text-3xl font-semibold text-[#1F1D1A]">
                  {content.groom.shortName} &amp; {content.bride.shortName}
                </h2>
                <div className="pt-2">
                  <p className="text-[11px] tracking-[0.18em] text-[#665E52] uppercase">
                    {content.envelope.invitePrefix}
                  </p>
                  <p className="mt-1 font-display text-2xl italic text-[#1F1D1A]">
                    {displayGuest}
                  </p>
                </div>
              </div>

              <span className="relative inline-flex items-center gap-2 rounded-full border border-[#C6A962] bg-[#FAF7F0] px-5 py-2 text-xs font-medium tracking-[0.14em] text-[#3F3626] uppercase transition-colors group-hover:bg-[#EFEAE0]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{content.envelope.tapHint}</span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "mx-auto w-full bg-[#FAF7F0]",
          isDesktopLayout ? "max-w-[1040px]" : "max-w-[460px]"
        )}
      >
        {/* Hero */}
        <header
          className={cn(
            "px-5 pt-10 pb-8 text-center",
            isDesktopLayout && "md:grid md:grid-cols-12 md:items-center md:gap-10 md:px-8 md:pt-14 md:pb-12 md:text-left"
          )}
        >
          <div className={cn(isDesktopLayout ? "md:col-span-6 space-y-4" : "space-y-4")}>
            <p className="text-[11px] font-medium tracking-[0.24em] text-[#706040] uppercase">
              {content.hero.eyebrow} · {heroDate.dotDate}
            </p>
            <h1 className="font-display text-[clamp(34px,9vw,54px)] leading-[1.08] font-semibold text-[#1F1D1A]">
              {content.groom.shortName}
              <span className="mx-2 font-normal italic text-[#8A7344]">&amp;</span>
              {content.bride.shortName}
            </h1>
            <p className={cn("text-sm leading-relaxed text-[#5E574B]", isDesktopLayout ? "mx-auto max-w-md md:mx-0" : "mx-auto max-w-md")}>
              {content.hero.subtitle}
            </p>
            {guestName && (
              <p className="inline-block border-y border-[#C6A962]/70 py-1.5 text-xs tracking-wide text-[#4F473A]">
                {content.envelope.invitePrefix}: <strong className="font-semibold">{guestName}</strong>
              </p>
            )}
          </div>

          <div className={cn("mt-6", isDesktopLayout && "md:col-span-6 md:mt-0")}>
            <div className="overflow-hidden rounded-t-full border border-[#C6A962]/80 bg-white p-2.5 shadow-sm">
              <div className="overflow-hidden rounded-t-full bg-[#EFEAE0]">
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
        <section className="border-t border-[#E2D9C8] px-5 py-9 text-center sm:px-8">
          {content.quote && (
            <blockquote className="mx-auto max-w-[540px] font-display text-xl leading-relaxed italic text-[#3F382E] sm:text-2xl">
              “{content.quote}”
            </blockquote>
          )}

          <div className="mx-auto mt-8 grid max-w-[680px] grid-cols-2 gap-4 text-center sm:gap-8">
            <div className="border border-[#E2D9C8] bg-white p-4">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[#706040] uppercase">
                {content.families.groom.label}
              </p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-[#1F1D1A] sm:text-sm">
                {content.families.groom.parents}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#5E574B] sm:text-xs">
                {content.families.groom.address}
              </p>
            </div>
            <div className="border border-[#E2D9C8] bg-white p-4">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[#706040] uppercase">
                {content.families.bride.label}
              </p>
              <p className="mt-2 text-xs font-medium leading-relaxed text-[#1F1D1A] sm:text-sm">
                {content.families.bride.parents}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-[#5E574B] sm:text-xs">
                {content.families.bride.address}
              </p>
            </div>
          </div>
        </section>

        {/* Couple */}
        <section className="px-5 py-8 sm:px-8">
          <div className="mx-auto grid max-w-[720px] grid-cols-2 gap-3 sm:gap-6">
            {[
              { person: content.groom },
              { person: content.bride },
            ].map(({ person }) => (
              <div key={person.label} className="bg-white p-2.5 shadow-xs border border-[#E2D9C8]">
                <img
                  src={person.photo}
                  alt={`${person.name} ${person.fullName}`}
                  width={480}
                  height={640}
                  loading="lazy"
                  className="block aspect-[3/4] w-full object-cover object-[center_20%]"
                />
                <div className="px-1 pt-3 pb-1 text-center">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-[#706040] uppercase">
                    {person.label}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-[#1F1D1A] sm:text-xl">
                    {person.fullName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Events & Countdown */}
        <section className="border-t border-[#E2D9C8] px-5 py-9 text-center sm:px-8">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-[#706040] uppercase">
            {content.sections.eventsEyebrow}
          </p>
          <h2 className="mt-1 font-display text-3xl font-semibold text-[#1F1D1A]">
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
                  className="flex flex-col justify-between border border-[#C6A962]/70 bg-white p-5 text-center"
                >
                  <div>
                    <h3 className="font-display text-xl font-semibold text-[#1F1D1A]">
                      {evt.title}
                    </h3>
                    <p className="mt-1.5 text-xs font-medium tracking-[0.14em] text-[#706040] uppercase">
                      {evt.time || parts.time} · {parts.weekday} · {parts.dotDate}
                    </p>
                    {evt.lunarDate && (
                      <p className="mt-1 text-xs italic text-[#5E574B]">({evt.lunarDate})</p>
                    )}
                    <p className="mt-3 text-sm font-semibold text-[#1F1D1A]">{evt.venue}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#5E574B]">{evt.address}</p>
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
                        <span>{content.sections.directionsButtonLabel}</span>
                      </a>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="mx-auto mt-8 max-w-[420px]">
            <p className="text-[11px] tracking-[0.2em] text-[#706040] uppercase">
              {content.sections.countdownTitle}
            </p>
            {countdown?.finished ? (
              <p className="mt-2 font-display text-xl italic text-[#4F473A]">
                {content.sections.countdownFinished}
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[
                  { label: "Ngày", value: countdown ? String(countdown.days) : "--" },
                  { label: "Giờ", value: countdown ? padCountdownUnit(countdown.hours) : "--" },
                  { label: "Phút", value: countdown ? padCountdownUnit(countdown.minutes) : "--" },
                  { label: "Giây", value: countdown ? padCountdownUnit(countdown.seconds) : "--" },
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
        </section>

        {/* Gallery */}
        {photos.length > 0 && (
          <section className="px-5 py-9 text-center sm:px-8">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#706040] uppercase">
              {content.sections.gallery.eyebrow}
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-[#1F1D1A]">
              Khoảnh Khắc Kỷ Niệm
            </h2>
            <p className="mt-1.5 text-xs text-[#5E574B]">{content.sections.gallery.subtitle}</p>

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
                  className="group cursor-pointer overflow-hidden border border-[#E2D9C8] bg-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#706040]"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    className="block aspect-[3/4] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
          tone="minimal"
          inviteSlug={inviteSlug}
          weddingSlug={weddingSlug}
          invitationMode={invitationMode}
          guestName={guestName}
          initialStatus={initialStatus}
        />

        {/* Gift & Footer */}
        {content.gift.items.length > 0 && (
          <section className="px-5 py-8 text-center">
            <p className="text-[11px] font-semibold tracking-[0.2em] text-[#706040] uppercase">
              {content.gift.eyebrow}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-[#1F1D1A]">
              {content.gift.title}
            </h2>
            <button
              type="button"
              onClick={() => setGiftOpen(true)}
              className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[#23201C] px-6 text-xs font-medium tracking-[0.12em] text-[#FAF7F0] uppercase transition-colors hover:bg-[#3A342D]"
            >
              <Gift className="h-4 w-4" aria-hidden="true" />
              <span>{content.gift.openButtonLabel}</span>
            </button>
          </section>
        )}

        <footer className="border-t border-[#E2D9C8] bg-[#23201C] px-5 py-10 text-center text-[#FAF7F0]">
          <Heart className="mx-auto h-5 w-5 text-[#C6A962]" aria-hidden="true" />
          <p className="mt-3 font-display text-3xl italic">
            {content.sections.footer.thankYouTitle}
          </p>
          <p className="mx-auto mt-2 max-w-[380px] text-xs leading-relaxed text-[#D8D0C2]">
            {content.sections.footer.thankYouBody}
          </p>
          <p className="mt-4 text-[11px] tracking-[0.2em] text-[#C6A962] uppercase">
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
        tone="minimal"
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
