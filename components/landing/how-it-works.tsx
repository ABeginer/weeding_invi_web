import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  LayoutDashboard,
  MessageSquareHeart,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import { SITE_LINKS } from "@/config/site";

const FEATURE_ICONS = [
  Users,
  BarChart3,
  SlidersHorizontal,
  MessageSquareHeart,
];

export function HowItWorks() {
  const copy = LANDING_COPY.howItWorks;

  return (
    <section
      id="cach-hoat-dong"
      className="scroll-mt-14 border-b border-border bg-bg py-8 sm:py-10"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1.5 font-display text-2xl leading-[1.15] font-semibold text-accent-text sm:text-3xl">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            {copy.description}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {copy.steps.map((step, index) => {
            const Icon = FEATURE_ICONS[index] ?? Users;
            return (
              <article
                key={step.number}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface p-4 shadow-xs transition-colors hover:border-accent sm:p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sage bg-surface-alt text-sage">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h3 className="font-display text-lg leading-snug font-semibold text-text sm:text-xl">
                        {step.title}
                      </h3>
                    </div>
                    <span className="shrink-0 font-display text-lg leading-none font-semibold text-accent-text sm:text-xl">
                      {step.number}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-text sm:text-sm">
                    {step.description}
                  </p>
                </div>

                <ul className="mt-3.5 space-y-1.5 border-t border-border pt-3 text-xs leading-relaxed text-text-muted">
                  {step.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sage"
                        aria-hidden="true"
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm sm:p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-accent-soft text-accent-text">
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="space-y-0.5">
              <h3 className="font-display text-lg font-semibold text-accent-text sm:text-xl">
                {copy.dashboardCtaTitle}
              </h3>
              <p className="max-w-xl text-xs leading-relaxed text-text-muted sm:text-sm">
                {copy.dashboardCtaDescription}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center md:shrink-0">
            <Link
              href={SITE_LINKS.createWedding}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-accent px-5 text-xs font-semibold text-accent-fg shadow-sm transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:h-10 sm:text-sm"
            >
              <span>{copy.dashboardPrimaryCta}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            <Link
              href="/#bang-gia"
              className="inline-flex h-9 items-center justify-center rounded-full border border-text bg-transparent px-4 text-xs font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:h-10 sm:text-sm"
            >
              {copy.dashboardSecondaryCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
