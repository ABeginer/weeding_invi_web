import { getUser } from "@/lib/server/auth";
import { fail, json, readBody, route } from "@/lib/server/http";
import { db } from "@/lib/server/supabase";
import { verifyShareCookieValue } from "@/lib/share-pin";
import { normalizeWeddingContent } from "@/lib/wedding-data";
import { validateWeddingSlug } from "@/lib/wedding-slug";

export const POST = route(async (req: Request) => {
  const body = await readBody(req);
  if (!body) return fail("Dữ liệu không hợp lệ.");

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const photoId = typeof body.photoId === "string" ? body.photoId.trim() : "";
  const status = body.status;

  const slugCheck = validateWeddingSlug(slug);
  if (!slugCheck.valid) {
    return fail("Đường dẫn thiệp cưới không hợp lệ.", 400);
  }

  if (!photoId || (status !== "approved" && status !== "hidden" && status !== "pending")) {
    return fail("Trạng thái duyệt ảnh không hợp lệ.", 400);
  }

  const client = db();
  const { data: wedding, error } = await client
    .from("weddings")
    .select("id, slug, owner_id, content")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  if (!wedding) {
    return fail("Không tìm thấy thiệp cưới.", 404);
  }

  // Kiểm tra quyền: Cookie mã PIN hợp lệ HOẶC chủ sở hữu đã đăng nhập Auth0
  let isAuthorized = false;

  const cookiesHeader = req.headers.get("cookie") ?? "";
  const cookieMatch = cookiesHeader.match(new RegExp(`inviwedd_share_${slug}=([^;]+)`));
  const shareCookie = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

  if (shareCookie && (await verifyShareCookieValue(slug, shareCookie))) {
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

  const content = normalizeWeddingContent(wedding.content);
  const nextModeration = {
    ...(content.photoModeration || {}),
    [photoId]: status as "approved" | "hidden" | "pending",
  };

  const nextContent = {
    ...content,
    photoModeration: nextModeration,
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
