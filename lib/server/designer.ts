import { db } from "@/lib/server/supabase";
import { buildMediaUrl } from "@/lib/server/storage";
import { getDefaultEdgeCache } from "@/lib/server/edge-cache";
import type {
  DesignerTemplateOption,
  WeddingDesignerTemplateInfo,
} from "@/lib/types";

export type DesignerPlan = "free" | "pro" | "vip";
export type DesignerStatus = "draft" | "review" | "published" | "archived";

export interface DesignerTemplate {
  id: string;
  name: string;
  /** Tên khách hàng thấy khi chọn mẫu (có từ migration_v16). */
  display_title: string | null;
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
  const explicitVersion =
    typeof version === "number" && Number.isInteger(version) && version > 0
      ? version
      : null;

  // Version đã publish là bất biến: cache theo (template, version) ở data center.
  const cache = explicitVersion ? getDefaultEdgeCache() : null;
  const cacheKey =
    cache && explicitVersion
      ? new Request(
          `https://inviwedd.internal/designer-version/${templateId}/${explicitVersion}`,
          { method: "GET" },
        )
      : null;

  if (cache && cacheKey) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) return (await hit.json()) as DesignerVersion;
    } catch {
      // Cache lỗi không được chặn trang thiệp.
    }
  }

  let request = db()
    .from("designer_template_versions")
    .select("template_id, version, canvas_json, background_key, published_at")
    .eq("template_id", templateId);

  if (explicitVersion) {
    request = request.eq("version", explicitVersion);
  } else {
    request = request.order("version", { ascending: false }).limit(1);
  }

  const { data, error } = await request.maybeSingle();
  if (error) {
    if (isMissingDesignerSchema(error)) return null;
    throw error;
  }

  const row = (data as DesignerVersion | null) ?? null;
  if (row && cache && cacheKey) {
    try {
      await cache.put(
        cacheKey,
        new Response(JSON.stringify(row), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "public, max-age=86400",
          },
        }),
      );
    } catch {
      // Bỏ qua: vẫn trả dữ liệu từ DB.
    }
  }

  return row;
}

/** Mẫu designer đang dùng cho một thiệp, luôn lấy version mới nhất đã publish. */
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
  if (typeof id !== "string" || !id) return null;

  // Thiệp dùng mẫu designer tự động nhận bản mới nhất khi designer publish;
  // không cần khách vào dashboard bấm "Cập nhật lên vN".
  const row = await getDesignerVersion(id);
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

/** Cột display_title có từ migration_v16; fallback khi DB chưa chạy. */
export function isMissingDisplayTitleColumn(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: unknown; message?: unknown };
  const code = typeof err.code === "string" ? err.code : "";
  const message = typeof err.message === "string" ? err.message : "";
  return (
    (code === "42703" || code === "PGRST204") &&
    /display_title/i.test(message)
  );
}

function hasDisplayTitle(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const PUBLISHED_OPTION_COLUMNS =
  "id, name, plan, ritual, version, background_key, snapshot_key";

interface PublishedTemplateRow {
  id: string;
  name: string;
  display_title?: string | null;
  plan: DesignerPlan;
  ritual: string | null;
  version: number;
  background_key: string | null;
  snapshot_key: string | null;
  updated_at: string;
}

/** Đọc các mẫu published, lùi về select không có display_title nếu cột chưa có. */
async function loadPublishedTemplateRows(): Promise<{
  rows: PublishedTemplateRow[];
  needsMigration: boolean;
}> {
  const first = await db()
    .from("designer_templates")
    .select(`${PUBLISHED_OPTION_COLUMNS}, display_title, updated_at`)
    .eq("status", "published")
    .order("updated_at", { ascending: false })
    .limit(100);

  if (!first.error) {
    return {
      rows: (first.data ?? []) as PublishedTemplateRow[],
      needsMigration: false,
    };
  }

  if (isMissingDisplayTitleColumn(first.error)) {
    const fallback = await db()
      .from("designer_templates")
      .select(`${PUBLISHED_OPTION_COLUMNS}, updated_at`)
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(100);

    if (fallback.error) {
      if (isMissingDesignerSchema(fallback.error)) {
        return { rows: [], needsMigration: true };
      }
      throw fallback.error;
    }

    return {
      rows: (fallback.data ?? []) as PublishedTemplateRow[],
      needsMigration: true,
    };
  }

  if (isMissingDesignerSchema(first.error)) {
    return { rows: [], needsMigration: false };
  }
  throw first.error;
}

/** Danh sách mẫu đã publish cho dashboard chủ thiệp (không cần quyền ops). */
export async function listPublishedDesignerTemplateOptions(): Promise<
  DesignerTemplateOption[]
> {
  const { rows } = await loadPublishedTemplateRows();

  return rows.map((row) => {
    const coverKey = row.snapshot_key ?? row.background_key ?? null;
    return {
      id: row.id,
      name: row.name,
      displayTitle: hasDisplayTitle(row.display_title)
        ? row.display_title.trim()
        : null,
      plan: row.plan,
      ritual: row.ritual,
      version: row.version,
      coverUrl: coverKey ? buildMediaUrl(coverKey) : null,
    };
  });
}

export interface ProductionDesignerTemplate {
  id: string;
  name: string;
  displayTitle: string | null;
  plan: DesignerPlan;
  ritual: string | null;
  version: number;
  coverUrl: string | null;
  usageCount: number;
  updatedAt: string;
}

export interface ProductionDesignerTemplateList {
  items: ProductionDesignerTemplate[];
  /** true khi DB chưa có cột display_title (migration_v16). */
  needsMigration: boolean;
}

/** Mẫu đã publish đang chạy production + số thiệp đang ghim mẫu đó. */
export async function listProductionDesignerTemplates(): Promise<ProductionDesignerTemplateList> {
  const { rows, needsMigration } = await loadPublishedTemplateRows();

  const usage = new Map<string, number>();
  const pinned = await db()
    .from("weddings")
    .select("designer_template_id")
    .not("designer_template_id", "is", null);

  if (!pinned.error) {
    for (const row of pinned.data ?? []) {
      const id = (row as { designer_template_id?: string | null })
        .designer_template_id;
      if (typeof id === "string" && id) {
        usage.set(id, (usage.get(id) ?? 0) + 1);
      }
    }
  } else {
    const err = pinned.error as { code?: string; message?: string };
    const missingColumn =
      err.code === "42703" ||
      /designer_template_id/i.test(err.message ?? "");
    if (!missingColumn) throw pinned.error;
  }

  const items = rows
    .map((row) => {
      const coverKey = row.snapshot_key ?? row.background_key ?? null;
      return {
        id: row.id,
        name: row.name,
        displayTitle: hasDisplayTitle(row.display_title)
          ? row.display_title.trim()
          : null,
        plan: row.plan,
        ritual: row.ritual,
        version: row.version,
        coverUrl: coverKey ? buildMediaUrl(coverKey) : null,
        usageCount: usage.get(row.id) ?? 0,
        updatedAt: row.updated_at,
      };
    })
    .sort(
      (a, b) =>
        b.usageCount - a.usageCount || b.updatedAt.localeCompare(a.updatedAt),
    );

  return { items, needsMigration };
}

/** Thông tin mẫu đang gán + version mới nhất để dashboard hiện "Cập nhật lên vN". */
export async function getWeddingDesignerTemplateInfo(input: {
  designer_template_id?: string | null;
  designer_template_version?: number | null;
}): Promise<WeddingDesignerTemplateInfo | null> {
  const id = input.designer_template_id;
  if (typeof id !== "string" || !id) return null;

  type InfoRow = Pick<
    DesignerTemplate,
    "id" | "name" | "status" | "version"
  > & { display_title?: string | null };

  const first = await db()
    .from("designer_templates")
    .select("id, name, status, version, display_title")
    .eq("id", id)
    .maybeSingle();

  let data: InfoRow | null = null;
  if (!first.error) {
    data = (first.data as InfoRow | null) ?? null;
  } else if (isMissingDisplayTitleColumn(first.error)) {
    const fallback = await db()
      .from("designer_templates")
      .select("id, name, status, version")
      .eq("id", id)
      .maybeSingle();
    if (fallback.error) {
      if (isMissingDesignerSchema(fallback.error)) return null;
      throw fallback.error;
    }
    data = (fallback.data as InfoRow | null) ?? null;
  } else if (isMissingDesignerSchema(first.error)) {
    return null;
  } else {
    throw first.error;
  }

  if (!data) return null;

  const pinned = input.designer_template_version;
  return {
    id: data.id,
    name: data.name,
    displayTitle: hasDisplayTitle(data.display_title)
      ? data.display_title.trim()
      : null,
    pinnedVersion:
      typeof pinned === "number" && Number.isInteger(pinned) && pinned > 0
        ? pinned
        : null,
    latestVersion: data.version,
    status: data.status,
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
  patch: Partial<
    Pick<
      DesignerTemplate,
      | "name"
      | "display_title"
      | "plan"
      | "ritual"
      | "status"
      | "version"
      | "canvas_json"
      | "background_key"
      | "snapshot_key"
    >
  >,
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
