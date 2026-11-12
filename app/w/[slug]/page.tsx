import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationShell } from "@/components/invitation/InvitationShell";
import { WeddingContentProvider } from "@/components/invitation/WeddingContentProvider";
import { WeddingInvitationContent } from "@/components/invitation/WeddingInvitationContent";
import { getPublicWeddingBySlug } from "@/lib/server/public-wedding";

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

  const { seo, groom, bride } = wedding.content;
  const title = seo.title || `Thiệp Cưới ${groom.shortName} & ${bride.shortName}`;

  return {
    title,
    description: seo.description,
    openGraph: {
      title,
      description: seo.description,
      type: "website",
      locale: "vi_VN",
      images: seo.ogImage
        ? [
            {
              url: seo.ogImage,
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

  return (
    <WeddingContentProvider content={wedding.content}>
      <InvitationShell>
        <WeddingInvitationContent mode="public" weddingSlug={wedding.slug} />
      </InvitationShell>
    </WeddingContentProvider>
  );
}

