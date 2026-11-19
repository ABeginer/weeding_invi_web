import type { WeddingPlan } from "@/lib/types";
import { getTemplateCollection } from "@/templates/registry";

const AVAILABLE_TEMPLATES = getTemplateCollection().filter(
  (template) => !template.isPlaceholder,
);
const FREE_TEMPLATE_COUNT = AVAILABLE_TEMPLATES.filter(
  (template) => template.plan === "free",
).length;
const TOTAL_TEMPLATE_COUNT = AVAILABLE_TEMPLATES.length;

export interface PricingTier {
  id: WeddingPlan;
  name: string;
  price: string;
  originalPrice?: string;
  promoNote?: string;
  tagline: string;
  badge?: string;
  ctaLabel: string;
  highlighted?: boolean;
  /** Ẩn khỏi bảng giá/CTA nhưng vẫn giữ dữ liệu cho khách VIP cũ. */
  hidden?: boolean;
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
    tagline: "Trải nghiệm đầy đủ trước khi quyết định.",
    ctaLabel: "Dùng miễn phí",
  },
  {
    id: "pro",
    name: "Gói Pro",
    price: "159.000đ",
    originalPrice: "199.000đ",
    promoNote: "Ưu đãi giai đoạn ra mắt",
    tagline: "Trọn vẹn cho khâu mời cưới & chốt mâm tiệc.",
    badge: "PHỔ BIẾN NHẤT",
    ctaLabel: "Chọn gói Pro",
    highlighted: true,
  },
  {
    id: "vip",
    name: "Gói VIP",
    price: "399.000đ",
    originalPrice: "499.000đ",
    promoNote: "Ưu đãi giai đoạn ra mắt",
    tagline: "Đẳng cấp & tương tác trực tiếp tại nhà hàng.",
    badge: "TRẢI NGHIỆM SẢNH TIỆC",
    ctaLabel: "Chọn gói VIP",
  },
];

export const VIP_SALES_ENABLED = true;

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
      free: { text: `${FREE_TEMPLATE_COUNT} mẫu miễn phí` },
      pro: { text: `Toàn bộ ${TOTAL_TEMPLATE_COUNT} mẫu hiện có` },
      vip: { text: `Toàn bộ ${TOTAL_TEMPLATE_COUNT} mẫu hiện có` },
    },
  },
  {
    id: "music",
    feature: "Nhạc nền",
    values: {
      free: { text: "Nhạc nền có sẵn theo mẫu" },
      pro: { text: "Nhạc nền có sẵn theo mẫu" },
      vip: { text: "Nhạc nền có sẵn theo mẫu" },
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
    id: "views",
    feature: "Lượt xem thiệp",
    values: {
      free: { text: "Không giới hạn" },
      pro: { text: "Không giới hạn" },
      vip: { text: "Không giới hạn" },
    },
  },
  {
    id: "retention",
    feature: "Lưu trữ",
    values: {
      free: { text: "6 tháng" },
      pro: { text: "1 năm" },
      vip: { text: "Vĩnh viễn" },
    },
  },
  {
    id: "rsvp-export",
    feature: "Xuất danh sách khách ra Excel",
    values: {
      free: { text: "Không hỗ trợ" },
      pro: { text: "CSV mở bằng Excel (UTF-8)" },
      vip: { text: "CSV mở bằng Excel (UTF-8)" },
    },
  },
  {
    id: "gift-qr",
    feature: "Mừng cưới QR",
    values: {
      free: { text: "Chỉ hiện thông tin chữ" },
      pro: { text: "2 ảnh QR (nhà trai & nhà gái)" },
      vip: { text: "2 ảnh QR (nhà trai & nhà gái)" },
    },
  },
];

