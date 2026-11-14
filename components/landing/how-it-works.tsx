import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  LayoutDashboard,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import { SITE_LINKS } from "@/config/site";
import { ScrollReveal } from "./scroll-reveal";

const FEATURE_ICONS = [
  Sparkles,
  Users,
  Send,
];

export function HowItWorks() {
  const copy = LANDING_COPY.howItWorks;

  return (
    <section
      id="cach-hoat-dong"
      className="scroll-mt-14 border-b border-border bg-bg py-10 sm:py-12"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.12em] text-accent-text uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold leading-[1.2] text-accent-text sm:text-3xl">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm leading-[1.6] text-text-muted">
            {copy.description}
          </p>
        </ScrollReveal>

        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
          {copy.steps.map((step, index) => {
            const Icon = FEATURE_ICONS[index] ?? Users;
            return (
              <ScrollReveal
                as="article"
                key={step.number}
                className="flex flex-col justify-between rounded-2xl border border-[var(--border-accent)] bg-[var(--surface-card)] backdrop-blur-[8px] p-4 sm:p-5 shadow-xs transition-colors hover:border-accent"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sage bg-surface-alt text-sage">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <h3 className="font-display text-lg leading-snug font-semibold text-text sm:text-xl">
                        {step.title}
                      </h3>
                    </div>
                    <span className="mt-0.5 shrink-0 font-display text-lg leading-none font-semibold text-accent-text sm:text-xl">
                      {step.number}
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-text sm:text-sm">
                    {step.description}
                  </p>
                </div>

                <ul className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs leading-relaxed text-text-muted">
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
              </ScrollReveal>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm md:flex-row md:items-center md:justify-between lg:p-5">
          <div className="flex items-start gap-3.5">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-accent-soft text-accent-text">
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
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-accent px-5 text-xs font-semibold text-accent-fg shadow-md transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:text-sm"
            >
              <span>{copy.dashboardPrimaryCta}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/#bang-gia"
              className="inline-flex h-10 items-center justify-center rounded-full border border-text bg-transparent px-4 text-xs font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:text-sm"
            >
              {copy.dashboardSecondaryCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
