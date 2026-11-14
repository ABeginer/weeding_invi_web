import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DesignerTemplateRenderer } from "@/components/designer/designer-template-renderer";
import type { DesignerCanvasContent } from "@/components/ops/designer-types";
import { getDesignerTemplate, getDesignerVersion } from "@/lib/server/designer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mẫu thiệp thiết kế",
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
  searchParams: Promise<{ v?: string }>;
};

/** Xem công khai một version đã publish (dùng cho QA/nghiệm thu trước khi gắn vào thiệp). */
export default async function PublishedDesignerPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { v } = await searchParams;
  const template = await getDesignerTemplate(id);
  if (!template) notFound();

  const versionNumber = v ? Number.parseInt(v, 10) : undefined;
  const version = await getDesignerVersion(
    id,
    Number.isFinite(versionNumber) ? versionNumber : null,
  );
  if (!version) notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
      <header className="text-center">
        <p className="text-[11px] font-semibold tracking-[0.18em] text-accent-text uppercase">
          Bản đã xuất bản
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-text">{template.name}</h1>
        <p className="mt-1 text-xs text-text-muted">
          Version {version.version} · publish {new Date(version.published_at).toLocaleDateString("vi-VN")}
        </p>
      </header>

      <div className="rounded-2xl border border-border bg-surface-alt p-4 sm:p-6">
        <DesignerTemplateRenderer
          canvas={version.canvas_json as unknown as DesignerCanvasContent}
          values={SAMPLE_VALUES}
        />
      </div>

      <p className="text-center text-xs text-text-muted">
        Đây là bản ghim theo version. Thiệp đã tạo sẽ luôn render đúng version được gán,
        không tự đổi khi designer publish bản mới.{" "}
        <Link href="/" className="underline underline-offset-4">
          Về trang chủ
        </Link>
      </p>
    </main>
  );
}
