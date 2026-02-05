"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Mail, Lock, ArrowRight, Sparkles, PartyPopper, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { trackLogin, trackLoginFailed } from "@/lib/analytics";
import Confetti from "react-confetti";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const { signIn, user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Check if user just activated their account
  useEffect(() => {
    const activated = searchParams.get("activated");
    if (activated === "true") {
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }
  }, [searchParams]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      trackLogin('email', user?.role, user?.role === 'admin');
      toast.success("Login successful!");
    } catch (err: any) {
      let errorMessage = "Login failed. Please try again.";
      if (err.name === "NotAuthorizedException") {
        errorMessage = "Incorrect email or password";
      } else if (err.name === "UserNotConfirmedException") {
        errorMessage = "Please verify your email before logging in";
      } else if (err.name === "UserNotFoundException") {
        errorMessage = "No account found with this email";
      } else {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      toast.error("Login failed");
      trackLoginFailed(err.name, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#09090b] flex items-center justify-center py-8 px-4 sm:px-6">
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[#DE2010]/10 rounded-full blur-[100px] sm:blur-[150px]" />
        <div className="absolute bottom-0 right-0 w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-[#319E31]/5 rounded-full blur-[80px] sm:blur-[120px]" />
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

      <div className="relative w-full max-w-md mx-auto space-y-6 sm:space-y-8">
        {/* Account Activated Success Banner */}
        {searchParams.get("activated") === "true" && (
          <div className="bg-[#319E31]/10 border border-[#319E31]/20 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top duration-500">
            <PartyPopper className="h-5 w-5 text-[#319E31] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#319E31] font-semibold text-sm">Congratulations!</p>
              <p className="text-slate-400 text-sm">Your account has been activated. You can now sign in.</p>
            </div>
          </div>
        )}

        {/* Logo & Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              <Image src="/images/logo.png" alt="263Tube" width={48} height={48} className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-bold text-white">263<span className="text-[#DE2010]">Tube</span></span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-400 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 text-[#FFD200]" />
            Sign in to manage your profile
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
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
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-[#FFD200] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#DE2010] to-[#b01a0d] hover:from-[#ff2a17] hover:to-[#DE2010] disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
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
              <span className="px-4 bg-[#09090b] text-slate-500">New to 263Tube?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <Link
            href="/register"
            className="w-full h-12 flex items-center justify-center gap-2 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white font-medium hover:bg-white/[0.1] transition-all"
          >
            Create an account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-slate-500 px-4">
          <p>
            By signing in, you agree to our{" "}
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
