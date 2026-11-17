import {
  getDesignerTemplate,
  isMissingDisplayTitleColumn,
  updateDesignerTemplate,
} from "@/lib/server/designer";
import { fail, json, readBody, UUID_RE } from "@/lib/server/http";
import { opsDesignerRoute, recordAuditLog } from "@/lib/server/ops";

type Ctx = { params: Promise<{ id: string }> };

const DISPLAY_TITLE_MAX = 80;
const MISSING_DISPLAY_TITLE_MESSAGE =
  "Cơ sở dữ liệu chưa có cột display_title. Hãy chạy migration_v16_ops_roles_template_meta.sql.";

/** Đổi tên thiết kế (name) và title khách hàng thấy (display_title). */
export const PATCH = opsDesignerRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  if (!UUID_RE.test(id)) return fail("Không tìm thấy mẫu thiết kế.", 404);

  const existing = await getDesignerTemplate(id);
  if (!existing) return fail("Không tìm thấy mẫu thiết kế.", 404);

  const body = await readBody(req);
  if (!body) return fail("Dữ liệu cập nhật không hợp lệ.");

  const patch: { name?: string; display_title?: string | null } = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 80) {
      return fail("Tên thiết kế cần từ 2 đến 80 ký tự.");
    }
    patch.name = name;
  }

  if ("displayTitle" in body) {
    const raw = body.displayTitle;
    if (raw === null || raw === "") {
      patch.display_title = null;
    } else if (typeof raw === "string") {
      const title = raw.trim();
      if (title.length < 2 || title.length > DISPLAY_TITLE_MAX) {
        return fail(
          `Title hiển thị cho khách cần từ 2 đến ${DISPLAY_TITLE_MAX} ký tự.`,
        );
      }
      patch.display_title = title;
    } else {
      return fail("Title hiển thị cho khách không hợp lệ.");
    }
  }

  if (Object.keys(patch).length === 0) {
    return fail("Không có thay đổi nào để lưu.");
  }

  let updated;
  try {
    updated = await updateDesignerTemplate(id, patch);
  } catch (error) {
    if (isMissingDisplayTitleColumn(error)) {
      return fail(MISSING_DISPLAY_TITLE_MESSAGE, 503);
    }
    throw error;
  }
  if (!updated) return fail("Không tìm thấy mẫu thiết kế.", 404);

  await recordAuditLog({
    adminEmail: user.email ?? "ops",
    action: "template.update",
    targetType: "designer_template",
    targetId: id,
    reason: `Cập nhật tên/title hiển thị cho mẫu "${updated.name}"`,
  });

  return json({
    ok: true,
    item: {
      id: updated.id,
      name: updated.name,
      displayTitle: updated.display_title ?? null,
    },
  });
});
