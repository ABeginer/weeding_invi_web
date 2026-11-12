import { db } from "@/lib/server/supabase";
import { fail, json, readBody, route, SLUG_RE, text } from "@/lib/server/http";
import { verifyTurnstileToken } from "@/lib/server/turnstile";
import type { GuestDiet } from "@/lib/types";
import { validateWeddingSlug } from "@/lib/wedding-slug";

function isMissingV4GuestColumns(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  return (
    code === "42703" ||
    code === "PGRST204" ||
    /\b(plus_ones|diet)\b/i.test(message)
  );
}

function parsePlusOnes(raw: unknown): { ok: true; value: number } | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, value: 0 };
  }
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0 || raw > 10) {
    return {
      ok: false,
      error: "Số người đi cùng phải là số nguyên từ 0 đến 10.",
    };
  }
  return { ok: true, value: raw };
}

function parseDiet(raw: unknown): { ok: true; value: GuestDiet | null } | { ok: false; error: string } {
  if (raw === undefined || raw === null || raw === "") {
    return { ok: true, value: null };
  }
  if (raw === "meat" || raw === "veg") {
    return { ok: true, value: raw };
  }
  return { ok: false, error: "Lựa chọn chế độ ăn không hợp lệ." };
}

export const POST = route(async (req: Request) => {
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
  const wishMessage = text(body?.wish, 500);
  const respondedAt = new Date().toISOString();

  const client = db();

  if (rawSlug) {
    if (!SLUG_RE.test(rawSlug)) return fail("Link không hợp lệ.", 404);

    let { data, error } = await client
      .from("guests")
      .update({
        status,
        plus_ones: resolvedPlusOnes,
        diet: resolvedDiet,
        responded_at: respondedAt,
      })
      .eq("slug", rawSlug)
      .select("id, slug, wedding_id, name")
      .maybeSingle();

    if (error && isMissingV4GuestColumns(error) && resolvedPlusOnes === 0 && resolvedDiet === null) {
      const fallback = await client
        .from("guests")
        .update({ status, responded_at: respondedAt })
        .eq("slug", rawSlug)
        .select("id, slug, wedding_id, name")
        .maybeSingle();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    if (!data) return fail("Link không hợp lệ.", 404);

    let wishSaved = false;
    if (wishMessage) {
      const { error: wishError } = await client.from("wishes").insert({
        wedding_id: data.wedding_id,
        guest_id: data.id,
        name: data.name,
        message: wishMessage,
      });
      if (!wishError) {
        wishSaved = true;
      }
    }

    return json({ ok: true, slug: data.slug, wishSaved });
  }

  const weddingSlugCheck = validateWeddingSlug(body?.weddingSlug);
  if (!weddingSlugCheck.valid) {
    return fail("Thiếu thông tin thiệp mời.");
  }

  const { data: weddingRow, error: weddingError } = await client
    .from("weddings")
    .select("id")
    .eq("slug", weddingSlugCheck.slug)
    .maybeSingle();

  if (weddingError) throw weddingError;
  if (!weddingRow) return fail("Không tìm thấy thiệp cưới.", 404);

  const name = text(body?.name, 100);
  if (!name) return fail("Vui lòng nhập tên của bạn (tối đa 100 ký tự).");

  let { data, error } = await client
    .from("guests")
    .insert({
      wedding_id: weddingRow.id,
      name,
      status,
      plus_ones: resolvedPlusOnes,
      diet: resolvedDiet,
      responded_at: respondedAt,
    })
    .select("id, slug")
    .single();

  if (error && isMissingV4GuestColumns(error) && resolvedPlusOnes === 0 && resolvedDiet === null) {
    const fallback = await client
      .from("guests")
      .insert({
        wedding_id: weddingRow.id,
        name,
        status,
        responded_at: respondedAt,
      })
      .select("id, slug")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw error;
  if (!data) return fail("Không thể lưu xác nhận tham dự.", 500);

  let wishSaved = false;
  if (wishMessage) {
    const { error: wishError } = await client.from("wishes").insert({
      wedding_id: weddingRow.id,
      guest_id: data.id,
      name,
      message: wishMessage,
    });
    if (!wishError) {
      wishSaved = true;
    }
  }

  return json({ ok: true, slug: data.slug, wishSaved }, 201);
});
