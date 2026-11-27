"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log lỗi ra console phục vụ theo dõi
    console.error("App boundary error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#FAF8F5] px-4 py-16 text-[#1F1D1A]">
      <div className="w-full max-w-lg rounded-3xl border border-[#E8E2D9] bg-white p-8 text-center shadow-[0_10px_40px_rgba(31,29,26,0.04)] sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          <AlertCircle className="h-8 w-8 stroke-[1.5]" aria-hidden="true" />
        </div>

        <p className="mt-6 text-xs font-semibold tracking-[0.2em] text-[#B89B72] uppercase">
          ĐÃ XẢY RA LỖI
        </p>

        <h1 className="mt-2 font-serif text-3xl font-bold text-[#1F1D1A] sm:text-4xl">
          Rất tiếc, đã có sự cố xảy ra
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[#6B655E]">
          Hệ thống gặp sự cố không mong muốn trong quá trình xử lý.
          Bạn vui lòng thử tải lại trang hoặc quay về trang chủ.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full border border-[#7A1C24] bg-[#7A1C24] px-6 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B] active:scale-95"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Thử tải lại trang</span>
          </button>

          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#E8E2D9] bg-white px-6 text-xs font-medium text-[#1F1D1A] transition-colors hover:bg-[#FAF8F5] active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Về trang chủ</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
