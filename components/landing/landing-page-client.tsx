"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { useUser } from "@auth0/nextjs-auth0";
import { AUTH0_EMAIL_CLAIM } from "@/config/site";
import { useBrandTheme } from "@/components/theme/ThemeProvider";
import { listWeddings, syncMe } from "@/lib/api";
import type { Wedding, WeddingPlan } from "@/lib/types";
import { HeroSection } from "./hero";
import { InteractiveFeatureBento } from "./interactive-feature-bento";
import { LandingNavbar } from "./navbar";
import { PricingTable } from "./pricing-table";
import { VIP_SALES_ENABLED } from "@/config/pricing";
import { TemplateShowcase } from "./template-showcase";

const PaymentTransferModal = dynamic(
  () => import("./pricing-modals").then((m) => m.PaymentTransferModal),
  { ssr: false },
);

const BELOW_FOLD_SECTION_STYLE: React.CSSProperties = {
  contentVisibility: "auto",
  containIntrinsicSize: "auto 680px",
};

interface LandingPageClientProps {
  isAuthenticated?: boolean;
  userEmail?: string | null;
  toolsSection?: React.ReactNode;
  howItWorksSection?: React.ReactNode;
  faqSection?: React.ReactNode;
  footerSection?: React.ReactNode;
}

export function LandingPageClient({
  isAuthenticated = false,
  userEmail = null,
  toolsSection,
  howItWorksSection,
  faqSection,
  footerSection,
}: LandingPageClientProps) {
  const { setSessionInfo, adoptAccountTheme } = useBrandTheme();

  // Trang chủ là static: trạng thái đăng nhập lấy từ /auth/profile phía client.
  const { user } = useUser();
  const sessionEmail = React.useMemo(() => {
    const record = user as Record<string, unknown> | null | undefined;
    const raw = record?.email ?? record?.[AUTH0_EMAIL_CLAIM];
    return typeof raw === "string" && raw.trim() ? raw.trim() : null;
  }, [user]);
  const resolvedEmail = sessionEmail ?? userEmail;
  const resolvedAuthenticated = Boolean(user) || isAuthenticated;

  const [userWeddings, setUserWeddings] = React.useState<Wedding[]>([]);
  const [paymentPlan, setPaymentPlan] = React.useState<Exclude<WeddingPlan, "free"> | null>(null);

  // Read ?pay=pro / ?pay=vip when returning from login
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const pay = params.get("pay");
    if (pay === "pro" || (pay === "vip" && VIP_SALES_ENABLED)) {
      let active = true;
      queueMicrotask(() => {
        if (active) setPaymentPlan(pay);
      });
      params.delete("pay");
      const nextQuery = params.toString();
      const nextUrl =
        window.location.pathname +
        (nextQuery ? `?${nextQuery}` : "") +
        window.location.hash;
      window.history.replaceState(null, "", nextUrl);
      return () => {
        active = false;
      };
    }
  }, []);

  const refreshPlan = React.useCallback(async () => {
    try {
      const weddings = await listWeddings();
      setUserWeddings(weddings);
    } catch { }
  }, []);

  React.useEffect(() => {
    setSessionInfo({ isAuthenticated: resolvedAuthenticated, email: resolvedEmail });
  }, [resolvedAuthenticated, resolvedEmail, setSessionInfo]);

  React.useEffect(() => {
    if (!resolvedAuthenticated) {
      return;
    }

    let cancelled = false;

    syncMe()
      .then((profile) => {
        if (cancelled) return;
        setSessionInfo({
          isAuthenticated: true,
          email: profile.email ?? resolvedEmail,
        });
        if (profile.theme) {
          adoptAccountTheme(profile.theme);
        }
      })
      .catch(() => { });

    listWeddings()
      .then((weddings) => {
        if (cancelled) return;
        setUserWeddings(weddings);
      })
      .catch(() => {
        if (!cancelled) {
          setUserWeddings([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [adoptAccountTheme, resolvedAuthenticated, resolvedEmail, setSessionInfo]);

  return (
    <div className="landing-theme min-h-screen-dvh bg-[#FAF8F5] text-[#1F1D1A] overflow-x-hidden">
      <LandingNavbar
        isAuthenticated={resolvedAuthenticated}
        userEmail={resolvedEmail}
        hideThemeToggle
        revealMobileCtaOnScroll
      />
      <main>
        <HeroSection />
        <TemplateShowcase />
        <div style={BELOW_FOLD_SECTION_STYLE}>
          <InteractiveFeatureBento />
        </div>
        {toolsSection && <div style={BELOW_FOLD_SECTION_STYLE}>{toolsSection}</div>}
        {howItWorksSection && (
          <div style={BELOW_FOLD_SECTION_STYLE}>{howItWorksSection}</div>
        )}
        <div style={BELOW_FOLD_SECTION_STYLE}>
          <PricingTable
            isAuthenticated={resolvedAuthenticated}
            onSelectPaidPlan={(plan) => setPaymentPlan(plan)}
          />
        </div>
        {faqSection && <div style={BELOW_FOLD_SECTION_STYLE}>{faqSection}</div>}
      </main>
      {footerSection && <div style={BELOW_FOLD_SECTION_STYLE}>{footerSection}</div>}

      <PaymentTransferModal
        plan={paymentPlan}
        weddings={userWeddings}
        isAuthenticated={resolvedAuthenticated}
        onClose={() => setPaymentPlan(null)}
        onSuccess={refreshPlan}
      />
    </div>
  );
}
