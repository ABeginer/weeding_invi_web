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
      className="mt-10 rounded-2xl border border-[#E8E2D9] bg-white p-6 sm:p-8 print:hidden"
    >
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-[#B89B72]">
          GIẢI ĐÁP THẮC MẮC
        </p>
        <h2
          id="tool-faq-heading"
          className="font-serif text-2xl sm:text-3xl font-medium text-[#1F1D1A]"
        >
          {title}
        </h2>
      </div>

      <dl className="mt-6 divide-y divide-[#E8E2D9]">
        {items.map((item) => (
          <div key={item.question} className="py-4 first:pt-0 last:pb-0">
            <dt className="text-sm sm:text-base font-semibold text-[#1F1D1A]">
              {item.question}
            </dt>
            <dd className="mt-1.5 text-xs sm:text-sm leading-relaxed text-[#6B655E]">
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

