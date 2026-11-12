import type { Metadata } from "next";
import { InvitePageClient } from "@/components/invitation/InvitePageClient";
import { WeddingContentProvider } from "@/components/invitation/WeddingContentProvider";
import { getPublicWeddingByGuestSlug } from "@/lib/server/public-wedding";
import { createDefaultWeddingContent } from "@/lib/wedding-content";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = await getPublicWeddingByGuestSlug(slug).catch(() => null);
  const content = wedding?.content ?? createDefaultWeddingContent();
  const title = wedding
    ? content.seo.title || `Thiệp Cưới ${content.groom.shortName} & ${content.bride.shortName}`
    : "Thiệp Cưới Online";

  return {
    title,
    description: content.seo.description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description: content.seo.description,
      type: "website",
      locale: "vi_VN",
      images: content.seo.ogImage
        ? [
            {
              url: content.seo.ogImage,
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

  return (
    <WeddingContentProvider content={content}>
      <InvitePageClient slug={slug} weddingSlug={wedding?.slug} />
    </WeddingContentProvider>
  );
}
