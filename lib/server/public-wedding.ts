import { SLUG_RE } from "./http";
import { db } from "./supabase";
import { normalizeWeddingContent } from "../wedding-data";
import { validateWeddingSlug } from "../wedding-slug";
import type {
  WeddingContent,
  WeddingEvent,
  WeddingPhoto,
  WeddingPlan,
} from "../types";
import { getGuestVisibleEvents, isMissingSuspendedColumn, isWeddingSuspendedRow, listWeddingEvents, listWeddingPhotos } from "./weddings";

interface PublicWeddingRow {
  id: string;
  slug: string;
  template_id: string;
  plan: string | null;
  content: unknown;
  suspended?: boolean | null;
}


export interface PublicWeddingData {
  slug: string;
  templateId: string;
  plan: WeddingPlan;
  content: WeddingContent;
  events: WeddingEvent[];
  photos: WeddingPhoto[];
}

export interface PublicGuestWeddingData extends PublicWeddingData {
  guestName: string;
}

export async function getPublicWeddingBySlug(
  slug: string,
): Promise<PublicWeddingData | null> {
  const slugCheck = validateWeddingSlug(slug);
  if (!slugCheck.valid) return null;

  const client = db();
  let row: PublicWeddingRow | null = null;

  const { data, error } = await client
    .from("weddings")
    .select("id, slug, template_id, plan, content, suspended")
    .eq("slug", slugCheck.slug)
    .maybeSingle();

  if (error) {
    if (!isMissingSuspendedColumn(error)) throw error;
    const fallback = await client
      .from("weddings")
      .select("id, slug, template_id, plan, content")
      .eq("slug", slugCheck.slug)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    row = (fallback.data as PublicWeddingRow | null) ?? null;
  } else {
    row = (data as PublicWeddingRow | null) ?? null;
  }

  if (!row) return null;
  // Thiệp bị ops tạm khoá thì coi như không tồn tại với khách.
  if (isWeddingSuspendedRow(row)) return null;

  const [events, photos] = await Promise.all([
    listWeddingEvents(row.id),
    listWeddingPhotos(row.id),
  ]);

  return {
    slug: row.slug,
    templateId: row.template_id,
    plan: (row.plan as WeddingPlan) ?? "free",
    content: normalizeWeddingContent(row.content),
    events,
    photos,
  };
}

export async function getPublicWeddingByGuestSlug(
  guestSlug: string,
): Promise<PublicGuestWeddingData | null> {
  if (!SLUG_RE.test(guestSlug)) return null;

  const client = db();
  const { data: guest, error: guestError } = await client
    .from("guests")
    .select("id, wedding_id, name")
    .eq("slug", guestSlug)
    .maybeSingle();

  if (guestError) throw guestError;
  if (!guest?.wedding_id) return null;

  let wedding: PublicWeddingRow | null = null;

  const { data: weddingData, error: weddingError } = await client
    .from("weddings")
    .select("id, slug, template_id, plan, content, suspended")
    .eq("id", guest.wedding_id)
    .maybeSingle();

  if (weddingError) {
    if (!isMissingSuspendedColumn(weddingError)) throw weddingError;
    const fallback = await client
      .from("weddings")
      .select("id, slug, template_id, plan, content")
      .eq("id", guest.wedding_id)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    wedding = (fallback.data as PublicWeddingRow | null) ?? null;
  } else {
    wedding = (weddingData as PublicWeddingRow | null) ?? null;
  }

  if (!wedding) return null;
  if (isWeddingSuspendedRow(wedding)) return null;

  const [events, photos] = await Promise.all([
    getGuestVisibleEvents(wedding.id, guest.id),
    listWeddingPhotos(wedding.id),
  ]);

  return {
    slug: wedding.slug,
    templateId: wedding.template_id,
    plan: (wedding.plan as WeddingPlan) ?? "free",
    content: normalizeWeddingContent(wedding.content),
    events,
    photos,
    guestName: guest.name,
  };
}
