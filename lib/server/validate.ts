import { UUID_RE } from "./http";

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function isHttpsUrl(value: unknown, max: number): value is string {
  if (typeof value !== "string" || value.length > max) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function isInt(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}
