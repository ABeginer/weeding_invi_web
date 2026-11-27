import type { DesignerElement } from "@/components/ops/designer-types";

export const DEFAULT_DESIGNER_LAYER = 1;

export function elementLayer(element: DesignerElement): number {
  const value = element.layer;
  if (!Number.isFinite(value)) return DEFAULT_DESIGNER_LAYER;
  return Math.max(DEFAULT_DESIGNER_LAYER, Math.round(value as number));
}

/** Layer thấp vẽ trước; trong cùng layer giữ nguyên thứ tự array. */
export function sortDesignerElementsByLayer(
  elements: DesignerElement[],
): DesignerElement[] {
  return elements
    .map((element, index) => ({ element, index }))
    .sort(
      (a, b) =>
        elementLayer(a.element) - elementLayer(b.element) || a.index - b.index,
    )
    .map(({ element }) => element);
}

export function designerLayerCount(elements: DesignerElement[]): number {
  return elements.reduce(
    (max, element) => Math.max(max, elementLayer(element)),
    DEFAULT_DESIGNER_LAYER,
  );
}
