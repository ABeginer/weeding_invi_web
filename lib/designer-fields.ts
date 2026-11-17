export type DesignerFieldKind = "image" | "text" | "textarea";

export interface DesignerField {
  key: string;
  label: string;
  kind: DesignerFieldKind;
  maxLength?: number;
}

export type DesignerImageField = DesignerField;

interface CanvasElementLike {
  id?: string;
  type?: string;
  guestField?: {
    label?: string;
    kind?: DesignerFieldKind;
    maxLength?: number;
  } | null;
}

/** Thu thập tất cả các trường mà Designer cho phép khách (cô dâu/chú rể) điền/thay (ảnh hoặc chữ). */
export function collectDesignerFields(
  canvas: Record<string, unknown> | null | undefined,
): DesignerField[] {
  if (!canvas) return [];
  const pages = Array.isArray(canvas.pages) ? canvas.pages : [];
  const elements: CanvasElementLike[] = [
    ...(Array.isArray(canvas.elements) ? (canvas.elements as CanvasElementLike[]) : []),
    ...pages.flatMap((page) =>
      page &&
      typeof page === "object" &&
      Array.isArray((page as { elements?: unknown }).elements)
        ? ((page as { elements: CanvasElementLike[] }).elements ?? [])
        : [],
    ),
  ];
  const seen = new Set<string>();
  return elements.flatMap((element) => {
    if (
      typeof element.id !== "string" ||
      !element.guestField ||
      seen.has(element.id)
    ) {
      return [];
    }
    seen.add(element.id);

    const isImage = element.type === "image" || element.type === "photo";
    const kind: DesignerFieldKind =
      element.guestField.kind || (isImage ? "image" : "text");

    const defaultLabel = isImage ? "Ảnh của bạn" : "Nội dung tùy chỉnh";
    const label = element.guestField.label?.trim() || defaultLabel;

    return [
      {
        key: element.id,
        label,
        kind,
        maxLength:
          typeof element.guestField.maxLength === "number" &&
          element.guestField.maxLength > 0
            ? element.guestField.maxLength
            : undefined,
      },
    ];
  });
}

/** Các ảnh designer đánh dấu “Khách thay ảnh”, dùng cho PhotosManager + preview. */
export function collectDesignerImageFields(
  canvas: Record<string, unknown> | null | undefined,
): DesignerField[] {
  return collectDesignerFields(canvas).filter((field) => field.kind === "image");
}

/** Các trường văn bản designer đánh dấu “Khách điền chữ”, dùng cho WeddingInfoEditor. */
export function collectDesignerTextFields(
  canvas: Record<string, unknown> | null | undefined,
): DesignerField[] {
  return collectDesignerFields(canvas).filter(
    (field) => field.kind === "text" || field.kind === "textarea",
  );
}
