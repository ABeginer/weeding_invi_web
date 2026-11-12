import { authRoute, fail, json, readBody, text } from "@/lib/server/http";
import { toWedding, type WeddingRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { ensureUserRecord } from "@/lib/server/weddings";
import { createDefaultWeddingContent } from "@/lib/wedding-content";
import { FREE_PLAN_MAX_WEDDINGS, validateWeddingSlug } from "@/lib/wedding-slug";

const TEMPLATE_ID_RE = /^[a-z0-9-]{2,40}$/;

export const GET = authRoute(async (_req, user) => {
  const { data, error } = await db()
    .from("weddings")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return json(((data ?? []) as WeddingRow[]).map(toWedding));
});

export const POST = authRoute(async (req, user) => {
  const body = await readBody(req);
  const slugCheck = validateWeddingSlug(body?.slug);
  if (!slugCheck.valid) {
    return fail(slugCheck.error ?? "Đường dẫn thiệp không hợp lệ.");
  }

  let templateId = "basic-1";
  if (body?.templateId !== undefined) {
    const parsed = text(body.templateId, 40);
    if (!parsed || !TEMPLATE_ID_RE.test(parsed)) {
      return fail("Mẫu thiệp không hợp lệ.");
    }
    templateId = parsed;
  }

  await ensureUserRecord(user);

  const client = db();
  const { data: existing, error: countError } = await client
    .from("weddings")
    .select("id, plan")
    .eq("owner_id", user.id);

  if (countError) throw countError;

  const weddingsList = existing ?? [];
  const hasPaidPlan = weddingsList.some((w) => w.plan === "pro" || w.plan === "vip");
  if (!hasPaidPlan && weddingsList.length >= FREE_PLAN_MAX_WEDDINGS) {
    return fail(
      `Gói miễn phí chỉ được tạo tối đa ${FREE_PLAN_MAX_WEDDINGS} thiệp cưới.`,
      400,
    );
  }

  const { data, error } = await client
    .from("weddings")
    .insert({
      owner_id: user.id,
      slug: slugCheck.slug,
      template_id: templateId,
      plan: "free",
      content: createDefaultWeddingContent(),
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return fail("Đường dẫn thiệp này đã được sử dụng, vui lòng chọn tên khác.", 409);
    }
    throw error;
  }

  return json(toWedding(data as WeddingRow), 201);
});

