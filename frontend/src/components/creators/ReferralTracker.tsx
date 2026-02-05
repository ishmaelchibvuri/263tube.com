"use client";

import { useEffect, useRef } from "react";
import { trackReferralAction } from "@/lib/actions/referrals";

interface ReferralTrackerProps {
  slug: string;
}

/**
 * Client component that tracks referrals when a creator profile is viewed.
 * Runs once on mount and handles the server action call.
 */
export function ReferralTracker({ slug }: ReferralTrackerProps) {
  const hasTracked = useRef(false);

  useEffect(() => {
    // Only track once per page load
    if (hasTracked.current) return;
    hasTracked.current = true;

    // Track the referral asynchronously
    trackReferralAction(slug).catch((error) => {
      console.error("Failed to track referral:", error);
    });
  }, [slug]);

  // This component doesn't render anything visible
  return null;
}
