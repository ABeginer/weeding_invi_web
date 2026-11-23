import { db } from "@/lib/server/supabase";
import { fail, json, route, SLUG_RE } from "@/lib/server/http";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { isLikelyCrawler, trackGuestView } from "@/lib/server/invite-limits";

export const POST = route(
  async (req: Request, { params }: { params: Promise<{ slug: string }> }) => {
    const limited = rateLimit(req, "invite-view", 60, 60_000);
    if (!limited.ok) return tooManyRequests(limited);

    const userAgent = req.headers.get("user-agent");
    if (isLikelyCrawler(userAgent)) {
      return json({ ok: true, ignored: true });
    }

    const { slug } = await params;
    if (!SLUG_RE.test(slug)) return fail("Link không hợp lệ.", 404);

    const client = db();
    const guestRes = await client
      .from("guests")
      .select("id, wedding_id")
      .eq("slug", slug)
      .maybeSingle();

    if (!guestRes.data?.id) {
      return fail("Khách mời không tồn tại.", 404);
    }

    // Chỉ đếm cho tiệc thuộc gói free
    const weddingRes = await client
      .from("weddings")
      .select("plan")
      .eq("id", guestRes.data.wedding_id)
      .maybeSingle();

    if (weddingRes.data?.plan && weddingRes.data.plan !== "free") {
      return json({ ok: true, skipped: true });
    }

    const viewCount = await trackGuestView(guestRes.data.id);
    return json({ ok: true, viewCount });
  },
);
