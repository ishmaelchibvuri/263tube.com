"use client";

/**
 * 263Tube - Referral Tracking Provider
 *
 * Wraps the app to enable referral tracking across all pages.
 * Detects ?ref=creator_slug in URL, tracks the referral, and cleans up the URL.
 */

import { Suspense } from "react";
import { useReferralTracker } from "@/hooks/useReferralTracker";

/**
 * Inner component that uses the tracking hook
 * Wrapped in Suspense because useSearchParams requires it
 */
function ReferralTracker() {
  useReferralTracker();
  return null;
}

/**
 * Provider component to wrap around the app
 *
 * Usage in layout.tsx:
 * ```tsx
 * <ReferralTrackingProvider>
 *   {children}
 * </ReferralTrackingProvider>
 * ```
 */
export function ReferralTrackingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <ReferralTracker />
      </Suspense>
      {children}
    </>
  );
}

export default ReferralTrackingProvider;
