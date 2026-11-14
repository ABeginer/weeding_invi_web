/** Giá trị mẫu cho placeholder của designer, dùng chung renderer và preview. */
export const DESIGNER_PLACEHOLDER_SAMPLES: Record<string, string> = {
  guestName: "Bạn Thanh Mai",
  groom: "Minh Khôi",
  bride: "Thảo Nguyên",
  date: "20.03.2027",
  venue: "White Palace, TP.HCM",
  salutation: "Trân trọng kính mời",
};

/**
 * Thay placeholder bằng dữ liệu thật; thiếu dữ liệu thì dùng giá trị mẫu,
 * placeholder lạ thì giữ nguyên text cố định.
 */
export function resolveDesignerText(
  text: string,
  placeholder: string | null,
  values: Record<string, string>,
): string {
  if (!placeholder) return text;
  const fallback = DESIGNER_PLACEHOLDER_SAMPLES[placeholder];
  if (fallback === undefined) return text;
  return values[placeholder]?.trim() ? values[placeholder] : fallback;
}
