"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackPaymentFailed } from "@/lib/analytics";

export default function PaymentFailedPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tier = searchParams.get("tier") || "unknown";
    const error = searchParams.get("error") || "Payment processing failed";
    trackPaymentFailed(tier, error);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Error Icon */}
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-16 w-16 text-red-600" />
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Failed
          </h1>
          <p className="text-gray-600 mb-6">
            Unfortunately, your payment could not be processed. No charges have
            been made to your account.
          </p>

          {/* Info Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-red-900 mb-2">
              Common reasons for failure:
            </h3>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Insufficient funds</li>
              <li>• Incorrect card details</li>
              <li>• Card expired or blocked</li>
              <li>• Bank security restrictions</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              href="/pricing"
              className="block w-full bg-primary text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/dashboard"
              className="block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Support Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Need assistance?{" "}
            <Link href="/support" className="text-primary hover:underline">
              Contact support
            </Link>
            {" "}or email{" "}
            <a
              href="mailto:support@quickbudget.co.za"
              className="text-primary hover:underline"
            >
              support@quickbudget.co.za
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
