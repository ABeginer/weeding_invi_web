import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE_NAME } from "@/config/site";
import { getAuth0 } from "@/lib/auth0";
import { getTemplateMeta } from "@/templates/registry";
import { TemplateDemoViewer } from "@/components/demo/template-demo-viewer";

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
  try {
    const session = await getAuth0().getSession();
    isAuthenticated = Boolean(session);
  } catch {
    isAuthenticated = false;
  }

  return <TemplateDemoViewer template={tpl} isAuthenticated={isAuthenticated} />;
}

