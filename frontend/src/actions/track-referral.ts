"use server";

/**
 * 263Tube - Referral Tracking Server Action
 *
 * Tracks referrals using DynamoDB atomic counters to prevent race conditions.
 * Updates both currentWeek and allTime counts, plus the GSI sort key.
 */

import {
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

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

export interface TrackReferralResult {
  success: boolean;
  message: string;
  newCount?: number;
}

/**
 * Track a referral for a creator using atomic DynamoDB counter
 *
 * This uses UpdateItem with ADD operation to atomically increment the counters
 * without needing to read the current value first, preventing race conditions.
 *
 * @param slug - The creator's slug identifier
 * @returns Result object with success status and new count
 */
export async function trackReferral(slug: string): Promise<TrackReferralResult> {
  // Validate input
  if (!slug || typeof slug !== "string") {
    return { success: false, message: "Invalid slug provided" };
  }

  // Sanitize slug (alphanumeric and hyphens only)
  const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "");
  if (sanitizedSlug.length === 0 || sanitizedSlug.length > 100) {
    return { success: false, message: "Invalid slug format" };
  }

  const tableName = getTableName();
  const now = new Date().toISOString();

  try {
    // Use atomic ADD operation to increment counters
    // This prevents race conditions when multiple referrals come in simultaneously
    const command = new UpdateCommand({
      TableName: tableName,
      Key: {
        pk: `CREATOR#${sanitizedSlug}`,
        sk: "METADATA",
      },
      // Atomic increment using ADD - no need to read first
      UpdateExpression: `
        ADD referralStats.currentWeek :inc,
            referralStats.allTime :inc
        SET referralStats.lastReferralAt = :now,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ":inc": 1,
        ":now": now,
      },
      // Ensure the creator exists
      ConditionExpression: "attribute_exists(pk)",
      // Return the new values
      ReturnValues: "ALL_NEW",
    });

    const response = await docClient.send(command);

    if (!response.Attributes) {
      return { success: false, message: "Failed to update referral count" };
    }

    const newWeeklyCount = response.Attributes.referralStats?.currentWeek || 0;

    // Update the GSI_REFERRALS sort key for proper leaderboard sorting
    // We use inverted value (999999999 - count) for descending sort
    await updateGSIReferralSortKey(sanitizedSlug, newWeeklyCount);

    return {
      success: true,
      message: "Referral tracked successfully",
      newCount: newWeeklyCount,
    };
  } catch (error: any) {
    // Handle case where creator doesn't exist
    if (error.name === "ConditionalCheckFailedException") {
      console.warn(`Creator not found: ${sanitizedSlug}`);
      return { success: false, message: "Creator not found" };
    }

    console.error("Error tracking referral:", error);
    return { success: false, message: "Failed to track referral" };
  }
}

/**
 * Update the GSI_REFERRALS sort key to maintain proper leaderboard ordering
 *
 * The sort key is structured as: {invertedCount}#{slug}
 * We invert the count (999999999 - count) so that higher counts sort first
 * when using ScanIndexForward=true (ascending string sort)
 */
async function updateGSIReferralSortKey(
  slug: string,
  currentWeekCount: number
): Promise<void> {
  const tableName = getTableName();

  // Invert and pad the count for proper string sorting (descending)
  const invertedCount = 999999999 - currentWeekCount;
  const gsi3sk = `${String(invertedCount).padStart(9, "0")}#${slug}`;

  try {
    const command = new UpdateCommand({
      TableName: tableName,
      Key: {
        pk: `CREATOR#${slug}`,
        sk: "METADATA",
      },
      UpdateExpression: "SET gsi3pk = :pk, gsi3sk = :sk",
      ExpressionAttributeValues: {
        ":pk": "REFERRAL#WEEKLY",
        ":sk": gsi3sk,
      },
    });

    await docClient.send(command);
  } catch (error) {
    // Log but don't fail - GSI update is secondary to the main counter update
    console.error("Error updating GSI sort key:", error);
  }
}

/**
 * Get the top trending creators (leaderboard)
 * Queries GSI_REFERRALS with descending sort
 */
export async function getTrendingCreators(limit: number = 3) {
  const tableName = getTableName();

  try {
    const { QueryCommand } = await import("@aws-sdk/lib-dynamodb");

    const command = new QueryCommand({
      TableName: tableName,
      IndexName: "GSI_REFERRALS",
      KeyConditionExpression: "gsi3pk = :pk",
      ExpressionAttributeValues: {
        ":pk": "REFERRAL#WEEKLY",
      },
      // ScanIndexForward=true with inverted sort key = descending by count
      ScanIndexForward: true,
      Limit: limit,
    });

    const response = await docClient.send(command);

    return response.Items || [];
  } catch (error) {
    console.error("Error fetching trending creators:", error);
    return [];
  }
}
