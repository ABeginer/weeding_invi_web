"use client";

import * as React from "react";
import Link from "next/link";
import { LANDING_COPY } from "@/config/landing";
import { PRICING_ROWS, PRICING_TIERS } from "@/config/pricing";
import { SITE_LINKS } from "@/config/site";
import type { WeddingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

interface PricingTableProps {
  isAuthenticated: boolean;
  onSelectPaidPlan: (plan: Exclude<WeddingPlan, "free">) => void;
}

export function PricingTable({
  isAuthenticated,
  onSelectPaidPlan,
}: PricingTableProps) {
  const copy = LANDING_COPY.pricing;

  return (
    <section
      id="bang-gia"
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
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            {copy.description}
          </p>
        </div>

        {/* Bảng so sánh 3 cột (cuộn ngang mượt trên màn nhỏ, cột đầu cố định) */}
        <div className="mt-7 overflow-x-auto rounded-2xl border border-border bg-surface shadow-lg">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                <th
                  scope="col"
                  className="sticky left-0 z-10 w-[180px] border-r border-border bg-surface px-4 py-4 align-bottom text-xs font-semibold tracking-[0.14em] text-text-muted uppercase sm:w-[210px] sm:px-5"
                >
                  {copy.featureColumnHeader}
                </th>
                {PRICING_TIERS.map((tier) => (
                  <th
                    key={tier.id}
                    scope="col"
                    className={cn(
                      "min-w-[165px] px-4 py-4 align-top sm:px-5",
                      tier.highlighted
                        ? "border-x border-accent/60 bg-accent-soft"
                        : "bg-surface",
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-display text-lg font-semibold text-text sm:text-xl">
                          {tier.name}
                        </span>
                        {tier.badge && (
                          <span className="shrink-0 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent-fg uppercase">
                            {tier.badge}
                          </span>
                        )}
                      </div>
                      <p className="font-display text-2xl font-semibold text-text">
                        {tier.price}
                      </p>
                      <p className="text-xs font-normal leading-relaxed text-text-muted">
                        {tier.tagline}
                      </p>
                      {tier.pricePendingNote && (
                        <p className="text-[11px] font-normal text-text-muted">
                          {tier.pricePendingNote}
                        </p>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-border text-sm">
              {PRICING_ROWS.map((row) => (
                <tr key={row.id} className="group">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 border-r border-border bg-surface px-4 py-3 text-xs font-semibold text-text group-hover:bg-surface-alt sm:px-5 sm:text-sm"
                  >
                    {row.feature}
                  </th>
                  {PRICING_TIERS.map((tier) => {
                    const cell = row.values[tier.id];
                    return (
                      <td
                        key={`${row.id}-${tier.id}`}
                        className={cn(
                          "px-4 py-3 align-middle text-xs leading-relaxed text-text sm:px-5 sm:text-sm",
                          tier.highlighted
                            ? "border-x border-accent/30 bg-accent-soft/45 group-hover:bg-accent-soft/65"
                            : "group-hover:bg-surface-alt",
                        )}
                      >
                        <span>{cell.text}</span>
                        {cell.comingSoon && (
                          <span className="ml-2 inline-flex items-center rounded-full border border-soon-border bg-soon-bg px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-soon-fg">
                            {copy.comingSoonBadge}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr className="border-t border-border">
                <th
                  scope="row"
                  aria-label="Hành động chọn gói"
                  className="sticky left-0 z-10 border-r border-border bg-surface px-4 py-4 sm:px-5"
                />
                {PRICING_TIERS.map((tier) => (
                  <td
                    key={`cta-${tier.id}`}
                    className={cn(
                      "px-4 py-4 sm:px-5",
                      tier.highlighted
                        ? "border-x border-accent/60 bg-accent-soft/60"
                        : "bg-surface",
                    )}
                  >
                    {tier.id === "free" ? (
                      <Link
                        href={
                          isAuthenticated
                            ? SITE_LINKS.dashboard
                            : SITE_LINKS.createWedding
                        }
                        className="inline-flex h-9 w-full items-center justify-center rounded-full border border-text bg-transparent px-4 text-xs font-semibold text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:text-sm"
                      >
                        {tier.ctaLabel}
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          onSelectPaidPlan(tier.id === "vip" ? "vip" : "pro")
                        }
                        className={cn(
                          "inline-flex h-9 w-full cursor-pointer items-center justify-center rounded-full px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring sm:text-sm",
                          tier.highlighted
                            ? "bg-accent text-accent-fg hover:bg-accent-hover"
                            : "border border-text bg-transparent text-text hover:bg-surface-alt",
                        )}
                      >
                        {tier.ctaLabel}
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
}
