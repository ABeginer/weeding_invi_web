export const WEDDING_DRAFT_STORAGE_KEY = "inviwedd_wedding_draft_v1";

export function getTemplateDraftKey(templateSlug: string): string {
  return `inviwedd_draft_${templateSlug}`;
}

export interface WeddingDraft {
  templateId: string;
  /** Mẫu designer sẽ gán ngay sau khi tạo thiệp (nếu có). */
  designerTemplateId?: string;
  groomName: string;
  brideName: string;
  date: string;
  quote: string;
  slug: string;
  groomParents?: string;
  brideParents?: string;
  eventTitle?: string;
  eventLocation?: string;
  eventAddress?: string;
  mapUrl?: string;
  musicTrack?: string;
  bank?: string;
  accountNumber?: string;
  accountName?: string;
}

export function readWeddingDraft(templateSlug?: string): WeddingDraft | null {
  if (typeof window === "undefined") return null;
  try {
    let raw: string | null = null;
    if (templateSlug) {
      raw = window.localStorage.getItem(getTemplateDraftKey(templateSlug));
    }
    if (!raw) {
      raw = window.localStorage.getItem(WEDDING_DRAFT_STORAGE_KEY);
    }
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
      designerTemplateId:
        typeof obj.designerTemplateId === "string" && obj.designerTemplateId
          ? obj.designerTemplateId
          : undefined,
      groomName: obj.groomName,
      brideName: obj.brideName,
      date: obj.date,
      quote: typeof obj.quote === "string" ? obj.quote : "",
      slug: obj.slug,
      groomParents: typeof obj.groomParents === "string" ? obj.groomParents : undefined,
      brideParents: typeof obj.brideParents === "string" ? obj.brideParents : undefined,
      eventTitle: typeof obj.eventTitle === "string" ? obj.eventTitle : undefined,
      eventLocation: typeof obj.eventLocation === "string" ? obj.eventLocation : undefined,
      eventAddress: typeof obj.eventAddress === "string" ? obj.eventAddress : undefined,
      mapUrl: typeof obj.mapUrl === "string" ? obj.mapUrl : undefined,
      musicTrack: typeof obj.musicTrack === "string" ? obj.musicTrack : undefined,
      bank: typeof obj.bank === "string" ? obj.bank : undefined,
      accountNumber: typeof obj.accountNumber === "string" ? obj.accountNumber : undefined,
      accountName: typeof obj.accountName === "string" ? obj.accountName : undefined,
    };
  } catch {
    return null;
  }
}

export function writeWeddingDraft(draft: WeddingDraft): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(draft);
    window.localStorage.setItem(WEDDING_DRAFT_STORAGE_KEY, serialized);
    if (draft.templateId) {
      window.localStorage.setItem(getTemplateDraftKey(draft.templateId), serialized);
    }
  } catch {
    // Bỏ qua lỗi quota hoặc chế độ riêng tư trình duyệt
  }
}

export function clearWeddingDraft(templateSlug?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(WEDDING_DRAFT_STORAGE_KEY);
    if (templateSlug) {
      window.localStorage.removeItem(getTemplateDraftKey(templateSlug));
    }
  } catch {
    // Bỏ qua lỗi storage
  }
}

