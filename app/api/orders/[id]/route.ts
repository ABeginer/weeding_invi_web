import { getUser } from "@/lib/server/auth";
import { route, json } from "@/lib/server/http";
import { coded } from "@/lib/server/owner";
import { db } from "@/lib/server/supabase";
import { isUuid } from "@/lib/server/validate";

export const GET = route(async (req: Request, { params }: { params: Promise<{ id: string }> }) => {
  const user = await getUser(req);
  if (!user) return coded("Bạn cần đăng nhập.", "UNAUTHORIZED", 401);
  const { id } = await params;
  if (!isUuid(id)) return coded("Không tìm thấy đơn.", "NOT_FOUND", 404);

  const { data, error } = await db()
    .from("orders")
    .select("id, code, plan, status, paid_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return coded("Không tìm thấy đơn.", "NOT_FOUND", 404);

  return json({
    id: data.id,
    code: data.code,
    plan: data.plan,
    status: data.status,
    paidAt: data.paid_at,
  });
});
