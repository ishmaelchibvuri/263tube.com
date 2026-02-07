"use server";

/**
 * 263Tube - YouTube Data Fetcher
 *
 * Server-side utility to fetch YouTube channel data (totalViews,
 * channelStartDate, videoHighlights) for the creator profile page.
 *
 * Used as a fallback when a creator's DB record doesn't yet have
 * these fields. Results are cached for 24 hours via Next.js fetch.
 */

import type { Creator, VideoHighlight } from "@/lib/creators";

// ============================================================================
// Types
// ============================================================================

export interface YouTubeChannelData {
  channelId: string;
  totalViews: number;
  channelStartDate: string;
  totalVideos: number;
  videoHighlights: VideoHighlight[];
}

// ============================================================================
// Channel ID Extraction
// ============================================================================

/**
 * Extract YouTube channel ID from a creator's platform data or verifiedLinks.
 * Tries multiple sources in priority order.
 */
function extractChannelId(creator: Creator): string | null {
  // 1. Check platforms.youtube for channel URLs with /channel/UC...
  if (creator.platforms.youtube) {
    for (const link of creator.platforms.youtube) {
      const url = link.url;
      if (!url) continue;
      const channelMatch = url.match(/youtube\.com\/channel\/(UC[\w-]+)/);
      if (channelMatch?.[1]) return channelMatch[1];
    }
  }

  // 2. Check verifiedLinks for channelId (stored by enrichment)
  if (creator.verifiedLinks) {
    for (const link of creator.verifiedLinks) {
      if (link.platform.toLowerCase() === "youtube") {
        // Check if channelId is attached (newer records)
        const rec = link as unknown as Record<string, unknown>;
        if (typeof rec.channelId === "string") return rec.channelId;
      }
    }
  }

  return null;
}

/**
 * Extract YouTube handle (@username) from a creator's platform data.
 */
function extractHandle(creator: Creator): string | null {
  if (creator.platforms.youtube) {
    for (const link of creator.platforms.youtube) {
      const url = link.url;
      if (!url) continue;
      const handleMatch = url.match(/youtube\.com\/@([^/?]+)/);
      if (handleMatch?.[1]) return handleMatch[1];
    }
  }
  return null;
}

// ============================================================================
// YouTube API Helpers
// ============================================================================

async function ytApiFetch(url: string): Promise<any | null> {
  try {
    const response = await fetch(url, {
      next: { revalidate: 86400 }, // Cache for 24 hours
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// ============================================================================
// Main Fetch Function
// ============================================================================

/**
 * Fetch YouTube channel data for a creator.
 * Returns null if no YouTube data can be resolved.
 */
export async function fetchYouTubeChannelData(
  creator: Creator
): Promise<YouTubeChannelData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  // Try to resolve channel data
  let channelId = extractChannelId(creator);
  let channelData: any = null;

  if (channelId) {
    channelData = await ytApiFetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${apiKey}`
    );
  }

  // Fallback: lookup by @handle
  if (!channelData?.items?.length) {
    const handle = extractHandle(creator);
    if (handle) {
      channelData = await ytApiFetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${handle}&key=${apiKey}`
      );
    }
  }

  // Fallback: lookup by display name from verifiedLinks
  if (!channelData?.items?.length && creator.verifiedLinks) {
    const ytLink = creator.verifiedLinks.find(
      (l) => l.platform.toLowerCase() === "youtube" && l.displayName
    );
    if (ytLink?.displayName) {
      // Use forHandle with the display name (works when display name = handle)
      const safeName = encodeURIComponent(ytLink.displayName);
      channelData = await ytApiFetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&forHandle=${safeName}&key=${apiKey}`
      );

      // If forHandle fails, try search (more expensive but catches display names)
      if (!channelData?.items?.length) {
        const searchData = await ytApiFetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${safeName}&type=channel&maxResults=1&key=${apiKey}`
        );
        if (searchData?.items?.[0]?.id?.channelId) {
          const resolvedId = searchData.items[0].id.channelId;
          channelData = await ytApiFetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${resolvedId}&key=${apiKey}`
          );
        }
      }
    }
  }

  if (!channelData?.items?.[0]) return null;

  const channel = channelData.items[0];
  const resolvedChannelId: string = channel.id;
  const totalViews = parseInt(channel.statistics?.viewCount) || 0;
  const channelStartDate = channel.snippet?.publishedAt || "";
  const totalVideos = parseInt(channel.statistics?.videoCount) || 0;

  // Fetch video highlights from uploads playlist
  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  let videoHighlights: VideoHighlight[] = [];

  if (uploadsPlaylistId) {
    const plData = await ytApiFetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=10&key=${apiKey}`
    );
    const videoIds: string[] = (plData?.items || []).map(
      (item: any) => item.contentDetails.videoId
    );

    if (videoIds.length > 0) {
      const vData = await ytApiFetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds.join(",")}&key=${apiKey}`
      );

      const mapped: VideoHighlight[] = (vData?.items || []).map((v: any) => ({
        videoId: v.id,
        title: v.snippet.title || "",
        thumbnail:
          v.snippet.thumbnails?.medium?.url ||
          v.snippet.thumbnails?.default?.url ||
          null,
        views: parseInt(v.statistics.viewCount) || 0,
        likes: parseInt(v.statistics.likeCount) || 0,
        publishedAt: v.snippet.publishedAt,
      }));

      // Pick highlights: most viewed, most liked, latest, oldest
      if (mapped.length > 0) {
        const mostViewed = [...mapped].sort((a, b) => b.views - a.views)[0];
        if (mostViewed) videoHighlights.push(mostViewed);

        const mostLiked = [...mapped].sort((a, b) => b.likes - a.likes)[0];
        if (
          mostLiked &&
          mostLiked.videoId !== mostViewed?.videoId
        ) {
          videoHighlights.push(mostLiked);
        }

        const latest = [...mapped].sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )[0];
        if (
          latest &&
          !videoHighlights.some((v) => v.videoId === latest.videoId)
        ) {
          videoHighlights.push(latest);
        }

        const oldest = [...mapped].sort(
          (a, b) =>
            new Date(a.publishedAt).getTime() -
            new Date(b.publishedAt).getTime()
        )[0];
        if (
          oldest &&
          !videoHighlights.some((v) => v.videoId === oldest.videoId)
        ) {
          videoHighlights.push(oldest);
        }
      }
    }
  }

  return {
    channelId: resolvedChannelId,
    totalViews,
    channelStartDate,
    totalVideos,
    videoHighlights,
  };
}
