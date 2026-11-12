import { getTemplateLockedMessage, isTemplateAllowedForPlan } from "@/config/plans";
import { authRoute, fail, json, readBody } from "@/lib/server/http";
import { toWedding, type WeddingRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";
import { weddingContentPatchSchema } from "@/lib/wedding-types";
import { getTemplateMeta } from "@/templates/registry";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);
  if (!body) return fail("Dữ liệu cập nhật không hợp lệ.");

  const parsed = weddingContentPatchSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return json(
      {
        error: issue?.message ?? "Nội dung thiệp không hợp lệ.",
        field: issue?.path?.join(".") || undefined,
      },
      400,
    );
  }

  const { templateId, content } = parsed.data;
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (templateId !== undefined) {
    const meta = getTemplateMeta(templateId);
    if (!meta || meta.isPlaceholder) {
      return fail("Mẫu thiệp không tồn tại hoặc chưa mở sử dụng.");
    }
    if (!isTemplateAllowedForPlan(wedding.plan, meta.plan)) {
      return fail(getTemplateLockedMessage(wedding.plan, meta.plan), 403);
    }
    patch.template_id = meta.id;
  }

  // Kiểm tra các photoId đính kèm thực sự thuộc về thiệp hiện tại
  const referencedIds = [
    content.heroPhotoId,
    content.groomPhotoId,
    content.bridePhotoId,
  ].filter((val): val is string => Boolean(val));

  const client = db();
  if (referencedIds.length > 0) {
    const { data: ownedPhotos, error: photoError } = await client
      .from("photos")
      .select("id")
      .eq("wedding_id", wedding.id)
      .in("id", referencedIds);

    if (photoError) throw photoError;
    const validIds = new Set((ownedPhotos ?? []).map((p) => String(p.id)));
    if (referencedIds.some((photoId) => !validIds.has(photoId))) {
      return fail("Ảnh được chọn không tồn tại trong thiệp này.", 400);
    }
  }

  patch.content = content;

  const { data, error } = await client
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

