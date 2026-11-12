import { z } from "zod";
import { authRoute, fail, json, readBody } from "@/lib/server/http";
import { db } from "@/lib/server/supabase";

const themeBodySchema = z.object({
  theme: z.enum(["light", "dark"], {
    message: "Giá trị giao diện chỉ chấp nhận 'light' hoặc 'dark'.",
  }),
});

export const PATCH = authRoute(async (req, user) => {
  const body = await readBody(req);
  if (!body) return fail("Dữ liệu gửi lên không hợp lệ.");

  const parsed = themeBodySchema.safeParse(body);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ.");
  }

  const { data, error } = await db()
    .from("users")
    .upsert(
      { id: user.id, email: user.email, theme: parsed.data.theme },
      { onConflict: "id" },
    )
    .select("theme")
    .single();

  if (error) {
    console.error("[api/me/theme] Lỗi lưu theme:", error);
    return fail("Chưa lưu được vào tài khoản.", 500);
  }

  return json({ theme: data.theme });
});

