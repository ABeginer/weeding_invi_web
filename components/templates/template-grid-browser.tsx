"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Check, Eye, RotateCcw, Search, Sparkles } from "lucide-react";
import { PLAN_LABELS } from "@/config/template-features";
import { SITE_LINKS } from "@/config/site";
import { TemplatePreviewDialog } from "./template-preview-dialog";
import type { CollectionTemplate } from "./types";

interface TemplateGridBrowserProps {
  templates: CollectionTemplate[];
  initialStyle?: string;
}

const CEREMONY_TABS = [
  { id: "all", label: "Tất cả nghi thức" },
  { id: "vu-quy", label: "Lễ Vu Quy" },
  { id: "thanh-hon", label: "Lễ Thành Hôn" },
  { id: "bao-hy", label: "Lễ Báo Hỷ" },
] as const;

type CeremonyKey = (typeof CEREMONY_TABS)[number]["id"];

const STYLE_PILLS = [
  { id: "all", label: "Tất cả phong cách" },
  { id: "minimal", label: "Tối giản" },
  { id: "traditional", label: "Truyền thống" },
  { id: "modern", label: "Hiện đại" },
  { id: "vintage", label: "Cổ điển" },
] as const;

type StyleKey = (typeof STYLE_PILLS)[number]["id"];

const COLOR_SWATCHES = [
  { id: "red", hex: "#7A1C24", label: "Đỏ rượu" },
  { id: "brown", hex: "#8C6D53", label: "Nâu trầm" },
  { id: "white", hex: "#EAE3D5", label: "Trắng kem" },
  { id: "green", hex: "#556B55", label: "Xanh rêu" },
  { id: "gold", hex: "#C5A059", label: "Vàng đồng" },
] as const;

function matchStyle(template: CollectionTemplate, styleKey: StyleKey): boolean {
  if (styleKey === "all") return true;
  const content = [template.subtitle, ...(template.styleTags ?? []), template.name]
    .join(" ")
    .toLowerCase();

  switch (styleKey) {
    case "minimal":
      return (
        content.includes("tối giản") ||
        content.includes("mộc") ||
        content.includes("nâu") ||
        ["nau-toi-gian", "minimal-red", "minimal-brown", "basic-1", "basic-2", "basic-3"].includes(template.id)
      );
    case "traditional":
      return (
        content.includes("truyền thống") ||
        content.includes("long phụng") ||
        content.includes("song hỷ") ||
        content.includes("vu quy") ||
        content.includes("hoàng kim") ||
        ["do-truyen-thong", "long-phung", "song-hy-v2-do", "hoang-kim-do", "do-may-man"].includes(template.id)
      );
    case "modern":
      return (
        content.includes("hiện đại") ||
        content.includes("mix") ||
        ["pro-1", "flowery-white", "do-mix-xanh", "xanh-tu-do", "do-ruou-vang"].includes(template.id)
      );
    case "vintage":
      return (
        content.includes("cổ điển") ||
        content.includes("hoa khô") ||
        content.includes("ren") ||
        ["ren-theu-trang", "mai-lan-xanh", "bach-su-nau", "hoa-moc-nau"].includes(template.id)
      );
    default:
      return true;
  }
}

function matchColor(template: CollectionTemplate, colorId: string | null): boolean {
  if (!colorId) return true;
  const content = [template.subtitle, ...(template.styleTags ?? []), template.name]
    .join(" ")
    .toLowerCase();

  switch (colorId) {
    case "red":
      return content.includes("đỏ") || content.includes("hồng") || content.includes("rượu");
    case "brown":
      return content.includes("nâu") || content.includes("mộc") || content.includes("gỗ");
    case "white":
      return content.includes("trắng") || content.includes("kem") || content.includes("sứ");
    case "green":
      return content.includes("xanh") || content.includes("rêu") || content.includes("lá");
    case "gold":
      return content.includes("vàng") || content.includes("hoàng kim") || content.includes("kim");
    default:
      return true;
  }
}

function matchCeremony(template: CollectionTemplate, ceremonyKey: CeremonyKey): boolean {
  if (ceremonyKey === "all") return true;
  const targetLabel =
    ceremonyKey === "vu-quy"
      ? "Lễ Vu Quy"
      : ceremonyKey === "thanh-hon"
      ? "Lễ Thành Hôn"
      : "Lễ Báo Hỷ";

  const content = [template.subtitle, ...(template.styleTags ?? []), template.ritualLabel ?? ""]
    .join(" ")
    .toLowerCase();

  return content.includes(targetLabel.toLowerCase()) || content.includes(ceremonyKey.replace("-", " "));
}

export function TemplateGridBrowser({ templates, initialStyle }: TemplateGridBrowserProps) {
  // Sync ceremony filter with initial style or URL
  const initialCeremony = React.useMemo<CeremonyKey>(() => {
    if (!initialStyle) return "all";
    if (initialStyle.includes("Vu Quy")) return "vu-quy";
    if (initialStyle.includes("Thành Hôn")) return "thanh-hon";
    if (initialStyle.includes("Báo Hỷ")) return "bao-hy";
    return "all";
  }, [initialStyle]);

  const [ceremony, setCeremony] = React.useState<CeremonyKey>(initialCeremony);
  const [style, setStyle] = React.useState<StyleKey>("all");
  const [color, setColor] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState<Set<string>>(() => new Set());

  // URL query sync without page reload
  const handleCeremonyChange = (newCeremony: CeremonyKey) => {
    setCeremony(newCeremony);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (newCeremony === "all") {
        url.searchParams.delete("ceremony");
      } else {
        url.searchParams.set("ceremony", newCeremony);
      }
      window.history.replaceState(null, "", url.toString());
    }
  };

  const handleResetFilters = () => {
    handleCeremonyChange("all");
    setStyle("all");
    setColor(null);
    setQuery("");
  };

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return templates.filter((template) => {
      // 1. Ceremony filter
      if (!matchCeremony(template, ceremony)) return false;

      // 2. Style filter
      if (!matchStyle(template, style)) return false;

      // 3. Color filter
      if (!matchColor(template, color)) return false;

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
  }, [ceremony, color, query, style, templates]);

  const active = templates.find((template) => template.id === openId) ?? null;

  return (
    <div>
      {/* Sticky Filter & Discovery Bar */}
      <div className="sticky top-[56px] z-30 -mx-4 border-b border-[#E8E2D9] bg-[#FAF8F5]/90 px-4 py-4 backdrop-blur-md transition-colors sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-3.5">
          {/* Row 1: Ceremony Tabs + Search Input */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Ceremony Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none sm:gap-2">
              {CEREMONY_TABS.map((tab) => {
                const isActive = ceremony === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleCeremonyChange(tab.id)}
                    className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all sm:text-sm ${
                      isActive
                        ? "bg-[#1F1D1A] text-[#FAF8F5] shadow-xs"
                        : "border border-[#E8E2D9] bg-white text-[#1F1D1A]/80 hover:border-[#B89B72] hover:bg-[#F4EFEA]"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72 lg:w-80">
              <span className="sr-only">Tìm mẫu thiệp</span>
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[#6B655E]"
                aria-hidden="true"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm tên mẫu, phong cách…"
                className="h-10 w-full rounded-full border border-[#E8E2D9] bg-white pr-4 pl-9 text-xs text-[#1F1D1A] outline-none transition-colors placeholder:text-[#6B655E]/60 focus:border-[#7A1C24] focus:ring-1 focus:ring-[#7A1C24] sm:text-sm"
              />
            </div>
          </div>

          {/* Row 2: Style Pills, Color Swatches & Counter */}
          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between border-t border-[#E8E2D9]/60">
            {/* Style Pills + Color Swatches */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Style Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {STYLE_PILLS.map((pill) => {
                  const isActive = style === pill.id;
                  return (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => setStyle(pill.id)}
                      className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1 text-xs transition-colors ${
                        isActive
                          ? "bg-[#7A1C24] text-white font-medium"
                          : "border border-[#E8E2D9] bg-white text-[#6B655E] hover:border-[#B89B72] hover:text-[#1F1D1A]"
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>

              {/* Color Swatch Dots */}
              <div className="flex items-center gap-1.5 border-l border-[#E8E2D9] pl-3">
                {COLOR_SWATCHES.map((swatch) => {
                  const isSelected = color === swatch.id;
                  return (
                    <button
                      key={swatch.id}
                      type="button"
                      title={swatch.label}
                      aria-label={`Lọc màu ${swatch.label}`}
                      onClick={() => setColor(isSelected ? null : swatch.id)}
                      className={`relative flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-black/15 transition-transform hover:scale-110 ${
                        isSelected ? "ring-2 ring-[#7A1C24] ring-offset-1" : ""
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {isSelected && (
                        <Check className="h-3 w-3 text-white drop-shadow-xs" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Result Counter */}
            <div className="text-xs text-[#6B655E] sm:text-right">
              Hiển thị <span className="font-semibold text-[#1F1D1A]">{filtered.length}</span> mẫu thiệp
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div className="my-16 flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#E8E2D9] bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FAF8F5] text-[#7A1C24]">
            <RotateCcw className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-serif text-2xl font-normal text-[#1F1D1A]">
            Không tìm thấy mẫu thiệp phù hợp
          </h3>
          <p className="mt-2 max-w-sm text-sm text-[#6B655E]">
            Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các bộ lọc phong cách và màu sắc.
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
        /* Curated Template Grid (Lookbook Style) */
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 py-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((template) => {
            const createUrl = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(
              template.id,
            )}`;

            return (
              <div
                key={template.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[#E8E2D9] bg-white p-3 shadow-2xs transition-all duration-300 hover:border-[#B89B72]/70 hover:shadow-md"
              >
                {/* Visual Frame: Aspect 3/4 */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-[#F4EFEA]">
                  {!failed.has(template.id) ? (
                    <img
                      src={template.previewImage}
                      alt={template.name}
                      loading="lazy"
                      onError={() =>
                        setFailed((prev) => {
                          const next = new Set(prev);
                          next.add(template.id);
                          return next;
                        })
                      }
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                      <p className="font-serif text-base text-[#1F1D1A]">{template.name}</p>
                      <p className="mt-1 text-xs text-[#6B655E]">Chưa có ảnh xem trước</p>
                    </div>
                  )}

                  {/* Plan Badge (Top-left) */}
                  {template.plan !== "free" && (
                    <div className="absolute top-2.5 left-2.5 rounded-full bg-[#1F1D1A]/85 px-2.5 py-0.5 text-[10px] font-semibold text-[#B89B72] tracking-wider uppercase backdrop-blur-xs">
                      {PLAN_LABELS[template.plan]}
                    </div>
                  )}

                  {/* Desktop Hover Scrim Overlay with 2 Actions */}
                  <div className="absolute inset-0 hidden items-center justify-center gap-2.5 bg-[#1F1D1A]/40 p-4 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100 lg:flex">
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

                {/* Card Footer (Below Image) */}
                <div className="flex flex-1 flex-col justify-between pt-3 pb-1">
                  <div>
                    <h3 className="font-serif text-xl font-normal text-[#1F1D1A] transition-colors group-hover:text-[#7A1C24]">
                      {template.name}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-xs text-[#6B655E]">
                      {template.subtitle || (template.styleTags && template.styleTags.join(" · ")) || "Thiệp cưới phong cách"}
                    </p>
                  </div>

                  {/* Mobile Persistent Action Bar */}
                  <div className="mt-3.5 flex items-center gap-2 border-t border-[#E8E2D9]/60 pt-2.5 lg:hidden">
                    <button
                      type="button"
                      onClick={() => setOpenId(template.id)}
                      className="flex-1 inline-flex h-8.5 items-center justify-center rounded-full border border-[#E8E2D9] bg-white text-xs font-medium text-[#1F1D1A]"
                    >
                      Xem thử
                    </button>
                    <Link
                      href={createUrl}
                      className="flex-1 inline-flex h-8.5 items-center justify-center rounded-full bg-[#7A1C24] text-xs font-medium text-white"
                    >
                      Dùng mẫu
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Quick Preview Dialog */}
      {active && (
        <TemplatePreviewDialog template={active} onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
