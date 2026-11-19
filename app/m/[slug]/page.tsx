import type { Metadata } from "next";
import { cache } from "react";
import { headers } from "next/headers";
import { toAbsoluteSiteUrl } from "@/config/site";
import { DesignerInvitation } from "@/components/designer/designer-invitation";
import type { DesignerCanvasContent } from "@/components/ops/designer-types";
import { FreeInviteLimit } from "@/components/invitation/FreeInviteLimit";
import { InvitePageClient } from "@/components/invitation/InvitePageClient";
import { buildDesignerInviteValues } from "@/lib/designer-invite";
import {
  FREE_INVITE_VIEW_LIMIT,
  isLikelyCrawler,
  trackGuestView,
} from "@/lib/server/invite-limits";
import { getPublicWeddingByGuestSlug } from "@/lib/server/public-wedding";
import { buildSalutation } from "@/lib/salutation-engine";
import { formatWeddingDateParts } from "@/lib/utils";
import { createDefaultWeddingContent, toTemplateData } from "@/lib/wedding-data";
import { getTemplateMeta } from "@/templates/registry";

export const dynamic = "force-dynamic";

// metadata + page dùng chung một lần đọc DB trong cùng request.
const getWeddingByGuestSlug = cache(getPublicWeddingByGuestSlug);

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = await getWeddingByGuestSlug(slug).catch(() => null);
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
  // Chủ thiệp bật/tắt trong dashboard (content.shareGuestName); ENV chỉ là fallback cũ.
  const showGuestName =
    content.shareGuestName === true ||
    process.env.SHARE_SHOW_GUEST_NAME === "true";
  const title =
    wedding && showGuestName && wedding.guestName?.trim()
      ? `${baseTitle} — Kính mời ${wedding.guestName.trim()}`
      : baseTitle;

  const trimmedQuote = content.quote.trim();
  const description =
    trimmedQuote.length > 0
      ? trimmedQuote.slice(0, 160)
      : "Mời bạn xem thiệp cưới của chúng tôi";

  const coupleLabel = `${templateData.couple.groomName} & ${templateData.couple.brideName}`;
  const dateLabel = content.date.slice(0, 10).split("-").reverse().join(".");
  const rawOgImage =
    wedding?.photos.find((p) => p.kind === "og")?.url ??
    templateData.photos.heroUrl ??
    getTemplateMeta(templateId)?.coverImage;
  const ogImageUrl = showGuestName && wedding?.guestName
    ? toAbsoluteSiteUrl(
        `/api/og/invite?couple=${encodeURIComponent(coupleLabel)}&guest=${encodeURIComponent(wedding.guestName)}&date=${encodeURIComponent(dateLabel)}&style=olive`,
      )
    : rawOgImage
      ? toAbsoluteSiteUrl(rawOgImage)
      : undefined;
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
  const wedding = await getWeddingByGuestSlug(slug).catch(() => null);
  const content = wedding?.content ?? createDefaultWeddingContent();

  // Gói Free: mỗi link cá nhân chỉ được mở 30 lượt. Đếm mỗi lượt mở (không
  // phân biệt thiết bị); bot/preview của Zalo-Facebook thì không tính.
  if (wedding && wedding.plan === "free") {
    const userAgent = (await headers()).get("user-agent");
    if (!isLikelyCrawler(userAgent)) {
      const viewCount = await trackGuestView(wedding.guestId);
      if (viewCount !== null && viewCount > FREE_INVITE_VIEW_LIMIT) {
        const limitedData = toTemplateData({
          templateId: wedding.templateId,
          plan: wedding.plan,
          weddingSlug: wedding.slug,
          content,
          events: wedding.events,
          photos: wedding.photos,
        });
        return (
          <FreeInviteLimit
            data={limitedData}
            inviteSlug={slug}
            weddingSlug={wedding.slug}
            guestName={wedding.guestName}
            initialStatus={wedding.rsvpStatus}
            initialPlusOnes={wedding.plusOnes}
            initialDiet={wedding.diet}
            initialSongRequest={wedding.songRequest}
            initialRideNeeded={wedding.rideNeeded}
          />
        );
      }
    }
  }

  // Thiệp đã ghim mẫu designer: render đúng layout của version đó với dữ liệu thật.
  if (wedding?.designerTemplate) {
    const salutation = buildSalutation({
      guestName: wedding.guestName,
      relationshipGroup: wedding.guestSalutation.relationshipGroup,
      customPronounHost: wedding.guestSalutation.customPronounHost,
      customPronounGuest: wedding.guestSalutation.customPronounGuest,
    });
    const values = buildDesignerInviteValues({
      groomName: content.couple.groomName,
      brideName: content.couple.brideName,
      dateLabel: formatWeddingDateParts(content.date).dotDate,
      dateIso: content.date,
      events: wedding.events,
      guestName: wedding.guestName,
      salutation: salutation.invitePrefix,
      designerFields: content.designerFields,
      hasGifts: Boolean(
        content.gift?.groomAccountNumber ||
        content.gift?.brideAccountNumber,
      ),
      hasPhotos: Boolean(wedding.photos?.length),
      photoCount: wedding.photos?.length ?? 0,
      hasMusic: true,
      musicTitle: "Nhạc nền",
      musicUrl: "/media/wedding.mp3",
    });
    const designerData = toTemplateData({
      templateId: wedding.templateId,
      plan: wedding.plan,
      weddingSlug: wedding.slug,
      content,
      events: wedding.events,
      photos: wedding.photos,
    });

    return (
      <DesignerInvitation
        canvas={
          wedding.designerTemplate.canvas as unknown as DesignerCanvasContent
        }
        values={values}
        coupleLabel={`${content.couple.groomName} & ${content.couple.brideName}`}
        data={designerData}
        weddingSlug={wedding.slug}
        guestName={wedding.guestName}
        invitationMode="personal"
        plan={wedding.plan}
        overrides={content.designerOverrides}
        initialStatus={wedding.rsvpStatus}
        initialPlusOnes={wedding.plusOnes}
        initialDiet={wedding.diet}
        initialSongRequest={wedding.songRequest}
        initialRideNeeded={wedding.rideNeeded}
      />
    );
  }

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
