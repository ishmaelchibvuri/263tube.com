/**
 * API Client for 263Tube Frontend
 *
 * Fetches data from the CDK API Gateway instead of querying DynamoDB directly.
 * This allows Server Component pages to be prerendered during build
 * without needing AWS credentials.
 */

import { getApiUrl } from "@/lib/config";
import type { Creator } from "@/lib/creators";

interface ApiResponse {
  success: boolean;
  data: Creator[];
  count: number;
}

/**
 * Fetch all active creators
 */
export async function fetchAllCreators(limit?: number): Promise<Creator[]> {
  const params = limit ? `?limit=${limit}` : "";
  const url = getApiUrl(`creators${params}`);

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`Failed to fetch creators: ${res.status}`);
      return [];
    }

    const json: ApiResponse = await res.json();
    return json.data ?? [];
  } catch (error) {
    console.error(`Network error fetching creators from ${url}:`, error);
    return [];
  }
}

/**
 * Fetch featured creators
 */
export async function fetchFeaturedCreators(limit?: number): Promise<Creator[]> {
  const params = limit ? `?limit=${limit}` : "";
  const url = getApiUrl(`creators/featured${params}`);

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`Failed to fetch featured creators: ${res.status}`);
      return [];
    }

    const json: ApiResponse = await res.json();
    return json.data ?? [];
  } catch (error) {
    console.error(`Network error fetching featured creators from ${url}:`, error);
    return [];
  }
}

/**
 * Fetch a single creator by slug
 */
export async function fetchCreatorBySlug(slug: string): Promise<Creator | null> {
  const url = getApiUrl(`creators/${encodeURIComponent(slug)}`);

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (res.status === 404) {
      return null;
    }

    if (!res.ok) {
      console.error(`Failed to fetch creator ${slug}: ${res.status}`);
      return null;
    }

    const json = await res.json();
    return json.data ?? null;
  } catch (error) {
    console.error(`Network error fetching creator ${slug} from ${url}:`, error);
    return null;
  }
}

/**
 * Fetch most engaging creators (engagement score >= threshold)
 */
export async function fetchMostEngaging(
  minEngagement = 7.5,
  limit = 50,
): Promise<Creator[]> {
  const params = `?minEngagement=${minEngagement}&limit=${limit}`;
  const url = getApiUrl(`creators${params}`);

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`Failed to fetch most engaging: ${res.status}`);
      return [];
    }

    const json: ApiResponse = await res.json();
    return json.data ?? [];
  } catch (error) {
    console.error(`Network error fetching most engaging from ${url}:`, error);
    return [];
  }
}

/**
 * Fetch hidden gem creators (small reach, high engagement)
 */
export async function fetchHiddenGems(
  minReach = 100,
  maxReach = 10_000,
  limit = 50,
): Promise<Creator[]> {
  const params = `?minReach=${minReach}&maxReach=${maxReach}&limit=${limit}`;
  const url = getApiUrl(`creators${params}`);

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`Failed to fetch hidden gems: ${res.status}`);
      return [];
    }

    const json: ApiResponse = await res.json();
    return json.data ?? [];
  } catch (error) {
    console.error(`Network error fetching hidden gems from ${url}:`, error);
    return [];
  }
}

/**
 * Fetch top referrers (trending this week)
 */
export async function fetchTopReferrers(limit?: number): Promise<Creator[]> {
  const params = limit ? `?limit=${limit}` : "";
  const url = getApiUrl(`creators/trending${params}`);

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      console.error(`Failed to fetch top referrers: ${res.status}`);
      return [];
    }

    const json: ApiResponse = await res.json();
    return json.data ?? [];
  } catch (error) {
    console.error(`Network error fetching top referrers from ${url}:`, error);
    return [];
  }
}
