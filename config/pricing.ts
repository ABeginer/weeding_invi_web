import type { WeddingPlan } from "@/lib/types";

export interface PricingTier {
  id: WeddingPlan;
  name: string;
  price: string;
  tagline: string;
  badge?: string;
  ctaLabel: string;
  highlighted?: boolean;
}

export interface PricingCell {
  text: string;
  comingSoon?: boolean;
}

export interface PricingRow {
  id: string;
  feature: string;
  values: Record<WeddingPlan, PricingCell>;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "free",
    name: "Gói Miễn phí",
    price: "0đ",
    tagline: "Dùng thử và đám cưới nhỏ.",
    ctaLabel: "Dùng miễn phí",
  },
  {
    id: "pro",
    name: "Gói Tiêu chuẩn (Pro)",
    price: "199.000đ",
    tagline: "Đầy đủ tính năng cho ngày trọng đại.",
    badge: "Phổ biến nhất",
    ctaLabel: "Chọn gói Pro",
    highlighted: true,
  },
  {
    id: "vip",
    name: "Gói Cao cấp (VIP)",
    price: "399.000đ",
    tagline: "Trọn bộ đặc quyền và mẫu độc quyền.",
    ctaLabel: "Chọn gói VIP",
  },
];

export const PRICING_ROWS: PricingRow[] = [
  {
    id: "guests",
    feature: "Khách mời",
    values: {
      free: { text: "Tối đa 20 khách" },
      pro: { text: "Không giới hạn tổng số khách" },
      vip: { text: "Không giới hạn tổng số khách" },
    },
  },
  {
    id: "templates",
    feature: "Mẫu thiệp",
    values: {
      free: { text: "3 mẫu" },
      pro: { text: "Tất cả mẫu Pro" },
      vip: { text: "Tất cả mẫu + mẫu độc quyền" },
    },
  },
  {
    id: "music",
    feature: "Nhạc nền",
    values: {
      free: { text: "3 bài có sẵn" },
      pro: { text: "Tải nhạc MP3 lên" },
      vip: { text: "Tải nhạc MP3 lên" },
    },
  },
  {
    id: "invitation-photos",
    feature: "Ảnh trên thiệp",
    values: {
      free: { text: "5 ảnh" },
      pro: { text: "30 ảnh HD" },
      vip: { text: "30 ảnh HD" },
    },
  },
  {
    id: "album-qr",
    feature: "Album QR cho khách",
    values: {
      free: { text: "Không có" },
      pro: { text: "30 ảnh" },
      vip: { text: "300 ảnh" },
    },
  },
  {
    id: "retention",
    feature: "Lưu trữ",
    values: {
      free: { text: "30 ngày" },
      pro: { text: "1 năm" },
      vip: { text: "Vĩnh viễn" },
    },
  },
  {
    id: "branding",
    feature: "Logo",
    values: {
      free: { text: "Có logo chân trang" },
      pro: { text: "Không logo" },
      vip: { text: "Không logo" },
    },
  },
  {
    id: "rsvp-export",
    feature: "Xuất danh sách khách ra Excel",
    values: {
      free: { text: "Không hỗ trợ" },
      pro: { text: "Sắp có", comingSoon: true },
      vip: { text: "Sắp có", comingSoon: true },
    },
  },
  {
    id: "gift-qr",
    feature: "Mừng cưới QR",
    values: {
      free: { text: "Chỉ hiện thông tin chữ" },
      pro: { text: "Sắp có", comingSoon: true },
      vip: { text: "Sắp có", comingSoon: true },
    },
  },
];

