"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Compass,
  Heart,
  MailOpen,
  MapPin,
  Sparkles,
} from "lucide-react";
import { GiftModal } from "@/components/invitation/GiftModal";
import { cn, formatWeddingDateParts } from "@/lib/utils";
import { LiveMusicFloatingButton } from "../shared/LiveMusicFloatingButton";
import { TemplateGiftSection } from "../shared/TemplateGiftSection";
import { TemplateLightboxModal } from "../shared/TemplateOverlays";
import { TemplateRsvpSection } from "../shared/TemplateRsvpSection";
import type { WeddingTemplateProps } from "../types";
import { ThemeMotif } from "./ThemeMotif";
import { ThemedCalendar } from "./ThemedCalendar";
import { ThemedDressCode } from "./ThemedDressCode";
import { ThemedFamily } from "./ThemedFamily";
import { ThemedHero } from "./ThemedHero";
import type { ThemeConfig } from "./theme-configs";

interface ThemedTemplateProps extends WeddingTemplateProps {
  theme: ThemeConfig;
}

// 12 deterministic particles for SSR/Client hydration safety
const AMBIENT_PARTICLES = [
  { left: "8%", delay: "0s", duration: "7.5s", sway: "22px", size: 18, opacity: 0.65 },
  { left: "20%", delay: "2.5s", duration: "9s", sway: "-26px", size: 22, opacity: 0.7 },
  { left: "36%", delay: "1.2s", duration: "8s", sway: "18px", size: 16, opacity: 0.55 },
  { left: "52%", delay: "3.8s", duration: "10s", sway: "-20px", size: 20, opacity: 0.8 },
  { left: "68%", delay: "0.8s", duration: "7.2s", sway: "24px", size: 17, opacity: 0.6 },
  { left: "82%", delay: "2.1s", duration: "8.5s", sway: "-16px", size: 24, opacity: 0.75 },
  { left: "14%", delay: "4.5s", duration: "11s", sway: "30px", size: 15, opacity: 0.5 },
  { left: "46%", delay: "5.2s", duration: "9.5s", sway: "-28px", size: 21, opacity: 0.7 },
  { left: "60%", delay: "1.9s", duration: "8.2s", sway: "20px", size: 19, opacity: 0.6 },
  { left: "92%", delay: "3.1s", duration: "7.8s", sway: "-18px", size: 16, opacity: 0.65 },
  { left: "28%", delay: "6.0s", duration: "10.5s", sway: "26px", size: 23, opacity: 0.7 },
  { left: "76%", delay: "4.0s", duration: "9.0s", sway: "-22px", size: 18, opacity: 0.6 },
];

export function ThemedTemplate({
  theme,
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
}: ThemedTemplateProps) {
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
  const targetWeddingDate = primaryEvent?.startsAt ?? data.date;
  const heroDate = React.useMemo(
    () => formatWeddingDateParts(targetWeddingDate),
    [targetWeddingDate],
  );

  const displayGuest =
    guestName && guestName.trim().length > 0
      ? guestName.trim()
      : data.ui.defaultGuestName;

  const isDesktopLayout = viewport === "desktop" && !contained;
  const photos = data.photos.gallery;

  const handleOpen = () => {
    setOpened(true);
    onOpenedChange?.(true);
  };

  return (
    <div
      style={{
        background: theme.bgGradient,
        color: theme.textColor,
      }}
      className={cn(
        "relative w-full font-sans antialiased overflow-x-hidden selection:bg-white/20 selection:text-white transition-colors",
        contained ? "min-h-full" : "min-h-screen-dvh",
        !coverDismissed &&
          (contained
            ? "h-full overflow-hidden"
            : "h-screen-dvh max-h-full overflow-hidden"),
      )}
    >
      {/* ==================== COVER SCREEN (BÌ THƯ HOÀNG GIA & KHÁCH MỜI) ==================== */}
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
            key={`${theme.id}-cover`}
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.96 }}
            transition={{
              duration: prefersReducedMotion ? 0.2 : 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              background: theme.coverGradient,
              color: theme.textColor,
            }}
            className={cn(
              "z-30 flex items-center justify-center overflow-hidden p-5 text-center",
              contained
                ? "absolute inset-0"
                : cn(
                    "fixed inset-y-0 left-1/2 w-full -translate-x-1/2",
                    isDesktopLayout ? "max-w-[840px]" : "max-w-[480px]",
                  ),
            )}
          >
            {/* Ambient Floating Falling Particles */}
            {!prefersReducedMotion && (
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {AMBIENT_PARTICLES.map((p, idx) => (
                  <span
                    key={idx}
                    className="absolute select-none"
                    style={{
                      left: p.left,
                      top: "-40px",
                      fontSize: `${p.size}px`,
                      opacity: p.opacity,
                      animation: `ambient-fall ${p.duration} linear ${p.delay} infinite`,
                      // @ts-expect-error CSS variable custom property
                      "--sway": p.sway,
                    }}
                  >
                    {theme.ambientParticle || "🌸"}
                  </span>
                ))}
              </div>
            )}

            {/* Centered Envelope Card */}
            <div
              style={{
                backgroundColor: theme.cardBg,
                borderColor: theme.borderColor,
              }}
              className="relative flex w-full max-w-sm flex-col items-center rounded-3xl border p-7 shadow-2xl backdrop-blur-md"
            >
              {/* 3D Wax Seal with breathing pulse */}
              <div
                style={{
                  background:
                    theme.waxSealGradient ||
                    "radial-gradient(circle at 35% 35%, #E5A93C 0%, #A26B1E 70%, #683E08 100%)",
                  boxShadow:
                    theme.waxSealShadow ||
                    "0 6px 20px rgba(0,0,0,0.4), inset 0 2px 3px rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,0,0,0.45)",
                }}
                className="animate-seal-pulse-center mb-3 flex h-14 w-14 items-center justify-center rounded-full"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  style={{
                    fill: theme.waxSealIconColor || "#FFF8EB",
                  }}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>

              {/* Theme Badge */}
              <div
                style={{
                  backgroundColor: theme.badgeBg,
                  color: theme.badgeTextColor,
                }}
                className="mb-2 flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-semibold tracking-wider uppercase"
              >
                <Sparkles className="h-3 w-3" />
                <span>{theme.subtitle}</span>
              </div>

              {/* Decorative Theme Motif */}
              <div className="my-1 flex items-center justify-center">
                <ThemeMotif
                  type={theme.motif}
                  color={theme.accentTextColor}
                  size={28}
                />
              </div>

              {/* Couple Names in Calligraphy Typography */}
              <h1
                style={{
                  fontFamily: theme.coupleFontFamily,
                  color: theme.textColor,
                }}
                className="my-2 text-3xl font-bold tracking-wide sm:text-4xl"
              >
                <span>{data.couple.groomName}</span>
                <span className="mx-2 text-base sm:text-xl opacity-80">&</span>
                <span>{data.couple.brideName}</span>
              </h1>

              {/* Decorative divider with flourish */}
              <div className="my-2 flex items-center justify-center gap-3 opacity-75">
                <div
                  className="h-px w-12"
                  style={{
                    background: `linear-gradient(to right, transparent, ${theme.accentColor})`,
                  }}
                />
                <span className="text-xs">❦</span>
                <div
                  className="h-px w-12"
                  style={{
                    background: `linear-gradient(to left, transparent, ${theme.accentColor})`,
                  }}
                />
              </div>

              {/* Wedding Date */}
              <p
                style={{ color: theme.subtextColor }}
                className="text-xs font-semibold tracking-widest uppercase"
              >
                {heroDate.weekday} · {heroDate.day} Tháng {heroDate.month} Năm{" "}
                {heroDate.year}
              </p>

              {/* Guest Invite Badge */}
              <div
                style={{
                  backgroundColor: theme.badgeBg,
                  borderColor: theme.borderColor,
                  color: theme.textColor,
                }}
                className="my-5 rounded-full border px-4 py-1.5 text-xs font-medium shadow-xs"
              >
                Trân Trọng Kính Mời:{" "}
                <span className="font-semibold text-current">{displayGuest}</span>
              </div>

              {/* Open Button with Metallic Sweep Shine Overlay */}
              <motion.button
                type="button"
                whileHover={prefersReducedMotion ? {} : { scale: 1.04 }}
                whileTap={prefersReducedMotion ? {} : { scale: 0.96 }}
                onClick={handleOpen}
                style={{
                  backgroundColor: theme.buttonBg,
                  color: theme.buttonTextColor,
                }}
                className="relative overflow-hidden mt-1 flex items-center gap-2 rounded-full px-7 py-2.5 text-sm font-semibold shadow-lg transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                {/* Shimmer sweep animation */}
                {!prefersReducedMotion && (
                  <span className="pointer-events-none absolute inset-0 -translate-x-full animate-shine-sweep bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                )}
                <MailOpen className="h-4 w-4" />
                <span>Mở Thiệp</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== MAIN INVITATION CONTENT ==================== */}
      <div
        className={cn(
          "mx-auto flex flex-col gap-6 pb-20",
          isDesktopLayout ? "max-w-[760px] px-6" : "max-w-[460px] px-4",
        )}
      >
        {/* Floating Music Button */}
        {!externalMusicControl && data.music && (
          <div className="fixed bottom-5 right-5 z-40">
            <LiveMusicFloatingButton
              src={data.music.src}
              title={data.music.title}
              visible={opened}
              tone={theme.templateTone}
            />
          </div>
        )}

        {/* 1. HERO SECTION (Custom Layouts based on theme.heroLayout) */}
        <ThemedHero
          theme={theme}
          couple={data.couple}
          photos={data.photos}
          dateParts={heroDate}
          quote={data.quote}
        />

        {/* 2. THÔNG TIN LỄ CƯỚI & HAI BÊN GIA ĐÌNH */}
        <ThemedFamily
          theme={theme}
          couple={data.couple}
          photos={data.photos}
        />

        {/* 3. LỊCH CƯỚI & ĐẾM NGƯỢC (Visual Month Calendar & Countdown) */}
        <ThemedCalendar
          theme={theme}
          targetDate={targetWeddingDate}
        />

        {/* 4. SỰ KIỆN CƯỚI (EVENTS TIMELINE) */}
        {data.events.length > 0 && (
          <section className="py-2">
            <div className="mb-4 text-center">
              <MapPin
                className="mx-auto mb-1.5 h-6 w-6"
                style={{ color: theme.accentTextColor }}
              />
              <h3
                style={{
                  color: theme.accentTextColor,
                  fontFamily: theme.headingFontFamily,
                }}
                className="font-serif text-xl font-bold tracking-wide uppercase sm:text-2xl"
              >
                Sự Kiện Cưới
              </h3>
            </div>

            <div className="flex flex-col gap-4">
              {data.events.map((evt) => {
                const parts = formatWeddingDateParts(evt.startsAt);
                return (
                  <div
                    key={evt.id}
                    style={{
                      backgroundColor: theme.cardBg,
                      borderColor: theme.borderColor,
                    }}
                    className="flex flex-col rounded-2xl border p-5 shadow-lg backdrop-blur-md"
                  >
                    <div
                      className="flex items-center justify-between border-b pb-3"
                      style={{ borderColor: theme.borderColor }}
                    >
                      <span
                        style={{
                          color: theme.accentTextColor,
                          fontFamily: theme.headingFontFamily,
                        }}
                        className="font-serif text-lg font-bold sm:text-xl"
                      >
                        {evt.title}
                      </span>
                      <span
                        style={{
                          backgroundColor: theme.badgeBg,
                          color: theme.badgeTextColor,
                        }}
                        className="rounded-full px-3 py-0.5 text-xs font-semibold"
                      >
                        {parts.time}
                      </span>
                    </div>

                    <p style={{ color: theme.subtextColor }} className="mt-3 text-xs font-medium">
                      {parts.weekday}, {parts.day} Tháng {parts.month} Năm {parts.year}
                    </p>

                    <h4 className="mt-1 text-base font-bold text-current">
                      {evt.venueName}
                    </h4>

                    {evt.venueAddress && (
                      <p style={{ color: theme.subtextColor }} className="mt-1 text-xs leading-relaxed">
                        {evt.venueAddress}
                      </p>
                    )}

                    {evt.mapDirectionsUrl && (
                      <a
                        href={evt.mapDirectionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          backgroundColor: theme.buttonBg,
                          color: theme.buttonTextColor,
                        }}
                        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl py-2 px-4 text-xs font-semibold shadow transition-transform hover:scale-[1.02]"
                      >
                        <Compass className="h-3.5 w-3.5" />
                        <span>Chỉ đường trên Google Maps</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. QUY ĐỊNH TRANG PHỤC (DRESS CODE) */}
        <ThemedDressCode theme={theme} />

        {/* 6. KHOẢNH KHẮC KỶ NIỆM (GALLERY) */}
        {photos.length > 0 && (
          <section className="py-2">
            <div className="mb-4 text-center">
              <Heart
                className="mx-auto mb-1.5 h-6 w-6"
                style={{ color: theme.accentTextColor }}
              />
              <h3
                style={{
                  color: theme.accentTextColor,
                  fontFamily: theme.headingFontFamily,
                }}
                className="font-serif text-xl font-bold tracking-wide uppercase sm:text-2xl"
              >
                Khoảnh Khắc Kỷ Niệm
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
              {photos.map((item, idx) => (
                <button
                  type="button"
                  key={item.id || idx}
                  onClick={() => setLightboxIndex(idx)}
                  className="group relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-white/20 shadow-md focus:outline-none"
                >
                  <img
                    src={item.url}
                    alt={item.alt || `Kỷ niệm ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                </button>
              ))}
            </div>

            {/* Lightbox modal */}
            <TemplateLightboxModal
              photos={photos}
              activeIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
              onChangeIndex={(idx) => setLightboxIndex(idx)}
            />
          </section>
        )}

        {/* 7. HỘP MỪNG CƯỚI (GIFT / VIETQR) */}
        <section className="py-2">
          <TemplateGiftSection
            tone={theme.templateTone}
            contained={contained}
            onOpenGift={() => setGiftOpen(true)}
          />

          <GiftModal
            open={giftOpen}
            onClose={() => setGiftOpen(false)}
            gift={data.gift}
            plan={data.plan}
            coupleName={`${data.couple.groomName} & ${data.couple.brideName}`}
            guestName={guestName}
            tone={theme.giftTone}
            wishAnchorId="rsvp-wishes"
          />
        </section>

        {/* 8. XÁC NHẬN THAM DỰ & SỔ LƯU BÚT (RSVP & WISHES) */}
        <section id="rsvp-wishes" className="py-2">
          <TemplateRsvpSection
            data={data}
            mode={mode}
            tone={theme.templateTone}
            contained={contained}
            inviteSlug={inviteSlug}
            weddingSlug={weddingSlug ?? data.weddingSlug}
            invitationMode={invitationMode}
            guestName={displayGuest}
            initialStatus={initialStatus}
            initialPlusOnes={initialPlusOnes}
            initialDiet={initialDiet}
            initialSongRequest={initialSongRequest}
            initialRideNeeded={initialRideNeeded}
          />
        </section>

        {/* 9. FOOTER */}
        <footer className="pt-8 pb-6 text-center">
          <ThemeMotif
            type={theme.motif}
            color={theme.accentTextColor}
            size={28}
            className="mx-auto mb-2 opacity-80"
          />
          <h4
            style={{
              fontFamily: theme.coupleFontFamily,
              color: theme.textColor,
            }}
            className="my-1 text-2xl font-bold sm:text-3xl"
          >
            <span>{data.couple.groomName}</span>
            <span className="mx-2 text-base opacity-80">&</span>
            <span>{data.couple.brideName}</span>
          </h4>
          <p style={{ color: theme.subtextColor }} className="mt-1 text-xs">
            Cảm ơn quý khách đã cùng sẻ chia niềm hạnh phúc với gia đình chúng tôi!
          </p>
        </footer>
      </div>
    </div>
  );
}
