import { WeddingDetailView } from "@/components/dashboard/WeddingDetailView";

export default async function WeddingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WeddingDetailView weddingId={id} />;
}

