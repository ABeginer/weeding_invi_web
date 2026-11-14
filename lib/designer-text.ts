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
 *
 * `allowSampleFallback = false` dùng cho thiệp thật: placeholder thiếu dữ liệu
 * sẽ để trống thay vì hiện tên/địa điểm mẫu (tránh thông tin giả trên thiệp khách).
 */
export function resolveDesignerText(
  text: string,
  placeholder: string | null,
  values: Record<string, string>,
  allowSampleFallback = true,
): string {
  if (!placeholder) return text;
  const fallback = DESIGNER_PLACEHOLDER_SAMPLES[placeholder];
  if (fallback === undefined) return text;
  const provided = values[placeholder]?.trim();
  if (provided) return provided;
  return allowSampleFallback ? fallback : "";
}
