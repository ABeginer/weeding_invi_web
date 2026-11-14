import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DesignerTemplateRenderer } from "@/components/designer/designer-template-renderer";
import type { DesignerCanvasContent } from "@/components/ops/designer-types";
import { getDesignerTemplate } from "@/lib/server/designer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview mẫu thiết kế",
  robots: { index: false, follow: false },
};

const SAMPLE_VALUES = {
  groom: "Minh Khôi",
  bride: "Thảo Nguyên",
  guestName: "Bạn Thanh Mai",
  date: "20.03.2027",
  venue: "White Palace, TP.HCM",
  salutation: "Trân trọng kính mời",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string }>;
};

export default async function DesignerPreviewPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { p } = await searchParams;
  const template = await getDesignerTemplate(id);
  if (!template) notFound();

  const canvas = template.canvas_json as unknown as DesignerCanvasContent;
  const pages = canvas.pages ?? [];
  const requested = Number.parseInt(p ?? "0", 10);
  const pageIndex = Number.isFinite(requested)
    ? Math.min(Math.max(requested, 0), Math.max(pages.length - 1, 0))
    : 0;

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
          pageIndex={pageIndex}
        />
      </div>

      {pages.length > 1 && (
        <div className="flex flex-wrap justify-center gap-2">
          {pages.map((page, index) => (
            <Link
              key={page.id}
              href={`/ops/designer/${template.id}/preview?p=${index}`}
              className={
                index === pageIndex
                  ? "rounded-full border border-accent bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent-text"
                  : "rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-muted"
              }
            >
              {page.name}
            </Link>
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
