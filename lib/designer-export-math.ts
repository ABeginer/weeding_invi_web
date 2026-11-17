/**
 * Tính toán hình học cho phép xoay và kết xuất phần tử canvas Designer.
 */

export function calculateElementCenter(
  x: number,
  y: number,
  w: number,
  h: number,
): { cx: number; cy: number } {
  return {
    cx: x + w / 2,
    cy: y + h / 2,
  };
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function calculateRotatedBoundingBox(
  w: number,
  h: number,
  degrees: number,
): { width: number; height: number } {
  const rad = degreesToRadians(degrees);
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  return {
    width: Math.round(w * cos + h * sin),
    height: Math.round(w * sin + h * cos),
  };
}
