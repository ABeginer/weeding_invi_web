import type { Metadata } from "next";
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

const CEREMONY_FILTERS: Record<string, string> = {
  "vu-quy": "Lễ Vu Quy",
  "thanh-hon": "Lễ Thành Hôn",
  "bao-hy": "Lễ Báo Hỷ",
};

interface TemplateCollectionPageProps {
  searchParams: Promise<{ ceremony?: string }>;
}

export default async function TemplateCollectionPage({
  searchParams,
}: TemplateCollectionPageProps) {
  const { ceremony } = await searchParams;
  const initialStyle = ceremony ? CEREMONY_FILTERS[ceremony] : undefined;
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
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-accent-text uppercase">
          Bộ sưu tập mẫu thiệp
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-text sm:text-4xl">
          Mẫu thiệp cưới online
        </h1>
        <p className="mt-2 text-sm text-text-muted sm:text-base">
          Chọn mẫu bạn thích, xem thử và dùng ngay.
        </p>
      </header>

      <div className="mt-8 sm:mt-10">
        <LiveTemplateCollection initialTemplates={templates} variant="grid" initialStyle={initialStyle} />
      </div>

      <p className="mx-auto mt-10 max-w-xl text-center text-xs leading-relaxed text-text-muted">
        Mọi mẫu đều có link riêng cho từng khách, xác nhận tham dự, lời chúc,
        lịch trình và bản đồ chỉ đường. Gói Miễn phí dùng được ngay cho 20 khách.
      </p>
    </main>
  );
}
