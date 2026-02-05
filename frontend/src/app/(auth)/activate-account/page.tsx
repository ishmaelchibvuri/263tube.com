"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mail, Lock, User, Key, Sparkles, ArrowRight, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { usePostHog } from 'posthog-js/react';
import Confetti from "react-confetti";

export default function ActivateAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    activationCode: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  // Handle window resize for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Pre-fill email from URL params
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }));
    }
  }, [searchParams]);

  const validateForm = () => {
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }

    if (!formData.firstName || formData.firstName.trim().length < 1) {
      setError("Please enter your first name");
      return false;
    }

    if (!formData.lastName || formData.lastName.trim().length < 1) {
      setError("Please enter your last name");
      return false;
    }

    if (!formData.activationCode || formData.activationCode.length !== 6) {
      setError("Activation code must be 6 characters");
      return false;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    // Check password strength (Cognito requirements)
    const hasUpperCase = /[A-Z]/.test(formData.password);
    const hasLowerCase = /[a-z]/.test(formData.password);
    const hasNumbers = /\d/.test(formData.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setError("Password must contain uppercase, lowercase, and numbers");
      return false;
    }

    return true;
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      if (posthog) {
        posthog.capture('form_validation_failed', { form_id: 'activate_account_form' });
      }
      return;
    }

    setLoading(true);

    try {
      // Call backend API to activate account
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/activate-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          activationCode: formData.activationCode,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Activation failed');
      }

      console.log("Account activated successfully:", data);

      if (posthog) {
        posthog.capture('account_activated', {
          email: formData.email,
          user_id: data.userId
        });
      }

      setSuccess(true);
      setShowConfetti(true);
      toast.success("Account activated successfully!");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login?activated=true");
      }, 2000);

    } catch (err: any) {
      console.error("Activation error:", err);
      const errorMessage = err.message || "Failed to activate account. Please try again.";
      setError(errorMessage);
      toast.error("Activation failed");

      if (posthog) {
        posthog.capture('account_activation_failed', {
          error_message: errorMessage,
          email: formData.email
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-[#09090b] flex items-center justify-center py-8 px-4 sm:px-6">
        {/* Ambient Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#319E31]/10 rounded-full blur-[100px] sm:blur-[150px]" />
          <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#FFD200]/5 rounded-full blur-[80px] sm:blur-[120px]" />
        </div>

        {/* Confetti Effect */}
        {showConfetti && (
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={500}
            gravity={0.3}
          />
        )}

        <div className="relative w-full max-w-md mx-auto text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#319E31]/20 flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-[#319E31]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Account Activated!
          </h1>
          <p className="text-slate-400">
            Redirecting to login...
          </p>
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#319E31]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#09090b] flex items-center justify-center py-8 px-4 sm:px-6">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#FFD200]/10 rounded-full blur-[100px] sm:blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#DE2010]/5 rounded-full blur-[80px] sm:blur-[120px]" />
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
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#FFD200]/20 flex items-center justify-center">
            <Key className="h-7 w-7 text-[#FFD200]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Activate Your Account
          </h1>
          <p className="text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FFD200]" />
            Enter your activation code and set your password
          </p>
        </div>

        {/* Activation Card */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleActivate} className="space-y-5">
            {error && (
              <div className="bg-[#DE2010]/10 border border-[#DE2010]/20 rounded-xl p-4">
                <p className="text-[#DE2010] text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFD200]/50 transition-colors disabled:opacity-50"
                />
              </div>
            </div>

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
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    disabled={loading}
                    className="w-full h-12 pl-12 pr-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFD200]/50 transition-colors disabled:opacity-50"
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
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    disabled={loading}
                    className="w-full h-12 pl-12 pr-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFD200]/50 transition-colors disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="activationCode" className="block text-sm font-medium text-slate-300">
                Activation Code
              </label>
              <input
                id="activationCode"
                type="text"
                placeholder="XXXXXX"
                value={formData.activationCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    activationCode: e.target.value.toUpperCase().slice(0, 6)
                  })
                }
                required
                maxLength={6}
                disabled={loading}
                className="w-full h-14 px-4 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white text-2xl text-center font-mono tracking-[0.5em] uppercase placeholder:text-slate-500 placeholder:tracking-[0.5em] focus:outline-none focus:border-[#FFD200]/50 transition-colors disabled:opacity-50"
              />
              <p className="text-xs text-slate-500 text-center">
                Check your email for the 6-character activation code
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-12 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFD200]/50 transition-colors disabled:opacity-50"
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
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-12 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#FFD200]/50 transition-colors disabled:opacity-50"
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
              className="w-full h-12 bg-gradient-to-r from-[#FFD200] to-[#e6bd00] hover:from-[#ffe033] hover:to-[#FFD200] disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-black font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Activating Account...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Activate Account
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
              <span className="px-4 bg-[#09090b] text-slate-500">Already activated?</span>
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
            Didn't receive the code?{" "}
            <Link href="/register" className="text-[#FFD200] hover:underline">
              Request new activation
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
