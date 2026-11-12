import { createClient } from "@supabase/supabase-js";

export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

const options = { auth: { persistSession: false, autoRefreshToken: false } };

export function db() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SECRET_KEY"), options);
}

export function authClient() {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_PUBLISHABLE_KEY"), options);
}
