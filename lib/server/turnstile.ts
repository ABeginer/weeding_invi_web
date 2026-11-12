const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

let warnedMissingSecretInDev = false;

export interface TurnstileVerificationResult {
  ok: boolean;
  error?: string;
}

export async function verifyTurnstileToken(
  req: Request,
  rawToken: unknown,
): Promise<TurnstileVerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim() || "";

  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      if (!warnedMissingSecretInDev) {
        warnedMissingSecretInDev = true;
        console.warn(
          "[turnstile] TURNSTILE_SECRET_KEY chưa được cấu hình — bỏ qua kiểm tra trong môi trường dev.",
        );
      }
      return { ok: true };
    }
    console.error("[turnstile] TURNSTILE_SECRET_KEY chưa được cấu hình ở production.");
    return {
      ok: false,
      error: "Hệ thống xác thực chống spam chưa sẵn sàng. Vui lòng thử lại sau.",
    };
  }

  const token = typeof rawToken === "string" ? rawToken.trim() : "";
  if (!token) {
    return {
      ok: false,
      error: "Vui lòng hoàn tất xác thực chống spam rồi thử lại.",
    };
  }

  const remoteIp =
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";

  const form = new URLSearchParams();
  form.set("secret", secretKey);
  form.set("response", token);
  if (remoteIp) {
    form.set("remoteip", remoteIp);
  }

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return {
        ok: false,
        error: "Không thể xác thực chống spam lúc này. Vui lòng thử lại.",
      };
    }

    const data = (await res.json()) as { success?: boolean };
    if (!data?.success) {
      return {
        ok: false,
        error: "Xác thực chống spam không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Không thể kết nối xác thực chống spam. Vui lòng thử lại.",
    };
  }
}
