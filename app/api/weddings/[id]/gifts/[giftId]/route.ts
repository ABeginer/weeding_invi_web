import { authRoute, fail, json, readBody, text, UUID_RE } from "@/lib/server/http";
import { toGift, type GiftRow } from "@/lib/server/mappers";
import { isPaid } from "@/lib/server/owner";
import { db } from "@/lib/server/supabase";
import { isUuid } from "@/lib/server/validate";
import { getOwnedWedding } from "@/lib/server/weddings";
import {
  GIFT_METHODS,
  GIFT_NOTE_MAX,
  MAX_GIFT_AMOUNT_VND,
  parseGiftAmount,
} from "@/lib/gift-input";

type Ctx = { params: Promise<{ id: string; giftId: string }> };

const PLAN_LOCKED_MESSAGE =
  "Sổ mừng dành cho gói Pro và VIP. Vui lòng nâng cấp gói để sử dụng.";

export const PATCH = authRoute<Ctx>(async (req, user, { params }) => {
  const { id, giftId } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (!isPaid(wedding.plan)) return fail(PLAN_LOCKED_MESSAGE, 403);
  if (!UUID_RE.test(giftId)) return fail("Không tìm thấy khoản mừng.", 404);

  const body = await readBody(req);
  if (!body) return fail("Dữ liệu cập nhật không hợp lệ.");

  const patch: Record<string, unknown> = {};

  if (body.giverName !== undefined) {
    const giverName = text(body.giverName, 100);
    if (!giverName) return fail("Tên người mừng không hợp lệ.");
    patch.giver_name = giverName;
  }

  if (body.amountVnd !== undefined) {
    const amountVnd = parseGiftAmount(body.amountVnd);
    if (amountVnd === null) {
      return fail(
        `Số tiền mừng phải là số nguyên từ 0 đến ${MAX_GIFT_AMOUNT_VND.toLocaleString("vi-VN")}.`,
      );
    }
    patch.amount_vnd = amountVnd;
  }

  if (body.method !== undefined) {
    if (
      typeof body.method !== "string" ||
      !GIFT_METHODS.includes(body.method as (typeof GIFT_METHODS)[number])
    ) {
      return fail("Hình thức mừng không hợp lệ.");
    }
    patch.method = body.method;
  }

  if (body.note !== undefined) {
    patch.note = text(body.note, GIFT_NOTE_MAX);
  }

  if (body.guestId !== undefined) {
    if (body.guestId === null) {
      patch.guest_id = null;
    } else if (isUuid(body.guestId)) {
      patch.guest_id = body.guestId;
    } else {
      return fail("Khách mời không hợp lệ.");
    }
  }

  if (body.thanked !== undefined) {
    if (typeof body.thanked !== "boolean") {
      return fail("Trạng thái cảm ơn không hợp lệ.");
    }
    patch.thanked_at = body.thanked ? new Date().toISOString() : null;
  }

  if (Object.keys(patch).length === 0) {
    return fail("Không có dữ liệu cần cập nhật.");
  }

  const { data, error } = await db()
    .from("gifts")
    .update(patch)
    .eq("id", giftId)
    .eq("wedding_id", wedding.id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  if (!data) return fail("Không tìm thấy khoản mừng.", 404);
  return json(toGift(data as GiftRow));
});

export const DELETE = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id, giftId } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (!isPaid(wedding.plan)) return fail(PLAN_LOCKED_MESSAGE, 403);
  if (!UUID_RE.test(giftId)) return fail("Không tìm thấy khoản mừng.", 404);

  const { data, error } = await db()
    .from("gifts")
    .delete()
    .eq("id", giftId)
    .eq("wedding_id", wedding.id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) return fail("Không tìm thấy khoản mừng.", 404);
  return json({ ok: true });
});
