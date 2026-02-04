"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, Shield, TrendingDown } from "lucide-react";
import { UserRiskProfile } from "@/types";

interface CriticalInterventionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGetHelp: () => void;
  onDismiss: () => void;
  profile: UserRiskProfile | null;
}

/**
 * Critical Intervention Modal for DTI > 50% or distress events
 * Level 3 intervention in the Trust Stack "Graduated Intervention" model
 *
 * Shows urgent but empathetic messaging to guide users toward debt counselling
 */
function CriticalInterventionModal({
  open,
  onOpenChange,
  onGetHelp,
  onDismiss,
  profile,
}: CriticalInterventionModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Determine the specific warning based on profile
  const getWarningDetails = () => {
    if (!profile) {
      return {
        headline: "Your finances need attention",
        detail: "We've noticed some concerning patterns in your budget.",
      };
    }

    if (profile.dtiRatio > 50) {
      return {
        headline: `Your debt is ${profile.dtiRatio.toFixed(0)}% of your income`,
        detail: "This exceeds the recommended 36% threshold and puts you at risk.",
      };
    }

    if (profile.distressEvents && profile.distressEvents.length > 0) {
      return {
        headline: "Payment difficulties detected",
        detail: "We noticed signs of financial strain in your recent transactions.",
      };
    }

    return {
      headline: "High-risk debt profile detected",
      detail: "Your current debt situation requires immediate attention.",
    };
  };

  const warning = getWarningDetails();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 rounded-full p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <DialogTitle className="text-red-900">
                Financial Health Warning
              </DialogTitle>
              <DialogDescription className="text-red-700">
                Important information about your budget
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Main warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-900 mb-1">
              {warning.headline}
            </h3>
            <p className="text-sm text-red-700">{warning.detail}</p>
          </div>

          {/* Key metrics */}
          {profile && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <TrendingDown className="h-5 w-5 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">
                  {profile.dtiRatio.toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">Debt-to-Income</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Shield className="h-5 w-5 text-amber-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-gray-900">36%</p>
                <p className="text-xs text-gray-500">Recommended Max</p>
              </div>
            </div>
          )}

          {/* Help message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Free help is available
            </h4>
            <p className="text-sm text-blue-700 mb-2">
              Under the National Credit Act, you have the right to apply for
              debt review. This can:
            </p>
            <ul className="text-sm text-blue-700 space-y-1 ml-4">
              <li>* Reduce your monthly payments</li>
              <li>* Protect you from legal action</li>
              <li>* Stop creditor harassment</li>
              <li>* Create a manageable repayment plan</li>
            </ul>
          </div>

          {/* Reassurance */}
          <p className="text-xs text-gray-500 text-center">
            This is not a judgement. Many South Africans face similar
            challenges. Taking action now protects your future.
          </p>
        </div>

        <DialogFooter className="flex-col gap-2">
          <Button
            onClick={onGetHelp}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            Get Free Assessment
          </Button>
          <Button variant="ghost" onClick={onDismiss} className="w-full">
            I'll manage on my own
          </Button>
        </DialogFooter>

        {/* Compliance notice */}
        <p className="text-[10px] text-center text-gray-400 mt-2">
          Assessment provided by Debt Payoff SA, NCR registered debt counsellor.
          QuickBudget SA does not provide financial advice.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export { CriticalInterventionModal };
