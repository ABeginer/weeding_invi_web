"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Crown, Diamond } from "lucide-react";
import { LANDING_COPY } from "@/config/landing";
import { SITE_LINKS } from "@/config/site";
import { getDemoTemplateData } from "@/content/demo";
import { listWeddings } from "@/lib/api";
import { landingThemeCssVars } from "@/lib/theme";
import type { WeddingPlan } from "@/lib/types";
import { cn } from "@/lib/utils";
import { canPlanUseTemplate } from "@/templates/registry";
import { TemplatePreviewRenderer } from "@/templates/TemplatePreviewRenderer";
import type { WeddingTemplateMeta } from "@/templates/types";
import { PhoneFrame } from "@/components/landing/phone-frame";
import { PaymentTransferModal, PlanUpgradeModal } from "@/components/landing/pricing-modals";
import { DemoToolbar } from "./demo-toolbar";
import type { DemoViewportMode } from "./view-switcher";

interface TemplateDemoViewerProps {
  template: WeddingTemplateMeta;
  isAuthenticated: boolean;
}

export function TemplateDemoViewer({
  template,
  isAuthenticated,
}: TemplateDemoViewerProps) {
  const router = useRouter();
  const [viewport, setViewport] = React.useState<DemoViewportMode>("phone");
  const [isOpened, setIsOpened] = React.useState(false);
  const [userPlan, setUserPlan] = React.useState<WeddingPlan>("free");
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);
  const [paymentPlan, setPaymentPlan] = React.useState<Exclude<WeddingPlan, "free"> | null>(null);

  const phoneScrollRef = React.useRef<HTMLDivElement | null>(null);
  const pendingRatioRef = React.useRef<number | null>(null);

  const demoData = React.useMemo(
    () => getDemoTemplateData(template.id),
    [template.id]
  );

  React.useEffect(() => {
    if (!isAuthenticated) {
      setUserPlan("free");
      return;
    }

    let cancelled = false;
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
  }, [isAuthenticated]);

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
        document.documentElement.scrollHeight - window.innerHeight
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
            document.documentElement.scrollHeight - window.innerHeight
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

    const destination = `${SITE_LINKS.dashboardNew}?template=${encodeURIComponent(template.id)}`;
    if (!isAuthenticated) {
      window.location.assign(`/auth/login?returnTo=${encodeURIComponent(destination)}`);
      return;
    }

    if (!canPlanUseTemplate(userPlan, template.plan)) {
      setUpgradeOpen(true);
      return;
    }

    router.push(destination);
  };

  return (
    <div
      style={landingThemeCssVars as React.CSSProperties}
      className="landing-theme min-h-screen bg-lnd-bg pb-20 text-lnd-body md:pb-10"
    >
      <DemoToolbar
        template={template}
        viewport={viewport}
        onViewportChange={handleViewportChange}
        onUseTemplate={handleUseTemplate}
      />

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-6">
        {template.isPlaceholder ? (
          <div className="mx-auto max-w-xl rounded-3xl border border-lnd-gold-soft bg-lnd-surface px-6 py-12 text-center shadow-2xl">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-lnd-gold-soft bg-lnd-gold-tint text-lnd-gold">
              <Diamond className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold text-lnd-gold">
              {LANDING_COPY.demo.vipComingSoonTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-lnd-muted">
              {LANDING_COPY.demo.vipComingSoonBody}
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setPaymentPlan("vip")}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-lnd-gold px-6 text-sm font-semibold text-lnd-bg transition-colors hover:bg-lnd-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
              >
                <Crown className="h-4 w-4" aria-hidden="true" />
                <span>{LANDING_COPY.planUpgradeModal.chooseVipLabel}</span>
              </button>
              <Link
                href={SITE_LINKS.templatesAnchor}
                className="inline-flex h-11 items-center justify-center rounded-full border border-lnd-gold-soft px-6 text-sm font-medium text-lnd-body transition-colors hover:border-lnd-gold hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
              >
                {LANDING_COPY.demo.backHomeLabel}
              </Link>
            </div>
          </div>
        ) : viewport === "phone" ? (
          <div className="flex flex-col items-center">
            <PhoneFrame scrollRef={phoneScrollRef} enableFloat={false} lockedScroll={!isOpened}>
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
        ) : (
          <div
            style={{ transform: "translate3d(0,0,0)" }}
            className={cn(
              "relative mx-auto w-full max-w-[1280px] overflow-hidden rounded-2xl border border-lnd-border bg-lnd-surface shadow-2xl",
              !isOpened
                ? "h-[max(560px,calc(100dvh-116px))]"
                : "min-h-[max(760px,calc(100dvh-116px))]"
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

