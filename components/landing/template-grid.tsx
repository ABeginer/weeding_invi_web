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

function TemplateCoverMedia({
  template,
  prioritize = false,
}: {
  template: WeddingTemplateMeta;
  prioritize?: boolean;
}) {
  const [errored, setErrored] = React.useState(Boolean(template.isPlaceholder));

  if (template.isPlaceholder || errored) {
    return (
      <div className="relative flex h-full w-full flex-col items-center justify-center bg-surface-alt px-5 text-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-3 rounded-lg border border-border"
        />
        <Diamond className="h-6 w-6 text-accent-text" aria-hidden="true" />
        <p className="mt-3 font-display text-xl font-semibold text-text sm:text-2xl">
          {template.name}
        </p>
        <span className="mt-2 rounded-full border border-soon-border bg-soon-bg px-3 py-0.5 text-[11px] font-medium text-soon-fg">
          {LANDING_COPY.templates.vipPlaceholderBadge}
        </span>
      </div>
    );
  }

  return (
    <img
      src={template.coverImage}
      alt={`${template.name} — ${template.subtitle}`}
      width={480}
      height={640}
      loading="eager"
      decoding="async"
      fetchPriority={prioritize ? "high" : "auto"}
      onError={() => setErrored(true)}
      className="block h-full w-full bg-surface-alt object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
    />
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
      className="scroll-mt-14 border-b border-border bg-bg py-10 sm:py-12"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
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
                    "inline-flex h-8 cursor-pointer items-center justify-center rounded-full border px-3.5 text-xs font-medium transition-colors",
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
          <div className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center text-sm text-text-muted">
            {copy.emptyFilterLabel}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((tpl, index) => {
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
                  <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-border bg-surface-alt">
                    <TemplateCoverMedia template={tpl} prioritize={index < 2} />

                    <span
                      className={cn(
                        "absolute top-2 right-2 z-10 rounded-full border px-2 py-0.5 text-[10px] font-medium shadow-xs",
                        getPlanBadgeClasses(tpl.plan),
                      )}
                    >
                      {badgeText}
                    </span>
                  </div>

                  {/* Nội dung thẻ */}
                  <div className="flex flex-1 flex-col justify-between p-3 sm:p-3.5">
                    <div>
                      <h3 className="font-display text-base leading-snug font-semibold text-text sm:text-lg">
                        {tpl.name}
                      </h3>
                      <p className="mt-0.5 text-[10px] tracking-[0.14em] text-text-muted uppercase">
                        {tpl.subtitle}
                      </p>
                      <p className="mt-1.5 hidden text-xs leading-relaxed text-text-muted sm:line-clamp-2">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-col gap-1.5 sm:flex-row">
                      <Link
                        href={`/mau/${tpl.id}`}
                        className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-full border border-text bg-transparent px-2.5 text-xs font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{copy.previewLabel}</span>
                      </Link>

                      {isPlaceholder ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-8 flex-1 cursor-not-allowed items-center justify-center rounded-full border border-soon-border bg-soon-bg px-2.5 text-xs font-medium text-soon-fg opacity-85"
                        >
                          {copy.comingSoonLabel}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onUseTemplate(tpl)}
                          className={cn(
                            "inline-flex h-8 flex-1 cursor-pointer items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring",
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
