/**
 * 263Tube API - Single Creator Profile
 *
 * GET /api/creators/[slug] - Get creator by slug
 * PUT /api/creators/[slug] - Update creator (admin only)
 * DELETE /api/creators/[slug] - Delete creator (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getCreatorBySlug,
  updateCreator,
  deleteCreator,
} from "@/lib/creators";

// Enable ISR with 60 second revalidation
export const revalidate = 60;

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/creators/[slug]
 * Fetch a single creator profile by slug
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing slug parameter",
        },
        { status: 400 }
      );
    }

    const creator = await getCreatorBySlug(slug);

    if (!creator) {
      return NextResponse.json(
        {
          success: false,
          error: "Creator not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: creator,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("Error in GET /api/creators/[slug]:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch creator",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/creators/[slug]
 * Update a creator profile (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession();
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing slug parameter",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Don't allow changing the slug
    delete body.slug;

    const updated = await updateCreator(slug, body);

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: "Creator not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updated,
        message: "Creator updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in PUT /api/creators/[slug]:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update creator",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/creators/[slug]
 * Delete a creator (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession();
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing slug parameter",
        },
        { status: 400 }
      );
    }

    // Check if creator exists first
    const existing = await getCreatorBySlug(slug);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Creator not found",
        },
        { status: 404 }
      );
    }

    await deleteCreator(slug);

    return NextResponse.json(
      {
        success: true,
        message: "Creator deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in DELETE /api/creators/[slug]:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete creator",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
