import type { Metadata } from "next";
import Link from "next/link";
import { CrossToolNav } from "@/components/tools/CrossToolNav";
import { JsonLd } from "@/components/tools/JsonLd";
import { ToolFaqSection } from "@/components/tools/ToolFaqSection";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { VenueQrGeneratorClient } from "@/components/tools/VenueQrGeneratorClient";
import { SITE_LINKS, SITE_NAME, toAbsoluteSiteUrl } from "@/config/site";
import { VENUE_QR_COPY } from "@/config/tools-copy";

const canonicalUrl = toAbsoluteSiteUrl(SITE_LINKS.toolVenueQr);
const ogImageUrl = toAbsoluteSiteUrl("/templates/vuon-o-liu/cover.webp");

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: VENUE_QR_COPY.seo.title,
  description: VENUE_QR_COPY.seo.description,
  keywords: [...VENUE_QR_COPY.seo.keywords],
  alternates: {
    canonical: canonicalUrl,
    languages: {
      "vi-VN": canonicalUrl,
    },
  },
  openGraph: {
    title: `${VENUE_QR_COPY.seo.title} | ${SITE_NAME}`,
    description: VENUE_QR_COPY.seo.description,
    type: "website",
    locale: "vi_VN",
    url: canonicalUrl,
    siteName: SITE_NAME,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: VENUE_QR_COPY.seo.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${VENUE_QR_COPY.seo.title} | ${SITE_NAME}`,
    description: VENUE_QR_COPY.seo.description,
    images: [ogImageUrl],
  },
};

export default function VenueQrGeneratorPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: VENUE_QR_COPY.seo.appName,
        url: canonicalUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        inLanguage: "vi-VN",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "VND",
        },
        description: VENUE_QR_COPY.seo.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: VENUE_QR_COPY.breadcrumbs.map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: item.label,
          item: toAbsoluteSiteUrl(item.href),
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: VENUE_QR_COPY.faqs.map((faq) => ({
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
    <ToolsPageShell breadcrumbs={[...VENUE_QR_COPY.breadcrumbs]}>
      <JsonLd data={jsonLd} />

      {/* 1. Centered Hero */}
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#B89B72]">
          {VENUE_QR_COPY.hero.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl">
          {VENUE_QR_COPY.hero.h1}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B655E] sm:text-base">
          {VENUE_QR_COPY.hero.subtitle}
        </p>
      </header>

      {/* 2. Live Venue QR Generator + SmartToolCta */}
      <div className="mt-8">
        <VenueQrGeneratorClient />
      </div>

      {/* 3. Rich Guide & Concrete Worked Example */}
      <section
        aria-labelledby="venue-qr-guide-heading"
        className="mx-auto mt-12 max-w-3xl space-y-6 rounded-2xl border border-[#E8E2D9] bg-white p-6 sm:p-8"
      >
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#B89B72]">
            HƯỚNG DẪN IN LÊN THIỆP &amp; GỬI KHÁCH Ở XA
          </p>
          <h2
            id="venue-qr-guide-heading"
            className="font-serif text-2xl font-normal text-[#1F1D1A] sm:text-3xl"
          >
            Cách gắn mã QR địa điểm đám cưới để khách tìm đúng sảnh trong 3 giây
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-[#1F1D1A]/85 sm:text-base">
          Nhiều trung tâm tiệc cưới có nhiều chi nhánh cùng tên hoặc nằm trên trục đường một chiều,
          khiến khách mời ở xa rất dễ chạy nhầm cơ sở nếu chỉ đọc dòng địa chỉ in chữ trên phong bì.
          Khi đặt mã QR bản đồ Google Maps trực tiếp lên góc thiệp hoặc gửi ảnh khung thiệp qua tin nhắn,
          khách chỉ cần đưa camera điện thoại lên quét là ứng dụng chỉ đường mở đúng tọa độ cổng đón khách.
        </p>

        <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-5">
          <h3 className="font-serif text-lg font-medium text-[#1F1D1A]">
            Ví dụ chuẩn bị thiệp giấy &amp; Zalo cho tiệc tại White Palace
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#6B655E]">
            Nếu gia đình đặt tiệc tại <strong>194 Hoàng Văn Thụ, Phú Nhuận</strong>, bạn có thể dán
            thẳng đường link Google Maps của chi nhánh đó (hoặc nhập tọa độ <code>10.7995, 106.6708</code>),
            chọn khung <strong>Kem tối giản</strong> rồi tải file QR nền trắng <code>1000×1000px</code> gửi cho nhà in
            đặt ở góc dưới mặt trong thiệp (kích thước tối thiểu 2,5×2,5cm để camera đọc mượt).
            Nếu đãi riêng hai nhà ở hai nơi, xem thêm cách tách lịch trình trong bài{" "}
            <Link
              href="/blog/mau-thiep-cuoi-nha-trai"
              className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
            >
              mẫu thiệp cưới nhà trai chuẩn Lễ Thành Hôn
            </Link>{" "}
            và soạn lời mời đi kèm qua{" "}
            <Link
              href="/cong-cu/tao-loi-moi-zalo"
              className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
            >
              công cụ tạo lời mời cưới Zalo
            </Link>
            .
          </p>
        </div>

        <p className="text-sm leading-relaxed text-[#1F1D1A]/85 sm:text-base">
          Với khách trẻ và bạn bè ở xa muốn bấm thẳng nút mở bản đồ chỉ đường mà không cần mở thêm
          trình quét mã, bạn có thể{" "}
          <Link
            href="/tao-thiep"
            className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
          >
            tạo thiệp cưới online miễn phí
          </Link>{" "}
          trên Inviwedd (miễn phí 20 khách đầu tiên, tích hợp nút chỉ đường Google Maps 1 chạm cùng lời chào tên riêng từng người).
        </p>
      </section>

      {/* 4. FAQ */}
      <div className="mx-auto mt-10 max-w-3xl">
        <ToolFaqSection
          title="Câu hỏi thường gặp về mã QR địa điểm đám cưới"
          items={VENUE_QR_COPY.faqs}
        />
      </div>

      {/* 5. Cross-tool navigation */}
      <div className="mt-10">
        <CrossToolNav currentTool="venue-qr" />
      </div>
    </ToolsPageShell>
  );
}
