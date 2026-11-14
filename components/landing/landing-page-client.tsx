"use client";

import * as React from "react";
import { useUser } from "@auth0/nextjs-auth0";
import { useBrandTheme } from "@/components/theme/ThemeProvider";
import { listWeddings, syncMe } from "@/lib/api";
import type { Wedding, WeddingPlan } from "@/lib/types";
import { LandingFooter } from "./footer";
import { LandingFaq } from "./faq";
import { HeroSection } from "./hero";
import { HowItWorks } from "./how-it-works";
import { LandingNavbar } from "./navbar";
import { PaymentTransferModal } from "./pricing-modals";
import { PricingTable } from "./pricing-table";
import { TemplateTeaser } from "./template-teaser";
import { ToolsPreviewSection } from "./tools-preview";

interface LandingPageClientProps {
  isAuthenticated?: boolean;
  userEmail?: string | null;
}

export function LandingPageClient({
  isAuthenticated = false,
  userEmail = null,
}: LandingPageClientProps) {
  const { setSessionInfo, adoptAccountTheme } = useBrandTheme();

  // Trang chủ là static: trạng thái đăng nhập lấy từ /auth/profile phía client.
  const { user } = useUser();
  const sessionEmail = React.useMemo(() => {
    const record = user as Record<string, unknown> | null | undefined;
    const raw = record?.email ?? record?.["https://thiepcuoi/email"];
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
    } catch {}
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
      .catch(() => {});

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
    <div className="landing-theme min-h-screen-dvh bg-bg text-text overflow-x-hidden">
      <LandingNavbar isAuthenticated={resolvedAuthenticated} userEmail={resolvedEmail} />
      <main>
        <HeroSection />
        <TemplateTeaser />
        <ToolsPreviewSection />
        <HowItWorks />
        <PricingTable
          isAuthenticated={resolvedAuthenticated}
          onSelectPaidPlan={(plan) => setPaymentPlan(plan)}
        />
        <LandingFaq />
      </main>
      <LandingFooter />

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
