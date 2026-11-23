import { safeEqual } from "../safe-equal.ts";

export const PAYOS_API_URL = "https://api-merchant.payos.vn/v2/payment-requests";

export interface PayosCreatePaymentParams {
  orderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayosPaymentLinkData {
  bin: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  description: string;
  orderCode: number;
  currency: string;
  paymentLinkId: string;
  status: string;
  checkoutUrl: string;
  qrCode: string;
}

export interface PayosWebhookData {
  orderCode: number;
  amount: number;
  description: string;
  accountNumber: string;
  reference: string;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  code: string;
  desc: string;
  counterAccountBankId?: string | null;
  counterAccountBankName?: string | null;
  counterAccountName?: string | null;
  counterAccountNumber?: string | null;
  virtualAccountName?: string | null;
  virtualAccountNumber?: string | null;
}

export interface PayosWebhookPayload {
  code: string;
  desc: string;
  success: boolean;
  data: PayosWebhookData;
  signature: string;
}

export interface PayosConfig {
  clientId: string;
  apiKey: string;
  checksumKey: string;
}

export function getPayosConfig(): PayosConfig {
  const clientId = process.env.PAYOS_CLIENT_ID?.trim();
  const apiKey = process.env.PAYOS_API_KEY?.trim();
  const checksumKey = process.env.PAYOS_CHECKSUM_KEY?.trim();

  if (!clientId || !apiKey || !checksumKey) {
    throw new Error(
      "payOS configuration missing: PAYOS_CLIENT_ID, PAYOS_API_KEY, and PAYOS_CHECKSUM_KEY must be configured.",
    );
  }

  return { clientId, apiKey, checksumKey };
}

/**
 * Tạo chữ ký HMAC-SHA256 dạng hex chữ thường sử dụng Web Crypto API.
 * Tương thích 100% với Node.js 18+ và Cloudflare Workers / Edge Runtime.
 */
export async function createHmacSha256(key: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Sinh chuỗi và chữ ký HMAC-SHA256 để tạo liên kết thanh toán payOS.
 * Dữ liệu được sắp xếp theo thứ tự bảng chữ cái:
 * amount=${amount}&cancelUrl=${cancelUrl}&description=${description}&orderCode=${orderCode}&returnUrl=${returnUrl}
 */
export async function createPaymentLinkSignature(
  params: PayosCreatePaymentParams,
  checksumKey: string,
): Promise<string> {
  const rawString = `amount=${params.amount}&cancelUrl=${params.cancelUrl}&description=${params.description}&orderCode=${params.orderCode}&returnUrl=${params.returnUrl}`;
  return createHmacSha256(checksumKey, rawString);
}

/**
 * Gọi API payOS để tạo liên kết thanh toán VietQR tự động.
 */
export async function createPayosPaymentLink(
  params: PayosCreatePaymentParams,
  config?: PayosConfig,
): Promise<PayosPaymentLinkData> {
  const activeConfig = config || getPayosConfig();
  const signature = await createPaymentLinkSignature(params, activeConfig.checksumKey);

  const res = await fetch(PAYOS_API_URL, {
    method: "POST",
    headers: {
      "x-client-id": activeConfig.clientId,
      "x-api-key": activeConfig.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      orderCode: params.orderCode,
      amount: params.amount,
      description: params.description,
      cancelUrl: params.cancelUrl,
      returnUrl: params.returnUrl,
      signature,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`payOS API HTTP ${res.status}: ${errorText || res.statusText}`);
  }

  const json = (await res.json()) as {
    code: string;
    desc: string;
    data: PayosPaymentLinkData;
    signature?: string;
  };

  if (json.code !== "00") {
    throw new Error(`payOS error [${json.code}]: ${json.desc || "Không thể tạo liên kết thanh toán"}`);
  }

  return json.data;
}

/**
 * Sắp xếp các khóa trong đối tượng data theo thứ tự từ điển và ghép thành chuỗi URL query.
 * Quy tắc:
 * - Khóa sắp xếp A-Z
 * - Giá trị null hoặc undefined chuyển thành rỗng ""
 * - Giá trị object hoặc array chuyển qua JSON.stringify
 * - Giá trị nguyên thủy chuyển thành chuỗi
 */
export function sortAndStringifyData(data: Record<string, unknown>): string {
  const sortedKeys = Object.keys(data).sort();
  return sortedKeys
    .map((key) => {
      const val = data[key];
      if (val === null || val === undefined) {
        return `${key}=`;
      }
      if (typeof val === "object") {
        return `${key}=${JSON.stringify(val)}`;
      }
      return `${key}=${val}`;
    })
    .join("&");
}

/**
 * Xác minh tính hợp lệ của chữ ký webhook payOS với Checksum Key đã cho.
 */
export async function verifyPayosWebhookSignature(
  data: Record<string, unknown>,
  providedSignature: string,
  checksumKey: string,
): Promise<boolean> {
  if (!data || !providedSignature || !checksumKey) return false;
  const rawString = sortAndStringifyData(data);
  const expectedSignature = await createHmacSha256(checksumKey, rawString);
  return safeEqual(expectedSignature.toLowerCase(), providedSignature.toLowerCase());
}

/**
 * Xác minh chữ ký webhook payOS từ request body.
 */
export async function verifyPayosWebhook(
  payload: PayosWebhookPayload,
  checksumKeyOverride?: string,
): Promise<{ isValid: boolean; data: PayosWebhookData }> {
  if (!payload || !payload.data || !payload.signature) {
    return { isValid: false, data: payload?.data };
  }

  const checksumKey = checksumKeyOverride || getPayosConfig().checksumKey;
  const isValid = await verifyPayosWebhookSignature(
    payload.data as unknown as Record<string, unknown>,
    payload.signature,
    checksumKey,
  );

  return { isValid, data: payload.data };
}
