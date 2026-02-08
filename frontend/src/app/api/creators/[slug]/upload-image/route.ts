/**
 * 263Tube API - Upload Creator Image to S3
 *
 * POST /api/creators/[slug]/upload-image
 *
 * Accepts multipart form data:
 *   - file: Image file (JPEG, PNG, WebP — max 5MB)
 *   - type: "profile" | "banner"
 *
 * Uploads the image to S3 and updates the creator record in DynamoDB
 * with the new S3 URL for the corresponding image fields.
 */

import { NextRequest, NextResponse } from "next/server";
import { uploadCreatorImage } from "@/lib/s3";
import { getCreatorBySlug, updateCreator } from "@/lib/creators";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // TODO: Add authentication check
    // const session = await getServerSession();
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Missing slug parameter" },
        { status: 400 }
      );
    }

    // Verify creator exists
    const creator = await getCreatorBySlug(slug);
    if (!creator) {
      return NextResponse.json(
        { success: false, error: "Creator not found" },
        { status: 404 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (!type || (type !== "profile" && type !== "banner")) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid type. Must be "profile" or "banner"',
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File too large. Maximum size is 5MB" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid file type. Allowed: JPEG, PNG, WebP",
        },
        { status: 400 }
      );
    }

    // Read file into buffer and upload to S3
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const s3Url = await uploadCreatorImage(buffer, slug, type, file.type);

    // Update the creator record with the new S3 URL
    const updates: Record<string, string> = {};
    if (type === "profile") {
      updates.profilePicUrl = s3Url;
      updates.primaryProfileImage = s3Url;
    } else {
      updates.bannerUrl = s3Url;
      updates.coverImageUrl = s3Url;
    }

    await updateCreator(slug, updates);

    return NextResponse.json(
      {
        success: true,
        data: { url: s3Url, type },
        message: `${type === "profile" ? "Profile image" : "Banner image"} uploaded successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in POST /api/creators/[slug]/upload-image:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload image",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
