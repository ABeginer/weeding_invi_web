import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuestAlbumGallery } from "@/components/album/GuestAlbumGallery";
import { getPublicWeddingBySlug } from "@/lib/server/public-wedding";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Album ảnh cưới",
    robots: { index: false, follow: false },
  };
}

export default async function GuestAlbumPage({ params }: PageProps) {
  const { slug } = await params;
  const wedding = await getPublicWeddingBySlug(slug);

  if (!wedding) notFound();

  const album = wedding.photos
    .filter((photo) => photo.kind === "album")
    .sort((a, b) => a.position - b.position);

  const { groomName, brideName } = wedding.content.couple;
  const couple = [groomName, brideName].filter(Boolean).join(" & ");

  return (
    <main className="min-h-screen-dvh bg-bg px-4 py-8 text-text sm:px-6 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <header className="text-center">
          <p className="text-[11px] font-semibold tracking-[0.24em] text-accent-text uppercase">
            Album ảnh cưới
          </p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-text sm:text-3xl">
            {couple || "Album ảnh cưới"}
          </h1>
          <p className="mt-2 text-sm text-text-muted">
            {album.length > 0
              ? `${album.length} khoảnh khắc được chia sẻ từ ngày trọng đại.`
              : "Album chưa có ảnh nào."}
          </p>
        </header>

        {album.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-text-muted">
            Cô dâu chú rể sẽ sớm bổ sung ảnh cưới vào album này.
          </div>
        ) : (
          <GuestAlbumGallery
            photos={album.map((photo, index) => ({
              id: photo.id,
              url: photo.url,
              alt: `Ảnh cưới ${index + 1}`,
              position: index,
            }))}
          />
        )}

        <div className="mt-10 text-center">
          <Link
            href={`/w/${wedding.slug}`}
            className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface px-6 text-sm font-medium text-text transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            Xem thiệp mời
          </Link>
        </div>
      </div>
    </main>
  );
}
