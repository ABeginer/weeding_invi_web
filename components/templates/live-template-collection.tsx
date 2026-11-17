"use client";

import * as React from "react";
import { TemplateCarousel } from "./template-carousel";
import { TemplateGridBrowser } from "./template-grid-browser";
import type { CollectionTemplate } from "./types";

interface LiveTemplateCollectionProps {
  initialTemplates: CollectionTemplate[];
  variant: "carousel" | "grid";
  initialStyle?: string;
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

const FALLBACK_COVER = "/templates/basic-1/cover.webp";

/**
 * Gộp 25 mẫu code với các mẫu designer đã publish vào cùng một bộ sưu tập.
 * Trang chủ vẫn static; danh sách designer được tải sau để không chặn LCP.
 */
export function LiveTemplateCollection({
  initialTemplates,
  variant,
  initialStyle,
}: LiveTemplateCollectionProps) {
  const [items, setItems] = React.useState<CollectionTemplate[]>(initialTemplates);

  React.useEffect(() => {
    let cancelled = false;
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
        setItems(merged);
      })
      .catch(() => {
        // Giữ 25 mẫu code nếu API lỗi.
      });
    return () => {
      cancelled = true;
    };
  }, [initialTemplates]);

  if (variant === "grid") {
    return <TemplateGridBrowser templates={items} initialStyle={initialStyle} />;
  }

  return (
    <TemplateCarousel
      key={`carousel-${items.length}`}
      templates={items}
      infinite
    />
  );
}
