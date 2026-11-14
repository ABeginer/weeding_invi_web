import type { Metadata } from "next";
import { PreviewFrame } from "@/components/create/preview-frame";
import { emptyGiftInfo } from "@/lib/types";
import { toTemplateData } from "@/lib/wedding-data";
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
  const requestedTemplate = pick(params, "template", 40) || "basic-1";
  const template = getTemplateMeta(requestedTemplate) ?? getTemplateMeta("basic-1");
  const templateId = template?.id ?? "basic-1";

  const data = toTemplateData({
    templateId,
    plan: "free",
    weddingSlug: "xem-truoc",
    content: {
      couple: {
        groomName: pick(params, "groom", 40) || "Chú rể",
        brideName: pick(params, "bride", 40) || "Cô dâu",
        groomFullName: "",
        brideFullName: "",
        groomParents: "",
        brideParents: "",
      },
      date: pick(params, "date", 40) || DEFAULT_DATE,
      quote: pick(params, "quote", 200),
      heroPhotoId: null,
      groomPhotoId: null,
      bridePhotoId: null,
      gift: emptyGiftInfo(),
    },
    events: [],
    photos: [],
  });

  return (
    <div className="min-h-dvh bg-bg">
      <PreviewFrame
        templateId={templateId}
        data={data}
        initialOpened={pick(params, "opened", 1) === "1"}
      />
    </div>
  );
}
