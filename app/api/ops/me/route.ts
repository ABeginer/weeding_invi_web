import { getUser } from "@/lib/server/auth";
import { json } from "@/lib/server/http";
import { getAdminEmails } from "@/lib/server/ops";

export async function GET(req: Request) {
  const user = await getUser(req);
  if (!user || !user.email) {
    return json({ email: "", isAdmin: false });
  }

  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.length === 0 || adminEmails.includes(user.email.toLowerCase());

  return json({
    email: user.email,
    isAdmin,
  });
}

