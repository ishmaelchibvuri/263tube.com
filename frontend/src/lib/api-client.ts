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

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    console.error(`Failed to fetch creators: ${res.status}`);
    return [];
  }

  const json: ApiResponse = await res.json();
  return json.data ?? [];
}

/**
 * Fetch featured creators
 */
export async function fetchFeaturedCreators(limit?: number): Promise<Creator[]> {
  const params = limit ? `?limit=${limit}` : "";
  const url = getApiUrl(`creators/featured${params}`);

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    console.error(`Failed to fetch featured creators: ${res.status}`);
    return [];
  }

  const json: ApiResponse = await res.json();
  return json.data ?? [];
}

/**
 * Fetch a single creator by slug
 */
export async function fetchCreatorBySlug(slug: string): Promise<Creator | null> {
  const url = getApiUrl(`creators/${encodeURIComponent(slug)}`);

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
}

/**
 * Fetch top referrers (trending this week)
 */
export async function fetchTopReferrers(limit?: number): Promise<Creator[]> {
  const params = limit ? `?limit=${limit}` : "";
  const url = getApiUrl(`creators/trending${params}`);

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    console.error(`Failed to fetch top referrers: ${res.status}`);
    return [];
  }

  const json: ApiResponse = await res.json();
  return json.data ?? [];
}
