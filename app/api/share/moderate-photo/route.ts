import { getUser } from "@/lib/server/auth";
import { fail, json, readBody, route, UUID_RE } from "@/lib/server/http";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { db } from "@/lib/server/supabase";
import { isWeddingSuspendedRow } from "@/lib/server/weddings";
import { verifyShareCookieValue } from "@/lib/share-pin";
import { normalizeWeddingContent } from "@/lib/wedding-data";
import { validateWeddingSlug } from "@/lib/wedding-slug";

export const POST = route(async (req: Request) => {
  const limited = rateLimit(req, "share-moderate", 60, 60_000);
  if (!limited.ok) return tooManyRequests(limited);

  const body = await readBody(req);
  if (!body) return fail("Dữ liệu không hợp lệ.");

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const photoId = typeof body.photoId === "string" ? body.photoId.trim() : "";
  const status = body.status;

  const slugCheck = validateWeddingSlug(slug);
  if (!slugCheck.valid) {
    return fail("Đường dẫn thiệp cưới không hợp lệ.", 400);
  }

  if (!UUID_RE.test(photoId) || (status !== "approved" && status !== "hidden" && status !== "pending")) {
    return fail("Trạng thái duyệt ảnh không hợp lệ.", 400);
  }

  const client = db();
  const { data: wedding, error } = await client
    .from("weddings")
    .select("id, slug, owner_id, plan, content, suspended")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!wedding || isWeddingSuspendedRow(wedding)) {
    return fail("Không tìm thấy thiệp cưới.", 404);
  }

  if (wedding.plan !== "vip") {
    return fail("Tính năng chỉ dành cho gói Pro.", 403);
  }

  const rawPrevContent =
    wedding.content && typeof wedding.content === "object"
      ? (wedding.content as Record<string, unknown>)
      : {};
  const content = normalizeWeddingContent(wedding.content);

  // Kiểm tra quyền: Cookie mã PIN hợp lệ (khi đang bật và khớp PIN hiện tại) HOẶC chủ sở hữu đã đăng nhập Auth0
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
    return fail("Bạn không có quyền thực hiện thao tác này.", 401);
  }

  // Xác minh ảnh tồn tại và thuộc về thiệp cưới này (SEC-07)
  const { data: photo, error: photoError } = await client
    .from("photos")
    .select("id")
    .eq("id", photoId)
    .eq("wedding_id", wedding.id)
    .maybeSingle();

  if (photoError) throw photoError;
  if (!photo) {
    return fail("Không tìm thấy ảnh hoặc ảnh không thuộc thiệp cưới này.", 404);
  }

  const nextModeration = {
    ...(content.photoModeration || {}),
    [photoId]: status as "approved" | "hidden" | "pending",
  };

  const nextContent: Record<string, unknown> = {
    ...content,
    photoModeration: nextModeration,
    ...(typeof rawPrevContent.suspended === "boolean"
      ? { suspended: rawPrevContent.suspended }
      : {}),
    ...(typeof rawPrevContent.sharePinFailCount === "number"
      ? { sharePinFailCount: rawPrevContent.sharePinFailCount }
      : {}),
    ...(typeof rawPrevContent.sharePinLockedUntil === "string"
      ? { sharePinLockedUntil: rawPrevContent.sharePinLockedUntil }
      : {}),
  };

  const { error: updateError } = await client
    .from("weddings")
    .update({
      content: nextContent,
      updated_at: new Date().toISOString(),
    })
    .eq("id", wedding.id);

  if (updateError) throw updateError;

  return json({
    ok: true,
    photoModeration: nextModeration,
  });
});
