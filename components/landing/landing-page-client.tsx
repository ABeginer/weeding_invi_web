"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useBrandTheme } from "@/components/theme/ThemeProvider";
import { SITE_LINKS } from "@/config/site";
import { listWeddings, syncMe } from "@/lib/api";
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
  userEmail?: string | null;
}

export function LandingPageClient({
  isAuthenticated,
  userEmail = null,
}: LandingPageClientProps) {
  const router = useRouter();
  const { setSessionInfo, adoptAccountTheme } = useBrandTheme();
  const [userPlan, setUserPlan] = React.useState<WeddingPlan>("free");
  const [upgradeTemplate, setUpgradeTemplate] = React.useState<WeddingTemplateMeta | null>(null);
  const [paymentPlan, setPaymentPlan] = React.useState<Exclude<WeddingPlan, "free"> | null>(null);

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

  const handleUseTemplate = (template: WeddingTemplateMeta) => {
    if (template.plan === "free") {
      router.push(
        `${SITE_LINKS.createWedding}?template=${encodeURIComponent(template.id)}`,
      );
      return;
    }

    if (!canPlanUseTemplate(userPlan, template.plan)) {
      setUpgradeTemplate(template);
      return;
    }

    const destination = `${SITE_LINKS.createWedding}?template=${encodeURIComponent(template.id)}`;
    router.push(destination);
  };

  return (
    <div className="landing-theme min-h-screen-dvh bg-bg text-text">
      <LandingNavbar isAuthenticated={isAuthenticated} userEmail={userEmail} />
      <main>
        <HeroSection />
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
