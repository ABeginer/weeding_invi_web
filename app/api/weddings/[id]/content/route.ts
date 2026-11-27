import { getTemplateLockedMessage, isTemplateAllowedForPlan } from "@/config/plans";
import { authRoute, fail, json, readBody } from "@/lib/server/http";
import { toWedding, type WeddingRow } from "@/lib/server/mappers";
import {
  diffOrphanedStorageKeys,
  safeRemoveStorageObjects,
} from "@/lib/server/storage-cleanup";
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
  let shouldLockNameChange = false;
  if (lockSupported && (groomChanged || brideChanged)) {
    const current = wedding as WeddingRow & {
      groom_name_changes?: number | null;
      bride_name_changes?: number | null;
      names_locked_at?: string | null;
    };
    groomNameChanges = current.groom_name_changes ?? 0;
    brideNameChanges = current.bride_name_changes ?? 0;
    const alreadyLocked =
      Boolean(current.names_locked_at) || groomNameChanges > 0 || brideNameChanges > 0;

    let guestCount = 0;
    if (!alreadyLocked) {
      const client = db();
      const { count, error: guestCountError } = await client
        .from("guests")
        .select("id", { count: "exact", head: true })
        .eq("wedding_id", wedding.id);
      if (guestCountError) throw guestCountError;
      guestCount = count ?? 0;
    }

    if (alreadyLocked || guestCount >= 3) {
      shouldLockNameChange = true;
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
  if (shouldLockNameChange) {
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

  // Kiểm tra quyền gói cước cho các trường nâng cao (chống vượt Plan-Gate qua API trực tiếp)
  if (wedding.plan === "free") {
    const musicUrlChanged =
      Boolean(content.musicUrl) && content.musicUrl !== previousContent.musicUrl;
    if (content.musicPreset === "custom" || musicUrlChanged) {
      return fail("Tải hoặc gắn nhạc nền tùy chỉnh chỉ dành cho gói Pro và VIP.", 403);
    }
  }

  if (wedding.plan !== "vip") {
    if (content.photoApprovalMode === "auto" || content.sharePinEnabled === true) {
      return fail("Tính năng Live Photo Wall & Cổng trợ lý mã PIN chỉ dành cho gói VIP.", 403);
    }
  }

  // Bảo toàn các trường do server quản lý (suspended fallback, photoModeration, sharePin cooldown)
  const rawPrevContent =
    wedding.content && typeof wedding.content === "object"
      ? (wedding.content as Record<string, unknown>)
      : {};
  const mergedContent: Record<string, unknown> = {
    ...content,
  };
  delete mergedContent.photoModeration;
  delete mergedContent.suspended;
  delete mergedContent.sharePinFailCount;
  delete mergedContent.sharePinLockedUntil;

  if (previousContent.photoModeration) {
    mergedContent.photoModeration = previousContent.photoModeration;
  }
  if (typeof rawPrevContent.suspended === "boolean") {
    mergedContent.suspended = rawPrevContent.suspended;
  }
  if (typeof rawPrevContent.sharePinFailCount === "number") {
    mergedContent.sharePinFailCount = rawPrevContent.sharePinFailCount;
  }
  if (typeof rawPrevContent.sharePinLockedUntil === "string") {
    mergedContent.sharePinLockedUntil = rawPrevContent.sharePinLockedUntil;
  }

  patch.content = mergedContent;

  const { data, error } = await client
    .from("weddings")
    .update(patch)
    .eq("id", wedding.id)
    .eq("owner_id", user.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return fail("Không tìm thấy thiệp cưới.", 404);

  // Storage Hygiene: Tự động dọn dẹp các ảnh bị xóa/thay thế
  const orphanedKeys = diffOrphanedStorageKeys(previousContent, content, wedding.id);
  if (orphanedKeys.length > 0) {
    void safeRemoveStorageObjects(orphanedKeys).catch((cleanupErr) => {
      console.warn("[Storage Hygiene] Lỗi dọn dẹp ảnh mồ côi:", cleanupErr);
    });
  }

  return json(toWedding(data as WeddingRow));
});

