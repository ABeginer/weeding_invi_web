import { getTemplateLockedMessage, isTemplateAllowedForPlan } from "@/config/plans";
import { generateLedToken } from "@/lib/led-token";
import { authRoute, fail, json, readBody, text } from "@/lib/server/http";
import { getWeddingDesignerTemplateInfo, getPinnedDesignerTemplate } from "@/lib/server/designer";
import { toWedding, type WeddingRow } from "@/lib/server/mappers";
import { deletePhotoObject } from "@/lib/server/storage";
import { collectMediaUrlsFromContent, safeRemoveStorageObjects } from "@/lib/server/storage-cleanup";
import { db } from "@/lib/server/supabase";
import {
  getOwnedWedding,
  listWeddingEvents,
  listWeddingPhotos,
} from "@/lib/server/weddings";
import { normalizeWeddingContent } from "@/lib/wedding-data";
import { getTemplateMeta } from "@/templates/registry";

type Ctx = { params: Promise<{ id: string }> };

const TEMPLATE_ID_RE = /^[a-z0-9-]{2,40}$/;

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const [events, photos, designerTemplate, ledToken] = await Promise.all([
    listWeddingEvents(wedding.id),
    listWeddingPhotos(wedding.id),
    getWeddingDesignerTemplateInfo(wedding),
    generateLedToken(wedding.slug),
  ]);
  const designer = await getPinnedDesignerTemplate({
    designerTemplateId: wedding.designer_template_id,
    designerTemplateVersion: wedding.designer_template_version,
  });

  return json({
    ...toWedding(wedding),
    events,
    photos,
    designerTemplate,
    designerCanvas: designer?.canvas ?? null,
    ledToken,
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
    return fail(
      "Vui lòng cập nhật nội dung thiệp qua endpoint /api/weddings/[id]/content.",
      400,
    );
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

  const ledToken = await generateLedToken((data as WeddingRow).slug);
  return json({
    ...toWedding(data as WeddingRow),
    ledToken,
  });
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

  // Dọn cả file nhạc MP3 / media riêng lưu trong content (nếu có)
  const mediaKeys = collectMediaUrlsFromContent(normalizeWeddingContent(wedding.content));
  if (mediaKeys.size > 0) {
    await safeRemoveStorageObjects(Array.from(mediaKeys)).catch(() => undefined);
  }

  const { error } = await client
    .from("weddings")
    .delete()
    .eq("id", wedding.id)
    .eq("owner_id", user.id);

  if (error) throw error;
  return json({ ok: true });
});
