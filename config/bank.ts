import type { WeddingPlan } from "@/lib/types";

export interface BankTransferConfig {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  qrPlaceholderNote: string;
}

// TODO: Chủ thiệp điền thông tin tài khoản ngân hàng thật trước khi nhận thanh toán chuyển khoản.
export const BANK_TRANSFER_INFO: BankTransferConfig = {
  bankName: "",
  accountNumber: "",
  accountHolder: "",
  branch: "",
  qrPlaceholderNote:
    "Thông tin chuyển khoản đang được cập nhật. Chức năng kích hoạt gói tự động sẽ kết nối backend ở giai đoạn tiếp theo.",
};

export function generateTransferOrderCode(plan: Exclude<WeddingPlan, "free">): string {
  const prefix = plan === "vip" ? "KHVIP" : "KHPRO";
  const now = new Date();
  const yymmdd = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const suffix = String((now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) % 10000).padStart(4, "0");
  return `${prefix}-${yymmdd}-${suffix}`;
}

