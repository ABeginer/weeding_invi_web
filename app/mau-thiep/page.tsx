import type { Metadata } from "next";
import { DesignerShowcase } from "@/components/landing/designer-showcase";

export const metadata: Metadata = {
  title: "Mẫu thiệp thiết kế riêng",
  description:
    "Bộ sưu tập thiệp cưới được thiết kế riêng, xem trước nội dung thật và chọn mẫu phù hợp.",
};

export default function DesignerTemplatesPage() {
  return (
    <main className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-accent-text uppercase">
          Bộ sưu tập designer
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          Mẫu thiệp thiết kế riêng
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-text-muted">
          Mỗi mẫu là một thiệp hoàn chỉnh. Hover trên desktop hoặc chạm trên điện
          thoại để xem trước; bấm để mở popup có nhạc và tự cuộn.
        </p>
      </div>
      <DesignerShowcase showEmpty />
    </main>
  );
}
