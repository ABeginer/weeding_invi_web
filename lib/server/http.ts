import { NextResponse } from "next/server";
import { getUser, type AuthUser } from "./auth";

export const SLUG_RE = /^[a-f0-9]{12}$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function json(data: unknown, status = 200, headers?: HeadersInit): Response {
  return NextResponse.json(data, {
    status,
    headers: headers ?? { "Cache-Control": "no-store" },
  });
}

export function fail(message: string, status = 400): Response {
  return json({ error: message }, status);
}

export async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await req.json();
    return body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length >= 1 && trimmed.length <= max ? trimmed : null;
}

export function route<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error(error);
      return fail("Có lỗi xảy ra, vui lòng thử lại.", 500);
    }
  };
}

export function authRoute<C = { params: Promise<Record<string, string>> }>(
  handler: (req: Request, user: AuthUser, context: C) => Promise<Response>,
) {
  return route(async (req: Request, context: C) => {
    const user = await getUser(req);
    if (!user) return fail("Bạn chưa đăng nhập.", 401);
    return handler(req, user, context);
  });
}
