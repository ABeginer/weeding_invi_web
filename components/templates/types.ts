import type { WeddingPlan } from "@/lib/types";

/** Dữ liệu mẫu thiệp được truyền từ server page xuống carousel/popup. */
export interface CollectionTemplate {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  plan: WeddingPlan;
  previewImage: string;
  snapshotImage: string;
  demoUrl?: string;
  isPlaceholder?: boolean;
  extraFeatureIds?: string[];
}
