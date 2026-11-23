import * as React from "react";
import Link from "next/link";
import { ArrowRight, Calculator, CalendarDays, MessageSquareHeart } from "lucide-react";
import { TOOLS_HUB_COPY } from "@/config/tools-copy";
import { ScrollReveal } from "./scroll-reveal";

export function ToolsPreviewSection() {
  const section = TOOLS_HUB_COPY.homepageSection;

  return (
    <section
      id="cong-cu-mien-phi"
      className="scroll-mt-14 border-b border-[#E8E2D9] bg-[#FAF8F5] py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D9] bg-white/80 px-4 py-1.5 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B89B72]" aria-hidden="true" />
              <span className="text-[12px] font-medium tracking-wide text-[#7A1C24] sm:text-[13px]">
                {section.eyebrow}
              </span>
            </div>

            <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl">
              Công cụ chuẩn bị cưới <span className="italic text-[#7A1C24]">miễn phí</span>
            </h2>

            <p className="mt-3 text-base leading-relaxed text-[#6B655E]">
              {section.description}
            </p>
          </div>

          <Link
            href="/cong-cu"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-full border border-[#E8E2D9] bg-white px-6 text-xs font-medium text-[#1F1D1A] transition-colors hover:border-[#7A1C24] hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24] sm:self-auto sm:text-sm"
          >
            <span>Xem tất cả công cụ</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </ScrollReveal>

        {/* 3 Equal Cards in Horizontal Grid */}
        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {TOOLS_HUB_COPY.cards.map((card) => {
            const targetHref = card.available ? card.href : `/cong-cu#${card.id}`;

            const renderIcon = () => {
              if (card.id === "wedding-calc") {
                return <Calculator className="h-5 w-5" strokeWidth={1.5} />;
              }
              if (card.id === "lunar-converter") {
                return <CalendarDays className="h-5 w-5" strokeWidth={1.5} />;
              }
              return <MessageSquareHeart className="h-5 w-5" strokeWidth={1.5} />;
            };

            const isNewBadge = card.id === "zalo-invite";

            return (
              <ScrollReveal as="div" key={card.id} className="flex">
                <Link
                  href={targetHref}
                  className="group flex w-full flex-col justify-between rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-2xs transition-all duration-300 hover:border-[#7A1C24]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E8E2D9] bg-[#FAF8F5] text-[#7A1C24] transition-colors group-hover:border-[#7A1C24]/30 group-hover:bg-[#F4EFEA]">
                        {renderIcon()}
                      </span>

                      {isNewBadge ? (
                        <span className="rounded-full border border-[#B89B72]/40 bg-[#B89B72]/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#7A1C24] uppercase">
                          Mới
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-5 font-serif text-2xl font-normal text-[#1F1D1A] transition-colors group-hover:text-[#7A1C24]">
                      {card.title}
                    </h3>

                    <p className="mt-2 text-sm leading-relaxed text-[#6B655E]">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-1.5 border-t border-[#E8E2D9]/60 pt-4 text-xs font-semibold text-[#7A1C24]">
                    <span>{card.available ? card.ctaLabel : "Xem chi tiết"}</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
