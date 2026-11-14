const BANK_IDS: Record<string, string> = {
  vietcombank: "vcb",
  vcb: "vcb",
  techcombank: "tcb",
  tcb: "tcb",
  "mbbank": "mb",
  mb: "mb",
  "mb bank": "mb",
  acb: "acb",
  bidv: "bidv",
  vietinbank: "vtb",
  vtb: "vtb",
  agribank: "agribank",
  sacombank: "sacombank",
  tpbank: "tpbank",
  vpbank: "vpbank",
  shb: "shb",
  vib: "vib",
  msb: "msb",
  ocb: "ocb",
  seabank: "seabank",
  cake: "cake",
};

export function resolveVietQrBankId(bankName: string): string | null {
  const normalized = bankName.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) return null;
  if (BANK_IDS[normalized]) return BANK_IDS[normalized];
  const compact = normalized.replace(/\s+/g, "");
  if (BANK_IDS[compact]) return BANK_IDS[compact];
  // Cho phép nhập thẳng mã ngân hàng (vcb, tcb, mb…).
  return /^[a-z0-9]{2,20}$/.test(compact) ? compact : null;
}

/** Bỏ dấu tiếng Việt để nội dung chuyển khoản không bị lỗi ngân hàng. */
export function toAsciiTransferText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface VietQrQuickLinkInput {
  bankName: string;
  accountNumber: string;
  accountName?: string;
  amountVnd?: number;
  addInfo?: string;
}

export function buildVietQrQuickLink(input: VietQrQuickLinkInput): string | null {
  const bankId = resolveVietQrBankId(input.bankName);
  const accountNumber = input.accountNumber.replace(/[^0-9A-Za-z]/g, "");
  if (!bankId || !accountNumber) return null;

  const params = new URLSearchParams();
  if (input.amountVnd && input.amountVnd > 0) {
    params.set("amount", String(Math.round(input.amountVnd)));
  }
  const addInfo = toAsciiTransferText(input.addInfo ?? "").slice(0, 50);
  if (addInfo) params.set("addInfo", addInfo);
  const accountName = toAsciiTransferText(input.accountName ?? "").slice(0, 50);
  if (accountName) params.set("accountName", accountName);

  const query = params.toString();
  return `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png${query ? `?${query}` : ""}`;
}
