import * as React from "react";
import type { ToolFaqItem } from "@/config/tools-copy";

interface ToolFaqSectionProps {
  title: string;
  items: readonly ToolFaqItem[];
}

export function ToolFaqSection({ title, items }: ToolFaqSectionProps) {
  return (
    <section
      aria-labelledby="tool-faq-heading"
      className="mt-10 rounded-2xl border border-border bg-surface p-5 sm:p-7 print:hidden"
    >
      <h2
        id="tool-faq-heading"
        className="font-display text-2xl font-semibold text-text sm:text-3xl"
      >
        {title}
      </h2>

      <dl className="mt-5 divide-y divide-border">
        {items.map((item) => (
          <div key={item.question} className="py-4 first:pt-0 last:pb-0">
            <dt className="text-sm font-semibold text-text sm:text-base">
              {item.question}
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-text-muted">
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
