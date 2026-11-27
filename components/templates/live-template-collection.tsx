"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { CollectionTemplate } from "./types";

const TemplateCarousel = dynamic(
  () => import("./template-carousel").then((m) => m.TemplateCarousel),
  { ssr: true },
);
const TemplateGridBrowser = dynamic(
  () => import("./template-grid-browser").then((m) => m.TemplateGridBrowser),
  { ssr: true },
);

interface LiveTemplateCollectionProps {
  initialTemplates: CollectionTemplate[];
  variant: "carousel" | "grid";
  initialStyle?: string;
  initialCategory?: string;
  initialColor?: string;
}

interface PublicDesignerTemplate {
  id: string;
  name: string;
  displayTitle: string | null;
  plan: "free" | "pro" | "vip";
  ritual: string | null;
  version: number;
  coverUrl: string | null;
}

const FALLBACK_COVER = "/templates/vuon-o-liu/cover.webp";

/**
 * Gộp 25 mẫu code với các mẫu designer đã publish vào cùng một bộ sưu tập.
 * Trang chủ vẫn static; danh sách designer được tải sau để không chặn LCP.
 */
export function LiveTemplateCollection({
  initialTemplates,
  variant,
  initialStyle,
  initialCategory,
  initialColor,
}: LiveTemplateCollectionProps) {
  const [items, setItems] = React.useState<CollectionTemplate[]>(initialTemplates);

  React.useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timerId: number | undefined;

    const loadDesignerTemplates = () => {
      fetch("/api/public/designer-templates")
        .then((response) => (response.ok ? response.json() : { items: [] }))
        .then((data: { items?: PublicDesignerTemplate[] }) => {
          if (cancelled) return;
          const designer = (data.items ?? []).map(
            (template): CollectionTemplate => ({
              id: template.id,
              name: template.displayTitle ?? template.name,
              subtitle: template.ritual ?? "Mẫu thiệp cưới",
              description:
                "Mẫu thiệp được thiết kế riêng, có thể xem toàn bộ nội dung và hiệu ứng trước khi dùng.",
              plan: template.plan,
              previewImage: template.coverUrl ?? FALLBACK_COVER,
              snapshotImage: template.coverUrl ?? FALLBACK_COVER,
              demoUrl: `/mau/designer/${template.id}`,
              embedUrl: `/mau/designer/${template.id}/embed`,
              kind: "designer",
              version: template.version,
              ritualLabel: template.ritual ?? undefined,
              styleTags: template.ritual ? [template.ritual] : [],
            }),
          );
          if (designer.length === 0) return;
          const seen = new Set<string>();
          const merged = [...designer, ...initialTemplates].filter((template) => {
            const key = template.name.trim().toLocaleLowerCase("vi");
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          React.startTransition(() => {
            setItems(merged);
          });
        })
        .catch(() => {
          // Giữ 25 mẫu code nếu API lỗi.
        });
    };

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof win.requestIdleCallback === "function") {
      idleId = win.requestIdleCallback(loadDesignerTemplates, { timeout: 1500 });
    } else {
      timerId = window.setTimeout(loadDesignerTemplates, 800);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof win.cancelIdleCallback === "function") {
        win.cancelIdleCallback(idleId);
      }
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
    };
  }, [initialTemplates]);

  if (variant === "grid") {
    return (
      <TemplateGridBrowser
        templates={items}
        initialStyle={initialStyle}
        initialCategory={initialCategory}
        initialColor={initialColor}
      />
    );
  }

  return (
    <TemplateCarousel
      key={`carousel-${items.length}`}
      templates={items}
      infinite
    />
  );
}
