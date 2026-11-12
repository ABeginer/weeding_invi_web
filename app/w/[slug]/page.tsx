import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicWeddingBySlug } from "@/lib/server/public-wedding";
import { toTemplateData } from "@/lib/wedding-data";
import { getTemplateMeta } from "@/templates/registry";
import { LiveTemplateRenderer } from "@/templates/LiveTemplateRenderer";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = await getPublicWeddingBySlug(slug).catch(() => null);

  if (!wedding) {
    return {
      title: "Không tìm thấy thiệp cưới",
    };
  }

  const templateData = toTemplateData({
    templateId: wedding.templateId,
    weddingSlug: wedding.slug,
    content: wedding.content,
    events: wedding.events,
    photos: wedding.photos,
  });
  const title = templateData.ui.seoTitle;
  const ogImage =
    templateData.photos.heroUrl ??
    getTemplateMeta(wedding.templateId)?.coverImage;

  return {
    title,
    description: templateData.ui.seoDescription,
    openGraph: {
      title,
      description: templateData.ui.seoDescription,
      type: "website",
      locale: "vi_VN",
      images: ogImage
        ? [
            {
              url: ogImage,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
  };
}

export default async function PublicWeddingPage({ params }: PageProps) {
  const { slug } = await params;
  const wedding = await getPublicWeddingBySlug(slug);

  if (!wedding) {
    notFound();
  }

  const templateData = toTemplateData({
    templateId: wedding.templateId,
    weddingSlug: wedding.slug,
    content: wedding.content,
    events: wedding.events,
    photos: wedding.photos,
  });

  return (
    <LiveTemplateRenderer
      templateId={wedding.templateId}
      data={templateData}
      weddingSlug={wedding.slug}
      invitationMode="public"
    />
  );
}
