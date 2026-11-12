import type { AuthUser } from "./auth";
import { UUID_RE } from "./http";
import type { WeddingRow } from "./mappers";
import { db } from "./supabase";

export async function ensureUserRecord(user: AuthUser): Promise<void> {
  const { error } = await db()
    .from("users")
    .upsert({ id: user.id, email: user.email }, { onConflict: "id" });

  if (error) throw error;
}

export async function getOwnedWedding(
  weddingId: string,
  ownerId: string,
): Promise<WeddingRow | null> {
  if (!UUID_RE.test(weddingId)) return null;

  const { data, error } = await db()
    .from("weddings")
    .select("*")
    .eq("id", weddingId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) throw error;
  return (data as WeddingRow | null) ?? null;
}

