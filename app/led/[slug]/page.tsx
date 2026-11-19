import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Sparkles } from "lucide-react";
import { LedPhotoWallClient } from "@/components/led/LedPhotoWallClient";
import { getPublicWeddingBySlug } from "@/lib/server/public-wedding";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const wedding = await getPublicWeddingBySlug(slug);
  const couple = wedding
    ? `${wedding.content.couple.groomName} & ${wedding.content.couple.brideName}`
    : "Tiệc Cưới";

  return {
    title: `Màn hình LED tiệc cưới — ${couple}`,
    robots: { index: false, follow: false },
  };
}

export default async function LedPhotoWallPage({ params }: PageProps) {
  const { slug } = await params;
  const wedding = await getPublicWeddingBySlug(slug);

  if (!wedding) {
    notFound();
  }

  // KHÓA TUYỆT ĐỐI GÓI FREE: Không render slideshow, hiển thị màn hình thông báo nâng cấp Pro
  if (wedding.plan === "free") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#FAF8F5] px-4 py-12 text-[#1F1D1A]">
        <div className="w-full max-w-md rounded-2xl border border-[#E8E2D9] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#7A1C24]/10 text-[#7A1C24]">
            <Lock className="h-7 w-7" aria-hidden="true" />
          </div>

          <div className="mt-4 flex items-center justify-center gap-1.5">
            <span className="rounded-full bg-[#1F1D1A] px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-[#B89B72] uppercase">
              PRO ONLY
            </span>
          </div>

          <h1 className="mt-3 font-serif text-2xl font-bold text-[#1F1D1A]">
            Màn hình LED chỉ dành cho gói Pro
          </h1>

          <p className="mt-3 text-xs leading-relaxed text-[#6B655E]">
            Tính năng trình chiếu ảnh trực tiếp lên màn hình LED / TV sảnh tiệc cưới thời gian thực (Live Photo Wall) chỉ khả dụng với các thiệp đã nâng cấp gói Pro.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/#bang-gia"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#7A1C24] bg-[#7A1C24] px-6 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B] active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#B89B72]" />
              <span>Nâng cấp gói Pro ngay →</span>
            </Link>

            <Link
              href={`/w/${slug}`}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[#E8E2D9] bg-white px-5 text-xs font-medium text-[#1F1D1A] transition-colors hover:bg-[#FAF8F5]"
            >
              Xem thiệp mời online
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <LedPhotoWallClient wedding={wedding} />;
}
