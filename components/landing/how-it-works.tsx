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
      className="scroll-mt-14 border-b border-border bg-bg py-12 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-3xl leading-[1.15] font-semibold text-accent-text sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
            {copy.description}
          </p>
        </div>

        <div className="mt-9 grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
          {copy.steps.map((step, index) => {
            const Icon = FEATURE_ICONS[index] ?? Users;
            return (
              <article
                key={step.number}
                className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-xs transition-colors hover:border-accent sm:p-7"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sage bg-surface-alt text-sage">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="font-display text-xl leading-snug font-semibold text-text sm:text-2xl">
                        {step.title}
                      </h3>
                    </div>
                    <span className="shrink-0 font-display text-xl leading-none font-semibold text-accent-text sm:text-2xl">
                      {step.number}
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-text sm:text-[15px]">
                    {step.description}
                  </p>
                </div>

                <ul className="mt-5 space-y-2 border-t border-border pt-4 text-xs leading-relaxed text-text-muted sm:text-sm">
                  {step.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-2.5">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-sage"
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

        <div className="mt-6 flex flex-col gap-5 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-7 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-accent-soft text-accent-text">
              <LayoutDashboard className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h3 className="font-display text-xl font-semibold text-accent-text sm:text-2xl">
                {copy.dashboardCtaTitle}
              </h3>
              <p className="max-w-2xl text-xs leading-relaxed text-text-muted sm:text-sm">
                {copy.dashboardCtaDescription}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center md:shrink-0">
            <Link
              href={SITE_LINKS.createWedding}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-6 text-xs font-semibold text-accent-fg shadow-md transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:text-sm"
            >
              <span>{copy.dashboardPrimaryCta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/#bang-gia"
              className="inline-flex h-11 items-center justify-center rounded-full border border-text bg-transparent px-5 text-xs font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:text-sm"
            >
              {copy.dashboardSecondaryCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
