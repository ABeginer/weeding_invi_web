import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import { SITE_LINKS } from "@/config/site";

/**
 * Homepage chỉ giới thiệu bộ sưu tập; danh sách đầy đủ nằm ở /thiep-cuoi.
 */
export function TemplateTeaser() {
  const copy = LANDING_COPY.templates;

  return (
    <section
      id="mau-thiep"
      className="scroll-mt-14 border-b border-border bg-bg py-12 sm:py-16"
    >
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <p className="text-[12px] font-semibold tracking-[0.12em] text-accent-text uppercase">
          {copy.eyebrow}
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold leading-[1.2] text-accent-text sm:text-3xl">
          {copy.title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-[1.7] text-text-muted sm:text-base">
          {copy.description}
        </p>
        <Link
          href={SITE_LINKS.templates}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <span>Xem tất cả mẫu thiệp</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
