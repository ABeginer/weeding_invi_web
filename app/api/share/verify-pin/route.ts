import { NextResponse } from "next/server";
import { createShareCookieValue } from "@/lib/share-pin";
import { db } from "@/lib/server/supabase";
import { fail, json, readBody, route } from "@/lib/server/http";
import { normalizeWeddingContent } from "@/lib/wedding-data";
import { validateWeddingSlug } from "@/lib/wedding-slug";

export const POST = route(async (req: Request) => {
  const body = await readBody(req);
  if (!body) return fail("Dữ liệu không hợp lệ.");

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const pin = typeof body.pin === "string" ? body.pin.trim() : "";

  const slugCheck = validateWeddingSlug(slug);
  if (!slugCheck.valid) {
    return fail("Đường dẫn thiệp cưới không hợp lệ.", 400);
  }

  if (!/^\d{4}$/.test(pin)) {
    return fail("Mã PIN phải gồm đúng 4 chữ số.", 400);
  }

  const client = db();
  const { data: wedding, error } = await client
    .from("weddings")
    .select("id, slug, content")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!wedding) {
    return fail("Không tìm thấy thiệp cưới.", 404);
  }

  const content = normalizeWeddingContent(wedding.content);

  if (!content.sharePinEnabled || !content.sharePin) {
    return fail("Tính năng truy cập bằng mã PIN chưa được kích hoạt cho thiệp này.", 403);
  }

  if (content.sharePin !== pin) {
    return fail("Mã PIN không chính xác. Vui lòng thử lại.", 401);
  }

  const token = await createShareCookieValue(slug);

  const response = NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
      },
    },
  );

  response.cookies.set({
    name: `inviwedd_share_${slug}`,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 ngày
  });

  return response;
});
