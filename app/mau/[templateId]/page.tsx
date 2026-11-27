import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TemplateDemoViewer } from "@/components/demo/template-demo-viewer";
import { SITE_NAME } from "@/config/site";
import { getTemplateMeta } from "@/templates/registry";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ embed?: string; opened?: string; externalAudio?: string; silent?: string }>;
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

export default async function TemplateDemoPage({ params, searchParams }: PageProps) {
  const { templateId } = await params;
  const { embed, opened, externalAudio } = await searchParams;
  const tpl = getTemplateMeta(templateId);

  if (!tpl) {
    notFound();
  }

  // Trạng thái đăng nhập được đọc nhẹ phía client qua useUser() trong TemplateDemoViewer,
  // tránh chặn SSR/TTFB bởi Auth0 trên cả bản chính lẫn ?embed=1.
  return (
    <TemplateDemoViewer
      template={tpl}
      isAuthenticated={false}
      userEmail={null}
      embed={embed === "1"}
      initialOpened={opened === "1"}
      externalAudio={externalAudio === "1" || embed === "1"}
    />
  );
}
