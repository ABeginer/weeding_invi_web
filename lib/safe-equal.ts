/**
 * So sánh hai chuỗi theo thời gian bất biến (constant-time comparison)
 * Ngăn chặn timing attack trên các token xác thực và chữ ký HMAC.
 */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
