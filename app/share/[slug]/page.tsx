import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { FamilySharePortal } from "@/components/share/FamilySharePortal";
import { PinEntryView } from "@/components/share/PinEntryView";
import { getPublicWeddingBySlug } from "@/lib/server/public-wedding";
import { db } from "@/lib/server/supabase";
import { listWeddingPhotos } from "@/lib/server/weddings";
import { verifyShareCookieValue } from "@/lib/share-pin";
import { normalizeWeddingContent } from "@/lib/wedding-data";

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
    title: `Cổng trợ lý tiệc cưới — ${couple}`,
    robots: { index: false, follow: false },
  };
}

export default async function FamilySharePage({ params }: PageProps) {
  const { slug } = await params;
  const client = db();

  const { data: weddingRow, error } = await client
    .from("weddings")
    .select("id, slug, owner_id, plan, content")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !weddingRow) {
    notFound();
  }

  // Khóa tính năng Cổng trợ lý PIN 4 số nếu thiệp chưa nâng cấp VIP
  if (weddingRow.plan !== "vip") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#FAF8F5] px-4 py-12 text-[#1F1D1A]">
        <div className="w-full max-w-md rounded-2xl border border-[#E8E2D9] bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#7A1C24]/10 text-[#7A1C24]">
            <Lock className="h-7 w-7" />
          </div>

          <span className="mt-4 inline-block rounded-full bg-[#1F1D1A] px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-[#B89B72] uppercase">
            VIP ONLY
          </span>

          <h1 className="mt-3 font-serif text-2xl font-bold text-[#1F1D1A]">
            Cổng trợ lý chỉ dành cho gói VIP
          </h1>

          <p className="mt-3 text-xs leading-relaxed text-[#6B655E]">
            Tính năng cấp link mã PIN 4 số cho người nhà duyệt ảnh và check-in khách chỉ khả dụng với thiệp cưới gói VIP.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/#bang-gia"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#7A1C24] bg-[#7A1C24] px-6 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[#5E141B] active:scale-95"
            >
              Nâng cấp gói VIP ngay →
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

  const content = normalizeWeddingContent(weddingRow.content);
  const couple = [content.couple.groomName, content.couple.brideName]
    .filter(Boolean)
    .join(" & ");

  // Kiểm tra quyền: Cookie mã PIN hợp lệ
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(`inviwedd_share_${slug}`)?.value;
  const isPinAuthed = await verifyShareCookieValue(slug, authCookie);

  if (!isPinAuthed) {
    if (!content.sharePinEnabled || !content.sharePin) {
      return (
        <main className="flex min-h-[100dvh] items-center justify-center bg-[#FAF8F5] px-4 py-12 text-[#1F1D1A]">
          <div className="w-full max-w-md rounded-2xl border border-[#E8E2D9] bg-white p-8 text-center shadow-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#7A1C24]/10 text-[#7A1C24]">
              <Lock className="h-7 w-7" />
            </div>

            <span className="mt-4 inline-block rounded-full bg-[#FAF8F5] border border-[#E8E2D9] px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-[#B89B72] uppercase">
              CHƯA KÍCH HOẠT
            </span>

            <h1 className="mt-3 font-serif text-2xl font-bold text-[#1F1D1A]">
              Cổng trợ lý chưa kích hoạt
            </h1>

            <p className="mt-3 text-xs leading-relaxed text-[#6B655E]">
              Cô dâu chú rể chưa kích hoạt chia sẻ quyền trợ lý hoặc mã PIN cho thiệp cưới này. Vui lòng liên hệ chủ tiệc để được cấp quyền.
            </p>

            <div className="mt-6 flex justify-center">
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

    return <PinEntryView slug={slug} coupleTitle={couple} />;
  }

  // Đã xác thực thành công: Tải dữ liệu thiệp, khách mời và ảnh
  const [publicWedding, guestRowsRes, photos] = await Promise.all([
    getPublicWeddingBySlug(slug),
    client
      .from("guests")
      .select("id, name, slug, relationship_group, status, plus_ones, diet, table_number, checked_in_at, checked_in_count")
      .eq("wedding_id", weddingRow.id)
      .order("created_at", { ascending: false }),
    listWeddingPhotos(weddingRow.id),
  ]);

  if (!publicWedding) {
    notFound();
  }

  const guests = (guestRowsRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    relationshipGroup: row.relationship_group,
    status: row.status,
    plusOnes: row.plus_ones,
    diet: row.diet,
    tableNumber: row.table_number ?? null,
    checkedInAt: row.checked_in_at ?? null,
    checkedInCount: typeof row.checked_in_count === "number" ? row.checked_in_count : null,
  }));

  return (
    <FamilySharePortal
      wedding={publicWedding}
      guests={guests}
      photos={photos}
    />
  );
}
