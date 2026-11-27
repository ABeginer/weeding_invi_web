import type { Metadata } from "next";
import Link from "next/link";
import { CrossToolNav } from "@/components/tools/CrossToolNav";
import { GuestListPlannerClient } from "@/components/tools/GuestListPlannerClient";
import { JsonLd } from "@/components/tools/JsonLd";
import { ToolFaqSection } from "@/components/tools/ToolFaqSection";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { SITE_LINKS, SITE_NAME, toAbsoluteSiteUrl } from "@/config/site";
import { GUEST_LIST_COPY } from "@/config/tools-copy";

const canonicalUrl = toAbsoluteSiteUrl(SITE_LINKS.toolGuestList);
const ogImageUrl = toAbsoluteSiteUrl("/templates/vuon-o-liu/cover.webp");

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: GUEST_LIST_COPY.seo.title,
  description: GUEST_LIST_COPY.seo.description,
  keywords: [...GUEST_LIST_COPY.seo.keywords],
  alternates: {
    canonical: canonicalUrl,
    languages: {
      "vi-VN": canonicalUrl,
    },
  },
  openGraph: {
    title: `${GUEST_LIST_COPY.seo.title} | ${SITE_NAME}`,
    description: GUEST_LIST_COPY.seo.description,
    type: "website",
    locale: "vi_VN",
    url: canonicalUrl,
    siteName: SITE_NAME,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: GUEST_LIST_COPY.seo.ogAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${GUEST_LIST_COPY.seo.title} | ${SITE_NAME}`,
    description: GUEST_LIST_COPY.seo.description,
    images: [ogImageUrl],
  },
};

export default function GuestListPlannerPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: GUEST_LIST_COPY.seo.appName,
        url: canonicalUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        inLanguage: "vi-VN",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "VND",
        },
        description: GUEST_LIST_COPY.seo.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: GUEST_LIST_COPY.breadcrumbs.map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          name: item.label,
          item: toAbsoluteSiteUrl(item.href),
        })),
      },
      {
        "@type": "FAQPage",
        mainEntity: GUEST_LIST_COPY.faqs.map((faq) => ({
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
    <ToolsPageShell breadcrumbs={[...GUEST_LIST_COPY.breadcrumbs]}>
      <JsonLd data={jsonLd} />

      {/* 1. Centered Hero */}
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#B89B72]">
          {GUEST_LIST_COPY.hero.eyebrow}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-normal tracking-tight text-[#1F1D1A] sm:text-4xl lg:text-5xl">
          {GUEST_LIST_COPY.hero.h1}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#6B655E] sm:text-base">
          {GUEST_LIST_COPY.hero.subtitle}
        </p>
      </header>

      {/* 2. Stepped Wizard Widget + SmartToolCta */}
      <div className="mt-8">
        <GuestListPlannerClient />
      </div>

      {/* 3. Rich Guide & Concrete Worked Example */}
      <section
        aria-labelledby="guest-list-guide-heading"
        className="mx-auto mt-12 max-w-3xl space-y-6 rounded-2xl border border-[#E8E2D9] bg-white p-6 sm:p-8"
      >
        <div className="space-y-2">
          <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[#B89B72]">
            KINH NGHIỆM CHIA KHÁCH & SẮP BÀN TIỆC
          </p>
          <h2
            id="guest-list-guide-heading"
            className="font-serif text-2xl font-normal text-[#1F1D1A] sm:text-3xl"
          >
            Cách lập danh sách khách mời đám cưới không sót tên và không lệch số mâm
          </h2>
        </div>

        <p className="text-sm leading-relaxed text-[#1F1D1A]/85 sm:text-base">
          Khi chuẩn bị cưới, danh sách khách thường thay đổi liên tục đến sát ngày đặt cọc nhà hàng.
          Thay vì ghép tất cả vào một bảng tính rời rạc, việc phân chia ngay theo bốn nhóm chính
          (Họ hàng Nhà trai, Họ hàng Nhà gái, Bạn bè, Đồng nghiệp) kết hợp đánh dấu rõ từng buổi lễ
          giúp hai gia đình chốt số lượng mâm cỗ chính xác mà không mất công đếm lại từ đầu.
        </p>

        <div className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-5">
          <h3 className="font-serif text-lg font-medium text-[#1F1D1A]">
            Ví dụ thực tế với đám cưới quy mô 160 khách
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#6B655E]">
            Giả sử tổng danh sách có 160 người tham dự tiệc chính tại nhà hàng (50 người họ nội nhà trai,
            45 người họ ngoại nhà gái, 40 bạn bè thân và 25 đồng nghiệp công ty), xếp tiêu chuẩn 10 người/bàn.
            Công cụ tính ra <strong>16 bàn chính thức</strong> và khuyến nghị đặt thêm{" "}
            <strong>2 bàn dự phòng</strong> ở sảnh tiệc cưới. Riêng Lễ Vu Quy buổi sáng tại nhà gái
            chỉ đánh dấu cho 45 người họ ngoại cùng 10 bạn thân phù dâu, nên quy mô thu gọn còn{" "}
            <strong>6 bàn gia tiên</strong> (cộng 1 bàn dự phòng). Sau khi có con số bàn chính xác, bạn có thể
            nhập thẳng vào{" "}
            <Link
              href="/cong-cu/bang-tinh-dam-cuoi"
              className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
            >
              bảng tính chi phí đám cưới
            </Link>{" "}
            để cân đối ngân sách đặt tiệc.
          </p>
        </div>

        <p className="text-sm leading-relaxed text-[#1F1D1A]/85 sm:text-base">
          Sau khi hoàn tất danh sách và chia số bàn, bước tiếp theo là gửi lời mời đúng lễ nghi cho từng
          vai vế từ ông bà, cô chú đến bạn thân. Bạn có thể chọn nhanh tin nhắn phù hợp bằng{" "}
          <Link
            href="/cong-cu/tao-loi-moi-zalo"
            className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
          >
            công cụ soạn lời mời Zalo
          </Link>{" "}
          hoặc bấm nút <strong>Sao chép dán Inviwedd</strong> ở trên rồi mở trang{" "}
          <Link
            href="/tao-thiep"
            className="font-medium text-[#7A1C24] underline underline-offset-4 hover:text-[#5E141B]"
          >
            tạo thiệp cưới online
          </Link>{" "}
          để dán hàng loạt tối đa 500 khách mời trong một thao tác.
        </p>
      </section>

      {/* 4. FAQ */}
      <div className="mx-auto mt-10 max-w-3xl">
        <ToolFaqSection
          title="Câu hỏi thường gặp khi lập danh sách khách mời"
          items={GUEST_LIST_COPY.faqs}
        />
      </div>

      {/* 5. Cross-tool navigation */}
      <div className="mt-10">
        <CrossToolNav currentTool="guest-list" />
      </div>
    </ToolsPageShell>
  );
}
