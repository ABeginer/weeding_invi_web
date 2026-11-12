import {
  getPlanLimits,
  getTemplateLockedMessage,
  getWeddingLimitMessage,
  isTemplateAllowedForPlan,
} from "@/config/plans";
import { authRoute, fail, json, readBody, text } from "@/lib/server/http";
import { toWedding, type WeddingRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { ensureUserRecord } from "@/lib/server/weddings";
import { createDefaultWeddingContent } from "@/lib/wedding-data";
import { validateWeddingSlug } from "@/lib/wedding-slug";
import { getTemplateMeta } from "@/templates/registry";

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
    const meta = getTemplateMeta(parsed);
    if (!meta || meta.isPlaceholder) {
      return fail("Mẫu thiệp này chưa sẵn sàng hoặc không tồn tại.");
    }
    if (!isTemplateAllowedForPlan("free", meta.plan)) {
      return fail(getTemplateLockedMessage("free", meta.plan), 403);
    }
    templateId = meta.id;
  }

  await ensureUserRecord(user);

  const client = db();
  const { data: existing, error: countError } = await client
    .from("weddings")
    .select("id, plan")
    .eq("owner_id", user.id);

  if (countError) throw countError;

  const weddingsList = existing ?? [];
  const freeMaxWeddings = getPlanLimits("free").weddings;
  const hasPaidPlan = weddingsList.some((w) => w.plan === "pro" || w.plan === "vip");
  if (
    !hasPaidPlan &&
    freeMaxWeddings !== null &&
    weddingsList.length >= freeMaxWeddings
  ) {
    return fail(getWeddingLimitMessage("free"), 403);
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
