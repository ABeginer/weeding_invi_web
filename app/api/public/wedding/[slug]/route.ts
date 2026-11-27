import { fail, json, route } from "@/lib/server/http";
import { getPublicWeddingBySlug } from "@/lib/server/public-wedding";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";

type Ctx = { params: Promise<{ slug: string }> };

export const GET = route(async (req: Request, { params }: Ctx) => {
  const limited = rateLimit(req, "public-wedding", 120, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const { slug } = await params;
  const wedding = await getPublicWeddingBySlug(slug);
  if (!wedding) {
    return fail("Không tìm thấy thiệp cưới.", 404);
  }
  if (wedding.plan === "free") {
    return fail("Link công khai chỉ khả dụng từ gói Standard trở lên.", 403);
  }

  return json(wedding, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
});

