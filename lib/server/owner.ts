import { json } from "./http";
import { db } from "./supabase";

export type Plan = "free" | "pro" | "vip";
export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "PLAN_LIMIT";

export function coded(message: string, code: ErrorCode, status: number): Response {
  return json({ error: message, code }, status);
}

export function isPaid(plan: Plan): boolean {
  return plan === "pro" || plan === "vip";
}

export async function ownedWedding(
  userId: string,
  weddingId: string,
): Promise<{ id: string; plan: Plan } | null> {
  const { data, error } = await db()
    .from("weddings")
    .select("id, plan")
    .eq("id", weddingId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as { id: string; plan: Plan } | null) ?? null;
}
