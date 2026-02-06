/**
 * 263Tube - Creator Data Access Layer
 *
 * DynamoDB Single Table Design for Creators
 *
 * Table: 263tube-{environment}
 *
 * Access Patterns:
 * 1. Get single creator by slug: PK = CREATOR#{slug}, SK = METADATA
 * 2. Get all active creators: GSI1PK = STATUS#ACTIVE
 * 3. Get creators by category: GSI2PK = CATEGORY#{niche}
 * 4. Get featured creators: GSI1PK = STATUS#FEATURED
 */

import {
  DynamoDBClient,
  DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  BatchWriteCommand,
} from "@aws-sdk/lib-dynamodb";

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface SocialLink {
  label: string;
  url: string;
  handle?: string;
}

export interface CreatorPlatforms {
  youtube?: SocialLink[];
  instagram?: SocialLink[];
  twitter?: SocialLink[];
  facebook?: SocialLink[];
  tiktok?: SocialLink[];
  linkedin?: SocialLink[];
  website?: SocialLink[];
}

export interface CreatorMetrics {
  totalReach: number;
  monthlyViews?: number;
  rollingMonthlyViews?: number;
  engagement?: number;
  engagementRate?: string;
  totalVideos?: number;
  videoCount?: number;
  postCount?: number;
  subscribers?: {
    youtube?: number;
    instagram?: number;
    tiktok?: number;
    twitter?: number;
  };
}

export interface ReferralStats {
  currentWeek: number;
  allTime: number;
  lastReferralAt?: string;
}

export interface VerifiedLink {
  platform: string;
  displayName: string | null;
  image: string | null;
  followers: number | null;
  verifiedAt: string;
}

export interface Creator {
  // Primary identifiers
  slug: string;
  name: string;

  // Profile information
  bio: string;
  profilePicUrl?: string;
  primaryProfileImage?: string | null;
  bannerUrl?: string;
  coverImageUrl?: string;

  // Categorization
  niche: string;
  tags?: string[];
  location?: string;

  // Status
  status: "ACTIVE" | "PENDING" | "FEATURED" | "INACTIVE";
  verified: boolean;

  // Ownership — userId of the account that claimed this profile
  claimedBy?: string | null;

  // Social platforms
  platforms: CreatorPlatforms;

  // Metrics
  metrics: CreatorMetrics;

  // Referral stats for gamification
  referralStats?: ReferralStats;

  // Verified links from platform verification
  verifiedLinks?: VerifiedLink[];

  // Featured content
  topVideo?: {
    title: string;
    thumbnail?: string;
    views: number;
    embedUrl: string;
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;
  joinedDate?: string;

  // Contact
  contactEmail?: string;
  bookingUrl?: string;
}

export interface CreatorDynamoDBItem extends Creator {
  pk: string;           // CREATOR#{slug}
  sk: string;           // METADATA
  gsi1pk?: string;      // STATUS#{status}
  gsi1sk?: string;      // {totalReach}#{slug} (for sorting by reach)
  gsi2pk?: string;      // CATEGORY#{niche}
  gsi2sk?: string;      // {totalReach}#{slug} (for sorting by reach)
  gsi3pk?: string;      // REFERRAL#WEEKLY (for weekly leaderboard)
  gsi3sk?: string;      // {referralCount}#{slug} (for sorting by referrals)
  entityType: string;   // CREATOR
}

// ============================================================================
// DynamoDB Client Configuration
// ============================================================================

const getTableName = (): string => {
  const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.ENVIRONMENT || "dev";
  return process.env.DYNAMODB_TABLE_NAME || `263tube-${env}`;
};

const getClientConfig = (): DynamoDBClientConfig => {
  const config: DynamoDBClientConfig = {
    region: process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION || "af-south-1",
  };

  // For local development, you can use DynamoDB Local
  if (process.env.DYNAMODB_ENDPOINT) {
    config.endpoint = process.env.DYNAMODB_ENDPOINT;
  }

  return config;
};

// Create the DynamoDB client
const dynamoClient = new DynamoDBClient(getClientConfig());

// Create the Document Client with marshalling options
export const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// ============================================================================
// Data Access Functions
// ============================================================================

/**
 * Get all active creators
 * Uses GSI1 to query by status
 */
export async function getAllCreators(
  status: "ACTIVE" | "FEATURED" = "ACTIVE",
  limit?: number
): Promise<Creator[]> {
  const tableName = getTableName();

  try {
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: "GSI1",
      KeyConditionExpression: "gsi1pk = :pk",
      ExpressionAttributeValues: {
        ":pk": `STATUS#${status}`,
      },
      ScanIndexForward: false, // Sort by reach descending
      Limit: limit,
    });

    const response = await docClient.send(command);

    if (!response.Items) {
      return [];
    }

    // Map DynamoDB items to Creator objects
    return response.Items.map(mapDynamoItemToCreator);
  } catch (error) {
    console.error("Error fetching creators:", error);
    throw new Error("Failed to fetch creators");
  }
}

/**
 * Get a single creator by slug
 * Uses primary key access pattern
 */
export async function getCreatorBySlug(slug: string): Promise<Creator | null> {
  const tableName = getTableName();

  try {
    const command = new GetCommand({
      TableName: tableName,
      Key: {
        pk: `CREATOR#${slug}`,
        sk: "METADATA",
      },
    });

    const response = await docClient.send(command);

    if (!response.Item) {
      return null;
    }

    return mapDynamoItemToCreator(response.Item as CreatorDynamoDBItem);
  } catch (error) {
    console.error("Error fetching creator by slug:", error);
    throw new Error(`Failed to fetch creator: ${slug}`);
  }
}

/**
 * Get creators by category/niche
 * Uses GSI2 for category-based queries
 *
 * IMPORTANT: Uses exact case-sensitive matching with taxonomy values.
 * The category parameter should match exactly the niche value from
 * src/constants/niches.ts (e.g., "comedy", "music", "technology").
 */
export async function getCreatorsByCategory(
  category: string,
  limit?: number
): Promise<Creator[]> {
  const tableName = getTableName();

  try {
    // Use exact category value for case-sensitive matching
    // Category values should match taxonomy values exactly (lowercase)
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: "GSI2",
      KeyConditionExpression: "gsi2pk = :pk",
      ExpressionAttributeValues: {
        ":pk": `CATEGORY#${category}`,
      },
      ScanIndexForward: false, // Sort by reach descending
      Limit: limit,
    });

    const response = await docClient.send(command);

    if (!response.Items) {
      return [];
    }

    return response.Items.map(mapDynamoItemToCreator);
  } catch (error) {
    console.error("Error fetching creators by category:", error);
    throw new Error(`Failed to fetch creators for category: ${category}`);
  }
}

/**
 * Get featured creators (for homepage spotlight)
 */
export async function getFeaturedCreators(limit: number = 8): Promise<Creator[]> {
  return getAllCreators("FEATURED", limit);
}

/**
 * Search creators by name (basic implementation)
 * For production, consider using OpenSearch/Elasticsearch
 */
export async function searchCreators(
  query: string,
  limit: number = 20
): Promise<Creator[]> {
  // For now, get all active creators and filter client-side
  // In production, use a proper search index
  const allCreators = await getAllCreators("ACTIVE", 100);

  const normalizedQuery = query.toLowerCase();

  return allCreators
    .filter(
      (creator) =>
        creator.name.toLowerCase().includes(normalizedQuery) ||
        creator.niche.toLowerCase().includes(normalizedQuery) ||
        creator.tags?.some((tag) => tag.toLowerCase().includes(normalizedQuery))
    )
    .slice(0, limit);
}

/**
 * Create a new creator
 */
export async function createCreator(creator: Creator): Promise<Creator> {
  const tableName = getTableName();
  const now = new Date().toISOString();

  // Create sort key for GSI sorting (padded reach + slug)
  const reachSortKey = `${String(creator.metrics.totalReach).padStart(12, "0")}#${creator.slug}`;

  // Use exact niche value for GSI2 (should match taxonomy values from src/constants/niches.ts)
  const item: CreatorDynamoDBItem = {
    ...creator,
    pk: `CREATOR#${creator.slug}`,
    sk: "METADATA",
    gsi1pk: `STATUS#${creator.status}`,
    gsi1sk: reachSortKey,
    gsi2pk: `CATEGORY#${creator.niche}`,
    gsi2sk: reachSortKey,
    entityType: "CREATOR",
    createdAt: creator.createdAt || now,
    updatedAt: now,
  };

  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: "attribute_not_exists(pk)",
    });

    await docClient.send(command);
    return creator;
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      throw new Error(`Creator with slug "${creator.slug}" already exists`);
    }
    console.error("Error creating creator:", error);
    throw new Error("Failed to create creator");
  }
}

/**
 * Update an existing creator
 */
export async function updateCreator(
  slug: string,
  updates: Partial<Creator>
): Promise<Creator | null> {
  const tableName = getTableName();
  const now = new Date().toISOString();

  // First, get the existing creator
  const existing = await getCreatorBySlug(slug);
  if (!existing) {
    return null;
  }

  // Merge updates
  const updated: Creator = {
    ...existing,
    ...updates,
    updatedAt: now,
  };

  // Recalculate sort keys if metrics changed
  const reachSortKey = `${String(updated.metrics.totalReach).padStart(12, "0")}#${slug}`;

  // Use exact niche value for GSI2 (should match taxonomy values from src/constants/niches.ts)
  const item: CreatorDynamoDBItem = {
    ...updated,
    pk: `CREATOR#${slug}`,
    sk: "METADATA",
    gsi1pk: `STATUS#${updated.status}`,
    gsi1sk: reachSortKey,
    gsi2pk: `CATEGORY#${updated.niche}`,
    gsi2sk: reachSortKey,
    entityType: "CREATOR",
  };

  try {
    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    });

    await docClient.send(command);
    return updated;
  } catch (error) {
    console.error("Error updating creator:", error);
    throw new Error(`Failed to update creator: ${slug}`);
  }
}

/**
 * Delete a creator
 */
export async function deleteCreator(slug: string): Promise<boolean> {
  const tableName = getTableName();

  try {
    const command = new DeleteCommand({
      TableName: tableName,
      Key: {
        pk: `CREATOR#${slug}`,
        sk: "METADATA",
      },
    });

    await docClient.send(command);
    return true;
  } catch (error) {
    console.error("Error deleting creator:", error);
    throw new Error(`Failed to delete creator: ${slug}`);
  }
}

/**
 * Batch create creators (for seeding)
 */
export async function batchCreateCreators(creators: Creator[]): Promise<void> {
  const tableName = getTableName();
  const now = new Date().toISOString();

  // DynamoDB BatchWrite supports max 25 items per request
  const batches = chunkArray(creators, 25);

  for (const batch of batches) {
    const putRequests = batch.map((creator) => {
      const reachSortKey = `${String(creator.metrics.totalReach).padStart(12, "0")}#${creator.slug}`;

      // Use exact niche value for GSI2 (should match taxonomy values)
      const item: CreatorDynamoDBItem = {
        ...creator,
        pk: `CREATOR#${creator.slug}`,
        sk: "METADATA",
        gsi1pk: `STATUS#${creator.status}`,
        gsi1sk: reachSortKey,
        gsi2pk: `CATEGORY#${creator.niche}`,
        gsi2sk: reachSortKey,
        entityType: "CREATOR",
        createdAt: creator.createdAt || now,
        updatedAt: now,
      };

      return {
        PutRequest: {
          Item: item,
        },
      };
    });

    const command = new BatchWriteCommand({
      RequestItems: {
        [tableName]: putRequests,
      },
    });

    await docClient.send(command);
  }
}

// ============================================================================
// Referral Tracking Functions
// ============================================================================

/**
 * Track a referral for a creator using atomic counter
 * This prevents race conditions when multiple referrals come in simultaneously
 */
export async function trackReferral(slug: string): Promise<ReferralStats | null> {
  const tableName = getTableName();
  const now = new Date().toISOString();

  try {
    // Use atomic increment to update referral counts
    const command = new UpdateCommand({
      TableName: tableName,
      Key: {
        pk: `CREATOR#${slug}`,
        sk: "METADATA",
      },
      UpdateExpression: `
        SET referralStats.currentWeek = if_not_exists(referralStats.currentWeek, :zero) + :inc,
            referralStats.allTime = if_not_exists(referralStats.allTime, :zero) + :inc,
            referralStats.lastReferralAt = :now,
            updatedAt = :now
      `,
      ExpressionAttributeValues: {
        ":inc": 1,
        ":zero": 0,
        ":now": now,
      },
      ReturnValues: "ALL_NEW",
      ConditionExpression: "attribute_exists(pk)",
    });

    const response = await docClient.send(command);

    if (!response.Attributes) {
      return null;
    }

    const updatedStats = response.Attributes.referralStats as ReferralStats;

    // Update the GSI3 sort key to reflect new referral count
    // This enables proper sorting in the leaderboard
    await updateReferralLeaderboardIndex(slug, updatedStats.currentWeek);

    return updatedStats;
  } catch (error: any) {
    if (error.name === "ConditionalCheckFailedException") {
      console.warn(`Creator not found: ${slug}`);
      return null;
    }
    console.error("Error tracking referral:", error);
    throw new Error(`Failed to track referral for: ${slug}`);
  }
}

/**
 * Update the GSI3 sort key for the referral leaderboard
 * This ensures the creator appears in the correct position when sorted
 */
async function updateReferralLeaderboardIndex(
  slug: string,
  currentWeekCount: number
): Promise<void> {
  const tableName = getTableName();

  // Pad the count for proper string sorting (descending)
  // We use 999999999 - count to sort descending (higher counts first)
  const sortValue = 999999999 - currentWeekCount;
  const gsi3sk = `${String(sortValue).padStart(9, "0")}#${slug}`;

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
    console.error("Error updating referral leaderboard index:", error);
    // Non-critical, don't throw
  }
}

/**
 * Get top referrers for the current week (Trending This Week)
 * Uses GSI_REFERRALS (GSI3) for efficient sorted access
 */
export async function getTopReferrers(limit: number = 3): Promise<Creator[]> {
  const tableName = getTableName();

  try {
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: "GSI_REFERRALS",
      KeyConditionExpression: "gsi3pk = :pk",
      ExpressionAttributeValues: {
        ":pk": "REFERRAL#WEEKLY",
      },
      ScanIndexForward: true, // Ascending because we inverted the sort key
      Limit: limit,
    });

    const response = await docClient.send(command);

    if (!response.Items || response.Items.length === 0) {
      // Fallback to featured creators if no referral data
      return getFeaturedCreators(limit);
    }

    return response.Items.map(mapDynamoItemToCreator);
  } catch (error) {
    console.error("Error fetching top referrers:", error);
    // Fallback to featured creators
    return getFeaturedCreators(limit);
  }
}

/**
 * Reset weekly referral counts (should be called by a scheduled job)
 * Archives the weekly count and resets currentWeek to 0
 */
export async function resetWeeklyReferrals(): Promise<number> {
  const tableName = getTableName();
  let resetCount = 0;

  try {
    // Get all creators with referral data
    const command = new QueryCommand({
      TableName: tableName,
      IndexName: "GSI_REFERRALS",
      KeyConditionExpression: "gsi3pk = :pk",
      ExpressionAttributeValues: {
        ":pk": "REFERRAL#WEEKLY",
      },
    });

    const response = await docClient.send(command);

    if (!response.Items) {
      return 0;
    }

    // Reset each creator's weekly count
    for (const item of response.Items) {
      const updateCommand = new UpdateCommand({
        TableName: tableName,
        Key: {
          pk: item.pk,
          sk: item.sk,
        },
        UpdateExpression: `
          SET referralStats.currentWeek = :zero,
              gsi3sk = :newSk,
              updatedAt = :now
        `,
        ExpressionAttributeValues: {
          ":zero": 0,
          ":newSk": `${String(999999999).padStart(9, "0")}#${item.slug}`,
          ":now": new Date().toISOString(),
        },
      });

      await docClient.send(updateCommand);
      resetCount++;
    }

    console.log(`Reset weekly referrals for ${resetCount} creators`);
    return resetCount;
  } catch (error) {
    console.error("Error resetting weekly referrals:", error);
    throw new Error("Failed to reset weekly referrals");
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Map DynamoDB item to Creator object
 */
function mapDynamoItemToCreator(item: Record<string, any>): Creator {
  return {
    slug: item.slug,
    name: item.name,
    bio: item.bio,
    profilePicUrl: item.profilePicUrl,
    primaryProfileImage: item.primaryProfileImage || null,
    bannerUrl: item.bannerUrl,
    coverImageUrl: item.coverImageUrl,
    niche: item.niche,
    tags: item.tags,
    location: item.location,
    status: item.status,
    verified: item.verified || false,
    claimedBy: item.claimedBy || null,
    platforms: item.platforms || {},
    metrics: item.metrics || { totalReach: 0 },
    referralStats: item.referralStats || { currentWeek: 0, allTime: 0 },
    verifiedLinks: item.verifiedLinks || [],
    topVideo: item.topVideo,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    joinedDate: item.joinedDate,
    contactEmail: item.contactEmail,
    bookingUrl: item.bookingUrl,
  };
}

/**
 * Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  getAllCreators,
  getCreatorBySlug,
  getCreatorsByCategory,
  getFeaturedCreators,
  searchCreators,
  createCreator,
  updateCreator,
  deleteCreator,
  batchCreateCreators,
  // Referral tracking
  trackReferral,
  getTopReferrers,
  resetWeeklyReferrals,
};
