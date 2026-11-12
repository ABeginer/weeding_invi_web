import { destroySession } from "@/lib/server/session";
import { json, route } from "@/lib/server/http";

export const POST = route(async () => {
  await destroySession();
  return json({ ok: true });
});
