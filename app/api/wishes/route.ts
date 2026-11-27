import { db } from "@/lib/server/supabase";
import { fail, json, readBody, route, SLUG_RE, text } from "@/lib/server/http";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { verifyTurnstileToken } from "@/lib/server/turnstile";
import { isWeddingSuspended } from "@/lib/server/weddings";
import { normalizeAuthorKey, saveWishOnce } from "@/lib/server/wishes";
import { validateWeddingSlug } from "@/lib/wedding-slug";

type WeddingWishSettings = {
  id: string;
  showWishesOnCard: boolean;
  autoApprove: boolean;
  wishesHidden: boolean;
};

async function loadWishSettings(weddingId: string): Promise<WeddingWishSettings | null> {
  const { data, error } = await db()
    .from("weddings")
    .select("id, content")
    .eq("id", weddingId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const content = (data.content ?? {}) as Record<string, unknown>;
  const hidden = Array.isArray(content.hiddenSections)
    ? (content.hiddenSections as unknown[]).filter((v): v is string => typeof v === "string")
    : [];
  // "Lời chúc" tắt (ẩn section Xác nhận) thì cũng không hiển thị lời chúc lên thiệp.
  const wishesHidden = hidden.includes("rsvp");
  return {
    id: data.id,
    showWishesOnCard: content.showWishesOnCard === true,
    autoApprove: content.wishApprovalMode === "auto",
    wishesHidden,
  };
}

export const POST = route(async (req: Request) => {
  const limited = rateLimit(req, "wishes", 10, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const body = await readBody(req);

  // Honeypot anti-spam check (website hoặc website_url)
  if (
    (typeof body?.website === "string" && body.website.trim() !== "") ||
    (typeof body?.website_url === "string" && body.website_url.trim() !== "")
  ) {
    return json({ ok: true, updated: false, approved: true });
  }

  // Timing check: Chặn spam submit dưới 1200ms từ lúc mở form
  const formLoadedAt = typeof body?.formLoadedAt === "number" ? body.formLoadedAt : null;
  if (formLoadedAt && Date.now() - formLoadedAt < 1200) {
    return json({ ok: true, updated: false, approved: true });
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
  let authorKey = normalizeAuthorKey(body?.authorKey);

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
    authorKey = `guest:${data.id}`;
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
  if (!weddingId) return fail("Không xác định được thiệp cưới.", 400);
  const resolvedWeddingId = weddingId;

  const settings = await loadWishSettings(resolvedWeddingId);
  const autoApprove = settings?.autoApprove === true && !settings.wishesHidden;

  const result = await saveWishOnce(client, {
    weddingId: resolvedWeddingId,
    guestId,
    authorKey,
    name,
    message,
    autoApprove,
  });

  return json(
    { ok: true, updated: result.updated, approved: autoApprove },
    result.updated ? 200 : 201,
  );
});

/**
 * GET /api/wishes?weddingSlug=...
 *   → { enabled, wishes: [{ id, name, message }] }  (chỉ lời chúc đã duyệt)
 * GET /api/wishes?weddingSlug=...&slug=...|&authorKey=...
 *   → { mine: { message, name } | null }
 */
export const GET = route(async (req: Request) => {
  const limited = rateLimit(req, "wishes-get", 60, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const url = new URL(req.url);
  const client = db();

  const rawSlug = url.searchParams.get("slug")?.trim() || null;
  const authorKeyParam = normalizeAuthorKey(url.searchParams.get("authorKey"));
  const weddingSlugCheck = validateWeddingSlug(url.searchParams.get("weddingSlug"));

  let weddingId: string | null = null;
  let guestId: string | null = null;

  if (rawSlug) {
    if (!SLUG_RE.test(rawSlug)) return fail("Link không hợp lệ.", 404);
    const { data, error } = await client
      .from("guests")
      .select("id, wedding_id")
      .eq("slug", rawSlug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return fail("Link không hợp lệ.", 404);
    guestId = data.id;
    weddingId = data.wedding_id;
  } else if (weddingSlugCheck.valid) {
    const { data, error } = await client
      .from("weddings")
      .select("id")
      .eq("slug", weddingSlugCheck.slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return fail("Không tìm thấy thiệp cưới.", 404);
    weddingId = data.id;
  } else {
    return fail("Thiếu thông tin thiệp mời.", 400);
  }

  if (weddingId && (await isWeddingSuspended(weddingId))) {
    return fail("Thiệp cưới này đang tạm khoá.", 403);
  }

  // Lời chúc của chính người đang xem (để điền sẵn và sửa lại).
  const authorKey = guestId ? `guest:${guestId}` : authorKeyParam;
  if (authorKey) {
    const { data, error } = await client
      .from("wishes")
      .select("name, message")
      .eq("wedding_id", weddingId)
      .eq("author_key", authorKey)
      .maybeSingle();
    if (!error && data) {
      return json({ mine: { name: data.name, message: data.message } });
    }
    // Chưa chạy migration v18 → tra tạm theo guest_id.
    if (error && guestId) {
      const { data: legacy } = await client
        .from("wishes")
        .select("name, message")
        .eq("wedding_id", weddingId)
        .eq("guest_id", guestId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return json({ mine: legacy ? { name: legacy.name, message: legacy.message } : null });
    }
    return json({ mine: null });
  }

  if (!weddingId) return fail("Không xác định được thiệp cưới.", 400);
  const publicWeddingId = weddingId;

  const settings = await loadWishSettings(publicWeddingId);
  const enabled = Boolean(settings?.showWishesOnCard) && !settings?.wishesHidden;
  if (!enabled) return json({ enabled: false, wishes: [] });

  const { data, error } = await client
    .from("wishes")
    .select("id, name, message, approved")
    .eq("wedding_id", publicWeddingId)
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw error;

  const res = json({
    enabled: true,
    wishes: (data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      message: row.message as string,
    })),
  });
  res.headers.set(
    "Cache-Control",
    "public, s-maxage=30, stale-while-revalidate=60",
  );
  return res;
});
