import { fail, json, route } from "@/lib/server/http";
import { getPublicWeddingBySlug } from "@/lib/server/public-wedding";

type Ctx = { params: Promise<{ slug: string }> };

export const GET = route(async (_req: Request, { params }: Ctx) => {
  const { slug } = await params;
  const wedding = await getPublicWeddingBySlug(slug);
  if (!wedding) {
    return fail("Không tìm thấy thiệp cưới.", 404);
  }

  return json(wedding, 200, {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  });
});

