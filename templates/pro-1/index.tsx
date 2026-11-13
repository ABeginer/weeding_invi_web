"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Diamond, MapPin } from "lucide-react";
import { CoupleDisplayName } from "@/components/invitation/CoupleDisplayName";
import { GiftModal } from "@/components/invitation/GiftModal";
import { landingThemeCssVars } from "@/lib/theme";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateGiftSection } from "../shared/TemplateGiftSection";
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
  initialPlusOnes = 0,
  initialDiet = null,
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
      style={landingThemeCssVars as React.CSSProperties}
      className={cn(
        "landing-theme template-pro-obsidian relative w-full bg-lnd-bg text-lnd-body font-sans",
        contained ? "min-h-full" : "min-h-screen-dvh",
        !coverDismissed &&
        (contained
          ? "h-full overflow-hidden"
          : "h-screen-dvh max-h-full overflow-hidden"),
      )}
    >
      {/* Pro Double-Curtain Art Deco Gate */}
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
            key="pro1-curtains"
            initial={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            transition={{ duration: prefersReducedMotion ? 0.2 : 0.85 }}
            className={cn(
              "z-30 flex items-center justify-center overflow-hidden",
              contained
                ? "absolute inset-0"
                : cn(
                  "fixed inset-y-0 left-1/2 w-full -translate-x-1/2",
                  isDesktopLayout
                    ? "max-w-[960px] md:border-x md:border-lnd-gold-soft/40 md:shadow-[0_0_50px_rgba(212,175,55,0.14)]"
                    : "max-w-[460px]",
                ),
              opened && "pointer-events-none",
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

            <motion.button
              type="button"
              onClick={handleOpen}
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.96 }
              }
              transition={{ duration: 0.25, ease: "easeOut" }}
              aria-label={`${data.ui.tapHint} - ${data.ui.invitePrefix} ${displayGuest}`}
              className={cn(
                "group relative z-10 mx-5 flex w-full cursor-pointer flex-col items-center rounded-2xl border border-lnd-gold bg-lnd-bg/95 text-center shadow-[0_0_50px_rgba(212,175,55,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold",
                isDesktopLayout ? "max-w-[420px]" : "max-w-[350px]",
                contained ? "px-5 py-7" : "px-6 py-10",
              )}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-3 rounded-xl border border-lnd-gold-soft/60"
              />
              <Diamond className="h-5 w-5 text-lnd-gold" aria-hidden="true" />
              <p className="mt-2.5 text-[11px] font-medium tracking-[0.22em] text-lnd-gold uppercase">
                {data.ui.eyebrow}
              </p>

              <div
                className={cn(
                  "flex items-center justify-center rounded-full border-2 border-lnd-gold bg-lnd-gold-tint font-display font-semibold text-lnd-gold",
                  contained ? "my-4 h-16 w-16 text-xl" : "my-6 h-20 w-20 text-2xl",
                )}
              >
                {data.couple.sealLabel}
              </div>

              <CoupleDisplayName
                as="h2"
                groomName={data.couple.groomName}
                brideName={data.couple.brideName}
                className={cn(
                  "font-display font-semibold text-lnd-body",
                  contained ? "text-2xl" : "text-3xl",
                )}
                inlineAmpersandClassName="text-lnd-gold"
              />

              <p className="mt-3 text-[11px] tracking-[0.18em] text-lnd-muted uppercase">
                {data.ui.invitePrefix}
              </p>
              <p
                className={cn(
                  "mt-1 font-display italic text-lnd-gold",
                  contained ? "text-xl" : "text-2xl",
                )}
              >
                {displayGuest}
              </p>

              <span
                className={cn(
                  "inline-flex h-10 items-center rounded-full bg-lnd-gold px-6 text-xs font-semibold tracking-[0.14em] text-lnd-bg uppercase transition-colors group-hover:bg-lnd-gold-bright",
                  contained ? "mt-5" : "mt-7",
                )}
              >
                {data.ui.tapHint}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={cn(
          "mx-auto w-full overflow-x-clip bg-lnd-bg",
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
            "relative overflow-hidden text-center",
            contained ? "px-3.5 pt-9 pb-6" : "px-5 pt-11 pb-10",
            isDesktopLayout &&
            "md:grid md:grid-cols-12 md:items-center md:gap-8 md:px-8 md:pt-8 md:pb-9 md:text-left",
          )}
        >
          <div className={cn(isDesktopLayout ? "md:col-span-6 space-y-3.5" : "space-y-3.5")}>
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
            <CoupleDisplayName
              as="h1"
              groomName={data.couple.groomName}
              brideName={data.couple.brideName}
              className={cn(
                "font-display leading-[1.08] font-semibold text-lnd-gold",
                contained
                  ? "text-[clamp(24px,9cqw,34px)]"
                  : isDesktopLayout
                    ? "text-[clamp(32px,3.6vw,44px)]"
                    : "text-[clamp(32px,9vw,48px)]",
              )}
              inlineAmpersandClassName="text-lnd-body"
            />
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

          <div
            className={cn(
              "mt-5",
              isDesktopLayout && "md:col-span-6 md:mt-0 md:mx-auto md:w-full md:max-w-[340px]",
            )}
          >
            <div className="relative rounded-t-full border border-lnd-gold bg-lnd-surface p-2 shadow-[0_0_40px_rgba(212,175,55,0.12)] sm:p-2.5">
              <div className="overflow-hidden rounded-t-full border border-lnd-gold-soft/60">
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
              "border-t border-lnd-border bg-lnd-surface text-center",
              contained ? "px-3.5 py-7" : "px-5 py-9 sm:px-8",
            )}
          >
            {data.quote && (
              <blockquote
                className={cn(
                  "mx-auto max-w-[540px] font-display leading-relaxed italic text-lnd-body",
                  contained ? "text-lg" : "text-xl sm:text-2xl",
                )}
              >
                “{data.quote}”
              </blockquote>
            )}

            {hasFamilies && (
              <div
                className={cn(
                  "mx-auto mt-7 grid max-w-[700px] grid-cols-2",
                  contained ? "gap-2.5" : "gap-3 sm:gap-6",
                )}
              >
                <div className={cn("min-w-0 rounded-xl border border-lnd-gold-soft/70 bg-lnd-bg", contained ? "p-3" : "p-4")}>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-lnd-gold uppercase">
                    NHÀ TRAI
                  </p>
                  <p
                    className={cn(
                      "mt-2 font-medium text-lnd-body break-words",
                      contained ? "text-xs" : "text-xs sm:text-sm",
                    )}
                  >
                    {data.couple.groomParents || "Gia đình nhà trai"}
                  </p>
                </div>
                <div className={cn("min-w-0 rounded-xl border border-lnd-gold-soft/70 bg-lnd-bg", contained ? "p-3" : "p-4")}>
                  <p className="text-[11px] font-semibold tracking-[0.18em] text-lnd-gold uppercase">
                    NHÀ GÁI
                  </p>
                  <p
                    className={cn(
                      "mt-2 font-medium text-lnd-body break-words",
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
        <section className={cn(contained ? "px-3.5 py-7" : "px-5 py-9 sm:px-8")}>
          <div
            className={cn(
              "mx-auto grid max-w-[700px] grid-cols-2",
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
                className="min-w-0 overflow-hidden rounded-xl border border-lnd-gold-soft/70 bg-lnd-surface p-2"
              >
                {person.photoUrl ? (
                  <img
                    src={person.photoUrl}
                    alt={`${person.label} ${person.fullName}`}
                    width={480}
                    height={640}
                    loading="lazy"
                    decoding="async"
                    className="block aspect-[3/4] w-full rounded-lg object-cover object-[center_20%]"
                  />
                ) : (
                  <TemplatePhotoPlaceholder className="rounded-lg" />
                )}
                <div className="pt-2.5 pb-1 text-center">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-lnd-gold uppercase">
                    {person.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 font-display font-semibold text-lnd-body break-words",
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
            "border-t border-lnd-border bg-lnd-surface text-center",
            contained ? "px-3.5 py-7" : "px-5 py-9 sm:px-8",
          )}
        >
          <p className="text-[11px] font-semibold tracking-[0.2em] text-lnd-gold uppercase">
            {data.ui.eventsEyebrow}
          </p>
          <h2
            className={cn(
              "mt-1 font-display font-semibold text-lnd-body",
              contained ? "text-2xl" : "text-3xl",
            )}
          >
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

          {countdown && !countdown.finished && (
            <div className="mx-auto mt-7 grid max-w-[380px] grid-cols-4 gap-2">
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
        <section className={cn("text-center", contained ? "px-3.5 py-7" : "px-5 py-9 sm:px-8")}>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-lnd-gold uppercase">
            {data.ui.galleryEyebrow}
          </p>
          <h2
            className={cn(
              "mt-1 font-display font-semibold text-lnd-body",
              contained ? "text-2xl" : "text-3xl",
            )}
          >
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
                    decoding="async"
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
          contained={contained}
          inviteSlug={inviteSlug}
          weddingSlug={weddingSlug}
          invitationMode={invitationMode}
          guestName={guestName}
          initialStatus={initialStatus}
          initialPlusOnes={initialPlusOnes}
          initialDiet={initialDiet}
        />

        {/* Gift (sau khi xác nhận) */}
        <TemplateGiftSection
          tone="obsidian"
          contained={contained}
          onOpenGift={() => setGiftOpen(true)}
        />

        {contained ? (
          <div className="border-t border-lnd-border bg-lnd-surface px-5 py-10 text-center">
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
          </div>
        ) : (
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
        tone="obsidian"
        wishAnchorId="rsvp-wishes"
      />

      {mode === "live" && !externalMusicControl && (
        <LiveMusicFloatingButton
          src={data.music.src}
          title={data.music.title}
          visible={opened}
          tone="obsidian"
        />
      )}
    </div>
  );
}
