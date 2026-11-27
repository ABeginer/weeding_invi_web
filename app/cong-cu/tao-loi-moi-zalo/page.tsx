import type { Metadata } from "next";
import { CrossToolNav } from "@/components/tools/CrossToolNav";
import { JsonLd } from "@/components/tools/JsonLd";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { ZaloInviteGenerator } from "@/components/tools/zalo-invite-generator";
import { SITE_NAME, toAbsoluteSiteUrl } from "@/config/site";

const canonicalUrl = toAbsoluteSiteUrl("/cong-cu/tao-loi-moi-zalo");

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Tạo lời mời cưới Zalo chuẩn lễ nghi | ${SITE_NAME}`,
  description:
    "Soạn lời mời cưới gửi Zalo/Messenger đúng vai vế ông bà, cô chú, sếp, đồng nghiệp, bạn thân. 3 phương án chỉn chu, sao chép 1 chạm, miễn phí.",
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: `Tạo lời mời cưới Zalo chuẩn lễ nghi | ${SITE_NAME}`,
    description:
      "Soạn lời mời cưới gửi Zalo/Messenger đúng vai vế ông bà, cô chú, sếp, đồng nghiệp, bạn thân. 3 phương án chỉn chu, sao chép 1 chạm, miễn phí.",
    type: "website",
    locale: "vi_VN",
    url: canonicalUrl,
  },
};

export default function ZaloInvitePage() {
  const breadcrumbs = [
    { label: "Trang chủ", href: "/" },
    { label: "Công cụ", href: "/cong-cu" },
    { label: "Tạo lời mời Zalo", href: "/cong-cu/tao-loi-moi-zalo" },
  ] as const;

  const jsonLdData = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Tạo lời mời cưới Zalo chuẩn lễ nghi",
      description:
        "Soạn lời mời cưới gửi Zalo/Messenger đúng vai vế ông bà, cô chú, sếp, đồng nghiệp, bạn thân. 3 phương án chỉn chu, sao chép 1 chạm, miễn phí.",
      url: canonicalUrl,
      inLanguage: "vi",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "VND",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.label,
        item: toAbsoluteSiteUrl(crumb.href),
      })),
    },
  ];

  return (
    <ToolsPageShell breadcrumbs={breadcrumbs}>
      <JsonLd data={jsonLdData} />

      <header className="max-w-3xl">
        <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#B89B72]">
          CÔNG CỤ MIỄN PHÍ
        </p>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#1F1D1A]">
          Tạo lời mời cưới Zalo chuẩn lễ nghi
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B655E] sm:text-base">
          Nhập thông tin một lần, nhận 3 lời mời đúng vai vế để gửi Zalo hoặc
          Messenger — không cần nghĩ câu chữ.
        </p>
      </header>

      <div className="mt-8">
        <ZaloInviteGenerator />
      </div>

      <CrossToolNav currentTool="zalo-invite" />
    </ToolsPageShell>
  );
}
