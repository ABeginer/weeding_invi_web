import type { Metadata } from "next";
import { wedding } from "@/content/wedding";
import { InvitePageClient } from "@/components/invitation/InvitePageClient";

export const metadata: Metadata = {
  title: wedding.seo.title,
  description: wedding.seo.description,
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: wedding.seo.title,
    description: wedding.seo.description,
    type: "website",
    locale: "vi_VN",
    images: [
      {
        url: wedding.seo.ogImage,
        width: 1200,
        height: 630,
        alt: wedding.seo.title,
      },
    ],
  },
};

export default async function PersonalInvitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <InvitePageClient slug={slug} />;
}
