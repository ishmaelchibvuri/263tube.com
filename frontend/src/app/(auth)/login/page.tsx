"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
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
import { Loader2, Wallet, Mail, Lock, ArrowRight, Sparkles, PartyPopper } from "lucide-react";
import { toast } from "sonner";
import { trackLogin, trackLoginFailed } from "@/lib/analytics";
import Confetti from "react-confetti";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    // Set initial size
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check if user just activated their account
  useEffect(() => {
    const activated = searchParams.get("activated");
    if (activated === "true") {
      setShowConfetti(true);
      // Stop confetti after 5 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }
  }, [searchParams]);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      console.log("User already logged in, redirecting to dashboard...");

      // Redirect based on role
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
      console.log("Attempting login for:", email);

      await signIn(email, password);

      console.log("Login successful");

      // Track successful login
      trackLogin('email', user?.role, user?.role === 'admin');

      toast.success("Login successful!");

      // The redirect will be handled by the useEffect that watches for user changes
    } catch (err: any) {
      console.error("Login error:", err);

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

      // Track login failure
      trackLoginFailed(err.name, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
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

      <div className="w-full max-w-md mx-auto space-y-6 sm:space-y-8">
        {/* Account Activated Success Banner */}
        {searchParams.get("activated") === "true" && (
          <Alert className="border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg animate-in slide-in-from-top duration-500">
            <PartyPopper className="h-5 w-5 text-green-600" />
            <AlertDescription className="text-green-900 font-medium text-base ml-2">
              <span className="font-bold">Congratulations!</span> Your account has been activated successfully. You can now login with your credentials and start your journey!
            </AlertDescription>
          </Alert>
        )}

        {/* Hero Section */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-secondary shadow-2xl mb-4 sm:mb-6 animate-pulse">
            <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome Back!
          </h1>
          <p className="text-base sm:text-lg text-gray-600 flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />
            Continue managing your budget
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 w-full">
          <CardHeader className="space-y-1 pb-4 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl font-bold text-center text-gray-900">
              Sign in to your account
            </CardTitle>
            <CardDescription className="text-center text-gray-600 text-sm sm:text-base">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-300 bg-red-50">
                  <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium text-sm sm:text-base">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 h-11 sm:h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium text-sm sm:text-base">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 h-11 sm:h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-blue-700 font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-11 sm:h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold text-base sm:text-lg shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-5 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-4 bg-white text-gray-500">New to the platform?</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center w-full h-11 sm:h-12 px-4 sm:px-6 rounded-lg border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm sm:text-base transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Create a free account
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs sm:text-sm text-gray-600 px-4">
          <p>
            By signing in, you agree to our{" "}
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
