"use server";

/**
 * 263Tube - Referral Tracking Server Actions
 *
 * Server-side functions for tracking referrals with atomic counters
 * These run securely on the server and can't be manipulated client-side
 */

import { trackReferral as dbTrackReferral, getTopReferrers } from "@/lib/creators";
import { cookies } from "next/headers";

// Rate limiting: Track referrals in a cookie to prevent spam
const REFERRAL_COOKIE_PREFIX = "ref_tracked_";
const REFERRAL_COOLDOWN_HOURS = 24;

/**
 * Track a referral for a creator
 * Uses atomic counter in DynamoDB to prevent race conditions
 * Includes rate limiting to prevent spam
 */
export async function trackReferralAction(
  slug: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate slug
    if (!slug || typeof slug !== "string" || slug.length > 100) {
      return { success: false, message: "Invalid creator slug" };
    }

    // Sanitize slug (alphanumeric and hyphens only)
    const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (sanitizedSlug !== slug.toLowerCase()) {
      return { success: false, message: "Invalid creator slug format" };
    }

    // Check if this referral was already tracked recently (rate limiting)
    const cookieStore = await cookies();
    const cookieName = `${REFERRAL_COOKIE_PREFIX}${sanitizedSlug}`;
    const existingCookie = cookieStore.get(cookieName);

    if (existingCookie) {
      // Already tracked within cooldown period
      return { success: true, message: "Referral already counted" };
    }

    // Track the referral in DynamoDB
    const result = await dbTrackReferral(sanitizedSlug);

    if (!result) {
      return { success: false, message: "Creator not found" };
    }

    // Set cookie to prevent duplicate tracking
    const expires = new Date();
    expires.setHours(expires.getHours() + REFERRAL_COOLDOWN_HOURS);

    cookieStore.set(cookieName, "1", {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return {
      success: true,
      message: `Referral tracked for ${sanitizedSlug}`,
    };
  } catch (error) {
    console.error("Error tracking referral:", error);
    return { success: false, message: "Failed to track referral" };
  }
}

/**
 * Get the top referrers for the "Trending This Week" section
 */
export async function getTrendingCreatorsAction(limit: number = 3) {
  try {
    const creators = await getTopReferrers(limit);
    return { success: true, data: creators };
  } catch (error) {
    console.error("Error fetching trending creators:", error);
    return { success: false, data: [] };
  }
}
