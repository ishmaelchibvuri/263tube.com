"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Crown, Zap, ArrowRight, Sparkles } from "lucide-react";
import Confetti from "react-confetti";
import { trackPaymentSuccess } from "@/lib/analytics";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = searchParams.get("tier") || "premium";
  const [showConfetti, setShowConfetti] = useState(true);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Set window size for confetti
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    // Track payment success
    const tierInfo = {
      premium: { price: 99.99, duration: 30 },
      pro: { price: 179.99, duration: 90 },
    };
    const info = tierInfo[tier as keyof typeof tierInfo] || tierInfo.premium;

    trackPaymentSuccess(
      'payment-' + Date.now(), // purchaseId placeholder
      tier,
      info.price,
      'ZAR',
      info.duration
    );

    return () => clearTimeout(timer);
  }, [tier]);

  const tierInfo = {
    premium: {
      name: "Premium",
      icon: Crown,
      color: "text-primary",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-500",
      price: "R99.99",
      duration: "30 days",
      benefits: [
        "Unlimited budget tracking",
        "Full 50/30/20 analysis",
        "Detailed spending reports",
        "Savings goal tracking",
        "Loan payment alerts",
        "Monthly insights",
        "Email support",
      ],
    },
    pro: {
      name: "Pro",
      icon: Zap,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-500",
      price: "R179.99",
      duration: "90 days",
      benefits: [
        "Everything in Premium",
        "Debt payoff strategies",
        "Multi-account tracking",
        "Financial forecasting",
        "Priority support",
        "Advanced analytics",
        "Budget templates",
        "Extended 90-day access",
        "Spending predictions",
      ],
    },
  };

  const info = tierInfo[tier as keyof typeof tierInfo] || tierInfo.premium;
  const Icon = info.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className={`${info.bgColor} p-8 text-center border-b-4 ${info.borderColor}`}>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                <CheckCircle className="h-20 w-20 text-green-600 relative" />
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-yellow-500" />
              Payment Successful!
              <Sparkles className="h-8 w-8 text-yellow-500" />
            </h1>
            <p className="text-lg text-gray-700">
              Welcome to {info.name}! Your account has been upgraded.
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Tier Badge */}
            <div className="flex items-center justify-center gap-3 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <Icon className={`h-10 w-10 ${info.color}`} />
              <div>
                <p className="text-sm text-gray-600">You now have</p>
                <p className="text-2xl font-bold text-gray-900">{info.name} Access</p>
              </div>
            </div>

            {/* Subscription Details */}
            <div className="mb-6 p-6 bg-gray-50 rounded-xl">
              <h2 className="font-semibold text-lg mb-4">Subscription Details</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-semibold">{info.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-semibold">{info.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-semibold">{info.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    <CheckCircle className="h-4 w-4" />
                    Active
                  </span>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="mb-8">
              <h2 className="font-semibold text-lg mb-4">You now have access to:</h2>
              <div className="grid gap-3">
                {info.benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-green-50 rounded-lg transition-all hover:bg-green-100"
                  >
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What's Next */}
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
              <p className="text-blue-800 text-sm">
                A confirmation email has been sent to your registered email address. You can start using your {info.name} features immediately!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-4 rounded-xl font-semibold text-lg hover:from-primary/90 hover:to-secondary/90 transition-all transform hover:scale-105 shadow-lg"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => router.push("/profile")}
                className="flex-1 bg-gray-100 text-gray-900 px-6 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                View Profile
              </button>
            </div>

            {/* Support Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need help?{" "}
                <a href="mailto:support@quickbudget.co.za" className="text-primary hover:underline font-semibold">
                  Contact Support
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Thank you for upgrading! We're excited to help you take control of your finances.
          </p>
        </div>
      </div>
    </div>
  );
}
