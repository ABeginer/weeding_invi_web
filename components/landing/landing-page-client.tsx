"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SITE_LINKS } from "@/config/site";
import { listWeddings } from "@/lib/api";
import { landingThemeCssVars } from "@/lib/theme";
import type { WeddingPlan } from "@/lib/types";
import { canPlanUseTemplate } from "@/templates/registry";
import type { WeddingTemplateMeta } from "@/templates/types";
import { LandingFooter } from "./footer";
import { HeroSection } from "./hero";
import { HowItWorks } from "./how-it-works";
import { LandingNavbar } from "./navbar";
import { PaymentTransferModal, PlanUpgradeModal } from "./pricing-modals";
import { PricingTable } from "./pricing-table";
import { TemplateGrid } from "./template-grid";

interface LandingPageClientProps {
  isAuthenticated: boolean;
}

export function LandingPageClient({ isAuthenticated }: LandingPageClientProps) {
  const router = useRouter();
  const [userPlan, setUserPlan] = React.useState<WeddingPlan>("free");
  const [upgradeTemplate, setUpgradeTemplate] = React.useState<WeddingTemplateMeta | null>(null);
  const [paymentPlan, setPaymentPlan] = React.useState<Exclude<WeddingPlan, "free"> | null>(null);

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

  const handleUseTemplate = (template: WeddingTemplateMeta) => {
    if (!canPlanUseTemplate(userPlan, template.plan)) {
      setUpgradeTemplate(template);
      return;
    }

    const destination = `${SITE_LINKS.dashboardNew}?template=${encodeURIComponent(template.id)}`;
    if (isAuthenticated) {
      router.push(destination);
      return;
    }
    window.location.assign(`/auth/login?returnTo=${encodeURIComponent(destination)}`);
  };

  return (
    <div
      style={landingThemeCssVars as React.CSSProperties}
      className="landing-theme min-h-screen bg-lnd-bg text-lnd-body"
    >
      <LandingNavbar isAuthenticated={isAuthenticated} />
      <main>
        <HeroSection isAuthenticated={isAuthenticated} />
        <TemplateGrid userPlan={userPlan} onUseTemplate={handleUseTemplate} />
        <HowItWorks />
        <PricingTable
          isAuthenticated={isAuthenticated}
          onSelectPaidPlan={(plan) => setPaymentPlan(plan)}
        />
      </main>
      <LandingFooter />

      <PlanUpgradeModal
        template={upgradeTemplate}
        onClose={() => setUpgradeTemplate(null)}
        onSelectPlan={(plan) => setPaymentPlan(plan)}
      />

      <PaymentTransferModal
        plan={paymentPlan}
        onClose={() => setPaymentPlan(null)}
      />
    </div>
  );
}

