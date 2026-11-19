export const PLAN_PRICES: Record<"pro" | "vip", number> = {
  pro: 159000,
  vip: 399000,
};

export const PLAN_RANK: Record<"free" | "pro" | "vip", number> = {
  free: 0,
  pro: 1,
  vip: 2,
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newOrderCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let suffix = "";
  for (const b of bytes) suffix += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `INV-${suffix}`;
}

export function findOrderCode(description: string): string | null {
  const match = description.toUpperCase().match(/INV\s*-?\s*([A-Z0-9]{6})/);
  return match ? `INV-${match[1]}` : null;
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
