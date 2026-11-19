/**
 * Sinh và kiểm tra mã token bảo mật cho màn hình LED (không cần migration DB)
 * Sử dụng HMAC-SHA256 chuẩn Web Crypto API (100% Edge / Cloudflare Workers safe).
 */
const LED_SECRET =
  process.env.LED_TOKEN_SECRET || "inviwedd-led-secret-token-key-2026";

export async function generateLedToken(weddingIdOrSlug: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(LED_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(weddingIdOrSlug));
  const hashArray = Array.from(new Uint8Array(signature));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex.slice(0, 12);
}

export async function verifyLedToken(
  weddingIdOrSlug: string,
  candidateToken: string | null | undefined,
): Promise<boolean> {
  if (!candidateToken || typeof candidateToken !== "string") return false;
  const expected = await generateLedToken(weddingIdOrSlug);
  return candidateToken.trim().toLowerCase() === expected.toLowerCase();
}
