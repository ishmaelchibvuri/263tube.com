/**
 * 263Tube - Social Handle Sanitizer
 *
 * Sanitizes and formats social media handles/URLs to prevent
 * injection attacks and ensure consistent, clean URLs.
 */

// Platform base URLs for converting handles to full URLs
const PLATFORM_URLS: Record<string, string> = {
  youtube: "https://www.youtube.com/@",
  tiktok: "https://www.tiktok.com/@",
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
  twitter: "https://twitter.com/",
  x: "https://x.com/",
};

// Whitelist regex: only alphanumeric, dots, hyphens, underscores allowed in handles
const SAFE_HANDLE_REGEX = /^[\w][\w.\-]{0,49}$/;

// URL whitelist: only allow known social media domains
const ALLOWED_URL_PATTERNS: Record<string, RegExp> = {
  youtube: /^https?:\/\/(www\.)?youtube\.com\/(channel\/[\w\-]+|c\/[\w\-]+|@[\w.\-]+|user\/[\w\-]+)/i,
  tiktok: /^https?:\/\/(www\.)?(tiktok\.com|vm\.tiktok\.com)\/@?[\w.\-]+/i,
  instagram: /^https?:\/\/(www\.)?instagram\.com\/[\w.\-]+\/?/i,
  facebook: /^https?:\/\/(www\.)?(facebook\.com|fb\.com)\/([\w.\-]+|profile\.php\?id=\d+)/i,
  twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[\w.\-]+\/?/i,
};

/**
 * Sanitize and format a social media handle or URL into a clean, safe URL.
 *
 * @param platform - The social media platform (e.g., "YouTube", "Instagram")
 * @param input - The raw handle (@username) or URL provided by the user
 * @returns A sanitized, fully-qualified URL or null if the input is invalid
 */
export function formatSocialLink(
  platform: string,
  input: string
): string | null {
  if (!input || typeof input !== "string") return null;

  // Step 1: Strip whitespace
  const trimmed = input.trim();
  if (!trimmed) return null;

  const platformKey = platform.toLowerCase();

  // Step 2: If it's already a URL, validate against the platform whitelist
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("://")) {
    const pattern = ALLOWED_URL_PATTERNS[platformKey];
    if (!pattern) return null;

    // Ensure the URL matches the allowed pattern for this platform
    if (!pattern.test(trimmed)) return null;

    // Ensure no script injection or suspicious characters in the URL
    if (hasInjectionRisk(trimmed)) return null;

    return trimmed;
  }

  // Step 3: Handle @-prefixed inputs - strip @ and build URL
  let handle = trimmed;
  if (handle.startsWith("@")) {
    handle = handle.substring(1);
  }

  // Step 4: Validate handle against whitelist regex
  if (!SAFE_HANDLE_REGEX.test(handle)) return null;

  // Step 5: Build the full URL from the clean handle
  const baseUrl = PLATFORM_URLS[platformKey];
  if (!baseUrl) return null;

  return `${baseUrl}${handle}`;
}

/**
 * Check for common injection patterns in a URL string.
 */
function hasInjectionRisk(url: string): boolean {
  const lowered = url.toLowerCase();
  return (
    lowered.includes("javascript:") ||
    lowered.includes("data:") ||
    lowered.includes("<script") ||
    lowered.includes("onerror") ||
    lowered.includes("onload") ||
    lowered.includes("onclick") ||
    lowered.includes("%3cscript") ||
    lowered.includes("&#") ||
    lowered.includes("\\u00")
  );
}

/**
 * Batch sanitize a record of platform links.
 * Returns only the valid, sanitized links.
 */
export function sanitizePlatformLinks(
  links: Record<string, { label: string; url: string }[]>
): Record<string, { label: string; url: string }[]> {
  const sanitized: Record<string, { label: string; url: string }[]> = {};

  for (const [platform, platformLinks] of Object.entries(links)) {
    const cleanLinks: { label: string; url: string }[] = [];

    for (const link of platformLinks) {
      const cleanUrl = formatSocialLink(platform, link.url);
      if (cleanUrl) {
        // Sanitize the label too - strip HTML/scripts
        const cleanLabel = link.label
          .replace(/<[^>]*>/g, "")
          .replace(/[<>"'&]/g, "")
          .trim()
          .substring(0, 100);

        cleanLinks.push({
          label: cleanLabel || "Main Channel",
          url: cleanUrl,
        });
      }
    }

    if (cleanLinks.length > 0) {
      sanitized[platform] = cleanLinks;
    }
  }

  return sanitized;
}
