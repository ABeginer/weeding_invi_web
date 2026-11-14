import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { AllowedUploadMimeType } from "@/config/plans";
import type { PhotoKind } from "@/lib/wedding-types";

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
  /^weddings\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/(banner|couple|gallery|og|gift|album)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webp$/i;

export function buildPhotoStorageKey(weddingId: string, kind: PhotoKind): string {
  return `weddings/${weddingId}/${kind}/${crypto.randomUUID()}.webp`;
}

export function buildMediaUrl(storageKey: string): string {
  return `/media/${storageKey}`;
}

export function isValidMediaStorageKey(key: string): boolean {
  return MEDIA_KEY_RE.test(key);
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
  const contentType =
    obj.httpMetadata?.contentType ||
    detectImageMimeFromBytes(bytes) ||
    "image/webp";

  return { bytes, contentType };
}

export async function deletePhotoObject(storageKey: string): Promise<void> {
  if (!storageKey) return;
  const bucket = await getPhotosBucket();
  await bucket.delete(storageKey);
}

