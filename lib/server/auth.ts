import { createRemoteJWKSet, jwtVerify } from "jose";
import { AUTH0_EMAIL_CLAIM } from "@/config/site";
import { env } from "./supabase";

export interface AuthUser {
  id: string;
  email: string | null;
  emailVerified?: boolean;
}

let keys: ReturnType<typeof createRemoteJWKSet> | null = null;

function jwks() {
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`https://${env("AUTH0_DOMAIN")}/.well-known/jwks.json`));
  }
  return keys;
}

export async function getUser(req: Request): Promise<AuthUser | null> {
  const match = /^Bearer (.+)$/.exec(req.headers.get("authorization") ?? "");
  if (!match) return null;

  try {
    const { payload } = await jwtVerify(match[1], jwks(), {
      issuer: `https://${env("AUTH0_DOMAIN")}/`,
      audience: env("AUTH0_AUDIENCE"),
      algorithms: ["RS256"],
    });
    if (typeof payload.sub !== "string") return null;
    const rawEmail = payload[AUTH0_EMAIL_CLAIM];
    const email = typeof rawEmail === "string" ? rawEmail : null;
    const rawVerified =
      payload["https://thiepcuoi/email_verified"] ?? payload.email_verified;
    const emailVerified =
      typeof rawVerified === "boolean" ? rawVerified : undefined;
    return { id: payload.sub, email, emailVerified };
  } catch {
    return null;
  }
}

