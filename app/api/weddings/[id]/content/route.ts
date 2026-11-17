import { getTemplateLockedMessage, isTemplateAllowedForPlan } from "@/config/plans";
import { authRoute, fail, json, readBody } from "@/lib/server/http";
import { toWedding, type WeddingRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";
import { normalizeWeddingContent } from "@/lib/wedding-data";
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
  const previousContent = normalizeWeddingContent(wedding.content);
  const previous = previousContent.couple;
  const next = content.couple;
  const groomChanged =
    previous.groomName.trim() !== next.groomName.trim() ||
    previous.groomFullName.trim() !== next.groomFullName.trim();
  const brideChanged =
    previous.brideName.trim() !== next.brideName.trim() ||
    previous.brideFullName.trim() !== next.brideFullName.trim();

  const lockSupported =
    typeof (wedding as WeddingRow & { groom_name_changes?: unknown })
      .groom_name_changes === "number";
  let groomNameChanges = 0;
  let brideNameChanges = 0;
  if (lockSupported && (groomChanged || brideChanged)) {
    const client = db();
    const { count: guestCount, error: guestCountError } = await client
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("wedding_id", wedding.id);
    if (guestCountError) throw guestCountError;
    if ((guestCount ?? 0) >= 3) {
      const current = wedding as WeddingRow & {
        groom_name_changes?: number | null;
        bride_name_changes?: number | null;
      };
      groomNameChanges = current.groom_name_changes ?? 0;
      brideNameChanges = current.bride_name_changes ?? 0;
      if (groomChanged && groomNameChanges >= 1) {
        return fail(
          "Tên chú rể chỉ được thay đổi 1 lần sau khi đã có 3 link khách. Vui lòng liên hệ hỗ trợ.",
          409,
        );
      }
      if (brideChanged && brideNameChanges >= 1) {
        return fail(
          "Tên cô dâu chỉ được thay đổi 1 lần sau khi đã có 3 link khách. Vui lòng liên hệ hỗ trợ.",
          409,
        );
      }
    }
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (lockSupported && (groomChanged || brideChanged)) {
    patch.groom_name_changes =
      groomNameChanges + (groomChanged ? 1 : 0);
    patch.bride_name_changes =
      brideNameChanges + (brideChanged ? 1 : 0);
    patch.names_locked_at = new Date().toISOString();
  }

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

