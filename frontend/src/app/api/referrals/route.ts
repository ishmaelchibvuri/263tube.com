/**
 * 263Tube API - Referral Tracking
 *
 * POST /api/referrals - Track a referral
 * GET /api/referrals/trending - Get top referrers
 */

import { NextRequest, NextResponse } from "next/server";
import { trackReferral, getTopReferrers } from "@/lib/creators";

// Disable caching for referral endpoints
export const dynamic = "force-dynamic";

/**
 * POST /api/referrals
 * Track a referral for a creator
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid slug" },
        { status: 400 }
      );
    }

    // Sanitize slug
    const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");

    // Check rate limiting via cookie
    const cookieName = `ref_tracked_${sanitizedSlug}`;
    const existingCookie = request.cookies.get(cookieName);

    if (existingCookie) {
      return NextResponse.json(
        { success: true, message: "Already tracked", alreadyTracked: true },
        { status: 200 }
      );
    }

    // Track referral
    const result = await trackReferral(sanitizedSlug);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Creator not found" },
        { status: 404 }
      );
    }

    // Create response with rate-limiting cookie
    const response = NextResponse.json(
      {
        success: true,
        message: "Referral tracked",
        stats: result,
      },
      { status: 200 }
    );

    // Set cookie to prevent duplicate tracking (24 hour cooldown)
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    response.cookies.set(cookieName, "1", {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error in POST /api/referrals:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to track referral",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/referrals
 * Get top referrers (trending creators)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "3", 10);

    const creators = await getTopReferrers(Math.min(limit, 10));

    return NextResponse.json(
      {
        success: true,
        data: creators,
        count: creators.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/referrals:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch trending creators",
      },
      { status: 500 }
    );
  }
}
