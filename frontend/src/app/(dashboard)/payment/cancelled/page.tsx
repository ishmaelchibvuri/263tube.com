"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, ArrowLeft, HelpCircle, MessageCircle, CreditCard } from "lucide-react";
import { useEffect } from "react";
import { trackPaymentCancelled } from "@/lib/analytics";

export default function PaymentCancelledPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tier = searchParams.get("tier") || "unknown";
    trackPaymentCancelled(tier);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Cancel Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 p-8 text-center border-b-2 border-gray-200">
            <div className="flex justify-center mb-4">
              <XCircle className="h-20 w-20 text-gray-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Payment Cancelled
            </h1>
            <p className="text-lg text-gray-600">
              Your payment was not processed
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Info */}
            <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-500 rounded">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                What happened?
              </h3>
              <p className="text-blue-800">
                You cancelled the payment process or closed the payment window. No charges have been made to your account.
              </p>
            </div>

            {/* Reasons */}
            <div className="mb-8">
              <h2 className="font-semibold text-lg mb-4">Common reasons for cancellation:</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <CreditCard className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Payment information issues</p>
                    <p className="text-sm text-gray-600">
                      Double-check your card details and ensure you have sufficient funds
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Accidental cancellation</p>
                    <p className="text-sm text-gray-600">
                      You can try again anytime - your cart is still waiting
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <MessageCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Need more information?</p>
                    <p className="text-sm text-gray-600">
                      Feel free to contact our support team if you have questions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* What You're Missing */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-3">With Premium/Pro you get:</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-700">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>Unlimited budget tracking</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>Detailed financial analytics</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>Advanced debt payoff tools</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700">
                  <div className="h-2 w-2 bg-primary rounded-full"></div>
                  <span>Priority support</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button
                onClick={() => router.push("/pricing")}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-4 rounded-xl font-semibold text-lg hover:from-primary/90 hover:to-secondary/90 transition-all transform hover:scale-105 shadow-lg"
              >
                Try Again
                <ArrowLeft className="h-5 w-5 rotate-180" />
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 bg-gray-100 text-gray-900 px-6 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Continue with Free
              </button>
            </div>

            {/* Support */}
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-600 mb-2">
                Having trouble with payment?
              </p>
              <a
                href="mailto:support@quickbudget.co.za"
                className="text-primary hover:underline font-semibold inline-flex items-center gap-1"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Support
              </a>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-600 hover:text-gray-900 transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
