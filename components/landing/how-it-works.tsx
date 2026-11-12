import * as React from "react";
import { Gift, MapPin, MessageSquareHeart, UserCheck, Users } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";

const PAIN_POINT_ICONS = [Users, UserCheck, MapPin, MessageSquareHeart];

export function HowItWorks() {
  const copy = LANDING_COPY.howItWorks;

  return (
    <section
      id="cach-hoat-dong"
      className="scroll-mt-16 border-b border-border bg-bg py-14 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-accent-text sm:text-4xl">
            {copy.title}
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {copy.steps.map((step, index) => {
            const Icon = PAIN_POINT_ICONS[index] ?? Gift;
            return (
              <article
                key={step.number}
                className="flex flex-col rounded-2xl border border-border bg-surface p-6 shadow-xs transition-colors hover:border-accent"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sage bg-surface-alt text-sage">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-display text-2xl leading-none font-semibold text-accent-text">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-2xl font-semibold text-text">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
