import { getTemplateLockedMessage, isTemplateAllowedForPlan } from "@/config/plans";
import { authRoute, fail, json, readBody, UUID_RE } from "@/lib/server/http";
import {
  getDesignerTemplate,
  getDesignerVersion,
  isMissingDesignerSchema,
} from "@/lib/server/designer";
import { toWedding, type WeddingRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";
import type { WeddingDesignerTemplateInfo } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

const MISSING_SCHEMA_MESSAGE =
  "Cơ sở dữ liệu chưa có bảng/cột designer. Hãy chạy migration_v14 và migration_v15.";

async function applyDesignerPatch(
  wedding: WeddingRow,
  ownerId: string,
  patch: Record<string, unknown>,
  designerTemplate: WeddingDesignerTemplateInfo | null,
): Promise<Response> {
  try {
    const { data, error } = await db()
      .from("weddings")
      .update(patch)
      .eq("id", wedding.id)
      .eq("owner_id", ownerId)
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!data) return fail("Không tìm thấy thiệp cưới.", 404);

    return json({
      wedding: toWedding(data as WeddingRow),
      designerTemplate,
    });
  } catch (error) {
    if (isMissingDesignerSchema(error)) {
      return fail(MISSING_SCHEMA_MESSAGE, 503);
    }
    throw error;
  }
}

/**
 * Gán / bỏ gán / nâng version cho mẫu designer của một thiệp.
 * - `designerTemplateId: null` → bỏ gán, quay lại template code.
 * - Không truyền `version` → ghim version mới nhất tại thời điểm gán.
 * - Truyền `version` → ghim đúng version đó (nút "Cập nhật lên vN").
 */
export const PATCH = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);
  if (!body) return fail("Dữ liệu cập nhật không hợp lệ.");
  if (!("designerTemplateId" in body)) {
    return fail("Thiếu mẫu thiết kế cần gán (designerTemplateId).");
  }

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  const raw = body.designerTemplateId;

  if (raw === null) {
    patch.designer_template_id = null;
    patch.designer_template_version = null;
    return applyDesignerPatch(wedding, user.id, patch, null);
  }

  if (typeof raw !== "string" || !UUID_RE.test(raw)) {
    return fail("Mẫu thiết kế không hợp lệ.");
  }

  let template;
  try {
    template = await getDesignerTemplate(raw);
  } catch (error) {
    if (isMissingDesignerSchema(error)) {
      return fail(MISSING_SCHEMA_MESSAGE, 503);
    }
    throw error;
  }

  if (!template) return fail("Không tìm thấy mẫu thiết kế.", 404);
  if (template.status !== "published") {
    return fail("Mẫu thiết kế chưa được xuất bản.", 409);
  }
  if (!isTemplateAllowedForPlan(wedding.plan, template.plan)) {
    return fail(getTemplateLockedMessage(wedding.plan, template.plan), 403);
  }

  let version = template.version;
  if (body.version !== undefined && body.version !== null) {
    const requested = body.version;
    if (
      typeof requested !== "number" ||
      !Number.isInteger(requested) ||
      requested < 1
    ) {
      return fail("Phiên bản mẫu không hợp lệ.");
    }
    const exists = await getDesignerVersion(template.id, requested);
    if (!exists) return fail("Phiên bản mẫu không tồn tại.", 404);
    version = requested;
  }

  patch.designer_template_id = template.id;
  patch.designer_template_version = version;

  return applyDesignerPatch(wedding, user.id, patch, {
    id: template.id,
    name: template.name,
    displayTitle: template.display_title ?? null,
    pinnedVersion: version,
    latestVersion: template.version,
    status: template.status,
  });
});
