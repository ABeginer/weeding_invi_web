"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Crown, Diamond, Monitor, Music2 } from "lucide-react";
import { PhoneFrame } from "@/components/landing/phone-frame";
import { PaymentTransferModal, PlanUpgradeModal } from "@/components/landing/pricing-modals";
import { useBrandTheme } from "@/components/theme/ThemeProvider";
import { LANDING_COPY } from "@/config/landing";
import { SITE_LINKS } from "@/config/site";
import { getDemoTemplateData } from "@/content/demo";
import { listWeddings, syncMe } from "@/lib/api";
import type { WeddingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { canPlanUseTemplate } from "@/templates/registry";
import { TemplatePreviewRenderer } from "@/templates/TemplatePreviewRenderer";
import type { WeddingTemplateMeta } from "@/templates/types";
import { DemoToolbar } from "./demo-toolbar";
import type { DemoViewportMode } from "./view-switcher";

interface TemplateDemoViewerProps {
  template: WeddingTemplateMeta;
  isAuthenticated: boolean;
  userEmail?: string | null;
}

function getDemoPlanBadgeClasses(plan: WeddingPlan): string {
  if (plan === "free") {
    return "border-sage bg-surface text-text";
  }
  if (plan === "pro") {
    return "border-accent bg-accent text-accent-fg font-semibold";
  }
  return "border-vip-border bg-vip-bg text-vip-fg font-semibold";
}

export function TemplateDemoViewer({
  template,
  isAuthenticated,
  userEmail = null,
}: TemplateDemoViewerProps) {
  const router = useRouter();
  const { setSessionInfo, adoptAccountTheme } = useBrandTheme();
  const [viewport, setViewport] = React.useState<DemoViewportMode>("phone");
  const [isOpened, setIsOpened] = React.useState(false);
  const [userPlan, setUserPlan] = React.useState<WeddingPlan>("free");
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);
  const [paymentPlan, setPaymentPlan] = React.useState<Exclude<WeddingPlan, "free"> | null>(null);

  const phoneScrollRef = React.useRef<HTMLDivElement | null>(null);
  const pendingRatioRef = React.useRef<number | null>(null);

  const demoData = React.useMemo(
    () => getDemoTemplateData(template.id),
    [template.id],
  );

  React.useEffect(() => {
    setSessionInfo({ isAuthenticated, email: userEmail });
  }, [isAuthenticated, setSessionInfo, userEmail]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      setUserPlan("free");
      return;
    }

    let cancelled = false;

    syncMe()
      .then((profile) => {
        if (cancelled) return;
        setSessionInfo({
          isAuthenticated: true,
          email: profile.email ?? userEmail,
        });
        if (profile.theme) {
          adoptAccountTheme(profile.theme);
        }
      })
      .catch(() => {});

    listWeddings()
      .then((weddings) => {
        if (cancelled) return;
        if (weddings.some((w) => w.plan === "vip")) setUserPlan("vip");
        else if (weddings.some((w) => w.plan === "pro")) setUserPlan("pro");
        else setUserPlan("free");
      })
      .catch(() => {
        if (!cancelled) setUserPlan("free");
      });

    return () => {
      cancelled = true;
    };
  }, [adoptAccountTheme, isAuthenticated, setSessionInfo, userEmail]);

  const handleViewportChange = (next: DemoViewportMode) => {
    if (next === viewport) return;

    if (viewport === "phone") {
      const scroller = phoneScrollRef.current;
      if (scroller && scroller.scrollHeight > scroller.clientHeight) {
        pendingRatioRef.current =
          scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight);
      } else {
        pendingRatioRef.current = 0;
      }
    } else {
      const maxWindowScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      pendingRatioRef.current =
        maxWindowScroll > 0 ? window.scrollY / maxWindowScroll : 0;
    }

    setViewport(next);
  };

  React.useEffect(() => {
    const ratio = pendingRatioRef.current;
    if (ratio === null) return;

    let frameTwo = 0;
    const frameOne = window.requestAnimationFrame(() => {
      frameTwo = window.requestAnimationFrame(() => {
        if (viewport === "phone") {
          window.scrollTo({ top: 0, behavior: "auto" });
          const scroller = phoneScrollRef.current;
          if (scroller && scroller.scrollHeight > scroller.clientHeight) {
            scroller.scrollTo({
              top: ratio * (scroller.scrollHeight - scroller.clientHeight),
              behavior: "auto",
            });
          }
        } else {
          const maxWindowScroll = Math.max(
            0,
            document.documentElement.scrollHeight - window.innerHeight,
          );
          if (maxWindowScroll > 0) {
            window.scrollTo({ top: ratio * maxWindowScroll, behavior: "auto" });
          }
        }
        pendingRatioRef.current = null;
      });
    });

    return () => {
      window.cancelAnimationFrame(frameOne);
      if (frameTwo) window.cancelAnimationFrame(frameTwo);
    };
  }, [viewport]);

  const handleUseTemplate = () => {
    if (template.isPlaceholder) {
      setPaymentPlan("vip");
      return;
    }

    if (template.plan === "free") {
      router.push(
        `${SITE_LINKS.createWedding}?template=${encodeURIComponent(template.id)}`,
      );
      return;
    }

    if (!canPlanUseTemplate(userPlan, template.plan)) {
      setUpgradeOpen(true);
      return;
    }

    const destination = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(template.id)}`;
    router.push(destination);
  };

  return (
    <div className="landing-theme min-h-screen-dvh bg-bg pb-20 text-text md:pb-10">
      <DemoToolbar
        template={template}
        viewport={viewport}
        isAuthenticated={isAuthenticated}
        userEmail={userEmail}
        onViewportChange={handleViewportChange}
        onUseTemplate={handleUseTemplate}
      />

      <main className="mx-auto max-w-6xl px-3 py-3 sm:px-6 md:py-4">
        {template.isPlaceholder ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-border bg-surface px-6 py-12 text-center shadow-2xl">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-accent-soft text-text">
              <Diamond className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold text-accent-text">
              {LANDING_COPY.demo.vipComingSoonTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted">
              {LANDING_COPY.demo.vipComingSoonBody}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setPaymentPlan("vip")}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                <Crown className="h-4 w-4" aria-hidden="true" />
                <span>{LANDING_COPY.planUpgradeModal.chooseVipLabel}</span>
              </button>
              <Link
                href={SITE_LINKS.templatesAnchor}
                className="inline-flex h-11 items-center justify-center rounded-full border border-text bg-transparent px-6 text-sm font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              >
                {LANDING_COPY.demo.backHomeLabel}
              </Link>
            </div>
          </div>
        ) : viewport === "phone" ? (
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-6 px-1 md:grid-cols-12 md:gap-8 lg:gap-10">
            {/* Cột trái trên desktop: Giới thiệu mẫu thiệp đang xem thử (ẩn trên mobile để giữ nguyên giao diện mobile) */}
            <aside className="hidden space-y-4 text-left md:col-span-7 md:block md:pt-1">
              <div className="inline-flex items-center rounded-full border border-border bg-surface px-3.5 py-1">
                <span className="text-[11px] font-medium tracking-[0.16em] text-accent-text uppercase">
                  {LANDING_COPY.demo.previewEyebrow}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                      getDemoPlanBadgeClasses(template.plan),
                    )}
                  >
                    {LANDING_COPY.templates.planBadges[template.plan]}
                  </span>
                  <span className="text-xs font-medium tracking-[0.16em] text-text-muted uppercase">
                    {template.subtitle}
                  </span>
                </div>

                <h2 className="font-display text-3xl leading-[1.1] font-semibold tracking-tight text-accent-text lg:text-4xl">
                  {template.name}
                </h2>
              </div>

              <p className="max-w-lg text-sm leading-relaxed text-text sm:text-base">
                {template.description}
              </p>

              <div className="space-y-3 rounded-2xl border border-border bg-surface p-4 shadow-xs">
                <div className="grid grid-cols-1 gap-3 border-b border-border pb-3 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium tracking-[0.14em] text-text-muted uppercase">
                      {LANDING_COPY.demo.sampleCoupleLabel}
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold text-accent-text">
                      {demoData.couple.groomName} &amp; {demoData.couple.brideName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium tracking-[0.14em] text-text-muted uppercase">
                      {LANDING_COPY.demo.musicTrackLabel}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-text">
                      <Music2
                        className="h-3.5 w-3.5 shrink-0 text-accent-text"
                        aria-hidden="true"
                      />
                      <span>{template.defaultMusic.title}</span>
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-medium tracking-[0.14em] text-text-muted uppercase">
                    {LANDING_COPY.demo.highlightsTitle}
                  </p>
                  <ul className="mt-2 space-y-1.5 text-xs text-text sm:text-sm">
                    {LANDING_COPY.demo.highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-sage"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleUseTemplate}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-accent px-6 text-xs font-semibold text-accent-fg shadow-md transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:h-11 sm:text-sm"
                >
                  <span>{LANDING_COPY.demo.useNowLabel}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => handleViewportChange("desktop")}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full border border-text bg-transparent px-5 text-xs font-medium text-text transition-colors hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:h-11 sm:text-sm"
                >
                  <Monitor className="h-4 w-4" aria-hidden="true" />
                  <span>{LANDING_COPY.demo.switchToDesktopLabel}</span>
                </button>
              </div>

              <p className="text-xs tracking-wide text-text-muted">
                {LANDING_COPY.hero.phoneHelperHint}
              </p>
            </aside>

            {/* Cột phải trên desktop / Chính giữa trên mobile: Khung điện thoại */}
            <div className="flex flex-col items-center md:col-span-5 md:items-end">
              <div className="w-full max-w-[352px] md:w-auto md:max-w-none">
                <PhoneFrame
                  scrollRef={phoneScrollRef}
                  enableFloat={false}
                  lockedScroll={!isOpened}
                  desktopOffsetPx={104}
                >
                  <TemplatePreviewRenderer
                    key={`${template.id}-phone`}
                    templateId={template.id}
                    data={demoData}
                    mode="demo"
                    contained
                    viewport="phone"
                    isOpened={isOpened}
                    onOpenedChange={setIsOpened}
                    externalMusicControl
                  />
                </PhoneFrame>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{ transform: "translate3d(0,0,0)" }}
            className={cn(
              "relative mx-auto w-full max-w-[1040px] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl",
              !isOpened
                ? "h-[min(620px,calc(100dvh-100px))]"
                : "min-h-[max(680px,calc(100dvh-100px))]",
            )}
          >
            <TemplatePreviewRenderer
              key={`${template.id}-desktop`}
              templateId={template.id}
              data={demoData}
              mode="demo"
              contained={false}
              viewport="desktop"
              isOpened={isOpened}
              onOpenedChange={setIsOpened}
              externalMusicControl
            />
          </div>
        )}
      </main>

      <PlanUpgradeModal
        template={upgradeOpen ? template : null}
        onClose={() => setUpgradeOpen(false)}
        onSelectPlan={(plan) => setPaymentPlan(plan)}
      />

      <PaymentTransferModal
        plan={paymentPlan}
        onClose={() => setPaymentPlan(null)}
      />
    </div>
  );
}
