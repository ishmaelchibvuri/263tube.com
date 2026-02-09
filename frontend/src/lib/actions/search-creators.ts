"use server";

/**
 * 263Tube - Creator Search Server Actions
 *
 * Thin wrappers around the creators data access layer,
 * returning minimal shapes suitable for client components.
 */

import { searchCreators, getCreatorBySlug, type Creator } from "@/lib/creators";

export interface CreatorSuggestion {
  slug: string;
  name: string;
  niche: string;
  profilePicUrl?: string;
}

/**
 * Search creators for autocomplete suggestions.
 * Returns a minimal shape for the dropdown.
 */
export async function suggestCreators(
  query: string
): Promise<CreatorSuggestion[]> {
  if (!query || query.trim().length < 1) return [];

  try {
    const creators = await searchCreators(query.trim(), 8);
    return creators.map((c) => ({
      slug: c.slug,
      name: c.name,
      niche: c.niche,
      profilePicUrl: c.profilePicUrl,
    }));
  } catch (error) {
    console.error("Error suggesting creators:", error);
    return [];
  }
}

/**
 * Fetch minimal creator info for a list of slugs.
 * Used by the FeaturedCarouselModal to display currently-selected creators.
 */
export async function getCreatorSummariesBySlugs(
  slugs: string[]
): Promise<CreatorSuggestion[]> {
  if (!slugs || slugs.length === 0) return [];

  try {
    const results = await Promise.all(
      slugs.map((slug) => getCreatorBySlug(slug))
    );

    return results
      .filter((c): c is Creator => c !== null)
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        niche: c.niche,
        profilePicUrl: c.profilePicUrl,
      }));
  } catch (error) {
    console.error("Error fetching creator summaries by slugs:", error);
    return [];
  }
}

export interface ClaimCreatorResult {
  slug: string;
  name: string;
  niche: string;
  profilePicUrl?: string;
  verified: boolean;
  claimedBy?: string | null;
  youtubeHandle?: string | null;
}

/**
 * Search creators for the claim page.
 * Returns a minimal shape for display in search results.
 */
export async function searchCreatorsForClaim(
  query: string
): Promise<ClaimCreatorResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const creators = await searchCreators(query.trim(), 20);
    return creators.map((c) => ({
      slug: c.slug,
      name: c.name,
      niche: c.niche,
      profilePicUrl: c.profilePicUrl,
      verified: c.verified,
      claimedBy: c.claimedBy || null,
      youtubeHandle: extractYoutubeIdentifier(c),
    }));
  } catch (error) {
    console.error("Error searching creators for claim:", error);
    return [];
  }
}

/**
 * Get a single creator for the claim page (pre-selected via URL param).
 */
export async function getCreatorForClaim(
  slug: string
): Promise<ClaimCreatorResult | null> {
  if (!slug) return null;

  try {
    const creator = await getCreatorBySlug(slug);
    if (!creator) return null;

    return {
      slug: creator.slug,
      name: creator.name,
      niche: creator.niche,
      profilePicUrl: creator.profilePicUrl,
      verified: creator.verified,
      claimedBy: creator.claimedBy || null,
      youtubeHandle: extractYoutubeIdentifier(creator),
    };
  } catch (error) {
    console.error("Error getting creator for claim:", error);
    return null;
  }
}

/**
 * Extract a YouTube identifier from a creator using all available sources.
 *
 * Sources checked (in order):
 * 1. platforms.youtube[].handle  → "@handle"
 * 2. platforms.youtube[].url     → extract @handle or channel ID from URL
 * 3. verifiedLinks (youtube)     → channelId stored by seed script
 */
function extractYoutubeIdentifier(creator: Creator): string | null {
  // --- Source 1: platforms.youtube ---
  const first = creator.platforms?.youtube?.[0];
  if (first) {
    if (first.handle) return `@${first.handle}`;

    const url = first.url;
    if (url) {
      const handleMatch = url.match(/youtube\.com\/@([^/?]+)/);
      if (handleMatch?.[1]) return `@${handleMatch[1]}`;

      const channelIdMatch = url.match(/youtube\.com\/channel\/([^/?]+)/);
      if (channelIdMatch?.[1]) return channelIdMatch[1];

      return url;
    }
  }

  // --- Source 2: verifiedLinks (youtube) ---
  const ytLink = creator.verifiedLinks?.find(
    (l) => l.platform === "youtube"
  );
  if (ytLink) {
    // channelId (if stored as an extra field by the seed script)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const channelId = (ytLink as any).channelId;
    if (typeof channelId === "string" && channelId) return channelId;

    // Fall back to displayName — resolveChannelId in verify-owner.ts
    // can search YouTube by name to find the channel
    if (ytLink.displayName) return ytLink.displayName;
  }

  return null;
}
