import { getAccessToken } from "@auth0/nextjs-auth0";
import type {
  Guest,
  GuestStatus,
  Stats,
  UserProfile,
  Wedding,
  WeddingContent,
  Wish,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let cachedToken: { token: string; expiresAtMs: number } | null = null;
let inflightToken: Promise<string> | null = null;

export function clearAccessTokenCache(): void {
  cachedToken = null;
}

async function getBearerToken(): Promise<string> {
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
  try {
    const body = await res.json();
    if (body && typeof body.error === "string") message = body.error;
  } catch {}
  throw new ApiError(message, res.status);
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

const post = (body: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(body),
});

const patch = (body: unknown): RequestInit => ({
  method: "PATCH",
  body: JSON.stringify(body),
});

export async function getInvite(
  slug: string,
): Promise<{ name: string; status: GuestStatus } | null> {
  try {
    return await request(`/api/invite/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export interface SubmitRsvpInput {
  slug?: string;
  weddingSlug?: string;
  name?: string;
  status: "accepted" | "declined";
  website?: string;
}

export interface SubmitRsvpResponse {
  ok: boolean;
  slug?: string;
}

export async function submitRsvp(
  slug: string,
  status: "accepted" | "declined",
): Promise<SubmitRsvpResponse>;
export async function submitRsvp(input: SubmitRsvpInput): Promise<SubmitRsvpResponse>;
export async function submitRsvp(
  slugOrInput: string | SubmitRsvpInput,
  status?: "accepted" | "declined",
): Promise<SubmitRsvpResponse> {
  const payload =
    typeof slugOrInput === "string"
      ? { slug: slugOrInput, status }
      : slugOrInput;
  return request<SubmitRsvpResponse>("/api/rsvp", post(payload));
}

export async function submitWish(input: {
  slug?: string;
  weddingSlug?: string;
  name: string;
  message: string;
  website?: string;
}): Promise<void> {
  await request("/api/wishes", post(input));
}

export function syncMe(): Promise<UserProfile> {
  return authRequest("/api/me", { method: "POST" });
}

export function listWeddings(): Promise<Wedding[]> {
  return authRequest("/api/weddings");
}

export function getWedding(weddingId: string): Promise<Wedding> {
  return authRequest(`/api/weddings/${encodeURIComponent(weddingId)}`);
}

export function createWedding(input: {
  slug: string;
  templateId: string;
}): Promise<Wedding> {
  return authRequest("/api/weddings", post(input));
}

export function updateWedding(
  weddingId: string,
  body: { content?: WeddingContent; templateId?: string },
): Promise<Wedding> {
  return authRequest(`/api/weddings/${encodeURIComponent(weddingId)}`, patch(body));
}

export async function deleteWedding(weddingId: string): Promise<void> {
  await authRequest(`/api/weddings/${encodeURIComponent(weddingId)}`, {
    method: "DELETE",
  });
}

export function listGuests(weddingId: string): Promise<Guest[]> {
  return authRequest(`/api/weddings/${encodeURIComponent(weddingId)}/guests`);
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
  body: { name: string },
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
