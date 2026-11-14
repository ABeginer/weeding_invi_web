import { authRoute, fail, json, readBody, text } from "@/lib/server/http";
import { toGift, type GiftRow } from "@/lib/server/mappers";
import { isPaid } from "@/lib/server/owner";
import { fetchAllRows } from "@/lib/server/pagination";
import { db } from "@/lib/server/supabase";
import { isUuid } from "@/lib/server/validate";
import { getOwnedWedding } from "@/lib/server/weddings";
import type { GiftMethod } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

const GIFT_METHODS: GiftMethod[] = ["cash", "bank", "other"];
const MAX_AMOUNT_VND = 1_000_000_000;
const NOTE_MAX = 300;

const PLAN_LOCKED_MESSAGE =
  "Sổ mừng dành cho gói Pro và VIP. Vui lòng nâng cấp gói để sử dụng.";

function parseMethod(raw: unknown): GiftMethod | null {
  return typeof raw === "string" && GIFT_METHODS.includes(raw as GiftMethod)
    ? (raw as GiftMethod)
    : null;
}

function parseAmount(raw: unknown): number | null {
  if (typeof raw !== "number" || !Number.isSafeInteger(raw)) return null;
  if (raw < 0 || raw > MAX_AMOUNT_VND) return null;
  return raw;
}

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (!isPaid(wedding.plan)) return fail(PLAN_LOCKED_MESSAGE, 403);

  const client = db();
  const rows = await fetchAllRows<GiftRow>((from, to) =>
    client
      .from("gifts")
      .select("*")
      .eq("wedding_id", wedding.id)
      .order("created_at", { ascending: false })
      .range(from, to),
  );

  const items = rows.map(toGift);
  const totals = {
    totalVnd: items.reduce((sum, gift) => sum + gift.amountVnd, 0),
    count: items.length,
    unthankedCount: items.filter((gift) => !gift.thankedAt).length,
  };

  return json({ items, totals });
});

export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (!isPaid(wedding.plan)) return fail(PLAN_LOCKED_MESSAGE, 403);

  const body = await readBody(req);
  const giverName = text(body?.giverName, 100);
  if (!giverName) return fail("Vui lòng nhập tên người mừng (tối đa 100 ký tự).");

  const amountVnd = parseAmount(body?.amountVnd);
  if (amountVnd === null) {
    return fail("Số tiền mừng phải là số nguyên từ 0 đến 1.000.000.000.");
  }

  const method = parseMethod(body?.method);
  if (!method) return fail("Hình thức mừng không hợp lệ.");

  const note = text(body?.note, NOTE_MAX);
  const guestId = isUuid(body?.guestId) ? body.guestId : null;

  const client = db();
  if (guestId) {
    const { data: guest, error: guestError } = await client
      .from("guests")
      .select("id")
      .eq("id", guestId)
      .eq("wedding_id", wedding.id)
      .maybeSingle();
    if (guestError) throw guestError;
    if (!guest) return fail("Khách mời không thuộc thiệp này.", 400);
  }

  const { data, error } = await client
    .from("gifts")
    .insert({
      wedding_id: wedding.id,
      guest_id: guestId,
      giver_name: giverName,
      amount_vnd: amountVnd,
      method,
      note,
    })
    .select("*")
    .single();

  if (error) throw error;
  return json(toGift(data as GiftRow), 201);
});
