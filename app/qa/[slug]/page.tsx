import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDemoTemplateData } from "@/content/demo";
import { getTemplateMeta } from "@/templates/registry";
import { TemplatePreviewRenderer } from "@/templates/TemplatePreviewRenderer";
import type { TemplateData } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inviwedd QA Test Runner",
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    config?: string;
    opened?: string;
    contained?: string;
    viewport?: string;
    mode?: string;
  }>;
};

export default async function QaTestRunnerPage({ params, searchParams }: PageProps) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const { slug } = await params;
  const { config, opened, contained, viewport, mode } = await searchParams;

  const meta = getTemplateMeta(slug);
  if (!meta) {
    notFound();
  }

  const baseData = getDemoTemplateData(slug);
  let resolvedData: TemplateData = baseData;

  if (config) {
    try {
      let jsonStr = "";
      try {
        jsonStr = Buffer.from(config, "base64").toString("utf-8");
      } catch {
        jsonStr = decodeURIComponent(config);
      }
      const parsed = JSON.parse(jsonStr) as Partial<TemplateData>;
      resolvedData = {
        ...baseData,
        ...parsed,
        couple: {
          ...baseData.couple,
          ...(parsed.couple || {}),
        },
        photos: {
          ...baseData.photos,
          ...(parsed.photos || {}),
        },
        gift: {
          ...baseData.gift,
          ...(parsed.gift || {}),
        },
        ui: {
          ...baseData.ui,
          ...(parsed.ui || {}),
        },
        events: parsed.events ?? baseData.events,
        timeline: parsed.timeline ?? baseData.timeline,
        hiddenSections: parsed.hiddenSections ?? baseData.hiddenSections,
        sectionOrder: parsed.sectionOrder ?? baseData.sectionOrder,
        dressCode: parsed.dressCode ?? baseData.dressCode,
        plan: parsed.plan ?? baseData.plan,
        hostFirst: parsed.hostFirst ?? baseData.hostFirst,
        hideCouplePhotos: parsed.hideCouplePhotos ?? baseData.hideCouplePhotos,
      };
    } catch {
      resolvedData = baseData;
    }
  }

  const isOpened = opened === "1";
  const isContained = contained !== "0";
  const viewMode = (viewport === "desktop" ? "desktop" : "phone") as "phone" | "desktop";
  const renderMode = (mode === "demo" ? "demo" : "preview") as "preview" | "demo";

  return (
    <div
      id="qa-runner-root"
      className="relative h-screen min-h-screen w-full bg-transparent overflow-x-hidden"
      data-testid="qa-runner-root"
      data-template-id={slug}
      data-opened={isOpened ? "true" : "false"}
    >
      <style>{`
        /* Ẩn scrollbar chuẩn theo môi trường Preview */
        html, body {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        html::-webkit-scrollbar, body::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        /* Triệt tiêu 100% Next.js dev tools & badge icon N khi chụp ảnh/QA */
        nextjs-portal,
        #__next-build-watcher,
        [data-next-badge-root],
        [data-nextjs-toast] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>
      <TemplatePreviewRenderer
        key={`${slug}-${isOpened}-${renderMode}`}
        templateId={slug}
        data={resolvedData}
        mode={renderMode}
        contained={isContained}
        viewport={viewMode}
        isOpened={isOpened}
        externalMusicControl={false}
      />
    </div>
  );
}
