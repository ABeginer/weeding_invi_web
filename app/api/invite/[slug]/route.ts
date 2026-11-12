import { db } from "@/lib/server/supabase";
import { fail, json, route, SLUG_RE } from "@/lib/server/http";
import { getGuestVisibleEvents } from "@/lib/server/weddings";

function isMissingV4GuestColumns(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  return (
    code === "42703" ||
    code === "PGRST204" ||
    /\b(plus_ones|diet)\b/i.test(message)
  );
}

export const GET = route(
  async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return fail("Link không hợp lệ.", 404);

    const client = db();
    const { data, error } = await client
      .from("guests")
      .select("id, wedding_id, name, status, plus_ones, diet")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      if (!isMissingV4GuestColumns(error)) throw error;
      const fallback = await client
        .from("guests")
        .select("id, wedding_id, name, status")
        .eq("slug", slug)
        .maybeSingle();

      if (fallback.error) throw fallback.error;
      if (!fallback.data) return fail("Link không hợp lệ.", 404);

      const events = await getGuestVisibleEvents(
        fallback.data.wedding_id,
        fallback.data.id,
      );
      return json({
        name: fallback.data.name,
        status: fallback.data.status,
        plusOnes: 0,
        diet: null,
        events,
      });
    }

    if (!data) return fail("Link không hợp lệ.", 404);

    const events = await getGuestVisibleEvents(data.wedding_id, data.id);
    return json({
      name: data.name,
      status: data.status,
      plusOnes: typeof data.plus_ones === "number" ? data.plus_ones : 0,
      diet: data.diet === "meat" || data.diet === "veg" ? data.diet : null,
      events,
    });
  },
);
