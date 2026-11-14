import { createClient } from "@supabase/supabase-js";

let cachedLocalEnv: Record<string, string> | null = null;
let lastEnvReadTime = 0;

function getLocalEnv(name: string): string | undefined {
  if (process.env.NODE_ENV === "production") return undefined;
  const now = Date.now();
  if (cachedLocalEnv && now - lastEnvReadTime < 2000) {
    return cachedLocalEnv[name];
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("node:path");
    const filePath = path.resolve(process.cwd(), ".env.local");
    if (!fs.existsSync(filePath)) return undefined;
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed: Record<string, string> = {};
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIdx = line.indexOf("=");
      if (eqIdx !== -1) {
        const k = line.slice(0, eqIdx).trim();
        const v = line.slice(eqIdx + 1).trim();
        parsed[k] = v.replace(/^["']|["']$/g, "");
      }
    }
    cachedLocalEnv = parsed;
    lastEnvReadTime = now;
    return parsed[name];
  } catch {
    // Fall back to process.env if fs is unavailable (e.g. edge runtime)
  }
  return undefined;
}

export function env(name: string): string {
  const localVal = getLocalEnv(name);
  if (localVal) {
    process.env[name] = localVal;
    return localVal;
  }
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };

export function db() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), options);
}
