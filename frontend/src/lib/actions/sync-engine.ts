"use server";

/**
 * 263Tube - Auto-Sync Engine & Dashboard Stats
 *
 * Server actions for:
 * - Syncing all creator stats (follower counts, reach)
 * - Fetching dashboard statistics
 * - Manual verification override
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-server";
import type { Creator } from "@/lib/creators";

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
  const env =
    process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.ENVIRONMENT || "dev";
  return process.env.DYNAMODB_TABLE_NAME || `263tube-${env}`;
};

// ============================================================================
// Types
// ============================================================================

export interface DashboardStats {
  totalCreators: number;
  activeCreators: number;
  pendingCreators: number;
  totalPlatformReach: number;
  totalInquiries: number;
  pendingInquiries: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  synced?: number;
  errors?: number;
}

export interface ToggleVerifiedResult {
  success: boolean;
  message: string;
}

// ============================================================================
// Dashboard Stats
// ============================================================================

/**
 * Get dashboard statistics for the admin panel
 * Fetches: active creators, pending submissions, total reach, inquiry counts
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  await requireAdmin();

  const tableName = getTableName();

  try {
    // Run all queries in parallel for speed
    const [activeResult, pendingResult, inquiryResult] = await Promise.all([
      // Get all active creators
      docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "GSI1",
          KeyConditionExpression: "gsi1pk = :pk",
          ExpressionAttributeValues: {
            ":pk": "STATUS#ACTIVE",
          },
          Select: "ALL_ATTRIBUTES",
        })
      ),
      // Get all pending submissions
      docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "GSI1",
          KeyConditionExpression: "gsi1pk = :pk",
          ExpressionAttributeValues: {
            ":pk": "PENDING_REQUEST",
          },
          Select: "COUNT",
        })
      ),
      // Get all inquiries
      docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "GSI1",
          KeyConditionExpression: "gsi1pk = :pk",
          ExpressionAttributeValues: {
            ":pk": "INQUIRY#ALL",
          },
          Select: "ALL_ATTRIBUTES",
        })
      ),
    ]);

    // Calculate total platform reach from active creators
    const activeCreators = activeResult.Items || [];
    const totalPlatformReach = activeCreators.reduce((sum, creator) => {
      return sum + (creator.metrics?.totalReach || 0);
    }, 0);

    // Count pending inquiries
    const allInquiries = inquiryResult.Items || [];
    const pendingInquiries = allInquiries.filter(
      (inq) => inq.status === "PENDING"
    ).length;

    // Also count featured creators
    let featuredCount = 0;
    try {
      const featuredResult = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "GSI1",
          KeyConditionExpression: "gsi1pk = :pk",
          ExpressionAttributeValues: {
            ":pk": "STATUS#FEATURED",
          },
          Select: "COUNT",
        })
      );
      featuredCount = featuredResult.Count || 0;
    } catch {
      // Non-critical
    }

    return {
      totalCreators: activeCreators.length + featuredCount,
      activeCreators: activeCreators.length + featuredCount,
      pendingCreators: pendingResult.Count || 0,
      totalPlatformReach,
      totalInquiries: allInquiries.length,
      pendingInquiries,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalCreators: 0,
      activeCreators: 0,
      pendingCreators: 0,
      totalPlatformReach: 0,
      totalInquiries: 0,
      pendingInquiries: 0,
    };
  }
}

// ============================================================================
// Sync Engine
// ============================================================================

/**
 * Sync all creator stats - updates totalReach from verified platform data.
 *
 * Logic:
 * 1. Fetch all STATUS#ACTIVE creators
 * 2. For each creator, recalculate totalReach from platform data
 * 3. Update metrics in DynamoDB
 * 4. Uses Promise.all() in batches for efficiency
 */
export async function syncAllCreatorStats(): Promise<SyncResult> {
  try {
    await requireAdmin();

    const tableName = getTableName();
    let synced = 0;
    let errors = 0;

    // Fetch all active creators
    const activeResult = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: "GSI1",
        KeyConditionExpression: "gsi1pk = :pk",
        ExpressionAttributeValues: {
          ":pk": "STATUS#ACTIVE",
        },
      })
    );

    // Also fetch featured creators
    let featuredItems: Record<string, any>[] = [];
    try {
      const featuredResult = await docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "GSI1",
          KeyConditionExpression: "gsi1pk = :pk",
          ExpressionAttributeValues: {
            ":pk": "STATUS#FEATURED",
          },
        })
      );
      featuredItems = featuredResult.Items || [];
    } catch {
      // Non-critical
    }

    const allCreators = [...(activeResult.Items || []), ...featuredItems];

    if (allCreators.length === 0) {
      return { success: true, message: "No creators to sync.", synced: 0 };
    }

    // Process in batches of 10 for efficiency
    const BATCH_SIZE = 10;
    for (let i = 0; i < allCreators.length; i += BATCH_SIZE) {
      const batch = allCreators.slice(i, i + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (creator) => {
          try {
            // Recalculate total reach from subscriber data
            let totalReach = 0;
            const subscribers = creator.metrics?.subscribers || {};

            for (const platform of Object.keys(subscribers)) {
              totalReach += subscribers[platform] || 0;
            }

            // If no subscriber data, keep existing reach
            if (totalReach === 0) {
              totalReach = creator.metrics?.totalReach || 0;
            }

            const now = new Date().toISOString();
            const reachSortKey = `${String(totalReach).padStart(12, "0")}#${creator.slug}`;

            // Update the creator's metrics
            await docClient.send(
              new UpdateCommand({
                TableName: tableName,
                Key: {
                  pk: creator.pk,
                  sk: creator.sk || "METADATA",
                },
                UpdateExpression:
                  "SET metrics.totalReach = :reach, gsi1sk = :gsi1sk, gsi2sk = :gsi2sk, updatedAt = :now",
                ExpressionAttributeValues: {
                  ":reach": totalReach,
                  ":gsi1sk": reachSortKey,
                  ":gsi2sk": reachSortKey,
                  ":now": now,
                },
              })
            );

            return true;
          } catch (err) {
            console.error(`Error syncing creator ${creator.slug}:`, err);
            return false;
          }
        })
      );

      synced += results.filter(Boolean).length;
      errors += results.filter((r) => !r).length;
    }

    // Revalidate relevant paths
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/creators");
    revalidatePath("/creators");
    revalidatePath("/");

    return {
      success: true,
      message: `Sync complete. ${synced} creators updated${errors > 0 ? `, ${errors} errors` : ""}.`,
      synced,
      errors,
    };
  } catch (error: any) {
    console.error("Error in sync engine:", error);

    if (
      error.message?.includes("UNAUTHORIZED") ||
      error.message?.includes("FORBIDDEN")
    ) {
      return {
        success: false,
        message: "You are not authorized to perform this action.",
      };
    }

    return {
      success: false,
      message: "Sync failed. Please try again.",
    };
  }
}

// ============================================================================
// Single Creator Sync
// ============================================================================

/**
 * Sync stats for a single creator by slug.
 * Recalculates totalReach from subscriber data and updates the DB.
 * Used by the "Sync Now" button on the profile page.
 */
export async function syncSingleCreator(slug: string): Promise<SyncResult> {
  try {
    await requireAdmin();

    const tableName = getTableName();

    // Fetch the creator record
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "pk = :pk AND sk = :sk",
        ExpressionAttributeValues: {
          ":pk": `CREATOR#${slug}`,
          ":sk": "METADATA",
        },
      })
    );

    const creator = result.Items?.[0];
    if (!creator) {
      return { success: false, message: `Creator "${slug}" not found.` };
    }

    // Recalculate total reach from subscriber data
    let totalReach = 0;
    const subscribers = creator.metrics?.subscribers || {};

    for (const platform of Object.keys(subscribers)) {
      totalReach += subscribers[platform] || 0;
    }

    // If no subscriber data, keep existing reach
    if (totalReach === 0) {
      totalReach = creator.metrics?.totalReach || 0;
    }

    const now = new Date().toISOString();
    const reachSortKey = `${String(totalReach).padStart(12, "0")}#${slug}`;

    // Update the creator's metrics
    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          pk: `CREATOR#${slug}`,
          sk: "METADATA",
        },
        UpdateExpression:
          "SET metrics.totalReach = :reach, gsi1sk = :gsi1sk, gsi2sk = :gsi2sk, updatedAt = :now",
        ExpressionAttributeValues: {
          ":reach": totalReach,
          ":gsi1sk": reachSortKey,
          ":gsi2sk": reachSortKey,
          ":now": now,
        },
      })
    );

    // Revalidate relevant paths
    revalidatePath(`/creator/${slug}`);
    revalidatePath("/creators");
    revalidatePath("/");

    return {
      success: true,
      message: `Synced "${slug}" successfully. Total reach: ${totalReach.toLocaleString()}.`,
      synced: 1,
    };
  } catch (error: any) {
    console.error(`Error syncing creator ${slug}:`, error);

    if (
      error.message?.includes("UNAUTHORIZED") ||
      error.message?.includes("FORBIDDEN")
    ) {
      return {
        success: false,
        message: "You are not authorized to perform this action.",
      };
    }

    return {
      success: false,
      message: `Failed to sync "${slug}". Please try again.`,
    };
  }
}

// ============================================================================
// Verified Badge Management
// ============================================================================

/**
 * Toggle the verified badge for a creator (Manual Verification Override)
 * Allows admin to manually mark a creator as verified even if API scraping failed.
 */
export async function toggleCreatorVerified(
  slug: string,
  verified: boolean
): Promise<ToggleVerifiedResult> {
  try {
    await requireAdmin();

    const tableName = getTableName();
    const now = new Date().toISOString();

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          pk: `CREATOR#${slug}`,
          sk: "METADATA",
        },
        UpdateExpression: "SET verified = :verified, updatedAt = :now",
        ExpressionAttributeValues: {
          ":verified": verified,
          ":now": now,
        },
        ConditionExpression: "attribute_exists(pk)",
      })
    );

    revalidatePath("/admin/creators");
    revalidatePath(`/creator/${slug}`);
    revalidatePath("/creators");

    return {
      success: true,
      message: `Creator "${slug}" is now ${verified ? "verified" : "unverified"}.`,
    };
  } catch (error: any) {
    console.error("Error toggling verified status:", error);

    if (error.name === "ConditionalCheckFailedException") {
      return { success: false, message: "Creator not found." };
    }

    if (
      error.message?.includes("UNAUTHORIZED") ||
      error.message?.includes("FORBIDDEN")
    ) {
      return {
        success: false,
        message: "You are not authorized to perform this action.",
      };
    }

    return {
      success: false,
      message: "Failed to update verification status.",
    };
  }
}

// ============================================================================
// Admin Creator Listing
// ============================================================================

/**
 * Get all creators for admin management (includes all statuses)
 */
export async function getAllCreatorsForAdmin(): Promise<Creator[]> {
  await requireAdmin();

  const tableName = getTableName();

  try {
    // Get active + featured creators
    const [activeResult, featuredResult] = await Promise.all([
      docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "GSI1",
          KeyConditionExpression: "gsi1pk = :pk",
          ExpressionAttributeValues: {
            ":pk": "STATUS#ACTIVE",
          },
          ScanIndexForward: false,
        })
      ),
      docClient.send(
        new QueryCommand({
          TableName: tableName,
          IndexName: "GSI1",
          KeyConditionExpression: "gsi1pk = :pk",
          ExpressionAttributeValues: {
            ":pk": "STATUS#FEATURED",
          },
          ScanIndexForward: false,
        })
      ),
    ]);

    const allItems = [
      ...(activeResult.Items || []),
      ...(featuredResult.Items || []),
    ];

    return allItems.map((item) => ({
      slug: item.slug,
      name: item.name,
      bio: item.bio,
      profilePicUrl: item.profilePicUrl,
      bannerUrl: item.bannerUrl,
      coverImageUrl: item.coverImageUrl,
      niche: item.niche,
      tags: item.tags,
      location: item.location,
      status: item.status,
      verified: item.verified || false,
      platforms: item.platforms || {},
      metrics: item.metrics || { totalReach: 0 },
      referralStats: item.referralStats || { currentWeek: 0, allTime: 0 },
      topVideo: item.topVideo,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      joinedDate: item.joinedDate,
      contactEmail: item.contactEmail,
      bookingUrl: item.bookingUrl,
    }));
  } catch (error) {
    console.error("Error fetching creators for admin:", error);
    return [];
  }
}
