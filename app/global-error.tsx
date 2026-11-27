"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Global error boundary:", error);
  }, [error]);

  return (
    <html lang="vi">
      <body className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-4 text-[#1F1D1A] antialiased">
        <div className="w-full max-w-md rounded-3xl border border-[#E8E2D9] bg-white p-8 text-center shadow-lg">
          <p className="text-xs font-semibold tracking-[0.2em] text-[#B89B72] uppercase">
            SỰ CỐ HỆ THỐNG
          </p>
          <h1 className="mt-2 font-serif text-2xl font-bold text-[#1F1D1A]">
            Đã xảy ra lỗi không mong muốn
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6B655E]">
            Xin lỗi vì sự bất tiện này. Bạn vui lòng tải lại trang để tiếp tục.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="mt-6 inline-flex h-11 cursor-pointer items-center justify-center rounded-full bg-[#7A1C24] px-6 text-xs font-semibold text-white transition-colors hover:bg-[#5E141B]"
          >
            Thử tải lại trang
          </button>
        </div>
      </body>
    </html>
  );
}
