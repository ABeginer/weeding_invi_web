import {
  getDesignerTemplate,
  updateDesignerTemplate,
} from "@/lib/server/designer";
import { fail, json, UUID_RE } from "@/lib/server/http";
import { opsDesignerRoute, recordAuditLog } from "@/lib/server/ops";
import { db } from "@/lib/server/supabase";
import {
  buildDesignerAssetKey,
  buildMediaUrl,
  deletePhotoObject,
  detectImageMimeFromBytes,
  putPhotoObject,
} from "@/lib/server/storage";

type Ctx = { params: Promise<{ id: string }> };

const MAX_COVER_BYTES = 4 * 1024 * 1024;

/** Upload ảnh bìa cho mẫu designer (lưu R2 + snapshot_key + designer_assets). */
export const POST = opsDesignerRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  if (!UUID_RE.test(id)) return fail("Không tìm thấy mẫu thiết kế.", 404);

  const template = await getDesignerTemplate(id);
  if (!template) return fail("Không tìm thấy mẫu thiết kế.", 404);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return fail("Yêu cầu phải gửi dạng multipart/form-data.");
  }

  const fileEntry = formData.get("file");
  if (
    !fileEntry ||
    typeof fileEntry === "string" ||
    typeof fileEntry.arrayBuffer !== "function"
  ) {
    return fail("Vui lòng chọn file ảnh bìa.");
  }
  if (fileEntry.size <= 0) return fail("File ảnh rỗng.");
  if (fileEntry.size > MAX_COVER_BYTES) {
    return fail("Ảnh bìa vượt quá 4 MB.");
  }

  const bytes = new Uint8Array(await fileEntry.arrayBuffer());
  const mime = detectImageMimeFromBytes(bytes);
  if (mime !== "image/webp") {
    return fail(
      "Ảnh bìa phải là WebP. Trình duyệt sẽ tự nén khi chọn ảnh; nếu vẫn lỗi, hãy dùng Chrome/Edge.",
    );
  }

  const key = buildDesignerAssetKey();
  await putPhotoObject(key, bytes, "image/webp");

  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));

  const assetInsert = await db()
    .from("designer_assets")
    .insert({
      kind: "snapshot",
      r2_key: key,
      width: Number.isFinite(width) && width > 0 ? Math.round(width) : null,
      height: Number.isFinite(height) && height > 0 ? Math.round(height) : null,
      uploaded_by: user.email ?? "ops",
    })
    .select("id")
    .maybeSingle();

  if (assetInsert.error) {
    await deletePhotoObject(key);
    throw assetInsert.error;
  }

  const updated = await updateDesignerTemplate(id, { snapshot_key: key });
  if (!updated) {
    await deletePhotoObject(key);
    return fail("Không tìm thấy mẫu thiết kế.", 404);
  }

  await recordAuditLog({
    adminEmail: user.email ?? "ops",
    action: "template.cover",
    targetType: "designer_template",
    targetId: id,
    reason: `Cập nhật ảnh bìa cho mẫu "${template.name}"`,
  });

  return json({ url: buildMediaUrl(key), key }, 201);
});
