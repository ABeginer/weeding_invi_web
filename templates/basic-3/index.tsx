"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarHeart, Gift, MapPin } from "lucide-react";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateGiftModal, TemplateLightboxModal } from "../shared/TemplateOverlays";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import { padCountdownUnit, useWeddingCountdown } from "../shared/useCountdown";
import type { WeddingTemplateProps } from "../types";

export default function Basic3Template({
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
        "relative w-full bg-[#FCF5F0] text-[#322424] font-sans",
        contained ? "min-h-full" : "min-h-dvh",
        !opened && (contained ? "h-full overflow-hidden" : "h-dvh max-h-full overflow-hidden")
      )}
    >
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="basic3-cover"
            initial={{ opacity: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, scale: 1.03 }
            }
            transition={{ duration: prefersReducedMotion ? 0.2 : 0.6 }}
            className={cn(
              "z-30 flex items-center justify-center bg-gradient-to-b from-[#F4DFD5] via-[#FBF1EA] to-[#EFE1D6] p-5",
              contained ? "absolute inset-0" : "fixed inset-0"
            )}
          >
            <button
              type="button"
              onClick={handleOpen}
              aria-label={`${content.envelope.tapHint} - ${content.envelope.invitePrefix} ${displayGuest}`}
              className="group relative flex h-full max-h-[660px] w-full max-w-[380px] cursor-pointer flex-col items-center justify-between rounded-t-full rounded-b-3xl border border-[#CFA89A] bg-[#FFFBF8] px-6 pt-14 pb-9 text-center shadow-[0_20px_50px_rgba(122,53,53,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A3535]"
            >
              <div className="space-y-2">
                <p className="text-[11px] font-medium tracking-[0.22em] text-[#8A4444] uppercase">
                  {content.hero.eyebrow}
                </p>
                <h2 className="font-display text-3xl font-semibold text-[#5C2626]">
                  {content.groom.shortName} &amp; {content.bride.shortName}
                </h2>
              </div>

              <div className="space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#7A3535] font-display text-xl font-semibold text-[#FFF8F4] shadow-md">
                  {content.envelope.sealLabel}
                </div>
                <p className="text-[11px] tracking-[0.18em] text-[#7D5E57] uppercase">
                  {content.envelope.invitePrefix}
                </p>
                <p className="font-display text-2xl italic text-[#5C2626]">
                  {displayGuest}
                </p>
              </div>

              <span className="inline-flex h-10 items-center rounded-full bg-[#7A3535] px-6 text-xs font-medium tracking-[0.12em] text-white uppercase transition-colors group-hover:bg-[#612828]">
                {content.envelope.tapHint}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "mx-auto w-full bg-[#FCF5F0]",
          isDesktopLayout ? "max-w-[1040px]" : "max-w-[460px]"
        )}
      >
        {/* Hero */}
        <header className="bg-gradient-to-b from-[#F5E0D5] to-[#FCF5F0] px-5 pt-10 pb-8 text-center sm:px-8">
          <p className="text-[11px] font-medium tracking-[0.22em] text-[#8A4444] uppercase">
            {content.hero.eyebrow} · {heroDate.dotDate}
          </p>
          <h1 className="mt-2 font-display text-[clamp(34px,9vw,52px)] leading-[1.1] font-semibold text-[#5C2626]">
            {content.groom.shortName} &amp; {content.bride.shortName}
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-sm text-[#6B504B]">
            {content.hero.subtitle}
          </p>

          <div
            className={cn(
              "mx-auto mt-6 overflow-hidden rounded-t-full border-2 border-[#D7B3A5] bg-white p-2 shadow-sm",
              isDesktopLayout ? "max-w-[420px]" : "max-w-[320px]"
            )}
          >
            <img
              src={content.hero.coverImage}
              alt={content.hero.coverAlt}
              width={600}
              height={800}
              className="block aspect-[3/4] w-full rounded-t-full object-cover object-[center_20%]"
            />
          </div>
        </header>

        {/* Quote & Families */}
        <section className="px-5 py-8 text-center sm:px-8">
          {content.quote && (
            <p className="mx-auto max-w-[520px] rounded-2xl border border-[#E7CFC3] bg-white px-5 py-5 font-display text-lg leading-relaxed italic text-[#5C2626] sm:text-xl">
              “{content.quote}”
            </p>
          )}

          <div className="mx-auto mt-7 grid max-w-[680px] grid-cols-2 gap-3 sm:gap-6">
            <div className="rounded-2xl border border-[#E7CFC3] bg-white p-4">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8A4444] uppercase">
                {content.families.groom.label}
              </p>
              <p className="mt-1.5 text-xs font-medium text-[#322424] sm:text-sm">
                {content.families.groom.parents}
              </p>
              <p className="mt-1 text-[11px] text-[#6B504B] sm:text-xs">
                {content.families.groom.address}
              </p>
            </div>
            <div className="rounded-2xl border border-[#E7CFC3] bg-white p-4">
              <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8A4444] uppercase">
                {content.families.bride.label}
              </p>
              <p className="mt-1.5 text-xs font-medium text-[#322424] sm:text-sm">
                {content.families.bride.parents}
              </p>
              <p className="mt-1 text-[11px] text-[#6B504B] sm:text-xs">
                {content.families.bride.address}
              </p>
            </div>
          </div>

          <div className="mx-auto mt-6 grid max-w-[680px] grid-cols-2 gap-3 sm:gap-6">
            {[content.groom, content.bride].map((person) => (
              <div
                key={person.label}
                className="overflow-hidden rounded-2xl border border-[#E7CFC3] bg-white"
              >
                <img
                  src={person.photo}
                  alt={`${person.name} ${person.fullName}`}
                  width={480}
                  height={640}
                  loading="lazy"
                  className="block aspect-[3/4] w-full object-cover object-[center_20%]"
                />
                <div className="p-3 text-center">
                  <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8A4444] uppercase">
                    {person.label}
                  </p>
                  <p className="mt-0.5 font-display text-lg font-semibold text-[#5C2626]">
                    {person.fullName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Events & Countdown */}
        <section className="px-5 py-8 text-center sm:px-8">
          <div className="mx-auto max-w-[780px] rounded-3xl border border-[#E7CFC3] bg-white p-5 sm:p-8">
            <CalendarHeart className="mx-auto h-5 w-5 text-[#7A3535]" aria-hidden="true" />
            <h2 className="mt-2 font-display text-3xl font-semibold text-[#5C2626]">
              {content.sections.eventsTitle}
            </h2>

            <div className={cn("mt-6 grid gap-4", isDesktopLayout ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
              {content.events.map((evt, idx) => {
                const parts = formatWeddingDateParts(evt.date, evt.time);
                return (
                  <article
                    key={`${evt.title}-${idx}`}
                    className="rounded-2xl bg-[#FCF5F0] p-4 text-center"
                  >
                    <h3 className="font-display text-xl font-semibold text-[#7A3535]">
                      {evt.title}
                    </h3>
                    <p className="mt-1 text-xs font-semibold tracking-[0.12em] text-[#5C2626] uppercase">
                      {evt.time || parts.time} · {parts.weekday} · {parts.dotDate}
                    </p>
                    {evt.lunarDate && (
                      <p className="mt-0.5 text-xs italic text-[#6B504B]">({evt.lunarDate})</p>
                    )}
                    <p className="mt-2.5 text-sm font-semibold text-[#322424]">{evt.venue}</p>
                    <p className="mt-1 text-xs text-[#6B504B]">{evt.address}</p>
                    {evt.mapDirectionsUrl && (
                      <div className="mt-3">
                        <a
                          href={evt.mapDirectionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1 rounded-full bg-[#7A3535] px-4 text-[11px] font-medium tracking-[0.08em] text-white uppercase hover:bg-[#612828]"
                        >
                          <MapPin className="h-3 w-3" aria-hidden="true" />
                          <span>{content.sections.directionsButtonLabel}</span>
                        </a>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {!countdown?.finished && (
              <div className="mx-auto mt-6 grid max-w-[360px] grid-cols-4 gap-2">
                {[
                  { label: "Ngày", value: countdown ? String(countdown.days) : "--" },
                  { label: "Giờ", value: countdown ? padCountdownUnit(countdown.hours) : "--" },
                  { label: "Phút", value: countdown ? padCountdownUnit(countdown.minutes) : "--" },
                  { label: "Giây", value: countdown ? padCountdownUnit(countdown.seconds) : "--" },
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
        {photos.length > 0 && (
          <section className="px-5 py-8 text-center sm:px-8">
            <h2 className="font-display text-3xl font-semibold text-[#5C2626]">
              Album Khoảnh Khắc
            </h2>
            <p className="mt-1 text-xs text-[#6B504B]">{content.sections.gallery.subtitle}</p>
            <div
              className={cn(
                "mx-auto mt-5 grid gap-2.5",
                isDesktopLayout ? "grid-cols-2 md:grid-cols-3 md:gap-4" : "grid-cols-2"
              )}
            >
              {photos.map((photo, index) => (
                <button
                  key={`${photo.src}-${index}`}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={`Xem ảnh ${index + 1}: ${photo.alt}`}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-[#E7CFC3] bg-white p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A3535]"
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    className="block aspect-[3/4] w-full rounded-xl object-cover transition-transform duration-300 group-hover:scale-[1.03]"
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
          tone="sunset"
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
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[#7A3535] px-6 text-xs font-medium tracking-[0.1em] text-white uppercase hover:bg-[#612828]"
            >
              <Gift className="h-4 w-4" aria-hidden="true" />
              <span>{content.gift.openButtonLabel}</span>
            </button>
          </section>
        )}

        <footer className="bg-gradient-to-t from-[#5C2626] to-[#7A3535] px-5 py-10 text-center text-[#FFF8F4]">
          <p className="font-display text-3xl italic">
            {content.sections.footer.thankYouTitle}
          </p>
          <p className="mx-auto mt-2 max-w-[380px] text-xs leading-relaxed text-[#F5DDD4]">
            {content.sections.footer.thankYouBody}
          </p>
          <p className="mt-4 text-[11px] tracking-[0.2em] text-[#F2CFC2] uppercase">
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
        tone="sunset"
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
