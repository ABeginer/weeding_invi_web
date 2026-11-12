import type { WeddingPlan } from "@/lib/types";
import type { TemplateId, WeddingTemplateMeta } from "./types";

export const TEMPLATE_REGISTRY: WeddingTemplateMeta[] = [
  {
    id: "basic-1",
    name: "Vườn Ô Liu",
    subtitle: "Thanh lịch · Cổ điển",
    description:
      "Phong cách tối giản với phong bì sáp olive, typography serif sang trọng và dải ảnh kỷ niệm ấm áp.",
    plan: "free",
    coverImage: "/templates/basic-1/cover.webp",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Giai điệu Vườn Ô Liu",
    },
    hasAdvancedEffects: false,
    accentSwatch: "#5E733F",
  },
  {
    id: "basic-2",
    name: "Trắng Ngà Tối Giản",
    subtitle: "Tinh gọn · Tạp chí",
    description:
      "Nền giấy kem ngà nhẹ mắt, đường kẻ champagne thanh mảnh và bố cục lịch tiệc cân đối hiện đại.",
    plan: "free",
    coverImage: "/templates/basic-2/cover.webp",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Bản tình ca Trắng Ngà",
    },
    hasAdvancedEffects: false,
    accentSwatch: "#C6A962",
  },
  {
    id: "basic-3",
    name: "Ánh Nắng Hoàng Hôn",
    subtitle: "Ấm áp · Lãng mạn",
    description:
      "Sắc hồng cát hoàng hôn kết hợp khung ảnh vòm cổ điển, mang lại cảm giác gần gũi và sâu lắng.",
    plan: "free",
    coverImage: "/templates/basic-3/cover.webp",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Khúc nhạc Hoàng Hôn",
    },
    hasAdvancedEffects: false,
    accentSwatch: "#8B4343",
  },
  {
    id: "pro-1",
    name: "Nhung Đen Ánh Kim",
    subtitle: "Cao cấp · Art Deco",
    description:
      "Nền nhung tối huyền bí điểm viền vàng ánh kim, hiệu ứng mở thiệp hai cánh và khung ảnh góc mạ vàng.",
    plan: "pro",
    coverImage: "/templates/pro-1/cover.webp",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Dạ khúc Ánh Kim",
    },
    hasAdvancedEffects: true,
    accentSwatch: "#D4AF37",
  },
  {
    id: "vip-1",
    name: "Ngọc Lục Bảo Độc Quyền",
    subtitle: "Độc quyền · Sắp ra mắt",
    description:
      "Mẫu VIP với hiệu ứng chiều sâu sân khấu và chữ lồng chuyển động nâng cao (đang hoàn thiện).",
    plan: "vip",
    coverImage: "/templates/vip-1/cover.webp",
    defaultMusic: {
      src: "/media/wedding.mp3",
      title: "Hòa âm Độc Quyền",
    },
    hasAdvancedEffects: true,
    isPlaceholder: true,
    accentSwatch: "#D4AF37",
  },
];

export const HERO_PREVIEW_TEMPLATES: WeddingTemplateMeta[] = TEMPLATE_REGISTRY.filter(
  (tpl) => !tpl.isPlaceholder
);

export const SELECTABLE_DASHBOARD_TEMPLATES: WeddingTemplateMeta[] =
  TEMPLATE_REGISTRY.filter((tpl) => !tpl.isPlaceholder);

export function getTemplateMeta(templateId: string): WeddingTemplateMeta | undefined {
  return TEMPLATE_REGISTRY.find((tpl) => tpl.id === templateId);
}

export function isImplementedTemplateId(templateId: string): templateId is Exclude<TemplateId, "vip-1"> {
  return (
    templateId === "basic-1" ||
    templateId === "basic-2" ||
    templateId === "basic-3" ||
    templateId === "pro-1"
  );
}

const PLAN_RANK: Record<WeddingPlan, number> = {
  free: 0,
  pro: 1,
  vip: 2,
};

export function canPlanUseTemplate(
  userPlan: WeddingPlan,
  templatePlan: WeddingPlan
): boolean {
  return PLAN_RANK[userPlan] >= PLAN_RANK[templatePlan];
}

