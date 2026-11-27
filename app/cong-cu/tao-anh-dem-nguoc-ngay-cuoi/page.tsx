import type { Metadata } from "next";
import Link from "next/link";
import { CrossToolNav } from "@/components/tools/CrossToolNav";
import { JsonLd } from "@/components/tools/JsonLd";
import { SaveTheDateCountdownClient } from "@/components/tools/SaveTheDateCountdownClient";
import { ToolFaqSection } from "@/components/tools/ToolFaqSection";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { SITE_LINKS, SITE_NAME, toAbsoluteSiteUrl } from "@/config/site";
import { SAVE_THE_DATE_COPY } from "@/config/tools-copy";

const canonicalUrl = toAbsoluteSiteUrl(SITE_LINKS.toolSaveTheDate);
const ogImageUrl = toAbsoluteSiteUrl("/templates/vuon-o-liu/cover.webp");

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: SAVE_THE_DATE_COPY.seo.title,
  description: SAVE_THE_DATE_COPY.seo.description,
  keywords: [...SAVE_THE_DATE_COPY.seo.keywords],
  alternates: {
    canonical: canonicalUrl,
    languages: {
      "vi-VN": canonicalUrl,
    },
  },
  openGraph: {
    title: `${SAVE_THE_DATE_COPY.seo.title} | ${SITE_NAME}`,
    description: SAVE_THE_DATE_COPY.seo.description,
    type: "website",
    locale: "vi_VN",
    url: canonicalUrl,
    siteName: SITE_NAME,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: SAVE_THE_DATE_COPY.seo.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SAVE_THE_DATE_COPY.seo.title} | ${SITE_NAME}`,
    description: SAVE_THE_DATE_COPY.seo.description,
    images: [ogImageUrl],
  },
};

export default function SaveTheDateCountdownPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: SAVE_THE_DATE_COPY.seo.appName,
        url: canonicalUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        inLanguage: "vi-VN",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "VND",
        },
        description: SAVE_THE_DATE_COPY.seo.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: SAVE_THE_DATE_COPY.breadcrumbs.map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: item.label,
          item: toAbsoluteSiteUrl(item.href),
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: SAVE_THE_DATE_COPY.faqs.map((faq) => ({
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
    <ToolsPageShell breadcrumbs={[...SAVE_THE_DATE_COPY.breadcrumbs]}>
      <JsonLd data={jsonLd} />

      <header className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#B89B72]">
          {SAVE_THE_DATE_COPY.hero.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl">
          {SAVE_THE_DATE_COPY.hero.h1}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B655E] sm:text-base">
          {SAVE_THE_DATE_COPY.hero.subtitle}
        </p>
      </header>

      <div className="mt-8">
        <SaveTheDateCountdownClient />
      </div>

      <section
        aria-labelledby="save-the-date-guide-heading"
        className="mx-auto mt-12 max-w-3xl space-y-6 rounded-2xl border border-[#E8E2D9] bg-white p-6 sm:p-8"
      >
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#B89B72]">
            KINH NGHIỆM BÁO TIN VUI ĐÚNG THỜI ĐIỂM
          </p>
          <h2
            id="save-the-date-guide-heading"
            className="font-serif text-2xl font-normal text-[#1F1D1A] sm:text-3xl"
          >
            Đăng ảnh đếm ngược ngày cưới khi nào để bạn bè giữ lịch đẹp nhất?
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-[#1F1D1A]/85 sm:text-base">
          Khác với thiệp mời chính thức chứa đầy đủ giờ đón dâu và số bàn tiệc, ảnh{" "}
          <strong>Save the Date</strong> được gửi trước khoảng 3 đến 5 tuần với mục tiêu nhẹ nhàng
          nhờ bạn bè thân thiết ở xa sắp xếp trước lịch cuối tuần. Với kích thước chuẩn 1080 × 1920 px
          (Story 9:16) hoặc 1080 × 1350 px (Feed 4:5), tấm ảnh không bị cắt chữ khi đăng lên Zalo,
          Facebook hay Instagram.
        </p>

        <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-5">
          <h3 className="font-serif text-lg font-medium text-[#1F1D1A]">
            Ví dụ thực tế: Thông báo trước 42 ngày (Chủ Nhật 20.12.2026)
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#6B655E]">
            Khi chọn ngày tổ chức là Chủ Nhật 20.12.2026, trình tạo ảnh tự động hiển thị nhãn{" "}
            <strong>CÒN 42 NGÀY NỮA</strong> tính chuẩn theo giờ Việt Nam (UTC+7). Nếu bạn muốn đối
            chiếu kèm ngày âm lịch để ghi thêm vào thiệp gia đình, hãy tra nhanh tại{" "}
            <Link
              href="/cong-cu/doi-am-lich"
              className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
            >
              công cụ đổi ngày dương sang âm lịch
            </Link>
            .
          </p>
        </div>

        <p className="text-sm leading-relaxed text-[#1F1D1A]/85 sm:text-base">
          Sau khi tải xong ảnh đếm ngược để đăng Story, bước tiếp theo là rà soát cách gọi tên khách
          bằng hướng dẫn{" "}
          <Link
            href="/blog/cach-xung-ho-ghi-thiep-cuoi"
            className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
          >
            xưng hô ghi thiệp cưới chuẩn lễ nghĩa
          </Link>{" "}
          và tạo bộ thiệp cá nhân hóa miễn phí tại{" "}
          <Link
            href="/tao-thiep"
            className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
          >
            trang tạo thiệp cưới Inviwedd
          </Link>{" "}
          để ghim kèm dưới bài viết báo hỷ.
        </p>
      </section>

      <div className="mx-auto mt-10 max-w-3xl">
        <ToolFaqSection
          title="Câu hỏi thường gặp khi tạo ảnh Save the Date"
          items={SAVE_THE_DATE_COPY.faqs}
        />
      </div>

      <div className="mt-10">
        <CrossToolNav currentTool="save-the-date" />
      </div>
    </ToolsPageShell>
  );
}
