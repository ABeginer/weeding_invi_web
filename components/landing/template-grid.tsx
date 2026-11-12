"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Diamond, Eye } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import type { WeddingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TEMPLATE_REGISTRY, canPlanUseTemplate } from "@/templates/registry";
import type { WeddingTemplateMeta } from "@/templates/types";

type FilterValue = "all" | WeddingPlan;

interface TemplateGridProps {
  userPlan: WeddingPlan;
  onUseTemplate: (template: WeddingTemplateMeta) => void;
}

function getPlanBadgeClasses(plan: WeddingPlan): string {
  if (plan === "free") {
    return "border-sage bg-surface text-text";
  }
  if (plan === "pro") {
    return "border-accent bg-accent text-accent-fg font-semibold";
  }
  return "border-vip-border bg-vip-bg text-vip-fg font-semibold";
}

function TemplateCoverMedia({ template }: { template: WeddingTemplateMeta }) {
  const [loaded, setLoaded] = React.useState(false);
  const [errored, setErrored] = React.useState(Boolean(template.isPlaceholder));

  if (template.isPlaceholder || errored) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-surface-alt px-5 text-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-3 rounded-lg border border-border"
        />
        <Diamond className="h-6 w-6 text-accent-text" aria-hidden="true" />
        <p className="mt-3 font-display text-2xl font-semibold text-text">
          {template.name}
        </p>
        <span className="mt-2 rounded-full border border-soon-border bg-soon-bg px-3 py-0.5 text-[11px] font-medium text-soon-fg">
          {LANDING_COPY.templates.vipPlaceholderBadge}
        </span>
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-surface-alt motion-reduce:animate-none"
        />
      )}
      <img
        src={template.coverImage}
        alt={`${template.name} — ${template.subtitle}`}
        width={600}
        height={800}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className={cn(
          "block h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100",
          loaded ? "opacity-100" : "opacity-0",
        )}
      />
    </>
  );
}

export function TemplateGrid({ userPlan, onUseTemplate }: TemplateGridProps) {
  const [filter, setFilter] = React.useState<FilterValue>("all");
  const copy = LANDING_COPY.templates;

  const filtered = React.useMemo(() => {
    if (filter === "all") return TEMPLATE_REGISTRY;
    return TEMPLATE_REGISTRY.filter((tpl) => tpl.plan === filter);
  }, [filter]);

  return (
    <section
      id="mau-thiep"
      className="scroll-mt-16 border-b border-border bg-bg py-14 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium tracking-[0.18em] text-accent-text uppercase">
              {copy.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-accent-text sm:text-4xl">
              {copy.title}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-text-muted sm:text-base">
              {copy.description}
            </p>
          </div>

          {/* Bộ lọc */}
          <div
            role="group"
            aria-label={copy.title}
            className="flex flex-wrap items-center gap-2"
          >
            {copy.filters.map((item) => {
              const active = filter === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex h-9 cursor-pointer items-center justify-center rounded-full border px-4 text-xs font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                    active
                      ? "border-accent bg-accent font-semibold text-accent-fg"
                      : "border-border bg-surface text-text hover:border-accent",
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-surface p-10 text-center text-sm text-text-muted">
            {copy.emptyFilterLabel}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-3.5 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((tpl) => {
              const isPlaceholder = Boolean(tpl.isPlaceholder);
              const badgeText = copy.planBadges[tpl.plan];
              const requiresUpgrade =
                tpl.plan !== "free" && !canPlanUseTemplate(userPlan, tpl.plan);

              return (
                <article
                  key={tpl.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xs transition-colors hover:border-accent hover:bg-surface-alt"
                >
                  {/* Khung ảnh bìa tỉ lệ 3:4 */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-border bg-bg">
                    <TemplateCoverMedia template={tpl} />

                    <span
                      className={cn(
                        "absolute top-2.5 right-2.5 z-10 rounded-full border px-2.5 py-0.5 text-[11px] font-medium shadow-xs",
                        getPlanBadgeClasses(tpl.plan),
                      )}
                    >
                      {badgeText}
                    </span>
                  </div>

                  {/* Nội dung thẻ */}
                  <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
                    <div>
                      <h3 className="font-display text-lg leading-snug font-semibold text-text sm:text-xl">
                        {tpl.name}
                      </h3>
                      <p className="mt-0.5 text-[11px] tracking-[0.14em] text-text-muted uppercase">
                        {tpl.subtitle}
                      </p>
                      <p className="mt-2 hidden text-xs leading-relaxed text-text-muted sm:line-clamp-2">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                      <Link
                        href={`/mau/${tpl.id}`}
                        className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-text bg-transparent px-3 text-xs font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{copy.previewLabel}</span>
                      </Link>

                      {isPlaceholder ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-9 flex-1 cursor-not-allowed items-center justify-center rounded-full border border-soon-border bg-soon-bg px-3 text-xs font-medium text-soon-fg opacity-85"
                        >
                          {copy.comingSoonLabel}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUseTemplate(tpl)}
                          className={cn(
                            "inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1 rounded-full px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
                            requiresUpgrade
                              ? "border border-text bg-transparent text-text hover:bg-surface-alt"
                              : "bg-accent text-accent-fg hover:bg-accent-hover",
                          )}
                        >
                          <span>{copy.useTemplateLabel}</span>
                          <ArrowRight
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
