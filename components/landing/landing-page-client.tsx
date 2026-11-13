"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useBrandTheme } from "@/components/theme/ThemeProvider";
import { SITE_LINKS } from "@/config/site";
import { listWeddings, syncMe } from "@/lib/api";
import type { Wedding, WeddingPlan } from "@/lib/types";
import { canPlanUseTemplate } from "@/templates/registry";
import type { WeddingTemplateMeta } from "@/templates/types";
import { LandingFooter } from "./footer";
import { LandingFaq } from "./faq";
import { HeroSection } from "./hero";
import { HowItWorks } from "./how-it-works";
import { LandingNavbar } from "./navbar";
import { PaymentTransferModal, PlanUpgradeModal } from "./pricing-modals";
import { PricingTable } from "./pricing-table";
import { TemplateGrid } from "./template-grid";
import { ToolsPreviewSection } from "./tools-preview";

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
  const [userWeddings, setUserWeddings] = React.useState<Wedding[]>([]);
  const [upgradeTemplate, setUpgradeTemplate] = React.useState<WeddingTemplateMeta | null>(null);
  const [paymentPlan, setPaymentPlan] = React.useState<Exclude<WeddingPlan, "free"> | null>(null);

  // Read ?pay=pro / ?pay=vip when returning from login
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const pay = params.get("pay");
    if (pay === "pro" || pay === "vip") {
      setPaymentPlan(pay);
      params.delete("pay");
      const nextQuery = params.toString();
      const nextUrl =
        window.location.pathname +
        (nextQuery ? `?${nextQuery}` : "") +
        window.location.hash;
      window.history.replaceState(null, "", nextUrl);
    }
  }, []);

  const refreshPlan = React.useCallback(async () => {
    try {
      const weddings = await listWeddings();
      setUserWeddings(weddings);
      if (weddings.some((w) => w.plan === "vip")) setUserPlan("vip");
      else if (weddings.some((w) => w.plan === "pro")) setUserPlan("pro");
      else setUserPlan("free");
    } catch {}
  }, []);

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
        setUserWeddings(weddings);
        if (weddings.some((w) => w.plan === "vip")) setUserPlan("vip");
        else if (weddings.some((w) => w.plan === "pro")) setUserPlan("pro");
        else setUserPlan("free");
      })
      .catch(() => {
        if (!cancelled) {
          setUserWeddings([]);
          setUserPlan("free");
        }
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
    <div className="landing-theme min-h-screen-dvh bg-bg text-text overflow-x-hidden">
      <LandingNavbar isAuthenticated={isAuthenticated} userEmail={userEmail} />
      <main>
        <HeroSection />
        <TemplateGrid userPlan={userPlan} onUseTemplate={handleUseTemplate} />
        <ToolsPreviewSection />
        <HowItWorks />
        <PricingTable
          isAuthenticated={isAuthenticated}
          onSelectPaidPlan={(plan) => setPaymentPlan(plan)}
        />
        <LandingFaq />
      </main>
      <LandingFooter />

      <PlanUpgradeModal
        template={upgradeTemplate}
        onClose={() => setUpgradeTemplate(null)}
        onSelectPlan={(plan) => setPaymentPlan(plan)}
      />

      <PaymentTransferModal
        plan={paymentPlan}
        weddings={userWeddings}
        isAuthenticated={isAuthenticated}
        onClose={() => setPaymentPlan(null)}
        onSuccess={refreshPlan}
      />
    </div>
  );
}
