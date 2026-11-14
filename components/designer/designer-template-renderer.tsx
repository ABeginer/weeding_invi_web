import type { DesignerCanvasContent } from "@/components/ops/designer-types";
import { resolveDesignerText } from "@/lib/designer-text";

export type DesignerPreviewValues = Record<string, string>;

interface DesignerTemplateRendererProps {
  canvas: DesignerCanvasContent;
  values?: DesignerPreviewValues;
  pageIndex?: number;
}

/** Render layout JSON của designer: nền + element đặt theo %, thay placeholder bằng dữ liệu thật. */
export function DesignerTemplateRenderer({
  canvas,
  values = {},
  pageIndex = 0,
}: DesignerTemplateRendererProps) {
  const page = canvas.pages?.[pageIndex] ?? canvas;
  const elements = page.elements ?? canvas.elements ?? [];
  const background = page.background ?? canvas.background;
  const backgroundUrl = page.backgroundUrl ?? canvas.backgroundUrl;

  return (
    <div
      className="relative mx-auto w-full max-w-[390px] overflow-hidden rounded-2xl border border-border shadow-xl"
      style={{
        aspectRatio: `${canvas.width} / ${canvas.height}`,
        background,
      }}
    >
      {backgroundUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}

      {elements.map((element) => {
        if (element.type === "image") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={element.id}
              src={element.url}
              alt=""
              className="absolute h-auto"
              style={{
                left: `${element.xPct}%`,
                top: `${element.yPct}%`,
                width: `${element.wPct}%`,
              }}
            />
          );
        }

        return (
          <div
            key={element.id}
            className="absolute"
            style={{
              left: `${element.xPct}%`,
              top: `${element.yPct}%`,
              width: `${element.wPct}%`,
              color: element.color,
              fontFamily: element.fontFamily,
              fontSize: element.fontSize,
              lineHeight: 1.25,
              whiteSpace: "pre-wrap",
            }}
          >
            {resolveDesignerText(element.text, element.placeholder, values)}
          </div>
        );
      })}
    </div>
  );
}
