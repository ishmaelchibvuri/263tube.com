"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import NextError from "next/error";

export default function GlobalError({
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
        component: 'global-error-boundary',
        digest: error.digest,
      },
    });

    // Also log to console for debugging
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    // global-error must include html and body tags
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Application Error
            </h1>
            <p className="text-gray-600 mb-6">
              A critical error occurred. Please refresh the page or contact support.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-left bg-gray-50 rounded p-4">
                <p className="text-xs font-mono text-gray-700">{error.message}</p>
              </div>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
