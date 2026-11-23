import { safeEqual } from "./safe-equal.ts";

/**
 * Quản lý xác thực mã PIN cho link chia sẻ trợ lý / người thân (/share/[slug])
 * Sử dụng HMAC-SHA256 chuẩn Web Crypto API (100% Edge / Cloudflare Workers safe).
 */
function getShareSecret(): string {
  const secret = process.env.SHARE_TOKEN_SECRET?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SHARE_TOKEN_SECRET must be configured in production.");
    }
    return "dev-inviwedd-family-share-secret-2026";
  }
  return secret;
}

export { safeEqual };

export async function createShareCookieValue(slug: string): Promise<string> {
  const enc = new TextEncoder();
  const timestamp = Date.now().toString();
  const payload = `${slug}:${timestamp}`;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getShareSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const hex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${timestamp}.${hex}`;
}

export async function verifyShareCookieValue(
  slug: string,
  cookieValue: string | null | undefined,
): Promise<boolean> {
  if (!cookieValue || typeof cookieValue !== "string") return false;
  const parts = cookieValue.split(".");
  if (parts.length !== 2) return false;
  const [timestampStr, providedHex] = parts;
  const timestamp = Number(timestampStr);
  if (Number.isNaN(timestamp)) return false;

  // Hết hạn sau 7 ngày (7 * 24 * 60 * 60 * 1000)
  if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) return false;

  const enc = new TextEncoder();
  const payload = `${slug}:${timestampStr}`;
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(getShareSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const expectedHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return safeEqual(expectedHex, providedHex);
}
