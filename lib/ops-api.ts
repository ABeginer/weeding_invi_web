import type { WeddingPlan } from "./types";
import type { OpsRole } from "./ops-roles";
import { getBearerToken } from "./api";

export interface OpsMe {
  email: string;
  isAdmin: boolean;
  role: OpsRole | null;
}

export interface OpsTemplateItem {
  id: string;
  name: string;
  displayTitle: string | null;
  plan: WeddingPlan;
  ritual: string | null;
  version: number;
  coverUrl: string | null;
  usageCount: number;
  updatedAt: string;
}

export interface OpsTemplatesResult {
  items: OpsTemplateItem[];
  needsMigration: boolean;
}

export interface OpsDesignerTemplateDetail {
  id: string;
  name: string;
  plan: "free" | "pro" | "vip";
  ritual: string | null;
  status: "draft" | "review" | "published" | "archived";
  version: number;
  canvas_json: unknown;
  background_key: string | null;
  updated_at: string;
}

export interface OpsRoleMember {
  email: string;
  role: OpsRole;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  isEnvAdmin: boolean;
}

export interface OpsRolesResult {
  items: OpsRoleMember[];
  needsMigration: boolean;
  envAdminCount: number;
}

export interface OpsStats {
  users: number;
  weddingsByPlan: {
    free: number;
    pro: number;
    vip: number;
  };
  suspendedWeddings: number;
  ordersPending: number;
  ordersPaidThisMonth: number;
  revenueThisMonthVnd: number;
  generatedAt: string;
}

export interface OpsUser {
  id: string;
  email: string;
  createdAt: string;
  weddingCount: number;
  identityCount: number;
}

export interface OpsUserWeddingItem {
  id: string;
  slug: string;
  plan: WeddingPlan;
  suspended: boolean;
  createdAt: string;
}

export interface OpsUserIdentity {
  provider: "auth0" | "google" | "other" | string;
  linkedAt: string;
}

export interface OpsUserMergedFrom {
  email: string;
  mergedAt: string;
}

export interface OpsUserDetail {
  id: string;
  email: string;
  createdAt: string;
  weddings: OpsUserWeddingItem[];
  identities: OpsUserIdentity[];
  mergedFrom: OpsUserMergedFrom | null;
}

export function getProviderLabel(provider: string): string {
  const p = (provider || "").toLowerCase().trim();
  if (p === "auth0") return "Email và mật khẩu";
  if (p === "google") return "Google";
  return "Khác";
}

export interface OpsWedding {
  id: string;
  slug: string;
  title: string;
  plan: WeddingPlan;
  suspended: boolean;
  ownerEmail: string;
  guestCount: number;
  createdAt: string;
}

export interface OpsWeddingDetail {
  id: string;
  slug: string;
  title: string;
  plan: WeddingPlan;
  suspended: boolean;
  ownerEmail: string;
  createdAt: string;
  guestCount: number;
  acceptedCount: number;
  photoCount: number;
  albumPhotoCount: number;
}

export type OpsOrderStatus = "pending" | "paid" | "cancelled";

export interface OpsOrder {
  id: string;
  code: string;
  plan: "pro" | "vip";
  amountVnd: number;
  status: OpsOrderStatus;
  weddingId: string;
  ownerEmail: string;
  createdAt: string;
  paidAt: string | null;
}

export interface OpsBankTransaction {
  id: string;
  ref: string;
  amountVnd: number;
  description: string;
  receivedAt: string;
}

export interface OpsAuditLog {
  id: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  totalPages: number;
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    return `${time} ${date}`;
  } catch {
    return iso;
  }
}

export function validateReason(reason: string): string | null {
  const trimmed = reason.trim();
  if (trimmed.length < 5) {
    return "Lý do phải có ít nhất 5 ký tự.";
  }
  if (trimmed.length > 300) {
    return "Lý do tối đa 300 ký tự.";
  }
  return null;
}

export interface MergeOpsUserResult {
  ok: boolean;
  movedWeddings: number;
  movedIdentities: number;
  targetUserId: string;
}

export class OpsApiError extends Error {
  code?: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "VALIDATION" | string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "OpsApiError";
    this.code = code;
  }
}

/** Sự kiện để layout /ops hiện banner lỗi thay vì im lặng hiển thị list rỗng. */
export const OPS_ERROR_EVENT = "ops-api-error";

function notifyOpsError(message: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<string>(OPS_ERROR_EVENT, { detail: message }),
  );
}

async function parseOpsError(res: Response): Promise<never> {
  let message = "Không thể tải dữ liệu quản trị.";
  let code: string | undefined;
  try {
    const payload = await res.json();
    if (payload && typeof payload.error === "string") message = payload.error;
    if (payload && typeof payload.code === "string") code = payload.code;
  } catch {
    // Giữ thông báo mặc định khi body không phải JSON.
  }
  notifyOpsError(message);
  throw new OpsApiError(message, code);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let token = "";
  try {
    token = await getBearerToken();
  } catch {
    // Không có token thì để API trả 401 và báo lỗi cho người dùng.
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (res.ok) {
    return (await res.json()) as T;
  }

  return parseOpsError(res);
}

/** Upload multipart (ảnh bìa mẫu); không set Content-Type để browser tự thêm boundary. */
async function formRequest<T>(path: string, formData: FormData): Promise<T> {
  let token = "";
  try {
    token = await getBearerToken();
  } catch {
    // API sẽ trả 401 nếu thiếu token.
  }

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(path, {
    method: "POST",
    body: formData,
    headers,
    cache: "no-store",
  });

  if (res.ok) {
    return (await res.json()) as T;
  }

  return parseOpsError(res);
}

function post(body: unknown): RequestInit {
  return { method: "POST", body: JSON.stringify(body) };
}

/** Dùng cho các module ops mới (designer…) để tự gắn Bearer token như các hàm khác. */
export function opsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, init);
}

export async function getOpsMe(): Promise<OpsMe> {
  return request<OpsMe>("/api/ops/me", { method: "GET" });
}

export async function getOpsStats(): Promise<OpsStats> {
  return request<OpsStats>("/api/ops/stats", { method: "GET" });
}

export async function getOpsUsers(params?: {
  q?: string;
  page?: number;
}): Promise<PaginatedResult<OpsUser>> {
  const query = params?.q?.trim().toLowerCase() || "";
  const page = Math.max(1, params?.page || 1);
  const data = await request<
    PaginatedResult<Omit<OpsUser, "identityCount"> & { identityCount?: number }>
  >(
    `/api/ops/users?q=${encodeURIComponent(query)}&page=${page}`,
    { method: "GET" },
  );

  return {
    ...data,
    items: data.items.map((user) => ({
      ...user,
      identityCount: user.identityCount ?? 0,
    })),
  };
}

export async function getOpsUser(id: string): Promise<OpsUserDetail | null> {
  try {
    const data = await request<
      Omit<OpsUserDetail, "identities" | "mergedFrom">
    >(`/api/ops/users/${encodeURIComponent(id)}`, { method: "GET" });
    return { ...data, identities: [], mergedFrom: null };
  } catch (err) {
    if (err instanceof OpsApiError && err.code === "NOT_FOUND") return null;
    throw err;
  }
}

/**
 * Gộp tài khoản cần route riêng + bảng identity, chưa có trên máy chủ.
 * Ném lỗi rõ ràng thay vì giả lập thành công.
 */
export async function mergeOpsUser(
  sourceUserId: string,
  targetUserId: string,
  reason: string,
): Promise<MergeOpsUserResult> {
  const reasonErr = validateReason(reason);
  if (reasonErr) throw new OpsApiError(reasonErr, "VALIDATION");
  if (sourceUserId === targetUserId) {
    throw new OpsApiError("Không thể gộp một tài khoản với chính nó.", "VALIDATION");
  }
  throw new OpsApiError(
    "Gộp tài khoản chưa được hỗ trợ trên máy chủ.",
    "NOT_SUPPORTED",
  );
}

export async function getOpsWeddings(params?: {
  q?: string;
  plan?: string;
  suspended?: string;
  page?: number;
}): Promise<PaginatedResult<OpsWedding>> {
  const q = params?.q?.trim().toLowerCase() || "";
  const plan = params?.plan || "";
  const suspended = params?.suspended || "";
  const page = Math.max(1, params?.page || 1);

  return request<PaginatedResult<OpsWedding>>(
    `/api/ops/weddings?q=${encodeURIComponent(q)}&plan=${encodeURIComponent(plan)}&suspended=${encodeURIComponent(suspended)}&page=${page}`,
    { method: "GET" },
  );
}

export async function getOpsWedding(id: string): Promise<OpsWeddingDetail | null> {
  try {
    return await request<OpsWeddingDetail>(
      `/api/ops/weddings/${encodeURIComponent(id)}`,
      { method: "GET" },
    );
  } catch (err) {
    if (err instanceof OpsApiError && err.code === "NOT_FOUND") return null;
    throw err;
  }
}

export async function updateOpsWeddingPlan(
  id: string,
  plan: WeddingPlan,
  reason: string,
): Promise<{ ok: boolean; plan: WeddingPlan }> {
  const reasonErr = validateReason(reason);
  if (reasonErr) throw new Error(reasonErr);

  return request<{ ok: boolean; plan: WeddingPlan }>(
    `/api/ops/weddings/${encodeURIComponent(id)}/plan`,
    post({ plan, reason }),
  );
}

export async function updateOpsWeddingSuspend(
  id: string,
  suspended: boolean,
  reason: string,
): Promise<{ ok: boolean; suspended: boolean }> {
  const reasonErr = validateReason(reason);
  if (reasonErr) throw new Error(reasonErr);

  return request<{ ok: boolean; suspended: boolean }>(
    `/api/ops/weddings/${encodeURIComponent(id)}/suspend`,
    post({ suspended, reason }),
  );
}

export async function getOpsOrders(params?: {
  status?: OpsOrderStatus;
  q?: string;
  page?: number;
}): Promise<PaginatedResult<OpsOrder>> {
  const status = params?.status;
  const q = params?.q?.trim().toLowerCase() || "";
  const page = Math.max(1, params?.page || 1);

  return request<PaginatedResult<OpsOrder>>(
    `/api/ops/orders?status=${encodeURIComponent(status ?? "")}&q=${encodeURIComponent(q)}&page=${page}`,
    { method: "GET" },
  );
}

export async function confirmOpsOrder(
  id: string,
  reason: string,
): Promise<{ ok: boolean; order: OpsOrder }> {
  const reasonErr = validateReason(reason);
  if (reasonErr) throw new Error(reasonErr);

  return request<{ ok: boolean; order: OpsOrder }>(
    `/api/ops/orders/${encodeURIComponent(id)}/confirm`,
    post({ reason }),
  );
}

export async function cancelOpsOrder(
  id: string,
  reason: string,
): Promise<{ ok: boolean; order: OpsOrder }> {
  const reasonErr = validateReason(reason);
  if (reasonErr) throw new Error(reasonErr);

  return request<{ ok: boolean; order: OpsOrder }>(
    `/api/ops/orders/${encodeURIComponent(id)}/cancel`,
    post({ reason }),
  );
}

export async function getOpsBankTransactions(params?: {
  unmatched?: boolean;
  page?: number;
}): Promise<PaginatedResult<OpsBankTransaction>> {
  const page = Math.max(1, params?.page || 1);
  const unmatched = params?.unmatched ? "1" : "";

  return request<PaginatedResult<OpsBankTransaction>>(
    `/api/ops/bank-transactions?unmatched=${unmatched}&page=${page}`,
    { method: "GET" },
  );
}

export async function matchOpsBankTransaction(
  id: string,
  orderId: string,
  reason: string,
): Promise<{ ok: boolean }> {
  const reasonErr = validateReason(reason);
  if (reasonErr) throw new Error(reasonErr);

  return request<{ ok: boolean }>(
    `/api/ops/bank-transactions/${encodeURIComponent(id)}/match`,
    post({ orderId, reason }),
  );
}

export async function getOpsAudit(params?: {
  page?: number;
}): Promise<PaginatedResult<OpsAuditLog>> {
  const page = Math.max(1, params?.page || 1);

  return request<PaginatedResult<OpsAuditLog>>(
    `/api/ops/audit?page=${page}`,
    { method: "GET" },
  );
}

export function getOpsTemplates(): Promise<OpsTemplatesResult> {
  return request<OpsTemplatesResult>("/api/ops/templates", { method: "GET" });
}

export function getOpsDesignerTemplate(
  id: string,
): Promise<OpsDesignerTemplateDetail> {
  return request<OpsDesignerTemplateDetail>(
    `/api/ops/designer/templates/${encodeURIComponent(id)}`,
    { method: "GET" },
  );
}

export function updateOpsTemplate(
  id: string,
  input: { name?: string; displayTitle?: string | null },
): Promise<{
  ok: boolean;
  item: { id: string; name: string; displayTitle: string | null };
}> {
  return request(`/api/ops/templates/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function uploadOpsTemplateCover(
  id: string,
  file: Blob,
  dimensions?: { width: number; height: number },
): Promise<{ url: string; key: string }> {
  const formData = new FormData();
  formData.append("file", file, "cover.webp");
  if (dimensions) {
    formData.append("width", String(dimensions.width));
    formData.append("height", String(dimensions.height));
  }
  return formRequest(
    `/api/ops/templates/${encodeURIComponent(id)}/cover`,
    formData,
  );
}

export function getOpsRoles(): Promise<OpsRolesResult> {
  return request<OpsRolesResult>("/api/ops/roles", { method: "GET" });
}

export function upsertOpsRole(
  email: string,
  role: OpsRole,
): Promise<{ ok: boolean; email: string; role: OpsRole }> {
  return request("/api/ops/roles", post({ email, role }));
}

export function deleteOpsRole(email: string): Promise<{ ok: boolean }> {
  return request(`/api/ops/roles?email=${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
}
