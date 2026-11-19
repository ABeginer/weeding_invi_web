"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { getInvite } from "@/lib/api";
import { buildSalutation } from "@/lib/salutation-engine";
import { GuestBoardingPass } from "@/components/invitation/GuestBoardingPass";

export function SeatingLookupClient({ slug }: { slug: string }) {
  const [state, setState] = React.useState<"loading" | "ready" | "error">("loading");
  const [invite, setInvite] = React.useState<Awaited<ReturnType<typeof getInvite>>>(null);

  React.useEffect(() => {
    let cancelled = false;
    getInvite(slug)
      .then((data) => {
        if (cancelled) return;
        setInvite(data);
        setState(data ? "ready" : "error");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-text-muted">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span className="ml-2 text-sm">Đang tra cứu bàn tiệc…</span>
      </div>
    );
  }

  if (state === "error" || !invite) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-border bg-surface p-6 text-center">
        <h1 className="font-display text-xl font-semibold text-text">
          Không tìm thấy thông tin bàn tiệc
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Link không hợp lệ hoặc thiệp đã bị khoá. Vui lòng liên hệ cô dâu chú rể.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  const salutation = buildSalutation({
    guestName: invite.name,
    relationshipGroup: invite.relationshipGroup,
    customPronounHost: invite.customPronounHost,
    customPronounGuest: invite.customPronounGuest,
  });

  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-[11px] font-semibold tracking-[0.24em] text-accent-text uppercase">
          Tra cứu bàn tiệc
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-text">
          Chào {salutation.guestLabel}
        </h1>
      </div>

      {invite.tableNumber ? (
        <GuestBoardingPass
          guestName={salutation.guestLabel}
          plusOnes={invite.plusOnes ?? 0}
          diet={invite.diet}
          tableNumber={invite.tableNumber}
        />
      ) : (
        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-text-muted">
          Cô dâu chú rể chưa xếp bàn cho bạn. Bạn vui lòng xem lại thiệp hoặc hỏi
          người đón khách tại sảnh.
        </div>
      )}

      <div className="text-center">
        <Link
          href={`/m/${slug}`}
          prefetch={false}
          className="inline-flex h-11 items-center justify-center rounded-full border border-border bg-surface px-6 text-sm font-medium text-text transition-colors hover:border-accent"
        >
          Mở thiệp mời của bạn
        </Link>
      </div>
    </div>
  );
}
