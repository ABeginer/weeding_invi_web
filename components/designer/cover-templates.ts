import type { DesignerCover, DesignerCoverTemplate } from "@/components/ops/designer-types";

export interface DesignerCoverOption {
  id: DesignerCoverTemplate;
  name: string;
  description: string;
}

export const DESIGNER_COVER_OPTIONS: DesignerCoverOption[] = [
  {
    id: "split",
    name: "Rèm đôi",
    description: "Kéo hai bên hoặc bấm mở thiệp.",
  },
  {
    id: "card",
    name: "Thiệp mở",
    description: "Bấm mở như mở tấm thiệp giấy.",
  },
  {
    id: "fade",
    name: "Mờ dần",
    description: "Bấm mở, nền bìa mờ dần rồi vào nội dung.",
  },
];

export const DEFAULT_DESIGNER_COVER: DesignerCover = {
  template: "split",
  icon: "Heart",
  title: "Trân trọng kính mời",
  subtitle: "Thiệp mời cưới",
  buttonLabel: "Mở thiệp",
};

export function createDefaultCover(
  template: DesignerCoverTemplate = "split",
): DesignerCover {
  return { ...DEFAULT_DESIGNER_COVER, template };
}
