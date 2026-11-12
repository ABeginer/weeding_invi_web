import type { WeddingPlan } from "@/lib/types";

export interface PricingTier {
  id: WeddingPlan;
  name: string;
  price: string;
  tagline: string;
  badge?: string;
  pricePendingNote?: string;
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

// TODO: Chốt mức giá chính thức cho gói Pro và gói VIP trước khi mở bán.
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
    pricePendingNote: "Giá dự kiến — sẽ chốt chính thức sau",
    ctaLabel: "Chọn gói Pro",
    highlighted: true,
  },
  {
    id: "vip",
    name: "Gói Cao cấp (VIP)",
    price: "399.000đ",
    tagline: "Trọn bộ đặc quyền và mẫu độc quyền.",
    pricePendingNote: "Giá dự kiến — sẽ chốt chính thức sau",
    ctaLabel: "Chọn gói VIP",
  },
];

export const PRICING_ROWS: PricingRow[] = [
  {
    id: "guests",
    feature: "Số khách mời",
    values: {
      free: { text: "Tối đa 20 khách" },
      pro: { text: "Không giới hạn" },
      vip: { text: "Không giới hạn" },
    },
  },
  {
    id: "templates",
    feature: "Kho giao diện",
    values: {
      free: { text: "3–5 mẫu tối giản" },
      pro: { text: "Toàn bộ mẫu Pro" },
      vip: { text: "Toàn bộ mẫu Pro + mẫu độc quyền có hiệu ứng nâng cao" },
    },
  },
  {
    id: "domain",
    feature: "Tên miền",
    values: {
      free: { text: "Đường dẫn chung" },
      pro: { text: "Link gọn đẹp theo tên" },
      vip: { text: "Tên miền riêng", comingSoon: true },
    },
  },
  {
    id: "media",
    feature: "Thư viện ảnh và nhạc",
    values: {
      free: { text: "Tối đa 5 ảnh, 3 nhạc mặc định" },
      pro: { text: "Tối đa 30 ảnh HD, tải nhạc MP3 riêng" },
      vip: { text: "Ảnh không giới hạn, video pre-wedding", comingSoon: true },
    },
  },
  {
    id: "rsvp-wishes",
    feature: "Quản lý xác nhận tham dự và lời chúc",
    values: {
      free: { text: "Xem cơ bản" },
      pro: { text: "Xuất file Excel danh sách, lọc lời chúc" },
      vip: { text: "Excel + QR check-in tại tiệc", comingSoon: true },
    },
  },
  {
    id: "gift-qr",
    feature: "Mừng cưới QR",
    values: {
      free: { text: "Chỉ hiện thông tin chữ" },
      pro: { text: "Mã QR chuyển khoản tự điền", comingSoon: true },
      vip: { text: "Tùy biến giao diện hộp mừng cưới", comingSoon: true },
    },
  },
  {
    id: "retention",
    feature: "Thời gian lưu trữ",
    values: {
      free: { text: "30 ngày" },
      pro: { text: "1 năm" },
      vip: { text: "Vĩnh viễn" },
    },
  },
  {
    id: "branding",
    feature: "Logo thương hiệu",
    values: {
      free: { text: "Có logo nhỏ ở chân trang" },
      pro: { text: "Không có logo" },
      vip: { text: "Không có logo" },
    },
  },
];

