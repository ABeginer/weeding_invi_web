"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { PLAN_LABELS } from "@/config/template-features";
import { cn } from "@/lib/utils";
import { TemplatePreviewDialog } from "./template-preview-dialog";
import type { CollectionTemplate } from "./types";

interface TemplateGridBrowserProps {
  templates: CollectionTemplate[];
  initialStyle?: string;
}

export function TemplateGridBrowser({ templates, initialStyle }: TemplateGridBrowserProps) {
  const [query, setQuery] = React.useState("");
  const [style, setStyle] = React.useState(initialStyle ?? "all");
  const [plan, setPlan] = React.useState<"all" | "free" | "pro" | "vip">("all");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState<Set<string>>(() => new Set());

  const styleOptions = React.useMemo(() => {
    const tags = new Set<string>();
    for (const template of templates) {
      for (const tag of template.subtitle.split("·")) {
        const value = tag.trim();
        if (value) tags.add(value);
      }
      for (const tag of template.styleTags ?? []) tags.add(tag);
      if (template.ritualLabel) tags.add(template.ritualLabel);
    }
    if (initialStyle && initialStyle !== "all") tags.add(initialStyle);
    return Array.from(tags).sort((a, b) => a.localeCompare(b, "vi"));
  }, [initialStyle, templates]);

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return templates.filter((template) => {
      if (plan !== "all" && template.plan !== plan) return false;
      if (style !== "all") {
        const haystack = [template.subtitle, ...(template.styleTags ?? [])]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(style.toLowerCase())) return false;
      }
      if (!needle) return true;
      const searchable = [
        template.name,
        template.subtitle,
        template.ritualLabel ?? "",
        ...(template.styleTags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return searchable.includes(needle);
    });
  }, [plan, query, style, templates]);

  const active = templates.find((template) => template.id === openId) ?? null;

  return (
    <div>
      <div className="rounded-2xl border border-border bg-surface p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Tìm mẫu thiệp</span>
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-text-muted"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên mẫu, phong cách…"
              className="h-11 w-full rounded-full border border-border bg-bg pr-4 pl-9 text-sm text-text outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-focus-ring"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            {(["all", "free", "pro", "vip"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPlan(option)}
                aria-pressed={plan === option}
                className={cn(
                  "h-9 cursor-pointer rounded-full border px-3 text-xs font-medium transition-colors",
                  plan === option
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-border bg-surface text-text hover:bg-surface-alt",
                )}
              >
                {option === "all" ? "Tất cả gói" : PLAN_LABELS[option]}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold tracking-[0.12em] text-text-muted uppercase">
            Phong cách
          </span>
          <button
            type="button"
            onClick={() => setStyle("all")}
            aria-pressed={style === "all"}
            className={cn(
              "h-8 cursor-pointer rounded-full border px-3 text-[11px] transition-colors",
              style === "all"
                ? "border-accent bg-accent-soft text-accent-text"
                : "border-border bg-surface text-text-muted hover:bg-surface-alt",
            )}
          >
            Tất cả
          </button>
          {styleOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStyle(option)}
              aria-pressed={style === option}
              className={cn(
                "h-8 cursor-pointer rounded-full border px-3 text-[11px] transition-colors",
                style === option
                  ? "border-accent bg-accent-soft text-accent-text"
                  : "border-border bg-surface text-text-muted hover:bg-surface-alt",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 text-xs text-text-muted" aria-live="polite">
        {filtered.length} mẫu phù hợp
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-sm text-text">Không tìm thấy mẫu phù hợp.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setStyle("all");
              setPlan("all");
            }}
            className="mt-3 inline-flex h-10 cursor-pointer items-center rounded-full bg-accent px-5 text-xs font-semibold text-accent-fg"
          >
            Xoá bộ lọc
          </button>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {filtered.map((template) => (
            <li key={template.id}>
              <button
                type="button"
                onClick={() => setOpenId(template.id)}
                className="group block w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                <span className="relative block aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-surface-alt shadow-sm">
                  {!failed.has(template.id) ? (
                    <img
                      src={template.previewImage}
                      alt={`Mẫu thiệp ${template.name}`}
                      width={700}
                      height={933}
                      loading="lazy"
                      decoding="async"
                      onError={() =>
                        setFailed((previous) => {
                          const next = new Set(previous);
                          next.add(template.id);
                          return next;
                        })
                      }
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <span className="flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center">
                      <span className="text-sm font-medium text-text">{template.name}</span>
                      <span className="text-[11px] text-text-muted">
                        {template.isPlaceholder ? "Sắp ra mắt" : "Chưa có ảnh xem trước"}
                      </span>
                    </span>
                  )}

                  <span className="absolute inset-x-0 bottom-0 hidden items-center justify-center bg-text/60 p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:flex">
                    <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-text">
                      Xem thử trực tiếp
                    </span>
                  </span>
                </span>

                <span className="mt-2 block">
                  <span className="flex items-start justify-between gap-2">
                    <span className="font-display text-sm font-semibold text-text">
                      {template.name}
                    </span>
                    <span className="shrink-0 rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-semibold text-text-muted">
                      {PLAN_LABELS[template.plan]}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-text-muted">
                    {template.subtitle}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {active && (
        <TemplatePreviewDialog template={active} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
