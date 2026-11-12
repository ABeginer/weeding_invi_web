import { authRoute, fail, json, UUID_RE } from "@/lib/server/http";
import type { PhotoRow } from "@/lib/server/mappers";
import { deletePhotoObject } from "@/lib/server/storage";
import { db } from "@/lib/server/supabase";
import { getOwnedWedding } from "@/lib/server/weddings";
import { normalizeWeddingContent } from "@/lib/wedding-data";

type Ctx = { params: Promise<{ id: string; photoId: string }> };

export const DELETE = authRoute<Ctx>(async (_req, user, { params }) => {
  const { id, photoId } = await params;
  const wedding = await getOwnedWedding(id, user.id);
  if (!wedding) return fail("Không tìm thấy thiệp cưới.", 404);
  if (!UUID_RE.test(photoId)) return fail("Không tìm thấy ảnh.", 404);

  const client = db();
  const { data: photoRow, error: deleteError } = await client
    .from("photos")
    .delete()
    .eq("id", photoId)
    .eq("wedding_id", wedding.id)
    .select("*")
    .maybeSingle();

  if (deleteError) throw deleteError;
  if (!photoRow) return fail("Không tìm thấy ảnh.", 404);

  const deletedPhoto = photoRow as PhotoRow;
  await deletePhotoObject(deletedPhoto.storage_key);

  const currentContent = normalizeWeddingContent(wedding.content);
  const nextContent = {
    ...currentContent,
    heroPhotoId:
      currentContent.heroPhotoId === photoId ? null : currentContent.heroPhotoId,
    groomPhotoId:
      currentContent.groomPhotoId === photoId ? null : currentContent.groomPhotoId,
    bridePhotoId:
      currentContent.bridePhotoId === photoId ? null : currentContent.bridePhotoId,
  };

  if (
    nextContent.heroPhotoId !== currentContent.heroPhotoId ||
    nextContent.groomPhotoId !== currentContent.groomPhotoId ||
    nextContent.bridePhotoId !== currentContent.bridePhotoId
  ) {
    const { error: updateError } = await client
      .from("weddings")
      .update({
        content: nextContent,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wedding.id)
      .eq("owner_id", user.id);

    if (updateError) throw updateError;
  }

  return json({ ok: true, content: nextContent });
});

