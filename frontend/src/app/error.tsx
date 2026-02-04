"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { AlertCircle, RefreshCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture exception in PostHog
    posthog.captureException(error, {
      tags: {
        component: 'root-error-boundary',
        digest: error.digest,
      },
    });

    // Also log to console for debugging
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 p-4">
            <AlertCircle className="h-16 w-16 text-red-600" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
          Something went wrong
        </h1>

        {/* Error Message */}
        <p className="text-gray-600 text-center mb-6">
          We've been notified about this issue and we'll fix it as soon as possible.
        </p>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
            <p className="text-xs font-mono text-gray-700 break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            <RefreshCcw className="h-5 w-5" />
            Try Again
          </Button>

          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            <Home className="h-5 w-5" />
            Go to Dashboard
          </Button>
        </div>

        {/* Support Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{" "}
            <a
              href="mailto:support@quickbudget.co.za"
              className="text-primary hover:underline font-semibold"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
