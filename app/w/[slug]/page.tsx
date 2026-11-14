import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { toAbsoluteSiteUrl } from "@/config/site";
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
      robots: { index: false, follow: false },
    };
  }

  const templateData = toTemplateData({
    templateId: wedding.templateId,
    plan: wedding.plan,
    weddingSlug: wedding.slug,
    content: wedding.content,
    events: wedding.events,
    photos: wedding.photos,
  });
  const title = `Thiệp cưới ${templateData.couple.groomName} & ${templateData.couple.brideName}`;
  const trimmedQuote = wedding.content.quote.trim();
  const description =
    trimmedQuote.length > 0
      ? trimmedQuote.slice(0, 160)
      : "Mời bạn xem thiệp cưới của chúng tôi";

  const rawOgImage =
    wedding.photos.find((p) => p.kind === "og")?.url ??
    templateData.photos.heroUrl ??
    getTemplateMeta(wedding.templateId)?.coverImage;
  const ogImageUrl = rawOgImage ? toAbsoluteSiteUrl(rawOgImage) : undefined;
  const pageUrl = toAbsoluteSiteUrl(`/w/${wedding.slug}`);

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "vi_VN",
      url: pageUrl,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
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
    plan: wedding.plan,
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
