import { db } from "@/lib/server/supabase";
import { buildMediaUrl } from "@/lib/server/storage";
import type {
  DesignerTemplateOption,
  WeddingDesignerTemplateInfo,
} from "@/lib/types";

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

export interface DesignerVersion {
  template_id: string;
  version: number;
  canvas_json: Record<string, unknown>;
  background_key: string | null;
  published_at: string;
}

/**
 * DB chưa chạy migration_v14/v15 (hoặc PostgREST chưa thấy cột/bảng) thì code
 * phải hạ cấp êm: coi như chưa có designer, không làm sập trang thiệp.
 */
export function isMissingDesignerSchema(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  return (
    code === "42P01" ||
    code === "42703" ||
    code === "PGRST204" ||
    /does not exist|schema cache|relation .* not found/i.test(message)
  );
}

export async function getDesignerVersion(
  templateId: string,
  version?: number | null,
): Promise<DesignerVersion | null> {
  let request = db()
    .from("designer_template_versions")
    .select("template_id, version, canvas_json, background_key, published_at")
    .eq("template_id", templateId);

  if (version && Number.isInteger(version)) {
    request = request.eq("version", version);
  } else {
    request = request.order("version", { ascending: false }).limit(1);
  }

  const { data, error } = await request.maybeSingle();
  if (error) {
    if (isMissingDesignerSchema(error)) return null;
    throw error;
  }
  return (data as DesignerVersion | null) ?? null;
}

/** Mẫu designer đang ghim vào một thiệp, kèm đúng layout JSON của version đó. */
export interface PinnedDesignerTemplate {
  id: string;
  version: number;
  canvas: Record<string, unknown>;
}

export async function getPinnedDesignerTemplate(input: {
  designerTemplateId?: string | null;
  designerTemplateVersion?: number | null;
}): Promise<PinnedDesignerTemplate | null> {
  const id = input.designerTemplateId;
  const version = input.designerTemplateVersion;
  if (typeof id !== "string" || !id) return null;
  if (typeof version !== "number" || !Number.isInteger(version) || version < 1) {
    return null;
  }

  const row = await getDesignerVersion(id, version);
  if (!row) return null;

  const canvas = row.canvas_json;
  if (!canvas || typeof canvas !== "object" || Array.isArray(canvas)) return null;
  const layout = canvas as Record<string, unknown>;
  const width = Number(layout.width);
  const height = Number(layout.height);
  if (
    !Number.isFinite(width) ||
    width <= 0 ||
    !Number.isFinite(height) ||
    height <= 0
  ) {
    return null;
  }

  return { id, version: row.version, canvas: layout };
}

/** Danh sách mẫu đã publish cho dashboard chủ thiệp (không cần quyền ops). */
export async function listPublishedDesignerTemplateOptions(): Promise<
  DesignerTemplateOption[]
> {
  const { data, error } = await db()
    .from("designer_templates")
    .select("id, name, plan, ritual, version, background_key, snapshot_key")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingDesignerSchema(error)) return [];
    throw error;
  }

  return (
    (data ?? []) as Pick<
      DesignerTemplate,
      | "id"
      | "name"
      | "plan"
      | "ritual"
      | "version"
      | "background_key"
      | "snapshot_key"
    >[]
  ).map((row) => {
    const coverKey = row.snapshot_key ?? row.background_key ?? null;
    return {
      id: row.id,
      name: row.name,
      plan: row.plan,
      ritual: row.ritual,
      version: row.version,
      coverUrl: coverKey ? buildMediaUrl(coverKey) : null,
    };
  });
}

/** Thông tin mẫu đang gán + version mới nhất để dashboard hiện "Cập nhật lên vN". */
export async function getWeddingDesignerTemplateInfo(input: {
  designer_template_id?: string | null;
  designer_template_version?: number | null;
}): Promise<WeddingDesignerTemplateInfo | null> {
  const id = input.designer_template_id;
  if (typeof id !== "string" || !id) return null;

  const { data, error } = await db()
    .from("designer_templates")
    .select("id, name, status, version")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingDesignerSchema(error)) return null;
    throw error;
  }
  if (!data) return null;

  const row = data as Pick<DesignerTemplate, "id" | "name" | "status" | "version">;
  const pinned = input.designer_template_version;
  return {
    id: row.id,
    name: row.name,
    pinnedVersion:
      typeof pinned === "number" && Number.isInteger(pinned) && pinned > 0
        ? pinned
        : null,
    latestVersion: row.version,
    status: row.status,
  };
}

export async function listPublishedDesignerTemplates(): Promise<DesignerTemplate[]> {
  const { data, error } = await db()
    .from("designer_templates")
    .select("*")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as DesignerTemplate[];
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
