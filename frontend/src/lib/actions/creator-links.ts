"use server";

/**
 * 263Tube - Creator Platform Links Server Action
 *
 * Fetches a creator's own platform links for portfolio prevention.
 * Used to prevent creators from submitting their own existing channels.
 */

import { getCreatorBySlug } from "@/lib/creators";

export interface CreatorPlatformLink {
  platform: string;
  url: string;
  label: string;
}

/**
 * Get all platform links for a creator by slug.
 * Returns a flat array of { platform, url, label } objects.
 */
export async function getCreatorPlatformLinks(
  creatorSlug: string
): Promise<CreatorPlatformLink[]> {
  if (!creatorSlug) return [];

  try {
    const creator = await getCreatorBySlug(creatorSlug);
    if (!creator) return [];

    const result: CreatorPlatformLink[] = [];

    const platformEntries = Object.entries(creator.platforms) as [
      string,
      { label: string; url: string }[] | undefined,
    ][];

    for (const [platform, links] of platformEntries) {
      if (!links || links.length === 0) continue;
      for (const link of links) {
        if (link.url) {
          result.push({
            platform: platform.charAt(0).toUpperCase() + platform.slice(1),
            url: link.url,
            label: link.label || "Main Channel",
          });
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error fetching creator platform links:", error);
    return [];
  }
}
