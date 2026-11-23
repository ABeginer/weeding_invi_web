"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Eye,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { PLAN_DISPLAY_NAME } from "@/lib/plan-labels";
import { SITE_LINKS } from "@/config/site";
import { TemplatePreviewDialog } from "./template-preview-dialog";
import type { CollectionTemplate } from "./types";
import type { TemplateCategory, TemplateColorGroup } from "@/templates/types";

export interface TemplateGridBrowserProps {
  templates: CollectionTemplate[];
  initialStyle?: string;
  initialCategory?: string;
  initialColor?: string;
}

const CATEGORY_TABS: { id: "all" | TemplateCategory; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "traditional", label: "Truyền thống" },
  { id: "romantic", label: "Lãng mạn" },
  { id: "minimal", label: "Tối giản" },
  { id: "hongkong", label: "Hongkong" },
];

const COLOR_SWATCHES: {
  id: TemplateColorGroup;
  hex: string;
  label: string;
}[] = [
    { id: "red", hex: "#7A1C24", label: "Đỏ / Đỏ rượu" },
    { id: "pink", hex: "#DF9B9B", label: "Hồng phấn" },
    { id: "green", hex: "#2D5A43", label: "Xanh lá / Ngọc" },
    { id: "blue-purple", hex: "#4A5568", label: "Xanh / Tím" },
    { id: "neutral", hex: "#C5A882", label: "Kem / Trắng / Nâu" },
    { id: "black-gold", hex: "#1F1D1A", label: "Đen / Vàng kim" },
  ];

export function TemplateGridBrowser({
  templates,
  initialCategory,
  initialColor,
}: TemplateGridBrowserProps) {
  const [category, setCategory] = React.useState<"all" | TemplateCategory>(
    (initialCategory as TemplateCategory) || "all",
  );
  const [color, setColor] = React.useState<TemplateColorGroup | null>(
    (initialColor as TemplateColorGroup) || null,
  );
  const [query, setQuery] = React.useState("");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState<Set<string>>(() => new Set());

  // Count active filters (for badge)
  const activeFilterCount =
    (category !== "all" ? 1 : 0) + (color ? 1 : 0) + (query.trim() ? 1 : 0);

  const handleResetFilters = () => {
    setCategory("all");
    setColor(null);
    setQuery("");
  };

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return templates.filter((template) => {
      // 1. Category filter
      if (category !== "all") {
        if (template.category) {
          if (template.category !== category) return false;
        } else {
          // Fallback matching if category not explicitly set
          const haystack = [
            template.name,
            template.subtitle,
            ...(template.styleTags ?? []),
          ]
            .join(" ")
            .toLowerCase();
          if (category === "traditional" && !haystack.includes("long phụng") && !haystack.includes("truyền thống"))
            return false;
          if (category === "romantic" && !haystack.includes("hoa") && !haystack.includes("lãng mạn"))
            return false;
          if (category === "minimal" && !haystack.includes("tối giản") && !haystack.includes("mộc"))
            return false;
          if (category === "hongkong" && !haystack.includes("hương cảng") && !haystack.includes("hỷ yến"))
            return false;
        }
      }

      // 2. Color filter
      if (color) {
        if (template.color) {
          if (template.color !== color) return false;
        } else {
          const haystack = [
            template.name,
            template.subtitle,
            ...(template.styleTags ?? []),
          ]
            .join(" ")
            .toLowerCase();
          if (color === "red" && !haystack.includes("đỏ") && !haystack.includes("rượu"))
            return false;
          if (color === "pink" && !haystack.includes("hồng") && !haystack.includes("phấn"))
            return false;
          if (color === "green" && !haystack.includes("xanh") && !haystack.includes("ngọc") && !haystack.includes("liu"))
            return false;
          if (color === "blue-purple" && !haystack.includes("lam") && !haystack.includes("tử"))
            return false;
          if (color === "neutral" && !haystack.includes("nâu") && !haystack.includes("trắng") && !haystack.includes("ngà"))
            return false;
          if (color === "black-gold" && !haystack.includes("kim") && !haystack.includes("hắc"))
            return false;
        }
      }

      // 3. Search query
      if (needle) {
        const searchable = [
          template.name,
          template.subtitle,
          template.ritualLabel ?? "",
          ...(template.styleTags ?? []),
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(needle)) return false;
      }

      return true;
    });
  }, [category, color, query, templates]);

  const active = templates.find((template) => template.id === openId) ?? null;

  return (
    <div>
      {/* =========================================================================
          Sticky Discovery & Filter Navigation
      ========================================================================= */}
      <div className="sticky top-[56px] z-30 -mx-4 border-b border-[#E8E2D9] bg-[#FAF8F5]/95 px-4 py-2.5 backdrop-blur-md transition-all sm:-mx-6 sm:px-6 sm:py-3.5 lg:-mx-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* MOBILE CONTROL BAR (< 640px) */}
          <div className="flex items-center gap-2 sm:hidden">
            {/* Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen((prev) => !prev)}
              className={`flex-1 inline-flex h-9.5 items-center justify-between rounded-full border px-4 text-xs font-medium transition-all ${activeFilterCount > 0 || isMobileFilterOpen
                ? "border-[#7A1C24] bg-[#7A1C24] text-white shadow-xs"
                : "border-[#E8E2D9] bg-white text-[#1F1D1A] hover:border-[#B89B72]"
                }`}
            >
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Bộ lọc</span>
              </span>
              {activeFilterCount > 0 && (
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${isMobileFilterOpen
                    ? "bg-white text-[#7A1C24]"
                    : "bg-[#7A1C24] text-white"
                    }`}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Quick Search Input */}
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-[#6B655E]"
                aria-hidden="true"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm mẫu..."
                className="h-9.5 w-full rounded-full border border-[#E8E2D9] bg-white pr-3 pl-8 text-xs text-[#1F1D1A] outline-none transition-colors placeholder:text-[#6B655E]/60 focus:border-[#7A1C24]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[#6B655E] hover:text-[#1F1D1A]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Reset Button (Mobile) */}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                title="Đặt lại bộ lọc"
                className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-full border border-[#E8E2D9] bg-white text-[#7A1C24] hover:bg-[#F4EFEA]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* MOBILE SLIDE DOWN PANEL */}
          {isMobileFilterOpen && (
            <div className="mt-3 rounded-2xl border border-[#E8E2D9] bg-white p-4 shadow-lg sm:hidden animate-in slide-in-from-top-3 duration-250">
              <div className="space-y-4">
                {/* 1. Danh mục */}
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-[#6B655E] uppercase mb-2">
                    Danh mục phong cách
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_TABS.map((tab) => {
                      const isActive = category === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setCategory(tab.id)}
                          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${isActive
                            ? "bg-[#7A1C24] text-white shadow-xs"
                            : "border border-[#E8E2D9] bg-[#FAF8F5] text-[#1F1D1A]/80 hover:bg-[#F4EFEA]"
                            }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Màu sắc chủ đạo */}
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-[#6B655E] uppercase mb-2">
                    Tông màu chủ đạo
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {COLOR_SWATCHES.map((swatch) => {
                      const isSelected = color === swatch.id;
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          onClick={() =>
                            setColor(isSelected ? null : swatch.id)
                          }
                          className={`flex items-center gap-2 rounded-xl border p-2 text-xs transition-all ${isSelected
                            ? "border-[#7A1C24] bg-[#FAF8F5] font-semibold text-[#7A1C24]"
                            : "border-[#E8E2D9] bg-white text-[#1F1D1A]/80 hover:bg-[#FAF8F5]"
                            }`}
                        >
                          <span
                            className="h-4 w-4 shrink-0 rounded-full border border-black/15 flex items-center justify-center"
                            style={{ backgroundColor: swatch.hex }}
                          >
                            {isSelected && (
                              <Check className="h-2.5 w-2.5 text-white" />
                            )}
                          </span>
                          <span className="truncate">{swatch.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Panel Footer Actions */}
                <div className="flex items-center justify-between border-t border-[#E8E2D9] pt-3">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs text-[#6B655E] hover:text-[#7A1C24] underline underline-offset-2"
                  >
                    Xóa tất cả lọc
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="rounded-full bg-[#1F1D1A] px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#7A1C24]"
                  >
                    Áp dụng ({filtered.length} mẫu)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DESKTOP FILTER BAR (>= 640px) */}
          <div className="hidden space-y-3 sm:block">
            {/* Row 1: Category Tabs + Search Input */}
            <div className="flex items-center justify-between gap-4">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                {CATEGORY_TABS.map((tab) => {
                  const isActive = category === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategory(tab.id)}
                      className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-all sm:text-sm ${isActive
                        ? "bg-[#1F1D1A] text-[#FAF8F5] shadow-xs"
                        : "border border-[#E8E2D9] bg-white text-[#1F1D1A]/80 hover:border-[#B89B72] hover:bg-[#F4EFEA]"
                        }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Desktop Search Input */}
              <div className="relative w-64 lg:w-72">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#6B655E]"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm tên mẫu, phong cách…"
                  className="h-9.5 w-full rounded-full border border-[#E8E2D9] bg-white pr-4 pl-9 text-xs text-[#1F1D1A] outline-none transition-colors placeholder:text-[#6B655E]/60 focus:border-[#7A1C24] focus:ring-1 focus:ring-[#7A1C24] sm:text-sm"
                />
              </div>
            </div>

            {/* Row 2: Color Swatches & Counter */}
            <div className="flex items-center justify-between border-t border-[#E8E2D9]/60 pt-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6B655E]">Màu chủ đạo:</span>
                <div className="flex items-center gap-2">
                  {COLOR_SWATCHES.map((swatch) => {
                    const isSelected = color === swatch.id;
                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        title={swatch.label}
                        aria-label={`Lọc màu ${swatch.label}`}
                        onClick={() => setColor(isSelected ? null : swatch.id)}
                        className={`relative flex h-5.5 w-5.5 cursor-pointer items-center justify-center rounded-full border border-black/15 transition-transform hover:scale-110 ${isSelected ? "ring-2 ring-[#7A1C24] ring-offset-1 scale-110" : ""
                          }`}
                        style={{ backgroundColor: swatch.hex }}
                      >
                        {isSelected && (
                          <Check className="h-3 w-3 text-white drop-shadow-xs" />
                        )}
                      </button>
                    );
                  })}
                  {color && (
                    <button
                      type="button"
                      onClick={() => setColor(null)}
                      className="ml-1 text-[11px] text-[#6B655E] hover:text-[#7A1C24] underline"
                    >
                      Bỏ chọn màu
                    </button>
                  )}
                </div>
              </div>

              {/* Result Counter */}
              <div className="text-xs text-[#6B655E]">
                Hiển thị{" "}
                <span className="font-semibold text-[#1F1D1A]">
                  {filtered.length}
                </span>{" "}
                mẫu thiệp
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Template Grid Container
      ========================================================================= */}
      {filtered.length === 0 ? (
        <div className="my-16 flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#E8E2D9] bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF8F5] text-[#7A1C24]">
            <RotateCcw className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-serif text-2xl font-normal text-[#1F1D1A]">
            Không tìm thấy mẫu thiệp phù hợp
          </h3>
          <p className="mt-2 max-w-sm text-sm text-[#6B655E]">
            Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc danh mục và màu sắc.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-full border border-[#1F1D1A] bg-transparent px-6 py-2.5 text-xs font-semibold text-[#1F1D1A] transition-colors hover:bg-[#1F1D1A] hover:text-white"
          >
            Xem tất cả mẫu
          </button>
        </div>
      ) : (
        /* RESPONSIVE GRID:
           - Mobile (< 640px): 2 columns, compact aspect ~3/4.2, fit 4 cards per phone screen
           - Desktop (>= 640px): 2-4 columns lookbook cards
        */
        <div className="py-4 sm:py-8">
          {/* Mobile Counter */}
          <div className="mb-2 px-1 text-right text-[11px] text-[#6B655E] sm:hidden">
            Hiển thị <span className="font-semibold text-[#1F1D1A]">{filtered.length}</span> mẫu
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((template) => {
              const createUrl = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(
                template.id,
              )}`;

              return (
                <div key={template.id} className="w-full">
                  {/* -------------------------------------------------------------
                      1. MOBILE COMPACT CARD (< 640px)
                      Fit 4 cards per mobile viewport, full image, gradient overlay
                  ------------------------------------------------------------- */}
                  <div
                    onClick={() => setOpenId(template.id)}
                    className="group relative block aspect-[3/4.25] w-full cursor-pointer overflow-hidden rounded-xl border border-[#E8E2D9] bg-[#F4EFEA] shadow-2xs transition-all active:scale-[0.98] sm:hidden"
                  >
                    {!failed.has(template.id) ? (
                      <img
                        src={template.previewImage}
                        alt={template.name}
                        loading="lazy"
                        decoding="async"
                        onError={() =>
                          setFailed((prev) => {
                            const next = new Set(prev);
                            next.add(template.id);
                            return next;
                          })
                        }
                        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center">
                        <p className="font-serif text-xs text-[#1F1D1A]">{template.name}</p>
                      </div>
                    )}

                    {/* Plan Badge (Top-left) */}
                    {template.plan !== "free" && (
                      <div
                        className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs pointer-events-none ${template.plan === "vip"
                          ? "border border-[#D8B15B]/70 bg-[#141210]/95 text-[#D8B15B]"
                          : "border border-[#C8AD7F]/70 bg-[#1F1D1A]/85 text-[#E5C173]"
                          }`}
                      >
                        {PLAN_DISPLAY_NAME[template.plan]}
                      </div>
                    )}

                    {/* Gradient Overlay at Bottom with Name & Tag */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pt-7 pb-2 px-2 text-white pointer-events-none">
                      <h3 className="font-serif text-[13px] font-medium leading-tight truncate text-white drop-shadow-xs">
                        {template.name}
                      </h3>
                      <p className="mt-0.5 text-[10px] text-[#E8E2D9] truncate">
                        {template.subtitle || (template.styleTags && template.styleTags[0]) || "Thiệp cưới"}
                      </p>
                    </div>
                  </div>

                  {/* -------------------------------------------------------------
                      2. DESKTOP LOOKBOOK CARD (>= 640px)
                      Elegant lookbook style with hover scrim and separate footer
                  ------------------------------------------------------------- */}
                  <div className="group hidden sm:flex flex-col overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white p-3 shadow-2xs transition-all duration-300 hover:border-[#B89B72]/70 hover:shadow-md">
                    {/* Visual Frame: Aspect 2/3 */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#F4EFEA] flex items-center justify-center">
                      {!failed.has(template.id) ? (
                        <img
                          src={template.previewImage}
                          alt={template.name}
                          loading="lazy"
                          decoding="async"
                          onError={() =>
                            setFailed((prev) => {
                              const next = new Set(prev);
                              next.add(template.id);
                              return next;
                            })
                          }
                          className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                          <p className="font-serif text-base text-[#1F1D1A]">{template.name}</p>
                          <p className="mt-1 text-xs text-[#6B655E]">Chưa có ảnh xem trước</p>
                        </div>
                      )}

                      {/* Plan Badge (Top-left) */}
                      {template.plan !== "free" && (
                        <div
                          className={`absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs pointer-events-none ${template.plan === "vip"
                            ? "border border-[#D8B15B]/70 bg-[#141210]/95 text-[#D8B15B]"
                            : "border border-[#C8AD7F]/70 bg-[#1F1D1A]/85 text-[#E5C173]"
                            }`}
                        >
                          {PLAN_DISPLAY_NAME[template.plan]}
                        </div>
                      )}

                      {/* Desktop Hover Scrim Overlay with 2 Actions */}
                      <div className="absolute inset-0 hidden items-center justify-center gap-2.5 bg-[#1F1D1A]/45 p-4 opacity-0 pointer-events-none backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100 group-hover:pointer-events-auto lg:flex">
                        <button
                          type="button"
                          onClick={() => setOpenId(template.id)}
                          className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-white/95 px-4 text-xs font-semibold text-[#1F1D1A] shadow-sm backdrop-blur-xs transition-colors hover:bg-white"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>Xem thử</span>
                        </button>

                        <Link
                          href={createUrl}
                          className="inline-flex h-9 items-center justify-center rounded-full bg-[#7A1C24] px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#5E141B]"
                        >
                          <span>Dùng mẫu</span>
                        </Link>
                      </div>
                    </div>

                    {/* Desktop Card Footer */}
                    <div className="flex flex-1 flex-col justify-between pt-3 pb-1">
                      <div>
                        <h3 className="font-serif text-lg font-normal text-[#1F1D1A] transition-colors group-hover:text-[#7A1C24]">
                          {template.name}
                        </h3>
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#6B655E]">
                          {template.subtitle || (template.styleTags && template.styleTags.join(" · ")) || "Thiệp cưới phong cách"}
                        </p>
                      </div>

                      {/* Action buttons on tablet */}
                      <div className="mt-3 flex items-center gap-2 border-t border-[#E8E2D9]/60 pt-2 lg:hidden">
                        <button
                          type="button"
                          onClick={() => setOpenId(template.id)}
                          className="flex-1 inline-flex h-8 items-center justify-center rounded-full border border-[#E8E2D9] bg-white text-xs font-medium text-[#1F1D1A]"
                        >
                          Xem thử
                        </button>
                        <Link
                          href={createUrl}
                          className="flex-1 inline-flex h-8 items-center justify-center rounded-full bg-[#7A1C24] text-xs font-medium text-white"
                        >
                          Dùng mẫu
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Quick Preview Dialog */}
      {active && (
        <TemplatePreviewDialog template={active} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
