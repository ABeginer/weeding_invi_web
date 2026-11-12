"use client";

import * as React from "react";
import { Check, Copy, CreditCard, Crown, X } from "lucide-react";
import { BANK_TRANSFER_INFO, generateTransferOrderCode } from "@/config/bank";
import { LANDING_COPY } from "@/config/landing";
import { PRICING_TIERS } from "@/config/pricing";
import { SITE_LINKS } from "@/config/site";
import type { WeddingPlan } from "@/lib/types";
import type { WeddingTemplateMeta } from "@/templates/types";

interface PaymentTransferModalProps {
  plan: Exclude<WeddingPlan, "free"> | null;
  onClose: () => void;
}

export function PaymentTransferModal({ plan, onClose }: PaymentTransferModalProps) {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();
  const [copied, setCopied] = React.useState(false);

  const orderCode = React.useMemo(() => {
    if (!plan) return "";
    return generateTransferOrderCode(plan);
  }, [plan]);

  React.useEffect(() => {
    if (!plan) return;
    setCopied(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [plan, onClose]);

  if (!plan) return null;

  const tier = PRICING_TIERS.find((item) => item.id === plan);
  const copy = LANDING_COPY.paymentModal;

  const handleCopyCode = async () => {
    if (!orderCode) return;
    try {
      await navigator.clipboard.writeText(orderCode);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = orderCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-lnd-bg/80 backdrop-blur-xs"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-lnd-gold-soft bg-lnd-surface p-5 text-lnd-body shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-lnd-gold-soft bg-lnd-gold-tint text-lnd-gold">
              <CreditCard className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2 id={titleId} className="font-display text-2xl font-semibold text-lnd-gold">
                {copy.title}
              </h2>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={copy.closeLabel}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-lnd-border text-lnd-muted transition-colors hover:border-lnd-gold hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-lnd-muted sm:text-sm">
          {copy.description}
        </p>

        <dl className="mt-4 space-y-2.5 rounded-xl border border-lnd-border bg-lnd-bg p-4 text-xs sm:text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-lnd-muted">{copy.planLabel}</dt>
            <dd className="font-semibold text-lnd-body">{tier?.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-lnd-muted">{copy.amountLabel}</dt>
            <dd className="font-semibold text-lnd-gold">{tier?.price}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-lnd-border pt-2.5">
            <dt className="text-lnd-muted">{copy.orderCodeLabel}</dt>
            <dd className="flex items-center gap-2">
              <code className="rounded bg-lnd-surface px-2 py-0.5 font-mono text-xs font-semibold text-lnd-gold">
                {orderCode}
              </code>
              <button
                type="button"
                onClick={handleCopyCode}
                aria-label={copy.copyCodeLabel}
                className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border border-lnd-border bg-lnd-surface px-2 text-[11px] font-medium text-lnd-body transition-colors hover:border-lnd-gold hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-lnd-gold" aria-hidden="true" />
                    <span>{copy.copiedCodeLabel}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" aria-hidden="true" />
                    <span>{copy.copyCodeLabel}</span>
                  </>
                )}
              </button>
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-lnd-border pt-2.5">
            <dt className="text-lnd-muted">{copy.bankLabel}</dt>
            <dd className="text-lnd-body">
              {BANK_TRANSFER_INFO.bankName || copy.emptyValuePlaceholder}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-lnd-muted">{copy.accountNumberLabel}</dt>
            <dd className="font-mono text-lnd-body">
              {BANK_TRANSFER_INFO.accountNumber || copy.emptyValuePlaceholder}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-lnd-muted">{copy.accountHolderLabel}</dt>
            <dd className="text-lnd-body">
              {BANK_TRANSFER_INFO.accountHolder || copy.emptyValuePlaceholder}
            </dd>
          </div>
        </dl>

        <p className="mt-3 rounded-lg border border-lnd-border bg-lnd-bg/60 px-3 py-2 text-[11px] leading-relaxed text-lnd-muted">
          {BANK_TRANSFER_INFO.qrPlaceholderNote}
        </p>
        <p className="mt-2 text-[11px] text-lnd-muted">{copy.notice}</p>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-lnd-gold px-6 text-xs font-semibold text-lnd-bg transition-colors hover:bg-lnd-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
          >
            {copy.closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PlanUpgradeModalProps {
  template: WeddingTemplateMeta | null;
  onClose: () => void;
  onSelectPlan: (plan: Exclude<WeddingPlan, "free">) => void;
}

export function PlanUpgradeModal({
  template,
  onClose,
  onSelectPlan,
}: PlanUpgradeModalProps) {
  const closeRef = React.useRef<HTMLButtonElement | null>(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!template) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [template, onClose]);

  if (!template) return null;

  const targetPlan = template.plan === "vip" ? "vip" : "pro";
  const planName = LANDING_COPY.templates.planBadges[targetPlan];
  const copy = LANDING_COPY.planUpgradeModal;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-0 bg-lnd-bg/80 backdrop-blur-xs"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-lnd-gold-soft bg-lnd-surface p-5 text-lnd-body shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-lnd-gold-soft bg-lnd-gold-tint text-lnd-gold">
              <Crown className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 id={titleId} className="font-display text-2xl font-semibold text-lnd-gold">
              {copy.title}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label={copy.closeLabel}
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-lnd-border text-lnd-muted transition-colors hover:border-lnd-gold hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-lnd-body">
          {copy.descriptionPrefix}{" "}
          <strong className="font-semibold text-lnd-gold">{template.name}</strong>{" "}
          {copy.descriptionMiddle}{" "}
          <strong className="font-semibold text-lnd-gold">{planName}</strong>{" "}
          {copy.descriptionSuffix}
        </p>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectPlan(targetPlan);
            }}
            className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center rounded-full bg-lnd-gold px-5 text-sm font-semibold text-lnd-bg transition-colors hover:bg-lnd-gold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
          >
            {targetPlan === "vip" ? copy.chooseVipLabel : copy.chooseProLabel}
          </button>
          <a
            href={SITE_LINKS.templatesAnchor}
            onClick={onClose}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-lnd-gold-soft px-5 text-sm font-medium text-lnd-body transition-colors hover:border-lnd-gold hover:text-lnd-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lnd-gold"
          >
            {copy.chooseFreeInsteadLabel}
          </a>
        </div>
      </div>
    </div>
  );
}

