import { db } from "@/lib/server/supabase";
import { fail, json, route, SLUG_RE } from "@/lib/server/http";

export const GET = route(
  async (_req: Request, { params }: { params: Promise<{ slug: string }> }) => {
    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return fail("Link không hợp lệ.", 404);

    const { data, error } = await db()
      .from("guests")
      .select("name, status")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return fail("Link không hợp lệ.", 404);
    return json({ name: data.name, status: data.status });
  },
);
