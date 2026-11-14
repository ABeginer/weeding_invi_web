import { fail, json, readBody, text } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import {
  createDesignerTemplate,
  listDesignerTemplates,
  type DesignerPlan,
} from "@/lib/server/designer";

const PLANS: DesignerPlan[] = ["free", "pro", "vip"];

export const GET = opsRoute(async (req: Request) => {
  const url = new URL(req.url);
  const templates = await listDesignerTemplates(url.searchParams.get("q") ?? undefined);
  return json({ items: templates });
});

export const POST = opsRoute(async (req: Request, user) => {
  const body = await readBody(req);
  const name = text(body?.name, 80);
  if (!name || name.length < 2) {
    return fail("Tên mẫu cần từ 2 đến 80 ký tự.");
  }

  const plan = body?.plan as DesignerPlan | undefined;
  if (!plan || !PLANS.includes(plan)) {
    return fail("Gói không hợp lệ.");
  }

  const ritual = text(body?.ritual, 40) || null;
  const created = await createDesignerTemplate(
    { name, plan, ritual },
    user.email ?? "ops",
  );

  return json(created, 201);
});
