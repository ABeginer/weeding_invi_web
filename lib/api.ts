import { getAccessToken } from "@auth0/nextjs-auth0";
import type { BrandThemeMode } from "./brand-theme";
import type {
  DesignerTemplateAssignmentResult,
  DesignerTemplateOption,
  Guest,
  GuestDiet,
  GuestStatus,
  Gift,
  GiftMethod,
  GiftTotals,
  InviteResponse,
  PhotoKind,
  PhotoSlot,
  PublicWeddingPayload,
  Stats,
  UserProfile,
  Wedding,
  WeddingContent,
  WeddingDetail,
  WeddingEvent,
  WeddingPhoto,
  Wish,
  CreatedOrder,
  OrderStatusResponse,
  CreateOrderInput,
} from "./types";

export class ApiError extends Error {
  status: number;
  field?: string;
  code?: string;
  constructor(message: string, status: number, field?: string, code?: string) {
    super(message);
    this.status = status;
    this.field = field;
    this.code = code;
  }
}

let cachedToken: { token: string; expiresAtMs: number } | null = null;
let inflightToken: Promise<string> | null = null;

export function clearAccessTokenCache(): void {
  cachedToken = null;
}

export async function getBearerToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs - 30_000 > now) {
    return cachedToken.token;
  }

  if (!inflightToken) {
    inflightToken = (async () => {
      try {
        const res = await getAccessToken({ includeFullResponse: true });
        if (!res?.token) {
          throw new ApiError("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.", 401);
        }
        const expiresAtMs = res.expires_at
          ? res.expires_at * 1000
          : res.expires_in
            ? Date.now() + res.expires_in * 1000
            : Date.now() + 5 * 60_000;
        cachedToken = { token: res.token, expiresAtMs };
        return res.token;
      } catch (err) {
        cachedToken = null;
        if (err instanceof ApiError) throw err;
        throw new ApiError("Bạn chưa đăng nhập hoặc phiên đã hết hạn.", 401);
      } finally {
        inflightToken = null;
      }
    })();
  }

  return inflightToken;
}

async function parseErrorResponse(res: Response): Promise<never> {
  let message = "Có lỗi xảy ra, vui lòng thử lại.";
  let field: string | undefined;
  let code: string | undefined;
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") message = body.error;
    if (body && typeof body.field === "string") field = body.field;
    if (body && typeof body.code === "string") code = body.code;
  } catch {}
  throw new ApiError(message, res.status, field, code);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    await parseErrorResponse(res);
  }

  return (await res.json()) as T;
}

async function authRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getBearerToken();
  const res = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (res.status === 401) {
    clearAccessTokenCache();
  }

  if (!res.ok) {
    await parseErrorResponse(res);
  }

  return (await res.json()) as T;
}

async function authFormRequest<T>(path: string, formData: FormData): Promise<T> {
  const token = await getBearerToken();
  const res = await fetch(path, {
    method: "POST",
    body: formData,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    clearAccessTokenCache();
  }

  if (!res.ok) {
    await parseErrorResponse(res);
  }

  return (await res.json()) as T;
}

const post = (body: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(body),
});

const patch = (body: unknown): RequestInit => ({
  method: "PATCH",
  body: JSON.stringify(body),
});

export async function getInvite(slug: string): Promise<InviteResponse | null> {
  try {
    return await request<InviteResponse>(`/api/invite/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function getPublicWedding(
  slug: string,
): Promise<PublicWeddingPayload | null> {
  try {
    return await request<PublicWeddingPayload>(
      `/api/public/wedding/${encodeURIComponent(slug)}`,
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function checkWeddingSlugAvailability(slug: string): Promise<{
  valid: boolean;
  available: boolean;
  error?: string;
}> {
  return request<{ valid: boolean; available: boolean; error?: string }>(
    `/api/weddings/check-slug?slug=${encodeURIComponent(slug)}`,
  );
}

export interface SubmitRsvpInput {
  slug?: string;
  weddingSlug?: string;
  name?: string;
  status: "accepted" | "declined";
  plusOnes?: number;
  diet?: GuestDiet | null;
  songRequest?: string | null;
  rideNeeded?: boolean;
  wish?: string;
  turnstileToken?: string;
  website?: string;
}

export interface SubmitRsvpResponse {
  ok: boolean;
  slug?: string;
  wishSaved?: boolean;
}

export async function submitRsvp(
  slug: string,
  status: "accepted" | "declined",
  extras?: {
    plusOnes?: number;
    diet?: GuestDiet | null;
    songRequest?: string | null;
    rideNeeded?: boolean;
    wish?: string;
    turnstileToken?: string;
  },
): Promise<SubmitRsvpResponse>;
export async function submitRsvp(input: SubmitRsvpInput): Promise<SubmitRsvpResponse>;
export async function submitRsvp(
  slugOrInput: string | SubmitRsvpInput,
  status?: "accepted" | "declined",
  extras?: {
    plusOnes?: number;
    diet?: GuestDiet | null;
    songRequest?: string | null;
    rideNeeded?: boolean;
    wish?: string;
    turnstileToken?: string;
  },
): Promise<SubmitRsvpResponse> {
  const payload =
    typeof slugOrInput === "string"
      ? {
          slug: slugOrInput,
          status,
          ...(extras?.plusOnes !== undefined ? { plusOnes: extras.plusOnes } : {}),
          ...(extras?.diet !== undefined ? { diet: extras.diet } : {}),
          ...(extras?.songRequest !== undefined ? { songRequest: extras.songRequest } : {}),
          ...(extras?.rideNeeded !== undefined ? { rideNeeded: extras.rideNeeded } : {}),
          ...(extras?.wish ? { wish: extras.wish } : {}),
          ...(extras?.turnstileToken ? { turnstileToken: extras.turnstileToken } : {}),
        }
      : slugOrInput;
  return request<SubmitRsvpResponse>("/api/rsvp", post(payload));
}

export async function submitWish(input: {
  slug?: string;
  weddingSlug?: string;
  name: string;
  message: string;
  turnstileToken?: string;
  website?: string;
}): Promise<void> {
  await request("/api/wishes", post(input));
}

export function syncMe(): Promise<UserProfile> {
  return authRequest("/api/me", { method: "POST" });
}

export function updateMyTheme(
  theme: BrandThemeMode,
): Promise<{ theme: BrandThemeMode }> {
  return authRequest("/api/me/theme", patch({ theme }));
}

export function listWeddings(): Promise<Wedding[]> {
  return authRequest("/api/weddings");
}

export function getWedding(weddingId: string): Promise<WeddingDetail> {
  return authRequest(`/api/weddings/${encodeURIComponent(weddingId)}`);
}

export function createWedding(input: {
  slug: string;
  templateId: string;
  content?: Partial<WeddingContent>;
}): Promise<Wedding> {
  return authRequest("/api/weddings", post(input));
}

export function updateWedding(
  weddingId: string,
  body: { content?: WeddingContent; templateId?: string },
): Promise<Wedding> {
  return authRequest(`/api/weddings/${encodeURIComponent(weddingId)}`, patch(body));
}

export function updateContent(
  weddingId: string,
  body: { templateId?: string; content: WeddingContent },
): Promise<Wedding> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/content`,
    patch(body),
  );
}

export async function deleteWedding(weddingId: string): Promise<void> {
  await authRequest(`/api/weddings/${encodeURIComponent(weddingId)}`, {
    method: "DELETE",
  });
}

export function listDesignerTemplateOptions(): Promise<{
  items: DesignerTemplateOption[];
}> {
  return authRequest("/api/designer-templates");
}

export function assignDesignerTemplate(
  weddingId: string,
  input: { designerTemplateId: string | null; version?: number },
): Promise<DesignerTemplateAssignmentResult> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/designer-template`,
    patch(input),
  );
}

export interface WeddingEventPayload {
  title: string;
  startsAt: string;
  lunarDate?: string;
  venueName: string;
  venueAddress?: string;
  mapEmbedUrl?: string | null;
  mapDirectionsUrl?: string | null;
}

export function listEvents(weddingId: string): Promise<WeddingEvent[]> {
  return authRequest(`/api/weddings/${encodeURIComponent(weddingId)}/events`);
}

export function createEvent(
  weddingId: string,
  input: WeddingEventPayload,
): Promise<WeddingEvent> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/events`,
    post(input),
  );
}

export function updateEvent(
  weddingId: string,
  eventId: string,
  input: WeddingEventPayload,
): Promise<WeddingEvent> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/events/${encodeURIComponent(eventId)}`,
    patch(input),
  );
}

export function reorderEvents(
  weddingId: string,
  items: { id: string; position: number }[],
): Promise<WeddingEvent[]> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/events`,
    patch(items),
  );
}

export async function deleteEvent(
  weddingId: string,
  eventId: string,
): Promise<void> {
  await authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/events/${encodeURIComponent(eventId)}`,
    { method: "DELETE" },
  );
}

export function listPhotos(weddingId: string): Promise<WeddingPhoto[]> {
  return authRequest(`/api/weddings/${encodeURIComponent(weddingId)}/photos`);
}

export function uploadPhoto(
  weddingId: string,
  file: File | Blob,
  kind: PhotoKind,
  slot?: PhotoSlot,
  fileName?: string,
): Promise<{ photo: WeddingPhoto; content: WeddingContent }> {
  const formData = new FormData();
  if (file instanceof File) {
    formData.append("file", file);
  } else {
    formData.append("file", file, fileName ?? "photo.webp");
  }
  formData.append("kind", kind);
  if (slot) {
    formData.append("slot", slot);
  }
  return authFormRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/photos`,
    formData,
  );
}

export async function deletePhoto(
  weddingId: string,
  photoId: string,
): Promise<{ ok: boolean; content: WeddingContent }> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/photos/${encodeURIComponent(photoId)}`,
    { method: "DELETE" },
  );
}

export function reorderPhotos(
  weddingId: string,
  items: { id: string; position: number }[],
): Promise<WeddingPhoto[]> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/photos`,
    patch(items),
  );
}

export function listGuests(weddingId: string): Promise<Guest[]> {
  return authRequest(`/api/weddings/${encodeURIComponent(weddingId)}/guests`);
}

export interface GuestPage {
  items: Guest[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function listGuestsPage(
  weddingId: string,
  options?: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: GuestStatus | "all";
  },
): Promise<GuestPage> {
  const search = new URLSearchParams();
  search.set("page", String(options?.page ?? 1));
  if (options?.pageSize) search.set("pageSize", String(options.pageSize));
  const q = options?.q?.trim();
  if (q) search.set("q", q);
  if (options?.status && options.status !== "all") {
    search.set("status", options.status);
  }
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/guests?${search.toString()}`,
  );
}

export function createGuest(weddingId: string, name: string): Promise<Guest> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/guests`,
    post({ name }),
  );
}

export function createGuestsBulk(weddingId: string, names: string[]): Promise<Guest[]> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/guests/bulk`,
    post({ names }),
  );
}

export function updateGuest(
  weddingId: string,
  guestId: string,
  body: {
    name: string;
    relationshipGroup?: Guest["relationshipGroup"] | null;
    customPronounHost?: string | null;
    customPronounGuest?: string | null;
    tableNumber?: string | null;
    dietaryPreference?: Guest["dietaryPreference"] | null;
  },
): Promise<Guest> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/guests/${encodeURIComponent(guestId)}`,
    patch(body),
  );
}

export async function deleteGuest(weddingId: string, guestId: string): Promise<void> {
  await authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/guests/${encodeURIComponent(guestId)}`,
    { method: "DELETE" },
  );
}

export function setGuestEvents(
  weddingId: string,
  guestId: string,
  eventIds: string[],
): Promise<{ guestId: string; eventIds: string[] }> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/guests/${encodeURIComponent(guestId)}/events`,
    post({ eventIds }),
  );
}

export function listGifts(
  weddingId: string,
): Promise<{ items: Gift[]; totals: GiftTotals }> {
  return authRequest(`/api/weddings/${encodeURIComponent(weddingId)}/gifts`);
}

export function createGift(
  weddingId: string,
  input: {
    giverName: string;
    amountVnd: number;
    method: GiftMethod;
    note?: string | null;
    guestId?: string | null;
  },
): Promise<Gift> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/gifts`,
    post(input),
  );
}

export function updateGift(
  weddingId: string,
  giftId: string,
  input: Partial<{
    giverName: string;
    amountVnd: number;
    method: GiftMethod;
    note: string | null;
    guestId: string | null;
    thanked: boolean;
  }>,
): Promise<Gift> {
  return authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/gifts/${encodeURIComponent(giftId)}`,
    patch(input),
  );
}

export async function deleteGift(
  weddingId: string,
  giftId: string,
): Promise<void> {
  await authRequest(
    `/api/weddings/${encodeURIComponent(weddingId)}/gifts/${encodeURIComponent(giftId)}`,
    { method: "DELETE" },
  );
}

export function listWishes(weddingId: string): Promise<Wish[]> {
  return authRequest(`/api/weddings/${encodeURIComponent(weddingId)}/wishes`);
}

export function getStats(weddingId: string): Promise<Stats> {
  return authRequest(`/api/weddings/${encodeURIComponent(weddingId)}/stats`);
}

export function buildGuestLink(slug: string): string {
  return `${window.location.origin}/m/${slug}`;
}

export function buildWeddingLink(slug: string): string {
  return `${window.location.origin}/w/${slug}`;
}

export function createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
  return authRequest("/api/orders", post(input));
}

export function getOrder(orderId: string): Promise<OrderStatusResponse> {
  return authRequest(`/api/orders/${encodeURIComponent(orderId)}`);
}

