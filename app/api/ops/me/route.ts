import { getUser } from "@/lib/server/auth";
import { json } from "@/lib/server/http";
import { resolveOpsRole } from "@/lib/server/ops";

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user || !user.email) {
    return json({ email: "", isAdmin: false, role: null });
  }

  // Env admin luôn thắng; role DB chỉ bổ sung. Không có bảng ops_members
  // (chưa chạy v16) thì chỉ env admin còn hoạt động, designer chưa dùng được.
  const role = await resolveOpsRole(user.email);

  return json({
    email: user.email,
    isAdmin: role === "admin",
    role,
  });
}
