import { fail, json, readBody } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { db } from "@/lib/server/supabase";
import {
  buildDesignerAssetKey,
  detectImageMimeFromBytes,
  putPhotoObject,
} from "@/lib/server/storage";

const MAX_BYTES = 4 * 1024 * 1024;
const KINDS = ["photo", "png", "svg", "background", "snapshot"] as const;

function decodeDataUrl(dataUrl: string): Uint8Array | null {
  const match = /^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) return null;
  const binary = atob(match[2]);
  if (binary.length > MAX_BYTES) return null;
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export const POST = opsRoute(async (req: Request, admin) => {
  const body = await readBody(req);
  const dataUrl = typeof body?.dataUrl === "string" ? body.dataUrl : "";
  const kind = typeof body?.kind === "string" ? body.kind : "";
  const bytes = decodeDataUrl(dataUrl);

  if (!bytes) {
    return fail("Ảnh không hợp lệ hoặc vượt quá 4MB (chỉ nhận webp/png/jpeg).");
  }
  const mime = detectImageMimeFromBytes(bytes);
  if (mime !== "image/webp") {
    return fail("Vui lòng xuất ảnh dạng webp trước khi tải lên.");
  }
  if (!KINDS.includes(kind as (typeof KINDS)[number])) {
    return fail("Loại asset không hợp lệ.");
  }

  const key = buildDesignerAssetKey();
  await putPhotoObject(key, bytes, "image/webp");

  const { error } = await db().from("designer_assets").insert({
    kind,
    r2_key: key,
    uploaded_by: admin.email ?? "ops",
  });
  if (error) throw error;

  return json({ key, url: `/media/${key}` }, 201);
});

export const GET = opsRoute(async () => {
  const { data, error } = await db()
    .from("designer_assets")
    .select("id, kind, r2_key, width, height, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return json({ items: data ?? [] });
});
