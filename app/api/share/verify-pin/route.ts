import { NextResponse } from "next/server";
import { createShareCookieValue } from "@/lib/share-pin";
import { db } from "@/lib/server/supabase";
import { fail, readBody, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { safeEqual } from "@/lib/server/payments";
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

  // Giới hạn tần suất: tối đa 5 lần nhập sai trong 15 phút trên mỗi IP + thiệp
  const limited = rateLimit(req, `verify-pin:${slug}`, 5, 900_000);
  if (!limited.ok) {
    return new Response(
      JSON.stringify({
        error: `Bạn đã nhập mã PIN sai quá nhiều lần. Vui lòng thử lại sau ${limited.retryAfterSec} giây.`,
        code: "RATE_LIMITED",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(limited.retryAfterSec),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const client = db();
  const { data: wedding, error } = await client
    .from("weddings")
    .select("id, slug, plan, content")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!wedding) {
    return fail("Không tìm thấy thiệp cưới.", 404);
  }

  if (wedding.plan !== "vip") {
    return fail("Tính năng chỉ dành cho gói VIP.", 403);
  }

  const content = normalizeWeddingContent(wedding.content);

  if (!content.sharePinEnabled || !content.sharePin) {
    return fail("Tính năng truy cập bằng mã PIN chưa được kích hoạt cho thiệp này.", 403);
  }

  if (!safeEqual(content.sharePin, pin)) {
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
