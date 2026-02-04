"use client";

/**
 * 263Tube - Referral Tracking Hook
 *
 * Detects ?ref=creator_slug in URL, tracks the referral, and cleans up the URL.
 * Uses sessionStorage to debounce and prevent duplicate tracking within a session.
 */

import { useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { trackReferral } from "@/actions/track-referral";

const SESSION_STORAGE_KEY = "263tube_tracked_referrals";

/**
 * Check if a referral has already been tracked this session
 */
function hasTrackedThisSession(slug: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const tracked = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!tracked) return false;

    const trackedSlugs: string[] = JSON.parse(tracked);
    return trackedSlugs.includes(slug);
  } catch {
    return false;
  }
}

/**
 * Mark a referral as tracked for this session
 */
function markAsTracked(slug: string): void {
  if (typeof window === "undefined") return;

  try {
    const tracked = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const trackedSlugs: string[] = tracked ? JSON.parse(tracked) : [];

    if (!trackedSlugs.includes(slug)) {
      trackedSlugs.push(slug);
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(trackedSlugs));
    }
  } catch {
    // Ignore sessionStorage errors
  }
}

/**
 * Remove the ref parameter from URL without page reload
 */
function cleanupUrl(pathname: string, searchParams: URLSearchParams): string {
  const newParams = new URLSearchParams(searchParams.toString());
  newParams.delete("ref");

  const newSearch = newParams.toString();
  return newSearch ? `${pathname}?${newSearch}` : pathname;
}

/**
 * Hook to track referrals from URL parameter
 *
 * Usage: Add to app/layout.tsx or a global provider
 *
 * Features:
 * - Detects ?ref=creator-slug in URL
 * - Tracks referral via server action (atomic DynamoDB counter)
 * - Debounces with sessionStorage (once per session per creator)
 * - Cleans up URL after tracking (removes ?ref param)
 */
export function useReferralTracker() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleReferral = useCallback(async () => {
    // Get the ref parameter
    const refSlug = searchParams.get("ref");

    if (!refSlug) {
      return;
    }

    // Sanitize the slug
    const sanitizedSlug = refSlug.toLowerCase().replace(/[^a-z0-9-]/g, "");

    if (!sanitizedSlug) {
      // Invalid slug, just clean up the URL
      const cleanUrl = cleanupUrl(pathname, searchParams);
      router.replace(cleanUrl, { scroll: false });
      return;
    }

    // Check if already tracked this session (debounce)
    if (hasTrackedThisSession(sanitizedSlug)) {
      // Already tracked, just clean up URL
      const cleanUrl = cleanupUrl(pathname, searchParams);
      router.replace(cleanUrl, { scroll: false });
      return;
    }

    try {
      // Track the referral via server action
      const result = await trackReferral(sanitizedSlug);

      if (result.success) {
        // Mark as tracked in sessionStorage
        markAsTracked(sanitizedSlug);
        console.log(`Referral tracked for: ${sanitizedSlug}`);
      }
    } catch (error) {
      console.warn("Failed to track referral:", error);
    }

    // Clean up the URL (remove ?ref param) regardless of tracking success
    const cleanUrl = cleanupUrl(pathname, searchParams);
    router.replace(cleanUrl, { scroll: false });
  }, [searchParams, router, pathname]);

  useEffect(() => {
    handleReferral();
  }, [handleReferral]);
}

export default useReferralTracker;
