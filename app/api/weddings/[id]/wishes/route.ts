import { authRoute, fail, json, readBody } from "@/lib/server/http";
import { toWish, type WishRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string }> };

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const { data, error } = await db()
    .from("wishes")
    .select("*")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw error;
  return json(((data ?? []) as WishRow[]).map(toWish));
});

/** Duyệt / bỏ duyệt một lời chúc để hiện lên thiệp. */
export const PATCH = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);
  const wishId = typeof body?.id === "string" ? body.id.trim() : "";
  const approved = body?.approved === true;
  if (!wishId) return fail("Thiếu lời chúc cần cập nhật.");

  const { data, error } = await db()
    .from("wishes")
    .update({ approved })
    .eq("id", wishId)
    .eq("wedding_id", wedding.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return fail("Không tìm thấy lời chúc.", 404);
  return json(toWish(data as WishRow));
});

/**
 * POST { action: "auto" } → duyệt tất cả lời chúc + bật duyệt tự động cho lời chúc mới.
 * POST { action: "manual" } → quay về duyệt tay (không bỏ duyệt những lời đã duyệt).
 */
export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);
  const action = body?.action === "auto" ? "auto" : body?.action === "manual" ? "manual" : null;
  if (!action) return fail("Hành động không hợp lệ.");

  const client = db();
  let approvedCount = 0;

  if (action === "auto") {
    const { data, error } = await client
      .from("wishes")
      .update({ approved: true })
      .eq("wedding_id", wedding.id)
      .eq("approved", false)
      .select("id");
    if (error) throw error;
    approvedCount = data?.length ?? 0;
  }

  const nextContent = {
    ...(wedding.content as Record<string, unknown>),
    wishApprovalMode: action,
  };

  const { error: contentError } = await client
    .from("weddings")
    .update({ content: nextContent, updated_at: new Date().toISOString() })
    .eq("id", wedding.id)
    .eq("owner_id", user.id);
  if (contentError) throw contentError;

  return json({ mode: action, approvedCount });
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Xoá lời chúc (1 hoặc nhiều) — dùng để dọn lời chúc ác ý. */
export const DELETE = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const body = await readBody(req);
  const rawIds = Array.isArray(body?.ids) ? body.ids : [];
  const ids = Array.from(
    new Set(rawIds.filter((value): value is string => typeof value === "string" && UUID_RE.test(value))),
  ).slice(0, 500);

  if (ids.length === 0) return fail("Chưa chọn lời chúc nào để xoá.");

  const { data, error } = await db()
    .from("wishes")
    .delete()
    .eq("wedding_id", wedding.id)
    .in("id", ids)
    .select("id");

  if (error) throw error;
  return json({ deleted: data?.length ?? 0 });
});
