export const WEDDING_DRAFT_STORAGE_KEY = "inviwedd_wedding_draft_v1";

export interface WeddingDraft {
  templateId: string;
  groomName: string;
  brideName: string;
  date: string;
  quote: string;
  slug: string;
}

export function readWeddingDraft(): WeddingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WEDDING_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    if (
      typeof obj.templateId !== "string" ||
      typeof obj.groomName !== "string" ||
      typeof obj.brideName !== "string" ||
      typeof obj.date !== "string" ||
      typeof obj.slug !== "string"
    ) {
      return null;
    }
    return {
      templateId: obj.templateId,
      groomName: obj.groomName,
      brideName: obj.brideName,
      date: obj.date,
      quote: typeof obj.quote === "string" ? obj.quote : "",
      slug: obj.slug,
    };
  } catch {
    return null;
  }
}

export function writeWeddingDraft(draft: WeddingDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WEDDING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Bỏ qua lỗi quota hoặc chế độ riêng tư trình duyệt
  }
}

export function clearWeddingDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WEDDING_DRAFT_STORAGE_KEY);
  } catch {
    // Bỏ qua lỗi storage
  }
}
