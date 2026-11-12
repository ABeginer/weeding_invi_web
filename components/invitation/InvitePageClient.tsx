"use client";

import * as React from "react";
import Link from "next/link";
import { getInvite } from "@/lib/api";
import { invitationThemeCssVars } from "@/lib/theme";
import type {
  InviteResponse,
  TemplateData,
  WeddingContent,
  WeddingPhoto,
  WeddingPlan,
} from "@/lib/types";
import { toTemplateData } from "@/lib/wedding-data";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { LiveTemplateRenderer } from "@/templates/LiveTemplateRenderer";

interface InvitePageClientProps {
  slug: string;
  weddingSlug?: string;
  templateId?: string;
  plan?: WeddingPlan;
  initialData: TemplateData;
  rawContent: WeddingContent;
  rawPhotos: WeddingPhoto[];
}

export function InvitePageClient({
  slug,
  weddingSlug,
  templateId = "basic-1",
  plan = "free",
  initialData,
  rawContent,
  rawPhotos,
}: InvitePageClientProps) {
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [invite, setInvite] = React.useState<InviteResponse | null>(null);

  const loadInvite = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getInvite(slug);
      setInvite(res);
    } catch (err) {
      setInvite(null);
      setLoadError(
        err instanceof Error
          ? err.message
          : "Không thể tải thông tin thiệp mời lúc này. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  React.useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  const resolvedData = React.useMemo(() => {
    if (!invite) return initialData;
    return toTemplateData({
      templateId,
      plan,
      weddingSlug,
      content: rawContent,
      events: invite.events ?? initialData.events,
      photos: rawPhotos,
    });
  }, [initialData, invite, plan, rawContent, rawPhotos, templateId, weddingSlug]);

  if (loading) {
    return (
      <div
        style={invitationThemeCssVars as React.CSSProperties}
        className="invitation-theme min-h-screen-dvh bg-inv-bg text-inv-ink"
      >
        <main className="mx-auto flex min-h-screen-dvh max-w-[500px] flex-col items-center justify-center bg-inv-bg px-6 py-12 md:shadow-[0_0_50px_color-mix(in_srgb,var(--inv-olive-deep)_12%,transparent)]">
          <div className="w-full space-y-5 rounded-3xl border border-inv-olive/20 bg-inv-paper p-8 text-center">
            <Skeleton className="mx-auto h-4 w-32 bg-inv-tint" />
            <Skeleton className="mx-auto h-10 w-56 bg-inv-tint" />
            <Skeleton className="mx-auto h-52 w-full rounded-2xl bg-inv-tint" />
          </div>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        style={invitationThemeCssVars as React.CSSProperties}
        className="invitation-theme min-h-screen-dvh bg-inv-bg text-inv-ink"
      >
        <main className="mx-auto flex min-h-screen-dvh max-w-[500px] flex-col items-center justify-center bg-inv-bg px-6 py-12 text-center md:shadow-[0_0_50px_color-mix(in_srgb,var(--inv-olive-deep)_12%,transparent)]">
          <div className="w-full space-y-5 rounded-3xl border border-inv-olive/25 bg-inv-paper px-6 py-8">
            <p className="font-inv-serif text-xs font-medium uppercase tracking-[0.24em] text-inv-olive-btn">
              {initialData.ui.eyebrow}
            </p>
            <h1 className="font-inv-serif text-2xl font-semibold text-inv-ink">
              Không thể tải thiệp mời
            </h1>
            <p className="font-inv-serif text-sm leading-relaxed text-inv-text">
              {loadError}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button
                variant="primary"
                onClick={loadInvite}
                className="rounded-full bg-inv-olive-btn px-6 font-inv-serif text-white hover:bg-inv-olive-hover"
              >
                Thử lại
              </Button>
              {weddingSlug && (
                <Link
                  href={`/w/${weddingSlug}`}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-inv-olive/35 bg-inv-bg px-6 font-inv-serif text-sm font-medium text-inv-ink transition-colors hover:bg-inv-tint"
                >
                  Xem thiệp mời chung
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!invite) {
    return (
      <div
        style={invitationThemeCssVars as React.CSSProperties}
        className="invitation-theme min-h-screen-dvh bg-inv-bg text-inv-ink"
      >
        <main className="mx-auto flex min-h-screen-dvh max-w-[500px] flex-col items-center justify-center bg-inv-bg px-6 py-12 text-center md:shadow-[0_0_50px_color-mix(in_srgb,var(--inv-olive-deep)_12%,transparent)]">
          <div className="w-full space-y-5 rounded-3xl border border-inv-olive/25 bg-inv-paper px-6 py-8">
            <p className="font-inv-serif text-xs font-medium uppercase tracking-[0.24em] text-inv-olive-btn">
              {initialData.ui.eyebrow}
            </p>
            <h1 className="font-inv-serif text-2xl font-semibold text-inv-ink">
              Liên kết thiệp mời không hợp lệ
            </h1>
            <p className="font-inv-serif text-sm leading-relaxed text-inv-text">
              Đường dẫn bạn vừa mở không tồn tại hoặc đã bị thu hồi. Bạn vẫn có thể xem thiệp mời chung và gửi lời chúc cho cô dâu chú rể.
            </p>
            {weddingSlug && (
              <div className="pt-2">
                <Link
                  href={`/w/${weddingSlug}`}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-inv-olive-btn px-7 font-inv-serif text-sm font-medium text-white transition-colors hover:bg-inv-olive-hover"
                >
                  Xem thiệp mời chung
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <LiveTemplateRenderer
      templateId={templateId}
      data={resolvedData}
      inviteSlug={slug}
      weddingSlug={weddingSlug}
      invitationMode="personal"
      guestName={invite.name}
      initialStatus={invite.status}
      initialPlusOnes={invite.plusOnes}
      initialDiet={invite.diet}
    />
  );
}
