"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarHeart, MapPin } from "lucide-react";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
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
      className={cn(
        "relative w-full bg-[#FCF5F0] text-[#322424] font-sans",
        contained ? "min-h-full" : "min-h-dvh",
        !opened &&
          (contained ? "h-full overflow-hidden" : "h-dvh max-h-full overflow-hidden"),
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
              contained ? "absolute inset-0" : "fixed inset-0",
            )}
          >
            <button
              type="button"
              onClick={handleOpen}
              aria-label={`${data.ui.tapHint} - ${data.ui.invitePrefix} ${displayGuest}`}
              className="group relative flex h-full max-h-[660px] w-full max-w-[380px] cursor-pointer flex-col items-center justify-between rounded-t-full rounded-b-3xl border border-[#CFA89A] bg-[#FFFBF8] px-6 pt-14 pb-9 text-center shadow-[0_20px_50px_rgba(122,53,53,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A3535]"
            >
              <div className="space-y-2">
                <p className="text-[11px] font-medium tracking-[0.22em] text-[#8A4444] uppercase">
                  {data.ui.eyebrow}
                </p>
                <h2 className="font-display text-3xl font-semibold text-[#5C2626]">
                  {data.couple.groomName} &amp; {data.couple.brideName}
                </h2>
              </div>

              <div className="space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#7A3535] font-display text-xl font-semibold text-[#FFF8F4] shadow-md">
                  {data.couple.sealLabel}
                </div>
                <p className="text-[11px] tracking-[0.18em] text-[#7D5E57] uppercase">
                  {data.ui.invitePrefix}
                </p>
                <p className="font-display text-2xl italic text-[#5C2626]">
                  {displayGuest}
                </p>
              </div>

              <span className="inline-flex h-10 items-center rounded-full bg-[#7A3535] px-6 text-xs font-medium tracking-[0.12em] text-white uppercase transition-colors group-hover:bg-[#612828]">
                {data.ui.tapHint}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "mx-auto w-full bg-[#FCF5F0]",
          isDesktopLayout ? "max-w-[1040px]" : "max-w-[460px]",
        )}
      >
        {/* Hero */}
        <header className="bg-gradient-to-b from-[#F5E0D5] to-[#FCF5F0] px-5 pt-10 pb-8 text-center sm:px-8">
          <p className="text-[11px] font-medium tracking-[0.22em] text-[#8A4444] uppercase">
            {data.ui.eyebrow} · {heroDate.dotDate}
          </p>
          <h1 className="mt-2 font-display text-[clamp(34px,9vw,52px)] leading-[1.1] font-semibold text-[#5C2626]">
            {data.couple.groomName} &amp; {data.couple.brideName}
          </h1>
          <p className="mx-auto mt-2.5 max-w-md text-sm text-[#6B504B]">
            {data.ui.heroSubtitle}
          </p>

          <div
            className={cn(
              "mx-auto mt-6 overflow-hidden rounded-t-full border-2 border-[#D7B3A5] bg-white p-2 shadow-sm",
              isDesktopLayout ? "max-w-[420px]" : "max-w-[320px]",
            )}
          >
            <div className="overflow-hidden rounded-t-full">
              {data.photos.heroUrl ? (
                <img
                  src={data.photos.heroUrl}
                  alt={data.photos.heroAlt}
                  width={600}
                  height={800}
                  className="block aspect-[3/4] w-full rounded-t-full object-cover object-[center_20%]"
                />
              ) : (
                <TemplatePhotoPlaceholder />
              )}
            </div>
          </div>
        </header>

        {/* Quote & Families & Couple */}
        <section className="px-5 py-8 text-center sm:px-8">
          {data.quote && (
            <p className="mx-auto max-w-[520px] rounded-2xl border border-[#E7CFC3] bg-white px-5 py-5 font-display text-lg leading-relaxed italic text-[#5C2626] sm:text-xl">
              “{data.quote}”
            </p>
          )}

          {hasFamilies && (
            <div className="mx-auto mt-7 grid max-w-[680px] grid-cols-2 gap-3 sm:gap-6">
              <div className="rounded-2xl border border-[#E7CFC3] bg-white p-4">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8A4444] uppercase">
                  NHÀ TRAI
                </p>
                <p className="mt-1.5 text-xs font-medium text-[#322424] sm:text-sm">
                  {data.couple.groomParents || "Gia đình nhà trai"}
                </p>
              </div>
              <div className="rounded-2xl border border-[#E7CFC3] bg-white p-4">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#8A4444] uppercase">
                  NHÀ GÁI
                </p>
                <p className="mt-1.5 text-xs font-medium text-[#322424] sm:text-sm">
                  {data.couple.brideParents || "Gia đình nhà gái"}
                </p>
              </div>
            </div>
          )}

          <div className="mx-auto mt-6 grid max-w-[680px] grid-cols-2 gap-3 sm:gap-6">
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
                className="overflow-hidden rounded-2xl border border-[#E7CFC3] bg-white"
              >
                {person.photoUrl ? (
                  <img
                    src={person.photoUrl}
                    alt={`${person.label} ${person.fullName}`}
                    width={480}
                    height={640}
                    loading="lazy"
                    className="block aspect-[3/4] w-full object-cover object-[center_20%]"
                  />
                ) : (
                  <TemplatePhotoPlaceholder />
                )}
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
              {data.ui.eventsTitle}
            </h2>

            {data.events.length === 0 ? (
              <div className="mx-auto mt-6 max-w-[420px] rounded-2xl border border-dashed border-[#D7B3A5] bg-[#FCF5F0] px-5 py-7 text-center">
                <p className="text-sm text-[#6B504B]">Thêm lễ để hiển thị</p>
              </div>
            ) : (
              <div
                className={cn(
                  "mt-6 grid gap-4",
                  isDesktopLayout ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1",
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

                      {evt.mapEmbedUrl && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-[#E7CFC3] bg-white">
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

            {!countdown?.finished && (
              <div className="mx-auto mt-6 grid max-w-[360px] grid-cols-4 gap-2">
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
        <section className="px-5 py-8 text-center sm:px-8">
          <h2 className="font-display text-3xl font-semibold text-[#5C2626]">
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
          inviteSlug={inviteSlug}
          weddingSlug={weddingSlug}
          invitationMode={invitationMode}
          guestName={guestName}
          initialStatus={initialStatus}
        />

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
