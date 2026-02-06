"use server";

/**
 * 263Tube - Creator Submission Server Actions
 *
 * Server-side functions for handling creator submissions.
 * Submissions are stored with SK="PENDING_REQUEST#timestamp" for admin approval.
 */

import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { revalidatePath } from "next/cache";
import { formatSocialLink } from "@/lib/utils/sanitizers";
import { verifyChannelOwnership } from "@/lib/actions/verify-owner";
import { hashRequestId } from "@/lib/utils/hash";
import type { YouTubeEnrichment } from "@/lib/actions/validate-link";

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

export interface PlatformLink {
  label: string;
  url: string;
  // Verification data (populated when user clicks "Verify")
  verified?: boolean;
  verifiedAt?: string;
  verifiedDisplayName?: string | null;
  verifiedImage?: string | null;
  verifiedFollowers?: number | null;
  youtubeEnrichment?: YouTubeEnrichment;
}

export interface VerifiedLinkData {
  platform: string;
  displayName: string | null;
  image: string | null;
  followers: number | null;
  verifiedAt: string;
  youtubeEnrichment?: YouTubeEnrichment;
}

export interface CreatorSubmission {
  creatorName: string;
  /** Array of niche values from the taxonomy */
  niches: string[];
  /** Custom niche suggestion when "other" is selected (for admin review) */
  customNiche?: string;
  platforms: string[];
  platformLinks: Record<string, PlatformLink[]>;
  website?: string;
  about?: string;
  submitterName: string;
  submitterEmail: string;
  submitterRelation?: string;
  submissionType: "self" | "other";
  // Aggregated verified data for ecosystem preview
  verifiedLinks?: VerifiedLinkData[];
  // Primary profile image (from verified YouTube or highest follower platform)
  primaryProfileImage?: string | null;
}

export interface SubmitCreatorResult {
  success: boolean;
  message: string;
  requestId?: string;
  trackingId?: string;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Submit a creator request for admin approval
 *
 * Creates a pending request in DynamoDB with:
 * - PK: PENDING_REQUEST#{timestamp}
 * - SK: METADATA
 *
 * This allows admins to review and approve creators before they go live.
 */
export async function submitCreatorRequest(
  submission: CreatorSubmission
): Promise<SubmitCreatorResult> {
  // Validate required fields
  if (!submission.creatorName || submission.creatorName.trim().length === 0) {
    return { success: false, message: "Creator name is required" };
  }

  if (!submission.niches || submission.niches.length === 0) {
    return { success: false, message: "At least one content niche is required" };
  }

  if (!submission.platforms || submission.platforms.length === 0) {
    return { success: false, message: "At least one platform is required" };
  }

  if (!submission.submitterName || submission.submitterName.trim().length === 0) {
    return { success: false, message: "Your name is required" };
  }

  if (!submission.submitterEmail || submission.submitterEmail.trim().length === 0) {
    return { success: false, message: "Your email is required" };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(submission.submitterEmail)) {
    return { success: false, message: "Invalid email format" };
  }

  // Check that at least one platform has a valid URL
  const hasValidUrl = submission.platforms.some((platform) => {
    const links = submission.platformLinks[platform];
    return links?.some((link) => link.url && link.url.trim().length > 0);
  });

  if (!hasValidUrl) {
    return { success: false, message: "At least one social media link is required" };
  }

  const tableName = getTableName();
  const now = new Date();
  const timestamp = now.toISOString();
  const requestId = `${now.getTime()}-${Math.random().toString(36).substring(2, 9)}`;

  // Generate a slug from the creator name
  const slug = submission.creatorName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  try {
    // Count verified links for admin visibility
    const verifiedLinkCount = submission.platforms.reduce((count, platform) => {
      const links = submission.platformLinks[platform] || [];
      return count + links.filter((link) => link.verified).length;
    }, 0);

    // Run ownership verification for YouTube links (non-blocking)
    let ownershipVerification: {
      isVerified: boolean;
      channelTitle: string | null;
      channelId: string | null;
      riskLevel: "verified" | "unverified" | "suspicious";
      emailFound: string | null;
      emailChecked: string | null;
      message: string;
      verifiedAt: string;
    } | undefined;

    try {
      const youtubeLinks = submission.platformLinks["YouTube"] || [];
      const firstYouTubeUrl = youtubeLinks.find((l) => l.url.trim())?.url;

      if (firstYouTubeUrl) {
        // Check if sanitization passes
        const sanitizedUrl = formatSocialLink("youtube", firstYouTubeUrl);
        if (!sanitizedUrl) {
          ownershipVerification = {
            isVerified: false,
            channelTitle: null,
            channelId: null,
            riskLevel: "suspicious",
            emailFound: null,
            emailChecked: submission.submitterEmail.trim().toLowerCase(),
            message: "YouTube URL failed sanitization checks.",
            verifiedAt: new Date().toISOString(),
          };
        } else {
          const result = await verifyChannelOwnership(
            sanitizedUrl,
            submission.submitterEmail
          );
          ownershipVerification = {
            ...result,
            verifiedAt: new Date().toISOString(),
          };
        }
      }
    } catch (error) {
      console.error("Ownership verification failed (non-blocking):", error);
    }

    const item = {
      // Primary key for pending requests
      pk: `PENDING_REQUEST#${timestamp}`,
      sk: "METADATA",

      // GSI for querying all pending requests
      gsi1pk: "PENDING_REQUEST",
      gsi1sk: timestamp,

      // Request metadata
      requestId,
      entityType: "PENDING_REQUEST",
      status: "PENDING",

      // Creator information
      creatorName: submission.creatorName.trim(),
      slug,
      niches: submission.niches,
      // Primary niche (first selected) for GSI2 categorization
      primaryNiche: submission.niches[0],
      // Custom niche suggestion for admin review
      customNiche: submission.customNiche?.trim() || null,
      platforms: submission.platforms,
      platformLinks: submission.platformLinks,
      website: submission.website?.trim() || null,
      about: submission.about?.trim() || null,

      // Submitter information
      submitterName: submission.submitterName.trim(),
      submitterEmail: submission.submitterEmail.trim().toLowerCase(),
      submitterRelation: submission.submitterRelation?.trim() || null,
      submissionType: submission.submissionType,

      // Verification metadata (for admin review)
      verifiedLinks: submission.verifiedLinks || [],
      primaryProfileImage: submission.primaryProfileImage || null,
      verifiedLinkCount,

      // Ownership verification (from YouTube email check)
      ...(ownershipVerification ? { ownershipVerification } : {}),

      // Timestamps
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });

    await docClient.send(command);

    // Revalidate admin pages that might show pending requests
    revalidatePath("/admin/pending");

    return {
      success: true,
      message: "Your submission has been received and is pending review",
      requestId,
      trackingId: hashRequestId(requestId),
    };
  } catch (error) {
    console.error("Error submitting creator request:", error);
    return { success: false, message: "Failed to submit request. Please try again." };
  }
}

/**
 * Get all pending creator requests (for admin use)
 */
export async function getPendingRequests(limit: number = 50) {
  const tableName = getTableName();

  try {
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: {
        ":pk": "PENDING_REQUEST",
      },
      ScanIndexForward: false, // Most recent first
      Limit: limit,
    });

    const response = await docClient.send(command);
    return { success: true, data: response.Items || [] };
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return { success: false, data: [] };
  }
}
