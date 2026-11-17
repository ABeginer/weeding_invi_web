import { fail, route } from "@/lib/server/http";
import { getDefaultEdgeCache } from "@/lib/server/edge-cache";
import { getPhotoObject, isValidMediaStorageKey } from "@/lib/server/storage";

type Ctx = { params: Promise<{ key: string[] }> };

const CACHE_CONTROL =
  "public, max-age=31536000, s-maxage=31536000, immutable";

export const GET = route(async (req: Request, { params }: Ctx) => {
  const { key } = await params;
  if (!Array.isArray(key) || key.length === 0) {
    return fail("Không tìm thấy ảnh.", 404);
  }

  const storageKey = key.join("/");
  if (!isValidMediaStorageKey(storageKey)) {
    return fail("Không tìm thấy ảnh.", 404);
  }

  // R2 key là bất biến; cache theo URL ở data center hiện tại để không đọc R2
  // lại cho mỗi lượt xem (tiết kiệm Class B + CPU của Worker).
  const cache = getDefaultEdgeCache();
  const cacheKey = cache
    ? new Request(new URL(req.url).toString(), { method: "GET" })
    : null;
  if (cache && cacheKey) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) return hit;
    } catch {
      // Cache lỗi không được làm hỏng request ảnh.
    }
  }

  const obj = await getPhotoObject(storageKey);
  if (!obj) {
    return fail("Không tìm thấy ảnh.", 404);
  }

  const copy = new Uint8Array(obj.bytes.byteLength);
  copy.set(obj.bytes);

  const response = new Response(copy.buffer, {
    status: 200,
    headers: {
      "Content-Type": obj.contentType,
      "Cache-Control": CACHE_CONTROL,
      "X-Content-Type-Options": "nosniff",
    },
  });

  if (cache && cacheKey) {
    try {
      await cache.put(cacheKey, response.clone());
    } catch {
      // Bỏ qua: vẫn trả ảnh cho khách.
    }
  }

  return response;
});

