import {
  getPhotoLimitMessage,
  getPlanLimits,
  UPLOAD_ALLOWED_MIME_TYPES,
  UPLOAD_MAX_BYTES,
  type AllowedUploadMimeType,
} from "@/config/plans";
import { authRoute, fail, json } from "@/lib/server/http";
import { toPhoto, type PhotoRow } from "@/lib/server/mappers";
import {
  buildPhotoStorageKey,
  deletePhotoObject,
  detectImageMimeFromBytes,
  putPhotoObject,
} from "@/lib/server/storage";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding, listWeddingPhotos } from "@/lib/server/weddings";
import { normalizeWeddingContent } from "@/lib/wedding-data";
import {
  reorderPositionsSchema,
  type PhotoKind,
  type PhotoSlot,
} from "@/lib/wedding-types";

type Ctx = { params: Promise<{ id: string }> };

const VALID_KINDS = new Set<PhotoKind>(["banner", "couple", "gallery", "og", "gift"]);
const VALID_SLOTS = new Set<PhotoSlot>([
  "hero",
  "groom",
  "bride",
  "og",
  "gift-groom",
  "gift-bride",
]);

function isAllowedMime(value: string): value is AllowedUploadMimeType {
  return (UPLOAD_ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}

export const GET = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  const photos = await listWeddingPhotos(wedding.id);
  return json(photos);
});

export const POST = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return fail("Yêu cầu phải gửi dạng multipart/form-data.");
  }

  const rawKind = formData.get("kind");
  const kind =
    typeof rawKind === "string" && VALID_KINDS.has(rawKind as PhotoKind)
      ? (rawKind as PhotoKind)
      : null;

  if (!kind) {
    return fail("Loại ảnh (kind) phải là banner, couple, gallery, og hoặc gift.");
  }

  const rawSlot = formData.get("slot");
  const slot =
    typeof rawSlot === "string" && VALID_SLOTS.has(rawSlot as PhotoSlot)
      ? (rawSlot as PhotoSlot)
      : null;

  if (kind === "gift" && slot !== "gift-groom" && slot !== "gift-bride") {
    return fail("Ảnh QR quà mừng cần chọn vị trí nhà trai (gift-groom) hoặc nhà gái (gift-bride).");
  }

  const fileEntry = formData.get("file");
  if (
    !fileEntry ||
    typeof fileEntry === "string" ||
    typeof fileEntry.arrayBuffer !== "function"
  ) {
    return fail("Vui lòng chọn file ảnh để tải lên.");
  }

  if (fileEntry.size <= 0) {
    return fail("File ảnh rỗng.");
  }

  if (fileEntry.size > UPLOAD_MAX_BYTES) {
    return fail("Ảnh tải lên vượt quá dung lượng tối đa 5 MB.");
  }

  if (!isAllowedMime(fileEntry.type)) {
    return fail("Chỉ hỗ trợ định dạng ảnh JPG, PNG hoặc WebP.");
  }

  const client = db();
  const { data: existingRows, error: listError } = await client
    .from("photos")
    .select("id, position, storage_key")
    .eq("wedding_id", wedding.id)
    .eq("kind", kind);

  if (listError) throw listError;

  const maxForKind = getPlanLimits(wedding.plan).photos[kind];
  const currentRows = existingRows ?? [];

  if (maxForKind <= 0) {
    return fail(getPhotoLimitMessage(wedding.plan, kind), 403);
  }

  const replaceTargetIds = new Set<string>();
  const replaceStorageKeys: string[] = [];

  // Ảnh "một chỗ" (bìa, chân dung, OG, QR) được thay thế ngay trên máy chủ:
  // upload mới trước, chỉ xoá ảnh cũ sau khi insert thành công.
  const currentContent = normalizeWeddingContent(wedding.content);

  const slotPhotoId =
    kind === "banner" && slot === "hero"
      ? currentContent.heroPhotoId
      : kind === "couple" && slot === "groom"
        ? currentContent.groomPhotoId
        : kind === "couple" && slot === "bride"
          ? currentContent.bridePhotoId
          : null;

  const fallbackPosition: number | null =
    kind === "og"
      ? 0
      : kind === "gift"
        ? slot === "gift-groom"
          ? 0
          : 1
        : kind === "banner" && slot === "hero"
          ? 0
          : kind === "couple" && slot === "groom"
            ? 0
            : kind === "couple" && slot === "bride"
              ? 1
              : null;

  const isSingleSlot = kind === "og" || fallbackPosition !== null;

  let rowsToReplace: typeof currentRows = [];

  if (kind === "og") {
    rowsToReplace = currentRows;
  } else if (slotPhotoId) {
    // Ưu tiên id mà content đang tham chiếu: dữ liệu cũ có thể lưu ảnh ở
    // position khác 0/1 nên không thể chỉ dựa vào position.
    rowsToReplace = currentRows.filter((row) => String(row.id) === slotPhotoId);
    if (rowsToReplace.length === 0 && fallbackPosition !== null) {
      rowsToReplace = currentRows.filter(
        (row) => Number(row.position) === fallbackPosition,
      );
    }
  } else if (fallbackPosition !== null) {
    rowsToReplace = currentRows.filter(
      (row) => Number(row.position) === fallbackPosition,
    );
  }

  if (isSingleSlot) {
    for (const row of rowsToReplace) {
      replaceTargetIds.add(String(row.id));
      if (row.storage_key) replaceStorageKeys.push(String(row.storage_key));
    }
    const remainingCount = currentRows.length - rowsToReplace.length;
    if (remainingCount >= maxForKind) {
      return fail(getPhotoLimitMessage(wedding.plan, kind), 403);
    }
  } else if (currentRows.length >= maxForKind) {
    return fail(getPhotoLimitMessage(wedding.plan, kind), 403);
  }

  const bytes = new Uint8Array(await fileEntry.arrayBuffer());
  if (bytes.byteLength > UPLOAD_MAX_BYTES) {
    return fail("Ảnh tải lên vượt quá dung lượng tối đa 5 MB.");
  }

  const detectedMime = detectImageMimeFromBytes(bytes);
  if (!detectedMime) {
    return fail("Nội dung file không phải ảnh JPG, PNG hoặc WebP hợp lệ.");
  }

  const nextPosition =
    rowsToReplace.length > 0
      ? Number(rowsToReplace[0].position ?? 0)
      : fallbackPosition !== null
        ? fallbackPosition
        : currentRows.reduce(
            (max, row) => Math.max(max, Number(row.position ?? 0)),
            -1,
          ) + 1;

  const storageKey = buildPhotoStorageKey(wedding.id, kind);
  await putPhotoObject(storageKey, bytes, detectedMime);

  const { data: inserted, error: insertError } = await client
    .from("photos")
    .insert({
      wedding_id: wedding.id,
      kind,
      storage_key: storageKey,
      position: nextPosition,
    })
    .select("*")
    .single();

  if (insertError) {
    await deletePhotoObject(storageKey).catch(() => undefined);
    throw insertError;
  }

  if (replaceTargetIds.size > 0) {
    await client
      .from("photos")
      .delete()
      .eq("wedding_id", wedding.id)
      .in("id", Array.from(replaceTargetIds));
    await Promise.allSettled(
      replaceStorageKeys.map((key) => deletePhotoObject(key)),
    );
  }

  const photo = toPhoto(inserted as PhotoRow);
  let updatedContent = normalizeWeddingContent(wedding.content);

  if (
    (kind === "banner" && slot === "hero") ||
    (kind === "couple" && (slot === "groom" || slot === "bride"))
  ) {
    const fieldKey =
      slot === "hero"
        ? "heroPhotoId"
        : slot === "groom"
          ? "groomPhotoId"
          : "bridePhotoId";

    updatedContent = {
      ...updatedContent,
      [fieldKey]: photo.id,
    };

    const { error: contentError } = await client
      .from("weddings")
      .update({
        content: updatedContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wedding.id)
      .eq("owner_id", user.id);

    if (contentError) throw contentError;
  }

  return json({ photo, content: updatedContent }, 201);
});

export const PATCH = authRoute<Ctx>(async (req, user, { params }) => {
  const { id } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);

  let rawJson: unknown = null;
  try {
    rawJson = await req.json();
  } catch {
    return fail("Dữ liệu sắp xếp ảnh không hợp lệ.");
  }

  const candidate = Array.isArray(rawJson)
    ? rawJson
    : rawJson && typeof rawJson === "object" && "items" in rawJson
      ? (rawJson as { items: unknown }).items
      : null;

  const parsed = reorderPositionsSchema.safeParse(candidate);
  if (!parsed.success) {
    return fail(
      parsed.error.issues[0]?.message ?? "Danh sách sắp xếp ảnh không hợp lệ.",
    );
  }

  const items = parsed.data;
  const client = db();
  const { data: galleryRows, error: checkError } = await client
    .from("photos")
    .select("id")
    .eq("wedding_id", wedding.id)
    .eq("kind", "gallery");

  if (checkError) throw checkError;
  const ownedGalleryIds = new Set(
    (galleryRows ?? []).map((row) => String(row.id)),
  );
  if (items.some((item) => !ownedGalleryIds.has(item.id))) {
    return fail("Có ảnh không thuộc thư viện của thiệp này.", 404);
  }

  await Promise.all(
    items.map(async (item) => {
      const { error } = await client
        .from("photos")
        .update({ position: item.position })
        .eq("id", item.id)
        .eq("wedding_id", wedding.id);
      if (error) throw error;
    }),
  );

  const photos = await listWeddingPhotos(wedding.id);
  return json(photos);
});

