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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ShieldCheck, FileText, AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client-debts";
import { ConsentPurpose } from "@/types";

interface PopiaConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsentGranted: (consentId: string) => void;
  onConsentDeclined: () => void;
  userEmail: string;
  userName: string;
}

/**
 * POPIA-compliant consent modal for data sharing with Debt Payoff SA
 * Implements explicit consent requirements per Protection of Personal Information Act
 */
function PopiaConsentModal({
  open,
  onOpenChange,
  onConsentGranted,
  onConsentDeclined,
  userEmail,
  userName,
}: PopiaConsentModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasReadTerms, setHasReadTerms] = React.useState(false);
  const [consentChecked, setConsentChecked] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Data fields that will be shared
  const dataToShare = [
    "Full name",
    "Email address",
    "Phone number (if provided)",
    "Total debt balance",
    "Debt-to-income ratio",
    "Number of active debts",
  ];

  const handleGrantConsent = async () => {
    if (!consentChecked) {
      setError("Please confirm your consent by checking the box above.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const consent = await api.consent.grantConsent(
        "DATA_SHARING_DEBT_COUNSELLOR" as ConsentPurpose,
        dataToShare
      );
      onConsentGranted(consent.consentId);
      onOpenChange(false);
    } catch (err) {
      setError("Failed to record consent. Please try again.");
      console.error("Consent error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = () => {
    onConsentDeclined();
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isSubmitting) {
      // Reset state when closing
      setHasReadTerms(false);
      setConsentChecked(false);
      setError(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 rounded-full p-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
            <DialogTitle>Data Sharing Consent</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            QuickBudget SA partners with registered debt counsellors to help
            users manage their finances. To provide you with a free assessment,
            we need your permission to share some information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Data being shared */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Information to be shared:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {dataToShare.map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-primary">*</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Partner info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Your data will be shared with:
            </h4>
            <p className="text-sm text-blue-700">
              <strong>Debt Payoff SA</strong> - NCR Registered Debt Counsellor
            </p>
            <p className="text-xs text-blue-600 mt-1">
              For the purpose of providing a free debt assessment
            </p>
          </div>

          {/* Consent checkbox */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="consent"
              checked={consentChecked}
              onCheckedChange={(checked) => {
                setConsentChecked(checked === true);
                setError(null);
              }}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="consent" className="text-sm font-medium cursor-pointer">
                I consent to sharing my data
              </Label>
              <p className="text-xs text-gray-500">
                I, {userName || "the user"}, understand that my personal
                information will be shared with Debt Payoff SA as described
                above. I can withdraw this consent at any time.
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleDecline}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            No, thanks
          </Button>
          <Button
            onClick={handleGrantConsent}
            disabled={!consentChecked || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Processing..." : "Yes, share my data"}
          </Button>
        </DialogFooter>

        {/* POPIA notice */}
        <p className="text-[10px] text-center text-gray-400 mt-2">
          Protected by POPIA. Your data is encrypted and handled securely.
        </p>
      </DialogContent>
    </Dialog>
  );
}

export { PopiaConsentModal };
