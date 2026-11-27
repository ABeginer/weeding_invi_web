import { authRoute, json } from "@/lib/server/http";
import { listPublishedDesignerTemplateOptions } from "@/lib/server/designer";

/** Danh sách mẫu designer đã publish cho chủ thiệp chọn trong dashboard. */
export const GET = authRoute(async () => {
  const items = await listPublishedDesignerTemplateOptions();
  return json({ items });
});
