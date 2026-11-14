import type { DesignerCanvasContent } from "@/components/ops/designer-types";
import { DesignerTemplateRenderer } from "./designer-template-renderer";

interface DesignerInvitationProps {
  canvas: DesignerCanvasContent;
  values: Record<string, string>;
  coupleLabel: string;
}

/**
 * Thiệp thật của designer: xếp toàn bộ trang theo đúng bản đã ghim.
 * Mỗi trang là một artboard 390×844 scale theo bề rộng màn hình.
 */
export function DesignerInvitation({
  canvas,
  values,
  coupleLabel,
}: DesignerInvitationProps) {
  const pages =
    Array.isArray(canvas.pages) && canvas.pages.length > 0 ? canvas.pages : null;
  const pageCount = pages?.length ?? 1;
  const background = pages?.[0]?.background ?? canvas.background ?? "#FAF8F5";

  return (
    <div className="min-h-screen-dvh w-full" style={{ backgroundColor: background }}>
      <main className="mx-auto w-full max-w-[430px]">
        <h1 className="sr-only">Thiệp cưới {coupleLabel}</h1>
        {Array.from({ length: pageCount }, (_, index) => (
          <DesignerTemplateRenderer
            key={pages?.[index]?.id ?? index}
            canvas={canvas}
            values={values}
            pageIndex={index}
            variant="plain"
            sampleFallback={false}
          />
        ))}
      </main>
    </div>
  );
}
