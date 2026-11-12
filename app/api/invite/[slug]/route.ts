import { db } from "@/lib/server/supabase";
import { fail, json, route, SLUG_RE } from "@/lib/server/http";
import { getGuestVisibleEvents } from "@/lib/server/weddings";

export const GET = route(
  async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return fail("Link không hợp lệ.", 404);

    const { data, error } = await db()
      .from("guests")
      .select("id, wedding_id, name, status")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return fail("Link không hợp lệ.", 404);

    const events = await getGuestVisibleEvents(data.wedding_id, data.id);
    return json({ name: data.name, status: data.status, events });
  },
);
