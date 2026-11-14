import { db } from "@/lib/server/supabase";
import { fail, json, readBody, route, SLUG_RE, text } from "@/lib/server/http";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { verifyTurnstileToken } from "@/lib/server/turnstile";
import { isWeddingSuspended } from "@/lib/server/weddings";
import { validateWeddingSlug } from "@/lib/wedding-slug";

export const POST = route(async (req: Request) => {
  const limited = rateLimit(req, "wishes", 10, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const body = await readBody(req);

  if (typeof body?.website === "string" && body.website.trim() !== "") {
    return json({ ok: true });
  }

  const captcha = await verifyTurnstileToken(req, body?.turnstileToken);
  if (!captcha.ok) {
    return fail(
      captcha.error ?? "Xác thực chống spam không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
      400,
    );
  }

  const message = text(body?.message, 500);
  if (!message) return fail("Vui lòng nhập lời chúc (tối đa 500 ký tự).");

  const client = db();
  let guestId: string | null = null;
  let weddingId: string | null = null;
  let name = text(body?.name, 100);

  const slug = typeof body?.slug === "string" && body.slug.trim() !== "" ? body.slug.trim() : null;
  if (slug) {
    if (!SLUG_RE.test(slug)) return fail("Link không hợp lệ.", 404);
    const { data, error } = await client
      .from("guests")
      .select("id, name, wedding_id")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return fail("Link không hợp lệ.", 404);
    if (await isWeddingSuspended(data.wedding_id)) {
      return fail("Thiệp cưới này đang tạm khoá.", 403);
    }
    guestId = data.id;
    weddingId = data.wedding_id;
    name = data.name;
  } else {
    const weddingSlugCheck = validateWeddingSlug(body?.weddingSlug);
    if (!weddingSlugCheck.valid) {
      return fail("Không xác định được thiệp cưới.", 400);
    }
    const { data: weddingRow, error: weddingError } = await client
      .from("weddings")
      .select("id")
      .eq("slug", weddingSlugCheck.slug)
      .maybeSingle();
    if (weddingError) throw weddingError;
    if (!weddingRow) return fail("Không tìm thấy thiệp cưới.", 404);
    if (await isWeddingSuspended(weddingRow.id)) {
      return fail("Thiệp cưới này đang tạm khoá.", 403);
    }
    weddingId = weddingRow.id;
  }

  if (!name) return fail("Vui lòng nhập tên của bạn.");

  const { error } = await client
    .from("wishes")
    .insert({ wedding_id: weddingId, guest_id: guestId, name, message });
  if (error) throw error;

  return json({ ok: true }, 201);
});
