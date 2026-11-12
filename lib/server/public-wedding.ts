import { SLUG_RE } from "./http";
import { db } from "./supabase";
import { normalizeWeddingContent } from "../wedding-data";
import { validateWeddingSlug } from "../wedding-slug";
import type { WeddingContent, WeddingEvent, WeddingPhoto } from "../types";
import { getGuestVisibleEvents, listWeddingEvents, listWeddingPhotos } from "./weddings";

export interface PublicWeddingData {
  slug: string;
  templateId: string;
  content: WeddingContent;
  events: WeddingEvent[];
  photos: WeddingPhoto[];
}

export async function getPublicWeddingBySlug(
  slug: string,
): Promise<PublicWeddingData | null> {
  const slugCheck = validateWeddingSlug(slug);
  if (!slugCheck.valid) return null;

  const { data, error } = await db()
    .from("weddings")
    .select("id, slug, template_id, content")
    .eq("slug", slugCheck.slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const [events, photos] = await Promise.all([
    listWeddingEvents(data.id),
    listWeddingPhotos(data.id),
  ]);

  return {
    slug: data.slug,
    templateId: data.template_id,
    content: normalizeWeddingContent(data.content),
    events,
    photos,
  };
}

export async function getPublicWeddingByGuestSlug(
  guestSlug: string,
): Promise<PublicWeddingData | null> {
  if (!SLUG_RE.test(guestSlug)) return null;

  const client = db();
  const { data: guest, error: guestError } = await client
    .from("guests")
    .select("id, wedding_id")
    .eq("slug", guestSlug)
    .maybeSingle();

  if (guestError) throw guestError;
  if (!guest?.wedding_id) return null;

  const { data: wedding, error: weddingError } = await client
    .from("weddings")
    .select("id, slug, template_id, content")
    .eq("id", guest.wedding_id)
    .maybeSingle();

  if (weddingError) throw weddingError;
  if (!wedding) return null;

  const [events, photos] = await Promise.all([
    getGuestVisibleEvents(wedding.id, guest.id),
    listWeddingPhotos(wedding.id),
  ]);

  return {
    slug: wedding.slug,
    templateId: wedding.template_id,
    content: normalizeWeddingContent(wedding.content),
    events,
    photos,
  };
}
