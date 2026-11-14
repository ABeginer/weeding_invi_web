import { getTemplateLockedMessage, isTemplateAllowedForPlan } from "@/config/plans";
import { authRoute, fail, json, readBody, text } from "@/lib/server/http";
import { getWeddingDesignerTemplateInfo } from "@/lib/server/designer";
import { toWedding, type WeddingRow } from "@/lib/server/mappers";
import { deletePhotoObject } from "@/lib/server/storage";
import { db } from "@/lib/server/supabase";
import {
  getOwnedWedding,
  listWeddingEvents,
  listWeddingPhotos,
} from "@/lib/server/weddings";
import { weddingContentInputSchema } from "@/lib/wedding-types";
import { getTemplateMeta } from "@/templates/registry";

type Ctx = { params: Promise<{ id: string }> };

const TEMPLATE_ID_RE = /^[a-z0-9-]{2,40}$/;

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const [events, photos, designerTemplate] = await Promise.all([
    listWeddingEvents(wedding.id),
    listWeddingPhotos(wedding.id),
    getWeddingDesignerTemplateInfo(wedding),
  ]);

  return json({
    ...toWedding(wedding),
    events,
    photos,
    designerTemplate,
  });
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
    const meta = getTemplateMeta(templateId);
    if (!meta || meta.isPlaceholder) {
      return fail("Mẫu thiệp này chưa sẵn sàng hoặc không tồn tại.");
    }
    if (!isTemplateAllowedForPlan(wedding.plan, meta.plan)) {
      return fail(getTemplateLockedMessage(wedding.plan, meta.plan), 403);
    }
    patch.template_id = meta.id;
  }

  if (body.content !== undefined) {
    const parsed = weddingContentInputSchema.safeParse(body.content);
    if (!parsed.success) {
      return fail(
        parsed.error.issues[0]?.message ?? "Nội dung thiệp không hợp lệ.",
      );
    }
    patch.content = parsed.data;
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

  const client = db();
  const { data: photoRows } = await client
    .from("photos")
    .select("storage_key")
    .eq("wedding_id", wedding.id);

  if (photoRows && photoRows.length > 0) {
    await Promise.allSettled(
      photoRows.map((row) => deletePhotoObject(String(row.storage_key))),
    );
  }

  const { error } = await client
    .from("weddings")
    .delete()
    .eq("id", wedding.id)
    .eq("owner_id", user.id);

  if (error) throw error;
  return json({ ok: true });
});
