"use server";

/**
 * 263Tube - Category Server Actions
 *
 * Database-driven category system. Categories are stored in DynamoDB
 * with pk: "CATEGORIES", sk: "NICHE#{value}".
 *
 * Functions:
 * - getAllCategories() - Get all categories (cached)
 * - getCategoryByValue() - Single item lookup
 * - upsertCategory() - Insert or update a category
 * - getCategoryStats() - Categories with real creator counts (cached)
 * - seedCategories() - Populate from static taxonomy
 * - revalidateCategories() - Bust category caches
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { unstable_cache, revalidateTag } from "next/cache";
import { NICHES } from "@/constants/niches";
import { nicheValueToLabel, nicheValueToSlug } from "@/lib/utils/youtube-topic-map";
import {
  CATEGORY_ICONS,
  type CategoryItem,
  type CategoryWithStats,
} from "@/lib/categories-shared";

// Re-export types so server-only consumers can import from here
export type { CategoryItem, CategoryWithStats } from "@/lib/categories-shared";

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
// Core Functions
// ============================================================================

/**
 * Fetch all categories from DynamoDB.
 * Internal function (not cached) used by the cached wrapper.
 */
async function fetchAllCategoriesFromDB(): Promise<CategoryItem[]> {
  const tableName = getTableName();

  try {
    const result = await docClient.send(
      new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :skPrefix)",
        ExpressionAttributeValues: {
          ":pk": "CATEGORIES",
          ":skPrefix": "NICHE#",
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items.map((item) => ({
      label: item.label,
      value: item.value,
      slug: item.slug,
      description: item.description,
      icon: item.icon,
      source: item.source || "seed",
    }));
  } catch (error) {
    console.error("Error fetching categories from DynamoDB:", error);
    return [];
  }
}

/**
 * Get all categories - cached with revalidation tag.
 * Falls back to static NICHES constant if DB is empty.
 */
export const getAllCategories = unstable_cache(
  async (): Promise<CategoryItem[]> => {
    const dbCategories = await fetchAllCategoriesFromDB();

    if (dbCategories.length > 0) {
      return dbCategories;
    }

    // Fallback to static NICHES
    return NICHES.map((niche) => ({
      label: niche.label,
      value: niche.value,
      slug: niche.slug,
      description: niche.description,
      icon: CATEGORY_ICONS[niche.value],
      source: "seed" as const,
    }));
  },
  ["all-categories"],
  { tags: ["categories"], revalidate: 3600 }
);

/**
 * Get a single category by its value.
 */
export async function getCategoryByValue(
  value: string
): Promise<CategoryItem | null> {
  const tableName = getTableName();

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: tableName,
        Key: {
          pk: "CATEGORIES",
          sk: `NICHE#${value}`,
        },
      })
    );

    if (!result.Item) return null;

    return {
      label: result.Item.label,
      value: result.Item.value,
      slug: result.Item.slug,
      description: result.Item.description,
      icon: result.Item.icon,
      source: result.Item.source || "seed",
    };
  } catch (error) {
    console.error(`Error fetching category ${value}:`, error);
    return null;
  }
}

/**
 * Insert or update a category in DynamoDB.
 */
export async function upsertCategory(category: CategoryItem): Promise<void> {
  const tableName = getTableName();
  const now = new Date().toISOString();

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        pk: "CATEGORIES",
        sk: `NICHE#${category.value}`,
        entityType: "CATEGORY",
        label: category.label,
        value: category.value,
        slug: category.slug,
        description: category.description,
        icon: category.icon || CATEGORY_ICONS[category.value],
        source: category.source,
        updatedAt: now,
      },
    })
  );
}

/**
 * Get category stats - each category with a real creator count from GSI2.
 * Cached with a shorter TTL (5 minutes).
 */
export const getCategoryStats = unstable_cache(
  async (): Promise<CategoryWithStats[]> => {
    const categories = await getAllCategories();
    const tableName = getTableName();

    const statsPromises = categories.map(async (category) => {
      try {
        const result = await docClient.send(
          new QueryCommand({
            TableName: tableName,
            IndexName: "GSI2",
            KeyConditionExpression: "gsi2pk = :pk",
            ExpressionAttributeValues: {
              ":pk": `CATEGORY#${category.value}`,
            },
            Select: "COUNT",
          })
        );

        return {
          ...category,
          creatorCount: result.Count || 0,
        };
      } catch (error) {
        console.error(
          `Error fetching stats for category ${category.value}:`,
          error
        );
        return {
          ...category,
          creatorCount: 0,
        };
      }
    });

    const results = await Promise.all(statsPromises);

    // Sort by creator count descending
    return results.sort((a, b) => b.creatorCount - a.creatorCount);
  },
  ["category-stats"],
  { tags: ["category-stats"], revalidate: 300 }
);

/**
 * Seed the CATEGORIES table from the static NICHES taxonomy.
 * Idempotent - safe to run multiple times.
 */
export async function seedCategories(): Promise<{
  success: boolean;
  message: string;
  seeded: number;
}> {
  let seeded = 0;

  try {
    for (const niche of NICHES) {
      const category: CategoryItem = {
        label: niche.label,
        value: niche.value,
        slug: niche.slug,
        description: niche.description,
        icon: CATEGORY_ICONS[niche.value],
        source: "seed",
      };

      await upsertCategory(category);
      seeded++;
    }

    // Bust caches after seeding
    revalidateTag("categories");
    revalidateTag("category-stats");

    return {
      success: true,
      message: `Seeded ${seeded} categories successfully.`,
      seeded,
    };
  } catch (error) {
    console.error("Error seeding categories:", error);
    return {
      success: false,
      message: "Failed to seed categories.",
      seeded,
    };
  }
}

/**
 * Get aggregated stats across all creators (active + featured).
 * Returns total reach and unique niche count from actual creator data.
 * Cached for 5 minutes.
 */
export const getCreatorAggregates = unstable_cache(
  async (): Promise<{ totalCreators: number; totalReach: number; uniqueNiches: number }> => {
    const tableName = getTableName();
    let totalCreators = 0;
    let totalReach = 0;
    const niches = new Set<string>();

    const collectFromQuery = async (statusKey: string) => {
      let lastKey: Record<string, unknown> | undefined;
      do {
        const result = await docClient.send(
          new QueryCommand({
            TableName: tableName,
            IndexName: "GSI1",
            KeyConditionExpression: "gsi1pk = :pk",
            ExpressionAttributeValues: {
              ":pk": statusKey,
            },
            Select: "ALL_ATTRIBUTES",
            ExclusiveStartKey: lastKey,
          })
        );

        for (const item of result.Items || []) {
          totalCreators++;
          totalReach += (item.metrics as Record<string, number>)?.totalReach || 0;
          if (item.niche) niches.add(item.niche as string);
        }

        lastKey = result.LastEvaluatedKey as Record<string, unknown> | undefined;
      } while (lastKey);
    };

    try {
      await Promise.all([
        collectFromQuery("STATUS#ACTIVE"),
        collectFromQuery("STATUS#FEATURED"),
      ]);
    } catch (error) {
      console.error("Error fetching creator aggregates:", error);
    }

    return { totalCreators, totalReach, uniqueNiches: niches.size };
  },
  ["creator-aggregates"],
  { tags: ["category-stats"], revalidate: 300 }
);

/** @deprecated Use getCreatorAggregates() instead */
export const getTotalReach = unstable_cache(
  async (): Promise<number> => {
    const { totalReach } = await getCreatorAggregates();
    return totalReach;
  },
  ["total-reach"],
  { tags: ["category-stats"], revalidate: 300 }
);

/**
 * Revalidate all category caches.
 * Call this after creator sync, category updates, etc.
 */
export async function revalidateCategories(): Promise<void> {
  revalidateTag("categories");
  revalidateTag("category-stats");
}

/**
 * Create a new category from a YouTube sync detection.
 * Only creates if the niche value doesn't already exist.
 */
export async function ensureCategoryExists(nicheValue: string): Promise<void> {
  const existing = await getCategoryByValue(nicheValue);
  if (existing) return;

  const category: CategoryItem = {
    label: nicheValueToLabel(nicheValue),
    value: nicheValue,
    slug: nicheValueToSlug(nicheValue),
    source: "youtube_sync",
  };

  await upsertCategory(category);
  revalidateTag("categories");
}
