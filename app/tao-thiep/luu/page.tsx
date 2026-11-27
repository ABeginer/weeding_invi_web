import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SaveDraftPageClient } from "@/components/create/SaveDraftPageClient";
import { AUTH0_EMAIL_CLAIM, SITE_NAME } from "@/config/site";
import { getAuth0 } from "@/lib/auth0";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Đang lưu thiệp cưới | ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default async function SaveDraftPage() {
  const session = await getAuth0().getSession();
  if (!session) {
    redirect("/auth/login?returnTo=/tao-thiep/luu");
  }

  const userObj = session.user as Record<string, unknown> | undefined;
  const rawEmail = userObj?.email ?? userObj?.[AUTH0_EMAIL_CLAIM];
  const userEmail = typeof rawEmail === "string" && rawEmail.trim() ? rawEmail.trim() : null;

  return <SaveDraftPageClient userEmail={userEmail} />;
}

