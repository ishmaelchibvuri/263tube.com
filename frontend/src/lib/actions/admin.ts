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
  UpdateCommand,
  QueryCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";
import { revalidatePath } from "next/cache";
import { createCreator, deleteCreator, type Creator } from "@/lib/creators";
import { requireAdmin } from "@/lib/auth-server";
import { verifyChannelOwnership } from "@/lib/actions/verify-owner";

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

export interface VerificationProofResult {
  success: boolean;
  message: string;
  verificationCode?: string;
}

export interface DeleteCreatorResult {
  success: boolean;
  message: string;
}

export interface ReverifyResult {
  success: boolean;
  message: string;
  riskLevel?: string;
}

interface VerifiedLinkData {
  platform: string;
  displayName: string | null;
  image: string | null;
  followers: number | null;
  verifiedAt: string;
  youtubeEnrichment?: {
    totalVideos: number | null;
    totalViews: number | null;
    channelStartDate: string | null;
    monthlyViews: number | null;
    engagementRate: number | null;
    channelId: string | null;
    dataFetchedAt: string;
    videoHighlights?: {
      videoId: string;
      title: string;
      thumbnail: string | null;
      views: number;
      likes: number;
      publishedAt: string;
    }[];
  };
}

interface PlatformLinkWithVerification {
  label: string;
  url: string;
  verified?: boolean;
  verifiedDisplayName?: string | null;
  verifiedImage?: string | null;
  verifiedFollowers?: number | null;
}

export interface OwnershipVerification {
  isVerified: boolean;
  channelTitle: string | null;
  channelId: string | null;
  riskLevel: "verified" | "unverified" | "suspicious";
  emailFound: string | null;
  emailChecked: string | null;
  message: string;
  verifiedAt: string;
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
  // Ownership verification
  ownershipVerification?: OwnershipVerification;
  verificationCode?: string | null;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Internal helper: approve a creator with optional forced verification badge
 */
async function approveCreatorInternal(
  requestPk: string,
  forceVerified: boolean
): Promise<ApproveCreatorResult> {
  try {
    await requireAdmin();

    const tableName = getTableName();

    const getCmd = new GetCommand({
      TableName: tableName,
      Key: { pk: requestPk, sk: "METADATA" },
    });

    const response = await docClient.send(getCmd);

    if (!response.Item) {
      return { success: false, message: "Pending request not found" };
    }

    const request = response.Item as PendingRequest;

    const primaryNiche = request.primaryNiche || request.niches?.[0] || request.niche || "entertainment";

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

    // Extract YouTube enrichment data from verified links (summed across channels)
    let totalVideos = 0;
    let totalViews = 0;
    let monthlyViews = 0;
    let primaryEngagementRate: number | null = null;
    let earliestChannelStartDate: string | null = null;
    let hasVideoData = false;
    let hasMonthlyViewData = false;
    let hasTotalViewData = false;
    const allVideoHighlights: { videoId: string; title: string; thumbnail: string | null; views: number; likes: number; publishedAt: string }[] = [];

    if (request.verifiedLinks && request.verifiedLinks.length > 0) {
      for (const link of request.verifiedLinks) {
        const enrichment = link.youtubeEnrichment;
        if (!enrichment) continue;

        if (enrichment.totalVideos != null) {
          totalVideos += enrichment.totalVideos;
          hasVideoData = true;
        }
        if (enrichment.totalViews != null) {
          totalViews += enrichment.totalViews;
          hasTotalViewData = true;
        }
        if (enrichment.channelStartDate) {
          if (!earliestChannelStartDate || enrichment.channelStartDate < earliestChannelStartDate) {
            earliestChannelStartDate = enrichment.channelStartDate;
          }
        }
        if (enrichment.monthlyViews != null) {
          monthlyViews += enrichment.monthlyViews;
          hasMonthlyViewData = true;
        }
        if (primaryEngagementRate == null && enrichment.engagementRate != null) {
          primaryEngagementRate = enrichment.engagementRate;
        }
        if (enrichment.videoHighlights) {
          allVideoHighlights.push(...enrichment.videoHighlights);
        }
      }
    }

    // Deduplicate and pick best video highlights across all channels
    const uniqueHighlights = allVideoHighlights.filter(
      (v, i, arr) => arr.findIndex((x) => x.videoId === v.videoId) === i
    );
    const finalHighlights: typeof uniqueHighlights = [];
    if (uniqueHighlights.length > 0) {
      const mostViewed = [...uniqueHighlights].sort((a, b) => b.views - a.views)[0];
      if (mostViewed) finalHighlights.push(mostViewed);
      const mostLiked = [...uniqueHighlights].sort((a, b) => b.likes - a.likes)[0];
      if (mostLiked && mostLiked.videoId !== mostViewed?.videoId) finalHighlights.push(mostLiked);
      const latest = [...uniqueHighlights].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0];
      if (latest && !finalHighlights.some((v) => v.videoId === latest.videoId)) finalHighlights.push(latest);
      const oldest = [...uniqueHighlights].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())[0];
      if (oldest && !finalHighlights.some((v) => v.videoId === oldest.videoId)) finalHighlights.push(oldest);
    }

    const now = new Date().toISOString();
    const creator: Creator = {
      slug: request.slug,
      name: request.creatorName,
      bio: request.about || `${request.creatorName} is a ${primaryNiche} creator.`,
      niche: primaryNiche,
      status: "ACTIVE",
      verified: forceVerified || (request.verifiedLinkCount || 0) > 0,
      platforms: transformPlatformLinks(request.platformLinks),
      metrics: {
        totalReach,
        subscribers: Object.keys(subscriberCounts).length > 0 ? subscriberCounts : undefined,
        ...(hasVideoData ? { totalVideos } : {}),
        ...(hasTotalViewData ? { totalViews } : {}),
        ...(earliestChannelStartDate ? { channelStartDate: earliestChannelStartDate } : {}),
        ...(hasMonthlyViewData ? { monthlyViews } : {}),
        ...(primaryEngagementRate != null ? { engagement: primaryEngagementRate } : {}),
      },
      ...(finalHighlights.length > 0 ? { videoHighlights: finalHighlights } : {}),
      referralStats: {
        currentWeek: 0,
        allTime: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    if (request.primaryProfileImage) {
      creator.profilePicUrl = request.primaryProfileImage;
    }

    if (request.website) {
      creator.platforms.website = [
        { label: "Website", url: request.website },
      ];
    }

    if (request.niches && request.niches.length > 1) {
      creator.tags = request.niches.slice(1);
    }

    if (request.customNiche) {
      creator.tags = [...(creator.tags || []), request.customNiche];
    }

    await createCreator(creator);

    const deleteCommand = new DeleteCommand({
      TableName: tableName,
      Key: { pk: requestPk, sk: "METADATA" },
    });

    await docClient.send(deleteCommand);

    revalidatePath("/admin/submissions");
    revalidatePath("/admin");
    revalidatePath("/creators");
    revalidatePath("/");
    revalidatePath("/dashboard/activity");
    revalidatePath("/track", "layout");

    return {
      success: true,
      message: `Creator "${request.creatorName}" has been approved${forceVerified ? " with verified badge" : ""} and is now live!`,
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
 * Approve a pending creator submission (standard)
 */
export async function approveCreator(requestPk: string): Promise<ApproveCreatorResult> {
  return approveCreatorInternal(requestPk, false);
}

/**
 * Approve a pending creator with forced verified badge
 */
export async function approveWithBadge(requestPk: string): Promise<ApproveCreatorResult> {
  return approveCreatorInternal(requestPk, true);
}

/**
 * Request verification proof from a creator
 * Generates a unique code and sets status to PENDING_VERIFICATION
 */
export async function requestVerificationProof(
  requestPk: string
): Promise<VerificationProofResult> {
  try {
    await requireAdmin();

    const tableName = getTableName();

    const getCmd = new GetCommand({
      TableName: tableName,
      Key: { pk: requestPk, sk: "METADATA" },
    });

    const response = await docClient.send(getCmd);

    if (!response.Item) {
      return { success: false, message: "Pending request not found" };
    }

    // Generate verification code: 263TUBE-XXXX-XXXX
    const hex = () => Math.random().toString(16).substring(2, 6).toUpperCase();
    const code = `263TUBE-${hex()}-${hex()}`;

    const updateCmd = new UpdateCommand({
      TableName: tableName,
      Key: { pk: requestPk, sk: "METADATA" },
      UpdateExpression: "SET #s = :status, verificationCode = :code, updatedAt = :now",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":status": "PENDING_VERIFICATION",
        ":code": code,
        ":now": new Date().toISOString(),
      },
    });

    await docClient.send(updateCmd);

    revalidatePath("/admin/submissions");
    revalidatePath("/dashboard/activity");
    revalidatePath("/track", "layout");

    return {
      success: true,
      message: `Verification code generated. Share this with the creator to place in their YouTube channel description.`,
      verificationCode: code,
    };
  } catch (error: any) {
    console.error("Error requesting verification proof:", error);

    if (error.message?.includes("UNAUTHORIZED") || error.message?.includes("FORBIDDEN")) {
      return { success: false, message: "You are not authorized to perform this action" };
    }

    return { success: false, message: "Failed to generate verification code. Please try again." };
  }
}

/**
 * Re-run ownership verification for a pending request
 * Also checks for verificationCode in channel description
 */
export async function reverifyOwnership(
  requestPk: string
): Promise<ReverifyResult> {
  try {
    await requireAdmin();

    const tableName = getTableName();

    const getCmd = new GetCommand({
      TableName: tableName,
      Key: { pk: requestPk, sk: "METADATA" },
    });

    const response = await docClient.send(getCmd);

    if (!response.Item) {
      return { success: false, message: "Pending request not found" };
    }

    const request = response.Item as PendingRequest;

    // Find the first YouTube URL
    const youtubeLinks = request.platformLinks?.YouTube || request.platformLinks?.youtube || [];
    const firstYouTubeUrl = youtubeLinks.find((l) => l.url.trim())?.url;

    if (!firstYouTubeUrl) {
      return { success: false, message: "No YouTube link found on this submission." };
    }

    // Re-run verification
    const result = await verifyChannelOwnership(firstYouTubeUrl, request.submitterEmail);

    // Also check for verification code in the description if one was issued
    let codeVerified = false;
    if (
      !result.isVerified &&
      request.verificationCode &&
      result.channelId
    ) {
      // The channel description is already checked in verifyChannelOwnership,
      // but we need to specifically look for the verification code
      // We can use the YouTube API to fetch the description and check
      const apiKey = process.env.YOUTUBE_API_KEY;
      if (apiKey) {
        try {
          const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${result.channelId}&key=${apiKey}`;
          const apiResponse = await fetch(apiUrl);
          if (apiResponse.ok) {
            const data = await apiResponse.json();
            const description = data.items?.[0]?.snippet?.description || "";
            if (description.includes(request.verificationCode)) {
              codeVerified = true;
            }
          }
        } catch {
          // Non-critical
        }
      }
    }

    const ownershipVerification: OwnershipVerification = {
      isVerified: result.isVerified || codeVerified,
      channelTitle: result.channelTitle,
      channelId: result.channelId,
      riskLevel: result.isVerified || codeVerified ? "verified" : result.riskLevel,
      emailFound: result.emailFound,
      emailChecked: result.emailChecked,
      message: codeVerified
        ? "Verified via verification code in channel description."
        : result.message,
      verifiedAt: new Date().toISOString(),
    };

    // Update the record
    const updateCmd = new UpdateCommand({
      TableName: tableName,
      Key: { pk: requestPk, sk: "METADATA" },
      UpdateExpression: "SET ownershipVerification = :ov, updatedAt = :now",
      ExpressionAttributeValues: {
        ":ov": ownershipVerification,
        ":now": new Date().toISOString(),
      },
    });

    await docClient.send(updateCmd);

    revalidatePath("/admin/submissions");
    revalidatePath("/dashboard/activity");
    revalidatePath("/track", "layout");

    return {
      success: true,
      message: ownershipVerification.isVerified
        ? `Ownership verified for "${request.creatorName}"!`
        : `Re-verification complete. Risk level: ${ownershipVerification.riskLevel}`,
      riskLevel: ownershipVerification.riskLevel,
    };
  } catch (error: any) {
    console.error("Error re-verifying ownership:", error);

    if (error.message?.includes("UNAUTHORIZED") || error.message?.includes("FORBIDDEN")) {
      return { success: false, message: "You are not authorized to perform this action" };
    }

    return { success: false, message: "Failed to re-verify ownership. Please try again." };
  }
}

/**
 * Fully delete an approved creator and all related inquiry records
 */
export async function deleteCreatorFull(slug: string): Promise<DeleteCreatorResult> {
  try {
    await requireAdmin();

    const tableName = getTableName();

    // 1. Delete the main creator record
    await deleteCreator(slug);

    // 2. Query all inquiry records for this creator (pk = INQUIRY#{slug})
    const queryCmd = new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: {
        ":pk": `INQUIRY#${slug}`,
      },
    });

    const queryResponse = await docClient.send(queryCmd);

    // 3. Batch-delete all inquiry records (max 25 per batch)
    if (queryResponse.Items && queryResponse.Items.length > 0) {
      const batches: Record<string, unknown>[][] = [];
      for (let i = 0; i < queryResponse.Items.length; i += 25) {
        batches.push(queryResponse.Items.slice(i, i + 25));
      }

      for (const batch of batches) {
        const deleteRequests = batch.map((item) => ({
          DeleteRequest: {
            Key: { pk: item.pk, sk: item.sk },
          },
        }));

        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [tableName]: deleteRequests,
            },
          })
        );
      }
    }

    revalidatePath("/creators");
    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true, message: `Creator "${slug}" and related data deleted.` };
  } catch (error: any) {
    console.error("Error deleting creator:", error);

    if (error.message?.includes("UNAUTHORIZED") || error.message?.includes("FORBIDDEN")) {
      return { success: false, message: "You are not authorized to perform this action" };
    }

    return { success: false, message: "Failed to delete creator. Please try again." };
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
    revalidatePath("/dashboard/activity");
    revalidatePath("/track", "layout");

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
