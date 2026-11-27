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
import {
  toIsoPlus07,
  weddingContentInputSchema,
  type WeddingContent,
} from "@/lib/wedding-types";
import { getTemplateMeta } from "@/templates/registry";

const TEMPLATE_ID_RE = /^[a-z0-9-]{2,40}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeInitialContent(
  rawContent: unknown,
): { ok: true; content: WeddingContent } | { ok: false; error: string } {
  const defaults = createDefaultWeddingContent();
  if (rawContent === undefined) {
    return { ok: true, content: defaults };
  }
  if (!isRecord(rawContent)) {
    return { ok: false, error: "Nội dung thiệp khởi tạo không hợp lệ." };
  }

  const rawCouple = isRecord(rawContent.couple) ? rawContent.couple : {};
  const rawDate = typeof rawContent.date === "string" ? rawContent.date : defaults.date;
  const isoDate = toIsoPlus07(rawDate) || rawDate;

  const candidate = {
    couple: {
      groomName:
        typeof rawCouple.groomName === "string"
          ? rawCouple.groomName
          : defaults.couple.groomName,
      brideName:
        typeof rawCouple.brideName === "string"
          ? rawCouple.brideName
          : defaults.couple.brideName,
      groomFullName:
        typeof rawCouple.groomFullName === "string"
          ? rawCouple.groomFullName
          : defaults.couple.groomFullName,
      brideFullName:
        typeof rawCouple.brideFullName === "string"
          ? rawCouple.brideFullName
          : defaults.couple.brideFullName,
      groomParents:
        typeof rawCouple.groomParents === "string"
          ? rawCouple.groomParents
          : defaults.couple.groomParents,
      brideParents:
        typeof rawCouple.brideParents === "string"
          ? rawCouple.brideParents
          : defaults.couple.brideParents,
    },
    date: isoDate,
    quote:
      typeof rawContent.quote === "string" ? rawContent.quote : defaults.quote,
    heroPhotoId: null,
    groomPhotoId: null,
    bridePhotoId: null,
    gift: isRecord(rawContent.gift) ? rawContent.gift : defaults.gift,
  };

  const parsed = weddingContentInputSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Nội dung thiệp không hợp lệ.",
    };
  }

  return { ok: true, content: parsed.data };
}

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

  let templateId = "vuon-o-liu";
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

  const contentResult = mergeInitialContent(body?.content);
  if (!contentResult.ok) {
    return fail(contentResult.error);
  }

  await ensureUserRecord(user);

  const client = db();
  const { data: existing, error: countError } = await client
    .from("weddings")
    .select("id, plan")
    .eq("owner_id", user.id);

  if (countError) throw countError;

  const weddingsList = existing ?? [];
  const freeMaxWeddings = getPlanLimits("free").weddings ?? 1;
  const freeWeddingsCount = weddingsList.filter((w) => w.plan === "free").length;
  const hasPaidPlan = weddingsList.some((w) => w.plan === "pro" || w.plan === "vip");
  const maxAllowedUnpaidFree = hasPaidPlan ? Math.max(2, freeMaxWeddings) : freeMaxWeddings;
  if (freeWeddingsCount >= maxAllowedUnpaidFree) {
    return fail(
      hasPaidPlan
        ? `Mỗi tài khoản chỉ được giữ tối đa ${maxAllowedUnpaidFree} thiệp đang ở gói Miễn phí chưa nâng cấp. Vui lòng nâng cấp hoặc xóa bớt thiệp Miễn phí cũ.`
        : getWeddingLimitMessage("free"),
      403,
    );
  }

  const { data, error } = await client
    .from("weddings")
    .insert({
      owner_id: user.id,
      slug: slugCheck.slug,
      template_id: templateId,
      plan: "free",
      content: contentResult.content,
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
