"use server";

/**
 * 263Tube - Admin Server Actions
 *
 * Server-side functions for admin operations:
 * - Approving/rejecting creator submissions
 * - Managing creators
 * - Platform analytics
 */

import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";
import { revalidatePath } from "next/cache";
import { createCreator, type Creator } from "@/lib/creators";
import { requireAdmin } from "@/lib/auth-server";

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "af-south-1",
});

const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
  },
});

const getTableName = (): string => {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.ENVIRONMENT || "dev";
  return process.env.DYNAMODB_TABLE_NAME || `263tube-${env}`;
};

// ============================================================================
// Types
// ============================================================================

export interface ApproveCreatorResult {
  success: boolean;
  message: string;
  creatorSlug?: string;
}

export interface RejectCreatorResult {
  success: boolean;
  message: string;
}

interface VerifiedLinkData {
  platform: string;
  displayName: string | null;
  image: string | null;
  followers: number | null;
  verifiedAt: string;
}

interface PlatformLinkWithVerification {
  label: string;
  url: string;
  verified?: boolean;
  verifiedDisplayName?: string | null;
  verifiedImage?: string | null;
  verifiedFollowers?: number | null;
}

export interface PendingRequest {
  pk: string;
  sk: string;
  requestId: string;
  creatorName: string;
  slug: string;
  /** @deprecated Use niches array instead */
  niche?: string;
  /** Array of selected niches from the taxonomy */
  niches?: string[];
  /** Primary niche (first selected) for GSI2 */
  primaryNiche?: string;
  /** Custom niche suggestion if "other" was selected */
  customNiche?: string | null;
  platforms: string[];
  platformLinks: Record<string, PlatformLinkWithVerification[]>;
  website?: string;
  about?: string;
  submitterName: string;
  submitterEmail: string;
  submitterRelation?: string;
  submissionType: "self" | "other";
  status: string;
  createdAt: string;
  updatedAt: string;
  // Verification data
  verifiedLinks?: VerifiedLinkData[];
  primaryProfileImage?: string | null;
  verifiedLinkCount?: number;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Approve a pending creator submission
 *
 * Steps:
 * 1. Verify admin authorization
 * 2. Fetch the pending request from DynamoDB
 * 3. Transform to Creator object
 * 4. Create the creator in DynamoDB
 * 5. Delete the pending request
 * 6. Revalidate relevant paths
 */
export async function approveCreator(requestPk: string): Promise<ApproveCreatorResult> {
  try {
    // Verify admin authorization
    await requireAdmin();

    const tableName = getTableName();

    // Fetch the pending request
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: {
        pk: requestPk,
        sk: "METADATA",
      },
    });

    const response = await docClient.send(getCommand);

    if (!response.Item) {
      return { success: false, message: "Pending request not found" };
    }

    const request = response.Item as PendingRequest;

    // Determine the primary niche (support both old single niche and new niches array)
    const primaryNiche = request.primaryNiche || request.niches?.[0] || request.niche || "entertainment";

    // Calculate total reach from verified links
    let totalReach = 0;
    const subscriberCounts: Creator["metrics"]["subscribers"] = {};

    if (request.verifiedLinks && request.verifiedLinks.length > 0) {
      for (const link of request.verifiedLinks) {
        if (link.followers) {
          totalReach += link.followers;
          const platform = link.platform.toLowerCase() as keyof typeof subscriberCounts;
          if (["youtube", "instagram", "tiktok", "twitter"].includes(platform)) {
            subscriberCounts[platform] = (subscriberCounts[platform] || 0) + link.followers;
          }
        }
      }
    }

    // Transform pending request to Creator object
    const now = new Date().toISOString();
    const creator: Creator = {
      slug: request.slug,
      name: request.creatorName,
      bio: request.about || `${request.creatorName} is a ${primaryNiche} creator.`,
      niche: primaryNiche,
      status: "ACTIVE",
      verified: (request.verifiedLinkCount || 0) > 0,
      platforms: transformPlatformLinks(request.platformLinks),
      metrics: {
        totalReach,
        subscribers: Object.keys(subscriberCounts).length > 0 ? subscriberCounts : undefined,
      },
      referralStats: {
        currentWeek: 0,
        allTime: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    // Add profile picture from verified data
    if (request.primaryProfileImage) {
      creator.profilePicUrl = request.primaryProfileImage;
    }

    // Add website if provided
    if (request.website) {
      creator.platforms.website = [
        { label: "Website", url: request.website },
      ];
    }

    // Store additional niches as tags for future multi-niche support
    if (request.niches && request.niches.length > 1) {
      creator.tags = request.niches.slice(1);
    }

    // Add custom niche to tags if provided
    if (request.customNiche) {
      creator.tags = [...(creator.tags || []), request.customNiche];
    }

    // Create the creator in DynamoDB
    await createCreator(creator);

    // Delete the pending request
    const deleteCommand = new DeleteCommand({
      TableName: tableName,
      Key: {
        pk: requestPk,
        sk: "METADATA",
      },
    });

    await docClient.send(deleteCommand);

    // Revalidate paths
    revalidatePath("/admin/submissions");
    revalidatePath("/admin");
    revalidatePath("/creators");
    revalidatePath("/");

    return {
      success: true,
      message: `Creator "${request.creatorName}" has been approved and is now live!`,
      creatorSlug: request.slug,
    };
  } catch (error: any) {
    console.error("Error approving creator:", error);

    if (error.message?.includes("UNAUTHORIZED") || error.message?.includes("FORBIDDEN")) {
      return { success: false, message: "You are not authorized to perform this action" };
    }

    if (error.message?.includes("already exists")) {
      return { success: false, message: "A creator with this slug already exists" };
    }

    return { success: false, message: "Failed to approve creator. Please try again." };
  }
}

/**
 * Reject a pending creator submission
 *
 * Steps:
 * 1. Verify admin authorization
 * 2. Delete the pending request from DynamoDB
 * 3. Revalidate relevant paths
 */
export async function rejectCreator(requestPk: string): Promise<RejectCreatorResult> {
  try {
    // Verify admin authorization
    await requireAdmin();

    const tableName = getTableName();

    // Verify the request exists
    const getCommand = new GetCommand({
      TableName: tableName,
      Key: {
        pk: requestPk,
        sk: "METADATA",
      },
    });

    const response = await docClient.send(getCommand);

    if (!response.Item) {
      return { success: false, message: "Pending request not found" };
    }

    const request = response.Item as PendingRequest;

    // Delete the pending request
    const deleteCommand = new DeleteCommand({
      TableName: tableName,
      Key: {
        pk: requestPk,
        sk: "METADATA",
      },
    });

    await docClient.send(deleteCommand);

    // Revalidate paths
    revalidatePath("/admin/submissions");

    return {
      success: true,
      message: `Submission for "${request.creatorName}" has been rejected.`,
    };
  } catch (error: any) {
    console.error("Error rejecting creator:", error);

    if (error.message?.includes("UNAUTHORIZED") || error.message?.includes("FORBIDDEN")) {
      return { success: false, message: "You are not authorized to perform this action" };
    }

    return { success: false, message: "Failed to reject submission. Please try again." };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Transform platform links from submission format to Creator format
 */
function transformPlatformLinks(
  platformLinks: Record<string, { label: string; url: string }[]>
): Creator["platforms"] {
  const platforms: Creator["platforms"] = {};

  for (const [platform, links] of Object.entries(platformLinks)) {
    if (links && links.length > 0) {
      const key = platform.toLowerCase() as keyof Creator["platforms"];
      platforms[key] = links.map((link) => ({
        label: link.label,
        url: link.url,
      }));
    }
  }

  return platforms;
}
