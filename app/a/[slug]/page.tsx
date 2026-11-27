import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GuestAlbumGallery } from "@/components/album/GuestAlbumGallery";
import { GuestUploadPortal } from "@/components/album/GuestUploadPortal";
import { getPublicWeddingBySlug } from "@/lib/server/public-wedding";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = await getPublicWeddingBySlug(slug);
  const isVip = wedding?.plan === "vip";
  const couple = wedding
    ? [wedding.content.couple.groomName, wedding.content.couple.brideName]
        .filter(Boolean)
        .join(" & ")
    : "Album ảnh cưới";

  return {
    title: isVip ? `Gửi ảnh cưới & Album — ${couple}` : `Album ảnh cưới — ${couple}`,
    description: isVip
      ? "Gửi ảnh chụp tại tiệc cưới để cùng lưu giữ kỷ niệm và trình chiếu trực tiếp lên màn hình LED sân khấu."
      : "Xem album ảnh cưới kỷ niệm của cô dâu và chú rể.",
    robots: { index: false, follow: false },
  };
}

export default async function GuestAlbumPage({ params }: PageProps) {
  const { slug } = await params;
  const wedding = await getPublicWeddingBySlug(slug);

  if (!wedding) notFound();

  // Ảnh album đã được lọc theo trạng thái duyệt ngay trên server (getPublicWeddingBySlug)
  const isAutoApprove = wedding.content.photoApprovalMode === "auto";
  const approvedAlbum = wedding.photos
    .filter((photo) => photo.kind === "album")
    .sort((a, b) => a.position - b.position);

  const { groomName, brideName } = wedding.content.couple;
  const couple = [groomName, brideName].filter(Boolean).join(" & ");

  return (
    <main className="min-h-screen-dvh bg-[#FAF8F5] px-4 py-8 text-[#1F1D1A] sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl space-y-10">
        {/* Guest Photo Upload Portal: Chỉ hiển thị cho gói VIP */}
        {wedding.plan === "vip" ? (
          <GuestUploadPortal
            weddingSlug={wedding.slug}
            coupleTitle={couple}
            isAutoApprove={isAutoApprove}
          />
        ) : (
          <header className="text-center">
            <p className="text-[11px] font-semibold tracking-[0.24em] text-[#7A1C24] uppercase">
              Album ảnh cưới
            </p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-[#1F1D1A]">
              {couple || "Album ảnh cưới"}
            </h1>
            <p className="mx-auto mt-2 max-w-md text-xs text-[#6B655E]">
              Lưu giữ những khoảnh khắc ngọt ngào và đáng nhớ nhất trong ngày chung đôi.
            </p>
          </header>
        )}

        {/* Existing Approved Photos Gallery */}
        <section className="pt-6 border-t border-[#E8E2D9]">
          <div className="text-center">
            <h2 className="font-serif text-xl font-bold text-[#1F1D1A]">
              Khoảnh khắc đã chia sẻ ({approvedAlbum.length})
            </h2>
            <p className="mt-1 text-xs text-[#6B655E]">
              {approvedAlbum.length > 0
                ? "Những bức ảnh đẹp được lưu giữ từ ngày vui của chúng mình."
                : "Chưa có ảnh nào trong album."}
            </p>
          </div>

          {approvedAlbum.length > 0 && (
            <GuestAlbumGallery
              photos={approvedAlbum.map((photo, index) => ({
                id: photo.id,
                url: photo.url,
                alt: `Ảnh tiệc cưới #${index + 1}`,
                position: index,
              }))}
            />
          )}
        </section>

        <div className="pt-2 text-center">
          <Link
            href={`/w/${wedding.slug}`}
            className="inline-flex h-11 items-center justify-center rounded-full border border-[#E8E2D9] bg-white px-6 text-xs font-semibold text-[#1F1D1A] shadow-2xs transition-colors hover:bg-[#F4EFEA]"
          >
            Quay lại thiệp mời cưới
          </Link>
        </div>
      </div>
    </main>
  );
}
