import * as React from "react";
import { LANDING_COPY } from "@/config/landing";

export function HowItWorks() {
  const copy = LANDING_COPY.howItWorks;

  return (
    <section
      id="cach-hoat-dong"
      className="scroll-mt-16 border-b border-lnd-border bg-lnd-bg py-14 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-medium tracking-[0.18em] text-lnd-gold uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-lnd-gold sm:text-4xl">
            {copy.title}
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {copy.steps.map((step) => (
            <article
              key={step.number}
              className="flex flex-col rounded-2xl border border-lnd-border bg-lnd-surface p-6 transition-colors hover:border-lnd-gold-soft"
            >
              <span className="font-display text-4xl leading-none font-semibold text-lnd-gold sm:text-5xl">
                {step.number}
              </span>
              <h3 className="mt-4 font-display text-2xl font-semibold text-lnd-body">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-lnd-muted">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

