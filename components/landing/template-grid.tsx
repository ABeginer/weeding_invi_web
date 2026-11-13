"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Diamond, Eye } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import type { WeddingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TEMPLATE_REGISTRY } from "@/templates/registry";
import type { WeddingTemplateMeta } from "@/templates/types";
import { ScrollReveal } from "./scroll-reveal";

type FilterTier = "all" | WeddingPlan;
type FilterTone = "all" | "bright" | "neutral" | "dark";
type FilterRitual = "all" | "an-hoi" | "gia-tien" | "vu-quy";

interface TemplateGridProps {
  userPlan: WeddingPlan;
  onUseTemplate?: (template: WeddingTemplateMeta) => void;
}

const RITUAL_FILTER_OPTIONS: { id: FilterRitual; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "an-hoi", label: "Ăn hỏi" },
  { id: "gia-tien", label: "Gia tiên" },
  { id: "vu-quy", label: "Vu quy" },
];

const TONE_OPTIONS: { id: FilterTone; label: string }[] = [
  { id: "all", label: "Tất cả tông" },
  { id: "bright", label: "Sáng" },
  { id: "neutral", label: "Trung tính" },
  { id: "dark", label: "Tối" },
];

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
        <Diamond className="h-5 w-5 text-accent-text" aria-hidden="true" />
        <p className="mt-2.5 font-display text-lg leading-snug font-semibold text-text">
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
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className="block h-full w-full bg-surface-alt object-cover"
    />
  );
}

export function TemplateGrid({ onUseTemplate }: TemplateGridProps) {
  const [tierFilter, setTierFilter] = React.useState<FilterTier>("all");
  const [toneFilter, setToneFilter] = React.useState<FilterTone>("all");
  const [ritualFilter, setRitualFilter] = React.useState<FilterRitual>("all");
  const copy = LANDING_COPY.templates;

  const handleSelectTemplate = (tpl: WeddingTemplateMeta) => {
    if (onUseTemplate) {
      onUseTemplate(tpl);
    } else {
      window.location.href = `/dashboard?createTemplateId=${encodeURIComponent(tpl.id)}`;
    }
  };

  const filtered = React.useMemo(() => {
    return TEMPLATE_REGISTRY.filter((tpl) => {
      const matchTier = tierFilter === "all" || tpl.plan === tierFilter;
      const matchTone = toneFilter === "all" || tpl.tone === toneFilter;
      const matchRitual =
        ritualFilter === "all" || tpl.ritualKey === ritualFilter;
      return matchTier && matchTone && matchRitual;
    });
  }, [tierFilter, toneFilter, ritualFilter]);

  return (
    <section
      id="mau-thiep"
      className="scroll-mt-14 border-b border-border bg-bg py-10 sm:py-12"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <ScrollReveal className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.12em] text-accent-text uppercase">
              {copy.eyebrow}
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold leading-[1.2] text-accent-text sm:text-3xl">
              {copy.title}
            </h2>
            <p className="mt-2 text-sm leading-[1.6] text-text-muted">
              {copy.description}
            </p>
          </div>

          {/* Nhóm bộ lọc: Gói + Tông màu + Nghi lễ */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
            {/* Bộ lọc gói */}
            <div
              role="group"
              aria-label="Lọc theo gói"
              className="flex flex-wrap items-center gap-1.5"
            >
              {copy.filters.map((item) => {
                const active = tierFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTierFilter(item.id)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex h-8 cursor-pointer items-center justify-center rounded-full border px-3 text-xs font-medium transition-colors",
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

            {/* Bộ lọc nghi lễ: Tất cả, Ăn hỏi, Gia tiên, Vu quy */}
            <div
              role="group"
              aria-label="Lọc theo nghi lễ"
              className="flex flex-wrap items-center gap-1.5"
            >
              {RITUAL_FILTER_OPTIONS.map((opt) => {
                const active = ritualFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRitualFilter(opt.id)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex h-8 cursor-pointer items-center justify-center rounded-full border px-3 text-xs font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                      active
                        ? "border-accent bg-accent font-semibold text-accent-fg"
                        : "border-border bg-surface text-text hover:border-accent",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* Bộ lọc tông màu: Sáng / Trung tính / Tối */}
            <div
              role="group"
              aria-label="Lọc theo tông màu"
              className="flex flex-wrap items-center gap-1.5"
            >
              {TONE_OPTIONS.map((opt) => {
                const active = toneFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setToneFilter(opt.id)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex h-8 cursor-pointer items-center justify-center rounded-full border px-3 text-xs font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
                      active
                        ? "border-accent-text bg-accent-soft font-semibold text-accent-text"
                        : "border-border/80 bg-surface/70 text-text-muted hover:border-accent hover:text-text",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-border bg-surface p-8 text-center text-sm text-text-muted">
            {copy.emptyFilterLabel}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((tpl, index) => {
              const isPlaceholder = Boolean(tpl.isPlaceholder);
              const isVip = tpl.plan === "vip";
              const tierBadgeText = isVip
                ? copy.comingSoonLabel
                : copy.planBadges[tpl.plan];

              return (
                <ScrollReveal
                  as="article"
                  key={tpl.id}
                  className="hover-lift flex flex-col overflow-hidden rounded-2xl border border-[var(--border-accent)] bg-[var(--surface-card)] backdrop-blur-[8px] shadow-xs"
                >
                  {/* Khung ảnh bìa tỉ lệ 3:4 */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-border bg-surface-alt">
                    <TemplateCoverMedia template={tpl} prioritize={index < 2} />

                    <span
                      className={cn(
                        "absolute top-3 right-3 z-10 rounded-full border px-2.5 py-0.5 text-[11px] font-medium shadow-xs",
                        getPlanBadgeClasses(tpl.plan),
                      )}
                    >
                      {tierBadgeText}
                    </span>
                  </div>

                  {/* Nội dung thẻ */}
                  <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-4">
                    <div>
                      <h3 className="font-display text-lg leading-[1.3] font-semibold text-text sm:text-xl">
                        {tpl.name}
                      </h3>
                      <p className="mt-0.5 text-[11px] font-medium tracking-[0.1em] text-accent-text uppercase sm:text-xs">
                        {tpl.subtitle}
                      </p>

                      {/* Tags: tier, style tags, ritual label */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            getPlanBadgeClasses(tpl.plan),
                          )}
                        >
                          {tierBadgeText}
                        </span>
                        {tpl.ritualLabel && (
                          <span className="rounded-full border border-accent/40 bg-accent-soft px-2 py-0.5 text-[10px] font-semibold text-accent-text">
                            {tpl.ritualLabel}
                          </span>
                        )}
                        {tpl.styleTags?.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] text-text-muted"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      {tpl.description ? (
                        <p className="mt-2 text-xs leading-[1.5] text-text-muted line-clamp-2">
                          {tpl.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      {isPlaceholder ? (
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-9 sm:h-10 w-full cursor-not-allowed items-center justify-center rounded-full border border-soon-border bg-soon-bg px-4 text-xs sm:text-sm font-medium whitespace-nowrap text-soon-fg opacity-85"
                        >
                          {copy.comingSoonLabel}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelectTemplate(tpl)}
                          className="inline-flex h-9 sm:h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-accent bg-accent px-4 text-xs sm:text-sm font-semibold whitespace-nowrap text-accent-fg shadow-xs transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                        >
                          <span>{copy.useTemplateLabel}</span>
                          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" />
                        </button>
                      )}

                      <Link
                        href={`/mau/${tpl.id}`}
                        className="inline-flex h-9 sm:h-10 w-full items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-4 text-xs sm:text-sm font-medium whitespace-nowrap text-text transition-colors hover:border-accent hover:bg-surface-alt hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                      >
                        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" />
                        <span>{copy.previewLabel}</span>
                      </Link>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
