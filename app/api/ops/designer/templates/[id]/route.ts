import { fail, json, readBody, UUID_RE } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { getDesignerTemplate, updateDesignerTemplate } from "@/lib/server/designer";

type Ctx = { params: Promise<{ id: string }> };

export const GET = opsRoute<Ctx>(async (_req, _admin, { params }) => {
  const { id } = await params;
  if (!UUID_RE.test(id)) return fail("Không tìm thấy mẫu.", 404);
  const template = await getDesignerTemplate(id);
  if (!template) return fail("Không tìm thấy mẫu.", 404);
  return json(template);
});

export const PATCH = opsRoute<Ctx>(async (req, _admin, { params }) => {
  const { id } = await params;
  if (!UUID_RE.test(id)) return fail("Không tìm thấy mẫu.", 404);

  const body = await readBody(req);
  const patch: {
    canvas_json?: Record<string, unknown>;
    background_key?: string | null;
    name?: string;
    status?: "draft" | "review" | "published" | "archived";
  } = {};

  if (body?.canvas_json && typeof body.canvas_json === "object") {
    patch.canvas_json = body.canvas_json as Record<string, unknown>;
  }
  if (body?.background_key === null || typeof body?.background_key === "string") {
    patch.background_key = body.background_key;
  }
  if (typeof body?.name === "string" && body.name.trim().length >= 2) {
    patch.name = body.name.trim().slice(0, 80);
  }
  if (
    body?.status === "draft" ||
    body?.status === "review" ||
    body?.status === "published" ||
    body?.status === "archived"
  ) {
    patch.status = body.status;
  }

  if (Object.keys(patch).length === 0) {
    return fail("Không có thay đổi nào để lưu.");
  }

  const updated = await updateDesignerTemplate(id, patch);
  if (!updated) return fail("Không tìm thấy mẫu.", 404);
  return json(updated);
});
