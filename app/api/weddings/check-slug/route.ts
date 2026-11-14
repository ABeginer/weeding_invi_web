import { json, route } from "@/lib/server/http";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { db } from "@/lib/server/supabase";
import { validateWeddingSlug } from "@/lib/wedding-slug";

export const GET = route(async (req: Request) => {
  const limited = rateLimit(req, "check-slug", 30, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const { searchParams } = new URL(req.url);
  const rawSlug = searchParams.get("slug") ?? "";
  const slugCheck = validateWeddingSlug(rawSlug);

  if (!slugCheck.valid) {
    return json({
      valid: false,
      available: false,
      error: slugCheck.error,
    });
  }

  const { count, error } = await db()
    .from("weddings")
    .select("id", { count: "exact", head: true })
    .eq("slug", slugCheck.slug);

  if (error) throw error;

  const available = (count ?? 0) === 0;
  return json({
    valid: true,
    available,
    ...(available
      ? {}
      : { error: "Đường dẫn thiệp này đã được sử dụng, vui lòng chọn tên khác." }),
  });
});

