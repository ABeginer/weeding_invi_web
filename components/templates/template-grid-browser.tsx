"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  consumeMatchingCatalogScrollY,
  saveCatalogReturnState,
} from "@/lib/demo-return";
import { globalAudio } from "@/lib/global-audio";
import { getCoverImageResponsive } from "@/lib/utils";
import type { CollectionTemplate } from "./types";
import type { TemplateCategory, TemplateColorGroup } from "@/templates/types";

const DynamicTemplatePreviewDialog = dynamic(
  () =>
    import("./template-preview-dialog").then((m) => m.TemplatePreviewDialog),
  { ssr: false },
);

export interface TemplateGridBrowserProps {
  templates: CollectionTemplate[];
  initialStyle?: string;
  initialCategory?: string;
  initialColor?: string;
  initialPlan?: string;
}

const CATEGORY_TABS: { id: "all" | TemplateCategory; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "traditional", label: "Truyền thống" },
  { id: "romantic", label: "Lãng mạn" },
  { id: "minimal", label: "Tối giản" },
  { id: "hongkong", label: "Hongkong" },
];

type PlanFilter = "all" | "free" | "pro";

const PLAN_FILTER_TABS: { id: PlanFilter; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "free", label: "Miễn phí" },
  { id: "pro", label: "Standard" },
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

const VALID_CATEGORIES = new Set<string>(
  CATEGORY_TABS.filter((t) => t.id !== "all").map((t) => t.id),
);
const VALID_COLORS = new Set<string>(COLOR_SWATCHES.map((s) => s.id));
const VALID_PLANS = new Set<string>(["free", "pro"]);

function UrlFilterInitializer({
  onParams,
}: {
  onParams: (
    categoryParam: string | null,
    colorParam: string | null,
    planParam: string | null,
    queryParam: string | null,
  ) => void;
}) {
  const searchParams = useSearchParams();
  const didInitRef = React.useRef(false);

  React.useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    const categoryParam = searchParams.get("category");
    const colorParam = searchParams.get("color");
    const planParam = searchParams.get("plan");
    const queryParam = searchParams.get("q");
    const validCat =
      categoryParam && VALID_CATEGORIES.has(categoryParam) ? categoryParam : null;
    const validCol =
      colorParam && VALID_COLORS.has(colorParam) ? colorParam : null;
    const validPlan =
      planParam && VALID_PLANS.has(planParam) ? planParam : null;
    const validQuery = queryParam ? queryParam : null;
    onParams(validCat, validCol, validPlan, validQuery);
  }, [searchParams, onParams]);

  return null;
}

export function TemplateGridBrowser({
  templates,
  initialCategory,
  initialColor,
  initialPlan,
}: TemplateGridBrowserProps) {
  const router = useRouter();
  const [category, setCategory] = React.useState<"all" | TemplateCategory>(
    (initialCategory as TemplateCategory) || "all",
  );
  const [color, setColor] = React.useState<TemplateColorGroup | null>(
    (initialColor as TemplateColorGroup) || null,
  );
  const [planFilter, setPlanFilter] = React.useState<PlanFilter>(
    initialPlan === "free" || initialPlan === "pro" ? initialPlan : "all",
  );
  const [query, setQuery] = React.useState("");
  const [urlReady, setUrlReady] = React.useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState<Set<string>>(() => new Set());
  const prefetchedDemoUrlsRef = React.useRef<Set<string>>(new Set());

  const handleMobileCardPrefetch = React.useCallback(
    (demoUrl: string) => {
      if (
        typeof window === "undefined" ||
        !window.matchMedia("(max-width: 639px)").matches ||
        prefetchedDemoUrlsRef.current.has(demoUrl)
      ) {
        return;
      }
      prefetchedDemoUrlsRef.current.add(demoUrl);
      router.prefetch(demoUrl);
    },
    [router],
  );

  const applyUrlParams = React.useCallback(
    (
      categoryParam: string | null,
      colorParam: string | null,
      planParam: string | null,
      queryParam: string | null,
    ) => {
      if (categoryParam) setCategory(categoryParam as TemplateCategory);
      if (colorParam) setColor(colorParam as TemplateColorGroup);
      if (planParam && VALID_PLANS.has(planParam)) setPlanFilter(planParam as PlanFilter);
      if (queryParam) setQuery(queryParam);
      setUrlReady(true);
    },
    [],
  );

  // Đồng bộ filter lên thanh địa chỉ (không trigger fetch/reload mạng)
  React.useEffect(() => {
    if (!urlReady || typeof window === "undefined") return;
    const syncTimer = window.setTimeout(
      () => {
        const params = new URLSearchParams();
        if (category !== "all") params.set("category", category);
        if (color) params.set("color", color);
        if (planFilter !== "all") params.set("plan", planFilter);
        const trimmedQ = query.trim();
        if (trimmedQ) params.set("q", trimmedQ);
        const nextSearch = params.toString();
        const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
        const currentUrl = window.location.pathname + window.location.search;
        if (nextUrl !== currentUrl) {
          window.history.replaceState(null, "", nextUrl);
        }
      },
      query.trim() ? 250 : 0,
    );
    return () => window.clearTimeout(syncTimer);
  }, [urlReady, category, color, planFilter, query]);

  // Khôi phục vị trí cuộn khi quay lại từ màn hình xem toàn màn hình /mau/[id]
  React.useEffect(() => {
    if (!urlReady || typeof window === "undefined") return;
    const currentUrl = window.location.pathname + window.location.search;
    const savedScrollY = consumeMatchingCatalogScrollY(currentUrl);
    if (savedScrollY === null) return;

    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        window.scrollTo({ top: savedScrollY, behavior: "instant" });
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2) window.cancelAnimationFrame(raf2);
    };
  }, [urlReady]);

  // Count active filters (for badge)
  const activeFilterCount =
    (category !== "all" ? 1 : 0) +
    (color ? 1 : 0) +
    (planFilter !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  const handleResetFilters = () => {
    setCategory("all");
    setColor(null);
    setPlanFilter("all");
    setQuery("");
  };

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    const matched = templates.filter((template) => {
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

      // 3. Plan tier filter
      if (planFilter !== "all" && template.plan !== planFilter) {
        return false;
      }

      // 4. Search query
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

    // Ưu tiên mẫu Standard / trả phí (rank 0) lên đầu danh sách, sau đó mới tới Free (rank 1), giữ nguyên thứ tự gốc trong từng nhóm
    const getPlanRank = (plan: CollectionTemplate["plan"]) => (plan === "free" ? 1 : 0);
    return matched.sort((a, b) => getPlanRank(a.plan) - getPlanRank(b.plan));
  }, [category, color, planFilter, query, templates]);

  const active = templates.find((template) => template.id === openId) ?? null;

  return (
    <div>
      <React.Suspense fallback={null}>
        <UrlFilterInitializer onParams={applyUrlParams} />
      </React.Suspense>
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

                {/* 3. Hạng thiệp */}
                <div>
                  <p className="text-[11px] font-semibold tracking-wider text-[#6B655E] uppercase mb-2">
                    Hạng thiệp
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PLAN_FILTER_TABS.map((tab) => {
                      const isActive = planFilter === tab.id;
                      const isStandardActive = isActive && tab.id === "pro";
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() =>
                            setPlanFilter(isActive && tab.id !== "all" ? "all" : tab.id)
                          }
                          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${isStandardActive
                              ? "border border-[#C8AD7F] bg-[#1F1D1A] text-[#F2D488] shadow-xs"
                              : isActive
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

            {/* Row 3: Plan Tier Filter */}
            <div className="flex items-center justify-between border-t border-[#E8E2D9]/60 pt-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xs text-[#6B655E]">Hạng thiệp:</span>
                <div className="flex items-center gap-1.5">
                  {PLAN_FILTER_TABS.map((tab) => {
                    const isActive = planFilter === tab.id;
                    const isStandardActive = isActive && tab.id === "pro";
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          setPlanFilter(isActive && tab.id !== "all" ? "all" : tab.id)
                        }
                        className={`cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1 text-xs font-medium transition-all ${isStandardActive
                            ? "border border-[#C8AD7F] bg-[#1F1D1A] text-[#F2D488] shadow-xs"
                            : isActive
                              ? "bg-[#1F1D1A] text-[#FAF8F5] shadow-xs"
                              : "border border-[#E8E2D9] bg-white text-[#1F1D1A]/80 hover:border-[#B89B72] hover:bg-[#F4EFEA]"
                          }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                  {planFilter !== "all" && (
                    <button
                      type="button"
                      onClick={() => setPlanFilter("all")}
                      className="ml-1 cursor-pointer text-[11px] text-[#6B655E] hover:text-[#7A1C24] underline"
                    >
                      Bỏ chọn hạng
                    </button>
                  )}
                </div>
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
            Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc danh mục, màu sắc và hạng thiệp.
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
            {filtered.map((template, index) => {
              const isEager = index < 2;
              const isHighPriority = index === 0;
              const coverImg = getCoverImageResponsive(
                template.previewImage,
                template.kind,
              );
              const createUrl = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(
                template.id,
              )}`;
              const demoUrl = template.demoUrl || `/mau/${encodeURIComponent(template.id)}`;

              return (
                <div
                  key={template.id}
                  onPointerDown={() => handleMobileCardPrefetch(demoUrl)}
                  onTouchStart={() => handleMobileCardPrefetch(demoUrl)}
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      window.matchMedia("(max-width: 639px)").matches
                    ) {
                      saveCatalogReturnState();
                      globalAudio.stop();
                      router.push(demoUrl);
                    }
                  }}
                  className="group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-xl border border-[#E8E2D9] bg-[#F4EFEA] shadow-2xs transition-all active:scale-[0.98] sm:cursor-default sm:rounded-2xl sm:bg-white sm:p-3 sm:duration-300 sm:hover:border-[#B89B72]/70 sm:hover:shadow-md sm:active:scale-100"
                >
                  {/* Visual Frame: Mobile 3/4.25, Desktop 2/3 */}
                  <div className="relative flex aspect-[3/4.25] w-full items-center justify-center overflow-hidden bg-[#F4EFEA] sm:aspect-[2/3] sm:rounded-xl">
                    {!failed.has(template.id) ? (
                      <img
                        src={coverImg.src}
                        srcSet={coverImg.srcSet}
                        sizes={
                          coverImg.srcSet
                            ? "(max-width: 639px) 46vw, (max-width: 767px) 45vw, (max-width: 1023px) 30vw, 23vw"
                            : undefined
                        }
                        width={coverImg.width}
                        height={coverImg.height}
                        alt={template.name}
                        loading={isEager ? "eager" : "lazy"}
                        fetchPriority={isHighPriority ? "high" : "auto"}
                        decoding="async"
                        onError={() =>
                          setFailed((prev) => {
                            const next = new Set(prev);
                            next.add(template.id);
                            return next;
                          })
                        }
                        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105 sm:duration-700 sm:ease-out"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center sm:p-4">
                        <p className="font-serif text-xs text-[#1F1D1A] sm:text-base">
                          {template.name}
                        </p>
                        <p className="mt-1 hidden text-xs text-[#6B655E] sm:block">
                          Chưa có ảnh xem trước
                        </p>
                      </div>
                    )}

                    {/* Plan Badge (Top-left) */}
                    {template.plan !== "free" && (
                      <div
                        className={`pointer-events-none absolute top-2 left-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs sm:top-2.5 sm:left-2.5 sm:px-2.5 sm:text-[10px] ${template.plan === "vip"
                          ? "border border-[#D8B15B]/70 bg-[#141210]/95 text-[#D8B15B]"
                          : "border border-[#C8AD7F]/70 bg-[#1F1D1A]/85 text-[#E5C173]"
                          }`}
                      >
                        {PLAN_DISPLAY_NAME[template.plan]}
                      </div>
                    )}

                    {/* Mobile Gradient Overlay at Bottom with Name & Tag */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-2 pt-7 pb-2 text-white sm:hidden">
                      <h3 className="truncate font-serif text-[13px] font-medium leading-tight text-white drop-shadow-xs">
                        {template.name}
                      </h3>
                      <p className="mt-0.5 truncate text-[10px] text-[#E8E2D9]">
                        {template.subtitle || (template.styleTags && template.styleTags[0]) || "Thiệp cưới"}
                      </p>
                    </div>

                    {/* Desktop Hover Scrim Overlay with 2 Actions */}
                    <div className="pointer-events-none absolute inset-0 hidden items-center justify-center gap-2.5 bg-[#1F1D1A]/45 p-4 opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 lg:flex">
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
                  <div className="hidden flex-1 flex-col justify-between pt-3 pb-1 sm:flex">
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
                        className="inline-flex h-8 flex-1 items-center justify-center rounded-full border border-[#E8E2D9] bg-white text-xs font-medium text-[#1F1D1A]"
                      >
                        Xem thử
                      </button>
                      <Link
                        href={createUrl}
                        className="inline-flex h-8 flex-1 items-center justify-center rounded-full bg-[#7A1C24] text-xs font-medium text-white"
                      >
                        Dùng mẫu
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Quick Preview Dialog (lazy-loaded on Desktop only) */}
      {active && (
        <DynamicTemplatePreviewDialog template={active} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
