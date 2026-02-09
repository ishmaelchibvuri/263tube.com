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
import { mapYouTubeTopicsToNiche } from "@/lib/utils/youtube-topic-map";
import { ensureCategoryExists, revalidateCategories } from "@/lib/actions/categories";

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
// YouTube Topic Detection & Category Auto-Update
// ============================================================================

/**
 * Fetch YouTube topic details for a channel.
 * Uses the YouTube Data API v3 with part=topicDetails.
 */
async function fetchYouTubeTopicDetails(
  channelId: string
): Promise<string[] | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  try {
    const url = `https://www.googleapis.com/youtube/v3/channels?part=topicDetails&id=${encodeURIComponent(channelId)}&key=${apiKey}`;
    const response = await fetch(url, { next: { revalidate: 86400 } });

    if (!response.ok) return null;

    const data = await response.json();
    const channel = data.items?.[0];
    if (!channel?.topicDetails?.topicCategories) return null;

    return channel.topicDetails.topicCategories as string[];
  } catch (error) {
    console.error(`Error fetching YouTube topics for ${channelId}:`, error);
    return null;
  }
}

/**
 * Extract YouTube channel ID from a creator's platform data.
 * Looks for YouTube URLs in the platforms object and verifiedLinks.
 */
function extractYouTubeChannelId(
  creator: Record<string, any>
): string | null {
  // Check platforms.youtube for channel URLs
  const youtubeLinks = creator.platforms?.youtube;
  if (Array.isArray(youtubeLinks)) {
    for (const link of youtubeLinks) {
      const url = typeof link === "string" ? link : link?.url;
      if (!url) continue;
      // Extract channel ID from URL patterns
      const channelMatch = url.match(
        /youtube\.com\/channel\/(UC[\w-]+)/
      );
      if (channelMatch) return channelMatch[1];
    }
  }

  // Check verifiedLinks
  if (Array.isArray(creator.verifiedLinks)) {
    for (const link of creator.verifiedLinks) {
      if (link.platform?.toLowerCase() === "youtube" && link.channelId) {
        return link.channelId;
      }
    }
  }

  return null;
}

/**
 * Extract YouTube @handle from a creator's platform URLs.
 */
function extractYouTubeHandle(creator: Record<string, any>): string | null {
  const youtubeLinks = creator.platforms?.youtube;
  if (Array.isArray(youtubeLinks)) {
    for (const link of youtubeLinks) {
      const url = typeof link === "string" ? link : link?.url;
      if (!url) continue;
      const handleMatch = url.match(/youtube\.com\/@([^/?]+)/);
      if (handleMatch) return handleMatch[1];
    }
  }
  return null;
}

/**
 * Get the YouTube display name from verifiedLinks (for search fallback).
 */
function getYouTubeDisplayName(creator: Record<string, any>): string | null {
  if (!Array.isArray(creator.verifiedLinks)) return null;
  for (const link of creator.verifiedLinks) {
    if (link.platform?.toLowerCase() === "youtube" && link.displayName) {
      return link.displayName;
    }
  }
  return null;
}

// ============================================================================
// YouTube Data Sync
// ============================================================================

interface VideoHighlightData {
  videoId: string;
  title: string;
  thumbnail: string | null;
  views: number;
  likes: number;
  publishedAt: string;
}

interface YouTubeSyncData {
  channelId: string;
  totalViews: number;
  channelStartDate: string;
  totalVideos: number;
  subscribers: number;
  videoHighlights: VideoHighlightData[];
}

/**
 * Fetch YouTube channel data + video highlights for a creator.
 * Resolves channel via ID, handle, or displayName (search fallback).
 * Returns null if no YouTube data can be resolved.
 */
async function fetchYouTubeSyncData(
  creator: Record<string, any>
): Promise<YouTubeSyncData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  let channelId = extractYouTubeChannelId(creator);
  let channelData: any = null;

  const ytFetch = async (url: string) => {
    try {
      const res = await fetch(url);
      return res.ok ? await res.json() : null;
    } catch {
      return null;
    }
  };

  // 1. Direct channel ID lookup
  if (channelId) {
    channelData = await ytFetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`
    );
  }

  // 2. Handle lookup
  if (!channelData?.items?.length) {
    const handle = extractYouTubeHandle(creator);
    if (handle) {
      channelData = await ytFetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${handle}&key=${apiKey}`
      );
    }
  }

  // 3. Display name search fallback
  if (!channelData?.items?.length) {
    const displayName = getYouTubeDisplayName(creator);
    if (displayName) {
      const safeName = encodeURIComponent(displayName);
      // Try forHandle first (cheap)
      channelData = await ytFetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${safeName}&key=${apiKey}`
      );
      // Fall back to search (more expensive)
      if (!channelData?.items?.length) {
        const searchData = await ytFetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${safeName}&type=channel&maxResults=1&key=${apiKey}`
        );
        if (searchData?.items?.[0]?.id?.channelId) {
          channelData = await ytFetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${searchData.items[0].id.channelId}&key=${apiKey}`
          );
        }
      }
    }
  }

  if (!channelData?.items?.[0]) return null;

  const channel = channelData.items[0];
  const resolvedChannelId: string = channel.id;

  // Fetch video highlights
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  let videoHighlights: VideoHighlightData[] = [];

  if (uploadsPlaylistId) {
    const plData = await ytFetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=10&key=${apiKey}`
    );
    const videoIds: string[] = (plData?.items || []).map(
      (item: any) => item.contentDetails.videoId
    );
    if (videoIds.length > 0) {
      const vData = await ytFetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(",")}&key=${apiKey}`
      );
      const mapped: VideoHighlightData[] = (vData?.items || []).map((v: any) => ({
        videoId: v.id,
        title: v.snippet.title || "",
        thumbnail: v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || null,
        views: parseInt(v.statistics.viewCount) || 0,
        likes: parseInt(v.statistics.likeCount) || 0,
        publishedAt: v.snippet.publishedAt,
      }));

      if (mapped.length > 0) {
        const mostViewed = [...mapped].sort((a, b) => b.views - a.views)[0];
        if (mostViewed) videoHighlights.push(mostViewed);
        const mostLiked = [...mapped].sort((a, b) => b.likes - a.likes)[0];
        if (mostLiked && mostLiked.videoId !== mostViewed?.videoId) videoHighlights.push(mostLiked);
        const latest = [...mapped].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())[0];
        if (latest && !videoHighlights.some((v) => v.videoId === latest.videoId)) videoHighlights.push(latest);
        const oldest = [...mapped].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())[0];
        if (oldest && !videoHighlights.some((v) => v.videoId === oldest.videoId)) videoHighlights.push(oldest);
      }
    }
  }

  return {
    channelId: resolvedChannelId,
    totalViews: parseInt(channel.statistics?.viewCount) || 0,
    channelStartDate: channel.snippet?.publishedAt || "",
    totalVideos: parseInt(channel.statistics?.videoCount) || 0,
    subscribers: parseInt(channel.statistics?.subscriberCount) || 0,
    videoHighlights,
  };
}

/**
 * Detect a creator's YouTube category and update their niche if changed.
 * Non-blocking: errors are caught and logged but don't break the sync.
 */
async function detectAndUpdateCategory(
  creator: Record<string, any>,
  tableName: string
): Promise<void> {
  const channelId = extractYouTubeChannelId(creator);
  if (!channelId) return;

  const topicUrls = await fetchYouTubeTopicDetails(channelId);
  if (!topicUrls || topicUrls.length === 0) return;

  const detectedNiche = mapYouTubeTopicsToNiche(topicUrls);
  if (!detectedNiche) return;

  // Only update if niche has changed
  const currentNiche = creator.niche?.toLowerCase();
  if (currentNiche === detectedNiche) return;

  const now = new Date().toISOString();
  const totalReach = creator.metrics?.totalReach || 0;
  const reachSortKey = `${String(totalReach).padStart(12, "0")}#${creator.slug}`;

  // Update creator's niche and GSI2 partition key
  await docClient.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        pk: creator.pk || `CREATOR#${creator.slug}`,
        sk: creator.sk || "METADATA",
      },
      UpdateExpression:
        "SET niche = :niche, gsi2pk = :gsi2pk, gsi2sk = :gsi2sk, updatedAt = :now",
      ExpressionAttributeValues: {
        ":niche": detectedNiche,
        ":gsi2pk": `CATEGORY#${detectedNiche}`,
        ":gsi2sk": reachSortKey,
        ":now": now,
      },
    })
  );

  // Ensure the category exists in the categories table
  await ensureCategoryExists(detectedNiche);
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

    // Process in batches of 5 (smaller batch for YouTube API rate limits)
    const BATCH_SIZE = 5;
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

            // Fetch YouTube data
            let ytData: YouTubeSyncData | null = null;
            try {
              ytData = await fetchYouTubeSyncData(creator);
              if (ytData && ytData.subscribers > 0) {
                totalReach = ytData.subscribers;
              }
            } catch (err) {
              console.error(`YouTube fetch failed for ${creator.slug}:`, err);
            }

            const reachSortKey = `${String(totalReach).padStart(12, "0")}#${creator.slug}`;

            // Build merged metrics object to avoid nested-path errors when
            // the "metrics" map doesn't yet exist on the item.
            const updatedMetrics: Record<string, any> = {
              ...(creator.metrics || {}),
              totalReach,
            };

            if (ytData) {
              updatedMetrics.totalViews = ytData.totalViews;
              updatedMetrics.channelStartDate = ytData.channelStartDate;
              if (ytData.totalVideos > 0) {
                updatedMetrics.totalVideos = ytData.totalVideos;
              }
            }

            const exprParts = [
              "metrics = :metrics",
              "gsi1sk = :gsi1sk",
              "gsi2sk = :gsi2sk",
              "updatedAt = :now",
            ];
            const exprValues: Record<string, any> = {
              ":metrics": updatedMetrics,
              ":gsi1sk": reachSortKey,
              ":gsi2sk": reachSortKey,
              ":now": now,
            };

            if (ytData && ytData.videoHighlights.length > 0) {
              exprParts.push("videoHighlights = :videoHighlights");
              exprValues[":videoHighlights"] = ytData.videoHighlights;
            }

            await docClient.send(
              new UpdateCommand({
                TableName: tableName,
                Key: {
                  pk: creator.pk,
                  sk: creator.sk || "METADATA",
                },
                UpdateExpression: `SET ${exprParts.join(", ")}`,
                ExpressionAttributeValues: exprValues,
              })
            );

            // Detect and update category from YouTube topics (non-blocking)
            try {
              await detectAndUpdateCategory(creator, tableName);
            } catch (err) {
              console.error(`Category detection failed for ${creator.slug}:`, err);
            }

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
    revalidatePath("/categories");
    revalidatePath("/");

    // Revalidate category caches (creator counts may have changed)
    await revalidateCategories();

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

    // Fetch YouTube data (totalViews, channelStartDate, videoHighlights)
    let ytData: YouTubeSyncData | null = null;
    try {
      ytData = await fetchYouTubeSyncData(creator);
      // If YouTube returned subscriber data, update totalReach
      if (ytData && ytData.subscribers > 0) {
        totalReach = ytData.subscribers;
      }
    } catch (err) {
      console.error(`YouTube data fetch failed for ${slug}:`, err);
    }

    const reachSortKey = `${String(totalReach).padStart(12, "0")}#${slug}`;

    // Build merged metrics object to avoid nested-path errors when
    // the "metrics" map doesn't yet exist on the item.
    const updatedMetrics: Record<string, any> = {
      ...(creator.metrics || {}),
      totalReach,
    };

    if (ytData) {
      updatedMetrics.totalViews = ytData.totalViews;
      updatedMetrics.channelStartDate = ytData.channelStartDate;
      if (ytData.totalVideos > 0) {
        updatedMetrics.totalVideos = ytData.totalVideos;
      }
    }

    const exprParts = [
      "metrics = :metrics",
      "gsi1sk = :gsi1sk",
      "gsi2sk = :gsi2sk",
      "updatedAt = :now",
    ];
    const exprValues: Record<string, any> = {
      ":metrics": updatedMetrics,
      ":gsi1sk": reachSortKey,
      ":gsi2sk": reachSortKey,
      ":now": now,
    };

    if (ytData && ytData.videoHighlights.length > 0) {
      exprParts.push("videoHighlights = :videoHighlights");
      exprValues[":videoHighlights"] = ytData.videoHighlights;
    }

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          pk: `CREATOR#${slug}`,
          sk: "METADATA",
        },
        UpdateExpression: `SET ${exprParts.join(", ")}`,
        ExpressionAttributeValues: exprValues,
      })
    );

    // Detect and update category from YouTube topics (non-blocking)
    try {
      await detectAndUpdateCategory(creator, tableName);
    } catch (err) {
      console.error(`Category detection failed for ${slug}:`, err);
    }

    // Revalidate relevant paths
    revalidatePath(`/creator/${slug}`);
    revalidatePath("/creators");
    revalidatePath("/");

    return {
      success: true,
      message: `Synced "${slug}" successfully. Total reach: ${totalReach.toLocaleString()}.${ytData ? ` YouTube: ${ytData.totalViews.toLocaleString()} views, ${ytData.videoHighlights.length} highlights.` : ""}`,
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

    const detail = error?.message || error?.name || String(error);
    return {
      success: false,
      message: `Failed to sync "${slug}": ${detail}`,
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

export async function toggleCreatorActive(
  slug: string,
  active: boolean
): Promise<ToggleVerifiedResult> {
  try {
    await requireAdmin();

    const tableName = getTableName();
    const now = new Date().toISOString();
    const newStatus = active ? "ACTIVE" : "INACTIVE";

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          pk: `CREATOR#${slug}`,
          sk: "METADATA",
        },
        UpdateExpression:
          "SET #status = :status, gsi1pk = :gsi1pk, updatedAt = :now",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": newStatus,
          ":gsi1pk": `STATUS#${newStatus}`,
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
      message: `Creator "${slug}" is now ${active ? "active" : "inactive"}.`,
    };
  } catch (error: any) {
    console.error("Error toggling active status:", error);

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
      message: "Failed to update active status.",
    };
  }
}

export async function toggleCreatorFeatured(
  slug: string,
  featured: boolean
): Promise<ToggleVerifiedResult> {
  try {
    await requireAdmin();

    const tableName = getTableName();
    const now = new Date().toISOString();
    const newStatus = featured ? "FEATURED" : "ACTIVE";

    await docClient.send(
      new UpdateCommand({
        TableName: tableName,
        Key: {
          pk: `CREATOR#${slug}`,
          sk: "METADATA",
        },
        UpdateExpression:
          "SET #status = :status, gsi1pk = :gsi1pk, updatedAt = :now",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": newStatus,
          ":gsi1pk": `STATUS#${newStatus}`,
          ":now": now,
        },
        ConditionExpression: "attribute_exists(pk)",
      })
    );

    revalidatePath("/admin/creators");
    revalidatePath(`/creator/${slug}`);
    revalidatePath("/creators");
    revalidatePath("/");

    return {
      success: true,
      message: `Creator "${slug}" is now ${featured ? "featured" : "unfeatured"}.`,
    };
  } catch (error: any) {
    console.error("Error toggling featured status:", error);

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
      message: "Failed to update featured status.",
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
    // Helper to paginate through all DynamoDB query results
    async function queryAll(statusKey: string) {
      const items: Record<string, unknown>[] = [];
      let exclusiveStartKey: Record<string, unknown> | undefined;

      do {
        const result = await docClient.send(
          new QueryCommand({
            TableName: tableName,
            IndexName: "GSI1",
            KeyConditionExpression: "gsi1pk = :pk",
            ExpressionAttributeValues: {
              ":pk": statusKey,
            },
            ScanIndexForward: false,
            ...(exclusiveStartKey ? { ExclusiveStartKey: exclusiveStartKey } : {}),
          })
        );

        if (result.Items) {
          items.push(...result.Items);
        }
        exclusiveStartKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
      } while (exclusiveStartKey);

      return items;
    }

    // Get active + featured + inactive creators (paginated)
    const [activeItems, featuredItems, inactiveItems] = await Promise.all([
      queryAll("STATUS#ACTIVE"),
      queryAll("STATUS#FEATURED"),
      queryAll("STATUS#INACTIVE"),
    ]);

    const allItems = [...activeItems, ...featuredItems, ...inactiveItems];

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
      videoHighlights: item.videoHighlights,
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
