"use server";

/**
 * 263Tube - Featured Carousel Server Actions
 *
 * Manages handpicked creators for the homepage carousel.
 * Settings stored in DynamoDB: PK = SETTINGS#SITE, SK = FEATURED_CAROUSEL
 */

import { revalidatePath } from "next/cache";
import { GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, getCreatorBySlug, type Creator } from "@/lib/creators";
import { requireAdmin } from "@/lib/auth-server";

// ============================================================================
// Types
// ============================================================================

export interface FeaturedCarouselSettings {
  enabled: boolean;
  creatorSlugs: string[];
}

// ============================================================================
// Helpers
// ============================================================================

const getTableName = (): string => {
  const env =
    process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.ENVIRONMENT || "dev";
  return process.env.DYNAMODB_TABLE_NAME || `263tube-${env}`;
};

// ============================================================================
// Public Functions
// ============================================================================

/**
 * Read the featured-carousel settings record.
 * No auth required — called by the homepage on every render.
 */
export async function getFeaturedCarouselSettings(): Promise<FeaturedCarouselSettings> {
  try {
    const response = await docClient.send(
      new GetCommand({
        TableName: getTableName(),
        Key: { pk: "SETTINGS#SITE", sk: "FEATURED_CAROUSEL" },
      })
    );

    if (!response.Item) {
      return { enabled: false, creatorSlugs: [] };
    }

    return {
      enabled: response.Item.enabled ?? false,
      creatorSlugs: response.Item.creatorSlugs ?? [],
    };
  } catch (error) {
    console.error("Error reading featured carousel settings:", error);
    return { enabled: false, creatorSlugs: [] };
  }
}

/**
 * If the handpicked carousel is enabled and has slugs, fetch each creator.
 * Returns Creator[] on success, or null to signal the caller to fall back.
 */
export async function getHandpickedCreators(): Promise<Creator[] | null> {
  try {
    const settings = await getFeaturedCarouselSettings();

    if (!settings.enabled || settings.creatorSlugs.length === 0) {
      return null;
    }

    const results = await Promise.all(
      settings.creatorSlugs.map((slug) => getCreatorBySlug(slug))
    );

    // Filter out deleted/missing creators
    const creators = results.filter((c): c is Creator => c !== null);

    // If every handpicked creator was deleted, fall back
    if (creators.length === 0) {
      return null;
    }

    return creators;
  } catch (error) {
    console.error("Error fetching handpicked creators:", error);
    return null;
  }
}

/**
 * Save the full settings record (admin only).
 */
export async function saveFeaturedCarouselSettings(
  slugs: string[],
  enabled: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();

    const now = new Date().toISOString();

    await docClient.send(
      new PutCommand({
        TableName: getTableName(),
        Item: {
          pk: "SETTINGS#SITE",
          sk: "FEATURED_CAROUSEL",
          enabled,
          creatorSlugs: slugs.slice(0, 10), // enforce max 10
          updatedAt: now,
          entityType: "SETTINGS",
        },
      })
    );

    revalidatePath("/");

    return { success: true, message: "Featured carousel settings saved." };
  } catch (error: any) {
    if (error.message?.includes("UNAUTHORIZED") || error.message?.includes("FORBIDDEN")) {
      return { success: false, message: "Not authorized." };
    }
    console.error("Error saving featured carousel settings:", error);
    return { success: false, message: "Failed to save settings." };
  }
}

/**
 * Toggle only the enabled flag (admin only).
 */
export async function toggleFeaturedCarousel(
  enabled: boolean
): Promise<{ success: boolean; message: string }> {
  try {
    await requireAdmin();

    const now = new Date().toISOString();

    await docClient.send(
      new UpdateCommand({
        TableName: getTableName(),
        Key: { pk: "SETTINGS#SITE", sk: "FEATURED_CAROUSEL" },
        UpdateExpression:
          "SET enabled = :enabled, updatedAt = :now, entityType = if_not_exists(entityType, :et)",
        ExpressionAttributeValues: {
          ":enabled": enabled,
          ":now": now,
          ":et": "SETTINGS",
        },
      })
    );

    revalidatePath("/");

    return {
      success: true,
      message: enabled
        ? "Handpicked carousel enabled."
        : "Handpicked carousel disabled — using default behavior.",
    };
  } catch (error: any) {
    if (error.message?.includes("UNAUTHORIZED") || error.message?.includes("FORBIDDEN")) {
      return { success: false, message: "Not authorized." };
    }
    console.error("Error toggling featured carousel:", error);
    return { success: false, message: "Failed to update setting." };
  }
}
