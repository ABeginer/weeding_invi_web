import { getGuestLimitMessage, getPlanLimits } from "@/config/plans";
import { db } from "@/lib/server/supabase";
import { fail, json, readBody, route, SLUG_RE, text } from "@/lib/server/http";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { verifyTurnstileToken } from "@/lib/server/turnstile";
import { isWeddingSuspended } from "@/lib/server/weddings";
import { normalizeAuthorKey, saveWishOnce } from "@/lib/server/wishes";
import { parseDiet, parsePlusOnes, sanitizeSongRequest } from "@/lib/rsvp-input";
import type { WeddingPlan } from "@/lib/types";
import { validateWeddingSlug } from "@/lib/wedding-slug";

const GUEST_SELECT = "id, slug, wedding_id, name";

function hasColumnIssue(error: unknown, columns: string[]): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  if (code === "42703" || code === "PGRST204") return true;
  return columns.some((column) => new RegExp(`\\b${column}\\b`, "i").test(message));
}

function isMissingV4GuestColumns(error: unknown): boolean {
  return hasColumnIssue(error, ["plus_ones", "diet"]);
}

function isMissingGuestPreferenceColumns(error: unknown): boolean {
  return hasColumnIssue(error, ["song_request", "ride_needed"]);
}

export const POST = route(async (req: Request) => {
  // Chặn burst trước khi gọi Turnstile để không đốt quota và tránh spam DB.
  const limited = rateLimit(req, "rsvp", 10, 60_000);
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

  const rawSlug =
    typeof body?.slug === "string" && body.slug.trim() !== "" ? body.slug.trim() : null;
  const status = body?.status;

  if (status !== "accepted" && status !== "declined") {
    return fail("Lựa chọn không hợp lệ.");
  }

  const plusOnesResult = parsePlusOnes(body?.plusOnes);
  if (!plusOnesResult.ok) {
    return fail(plusOnesResult.error);
  }

  const dietResult = parseDiet(body?.diet);
  if (!dietResult.ok) {
    return fail(dietResult.error);
  }

  const resolvedPlusOnes = status === "accepted" ? plusOnesResult.value : 0;
  const resolvedDiet = status === "accepted" ? dietResult.value : null;
  const songRequest = status === "accepted" ? sanitizeSongRequest(body?.songRequest) : null;
  const rideNeeded = status === "accepted" && body?.rideNeeded === true;
  const wishMessage = text(body?.wish, 500);
  const authorKeyInput = normalizeAuthorKey(body?.authorKey);
  const respondedAt = new Date().toISOString();

  const client = db();

  // ---- Cập nhật theo link khách cá nhân ----
  if (rawSlug) {
    if (!SLUG_RE.test(rawSlug)) return fail("Link không hợp lệ.", 404);

    const { data: guestLookup, error: guestLookupError } = await client
      .from("guests")
      .select("id, wedding_id")
      .eq("slug", rawSlug)
      .maybeSingle();

    if (guestLookupError) throw guestLookupError;
    if (!guestLookup) return fail("Link không hợp lệ.", 404);
    if (await isWeddingSuspended(guestLookup.wedding_id)) {
      return fail("Thiệp cưới này đang tạm khoá.", 403);
    }

    const fullUpdate = {
      status,
      plus_ones: resolvedPlusOnes,
      diet: resolvedDiet,
      song_request: songRequest,
      ride_needed: rideNeeded,
      responded_at: respondedAt,
    };
    const v4Update = {
      status,
      plus_ones: resolvedPlusOnes,
      diet: resolvedDiet,
      responded_at: respondedAt,
    };
    const baseUpdate = { status, responded_at: respondedAt };

    let res = await client
      .from("guests")
      .update(fullUpdate)
      .eq("slug", rawSlug)
      .select(GUEST_SELECT)
      .maybeSingle();

    if (res.error && isMissingGuestPreferenceColumns(res.error)) {
      res = await client
        .from("guests")
        .update(v4Update)
        .eq("slug", rawSlug)
        .select(GUEST_SELECT)
        .maybeSingle();
    }

    if (
      res.error &&
      isMissingV4GuestColumns(res.error) &&
      resolvedPlusOnes === 0 &&
      resolvedDiet === null
    ) {
      res = await client
        .from("guests")
        .update(baseUpdate)
        .eq("slug", rawSlug)
        .select(GUEST_SELECT)
        .maybeSingle();
    }

    if (res.error) throw res.error;
    if (!res.data) return fail("Link không hợp lệ.", 404);

    const data = res.data;
    let wishSaved = false;
    if (wishMessage) {
      const { data: contentRow } = await client
        .from("weddings")
        .select("content")
        .eq("id", data.wedding_id)
        .maybeSingle();
      const content = (contentRow?.content ?? {}) as Record<string, unknown>;
      const saved = await saveWishOnce(client, {
        weddingId: data.wedding_id,
        guestId: data.id,
        authorKey: `guest:${data.id}`,
        name: data.name,
        message: wishMessage,
        autoApprove: content.wishApprovalMode === "auto",
      }).catch(() => null);
      wishSaved = saved?.saved === true;
    }

    return json({ ok: true, slug: data.slug, wishSaved });
  }

  // ---- Khách tự xác nhận từ thiệp chung ----
  const weddingSlugCheck = validateWeddingSlug(body?.weddingSlug);
  if (!weddingSlugCheck.valid) {
    return fail("Thiếu thông tin thiệp mời.");
  }

  const { data: weddingRow, error: weddingError } = await client
    .from("weddings")
    .select("id, plan")
    .eq("slug", weddingSlugCheck.slug)
    .maybeSingle();

  if (weddingError) throw weddingError;
  if (!weddingRow) return fail("Không tìm thấy thiệp cưới.", 404);
  if (await isWeddingSuspended(weddingRow.id)) {
    return fail("Thiệp cưới này đang tạm khoá.", 403);
  }

  const plan = ((weddingRow.plan as WeddingPlan | null) ?? "free") satisfies WeddingPlan;
  const maxGuests = getPlanLimits(plan).guests;
  if (maxGuests !== null) {
    const { count, error: countError } = await client
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("wedding_id", weddingRow.id);

    if (countError) throw countError;
    if ((count ?? 0) >= maxGuests) {
      return fail(getGuestLimitMessage(plan), 403);
    }
  }

  const name = text(body?.name, 100);
  if (!name) return fail("Vui lòng nhập tên của bạn (tối đa 100 ký tự).");

  const fullInsert = {
    wedding_id: weddingRow.id,
    name,
    status,
    plus_ones: resolvedPlusOnes,
    diet: resolvedDiet,
    song_request: songRequest,
    ride_needed: rideNeeded,
    responded_at: respondedAt,
  };
  const v4Insert = {
    wedding_id: weddingRow.id,
    name,
    status,
    plus_ones: resolvedPlusOnes,
    diet: resolvedDiet,
    responded_at: respondedAt,
  };
  const baseInsert = {
    wedding_id: weddingRow.id,
    name,
    status,
    responded_at: respondedAt,
  };

  let res = await client.from("guests").insert(fullInsert).select("id, slug").single();

  if (res.error && isMissingGuestPreferenceColumns(res.error)) {
    res = await client.from("guests").insert(v4Insert).select("id, slug").single();
  }

  if (
    res.error &&
    isMissingV4GuestColumns(res.error) &&
    resolvedPlusOnes === 0 &&
    resolvedDiet === null
  ) {
    res = await client.from("guests").insert(baseInsert).select("id, slug").single();
  }

  if (res.error) throw res.error;
  if (!res.data) return fail("Không thể lưu xác nhận tham dự.", 500);

  const data = res.data;
  let wishSaved = false;
  if (wishMessage) {
    const { data: contentRow } = await client
      .from("weddings")
      .select("content")
      .eq("id", weddingRow.id)
      .maybeSingle();
    const content = (contentRow?.content ?? {}) as Record<string, unknown>;
    const saved = await saveWishOnce(client, {
      weddingId: weddingRow.id,
      guestId: data.id,
      authorKey: authorKeyInput ?? `guest:${data.id}`,
      name,
      message: wishMessage,
      autoApprove: content.wishApprovalMode === "auto",
    }).catch(() => null);
    wishSaved = saved?.saved === true;
  }

  return json({ ok: true, slug: data.slug, wishSaved }, 201);
});
