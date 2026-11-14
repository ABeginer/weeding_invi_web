import { fail, json } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { db } from "@/lib/server/supabase";
import { getDesignerTemplate, updateDesignerTemplate } from "@/lib/server/designer";

type Ctx = { params: Promise<{ id: string }> };

/** Publish: chụp layout hiện tại thành một version bất biến, rồi đánh dấu published. */
export const POST = opsRoute<Ctx>(async (_req, _admin, { params }) => {
  const { id } = await params;
  const template = await getDesignerTemplate(id);
  if (!template) return fail("Không tìm thấy mẫu.", 404);

  const elements = (template.canvas_json as { elements?: unknown[] }).elements;
  if (!Array.isArray(elements) || elements.length === 0) {
    return fail("Canvas chưa có phần tử nào để xuất bản.");
  }

  const nextVersion = template.version + 1;
  const { error: versionError } = await db()
    .from("designer_template_versions")
    .insert({
      template_id: template.id,
      version: nextVersion,
      canvas_json: template.canvas_json,
      background_key: template.background_key,
      snapshot_key: template.snapshot_key,
    });
  if (versionError) throw versionError;

  const updated = await updateDesignerTemplate(template.id, {
    status: "published",
    version: nextVersion,
  });

  return json({ ok: true, version: updated?.version ?? nextVersion });
});
