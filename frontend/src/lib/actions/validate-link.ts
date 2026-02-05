"use server";

/**
 * 263Tube - Platform Link Validation Server Action
 *
 * Validates social media links by:
 * - YouTube: YouTube Data API for subscriber count and thumbnail
 * - Other platforms: OpenGraph/OEmbed scraping for profile verification
 *
 * Includes rate limiting to prevent IP blocks from platforms.
 */

// ============================================================================
// Types
// ============================================================================

export interface ValidationResult {
  success: boolean;
  platform: string;
  displayName: string | null;
  image: string | null;
  followers: number | null;
  error?: string;
}

export interface PlatformValidationRequest {
  platform: string;
  handleOrUrl: string;
}

// ============================================================================
// Rate Limiting
// ============================================================================

// Simple in-memory rate limiter (per-server instance)
// In production, consider using Redis for distributed rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // 10 requests per minute per IP/platform combo

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  entry.count++;
  return true;
}

// ============================================================================
// URL Normalization
// ============================================================================

function normalizeYouTubeUrl(handleOrUrl: string): string {
  // Handle @username format
  if (handleOrUrl.startsWith("@")) {
    return `https://www.youtube.com/${handleOrUrl}`;
  }

  // Handle full URLs
  if (handleOrUrl.includes("youtube.com") || handleOrUrl.includes("youtu.be")) {
    return handleOrUrl;
  }

  // Assume it's a channel handle or ID
  if (handleOrUrl.startsWith("UC") && handleOrUrl.length >= 24) {
    return `https://www.youtube.com/channel/${handleOrUrl}`;
  }

  return `https://www.youtube.com/@${handleOrUrl}`;
}

function normalizeInstagramUrl(handleOrUrl: string): string {
  const handle = handleOrUrl
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
  return `https://www.instagram.com/${handle}/`;
}

function normalizeTikTokUrl(handleOrUrl: string): string {
  const handle = handleOrUrl
    .replace(/^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/@?/i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
  return `https://www.tiktok.com/@${handle}`;
}

function normalizeTwitterUrl(handleOrUrl: string): string {
  const handle = handleOrUrl
    .replace(/^https?:\/\/(www\.)?(twitter\.com|x\.com)\//i, "")
    .replace(/^@/, "")
    .replace(/\/$/, "");
  return `https://twitter.com/${handle}`;
}

function normalizeFacebookUrl(handleOrUrl: string): string {
  if (handleOrUrl.includes("facebook.com")) {
    return handleOrUrl;
  }
  const handle = handleOrUrl.replace(/^@/, "");
  return `https://www.facebook.com/${handle}`;
}

// ============================================================================
// Platform-Specific Validators
// ============================================================================

/**
 * Validate YouTube channel using YouTube Data API
 */
async function validateYouTube(handleOrUrl: string): Promise<ValidationResult> {
  const url = normalizeYouTubeUrl(handleOrUrl);
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY not set - YouTube verification disabled");
    return {
      success: false,
      platform: "YouTube",
      displayName: null,
      image: null,
      followers: null,
      error: "YouTube verification is temporarily unavailable. Please try again later.",
    };
  }

  try {
    // Extract channel handle or ID from URL
    const channelMatch = url.match(
      /youtube\.com\/(channel\/([^/?]+)|c\/([^/?]+)|@([^/?]+)|user\/([^/?]+))/
    );

    if (!channelMatch) {
      return validateViaOpenGraph(url, "YouTube");
    }

    const channelId = channelMatch[2]; // Direct channel ID
    const handle = channelMatch[4] || channelMatch[3] || channelMatch[5];

    let apiUrl: string;

    if (channelId) {
      apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
    } else if (handle) {
      // Need to search for the channel by handle
      apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${handle}&type=channel&key=${apiKey}`;
    } else {
      return {
        success: false,
        platform: "YouTube",
        displayName: null,
        image: null,
        followers: null,
        error: "Could not extract channel ID from URL. Please use a valid YouTube channel URL.",
      };
    }

    // Add timeout for API call
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("YouTube API error:", response.status, errorText);
      return {
        success: false,
        platform: "YouTube",
        displayName: null,
        image: null,
        followers: null,
        error: response.status === 403
          ? "YouTube API quota exceeded. Please try again later."
          : `YouTube API error (${response.status}). Please try again.`,
      };
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        platform: "YouTube",
        displayName: null,
        image: null,
        followers: null,
        error: "Channel not found",
      };
    }

    const channel = data.items[0];

    // If we got search results, we need to fetch full channel data
    if (!channel.statistics) {
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channel.id.channelId}&key=${apiKey}`
      );
      const channelData = await channelResponse.json();

      if (channelData.items && channelData.items.length > 0) {
        const fullChannel = channelData.items[0];
        return {
          success: true,
          platform: "YouTube",
          displayName: fullChannel.snippet.title,
          image: fullChannel.snippet.thumbnails?.high?.url ||
            fullChannel.snippet.thumbnails?.default?.url ||
            null,
          followers: parseInt(fullChannel.statistics.subscriberCount) || null,
        };
      }
    }

    return {
      success: true,
      platform: "YouTube",
      displayName: channel.snippet.title,
      image: channel.snippet.thumbnails?.high?.url ||
        channel.snippet.thumbnails?.default?.url ||
        null,
      followers: channel.statistics
        ? parseInt(channel.statistics.subscriberCount) || null
        : null,
    };
  } catch (error: any) {
    console.error("YouTube validation error:", error);
    if (error.name === "AbortError") {
      return {
        success: false,
        platform: "YouTube",
        displayName: null,
        image: null,
        followers: null,
        error: "Request timed out. Please try again.",
      };
    }
    return {
      success: false,
      platform: "YouTube",
      displayName: null,
      image: null,
      followers: null,
      error: "Failed to verify YouTube channel. Please check the URL and try again.",
    };
  }
}

/**
 * Extract meta tag content using regex (lightweight alternative to DOM parsing)
 */
function extractMetaContent(html: string, property: string): string | null {
  // Try property attribute (OpenGraph)
  const propertyRegex = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const propertyMatch = html.match(propertyRegex);
  if (propertyMatch?.[1]) return propertyMatch[1];

  // Try content before property
  const reverseRegex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
    "i"
  );
  const reverseMatch = html.match(reverseRegex);
  if (reverseMatch?.[1]) return reverseMatch[1];

  // Try name attribute (Twitter cards)
  const nameRegex = new RegExp(
    `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const nameMatch = html.match(nameRegex);
  if (nameMatch?.[1]) return nameMatch[1];

  return null;
}

/**
 * Extract title tag content
 */
function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch?.[1]?.trim() ?? null;
}

/**
 * Generic OpenGraph/meta tag scraper for profile validation
 */
async function validateViaOpenGraph(
  url: string,
  platform: string
): Promise<ValidationResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; 263TubeBot/1.0; +https://263tube.com)",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        platform,
        displayName: null,
        image: null,
        followers: null,
        error: `Profile not found (${response.status})`,
      };
    }

    const html = await response.text();

    // Extract OpenGraph tags using regex
    const ogTitle: string | null =
      extractMetaContent(html, "og:title") ??
      extractMetaContent(html, "twitter:title") ??
      extractTitle(html) ??
      null;

    const ogImage: string | null =
      extractMetaContent(html, "og:image") ??
      extractMetaContent(html, "twitter:image") ??
      null;

    // Try to extract follower count from meta tags or structured data
    const ogDescription: string = extractMetaContent(html, "og:description") ?? "";

    let followers: number | null = null;

    // Try to parse followers from description (common pattern)
    const followerMatch = ogDescription.match(
      /(\d+(?:\.\d+)?[KkMm]?)\s*(?:followers?|subscribers?)/i
    );
    if (followerMatch?.[1]) {
      followers = parseFollowerCount(followerMatch[1]);
    }

    // Clean up the display name
    let displayName = ogTitle;
    if (displayName) {
      // Decode HTML entities
      displayName = displayName
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

      // Remove platform suffixes
      displayName = displayName
        .replace(/\s*[-|]\s*(Instagram|TikTok|X|Twitter|Facebook|YouTube).*$/i, "")
        .replace(/\(@[^)]+\)$/, "")
        .trim();
    }

    return {
      success: true,
      platform,
      displayName,
      image: ogImage,
      followers,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        success: false,
        platform,
        displayName: null,
        image: null,
        followers: null,
        error: "Request timed out",
      };
    }

    console.error(`OpenGraph validation error for ${platform}:`, error);
    return {
      success: false,
      platform,
      displayName: null,
      image: null,
      followers: null,
      error: "Failed to fetch profile",
    };
  }
}

/**
 * Parse follower count strings like "1.2M", "500K", "1234"
 */
function parseFollowerCount(value: string): number | null {
  if (!value) return null;

  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return null;

  const suffix = value.slice(-1).toUpperCase();
  if (suffix === "M") return Math.round(num * 1000000);
  if (suffix === "K") return Math.round(num * 1000);

  return Math.round(num);
}

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate a platform link and return profile information
 *
 * @param platform - The social media platform (YouTube, Instagram, TikTok, Twitter, Facebook)
 * @param handleOrUrl - The username/handle or full URL
 * @returns ValidationResult with success status, display name, image, and followers
 */
export async function validatePlatformLink(
  platform: string,
  handleOrUrl: string
): Promise<ValidationResult> {
  if (!handleOrUrl || handleOrUrl.trim().length === 0) {
    return {
      success: false,
      platform,
      displayName: null,
      image: null,
      followers: null,
      error: "URL or handle is required",
    };
  }

  // Rate limiting check
  const rateLimitKey = `validate:${platform}`;
  if (!checkRateLimit(rateLimitKey)) {
    return {
      success: false,
      platform,
      displayName: null,
      image: null,
      followers: null,
      error: "Rate limit exceeded. Please wait a moment and try again.",
    };
  }

  const normalizedPlatform = platform.toLowerCase();

  try {
    switch (normalizedPlatform) {
      case "youtube":
        return await validateYouTube(handleOrUrl.trim());

      case "instagram": {
        const url = normalizeInstagramUrl(handleOrUrl.trim());
        return await validateViaOpenGraph(url, "Instagram");
      }

      case "tiktok": {
        const url = normalizeTikTokUrl(handleOrUrl.trim());
        return await validateViaOpenGraph(url, "TikTok");
      }

      case "twitter":
      case "x": {
        const url = normalizeTwitterUrl(handleOrUrl.trim());
        return await validateViaOpenGraph(url, "Twitter");
      }

      case "facebook": {
        const url = normalizeFacebookUrl(handleOrUrl.trim());
        return await validateViaOpenGraph(url, "Facebook");
      }

      default:
        return {
          success: false,
          platform,
          displayName: null,
          image: null,
          followers: null,
          error: `Unsupported platform: ${platform}`,
        };
    }
  } catch (error) {
    console.error(`Validation error for ${platform}:`, error);
    return {
      success: false,
      platform,
      displayName: null,
      image: null,
      followers: null,
      error: "Validation failed. Please try again.",
    };
  }
}

/**
 * Batch validate multiple platform links
 */
export async function validatePlatformLinks(
  links: PlatformValidationRequest[]
): Promise<ValidationResult[]> {
  // Validate sequentially to respect rate limits
  const results: ValidationResult[] = [];

  for (const link of links) {
    const result = await validatePlatformLink(link.platform, link.handleOrUrl);
    results.push(result);

    // Small delay between requests to be respectful to platforms
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return results;
}
