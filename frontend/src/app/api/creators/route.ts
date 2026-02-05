/**
 * 263Tube API - Get All Creators
 *
 * GET /api/creators - Fetch all active creators
 * GET /api/creators?category=comedy - Filter by category
 * GET /api/creators?featured=true - Get featured creators only
 * GET /api/creators?search=term - Search creators
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAllCreators,
  getCreatorsByCategory,
  getFeaturedCreators,
  searchCreators,
} from "@/lib/creators";
import { slugToValue, isValidNiche } from "@/constants/niches";

// Force dynamic rendering (no caching)
export const dynamic = "force-dynamic";

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const search = searchParams.get("search");
    const limit = searchParams.get("limit");
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;

    let creators;

    // Handle different query patterns
    if (search) {
      // Search creators by name/niche
      creators = await searchCreators(search, parsedLimit || 20);
    } else if (featured === "true") {
      // Get featured creators only
      creators = await getFeaturedCreators(parsedLimit || 8);
    } else if (category) {
      // Filter by category/niche
      // Support both slug format (from URL) and value format (from taxonomy)
      const nicheValue = slugToValue(category) || category;

      // Validate that it's a known niche
      if (!isValidNiche(nicheValue)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid category: ${category}`,
            message: "Please use a valid niche from the taxonomy",
          },
          { status: 400 }
        );
      }

      creators = await getCreatorsByCategory(nicheValue, parsedLimit);
    } else {
      // Get all active creators
      creators = await getAllCreators("ACTIVE", parsedLimit);
    }

    return NextResponse.json(
      {
        success: true,
        data: creators,
        count: creators.length,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/creators:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch creators",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/creators - Create a new creator (admin only)
 * This would typically require authentication
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession();
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();

    // Basic validation
    if (!body.name || !body.slug || !body.niche) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: name, slug, niche",
        },
        { status: 400 }
      );
    }

    // Import createCreator dynamically to avoid issues
    const { createCreator } = await import("@/lib/creators");

    const creator = await createCreator({
      slug: body.slug,
      name: body.name,
      bio: body.bio || "",
      niche: body.niche,
      status: body.status || "PENDING",
      verified: body.verified || false,
      platforms: body.platforms || {},
      metrics: body.metrics || { totalReach: 0 },
      profilePicUrl: body.profilePicUrl,
      bannerUrl: body.bannerUrl,
      coverImageUrl: body.coverImageUrl,
      location: body.location,
      tags: body.tags,
      topVideo: body.topVideo,
      contactEmail: body.contactEmail,
      bookingUrl: body.bookingUrl,
      joinedDate: body.joinedDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        data: creator,
        message: "Creator created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST /api/creators:", error);

    const message = error instanceof Error ? error.message : "Unknown error";

    // Handle duplicate slug error
    if (message.includes("already exists")) {
      return NextResponse.json(
        {
          success: false,
          error: message,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create creator",
        message,
      },
      { status: 500 }
    );
  }
}
