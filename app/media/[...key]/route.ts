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

  const totalLength = obj.bytes.byteLength;
  const rangeHeader = req.headers.get("range");

  // Hỗ trợ HTTP Range (206 Partial Content) — bắt buộc để phát/tua nhạc .mp3 ổn định trên iOS Safari
  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (match) {
      const start = match[1] ? Number.parseInt(match[1], 10) : 0;
      const end = match[2] ? Math.min(totalLength - 1, Number.parseInt(match[2], 10)) : totalLength - 1;
      if (Number.isFinite(start) && Number.isFinite(end) && start <= end && start < totalLength) {
        const chunk = obj.bytes.subarray(start, end + 1);
        return new Response(chunk as BodyInit, {
          status: 206,
          headers: {
            "Content-Type": obj.contentType,
            "Content-Length": String(chunk.byteLength),
            "Content-Range": `bytes ${start}-${end}/${totalLength}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": CACHE_CONTROL,
            "X-Content-Type-Options": "nosniff",
          },
        });
      }
      return new Response(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${totalLength}`,
        },
      });
    }
  }

  const response = new Response(obj.bytes as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": obj.contentType,
      "Content-Length": String(totalLength),
      "Accept-Ranges": "bytes",
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

