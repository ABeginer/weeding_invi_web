import type { Metadata } from "next";
import { toAbsoluteSiteUrl } from "@/config/site";
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
  const templateId = wedding?.templateId ?? "basic-1";
  const templateData = toTemplateData({
    templateId,
    plan: wedding?.plan ?? "free",
    weddingSlug: wedding?.slug,
    content,
    events: wedding?.events ?? [],
    photos: wedding?.photos ?? [],
  });

  const baseTitle = wedding
    ? `Thiệp cưới ${templateData.couple.groomName} & ${templateData.couple.brideName}`
    : "Thiệp Cưới Online";
  const showGuestName = process.env.SHARE_SHOW_GUEST_NAME === "true";
  const title =
    wedding && showGuestName && wedding.guestName?.trim()
      ? `${baseTitle} — Kính mời ${wedding.guestName.trim()}`
      : baseTitle;

  const trimmedQuote = content.quote.trim();
  const description =
    trimmedQuote.length > 0
      ? trimmedQuote.slice(0, 160)
      : "Mời bạn xem thiệp cưới của chúng tôi";

  const rawOgImage =
    wedding?.photos.find((p) => p.kind === "og")?.url ??
    templateData.photos.heroUrl ??
    getTemplateMeta(templateId)?.coverImage;
  const ogImageUrl = rawOgImage ? toAbsoluteSiteUrl(rawOgImage) : undefined;
  const pageUrl = toAbsoluteSiteUrl(`/m/${slug}`);

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
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

export default async function PersonalInvitePage({ params }: PageProps) {
  const { slug } = await params;
  const wedding = await getPublicWeddingByGuestSlug(slug).catch(() => null);
  const content = wedding?.content ?? createDefaultWeddingContent();
  const plan = wedding?.plan ?? "free";
  const initialData = toTemplateData({
    templateId: wedding?.templateId ?? "basic-1",
    plan,
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
      plan={plan}
      initialData={initialData}
      rawContent={content}
      rawPhotos={wedding?.photos ?? []}
      guestExists={Boolean(wedding)}
      initialGuestName={wedding?.guestName ?? null}
    />
  );
}
