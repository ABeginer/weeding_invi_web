"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DesignerTemplateRenderer } from "@/components/designer/designer-template-renderer";
import type { DesignerCanvasContent } from "@/components/ops/designer-types";
import {
  getOpsDesignerTemplate,
  OpsApiError,
  type OpsDesignerTemplateDetail,
} from "@/lib/ops-api";

const SAMPLE_VALUES = {
  groom: "Minh Khôi",
  bride: "Thảo Nguyên",
  guestName: "Bạn Thanh Mai",
  date: "20.03.2027",
  venue: "White Palace, TP.HCM",
  salutation: "Trân trọng kính mời",
};

export default function DesignerPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const [template, setTemplate] =
    React.useState<OpsDesignerTemplateDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pageIndex, setPageIndex] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setTemplate(null);
    setError(null);
    if (!id) {
      setError("Không tìm thấy mẫu.");
      return;
    }
    getOpsDesignerTemplate(id)
      .then((data) => {
        if (!cancelled) setTemplate(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof OpsApiError
              ? err.message
              : "Không tải được mẫu thiết kế.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  React.useEffect(() => {
    const requested = Number.parseInt(
      new URLSearchParams(window.location.search).get("p") ?? "0",
      10,
    );
    setPageIndex(Number.isFinite(requested) ? Math.max(0, requested) : 0);
  }, [id]);

  if (error) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-semibold text-text">{error}</p>
        <Link
          href="/ops/designer"
          className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
        >
          Quay lại danh sách mẫu
        </Link>
      </main>
    );
  }

  if (!template) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-text-muted">
          <Loader2 className="h-7 w-7 animate-spin text-accent-text" />
          <span className="text-xs">Đang tải bản xem trước...</span>
        </div>
      </div>
    );
  }

  const canvas =
    template.canvas_json && typeof template.canvas_json === "object"
      ? (template.canvas_json as unknown as DesignerCanvasContent)
      : ({ width: 390, height: 844, background: "#FAF8F5", elements: [] } as DesignerCanvasContent);
  const pages = canvas.pages ?? [];
  const safeIndex = Math.min(pageIndex, Math.max(pages.length - 1, 0));

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/ops/designer/${template.id}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text"
            aria-label="Quay lại canvas"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-semibold text-text">{template.name}</h1>
            <p className="text-xs text-text-muted">
              {template.status} · v{template.version} · preview với dữ liệu mẫu
            </p>
          </div>
        </div>
        <Link
          href={`/ops/designer/${template.id}`}
          className="inline-flex h-9 items-center rounded-full border border-border bg-surface px-3 text-xs font-medium text-text"
        >
          Sửa trong canvas
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-surface-alt p-4 sm:p-6">
        <DesignerTemplateRenderer
          canvas={canvas}
          values={SAMPLE_VALUES}
          pageIndex={safeIndex}
        />
      </div>

      {pages.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {pages.map((page, index) => (
            <a
              key={page.id}
              href={`/ops/designer/${template.id}/preview?p=${index}`}
              className={
                index === safeIndex
                  ? "rounded-full border border-accent bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-text"
                  : "rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-muted"
              }
            >
              {page.name}
            </a>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-text-muted">
        Đây là bản xem trước. Mẫu chỉ xuất hiện trên trang chính sau khi publish và renderer
        được nối vào luồng thiệp.
      </p>
    </main>
  );
}
