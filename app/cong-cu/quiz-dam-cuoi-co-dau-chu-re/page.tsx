import type { Metadata } from "next";
import Link from "next/link";
import { CrossToolNav } from "@/components/tools/CrossToolNav";
import { JsonLd } from "@/components/tools/JsonLd";
import { ToolFaqSection } from "@/components/tools/ToolFaqSection";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { WeddingQuizBuilderClient } from "@/components/tools/WeddingQuizBuilderClient";
import { SITE_LINKS, SITE_NAME, toAbsoluteSiteUrl } from "@/config/site";
import { WEDDING_QUIZ_COPY } from "@/config/tools-copy";

const canonicalUrl = toAbsoluteSiteUrl(SITE_LINKS.toolWeddingQuiz);
const ogImageUrl = toAbsoluteSiteUrl("/templates/vuon-o-liu/cover.webp");

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: WEDDING_QUIZ_COPY.seo.title,
  description: WEDDING_QUIZ_COPY.seo.description,
  keywords: [...WEDDING_QUIZ_COPY.seo.keywords],
  alternates: {
    canonical: canonicalUrl,
    languages: {
      "vi-VN": canonicalUrl,
    },
  },
  openGraph: {
    title: `${WEDDING_QUIZ_COPY.seo.title} | ${SITE_NAME}`,
    description: WEDDING_QUIZ_COPY.seo.description,
    type: "website",
    locale: "vi_VN",
    url: canonicalUrl,
    siteName: SITE_NAME,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: WEDDING_QUIZ_COPY.seo.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${WEDDING_QUIZ_COPY.seo.title} | ${SITE_NAME}`,
    description: WEDDING_QUIZ_COPY.seo.description,
    images: [ogImageUrl],
  },
};

export default function WeddingQuizBuilderPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: WEDDING_QUIZ_COPY.seo.appName,
        url: canonicalUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        inLanguage: "vi-VN",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "VND",
        },
        description: WEDDING_QUIZ_COPY.seo.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: WEDDING_QUIZ_COPY.breadcrumbs.map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: item.label,
          item: toAbsoluteSiteUrl(item.href),
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: WEDDING_QUIZ_COPY.faqs.map((faq) => ({
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
    <ToolsPageShell breadcrumbs={[...WEDDING_QUIZ_COPY.breadcrumbs]}>
      <JsonLd data={jsonLd} />

      <header className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#B89B72]">
          {WEDDING_QUIZ_COPY.hero.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl">
          {WEDDING_QUIZ_COPY.hero.h1}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B655E] sm:text-base">
          {WEDDING_QUIZ_COPY.hero.subtitle}
        </p>
      </header>

      <div className="mt-8">
        <WeddingQuizBuilderClient />
      </div>

      <section
        aria-labelledby="quiz-guide-heading"
        className="mx-auto mt-12 max-w-3xl space-y-6 rounded-2xl border border-[#E8E2D9] bg-white p-6 sm:p-8"
      >
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#B89B72]">
            BÍ QUYẾT KHUẤY ĐỘNG TIỆC CƯỚI KHÔNG BỊ NGƯỢNG
          </p>
          <h2
            id="quiz-guide-heading"
            className="font-serif text-2xl font-normal text-[#1F1D1A] sm:text-3xl"
          >
            Cách dùng trò chơi hỏi đáp cô dâu chú rể để cả bàn cùng cười vui
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-[#1F1D1A]/85 sm:text-base">
          Khác với những trò ép người lên sân khấu vận động mạnh, minigame{" "}
          <strong>&ldquo;Bạn hiểu Cô dâu Chú rể bao nhiêu %?&rdquo;</strong> giúp từ cô chú lớn tuổi
          đến hội bạn thân đều có thể đoán đáp án ngay tại bàn tiệc. Chỉ cần một bộ 8 câu hỏi trắc
          nghiệm ngắn gọn kết hợp những câu chuyện hậu trường hài hước, không khí nhà hàng lập tức
          ấm lên sau món khai vị.
        </p>

        <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-5">
          <h3 className="font-serif text-lg font-medium text-[#1F1D1A]">
            Ví dụ kịch bản 10 phút với 8 câu hỏi trắc nghiệm
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#6B655E]">
            Khi chọn chế độ <strong>Tổng hợp hài hòa (8 câu mặc định)</strong>, công cụ tự động trộn
            đều câu hỏi về nơi gặp gỡ, người hay làm hòa trước và tay hòm chìa khóa tài chính gia đình.
            Nếu sảnh có 20 bàn tiệc, bạn hãy chuẩn bị 4–5 phần quà nhỏ (dự trù kinh phí ngay trên{" "}
            <Link
              href="/cong-cu/bang-tinh-dam-cuoi"
              className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
            >
              bảng tính chi phí đám cưới
            </Link>
            ) và đối chiếu trước số bàn trên{" "}
            <Link
              href="/cong-cu/tao-danh-sach-khach-moi"
              className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
            >
              công cụ lập danh sách khách mời
            </Link>
            .
          </p>
        </div>

        <p className="text-sm leading-relaxed text-[#1F1D1A]/85 sm:text-base">
          Ngoài việc giao cho MC cầm kịch bản đọc, bạn có thể xuất sẵn các tấm thẻ câu hỏi Story 9:16
          để đăng lên mạng xã hội vài ngày trước lễ, rồi gắn kèm liên kết tạo từ{" "}
          <Link
            href="/tao-thiep"
            className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
          >
            trang tạo thiệp cưới Inviwedd
          </Link>{" "}
          để khách xác nhận tham dự và gửi ảnh chúc mừng trực tiếp lên màn hình LED.
        </p>
      </section>

      <div className="mx-auto mt-10 max-w-3xl">
        <ToolFaqSection
          title="Câu hỏi thường gặp về bộ Quiz trò chơi đám cưới"
          items={WEDDING_QUIZ_COPY.faqs}
        />
      </div>

      <div className="mt-10">
        <CrossToolNav currentTool="wedding-quiz" />
      </div>
    </ToolsPageShell>
  );
}
