"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";

export default function OpsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Ops error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#E8E2D9] bg-white p-7 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-serif text-xl font-bold text-[#1F1D1A]">
          Lỗi tải dữ liệu vận hành
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#6B655E]">
          Vui lòng thử tải lại hoặc quay về trang tổng quan Ops.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-[#7A1C24] px-5 text-xs font-semibold text-white hover:bg-[#5E141B]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Thử lại</span>
          </button>
          <Link
            href="/ops"
            className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#E8E2D9] bg-white px-5 text-xs font-medium text-[#1F1D1A] hover:bg-[#FAF8F5]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Về Ops</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
