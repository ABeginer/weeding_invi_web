import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TemplateCarousel } from "@/components/templates/template-carousel";
import type { CollectionTemplate } from "@/components/templates/types";
import { SITE_LINKS } from "@/config/site";
import { getTemplateCollection } from "@/templates/registry";

export function TemplateShowcase() {
  const templates: CollectionTemplate[] = getTemplateCollection().map(
    (template) => ({
      id: template.id,
      name: template.name,
      subtitle: template.subtitle,
      description: template.description,
      plan: template.plan,
      previewImage: template.previewImage,
      snapshotImage: template.snapshotImage,
      demoUrl: template.demoUrl,
      isPlaceholder: template.isPlaceholder,
      extraFeatureIds: template.extraFeatureIds,
      ritualLabel: template.ritualLabel,
      styleTags: template.styleTags,
    }),
  );

  return (
    <section id="mau-thiep" className="scroll-mt-14 border-b border-border bg-bg py-10 sm:py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-accent-text uppercase">
            Bộ sưu tập mẫu thiệp
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text sm:text-3xl">
            Chọn mẫu thiệp của bạn
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            Mỗi mẫu đều tối ưu hiển thị mượt mà trên điện thoại, hỗ trợ nhạc nền,
            album ảnh cưới và xác nhận tham dự.
          </p>
        </header>

        <div className="mt-6 sm:mt-8">
          <TemplateCarousel templates={templates} infinite />
        </div>

        <div className="mt-6 text-center">
          <Link
            href={SITE_LINKS.templates}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-surface px-6 text-sm font-semibold text-text transition-colors hover:border-accent hover:text-accent-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            <span>Xem tất cả mẫu thiệp</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
