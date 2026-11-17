import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { toAbsoluteSiteUrl } from "@/config/site";
import { DesignerInvitation } from "@/components/designer/designer-invitation";
import type { DesignerCanvasContent } from "@/components/ops/designer-types";
import { buildDesignerInviteValues } from "@/lib/designer-invite";
import { formatWeddingDateParts } from "@/lib/utils";
import { getPublicWeddingBySlug } from "@/lib/server/public-wedding";
import { toTemplateData } from "@/lib/wedding-data";
import { getTemplateMeta } from "@/templates/registry";
import { LiveTemplateRenderer } from "@/templates/LiveTemplateRenderer";

export const dynamic = "force-dynamic";

// metadata + page dùng chung một lần đọc DB; /w cũng hỗ trợ mẫu designer.
const getWeddingBySlug = cache((slug: string) =>
  getPublicWeddingBySlug(slug, { includeDesignerTemplate: true }),
);

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = await getWeddingBySlug(slug).catch(() => null);

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
  const wedding = await getWeddingBySlug(slug);

  if (!wedding) {
    notFound();
  }

  if (wedding.plan === "free") {
    return (
      <main className="flex min-h-screen-dvh items-center justify-center bg-bg px-4 py-10 text-center text-text">
        <div className="max-w-md rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-accent-text">
            Thiệp mời trực tuyến
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold">
            Link công khai chỉ dành cho gói Pro
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Thiệp miễn phí được chia sẻ bằng link riêng cho từng khách mời.
            Vui lòng mở link riêng mà cô dâu chú rể đã gửi cho bạn.
          </p>
        </div>
      </main>
    );
  }

  if (wedding.designerTemplate) {
    const values = buildDesignerInviteValues({
      groomName: wedding.content.couple.groomName,
      brideName: wedding.content.couple.brideName,
      dateLabel: formatWeddingDateParts(wedding.content.date).dotDate,
      dateIso: wedding.content.date,
      events: wedding.events,
      guestName: null,
      salutation: "Trân trọng kính mời",
      designerFields: wedding.content.designerFields,
      hasGifts: Boolean(
        wedding.content.gift?.groomAccountNumber ||
        wedding.content.gift?.brideAccountNumber,
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
      content: wedding.content,
      events: wedding.events,
      photos: wedding.photos,
    });
    return (
      <DesignerInvitation
        canvas={
          wedding.designerTemplate.canvas as unknown as DesignerCanvasContent
        }
        values={values}
        coupleLabel={`${wedding.content.couple.groomName} & ${wedding.content.couple.brideName}`}
        data={designerData}
        weddingSlug={wedding.slug}
        invitationMode="public"
        plan={wedding.plan}
        overrides={wedding.content.designerOverrides}
      />
    );
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
