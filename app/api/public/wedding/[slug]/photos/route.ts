import { fail, json, route } from "@/lib/server/http";
import { rateLimit, tooManyRequests } from "@/lib/server/rate-limit";
import { toPhoto, type PhotoRow } from "@/lib/server/mappers";
import {
  buildPhotoStorageKey,
  deletePhotoObject,
  detectImageMimeFromBytes,
  putPhotoObject,
} from "@/lib/server/storage";
import { db } from "@/lib/server/supabase";
import { saveWishOnce } from "@/lib/server/wishes";
import { normalizeWeddingContent } from "@/lib/wedding-data";

type Ctx = { params: Promise<{ slug: string }> };

const MAX_GUEST_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB

export const POST = route(async (req: Request, { params }: Ctx) => {
  // Rate limit: Tối đa 25 lượt gửi ảnh trong 10 phút trên mỗi IP
  const limited = rateLimit(req, "guest-photo-upload", 25, 600_000);
  if (!limited.ok) return tooManyRequests(limited);

  const { slug } = await params;
  const client = db();

  const { data: wedding, error: weddingError } = await client
    .from("weddings")
    .select("id, slug, plan, content, suspended")
    .eq("slug", slug)
    .maybeSingle();

  if (weddingError || !wedding) {
    return fail("Không tìm thấy thiệp cưới.", 404);
  }

  if (wedding.suspended) {
    return fail("Thiệp cưới hiện đang tạm ngưng.", 403);
  }

  // Khóa tính năng album/LED nếu thiệp chưa nâng cấp gói VIP
  if (wedding.plan !== "vip") {
    return fail("Tính năng gửi ảnh lên màn hình LED chỉ khả dụng cho thiệp gói VIP.", 403);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return fail("Dữ liệu gửi lên không hợp lệ.", 400);
  }

  const fileEntry = formData.get("file");
  if (!fileEntry || !(fileEntry instanceof Blob)) {
    return fail("Vui lòng chọn ảnh cần gửi.", 400);
  }

  if (fileEntry.size > MAX_GUEST_PHOTO_BYTES) {
    return fail("Dung lượng ảnh tối đa là 10 MB.", 400);
  }

  const bytes = new Uint8Array(await fileEntry.arrayBuffer());
  const detectedMime = detectImageMimeFromBytes(bytes);
  if (!detectedMime) {
    return fail("Định dạng file không hợp lệ. Chỉ chấp nhận ảnh JPG, PNG hoặc WebP.", 400);
  }

  const guestName = (formData.get("guestName") as string)?.trim() || "";
  const wishMessage = (formData.get("wishMessage") as string)?.trim() || "";

  // Tính vị trí tiếp theo trong album
  const { data: existingRows } = await client
    .from("photos")
    .select("position")
    .eq("wedding_id", wedding.id)
    .eq("kind", "album");

  const currentRows = existingRows ?? [];
  const nextPosition =
    currentRows.reduce(
      (max, row) => Math.max(max, Number(row.position ?? 0)),
      -1,
    ) + 1;

  // Upload file lên Cloudflare R2 / Storage
  const storageKey = buildPhotoStorageKey(wedding.id, "album");
  await putPhotoObject(storageKey, bytes, detectedMime);

  // Thêm record vào bảng photos
  const { data: inserted, error: insertError } = await client
    .from("photos")
    .insert({
      wedding_id: wedding.id,
      kind: "album",
      storage_key: storageKey,
      position: nextPosition,
    })
    .select("*")
    .single();

  if (insertError) {
    await deletePhotoObject(storageKey).catch(() => undefined);
    throw insertError;
  }

  const photo = toPhoto(inserted as PhotoRow);
  const content = normalizeWeddingContent(wedding.content);
  const isAutoApprove = content.photoApprovalMode === "auto";

  // Cập nhật trạng thái duyệt vào content.photoModeration
  const nextModeration = {
    ...(content.photoModeration || {}),
    [photo.id]: isAutoApprove ? ("approved" as const) : ("pending" as const),
  };

  await client
    .from("weddings")
    .update({
      content: {
        ...content,
        photoModeration: nextModeration,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", wedding.id);

  // Nếu khách có để lại tên hoặc lời chúc, tự động lưu vào sổ lời chúc (Wishes)
  if (guestName || wishMessage) {
    try {
      await saveWishOnce(client, {
        weddingId: wedding.id,
        guestId: null,
        authorKey: null,
        name: guestName || "Khách mời tiệc cưới",
        message: wishMessage || "Chúc hai bạn trăm năm hạnh phúc, đầu bạc răng long!",
        autoApprove: isAutoApprove,
      });
    } catch (err) {
      console.warn("Không thể lưu kèm lời chúc từ khách gửi ảnh:", err);
    }
  }

  return json({
    ok: true,
    photo,
    autoApproved: isAutoApprove,
    message: isAutoApprove
      ? "Đã gửi ảnh thành công! Ảnh sẽ sớm xuất hiện trên màn hình tiệc cưới."
      : "Đã gửi ảnh thành công! Ảnh của bạn đang chờ duyệt và sẽ xuất hiện trên màn hình tiệc sau khi được duyệt.",
  });
});
