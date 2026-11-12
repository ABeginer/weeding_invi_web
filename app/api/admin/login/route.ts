import { authClient, env } from "@/lib/server/supabase";
import { createSession } from "@/lib/server/session";
import { fail, json, readBody, route, text } from "@/lib/server/http";

const invalid = () => fail("Email hoặc mật khẩu không đúng.", 401);

export const POST = route(async (req: Request) => {
  const body = await readBody(req);
  const email = text(body?.email, 254)?.toLowerCase();
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password || password.length > 200) {
    return fail("Vui lòng nhập email và mật khẩu.");
  }

  if (email !== env("ADMIN_EMAIL").trim().toLowerCase()) return invalid();

  const { error } = await authClient().auth.signInWithPassword({ email, password });
  if (error) {
    console.error("login failed:", error.message);
    if (
      error.name === "AuthRetryableFetchError" ||
      error.status === 0 ||
      error.message === "fetch failed"
    ) {
      return fail(
        "Không thể kết nối tới máy chủ xác thực. Vui lòng kiểm tra cấu hình SUPABASE_URL và kết nối mạng.",
        503
      );
    }
    return invalid();
  }

  await createSession();
  return json({ ok: true });
});
