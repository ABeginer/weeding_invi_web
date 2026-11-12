"use client";

import { useWeddingContent } from "./WeddingContentProvider";

export function Footer() {
  const wedding = useWeddingContent();
  const {
    bannerImage,
    bannerAlt,
    heading,
    thankYouTitle,
    thankYouBody,
    signature,
  } = wedding.sections.footer;

  const isPlaceholderAsset =
    !bannerImage ||
    bannerImage === "/images/og-cover.png" ||
    bannerImage.toLowerCase().endsWith(".svg");

  const resolvedBannerImage = isPlaceholderAsset
    ? wedding.photos[1]?.src ?? wedding.hero.coverImage
    : bannerImage;

  return (
    <footer className="relative flex min-h-[460px] w-full flex-col justify-end overflow-hidden bg-inv-olive-deep text-center text-white sm:min-h-[540px]">
      {resolvedBannerImage && (
        <img
          src={resolvedBannerImage}
          alt={bannerAlt || wedding.hero.coverAlt}
          width={900}
          height={1350}
          loading="lazy"
          className="absolute inset-0 block h-full w-full object-cover object-[center_20%]"
        />
      )}

      {/* Lớp chuyển sắc xanh olive đậm ở nửa dưới để tôn chữ trắng Thank You */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-[36%] bottom-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--inv-olive-deep) 24%, transparent) 28%, color-mix(in srgb, var(--inv-olive-deep) 68%, transparent) 62%, color-mix(in srgb, var(--inv-olive-deep) 95%, black 16%) 100%)",
        }}
      />

      <div className="relative z-10 px-6 pt-16 pb-[max(4.75rem,calc(env(safe-area-inset-bottom)+4rem))]">
        <h2 className="sr-only">{thankYouTitle}</h2>

        <p className="font-inv-script text-[clamp(50px,13.5vw,66px)] leading-[1.05] text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.28)]">
          {heading}
        </p>

        <p className="mx-auto mt-3 max-w-[360px] font-inv-serif text-[14.5px] leading-[1.65] text-white/95">
          {thankYouBody}
        </p>

        <p className="mt-4 font-inv-serif text-[11px] font-medium uppercase tracking-[0.22em] text-inv-cream-soft/90">
          {signature}
        </p>
      </div>
    </footer>
  );
}
