export type GuestStatus = "pending" | "accepted" | "declined";

export interface Guest {
  id: string;
  name: string;
  slug: string; // chuỗi ngẫu nhiên, dùng trong link /m/[slug]
  status: GuestStatus;
  respondedAt: string | null; // ISO
  createdAt: string; // ISO
}

export interface Wish {
  id: string;
  guestId: string | null; // null nếu gửi từ trang chung
  name: string;
  message: string;
  createdAt: string;
}

export interface Stats {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  wishes: number;
}

