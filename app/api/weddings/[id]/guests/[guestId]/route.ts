import { authRoute, fail, json, readBody, text, UUID_RE } from "@/lib/server/http";
import { toGuest, type GuestRow } from "@/lib/server/mappers";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";

type Ctx = { params: Promise<{ id: string; guestId: string }> };

export const PATCH = authRoute<Ctx>(async (req, user, { params }) => {
  const { id, guestId } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (!UUID_RE.test(guestId)) return fail("Không tìm thấy khách mời.", 404);

  const body = await readBody(req);
  const name = text(body?.name, 100);
  if (!name) return fail("Tên không hợp lệ (tối đa 100 ký tự).");

  const patch: Record<string, unknown> = { name };

  if (body?.relationshipGroup !== undefined) {
    const value = body.relationshipGroup;
    if (
      value !== null &&
      value !== "elder" &&
      value !== "peer_formal" &&
      value !== "close_friend" &&
      value !== "family"
    ) {
      return fail("Nhóm vai vế không hợp lệ.");
    }
    patch.relationship_group = value;
  }

  if (body?.customPronounHost !== undefined) {
    patch.custom_pronoun_host = text(body.customPronounHost, 60);
  }
  if (body?.customPronounGuest !== undefined) {
    patch.custom_pronoun_guest = text(body.customPronounGuest, 60);
  }
  if (body?.tableNumber !== undefined) {
    const rawTable = text(body.tableNumber, 40);
    if (rawTable !== null && wedding.plan !== "vip") {
      return fail("Tính năng xếp bàn và thẻ check-in chỉ khả dụng trên gói VIP.", 403);
    }
    patch.table_number = rawTable;
  }
  if (body?.dietaryPreference !== undefined) {
    const value = body.dietaryPreference;
    if (value !== null && value !== "standard" && value !== "vegetarian") {
      return fail("Chế độ ăn không hợp lệ.");
    }
    patch.dietary_preference = value;
    patch.diet = value === "vegetarian" ? "veg" : value === "standard" ? "meat" : null;
  }

  const { data, error } = await db()
    .from("guests")
    .update(patch)
    .eq("id", guestId)
    .eq("wedding_id", wedding.id)
    .select("*")
    .maybeSingle();

  if (error) {
    const code = (error as { code?: string }).code ?? "";
    if (code === "42703" || code === "PGRST204") {
      return fail(
        "Cơ sở dữ liệu chưa có cột vai vế/bàn tiệc. Vui lòng chạy migration 20261114_strategic_upgrade.sql.",
        409,
      );
    }
    throw error;
  }
  if (!data) return fail("Không tìm thấy khách mời.", 404);
  return json(toGuest(data as GuestRow));
});

export const DELETE = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id, guestId } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (!UUID_RE.test(guestId)) return fail("Không tìm thấy khách mời.", 404);

  const { data, error } = await db()
    .from("guests")
    .delete()
    .eq("id", guestId)
    .eq("wedding_id", wedding.id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) return fail("Không tìm thấy khách mời.", 404);
  return json({ ok: true });
});

