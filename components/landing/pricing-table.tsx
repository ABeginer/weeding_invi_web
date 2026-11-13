"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import { PRICING_ROWS, PRICING_TIERS } from "@/config/pricing";
import { SITE_LINKS } from "@/config/site";
import type { WeddingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "./scroll-reveal";

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
        <ScrollReveal className="mx-auto max-w-xl text-center">
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

        {/* 3 thẻ gói nằm ngang trên desktop, xếp dọc gọn gàng trên mobile */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch">
          {PRICING_TIERS.map((tier) => (
            <ScrollReveal
              as="article"
              key={tier.id}
              className="relative flex h-full flex-col"
            >
              {tier.badge && (
                <span className="absolute -top-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold tracking-widest text-accent-fg uppercase shadow-sm">
                  {tier.badge}
                </span>
              )}

              <div
                className={cn(
                  "flex h-full flex-1 flex-col overflow-hidden rounded-2xl border bg-[var(--surface-card)] backdrop-blur-[8px] transition-shadow",
                  tier.highlighted
                    ? "border-accent shadow-lg ring-1 ring-accent/35"
                    : "border-[var(--border-accent)] shadow-sm",
                )}
              >
                {/* Phần đầu thẻ: Tên gói, giá & mô tả với chiều cao tối thiểu đồng nhất */}
                <div
                  className={cn(
                    "flex min-h-[196px] flex-col justify-between border-b border-border p-5 sm:min-h-[210px] sm:p-6",
                    tier.highlighted ? "bg-accent-soft/45" : "bg-surface",
                  )}
                >
                  <div>
                    <h3 className="font-display text-xl font-semibold text-text sm:text-2xl">
                      {tier.name}
                    </h3>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="font-display text-3xl font-semibold tracking-tight tabular-nums text-text sm:text-4xl">
                        {tier.price}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-text-muted line-clamp-1">
                      {tier.tagline}
                    </p>
                  </div>
                  <p className="mt-2 text-xs font-normal text-text-muted">
                    Không phát sinh phí ẩn
                  </p>
                </div>

                {/* Danh sách 7 tính năng: cùng min-height để các hàng luôn thẳng hàng ngang */}
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <p className="text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase">
                    {copy.featureColumnHeader}
                  </p>

                  <ul className="mt-3.5 flex-1 divide-y divide-border/70">
                    {PRICING_ROWS.map((row) => {
                      const cell = row.values[tier.id];
                      return (
                        <li
                          key={`${tier.id}-${row.id}`}
                          className="flex min-h-[64px] items-start gap-2.5 py-3 first:pt-0 last:pb-0 sm:min-h-[70px]"
                        >
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-accent-text"
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-text-muted">
                              {row.feature}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm font-medium leading-snug text-text">
                              {cell.text !== "Sắp có" && (
                                <span>{cell.text}</span>
                              )}
                              {cell.comingSoon && (
                                <span className="inline-flex items-center rounded-full border border-soon-border bg-soon-bg px-2 py-0.5 text-[10px] font-medium whitespace-nowrap text-soon-fg">
                                  {copy.comingSoonBadge}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Nút chọn gói ghim cuối thẻ (mt-auto) để căn thẳng hàng ngang tuyệt đối */}
                  <div className="mt-auto border-t border-border pt-5">
                    {tier.id === "free" ? (
                      <Link
                        href={SITE_LINKS.createWedding}
                        className="inline-flex min-h-[44px] h-11 w-full items-center justify-center rounded-full border border-text bg-transparent px-4 text-sm font-semibold text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        {tier.ctaLabel}
                      </Link>
                    ) : tier.id === "pro" ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAuthenticated) {
                            window.location.assign(
                              `/auth/login?returnTo=${encodeURIComponent("/?pay=pro")}`,
                            );
                            return;
                          }
                          onSelectPaidPlan("pro");
                        }}
                        className="inline-flex min-h-[44px] h-11 w-full cursor-pointer items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        {tier.ctaLabel}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isAuthenticated) {
                            window.location.assign(
                              `/auth/login?returnTo=${encodeURIComponent("/?pay=vip")}`,
                            );
                            return;
                          }
                          onSelectPaidPlan("vip");
                        }}
                        className="inline-flex min-h-[44px] h-11 w-full cursor-pointer items-center justify-center rounded-full border border-text bg-transparent px-4 text-sm font-semibold text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        {tier.ctaLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
