import * as React from "react";
import { Gift, MapPin, MessageSquareHeart, UserCheck, Users } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";

const PAIN_POINT_ICONS = [Users, UserCheck, MapPin, MessageSquareHeart];

export function HowItWorks() {
  const copy = LANDING_COPY.howItWorks;

  return (
    <section
      id="cach-hoat-dong"
      className="scroll-mt-14 border-b border-border bg-bg py-10 sm:py-12"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold text-accent-text sm:text-3xl">
            {copy.title}
          </h2>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {copy.steps.map((step, index) => {
            const Icon = PAIN_POINT_ICONS[index] ?? Gift;
            return (
              <article
                key={step.number}
                className="flex flex-col rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-xs transition-colors hover:border-accent"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sage bg-surface-alt text-sage">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="font-display text-xl leading-none font-semibold text-accent-text">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-text sm:text-xl">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-text-muted sm:text-sm">
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
