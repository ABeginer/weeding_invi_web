import * as React from "react";
import Link from "next/link";
import { ArrowRight, Calculator, Calendar } from "lucide-react";
import { TOOLS_HUB_COPY } from "@/config/tools-copy";
import { cn } from "@/lib/utils";

export function ToolsPreviewSection() {
  const section = TOOLS_HUB_COPY.homepageSection;

  return (
    <section
      id="cong-cu-mien-phi"
      className="scroll-mt-14 border-b border-border bg-surface py-8 sm:py-9"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
              {section.eyebrow}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-text sm:text-3xl">
              {section.title}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-text-muted">
              {section.description}
            </p>
          </div>

          <Link
            href="/cong-cu"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-full border border-border bg-bg px-4 text-xs font-medium text-text transition-colors hover:border-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:self-auto"
          >
            <span>Xem tất cả công cụ</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {TOOLS_HUB_COPY.cards.map((card) => {
            const isWeddingCalc = card.id === "wedding-calc";
            const targetHref = card.available
              ? card.href
              : `/cong-cu#${card.id}`;

            return (
              <Link
                key={card.id}
                href={targetHref}
                className={cn(
                  "group flex flex-col justify-between rounded-xl border border-border bg-bg p-4 transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-accent-text">
                      {isWeddingCalc ? (
                        <Calculator className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] font-medium",
                        card.available
                          ? "border-success-border bg-success-bg text-success-fg"
                          : "border-soon-border bg-soon-bg text-soon-fg",
                      )}
                    >
                      {card.badge}
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-lg font-semibold text-text group-hover:text-accent-text sm:text-xl">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-text-muted sm:text-sm">
                    {card.description}
                  </p>
                </div>

                <div className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-text">
                  <span>{card.available ? card.ctaLabel : "Xem trạng thái"}</span>
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

