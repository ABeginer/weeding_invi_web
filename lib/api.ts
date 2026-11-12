import type { Guest, GuestStatus, Stats, Wish } from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    let message = "Có lỗi xảy ra, vui lòng thử lại.";
    try {
      const body = await res.json();
      if (body && typeof body.error === "string") message = body.error;
    } catch { }
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
}

const post = (body: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(body) });

export async function getInvite(slug: string): Promise<{ name: string; status: GuestStatus } | null> {
  try {
    return await request(`/api/invite/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export interface SubmitRsvpInput {
  slug?: string;
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
  status: "accepted" | "declined"
): Promise<SubmitRsvpResponse>;
export async function submitRsvp(
  input: SubmitRsvpInput
): Promise<SubmitRsvpResponse>;
export async function submitRsvp(
  slugOrInput: string | SubmitRsvpInput,
  status?: "accepted" | "declined"
): Promise<SubmitRsvpResponse> {
  const payload =
    typeof slugOrInput === "string"
      ? { slug: slugOrInput, status }
      : slugOrInput;
  return request<SubmitRsvpResponse>("/api/rsvp", post(payload));
}

export async function submitWish(input: { slug?: string; name: string; message: string; website?: string }): Promise<void> {
  await request("/api/wishes", post(input));
}

export async function adminLogin(email: string, password: string): Promise<void> {
  await request("/api/admin/login", post({ email, password }));
}

export async function adminLogout(): Promise<void> {
  await request("/api/admin/logout", { method: "POST" });
}

export async function adminMe(): Promise<boolean> {
  try {
    await request("/api/admin/me");
    return true;
  } catch {
    return false;
  }
}

export function listGuests(): Promise<Guest[]> {
  return request("/api/admin/guests");
}

export function createGuest(name: string): Promise<Guest> {
  return request("/api/admin/guests", post({ name }));
}

export function createGuestsBulk(names: string[]): Promise<Guest[]> {
  return request("/api/admin/guests/bulk", post({ names }));
}

export function updateGuest(id: string, patch: { name: string }): Promise<Guest> {
  return request(`/api/admin/guests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function deleteGuest(id: string): Promise<void> {
  await request(`/api/admin/guests/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function listWishes(): Promise<Wish[]> {
  return request("/api/admin/wishes");
}

export function getStats(): Promise<Stats> {
  return request("/api/admin/stats");
}

export function buildGuestLink(slug: string): string {
  return `${window.location.origin}/m/${slug}`;
}
