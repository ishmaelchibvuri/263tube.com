"use server";

/**
 * 263Tube - Creator Search Server Actions
 *
 * Thin wrappers around the creators data access layer,
 * returning minimal shapes suitable for client components.
 */

import { searchCreators, getCreatorBySlug, type CreatorPlatforms } from "@/lib/creators";

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
      youtubeHandle: extractYoutubeHandle(c.platforms),
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
      youtubeHandle: extractYoutubeHandle(creator.platforms),
    };
  } catch (error) {
    console.error("Error getting creator for claim:", error);
    return null;
  }
}

/**
 * Extract the first YouTube handle/URL from creator platforms data.
 */
function extractYoutubeHandle(
  platforms: CreatorPlatforms | undefined
): string | null {
  const first = platforms?.youtube?.[0];
  if (!first) return null;
  return first.handle ? `@${first.handle}` : first.url || null;
}
