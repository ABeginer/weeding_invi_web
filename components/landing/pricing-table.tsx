"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
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
      className="scroll-mt-14 border-b border-border bg-bg py-8 sm:py-10"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1.5 font-display text-2xl font-semibold text-accent-text sm:text-3xl">
            {copy.title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-text-muted">
            {copy.description}
          </p>
        </div>

        {/* 3 thẻ gói nằm ngang trên desktop, xếp dọc gọn gàng trên mobile */}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:items-stretch">
          {PRICING_TIERS.map((tier) => (
            <article
              key={tier.id}
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border bg-surface transition-shadow",
                tier.highlighted
                  ? "border-accent shadow-md ring-1 ring-accent/35"
                  : "border-border shadow-xs",
              )}
            >
              {/* Phần đầu thẻ: Tên gói, huy hiệu, giá & mô tả */}
              <div
                className={cn(
                  "border-b border-border p-4",
                  tier.highlighted ? "bg-accent-soft/45" : "bg-surface",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <h3 className="font-display text-lg font-semibold text-text sm:text-xl">
                    {tier.name}
                  </h3>
                  {tier.badge && (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent-fg uppercase">
                      {tier.badge}
                    </span>
                  )}
                </div>

                <p className="mt-2 font-display text-2xl font-semibold tracking-tight tabular-nums text-text sm:text-3xl">
                  {tier.price}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-text-muted sm:text-[13px]">
                  {tier.tagline}
                </p>
                {tier.pricePendingNote ? (
                  <p className="mt-0.5 text-[11px] font-normal text-text-muted">
                    {tier.pricePendingNote}
                  </p>
                ) : (
                  <p className="mt-0.5 text-[11px] font-normal text-text-muted">
                    Không phát sinh phí ẩn
                  </p>
                )}
              </div>

              {/* Danh sách tính năng xếp theo chiều dọc */}
              <div className="flex flex-1 flex-col p-4">
                <p className="text-[10px] font-semibold tracking-[0.14em] text-text-muted uppercase">
                  {copy.featureColumnHeader}
                </p>

                <ul className="mt-2.5 flex-1 divide-y divide-border/70">
                  {PRICING_ROWS.map((row) => {
                    const cell = row.values[tier.id];
                    return (
                      <li
                        key={`${tier.id}-${row.id}`}
                        className="flex items-start gap-2 py-1.5 first:pt-0 last:pb-0"
                      >
                        <Check
                          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent-text"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium text-text-muted">
                            {row.feature}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium leading-snug text-text sm:text-[13px]">
                            <span>{cell.text}</span>
                            {cell.comingSoon && (
                              <span className="inline-flex items-center rounded-full border border-soon-border bg-soon-bg px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-soon-fg">
                                {copy.comingSoonBadge}
                              </span>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                {/* Nút chọn gói ghim cuối thẻ để căn thẳng hàng */}
                <div className="mt-4 border-t border-border pt-3.5">
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
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
