"use client";

/**
 * 263Tube - Referral Tracking Hook
 *
 * Detects ?ref=creator_slug in URL and tracks the referral
 * Should be used in the root layout or a provider component
 */

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export function useReferralTracking() {
  const searchParams = useSearchParams();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Get the ref parameter from URL
    const refSlug = searchParams.get("ref");

    // Only track once per page load and if ref exists
    if (!refSlug || hasTracked.current) {
      return;
    }

    // Mark as tracked to prevent duplicate calls
    hasTracked.current = true;

    // Track the referral
    trackReferral(refSlug);
  }, [searchParams]);
}

/**
 * Track a referral via the API
 */
async function trackReferral(slug: string) {
  try {
    const response = await fetch("/api/referrals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slug }),
    });

    if (!response.ok) {
      console.warn("Failed to track referral:", response.status);
      return;
    }

    const data = await response.json();

    if (data.success && !data.alreadyTracked) {
      console.log(`Referral tracked for: ${slug}`);
    }
  } catch (error) {
    // Silently fail - referral tracking is not critical
    console.warn("Error tracking referral:", error);
  }
}

export default useReferralTracking;
