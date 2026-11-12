import { authRoute, fail, json } from "@/lib/server/http";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string }> };

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const client = db();
  const [guests, wishes] = await Promise.all([
    client.from("guests").select("status").eq("wedding_id", wedding.id),
    client.from("wishes").select("id", { count: "exact", head: true }).eq("wedding_id", wedding.id),
  ]);

  if (guests.error) throw guests.error;
  if (wishes.error) throw wishes.error;

  const rows = guests.data ?? [];
  const count = (status: string) => rows.filter((row) => row.status === status).length;

  return json({
    total: rows.length,
    accepted: count("accepted"),
    declined: count("declined"),
    pending: count("pending"),
    wishes: wishes.count ?? 0,
  });
});

