import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignerInvitation } from "@/components/designer/designer-invitation";
import type { DesignerCanvasContent } from "@/components/ops/designer-types";
import { getDesignerTemplate, getDesignerVersion } from "@/lib/server/designer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Xem trước mẫu thiệp",
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

type PageProps = { params: Promise<{ id: string }> };

/** Trang nhúng cho card/modal trang chủ: render đúng nội dung thiệp, không chrome. */
export default async function DesignerEmbedPage({ params }: PageProps) {
  const { id } = await params;
  const template = await getDesignerTemplate(id);
  if (!template || template.status !== "published") notFound();

  const version = await getDesignerVersion(id, null);
  if (!version) notFound();

  const canvas = version.canvas_json as unknown as DesignerCanvasContent;

  return (
    <div data-designer-embed className="min-h-screen w-full bg-bg [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <style>{`
        html,
        body,
        * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        html::-webkit-scrollbar,
        body::-webkit-scrollbar,
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
      <DesignerInvitation
        canvas={canvas}
        values={SAMPLE_VALUES}
        coupleLabel="Minh Khôi & Thảo Nguyên"
        showCover={false}
      />
    </div>
  );
}
