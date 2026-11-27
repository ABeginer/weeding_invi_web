import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AllowedUploadMimeType } from "@/config/plans";
import { toAbsoluteSiteUrl } from "@/config/site";
import type { PhotoKind } from "@/lib/wedding-types";
import { getDefaultEdgeCache } from "./edge-cache";

const ALLOWED_MEDIA_CONTENT_TYPES = new Set([
  "image/webp",
  "image/jpeg",
  "image/png",
  "audio/mpeg",
]);

interface R2HttpMetadata {
  contentType?: string;
}

interface R2ObjectBodyLike {
  httpMetadata?: R2HttpMetadata;
  size?: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

interface R2BucketLike {
  get: (key: string) => Promise<R2ObjectBodyLike | null>;
  put: (
    key: string,
    value: ArrayBuffer | Uint8Array,
    options?: { httpMetadata?: R2HttpMetadata },
  ) => Promise<unknown>;
  delete: (key: string | string[]) => Promise<void>;
}

export const MEDIA_KEY_RE =
  /^weddings\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(banner|couple|gallery|og|gift|album|story)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i;

/** Ảnh nền/asset của designer (ops), lưu cùng bucket PHOTOS. */
export const DESIGNER_MEDIA_KEY_RE = /^designer\/[0-9a-f-]{36}\.webp$/i;

/** Nhạc nền tự tải lên (Pro). */
export const MUSIC_MEDIA_KEY_RE =
  /^weddings\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/music\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.mp3$/i;

export function buildDesignerAssetKey(): string {
  return `designer/${crypto.randomUUID()}.webp`;
}

export function buildPhotoStorageKey(weddingId: string, kind: PhotoKind): string {
  return `weddings/${weddingId}/${kind}/${crypto.randomUUID()}.webp`;
}

export function buildStoryPhotoStorageKey(weddingId: string): string {
  return `weddings/${weddingId}/story/${crypto.randomUUID()}.webp`;
}

export function buildMusicStorageKey(weddingId: string): string {
  return `weddings/${weddingId}/music/${crypto.randomUUID()}.mp3`;
}

export function buildMediaUrl(storageKey: string): string {
  return `/media/${storageKey}`;
}

export function isValidMediaStorageKey(key: string): boolean {
  return (
    MEDIA_KEY_RE.test(key) ||
    DESIGNER_MEDIA_KEY_RE.test(key) ||
    MUSIC_MEDIA_KEY_RE.test(key)
  );
}

export function detectImageMimeFromBytes(
  bytes: Uint8Array,
): AllowedUploadMimeType | null {
  if (bytes.length < 12) return null;

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  // WebP: RIFF....WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

async function getPhotosBucket(): Promise<R2BucketLike> {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as unknown as { PHOTOS?: R2BucketLike }).PHOTOS;
  if (!bucket) {
    throw new Error("R2 bucket binding PHOTOS chưa được cấu hình.");
  }
  return bucket;
}

export async function putMusicObject(
  storageKey: string,
  bytes: Uint8Array,
  contentType: "audio/mpeg",
): Promise<void> {
  const bucket = await getPhotosBucket();
  await bucket.put(storageKey, bytes, { httpMetadata: { contentType } });
}

export async function putPhotoObject(
  storageKey: string,
  bytes: Uint8Array,
  contentType: AllowedUploadMimeType,
): Promise<void> {
  const bucket = await getPhotosBucket();
  await bucket.put(storageKey, bytes, {
    httpMetadata: { contentType },
  });
}

export async function getPhotoObject(storageKey: string): Promise<{
  bytes: Uint8Array;
  contentType: string;
} | null> {
  if (!isValidMediaStorageKey(storageKey)) {
    return null;
  }

  const bucket = await getPhotosBucket();
  const obj = await bucket.get(storageKey);
  if (!obj) return null;

  const buffer = await obj.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const rawContentType = obj.httpMetadata?.contentType;
  const safeStoredType =
    rawContentType && ALLOWED_MEDIA_CONTENT_TYPES.has(rawContentType)
      ? rawContentType
      : null;
  const contentType =
    safeStoredType ||
    (MUSIC_MEDIA_KEY_RE.test(storageKey) ? "audio/mpeg" : null) ||
    detectImageMimeFromBytes(bytes) ||
    "image/webp";

  return { bytes, contentType };
}

export async function deletePhotoObject(storageKey: string): Promise<void> {
  if (!storageKey) return;
  const bucket = await getPhotosBucket();
  await bucket.delete(storageKey);

  // Xóa cache tại Cloudflare Edge ngay khi chủ thiệp xóa ảnh/nhạc
  const cache = getDefaultEdgeCache();
  if (cache) {
    try {
      const url = toAbsoluteSiteUrl(buildMediaUrl(storageKey));
      await cache.delete(new Request(url, { method: "GET" }));
    } catch {
      // Không để lỗi xóa cache làm hỏng luồng xóa file
    }
  }
}

