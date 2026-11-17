import { listPublishedDesignerTemplateOptions } from "@/lib/server/designer";

export const dynamic = "force-dynamic";

/**
 * Catalog công khai cho trang chủ: chỉ mẫu designer đã publish, không lộ draft.
 * Cache ngắn ở edge để publish mới xuất hiện mà không đập DB mỗi lượt xem.
 */
export async function GET() {
  try {
    const items = await listPublishedDesignerTemplateOptions();
    return Response.json(
      { items },
      {
        headers: {
          "Cache-Control":
            "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return Response.json(
      { items: [] },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=30" },
      },
    );
  }
}
