export interface RitualTemplateConfig {
  id: string;
  ritualKey: "an-hoi" | "gia-tien" | "vu-quy";
  ritualLabel: string;
  name: string;
  styleTags: string[];
  description: string;
}

export const RITUAL_TEMPLATES_CONFIG: RitualTemplateConfig[] = [
  {
    id: "ritual-an-hoi",
    ritualKey: "an-hoi",
    ritualLabel: "Ăn hỏi",
    name: "Lễ ăn hỏi",
    styleTags: ["Nghi lễ truyền thống", "Trang trọng"],
    description: "", // Để trống cho chủ sở hữu điền
  },
  {
    id: "ritual-gia-tien",
    ritualKey: "gia-tien",
    ritualLabel: "Gia tiên",
    name: "Lễ gia tiên",
    styleTags: ["Gia đình", "Ấm cúng"],
    description: "", // Để trống cho chủ sở hữu điền
  },
  {
    id: "ritual-vu-quy",
    ritualKey: "vu-quy",
    ritualLabel: "Vu quy",
    name: "Lễ vu quy",
    styleTags: ["Nhà gái", "Thanh lịch"],
    description: "", // Để trống cho chủ sở hữu điền
  },
];

