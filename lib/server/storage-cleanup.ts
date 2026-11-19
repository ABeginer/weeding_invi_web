import type { WeddingContent } from "@/lib/wedding-types";

export const MEDIA_KEY_RE =
  /^weddings\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(banner|couple|gallery|og|gift|album)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i;

export const DESIGNER_MEDIA_KEY_RE = /^designer\/[0-9a-f-]{36}\.webp$/i;

export const MUSIC_MEDIA_KEY_RE =
  /^weddings\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/music\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mp3$/i;

export function isValidMediaStorageKey(key: string): boolean {
  return (
    MEDIA_KEY_RE.test(key) ||
    DESIGNER_MEDIA_KEY_RE.test(key) ||
    MUSIC_MEDIA_KEY_RE.test(key)
  );
}

/**
 * Trích xuất relative storage path từ URL công khai của ảnh.
 *
 * BẢO MẬT CHỐNG IDOR & BẢO VỆ TÀI NGUYÊN TĨNH:
 * - Nếu có truyền `weddingId`, bắt buộc đường dẫn phải bắt đầu bằng `weddings/${weddingId}/`.
 * - Tuyệt đối không xóa tài nguyên tĩnh của hệ thống: các đường dẫn bắt đầu bằng
 *   `templates/`, `photos/`, `images/`, `preset/` hoặc các ảnh demo mẫu.
 */
export function extractStoragePath(
  urlOrKey: string | null | undefined,
  weddingId?: string,
): string | null {
  if (!urlOrKey || typeof urlOrKey !== "string") return null;

  const trimmed = urlOrKey.trim();
  if (!trimmed) return null;

  // Bỏ qua tài nguyên tĩnh hệ thống
  if (
    trimmed.startsWith("/templates/") ||
    trimmed.startsWith("/photos/") ||
    trimmed.startsWith("/images/") ||
    trimmed.startsWith("templates/") ||
    trimmed.startsWith("photos/") ||
    trimmed.startsWith("images/") ||
    trimmed.includes("preset") ||
    trimmed.includes("demo")
  ) {
    return null;
  }

  let extractedKey = trimmed;

  // Xóa query parameters nếu có (?v=... hoặc token)
  const queryIndex = extractedKey.indexOf("?");
  if (queryIndex !== -1) {
    extractedKey = extractedKey.slice(0, queryIndex);
  }

  // Nếu là URL đầy đủ có origin: https://.../media/weddings/... hoặc https://.../storage/v1/object/public/...
  if (extractedKey.startsWith("http://") || extractedKey.startsWith("https://")) {
    try {
      const parsedUrl = new URL(extractedKey);
      extractedKey = parsedUrl.pathname;
    } catch {
      return null;
    }
  }

  // Bóc tách tiền tố /media/
  if (extractedKey.startsWith("/media/")) {
    extractedKey = extractedKey.slice("/media/".length);
  } else if (extractedKey.startsWith("/")) {
    extractedKey = extractedKey.slice(1);
  }

  // Bóc tách nếu là Supabase Storage path: storage/v1/object/public/{bucket}/...
  const supabasePrefix = "storage/v1/object/public/photos/";
  if (extractedKey.startsWith(supabasePrefix)) {
    extractedKey = extractedKey.slice(supabasePrefix.length);
  }

  // Kiểm tra tính hợp lệ của media key theo format chuẩn hệ thống
  if (!isValidMediaStorageKey(extractedKey)) {
    return null;
  }

  // KIỂM TRA QUYỀN SỞ HỮU (IDOR GUARD)
  if (weddingId) {
    const expectedPrefix = `weddings/${weddingId}/`;
    if (!extractedKey.startsWith(expectedPrefix)) {
      console.warn(
        `[Storage Cleanup] Từ chối xóa file không thuộc thiệp cưới hiện tại (IDOR guard): ${extractedKey}`,
      );
      return null;
    }
  }

  return extractedKey;
}

/**
 * Xóa an toàn danh sách storage objects trên Cloudflare R2 / Storage.
 *
 * NGUYÊN TẮC BẤT DI BẤT DỊCH:
 * Luôn bọc trong try/catch và log cảnh báo ra console.warn.
 * Tuyệt đối không bao giờ làm gián đoạn hay throw lỗi làm sập thao tác lưu/xóa của người dùng.
 */
export async function safeRemoveStorageObjects(
  paths: (string | null | undefined)[],
): Promise<{ deleted: number; errors: number }> {
  let deleted = 0;
  let errors = 0;

  const validPaths = Array.from(new Set(paths.filter((p): p is string => Boolean(p))));
  if (validPaths.length === 0) return { deleted: 0, errors: 0 };

  let deleter: ((key: string) => Promise<void>) | null = null;
  try {
    const mod = await import("./storage");
    deleter = mod.deletePhotoObject;
  } catch (err) {
    console.warn("[Storage Cleanup Warning] Không thể nạp storage module:", err);
    return { deleted: 0, errors: validPaths.length };
  }

  for (const path of validPaths) {
    try {
      await deleter(path);
      deleted += 1;
    } catch (err) {
      errors += 1;
      console.warn(`[Storage Cleanup Warning] Không thể xóa file mồ côi: ${path}`, err);
    }
  }

  return { deleted, errors };
}

/**
 * Thu thập tất cả các URL ảnh do người dùng upload được lưu trữ trong WeddingContent.
 */
export function collectMediaUrlsFromContent(
  content: WeddingContent | Record<string, unknown> | null | undefined,
): Set<string> {
  const urls = new Set<string>();
  if (!content) return urls;

  const raw = content as Record<string, unknown>;

  // Mã QR mừng cưới VietQR
  const gift = raw.gift as Record<string, unknown> | undefined;
  if (gift) {
    if (typeof gift.groomQrUrl === "string") urls.add(gift.groomQrUrl);
    if (typeof gift.brideQrUrl === "string") urls.add(gift.brideQrUrl);
  }

  // Nhạc nền tải lên (nếu có lưu dạng /media/...)
  if (typeof raw.musicUrl === "string" && raw.musicUrl.startsWith("/media/")) {
    urls.add(raw.musicUrl);
  }
  const music = raw.music as Record<string, unknown> | undefined;
  if (music && typeof music.src === "string" && music.src.startsWith("/media/")) {
    urls.add(music.src);
  }

  // Designer overrides (các ảnh tùy chỉnh trong mẫu designer)
  if (raw.designerOverrides && typeof raw.designerOverrides === "object") {
    for (const val of Object.values(raw.designerOverrides as Record<string, unknown>)) {
      if (typeof val === "string" && val.startsWith("/media/")) {
        urls.add(val);
      } else if (val && typeof val === "object" && typeof (val as Record<string, unknown>).src === "string") {
        const src = (val as Record<string, unknown>).src as string;
        if (src.startsWith("/media/")) {
          urls.add(src);
        }
      }
    }
  }

  // Designer fields
  if (raw.designerFields && typeof raw.designerFields === "object") {
    for (const val of Object.values(raw.designerFields as Record<string, unknown>)) {
      if (typeof val === "string" && val.startsWith("/media/")) {
        urls.add(val);
      }
    }
  }

  return urls;
}

/**
 * So sánh nội dung cũ và mới của thiệp cưới để tìm ra các file ảnh mồ côi
 * đã bị thay thế hoặc xóa bỏ hoàn toàn.
 */
export function diffOrphanedStorageKeys(
  prevContent: WeddingContent | null | undefined,
  nextContent: WeddingContent | null | undefined,
  weddingId: string,
): string[] {
  const prevUrls = collectMediaUrlsFromContent(prevContent);
  const nextUrls = collectMediaUrlsFromContent(nextContent);

  const orphanedKeys: string[] = [];

  for (const prevUrl of prevUrls) {
    if (!nextUrls.has(prevUrl)) {
      const storagePath = extractStoragePath(prevUrl, weddingId);
      if (storagePath) {
        orphanedKeys.push(storagePath);
      }
    }
  }

  return orphanedKeys;
}
