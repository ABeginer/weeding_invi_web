import type { Metadata } from "next";
import { PreviewFrame } from "@/components/create/preview-frame";
import { getTemplateMeta } from "@/templates/registry";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Xem trước thiệp cưới",
  robots: { index: false, follow: false },
};

const DEFAULT_DATE = "2027-03-20T10:00:00+07:00";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(
  params: Record<string, string | string[] | undefined>,
  key: string,
  max: number,
): string {
  const raw = params[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (value ?? "").trim().slice(0, max);
}

export default async function CreatePreviewPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const requested = pick(params, "template", 40);
  const templateId = (getTemplateMeta(requested) ?? getTemplateMeta("nau-toi-gian"))?.id ?? "nau-toi-gian";

  return (
    <div className="min-h-dvh h-dvh w-full bg-bg">
      <PreviewFrame
        templateId={templateId}
        groom={pick(params, "groom", 40)}
        bride={pick(params, "bride", 40)}
        date={pick(params, "date", 40) || DEFAULT_DATE}
        quote={pick(params, "quote", 200)}
        initialOpened={pick(params, "opened", 1) === "1"}
      />
    </div>
  );
}
