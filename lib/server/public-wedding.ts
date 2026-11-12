import { SLUG_RE } from "./http";
import { db } from "./supabase";
import { mergeWeddingContent } from "../wedding-content";
import { validateWeddingSlug } from "../wedding-slug";
import type { WeddingContent } from "../types";

export interface PublicWeddingData {
  slug: string;
  templateId: string;
  content: WeddingContent;
}

export async function getPublicWeddingBySlug(
  slug: string,
): Promise<PublicWeddingData | null> {
  const slugCheck = validateWeddingSlug(slug);
  if (!slugCheck.valid) return null;

  const { data, error } = await db()
    .from("weddings")
    .select("slug, template_id, content")
    .eq("slug", slugCheck.slug)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    slug: data.slug,
    templateId: data.template_id,
    content: mergeWeddingContent(data.content),
  };
}

export async function getPublicWeddingByGuestSlug(
  guestSlug: string,
): Promise<PublicWeddingData | null> {
  if (!SLUG_RE.test(guestSlug)) return null;

  const client = db();
  const { data: guest, error: guestError } = await client
    .from("guests")
    .select("wedding_id")
    .eq("slug", guestSlug)
    .maybeSingle();

  if (guestError) throw guestError;
  if (!guest?.wedding_id) return null;

  const { data: wedding, error: weddingError } = await client
    .from("weddings")
    .select("slug, template_id, content")
    .eq("id", guest.wedding_id)
    .maybeSingle();

  if (weddingError) throw weddingError;
  if (!wedding) return null;

  return {
    slug: wedding.slug,
    templateId: wedding.template_id,
    content: mergeWeddingContent(wedding.content),
  };
}

