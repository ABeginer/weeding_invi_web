import { adminRoute, json } from "@/lib/server/http";

export const GET = adminRoute(async () => json({ ok: true }));
