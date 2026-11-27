import { SITE_LINKS } from "@/config/site";

export const CATALOG_RETURN_KEY = "inviwedd:catalog-return";
export const DEMO_ORIGIN_KEY = "inviwedd:demo-return-origin";

export interface CatalogReturnState {
  url: string;
  scrollY: number;
}

/** Ghi nhớ đường dẫn + vị trí cuộn của trang Bộ sưu tập trước khi mở toàn màn hình một mẫu thiệp. */
export function saveCatalogReturnState(): void {
  if (typeof window === "undefined") return;
  try {
    const currentUrl = window.location.pathname + window.location.search;
    const payload: CatalogReturnState = {
      url: currentUrl,
      scrollY: window.scrollY || 0,
    };
    window.sessionStorage.setItem(CATALOG_RETURN_KEY, JSON.stringify(payload));
    window.sessionStorage.setItem(DEMO_ORIGIN_KEY, currentUrl);
  } catch {
    // Bỏ qua nếu trình duyệt khóa sessionStorage (Private mode nghiêm ngặt)
  }
}

/** Ghi nhớ trang nguồn nội bộ (ví dụ Landing `/`) trước khi mở xem thử toàn màn hình. */
export function markDemoReturnOrigin(clearCatalog = false): void {
  if (typeof window === "undefined") return;
  try {
    const currentUrl = window.location.pathname + window.location.search;
    window.sessionStorage.setItem(DEMO_ORIGIN_KEY, currentUrl);
    if (clearCatalog) {
      window.sessionStorage.removeItem(CATALOG_RETURN_KEY);
    }
  } catch {
    // ignore
  }
}

/** Đọc và tiêu thụ (xóa) trạng thái cuộn cần khôi phục nếu URL hiện tại khớp trang đã lưu. */
export function consumeMatchingCatalogScrollY(currentUrl: string): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(CATALOG_RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CatalogReturnState>;
    window.sessionStorage.removeItem(CATALOG_RETURN_KEY);
    if (
      typeof parsed?.url === "string" &&
      parsed.url === currentUrl &&
      typeof parsed.scrollY === "number" &&
      Number.isFinite(parsed.scrollY) &&
      parsed.scrollY > 0
    ) {
      return parsed.scrollY;
    }
  } catch {
    // ignore
  }
  return null;
}

/** Xác định đích quay lại cho nút "← Quay lại mẫu": ưu tiên trang trước nội bộ, rồi URL bộ sưu tập đã lưu, cuối cùng là /thiep-cuoi. */
export function resolveDemoBackNavigation():
  | { type: "back" }
  | { type: "push"; href: string } {
  if (typeof window === "undefined") {
    return { type: "push", href: SITE_LINKS.templates };
  }

  let sameOriginReferrer = false;
  let externalReferrer = false;
  try {
    if (document.referrer) {
      const refUrl = new URL(document.referrer);
      if (refUrl.origin === window.location.origin) {
        const current = window.location.pathname + window.location.search;
        const refPath = refUrl.pathname + refUrl.search;
        sameOriginReferrer = refPath !== current;
      } else {
        externalReferrer = true;
      }
    }
  } catch {
    sameOriginReferrer = false;
  }

  let savedCatalogUrl: string | null = null;
  let savedOrigin: string | null = null;
  try {
    const rawCatalog = window.sessionStorage.getItem(CATALOG_RETURN_KEY);
    if (rawCatalog) {
      const parsed = JSON.parse(rawCatalog) as Partial<CatalogReturnState>;
      if (typeof parsed?.url === "string" && parsed.url.startsWith(SITE_LINKS.templates)) {
        savedCatalogUrl = parsed.url;
      }
    }
    const rawOrigin = window.sessionStorage.getItem(DEMO_ORIGIN_KEY);
    if (rawOrigin && rawOrigin.startsWith("/")) {
      savedOrigin = rawOrigin;
      window.sessionStorage.removeItem(DEMO_ORIGIN_KEY);
    }
  } catch {
    // ignore
  }

  const hasInternalHistory =
    !externalReferrer &&
    (sameOriginReferrer || savedOrigin !== null || savedCatalogUrl !== null) &&
    window.history.length > 1;

  if (hasInternalHistory) {
    return { type: "back" };
  }

  if (savedCatalogUrl) {
    return { type: "push", href: savedCatalogUrl };
  }
  if (savedOrigin) {
    return { type: "push", href: savedOrigin };
  }
  return { type: "push", href: SITE_LINKS.templates };
}
