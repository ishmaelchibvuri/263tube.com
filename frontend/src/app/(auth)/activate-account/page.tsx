"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Loader2, Mail, Lock, CheckCircle2, Key, Sparkles, ArrowRight, User } from "lucide-react";

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
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login?activated=true");
      }, 2000);

    } catch (err: any) {
      console.error("Activation error:", err);
      const errorMessage = err.message || "Failed to activate account. Please try again.";
      setError(errorMessage);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Key className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Activate Your Account
          </CardTitle>
          <CardDescription className="text-base">
            Enter your activation code and set your password
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600 animate-bounce" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                Account Activated Successfully!
              </h3>
              <p className="text-gray-600">
                Redirecting to login...
              </p>
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleActivate} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="animate-shake">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                    className="h-11"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="activationCode" className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4 text-gray-500" />
                  Activation Code
                </Label>
                <Input
                  id="activationCode"
                  type="text"
                  placeholder="Enter 6-character code"
                  value={formData.activationCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      activationCode: e.target.value.toUpperCase().slice(0, 6)
                    })
                  }
                  required
                  maxLength={6}
                  className="h-11 text-center text-xl font-mono tracking-widest uppercase"
                />
                <p className="text-xs text-gray-500">
                  Check your email for the 6-character activation code
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  New Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  className="h-11"
                />
                <p className="text-xs text-gray-500">
                  Min 8 characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-500" />
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:shadow-lg transition-all duration-200 text-base font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Activating Account...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Activate Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="pt-4 text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Already activated?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-purple-600 hover:text-purple-700 hover:underline transition-colors"
                  >
                    Log in here
                  </Link>
                </p>

                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-500">
                    Didn't receive the code?{" "}
                    <Link
                      href="/register"
                      className="font-medium text-purple-600 hover:text-purple-700 hover:underline transition-colors"
                    >
                      Request new activation
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
