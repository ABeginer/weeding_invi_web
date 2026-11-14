import type { Metadata } from "next";
import { SeatingLookupClient } from "@/components/invitation/SeatingLookupClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tra cứu bàn tiệc | Inviwedd",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ slug: string }> };

export default async function SeatingLookupPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen-dvh bg-bg px-4 py-10 text-text sm:py-16">
      <SeatingLookupClient slug={slug} />
    </main>
  );
}
