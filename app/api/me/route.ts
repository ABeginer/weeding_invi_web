import { parseBrandTheme } from "@/lib/brand-theme";
import { authRoute, json } from "@/lib/server/http";
import { db } from "@/lib/server/supabase";

function isMissingThemeColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  return code === "42703" || code === "PGRST204" || /theme/i.test(message);
}

export const POST = authRoute(async (_req, user) => {
  const client = db();
  const { data, error } = await client
    .from("users")
    .upsert({ id: user.id, email: user.email }, { onConflict: "id" })
    .select("id, email, theme, created_at")
    .single();

  if (error) {
    if (!isMissingThemeColumn(error)) {
      throw error;
    }
    // Dự phòng nếu migration_v5 chưa chạy trên DB
    const fallback = await client
      .from("users")
      .upsert({ id: user.id, email: user.email }, { onConflict: "id" })
      .select("id, email, created_at")
      .single();

    if (fallback.error) throw fallback.error;
    return json({
      id: fallback.data.id,
      email: fallback.data.email,
      createdAt: fallback.data.created_at,
    });
  }

  return json({
    id: data.id,
    email: data.email,
    theme: parseBrandTheme(data.theme),
    createdAt: data.created_at,
  });
});
