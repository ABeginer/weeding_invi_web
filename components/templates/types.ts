import type { WeddingPlan } from "@/lib/types";
import type { TemplateCategory, TemplateColorGroup } from "@/templates/types";

/** Dữ liệu mẫu thiệp được truyền từ server page xuống carousel/popup. */
export interface CollectionTemplate {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  plan: WeddingPlan;
  category?: TemplateCategory;
  color?: TemplateColorGroup;
  previewImage: string;
  snapshotImage: string;
  demoUrl?: string;
  /** URL nhúng chỉ-thiệp cho hover/popup (designer dùng /mau/designer/<id>/embed). */
  embedUrl?: string;
  /** "code" = template registry; "designer" = published designer template. */
  kind?: "code" | "designer";
  /** Version đã publish với mẫu designer. */
  version?: number;
  isPlaceholder?: boolean;
  extraFeatureIds?: string[];
  ritualLabel?: string;
  styleTags?: string[];
}
