import { authRoute, fail, json, readBody, text } from "@/lib/server/http";
import { toWedding, type WeddingRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string }> };

const TEMPLATE_ID_RE = /^[a-z0-9-]{2,40}$/;

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  return json(toWedding(wedding));
});

export const PATCH = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);
  if (!body) return fail("Dữ liệu cập nhật không hợp lệ.");

  const patch: Record<string, unknown> = {};

  if (body.templateId !== undefined) {
    const templateId = text(body.templateId, 40);
    if (!templateId || !TEMPLATE_ID_RE.test(templateId)) {
      return fail("Mẫu thiệp không hợp lệ.");
    }
    patch.template_id = templateId;
  }

  if (body.content !== undefined) {
    if (
      !body.content ||
      typeof body.content !== "object" ||
      Array.isArray(body.content)
    ) {
      return fail("Nội dung thiệp phải là một đối tượng JSON hợp lệ.");
    }
    patch.content = body.content;
  }

  if (Object.keys(patch).length === 0) {
    return fail("Không có dữ liệu cần cập nhật.");
  }

  patch.updated_at = new Date().toISOString();

  const { data, error } = await db()
    .from("weddings")
    .update(patch)
    .eq("id", wedding.id)
    .eq("owner_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return fail("Không tìm thấy thiệp cưới.", 404);

  return json(toWedding(data as WeddingRow));
});

export const DELETE = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const { error } = await db()
    .from("weddings")
    .delete()
    .eq("id", wedding.id)
    .eq("owner_id", user.id);

  if (error) throw error;
  return json({ ok: true });
});

