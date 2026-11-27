import type { Metadata } from "next";
import Link from "next/link";
import { CrossToolNav } from "@/components/tools/CrossToolNav";
import { JsonLd } from "@/components/tools/JsonLd";
import { ToolFaqSection } from "@/components/tools/ToolFaqSection";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { WeddingChecklistClient } from "@/components/tools/WeddingChecklistClient";
import { SITE_LINKS, SITE_NAME, toAbsoluteSiteUrl } from "@/config/site";
import { WEDDING_CHECKLIST_COPY } from "@/config/tools-copy";

const canonicalUrl = toAbsoluteSiteUrl(SITE_LINKS.toolChecklist);
const ogImageUrl = toAbsoluteSiteUrl("/templates/vuon-o-liu/cover.webp");

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: WEDDING_CHECKLIST_COPY.seo.title,
  description: WEDDING_CHECKLIST_COPY.seo.description,
  keywords: [...WEDDING_CHECKLIST_COPY.seo.keywords],
  alternates: {
    canonical: canonicalUrl,
    languages: {
      "vi-VN": canonicalUrl,
    },
  },
  openGraph: {
    title: `${WEDDING_CHECKLIST_COPY.seo.title} | ${SITE_NAME}`,
    description: WEDDING_CHECKLIST_COPY.seo.description,
    type: "website",
    locale: "vi_VN",
    url: canonicalUrl,
    siteName: SITE_NAME,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: WEDDING_CHECKLIST_COPY.seo.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${WEDDING_CHECKLIST_COPY.seo.title} | ${SITE_NAME}`,
    description: WEDDING_CHECKLIST_COPY.seo.description,
    images: [ogImageUrl],
  },
};

export default function WeddingChecklistPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: WEDDING_CHECKLIST_COPY.seo.appName,
        url: canonicalUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        inLanguage: "vi-VN",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "VND",
        },
        description: WEDDING_CHECKLIST_COPY.seo.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: WEDDING_CHECKLIST_COPY.breadcrumbs.map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: item.label,
          item: toAbsoluteSiteUrl(item.href),
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: WEDDING_CHECKLIST_COPY.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <ToolsPageShell breadcrumbs={[...WEDDING_CHECKLIST_COPY.breadcrumbs]}>
      <JsonLd data={jsonLd} />

      {/* 1. Centered Hero */}
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#B89B72]">
          {WEDDING_CHECKLIST_COPY.hero.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl">
          {WEDDING_CHECKLIST_COPY.hero.h1}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B655E] sm:text-base">
          {WEDDING_CHECKLIST_COPY.hero.subtitle}
        </p>
      </header>

      {/* 2. Interactive Countdown Checklist + SmartToolCta */}
      <div className="mt-8">
        <WeddingChecklistClient />
      </div>

      {/* 3. Rich Guide & Concrete Worked Example */}
      <section
        aria-labelledby="wedding-checklist-guide-heading"
        className="mx-auto mt-12 max-w-3xl space-y-6 rounded-2xl border border-[#E8E2D9] bg-white p-6 sm:p-8"
      >
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#B89B72]">
            KINH NGHIỆM QUẢN LÝ TIẾN ĐỘ CƯỚI
          </p>
          <h2
            id="wedding-checklist-guide-heading"
            className="font-serif text-2xl font-normal text-[#1F1D1A] sm:text-3xl"
          >
            Dùng checklist chuẩn bị đám cưới thế nào để không dồn việc sát ngày rước dâu?
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-[#1F1D1A]/85 sm:text-base">
          Phần lớn các cặp đôi tìm xin file checklist Excel trên hội nhóm thường gặp hai bất tiện:
          bảng tính thiết kế theo cưới phương Tây không có phần tráp ăn hỏi, lễ gia tiên hai họ,
          và các đầu việc không gắn với ngày cưới thực tế của gia đình. Khi chuyển sang bảng đếm ngược
          tự chia theo 5 mốc (6 tháng, 3 tháng, 1 tháng, 1 tuần và ngày lễ), bạn luôn biết tuần này cần
          ưu tiên việc gì và việc nào có thể giao bớt cho nhà trai hoặc nhà gái.
        </p>

        <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-5">
          <h3 className="font-serif text-lg font-medium text-[#1F1D1A]">
            Ví dụ chia mốc cho lễ cưới vào ngày 20/06/2027
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#6B655E]">
            Khi chọn ngày cưới <strong>20/06/2027</strong> và chế độ <strong>Tiệc nhà hàng tiêu chuẩn</strong>,
            công cụ tự đánh dấu hạn chốt địa điểm và dự trù ngân sách là <strong>22/12/2026</strong> (mốc 6 tháng),
            hạn lập xong danh sách khách và thử trang phục là <strong>22/03/2027</strong> (mốc 3 tháng),
            hạn phát hành thiệp mời là <strong>21/05/2027</strong> (mốc 1 tháng) và hạn khóa số bàn với bếp
            là <strong>13/06/2027</strong>. Ở từng mốc, bạn có thể bấm mở thẳng{" "}
            <Link
              href="/cong-cu/bang-tinh-dam-cuoi"
              className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
            >
              bảng tính chi phí đám cưới
            </Link>{" "}
            hoặc{" "}
            <Link
              href="/cong-cu/tao-danh-sach-khach-moi"
              className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
            >
              công cụ lập danh sách khách mời
            </Link>{" "}
            để tính ra con số mâm cỗ thực tế ngay trong ngày.
          </p>
        </div>

        <p className="text-sm leading-relaxed text-[#1F1D1A]/85 sm:text-base">
          Khi danh sách đầu việc bước sang tuần thứ 4 trước ngày cưới, hãy mở{" "}
          <Link
            href="/tao-thiep"
            className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
          >
            trình tạo thiệp cưới miễn phí
          </Link>{" "}
          trên Inviwedd (miễn phí dùng thử 20 khách) để phát thiệp điện tử kèm chỉ đường Google Maps và
          gom toàn bộ phản hồi tham dự về một bảng chung.
        </p>
      </section>

      {/* 4. FAQ */}
      <div className="mx-auto mt-10 max-w-3xl">
        <ToolFaqSection
          title="Câu hỏi thường gặp về checklist chuẩn bị đám cưới"
          items={WEDDING_CHECKLIST_COPY.faqs}
        />
      </div>

      {/* 5. Cross-tool navigation */}
      <div className="mt-10">
        <CrossToolNav currentTool="wedding-checklist" />
      </div>
    </ToolsPageShell>
  );
}
