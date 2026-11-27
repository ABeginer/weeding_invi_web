import { getUser } from "@/lib/server/auth";
import { fail, json, readBody, route, UUID_RE } from "@/lib/server/http";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { db } from "@/lib/server/supabase";
import { isWeddingSuspendedRow } from "@/lib/server/weddings";
import { verifyShareCookieValue } from "@/lib/share-pin";
import { normalizeWeddingContent } from "@/lib/wedding-data";
import { validateWeddingSlug } from "@/lib/wedding-slug";

export const POST = route(async (req: Request) => {
  const limited = rateLimit(req, "share-check-in", 60, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const body = await readBody(req);
  if (!body) return fail("Dữ liệu không hợp lệ.");

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const guestId = typeof body.guestId === "string" ? body.guestId.trim() : "";
  const guestSlug = typeof body.guestSlug === "string" ? body.guestSlug.trim() : "";
  const undo = body.undo === true;
  const arrivedCountRaw = typeof body.arrivedCount === "number" ? body.arrivedCount : null;

  const slugCheck = validateWeddingSlug(slug);
  if (!slugCheck.valid) {
    return fail("Đường dẫn thiệp cưới không hợp lệ.", 400);
  }

  if (!guestId && !guestSlug) {
    return fail("Cần cung cấp mã khách mời để check-in.", 400);
  }

  if (guestId && !UUID_RE.test(guestId)) {
    return fail("Mã khách mời không hợp lệ.", 400);
  }

  const client = db();
  const { data: wedding, error: weddingError } = await client
    .from("weddings")
    .select("id, slug, owner_id, plan, content, suspended")
    .eq("slug", slug)
    .maybeSingle();

  if (weddingError) throw weddingError;
  if (!wedding || isWeddingSuspendedRow(wedding)) {
    return fail("Không tìm thấy tiệc cưới.", 404);
  }

  if (wedding.plan !== "vip") {
    return fail("Tính năng chỉ dành cho gói Pro.", 403);
  }

  const content = normalizeWeddingContent(wedding.content);

  // 1. Kiểm tra xác thực: Cookie mã PIN hợp lệ (khi đang bật và khớp PIN hiện tại) HOẶC chủ sở hữu đã đăng nhập Auth0
  let isAuthorized = false;
  const cookiesHeader = req.headers.get("cookie") ?? "";
  const cookieMatch = cookiesHeader.match(new RegExp(`(?:^|;\\s*)inviwedd_share_${slug}=([^;]+)`));
  const shareCookie = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

  if (
    shareCookie &&
    content.sharePinEnabled === true &&
    content.sharePin &&
    (await verifyShareCookieValue(slug, shareCookie, content.sharePin))
  ) {
    isAuthorized = true;
  } else {
    const user = await getUser(req);
    if (user && user.id === wedding.owner_id) {
      isAuthorized = true;
    }
  }

  if (!isAuthorized) {
    return fail("Bạn không có quyền check-in cho tiệc cưới này.", 401);
  }

  // 2. Tìm khách mời trong tiệc cưới
  let guestQuery = client
    .from("guests")
    .select("id, wedding_id, name, slug, status, plus_ones, diet, table_number, checked_in_at, checked_in_count")
    .eq("wedding_id", wedding.id);

  if (guestId) {
    guestQuery = guestQuery.eq("id", guestId);
  } else {
    guestQuery = guestQuery.eq("slug", guestSlug);
  }

  const { data: guest, error: guestError } = await guestQuery.maybeSingle();

  if (guestError) throw guestError;
  if (!guest) {
    return fail("Không tìm thấy thông tin khách mời trong danh sách tiệc.", 404);
  }

  // 3. Xử lý Check-in hoặc Hoàn tác (Undo)
  const wasAlreadyCheckedIn = Boolean(guest.checked_in_at);
  const nowIso = new Date().toISOString();

  let nextCheckedInAt: string | null = null;
  let nextCheckedInCount: number | null = null;

  if (undo) {
    nextCheckedInAt = null;
    nextCheckedInCount = null;
  } else {
    nextCheckedInAt = guest.checked_in_at || nowIso;
    if (arrivedCountRaw !== null && Number.isFinite(arrivedCountRaw) && arrivedCountRaw > 0) {
      nextCheckedInCount = Math.min(50, Math.floor(arrivedCountRaw));
    } else if (typeof guest.checked_in_count === "number" && guest.checked_in_count > 0) {
      nextCheckedInCount = guest.checked_in_count;
    } else {
      nextCheckedInCount = 1 + Math.max(0, guest.plus_ones ?? 0);
    }
  }

  const { data: updatedGuest, error: updateError } = await client
    .from("guests")
    .update({
      checked_in_at: nextCheckedInAt,
      checked_in_count: nextCheckedInCount,
    })
    .eq("id", guest.id)
    .eq("wedding_id", wedding.id)
    .select("id, name, slug, status, plus_ones, diet, table_number, checked_in_at, checked_in_count")
    .single();

  if (updateError) throw updateError;

  const res = json({
    success: true,
    alreadyCheckedIn: wasAlreadyCheckedIn && !undo,
    previousCheckedInAt: guest.checked_in_at,
    guest: {
      id: updatedGuest.id,
      name: updatedGuest.name,
      slug: updatedGuest.slug,
      status: updatedGuest.status,
      plusOnes: updatedGuest.plus_ones,
      diet: updatedGuest.diet,
      tableNumber: updatedGuest.table_number,
      checkedInAt: updatedGuest.checked_in_at,
      checkedInCount: updatedGuest.checked_in_count,
    },
  });

  res.headers.set("Cache-Control", "private, no-store");
  return res;
});
