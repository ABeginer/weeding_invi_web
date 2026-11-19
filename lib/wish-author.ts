"use client";

export const WISH_AUTHOR_PREFIX = "inviwedd_wish_author:";

/**
 * Khoá định danh người gửi lời chúc khi khách vào bằng link chung.
 * Sinh một lần, lưu localStorage → gửi lại sẽ sửa đúng lời chúc cũ
 * thay vì tạo thêm (server chặn tuyệt đối bằng unique index).
 */
export function getWishAuthorKey(weddingSlug?: string): string {
  const storageKey = `${WISH_AUTHOR_PREFIX}${weddingSlug ?? "default"}`;
  try {
    const existing = window.localStorage.getItem(storageKey);
    if (existing && /^anon:[A-Za-z0-9-]{6,64}$/.test(existing)) return existing;
    const uuid =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    const key = `anon:${uuid}`;
    window.localStorage.setItem(storageKey, key);
    return key;
  } catch {
    return `anon:${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}
