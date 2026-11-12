import { authRoute, fail, json, readBody, text } from "@/lib/server/http";
import { toGuest, type GuestRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";
import { FREE_PLAN_MAX_GUESTS } from "@/lib/wedding-slug";

type Ctx = { params: Promise<{ id: string }> };

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const { data, error } = await db()
    .from("guests")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) throw error;
  return json(((data ?? []) as GuestRow[]).map(toGuest));
});

export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);
  const name = text(body?.name, 100);
  if (!name) return fail("Vui lòng nhập tên khách mời (tối đa 100 ký tự).");

  const client = db();
  const { count, error: countError } = await client
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", wedding.id);

  if (countError) throw countError;
  const currentCount = count ?? 0;

  if (wedding.plan === "free" && currentCount >= FREE_PLAN_MAX_GUESTS) {
    return fail(
      `Gói miễn phí chỉ được tối đa ${FREE_PLAN_MAX_GUESTS} khách mời. Vui lòng xóa bớt khách hoặc nâng cấp gói.`,
      400,
    );
  }

  const { data, error } = await client
    .from("guests")
    .insert({ wedding_id: wedding.id, name })
    .select("*")
    .single();

  if (error) throw error;
  return json(toGuest(data as GuestRow), 201);
});

