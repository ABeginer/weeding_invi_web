import { db } from "@/lib/server/supabase";
import { fail, json, readBody, route, SLUG_RE, text } from "@/lib/server/http";
import { validateWeddingSlug } from "@/lib/wedding-slug";

export const POST = route(async (req: Request) => {
  const body = await readBody(req);

  if (typeof body?.website === "string" && body.website.trim() !== "") {
    return json({ ok: true });
  }

  const rawSlug = typeof body?.slug === "string" && body.slug.trim() !== "" ? body.slug.trim() : null;
  const status = body?.status;

  if (status !== "accepted" && status !== "declined") {
    return fail("Lựa chọn không hợp lệ.");
  }

  const client = db();

  if (rawSlug) {
    if (!SLUG_RE.test(rawSlug)) return fail("Link không hợp lệ.", 404);

    const { data, error } = await client
      .from("guests")
      .update({ status })
      .eq("slug", rawSlug)
      .select("id, slug")
      .maybeSingle();

    if (error) throw error;
    if (!data) return fail("Link không hợp lệ.", 404);
    return json({ ok: true, slug: data.slug });
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

  const { data, error } = await client
    .from("guests")
    .insert({
      wedding_id: weddingRow.id,
      name,
      status,
      responded_at: new Date().toISOString(),
    })
    .select("id, slug")
    .single();

  if (error) throw error;
  return json({ ok: true, slug: data.slug }, 201);
});
