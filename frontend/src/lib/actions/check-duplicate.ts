"use server";

/**
 * 263Tube - Duplicate Link Detection Server Action
 *
 * Checks if a submitted platform link already belongs to an existing creator.
 * Used in the submission form to warn users and suggest claiming instead.
 */

import { getAllCreators, type Creator } from "@/lib/creators";
import { formatSocialLink } from "@/lib/utils/sanitizers";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  creatorSlug?: string;
  creatorName?: string;
}

/**
 * Check if a platform link is already associated with an existing creator.
 * Normalizes both the input URL and stored URLs before comparison.
 */
export async function checkDuplicateLink(
  platform: string,
  url: string
): Promise<DuplicateCheckResult> {
  if (!platform || !url || !url.trim()) {
    return { isDuplicate: false };
  }

  // Normalize the input URL
  const normalizedInput = formatSocialLink(platform, url);
  if (!normalizedInput) {
    return { isDuplicate: false };
  }

  try {
    // Get all active creators
    const creators = await getAllCreators("ACTIVE", 100);

    // Also check featured creators
    const featured = await getAllCreators("FEATURED", 100);
    const allCreators = [...creators, ...featured];

    // Deduplicate by slug
    const seen = new Set<string>();
    const uniqueCreators: Creator[] = [];
    for (const c of allCreators) {
      if (!seen.has(c.slug)) {
        seen.add(c.slug);
        uniqueCreators.push(c);
      }
    }

    const platformKey = platform.toLowerCase() as keyof typeof platformKeyMap;
    const platformKeyMap = {
      youtube: "youtube",
      tiktok: "tiktok",
      instagram: "instagram",
      facebook: "facebook",
      twitter: "twitter",
    } as const;

    const creatorPlatformKey = platformKeyMap[platformKey];
    if (!creatorPlatformKey) {
      return { isDuplicate: false };
    }

    for (const creator of uniqueCreators) {
      const links = creator.platforms[creatorPlatformKey];
      if (!links || links.length === 0) continue;

      for (const link of links) {
        const normalizedStored = formatSocialLink(platform, link.url);
        if (normalizedStored && normalizedStored.toLowerCase() === normalizedInput.toLowerCase()) {
          return {
            isDuplicate: true,
            creatorSlug: creator.slug,
            creatorName: creator.name,
          };
        }
      }
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error("Error checking duplicate link:", error);
    return { isDuplicate: false };
  }
}
