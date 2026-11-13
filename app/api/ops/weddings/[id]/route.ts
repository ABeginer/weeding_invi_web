import { json } from "@/lib/server/http";
import { opsRoute } from "@/lib/server/ops";
import { coded } from "@/lib/server/owner";
import { db } from "@/lib/server/supabase";
import { isUuid } from "@/lib/server/validate";

export const GET = opsRoute(async (req, admin, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  if (!isUuid(id)) {
    return coded("Không tìm thấy thiệp cưới.", "NOT_FOUND", 404);
  }

  const client = db();

  const { data: wedding, error: weddingErr } = await client
    .from("weddings")
    .select("id, slug, plan, content, owner_id, created_at")
    .eq("id", id)
    .maybeSingle();

  if (weddingErr) throw weddingErr;
  if (!wedding) {
    return coded("Không tìm thấy thiệp cưới.", "NOT_FOUND", 404);
  }

  // Owner email
  const { data: user } = await client
    .from("users")
    .select("email")
    .eq("id", wedding.owner_id)
    .maybeSingle();

  // Guests count & accepted count
  const { data: guests } = await client
    .from("guests")
    .select("status")
    .eq("wedding_id", id);

  const guestCount = guests ? guests.length : 0;
  const acceptedCount = guests ? guests.filter((g) => g.status === "accepted").length : 0;

  // Photos count & album count
  const { data: photos } = await client
    .from("photos")
    .select("kind")
    .eq("wedding_id", id);

  const photoCount = photos ? photos.length : 0;
  const albumPhotoCount = photos ? photos.filter((p) => p.kind === "album").length : 0;

  const content = (wedding.content || {}) as {
    couple?: { groomName?: string; brideName?: string };
    suspended?: boolean;
  };
  const isSuspended =
    Boolean((wedding as { suspended?: boolean }).suspended) ||
    Boolean(content.suspended);

  const title =
    content.couple?.groomName && content.couple?.brideName
      ? `${content.couple.groomName} & ${content.couple.brideName}`
      : wedding.slug;

  return json({
    id: wedding.id,
    slug: wedding.slug,
    title,
    plan: wedding.plan,
    suspended: isSuspended,
    ownerEmail: user?.email || "",
    createdAt: wedding.created_at,
    guestCount,
    acceptedCount,
    photoCount,
    albumPhotoCount,
  });
});

