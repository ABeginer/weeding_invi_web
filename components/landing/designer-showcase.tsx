"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { DesignerTemplateCard } from "./designer-template-card";
import type { PublicDesignerTemplate } from "./designer-types";

interface DesignerShowcaseProps {
  /** Trang chủ chỉ hiện một số mẫu; trang /mau-thiep hiện tất cả. */
  limit?: number;
  showEmpty?: boolean;
}

export function DesignerShowcase({
  limit,
  showEmpty = false,
}: DesignerShowcaseProps) {
  const [items, setItems] = React.useState<PublicDesignerTemplate[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/public/designer-templates")
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data: { items?: PublicDesignerTemplate[] }) => {
        if (!cancelled) setItems(data.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="border-b border-[#E8E2D9] bg-[#FAF8F5] py-10 sm:py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: limit ?? 4 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-[390/844] w-full rounded-2xl border border-[#E8E2D9] bg-[#EFEAE4] animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0 && !showEmpty) return null;

  const visible = limit ? items.slice(0, limit) : items;

  return (
    <section
      id="mau-designer"
      className="scroll-mt-14 border-b border-border bg-bg py-10 sm:py-14"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-accent-text uppercase">
              Mẫu thiết kế mới
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-text sm:text-3xl">
              Thiệp được thiết kế riêng
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Hover để xem thiệp chạy thật, bấm để xem toàn bộ và nghe nhạc.
              Trên điện thoại, chạm để mở bản xem đầy đủ.
            </p>
          </div>
          <Link
            href="/mau-thiep"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-xs font-semibold text-text"
          >
            <span>Xem tất cả mẫu thiết kế</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </header>

        {visible.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-border bg-surface px-4 py-8 text-center text-sm text-text-muted">
            Chưa có mẫu thiết kế nào được xuất bản.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((template) => (
              <DesignerTemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
