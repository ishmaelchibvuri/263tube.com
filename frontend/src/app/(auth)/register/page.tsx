"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signUp } from "aws-amplify/auth";
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
import { Loader2, Wallet, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import {
  trackSignupFormSubmitted,
  trackSignupSuccess,
  trackSignupFailed,
  trackVerificationCodeSubmitted,
  trackVerificationSuccess,
} from "@/lib/analytics";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const posthog = usePostHog();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      const errorMessage = "Passwords do not match";
      setError(errorMessage);
      trackSignupFailed(errorMessage, 'ValidationError');
      return;
    }

    if (formData.password.length < 8) {
      const errorMessage = "Password must be at least 8 characters";
      setError(errorMessage);
      trackSignupFailed(errorMessage, 'ValidationError');
      return;
    }

    setLoading(true);

    // Track signup form submission before Cognito call
    trackSignupFormSubmitted(formData.email);

    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
            given_name: formData.firstName,
            family_name: formData.lastName,
          },
          autoSignIn: false,
        },
      });

      console.log("Sign up successful:", {
        isSignUpComplete,
        userId,
        nextStep,
      });

      if (nextStep.signUpStep === "CONFIRM_SIGN_UP") {
        // Track successful account creation (awaiting verification)
        trackSignupSuccess(userId);
        setVerificationStep(true);
        setError("");
      } else if (nextStep.signUpStep === "DONE") {
        // Track successful signup (no verification needed)
        trackSignupSuccess(userId);
        // Add contact to Brevo list 20 directly
        try {
          await fetch('/api/brevo/add-contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName,
            }),
          });
        } catch (brevoError) {
          console.error('Failed to add contact to Brevo:', brevoError);
        }
        router.push("/login?registered=true");
      }
    } catch (err: any) {
      console.error("Registration error:", err);
      let errorMessage = "Failed to register. Please try again.";

      if (err.name === "UsernameExistsException") {
        errorMessage = "An account with this email already exists";
      } else if (err.name === "InvalidPasswordException") {
        errorMessage = "Password does not meet requirements";
      } else if (err.name === "InvalidParameterException") {
        errorMessage = "Invalid email or password format";
      } else {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
      // Track signup failure with reason
      trackSignupFailed(errorMessage, err.name);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Track verification code submission
    trackVerificationCodeSubmitted();

    try {
      const { confirmSignUp } = await import("aws-amplify/auth");

      await confirmSignUp({
        username: formData.email,
        confirmationCode: verificationCode,
      });

      // Track successful verification
      trackVerificationSuccess();

      // Add contact to Brevo list 20 directly
      try {
        await fetch('/api/brevo/add-contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
          }),
        });
      } catch (brevoError) {
        console.error('Failed to add contact to Brevo:', brevoError);
      }

      router.push("/login?verified=true");
    } catch (err: any) {
      console.error("Verification error:", err);

      let errorMessage = "Verification failed. Please try again.";
      if (err.name === "CodeMismatchException") {
        errorMessage = "Invalid verification code";
      } else if (err.name === "ExpiredCodeException") {
        errorMessage = "Verification code has expired";
      } else {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
      // Track verification failure (use signup_failed with verification context)
      trackSignupFailed(`Verification: ${errorMessage}`, err.name);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const { resendSignUpCode } = await import("aws-amplify/auth");
      await resendSignUpCode({ username: formData.email });
      const successMessage = "Verification code resent to your email";
      setError(successMessage);
    } catch (err: any) {
      console.error("Resend error:", err);
      const errorMessage = "Failed to resend code";
      setError(errorMessage);
      trackSignupFailed(`Resend code: ${errorMessage}`, err.name);
    }
  };

  if (verificationStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Hero Section */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-2xl mb-6 animate-pulse">
              <Mail className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Check Your Email
            </h1>
            <p className="text-lg text-gray-600">
              We've sent a verification code to
            </p>
            <p className="text-lg font-semibold text-primary mt-1">
              {formData.email}
            </p>
          </div>

          {/* Verification Card */}
          <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center text-gray-900">
                Verify Your Email
              </CardTitle>
              <CardDescription className="text-center text-gray-600">
                Enter the 6-digit code to activate your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerification} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="border-red-300 bg-red-50">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="code" className="text-gray-700 font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="h-12 text-center text-2xl tracking-widest border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Email
                      <CheckCircle2 className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-4">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-sm text-primary hover:text-blue-700 font-medium hover:underline"
                  >
                    Didn't receive the code? Resend
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600">
            <p>
              Check your spam folder if you don't see the email
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary shadow-2xl mb-6 animate-pulse">
            <Wallet className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Start Your Journey
          </h1>
          <p className="text-lg text-gray-600 flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Create your free account and take control of your finances
          </p>
        </div>

        {/* Registration Card */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Join thousands of South Africans taking control of their money
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-300 bg-red-50">
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">
                    First Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="John"
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">
                    Last Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      id="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="Doe"
                      className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="you@example.com"
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Create a strong password"
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    placeholder="Re-enter your password"
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            {/* Sign In Link */}
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full h-12 px-6 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Sign in instead
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>
            By creating an account, you agree to our{" "}
            <a href="/terms" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
