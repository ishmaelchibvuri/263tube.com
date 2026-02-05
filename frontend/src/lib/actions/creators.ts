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
}

export interface CreatorSubmission {
  creatorName: string;
  niche: string;
  platforms: string[];
  platformLinks: Record<string, PlatformLink[]>;
  website?: string;
  about?: string;
  submitterName: string;
  submitterEmail: string;
  submitterRelation?: string;
  submissionType: "self" | "other";
}

export interface SubmitCreatorResult {
  success: boolean;
  message: string;
  requestId?: string;
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

  if (!submission.niche || submission.niche.trim().length === 0) {
    return { success: false, message: "Content niche is required" };
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
      niche: submission.niche,
      platforms: submission.platforms,
      platformLinks: submission.platformLinks,
      website: submission.website?.trim() || null,
      about: submission.about?.trim() || null,

      // Submitter information
      submitterName: submission.submitterName.trim(),
      submitterEmail: submission.submitterEmail.trim().toLowerCase(),
      submitterRelation: submission.submitterRelation?.trim() || null,
      submissionType: submission.submissionType,

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
