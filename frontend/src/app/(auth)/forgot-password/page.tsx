"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { resetPassword, confirmResetPassword } from "aws-amplify/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { usePostHog } from 'posthog-js/react';
import { Loader2, KeyRound, Mail, Lock, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"request" | "confirm">("request");
  const posthog = usePostHog();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      const errorMessage = "Please enter your email address";
      setError(errorMessage);
      if (posthog) {
        posthog.capture('form_submission_failed', { form_id: 'forgot_password_request', error_message: errorMessage });
      }
      return;
    }

    setLoading(true);

    try {
      await resetPassword({ username: email });
      setSuccess("Reset code sent! Check your email for the verification code.");
      setStep("confirm");
      if (posthog) {
        posthog.capture('password_reset_requested', { email });
      }
    } catch (err: any) {
      console.error("Password reset request error:", err);
      let errorMessage = "Failed to request password reset. Please try again.";

      if (err.name === "UserNotFoundException") {
        errorMessage = "No account found with this email address";
      } else if (err.name === "LimitExceededException") {
        errorMessage = "Too many attempts. Please try again later";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      if (posthog) {
        posthog.capture('password_reset_request_failed', { error_message: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!code || !newPassword || !confirmPassword) {
      const errorMessage = "Please fill in all fields";
      setError(errorMessage);
      if (posthog) {
        posthog.capture('form_submission_failed', { form_id: 'forgot_password_confirm', error_message: errorMessage });
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      const errorMessage = "Passwords do not match";
      setError(errorMessage);
      if (posthog) {
        posthog.capture('form_submission_failed', { form_id: 'forgot_password_confirm', error_message: errorMessage });
      }
      return;
    }

    if (newPassword.length < 8) {
      const errorMessage = "Password must be at least 8 characters";
      setError(errorMessage);
      if (posthog) {
        posthog.capture('form_submission_failed', { form_id: 'forgot_password_confirm', error_message: errorMessage });
      }
      return;
    }

    setLoading(true);

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword: newPassword,
      });

      setSuccess("Password reset successful! Redirecting to login...");
      if (posthog) {
        posthog.capture('password_reset_completed', { email });
      }

      setTimeout(() => {
        router.push("/login?reset=success");
      }, 2000);
    } catch (err: any) {
      console.error("Password reset confirmation error:", err);
      let errorMessage = "Failed to reset password. Please try again.";

      if (err.name === "CodeMismatchException") {
        errorMessage = "Invalid verification code";
      } else if (err.name === "ExpiredCodeException") {
        errorMessage = "Verification code has expired. Please request a new one";
      } else if (err.name === "LimitExceededException") {
        errorMessage = "Too many attempts. Please try again later";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      if (posthog) {
        posthog.capture('password_reset_confirmation_failed', { error_message: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-pink-600 shadow-2xl mb-6 animate-pulse">
            {step === "request" ? (
              <KeyRound className="h-10 w-10 text-white" />
            ) : (
              <ShieldCheck className="h-10 w-10 text-white" />
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {step === "request" ? "Reset Password" : "Create New Password"}
          </h1>
          <p className="text-lg text-gray-600">
            {step === "request"
              ? "We'll send you a code to reset your password"
              : "Enter the code and choose a new password"}
          </p>
        </div>

        {/* Reset Card */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              {step === "request" ? "Password Recovery" : "Reset Your Password"}
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              {step === "request"
                ? "Enter your email address to receive a reset code"
                : "Enter the verification code sent to your email"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="border-red-300 bg-red-50 mb-5">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-300 bg-green-50 mb-5">
                <AlertDescription className="text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {step === "request" ? (
              <form onSubmit={handleRequestReset} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      Send Reset Code
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-4">
                  <Link
                    href="/login"
                    className="text-sm text-primary hover:text-blue-700 font-medium hover:underline"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-gray-700 font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    autoComplete="off"
                    className="h-12 text-center text-xl tracking-widest border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-700 font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Create a strong password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Must be at least 8 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <CheckCircle2 className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-4 space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("request");
                      setCode("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setError("");
                      setSuccess("");
                    }}
                    className="text-sm text-primary hover:text-blue-700 font-medium hover:underline block w-full"
                  >
                    Didn't receive the code? Request a new one
                  </button>
                  <Link
                    href="/login"
                    className="text-sm text-gray-600 hover:text-blue-700 hover:underline block"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Need help? Contact{" "}
            <a href="mailto:support@quickbudget.co.za" className="text-primary hover:underline">
              support@quickbudget.co.za
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
