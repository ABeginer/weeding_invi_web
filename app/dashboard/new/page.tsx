import { WeddingList } from "@/components/dashboard/WeddingList";

type PageProps = {
  searchParams: Promise<{ template?: string }>;
};

export default async function NewWeddingPage({ searchParams }: PageProps) {
  const { template } = await searchParams;
  return <WeddingList initialCreateTemplateId={template} />;
}

