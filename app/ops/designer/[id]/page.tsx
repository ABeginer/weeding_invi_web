import { notFound } from "next/navigation";
import { DesignerCanvas } from "@/components/ops/designer-canvas";
import { getDesignerTemplate } from "@/lib/server/designer";
import type { DesignerCanvasContent } from "@/components/ops/designer-types";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

const EMPTY_CANVAS: DesignerCanvasContent = {
  width: 390,
  height: 844,
  background: "#FAF8F5",
  elements: [],
};

export default async function DesignerEditorPage({ params }: PageProps) {
  const { id } = await params;
  const template = await getDesignerTemplate(id);
  if (!template) notFound();

  const canvas =
    template.canvas_json && Array.isArray((template.canvas_json as { elements?: unknown }).elements)
      ? (template.canvas_json as unknown as DesignerCanvasContent)
      : EMPTY_CANVAS;

  return (
    <DesignerCanvas
      templateId={template.id}
      name={template.name}
      initialCanvas={canvas}
      backgroundKey={template.background_key}
    />
  );
}
