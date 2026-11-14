import type { WeddingPlan } from "./types";
import { getBearerToken } from "./api";

export interface OpsMe {
  email: string;
  isAdmin: boolean;
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

// -------------------------------------------------------------
// IN-MEMORY / LOCAL STORAGE MOCK DATA STORE
// -------------------------------------------------------------

const STORAGE_KEY = "inviwedd_ops_mock_v1";

interface OpsMockStore {
  adminEmail: string;
  users: OpsUserDetail[];
  weddings: OpsWeddingDetail[];
  orders: OpsOrder[];
  transactions: OpsBankTransaction[];
  auditLogs: OpsAuditLog[];
}

function initializeMockData(): OpsMockStore {
  const adminEmail = "ops.admin@inviwedd.com";

  const users: OpsUserDetail[] = [
    {
      id: "usr-01",
      email: "nam.nguyen@gmail.com",
      createdAt: "2026-10-15T08:30:00Z",
      identities: [
        { provider: "google", linkedAt: "2026-10-15T08:30:00Z" },
      ],
      mergedFrom: null,
      weddings: [
        {
          id: "wed-01",
          slug: "nam-mai-2026",
          plan: "vip",
          suspended: false,
          createdAt: "2026-10-15T09:00:00Z",
        },
      ],
    },
    {
      id: "usr-02",
      email: "mai.tran@outlook.com",
      createdAt: "2026-10-18T10:15:00Z",
      identities: [
        { provider: "auth0", linkedAt: "2026-10-18T10:15:00Z" },
      ],
      mergedFrom: null,
      weddings: [
        {
          id: "wed-02",
          slug: "hoang-mai-wedding",
          plan: "pro",
          suspended: false,
          createdAt: "2026-10-18T11:00:00Z",
        },
      ],
    },
    {
      id: "usr-03",
      email: "quoc.bao@techcorp.vn",
      createdAt: "2026-10-22T14:45:00Z",
      identities: [
        { provider: "auth0", linkedAt: "2026-10-22T14:45:00Z" },
        { provider: "google", linkedAt: "2026-10-25T09:00:00Z" },
      ],
      mergedFrom: null,
      weddings: [
        {
          id: "wed-03",
          slug: "bao-anh-love",
          plan: "free",
          suspended: true,
          createdAt: "2026-10-22T15:20:00Z",
        },
      ],
    },
    {
      id: "usr-04",
      email: "thuy.duong@weddingstudio.vn",
      createdAt: "2026-11-01T08:00:00Z",
      identities: [
        { provider: "google", linkedAt: "2026-11-01T08:00:00Z" },
      ],
      mergedFrom: {
        email: "duong.cuoi@gmail.com",
        mergedAt: "2026-11-03T11:20:00Z",
      },
      weddings: [
        {
          id: "wed-04",
          slug: "duong-tuan-2026",
          plan: "vip",
          suspended: false,
          createdAt: "2026-11-01T09:10:00Z",
        },
        {
          id: "wed-05",
          slug: "le-vu-quy-duong",
          plan: "pro",
          suspended: false,
          createdAt: "2026-11-02T13:40:00Z",
        },
      ],
    },
    {
      id: "usr-05",
      email: "phuong.thao@gmail.com",
      createdAt: "2026-11-05T16:20:00Z",
      identities: [
        { provider: "auth0", linkedAt: "2026-11-05T16:20:00Z" },
      ],
      mergedFrom: null,
      weddings: [
        {
          id: "wed-06",
          slug: "thao-dat-happyday",
          plan: "free",
          suspended: false,
          createdAt: "2026-11-05T16:30:00Z",
        },
      ],
    },
  ];

  const weddings: OpsWeddingDetail[] = [
    {
      id: "wed-01",
      slug: "nam-mai-2026",
      title: "Lễ Thành Hôn Nam & Mai",
      plan: "vip",
      suspended: false,
      ownerEmail: "nam.nguyen@gmail.com",
      createdAt: "2026-10-15T09:00:00Z",
      guestCount: 280,
      acceptedCount: 245,
      photoCount: 30,
      albumPhotoCount: 185,
    },
    {
      id: "wed-02",
      slug: "hoang-mai-wedding",
      title: "Hôn Lễ Hoàng & Mai",
      plan: "pro",
      suspended: false,
      ownerEmail: "mai.tran@outlook.com",
      createdAt: "2026-10-18T11:00:00Z",
      guestCount: 120,
      acceptedCount: 98,
      photoCount: 22,
      albumPhotoCount: 28,
    },
    {
      id: "wed-03",
      slug: "bao-anh-love",
      title: "Ngày Vui Bảo & Anh",
      plan: "free",
      suspended: true,
      ownerEmail: "quoc.bao@techcorp.vn",
      createdAt: "2026-10-22T15:20:00Z",
      guestCount: 18,
      acceptedCount: 15,
      photoCount: 4,
      albumPhotoCount: 0,
    },
    {
      id: "wed-04",
      slug: "duong-tuan-2026",
      title: "Lễ Tân Hôn Dương & Tuấn",
      plan: "vip",
      suspended: false,
      ownerEmail: "thuy.duong@weddingstudio.vn",
      createdAt: "2026-11-01T09:10:00Z",
      guestCount: 350,
      acceptedCount: 310,
      photoCount: 30,
      albumPhotoCount: 220,
    },
    {
      id: "wed-05",
      slug: "le-vu-quy-duong",
      title: "Lễ Vu Quy Thùy Dương",
      plan: "pro",
      suspended: false,
      ownerEmail: "thuy.duong@weddingstudio.vn",
      createdAt: "2026-11-02T13:40:00Z",
      guestCount: 95,
      acceptedCount: 80,
      photoCount: 18,
      albumPhotoCount: 20,
    },
    {
      id: "wed-06",
      slug: "thao-dat-happyday",
      title: "Hạnh Phúc Thảo & Đạt",
      plan: "free",
      suspended: false,
      ownerEmail: "phuong.thao@gmail.com",
      createdAt: "2026-11-05T16:30:00Z",
      guestCount: 15,
      acceptedCount: 12,
      photoCount: 5,
      albumPhotoCount: 0,
    },
  ];

  const orders: OpsOrder[] = [
    {
      id: "ord-01",
      code: "INV-7K2QPM",
      plan: "vip",
      amountVnd: 399000,
      status: "paid",
      weddingId: "wed-01",
      ownerEmail: "nam.nguyen@gmail.com",
      createdAt: "2026-10-15T09:05:00Z",
      paidAt: "2026-10-15T09:12:00Z",
    },
    {
      id: "ord-02",
      code: "INV-8L3XRN",
      plan: "pro",
      amountVnd: 199000,
      status: "paid",
      weddingId: "wed-02",
      ownerEmail: "mai.tran@outlook.com",
      createdAt: "2026-10-18T11:05:00Z",
      paidAt: "2026-10-18T11:10:00Z",
    },
    {
      id: "ord-03",
      code: "INV-9M4YSO",
      plan: "vip",
      amountVnd: 399000,
      status: "paid",
      weddingId: "wed-04",
      ownerEmail: "thuy.duong@weddingstudio.vn",
      createdAt: "2026-11-01T09:15:00Z",
      paidAt: "2026-11-01T09:18:00Z",
    },
    {
      id: "ord-04",
      code: "INV-1N5ZTP",
      plan: "pro",
      amountVnd: 199000,
      status: "pending",
      weddingId: "wed-05",
      ownerEmail: "thuy.duong@weddingstudio.vn",
      createdAt: "2026-11-13T10:00:00Z",
      paidAt: null,
    },
    {
      id: "ord-05",
      code: "INV-2O6AUQ",
      plan: "vip",
      amountVnd: 399000,
      status: "pending",
      weddingId: "wed-06",
      ownerEmail: "phuong.thao@gmail.com",
      createdAt: "2026-11-13T14:30:00Z",
      paidAt: null,
    },
    {
      id: "ord-06",
      code: "INV-3P7BVR",
      plan: "pro",
      amountVnd: 199000,
      status: "cancelled",
      weddingId: "wed-03",
      ownerEmail: "quoc.bao@techcorp.vn",
      createdAt: "2026-10-22T15:25:00Z",
      paidAt: null,
    },
  ];

  const transactions: OpsBankTransaction[] = [
    {
      id: "tx-01",
      ref: "FT26317892189",
      amountVnd: 199000,
      description: "CHUYEN TIEN GIOI THIEU INV-1N5ZTP",
      receivedAt: "2026-11-13T10:15:00Z",
    },
    {
      id: "tx-02",
      ref: "FT26317893452",
      amountVnd: 350000,
      description: "THAO CK NANG CAP VIP THIEP CUOI",
      receivedAt: "2026-11-13T15:00:00Z",
    },
    {
      id: "tx-03",
      ref: "FT26317898891",
      amountVnd: 399000,
      description: "MBVCB.789123891.THANH TOAN GOI VIP",
      receivedAt: "2026-11-13T16:20:00Z",
    },
  ];

  const auditLogs: OpsAuditLog[] = [
    {
      id: "aud-01",
      adminEmail,
      action: "SUSPEND_WEDDING",
      targetType: "wedding",
      targetId: "wed-03",
      reason: "Vi phạm điều khoản bản quyền hình ảnh theo khiếu nại",
      createdAt: "2026-10-23T09:00:00Z",
    },
    {
      id: "aud-02",
      adminEmail,
      action: "CONFIRM_ORDER",
      targetType: "order",
      targetId: "ord-01",
      reason: "Đối chiếu sao kê tài khoản ngân hàng khớp 100%",
      createdAt: "2026-10-15T09:12:00Z",
    },
    {
      id: "aud-03",
      adminEmail,
      action: "UPGRADE_PLAN",
      targetType: "wedding",
      targetId: "wed-01",
      reason: "Hỗ trợ khách nâng cấp VIP ngày khai trương",
      createdAt: "2026-10-15T09:13:00Z",
    },
  ];

  return { adminEmail, users, weddings, orders, transactions, auditLogs };
}

let storeMemory: OpsMockStore | null = null;

function getStore(): OpsMockStore {
  if (typeof window === "undefined") {
    if (!storeMemory) storeMemory = initializeMockData();
    return storeMemory;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.weddings)) {
        parsed.users = parsed.users.map((u: OpsUserDetail) => ({
          ...u,
          identities: Array.isArray(u.identities)
            ? u.identities
            : [{ provider: "auth0", linkedAt: u.createdAt }],
          mergedFrom: u.mergedFrom || null,
        }));
        return parsed as OpsMockStore;
      }
    }
  } catch {}

  const initial = initializeMockData();
  saveStore(initial);
  return initial;
}

function saveStore(store: OpsMockStore): void {
  storeMemory = store;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {}
  }
}

// -------------------------------------------------------------
// CLIENT API CALLS WITH FALLBACK TO LOCAL MOCK
// -------------------------------------------------------------

async function fetchOrMock<T>(
  apiPath: string,
  init: RequestInit | undefined,
  mockFallback: () => T | Promise<T>,
): Promise<T> {
  // Không còn fallback về dữ liệu giả: lỗi API phải hiện ra cho người vận hành.
  void mockFallback;

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

  const res = await fetch(apiPath, {
    ...init,
    headers,
  });
  if (res.ok) {
    return (await res.json()) as T;
  }

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

/**
 * GET /api/ops/me
 */
export async function getOpsMe(): Promise<OpsMe> {
  return fetchOrMock("/api/ops/me", { method: "GET" }, () => ({
    email: "",
    isAdmin: false,
  }));
}


/**
 * GET /api/ops/stats
 */
export async function getOpsStats(): Promise<OpsStats> {
  return fetchOrMock("/api/ops/stats", { method: "GET" }, () => {
    const store = getStore();
    const free = store.weddings.filter((w) => w.plan === "free").length;
    const pro = store.weddings.filter((w) => w.plan === "pro").length;
    const vip = store.weddings.filter((w) => w.plan === "vip").length;
    const suspendedWeddings = store.weddings.filter((w) => w.suspended).length;

    const ordersPending = store.orders.filter((o) => o.status === "pending").length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const paidOrdersThisMonth = store.orders.filter((o) => {
      if (o.status !== "paid" || !o.paidAt) return false;
      const d = new Date(o.paidAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const revenueThisMonthVnd = paidOrdersThisMonth.reduce(
      (sum, o) => sum + o.amountVnd,
      0,
    );

    return {
      users: store.users.length,
      weddingsByPlan: { free, pro, vip },
      suspendedWeddings,
      ordersPending,
      ordersPaidThisMonth: paidOrdersThisMonth.length,
      revenueThisMonthVnd,
      generatedAt: new Date().toISOString(),
    };
  });
}

/**
 * GET /api/ops/users?q=&page=
 */
export async function getOpsUsers(params?: {
  q?: string;
  page?: number;
}): Promise<PaginatedResult<OpsUser>> {
  const query = params?.q?.trim().toLowerCase() || "";
  const page = Math.max(1, params?.page || 1);
  const pageSize = 20;

  return fetchOrMock(
    `/api/ops/users?q=${encodeURIComponent(query)}&page=${page}`,
    { method: "GET" },
    () => {
      const store = getStore();
      let filtered = store.users;
      if (query) {
        filtered = filtered.filter((u) => u.email.toLowerCase().includes(query));
      }

      const totalItems = filtered.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const startIndex = (page - 1) * pageSize;
      const sliced = filtered.slice(startIndex, startIndex + pageSize);

      const items: OpsUser[] = sliced.map((u) => ({
        id: u.id,
        email: u.email,
        createdAt: u.createdAt,
        weddingCount: u.weddings.length,
        identityCount: u.identities ? u.identities.length : 1,
      }));

      return {
        items,
        page,
        totalPages,
      };
    },
  );
}

/**
 * GET /api/ops/users/:id
 */
export async function getOpsUser(id: string): Promise<OpsUserDetail | null> {
  try {
    return await fetchOrMock(
      `/api/ops/users/${encodeURIComponent(id)}`,
      { method: "GET" },
      () => null,
    );
  } catch (err) {
    if (err instanceof OpsApiError && err.code === "NOT_FOUND") return null;
    throw err;
  }
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

/**
 * POST /api/ops/users/:id/merge
 * body: { targetUserId: string, reason: string }
 */
export async function mergeOpsUser(
  sourceUserId: string,
  targetUserId: string,
  reason: string,
): Promise<MergeOpsUserResult> {
  const trimmedReason = reason.trim();
  if (trimmedReason.length < 5) {
    throw new OpsApiError("Lý do phải có ít nhất 5 ký tự.", "VALIDATION");
  }
  if (trimmedReason.length > 300) {
    throw new OpsApiError("Lý do tối đa 300 ký tự.", "VALIDATION");
  }
  if (sourceUserId === targetUserId) {
    throw new OpsApiError("Không thể gộp một tài khoản với chính nó.", "VALIDATION");
  }

  try {
    let token = "";
    try {
      token = await getBearerToken();
    } catch {}

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`/api/ops/users/${encodeURIComponent(sourceUserId)}/merge`, {
      method: "POST",
      headers,
      body: JSON.stringify({ targetUserId, reason: trimmedReason }),
    });

    if (res.ok) {
      return (await res.json()) as MergeOpsUserResult;
    }

    if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 404) {
      try {
        const data = await res.json();
        if (data && (data.code || data.error)) {
          throw new OpsApiError(data.error || "Lỗi thao tác gộp tài khoản.", data.code);
        }
      } catch (e) {
        if (e instanceof OpsApiError) throw e;
      }
    }
  } catch (err) {
    if (err instanceof OpsApiError) throw err;
  }

  throw new OpsApiError(
    "Gộp tài khoản chưa được hỗ trợ trên máy chủ.",
    "NOT_SUPPORTED",
  );
}

/**
 * GET /api/ops/weddings?q=&plan=&suspended=&page=
 */
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
  const pageSize = 20;

  return fetchOrMock(
    `/api/ops/weddings?q=${encodeURIComponent(q)}&plan=${encodeURIComponent(plan)}&suspended=${encodeURIComponent(suspended)}&page=${page}`,
    { method: "GET" },
    () => {
      const store = getStore();
      let list = store.weddings;

      if (q) {
        list = list.filter(
          (w) =>
            w.slug.toLowerCase().includes(q) ||
            w.title.toLowerCase().includes(q) ||
            w.ownerEmail.toLowerCase().includes(q),
        );
      }

      if (plan && plan !== "all") {
        list = list.filter((w) => w.plan === plan);
      }

      if (suspended && suspended !== "all") {
        const isSuspended = suspended === "suspended";
        list = list.filter((w) => w.suspended === isSuspended);
      }

      const totalItems = list.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const startIndex = (page - 1) * pageSize;
      const sliced = list.slice(startIndex, startIndex + pageSize);

      const items: OpsWedding[] = sliced.map((w) => ({
        id: w.id,
        slug: w.slug,
        title: w.title,
        plan: w.plan,
        suspended: w.suspended,
        ownerEmail: w.ownerEmail,
        guestCount: w.guestCount,
        createdAt: w.createdAt,
      }));

      return {
        items,
        page,
        totalPages,
      };
    },
  );
}

/**
 * GET /api/ops/weddings/:id
 */
export async function getOpsWedding(id: string): Promise<OpsWeddingDetail | null> {
  try {
    return await fetchOrMock(
      `/api/ops/weddings/${encodeURIComponent(id)}`,
      { method: "GET" },
      () => null,
    );
  } catch (err) {
    if (err instanceof OpsApiError && err.code === "NOT_FOUND") return null;
    throw err;
  }
}

/**
 * POST /api/ops/weddings/:id/plan
 */
export async function updateOpsWeddingPlan(
  id: string,
  plan: WeddingPlan,
  reason: string,
): Promise<{ ok: boolean; plan: WeddingPlan }> {
  const reasonErr = validateReason(reason);
  if (reasonErr) throw new Error(reasonErr);

  return fetchOrMock(
    `/api/ops/weddings/${encodeURIComponent(id)}/plan`,
    {
      method: "POST",
      body: JSON.stringify({ plan, reason }),
    },
    () => {
      const store = getStore();
      const wedding = store.weddings.find((w) => w.id === id);
      if (!wedding) throw new Error("Không tìm thấy thiệp cưới");

      const oldPlan = wedding.plan;
      wedding.plan = plan;

      // Update in user details as well
      for (const u of store.users) {
        const wItem = u.weddings.find((item) => item.id === id);
        if (wItem) wItem.plan = plan;
      }

      // Add audit log
      store.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        adminEmail: store.adminEmail,
        action: "UPDATE_WEDDING_PLAN",
        targetType: "wedding",
        targetId: id,
        reason: `Đổi gói từ ${oldPlan.toUpperCase()} sang ${plan.toUpperCase()}: ${reason.trim()}`,
        createdAt: new Date().toISOString(),
      });

      saveStore(store);
      return { ok: true, plan };
    },
  );
}

/**
 * POST /api/ops/weddings/:id/suspend
 */
export async function updateOpsWeddingSuspend(
  id: string,
  suspended: boolean,
  reason: string,
): Promise<{ ok: boolean; suspended: boolean }> {
  const reasonErr = validateReason(reason);
  if (reasonErr) throw new Error(reasonErr);

  return fetchOrMock(
    `/api/ops/weddings/${encodeURIComponent(id)}/suspend`,
    {
      method: "POST",
      body: JSON.stringify({ suspended, reason }),
    },
    () => {
      const store = getStore();
      const wedding = store.weddings.find((w) => w.id === id);
      if (!wedding) throw new Error("Không tìm thấy thiệp cưới");

      wedding.suspended = suspended;

      for (const u of store.users) {
        const wItem = u.weddings.find((item) => item.id === id);
        if (wItem) wItem.suspended = suspended;
      }

      store.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        adminEmail: store.adminEmail,
        action: suspended ? "SUSPEND_WEDDING" : "UNSUSPEND_WEDDING",
        targetType: "wedding",
        targetId: id,
        reason: `${suspended ? "Khóa thiệp" : "Mở khóa thiệp"}: ${reason.trim()}`,
        createdAt: new Date().toISOString(),
      });

      saveStore(store);
      return { ok: true, suspended };
    },
  );
}

/**
 * GET /api/ops/orders?status=pending|paid|cancelled&q=&page=
 */
export async function getOpsOrders(params?: {
  status?: OpsOrderStatus;
  q?: string;
  page?: number;
}): Promise<PaginatedResult<OpsOrder>> {
  const status = params?.status;
  const q = params?.q?.trim().toLowerCase() || "";
  const page = Math.max(1, params?.page || 1);
  const pageSize = 20;

  return fetchOrMock(
    `/api/ops/orders?status=${status || ""}&q=${encodeURIComponent(q)}&page=${page}`,
    { method: "GET" },
    () => {
      const store = getStore();
      let list = store.orders;

      if (status) {
        list = list.filter((o) => o.status === status);
      }

      if (q) {
        list = list.filter(
          (o) =>
            o.code.toLowerCase().includes(q) ||
            o.ownerEmail.toLowerCase().includes(q),
        );
      }

      const totalItems = list.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const startIndex = (page - 1) * pageSize;
      const sliced = list.slice(startIndex, startIndex + pageSize);

      return {
        items: sliced,
        page,
        totalPages,
      };
    },
  );
}

/**
 * POST /api/ops/orders/:id/confirm
 */
export async function confirmOpsOrder(
  id: string,
  reason: string,
): Promise<{ ok: boolean; order: OpsOrder }> {
  const reasonErr = validateReason(reason);
  if (reasonErr) throw new Error(reasonErr);

  return fetchOrMock(
    `/api/ops/orders/${encodeURIComponent(id)}/confirm`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
    () => {
      const store = getStore();
      const order = store.orders.find((o) => o.id === id);
      if (!order) throw new Error("Không tìm thấy đơn hàng");
      if (order.status !== "pending") {
        const err = new Error("Đơn này đã được xử lý.");
        (err as unknown as { code: string }).code = "VALIDATION";
        throw err;
      }

      order.status = "paid";
      order.paidAt = new Date().toISOString();

      // Upgrade wedding plan if exists
      const wedding = store.weddings.find((w) => w.id === order.weddingId);
      if (wedding) {
        wedding.plan = order.plan;
      }

      store.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        adminEmail: store.adminEmail,
        action: "CONFIRM_ORDER",
        targetType: "order",
        targetId: id,
        reason: `Xác nhận nhận tiền đơn ${order.code}: ${reason.trim()}`,
        createdAt: new Date().toISOString(),
      });

      saveStore(store);
      return { ok: true, order };
    },
  );
}

/**
 * POST /api/ops/orders/:id/cancel
 */
export async function cancelOpsOrder(
  id: string,
  reason: string,
): Promise<{ ok: boolean; order: OpsOrder }> {
  const reasonErr = validateReason(reason);
  if (reasonErr) throw new Error(reasonErr);

  return fetchOrMock(
    `/api/ops/orders/${encodeURIComponent(id)}/cancel`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    },
    () => {
      const store = getStore();
      const order = store.orders.find((o) => o.id === id);
      if (!order) throw new Error("Không tìm thấy đơn hàng");
      if (order.status !== "pending") {
        const err = new Error("Đơn này đã được xử lý.");
        (err as unknown as { code: string }).code = "VALIDATION";
        throw err;
      }

      order.status = "cancelled";

      store.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        adminEmail: store.adminEmail,
        action: "CANCEL_ORDER",
        targetType: "order",
        targetId: id,
        reason: `Hủy đơn ${order.code}: ${reason.trim()}`,
        createdAt: new Date().toISOString(),
      });

      saveStore(store);
      return { ok: true, order };
    },
  );
}

/**
 * GET /api/ops/bank-transactions?unmatched=true&page=
 */
export async function getOpsBankTransactions(params?: {
  unmatched?: boolean;
  page?: number;
}): Promise<PaginatedResult<OpsBankTransaction>> {
  const page = Math.max(1, params?.page || 1);
  const pageSize = 20;

  return fetchOrMock(
    `/api/ops/bank-transactions?unmatched=true&page=${page}`,
    { method: "GET" },
    () => {
      const store = getStore();
      const list = store.transactions;

      const totalItems = list.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const startIndex = (page - 1) * pageSize;
      const sliced = list.slice(startIndex, startIndex + pageSize);

      return {
        items: sliced,
        page,
        totalPages,
      };
    },
  );
}

/**
 * POST /api/ops/bank-transactions/:id/match
 */
export async function matchOpsBankTransaction(
  id: string,
  orderId: string,
  reason: string,
): Promise<{ ok: boolean }> {
  const reasonErr = validateReason(reason);
  if (reasonErr) throw new Error(reasonErr);

  return fetchOrMock(
    `/api/ops/bank-transactions/${encodeURIComponent(id)}/match`,
    {
      method: "POST",
      body: JSON.stringify({ orderId, reason }),
    },
    () => {
      const store = getStore();
      const txIndex = store.transactions.findIndex((t) => t.id === id);
      if (txIndex === -1) throw new Error("Không tìm thấy giao dịch ngân hàng");
      const tx = store.transactions[txIndex];

      const order = store.orders.find((o) => o.id === orderId);
      if (!order) throw new Error("Không tìm thấy đơn hàng cần gán");

      order.status = "paid";
      order.paidAt = new Date().toISOString();

      const wedding = store.weddings.find((w) => w.id === order.weddingId);
      if (wedding) {
        wedding.plan = order.plan;
      }

      // Remove from unmatched transactions
      store.transactions.splice(txIndex, 1);

      store.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        adminEmail: store.adminEmail,
        action: "MATCH_TRANSACTION",
        targetType: "transaction",
        targetId: id,
        reason: `Gán giao dịch ${tx.ref} (${formatVnd(tx.amountVnd)}) vào đơn ${order.code}: ${reason.trim()}`,
        createdAt: new Date().toISOString(),
      });

      saveStore(store);
      return { ok: true };
    },
  );
}

/**
 * GET /api/ops/audit?page=
 */
export async function getOpsAudit(params?: {
  page?: number;
}): Promise<PaginatedResult<OpsAuditLog>> {
  const page = Math.max(1, params?.page || 1);
  const pageSize = 50;

  return fetchOrMock(
    `/api/ops/audit?page=${page}`,
    { method: "GET" },
    () => {
      const store = getStore();
      const list = store.auditLogs;

      const totalItems = list.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      const startIndex = (page - 1) * pageSize;
      const sliced = list.slice(startIndex, startIndex + pageSize);

      return {
        items: sliced,
        page,
        totalPages,
      };
    },
  );
}

