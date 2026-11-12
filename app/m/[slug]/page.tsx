import type { Metadata } from "next";
import { InvitePageClient } from "@/components/invitation/InvitePageClient";
import { getPublicWeddingByGuestSlug } from "@/lib/server/public-wedding";
import { createDefaultWeddingContent, toTemplateData } from "@/lib/wedding-data";
import { getTemplateMeta } from "@/templates/registry";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = await getPublicWeddingByGuestSlug(slug).catch(() => null);
  const content = wedding?.content ?? createDefaultWeddingContent();
  const templateData = toTemplateData({
    templateId: wedding?.templateId ?? "basic-1",
    weddingSlug: wedding?.slug,
    content,
    events: wedding?.events ?? [],
    photos: wedding?.photos ?? [],
  });
  const title = wedding ? templateData.ui.seoTitle : "Thiệp Cưới Online";
  const ogImage =
    templateData.photos.heroUrl ??
    getTemplateMeta(wedding?.templateId ?? "basic-1")?.coverImage;

  return {
    title,
    description: templateData.ui.seoDescription,
    robots: {
      index: false,
      follow: false,
    },
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

export default async function PersonalInvitePage({ params }: PageProps) {
  const { slug } = await params;
  const wedding = await getPublicWeddingByGuestSlug(slug).catch(() => null);
  const content = wedding?.content ?? createDefaultWeddingContent();
  const initialData = toTemplateData({
    templateId: wedding?.templateId ?? "basic-1",
    weddingSlug: wedding?.slug,
    content,
    events: wedding?.events ?? [],
    photos: wedding?.photos ?? [],
  });

  return (
    <InvitePageClient
      slug={slug}
      weddingSlug={wedding?.slug}
      templateId={wedding?.templateId}
      initialData={initialData}
      rawContent={content}
      rawPhotos={wedding?.photos ?? []}
    />
  );
}
