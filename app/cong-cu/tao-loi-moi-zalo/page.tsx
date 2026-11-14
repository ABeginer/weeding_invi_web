import type { Metadata } from "next";
import { ZaloInviteGenerator } from "@/components/tools/zalo-invite-generator";
import { SITE_NAME } from "@/config/site";

export const metadata: Metadata = {
  title: `Tạo lời mời cưới Zalo chuẩn lễ nghi | ${SITE_NAME}`,
  description:
    "Soạn lời mời cưới gửi Zalo/Messenger đúng vai vế ông bà, cô chú, sếp, đồng nghiệp, bạn thân. 3 phương án chỉn chu, sao chép 1 chạm, miễn phí.",
};

export default function ZaloInvitePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mx-auto max-w-2xl text-center">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-accent-text uppercase">
          Công cụ miễn phí
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-text sm:text-4xl">
          Tạo lời mời cưới Zalo chuẩn lễ nghi
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-text-muted">
          Nhập thông tin một lần, nhận 3 lời mời đúng vai vế để gửi Zalo hoặc
          Messenger — không cần nghĩ câu chữ.
        </p>
      </header>

      <div className="mt-8">
        <ZaloInviteGenerator />
      </div>
    </main>
  );
}
