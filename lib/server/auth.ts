import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "./supabase";

export interface AuthUser {
  id: string;
  email: string | null;
}

const EMAIL_CLAIM = "https://thiepcuoi/email";

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
    const rawEmail = payload[EMAIL_CLAIM];
    const email = typeof rawEmail === "string" ? rawEmail : null;
    return { id: payload.sub, email };
  } catch {
    return null;
  }
}

