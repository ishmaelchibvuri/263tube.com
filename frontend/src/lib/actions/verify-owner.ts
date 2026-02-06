"use server";

/**
 * 263Tube - Channel Ownership Verification
 *
 * Verifies that a user owns a YouTube channel by checking if their
 * email address appears in the channel's description.
 *
 * MVP Strategy:
 * - If email is found in description → isVerified: true
 * - If email is NOT found → allow submission but flag as "High Risk / Manual Review Needed"
 */

// ============================================================================
// Types
// ============================================================================

export interface OwnershipVerificationResult {
  isVerified: boolean;
  channelTitle: string | null;
  channelId: string | null;
  riskLevel: "verified" | "unverified" | "suspicious";
  emailFound: string | null;
  emailChecked: string | null;
  message: string;
}

// ============================================================================
// Main Verification Function
// ============================================================================

/**
 * Verify channel ownership by checking if the user's email appears
 * in the YouTube channel description.
 *
 * @param channelId - YouTube channel ID (e.g., "UC...") or handle (e.g., "@263tube")
 * @param userEmail - The email address to look for in the channel description
 * @returns OwnershipVerificationResult with verification status and risk level
 */
export async function verifyChannelOwnership(
  channelId: string,
  userEmail: string
): Promise<OwnershipVerificationResult> {
  const checkedEmail = userEmail?.trim().toLowerCase() || null;

  if (!channelId || !channelId.trim()) {
    return {
      isVerified: false,
      channelTitle: null,
      channelId: null,
      riskLevel: "suspicious",
      emailFound: null,
      emailChecked: checkedEmail,
      message: "Channel ID is required.",
    };
  }

  if (!userEmail || !userEmail.trim()) {
    return {
      isVerified: false,
      channelTitle: null,
      channelId: null,
      riskLevel: "suspicious",
      emailFound: null,
      emailChecked: null,
      message: "Email address is required.",
    };
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY not set - ownership verification disabled");
    return {
      isVerified: false,
      channelTitle: null,
      channelId: null,
      riskLevel: "unverified",
      emailFound: null,
      emailChecked: checkedEmail,
      message: "Ownership verification is temporarily unavailable.",
    };
  }

  try {
    // Resolve the channel - handle both channel IDs and @handles
    const resolvedChannelId = await resolveChannelId(channelId.trim(), apiKey);

    if (!resolvedChannelId) {
      return {
        isVerified: false,
        channelTitle: null,
        channelId: null,
        riskLevel: "suspicious",
        emailFound: null,
        emailChecked: checkedEmail,
        message: "YouTube channel not found. Please check the channel ID or handle.",
      };
    }

    // Fetch channel details including description
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,topicDetails&id=${resolvedChannelId}&key=${apiKey}`;
    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("YouTube API error:", response.status);
      return {
        isVerified: false,
        channelTitle: null,
        channelId: resolvedChannelId,
        riskLevel: "suspicious",
        emailFound: null,
        emailChecked: checkedEmail,
        message: response.status === 403
          ? "YouTube API quota exceeded. Please try again later."
          : "Failed to fetch channel details. Please try again.",
      };
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return {
        isVerified: false,
        channelTitle: null,
        channelId: resolvedChannelId,
        riskLevel: "suspicious",
        emailFound: null,
        emailChecked: checkedEmail,
        message: "Channel not found.",
      };
    }

    const channel = data.items[0];
    const channelTitle = channel.snippet?.title || null;
    const description = channel.snippet?.description || "";

    // Check if the user's email appears in the channel description (case-insensitive)
    const normalizedEmail = checkedEmail!;
    const normalizedDescription = description.toLowerCase();
    const emailMatch = normalizedDescription.includes(normalizedEmail);

    // Try to extract any email from the description for reference
    const emailRegex = /[\w.+-]+@[\w-]+\.[\w.]+/g;
    const foundEmails = description.match(emailRegex);
    const emailFoundInDesc = foundEmails?.[0] || null;

    if (emailMatch) {
      return {
        isVerified: true,
        channelTitle,
        channelId: resolvedChannelId,
        riskLevel: "verified",
        emailFound: normalizedEmail,
        emailChecked: checkedEmail,
        message: "Ownership verified! Your email was found in the channel description.",
      };
    }

    // Email not found - channel reachable but unverified
    return {
      isVerified: false,
      channelTitle,
      channelId: resolvedChannelId,
      riskLevel: "unverified",
      emailFound: emailFoundInDesc,
      emailChecked: checkedEmail,
      message:
        "Email not found in channel description. Your claim will be submitted for manual review.",
    };
  } catch (error: any) {
    console.error("Channel ownership verification error:", error);

    if (error.name === "AbortError") {
      return {
        isVerified: false,
        channelTitle: null,
        channelId: null,
        riskLevel: "suspicious",
        emailFound: null,
        emailChecked: checkedEmail,
        message: "Request timed out. Please try again.",
      };
    }

    return {
      isVerified: false,
      channelTitle: null,
      channelId: null,
      riskLevel: "suspicious",
      emailFound: null,
      emailChecked: checkedEmail,
      message: "Verification failed. Please try again.",
    };
  }
}

// ============================================================================
// Code-Based Verification (for Claim flow)
// ============================================================================

export interface CodeVerificationResult {
  isVerified: boolean;
  channelTitle: string | null;
  channelId: string | null;
  message: string;
}

/**
 * Verify channel ownership by checking if a unique verification code
 * appears in the YouTube channel description.
 *
 * The user is given a code (e.g., "263tube-verify-a1b2c3d4") and asked
 * to temporarily add it to their channel description. This function
 * fetches the description and checks for the code.
 *
 * @param channelHandle - YouTube handle (e.g., "@263tube") or URL
 * @param verificationCode - The unique code to look for in the description
 */
export async function verifyChannelWithCode(
  channelHandle: string,
  verificationCode: string
): Promise<CodeVerificationResult> {
  if (!channelHandle || !channelHandle.trim()) {
    return {
      isVerified: false,
      channelTitle: null,
      channelId: null,
      message: "YouTube channel is required.",
    };
  }

  if (!verificationCode || !verificationCode.trim()) {
    return {
      isVerified: false,
      channelTitle: null,
      channelId: null,
      message: "Verification code is required.",
    };
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY not set - code verification disabled");
    return {
      isVerified: false,
      channelTitle: null,
      channelId: null,
      message: "Verification is temporarily unavailable. Please try again later.",
    };
  }

  try {
    const resolvedChannelId = await resolveChannelId(channelHandle.trim(), apiKey);

    if (!resolvedChannelId) {
      return {
        isVerified: false,
        channelTitle: null,
        channelId: null,
        message: "YouTube channel not found. Please check the channel handle.",
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const apiUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${resolvedChannelId}&key=${apiKey}`;
    const response = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        isVerified: false,
        channelTitle: null,
        channelId: resolvedChannelId,
        message: response.status === 403
          ? "YouTube API quota exceeded. Please try again later."
          : "Failed to fetch channel details. Please try again.",
      };
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return {
        isVerified: false,
        channelTitle: null,
        channelId: resolvedChannelId,
        message: "Channel not found.",
      };
    }

    const channel = data.items[0];
    const channelTitle = channel.snippet?.title || null;
    const description: string = channel.snippet?.description || "";

    // Check if the verification code appears in the description (case-insensitive)
    const codeFound = description.toLowerCase().includes(verificationCode.toLowerCase());

    if (codeFound) {
      return {
        isVerified: true,
        channelTitle,
        channelId: resolvedChannelId,
        message: "Ownership verified! Verification code found in channel description.",
      };
    }

    return {
      isVerified: false,
      channelTitle,
      channelId: resolvedChannelId,
      message: "Verification code not found in channel description. Please add the code and try again.",
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        isVerified: false,
        channelTitle: null,
        channelId: null,
        message: "Request timed out. Please try again.",
      };
    }

    console.error("Code verification error:", error);
    return {
      isVerified: false,
      channelTitle: null,
      channelId: null,
      message: "Verification failed. Please try again.",
    };
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Resolve a YouTube handle or URL to a channel ID.
 */
async function resolveChannelId(
  input: string,
  apiKey: string
): Promise<string | null> {
  // Already a channel ID (starts with UC)
  if (input.startsWith("UC") && input.length >= 24) {
    return input;
  }

  // Strip @ prefix if present
  let handle = input;
  if (handle.startsWith("@")) {
    handle = handle.substring(1);
  }

  // Extract handle from URL
  const urlMatch = input.match(
    /youtube\.com\/(channel\/([^/?]+)|c\/([^/?]+)|@([^/?]+)|user\/([^/?]+))/
  );
  if (urlMatch) {
    if (urlMatch[2]) return urlMatch[2]; // Direct channel ID from URL
    handle = urlMatch[4] || urlMatch[3] || urlMatch[5] || handle;
  }

  // Search for the channel by handle
  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(handle)}&type=channel&maxResults=1&key=${apiKey}`;
    const response = await fetch(searchUrl);

    if (!response.ok) return null;

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].id?.channelId || null;
    }
  } catch {
    // Fall through
  }

  return null;
}
