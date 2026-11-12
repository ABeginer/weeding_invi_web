import { db } from "@/lib/server/supabase";
import { adminRoute, json } from "@/lib/server/http";

export const GET = adminRoute(async () => {
  const client = db();
  const [guests, wishes] = await Promise.all([
    client.from("guests").select("status"),
    client.from("wishes").select("id", { count: "exact", head: true }),
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
