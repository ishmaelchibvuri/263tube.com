"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Info, ShieldCheck } from "lucide-react";
import { TrustBadgeGroup } from "@/components/trust/TrustBadge";

interface RegulatoryDisclaimerProps {
  variant?: "inline" | "block" | "footer";
  showBadges?: boolean;
  ncrNumber?: string;
  className?: string;
}

/**
 * NCR/FAIS regulatory disclaimer component
 * Required on all upsell touchpoints per National Credit Act compliance
 *
 * Variants:
 * - inline: Single line for tight spaces
 * - block: Full disclaimer with badges
 * - footer: Footer-style for bottom of modals/pages
 */
function RegulatoryDisclaimer({
  variant = "inline",
  showBadges = false,
  ncrNumber = "NCRDC####",
  className,
}: RegulatoryDisclaimerProps) {
  if (variant === "inline") {
    return (
      <p className={cn("text-[10px] text-gray-400", className)}>
        Debt counselling services provided by Debt Payoff SA ({ncrNumber}).
        QuickBudget SA provides budgeting tools only.
      </p>
    );
  }

  if (variant === "footer") {
    return (
      <div
        className={cn(
          "border-t border-gray-100 pt-3 mt-4 text-center",
          className
        )}
      >
        <p className="text-[10px] text-gray-400 leading-relaxed">
          QuickBudget SA is a personal budgeting application. We do not provide
          financial advice. Debt counselling services are provided by Debt
          Payoff SA, a registered Debt Counsellor ({ncrNumber}) under the
          National Credit Act.
        </p>
        {showBadges && (
          <div className="mt-2 flex justify-center">
            <TrustBadgeGroup ncr ncrNumber={ncrNumber} />
          </div>
        )}
      </div>
    );
  }

  // Block variant
  return (
    <div
      className={cn(
        "bg-gray-50 border border-gray-200 rounded-lg p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
          <Info className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            Important Information
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed">
            QuickBudget SA is a personal finance management application that
            helps you track your budget and spending. We do not provide
            financial advice or credit services.
          </p>
          <p className="text-xs text-gray-600 leading-relaxed mt-2">
            Debt counselling services mentioned in this application are provided
            by <strong>Debt Payoff SA</strong>, a registered Debt Counsellor
            under the National Credit Act (Registration: {ncrNumber}). Any
            decision to engage with debt counselling services is voluntary and
            at your own discretion.
          </p>
          {showBadges && (
            <div className="mt-3">
              <TrustBadgeGroup ncr ncrNumber={ncrNumber} fais />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact trust footer for cards and modals
 */
interface TrustFooterProps {
  className?: string;
}

function TrustFooter({ className }: TrustFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 text-[10px] text-gray-400",
        className
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      <span>QuickBudget SA * Partner: Debt Payoff SA (NCR Registered)</span>
    </div>
  );
}

/**
 * NCA rights notice for debt-related features
 */
function NCANotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "bg-blue-50 border border-blue-200 rounded-lg p-3",
        className
      )}
    >
      <h5 className="text-xs font-medium text-blue-900 mb-1">
        Your Rights Under the NCA
      </h5>
      <p className="text-[10px] text-blue-700 leading-relaxed">
        Under the National Credit Act, you have the right to apply for debt
        counselling if you are struggling to meet your debt obligations. A
        registered debt counsellor can negotiate reduced payments with your
        creditors and protect you from legal action.
      </p>
    </div>
  );
}

export { RegulatoryDisclaimer, TrustFooter, NCANotice };
