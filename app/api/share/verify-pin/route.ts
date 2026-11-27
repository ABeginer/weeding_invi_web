import { NextResponse } from "next/server";
import { createShareCookieValue } from "@/lib/share-pin";
import { db } from "@/lib/server/supabase";
import { fail, readBody, route } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { safeEqual } from "@/lib/server/payments";
import { verifyTurnstileToken } from "@/lib/server/turnstile";
import { isWeddingSuspendedRow } from "@/lib/server/weddings";
import { normalizeWeddingContent } from "@/lib/wedding-data";
import { validateWeddingSlug } from "@/lib/wedding-slug";

const MAX_FAILED_PIN_ATTEMPTS = 5;
const PIN_COOLDOWN_MS = 15 * 60 * 1000; // Khóa 15 phút sau 5 lần nhập sai liên tiếp

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

  // Giới hạn tần suất TRƯỚC khi gọi Turnstile: tối đa 5 lần trong 15 phút trên mỗi IP + thiệp
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

  const captcha = await verifyTurnstileToken(req, body.turnstileToken);
  if (!captcha.ok) {
    return fail(
      captcha.error ?? "Xác thực chống spam không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
      400,
    );
  }

  const client = db();
  const { data: wedding, error } = await client
    .from("weddings")
    .select("id, slug, plan, content, suspended")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!wedding || isWeddingSuspendedRow(wedding)) {
    return fail("Không tìm thấy thiệp cưới.", 404);
  }

  if (wedding.plan !== "vip") {
    return fail("Tính năng chỉ dành cho gói Pro.", 403);
  }

  const rawPrevContent =
    wedding.content && typeof wedding.content === "object"
      ? (wedding.content as Record<string, unknown>)
      : {};
  const content = normalizeWeddingContent(wedding.content);

  if (!content.sharePinEnabled || !content.sharePin) {
    return fail("Tính năng truy cập bằng mã PIN chưa được kích hoạt cho thiệp này.", 403);
  }

  // Kiểm tra cooldown lưu bền vững trong DB (chống dò mã PIN qua nhiều IP / Worker isolate)
  const lockedUntilMs =
    typeof rawPrevContent.sharePinLockedUntil === "string"
      ? Date.parse(rawPrevContent.sharePinLockedUntil)
      : NaN;
  const nowMs = Date.now();
  if (Number.isFinite(lockedUntilMs) && lockedUntilMs > nowMs) {
    const retryAfterSec = Math.max(1, Math.ceil((lockedUntilMs - nowMs) / 1000));
    const mins = Math.ceil(retryAfterSec / 60);
    return new Response(
      JSON.stringify({
        error: `Cổng mã PIN đang tạm khóa để chống dò mã. Vui lòng thử lại sau khoảng ${mins} phút.`,
        code: "PIN_COOLDOWN",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfterSec),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  if (!safeEqual(content.sharePin, pin)) {
    const prevFails =
      typeof rawPrevContent.sharePinFailCount === "number" &&
      Number.isFinite(rawPrevContent.sharePinFailCount)
        ? rawPrevContent.sharePinFailCount
        : 0;
    const nextFails = prevFails + 1;
    const shouldLock = nextFails >= MAX_FAILED_PIN_ATTEMPTS;
    const nextLockedUntil = shouldLock
      ? new Date(nowMs + PIN_COOLDOWN_MS).toISOString()
      : undefined;

    const updatedRaw: Record<string, unknown> = {
      ...rawPrevContent,
      sharePinFailCount: shouldLock ? 0 : nextFails,
    };
    if (nextLockedUntil) {
      updatedRaw.sharePinLockedUntil = nextLockedUntil;
    } else {
      delete updatedRaw.sharePinLockedUntil;
    }

    await client
      .from("weddings")
      .update({ content: updatedRaw, updated_at: new Date().toISOString() })
      .eq("id", wedding.id);

    if (shouldLock) {
      return new Response(
        JSON.stringify({
          error: "Bạn đã nhập sai mã PIN 5 lần liên tiếp. Cổng mã PIN tạm khóa trong 15 phút.",
          code: "PIN_COOLDOWN",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(PIN_COOLDOWN_MS / 1000)),
            "Cache-Control": "no-store",
          },
        },
      );
    }

    const remaining = MAX_FAILED_PIN_ATTEMPTS - nextFails;
    return fail(`Mã PIN không chính xác (còn ${remaining} lần thử trước khi tạm khóa 15 phút).`, 401);
  }

  // Đăng nhập đúng PIN → xóa trạng thái đếm sai & cooldown nếu có
  if (rawPrevContent.sharePinFailCount || rawPrevContent.sharePinLockedUntil) {
    const cleanedRaw: Record<string, unknown> = { ...rawPrevContent };
    delete cleanedRaw.sharePinFailCount;
    delete cleanedRaw.sharePinLockedUntil;
    await client
      .from("weddings")
      .update({ content: cleanedRaw, updated_at: new Date().toISOString() })
      .eq("id", wedding.id);
  }

  const token = await createShareCookieValue(slug, content.sharePin);

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
