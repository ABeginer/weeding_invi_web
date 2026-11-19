"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Eye, Sparkles } from "lucide-react";
import { SITE_LINKS } from "@/config/site";
import { getTemplateCollection, type TemplateCollectionItem } from "@/templates/registry";
import type { TemplateId } from "@/templates/types";

type FilterTab = "featured" | "minimal" | "traditional" | "modern";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "featured", label: "Nổi bật" },
  { id: "minimal", label: "Tối giản" },
  { id: "traditional", label: "Truyền thống" },
  { id: "modern", label: "Hiện đại" },
];

const FEATURED_IDS: TemplateId[] = [
  "nau-toi-gian",
  "do-truyen-thong",
  "flowery-white",
  "pro-1",
  "minimal-red",
  "long-phung",
  "basic-1",
  "do-ruou-vang",
];

function getCategoryForTemplate(template: TemplateCollectionItem): FilterTab {
  const id = template.id;
  const tagsStr = (template.styleTags || []).join(" ").toLowerCase();

  if (
    tagsStr.includes("truyền thống") ||
    tagsStr.includes("long phụng") ||
    tagsStr.includes("song hỷ") ||
    tagsStr.includes("vu quy") ||
    tagsStr.includes("hoàng kim") ||
    [
      "do-truyen-thong",
      "long-phung",
      "long-phung-v2-do",
      "song-hy-v2-do",
      "hoang-kim-do",
      "do-may-man",
      "ritual-vu-quy",
      "chibi-red",
    ].includes(id)
  ) {
    return "traditional";
  }

  if (
    tagsStr.includes("tối giản") ||
    tagsStr.includes("nâu") ||
    tagsStr.includes("mộc") ||
    tagsStr.includes("hoa khô") ||
    [
      "nau-toi-gian",
      "minimal-red",
      "minimal-brown",
      "basic-1",
      "basic-2",
      "basic-3",
      "bach-su-nau",
      "hoa-moc-nau",
    ].includes(id)
  ) {
    return "minimal";
  }

  return "modern";
}

export function TemplateShowcase() {
  const [activeTab, setActiveTab] = React.useState<FilterTab>("featured");

  const allTemplates = React.useMemo(() => getTemplateCollection(), []);

  const displayTemplates = React.useMemo(() => {
    if (activeTab === "featured") {
      const featuredMap = new Map(allTemplates.map((t) => [t.id, t]));
      const featured = FEATURED_IDS.map((id) => featuredMap.get(id)).filter(
        (t): t is TemplateCollectionItem => Boolean(t),
      );
      if (featured.length >= 8) return featured.slice(0, 8);
      // Fallback if not all IDs found
      const remaining = allTemplates.filter((t) => !FEATURED_IDS.includes(t.id as TemplateId));
      return [...featured, ...remaining].slice(0, 8);
    }

    return allTemplates
      .filter((t) => getCategoryForTemplate(t) === activeTab)
      .slice(0, 8);
  }, [activeTab, allTemplates]);

  return (
    <section id="mau-thiep" className="scroll-mt-14 border-b border-[#E8E2D9] bg-[#FAF8F5] py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <header className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E8E2D9] bg-white/80 px-4 py-1.5 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-[#B89B72]" aria-hidden="true" />
            <span className="text-[12px] font-medium tracking-wide text-[#7A1C24] sm:text-[13px]">
              Bộ sưu tập mẫu thiệp
            </span>
          </div>

          <h2 className="mt-4 font-serif text-3xl font-normal tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl">
            Tuyển tập thiệp cưới <span className="italic text-[#7A1C24]">đặc sắc</span>
          </h2>

          <p className="mt-3 text-base leading-relaxed text-[#6B655E]">
            Mỗi thiết kế đều được trau chuốt tỉ mỉ từ màu sắc, font chữ đến hiệu ứng chạm mở mượt mà trên mọi thiết bị di động.
          </p>
        </header>

        {/* Filter Pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex cursor-pointer items-center justify-center rounded-full px-5 py-2 text-xs font-medium transition-all sm:text-sm ${
                  isActive
                    ? "bg-[#7A1C24] text-white shadow-xs"
                    : "border border-[#E8E2D9] bg-white text-[#1F1D1A]/80 hover:border-[#B89B72] hover:bg-[#F4EFEA]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Templates Visual Grid (8 items) */}
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {displayTemplates.map((template) => {
            const createUrl = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(
              template.id,
            )}`;
            const demoUrl = template.demoUrl || `/mau/${template.id}`;

            return (
              <div
                key={template.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white p-3 shadow-2xs transition-all duration-300 hover:border-[#B89B72]/70 hover:shadow-md"
              >
                {/* Image Container with 3/4 aspect */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#F4EFEA]">
                  <img
                    src={template.previewImage}
                    alt={template.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />

                  {/* Desktop Hover Overlay */}
                  <div className="absolute inset-0 hidden items-center justify-center gap-2.5 bg-[#1F1D1A]/40 p-4 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100 lg:flex">
                    <Link
                      href={demoUrl}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-white/90 px-4 text-xs font-semibold text-[#1F1D1A] shadow-sm backdrop-blur-xs transition-colors hover:bg-white"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Xem thử</span>
                    </Link>

                    <Link
                      href={createUrl}
                      className="inline-flex h-9 items-center justify-center rounded-full bg-[#7A1C24] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#5E141B]"
                    >
                      <span>Dùng mẫu</span>
                    </Link>
                  </div>

                  {/* Plan Badge */}
                  {template.plan !== "free" && (
                    <div className="absolute top-2.5 right-2.5 rounded-full bg-[#1F1D1A]/80 px-2.5 py-0.5 text-[10px] font-semibold text-[#B89B72] uppercase tracking-wider backdrop-blur-xs">
                      {template.plan.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="flex flex-1 flex-col justify-between pt-3 pb-1">
                  <div>
                    <h3 className="font-serif text-lg font-medium text-[#1F1D1A] transition-colors group-hover:text-[#7A1C24]">
                      {template.name}
                    </h3>
                    <p className="mt-0.5 line-clamp-1 text-xs text-[#6B655E]">
                      {template.subtitle || (template.styleTags && template.styleTags.join(" · ")) || "Thiệp cưới phong cách"}
                    </p>
                  </div>

                  {/* Mobile Action Bar (always accessible on mobile) */}
                  <div className="mt-3 flex items-center gap-2 border-t border-[#E8E2D9]/60 pt-2.5 lg:hidden">
                    <Link
                      href={demoUrl}
                      className="flex-1 inline-flex h-8 items-center justify-center rounded-full border border-[#E8E2D9] bg-white text-xs font-medium text-[#1F1D1A]"
                    >
                      Xem thử
                    </Link>
                    <Link
                      href={createUrl}
                      className="flex-1 inline-flex h-8 items-center justify-center rounded-full bg-[#7A1C24] text-xs font-medium text-white"
                    >
                      Dùng mẫu
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer CTA */}
        <div className="mt-14 text-center">
          <Link
            href={SITE_LINKS.templates}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#E8E2D9] bg-white px-8 text-sm font-medium text-[#1F1D1A] shadow-2xs transition-all hover:border-[#7A1C24] hover:bg-[#F4EFEA] hover:text-[#7A1C24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A1C24]"
          >
            <span>Xem tất cả 27 mẫu thiệp</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
