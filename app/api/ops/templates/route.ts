import { json } from "@/lib/server/http";
import { listProductionDesignerTemplates } from "@/lib/server/designer";
import { opsDesignerRoute } from "@/lib/server/ops";

/** Gallery các mẫu designer đã publish (đang chạy production) cho admin + designer. */
export const GET = opsDesignerRoute(async () => {
  const result = await listProductionDesignerTemplates();
  return json(result);
});
