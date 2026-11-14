import { db } from "@/lib/server/supabase";

export type DesignerPlan = "free" | "pro" | "vip";
export type DesignerStatus = "draft" | "review" | "published" | "archived";

export interface DesignerTemplate {
  id: string;
  name: string;
  plan: DesignerPlan;
  ritual: string | null;
  status: DesignerStatus;
  version: number;
  canvas_json: Record<string, unknown>;
  background_key: string | null;
  snapshot_key: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DesignerTemplateInput {
  name: string;
  plan: DesignerPlan;
  ritual?: string | null;
}

export async function listDesignerTemplates(query?: string): Promise<DesignerTemplate[]> {
  let request = db()
    .from("designer_templates")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(100);

  const needle = query?.trim();
  if (needle) request = request.ilike("name", `%${needle}%`);

  const { data, error } = await request;
  if (error) throw error;
  return (data ?? []) as DesignerTemplate[];
}

export async function getDesignerTemplate(id: string): Promise<DesignerTemplate | null> {
  const { data, error } = await db()
    .from("designer_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as DesignerTemplate | null) ?? null;
}

export async function createDesignerTemplate(
  input: DesignerTemplateInput,
  createdBy: string,
): Promise<DesignerTemplate> {
  const { data, error } = await db()
    .from("designer_templates")
    .insert({
      name: input.name,
      plan: input.plan,
      ritual: input.ritual ?? null,
      created_by: createdBy,
      canvas_json: { pages: [{ id: "cover", width: 390, height: 844, elements: [] }] },
    })
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return data as DesignerTemplate;
}

export async function updateDesignerTemplate(
  id: string,
  patch: Partial<Pick<DesignerTemplate, "name" | "plan" | "ritual" | "status" | "version" | "canvas_json" | "background_key" | "snapshot_key">>,
): Promise<DesignerTemplate | null> {
  const { data, error } = await db()
    .from("designer_templates")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return (data as DesignerTemplate | null) ?? null;
}
