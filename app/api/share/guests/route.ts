import { getUser } from "@/lib/server/auth";
import { fail, json, route } from "@/lib/server/http";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { db } from "@/lib/server/supabase";
import { isWeddingSuspendedRow } from "@/lib/server/weddings";
import { verifyShareCookieValue } from "@/lib/share-pin";
import { normalizeWeddingContent } from "@/lib/wedding-data";
import { validateWeddingSlug } from "@/lib/wedding-slug";

export const GET = route(async (req: Request) => {
  const limited = rateLimit(req, "share-guests", 60, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug")?.trim() || "";

  const slugCheck = validateWeddingSlug(slug);
  if (!slugCheck.valid) {
    return fail("Đường dẫn thiệp cưới không hợp lệ.", 400);
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

  // Xác thực quyền PIN (khi đang bật và khớp PIN hiện tại) hoặc Owner
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
    return fail("Bạn không có quyền truy cập danh sách khách mời.", 401);
  }

  const { data: guests, error: guestsError } = await client
    .from("guests")
    .select("id, name, slug, relationship_group, status, plus_ones, diet, table_number, checked_in_at, checked_in_count")
    .eq("wedding_id", wedding.id)
    .order("created_at", { ascending: false });

  if (guestsError) throw guestsError;

  const res = json({
    guests: (guests ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      relationshipGroup: row.relationship_group,
      status: row.status,
      plusOnes: row.plus_ones,
      diet: row.diet,
      tableNumber: row.table_number ?? null,
      checkedInAt: row.checked_in_at ?? null,
      checkedInCount: typeof row.checked_in_count === "number" ? row.checked_in_count : null,
    })),
  });

  res.headers.set("Cache-Control", "private, no-store");
  return res;
});
