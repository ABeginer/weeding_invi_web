"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { DesignerCanvas } from "@/components/ops/designer-canvas";
import type { DesignerCanvasContent } from "@/components/ops/designer-types";
import {
  getOpsDesignerTemplate,
  OpsApiError,
  type OpsDesignerTemplateDetail,
} from "@/lib/ops-api";

const EMPTY_CANVAS: DesignerCanvasContent = {
  width: 390,
  height: 844,
  background: "#FAF8F5",
  elements: [],
};

/**
 * Trang canvas là client page: dữ liệu mẫu được tải qua API có Bearer token,
 * không phụ thuộc cookie session Auth0 trong RSC. API vẫn chặn admin/designer.
 */
export default function DesignerEditorPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const [template, setTemplate] =
    React.useState<OpsDesignerTemplateDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);

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
        if (cancelled) return;
        setError(
          err instanceof OpsApiError
            ? err.message
            : "Không tải được mẫu thiết kế.",
        );
      });
    return () => {
      cancelled = true;
    };
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
          <span className="text-xs">Đang tải canvas...</span>
        </div>
      </div>
    );
  }

  const canvas =
    template.canvas_json &&
    typeof template.canvas_json === "object" &&
    (Array.isArray((template.canvas_json as { elements?: unknown }).elements) ||
      Array.isArray((template.canvas_json as { pages?: unknown }).pages))
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
