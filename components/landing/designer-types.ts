import type { WeddingPlan } from "@/lib/types";

export interface PublicDesignerTemplate {
  id: string;
  name: string;
  displayTitle: string | null;
  plan: WeddingPlan;
  ritual: string | null;
  version: number;
  coverUrl: string | null;
  /** Có thể bổ sung sau; hiện API chưa trả về. */
  pages?: number;
}
