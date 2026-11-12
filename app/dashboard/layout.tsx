import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuth0 } from "@/lib/auth0";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Quản lý thiệp cưới",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getAuth0().getSession();
  if (!session) {
    redirect("/auth/login");
  }

  const userObj = session.user as Record<string, unknown> | undefined;
  const rawEmail = userObj?.email ?? userObj?.["https://thiepcuoi/email"];
  const userEmail = typeof rawEmail === "string" ? rawEmail : null;

  return <DashboardShell userEmail={userEmail}>{children}</DashboardShell>;
}

