import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sổ mừng cưới | Quản lý thiệp cưới",
  robots: { index: false, follow: false },
};

export default function SoMungPage() {
  return (
    <div className="mx-auto max-w-xl">
      <div className="rounded-2xl border border-border bg-surface p-6 text-center sm:p-8">
        <p className="text-xs font-semibold tracking-[0.18em] text-accent-text uppercase">
          Sắp ra mắt
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-text">
          Sổ mừng cưới đang được hoàn thiện
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          Tính năng ghi nhận tiền mừng và đối chiếu với danh sách khách mời chưa
          sẵn sàng. Chúng tôi sẽ mở lại mục này ngay khi hoàn tất phần máy chủ.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          Về danh sách thiệp cưới
        </Link>
      </div>
    </div>
  );
}
