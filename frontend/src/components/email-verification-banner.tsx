"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X, AlertCircle } from "lucide-react";
import { EmailVerificationModal } from "./email-verification-modal";

interface EmailVerificationBannerProps {
  userEmail: string;
  onVerificationSuccess: () => void;
}

export function EmailVerificationBanner({
  userEmail,
  onVerificationSuccess,
}: EmailVerificationBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <>
      <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 mb-6">
        <AlertCircle className="h-5 w-5 text-orange-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex-1">
            <p className="font-semibold text-orange-900 mb-1">
              Please verify your email address
            </p>
            <p className="text-sm text-orange-700">
              We've sent a verification code to <span className="font-semibold">{userEmail}</span>.
              Verify your email to access full exams and all Free Tier features.
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <Button
              onClick={() => setShowModal(true)}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Mail className="mr-2 h-4 w-4" />
              Verify Now
            </Button>
            <Button
              onClick={() => setIsDismissed(true)}
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>

      <EmailVerificationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userEmail={userEmail}
        onVerificationSuccess={() => {
          onVerificationSuccess();
          setIsDismissed(true);
        }}
      />
    </>
  );
}
