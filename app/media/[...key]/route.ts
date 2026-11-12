import { fail, route } from "@/lib/server/http";
import { getPhotoObject, isValidMediaStorageKey } from "@/lib/server/storage";

type Ctx = { params: Promise<{ key: string[] }> };

export const GET = route(async (_req: Request, { params }: Ctx) => {
  const { key } = await params;
  if (!Array.isArray(key) || key.length === 0) {
    return fail("Không tìm thấy ảnh.", 404);
  }

  const storageKey = key.join("/");
  if (!isValidMediaStorageKey(storageKey)) {
    return fail("Không tìm thấy ảnh.", 404);
  }

  const obj = await getPhotoObject(storageKey);
  if (!obj) {
    return fail("Không tìm thấy ảnh.", 404);
  }

  const copy = new Uint8Array(obj.bytes.byteLength);
  copy.set(obj.bytes);

  return new Response(copy.buffer, {
    status: 200,
    headers: {
      "Content-Type": obj.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
});

