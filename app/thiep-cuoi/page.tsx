import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LandingNavbar } from "@/components/landing/navbar";
import { LiveTemplateCollection } from "@/components/templates/live-template-collection";
import type { CollectionTemplate } from "@/components/templates/types";
import { SITE_LINKS, SITE_NAME, toAbsoluteSiteUrl } from "@/config/site";
import { getTemplateCollection } from "@/templates/registry";

export const metadata: Metadata = {
  title: `Mẫu thiệp cưới online | ${SITE_NAME}`,
  description:
    "Bộ sưu tập mẫu thiệp cưới online: tối giản, cổ điển và truyền thống Việt Nam. Xem thử từng mẫu và dùng ngay, miễn phí cho 20 khách.",
  alternates: {
    canonical: toAbsoluteSiteUrl(SITE_LINKS.templates),
  },
  openGraph: {
    title: `Mẫu thiệp cưới online | ${SITE_NAME}`,
    description:
      "Chọn mẫu thiệp cưới online theo phong cách của bạn, xem thử và dùng ngay.",
    type: "website",
    locale: "vi_VN",
    url: toAbsoluteSiteUrl(SITE_LINKS.templates),
  },
};

interface TemplateCollectionPageProps {
  searchParams: Promise<{ category?: string; color?: string }>;
}

export default async function TemplateCollectionPage({
  searchParams,
}: TemplateCollectionPageProps) {
  const { category, color } = await searchParams;
  const templates: CollectionTemplate[] = getTemplateCollection().map(
    (template) => ({
      id: template.id,
      name: template.name,
      subtitle: template.subtitle,
      description: template.description,
      plan: template.plan,
      category: template.category,
      color: template.color,
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
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F1D1A]">
      <LandingNavbar />

      {/* Editorial Page Header */}
      <header className="border-b border-[#E8E2D9] pt-8 pb-12 sm:pt-10 sm:pb-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-left">
            <Link
              href={SITE_LINKS.home}
              className="inline-flex items-center gap-1.5 text-sm text-[#6B655E] hover:text-[#7A1C24] transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Quay lại trang chủ</span>
            </Link>
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-[#7A1C24] uppercase">
              BỘ SƯU TẬP 2026
            </p>

            <h1 className="mt-4 font-serif text-4xl font-normal tracking-tight text-[#1F1D1A] sm:text-5xl lg:text-6xl">
              Chọn mẫu thiệp cho <span className="italic text-[#7A1C24]">ngày trọng đại</span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#6B655E]">
              Tối ưu hiển thị mượt mà trên điện thoại, hỗ trợ nhạc nền, bản đồ chỉ đường và tự động cá nhân hóa xưng hô theo từng vị khách.
            </p>
          </div>
        </div>
      </header>

      {/* Main Catalog Viewport */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <LiveTemplateCollection
          initialTemplates={templates}
          variant="grid"
          initialCategory={category}
          initialColor={color}
        />

        <div className="border-t border-[#E8E2D9] py-12 text-center">
          <p className="mx-auto max-w-xl text-xs leading-relaxed text-[#6B655E]">
            Mọi mẫu thiệp đều cung cấp link riêng biệt cho từng vị khách, hệ thống xác nhận tham dự (RSVP), sổ mừng trực tuyến, lịch trình và bản đồ tiệc cưới. Gói Miễn phí dùng được ngay.
          </p>
        </div>
      </main>
    </div>
  );
}
