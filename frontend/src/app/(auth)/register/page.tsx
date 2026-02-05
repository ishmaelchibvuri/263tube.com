"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signUp } from "aws-amplify/auth";
import { Mail, Lock, User, ArrowRight, Sparkles, Loader2, Eye, EyeOff, CheckCircle, Video, Megaphone } from "lucide-react";
import { toast } from "sonner";
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
    userTier: "" as "creator" | "sponsor" | "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.userTier) {
      const errorMessage = "Please select an account type";
      setError(errorMessage);
      trackSignupFailed(errorMessage, 'ValidationError');
      return;
    }

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
            "custom:role": formData.userTier,
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
        toast.success("Account created! Check your email for a verification code.");
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
        toast.success("Account created successfully!");
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
      toast.error("Registration failed");
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

      toast.success("Email verified successfully!");
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
      toast.error("Verification failed");
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
      toast.success("Verification code resent to your email");
    } catch (err: any) {
      console.error("Resend error:", err);
      toast.error("Failed to resend code");
      trackSignupFailed(`Resend code: Failed to resend`, err.name);
    }
  };

  if (verificationStep) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#09090b] flex items-center justify-center py-8 px-4 sm:px-6">
        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#319E31]/10 rounded-full blur-[100px] sm:blur-[150px]" />
          <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#FFD200]/5 rounded-full blur-[80px] sm:blur-[120px]" />
        </div>

        <div className="relative w-full max-w-md mx-auto space-y-6 sm:space-y-8">
          {/* Logo & Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-xl overflow-hidden">
                <Image src="/images/logo.png" alt="263Tube" width={48} height={48} className="w-full h-full object-contain" />
              </div>
              <span className="text-2xl font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
            </Link>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#319E31]/20 flex items-center justify-center">
              <Mail className="h-8 w-8 text-[#319E31]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Check Your Email
            </h1>
            <p className="text-slate-400">
              We've sent a verification code to
            </p>
            <p className="text-[#FFD200] font-medium mt-1">
              {formData.email}
            </p>
          </div>

          {/* Verification Card */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-8">
            <form onSubmit={handleVerification} className="space-y-5">
              {error && (
                <div className="bg-[#DE2010]/10 border border-[#DE2010]/20 rounded-xl p-4">
                  <p className="text-[#DE2010] text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="code" className="block text-sm font-medium text-slate-300">
                  Verification Code
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  disabled={loading}
                  className="w-full h-14 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white text-2xl text-center font-mono tracking-[0.5em] placeholder:text-slate-500 placeholder:tracking-[0.5em] focus:outline-none focus:border-[#319E31]/50 transition-colors disabled:opacity-50"
                />
                <p className="text-xs text-slate-500 text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full h-12 bg-gradient-to-r from-[#319E31] to-[#267326] hover:from-[#3ab03a] hover:to-[#319E31] disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Verify Email
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-sm text-[#FFD200] hover:underline"
                >
                  Didn't receive the code? Resend
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center text-xs sm:text-sm text-slate-500 px-4">
            <p>Check your spam folder if you don't see the email</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#09090b] flex items-center justify-center py-8 px-4 sm:px-6">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#DE2010]/10 rounded-full blur-[100px] sm:blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#319E31]/5 rounded-full blur-[80px] sm:blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md mx-auto space-y-6 sm:space-y-8">
        {/* Logo & Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              <Image src="/images/logo.png" alt="263Tube" width={48} height={48} className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Join 263Tube
          </h1>
          <p className="text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FFD200]" />
            Get insights, connect & grow
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="bg-[#DE2010]/10 border border-[#DE2010]/20 rounded-xl p-4">
                <p className="text-[#DE2010] text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="firstName" className="block text-sm font-medium text-slate-300">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    disabled={loading}
                    className="w-full h-12 pl-12 pr-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="lastName" className="block text-sm font-medium text-slate-300">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    id="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    disabled={loading}
                    className="w-full h-12 pl-12 pr-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Account Type Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-300">
                I am a... <span className="text-[#DE2010]">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, userTier: "creator" })}
                  disabled={loading}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    formData.userTier === "creator"
                      ? "bg-[#DE2010]/10 border-[#DE2010] text-white"
                      : "bg-white/[0.05] border-white/[0.1] text-slate-300 hover:border-white/[0.2]"
                  } disabled:opacity-50`}
                >
                  <div className={`p-2 rounded-lg ${formData.userTier === "creator" ? "bg-[#DE2010]/20" : "bg-white/[0.05]"}`}>
                    <Video className={`h-5 w-5 ${formData.userTier === "creator" ? "text-[#DE2010]" : "text-slate-400"}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Content Creator</p>
                    <p className="text-xs text-slate-400">I create videos on YouTube, TikTok, or Rumble</p>
                  </div>
                  {formData.userTier === "creator" && (
                    <CheckCircle className="absolute right-4 h-5 w-5 text-[#DE2010]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, userTier: "sponsor" })}
                  disabled={loading}
                  className={`relative flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    formData.userTier === "sponsor"
                      ? "bg-[#FFD200]/10 border-[#FFD200] text-white"
                      : "bg-white/[0.05] border-white/[0.1] text-slate-300 hover:border-white/[0.2]"
                  } disabled:opacity-50`}
                >
                  <div className={`p-2 rounded-lg ${formData.userTier === "sponsor" ? "bg-[#FFD200]/20" : "bg-white/[0.05]"}`}>
                    <Megaphone className={`h-5 w-5 ${formData.userTier === "sponsor" ? "text-[#FFD200]" : "text-slate-400"}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Sponsor / Advertiser</p>
                    <p className="text-xs text-slate-400">I want to partner with Zimbabwean creators</p>
                  </div>
                  {formData.userTier === "sponsor" && (
                    <CheckCircle className="absolute right-4 h-5 w-5 text-[#FFD200]" />
                  )}
                </button>

              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a strong password"
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-12 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Min 8 characters with uppercase, lowercase, and numbers
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Re-enter your password"
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-12 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#DE2010]/50 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] hover:from-[#ff2a17] hover:to-[#DE2010] disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.1]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#09090b] text-slate-500">Already have an account?</span>
            </div>
          </div>

          {/* Sign In Link */}
          <Link
            href="/login"
            className="w-full h-12 flex items-center justify-center gap-2 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white font-medium hover:bg-white/[0.1] transition-all"
          >
            Sign in instead
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-slate-500 px-4">
          <p>
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="text-[#FFD200] hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-[#FFD200] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
