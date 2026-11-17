import { notFound } from "next/navigation";
import { getAuth0 } from "@/lib/auth0";
import { resolveOpsRole } from "./ops";
import type { OpsRole } from "../ops-roles";

/**
 * Role của người đang đăng nhập cho server component dưới /ops.
 * Client layout chỉ là lớp UI; các trang server phải tự chặn để không lộ
 * canvas/nội dung mẫu trong RSC payload cho người ngoài.
 */
export async function getOpsPageRole(): Promise<OpsRole | null> {
  try {
    const session = await getAuth0().getSession();
    const email = session?.user?.email;
    if (!email) return null;
    return await resolveOpsRole(email);
  } catch (error) {
    console.error("[Ops Page Role Error]", error);
    return null;
  }
}

export async function requireOpsPageRole(allowed: OpsRole[]): Promise<OpsRole> {
  const role = await getOpsPageRole();
  if (!role || !allowed.includes(role)) notFound();
  return role;
}
