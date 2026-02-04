"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  onVerificationSuccess: () => void;
}

export function EmailVerificationModal({
  isOpen,
  onClose,
  userEmail,
  onVerificationSuccess,
}: EmailVerificationModalProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("idToken")}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify email");
      }

      setSuccess(true);
      setTimeout(() => {
        onVerificationSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to verify email. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setVerificationCode(value);
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Verify Your Email</DialogTitle>
          <DialogDescription className="text-center">
            We've sent a 6-digit verification code to{" "}
            <span className="font-semibold text-gray-900">{userEmail}</span>
          </DialogDescription>
        </DialogHeader>

        {!success ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="code" className="text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <Input
                id="code"
                type="text"
                maxLength={6}
                value={verificationCode}
                onChange={handleInputChange}
                placeholder="Enter 6-digit code"
                className="text-center text-2xl tracking-widest font-mono"
                disabled={isVerifying}
              />
              <p className="text-xs text-gray-500 text-center">
                Check your email inbox (and spam folder)
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleVerify}
              disabled={isVerifying || verificationCode.length !== 6}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
              disabled={isVerifying}
            >
              I'll do this later
            </Button>
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">Email Verified!</h3>
            <p className="text-sm text-gray-600">
              You now have full Free Tier access to all exams and features.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
