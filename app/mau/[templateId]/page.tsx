import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateDemoViewer } from "@/components/demo/template-demo-viewer";
import { SITE_NAME } from "@/config/site";
import { getAuth0 } from "@/lib/auth0";
import { getTemplateMeta } from "@/templates/registry";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ templateId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { templateId } = await params;
  const tpl = getTemplateMeta(templateId);

  if (!tpl) {
    return {
      title: `Không tìm thấy mẫu | ${SITE_NAME}`,
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Mẫu ${tpl.name} | ${SITE_NAME}`,
    description: tpl.description,
    robots: { index: false, follow: false },
  };
}

export default async function TemplateDemoPage({ params }: PageProps) {
  const { templateId } = await params;
  const tpl = getTemplateMeta(templateId);

  if (!tpl) {
    notFound();
  }

  let isAuthenticated = false;
  let userEmail: string | null = null;
  try {
    const session = await getAuth0().getSession();
    isAuthenticated = Boolean(session);
    if (session?.user) {
      const userObj = session.user as Record<string, unknown>;
      const rawEmail = userObj.email ?? userObj["https://thiepcuoi/email"];
      if (typeof rawEmail === "string" && rawEmail.trim()) {
        userEmail = rawEmail.trim();
      }
    }
  } catch {
    isAuthenticated = false;
    userEmail = null;
  }

  return (
    <TemplateDemoViewer
      template={tpl}
      isAuthenticated={isAuthenticated}
      userEmail={userEmail}
    />
  );
}
